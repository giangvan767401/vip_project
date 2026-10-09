import os
import numpy as np
import cv2
import tensorflow as tf
from keras.models import load_model

# 📂 Danh sách nhãn cảm xúc
emotion_labels = ["Angry", "Disgust", "Fear", "Happy", "Neutral", "Sad", "Surprise"]

# ✅ CBAM Block dùng khi load model
@tf.keras.utils.register_keras_serializable()
class CBAMBlock(tf.keras.layers.Layer):
    def __init__(self, filters, reduction_ratio=8, **kwargs):
        super().__init__(**kwargs)
        self.avg_pool = tf.keras.layers.GlobalAveragePooling2D()
        self.max_pool = tf.keras.layers.GlobalMaxPooling2D()
        self.dense1 = tf.keras.layers.Dense(filters // reduction_ratio, activation='relu')
        self.dense2 = tf.keras.layers.Dense(filters)
        self.conv_spatial = tf.keras.layers.Conv2D(1, kernel_size=7, padding='same', activation='sigmoid')

    def call(self, inputs):
        avg_out = self.dense2(self.dense1(self.avg_pool(inputs)))
        max_out = self.dense2(self.dense1(self.max_pool(inputs)))
        scale = tf.nn.sigmoid(avg_out + max_out)
        scale = tf.reshape(scale, [-1, 1, 1, inputs.shape[-1]])
        x = inputs * scale

        avg_pool = tf.reduce_mean(x, axis=-1, keepdims=True)
        max_pool = tf.reduce_max(x, axis=-1, keepdims=True)
        concat = tf.concat([avg_pool, max_pool], axis=-1)
        spatial_attention = self.conv_spatial(concat)
        return x * spatial_attention

# ✅ Focal Loss wrapper class (phải tương đồng khi load)
@tf.keras.utils.register_keras_serializable()
class FocalLoss(tf.keras.losses.Loss):
    def __init__(self, gamma=2.0, alpha=0.25, **kwargs):
        super().__init__(**kwargs)
        self.gamma = gamma
        self.alpha = alpha

    def call(self, y_true, y_pred):
        y_true = tf.cast(y_true, tf.int32)
        y_true_one_hot = tf.one_hot(y_true, depth=7)
        ce = tf.keras.losses.categorical_crossentropy(y_true_one_hot, y_pred)
        p_t = tf.reduce_sum(y_true_one_hot * y_pred, axis=-1)
        return self.alpha * tf.pow(1. - p_t, self.gamma) * ce

# 🗂️ Load model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "../../model/emotion_model1.keras")

if not os.path.exists(MODEL_PATH):
    raise FileNotFoundError(f"\u274c Không tìm thấy mô hình tại: {MODEL_PATH}")

model = load_model(
    MODEL_PATH,
    custom_objects={"CBAMBlock": CBAMBlock, "FocalLoss": FocalLoss}
)
print("\u2705 Mô hình đã được load thành công!")

# 🔍 Dự đoán cảm xúc từ ảnh màu BGR (chuyển xám trước khi dự đoán)
def predict_emotion(img_bgr):
    if img_bgr is None or img_bgr.size == 0:
        return -1, "Invalid", None, None

    try:
        img_resized = cv2.resize(img_bgr, (48, 48))
        img_gray = cv2.cvtColor(img_resized, cv2.COLOR_BGR2GRAY)

        img_input = img_gray.astype("float32") 
        img_input = img_input.reshape(1, 48, 48, 1)

        prediction = model.predict(img_input, verbose=0)                          #đầu ra vector
        pred_index = int(np.argmax(prediction[0]))
        emotion = emotion_labels[pred_index]
        return pred_index, emotion, img_gray, prediction[0]

    except Exception as e:
        print("\u274c predict_emotion error:", e)
        return -1, "Error", None, None

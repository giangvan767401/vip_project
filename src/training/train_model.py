import tensorflow as tf
import matplotlib.pyplot as plt
import numpy as np
import os
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
from tensorflow.keras import layers, models
from tensorflow.keras.utils import register_keras_serializable
from google.colab import files

# ====== 📁 Bước 0: Đường dẫn dữ liệu ======
data_path = "/content/fer2013"
train_path = os.path.join(data_path, "train")
test_path = os.path.join(data_path, "test")
AUTOTUNE = tf.data.AUTOTUNE
BATCH_SIZE = 32
IMG_SIZE = (48, 48)

# ====== 🔄 Bước 1: Load & Oversample dữ liệu train ======
def load_and_oversample(train_path):
    ds = tf.keras.preprocessing.image_dataset_from_directory(
        train_path,
        image_size=IMG_SIZE,
        color_mode="grayscale",
        label_mode="int",
        batch_size=None,
        shuffle=True,
        seed=123
    )
    images, labels = [], []
    for img, label in ds:
        images.append(img)            #3 chieu
        labels.append(label)
    images = tf.stack(images)         #4 chieu
    labels = tf.stack(labels)

    unique_classes, _, counts = tf.unique_with_counts(labels)
    max_count = tf.reduce_max(counts)

    oversampled_images, oversampled_labels = [], []
    for c in unique_classes:
        class_mask = tf.where(labels == c)
        class_imgs = tf.gather(images, class_mask[:, 0])
        repeat_factor = max_count // class_imgs.shape[0]
        oversampled_images.append(tf.repeat(class_imgs, repeat_factor, axis=0))
        oversampled_labels.append(tf.repeat([c], repeat_factor * class_imgs.shape[0]))

    x = tf.concat(oversampled_images, axis=0)                                                      #gộp 7 tensor
    y = tf.concat(oversampled_labels, axis=0)
    ds_final = tf.data.Dataset.from_tensor_slices((x, y))
    return ds_final.shuffle(10000).batch(BATCH_SIZE).prefetch(AUTOTUNE)

# ====== 🧲 Bước 2: Load val/test ======
val_ds = tf.keras.preprocessing.image_dataset_from_directory(
    train_path,
    validation_split=0.2,
    subset="validation",
    seed=123,
    image_size=IMG_SIZE,
    color_mode="grayscale",
    label_mode="int",
    batch_size=BATCH_SIZE
).prefetch(AUTOTUNE)

test_ds = tf.keras.preprocessing.image_dataset_from_directory(
    test_path,
    image_size=IMG_SIZE,
    color_mode="grayscale",
    label_mode="int",
    batch_size=BATCH_SIZE
).prefetch(AUTOTUNE)

train_ds = load_and_oversample(train_path)

# ====== 🎯 Bước 3: Focal Loss ======                                          #giảm ts mẫu dễ, tăng ts mẫu khó
@register_keras_serializable()
class FocalLoss(tf.keras.losses.Loss):
    def __init__(self, gamma=2.0, alpha=0.25, **kwargs):                         #g bỏ qua ảnh dễ, học những ảnh sai, nhầm. a: tăng ts ít giảm ts nhiều
        super().__init__(**kwargs)                                              #truyền thêm tham số mà tf.keras cần
        self.gamma = gamma                                                       # lưu gtri
        self.alpha = alpha

    def call(self, y_true, y_pred):
        y_true = tf.cast(y_true, tf.int32)                                          #đảm bảo nhãn thật có kiểu int
        y_true_one_hot = tf.one_hot(y_true, depth=7)                                 #Chuyển nhãn thành one-hot vector. y = 3 -> [0, 0, 0, 1, 0, 0, 0]
        ce = tf.keras.losses.categorical_crossentropy(y_true_one_hot, y_pred)        # tính mất mát gốc: độ sai dự đoán và nhãn thật
        p_t = tf.reduce_sum(y_true_one_hot * y_pred, axis=-1)                        # tính xác xuất dự đoán đúng
        return self.alpha * tf.pow(1. - p_t, self.gamma) * ce                         #ct, pt cao-> dễ, pt thấp -> sai

# ====== 👁️ Bước 4: CBAM Block ======
@register_keras_serializable()
class CBAMBlock(tf.keras.layers.Layer):
    def __init__(self, filters, reduction_ratio=8):                                                #reduction_ratio=8 nén tạm thời số chiều
        super().__init__()
        self.avg_pool = layers.GlobalAveragePooling2D()
        self.max_pool = layers.GlobalMaxPooling2D()
        self.dense1 = layers.Dense(filters // reduction_ratio, activation='relu')
        self.dense2 = layers.Dense(filters)
        self.conv_spatial = layers.Conv2D(1, kernel_size=7, padding='same', activation='sigmoid')

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

# ====== 🧠 Bước 5: Xây dựng mô hình ======
def build_model(input_shape=(48, 48, 1), num_classes=7):
    inputs = layers.Input(shape=input_shape)
    x = layers.Rescaling(1./255)(inputs)
    for filters in [64, 128, 256]:
        x = layers.Conv2D(filters, 3, padding='same', activation='relu')(x)
        x = layers.BatchNormalization()(x)
        x = layers.Conv2D(filters, 3, padding='same', activation='relu')(x)
        x = layers.BatchNormalization()(x)
        x = CBAMBlock(filters)(x)
        x = layers.MaxPooling2D()(x)
        x = layers.Dropout(0.3)(x)                                                        #Ngẫu nhiên "tắt" 30% các neuron trong khi huấn luyện.
    x = layers.GlobalAveragePooling2D()(x)                                                 #4D->1D, tính tbinh
    x = layers.Dense(128, activation='relu')(x)                                            #trích chọn đặc trưng cuối cùng trước khi phân loại.
    x = layers.Dropout(0.5)(x)
    outputs = layers.Dense(num_classes, activation='softmax')(x)
    return models.Model(inputs, outputs)

model = build_model()
model.compile(optimizer=tf.keras.optimizers.Adam(1e-4),
              loss=FocalLoss(),
              metrics=['accuracy'])
model.summary()

# ====== ⏳ Bước 6: Callbacks ======
callbacks = [
    tf.keras.callbacks.EarlyStopping(monitor='val_loss', patience=10, restore_best_weights=True),
    tf.keras.callbacks.ReduceLROnPlateau(monitor='val_loss', factor=0.5, patience=3, verbose=1),
    tf.keras.callbacks.CSVLogger("training_log.csv")
]

# ====== 🚀 Bước 7: Huấn luyện ======
history = model.fit(train_ds, validation_data=val_ds, epochs=100, callbacks=callbacks)

# ====== 💾 Bước 8: Lưu mô hình ======
model_path = "/content/emotion_model1.keras"
model.save(model_path)
print(f"\n✅ Mô hình đã lưu tại: {model_path}")
files.download(model_path)

# ====== 📊 Bước 9: Biểu đồ & Confusion Matrix ======
plt.figure(figsize=(12, 5))
plt.subplot(1, 2, 1)
plt.plot(history.history['accuracy'], label='Train Acc')
plt.plot(history.history['val_accuracy'], label='Val Acc')
plt.legend()
plt.title('Accuracy')

plt.subplot(1, 2, 2)
plt.plot(history.history['loss'], label='Train Loss')
plt.plot(history.history['val_loss'], label='Val Loss')
plt.legend()
plt.title('Loss')
plt.tight_layout()
plt.show()

print("\n📊 Đánh giá trên test set...")
y_true, y_pred = [], []
for x_batch, y_batch in test_ds:
    preds = model.predict(x_batch)
    y_true.extend(y_batch.numpy())
    y_pred.extend(np.argmax(preds, axis=1))

cm = confusion_matrix(y_true, y_pred)
labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad', 'Surprise']
ConfusionMatrixDisplay(cm, display_labels=labels).plot(xticks_rotation=45, cmap="Blues")
plt.title("Confusion Matrix trên Test Set")
plt.show()


#& "C:\Users\Admin\AppData\Local\Programs\Python\Python310\python.exe" "D:\tgmt\project-\src\training\main.py"
#& "C:\Users\Admin\AppData\Local\Programs\Python\Python310\python.exe" "D:\tgmt\project-\src\training\analyze_video.py"
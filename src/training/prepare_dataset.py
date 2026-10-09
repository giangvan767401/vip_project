import os
import tensorflow as tf

def load_dataset(data_dir):
    img_size = (48, 48)
    batch_size = 32

    dataset = tf.keras.preprocessing.image_dataset_from_directory(
        data_dir,
        labels='inferred',
        label_mode='int',
        color_mode='grayscale',
        image_size=img_size,
        batch_size=batch_size,
        shuffle=True
    )

    return dataset

# Ví dụ kiểm tra:
if __name__ == "__main__":
    train_ds = load_dataset("model/fer2013/train")
    test_ds = load_dataset("model/fer2013/test")
    print("Train batches:", len(train_ds))
    print("Test batches:", len(test_ds))

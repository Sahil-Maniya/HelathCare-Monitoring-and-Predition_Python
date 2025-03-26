import tensorflow as tf
import numpy as np
from matplotlib.pyplot import imshow
from PIL import Image, ImageOps


base = '/Users/sahilmaniya/Desktop/Login_Module'
model = tf.keras.models.load_model(f'{base}/model.h5')


def image_pre(path):
    print(path)
    data = np.ndarray(shape=(1, 150, 150, 1), dtype=np.float32)
    size = (150, 150)
    image = Image.open(path)
    image = ImageOps.grayscale(image)
    image = ImageOps.fit(image, size, Image.Resampling.LANCZOS)  # Correct line
    image_array = np.asarray(image)
    data = image_array.reshape((-1, 150, 150, 1))
    return data

def predict(data):
    prediction = model.predict(data)
    return prediction[0][0]
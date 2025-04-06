"""
Detect language of the given text using pre-trained fasttext model
"""

import fasttext
import os

# Set the path to the pre-trained language detection model
model_path = os.path.join(os.path.dirname(__file__), "lid.176.bin")

print(os.path.dirname(__file__))

if not os.path.exists(model_path):
    download_url = "https://dl.fbaipublicfiles.com/fasttext/supervised-models/lid.176.bin"
    os.system(f"wget {download_url} -O {model_path}")

# Load pre-trained language detection model
model = fasttext.load_model(model_path)


def detect_language(cleaned_text: str) -> str:
    """Detect language of the given text

    Args:
        cleaned_text (str): Text to detect language

    Returns:
        str: Detected language code (check data/fasttext_lang_codes.json for more info)
    """

    # Detect language
    predictions = model.predict(cleaned_text, k=1)
    detected_lang = predictions[0][0].replace("__label__", "")

    return detected_lang

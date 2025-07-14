"""Detect language of the given text using pre-trained fasttext model
"""

import os

from fast_langdetect import LangDetectConfig, LangDetector

# Set the path to the pre-trained language detection model
model_path = "/app/ml_models/lid.176.bin"


# if not os.path.exists(model_path):
#     print(f"Lnaugage detection model not found in {model_path}. Downloading...")
#     download_url = "https://dl.fbaipublicfiles.com/fasttext/supervised-models/lid.176.bin"
#     os.system(f"wget {download_url} -O {model_path}")

if not os.path.exists(model_path):
    raise FileNotFoundError(
        f"Language detection model not found at {model_path}. Please ensure it is downloaded correctly.",
    )

# Load pre-trained language detection model
# Custom configuration with fallback mechanism
config = LangDetectConfig(
    allow_fallback=True,  # Enable fallback to small model if large model fails
)

detector = LangDetector(config)


def detect_language(cleaned_text: str) -> str:
    """Detect language of the given text

    Args:
        cleaned_text (str): Text to detect language

    Returns:
        str: Detected language code (check data/fasttext_lang_codes.json for more info)

    """
    # Detect language

    prediction = detector.detect(cleaned_text)
    return prediction.get("lang") if prediction else "unknown"

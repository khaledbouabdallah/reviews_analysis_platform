"""Module for cleaning and preprocessing text data."""

import re
import string
import unicodedata


def preprocess_comment(text):
    """Preprocess a comment by removing HTML tags, special characters,
    extra whitespaces, and converting to lowercase.

    Args:
        text (str): The text to be preprocessed.

    Returns:
        str: The preprocessed text.

    """
    # Normalize Unicode characters (fix accented letters, etc.)
    text = unicodedata.normalize("NFKC", text)

    # Remove HTML tags
    text = re.sub(r"<.*?>", "", text)

    # Remove special characters and extra whitespaces
    text = "".join(ch for ch in text if ch not in string.punctuation)

    # Convert to lowercase
    text = text.lower()

    # Remove extra whitespaces
    text = " ".join(text.split())

    # Optional: Remove URLs
    text = re.sub(r"http\S+", "", text)

    # Optional: Remove phone numbers #TODO: to be improved
    text = re.sub(r"\b\d{10}\b", "", text)

    # Optional: Remove email addresses
    text = re.sub(r"\S+@\S+", "", text)

    return text

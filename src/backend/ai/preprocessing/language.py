import fasttext

# Load pre-trained language detection model
model = fasttext.load_model('lid.176.bin')

def detect_language(cleaned_text: str) -> str:
    """ Detect language of the given text

    Args:
        cleaned_text (str): Text to detect language

    Returns:
        str: Detected language code (check data/fasttext_lang_codes.json for more info)
    """
 
    # Detect language
    predictions = model.predict(cleaned_text, k=1)
    detected_lang = predictions[0][0].replace('__label__', '')
    
    return detected_lang
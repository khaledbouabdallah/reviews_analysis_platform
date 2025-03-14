import re
import unicodedata

def preprocess_comment(comment):
    
    # Normalize Unicode characters (fix accented letters, etc.)
    text = unicodedata.normalize("NFKC", text)
    
    # Remove HTML tags
    comment = re.sub(r'<.*?>', '', comment)
    
    # Remove special characters and extra whitespaces
    comment = re.sub(r'[^a-zA-Z0-9\s]', '', comment)
    
    # Convert to lowercase
    comment = comment.lower()
    
    # Remove extra whitespaces
    comment = ' '.join(comment.split())
    
    # Optional: Remove URLs
    comment = re.sub(r'http\S+', '', comment)
    
    # Optional: Remove phone numbers #TODO: to be improved
    comment = re.sub(r'\b\d{10}\b', '', comment)
    
    # Optional: Remove email addresses
    comment = re.sub(r'\S+@\S+', '', comment)
    
        
    return comment

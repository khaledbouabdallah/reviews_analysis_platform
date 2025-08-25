import re

def is_validate_google_maps_reviews_url(v):
    # Pattern to match Google Maps URLs
    google_maps_pattern = r"^https?://(www\.)?(google\.[a-z]{2,3}(/maps)?|maps\.google\.[a-z]{2,3})/.+$"
    if not re.match(google_maps_pattern, v):
        raise ValueError("URL must be a valid Google Maps reviews link")
    # Method 1: Check for !4m18 or !4m8 parameter
    if re.search(r"!4m(18|8)\!", v):
        return v
    # Method 2: Check for !3m7 parameter
    if re.search(r"!3m7!", v):
        return v
    # Method 3: Count !9m1!1b1 occurrences
    if v.count("!9m1!1b1") >= 2:
        return v
    raise ValueError("URL must be a valid Google Maps reviews link")
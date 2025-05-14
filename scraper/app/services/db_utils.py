
from db.mongodb import db, reviews_collection
from datetime import datetime



async def save_reviews_to_mongodb(reviews_data, job_id, place_url):
    """
    Save reviews to MongoDB
    
    Args:
        reviews_data (list): List of review dictionaries
        mongodb_uri (str): MongoDB connection string
        job_id (str): ID of the scraping job
        place_url (str): URL of the place being scraped
        
    Returns:
        int: Number of reviews saved
    """
        
    # Add metadata to each review
    for review in reviews_data:
        review['job_id'] = job_id
        review['place_url'] = place_url
        review['scraped_at'] = datetime.now()
    
    # Insert all reviews at once
    result = await reviews_collection.insert_many(reviews_data)
    return len(result.inserted_ids)
class JobCancelledException(Exception):
    """Raised when a job is cancelled by user"""
    pass

class ReviewsLimitExceededException(Exception):
    """Raised when the reviews limit is exceeded"""
    pass

class TokenLimitExceededException(Exception):
    """Raised when the token limit is exceeded"""
    pass
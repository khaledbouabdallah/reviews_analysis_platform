from fastapi import APIRouter, HTTPException, status
from typing import List
from pymongo.errors import DuplicateKeyError
from db.repositories.businesses import BusinessRepository
from models.business import (
    BusinessCreate,
    BusinessUpdate,
    BusinessInDB,
    BusinessResponse,
)
from core.config import logger


router = APIRouter(prefix="/businesses", tags=["businesses"])
business_repo = BusinessRepository()


@router.post("/", response_model=BusinessResponse, status_code=status.HTTP_201_CREATED)
async def create_business(business: BusinessCreate):
    """
    Create a new business.

    - **name**: required, unique name of the business
    - **url**: required, valid URL of the business
    - **description**: optional description of the business
    """
    try:
        # Create the business
        new_business = await business_repo.create(business)
        return BusinessResponse.model_validate(new_business.model_dump(by_alias=True))

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create business: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{str(e)}")
    except Exception as e:
        # Handle duplicate key error
        if isinstance(e, DuplicateKeyError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Business with this name already exists",
            )
        else:
            logger.error(f"Unexpected error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred",
            )


@router.get("/", response_model=List[BusinessResponse])
async def list_businesses(skip: int = 0, limit: int = 100):
    """
    List all businesses.

    - **skip**: number of businesses to skip (for pagination)
    - **limit**: maximum number of businesses to return
    """
    try:
        businesses = await business_repo.get_all(skip=skip, limit=limit)
        return [
            BusinessResponse.model_validate(business.model_dump(by_alias=True))
            for business in businesses
        ]

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create business: {str(e)}",
        )


@router.get("/{business_id}", response_model=BusinessResponse)
async def get_business(business_id: str):
    """
    Get a business by ID.

    - **business_id**: ID of the business to retrieve
    """
    try:
        business = await business_repo.get_by_id(business_id)
        if not business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Business not found"
            )
        return BusinessResponse.model_validate(business.model_dump(by_alias=True))

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create business: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{business_id}", response_model=BusinessResponse)
async def update_business(business_id: str, business_update: BusinessUpdate):
    """
    Update a business by ID.

    - **business_id**: ID of the business to update
    - **name**: optional, new name of the business
    - **url**: optional, new URL of the business
    - **description**: optional, new description of the business
    """
    try:
        updated_business = await business_repo.update(business_id, business_update)
        if not updated_business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Business not found"
            )
        return BusinessResponse.model_validate(
            updated_business.model_dump(by_alias=True)
        )

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create business: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{business_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_business(business_id: str):
    """
    Delete a business by ID.

    - **business_id**: ID of the business to delete
    """
    try:
        deleted_business = await business_repo.delete(business_id)
        if not deleted_business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Business not found"
            )
        return None  # No content to return on successful deletion

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create business: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/user/{user_id}", response_model=List[BusinessResponse])
async def get_businesses_by_user(user_id: str, skip: int = 0, limit: int = 100):
    """
    Get all businesses of a user.

    - **user_id**: ID of the user
    - **skip**: number of businesses to skip (for pagination)
    - **limit**: maximum number of businesses to return
    """
    try:
        businesses = await business_repo.get_by_user(user_id, skip=skip, limit=limit)
        return [
            BusinessResponse.model_validate(business.model_dump(by_alias=True))
            for business in businesses
        ]

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create business: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

# backend/app/api/routers/businesses.py (UPDATED)
from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from pymongo.errors import DuplicateKeyError
from db.repositories.businesses import BusinessRepository
from models.business import (
    BusinessCreate,
    BusinessUpdate,
    BusinessInDB,
    BusinessResponse,
)
from models.user import UserInDB
from api.dependencies import get_current_active_user
from core.config import logger

router = APIRouter(prefix="/businesses", tags=["businesses"])
business_repo = BusinessRepository()


@router.post("/", response_model=BusinessResponse, status_code=status.HTTP_201_CREATED)
async def create_business(
    business_data: dict,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Create a new business for the authenticated user.
    """
    try:
        # Create business with current user's ID as string (will be converted in model)
        business_create = BusinessCreate(
            name=business_data["name"],
            user_id=str(current_user.id)  # Convert to string first
        )
        
        new_business = await business_repo.create(business_create)
        return BusinessResponse.model_validate(new_business.model_dump(by_alias=False))

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create business: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{str(e)}")
    except Exception as e:
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
async def list_user_businesses(
    skip: int = 0, 
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    List businesses for the authenticated user only.
    """
    try:
        businesses = await business_repo.get_by_user(
            str(current_user.id), skip=skip, limit=limit
        )
        return [
            BusinessResponse.model_validate(business.model_dump())
            for business in businesses
        ]

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve businesses: {str(e)}",
        )


@router.get("/{business_id}", response_model=BusinessResponse)
async def get_business(
    business_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Get a business by ID (only if user owns it).
    """
    try:
        business = await business_repo.get_by_id(business_id)
        if not business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Business not found"
            )
        
        # Check if user owns this business
        if business.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this business"
            )
            
        return BusinessResponse.model_validate(business.model_dump(by_alias=True))

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve business: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{business_id}", response_model=BusinessResponse)
async def update_business(
    business_id: str, 
    business_update: BusinessUpdate,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Update a business by ID (only if user owns it).
    """
    try:
        # First check if business exists and user owns it
        business = await business_repo.get_by_id(business_id)
        if not business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Business not found"
            )
        
        if business.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this business"
            )
        
        updated_business = await business_repo.update(business_id, business_update)
        return BusinessResponse.model_validate(
            updated_business.model_dump()
        )

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update business: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.delete("/{business_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_business(
    business_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Delete a business by ID (only if user owns it).
    """
    try:
        # First check if business exists and user owns it
        business = await business_repo.get_by_id(business_id)
        if not business:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, 
                detail="Business not found"
            )
        
        if business.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this business"
            )
        
        deleted_business = await business_repo.delete(business_id)
        return None

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete business: {str(e)}",
        )
# backend/app/api/routers/locations.py (SECURED VERSION)

from api.dependencies import get_current_active_user
from core.config import logger
from db.repositories.locations import LocationRepository
from fastapi import APIRouter, Depends, HTTPException, status
from models.location import LocationCreate, LocationResponse, LocationUpdate
from models.user import UserInDB
from pymongo.errors import DuplicateKeyError

router = APIRouter(prefix="/locations", tags=["locations"])
location_repo = LocationRepository()


@router.post("/", response_model=LocationResponse, status_code=status.HTTP_201_CREATED)
async def create_location(
    location_data: dict, current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Create a new location for the authenticated user.
    """
    try:
        # Create location with current user's ID
        location_create = LocationCreate(
            name=location_data["name"],
            adresse=location_data["adresse"],
            business_id=location_data["business_id"],
            user_id=str(current_user.id),
        )

        new_location = await location_repo.create(location_create)
        return LocationResponse.model_validate(new_location.model_dump(by_alias=False))

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create location: {e!s}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{e!s}")
    except Exception as e:
        if isinstance(e, DuplicateKeyError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="location with this name already exists in this business",
            )
        logger.error(f"Unexpected error: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred",
        )


@router.get("/", response_model=list[LocationResponse])
async def list_user_locations(
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """
    List locations for the authenticated user only.
    """
    try:
        locations = await location_repo.get_by_user(
            str(current_user.id), skip=skip, limit=limit
        )
        return [
            LocationResponse.model_validate(location.model_dump(by_alias=False))
            for location in locations
        ]

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve locations: {e!s}",
        )


@router.get("/{location_id}", response_model=LocationResponse)
async def get_location(
    location_id: str, current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Get a location by ID (only if user owns it).
    """
    try:
        location = await location_repo.get_by_id(location_id)
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="location not found"
            )

        # Check if user owns this location
        if location.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this location",
            )

        return LocationResponse.model_validate(location.model_dump(by_alias=False))

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve location: {e!s}",
        )


@router.put("/{location_id}", response_model=LocationResponse)
async def update_location(
    location_id: str,
    location_update: LocationUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """
    Update a location by ID (only if user owns it).
    """
    try:
        # First check if location exists and user owns it
        location = await location_repo.get_by_id(location_id)
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="location not found"
            )

        if location.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this location",
            )

        updated_location = await location_repo.update(location_id, location_update)
        return LocationResponse.model_validate(updated_location.model_dump(by_alias=False))

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update location: {e!s}",
        )


@router.delete("/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    location_id: str, current_user: UserInDB = Depends(get_current_active_user)
):
    """
    Delete a location by ID (only if user owns it).
    """
    try:
        # First check if location exists and user owns it
        location = await location_repo.get_by_id(location_id)
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="location not found"
            )

        if location.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this location",
            )

        deleted = await location_repo.delete(location_id)
        return

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete location: {e!s}",
        )


@router.get("/business/{business_id}", response_model=list[LocationResponse])
async def get_locations_by_business(
    business_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """
    Get all locations of a business (only if user owns the business).
    """
    try:
        # Verify business ownership through the locations themselves
        locations = await location_repo.get_by_business(business_id, skip=skip, limit=limit)

        # Filter to only include locations owned by current user
        user_locations = [
            location for location in locations if location.user_id == current_user.id
        ]

        return [
            LocationResponse.model_validate(location.model_dump(by_alias=False))
            for location in user_locations
        ]

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve locations: {e!s}",
        )

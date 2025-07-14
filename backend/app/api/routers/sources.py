# backend/app/api/routers/sources.py (SECURED VERSION)

from api.dependencies import get_current_active_user
from core.config import logger
from db.repositories.sources import SourceRepository
from fastapi import APIRouter, Depends, HTTPException, status
from models.source import SourceCreate, SourceResponse, SourceUpdate
from models.user import UserInDB
from pymongo.errors import DuplicateKeyError

router = APIRouter(prefix="/sources", tags=["sources"])
source_repo = SourceRepository()


@router.post("/", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
async def create_source(
    source_data: dict, current_user: UserInDB = Depends(get_current_active_user),
):
    """Create a new source for the authenticated user.
    """
    try:
        # Create source with current user's ID
        source_create = SourceCreate(
            name=source_data["name"],
            type=source_data["type"],
            business_id=source_data["business_id"],
            user_id=str(current_user.id),
        )

        new_source = await source_repo.create(source_create)
        return SourceResponse.model_validate(new_source.model_dump(by_alias=False))

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create source: {e!s}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{e!s}")
    except Exception as e:
        if isinstance(e, DuplicateKeyError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Source with this name already exists in this business",
            )
        logger.error(f"Unexpected error: {e!s}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred",
        )


@router.get("/", response_model=list[SourceResponse])
async def list_user_sources(
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """List sources for the authenticated user only.
    """
    try:
        sources = await source_repo.get_by_user(
            str(current_user.id), skip=skip, limit=limit,
        )
        return [
            SourceResponse.model_validate(source.model_dump(by_alias=False))
            for source in sources
        ]

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve sources: {e!s}",
        )


@router.get("/{source_id}", response_model=SourceResponse)
async def get_source(
    source_id: str, current_user: UserInDB = Depends(get_current_active_user),
):
    """Get a source by ID (only if user owns it).
    """
    try:
        source = await source_repo.get_by_id(source_id)
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Source not found",
            )

        # Check if user owns this source
        if source.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to access this source",
            )

        return SourceResponse.model_validate(source.model_dump(by_alias=False))

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve source: {e!s}",
        )


@router.put("/{source_id}", response_model=SourceResponse)
async def update_source(
    source_id: str,
    source_update: SourceUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Update a source by ID (only if user owns it).
    """
    try:
        # First check if source exists and user owns it
        source = await source_repo.get_by_id(source_id)
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Source not found",
            )

        if source.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to update this source",
            )

        updated_source = await source_repo.update(source_id, source_update)
        return SourceResponse.model_validate(updated_source.model_dump(by_alias=False))

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update source: {e!s}",
        )


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_source(
    source_id: str, current_user: UserInDB = Depends(get_current_active_user),
):
    """Delete a source by ID (only if user owns it).
    """
    try:
        # First check if source exists and user owns it
        source = await source_repo.get_by_id(source_id)
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Source not found",
            )

        if source.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete this source",
            )

        deleted = await source_repo.delete(source_id)
        return

    except HTTPException:
        raise
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete source: {e!s}",
        )


@router.get("/business/{business_id}", response_model=list[SourceResponse])
async def get_sources_by_business(
    business_id: str,
    skip: int = 0,
    limit: int = 100,
    current_user: UserInDB = Depends(get_current_active_user),
):
    """Get all sources of a business (only if user owns the business).
    """
    try:
        # Verify business ownership through the sources themselves
        sources = await source_repo.get_by_business(business_id, skip=skip, limit=limit)

        # Filter to only include sources owned by current user
        user_sources = [
            source for source in sources if source.user_id == current_user.id
        ]

        return [
            SourceResponse.model_validate(source.model_dump(by_alias=False))
            for source in user_sources
        ]

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve sources: {e!s}",
        )

from fastapi import APIRouter, HTTPException, status
from typing import List
from pymongo.errors import DuplicateKeyError
from db.repositories.sources import SourceRepository
from models.source import SourceCreate, SourceUpdate, SourceInDB, SourceResponse
from core.config import logger


router = APIRouter(prefix="/sources", tags=["sources"])
source_repo = SourceRepository()


@router.post("/", response_model=SourceResponse, status_code=status.HTTP_201_CREATED)
async def create_source(source: SourceCreate):
    """
    Create a new source.

    - **name**: required, unique name of the source
    - **url**: required, valid URL of the source
    - **description**: optional description of the source
    """
    try:
        # Create the source
        new_source = await source_repo.create(source)
        return SourceResponse.model_validate(new_source.model_dump(by_alias=True))

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create source: {str(e)}",
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{str(e)}")
    except Exception as e:
        # Handle duplicate key error
        if isinstance(e, DuplicateKeyError):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="source with this name already exists",
            )
        else:
            logger.error(f"Unexpected error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="An unexpected error occurred",
            )


@router.get("/", response_model=List[SourceResponse])
async def list_sources(skip: int = 0, limit: int = 100):
    """
    List all sources.

    - **skip**: number of sources to skip (for pagination)
    - **limit**: maximum number of sources to return
    """
    try:
        sources = await source_repo.get_all(skip=skip, limit=limit)
        return [
            SourceResponse.model_validate(source.model_dump(by_alias=True))
            for source in sources
        ]

    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create source: {str(e)}",
        )


@router.get("/{source_id}", response_model=SourceResponse)
async def get_source(source_id: str):
    """
    Get a source by ID.

    - **source_id**: ID of the source to retrieve
    """
    try:
        source = await source_repo.get_by_id(source_id)
        if not source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
            )
        return SourceResponse.model_validate(source.model_dump(by_alias=True))

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create source: {str(e)}",
        )


@router.put("/{source_id}", response_model=SourceResponse)
async def update_source(source_id: str, source: SourceUpdate):
    """
    Update a source by ID.

    - **source_id**: ID of the source to update
    - **source**: updated source data
    """
    try:
        # Update the source
        updated_source = await source_repo.update(source_id, source)
        if not updated_source:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
            )
        return SourceResponse.model_validate(updated_source.model_dump(by_alias=True))

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create source: {str(e)}",
        )


@router.delete("/{source_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_source(source_id: str):
    """
    Delete a source by ID.

    - **source_id**: ID of the source to delete
    """
    try:
        # Delete the source
        deleted = await source_repo.delete(source_id)
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Source not found"
            )
        return None  # No content to return

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create source: {str(e)}",
        )


@router.get("/user/{user_id}", response_model=List[SourceResponse])
async def get_sources_by_user(user_id: str, skip: int = 0, limit: int = 100):
    """
    Get all sources of a user.

    - **user_id**: ID of the user
    - **skip**: number of sources to skip (for pagination)
    - **limit**: maximum number of sources to return
    """
    try:
        sources = await source_repo.get_by_user(user_id, skip=skip, limit=limit)
        return [
            SourceResponse.model_validate(source.model_dump(by_alias=True))
            for source in sources
        ]

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create source: {str(e)}",
        )


@router.get("/business/{business_id}", response_model=List[SourceResponse])
async def get_sources_by_business(business_id: str, skip: int = 0, limit: int = 100):
    """
    Get all sources of a business.

    - **business_id**: ID of the business
    - **skip**: number of sources to skip (for pagination)
    - **limit**: maximum number of sources to return
    """
    try:
        sources = await source_repo.get_by_business(business_id, skip=skip, limit=limit)
        return [
            SourceResponse.model_validate(source.model_dump(by_alias=True))
            for source in sources
        ]

    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create source: {str(e)}",
        )

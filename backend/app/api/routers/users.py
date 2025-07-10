from core.config import logger
from db.repositories.users import UserRepository
from fastapi import APIRouter, HTTPException, status
from models.user import UserCreate, UserResponse
from pymongo.errors import DuplicateKeyError

router = APIRouter(prefix="/users", tags=["users"])
user_repo = UserRepository()


@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    """
    Create a new user.

    - **username**: required, unique username
    - **email**: required, valid email address
    - **password**: required, minimum 8 characters
    - **full_name**: optional user's full name
    """
    try:
        logger.info(f"router: Creating user 1: {user}")
        # Check if username already exists
        existing_user = await user_repo.get_by_username(user.username)
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Username already registered",
            )

        logger.info(f"router: Creating user 2: {user}")

        # Check if email already exists
        existing_email = await user_repo.get_by_email(user.email)
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
            )

        logger.info(f"router: Creating user 3: {user}")
        # Create the user
        new_user = await user_repo.create(user)
        logger.info(f"router: created!: {user}")
        return UserResponse.model_validate(new_user.model_dump(by_alias=True))

    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already exists",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {e!s}",
        )


@router.get("/", response_model=list[UserResponse])
async def list_users(skip: int = 0, limit: int = 100):
    """
    Retrieve a list of users.

    - **skip**: number of users to skip (pagination)
    - **limit**: maximum number of users to return
    """
    users = await user_repo.get_all(skip=skip, limit=limit)
    return [
        UserResponse.model_validate(user.model_dump(by_alias=True)) for user in users
    ]


@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    """
    Get a specific user by ID.

    - **user_id**: the ID of the user to retrieve
    """
    user = await user_repo.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )
    return UserResponse.model_validate(user.model_dump(by_alias=True))


@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: str, user_update: dict):
    """
    Update a user.

    - **user_id**: the ID of the user to update
    - **user_update**: the fields to update
    """
    # Check if user exists
    existing_user = await user_repo.get_by_id(user_id)
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Update the user
    updated_user = await user_repo.update(user_id, user_update)
    return UserResponse.model_validate(updated_user.model_dump(by_alias=True))


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: str):
    """
    Delete a user.

    - **user_id**: the ID of the user to delete
    """
    # Check if user exists
    existing_user = await user_repo.get_by_id(user_id)
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    # Delete the user
    await user_repo.delete(user_id)

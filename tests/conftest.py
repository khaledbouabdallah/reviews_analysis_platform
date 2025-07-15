import sys
import uuid
from collections.abc import Generator
from pathlib import Path

import pytest
import requests

# Add backend to Python path for imports
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))


@pytest.fixture(scope="session")
def base_url():
    """Base URL for API tests"""
    return "http://localhost:8000/api"


@pytest.fixture
def test_user_data():
    """Generate unique test user data for each test"""
    unique_id = str(uuid.uuid4())[:8]
    return {
        "username": f"testuser_{unique_id}",
        "email": f"test_{unique_id}@example.com",
        "password": "password123",
    }


@pytest.fixture
def authenticated_user(
    base_url: str,
    test_user_data: dict,
) -> Generator[dict, None, None]:
    """Create a test user, authenticate, and provide auth headers.
    Cleans up the user after the test.
    """
    # Register user
    response = requests.post(f"{base_url}/auth/register", json=test_user_data)
    if response.status_code not in [200, 409]:  # 409 = already exists
        pytest.fail(
            f"Failed to register user: {response.status_code} - {response.text}",
        )

    # Login to get token
    login_data = {
        "username": test_user_data["username"],
        "password": test_user_data["password"],
    }
    response = requests.post(
        f"{base_url}/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    if response.status_code != 200:
        pytest.fail(f"Failed to login: {response.status_code} - {response.text}")

    token_data = response.json()
    access_token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {access_token}"}

    user_info = {"user_data": test_user_data, "token": access_token, "headers": headers}

    yield user_info

    # Cleanup: Delete the test user
    try:
        requests.delete(f"{base_url}/auth/me", headers=headers)
    except:
        pass  # Ignore cleanup failures


@pytest.fixture
def business_data():
    """Sample business data"""
    unique_id = str(uuid.uuid4())[:8]
    return {"name": f"Test Business {unique_id}"}


@pytest.fixture
def location_data():
    """Sample location data"""
    unique_id = str(uuid.uuid4())[:8]
    return {
        "name": f"Test Location {unique_id}",
        "adresse": "Test adresse",  # Simulating a business ID
    }


@pytest.fixture
def source_data():
    """Sample source data"""
    unique_id = str(uuid.uuid4())[:8]
    return {
        "name": f"Test Source {unique_id}",
        "type": "google",
        "url": "https://www.google.com/maps/place/Restaurant+Test/@40.7128,-74.0060,15z",
    }


@pytest.fixture
def job_data():
    """Sample job data"""
    return {
        "name": "Test Job",
        "url": "https://www.google.com/maps/place/Restaurant+Test/@40.7128,-74.0060,15z",
        "source_type": "google",
    }

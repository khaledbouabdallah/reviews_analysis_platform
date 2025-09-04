import pytest
import requests


class TestLocations:
    """Test location CRUD operations"""

    @pytest.fixture
    def business_with_location(
        self, base_url, authenticated_user, business_data, location_data,
    ):
        """Create a business and return it with location data"""
        # Create business
        business_response = requests.post(
            f"{base_url}/businesses",
            json=business_data,
            headers=authenticated_user["headers"],
        )
        business = business_response.json()

        # Add business_id to location_data
        location_data["business_id"] = business["id"]

        return {
            "business": business,
            "location_data": location_data,
            "headers": authenticated_user["headers"],
        }

    def test_create_location(self, base_url, business_with_location):
        """Test creating a location"""
        response = requests.post(
            f"{base_url}/locations",
            json=business_with_location["location_data"],
            headers=business_with_location["headers"],
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == business_with_location["location_data"]["name"]
        assert data["address"] == business_with_location["location_data"]["address"]
        assert "id" in data

    def test_list_user_locations(self, base_url, business_with_location):
        """Test listing user's locations"""
        # Create location first
        create_response = requests.post(
            f"{base_url}/locations",
            json=business_with_location["location_data"],
            headers=business_with_location["headers"],
        )
        assert create_response.status_code == 201

        # List locations
        response = requests.get(
            f"{base_url}/locations", headers=business_with_location["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

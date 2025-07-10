import pytest
import requests


class TestSources:
    """Test source CRUD operations"""

    @pytest.fixture()
    def business_with_source(
        self, base_url, authenticated_user, business_data, source_data
    ):
        """Create a business and return it with source data"""
        # Create business
        business_response = requests.post(
            f"{base_url}/businesses",
            json=business_data,
            headers=authenticated_user["headers"],
        )
        business = business_response.json()

        # Add business_id to source_data
        source_data["business_id"] = business["id"]

        return {
            "business": business,
            "source_data": source_data,
            "headers": authenticated_user["headers"],
        }

    def test_create_source(self, base_url, business_with_source):
        """Test creating a source"""
        response = requests.post(
            f"{base_url}/sources",
            json=business_with_source["source_data"],
            headers=business_with_source["headers"],
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == business_with_source["source_data"]["name"]
        assert data["type"] == business_with_source["source_data"]["type"]
        assert "id" in data

    def test_list_user_sources(self, base_url, business_with_source):
        """Test listing user's sources"""
        # Create source first
        create_response = requests.post(
            f"{base_url}/sources",
            json=business_with_source["source_data"],
            headers=business_with_source["headers"],
        )
        assert create_response.status_code == 201

        # List sources
        response = requests.get(
            f"{base_url}/sources", headers=business_with_source["headers"]
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1

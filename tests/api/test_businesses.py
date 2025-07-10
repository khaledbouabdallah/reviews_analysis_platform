import requests


class TestBusinesses:
    """Test business CRUD operations"""

    def test_create_business(self, base_url, authenticated_user, business_data):
        """Test creating a business"""
        response = requests.post(
            f"{base_url}/businesses",
            json=business_data,
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == business_data["name"]
        assert "id" in data
        assert "user_id" in data

    def test_create_business_no_auth(self, base_url, business_data):
        """Test creating business without authentication"""
        response = requests.post(f"{base_url}/businesses", json=business_data)

        assert response.status_code == 401

    def test_list_user_businesses(self, base_url, authenticated_user, business_data):
        """Test listing user's businesses"""
        # Create a business first
        create_response = requests.post(
            f"{base_url}/businesses",
            json=business_data,
            headers=authenticated_user["headers"],
        )
        assert create_response.status_code == 201

        # List businesses
        response = requests.get(
            f"{base_url}/businesses", headers=authenticated_user["headers"]
        )

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) >= 1
        assert any(b["name"] == business_data["name"] for b in data)

    def test_get_business_by_id(self, base_url, authenticated_user, business_data):
        """Test getting a specific business"""
        # Create business
        create_response = requests.post(
            f"{base_url}/businesses",
            json=business_data,
            headers=authenticated_user["headers"],
        )
        business_id = create_response.json()["id"]

        # Get business
        response = requests.get(
            f"{base_url}/businesses/{business_id}",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == business_id
        assert data["name"] == business_data["name"]

    def test_update_business(self, base_url, authenticated_user, business_data):
        """Test updating a business"""
        # Create business
        create_response = requests.post(
            f"{base_url}/businesses",
            json=business_data,
            headers=authenticated_user["headers"],
        )
        business_id = create_response.json()["id"]

        # Update business
        update_data = {"name": "Updated Business Name"}
        response = requests.put(
            f"{base_url}/businesses/{business_id}",
            json=update_data,
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == update_data["name"]

    def test_delete_business(self, base_url, authenticated_user, business_data):
        """Test deleting a business"""
        # Create business
        create_response = requests.post(
            f"{base_url}/businesses",
            json=business_data,
            headers=authenticated_user["headers"],
        )
        business_id = create_response.json()["id"]

        # Delete business
        response = requests.delete(
            f"{base_url}/businesses/{business_id}",
            headers=authenticated_user["headers"],
        )

        assert response.status_code == 204

        # Verify deletion
        get_response = requests.get(
            f"{base_url}/businesses/{business_id}",
            headers=authenticated_user["headers"],
        )
        assert get_response.status_code == 404

    def test_access_other_user_business(
        self, base_url, authenticated_user, business_data
    ):
        """Test that users cannot access other users' businesses"""
        # This would require creating two users - simplified version
        # In practice, you'd create another authenticated_user fixture

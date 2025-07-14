import requests


class TestAuthentication:
    """Test authentication endpoints"""

    def test_user_registration(self, base_url, test_user_data):
        """Test user registration"""
        response = requests.post(f"{base_url}/auth/register", json=test_user_data)

        assert response.status_code in [200, 409]  # 409 if user exists
        if response.status_code == 200:
            data = response.json()
            assert "user_id" in data
            assert data["message"] == "User registered successfully"

    def test_user_login(self, base_url, authenticated_user):
        """Test user login (already tested in fixture)"""
        assert "token" in authenticated_user
        assert "headers" in authenticated_user
        assert authenticated_user["token"].startswith("eyJ")  # JWT starts with this

    def test_protected_route_access(self, base_url, authenticated_user):
        """Test accessing protected route with valid token"""
        response = requests.get(
            f"{base_url}/auth/me", headers=authenticated_user["headers"],
        )

        assert response.status_code == 200
        data = response.json()
        assert data["username"] == authenticated_user["user_data"]["username"]
        assert data["email"] == authenticated_user["user_data"]["email"]

    def test_protected_route_no_token(self, base_url):
        """Test accessing protected route without token"""
        response = requests.get(f"{base_url}/auth/me")

        assert response.status_code == 401

    def test_protected_route_invalid_token(self, base_url):
        """Test accessing protected route with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{base_url}/auth/me", headers=headers)

        assert response.status_code == 401

    def test_login_wrong_password(self, base_url, test_user_data):
        """Test login with wrong password"""
        # First register the user
        requests.post(f"{base_url}/auth/register", json=test_user_data)

        # Try to login with wrong password
        login_data = {
            "username": test_user_data["username"],
            "password": "wrong_password",
        }
        response = requests.post(
            f"{base_url}/auth/login",
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        assert response.status_code == 401

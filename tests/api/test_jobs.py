import pytest
import requests


class TestJobs:
    """Test job CRUD operations"""

    @pytest.fixture
    def complete_setup(
        self, base_url, authenticated_user, business_data, source_data, job_data
    ):
        """Create business and source for job testing"""
        headers = authenticated_user["headers"]

        # Create business
        business_response = requests.post(
            f"{base_url}/businesses", json=business_data, headers=headers
        )
        business = business_response.json()

        # Create source
        source_data["business_id"] = business["id"]
        source_response = requests.post(
            f"{base_url}/sources", json=source_data, headers=headers
        )
        source = source_response.json()

        # Add IDs to job data
        job_data["business_id"] = business["id"]
        job_data["source_id"] = source["id"]

        return {
            "business": business,
            "source": source,
            "job_data": job_data,
            "headers": headers,
        }

    def test_list_user_jobs(self, base_url, complete_setup):
        """Test listing user's jobs"""
        response = requests.get(f"{base_url}/jobs", headers=complete_setup["headers"])

        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

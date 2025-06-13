import requests
from typing import Dict, Any


class APIClient:
    """Client for making API requests to the backend"""

    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip("/")

    # User API methods
    def create_user(self, username: str, email: str, password: str) -> Dict[str, Any]:
        """Create a new user account"""
        url = f"{self.base_url}/api/users"
        data = {"username": username, "email": email, "password": password}
        response = requests.post(url, json=data)
        return self._handle_response(response)

    def get_user_by_id(self, user_id: str) -> Dict[str, Any]:
        """Get user by ID"""
        url = f"{self.base_url}/api/users/{user_id}"
        response = requests.get(url)
        return self._handle_response(response)

    def list_users(self) -> Dict[str, Any]:
        """List all users (for login verification)"""
        url = f"{self.base_url}/api/users"
        response = requests.get(url)
        return self._handle_response(response)

    # Business API methods
    def create_business(self, user_id: str, name: str) -> Dict[str, Any]:
        """Create a new business"""
        url = f"{self.base_url}/api/businesses"
        data = {"user_id": user_id, "name": name}
        response = requests.post(url, json=data)
        return self._handle_response(response)

    def get_businesses_by_user(self, user_id: str) -> Dict[str, Any]:
        """Get all businesses for a user"""
        url = f"{self.base_url}/api/businesses/user/{user_id}"
        response = requests.get(url)
        return self._handle_response(response)

    def update_business(self, business_id: str, name: str) -> Dict[str, Any]:
        """Update business name"""
        url = f"{self.base_url}/api/businesses/{business_id}"
        data = {"name": name}
        response = requests.put(url, json=data)
        return self._handle_response(response)

    def delete_business(self, business_id: str) -> Dict[str, Any]:
        """Delete a business"""
        url = f"{self.base_url}/api/businesses/{business_id}"
        response = requests.delete(url)
        return self._handle_response(response)

    # Source API methods (future)
    def create_source(
        self, user_id: str, business_id: str, name: str, source_type: str
    ) -> Dict[str, Any]:
        """Create a new source"""
        url = f"{self.base_url}/api/sources"
        data = {
            "user_id": user_id,
            "business_id": business_id,
            "name": name,
            "type": source_type,
        }
        response = requests.post(url, json=data)
        return self._handle_response(response)

    def get_sources_by_business(self, business_id: str) -> Dict[str, Any]:
        """Get all sources for a business"""
        url = f"{self.base_url}/api/sources/business/{business_id}"
        response = requests.get(url)
        return self._handle_response(response)

    def update_source(
        self, source_id: str, name: str, source_type: str
    ) -> Dict[str, Any]:
        """Update source"""
        url = f"{self.base_url}/api/sources/{source_id}"
        data = {"name": name, "type": source_type}
        response = requests.put(url, json=data)
        return self._handle_response(response)

    def delete_source(self, source_id: str) -> Dict[str, Any]:
        """Delete a source"""
        url = f"{self.base_url}/api/sources/{source_id}"
        response = requests.delete(url)
        return self._handle_response(response)

    # Job API methods (future)
    def create_job(
        self,
        user_id: str,
        business_id: str,
        source_id: str,
        url: str,
        source_type: str,
        name: str = None,
    ) -> Dict[str, Any]:
        """Create a new scraping job"""
        api_url = f"{self.base_url}/api/jobs"
        data = {
            "user_id": user_id,
            "business_id": business_id,
            "source_id": source_id,
            "url": url,
            "source_type": source_type,
        }
        if name:
            data["name"] = name
        response = requests.post(api_url, json=data)
        return self._handle_response(response)

    def get_jobs_by_business(self, business_id: str) -> Dict[str, Any]:
        """Get all jobs for a business"""
        url = f"{self.base_url}/api/jobs/business/{business_id}"
        response = requests.get(url)
        return self._handle_response(response)

    def get_jobs_by_source(self, source_id: str) -> Dict[str, Any]:
        """Get all jobs for a source"""
        url = f"{self.base_url}/api/jobs/source/{source_id}"
        response = requests.get(url)
        return self._handle_response(response)

    def get_job_by_id(self, job_id: str) -> Dict[str, Any]:
        """Get job by ID"""
        url = f"{self.base_url}/api/jobs/{job_id}"
        response = requests.get(url)
        return self._handle_response(response)

    def delete_job(self, job_id: str) -> Dict[str, Any]:
        """Delete a job"""
        url = f"{self.base_url}/api/jobs/{job_id}"
        response = requests.delete(url)
        return self._handle_response(response)

    # Review API methods (future)
    def get_reviews_by_business(self, business_id: str) -> Dict[str, Any]:
        """Get all reviews for a business"""
        url = f"{self.base_url}/api/reviews/business/{business_id}"
        response = requests.get(url)
        return self._handle_response(response)

    def get_reviews_by_job(self, job_id: str) -> Dict[str, Any]:
        """Get all reviews for a job"""
        url = f"{self.base_url}/api/reviews/job/{job_id}"
        response = requests.get(url)
        return self._handle_response(response)

    # Analysis API methods
    def analyze_job_reviews(self, job_id: str) -> Dict[str, Any]:
        """Run basic analysis on all reviews for a job"""
        url = f"{self.base_url}/api/analyzer/simple/batch/job/{job_id}"
        response = requests.get(url)
        return self._handle_response(response)

    def summarize_job_reviews(self, job_id: str) -> Dict[str, Any]:
        """Generate a summary of all reviews for a job"""
        url = f"{self.base_url}/api/analyzer/summary/job/{job_id}"
        response = requests.get(url)
        return self._handle_response(response)

    def _handle_response(self, response: requests.Response) -> Dict[str, Any]:
        """Handle API response and return JSON data or raise error"""
        if response.status_code >= 400:
            try:
                error_detail = response.json().get("detail", "Unknown error")
            except:
                error_detail = f"HTTP {response.status_code}: {response.text}"
            raise Exception(error_detail)

        try:
            return response.json()
        except:
            return {"message": "Success"}

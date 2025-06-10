import streamlit as st
import requests
import json
from typing import Optional, Dict, Any
import os
import logging

logger = logging.getLogger("streamlit")
logger.setLevel(logging.DEBUG)

# Add handler and formatter
handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)


# Configuration
BACKEND_URL = os.getenv("BACKEND_API_URL", "http://localhost:8000")



class APIClient:
    """Client for making API requests to the backend"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
    
    def create_user(self, username: str, email: str, password: str) -> Dict[str, Any]:
        """Create a new user account"""
        url = f"{self.base_url}/api/users"
        data = {
            "username": username,
            "email": email,
            "password": password
        }
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

# Initialize API client
api_client = APIClient(BACKEND_URL)

def init_session_state():
    """Initialize session state variables"""
    if 'logged_in' not in st.session_state:
        st.session_state.logged_in = False
    if 'current_user' not in st.session_state:
        st.session_state.current_user = None
    if 'user_id' not in st.session_state:
        st.session_state.user_id = None

def login_form():
    """Display login form"""
    st.subheader("Login")
    
    with st.form("login_form"):
        username = st.text_input("Username")
        password = st.text_input("Password", type="password")
        submit_button = st.form_submit_button("Login")
        
        if submit_button:
            if not username or not password:
                st.error("Please enter both username and password")
                return
            
            try:
                # For now, we'll do a simple verification by getting all users
                # and checking if username exists (since we don't have auth yet)
                users_response = api_client.list_users()
                users = users_response if isinstance(users_response, list) else []
                
                # Find user by username
                user = None
                for u in users:
                    if u.get('username') == username:
                        user = u
                        break
                
                if user:
                    # For now, we'll assume password is correct
                    # In a real app, you'd verify password with backend
                    st.session_state.logged_in = True
                    st.session_state.current_user = user
                    # Handle both 'id' and '_id' fields from backend
                    logging.info(user)
                    st.session_state.user_id = user.get('id', user.get('_id'))
                    st.success(f"Welcome back, {username}!")
                    st.rerun()
                else:
                    st.error("Invalid username or user not found")
                    
            except Exception as e:
                st.error(f"Login failed: {str(e)}")

def register_form():
    """Display registration form"""
    st.subheader("Create Account")
    
    with st.form("register_form"):
        username = st.text_input("Username", help="3-50 characters")
        email = st.text_input("Email")
        password = st.text_input("Password", type="password", help="Minimum 8 characters")
        confirm_password = st.text_input("Confirm Password", type="password")
        submit_button = st.form_submit_button("Create Account")
        
        if submit_button:
            # Validation
            if not username or not email or not password:
                st.error("Please fill in all fields")
                return
                
            if len(username) < 3 or len(username) > 50:
                st.error("Username must be 3-50 characters")
                return
                
            if len(password) < 8:
                st.error("Password must be at least 8 characters")
                return
                
            if password != confirm_password:
                st.error("Passwords do not match")
                return
            
            try:
                user = api_client.create_user(username, email, password)
                st.success(f"Account created successfully! Welcome, {username}!")
                
                # Auto-login after registration
                st.session_state.logged_in = True
                st.session_state.current_user = user
                # Handle both 'id' and '_id' fields from backend
                st.session_state.user_id = user.get('id', user.get('_id'))
                st.rerun()
                
            except Exception as e:
                st.error(f"Registration failed: {str(e)}")

def logout():
    """Logout user"""
    st.session_state.logged_in = False
    st.session_state.current_user = None
    st.session_state.user_id = None
    st.rerun()

def main_dashboard():
    """Main dashboard for logged-in users"""
    st.title("Reviews Analysis Platform")
    
    # Header with user info and logout
    col1, col2 = st.columns([3, 1])
    with col1:
        st.write(f"Welcome, **{st.session_state.current_user['username']}**!")
    with col2:
        if st.button("Logout"):
            logout()
    
    st.markdown("---")
    
    # Debug info (remove this later)
    with st.expander("Debug Info (Current User Data)"):
        st.json(st.session_state.current_user)
        st.write(f"User ID: {st.session_state.user_id}")
    
    # Navigation tabs
    tab1, tab2, tab3, tab4 = st.tabs(["Dashboard", "Businesses", "Sources", "Jobs & Reviews"])
    
    with tab1:
        st.header("Dashboard")
        st.info("Dashboard features will be implemented in the next steps")
        
        # Show basic user info
        st.subheader("Your Account")
        user_info = st.session_state.current_user
        col1, col2 = st.columns(2)
        with col1:
            st.write(f"**Username:** {user_info.get('username')}")
            st.write(f"**Email:** {user_info.get('email', 'Not provided')}")
        with col2:
            st.write(f"**Account Status:** {'Active' if not user_info.get('disabled', False) else 'Disabled'}")
            st.write(f"**Member Since:** {user_info.get('created_at', 'Unknown')[:10]}")
    
    with tab2:
        st.header("Businesses")
        st.info("Business management will be implemented in the next step")
    
    with tab3:
        st.header("Sources") 
        st.info("Source management will be implemented in the next step")
    
    with tab4:
        st.header("Jobs & Reviews")
        st.info("Job creation and review visualization will be implemented in the next step")

def main():

    """Main application"""
    st.set_page_config(
        page_title="Reviews Analysis Platform",
        page_icon="📊",
        layout="wide"
    )
    
    
    # Set up logging
    logger.info("Starting Reviews Analysis Platform")
    
    # Initialize session state
    init_session_state()
    
    # Check if user is logged in
    if not st.session_state.logged_in:
        st.title("Reviews Analysis Platform")
        st.markdown("Welcome to the Reviews Analysis Platform. Please login or create an account to continue.")
        
        # Login/Register tabs
        tab1, tab2 = st.tabs(["Login", "Register"])
        
        with tab1:
            login_form()
        
        with tab2:
            register_form()
            
        # Footer
        st.markdown("---")
        st.markdown("*Developed by Khaled Bouabdallah*")
    else:
        main_dashboard()

if __name__ == "__main__":
    main()
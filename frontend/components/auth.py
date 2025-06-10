import streamlit as st
from utils import get_api_client, get_item_id


def login_form():
    """Display login form"""
    st.subheader("Login")
    
    api_client = get_api_client()
    
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
                    st.session_state.user_id = get_item_id(user)
                    
                    st.success(f"Welcome back, {username}!")
                    st.rerun()
                else:
                    st.error("Invalid username or user not found")
                    
            except Exception as e:
                st.error(f"Login failed: {str(e)}")


def register_form():
    """Display registration form"""
    st.subheader("Create Account")
    
    api_client = get_api_client()
    
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
                st.session_state.user_id = get_item_id(user)
                
                st.rerun()
                
            except Exception as e:
                st.error(f"Registration failed: {str(e)}")
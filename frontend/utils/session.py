import streamlit as st
from api import APIClient
from config import BACKEND_URL


def init_session_state():
    """Initialize session state variables"""
    if "logged_in" not in st.session_state:
        st.session_state.logged_in = False
    if "current_user" not in st.session_state:
        st.session_state.current_user = None
    if "user_id" not in st.session_state:
        st.session_state.user_id = None
    if "selected_business" not in st.session_state:
        st.session_state.selected_business = None
    if "businesses" not in st.session_state:
        st.session_state.businesses = []
    if "sources" not in st.session_state:
        st.session_state.sources = []
    if "jobs" not in st.session_state:
        st.session_state.jobs = []
    if "reviews" not in st.session_state:
        st.session_state.reviews = []
    if "selected_source_for_jobs" not in st.session_state:
        st.session_state.selected_source_for_jobs = None
    if "selected_job_for_reviews" not in st.session_state:
        st.session_state.selected_job_for_reviews = None
    if "selected_source_for_reviews" not in st.session_state:
        st.session_state.selected_source_for_reviews = None
    if "active_tab" not in st.session_state:
        st.session_state.active_tab = "Sources"


def get_api_client() -> APIClient:
    """Get or create API client instance"""
    if "api_client" not in st.session_state:
        st.session_state.api_client = APIClient(BACKEND_URL)
    return st.session_state.api_client


def clear_session_state():
    """Clear all session state on logout"""
    st.session_state.logged_in = False
    st.session_state.current_user = None
    st.session_state.user_id = None
    st.session_state.selected_business = None
    st.session_state.businesses = []
    st.session_state.sources = []
    st.session_state.jobs = []
    st.session_state.reviews = []
    st.session_state.selected_source_for_jobs = None
    st.session_state.selected_job_for_reviews = None
    st.session_state.selected_source_for_reviews = None
    st.session_state.active_tab = "Sources"

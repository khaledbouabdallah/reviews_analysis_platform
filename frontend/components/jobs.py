import streamlit as st
from utils import get_api_client, get_item_id, format_date


def jobs_page():
    """Job management page for selected business"""
    st.header("🔄 Jobs")
    
    if not st.session_state.selected_business:
        st.error("No business selected")
        return
    
    business = st.session_state.selected_business
    st.write(f"Managing scraping jobs for **{business.get('name')}**")
    
    # This will be implemented in Step 4
    st.info("🚧 Job management will be implemented in Step 4")
    
    # Placeholder for future implementation
    st.markdown("""
    **Coming soon:**
    - Create new scraping jobs
    - Monitor job status (pending, running, completed, failed)
    - View job results
    - Restart failed jobs
    - Job scheduling
    """)


def create_job_form():
    """Form to create a new scraping job (placeholder)"""
    # This will be implemented in Step 4
    pass


def job_list():
    """Display list of jobs with status (placeholder)"""
    # This will be implemented in Step 4
    pass


def job_status_monitor():
    """Monitor job execution status (placeholder)"""
    # This will be implemented in Step 4
    pass

import streamlit as st
from utils import get_api_client, get_item_id, format_date


def sources_page():
    """Source management page for selected business"""
    st.header("📁 Sources")
    
    if not st.session_state.selected_business:
        st.error("No business selected")
        return
    
    business = st.session_state.selected_business
    st.write(f"Managing sources for **{business.get('name')}**")
    
    # This will be implemented in Step 3
    st.info("🚧 Source management will be implemented in Step 3")
    
    # Placeholder for future implementation
    st.markdown("""
    **Coming soon:**
    - Create new sources (Google Maps, CSV, etc.)
    - Edit source details
    - Delete sources
    - View source statistics
    """)


def create_source_form():
    """Form to create a new source (placeholder)"""
    # This will be implemented in Step 3
    pass


def source_list():
    """Display list of sources (placeholder)"""
    # This will be implemented in Step 3
    pass
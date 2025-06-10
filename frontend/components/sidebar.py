import streamlit as st
from utils import get_api_client, clear_session_state


def sidebar_navigation():
    """Sidebar for navigation and business selection"""
    api_client = get_api_client()
    
    with st.sidebar:
        st.title("📊 Reviews Platform")
        
        # User info
        st.write(f"👤 **{st.session_state.current_user['username']}**")
        
        if st.button("🚪 Logout", use_container_width=True):
            clear_session_state()
            st.success("Logged out successfully!")
            st.rerun()
        
        st.markdown("---")
        
        # Load businesses if not loaded
        if not st.session_state.businesses:
            _load_user_businesses(api_client)
        
        # Business selection
        st.subheader("🏢 Select Business")
        
        if st.session_state.businesses:
            business_names = ["None"] + [b.get('name', 'Unnamed') for b in st.session_state.businesses]
            current_selection = "None"
            
            if st.session_state.selected_business:
                current_name = st.session_state.selected_business.get('name', 'Unnamed')
                if current_name in business_names:
                    current_selection = current_name
            
            selected_name = st.selectbox(
                "Choose a business:",
                business_names,
                index=business_names.index(current_selection),
                key="business_selector"
            )
            
            if selected_name == "None":
                st.session_state.selected_business = None
            else:
                # Find the selected business
                for business in st.session_state.businesses:
                    if business.get('name') == selected_name:
                        st.session_state.selected_business = business
                        break
        else:
            st.info("No businesses found")
        
        # Quick actions
        st.markdown("---")
        st.subheader("⚡ Quick Actions")
        
        if st.button("➕ New Business", use_container_width=True):
            st.session_state.selected_business = None
            st.rerun()
        
        if st.button("🔄 Refresh Data", use_container_width=True):
            _load_user_businesses(api_client)
            st.rerun()


def _load_user_businesses(api_client):
    """Load businesses for the current user"""
    try:
        businesses = api_client.get_businesses_by_user(st.session_state.user_id)
        st.session_state.businesses = businesses if isinstance(businesses, list) else []
    except Exception as e:
        st.error(f"Failed to load businesses: {str(e)}")
        st.session_state.businesses = []
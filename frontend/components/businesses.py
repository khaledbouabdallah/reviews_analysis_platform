import streamlit as st
from utils import get_api_client, get_item_id, format_date


def create_business_form():
    """Form to create a new business"""
    st.subheader("➕ Create New Business")

    api_client = get_api_client()

    with st.form("create_business_form"):
        business_name = st.text_input(
            "Business Name", placeholder="Enter business name..."
        )
        submit_button = st.form_submit_button("Create Business")

        if submit_button:
            if not business_name or not business_name.strip():
                st.error("Business name cannot be empty")
                return

            try:
                new_business = api_client.create_business(
                    st.session_state.user_id, business_name.strip()
                )
                st.success(f"Business '{business_name}' created successfully!")
                # Reload businesses
                _load_user_businesses(api_client)
                st.rerun()

            except Exception as e:
                st.error(f"Failed to create business: {str(e)}")


def business_management_page():
    """Page for managing businesses when no business is selected"""
    st.title("Business Management")

    api_client = get_api_client()

    # Refresh businesses button
    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("🔄 Refresh"):
            _load_user_businesses(api_client)
            st.rerun()

    # Create new business form
    create_business_form()

    st.markdown("---")

    # List existing businesses
    st.subheader("Your Businesses")

    if not st.session_state.businesses:
        st.info("You don't have any businesses yet. Create one above to get started!")
        return

    # Display businesses in a grid
    cols = st.columns(2)
    for idx, business in enumerate(st.session_state.businesses):
        with cols[idx % 2]:
            _render_business_card(business, api_client)


def business_context_page():
    """Main page when a business is selected"""
    from components.sources import sources_page
    from components.jobs import jobs_page
    from components.reviews import reviews_page

    business = st.session_state.selected_business
    st.title(f"📊 {business.get('name', 'Business Dashboard')}")

    # Business info header
    col1, col2, col3 = st.columns([2, 1, 1])
    with col1:
        st.write(f"**Business ID:** {get_item_id(business)}")
    with col2:
        st.write(f"**Created:** {format_date(business.get('created_at'))}")
    with col3:
        if st.button("📝 Edit Business"):
            st.session_state.selected_business = None
            st.rerun()

    st.markdown("---")

    # Context-aware tabs with active tab tracking
    active_tab = st.session_state.get("active_tab", "Sources")

    tab1, tab2, tab3 = st.tabs(["📁 Sources", "🔄 Jobs", "⭐ Reviews"])

    with tab1:
        if active_tab != "Sources":
            st.session_state.active_tab = "Sources"
        sources_page()

    with tab2:
        if active_tab != "Jobs":
            st.session_state.active_tab = "Jobs"
        jobs_page()

    with tab3:
        if active_tab != "Reviews":
            st.session_state.active_tab = "Reviews"
        reviews_page()


def _render_business_card(business, api_client):
    """Render a single business card with actions"""
    with st.container():
        st.markdown(f"### {business.get('name', 'Unnamed Business')}")

        business_id = get_item_id(business)
        created_date = format_date(business.get("created_at"))

        st.write(f"**Created:** {created_date}")
        st.write(f"**ID:** {business_id}")

        # Action buttons
        button_col1, button_col2, button_col3 = st.columns(3)

        with button_col1:
            if st.button("📂 Select", key=f"select_{business_id}"):
                st.session_state.selected_business = business
                st.rerun()

        with button_col2:
            if st.button("✏️ Edit", key=f"edit_{business_id}"):
                st.session_state[f"editing_{business_id}"] = True
                st.rerun()

        with button_col3:
            if st.button("🗑️ Delete", key=f"delete_{business_id}"):
                st.session_state[f"confirm_delete_{business_id}"] = True
                st.rerun()

        # Edit form (if in edit mode)
        if st.session_state.get(f"editing_{business_id}", False):
            _render_edit_form(business, business_id, api_client)

        # Delete confirmation (if in delete mode)
        if st.session_state.get(f"confirm_delete_{business_id}", False):
            _render_delete_confirmation(business, business_id, api_client)

        st.markdown("---")


def _render_edit_form(business, business_id, api_client):
    """Render edit form for a business"""
    with st.form(f"edit_business_form_{business_id}"):
        new_name = st.text_input("New Business Name", value=business.get("name", ""))
        col1, col2 = st.columns(2)

        with col1:
            if st.form_submit_button("💾 Save"):
                try:
                    api_client.update_business(business_id, new_name)
                    st.success("Business updated successfully!")
                    st.session_state[f"editing_{business_id}"] = False
                    _load_user_businesses(api_client)
                    st.rerun()
                except Exception as e:
                    st.error(f"Failed to update business: {str(e)}")

        with col2:
            if st.form_submit_button("❌ Cancel"):
                st.session_state[f"editing_{business_id}"] = False
                st.rerun()


def _render_delete_confirmation(business, business_id, api_client):
    """Render delete confirmation for a business"""
    st.warning(f"Are you sure you want to delete '{business.get('name')}'?")
    col1, col2 = st.columns(2)

    with col1:
        if st.button("✅ Yes, Delete", key=f"confirm_yes_{business_id}"):
            try:
                api_client.delete_business(business_id)
                st.success("Business deleted successfully!")
                st.session_state[f"confirm_delete_{business_id}"] = False
                _load_user_businesses(api_client)
                st.rerun()
            except Exception as e:
                st.error(f"Failed to delete business: {str(e)}")

    with col2:
        if st.button("❌ Cancel", key=f"confirm_no_{business_id}"):
            st.session_state[f"confirm_delete_{business_id}"] = False
            st.rerun()


def _load_user_businesses(api_client):
    """Load businesses for the current user"""
    try:
        businesses = api_client.get_businesses_by_user(st.session_state.user_id)
        st.session_state.businesses = businesses if isinstance(businesses, list) else []
    except Exception as e:
        st.error(f"Failed to load businesses: {str(e)}")
        st.session_state.businesses = []

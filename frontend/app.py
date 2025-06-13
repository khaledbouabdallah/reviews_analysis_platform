import streamlit as st
from config import APP_TITLE, APP_ICON, LAYOUT, DEVELOPER, LOGGER
from utils import init_session_state

from components import (
    login_form,
    register_form,
    sidebar_navigation,
    business_management_page,
    business_context_page,
)


def main():
    """Main application entry point"""
    st.set_page_config(page_title=APP_TITLE, page_icon=APP_ICON, layout=LAYOUT)

    LOGGER.info("Starting application: %s", APP_TITLE)

    # Initialize session state
    init_session_state()

    # Check if user is logged in
    if not st.session_state.logged_in:
        # Show login/register interface
        _show_auth_interface()
    else:
        # Show main application
        _show_main_application()


def _show_auth_interface():
    """Show authentication interface for non-logged in users"""
    st.title(APP_TITLE)
    st.markdown(
        f"Welcome to the {APP_TITLE}. Please login or create an account to continue."
    )

    # Login/Register tabs
    tab1, tab2 = st.tabs(["Login", "Register"])

    with tab1:
        login_form()

    with tab2:
        register_form()

    # Footer
    st.markdown("---")
    st.markdown(f"*Developed by {DEVELOPER}*")


def _show_main_application():
    """Show main application for logged-in users"""
    # Sidebar navigation
    sidebar_navigation()

    # Main content area
    if st.session_state.selected_business is None:
        # No business selected - show business management
        business_management_page()
    else:
        # Business selected - show business context page
        business_context_page()


if __name__ == "__main__":
    main()

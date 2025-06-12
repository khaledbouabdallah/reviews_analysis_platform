import streamlit as st
from utils import get_api_client, get_item_id, format_date
from config import LOGGER



def sources_page():
    """Source management page for selected business"""
    st.header("📁 Sources")
    
    if not st.session_state.selected_business:
        st.error("No business selected")
        return
    
    business = st.session_state.selected_business
    business_id = get_item_id(business)
    
    st.write(f"Managing sources for **{business.get('name')}**")
    
    # Load sources for this business
    if not st.session_state.sources or st.session_state.get('current_business_id') != business_id:
        _load_business_sources(business_id)
        st.session_state.current_business_id = business_id
    
    # Refresh button
    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("🔄 Refresh Sources"):
            LOGGER.info("Refreshing sources for business %s", business_id)
            _load_business_sources(business_id)
            st.rerun()
    
    # Create new source form
    create_source_form(business_id)
    
    st.markdown("---")
    
    # Display existing sources
    display_sources_list()


def create_source_form(business_id: str):
    """Form to create a new source"""
    st.subheader("➕ Create New Source")
    
    api_client = get_api_client()
    
    with st.form("create_source_form"):
        col1, col2 = st.columns(2)
        
        with col1:
            source_name = st.text_input(
                "Source Name", 
                placeholder="e.g., 'Main Location Google Reviews'"
            )
        
        with col2:
            source_type = st.selectbox(
                "Source Type",
                ["google", "csv"],
                format_func=lambda x: {"google": "Google Maps Reviews", "csv": "CSV File"}[x]
            )
        
        # Help text for different source types
        if source_type == "google":
            st.info("💡 **Google Maps**: For scraping reviews from Google Maps business listings")
        else:
            st.info("💡 **CSV**: For uploading review data from spreadsheet files")
        
        submit_button = st.form_submit_button("Create Source")
        
        if submit_button:
            if not source_name or not source_name.strip():
                st.error("Source name cannot be empty")
                return
                
            try:
                new_source = api_client.create_source(
                    user_id=st.session_state.user_id,
                    business_id=business_id,
                    name=source_name.strip(),
                    source_type=source_type
                )
                st.success(f"Source '{source_name}' created successfully!")
                _load_business_sources(business_id)
                st.rerun()
                
            except Exception as e:
                st.error(f"Failed to create source: {str(e)}")


def display_sources_list():
    """Display list of sources for the current business"""
    st.subheader("Your Sources")
    
    if not st.session_state.sources:
        st.info("No sources created yet. Create one above to get started!")
        return
    
    # Display sources in a grid
    cols = st.columns(2)
    for idx, source in enumerate(st.session_state.sources):
        with cols[idx % 2]:
            _render_source_card(source)


def _render_source_card(source):
    """Render a single source card with actions"""
    api_client = get_api_client()
    
    with st.container():
        # Source header with type icon
        source_type = source.get('type', 'unknown')
        type_icon = {"google": "🗺️", "csv": "📄"}.get(source_type, "❓")
        type_name = {"google": "Google Maps", "csv": "CSV File"}.get(source_type, source_type)
        
        st.markdown(f"### {type_icon} {source.get('name', 'Unnamed Source')}")
        
        source_id = get_item_id(source)
        created_date = format_date(source.get('created_at'))
        
        # Source details
        col1, col2 = st.columns(2)
        with col1:
            st.write(f"**Type:** {type_name}")
            st.write(f"**Created:** {created_date}")
        with col2:
            st.write(f"**ID:** {source_id}")
            # TODO: Add job count and review count when those features are implemented
            st.write(f"**Status:** Active")
        
        # Action buttons
        button_col1, button_col2, button_col3, button_col4 = st.columns(4)
        
        with button_col1:
            if st.button("🔄 Jobs", key=f"jobs_{source_id}"):
                st.info("Job management will be available in Step 4")
        
        with button_col2:
            if st.button("✏️ Edit", key=f"edit_{source_id}"):
                st.session_state[f"editing_{source_id}"] = True
                st.rerun()
        
        with button_col3:
            if st.button("📊 Stats", key=f"stats_{source_id}"):
                _show_source_stats(source)
        
        with button_col4:
            if st.button("🗑️ Delete", key=f"delete_{source_id}"):
                st.session_state[f"confirm_delete_{source_id}"] = True
                st.rerun()
        
        # Edit form (if in edit mode)
        if st.session_state.get(f"editing_{source_id}", False):
            _render_edit_source_form(source, source_id, api_client)
        
        # Delete confirmation (if in delete mode)
        if st.session_state.get(f"confirm_delete_{source_id}", False):
            _render_delete_source_confirmation(source, source_id, api_client)
        
        # Source stats (if in stats mode)
        if st.session_state.get(f"show_stats_{source_id}", False):
            _render_source_statistics(source)
        
        st.markdown("---")


def _render_edit_source_form(source, source_id, api_client):
    """Render edit form for a source"""
    with st.form(f"edit_source_form_{source_id}"):
        col1, col2 = st.columns(2)
        
        with col1:
            new_name = st.text_input("Source Name", value=source.get('name', ''))
        
        with col2:
            new_type = st.selectbox(
                "Source Type",
                ["google", "csv"],
                index=["google", "csv"].index(source.get('type', 'google')),
                format_func=lambda x: {"google": "Google Maps Reviews", "csv": "CSV File"}[x]
            )
        
        button_col1, button_col2 = st.columns(2)
        
        with button_col1:
            if st.form_submit_button("💾 Save Changes"):
                try:
                    api_client.update_source(source_id, new_name, new_type)
                    st.success("Source updated successfully!")
                    st.session_state[f"editing_{source_id}"] = False
                    _load_business_sources(st.session_state.current_business_id)
                    st.rerun()
                except Exception as e:
                    st.error(f"Failed to update source: {str(e)}")
        
        with button_col2:
            if st.form_submit_button("❌ Cancel"):
                st.session_state[f"editing_{source_id}"] = False
                st.rerun()


def _render_delete_source_confirmation(source, source_id, api_client):
    """Render delete confirmation for a source"""
    st.warning(f"⚠️ Are you sure you want to delete '{source.get('name')}'?")
    st.write("This will also delete all associated jobs and reviews.")
    
    col1, col2 = st.columns(2)
    
    with col1:
        if st.button("✅ Yes, Delete", key=f"confirm_yes_{source_id}"):
            try:
                api_client.delete_source(source_id)
                st.success("Source deleted successfully!")
                st.session_state[f"confirm_delete_{source_id}"] = False
                _load_business_sources(st.session_state.current_business_id)
                st.rerun()
            except Exception as e:
                st.error(f"Failed to delete source: {str(e)}")
    
    with col2:
        if st.button("❌ Cancel", key=f"confirm_no_{source_id}"):
            st.session_state[f"confirm_delete_{source_id}"] = False
            st.rerun()


def _show_source_stats(source):
    """Show source statistics"""
    source_id = get_item_id(source)
    if st.session_state.get(f"show_stats_{source_id}", False):
        st.session_state[f"show_stats_{source_id}"] = False
    else:
        st.session_state[f"show_stats_{source_id}"] = True
    st.rerun()


def _render_source_statistics(source):
    """Render detailed source statistics"""
    st.markdown("#### 📊 Source Statistics")
    
    # Mock statistics for now - will be real data in later steps
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total Jobs", "0", help="Scraping jobs created")
    
    with col2:
        st.metric("Total Reviews", "0", help="Reviews collected")
    
    with col3:
        st.metric("Success Rate", "0%", help="Successful job completion rate")
    
    with col4:
        st.metric("Last Activity", "Never", help="Last scraping activity")
    
    st.info("📋 **Note**: Statistics will be populated when jobs and reviews are implemented in Steps 4 & 5")
    
    if st.button("❌ Close Stats", key=f"close_stats_{get_item_id(source)}"):
        st.session_state[f"show_stats_{get_item_id(source)}"] = False
        st.rerun()


def _load_business_sources(business_id: str):
    """Load sources for the current business"""
    api_client = get_api_client()
    
    try:
        sources = api_client.get_sources_by_business(business_id)
        LOGGER.info(f"Loaded sources for business {business_id}: {sources}")
        st.session_state.sources = sources if isinstance(sources, list) else []
    except Exception as e:
        st.error(f"Failed to load sources: {str(e)}")
        st.session_state.sources = []
import streamlit as st
from utils import get_api_client, get_item_id, format_date


def jobs_page():
    """Job management page for selected business"""
    st.header("🔄 Jobs")

    if not st.session_state.selected_business:
        st.error("No business selected")
        return

    business = st.session_state.selected_business
    business_id = get_item_id(business)

    st.write(f"Managing scraping jobs for **{business.get('name')}**")

    # Check if filtering by specific source
    selected_source_id = st.session_state.get("selected_source_for_jobs")
    if selected_source_id:
        source_name = _get_source_name(selected_source_id)
        st.info(f"🔍 **Filtered by source:** {source_name}")

        col1, col2 = st.columns([1, 4])
        with col1:
            if st.button("❌ Clear Filter"):
                st.session_state.selected_source_for_jobs = None
                st.rerun()

    # Load jobs for this business if not loaded
    if (
        not st.session_state.jobs
        or st.session_state.get("current_business_id") != business_id
    ):
        _load_business_jobs(business_id)
        st.session_state.current_business_id = business_id

    # Refresh button
    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("🔄 Refresh Jobs"):
            _load_business_jobs(business_id)
            st.rerun()

    # Create new job form
    create_job_form(business_id)

    st.markdown("---")

    # Display existing jobs
    display_jobs_list()


def create_job_form(business_id: str):
    """Form to create a new scraping job"""
    st.subheader("➕ Create New Scraping Job")

    api_client = get_api_client()

    # Get sources for this business for the dropdown
    sources = [
        s
        for s in st.session_state.sources
        if get_item_id(s) in [get_item_id(s) for s in st.session_state.sources]
    ]
    google_sources = [s for s in sources if s.get("type") == "google"]

    if not google_sources:
        st.warning(
            "⚠️ No Google Maps sources available. Create a Google Maps source first to enable job creation."
        )
        return

    with st.form("create_job_form"):
        col1, col2 = st.columns(2)

        with col1:
            selected_source = st.selectbox(
                "Select Source",
                google_sources,
                format_func=lambda x: x.get("name", "Unnamed Source"),
            )

        with col2:
            job_name = st.text_input(
                "Job Name (Optional)", placeholder="e.g., 'June 2025 Review Scrape'"
            )

        google_maps_url = st.text_input(
            "Google Maps URL",
            placeholder="https://www.google.com/maps/place/...",
            help="Paste the Google Maps URL of the business you want to scrape reviews from",
        )

        # URL validation help
        if google_maps_url:
            if _is_valid_google_maps_url(google_maps_url):
                st.success("✅ Valid Google Maps URL detected")
            else:
                st.error(
                    "❌ Invalid Google Maps URL. Make sure it's a Google Maps business page URL."
                )

        submit_button = st.form_submit_button("🚀 Start Scraping Job")

        if submit_button:
            if not google_maps_url or not google_maps_url.strip():
                st.error("Google Maps URL is required")
                return

            if not _is_valid_google_maps_url(google_maps_url):
                st.error("Please provide a valid Google Maps URL")
                return

            try:
                source_id = get_item_id(selected_source)

                new_job = api_client.create_job(
                    user_id=st.session_state.user_id,
                    business_id=business_id,
                    source_id=source_id,
                    url=google_maps_url.strip(),
                    source_type="google",
                    name=job_name.strip() if job_name.strip() else None,
                )
                st.success(
                    f"Scraping job created successfully! Status: {new_job.get('status', 'pending')}"
                )
                _load_business_jobs(business_id)
                st.rerun()

            except Exception as e:
                st.error(f"Failed to create job: {str(e)}")


def display_jobs_list():
    """Display list of jobs for the current business"""
    st.subheader("Your Scraping Jobs")

    if not st.session_state.jobs:
        st.info("No scraping jobs created yet. Create one above to get started!")
        return

    # Filter jobs by selected source if applicable
    selected_source_id = st.session_state.get("selected_source_for_jobs")
    if selected_source_id:
        business_jobs = [
            job
            for job in st.session_state.jobs
            if job.get("source_id") == selected_source_id
        ]
        if not business_jobs:
            source_name = _get_source_name(selected_source_id)
            st.info(f"No jobs found for source '{source_name}'. Create one above!")
            return
    else:
        business_jobs = [job for job in st.session_state.jobs]

    # Sort jobs (newest first)
    business_jobs.sort(key=lambda x: x.get("created_at", ""), reverse=True)

    # Show job count
    total_jobs = len(st.session_state.jobs)
    filtered_jobs = len(business_jobs)

    if selected_source_id and total_jobs != filtered_jobs:
        st.write(f"Showing {filtered_jobs} of {total_jobs} jobs")
    else:
        st.write(f"Total jobs: {total_jobs}")

    # Display jobs
    for job in business_jobs:
        _render_job_card(job)


def _render_job_card(job):
    """Render a single job card with status and actions"""
    api_client = get_api_client()
    job_id = get_item_id(job)

    with st.container():
        # Job header with status
        status = job.get("status", "unknown")
        status_color, status_icon = _get_status_display(status)

        col1, col2 = st.columns([3, 1])
        with col1:
            job_name = job.get("name") or f"Job {job_id[:8]}"
            st.markdown(f"### {status_icon} {job_name}")
        with col2:
            st.markdown(
                f"<span style='color: {status_color}; font-weight: bold;'>{status.upper()}</span>",
                unsafe_allow_html=True,
            )

        # Job details
        col1, col2, col3 = st.columns(3)

        with col1:
            st.write(f"**Created:** {format_date(job.get('created_at'))}")
            st.write(f"**Source:** {_get_source_name(job.get('source_id'))}")

        with col2:
            if job.get("started_at"):
                st.write(f"**Started:** {format_date(job.get('started_at'))}")
            if job.get("ended_at"):
                st.write(f"**Ended:** {format_date(job.get('ended_at'))}")

        with col3:
            total_reviews = job.get("total_reviews", 0)
            reviews_scraped = job.get("reviews_scraped", 0)
            st.write(f"**Total Reviews:** {total_reviews}")
            st.write(f"**Scraped:** {reviews_scraped}")

        # URL display (truncated)
        job_url = job.get("url", "")
        if job_url:
            truncated_url = job_url[:50] + "..." if len(job_url) > 50 else job_url
            st.write(f"**URL:** {truncated_url}")

        # Error display
        if job.get("error"):
            st.error(f"**Error:** {job.get('error')}")

        # Action buttons
        button_col1, button_col2, button_col3, button_col4, button_col5 = st.columns(5)

        with button_col1:
            if st.button("📊 Details", key=f"details_{job_id}"):
                _toggle_job_details(job_id)

        with button_col2:
            if status in ["completed"] and reviews_scraped > 0:
                if st.button("⭐ Reviews", key=f"reviews_{job_id}"):
                    # Set the selected job for review filtering and switch to Reviews tab
                    st.session_state.selected_job_for_reviews = job_id
                    st.session_state.active_tab = "Reviews"
                    st.rerun()

        with button_col3:
            # New Analysis button
            if status in ["completed"] and reviews_scraped > 0:
                if st.button("🔬 Analyze", key=f"analyze_{job_id}"):
                    st.session_state[f"show_analysis_{job_id}"] = True
                    st.rerun()

        with button_col4:
            if status in ["failed"]:
                if st.button("🔄 Retry", key=f"retry_{job_id}"):
                    st.info("Job retry functionality coming soon")

        with button_col5:
            if st.button("🗑️ Delete", key=f"delete_{job_id}"):
                st.session_state[f"confirm_delete_{job_id}"] = True
                st.rerun()

        # Show analysis options if toggled
        if st.session_state.get(f"show_analysis_{job_id}", False):
            _render_analysis_options(job, job_id, api_client)

        # Show detailed job info if toggled
        if st.session_state.get(f"show_details_{job_id}", False):
            _render_job_details(job)

        # Delete confirmation
        if st.session_state.get(f"confirm_delete_{job_id}", False):
            _render_delete_job_confirmation(job, job_id, api_client)

        st.markdown("---")


def _render_analysis_options(job, job_id, api_client):
    """Render analysis options for a job"""
    st.markdown("#### 🔬 Analysis Options")

    col1, col2, col3 = st.columns(3)

    with col1:
        if st.button("🧪 Run Basic Analysis", key=f"run_analysis_{job_id}"):
            with st.spinner("Running sentiment and language analysis..."):
                try:
                    response = api_client.analyze_job_reviews(job_id)
                    if response.get("count"):
                        st.success(
                            f"✅ Successfully analyzed {response['count']} reviews!"
                        )
                        st.info(
                            "Analysis results have been saved. View them in the Reviews tab."
                        )
                    else:
                        st.warning("Some reviews could not be analyzed.")
                except Exception as e:
                    st.error(f"Failed to analyze reviews: {str(e)}")

    with col2:
        if st.button("📝 Generate Summary", key=f"generate_summary_{job_id}"):
            with st.spinner("Generating review summary..."):
                try:
                    response = api_client.summarize_job_reviews(job_id)
                    if response.get("summary"):
                        st.session_state[f"job_summary_{job_id}"] = response["summary"]
                        st.success("✅ Summary generated successfully!")
                    else:
                        st.error("Failed to generate summary")
                except Exception as e:
                    st.error(f"Failed to generate summary: {str(e)}")

    with col3:
        if st.button("❌ Close", key=f"close_analysis_{job_id}"):
            st.session_state[f"show_analysis_{job_id}"] = False
            st.session_state.pop(f"job_summary_{job_id}", None)
            st.rerun()

    # Display summary if available
    if st.session_state.get(f"job_summary_{job_id}"):
        st.markdown("#### 📋 Review Summary")
        st.info(st.session_state[f"job_summary_{job_id}"])

        # Download button for summary
        st.download_button(
            label="📥 Download Summary",
            data=st.session_state[f"job_summary_{job_id}"],
            file_name=f"summary_{job.get('name', job_id)}.txt",
            mime="text/plain",
            key=f"download_summary_{job_id}",
        )


def _render_job_details(job):
    """Render detailed job information"""
    st.markdown("#### 📋 Job Details")

    col1, col2 = st.columns(2)

    with col1:
        st.write(f"**Job ID:** {get_item_id(job)}")
        st.write(f"**Source Type:** {job.get('source_type', 'unknown')}")
        st.write(f"**Status:** {job.get('status', 'unknown')}")

    with col2:
        if job.get("total_reviews"):
            completion = (
                job.get("reviews_scraped", 0) / job.get("total_reviews", 1)
            ) * 100
            st.write(f"**Progress:** {completion:.1f}%")

        duration = _calculate_job_duration(job)
        if duration:
            st.write(f"**Duration:** {duration}")

    # Full URL
    if job.get("url"):
        st.write(f"**Full URL:** {job.get('url')}")

    if st.button("❌ Close Details", key=f"close_details_{get_item_id(job)}"):
        st.session_state[f"show_details_{get_item_id(job)}"] = False
        st.rerun()


def _render_delete_job_confirmation(job, job_id, api_client):
    """Render delete confirmation for a job"""
    job_name = job.get("name") or f"Job {job_id[:8]}"
    st.warning(f"⚠️ Are you sure you want to delete '{job_name}'?")

    col1, col2 = st.columns(2)

    with col1:
        if st.button("✅ Yes, Delete", key=f"confirm_yes_{job_id}"):
            try:
                api_client.delete_job(job_id)
                st.success("Job deleted successfully!")
                st.session_state[f"confirm_delete_{job_id}"] = False
                _load_business_jobs(st.session_state.current_business_id)
                st.rerun()
            except Exception as e:
                st.error(f"Failed to delete job: {str(e)}")

    with col2:
        if st.button("❌ Cancel", key=f"confirm_no_{job_id}"):
            st.session_state[f"confirm_delete_{job_id}"] = False
            st.rerun()


def _toggle_job_details(job_id):
    """Toggle job details display"""
    if st.session_state.get(f"show_details_{job_id}", False):
        st.session_state[f"show_details_{job_id}"] = False
    else:
        st.session_state[f"show_details_{job_id}"] = True
    st.rerun()


def _get_status_display(status):
    """Get color and icon for job status"""
    status_map = {
        "pending": ("#FFA500", "⏳"),
        "running": ("#007BFF", "⚡"),
        "completed": ("#28A745", "✅"),
        "failed": ("#DC3545", "❌"),
    }
    return status_map.get(status, ("#6C757D", "❓"))


def _get_source_name(source_id):
    """Get source name by ID"""
    for source in st.session_state.sources:
        if get_item_id(source) == source_id:
            return source.get("name", "Unknown Source")
    return "Unknown Source"


def _is_valid_google_maps_url(url):
    """Basic validation for Google Maps URLs"""
    if not url:
        return False

    # Basic Google Maps URL patterns
    google_patterns = [
        "google.com/maps",
        "maps.google.com",
        "google.fr/maps",
        "google.co.uk/maps",
    ]

    return any(pattern in url.lower() for pattern in google_patterns)


def _calculate_job_duration(job):
    """Calculate job duration if started and ended"""
    start = job.get("started_at")
    end = job.get("ended_at")

    if start and end:
        # Simple duration calculation (would need proper datetime parsing in real app)
        return "Completed"
    elif start:
        return "Running..."

    return None


def _load_business_jobs(business_id: str):
    """Load jobs for the current business"""
    api_client = get_api_client()

    try:
        jobs = api_client.get_jobs_by_business(business_id)
        st.session_state.jobs = jobs if isinstance(jobs, list) else []

        # Update job counts for sources
        job_counts = {}
        for job in st.session_state.jobs:
            source_id = job.get("source_id")
            job_counts[source_id] = job_counts.get(source_id, 0) + 1

        st.session_state.source_job_counts = job_counts

    except Exception as e:
        st.error(f"Failed to load jobs: {str(e)}")
        st.session_state.jobs = []
        st.session_state.source_job_counts = {}

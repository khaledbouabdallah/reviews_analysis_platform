import streamlit as st
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
from utils import get_api_client, get_item_id, format_date
from collections import Counter
import json


def reviews_page():
    """Review visualization page for selected business"""
    st.header("⭐ Reviews")
    
    if not st.session_state.selected_business:
        st.error("No business selected")
        return
    
    business = st.session_state.selected_business
    business_id = get_item_id(business)
    
    st.write(f"Analyzing reviews for **{business.get('name')}**")
    
    # Load reviews for this business if not loaded
    if not st.session_state.get('reviews') or st.session_state.get('current_business_id') != business_id:
        _load_business_reviews(business_id)
        st.session_state.current_business_id = business_id
    
    # Check if filtering by specific job/source
    selected_job_id = st.session_state.get('selected_job_for_reviews')
    selected_source_id = st.session_state.get('selected_source_for_reviews')
    
    # Display filter info and controls
    _display_filter_controls(selected_job_id, selected_source_id)
    
    # Refresh button
    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("🔄 Refresh Reviews"):
            _load_business_reviews(business_id)
            st.rerun()
    
    # Display reviews if available
    reviews = st.session_state.get('reviews', [])
    if not reviews:
        st.info("No reviews found. Complete some scraping jobs to see reviews here!")
        return
    
    # Filter reviews based on selection
    filtered_reviews = _filter_reviews(reviews, selected_job_id, selected_source_id)
    
    if not filtered_reviews:
        st.info("No reviews match the current filter. Try clearing the filter or checking other sources/jobs.")
        return
    
    # Display review analytics
    _display_review_analytics(filtered_reviews)
    
    st.markdown("---")
    
    # Display individual reviews
    _display_reviews_list(filtered_reviews)


def _display_filter_controls(selected_job_id, selected_source_id):
    """Display filter controls and current filter status"""
    filters_active = selected_job_id or selected_source_id
    
    if filters_active:
        st.info("🔍 **Active Filters:**")
        
        if selected_job_id:
            job_name = _get_job_name(selected_job_id)
            st.write(f"• **Job:** {job_name}")
        
        if selected_source_id:
            source_name = _get_source_name(selected_source_id)
            st.write(f"• **Source:** {source_name}")
        
        col1, col2 = st.columns([1, 4])
        with col1:
            if st.button("❌ Clear All Filters"):
                st.session_state.selected_job_for_reviews = None
                st.session_state.selected_source_for_reviews = None
                st.rerun()


def _display_review_analytics(reviews):
    """Display review analytics and charts"""
    st.subheader("📊 Review Analytics")
    
    # Basic metrics
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.metric("Total Reviews", len(reviews))
    
    with col2:
        # Calculate average rating
        ratings = _extract_ratings(reviews)
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        st.metric("Average Rating", f"{avg_rating:.1f} ⭐")
    
    with col3:
        # Count unique sources
        sources = set(review.get('source_id') for review in reviews)
        st.metric("Sources", len(sources))
    
    with col4:
        # Count unique jobs
        jobs = set(review.get('job_id') for review in reviews)
        st.metric("Jobs", len(jobs))
    
    # Charts
    col1, col2 = st.columns(2)
    
    with col1:
        _display_rating_distribution(reviews)
    
    with col2:
        _display_reviews_by_source(reviews)


def _display_rating_distribution(reviews):
    """Display rating distribution chart"""
    st.markdown("#### 📈 Rating Distribution")
    
    ratings = _extract_ratings(reviews)
    if not ratings:
        st.info("No rating data available")
        return
    
    # Count ratings
    rating_counts = Counter(ratings)
    
    # Create bar chart
    fig = go.Figure(data=[
        go.Bar(
            x=list(range(1, 6)),
            y=[rating_counts.get(i, 0) for i in range(1, 6)],
            marker_color=['#ff4444', '#ff8800', '#ffaa00', '#88dd00', '#00dd44']
        )
    ])
    
    fig.update_layout(
        xaxis_title="Rating (Stars)",
        yaxis_title="Number of Reviews",
        height=300,
        showlegend=False
    )
    
    st.plotly_chart(fig, use_container_width=True)


def _display_reviews_by_source(reviews):
    """Display reviews count by source"""
    st.markdown("#### 📁 Reviews by Source")
    
    # Count reviews per source
    source_counts = Counter(review.get('source_id') for review in reviews)
    
    if not source_counts:
        st.info("No source data available")
        return
    
    # Get source names
    source_names = []
    counts = []
    for source_id, count in source_counts.items():
        source_names.append(_get_source_name(source_id))
        counts.append(count)
    
    # Create pie chart
    fig = go.Figure(data=[go.Pie(
        labels=source_names,
        values=counts,
        hole=0.3
    )])
    
    fig.update_layout(height=300)
    st.plotly_chart(fig, use_container_width=True)


def _display_reviews_list(reviews):
    """Display list of individual reviews"""
    st.subheader("📝 Individual Reviews")
    
    # Sort options
    col1, col2, col3 = st.columns([2, 2, 2])
    
    with col1:
        sort_by = st.selectbox(
            "Sort by:",
            ["Newest First", "Oldest First", "Highest Rating", "Lowest Rating"],
            key="review_sort"
        )
    
    with col2:
        show_count = st.selectbox(
            "Show:",
            [10, 25, 50, 100, "All"],
            key="review_count"
        )
    
    with col3:
        if st.button("📥 Export Reviews"):
            _export_reviews(reviews)
    
    # Sort reviews
    sorted_reviews = _sort_reviews(reviews, sort_by)
    
    # Limit reviews if requested
    if show_count != "All":
        sorted_reviews = sorted_reviews[:show_count]
    
    # Display reviews
    for idx, review in enumerate(sorted_reviews, 1):
        _render_review_card(review, idx)


def _render_review_card(review, index):
    """Render a single review card"""
    with st.container():
        # Review header
        col1, col2, col3 = st.columns([2, 1, 1])
        
        with col1:
            st.markdown(f"**Review #{index}**")
        
        with col2:
            # Rating display
            rating = _extract_rating_from_review(review)
            if rating:
                stars = "⭐" * rating + "☆" * (5 - rating)
                st.write(f"**Rating:** {stars} ({rating}/5)")
        
        with col3:
            # Date
            created_date = format_date(review.get('created_at'))
            st.write(f"**Date:** {created_date}")
        
        # Review content
        review_data = review.get('data', {})
        
        # Username (if available)
        username = review_data.get('username') or review_data.get('user') or "Anonymous"
        st.write(f"**Reviewer:** {username}")
        
        # Comment/text
        comment = review_data.get('comment') or review_data.get('text') or review_data.get('review')
        if comment:
            # Limit comment length for display
            if len(comment) > 300:
                with st.expander(f"📄 Show full review ({len(comment)} characters)"):
                    st.write(comment)
                st.write(f"*{comment[:300]}...*")
            else:
                st.write(f"*{comment}*")
        else:
            st.write("*No comment text available*")
        
        # Additional data (if available)
        additional_info = []
        if review_data.get('likes'):
            additional_info.append(f"👍 {review_data['likes']} likes")
        if review_data.get('date'):
            additional_info.append(f"📅 Review date: {review_data['date']}")
        
        if additional_info:
            st.write(" • ".join(additional_info))
        
        # Source and job info
        col1, col2 = st.columns(2)
        with col1:
            source_name = _get_source_name(review.get('source_id'))
            st.write(f"**Source:** {source_name}")
        with col2:
            job_name = _get_job_name(review.get('job_id'))
            st.write(f"**Job:** {job_name}")
        
        st.markdown("---")


def _sort_reviews(reviews, sort_by):
    """Sort reviews based on selected criteria"""
    if sort_by == "Newest First":
        return sorted(reviews, key=lambda x: x.get('created_at', ''), reverse=True)
    elif sort_by == "Oldest First":
        return sorted(reviews, key=lambda x: x.get('created_at', ''))
    elif sort_by == "Highest Rating":
        return sorted(reviews, key=lambda x: _extract_rating_from_review(x), reverse=True)
    elif sort_by == "Lowest Rating":
        return sorted(reviews, key=lambda x: _extract_rating_from_review(x))
    else:
        return reviews


def _filter_reviews(reviews, selected_job_id, selected_source_id):
    """Filter reviews based on selected job or source"""
    filtered = reviews
    
    if selected_job_id:
        filtered = [r for r in filtered if r.get('job_id') == selected_job_id]
    
    if selected_source_id:
        filtered = [r for r in filtered if r.get('source_id') == selected_source_id]
    
    return filtered


def _extract_ratings(reviews):
    """Extract ratings from all reviews"""
    ratings = []
    for review in reviews:
        rating = _extract_rating_from_review(review)
        if rating:
            ratings.append(rating)
    return ratings


def _extract_rating_from_review(review):
    """Extract rating from a single review"""
    review_data = review.get('data', {})
    
    # Try different possible rating fields
    rating = review_data.get('rating') or review_data.get('stars') or review_data.get('score')
    
    if rating:
        try:
            return int(float(rating))
        except (ValueError, TypeError):
            pass
    
    return 0


def _get_source_name(source_id):
    """Get source name by ID"""
    for source in st.session_state.get('sources', []):
        if get_item_id(source) == source_id:
            return source.get('name', 'Unknown Source')
    return 'Unknown Source'


def _get_job_name(job_id):
    """Get job name by ID"""
    for job in st.session_state.get('jobs', []):
        if get_item_id(job) == job_id:
            return job.get('name') or f"Job {job_id[:8]}"
    return f"Job {job_id[:8] if job_id else 'Unknown'}"


def _export_reviews(reviews):
    """Export reviews as CSV"""
    if not reviews:
        st.warning("No reviews to export")
        return
    
    # Prepare data for export
    export_data = []
    for review in reviews:
        review_data = review.get('data', {})
        
        export_row = {
            'Review ID': get_item_id(review),
            'Source': _get_source_name(review.get('source_id')),
            'Job': _get_job_name(review.get('job_id')),
            'Date Created': review.get('created_at'),
            'Rating': _extract_rating_from_review(review),
            'Username': review_data.get('username') or review_data.get('user', ''),
            'Comment': review_data.get('comment') or review_data.get('text', ''),
            'Likes': review_data.get('likes', ''),
            'Review Date': review_data.get('date', ''),
        }
        export_data.append(export_row)
    
    # Create DataFrame
    df = pd.DataFrame(export_data)
    
    # Convert to CSV
    csv = df.to_csv(index=False)
    
    # Download button
    st.download_button(
        label="📥 Download CSV",
        data=csv,
        file_name=f"reviews_{st.session_state.selected_business.get('name', 'business')}_{format_date('')}.csv",
        mime="text/csv"
    )
    
    st.success(f"✅ Prepared {len(reviews)} reviews for download!")


def _load_business_reviews(business_id: str):
    """Load reviews for the current business"""
    api_client = get_api_client()
    
    try:
        reviews = api_client.get_reviews_by_business(business_id)
        st.session_state.reviews = reviews if isinstance(reviews, list) else []
        
    except Exception as e:
        st.error(f"Failed to load reviews: {str(e)}")
        st.session_state.reviews = []
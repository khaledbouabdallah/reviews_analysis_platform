import streamlit as st  # type: ignore
import pandas as pd
import plotly.express as px  # type: ignore
import plotly.graph_objects as go  # type: ignore
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
    if (
        not st.session_state.get("reviews")
        or st.session_state.get("current_business_id") != business_id
    ):
        _load_business_reviews(business_id)
        st.session_state.current_business_id = business_id

    # Check if filtering by specific job/source
    selected_job_id = st.session_state.get("selected_job_for_reviews")
    selected_source_id = st.session_state.get("selected_source_for_reviews")

    # Display filter info and controls
    _display_filter_controls(selected_job_id, selected_source_id)

    # Refresh button
    col1, col2 = st.columns([1, 4])
    with col1:
        if st.button("🔄 Refresh Reviews"):
            _load_business_reviews(business_id)
            st.rerun()

    # Display reviews if available
    reviews = st.session_state.get("reviews", [])
    if not reviews:
        st.info("No reviews found. Complete some scraping jobs to see reviews here!")
        return

    # Filter reviews based on selection
    filtered_reviews = _filter_reviews(reviews, selected_job_id, selected_source_id)

    if not filtered_reviews:
        st.info(
            "No reviews match the current filter. Try clearing the filter or checking other sources/jobs."
        )
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

    # Count processed vs unprocessed reviews
    processed_count = sum(1 for r in reviews if _has_processed_data(r))
    sentiment_data = _extract_sentiment_data(reviews)

    # Basic metrics
    col1, col2, col3, col4, col5 = st.columns(5)

    with col1:
        st.metric("Total Reviews", len(reviews))

    with col2:
        # Calculate average rating
        ratings = _extract_ratings(reviews)
        avg_rating = sum(ratings) / len(ratings) if ratings else 0
        st.metric("Average Rating", f"{avg_rating:.1f} ⭐")

    with col3:
        # Show processed reviews count
        st.metric(
            "Analyzed",
            f"{processed_count}/{len(reviews)}",
            help="Reviews with sentiment analysis",
        )

    with col4:
        # Average sentiment score
        avg_sentiment = sentiment_data["avg_sentiment"]
        sentiment_emoji = (
            "😊" if avg_sentiment > 0.05 else "😐" if avg_sentiment > -0.05 else "😞"
        )
        st.metric(
            "Avg Sentiment",
            f"{avg_sentiment:.2f} {sentiment_emoji}",
            help="Average compound sentiment score (-1 to 1)",
        )

    with col5:
        # Language diversity
        languages = _extract_languages(reviews)
        unique_langs = len(set(languages))
        st.metric(
            "Languages", unique_langs, help="Number of different languages detected"
        )

    # Charts
    col1, col2 = st.columns(2)

    with col1:
        _display_rating_distribution(reviews)

    with col2:
        _display_sentiment_distribution(sentiment_data)

    # Additional analytics row
    col1, col2 = st.columns(2)

    with col1:
        _display_language_distribution(reviews)

    with col2:
        _display_reviews_by_source(reviews)


def _display_sentiment_distribution(sentiment_data):
    """Display sentiment distribution chart"""
    st.markdown("#### 😊 Sentiment Distribution")

    if not sentiment_data["sentiments"]:
        st.info(
            "No sentiment analysis data available. Run analysis on jobs to see sentiment distribution."
        )
        return

    # Create pie chart for sentiment categories
    fig = go.Figure(
        data=[
            go.Pie(
                labels=["Positive", "Neutral", "Negative"],
                values=[
                    sentiment_data["positive_count"],
                    sentiment_data["neutral_count"],
                    sentiment_data["negative_count"],
                ],
                marker_colors=["#28A745", "#FFC107", "#DC3545"],
                hole=0.3,
            )
        ]
    )

    fig.update_layout(height=300)
    st.plotly_chart(fig, use_container_width=True)


def _display_language_distribution(reviews):
    """Display language distribution chart"""
    st.markdown("#### 🌐 Language Distribution")

    languages = _extract_languages(reviews)
    if not languages:
        st.info(
            "No language detection data available. Run analysis to see language distribution."
        )
        return

    # Count languages
    lang_counts = Counter(languages)

    # Map language codes to names (basic mapping)
    lang_names = {
        "en": "English",
        "es": "Spanish",
        "fr": "French",
        "de": "German",
        "it": "Italian",
        "pt": "Portuguese",
        "ar": "Arabic",
        "zh": "Chinese",
        "ja": "Japanese",
        "ko": "Korean",
        "ru": "Russian",
        "hi": "Hindi",
    }

    # Create bar chart
    labels = [lang_names.get(lang, lang) for lang in lang_counts.keys()]
    values = list(lang_counts.values())

    fig = go.Figure(data=[go.Bar(x=labels, y=values)])
    fig.update_layout(
        xaxis_title="Language", yaxis_title="Number of Reviews", height=300
    )

    st.plotly_chart(fig, use_container_width=True)


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
    fig = go.Figure(
        data=[
            go.Bar(
                x=list(range(1, 6)),
                y=[rating_counts.get(i, 0) for i in range(1, 6)],
                marker_color=["#ff4444", "#ff8800", "#ffaa00", "#88dd00", "#00dd44"],
            )
        ]
    )

    fig.update_layout(
        xaxis_title="Rating (Stars)",
        yaxis_title="Number of Reviews",
        height=300,
        showlegend=False,
    )

    st.plotly_chart(fig, use_container_width=True)


def _display_reviews_by_source(reviews):
    """Display reviews count by source"""
    st.markdown("#### 📁 Reviews by Source")

    # Count reviews per source
    source_counts = Counter(review.get("source_id") for review in reviews)

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
    fig = go.Figure(data=[go.Pie(labels=source_names, values=counts, hole=0.3)])

    fig.update_layout(height=300)
    st.plotly_chart(fig, use_container_width=True)


def _display_reviews_list(reviews):
    """Display list of individual reviews"""
    st.subheader("📝 Individual Reviews")

    # Filter options
    col1, col2, col3, col4 = st.columns(4)

    with col1:
        sort_by = st.selectbox(
            "Sort by:",
            [
                "Newest First",
                "Oldest First",
                "Highest Rating",
                "Lowest Rating",
                "Most Positive",
                "Most Negative",
            ],
            key="review_sort",
        )

    with col2:
        show_count = st.selectbox("Show:", [10, 25, 50, 100, "All"], key="review_count")

    with col3:
        filter_sentiment = st.selectbox(
            "Filter by sentiment:",
            ["All", "Positive", "Neutral", "Negative", "Not Analyzed"],
            key="sentiment_filter",
        )

    with col4:
        if st.button("📥 Export Reviews"):
            _export_reviews(reviews)

    # Apply sentiment filter
    if filter_sentiment != "All":
        reviews = _filter_by_sentiment(reviews, filter_sentiment)

    # Sort reviews
    sorted_reviews = _sort_reviews(reviews, sort_by)

    # Limit reviews if requested
    if show_count != "All":
        sorted_reviews = sorted_reviews[:show_count]

    # Display count after filtering
    if len(sorted_reviews) < len(reviews):
        st.write(f"Showing {len(sorted_reviews)} of {len(reviews)} reviews")

    # Display reviews
    for idx, review in enumerate(sorted_reviews, 1):
        _render_review_card(review, idx)


def _render_review_card(review, index):
    """Render a single review card with analysis data"""
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
            created_date = format_date(review.get("created_at"))
            st.write(f"**Date:** {created_date}")

        # Check if review has been analyzed
        processed_data = review.get("processed_data", {})
        has_analysis = (
            bool(processed_data)
            and processed_data.get("processing_status") == "completed"
        )

        # Review content section
        review_data = review.get("data", {})

        # Username (if available)
        username = review_data.get("username") or review_data.get("user") or "Anonymous"
        st.write(f"**Reviewer:** {username}")

        # Analysis badges (if available)
        if has_analysis:
            badge_cols = st.columns(6)

            # Sentiment badge
            sentiment = processed_data.get("sentiment", {}).get("sentiment", "unknown")
            sentiment_score = processed_data.get("sentiment", {}).get("compound", 0)
            sentiment_colors = {"positive": "🟢", "neutral": "🟡", "negative": "🔴"}
            with badge_cols[0]:
                st.write(
                    f"{sentiment_colors.get(sentiment, '⚪')} **{sentiment.title()}**"
                )

            # Sentiment score
            with badge_cols[1]:
                st.write(f"**Score:** {sentiment_score:.2f}")

            # Language badge
            language = processed_data.get("detected_language", "unknown")
            with badge_cols[2]:
                st.write(f"**Lang:** {language.upper()}")

            # Processing status
            with badge_cols[3]:
                st.write("✅ **Analyzed**")
        else:
            st.write("⚠️ *Not analyzed yet*")

        # Comment/text
        comment = (
            review_data.get("original")
            or review_data.get("text")
            or review_data.get("review")
        )
        if comment:
            # Show translated text if available and different from original
            if has_analysis and processed_data.get("translated_text"):
                translated = processed_data["translated_text"]
                if translated != comment:
                    tab1, tab2 = st.tabs(["Original", "Translated"])
                    with tab1:
                        _display_comment_text(comment)
                    with tab2:
                        _display_comment_text(translated)
                else:
                    _display_comment_text(comment)
            else:
                _display_comment_text(comment)
        else:
            st.write("*No comment text available*")

        # Additional review data
        additional_info = []
        if review_data.get("likes"):
            additional_info.append(f"👍 {review_data['likes']} likes")
        if review_data.get("date"):
            additional_info.append(f"📅 Review date: {review_data['date']}")

        if additional_info:
            st.write(" • ".join(additional_info))

        # Show detailed analysis if available
        if has_analysis and st.button(
            f"🔍 View Analysis Details", key=f"details_{index}_{get_item_id(review)}"
        ):
            with st.expander("Analysis Details", expanded=True):
                _display_analysis_details(processed_data)

        # Source and job info
        col1, col2 = st.columns(2)
        with col1:
            source_name = _get_source_name(review.get("source_id"))
            st.write(f"**Source:** {source_name}")
        with col2:
            job_name = _get_job_name(review.get("job_id"))
            st.write(f"**Job:** {job_name}")

        st.markdown("---")


def _display_comment_text(text):
    """Display comment text with proper formatting"""
    if len(text) > 300:
        with st.expander(f"📄 Show full review ({len(text)} characters)"):
            st.write(text)
        st.write(f"*{text[:300]}...*")
    else:
        st.write(f"*{text}*")


def _display_analysis_details(processed_data):
    """Display detailed analysis information"""
    col1, col2 = st.columns(2)

    with col1:
        st.write("**Sentiment Analysis:**")
        sentiment_data = processed_data.get("sentiment", {})
        st.write(f"- Overall: {sentiment_data.get('sentiment', 'N/A')}")
        st.write(f"- Compound Score: {sentiment_data.get('compound', 0):.3f}")
        st.write(f"- Confidence: {sentiment_data.get('confidence', 0):.3f}")

        scores = sentiment_data.get("scores", {})
        if scores:
            st.write("**Detailed Scores:**")
            st.write(f"- Positive: {scores.get('pos', 0):.3f}")
            st.write(f"- Neutral: {scores.get('neu', 0):.3f}")
            st.write(f"- Negative: {scores.get('neg', 0):.3f}")

    with col2:
        st.write("**Language Processing:**")
        st.write(
            f"- Detected Language: {processed_data.get('detected_language', 'N/A')}"
        )
        st.write(
            f"- Processed At: {format_date(processed_data.get('processed_at', ''))}"
        )

        if processed_data.get("cleaned_text"):
            st.write("**Cleaned Text Preview:**")
            cleaned = processed_data["cleaned_text"]
            st.write(f"*{cleaned[:100]}...*" if len(cleaned) > 100 else f"*{cleaned}*")


def _sort_reviews(reviews, sort_by):
    """Sort reviews based on selected criteria"""
    if sort_by == "Newest First":
        return sorted(reviews, key=lambda x: x.get("created_at", ""), reverse=True)
    elif sort_by == "Oldest First":
        return sorted(reviews, key=lambda x: x.get("created_at", ""))
    elif sort_by == "Highest Rating":
        return sorted(
            reviews, key=lambda x: _extract_rating_from_review(x), reverse=True
        )
    elif sort_by == "Lowest Rating":
        return sorted(reviews, key=lambda x: _extract_rating_from_review(x))
    elif sort_by == "Most Positive":
        return sorted(reviews, key=lambda x: _get_sentiment_score(x), reverse=True)
    elif sort_by == "Most Negative":
        return sorted(reviews, key=lambda x: _get_sentiment_score(x))
    else:
        return reviews


def _filter_reviews(reviews, selected_job_id, selected_source_id):
    """Filter reviews based on selected job or source"""
    filtered = reviews

    if selected_job_id:
        filtered = [r for r in filtered if r.get("job_id") == selected_job_id]

    if selected_source_id:
        filtered = [r for r in filtered if r.get("source_id") == selected_source_id]

    return filtered


def _filter_by_sentiment(reviews, sentiment_filter):
    """Filter reviews by sentiment category"""
    if sentiment_filter == "Not Analyzed":
        return [r for r in reviews if not _has_processed_data(r)]

    filtered = []
    for review in reviews:
        processed_data = review.get("processed_data", {})
        if processed_data and processed_data.get("processing_status") == "completed":
            review_sentiment = processed_data.get("sentiment", {}).get("sentiment", "")
            if sentiment_filter.lower() == review_sentiment:
                filtered.append(review)

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
    review_data = review.get("data", {})

    # Try different possible rating fields
    rating = (
        review_data.get("rating")
        or review_data.get("stars")
        or review_data.get("score")
    )

    if rating:
        try:
            return int(float(rating))
        except (ValueError, TypeError):
            pass

    return 0


def _extract_sentiment_data(reviews):
    """Extract sentiment analysis data from reviews"""
    sentiments = []
    positive_count = 0
    neutral_count = 0
    negative_count = 0

    for review in reviews:
        processed_data = review.get("processed_data", {})
        if processed_data and processed_data.get("processing_status") == "completed":
            sentiment_info = processed_data.get("sentiment", {})
            if sentiment_info:
                compound_score = sentiment_info.get("compound", 0)
                sentiments.append(compound_score)

                sentiment_cat = sentiment_info.get("sentiment", "")
                if sentiment_cat == "positive":
                    positive_count += 1
                elif sentiment_cat == "neutral":
                    neutral_count += 1
                elif sentiment_cat == "negative":
                    negative_count += 1

    avg_sentiment = sum(sentiments) / len(sentiments) if sentiments else 0

    return {
        "sentiments": sentiments,
        "avg_sentiment": avg_sentiment,
        "positive_count": positive_count,
        "neutral_count": neutral_count,
        "negative_count": negative_count,
    }


def _extract_languages(reviews):
    """Extract detected languages from reviews"""
    languages = []
    for review in reviews:
        processed_data = review.get("processed_data", {})
        if processed_data and processed_data.get("processing_status") == "completed":
            lang = processed_data.get("detected_language")
            if lang:
                languages.append(lang)
    return languages


def _has_processed_data(review):
    """Check if review has been processed for analysis"""
    processed_data = review.get("processed_data", {})
    return (
        bool(processed_data) and processed_data.get("processing_status") == "completed"
    )


def _get_sentiment_score(review):
    """Get sentiment compound score from review"""
    processed_data = review.get("processed_data", {})
    if processed_data and processed_data.get("processing_status") == "completed":
        return processed_data.get("sentiment", {}).get("compound", 0)
    return 0


def _get_source_name(source_id):
    """Get source name by ID"""
    for source in st.session_state.get("sources", []):
        if get_item_id(source) == source_id:
            return source.get("name", "Unknown Source")
    return "Unknown Source"


def _get_job_name(job_id):
    """Get job name by ID"""
    for job in st.session_state.get("jobs", []):
        if get_item_id(job) == job_id:
            return job.get("name") or f"Job {job_id[:8]}"
    return f"Job {job_id[:8] if job_id else 'Unknown'}"


def _export_reviews(reviews):
    """Export reviews as CSV with analysis data"""
    if not reviews:
        st.warning("No reviews to export")
        return

    # Prepare data for export
    export_data = []
    for review in reviews:
        review_data = review.get("data", {})
        processed_data = review.get("processed_data", {})

        # Extract sentiment info
        sentiment_info = processed_data.get("sentiment", {}) if processed_data else {}

        export_row = {
            "Review ID": get_item_id(review),
            "Source": _get_source_name(review.get("source_id")),
            "Job": _get_job_name(review.get("job_id")),
            "Date Created": review.get("created_at"),
            "Rating": _extract_rating_from_review(review),
            "Username": review_data.get("username") or review_data.get("user", ""),
            "Comment": review_data.get("comment") or review_data.get("text", ""),
            "Likes": review_data.get("likes", ""),
            "Review Date": review_data.get("date", ""),
            "Analyzed": "Yes" if _has_processed_data(review) else "No",
            "Sentiment": sentiment_info.get("sentiment", ""),
            "Sentiment Score": sentiment_info.get("compound", ""),
            "Detected Language": (
                processed_data.get("detected_language", "") if processed_data else ""
            ),
            "Translated Text": (
                processed_data.get("translated_text", "") if processed_data else ""
            ),
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
        mime="text/csv",
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

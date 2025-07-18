// src/app/reviews/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/auth';
import { reviewService, Review, ReviewFilters } from '@/services/review';
import { DashboardNavigation } from '@/components/dashboard/DashboardNavigation';
import { ReviewsTable } from '@/components/reviews/ReviewsTable';
import { ReviewsFilters } from '@/components/reviews/ReviewsFilters';
import { ReviewsStats } from '@/components/reviews/ReviewsStats';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import { BusinessStorageService } from '@/services/businessStorage';

export default function ReviewsPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [reviews, setReviews] = useState<Review[]>([]);
    const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [filters, setFilters] = useState<ReviewFilters>({
        job_id: searchParams.get('job_id') || '',
        source_id: '',
        location_id: '',
        sentiment: '',
        rating: '',
        date_from: '',
        date_to: '',
        search: '',
        has_comment: '',
        language: '',
        spam_status: '',
        urgency: '',
        topic: '',
        processing_status: '',
        // New analysis filters
        has_analyzed_data: '',
        sentiment_label: '',
        emotional_tone: '',
        spam_detection: '',
        urgency_level: '',
        detected_language: '',
    });

    // Load reviews
    const loadReviews = useCallback(async () => {
        try {
            setLoading(true);
            setError('');
            const data = await reviewService.getReviews(filters);
            setReviews(data);
            setFilteredReviews(data);
        } catch (err: any) {
            setError(err.message);
            console.error('Error loading reviews:', err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Authentication check
    useEffect(() => {
        if (!authService.isAuthenticated()) {
            router.push('/login');
            return;
        }
        loadReviews();
    }, [router, loadReviews]);

    // Filter reviews client-side for performance
    useEffect(() => {
        let filtered = [...reviews];

        // Search filter
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(review => {
                const text = reviewService.getDisplayText(review).toLowerCase();
                const username = review.data?.username?.toLowerCase() || '';
                return text.includes(searchLower) || username.includes(searchLower);
            });
        }

        // Analysis status filter
        if (filters.has_analyzed_data) {
            filtered = filtered.filter(review => {
                const isAnalyzed = reviewService.isAnalyzed(review);
                return filters.has_analyzed_data === 'yes' ? isAnalyzed : !isAnalyzed;
            });
        }

        // Sentiment filter (new analysis-based)
        if (filters.sentiment_label) {
            filtered = filtered.filter(review => {
                const sentiment = review.analyzed_data?.analysis_results?.sentiment?.label;
                return sentiment === filters.sentiment_label;
            });
        }

        // Emotional tone filter
        if (filters.emotional_tone) {
            filtered = filtered.filter(review => {
                const tone = review.analyzed_data?.analysis_results?.sentiment?.emotional_tone;
                return tone === filters.emotional_tone;
            });
        }

        // Spam detection filter
        if (filters.spam_detection) {
            filtered = filtered.filter(review => {
                const spamData = review.analyzed_data?.analysis_results?.spam_detection;
                if (!spamData) return false;
                return filters.spam_detection === 'spam' ? spamData.is_spam : !spamData.is_spam;
            });
        }

        // Urgency level filter
        if (filters.urgency_level) {
            filtered = filtered.filter(review => {
                const urgency = review.analyzed_data?.analysis_results?.urgency?.level;
                return urgency === filters.urgency_level;
            });
        }

        // Detected language filter
        if (filters.detected_language) {
            filtered = filtered.filter(review => {
                const language = review.analyzed_data?.analysis_results?.language_detection?.detected_language;
                return language === filters.detected_language;
            });
        }

        // Rating filter
        if (filters.rating) {
            filtered = filtered.filter(review => {
                const rating = reviewService.getRating(review);
                return rating === parseInt(filters.rating || '');
            });
        }

        // Has comment filter
        if (filters.has_comment) {
            filtered = filtered.filter(review => {
                const hasComment = reviewService.getDisplayText(review).trim() !== '';
                return filters.has_comment === 'yes' ? hasComment : !hasComment;
            });
        }

        // Date range filters
        if (filters.date_from) {
            const fromDate = new Date(filters.date_from);
            filtered = filtered.filter(review => {
                const reviewDate = new Date(reviewService.getDate(review));
                return reviewDate >= fromDate;
            });
        }

        if (filters.date_to) {
            const toDate = new Date(filters.date_to);
            toDate.setHours(23, 59, 59, 999); // End of day
            filtered = filtered.filter(review => {
                const reviewDate = new Date(reviewService.getDate(review));
                return reviewDate <= toDate;
            });
        }

        // Sort by date (newest first)
        filtered.sort((a, b) => {
            const dateA = new Date(reviewService.getDate(a));
            const dateB = new Date(reviewService.getDate(b));
            return dateB.getTime() - dateA.getTime();
        });

        setFilteredReviews(filtered);
    }, [reviews, filters]);

    const handleFiltersChange = (newFilters: ReviewFilters) => {
        setFilters(newFilters);
    };

    const handleRefresh = () => {
        loadReviews();
    };

    const handleExport = async () => {
        try {
            await reviewService.exportReviews(filteredReviews);
        } catch (err: any) {
            console.error('Export failed:', err);
            alert('Export failed. Please try again.');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }} />
            </div>

            <DashboardNavigation />

            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8 animate-in slide-in-from-top duration-700">
                    <div className="relative">
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl" />
                        <div className="relative p-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <button
                                        onClick={() => router.push('/dashboard')}
                                        className="group flex items-center text-gray-600 hover:text-gray-900 transition-all duration-300 hover:bg-white/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/20"
                                    >
                                        <ArrowLeft className="h-5 w-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                                        <span className="font-medium">Back to Dashboard</span>
                                    </button>

                                    <div className="h-8 w-px bg-gray-300" />

                                    <div>
                                        <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent">
                                            Reviews Analysis
                                        </h1>
                                        <p className="text-gray-600 mt-2">
                                            Analyze and manage your collected reviews with AI insights
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={handleRefresh}
                                        disabled={loading}
                                        className="flex items-center px-4 py-2 bg-white/50 hover:bg-white/70 text-gray-700 rounded-xl transition-all duration-200 border border-white/40 disabled:opacity-50"
                                    >
                                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                        Refresh
                                    </button>

                                    <button
                                        onClick={handleExport}
                                        disabled={filteredReviews.length === 0}
                                        className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl transition-all duration-200 disabled:opacity-50 hover:scale-105 shadow-lg"
                                    >
                                        <Download className="h-4 w-4 mr-2" />
                                        Export ({filteredReviews.length})
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="mb-8 animate-in slide-in-from-left duration-700" style={{ animationDelay: '0.2s' }}>
                    <ReviewsStats reviews={filteredReviews} loading={loading} />
                </div>

                {/* Filters */}
                <div className="mb-8 animate-in slide-in-from-right duration-700" style={{ animationDelay: '0.4s' }}>
                    <ReviewsFilters
                        filters={filters}
                        onFiltersChange={handleFiltersChange}
                        reviewCount={filteredReviews.length}
                        totalCount={reviews.length}
                    />
                </div>

                {/* Reviews Table */}
                <div className="animate-in slide-in-from-bottom duration-700" style={{ animationDelay: '0.6s' }}>
                    <ReviewsTable
                        reviews={filteredReviews}
                        loading={loading}
                        error={error}
                        onRefresh={handleRefresh}
                    />
                </div>
            </div>
        </div>
    );
}
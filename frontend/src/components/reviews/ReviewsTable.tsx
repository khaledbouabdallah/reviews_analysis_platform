// src/components/reviews/ReviewsTable.tsx
'use client';

import { useState } from 'react';
import {
    ChevronDown,
    ChevronUp,
    Star,
    MessageSquare,
    User,
    Calendar,
    Globe,
    Brain,
    AlertCircle,
    CheckCircle,
    Clock,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { Review, reviewService } from '@/services/review';

interface ReviewsTableProps {
    reviews: Review[];
    loading: boolean;
    error: string;
    onRefresh: () => void;
}

export function ReviewsTable({ reviews, loading, error, onRefresh }: ReviewsTableProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const reviewsPerPage = 20;

    const toggleRow = (reviewId: string) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(reviewId)) {
            newExpanded.delete(reviewId);
        } else {
            newExpanded.add(reviewId);
        }
        setExpandedRows(newExpanded);
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-4 w-4 ${star <= rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                    />
                ))}
                <span className="ml-2 text-sm font-medium text-gray-700">{rating}</span>
            </div>
        );
    };

    const renderSentimentBadge = (review: Review) => {
        const sentiment = reviewService.getSentiment(review);
        const score = reviewService.getSentimentScore(review);
        const colorClass = reviewService.getSentimentColor(sentiment);

        if (sentiment === 'unknown') {
            return (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                </span>
            );
        }

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
                {sentiment === 'positive' && <CheckCircle className="h-3 w-3 mr-1" />}
                {sentiment === 'negative' && <AlertCircle className="h-3 w-3 mr-1" />}
                {sentiment === 'neutral' && <Clock className="h-3 w-3 mr-1" />}
                {sentiment.charAt(0).toUpperCase() + sentiment.slice(1)}
                {score > 0 && <span className="ml-1 opacity-75">({Math.round(score * 100)}%)</span>}
            </span>
        );
    };

    const renderExpandedContent = (review: Review) => {
        const displayText = reviewService.getDisplayText(review);
        const hasProcessedData = reviewService.isProcessed(review);

        return (
            <tr>
                <td colSpan={7} className="px-6 py-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-white/30 backdrop-blur-sm rounded-2xl border border-white/40" />
                        <div className="relative p-6 space-y-6">

                            {/* Review Content */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 flex items-center">
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    Review Content
                                </h4>

                                {displayText ? (
                                    <div className="space-y-3">
                                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                                            <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                                                {displayText}
                                            </p>
                                        </div>

                                        {/* Show original text if different from display text */}
                                        {review.data?.original_text && review.data.original_text !== displayText && (
                                            <div className="bg-blue-50/50 backdrop-blur-sm rounded-xl p-4 border border-blue-200/40">
                                                <div className="flex items-center mb-2">
                                                    <Globe className="h-4 w-4 text-blue-600 mr-2" />
                                                    <span className="text-sm font-medium text-blue-800">
                                                        Original Text ({reviewService.getLanguage(review)})
                                                    </span>
                                                </div>
                                                <p className="text-blue-700 leading-relaxed whitespace-pre-wrap">
                                                    {review.data.original_text}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-gray-50/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/40 text-center">
                                        <p className="text-gray-500 italic">No comment provided</p>
                                    </div>
                                )}
                            </div>

                            {/* AI Analysis */}
                            {hasProcessedData && (
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900 flex items-center">
                                        <Brain className="h-4 w-4 mr-2" />
                                        AI Analysis
                                    </h4>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">Sentiment</span>
                                                {renderSentimentBadge(review)}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">Language</span>
                                                <span className="text-sm text-gray-600 capitalize">
                                                    {reviewService.getLanguage(review)}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm font-medium text-gray-700">Topic</span>
                                                <span className="text-sm text-gray-600 capitalize">
                                                    {reviewService.getTopic(review)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-medium text-gray-700">Urgency</span>
                                                <span className="text-sm text-gray-600 capitalize">
                                                    {reviewService.getUrgency(review).replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900">Metadata</h4>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Source:</span>
                                                <span className="font-medium capitalize">{review.source_type}</span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Likes:</span>
                                                <span className="font-medium">{review.data?.likes || 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Google Maps specific ratings */}
                                    {review.source_type === 'google' && (review.data?.Food || review.data?.Service || review.data?.Atmosphere) && (
                                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                                            <div className="space-y-2">
                                                {review.data.Food && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Food:</span>
                                                        <span className="font-medium">{review.data.Food}/5</span>
                                                    </div>
                                                )}
                                                {review.data.Service && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Service:</span>
                                                        <span className="font-medium">{review.data.Service}/5</span>
                                                    </div>
                                                )}
                                                {review.data.Atmosphere && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">Atmosphere:</span>
                                                        <span className="font-medium">{review.data.Atmosphere}/5</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Processed:</span>
                                                <span className="font-medium">
                                                    {hasProcessedData ? 'Yes' : 'No'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600">Created:</span>
                                                <span className="font-medium text-xs">
                                                    {new Date(review.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
            </tr>
        );
    };

    // Pagination
    const totalPages = Math.ceil(reviews.length / reviewsPerPage);
    const startIndex = (currentPage - 1) * reviewsPerPage;
    const endIndex = startIndex + reviewsPerPage;
    const currentReviews = reviews.slice(startIndex, endIndex);

    if (loading) {
        return (
            <div className="relative">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl" />
                <div className="relative p-8">
                    <div className="flex items-center justify-center py-12">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600">Loading reviews...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="relative">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl" />
                <div className="relative p-8">
                    <div className="text-center py-12">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-red-500/10 rounded-full blur-3xl" />
                            <AlertCircle className="relative h-16 w-16 text-red-500 mx-auto mb-4" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Reviews</h3>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={onRefresh}
                            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center mx-auto hover:scale-105"
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (reviews.length === 0) {
        return (
            <div className="relative">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl" />
                <div className="relative p-8">
                    <div className="text-center py-12">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-3xl" />
                            <MessageSquare className="relative h-16 w-16 text-blue-500 mx-auto mb-4" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Reviews Found</h3>
                        <p className="text-gray-600">
                            No reviews match your current filters. Try adjusting your search criteria.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="relative">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl" />
            <div className="relative overflow-hidden rounded-3xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/20">
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Reviewer</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Rating</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Comment Preview</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Sentiment</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Source</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentReviews.map((review, index) => {
                                const isExpanded = expandedRows.has(review._id);
                                const displayText = reviewService.getDisplayText(review);
                                const hasComment = reviewService.hasComment(review);

                                return (
                                    <>
                                        <tr
                                            key={review._id}
                                            className="border-b border-white/10 hover:bg-white/20 transition-all duration-200 group animate-in slide-in-from-bottom"
                                            style={{ animationDelay: `${index * 0.05}s` }}
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <Calendar className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm text-gray-700">
                                                        {new Date(reviewService.getDate(review)).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center space-x-2">
                                                    <User className="h-4 w-4 text-gray-400" />
                                                    <span className="text-sm font-medium text-gray-900 truncate max-w-32">
                                                        {reviewService.getUsername(review)}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4">
                                                {renderStars(reviewService.getRating(review))}
                                            </td>

                                            <td className="px-6 py-4 max-w-xs">
                                                {hasComment ? (
                                                    <p className="text-sm text-gray-700 truncate">
                                                        {displayText.length > 100
                                                            ? `${displayText.substring(0, 100)}...`
                                                            : displayText
                                                        }
                                                    </p>
                                                ) : (
                                                    <span className="text-sm text-gray-400 italic">No comment</span>
                                                )}
                                            </td>

                                            <td className="px-6 py-4">
                                                {renderSentimentBadge(review)}
                                            </td>

                                            <td className="px-6 py-4">
                                                <span className="text-sm text-gray-600 capitalize bg-white/50 px-2 py-1 rounded-lg">
                                                    {review.source_type}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => toggleRow(review._id)}
                                                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors duration-200 bg-white/50 hover:bg-white/70 px-3 py-1.5 rounded-lg group-hover:scale-105"
                                                >
                                                    {isExpanded ? (
                                                        <>
                                                            <ChevronUp className="h-4 w-4" />
                                                            <span className="text-sm font-medium">Less</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="h-4 w-4" />
                                                            <span className="text-sm font-medium">More</span>
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>

                                        {isExpanded && renderExpandedContent(review)}
                                    </>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-white/20 bg-white/20 backdrop-blur-sm">
                        <div className="flex items-center justify-between">
                            <div className="text-sm text-gray-600">
                                Showing {startIndex + 1} to {Math.min(endIndex, reviews.length)} of {reviews.length} reviews
                            </div>

                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-2 text-sm font-medium text-gray-600 bg-white/50 hover:bg-white/70 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    Previous
                                </button>

                                <div className="flex items-center space-x-1">
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        const pageNum = i + 1;
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => setCurrentPage(pageNum)}
                                                className={`px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${currentPage === pageNum
                                                        ? 'bg-blue-600 text-white'
                                                        : 'text-gray-600 bg-white/50 hover:bg-white/70'
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-2 text-sm font-medium text-gray-600 bg-white/50 hover:bg-white/70 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
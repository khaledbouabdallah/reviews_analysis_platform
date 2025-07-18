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
    RefreshCw,
    Settings,
    Eye,
    EyeOff
} from 'lucide-react';
import { Review, reviewService } from '@/services/review';

interface ReviewsTableProps {
    reviews: Review[];
    loading: boolean;
    error: string;
    onRefresh: () => void;
}

interface ColumnConfig {
    key: string;
    label: string;
    visible: boolean;
    icon: any;
}

const defaultColumns: ColumnConfig[] = [
    { key: 'date', label: 'Date', visible: true, icon: Calendar },
    { key: 'reviewer', label: 'Reviewer', visible: true, icon: User },
    { key: 'rating', label: 'Rating', visible: true, icon: Star },
    { key: 'text', label: 'Original Text', visible: true, icon: MessageSquare },
    { key: 'source', label: 'Source', visible: true, icon: Globe },
    { key: 'source_type', label: 'Source Type', visible: true, icon: Globe },
    { key: 'analysis_status', label: 'Analysis Status', visible: true, icon: Brain },
];

export function ReviewsTable({ reviews, loading, error, onRefresh }: ReviewsTableProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
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

    const toggleColumn = (columnKey: string) => {
        setColumns(prevColumns =>
            prevColumns.map(col =>
                col.key === columnKey ? { ...col, visible: !col.visible } : col
            )
        );
    };

    const visibleColumns = columns.filter(col => col.visible);

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
                <span className="ml-2 text-sm text-gray-600">({rating})</span>
            </div>
        );
    };

    const getSentimentBadge = (review: Review) => {
        const sentiment = reviewService.getSentiment(review);
        const sentimentColors = {
            positive: 'bg-green-100 text-green-700 border-green-200',
            negative: 'bg-red-100 text-red-700 border-red-200',
            neutral: 'bg-gray-100 text-gray-700 border-gray-200',
            Unknown: 'bg-gray-100 text-gray-500 border-gray-200',
        };

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${sentimentColors[sentiment as keyof typeof sentimentColors] || sentimentColors.Unknown}`}>
                {sentiment}
            </span>
        );
    };

    const getAnalysisStatusBadge = (review: Review) => {
        const status = reviewService.getAnalysisStatus(review);
        const statusColors = {
            'Analyzed': 'bg-green-100 text-green-700 border-green-200',
            'Processing': 'bg-blue-100 text-blue-700 border-blue-200',
            'Failed': 'bg-red-100 text-red-700 border-red-200',
            'Not Processed': 'bg-gray-100 text-gray-500 border-gray-200',
        };

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${statusColors[status as keyof typeof statusColors] || statusColors['Not Processed']}`}>
                {status}
            </span>
        );
    };

    const renderExpandedContent = (review: Review) => {
        const isExpanded = expandedRows.has(review._id);
        if (!isExpanded) return null;

        const analysisData = review.analyzed_data?.analysis_results;

        return (
            <tr key={`${review._id}-expanded`} className="bg-blue-50/50">
                <td colSpan={visibleColumns.length + 1} className="px-6 py-6">
                    <div className="space-y-6">
                        {/* Full Review Text */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Full Review Text</h4>
                            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/40">
                                <p className="text-gray-700 leading-relaxed">
                                    {reviewService.getDisplayText(review) || 'No text available'}
                                </p>
                            </div>
                        </div>

                        {/* Analysis Results */}
                        {analysisData && (
                            <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                                    <Brain className="h-4 w-4 mr-2 text-purple-600" />
                                    AI Analysis Results
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {/* Sentiment Analysis */}
                                    {analysisData.sentiment && (
                                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/40">
                                            <h5 className="font-medium text-gray-900 mb-2">Sentiment</h5>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Label:</span>
                                                    <span className="font-medium">{analysisData.sentiment.label}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Confidence:</span>
                                                    <span className="font-medium">{(analysisData.sentiment.confidence * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Emotional Tone:</span>
                                                    <span className="font-medium">{analysisData.sentiment.emotional_tone}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Language Detection */}
                                    {analysisData.language_detection && (
                                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/40">
                                            <h5 className="font-medium text-gray-900 mb-2">Language</h5>
                                            <div className="text-sm">
                                                <span className="font-medium">{analysisData.language_detection.detected_language}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Urgency */}
                                    {analysisData.urgency && (
                                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/40">
                                            <h5 className="font-medium text-gray-900 mb-2">Urgency</h5>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Level:</span>
                                                    <span className="font-medium">{analysisData.urgency.level}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Immediate Response:</span>
                                                    <span className="font-medium">
                                                        {analysisData.urgency.requires_immediate_response ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Escalation Needed:</span>
                                                    <span className="font-medium">
                                                        {analysisData.urgency.escalation_needed ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Spam Detection */}
                                    {analysisData.spam_detection && (
                                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/40">
                                            <h5 className="font-medium text-gray-900 mb-2">Spam Detection</h5>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Is Spam:</span>
                                                    <span className="font-medium">
                                                        {analysisData.spam_detection.is_spam ? 'Yes' : 'No'}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Confidence:</span>
                                                    <span className="font-medium">{(analysisData.spam_detection.confidence * 100).toFixed(1)}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Topics */}
                                    {analysisData.topics && analysisData.topics.length > 0 && (
                                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/40 md:col-span-2 lg:col-span-3">
                                            <h5 className="font-medium text-gray-900 mb-2">Topics</h5>
                                            <div className="flex flex-wrap gap-2">
                                                {analysisData.topics.map((topic, index) => (
                                                    <span
                                                        key={index}
                                                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${topic.sentiment === 'positive' ? 'bg-green-100 text-green-700 border-green-200' :
                                                                topic.sentiment === 'negative' ? 'bg-red-100 text-red-700 border-red-200' :
                                                                    'bg-gray-100 text-gray-700 border-gray-200'
                                                            }`}
                                                    >
                                                        {topic.topic}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Business Insights */}
                                    {analysisData.business_insights && (
                                        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/40 md:col-span-2 lg:col-span-3">
                                            <h5 className="font-medium text-gray-900 mb-2">Business Insights</h5>
                                            <div className="space-y-3 text-sm">
                                                {analysisData.business_insights.main_issues.length > 0 && (
                                                    <div>
                                                        <span className="text-gray-600 font-medium">Main Issues:</span>
                                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                                            {analysisData.business_insights.main_issues.map((issue, index) => (
                                                                <li key={index} className="text-gray-700">{issue}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {analysisData.business_insights.positive_highlights.length > 0 && (
                                                    <div>
                                                        <span className="text-gray-600 font-medium">Positive Highlights:</span>
                                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                                            {analysisData.business_insights.positive_highlights.map((highlight, index) => (
                                                                <li key={index} className="text-gray-700">{highlight}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {analysisData.business_insights.actionable_recommendations.length > 0 && (
                                                    <div>
                                                        <span className="text-gray-600 font-medium">Recommendations:</span>
                                                        <ul className="list-disc list-inside mt-1 space-y-1">
                                                            {analysisData.business_insights.actionable_recommendations.map((rec, index) => (
                                                                <li key={index} className="text-gray-700">{rec}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Raw Data */}
                        <div>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Review Metadata</h4>
                            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 border border-white/40">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Source ID:</span>
                                        <span className="font-medium text-xs">
                                            {review.source_id.slice(-8)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Job ID:</span>
                                        <span className="font-medium text-xs">
                                            {review.job_id.slice(-8)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Analyzed:</span>
                                        <span className="font-medium">
                                            {reviewService.isAnalyzed(review) ? 'Yes' : 'No'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Created:</span>
                                        <span className="font-medium text-xs">
                                            {new Date(review.created_at).toLocaleDateString()}
                                        </span>
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
                {/* Table Header with Column Selector */}
                <div className="px-6 py-4 border-b border-white/20 bg-white/20 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Reviews ({reviews.length})</h3>

                        <div className="relative">
                            <button
                                onClick={() => setShowColumnSelector(!showColumnSelector)}
                                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-700 bg-white/50 hover:bg-white/70 rounded-lg transition-all duration-200"
                            >
                                <Settings className="h-4 w-4" />
                                <span>Columns</span>
                                <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${showColumnSelector ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Column Selector Dropdown */}
                            {showColumnSelector && (
                                <div className="absolute right-0 top-full mt-2 w-64 bg-white/90 backdrop-blur-xl rounded-xl border border-white/40 shadow-xl z-10">
                                    <div className="p-4">
                                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Show/Hide Columns</h4>
                                        <div className="space-y-2">
                                            {columns.map((column) => {
                                                const IconComponent = column.icon;
                                                return (
                                                    <label
                                                        key={column.key}
                                                        className="flex items-center space-x-2 cursor-pointer hover:bg-white/50 rounded-lg p-2 transition-colors duration-200"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={column.visible}
                                                            onChange={() => toggleColumn(column.key)}
                                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        />
                                                        <IconComponent className="h-4 w-4 text-gray-500" />
                                                        <span className="text-sm text-gray-700">{column.label}</span>
                                                        {column.visible ? (
                                                            <Eye className="h-3 w-3 text-green-500 ml-auto" />
                                                        ) : (
                                                            <EyeOff className="h-3 w-3 text-gray-400 ml-auto" />
                                                        )}
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/20">
                                {visibleColumns.map((column) => {
                                    const IconComponent = column.icon;
                                    return (
                                        <th key={column.key} className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                            <div className="flex items-center space-x-2">
                                                <IconComponent className="h-4 w-4 text-gray-500" />
                                                <span>{column.label}</span>
                                            </div>
                                        </th>
                                    );
                                })}
                                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 w-16">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/10">
                            {currentReviews.map((review) => {
                                const isExpanded = expandedRows.has(review._id);

                                return (
                                    <>
                                        <tr key={review._id} className="hover:bg-white/30 transition-colors duration-200">
                                            {visibleColumns.map((column) => (
                                                <td key={column.key} className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                                                    {column.key === 'date' && (
                                                        <div className="font-medium">
                                                            {new Date(reviewService.getDate(review)).toLocaleDateString()}
                                                        </div>
                                                    )}
                                                    {column.key === 'reviewer' && (
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                                                                {reviewService.getReviewer(review).charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="font-medium truncate">
                                                                {reviewService.getReviewer(review)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {column.key === 'rating' && (
                                                        <div>
                                                            {reviewService.getRating(review) ?
                                                                renderStars(reviewService.getRating(review)!) :
                                                                <span className="text-gray-500">No rating</span>
                                                            }
                                                        </div>
                                                    )}
                                                    {column.key === 'text' && (
                                                        <div className="max-w-md">
                                                            <p className="text-gray-700 line-clamp-2">
                                                                {reviewService.getDisplayText(review) || 'No text available'}
                                                            </p>
                                                        </div>
                                                    )}
                                                    {column.key === 'source' && (
                                                        <div>
                                                            {getSentimentBadge(review)}
                                                        </div>
                                                    )}
                                                    {column.key === 'source_type' && (
                                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
                                                            {reviewService.getSource(review)}
                                                        </span>
                                                    )}
                                                    {column.key === 'analysis_status' && (
                                                        <div>
                                                            {getAnalysisStatusBadge(review)}
                                                        </div>
                                                    )}
                                                </td>
                                            ))}

                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => toggleRow(review._id)}
                                                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 mx-auto"
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

                                        {renderExpandedContent(review)}
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
                                                    ? 'bg-blue-500 text-white'
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
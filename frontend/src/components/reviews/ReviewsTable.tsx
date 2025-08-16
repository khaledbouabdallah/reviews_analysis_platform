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
    EyeOff,
    TrendingUp,
    Heart,
    AlertTriangle,
    ShieldCheck,
    Target
} from 'lucide-react';
import { Review, reviewService } from '@/services/review';
import { ReviewDetailsModal } from './ReviewDetailsModal';



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
    { key: 'location', label: 'Location', visible: false, icon: Globe },
    { key: 'job', label: 'Job', visible: false, icon: User },
    { key: 'source', label: 'Source', visible: false, icon: Globe },
    { key: 'source_type', label: 'Source Type', visible: true, icon: Globe },
    { key: 'analysis_status', label: 'Analysis Status', visible: true, icon: Brain },
    { key: 'sentiment', label: 'Sentiment', visible: false, icon: TrendingUp },
    { key: 'emotional_tone', label: 'Emotional Tone', visible: false, icon: Heart },
    { key: 'urgency', label: 'Urgency Level', visible: false, icon: AlertTriangle },
    { key: 'language', label: 'Language', visible: false, icon: Globe },
    { key: 'spam_status', label: 'Spam Detection', visible: false, icon: ShieldCheck },
    { key: 'topics', label: 'Key Topics', visible: false, icon: Target },
];

export function ReviewsTable({ reviews, loading, error, onRefresh }: ReviewsTableProps) {
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [currentPage, setCurrentPage] = useState(1);
    const [showColumnSelector, setShowColumnSelector] = useState(false);
    const [columns, setColumns] = useState<ColumnConfig[]>(defaultColumns);
    const [selectedReview, setSelectedReview] = useState<Review | null>(null);
    const [showModal, setShowModal] = useState(false);
    const reviewsPerPage = 20;



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

    const getUrgencyBadge = (review: Review) => {
        const urgency = review.analyzed_data?.analysis_results?.urgency_classification?.level || 'Unknown';
        const urgencyColors = {
            'critical': 'bg-red-100 text-red-700 border-red-200',
            'high': 'bg-orange-100 text-orange-700 border-orange-200',
            'medium': 'bg-yellow-100 text-yellow-700 border-yellow-200',
            'low': 'bg-blue-100 text-blue-700 border-blue-200',
            'none': 'bg-green-100 text-green-700 border-green-200',
            'Unknown': 'bg-gray-100 text-gray-500 border-gray-200',
        };

        const urgencyIcons = {
            'critical': '🚨',
            'high': '⚠️',
            'medium': '⚡',
            'low': '📋',
            'none': '✅',
            'Unknown': '❓',
        };

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${urgencyColors[urgency as keyof typeof urgencyColors] || urgencyColors.Unknown}`}>
                <span className="mr-1">{urgencyIcons[urgency as keyof typeof urgencyIcons] || urgencyIcons.Unknown}</span>
                {urgency}
            </span>
        );
    };

    const getSpamBadge = (review: Review) => {
        const spamData = review.analyzed_data?.analysis_results?.spam_detection;
        if (!spamData) {
            return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-500 border-gray-200">Unknown</span>;
        }

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${spamData.is_spam
                ? 'bg-red-100 text-red-700 border-red-200'
                : 'bg-green-100 text-green-700 border-green-200'
                }`}>
                <span className="mr-1">{spamData.is_spam ? '🚫' : '✅'}</span>
                {spamData.is_spam ? 'Spam' : 'Genuine'}
            </span>
        );
    };

    const getTopicsList = (review: Review) => {
        const topics = review.analyzed_data?.analysis_results?.topics || [];
        if (topics.length === 0) {
            return <span className="text-gray-500 text-xs">No topics</span>;
        }

        return (
            <div className="flex flex-wrap gap-1 max-w-xs">
                {topics.slice(0, 2).map((topic, index) => (
                    <span key={index} className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${topic.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                        topic.sentiment === 'negative' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                        {topic.topic}
                    </span>
                ))}
                {topics.length > 2 && (
                    <span className="text-xs text-gray-500">+{topics.length - 2}</span>
                )}
            </div>
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
                                                    {column.key === 'location' && (
                                                        <div>
                                                            {reviewService.getLocationName(review)}
                                                        </div>
                                                    )}
                                                    {column.key === 'source' && (
                                                        <div>
                                                            {reviewService.getSourceName(review)}
                                                        </div>
                                                    )}
                                                    {column.key === 'job' && (
                                                        <div>
                                                            {reviewService.getJobName(review)}
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

                                                    {column.key === 'sentiment' && (
                                                        <div>
                                                            {getSentimentBadge(review)}
                                                        </div>
                                                    )}
                                                    {column.key === 'emotional_tone' && (
                                                        <div>
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                                                                {review.analyzed_data?.analysis_results?.sentiment?.emotional_tone || 'Unknown'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {column.key === 'urgency' && (
                                                        <div>
                                                            {getUrgencyBadge(review)}
                                                        </div>
                                                    )}
                                                    {column.key === 'language' && (
                                                        <div>
                                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 border border-indigo-200">
                                                                <Globe className="h-3 w-3 mr-1" />
                                                                {review.analyzed_data?.analysis_results?.language_analysis?.detected_language?.toUpperCase() || 'Unknown'}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {column.key === 'spam_status' && (
                                                        <div>
                                                            {getSpamBadge(review)}
                                                        </div>
                                                    )}
                                                    {column.key === 'topics' && (
                                                        <div>
                                                            {getTopicsList(review)}
                                                        </div>
                                                    )}
                                                </td>
                                            ))}

                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedReview(review);
                                                        setShowModal(true);
                                                    }}
                                                    className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 mx-auto"
                                                >
                                                    <span className="text-sm font-medium">Details</span>
                                                </button>
                                            </td>
                                        </tr>

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


            <ReviewDetailsModal
                review={selectedReview}
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    setSelectedReview(null);
                }}
            />
        </div>
    );
}
import { useState } from 'react';
import { Loader2, RefreshCw, AlertTriangle, MessageSquare, Zap, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Review, getReviewSentiment, getReviewUrgency, getAnalysisResults } from '@/services/review';
import { ReviewRow } from './ReviewRow';

type SortField = 'date' | 'rating' | 'sentiment' | 'urgency';
type SortDirection = 'asc' | 'desc';

interface ReviewTableProps {
    reviews: Review[];
    isLoading: boolean;
    error: Error | null;
    hasActiveFilters: boolean;
    onRefresh: () => void;
    onViewDetails: (reviewId: string) => void;
    // ADDED: Column visibility control
    visibleColumns: string[];
}

export const ReviewTable = ({
    reviews,
    isLoading,
    error,
    hasActiveFilters,
    onRefresh,
    onViewDetails,
    visibleColumns
}: ReviewTableProps) => {
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

    // Handle sorting
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    // ADDED: Double-click handler for expand/collapse
    const handleDoubleClick = (reviewId: string) => {
        toggleRowExpansion(reviewId);
    };

    // Toggle row expansion
    const toggleRowExpansion = (reviewId: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(reviewId)) {
                newSet.delete(reviewId);
            } else {
                newSet.add(reviewId);
            }
            return newSet;
        });
    };

    // Sort reviews
    const sortedReviews = [...reviews].sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
            case 'date':
                aValue = new Date(a.created_at).getTime();
                bValue = new Date(b.created_at).getTime();
                break;
            case 'rating':
                const aRating = a.data?.rating || 0;
                const bRating = b.data?.rating || 0;
                aValue = typeof aRating === 'number' ? aRating : 0;
                bValue = typeof bRating === 'number' ? bRating : 0;
                break;
            case 'sentiment':
                const aSentiment = getReviewSentiment(a) || 'neutral';
                const bSentiment = getReviewSentiment(b) || 'neutral';
                const sentimentOrder = { negative: 0, neutral: 1, positive: 2 };
                aValue = sentimentOrder[aSentiment as keyof typeof sentimentOrder];
                bValue = sentimentOrder[bSentiment as keyof typeof sentimentOrder];
                break;
            case 'urgency':
                const aUrgency = getReviewUrgency(a) || 'none';
                const bUrgency = getReviewUrgency(b) || 'none';
                const urgencyOrder = { none: 0, low: 1, medium: 2, high: 3, critical: 4 };
                aValue = urgencyOrder[aUrgency as keyof typeof urgencyOrder];
                bValue = urgencyOrder[bUrgency as keyof typeof urgencyOrder];
                break;
            default:
                return 0;
        }

        if (sortDirection === 'asc') {
            return aValue > bValue ? 1 : -1;
        } else {
            return aValue < bValue ? 1 : -1;
        }
    });

    return (
        <div className="relative">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl" />
            <div className="relative p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <MessageSquare className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900">Reviews</h2>
                        {reviews.length > 0 && (
                            <Badge variant="outline" className="text-sm">
                                {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                            </Badge>
                        )}
                    </div>

                    {/* Sort Controls */}
                    {reviews.length > 0 && (
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Sort by:</span>
                            {(['date', 'rating', 'sentiment', 'urgency'] as SortField[]).map((field) => (
                                <Button
                                    key={field}
                                    variant={sortField === field ? "default" : "ghost"}
                                    size="sm"
                                    onClick={() => handleSort(field)}
                                    className="capitalize"
                                >
                                    {field}
                                    {sortField === field && (
                                        <ChevronDown className={`h-3 w-3 ml-1 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                                    )}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center justify-center p-12">
                        <div className="text-center">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                            <p className="text-gray-600">Loading reviews...</p>
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && !isLoading && (
                    <div className="text-center p-12">
                        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Reviews</h3>
                        <p className="text-gray-600 mb-4">
                            {error.message || 'Something went wrong while loading reviews.'}
                        </p>
                        <Button onClick={onRefresh} variant="outline">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && sortedReviews.length === 0 && (
                    <div className="text-center p-12">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reviews Found</h3>
                        <p className="text-gray-600">
                            {hasActiveFilters 
                                ? 'No reviews match your current filters. Try adjusting your search criteria.'
                                : 'No reviews available for analysis yet. Start collecting reviews to see AI insights.'
                            }
                        </p>
                    </div>
                )}

                {/* Reviews List */}
                {!isLoading && !error && sortedReviews.length > 0 && (
                    <div className="space-y-4">
                        {sortedReviews.map((review, index) => (
                            <div
                                key={review.id}
                                onDoubleClick={() => handleDoubleClick(review.id)}
                                className="cursor-pointer"
                            >
                                <ReviewRow
                                    review={review}
                                    isExpanded={expandedRows.has(review.id)}
                                    onToggleExpansion={() => toggleRowExpansion(review.id)}
                                    onViewDetails={() => onViewDetails(review.id)}
                                    index={index}
                                    visibleColumns={visibleColumns}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Helper Text */}
                {!isLoading && !error && sortedReviews.length > 0 && (
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-500">
                            💡 Double-click any review to expand/collapse • Click "View Details" for full analysis
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
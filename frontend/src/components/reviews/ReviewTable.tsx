import { useState } from 'react';
import { Loader2, RefreshCw, AlertTriangle, MessageSquare, Zap, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Review } from '@/services/review';
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
}

export const ReviewTable = ({
    reviews,
    isLoading,
    error,
    hasActiveFilters,
    onRefresh,
    onViewDetails
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
                const sentimentOrder = { 'positive': 3, 'neutral': 2, 'negative': 1 };
                aValue = sentimentOrder[a.analyzed_data?.sentiment?.label as keyof typeof sentimentOrder] || 0;
                bValue = sentimentOrder[b.analyzed_data?.sentiment?.label as keyof typeof sentimentOrder] || 0;
                break;
            case 'urgency':
                const urgencyOrder = { 'critical': 5, 'high': 4, 'medium': 3, 'low': 2, 'none': 1 };
                aValue = urgencyOrder[a.analyzed_data?.urgency?.level as keyof typeof urgencyOrder] || 0;
                bValue = urgencyOrder[b.analyzed_data?.urgency?.level as keyof typeof urgencyOrder] || 0;
                break;
            default:
                return 0;
        }
        
        if (sortDirection === 'asc') {
            return aValue - bValue;
        } else {
            return bValue - aValue;
        }
    });

    return (
        <div className="relative">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl"></div>
            <div className="relative">
                {/* Table Header */}
                <div className="px-8 py-6 border-b border-white/20 bg-white/20 backdrop-blur-sm rounded-t-3xl">
                    <div className="flex items-center justify-between">
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                            <Zap className="w-5 h-5 mr-2 text-primary" />
                            Smart Review Analysis
                            <Badge variant="secondary" className="ml-3 bg-primary/10 text-primary border-primary/20">
                                {sortedReviews.length} reviews
                            </Badge>
                        </h3>
                        
                        {/* Sort Controls */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600 mr-2">Sort by:</span>
                            {(['date', 'rating', 'sentiment', 'urgency'] as SortField[]).map((field) => (
                                <Button
                                    key={field}
                                    variant={sortField === field ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handleSort(field)}
                                    className="capitalize"
                                >
                                    {field}
                                    {sortField === field && (
                                        <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${sortDirection === 'desc' ? 'rotate-180' : ''}`} />
                                    )}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && (
                    <div className="p-12 text-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 blur-3xl rounded-full"></div>
                            <Loader2 className="relative w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                        </div>
                        <p className="text-gray-600">Loading reviews...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="p-12 text-center">
                        <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Reviews</h3>
                        <p className="text-gray-600 mb-6">{error instanceof Error ? error.message : 'An error occurred'}</p>
                        <Button onClick={onRefresh} variant="outline">
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && sortedReviews.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="relative mb-6">
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 blur-3xl rounded-full"></div>
                            <MessageSquare className="relative w-12 h-12 text-blue-500 mx-auto" />
                        </div>
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
                    <div className="divide-y divide-white/20">
                        {sortedReviews.map((review, index) => (
                            <ReviewRow
                                key={review.id}
                                review={review}
                                isExpanded={expandedRows.has(review.id)}
                                onToggleExpansion={() => toggleRowExpansion(review.id)}
                                onViewDetails={() => onViewDetails(review.id)}
                                index={index}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Building2, Loader2, RefreshCw, ChevronDown, ChevronRight, Star, Brain, TrendingUp, AlertTriangle, MessageSquare, Globe, Calendar, User, Target, Zap, Eye, RotateCcw, Flag, CheckCircle, XCircle, Clock, Search, Filter, X, ThumbsUp, ThumbsDown, Minus, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBusiness } from '@/contexts/BusinessContext';
import { useReviewsByBusiness, useReviewStatsByBusiness } from '@/hooks/useReviews';
import { Review, ReviewFilters, getSentimentColor, getUrgencyColor, getReviewRating, getReviewText, reviewNeedsAttention } from '@/services/review';

type SortField = 'date' | 'rating' | 'sentiment' | 'urgency';
type SortDirection = 'asc' | 'desc';

const Reviews = () => {
    const queryClient = useQueryClient();
    const { selectedBusiness, hasBusinesses } = useBusiness();
    const [filters, setFilters] = useState<ReviewFilters>({});
    const [sortField, setSortField] = useState<SortField>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    // Use business-centric hook
    const { data: reviews = [], isLoading, error } = useReviewsByBusiness(
        selectedBusiness?.id || '', 
        filters
    );
    
    const { stats, isLoading: isLoadingStats } = useReviewStatsByBusiness(selectedBusiness?.id || '');

    // Handle manual refresh
    const handleRefresh = () => {
        queryClient.invalidateQueries({ 
            queryKey: ['reviews', 'business', selectedBusiness?.id], 
            exact: false 
        });
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

    // Handle sorting
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('desc');
        }
    };

    // Handle filter changes - FIXED to handle "all" values
    const handleFilterChange = (key: keyof ReviewFilters, value: any) => {
        setFilters(prev => ({
            ...prev,
            [key]: value === 'all' ? undefined : value === 'yes' ? true : value === 'no' ? false : value
        }));
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({});
        setSearchTerm('');
    };

    // Filter reviews by search term
    const searchFilteredReviews = reviews.filter(review => {
        if (!searchTerm) return true;
        const text = getReviewText(review).toLowerCase();
        return text.includes(searchTerm.toLowerCase());
    });

    // Sort reviews
    const sortedReviews = [...searchFilteredReviews].sort((a, b) => {
        let aValue: any, bValue: any;
        
        switch (sortField) {
            case 'date':
                aValue = new Date(a.created_at).getTime();
                bValue = new Date(b.created_at).getTime();
                break;
            case 'rating':
                aValue = getReviewRating(a) || 0;
                bValue = getReviewRating(b) || 0;
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

    // Calculate stats
    const calculateStats = () => {
        if (!reviews.length) return {
            total: 0,
            analyzed: 0,
            positive: 0,
            negative: 0,
            neutral: 0,
            needingAttention: 0,
            avgRating: 0
        };

        const analyzed = reviews.filter(r => r.analyzed_data).length;
        const positive = reviews.filter(r => r.analyzed_data?.sentiment?.label === 'positive').length;
        const negative = reviews.filter(r => r.analyzed_data?.sentiment?.label === 'negative').length;
        const neutral = reviews.filter(r => r.analyzed_data?.sentiment?.label === 'neutral').length;
        const needingAttention = reviews.filter(reviewNeedsAttention).length;

        const ratingsSum = reviews.reduce((sum, r) => {
            const rating = getReviewRating(r);
            return rating ? sum + rating : sum;
        }, 0);
        const ratingsCount = reviews.filter(r => getReviewRating(r)).length;
        const avgRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

        return {
            total: reviews.length,
            analyzed,
            positive,
            negative,
            neutral,
            needingAttention,
            avgRating
        };
    };

    const reviewStats = calculateStats();
    const hasActiveFilters = Object.keys(filters).length > 0 || searchTerm;

    // Show business selection message
    if (!hasBusinesses) {
        return (
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                    <h2 className="text-2xl font-bold mb-4">No businesses found</h2>
                    <p className="text-muted-foreground mb-6">Create a business first to analyze reviews with AI.</p>
                    <Button size="lg" className="bg-gradient-to-r from-primary to-accent">
                        Go to Businesses
                    </Button>
                </div>
            </div>
        );
    }

    if (!selectedBusiness) {
        return (
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl rounded-full"></div>
                        <Brain className="relative w-16 h-16 text-primary mx-auto" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Select a business</h2>
                    <p className="text-muted-foreground">Choose a business from the header to start analyzing reviews with AI.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-6 space-y-8">
            {/* Header */}
            <div className="relative">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl"></div>
                <div className="relative p-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-xl opacity-30 rounded-full"></div>
                                <div className="relative w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center">
                                    <Brain className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                    AI Review Analysis
                                </h1>
                                <p className="text-lg text-muted-foreground mt-1">
                                    Powered insights for <span className="font-semibold text-primary">{selectedBusiness.name}</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <Button
                                variant="outline"
                                onClick={handleRefresh}
                                disabled={isLoading}
                                className="bg-white/50 backdrop-blur-sm border-white/40 hover:bg-white/70"
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                                Refresh
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    {
                        title: 'Total Reviews',
                        value: reviewStats.total.toString(),
                        subtitle: `${reviewStats.analyzed} analyzed`,
                        icon: MessageSquare,
                        color: 'from-blue-500 to-indigo-500',
                        bgColor: 'from-blue-500/10 to-indigo-500/10',
                    },
                    {
                        title: 'Average Rating',
                        value: reviewStats.avgRating > 0 ? reviewStats.avgRating.toFixed(1) : '0.0',
                        subtitle: 'out of 5 stars',
                        icon: Star,
                        color: 'from-yellow-500 to-orange-500',
                        bgColor: 'from-yellow-500/10 to-orange-500/10',
                    },
                    {
                        title: 'Sentiment Split',
                        value: `${reviewStats.positive}/${reviewStats.negative}`,
                        subtitle: 'positive/negative',
                        icon: TrendingUp,
                        color: 'from-green-500 to-emerald-500',
                        bgColor: 'from-green-500/10 to-emerald-500/10',
                    },
                    {
                        title: 'Need Attention',
                        value: reviewStats.needingAttention.toString(),
                        subtitle: 'urgent reviews',
                        icon: AlertTriangle,
                        color: 'from-red-500 to-pink-500',
                        bgColor: 'from-red-500/10 to-pink-500/10',
                    }
                ].map((stat, index) => (
                    <div key={index} className="group relative animate-in slide-in-from-bottom duration-500" style={{ animationDelay: `${index * 0.1}s` }}>
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/30 shadow-xl group-hover:shadow-2xl transition-all duration-500" />
                        <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500`} />
                        
                        <div className="relative p-6 h-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="relative">
                                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.color} rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity duration-500`} />
                                    <div className={`relative p-3 bg-gradient-to-r ${stat.color} rounded-xl group-hover:scale-110 transition-all duration-300 shadow-lg`}>
                                        <stat.icon className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-900 group-hover:scale-110 transition-transform duration-300">
                                        {stat.value}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="space-y-1">
                                <div className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                                    {stat.title}
                                </div>
                                <div className="text-sm text-gray-600 group-hover:text-gray-500 transition-colors">
                                    {stat.subtitle}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="relative">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl" />
                <div className="relative p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Filter className="h-5 w-5 text-gray-600" />
                                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                            </div>
                            
                            <div className="text-sm text-gray-600 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/40">
                                {sortedReviews.length} of {reviews.length} reviews
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                            {hasActiveFilters && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearFilters}
                                    className="text-red-600 hover:text-red-700"
                                >
                                    <X className="h-3 w-3 mr-1" />
                                    Clear
                                </Button>
                            )}
                            
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowFilters(!showFilters)}
                            >
                                {showFilters ? 'Less' : 'More'} Filters
                                <ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    {/* Quick Filters - FIXED SELECT VALUES */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search reviews..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70"
                            />
                        </div>

                        {/* Analysis Status - FIXED VALUES */}
                        <Select
                            value={filters.has_analysis === true ? 'yes' : filters.has_analysis === false ? 'no' : 'all'}
                            onValueChange={(value) => handleFilterChange('has_analysis', value)}
                        >
                            <SelectTrigger className="bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70">
                                <SelectValue placeholder="All Reviews" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Reviews</SelectItem>
                                <SelectItem value="yes">Analyzed</SelectItem>
                                <SelectItem value="no">Not Analyzed</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Sentiment - FIXED VALUES */}
                        <Select
                            value={filters.sentiment || 'all'}
                            onValueChange={(value) => handleFilterChange('sentiment', value)}
                        >
                            <SelectTrigger className="bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70">
                                <SelectValue placeholder="All Sentiments" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sentiments</SelectItem>
                                <SelectItem value="positive">Positive</SelectItem>
                                <SelectItem value="negative">Negative</SelectItem>
                                <SelectItem value="neutral">Neutral</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Needs Attention - FIXED VALUES */}
                        <Select
                            value={filters.needs_attention ? 'yes' : 'all'}
                            onValueChange={(value) => handleFilterChange('needs_attention', value)}
                        >
                            <SelectTrigger className="bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70">
                                <SelectValue placeholder="All Priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value="yes">Needs Attention</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Advanced Filters */}
                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-white/20 animate-in slide-in-from-top duration-300">
                            {/* Additional filter options can go here */}
                            <div className="text-sm text-gray-500 col-span-full text-center py-4">
                                More filters coming soon...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Reviews Table */}
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
                            <Button onClick={handleRefresh} variant="outline">
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
                        <div className="divide-y divide-white/10">
                            {sortedReviews.map((review, index) => (
                                <ReviewRow
                                    key={review.id}
                                    review={review}
                                    isExpanded={expandedRows.has(review.id)}
                                    onToggleExpansion={() => toggleRowExpansion(review.id)}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Review Row Component
interface ReviewRowProps {
    review: Review;
    isExpanded: boolean;
    onToggleExpansion: () => void;
    index: number;
}

const ReviewRow = ({ review, isExpanded, onToggleExpansion, index }: ReviewRowProps) => {
    const rating = getReviewRating(review);
    const reviewText = getReviewText(review);
    const needsAttention = reviewNeedsAttention(review);
    const sentiment = review.analyzed_data?.sentiment;
    const urgency = review.analyzed_data?.urgency;
    const businessInsights = review.analyzed_data?.business_insights;
    const topics = review.analyzed_data?.topics || [];

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
            </div>
        );
    };

    return (
        <div 
            className="transition-all duration-300 hover:bg-white/30"
            style={{ animationDelay: `${index * 0.05}s` }}
        >
            {/* Main Row */}
            <div className="px-8 py-6 cursor-pointer" onClick={onToggleExpansion}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-6 flex-1">
                        {/* Expansion Toggle */}
                        <div className="flex items-center">
                            {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-gray-500" />
                            ) : (
                                <ChevronRight className="w-5 h-5 text-gray-500" />
                            )}
                        </div>

                        {/* Date */}
                        <div className="flex items-center space-x-2 min-w-[120px]">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                                {new Date(review.created_at).toLocaleDateString()}
                            </span>
                        </div>

                        {/* Rating */}
                        <div className="min-w-[120px]">
                            {rating ? renderStars(rating) : (
                                <span className="text-sm text-gray-500">No rating</span>
                            )}
                        </div>

                        {/* Review Preview */}
                        <div className="flex-1 min-w-0">
                            <p className="text-gray-800 line-clamp-2 text-sm leading-relaxed">
                                {reviewText}
                            </p>
                        </div>

                        {/* AI Analysis Badges */}
                        <div className="flex items-center space-x-2">
                            {/* Attention Flag */}
                            {needsAttention && (
                                <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                                    <Flag className="w-3 h-3 mr-1" />
                                    Attention
                                </Badge>
                            )}

                            {/* Sentiment */}
                            {sentiment && (
                                <Badge className={getSentimentColor(sentiment.label)}>
                                    <span className="capitalize">{sentiment.label}</span>
                                </Badge>
                            )}

                            {/* Analysis Status */}
                            <Badge variant={review.analyzed_data ? "default" : "secondary"}>
                                <Brain className="w-3 h-3 mr-1" />
                                {review.analyzed_data ? 'Analyzed' : 'Pending'}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-8 pb-8 border-t border-white/10 bg-white/20 animate-in slide-in-from-top duration-300">
                    <div className="pt-6 space-y-6">
                        {/* Full Review Text */}
                        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                                Full Review
                            </h4>
                            <blockquote className="text-gray-800 leading-relaxed italic border-l-4 border-blue-400 pl-4">
                                "{reviewText}"
                            </blockquote>
                        </div>

                        {/* AI Analysis */}
                        {review.analyzed_data && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    {/* Sentiment Analysis */}
                                    {sentiment && (
                                        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-5">
                                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                                                Sentiment Analysis
                                            </h5>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Confidence:</span>
                                                    <span className="font-medium">{(sentiment.confidence * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Tone:</span>
                                                    <span className="capitalize">{sentiment.emotional_tone}</span>
                                                </div>
                                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                    <p className="text-sm text-gray-700">{sentiment.reasoning}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Topics */}
                                    {topics.length > 0 && (
                                        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-5">
                                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Target className="w-4 h-4 mr-2 text-indigo-600" />
                                                Key Topics
                                            </h5>
                                            <div className="flex flex-wrap gap-2">
                                                {topics.slice(0, 6).map((topic, i) => (
                                                    <Badge 
                                                        key={i} 
                                                        className={getSentimentColor(topic.sentiment)}
                                                    >
                                                        {topic.topic} ({(topic.confidence * 100).toFixed(0)}%)
                                                    </Badge>
                                                ))}
                                                {topics.length > 6 && (
                                                    <Badge variant="secondary">
                                                        +{topics.length - 6} more
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    {/* Urgency */}
                                    {urgency && (
                                        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-5">
                                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                                                Urgency Assessment
                                            </h5>
                                            <div className="space-y-2">
                                                <div className="text-center">
                                                    <Badge className={getUrgencyColor(urgency.level)}>
                                                        {urgency.level.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <div className="font-medium">Immediate Response</div>
                                                        {urgency.requires_immediate_response ? (
                                                            <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-1" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-gray-400 mx-auto mt-1" />
                                                        )}
                                                    </div>
                                                    <div className="text-center p-2 bg-gray-50 rounded-lg">
                                                        <div className="font-medium">Escalation</div>
                                                        {urgency.escalation_needed ? (
                                                            <CheckCircle className="w-4 h-4 text-green-600 mx-auto mt-1" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-gray-400 mx-auto mt-1" />
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Business Insights Preview */}
                                    {businessInsights && (
                                        <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-5">
                                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Brain className="w-4 h-4 mr-2 text-purple-600" />
                                                Business Impact
                                            </h5>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span>Impact Level:</span>
                                                    <Badge variant={businessInsights.estimated_impact === 'high' ? 'destructive' : 'secondary'}>
                                                        {businessInsights.estimated_impact.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Follow-up:</span>
                                                    {businessInsights.follow_up_needed ? (
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                                {businessInsights.actionable_recommendations.length > 0 && (
                                                    <div className="mt-3">
                                                        <span className="text-sm font-medium">Top Recommendation:</span>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {businessInsights.actionable_recommendations[0]}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/10">
                            <Button variant="outline" size="sm">
                                <Flag className="w-4 h-4 mr-2" />
                                Report Issue
                            </Button>
                            <Button variant="outline" size="sm">
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Re-analyze
                            </Button>
                            <Button size="sm" className="bg-gradient-to-r from-primary to-accent">
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reviews
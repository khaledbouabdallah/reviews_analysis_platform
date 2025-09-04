import { RefreshCw, MessageSquare, Star, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Review, getReviewRating, reviewNeedsAttention, getAnalysisResults } from '@/services/review';

interface ReviewStatsProps {
    reviews: Review[];
    totalReviews: number;
    isLoading: boolean;
    onRefresh: () => void;
    // ADDED: Optional total analyzed count from backend
    totalAnalyzed?: number;
}

export const ReviewStats = ({ 
    reviews, 
    totalReviews, 
    isLoading, 
    onRefresh, 
    totalAnalyzed 
}: ReviewStatsProps) => {
    // Calculate stats from current page reviews for detailed metrics
    const calculateStats = () => {
        if (!reviews.length) return {
            total: totalReviews,
            analyzed: totalAnalyzed ?? 0, // Use backend count if available
            positive: 0,
            negative: 0,
            neutral: 0,
            needingAttention: 0,
            avgRating: 0
        };

        // FIXED: Use correct analysis detection
        const currentPageAnalyzed = reviews.filter(r => getAnalysisResults(r) !== null).length;
        
        // Use backend total if available, otherwise estimate from current page
        const analyzedCount = totalAnalyzed ?? (totalReviews > 0 ? 
            Math.round((currentPageAnalyzed / reviews.length) * totalReviews) : 0
        );

        // Calculate sentiment from current page (for display)
        const positive = reviews.filter(r => {
            const analysis = getAnalysisResults(r);
            return analysis?.sentiment?.label === 'positive';
        }).length;
        
        const negative = reviews.filter(r => {
            const analysis = getAnalysisResults(r);
            return analysis?.sentiment?.label === 'negative';
        }).length;
        
        const neutral = reviews.filter(r => {
            const analysis = getAnalysisResults(r);
            return analysis?.sentiment?.label === 'neutral';
        }).length;

        const needingAttention = reviews.filter(reviewNeedsAttention).length;

        const ratingsSum = reviews.reduce((sum, r) => {
            const rating = getReviewRating(r);
            return rating ? sum + rating : sum;
        }, 0);
        const ratingsCount = reviews.filter(r => getReviewRating(r)).length;
        const avgRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;

        return {
            total: totalReviews,
            analyzed: analyzedCount,
            positive,
            negative,
            neutral,
            needingAttention,
            avgRating
        };
    };

    const stats = calculateStats();

    const statCards = [
        {
            title: 'Total Reviews',
            value: stats.total.toString(),
            subtitle: `${stats.analyzed} analyzed`,
            icon: MessageSquare,
            color: 'from-blue-500 to-indigo-500',
            bgColor: 'from-blue-500/10 to-indigo-500/10',
        },
        {
            title: 'Average Rating',
            value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '—',
            subtitle: stats.avgRating > 0 ? 'out of 5.0' : 'No ratings yet',
            icon: Star,
            color: 'from-yellow-500 to-orange-500',
            bgColor: 'from-yellow-500/10 to-orange-500/10',
        },
        {
            title: 'Sentiment',
            value: stats.analyzed > 0 ? 
                `${stats.positive}/${stats.negative}/${stats.neutral}` : '—',
            subtitle: stats.analyzed > 0 ? 'Positive/Negative/Neutral' : 'No analysis yet',
            icon: TrendingUp,
            color: 'from-green-500 to-teal-500',
            bgColor: 'from-green-500/10 to-teal-500/10',
        },
        {
            title: 'Need Attention',
            value: stats.needingAttention.toString(),
            subtitle: 'Critical issues detected',
            icon: AlertTriangle,
            color: 'from-red-500 to-pink-500',
            bgColor: 'from-red-500/10 to-pink-500/10',
        },
    ];

    return (
        <div className="relative">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl" />
            <div className="relative p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <MessageSquare className="h-6 w-6 text-blue-600" />
                        <h2 className="text-xl font-bold text-gray-900">Review Statistics</h2>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={isLoading}
                        className="bg-white/50 hover:bg-white/70 border-white/40"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat, index) => (
                        <div key={index} className="relative group">
                            <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} rounded-2xl border border-white/40 group-hover:shadow-lg transition-all duration-300`} />
                            <div className="relative p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <stat.icon className="h-5 w-5 text-gray-600" />
                                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${stat.color} opacity-20`} />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                    <p className="text-sm text-gray-600">{stat.title}</p>
                                    <p className="text-xs text-gray-500">{stat.subtitle}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Analysis Progress Bar */}
                {stats.total > 0 && (
                    <div className="mt-6 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40">
                        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                            <span>Analysis Progress</span>
                            <span>{Math.round((stats.analyzed / stats.total) * 100)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min((stats.analyzed / stats.total) * 100, 100)}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
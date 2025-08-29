import { RefreshCw, MessageSquare, Star, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Review, getReviewRating, reviewNeedsAttention } from '@/services/review';

interface ReviewStatsProps {
    reviews: Review[];
    totalReviews: number;
    isLoading: boolean;
    onRefresh: () => void;
}

export const ReviewStats = ({ reviews, totalReviews, isLoading, onRefresh }: ReviewStatsProps) => {
    // Calculate stats from current page reviews for detailed metrics
    const calculateStats = () => {
        if (!reviews.length) return {
            total: totalReviews,
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
            total: totalReviews,
            analyzed,
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
            value: stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '0.0',
            subtitle: 'out of 5 stars',
            icon: Star,
            color: 'from-yellow-500 to-orange-500',
            bgColor: 'from-yellow-500/10 to-orange-500/10',
        },
        {
            title: 'Sentiment Split',
            value: `${stats.positive}/${stats.negative}`,
            subtitle: 'positive/negative',
            icon: TrendingUp,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'from-green-500/10 to-emerald-500/10',
        },
        {
            title: 'Need Attention',
            value: stats.needingAttention.toString(),
            subtitle: 'urgent reviews',
            icon: AlertTriangle,
            color: 'from-red-500 to-pink-500',
            bgColor: 'from-red-500/10 to-pink-500/10',
        }
    ];

    return (
        <div className="space-y-6">
            {/* Refresh Button */}
            <div className="flex justify-end">
                <Button
                    variant="outline"
                    onClick={onRefresh}
                    disabled={isLoading}
                    className="bg-white/50 backdrop-blur-sm border-white/40 hover:bg-white/70"
                >
                    <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statCards.map((stat, index) => (
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
        </div>
    );
};
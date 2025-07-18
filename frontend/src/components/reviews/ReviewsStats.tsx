// src/components/reviews/ReviewsStats.tsx
'use client';

import { Star, ThumbsUp, ThumbsDown, Minus, MessageSquare, Brain, TrendingUp } from 'lucide-react';
import { Review, reviewService } from '@/services/review';

interface ReviewsStatsProps {
    reviews: Review[];
    loading: boolean;
}



export function ReviewsStats({ reviews, loading }: ReviewsStatsProps) {



    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="relative animate-pulse">
                        <div className="absolute inset-0 bg-white/40 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg" />
                        <div className="relative p-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                                <div className="w-16 h-6 bg-gray-200 rounded"></div>
                            </div>
                            <div className="w-20 h-8 bg-gray-200 rounded mb-2"></div>
                            <div className="w-24 h-4 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    const averageRating = reviewService.getAverageRating(reviews);
    const sentimentDistribution = reviewService.getSentimentDistribution(reviews);
    const ratingDistribution = reviewService.getRatingDistribution(reviews);
    const reviewsWithComments = reviews.filter(review => reviewService.hasComment(review)).length;
    const processedReviews = reviews.filter(review => reviewService.isProcessed(review)).length;

    const stats = [
        {
            title: 'Average Rating',
            value: averageRating.toString(),
            subtitle: `${reviews.length} total reviews`,
            icon: Star,
            color: 'from-yellow-500 to-orange-500',
            bgColor: 'from-yellow-500/10 to-orange-500/10',
            extra: (
                <div className="flex items-center mt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={`h-4 w-4 ${star <= Math.round(averageRating)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                                }`}
                        />
                    ))}
                </div>
            )
        },
        {
            title: 'Sentiment Analysis',
            value: sentimentDistribution.positive.toString(),
            subtitle: 'positive reviews',
            icon: ThumbsUp,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'from-green-500/10 to-emerald-500/10',
            extra: (
                <div className="grid grid-cols-3 gap-1 mt-2 text-xs">
                    <div className="text-center">
                        <div className="text-green-600 font-medium">{sentimentDistribution.positive}</div>
                        <div className="text-gray-500">Positive</div>
                    </div>
                    <div className="text-center">
                        <div className="text-gray-600 font-medium">{sentimentDistribution.neutral}</div>
                        <div className="text-gray-500">Neutral</div>
                    </div>
                    <div className="text-center">
                        <div className="text-red-600 font-medium">{sentimentDistribution.negative}</div>
                        <div className="text-gray-500">Negative</div>
                    </div>
                </div>
            )
        },
        {
            title: 'With Comments',
            value: reviewsWithComments.toString(),
            subtitle: `${Math.round((reviewsWithComments / reviews.length) * 100)}% have text`,
            icon: MessageSquare,
            color: 'from-blue-500 to-indigo-500',
            bgColor: 'from-blue-500/10 to-indigo-500/10',
            extra: (
                <div className="mt-2">
                    <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                            style={{
                                width: `${(reviewsWithComments / reviews.length) * 100}%`
                            }}
                        />
                    </div>
                </div>
            )
        },
        {
            title: 'AI Processed',
            value: processedReviews.toString(),
            subtitle: `${Math.round((processedReviews / reviews.length) * 100)}% analyzed`,
            icon: Brain,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'from-purple-500/10 to-pink-500/10',
            extra: (
                <div className="mt-2">
                    <div className="w-full bg-gray-200/50 rounded-full h-2 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 ease-out"
                            style={{
                                width: `${(processedReviews / reviews.length) * 100}%`,
                                animationDelay: '0.5s'
                            }}
                        />
                    </div>
                </div>
            )
        }
    ];

    return (
        <div className="space-y-6">
            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="group relative animate-in slide-in-from-bottom duration-500"
                        style={{ animationDelay: `${index * 0.1}s` }}
                    >
                        {/* Glassmorphic background with enhanced effects */}
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

                            {stat.extra}
                        </div>
                    </div>
                ))}
            </div>

            {/* Rating Distribution Chart */}
            <div className="relative animate-in slide-in-from-bottom duration-700" style={{ animationDelay: '0.5s' }}>
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/30 shadow-xl" />
                <div className="relative p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2" />
                        Rating Distribution
                    </h3>

                    <div className="space-y-4">
                        {[5, 4, 3, 2, 1].map((rating) => {
                            const count = ratingDistribution[rating] || 0;
                            const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;

                            return (
                                <div key={rating} className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-1 w-16">
                                        <span className="text-sm font-medium text-gray-700">{rating}</span>
                                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                    </div>

                                    <div className="flex-1 bg-gray-200/50 rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-1000 ease-out"
                                            style={{
                                                width: `${percentage}%`,
                                                animationDelay: `${(5 - rating) * 0.2}s`
                                            }}
                                        />
                                    </div>

                                    <div className="w-16 text-right">
                                        <span className="text-sm font-medium text-gray-900">{count}</span>
                                        <span className="text-xs text-gray-500 ml-1">({Math.round(percentage)}%)</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Quick Insights */}
            {reviews.length > 0 && (
                <div className="relative animate-in slide-in-from-bottom duration-700" style={{ animationDelay: '0.7s' }}>
                    <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-2xl border border-white/30 shadow-xl" />
                    <div className="relative p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                                <div className="flex items-center space-x-2 mb-2">
                                    {sentimentDistribution.positive > sentimentDistribution.negative ? (
                                        <ThumbsUp className="h-4 w-4 text-green-600" />
                                    ) : (
                                        <ThumbsDown className="h-4 w-4 text-red-600" />
                                    )}
                                    <span className="text-sm font-medium text-gray-700">Overall Sentiment</span>
                                </div>
                                <p className="text-xs text-gray-600">
                                    {sentimentDistribution.positive > sentimentDistribution.negative
                                        ? `Mostly positive feedback (${Math.round((sentimentDistribution.positive / reviews.length) * 100)}%)`
                                        : sentimentDistribution.negative > sentimentDistribution.positive
                                            ? `Concerning negative feedback (${Math.round((sentimentDistribution.negative / reviews.length) * 100)}%)`
                                            : 'Mixed feedback'
                                    }
                                </p>
                            </div>

                            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                                <div className="flex items-center space-x-2 mb-2">
                                    <Star className="h-4 w-4 text-yellow-600" />
                                    <span className="text-sm font-medium text-gray-700">Rating Quality</span>
                                </div>
                                <p className="text-xs text-gray-600">
                                    {averageRating >= 4
                                        ? 'Excellent ratings above 4.0'
                                        : averageRating >= 3
                                            ? 'Good ratings around 3.0+'
                                            : 'Below average ratings - needs attention'
                                    }
                                </p>
                            </div>

                            <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                                <div className="flex items-center space-x-2 mb-2">
                                    <MessageSquare className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm font-medium text-gray-700">Engagement</span>
                                </div>
                                <p className="text-xs text-gray-600">
                                    {reviewsWithComments / reviews.length >= 0.7
                                        ? 'High engagement with detailed comments'
                                        : reviewsWithComments / reviews.length >= 0.3
                                            ? 'Moderate engagement'
                                            : 'Low engagement - mostly ratings only'
                                    }
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
// frontend/src/components/reviews/ReviewRow.tsx

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    MessageSquare, 
    Brain, 
    TrendingUp, 
    AlertTriangle, 
    Globe, 
    Star,
    Target,
    Shield,
    ExternalLink,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { 
    Review, 
    getReviewRating, 
    getReviewText, 
    getSentimentColor,
    getAnalysisResults,
    getReviewSentiment,
    getReviewUrgency,
    getReviewTopics,
    isReviewSpam,
    reviewNeedsAttention
} from '@/services/review';

interface ReviewRowProps {
    review: Review;
    onViewDetails: (reviewId: string) => void;
}

export const ReviewRow: React.FC<ReviewRowProps> = ({ review, onViewDetails }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const rating = getReviewRating(review);
    const reviewText = getReviewText(review);
    const analysisResults = getAnalysisResults(review);
    const sentiment = getReviewSentiment(review);
    const urgency = getReviewUrgency(review);
    const topics = getReviewTopics(review);

    // Truncated text for collapsed view
    const truncatedText = reviewText.length > 150 ? `${reviewText.substring(0, 150)}...` : reviewText;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 border border-white/40 backdrop-blur-sm hover:shadow-xl transition-all duration-300">
            {/* Main Content */}
            <div className="p-6">
                <div className="flex items-start justify-between space-x-4">
                    {/* Left Content */}
                    <div className="flex-1 space-y-3">
                        {/* Header with Rating and Source */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                {rating && (
                                    <div className="flex items-center">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${
                                                    i < rating
                                                        ? 'text-yellow-400 fill-current'
                                                        : 'text-gray-300'
                                                }`}
                                            />
                                        ))}
                                        <span className="text-sm text-gray-600 ml-2">({rating}/5)</span>
                                    </div>
                                )}
                                
                                <Badge variant="outline" className="text-xs">
                                    <Globe className="w-3 h-3 mr-1" />
                                    {review.source_type}
                                </Badge>

                                {review.data?.username && (
                                    <span className="text-sm text-gray-600">by {review.data.username}</span>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                {isExpanded ? (
                                    <ChevronUp className="w-4 h-4" />
                                ) : (
                                    <ChevronDown className="w-4 h-4" />
                                )}
                            </Button>
                        </div>

                        {/* Review Text Preview */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/40">
                            <blockquote className="text-gray-800 leading-relaxed italic">
                                "{isExpanded ? reviewText : truncatedText}"
                            </blockquote>
                        </div>

                        {/* Analysis Status Row */}
                        <div className="flex items-center justify-between">
                            {/* Analysis Badges */}
                            <div className="flex items-center space-x-2">
                                {/* AI Status Badge */}
                                <Badge variant={analysisResults ? "default" : "secondary"}>
                                    <Brain className="w-3 h-3 mr-1" />
                                    {analysisResults ? 'AI ✓' : 'Pending'}
                                </Badge>

                                {/* Sentiment Badge */}
                                {sentiment && (
                                    <Badge className={getSentimentColor(sentiment)}>
                                        <TrendingUp className="w-3 h-3 mr-1" />
                                        {sentiment}
                                    </Badge>
                                )}

                                {/* Urgency Badge */}
                                {urgency && urgency !== 'none' && (
                                    <Badge variant={
                                        urgency === 'critical' ? 'destructive' :
                                        urgency === 'high' ? 'default' :
                                        urgency === 'medium' ? 'secondary' :
                                        'outline'
                                    }>
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        {urgency}
                                    </Badge>
                                )}

                                {/* Spam Badge */}
                                {isReviewSpam(review) && (
                                    <Badge variant="destructive">
                                        <Shield className="w-3 h-3 mr-1" />
                                        SPAM
                                    </Badge>
                                )}

                                {/* Needs Attention Badge */}
                                {reviewNeedsAttention(review) && (
                                    <Badge variant="destructive" className="animate-pulse">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        URGENT
                                    </Badge>
                                )}
                            </div>

                            {/* Date */}
                            {review.data?.date && (
                                <span className="text-xs text-gray-500">
                                    {new Date(review.data.date).toLocaleDateString()}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
                <div className="px-6 pb-6 border-t border-white/20 bg-gradient-to-r from-white/20 to-white/10 animate-in slide-in-from-top duration-300">
                    <div className="pt-6 space-y-6">
                        {/* Review Metadata */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/40">
                            <div className="text-xs text-gray-600 space-y-1">
                                <div><strong>Source:</strong> {review.source_type}</div>
                                <div><strong>Job Type:</strong> {review.job_type}</div>
                                <div><strong>Review ID:</strong> {review.id}</div>
                                <div><strong>Created:</strong> {new Date(review.created_at).toLocaleString()}</div>
                            </div>
                        </div>

                        {/* AI Analysis Summary */}
                        {analysisResults && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    {/* Sentiment Analysis */}
                                    {sentiment && (
                                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
                                                Sentiment Analysis
                                            </h4>
                                            <div className="flex items-center space-x-3">
                                                <Badge className={getSentimentColor(sentiment)}>
                                                    {sentiment.toUpperCase()}
                                                </Badge>
                                                <span className="text-sm text-gray-600">
                                                    {Math.round((analysisResults.sentiment?.confidence || 0) * 100)}% confidence
                                                </span>
                                            </div>
                                            {analysisResults.sentiment?.emotional_tone && (
                                                <p className="text-sm text-gray-600 mt-2">
                                                    <strong>Tone:</strong> {analysisResults.sentiment.emotional_tone}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Topics Analysis */}
                                    {topics.length > 0 && (
                                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Target className="w-5 h-5 mr-2 text-purple-600" />
                                                Key Topics
                                            </h4>
                                            <div className="space-y-2">
                                                {topics.slice(0, 3).map((topic, i) => (
                                                    <div key={i} className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-900">{topic.topic}</span>
                                                        <Badge className={getSentimentColor(topic.sentiment)} size="sm">
                                                            {topic.sentiment}
                                                        </Badge>
                                                    </div>
                                                ))}
                                                {topics.length > 3 && (
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        +{topics.length - 3} more topics
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    {/* Urgency Classification */}
                                    {urgency && (
                                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <AlertTriangle className="w-5 h-5 mr-2 text-orange-600" />
                                                Urgency Level
                                            </h4>
                                            <div className="flex items-center space-x-3">
                                                <Badge variant={
                                                    urgency === 'critical' ? 'destructive' :
                                                    urgency === 'high' ? 'default' :
                                                    urgency === 'medium' ? 'secondary' :
                                                    'outline'
                                                }>
                                                    {urgency.toUpperCase()}
                                                </Badge>
                                                {analysisResults.urgency_classification?.requires_immediate_response && (
                                                    <Badge variant="destructive" className="text-xs">
                                                        IMMEDIATE
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Spam Detection */}
                                    {analysisResults.spam_detection && (
                                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Shield className="w-5 h-5 mr-2 text-red-600" />
                                                Spam Detection
                                            </h4>
                                            <div className="flex items-center space-x-3">
                                                <Badge variant={isReviewSpam(review) ? "destructive" : "secondary"}>
                                                    {isReviewSpam(review) ? 'SPAM' : 'LEGITIMATE'}
                                                </Badge>
                                                <span className="text-sm text-gray-600">
                                                    {Math.round((analysisResults.spam_detection?.confidence || 0) * 100)}% confidence
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-white/20">
                            <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => onViewDetails(review.id)}
                                className="bg-white/80 hover:bg-white"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Full Details
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
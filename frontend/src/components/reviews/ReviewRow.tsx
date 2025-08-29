import { 
    ChevronDown, 
    ChevronRight, 
    Star, 
    Calendar, 
    MessageSquare, 
    Flag, 
    Brain, 
    TrendingUp, 
    AlertTriangle, 
    Target, 
    CheckCircle, 
    XCircle, 
    Eye, 
    RotateCcw 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Review, getSentimentColor, getUrgencyColor, getReviewRating, getReviewText, reviewNeedsAttention } from '@/services/review';

interface ReviewRowProps {
    review: Review;
    isExpanded: boolean;
    onToggleExpansion: () => void;
    onViewDetails: () => void;
    index: number;
}

export const ReviewRow = ({ review, isExpanded, onToggleExpansion, onViewDetails, index }: ReviewRowProps) => {
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
            className="transition-all duration-300 hover:bg-white/30 border-b border-white/10 last:border-b-0"
            style={{ animationDelay: `${index * 0.05}s` }}
        >
            {/* Main Row - IMPROVED STYLING */}
            <div className="px-8 py-6 cursor-pointer bg-white/5 hover:bg-white/20 transition-colors duration-200" onClick={onToggleExpansion}>
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
                        <div className="flex items-center space-x-2 min-w-[140px]">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">
                                {new Date(review.created_at).toLocaleDateString()}
                            </span>
                        </div>

                        {/* Rating */}
                        <div className="min-w-[130px]">
                            {rating ? renderStars(rating) : (
                                <span className="text-sm text-gray-500">No rating</span>
                            )}
                        </div>

                        {/* Review Preview - IMPROVED */}
                        <div className="flex-1 min-w-0 bg-white/30 rounded-lg p-3">
                            <p className="text-gray-800 line-clamp-2 text-sm leading-relaxed">
                                "{reviewText.substring(0, 120)}{reviewText.length > 120 ? '...' : ''}"
                            </p>
                        </div>

                        {/* AI Analysis Badges */}
                        <div className="flex items-center space-x-2">
                            {/* Attention Flag */}
                            {needsAttention && (
                                <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                                    <Flag className="w-3 h-3 mr-1" />
                                    Urgent
                                </Badge>
                            )}

                            {/* Sentiment */}
                            {sentiment && (
                                <Badge className={getSentimentColor(sentiment.label)}>
                                    <span className="capitalize">{sentiment.label}</span>
                                    <span className="ml-1 text-xs">
                                        {(sentiment.confidence * 100).toFixed(0)}%
                                    </span>
                                </Badge>
                            )}

                            {/* Analysis Status */}
                            <Badge variant={review.analyzed_data ? "default" : "secondary"}>
                                <Brain className="w-3 h-3 mr-1" />
                                {review.analyzed_data ? 'AI ✓' : 'Pending'}
                            </Badge>
                        </div>
                    </div>
                </div>
            </div>

            {/* Expanded Content - ENHANCED */}
            {isExpanded && (
                <div className="px-8 pb-8 border-t border-white/20 bg-gradient-to-r from-white/20 to-white/10 animate-in slide-in-from-top duration-300">
                    <div className="pt-6 space-y-6">
                        {/* Full Review Text */}
                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                            <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                                Full Review
                            </h4>
                            <blockquote className="text-gray-800 leading-relaxed italic border-l-4 border-blue-400 pl-4 bg-blue-50/50 rounded-r-lg p-4">
                                "{reviewText}"
                            </blockquote>
                            
                            {/* Review Metadata */}
                            <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600 space-y-1">
                                <div>Source: {review.source_type}</div>
                                <div>Job Type: {review.job_type}</div>
                                <div>Review ID: {review.id}</div>
                            </div>
                        </div>

                        {/* AI Analysis */}
                        {review.analyzed_data && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    {/* Sentiment Analysis */}
                                    {sentiment && (
                                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/40">
                                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                                                Sentiment Analysis
                                            </h5>
                                            <div className="space-y-3">
                                                <div className="flex items-center justify-between">
                                                    <span>Overall:</span>
                                                    <Badge className={getSentimentColor(sentiment.label)}>
                                                        {sentiment.label.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Confidence:</span>
                                                    <span className="font-medium">{(sentiment.confidence * 100).toFixed(1)}%</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span>Tone:</span>
                                                    <span className="capitalize font-medium">{sentiment.emotional_tone}</span>
                                                </div>
                                                <div className="mt-3 p-3 bg-gray-100 rounded-lg">
                                                    <p className="text-sm text-gray-700 font-medium">AI Reasoning:</p>
                                                    <p className="text-sm text-gray-600 mt-1">{sentiment.reasoning}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Topics */}
                                    {topics.length > 0 && (
                                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/40">
                                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Target className="w-4 h-4 mr-2 text-indigo-600" />
                                                Key Topics ({topics.length})
                                            </h5>
                                            <div className="space-y-3">
                                                {topics.slice(0, 4).map((topic, i) => (
                                                    <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                                        <div className="flex items-center space-x-2">
                                                            <Badge className={getSentimentColor(topic.sentiment)} size="sm">
                                                                {topic.topic}
                                                            </Badge>
                                                            <span className="text-sm text-gray-600">
                                                                {(topic.confidence * 100).toFixed(0)}% confident
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                                {topics.length > 4 && (
                                                    <Badge variant="secondary" className="mt-2">
                                                        +{topics.length - 4} more topics
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
                                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/40">
                                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                                                Urgency Assessment
                                            </h5>
                                            <div className="space-y-3">
                                                <div className="text-center">
                                                    <Badge className={getUrgencyColor(urgency.level)} size="lg">
                                                        {urgency.level.toUpperCase()} PRIORITY
                                                    </Badge>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3 text-xs">
                                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                        <div className="font-medium mb-2">Immediate Response</div>
                                                        {urgency.requires_immediate_response ? (
                                                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 text-gray-400 mx-auto" />
                                                        )}
                                                    </div>
                                                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                        <div className="font-medium mb-2">Escalation Needed</div>
                                                        {urgency.escalation_needed ? (
                                                            <CheckCircle className="w-5 h-5 text-green-600 mx-auto" />
                                                        ) : (
                                                            <XCircle className="w-5 h-5 text-gray-400 mx-auto" />
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="mt-3 p-3 bg-orange-50 rounded-lg">
                                                    <p className="text-sm text-orange-800 font-medium">Reason:</p>
                                                    <p className="text-sm text-orange-700 mt-1">{urgency.reasoning}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Business Insights Preview */}
                                    {businessInsights && (
                                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-white/40">
                                            <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Brain className="w-4 h-4 mr-2 text-purple-600" />
                                                Business Impact
                                            </h5>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span>Impact Level:</span>
                                                    <Badge variant={businessInsights.estimated_impact === 'high' ? 'destructive' : 'secondary'}>
                                                        {businessInsights.estimated_impact.toUpperCase()}
                                                    </Badge>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span>Follow-up Needed:</span>
                                                    {businessInsights.follow_up_needed ? (
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                    ) : (
                                                        <XCircle className="w-4 h-4 text-gray-400" />
                                                    )}
                                                </div>
                                                {businessInsights.actionable_recommendations.length > 0 && (
                                                    <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                                                        <span className="text-sm font-medium text-purple-800">Top Recommendation:</span>
                                                        <p className="text-sm text-purple-700 mt-1">
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

                        {/* Action Buttons - ENHANCED */}
                        <div className="flex items-center justify-between pt-4 border-t border-white/20">
                            <div className="flex items-center space-x-3">
                                <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700">
                                    <Flag className="w-4 h-4 mr-2" />
                                    Report Issue
                                </Button>
                                <Button variant="outline" size="sm" className="text-blue-600 hover:text-blue-700">
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Re-analyze
                                </Button>
                            </div>
                            
                            <Button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onViewDetails();
                                }} 
                                size="sm" 
                                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                            >
                                <Eye className="w-4 h-4 mr-2" />
                                View Full Details
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
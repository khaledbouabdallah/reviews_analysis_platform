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
    ChevronUp,
    Eye,
    Calendar,
    User
} from 'lucide-react';
import { 
    Review, 
    getReviewRating, 
    getReviewText, 
    getSentimentColor,
    getUrgencyColor,
    getAnalysisResults,
    getReviewSentiment,
    getReviewUrgency,
    getReviewTopics,
    isReviewSpam,
    reviewNeedsAttention
} from '@/services/review';

interface ReviewRowProps {
    review: Review;
    isExpanded: boolean;
    onToggleExpansion: () => void;
    onViewDetails: (reviewId: string) => void;
    index: number;
    visibleColumns: string[];
}

export const ReviewRow: React.FC<ReviewRowProps> = ({ 
    review, 
    isExpanded, 
    onToggleExpansion, 
    onViewDetails,
    index,
    visibleColumns
}) => {
    const rating = getReviewRating(review);
    const reviewText = getReviewText(review);
    const analysisResults = getAnalysisResults(review);
    const sentiment = getReviewSentiment(review);
    const urgency = getReviewUrgency(review);
    const topics = getReviewTopics(review);
    const isSpam = isReviewSpam(review);
    const needsAttention = reviewNeedsAttention(review);

    // Truncated text for collapsed view
    const truncatedText = reviewText.length > 200 ? `${reviewText.substring(0, 200)}...` : reviewText;

    return (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-white/80 to-white/60 border border-white/40 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
            {/* Main Content */}
            <div className="p-6">
                {/* Header Row */}
                <div className="flex items-start justify-between space-x-4 mb-4">
                    {/* Left: Rating & Basic Info */}
                    <div className="flex items-center space-x-4 flex-1">
                        {/* Rating */}
                        {visibleColumns.includes('rating') && rating && (
                            <div className="flex items-center bg-white/50 rounded-lg px-3 py-1">
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
                                <span className="text-sm text-gray-700 ml-2 font-medium">
                                    {rating}/5
                                </span>
                            </div>
                        )}

                        {/* Source Info */}
                        {visibleColumns.includes('source') && (
                            <Badge variant="outline" className="text-xs bg-white/50">
                                <Globe className="w-3 h-3 mr-1" />
                                {review.source_type}
                            </Badge>
                        )}

                        {/* Username */}
                        {visibleColumns.includes('username') && review.data?.username && (
                            <div className="flex items-center text-sm text-gray-600">
                                <User className="w-3 h-3 mr-1" />
                                {review.data.username}
                            </div>
                        )}

                        {/* Date */}
                        {visibleColumns.includes('date') && (
                            <div className="flex items-center text-sm text-gray-500">
                                <Calendar className="w-3 h-3 mr-1" />
                                {new Date(review.created_at).toLocaleDateString()}
                            </div>
                        )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center space-x-2">
                        {/* ADDED: Direct View Details Button */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onViewDetails(review.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/50 hover:bg-white/70"
                        >
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                        </Button>

                        {/* Expand/Collapse Button */}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleExpansion();
                            }}
                            className="text-gray-500 hover:text-gray-700 bg-white/30 hover:bg-white/50"
                        >
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </Button>
                    </div>
                </div>

                {/* AI Analysis Status Row - IMPROVED LAYOUT */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2 flex-wrap">
                        {/* AI Analysis Status */}
                        <Badge variant={analysisResults ? "default" : "secondary"} className="bg-white/50">
                            <Brain className="w-3 h-3 mr-1" />
                            {analysisResults ? 'AI Analyzed' : 'Not Analyzed'}
                        </Badge>

                        {/* Sentiment */}
                        {visibleColumns.includes('sentiment') && sentiment && (
                            <Badge className={getSentimentColor(sentiment)}>
                                <TrendingUp className="w-3 h-3 mr-1" />
                                {sentiment.toUpperCase()}
                            </Badge>
                        )}

                        {/* Urgency */}
                        {visibleColumns.includes('urgency') && urgency && urgency !== 'none' && (
                            <Badge className={getUrgencyColor(urgency)}>
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                {urgency.toUpperCase()}
                            </Badge>
                        )}

                        {/* Spam Status */}
                        {visibleColumns.includes('spam') && isSpam && (
                            <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200">
                                <Shield className="w-3 h-3 mr-1" />
                                SPAM
                            </Badge>
                        )}

                        {/* Needs Attention */}
                        {needsAttention && (
                            <Badge variant="destructive" className="animate-pulse">
                                <AlertTriangle className="w-3 h-3 mr-1" />
                                URGENT
                            </Badge>
                        )}
                    </div>

                    {/* Topics Preview */}
                    {visibleColumns.includes('topics') && topics.length > 0 && (
                        <div className="flex items-center space-x-1">
                            <Target className="w-3 h-3 text-gray-500" />
                            <div className="flex space-x-1">
                                {topics.slice(0, 3).map((topic, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs bg-white/30">
                                        {topic.topic}
                                    </Badge>
                                ))}
                                {topics.length > 3 && (
                                    <Badge variant="outline" className="text-xs bg-white/30">
                                        +{topics.length - 3}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Review Text - IMPROVED */}
                <div className="bg-white/60 backdrop-blur-sm rounded-lg p-4 border border-white/40">
                    <blockquote className="text-gray-800 leading-relaxed italic break-words whitespace-pre-wrap">
                        "{isExpanded ? reviewText : truncatedText}"
                    </blockquote>
                </div>

                {/* Expanded Content */}
                {isExpanded && analysisResults && (
                    <div className="mt-6 pt-6 border-t border-white/40 space-y-4">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                            <Brain className="w-4 h-4 mr-2 text-blue-600" />
                            AI Analysis Summary
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Left Column */}
                            <div className="space-y-3">
                                {/* Sentiment Details */}
                                {analysisResults.sentiment && (
                                    <div className="bg-white/50 rounded-lg p-3 border border-white/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Sentiment</span>
                                            <Badge className={getSentimentColor(analysisResults.sentiment.label)}>
                                                {analysisResults.sentiment.label?.toUpperCase()}
                                            </Badge>
                                        </div>
                                        {analysisResults.sentiment.confidence && (
                                            <div className="text-xs text-gray-500 mt-1">
                                                {Math.round(analysisResults.sentiment.confidence * 100)}% confidence
                                            </div>
                                        )}
                                        {analysisResults.sentiment.emotional_tone && (
                                            <div className="text-xs text-gray-600 mt-1">
                                                <strong>Tone:</strong> {analysisResults.sentiment.emotional_tone}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Language & Translation */}
                                {analysisResults.language_analysis && (
                                    <div className="bg-white/50 rounded-lg p-3 border border-white/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Language</span>
                                            <Badge variant="outline">
                                                {analysisResults.language_analysis.detected_language}
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column */}
                            <div className="space-y-3">
                                {/* Urgency Details */}
                                {analysisResults.urgency_classification && (
                                    <div className="bg-white/50 rounded-lg p-3 border border-white/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Urgency</span>
                                            <Badge className={getUrgencyColor(analysisResults.urgency_classification.level)}>
                                                {analysisResults.urgency_classification.level?.toUpperCase()}
                                            </Badge>
                                        </div>
                                        {analysisResults.urgency_classification.reasoning && (
                                            <div className="text-xs text-gray-600 mt-2 break-words">
                                                {analysisResults.urgency_classification.reasoning}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Spam Detection */}
                                {analysisResults.spam_detection && (
                                    <div className="bg-white/50 rounded-lg p-3 border border-white/30">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Spam Detection</span>
                                            <Badge variant={analysisResults.spam_detection.is_spam ? 'destructive' : 'default'}>
                                                {analysisResults.spam_detection.is_spam ? 'SPAM' : 'LEGITIMATE'}
                                            </Badge>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {Math.round(analysisResults.spam_detection.confidence * 100)}% confidence
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Business Insights Preview */}
                        {analysisResults.business_insights && (
                            <div className="bg-white/50 rounded-lg p-3 border border-white/30">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700 flex items-center">
                                        <Target className="w-3 h-3 mr-1" />
                                        Key Insights
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onViewDetails(review.id)}
                                        className="text-xs"
                                    >
                                        View Full Analysis
                                        <ExternalLink className="w-3 h-3 ml-1" />
                                    </Button>
                                </div>

                                {/* Quick Insights */}
                                <div className="space-y-2">
                                    {analysisResults.business_insights.main_issues?.slice(0, 2).map((issue, idx) => (
                                        <div key={idx} className="text-xs text-red-700 bg-red-50 rounded px-2 py-1">
                                            ⚠️ {issue}
                                        </div>
                                    ))}
                                    {analysisResults.business_insights.positive_highlights?.slice(0, 2).map((highlight, idx) => (
                                        <div key={idx} className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                                            ✅ {highlight}
                                        </div>
                                    ))}
                                </div>

                                {/* Impact & Follow-up Indicators */}
                                <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/30">
                                    {analysisResults.business_insights.estimated_impact && (
                                        <Badge variant={
                                            analysisResults.business_insights.estimated_impact === 'high' ? 'destructive' :
                                            analysisResults.business_insights.estimated_impact === 'medium' ? 'default' : 'secondary'
                                        }>
                                            {analysisResults.business_insights.estimated_impact} Impact
                                        </Badge>
                                    )}
                                    {analysisResults.business_insights.follow_up_needed && (
                                        <Badge variant="outline" className="text-orange-700">
                                            Follow-up Required
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Full Analysis CTA */}
                        <div className="text-center pt-2">
                            <Button
                                variant="outline"
                                onClick={() => onViewDetails(review.id)}
                                className="bg-white/50 hover:bg-white/70 border-white/40"
                            >
                                <ExternalLink className="w-4 h-4 mr-2" />
                                View Complete Analysis
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
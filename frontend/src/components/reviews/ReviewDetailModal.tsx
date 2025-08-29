// src/pages/Reviews/components/ReviewDetailModal.tsx
import { X, Star, Calendar, MapPin, Globe, Briefcase, MessageSquare, Brain, TrendingUp, AlertTriangle, Target, Flag, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Review, getSentimentColor, getUrgencyColor, getReviewRating, getReviewText } from '@/services/review';

interface ReviewDetailModalProps {
    reviewId: string;
    review?: Review;
    isOpen: boolean;
    onClose: () => void;
}

export const ReviewDetailModal = ({ reviewId, review, isOpen, onClose }: ReviewDetailModalProps) => {
    if (!isOpen) return null;

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-5 w-5 ${star <= rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <Brain className="w-5 h-5 text-primary" />
                        <span>Review Analysis Details</span>
                        <Badge variant="outline">{reviewId}</Badge>
                    </DialogTitle>
                </DialogHeader>

                {/* Loading State */}
                {!review && (
                    <div className="flex items-center justify-center p-12">
                        <div className="text-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
                            <p className="text-gray-600">Loading review details...</p>
                        </div>
                    </div>
                )}

                {/* Review Content */}
                {review && (
                    <div className="space-y-6">
                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Date</p>
                                    <p className="text-sm font-medium">{new Date(review.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Globe className="w-4 h-4 text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Source</p>
                                    <p className="text-sm font-medium">{review.source_type}</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Briefcase className="w-4 h-4 text-gray-500" />
                                <div>
                                    <p className="text-xs text-gray-500">Job Type</p>
                                    <p className="text-sm font-medium">{review.job_type}</p>
                                </div>
                            </div>
                        </div>

                        {/* Rating */}
                        {getReviewRating(review) && (
                            <div className="flex items-center space-x-4 p-4 bg-yellow-50 rounded-lg">
                                <span className="text-sm font-medium text-gray-700">Rating:</span>
                                {renderStars(getReviewRating(review)!)}
                                <span className="text-sm text-gray-600">({getReviewRating(review)}/5)</span>
                            </div>
                        )}

                        {/* Review Text */}
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                                Review Content
                            </h3>
                            <blockquote className="text-gray-800 leading-relaxed italic border-l-4 border-blue-400 pl-4 bg-white p-4 rounded">
                                "{getReviewText(review)}"
                            </blockquote>
                        </div>

                        {/* AI Analysis */}
                        {review.analyzed_data && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                    <Brain className="w-5 h-5 mr-2 text-purple-600" />
                                    AI Analysis Results
                                </h3>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Column */}
                                    <div className="space-y-4">
                                        {/* Sentiment */}
                                        {review.analyzed_data.sentiment && (
                                            <div className="p-4 bg-white border rounded-lg shadow-sm">
                                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                    <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                                                    Sentiment Analysis
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span>Classification:</span>
                                                        <Badge className={getSentimentColor(review.analyzed_data.sentiment.label)}>
                                                            {review.analyzed_data.sentiment.label.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Confidence:</span>
                                                        <span className="font-medium">{(review.analyzed_data.sentiment.confidence * 100).toFixed(1)}%</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Emotional Tone:</span>
                                                        <span className="capitalize font-medium">{review.analyzed_data.sentiment.emotional_tone}</span>
                                                    </div>
                                                    <div className="pt-3 border-t">
                                                        <p className="text-sm text-gray-700">
                                                            <strong>Reasoning:</strong> {review.analyzed_data.sentiment.reasoning}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Topics */}
                                        {review.analyzed_data.topics && review.analyzed_data.topics.length > 0 && (
                                            <div className="p-4 bg-white border rounded-lg shadow-sm">
                                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                    <Target className="w-4 h-4 mr-2 text-indigo-600" />
                                                    Key Topics ({review.analyzed_data.topics.length})
                                                </h4>
                                                <div className="space-y-3">
                                                    {review.analyzed_data.topics.map((topic, i) => (
                                                        <div key={i} className="p-3 bg-gray-50 rounded-lg">
                                                            <div className="flex items-center justify-between mb-2">
                                                                <Badge className={getSentimentColor(topic.sentiment)}>
                                                                    {topic.topic}
                                                                </Badge>
                                                                <span className="text-sm text-gray-600">
                                                                    {(topic.confidence * 100).toFixed(0)}% confidence
                                                                </span>
                                                            </div>
                                                            {topic.mentions && topic.mentions.length > 0 && (
                                                                <div className="text-xs text-gray-600">
                                                                    <strong>Mentions:</strong> {topic.mentions.join(', ')}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Spam Detection */}
                                        {review.analyzed_data.spam_detection && (
                                            <div className="p-4 bg-white border rounded-lg shadow-sm">
                                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                    <Flag className="w-4 h-4 mr-2 text-red-600" />
                                                    Spam Detection
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span>Classification:</span>
                                                        <Badge variant={review.analyzed_data.spam_detection.is_spam ? "destructive" : "secondary"}>
                                                            {review.analyzed_data.spam_detection.is_spam ? "SPAM" : "LEGITIMATE"}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span>Confidence:</span>
                                                        <span className="font-medium">{(review.analyzed_data.spam_detection.confidence * 100).toFixed(1)}%</span>
                                                    </div>
                                                    {review.analyzed_data.spam_detection.red_flags && review.analyzed_data.spam_detection.red_flags.length > 0 && (
                                                        <div className="pt-3 border-t">
                                                            <p className="text-sm text-gray-700 mb-2"><strong>Red Flags:</strong></p>
                                                            <ul className="text-xs text-red-600 space-y-1">
                                                                {review.analyzed_data.spam_detection.red_flags.map((flag, i) => (
                                                                    <li key={i}>• {flag}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                    <div className="pt-3 border-t">
                                                        <p className="text-sm text-gray-700">
                                                            <strong>Reasoning:</strong> {review.analyzed_data.spam_detection.reasoning}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Right Column */}
                                    <div className="space-y-4">
                                        {/* Urgency */}
                                        {review.analyzed_data.urgency && (
                                            <div className="p-4 bg-white border rounded-lg shadow-sm">
                                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                    <AlertTriangle className="w-4 h-4 mr-2 text-orange-600" />
                                                    Urgency Assessment
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="text-center">
                                                        <Badge className={getUrgencyColor(review.analyzed_data.urgency.level)}>
                                                            {review.analyzed_data.urgency.level.toUpperCase()} PRIORITY
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                            <div className="font-medium text-sm mb-2">Immediate Response</div>
                                                            {review.analyzed_data.urgency.requires_immediate_response ? (
                                                                <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                                                            ) : (
                                                                <XCircle className="w-6 h-6 text-gray-400 mx-auto" />
                                                            )}
                                                        </div>
                                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                                            <div className="font-medium text-sm mb-2">Escalation Needed</div>
                                                            {review.analyzed_data.urgency.escalation_needed ? (
                                                                <CheckCircle className="w-6 h-6 text-green-600 mx-auto" />
                                                            ) : (
                                                                <XCircle className="w-6 h-6 text-gray-400 mx-auto" />
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="pt-3 border-t">
                                                        <p className="text-sm text-gray-700">
                                                            <strong>Reasoning:</strong> {review.analyzed_data.urgency.reasoning}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Business Insights */}
                                        {review.analyzed_data.business_insights && (
                                            <div className="p-4 bg-white border rounded-lg shadow-sm">
                                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                    <Brain className="w-4 h-4 mr-2 text-purple-600" />
                                                    Business Insights
                                                </h4>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <span>Impact Level:</span>
                                                        <Badge variant={review.analyzed_data.business_insights.estimated_impact === 'high' ? 'destructive' : 'secondary'}>
                                                            {review.analyzed_data.business_insights.estimated_impact.toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span>Follow-up Needed:</span>
                                                        {review.analyzed_data.business_insights.follow_up_needed ? (
                                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                                        ) : (
                                                            <XCircle className="w-4 h-4 text-gray-400" />
                                                        )}
                                                    </div>

                                                    {/* Main Issues */}
                                                    {review.analyzed_data.business_insights.main_issues.length > 0 && (
                                                        <div className="pt-3 border-t">
                                                            <p className="text-sm font-medium text-gray-700 mb-2">Main Issues:</p>
                                                            <ul className="text-sm text-gray-600 space-y-1">
                                                                {review.analyzed_data.business_insights.main_issues.map((issue, i) => (
                                                                    <li key={i}>• {issue}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Positive Highlights */}
                                                    {review.analyzed_data.business_insights.positive_highlights.length > 0 && (
                                                        <div className="pt-3 border-t">
                                                            <p className="text-sm font-medium text-gray-700 mb-2">Positive Highlights:</p>
                                                            <ul className="text-sm text-green-700 space-y-1">
                                                                {review.analyzed_data.business_insights.positive_highlights.map((highlight, i) => (
                                                                    <li key={i}>• {highlight}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}

                                                    {/* Recommendations */}
                                                    {review.analyzed_data.business_insights.actionable_recommendations.length > 0 && (
                                                        <div className="pt-3 border-t">
                                                            <p className="text-sm font-medium text-gray-700 mb-2">Actionable Recommendations:</p>
                                                            <ul className="text-sm text-blue-700 space-y-1">
                                                                {review.analyzed_data.business_insights.actionable_recommendations.map((rec, i) => (
                                                                    <li key={i}>• {rec}</li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* Language Detection */}
                                        {review.analyzed_data.language_detection && (
                                            <div className="p-4 bg-white border rounded-lg shadow-sm">
                                                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                    <Globe className="w-4 h-4 mr-2 text-blue-600" />
                                                    Language Analysis
                                                </h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span>Detected Language:</span>
                                                        <span className="font-medium uppercase">{review.analyzed_data.language_detection.detected_language}</span>
                                                    </div>
                                                    {review.analyzed_data.translation && (
                                                        <div className="pt-3 border-t">
                                                            <p className="text-sm font-medium text-gray-700 mb-2">English Translation:</p>
                                                            <p className="text-sm text-gray-600 italic bg-blue-50 p-3 rounded">
                                                                "{review.analyzed_data.translation.english_translation}"
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Raw Data */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-3">Raw Review Data</h3>
                            <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-x-auto">
                                {JSON.stringify(review.data, null, 2)}
                            </pre>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                            <Button variant="outline" onClick={onClose}>
                                <X className="w-4 h-4 mr-2" />
                                Close
                            </Button>
                            <Button variant="outline" className="text-orange-600 hover:text-orange-700">
                                <Flag className="w-4 h-4 mr-2" />
                                Report Issue
                            </Button>
                            <Button className="bg-primary hover:bg-primary/90">
                                <AlertTriangle className="w-4 h-4 mr-2" />
                                Take Action
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
};
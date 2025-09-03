// frontend/src/components/reviews/ReviewDetailModal.tsx

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    MessageSquare, 
    Brain, 
    TrendingUp, 
    AlertTriangle, 
    Globe, 
    X, 
    Flag,
    Star,
    Clock,
    Target,
    Shield,
    Lightbulb
} from 'lucide-react';
import { 
    Review, 
    getReviewRating, 
    getReviewText, 
    getSentimentColor,
    getAnalysisResults
} from '@/services/review';

interface ReviewDetailModalProps {
    review: Review | null;
    isOpen: boolean;
    onClose: () => void;
}

export const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
    review,
    isOpen,
    onClose,
}) => {
    if (!review) return null;

    // Access analysis results from the correct nested structure
    const analysisResults = getAnalysisResults(review);
    const sentiment = analysisResults?.sentiment;
    const topics = analysisResults?.topics || [];
    const spamDetection = analysisResults?.spam_detection;
    const urgency = analysisResults?.urgency_classification;
    const businessInsights = analysisResults?.business_insights;
    const translation = analysisResults?.translation_analysis;
    const languageAnalysis = analysisResults?.language_analysis;

    const rating = getReviewRating(review);
    const reviewText = getReviewText(review);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <DialogTitle className="flex items-center justify-between">
                        <span className="text-xl font-bold text-gray-900">Review Details</span>
                        <div className="flex items-center space-x-2">
                            {review.source_type && (
                                <Badge variant="outline">
                                    <Globe className="w-3 h-3 mr-1" />
                                    {review.source_type}
                                </Badge>
                            )}
                            <Badge variant={analysisResults ? "default" : "secondary"}>
                                <Brain className="w-3 h-3 mr-1" />
                                {analysisResults ? 'AI Analyzed' : 'Not Analyzed'}
                            </Badge>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                {/* Scrollable content area */}
                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                    {/* Review Content */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                        <div className="flex items-start justify-between mb-4">
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
                                {review.data?.username && (
                                    <span className="text-sm text-gray-600">by {review.data.username}</span>
                                )}
                            </div>
                            <div className="text-xs text-gray-500">
                                {new Date(review.created_at).toLocaleDateString()}
                            </div>
                        </div>

                        {/* Review Text - FIXED: Proper text wrapping */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-900">Review Text</h3>
                            <div className="bg-white/50 rounded-lg p-4 border">
                                <blockquote className="text-gray-800 leading-relaxed italic break-words whitespace-pre-wrap">
                                    "{reviewText}"
                                </blockquote>
                            </div>
                        </div>
                    </div>

                    {/* AI Analysis Section */}
                    {analysisResults && (
                        <div className="space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center">
                                <Brain className="w-5 h-5 mr-2 text-blue-600" />
                                AI Analysis Results
                            </h2>

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
                                            <div className="flex items-center space-x-3 mb-3">
                                                <Badge className={getSentimentColor(sentiment.label)}>
                                                    {sentiment.label?.toUpperCase()}
                                                </Badge>
                                                {sentiment.confidence && (
                                                    <span className="text-sm text-gray-600">
                                                        {Math.round(sentiment.confidence * 100)}% confidence
                                                    </span>
                                                )}
                                            </div>
                                            {sentiment.emotional_tone && (
                                                <div className="text-sm text-gray-600">
                                                    <strong>Emotional Tone:</strong> {sentiment.emotional_tone}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Language Analysis */}
                                    {languageAnalysis && (
                                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Globe className="w-5 h-5 mr-2 text-blue-600" />
                                                Language Analysis
                                            </h4>
                                            <div className="space-y-2 text-sm text-gray-600">
                                                <div><strong>Language:</strong> {languageAnalysis.detected_language}</div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Translation */}
                                    {translation?.english_translation && translation.english_translation !== reviewText && (
                                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Globe className="w-5 h-5 mr-2 text-green-600" />
                                                English Translation
                                            </h4>
                                            <div className="bg-white/50 rounded-lg p-4 border">
                                                <p className="text-gray-800 break-words whitespace-pre-wrap">
                                                    {translation.english_translation}
                                                </p>
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
                                                Urgency Assessment
                                            </h4>
                                            <div className="space-y-2">
                                                <Badge variant={urgency.level === 'critical' ? 'destructive' : urgency.level === 'high' ? 'default' : 'secondary'}>
                                                    {urgency.level?.toUpperCase()}
                                                </Badge>
                                                {urgency.requires_immediate_response && (
                                                    <Badge variant="destructive" className="ml-2">
                                                        Immediate Response Required
                                                    </Badge>
                                                )}
                                                {urgency.escalation_needed && (
                                                    <Badge variant="destructive" className="ml-2">
                                                        Escalation Needed
                                                    </Badge>
                                                )}
                                                {urgency.reasoning && (
                                                    <p className="text-sm text-gray-600 mt-2 break-words">
                                                        {urgency.reasoning}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Spam Detection */}
                                    {spamDetection && (
                                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Shield className="w-5 h-5 mr-2 text-red-600" />
                                                Spam Detection
                                            </h4>
                                            <div className="flex items-center space-x-3">
                                                <Badge variant={spamDetection.is_spam ? 'destructive' : 'default'}>
                                                    {spamDetection.is_spam ? 'SPAM' : 'LEGITIMATE'}
                                                </Badge>
                                                <span className="text-sm text-gray-600">
                                                    {Math.round(spamDetection.confidence * 100)}% confidence
                                                </span>
                                            </div>
                                            {spamDetection.reasoning && (
                                                <p className="text-sm text-gray-600 mt-2 break-words">
                                                    {spamDetection.reasoning}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Topics */}
                                    {topics.length > 0 && (
                                        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Target className="w-5 h-5 mr-2 text-purple-600" />
                                                Topics Identified
                                            </h4>
                                            <div className="flex flex-wrap gap-2">
                                                {topics.map((topic, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {topic.topic}
                                                        {topic.sentiment && ` (${topic.sentiment})`}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Business Insights - Full Width */}
                            {businessInsights && (
                                <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/40">
                                    <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                                        <Lightbulb className="w-5 h-5 mr-2 text-yellow-600" />
                                        Business Insights
                                    </h4>
                                    <div className="space-y-4">
                                        {/* Main Issues */}
                                        {businessInsights.main_issues && businessInsights.main_issues.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-red-700 mb-2">Main Issues Identified:</p>
                                                <ul className="text-sm text-red-700 space-y-1 break-words">
                                                    {businessInsights.main_issues.map((issue, i) => (
                                                        <li key={i}>• {issue}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Positive Highlights */}
                                        {businessInsights.positive_highlights && businessInsights.positive_highlights.length > 0 && (
                                            <div>
                                                <p className="text-sm font-medium text-green-700 mb-2">Positive Highlights:</p>
                                                <ul className="text-sm text-green-700 space-y-1 break-words">
                                                    {businessInsights.positive_highlights.map((highlight, i) => (
                                                        <li key={i}>• {highlight}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Recommendations */}
                                        {businessInsights.actionable_recommendations && businessInsights.actionable_recommendations.length > 0 && (
                                            <div className="pt-3 border-t">
                                                <p className="text-sm font-medium text-blue-700 mb-2">Actionable Recommendations:</p>
                                                <ul className="text-sm text-blue-700 space-y-1 break-words">
                                                    {businessInsights.actionable_recommendations.map((rec, i) => (
                                                        <li key={i}>• {rec}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}

                                        {/* Impact & Follow-up */}
                                        <div className="pt-3 border-t flex items-center justify-between flex-wrap gap-2">
                                            {businessInsights.estimated_impact && (
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm text-gray-600">Impact:</span>
                                                    <Badge variant={
                                                        businessInsights.estimated_impact === 'high' ? 'destructive' :
                                                        businessInsights.estimated_impact === 'medium' ? 'default' :
                                                        'secondary'
                                                    }>
                                                        {businessInsights.estimated_impact}
                                                    </Badge>
                                                </div>
                                            )}
                                            {businessInsights.follow_up_needed && (
                                                <Badge variant="outline" className="text-orange-700">
                                                    Follow-up Needed
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Review Metadata */}
                    <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-white/40">
                        <h3 className="font-semibold text-gray-900 mb-3">Review Metadata</h3>
                        <div className="text-xs text-gray-600 space-y-1">
                            <div><strong>Source:</strong> {review.source_type}</div>
                            <div><strong>Job Type:</strong> {review.job_type}</div>
                            <div><strong>Review ID:</strong> {review.id}</div>
                            <div><strong>Created:</strong> {new Date(review.created_at).toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Raw Data */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Raw Review Data</h3>
                        <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-x-auto break-all whitespace-pre-wrap">
                            {JSON.stringify(review.data, null, 2)}
                        </pre>
                    </div>
                </div>

                {/* Fixed Action Buttons */}
                <div className="flex-shrink-0 flex items-center justify-end space-x-3 pt-4 border-t">
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
            </DialogContent>
        </Dialog>
    );
};
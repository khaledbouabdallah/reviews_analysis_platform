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

    // **FIXED: Access analysis results from the correct nested structure**
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
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
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
                                {analysisResults ? 'AI ✓' : 'Pending'}
                            </Badge>
                        </div>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Rating */}
                    {rating && (
                        <div className="flex items-center">
                            <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`w-5 h-5 ${
                                            i < rating
                                                ? 'text-yellow-400 fill-current'
                                                : 'text-gray-300'
                                        }`}
                                    />
                                ))}
                            </div>
                            <span className="text-sm text-gray-600 ml-2">({rating}/5)</span>
                        </div>
                    )}

                    {/* Review Text */}
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                            <MessageSquare className="w-5 h-5 mr-2 text-blue-600" />
                            Review Content
                        </h3>
                        <blockquote className="text-gray-800 leading-relaxed italic border-l-4 border-blue-400 pl-4 bg-white p-4 rounded">
                            "{reviewText}"
                        </blockquote>
                        
                        {/* Original text if different from displayed text */}
                        {review.data?.original_text && review.data.original_text !== reviewText && (
                            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                                <p className="text-sm font-medium text-yellow-800 mb-2">Original Text:</p>
                                <p className="text-sm text-yellow-700 italic">"{review.data.original_text}"</p>
                            </div>
                        )}
                    </div>

                    {/* AI Analysis Results */}
                    {analysisResults && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                <Brain className="w-5 h-5 mr-2 text-purple-600" />
                                AI Analysis Results
                            </h3>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    {/* Sentiment */}
                                    {sentiment && (
                                        <div className="p-4 bg-white border rounded-lg shadow-sm">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <TrendingUp className="w-4 h-4 mr-2 text-blue-600" />
                                                Sentiment Analysis
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Badge className={getSentimentColor(sentiment.label)}>
                                                        {sentiment.label.toUpperCase()}
                                                    </Badge>
                                                    <span className="text-sm text-gray-600">
                                                        {Math.round(sentiment.confidence * 100)}% confidence
                                                    </span>
                                                </div>
                                                {sentiment.emotional_tone && (
                                                    <p className="text-sm text-gray-600">
                                                        <strong>Tone:</strong> {sentiment.emotional_tone}
                                                    </p>
                                                )}
                                                {sentiment.reasoning && (
                                                    <p className="text-sm text-gray-700 italic">
                                                        {sentiment.reasoning}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Language Detection */}
                                    {languageAnalysis && (
                                        <div className="p-4 bg-white border rounded-lg shadow-sm">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Globe className="w-4 h-4 mr-2 text-green-600" />
                                                Language Detection
                                            </h4>
                                            <div className="space-y-2">
                                                <Badge variant="outline">
                                                    {languageAnalysis.detected_language?.toUpperCase()}
                                                </Badge>
                                            </div>
                                        </div>
                                    )}

                                    {/* Spam Detection */}
                                    {spamDetection && (
                                        <div className="p-4 bg-white border rounded-lg shadow-sm">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Shield className="w-4 h-4 mr-2 text-purple-600" />
                                                Spam Detection
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant={spamDetection.is_spam ? "destructive" : "secondary"}>
                                                        {spamDetection.is_spam ? 'SPAM' : 'LEGITIMATE'}
                                                    </Badge>
                                                    <span className="text-sm text-gray-600">
                                                        {Math.round(spamDetection.confidence * 100)}% confidence
                                                    </span>
                                                </div>
                                                {spamDetection.red_flags && spamDetection.red_flags.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-medium text-red-700 mb-1">Red Flags:</p>
                                                        <ul className="text-sm text-red-600 space-y-1">
                                                            {spamDetection.red_flags.map((flag, i) => (
                                                                <li key={i}>• {flag}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                                {spamDetection.reasoning && (
                                                    <p className="text-sm text-gray-700 italic">
                                                        {spamDetection.reasoning}
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
                                        <div className="p-4 bg-white border rounded-lg shadow-sm">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Clock className="w-4 h-4 mr-2 text-orange-600" />
                                                Urgency Level
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                    <Badge variant={
                                                        urgency.level === 'critical' ? 'destructive' :
                                                        urgency.level === 'high' ? 'default' :
                                                        urgency.level === 'medium' ? 'secondary' :
                                                        'outline'
                                                    }>
                                                        {urgency.level.toUpperCase()}
                                                    </Badge>
                                                    {urgency.requires_immediate_response && (
                                                        <Badge variant="destructive" className="text-xs">
                                                            IMMEDIATE
                                                        </Badge>
                                                    )}
                                                    {urgency.escalation_needed && (
                                                        <Badge variant="default" className="text-xs">
                                                            ESCALATE
                                                        </Badge>
                                                    )}
                                                </div>
                                                {urgency.reasoning && (
                                                    <p className="text-sm text-gray-700 italic">
                                                        {urgency.reasoning}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Topics */}
                                    {topics.length > 0 && (
                                        <div className="p-4 bg-white border rounded-lg shadow-sm">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Target className="w-4 h-4 mr-2 text-indigo-600" />
                                                Topics Discussed
                                            </h4>
                                            <div className="space-y-3">
                                                {topics.map((topic, i) => (
                                                    <div key={i} className="border-l-2 border-indigo-200 pl-3">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-medium text-sm text-gray-900">
                                                                {topic.topic}
                                                            </span>
                                                            <div className="flex items-center space-x-2">
                                                                <Badge className={getSentimentColor(topic.sentiment)} size="sm">
                                                                    {topic.sentiment}
                                                                </Badge>
                                                                <span className="text-xs text-gray-500">
                                                                    {Math.round(topic.confidence * 100)}%
                                                                </span>
                                                            </div>
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

                                    {/* Business Insights */}
                                    {businessInsights && (
                                        <div className="p-4 bg-white border rounded-lg shadow-sm">
                                            <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                                                <Lightbulb className="w-4 h-4 mr-2 text-yellow-600" />
                                                Business Insights
                                            </h4>
                                            <div className="space-y-3">
                                                {/* Main Issues */}
                                                {businessInsights.main_issues && businessInsights.main_issues.length > 0 && (
                                                    <div>
                                                        <p className="text-sm font-medium text-red-700 mb-2">Main Issues:</p>
                                                        <ul className="text-sm text-red-600 space-y-1">
                                                            {businessInsights.main_issues.map((issue, i) => (
                                                                <li key={i}>• {issue}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Positive Highlights */}
                                                {businessInsights.positive_highlights && businessInsights.positive_highlights.length > 0 && (
                                                    <div className="pt-3 border-t">
                                                        <p className="text-sm font-medium text-green-700 mb-2">Positive Highlights:</p>
                                                        <ul className="text-sm text-green-700 space-y-1">
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
                                                        <ul className="text-sm text-blue-700 space-y-1">
                                                            {businessInsights.actionable_recommendations.map((rec, i) => (
                                                                <li key={i}>• {rec}</li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Impact & Follow-up */}
                                                <div className="pt-3 border-t flex items-center justify-between">
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
            </DialogContent>
        </Dialog>
    );
};
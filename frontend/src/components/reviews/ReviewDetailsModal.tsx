'use client';

import { useState, useEffect } from 'react';
import { X, Brain, Star, Calendar, User, Globe, MessageSquare, AlertTriangle, ShieldCheck, Clock, TrendingUp, Lightbulb, Zap, Target } from 'lucide-react';
import { Review, reviewService } from '@/services/review';
import { MapPin, Briefcase } from 'lucide-react';
interface ReviewDetailsModalProps {
    review: Review | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ReviewDetailsModal({ review, isOpen, onClose }: ReviewDetailsModalProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => setIsVisible(true), 50);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    if (!isOpen || !review) return null;

    const analysisData = review.analyzed_data?.analysis_results;

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`h-5 w-5 transition-all duration-300 ${star <= rating
                            ? 'text-yellow-400 fill-current drop-shadow-sm'
                            : 'text-gray-300'
                            }`}
                    />
                ))}
                <span className="ml-2 text-lg font-semibold text-gray-800">({rating})</span>
            </div>
        );
    };

    const getSentimentColor = (sentiment: string) => {
        switch (sentiment) {
            case 'positive': return 'from-emerald-400/20 to-green-400/20 border-emerald-300/40';
            case 'negative': return 'from-red-400/20 to-rose-400/20 border-red-300/40';
            case 'neutral': return 'from-gray-400/20 to-slate-400/20 border-gray-300/40';
            default: return 'from-gray-400/20 to-slate-400/20 border-gray-300/40';
        }
    };

    const getUrgencyColor = (level: string) => {
        switch (level) {
            case 'critical': return 'from-red-500/30 to-red-600/30 border-red-400/50';
            case 'high': return 'from-orange-500/30 to-red-500/30 border-orange-400/50';
            case 'medium': return 'from-yellow-500/30 to-orange-500/30 border-yellow-400/50';
            case 'low': return 'from-blue-500/30 to-cyan-500/30 border-blue-400/50';
            case 'none': return 'from-green-500/30 to-emerald-500/30 border-green-400/50';
            default: return 'from-gray-500/30 to-slate-500/30 border-gray-400/50';
        }
    };

    const getUrgencyIcon = (level: string) => {
        switch (level) {
            case 'critical': return '🚨';
            case 'high': return '⚠️';
            case 'medium': return '⚡';
            case 'low': return '📋';
            case 'none': return '✅';
            default: return '❓';
        }
    };

    return (
        <div className={`fixed inset-0 z-50 overflow-y-auto transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            {/* Enhanced Backdrop */}
            <div
                className={`fixed inset-0 bg-gradient-to-br from-slate-900/60 via-purple-900/40 to-slate-900/60 backdrop-blur-md transition-all duration-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className={`relative w-full max-w-7xl transform transition-all duration-500 ${isVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}>
                    {/* Glassmorphic background with enhanced effects */}
                    <div className="absolute inset-0 bg-white/20 backdrop-blur-2xl rounded-3xl border border-white/30 shadow-2xl" />
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/20 to-white/10 rounded-3xl" />

                    <div className="relative max-h-[90vh] overflow-y-auto rounded-3xl">
                        {/* Header */}
                        <div className="sticky top-0 bg-white/30 backdrop-blur-xl border-b border-white/30 p-8 rounded-t-3xl">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center space-x-6">
                                    <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg ring-4 ring-white/20">
                                        {reviewService.getReviewer(review).charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                                            {reviewService.getReviewer(review)}
                                        </h2>
                                        <div className="flex items-center space-x-6">
                                            {reviewService.getRating(review) && renderStars(reviewService.getRating(review)!)}
                                            <div className="flex items-center space-x-2 text-gray-600">
                                                <Calendar className="h-4 w-4" />
                                                <span className="font-medium">
                                                    {new Date(reviewService.getDate(review)).toLocaleDateString('en-US', {
                                                        year: 'numeric',
                                                        month: 'long',
                                                        day: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="p-3 hover:bg-white/30 rounded-2xl transition-all duration-300 hover:scale-110 group"
                                >
                                    <X className="h-6 w-6 text-gray-600 group-hover:text-gray-800" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-8">
                            {/* Review Text with inline language indicator */}
                            <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-8 border border-white/40 shadow-xl">
                                <div className="flex items-start justify-between mb-6">
                                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                                        <MessageSquare className="h-6 w-6 mr-3 text-indigo-600" />
                                        Original Review
                                    </h3>
                                    {/* Language indicator */}
                                    {analysisData?.language_analysis && (
                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100/80 text-indigo-800 border border-indigo-200/50">
                                            <Globe className="h-4 w-4 mr-1" />
                                            {analysisData.language_analysis.detected_language.toUpperCase()}
                                        </span>
                                    )}
                                </div>

                                <blockquote className="text-gray-800 leading-relaxed text-lg font-medium border-l-4 border-indigo-400 pl-6 italic">
                                    "{reviewService.getDisplayText(review) || 'No text available'}"
                                </blockquote>

                                {/* Translation */}
                                {analysisData?.translation_analysis && (
                                    <div className="mt-6 p-6 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/50">
                                        <p className="text-gray-700 leading-relaxed">
                                            <span className="text-sm text-gray-500 font-medium mb-2 block">
                                                Translated from {analysisData.language_analysis?.detected_language?.toUpperCase() || 'Unknown'}:
                                            </span>
                                            "{analysisData.translation_analysis.english_translation}"
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* AI Analysis */}
                            {analysisData && (
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center">
                                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                                            <Brain className="h-6 w-6 text-white" />
                                        </div>
                                        AI Analysis Results
                                    </h3>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        {/* Left Column */}
                                        <div className="space-y-6">
                                            {/* Sentiment */}
                                            {analysisData.sentiment && (
                                                <div className={`bg-gradient-to-br ${getSentimentColor(analysisData.sentiment.label)} backdrop-blur-xl rounded-3xl p-6 border border-white/40 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="font-bold text-gray-900 text-lg">Sentiment Analysis</h4>
                                                        <div className="w-10 h-10 bg-white/30 rounded-xl flex items-center justify-center">
                                                            {analysisData.sentiment.label === 'positive' ? '😊' :
                                                                analysisData.sentiment.label === 'negative' ? '😞' : '😐'}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-700 font-medium">Overall:</span>
                                                            <span className={`font-bold px-4 py-2 rounded-xl text-sm ${analysisData.sentiment.label === 'positive' ? 'bg-emerald-500/20 text-emerald-800' :
                                                                analysisData.sentiment.label === 'negative' ? 'bg-red-500/20 text-red-800' :
                                                                    'bg-gray-500/20 text-gray-800'
                                                                }`}>
                                                                {analysisData.sentiment.label.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-700 font-medium">Confidence:</span>
                                                            <div className="flex items-center space-x-2">
                                                                <div className="w-20 bg-white/30 rounded-full h-2">
                                                                    <div
                                                                        className="h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-1000"
                                                                        style={{ width: `${analysisData.sentiment.confidence * 100}%` }}
                                                                    />
                                                                </div>
                                                                <span className="font-bold text-gray-800">{(analysisData.sentiment.confidence * 100).toFixed(1)}%</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-700 font-medium">Emotional Tone:</span>
                                                            <span className="font-bold text-gray-800 capitalize">{analysisData.sentiment.emotional_tone}</span>
                                                        </div>
                                                        <div className="mt-4 p-4 bg-white/40 backdrop-blur-sm rounded-2xl">
                                                            <p className="text-sm text-gray-800 font-medium">{analysisData.sentiment.reasoning}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Spam Detection */}
                                            {analysisData.spam_detection && (
                                                <div className={`bg-gradient-to-br ${analysisData.spam_detection.is_spam ? 'from-red-400/30 to-red-500/30 border-red-400/50' : 'from-emerald-400/30 to-green-500/30 border-emerald-400/50'} backdrop-blur-xl rounded-3xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="font-bold text-gray-900 text-lg">Authenticity Check</h4>
                                                        <div className="w-10 h-10 bg-white/30 rounded-xl flex items-center justify-center">
                                                            {analysisData.spam_detection.is_spam ? '🚫' : '✅'}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="text-center">
                                                            <span className={`inline-flex px-6 py-3 rounded-2xl text-lg font-bold ${analysisData.spam_detection.is_spam ? 'bg-red-500/20 text-red-800' : 'bg-emerald-500/20 text-emerald-800'
                                                                }`}>
                                                                {analysisData.spam_detection.is_spam ? 'LIKELY SPAM' : 'GENUINE REVIEW'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-gray-700 font-medium">Confidence:</span>
                                                            <span className="font-bold text-gray-800">{(analysisData.spam_detection.confidence * 100).toFixed(1)}%</span>
                                                        </div>
                                                        <div className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl">
                                                            <p className="text-sm text-gray-800 font-medium">{analysisData.spam_detection.reasoning}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Right Column */}
                                        <div className="space-y-6">
                                            {/* Urgency */}
                                            {analysisData.urgency_classification && (
                                                <div className={`bg-gradient-to-br ${getUrgencyColor(analysisData.urgency_classification.level)} backdrop-blur-xl rounded-3xl p-6 border shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02]`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="font-bold text-gray-900 text-lg">Urgency Assessment</h4>
                                                        <div className="w-10 h-10 bg-white/30 rounded-xl flex items-center justify-center text-lg">
                                                            {getUrgencyIcon(analysisData.urgency_classification.level)}
                                                        </div>
                                                    </div>
                                                    <div className="space-y-4">
                                                        <div className="text-center">
                                                            <span className={`inline-flex px-6 py-3 rounded-2xl text-lg font-bold ${analysisData.urgency_classification.level === 'critical' ? 'bg-red-500/30 text-red-900' :
                                                                analysisData.urgency_classification.level === 'high' ? 'bg-orange-500/30 text-orange-900' :
                                                                    analysisData.urgency_classification.level === 'medium' ? 'bg-yellow-500/30 text-yellow-900' :
                                                                        analysisData.urgency_classification.level === 'low' ? 'bg-blue-500/30 text-blue-900' :
                                                                            'bg-green-500/30 text-green-900'
                                                                }`}>
                                                                {analysisData.urgency_classification.level.toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-4 text-sm">
                                                            <div className="text-center p-3 bg-white/30 rounded-xl">
                                                                <div className="font-medium text-gray-700">Immediate Response</div>
                                                                <div className="text-lg font-bold mt-1">
                                                                    {analysisData.urgency_classification.requires_immediate_response ? '✅' : '❌'}
                                                                </div>
                                                            </div>
                                                            <div className="text-center p-3 bg-white/30 rounded-xl">
                                                                <div className="font-medium text-gray-700">Escalation</div>
                                                                <div className="text-lg font-bold mt-1">
                                                                    {analysisData.urgency_classification.escalation_needed ? '✅' : '❌'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="p-4 bg-white/40 backdrop-blur-sm rounded-2xl">
                                                            <p className="text-sm text-gray-800 font-medium">{analysisData.urgency_classification.reasoning}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Topics - Compact version */}
                                            {analysisData.topics && analysisData.topics.length > 0 && (
                                                <div className="bg-white/40 backdrop-blur-xl rounded-3xl p-6 border border-white/40 shadow-xl">
                                                    <h4 className="font-bold text-gray-900 text-lg mb-4 flex items-center">
                                                        <Target className="h-5 w-5 mr-2 text-indigo-600" />
                                                        Key Topics
                                                    </h4>
                                                    <div className="flex flex-wrap gap-3">
                                                        {analysisData.topics.slice(0, 6).map((topic, index) => (
                                                            <span
                                                                key={index}
                                                                className={`inline-flex items-center px-4 py-2 rounded-2xl text-sm font-semibold shadow-lg transition-all duration-300 hover:scale-105 ${topic.sentiment === 'positive' ? 'bg-emerald-500/80 text-white' :
                                                                    topic.sentiment === 'negative' ? 'bg-red-500/80 text-white' :
                                                                        'bg-gray-500/80 text-white'
                                                                    }`}
                                                            >
                                                                {topic.topic}
                                                                <span className="ml-2 text-xs bg-white/20 px-2 py-1 rounded-full">
                                                                    {(topic.confidence * 100).toFixed(0)}%
                                                                </span>
                                                            </span>
                                                        ))}
                                                        {analysisData.topics.length > 6 && (
                                                            <span className="inline-flex items-center px-4 py-2 rounded-2xl text-sm font-medium bg-gray-200/80 text-gray-600">
                                                                +{analysisData.topics.length - 6} more
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Business Insights - Full width, modern design */}
                                    {analysisData.business_insights && (
                                        <div className="mt-8 bg-gradient-to-br from-slate-800/90 via-slate-700/90 to-slate-800/90 backdrop-blur-xl rounded-3xl p-8 border border-slate-600/30 shadow-2xl text-white">
                                            <div className="flex items-center mb-8">
                                                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center mr-4">
                                                    <Lightbulb className="h-7 w-7 text-white" />
                                                </div>
                                                <h4 className="font-bold text-2xl">Business Intelligence</h4>
                                            </div>

                                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                                {/* Issues */}
                                                {analysisData.business_insights.main_issues.length > 0 && (
                                                    <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-6 border border-red-400/30">
                                                        <h5 className="font-bold text-red-200 mb-4 flex items-center">
                                                            <AlertTriangle className="h-5 w-5 mr-2" />
                                                            Critical Issues
                                                        </h5>
                                                        <ul className="space-y-3">
                                                            {analysisData.business_insights.main_issues.map((issue, index) => (
                                                                <li key={index} className="text-red-100 flex items-start text-sm">
                                                                    <Zap className="w-4 h-4 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
                                                                    {issue}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Highlights */}
                                                {analysisData.business_insights.positive_highlights.length > 0 && (
                                                    <div className="bg-emerald-500/20 backdrop-blur-sm rounded-2xl p-6 border border-emerald-400/30">
                                                        <h5 className="font-bold text-emerald-200 mb-4 flex items-center">
                                                            <TrendingUp className="h-5 w-5 mr-2" />
                                                            Strengths
                                                        </h5>
                                                        <ul className="space-y-3">
                                                            {analysisData.business_insights.positive_highlights.map((highlight, index) => (
                                                                <li key={index} className="text-emerald-100 flex items-start text-sm">
                                                                    <Star className="w-4 h-4 text-emerald-400 mt-0.5 mr-3 flex-shrink-0" />
                                                                    {highlight}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Recommendations */}
                                                {analysisData.business_insights.actionable_recommendations.length > 0 && (
                                                    <div className="bg-blue-500/20 backdrop-blur-sm rounded-2xl p-6 border border-blue-400/30">
                                                        <h5 className="font-bold text-blue-200 mb-4 flex items-center">
                                                            <Target className="h-5 w-5 mr-2" />
                                                            Action Items
                                                        </h5>
                                                        <ul className="space-y-3">
                                                            {analysisData.business_insights.actionable_recommendations.map((rec, index) => (
                                                                <li key={index} className="text-blue-100 flex items-start text-sm">
                                                                    <Lightbulb className="w-4 h-4 text-blue-400 mt-0.5 mr-3 flex-shrink-0" />
                                                                    {rec}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Impact Summary */}
                                            <div className="mt-6 flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-gray-300">Business Impact:</span>
                                                    <span className={`font-bold px-3 py-1 rounded-xl text-sm ${analysisData.business_insights.estimated_impact === 'high' ? 'bg-red-500/30 text-red-200' :
                                                        analysisData.business_insights.estimated_impact === 'medium' ? 'bg-yellow-500/30 text-yellow-200' :
                                                            'bg-green-500/30 text-green-200'
                                                        }`}>
                                                        {analysisData.business_insights.estimated_impact.toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-4">
                                                    <span className="text-gray-300">Follow-up Required:</span>
                                                    <span className={`font-bold px-3 py-1 rounded-xl text-sm ${analysisData.business_insights.follow_up_needed ? 'bg-orange-500/30 text-orange-200' : 'bg-green-500/30 text-green-200'
                                                        }`}>
                                                        {analysisData.business_insights.follow_up_needed ? 'YES' : 'NO'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Metadata */}
                            <div className="bg-slate-50/80 backdrop-blur-xl rounded-3xl p-6 border border-slate-200/50 shadow-xl">
                                <h4 className="font-bold text-gray-900 mb-6 text-lg">Review Metadata</h4>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    <div className="text-center p-4 bg-white/60 rounded-2xl">
                                        <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                                        <span className="text-sm text-gray-600 block mb-1">Source</span>
                                        <p className="font-bold text-gray-900">{reviewService.getSourceName(review)}</p>
                                    </div>
                                    <div className="text-center p-4 bg-white/60 rounded-2xl">
                                        <Briefcase className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                                        <span className="text-sm text-gray-600 block mb-1">Collection Job</span>
                                        <p className="font-bold text-gray-900">{reviewService.getJobName(review)}</p>
                                    </div>
                                    <div className="text-center p-4 bg-white/60 rounded-2xl">
                                        <MapPin className="h-8 w-8 text-green-600 mx-auto mb-2" />
                                        <span className="text-sm text-gray-600 block mb-1">Location</span>
                                        <p className="font-bold text-gray-900">{reviewService.getLocationName(review)}</p>
                                    </div>
                                    <div className="text-center p-4 bg-white/60 rounded-2xl">
                                        <Calendar className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                                        <span className="text-sm text-gray-600 block mb-1">Created</span>
                                        <p className="font-bold text-gray-900">{new Date(review.created_at).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
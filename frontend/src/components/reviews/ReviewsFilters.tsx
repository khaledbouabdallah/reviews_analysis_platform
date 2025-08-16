// src/components/reviews/ReviewsFilters.tsx
'use client';

import { useState } from 'react';
import {
    Search,
    Filter,
    X,
    ChevronDown,
    Calendar,
    Star,
    MessageSquare,
    Globe,
    AlertTriangle,
    Clock,
    Brain,
    Settings
} from 'lucide-react';
import { ReviewFilters } from '@/services/review';

interface ReviewsFiltersProps {
    filters: ReviewFilters;
    onFiltersChange: (filters: ReviewFilters) => void;
    reviewCount: number;
    totalCount: number;
}

export function ReviewsFilters({
    filters,
    onFiltersChange,
    reviewCount,
    totalCount
}: ReviewsFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isAdvancedExpanded, setIsAdvancedExpanded] = useState(false);

    const handleFilterChange = (key: keyof ReviewFilters, value: string) => {
        onFiltersChange({
            ...filters,
            [key]: value,
        });
    };

    const clearFilters = () => {
        onFiltersChange({
            job_id: filters.job_id, // Keep job_id if it was set from URL
            source_id: '',
            location_id: '',
            sentiment: '',
            rating: '',
            date_from: '',
            date_to: '',
            search: '',
            has_comment: '',
            language: '',
            spam_status: '',
            urgency: '',
            topic: '',
            processing_status: '',
            // Clear new analysis filters
            has_analyzed_data: '',
            sentiment_label: '',
            emotional_tone: '',
            spam_detection: '',
            urgency_level: '',
            detected_language: '',
        });
    };

    const hasActiveFilters = Object.entries(filters).some(([key, value]) =>
        key !== 'job_id' && value && value.toString().trim() !== ''
    );

    return (
        <div className="relative">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl" />
            <div className="relative p-6">

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-5 w-5 text-gray-600" />
                            <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                        </div>

                        <div className="text-sm text-gray-600 bg-white/50 backdrop-blur-sm px-3 py-1 rounded-full border border-white/40">
                            {reviewCount} of {totalCount} reviews
                        </div>
                    </div>

                    <div className="flex items-center space-x-3">
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center space-x-1 text-sm text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg transition-all duration-200"
                            >
                                <X className="h-3 w-3" />
                                <span>Clear</span>
                            </button>
                        )}

                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-700 bg-white/50 hover:bg-white/70 px-3 py-2 rounded-lg transition-all duration-200"
                        >
                            <span>{isExpanded ? 'Less' : 'More'} Filters</span>
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search reviews..."
                            value={filters.search || ''}
                            onChange={(e) => handleFilterChange('search', e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 placeholder-gray-500"
                        />
                    </div>

                    {/* Analysis Status */}
                    <div className="relative">
                        <select
                            value={filters.has_analyzed_data || ''}
                            onChange={(e) => handleFilterChange('has_analyzed_data', e.target.value)}
                            className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 appearance-none cursor-pointer"
                        >
                            <option value="">All Reviews</option>
                            <option value="yes">🧠 Analyzed</option>
                            <option value="no">⏳ Not Analyzed</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Sentiment */}
                    <div className="relative">
                        <select
                            value={filters.sentiment_label || ''}
                            onChange={(e) => handleFilterChange('sentiment_label', e.target.value)}
                            className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 appearance-none cursor-pointer"
                        >
                            <option value="">All Sentiments</option>
                            <option value="positive">😊 Positive</option>
                            <option value="negative">😞 Negative</option>
                            <option value="neutral">😐 Neutral</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Rating */}
                    <div className="relative">
                        <select
                            value={filters.rating || ''}
                            onChange={(e) => handleFilterChange('rating', e.target.value)}
                            className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 appearance-none cursor-pointer"
                        >
                            <option value="">All Ratings</option>
                            <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                            <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                            <option value="3">⭐⭐⭐ 3 Stars</option>
                            <option value="2">⭐⭐ 2 Stars</option>
                            <option value="1">⭐ 1 Star</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>

                    {/* Source Type */}
                    <div className="relative">
                        <select
                            value={filters.source_id || ''}
                            onChange={(e) => handleFilterChange('source_id', e.target.value)}
                            className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 appearance-none cursor-pointer"
                        >
                            <option value="">All Sources</option>
                            <option value="google">📍 Google Maps</option>
                            <option value="csv">📊 CSV Upload</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Advanced Filters (Expandable) */}
                {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-6 border-t border-white/20 animate-in slide-in-from-top duration-300">
                        {/* Date Range */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                <Calendar className="inline h-4 w-4 mr-1" />
                                Date From
                            </label>
                            <input
                                type="date"
                                value={filters.date_from || ''}
                                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 text-sm"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                <Calendar className="inline h-4 w-4 mr-1" />
                                Date To
                            </label>
                            <input
                                type="date"
                                value={filters.date_to || ''}
                                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 text-sm"
                            />
                        </div>

                        {/* Has Comment */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                <MessageSquare className="inline h-4 w-4 mr-1" />
                                Comments
                            </label>
                            <select
                                value={filters.has_comment || ''}
                                onChange={(e) => handleFilterChange('has_comment', e.target.value)}
                                className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 text-sm appearance-none cursor-pointer"
                            >
                                <option value="">All Reviews</option>
                                <option value="yes">💬 With Comments</option>
                                <option value="no">⭐ Rating Only</option>
                            </select>
                        </div>

                        {/* AI Analysis Filters */}
                        <div className="col-span-full">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                    <Brain className="h-4 w-4 text-purple-600" />
                                    <span className="text-sm font-medium text-gray-700">AI Analysis Filters</span>
                                </div>
                                <button
                                    onClick={() => setIsAdvancedExpanded(!isAdvancedExpanded)}
                                    className="flex items-center space-x-1 text-xs text-gray-500 hover:text-gray-700"
                                >
                                    <span>{isAdvancedExpanded ? 'Hide' : 'Show'} Advanced</span>
                                    <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isAdvancedExpanded ? 'rotate-180' : ''}`} />
                                </button>
                            </div>

                            {isAdvancedExpanded && (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in slide-in-from-top duration-300">
                                    {/* Emotional Tone */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Emotional Tone
                                        </label>
                                        <select
                                            value={filters.emotional_tone || ''}
                                            onChange={(e) => handleFilterChange('emotional_tone', e.target.value)}
                                            className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">All Tones</option>
                                            <option value="happy">😄 Happy</option>
                                            <option value="satisfied">😌 Satisfied</option>
                                            <option value="neutral">😐 Neutral</option>
                                            <option value="disappointed">😞 Disappointed</option>
                                            <option value="frustrated">😤 Frustrated</option>
                                            <option value="angry">😡 Angry</option>
                                        </select>
                                    </div>

                                    {/* Spam Detection */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Spam Status
                                        </label>
                                        <select
                                            value={filters.spam_detection || ''}
                                            onChange={(e) => handleFilterChange('spam_detection', e.target.value)}
                                            className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">All Reviews</option>
                                            <option value="not_spam">✅ Genuine</option>
                                            <option value="spam">🚫 Spam/Fake</option>
                                        </select>
                                    </div>

                                    {/* Urgency Level */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Urgency Level
                                        </label>
                                        <select
                                            value={filters.urgency_level || ''}
                                            onChange={(e) => handleFilterChange('urgency_level', e.target.value)}
                                            className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">All Levels</option>
                                            <option value="critical">🚨 Critical</option>
                                            <option value="high">🔴 High</option>
                                            <option value="medium">🟡 Medium</option>
                                            <option value="low">🟢 Low</option>
                                            <option value="none">⚪ None</option>
                                        </select>
                                    </div>

                                    {/* Detected Language */}
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Language
                                        </label>
                                        <select
                                            value={filters.detected_language || ''}
                                            onChange={(e) => handleFilterChange('detected_language', e.target.value)}
                                            className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 text-sm appearance-none cursor-pointer"
                                        >
                                            <option value="">All Languages</option>
                                            <option value="en">🇬🇧 English</option>
                                            <option value="fr">🇫🇷 French</option>
                                            <option value="ar">🇸🇦 Arabic</option>
                                            <option value="es">🇪🇸 Spanish</option>
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Active Filters Display */}
                {hasActiveFilters && (
                    <div className="mt-6 pt-4 border-t border-white/20">
                        <div className="flex items-center space-x-2 flex-wrap">
                            <span className="text-sm font-medium text-gray-700">Active filters:</span>

                            {Object.entries(filters).map(([key, value]) => {
                                if (!value || value.toString().trim() === '' || key === 'job_id') return null;

                                const filterLabels: Record<string, string> = {
                                    search: `Search: "${value}"`,
                                    has_analyzed_data: `Analysis: ${value === 'yes' ? 'Analyzed' : 'Not Analyzed'}`,
                                    sentiment_label: `Sentiment: ${value}`,
                                    rating: `Rating: ${value} stars`,
                                    has_comment: `Comments: ${value === 'yes' ? 'With Comments' : 'Rating Only'}`,
                                    emotional_tone: `Tone: ${value}`,
                                    spam_detection: `Spam: ${value === 'spam' ? 'Spam/Fake' : 'Genuine'}`,
                                    urgency_level: `Urgency: ${value}`,
                                    detected_language: `Language: ${value}`,
                                    date_from: `From: ${value}`,
                                    date_to: `To: ${value}`,
                                };

                                const label = filterLabels[key] || `${key}: ${value}`;

                                return (
                                    <span
                                        key={key}
                                        className="inline-flex items-center space-x-1 bg-blue-100 text-blue-700 px-2 py-1 rounded-lg text-xs border border-blue-200"
                                    >
                                        <span>{label}</span>
                                        <button
                                            onClick={() => handleFilterChange(key as keyof ReviewFilters, '')}
                                            className="hover:bg-blue-200 rounded-full p-0.5 transition-colors duration-200"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
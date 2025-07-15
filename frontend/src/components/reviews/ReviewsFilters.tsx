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
    Clock
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
                            Showing {reviewCount.toLocaleString()} of {totalCount.toLocaleString()} reviews
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center space-x-1 text-red-600 hover:text-red-700 bg-red-50/50 hover:bg-red-50/70 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium"
                            >
                                <X className="h-4 w-4" />
                                <span>Clear</span>
                            </button>
                        )}

                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 bg-white/50 hover:bg-white/70 px-3 py-1.5 rounded-lg transition-all duration-200 text-sm font-medium"
                        >
                            <span>{isExpanded ? 'Less' : 'More'} Filters</span>
                            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                    </div>
                </div>

                {/* Quick Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

                    {/* Sentiment */}
                    <div className="relative">
                        <select
                            value={filters.sentiment || ''}
                            onChange={(e) => handleFilterChange('sentiment', e.target.value)}
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

                    {/* Has Comment */}
                    <div className="relative">
                        <select
                            value={filters.has_comment || ''}
                            onChange={(e) => handleFilterChange('has_comment', e.target.value)}
                            className="w-full px-4 py-3 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 appearance-none cursor-pointer"
                        >
                            <option value="">All Reviews</option>
                            <option value="yes">💬 With Comments</option>
                            <option value="no">⭐ Rating Only</option>
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
                                Date Range
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="date"
                                    value={filters.date_from || ''}
                                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                                    className="px-3 py-2 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 text-sm"
                                />
                                <input
                                    type="date"
                                    value={filters.date_to || ''}
                                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                                    className="px-3 py-2 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 text-sm"
                                />
                            </div>
                        </div>

                        {/* Language */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                <Globe className="inline h-4 w-4 mr-1" />
                                Language
                            </label>
                            <select
                                value={filters.language || ''}
                                onChange={(e) => handleFilterChange('language', e.target.value)}
                                className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 text-sm appearance-none cursor-pointer"
                            >
                                <option value="">All Languages</option>
                                <option value="en">🇺🇸 English</option>
                                <option value="fr">🇫🇷 French</option>
                                <option value="es">🇪🇸 Spanish</option>
                                <option value="de">🇩🇪 German</option>
                                <option value="it">🇮🇹 Italian</option>
                            </select>
                        </div>

                        {/* Topic/Segment */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                <MessageSquare className="inline h-4 w-4 mr-1" />
                                Topic
                            </label>
                            <select
                                value={filters.topic || ''}
                                onChange={(e) => handleFilterChange('topic', e.target.value)}
                                className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 text-sm appearance-none cursor-pointer"
                            >
                                <option value="">All Topics</option>
                                <option value="food_quality">🍽️ Food Quality</option>
                                <option value="service">👥 Service</option>
                                <option value="ambiance">🏛️ Ambiance</option>
                                <option value="price">💰 Price</option>
                                <option value="location">📍 Location</option>
                                <option value="cleanliness">🧽 Cleanliness</option>
                            </select>
                        </div>

                        {/* Urgency */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                <AlertTriangle className="inline h-4 w-4 mr-1" />
                                Urgency
                            </label>
                            <select
                                value={filters.urgency || ''}
                                onChange={(e) => handleFilterChange('urgency', e.target.value)}
                                className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 text-sm appearance-none cursor-pointer"
                            >
                                <option value="">All Urgency Levels</option>
                                <option value="very_urgent">🚨 Very Urgent</option>
                                <option value="urgent">⚡ Urgent</option>
                                <option value="moderate">⚠️ Moderate</option>
                                <option value="low">📝 Low</option>
                                <option value="not_urgent">✅ Not Urgent</option>
                            </select>
                        </div>

                        {/* Spam Status */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                <Clock className="inline h-4 w-4 mr-1" />
                                Content Quality
                            </label>
                            <select
                                value={filters.spam_status || ''}
                                onChange={(e) => handleFilterChange('spam_status', e.target.value)}
                                className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 text-sm appearance-none cursor-pointer"
                            >
                                <option value="">All Reviews</option>
                                <option value="legitimate">✅ Legitimate</option>
                                <option value="spam">🚫 Spam</option>
                                <option value="suspicious">⚠️ Suspicious</option>
                            </select>
                        </div>

                        {/* Processing Status */}
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                <Clock className="inline h-4 w-4 mr-1" />
                                AI Processing
                            </label>
                            <select
                                value={filters.processing_status || ''}
                                onChange={(e) => handleFilterChange('processing_status', e.target.value)}
                                className="w-full px-3 py-2 bg-white/50 backdrop-blur-sm border-2 border-white/40 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white/70 transition-all duration-300 text-gray-900 text-sm appearance-none cursor-pointer"
                            >
                                <option value="">All Statuses</option>
                                <option value="completed">✅ Processed</option>
                                <option value="pending">⏳ Pending</option>
                                <option value="failed">❌ Failed</option>
                            </select>
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
                                    sentiment: `Sentiment: ${value}`,
                                    rating: `Rating: ${value} stars`,
                                    has_comment: `Comments: ${value === 'yes' ? 'With comments' : 'Rating only'}`,
                                    language: `Language: ${value}`,
                                    topic: `Topic: ${value.replace('_', ' ')}`,
                                    urgency: `Urgency: ${value.replace('_', ' ')}`,
                                    spam_status: `Quality: ${value}`,
                                    date_from: `From: ${value}`,
                                    date_to: `To: ${value}`,
                                };

                                return (
                                    <span
                                        key={key}
                                        className="inline-flex items-center space-x-1 bg-blue-100/80 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full border border-blue-200/50"
                                    >
                                        <span>{filterLabels[key] || `${key}: ${value}`}</span>
                                        <button
                                            onClick={() => handleFilterChange(key as keyof ReviewFilters, '')}
                                            className="text-blue-600 hover:text-blue-800 ml-1"
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
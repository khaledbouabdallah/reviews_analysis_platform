// src/pages/Reviews/components/ReviewFiltersComponent.tsx
import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReviewFilters } from '@/services/review';
import { Location } from '@/services/location';
import { Source } from '@/services/source';
import { Job } from '@/services/job';

interface ReviewFiltersComponentProps {
    filters: ReviewFilters;
    searchTerm: string;
    onFilterChange: (key: keyof ReviewFilters, value: any) => void;
    onSearchChange: (term: string) => void;
    onClearFilters: () => void;
    hasActiveFilters: boolean;
    filteredCount: number;
    totalCount: number;
    locations: Location[];
    sources: Source[];
    jobs: Job[];
}

export const ReviewFiltersComponent = ({
    filters,
    searchTerm,
    onFilterChange,
    onSearchChange,
    onClearFilters,
    hasActiveFilters,
    filteredCount,
    totalCount,
    locations,
    sources,
    jobs
}: ReviewFiltersComponentProps) => {
    const [showAdvanced, setShowAdvanced] = useState(false);

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
                            {filteredCount} of {totalCount} reviews
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClearFilters}
                                className="text-red-600 hover:text-red-700"
                            >
                                <X className="h-3 w-3 mr-1" />
                                Clear All
                            </Button>
                        )}
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            {showAdvanced ? 'Less' : 'More'} Filters
                            <ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Basic Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search reviews..."
                            value={searchTerm}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-10 bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70"
                        />
                    </div>

                    {/* Analysis Status */}
                    <Select
                        value={filters.has_analysis === true ? 'yes' : filters.has_analysis === false ? 'no' : 'all'}
                        onValueChange={(value) => onFilterChange('has_analysis', value)}
                    >
                        <SelectTrigger className="bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70">
                            <SelectValue placeholder="All Reviews" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Reviews</SelectItem>
                            <SelectItem value="yes">Analyzed</SelectItem>
                            <SelectItem value="no">Not Analyzed</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sentiment */}
                    <Select
                        value={filters.sentiment || 'all'}
                        onValueChange={(value) => onFilterChange('sentiment', value)}
                    >
                        <SelectTrigger className="bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70">
                            <SelectValue placeholder="All Sentiments" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sentiments</SelectItem>
                            <SelectItem value="positive">Positive</SelectItem>
                            <SelectItem value="negative">Negative</SelectItem>
                            <SelectItem value="neutral">Neutral</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Needs Attention */}
                    <Select
                        value={filters.needs_attention ? 'yes' : 'all'}
                        onValueChange={(value) => onFilterChange('needs_attention', value)}
                    >
                        <SelectTrigger className="bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70">
                            <SelectValue placeholder="All Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priority</SelectItem>
                            <SelectItem value="yes">Needs Attention</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Advanced Filters */}
                {showAdvanced && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-6 border-t border-white/20 animate-in slide-in-from-top duration-300">
                        {/* Location Filter */}
                        <Select
                            value={filters.location_id || 'all'}
                            onValueChange={(value) => onFilterChange('location_id', value)}
                        >
                            <SelectTrigger className="bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70">
                                <SelectValue placeholder="All Locations" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Locations</SelectItem>
                                {locations.map((location) => (
                                    <SelectItem key={location.id} value={location.id}>
                                        {location.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Source Filter */}
                        <Select
                            value={filters.source_id || 'all'}
                            onValueChange={(value) => onFilterChange('source_id', value)}
                        >
                            <SelectTrigger className="bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70">
                                <SelectValue placeholder="All Sources" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sources</SelectItem>
                                {sources.map((source) => (
                                    <SelectItem key={source.id} value={source.id}>
                                        {source.name} ({source.type})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Job Filter */}
                        <Select
                            value={filters.job_id || 'all'}
                            onValueChange={(value) => onFilterChange('job_id', value)}
                        >
                            <SelectTrigger className="bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70">
                                <SelectValue placeholder="All Jobs" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Jobs</SelectItem>
                                {jobs.map((job) => (
                                    <SelectItem key={job.id} value={job.id}>
                                        {job.name} 
                                        {/* ({job.type}) */}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Spam Filter */}
                        <Select
                            value={filters.is_spam === true ? 'yes' : filters.is_spam === false ? 'no' : 'all'}
                            onValueChange={(value) => onFilterChange('is_spam', value)}
                        >
                            <SelectTrigger className="bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70">
                                <SelectValue placeholder="All Reviews" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Reviews</SelectItem>
                                <SelectItem value="no">Not Spam</SelectItem>
                                <SelectItem value="yes">Spam Only</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
        </div>
    );
};
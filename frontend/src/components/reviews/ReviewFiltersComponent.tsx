// frontend/src/components/reviews/ReviewFiltersComponent.tsx
import { useState } from 'react';
import { Search, Filter, X, ChevronDown, Settings, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReviewFilters, SentimentLabel, UrgencyLevel } from '@/services/review';
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
    // ADDED: Page size and column controls
    pageSize: number;
    onPageSizeChange: (size: number) => void;
    visibleColumns: string[];
    onColumnVisibilityChange: (columns: string[]) => void;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const AVAILABLE_COLUMNS = [
    { id: 'rating', label: 'Rating' },
    { id: 'sentiment', label: 'Sentiment' },
    { id: 'urgency', label: 'Urgency' },
    { id: 'spam', label: 'Spam Status' },
    { id: 'topics', label: 'Topics' },
    { id: 'source', label: 'Source' },
    { id: 'date', label: 'Date' },
    { id: 'username', label: 'Username' }
];

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
    jobs,
    pageSize,
    onPageSizeChange,
    visibleColumns,
    onColumnVisibilityChange
}: ReviewFiltersComponentProps) => {
    const [showAdvanced, setShowAdvanced] = useState(false);
    const [showColumnSettings, setShowColumnSettings] = useState(false);

    // FIXED: Filter out analyze jobs
    const nonAnalyzeJobs = jobs.filter(job => job.job_type !== 'analysis');

    const handleColumnToggle = (columnId: string) => {
        const newColumns = visibleColumns.includes(columnId)
            ? visibleColumns.filter(id => id !== columnId)
            : [...visibleColumns, columnId];
        onColumnVisibilityChange(newColumns);
    };

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
                        {/* Page Size Selector */}
                        <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Show:</span>
                            <Select value={pageSize.toString()} onValueChange={(value) => onPageSizeChange(Number(value))}>
                                <SelectTrigger className="w-20 bg-white/50 backdrop-blur-sm border border-white/40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PAGE_SIZE_OPTIONS.map(size => (
                                        <SelectItem key={size} value={size.toString()}>
                                            {size}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Column Settings */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowColumnSettings(!showColumnSettings)}
                            className="bg-white/50 backdrop-blur-sm border border-white/40"
                        >
                            <Settings className="h-4 w-4 mr-1" />
                            Columns
                        </Button>

                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onClearFilters}
                                className="text-red-600 hover:text-red-700 bg-white/50 backdrop-blur-sm border border-white/40"
                            >
                                <X className="h-3 w-3 mr-1" />
                                Clear All
                            </Button>
                        )}
                        
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="bg-white/50 backdrop-blur-sm border border-white/40"
                        >
                            {showAdvanced ? 'Less' : 'More'} Filters
                            <ChevronDown className={`h-4 w-4 ml-1 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Column Settings Panel */}
                {showColumnSettings && (
                    <div className="mb-6 p-4 bg-white/50 backdrop-blur-sm rounded-2xl border border-white/40">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Visible Columns</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {AVAILABLE_COLUMNS.map(column => (
                                <label key={column.id} className="flex items-center space-x-2 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns.includes(column.id)}
                                        onChange={() => handleColumnToggle(column.id)}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-gray-700">{column.label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                )}

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
                            <SelectValue placeholder="Analysis Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Reviews</SelectItem>
                            <SelectItem value="yes">Analyzed Only</SelectItem>
                            <SelectItem value="no">Not Analyzed</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Sentiment Filter */}
                    <Select
                        value={filters.sentiment || 'all'}
                        onValueChange={(value) => onFilterChange('sentiment', value)}
                    >
                        <SelectTrigger className="bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70">
                            <SelectValue placeholder="Sentiment" />
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
                        value={filters.needs_attention === true ? 'yes' : 'all'}
                        onValueChange={(value) => onFilterChange('needs_attention', value)}
                    >
                        <SelectTrigger className="bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70">
                            <SelectValue placeholder="Urgency" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Reviews</SelectItem>
                            <SelectItem value="yes">Needs Attention</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Advanced Filters */}
                {showAdvanced && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

                        {/* FIXED: Job Filter - Exclude analyze jobs */}
                        <Select
                            value={filters.job_id || 'all'}
                            onValueChange={(value) => onFilterChange('job_id', value)}
                        >
                            <SelectTrigger className="bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70">
                                <SelectValue placeholder="All Jobs" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Jobs</SelectItem>
                                {nonAnalyzeJobs.map((job) => (
                                    <SelectItem key={job.id} value={job.id}>
                                        {job.name}
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

                        {/* ADDED: Urgency Level Filter */}
                        <Select
                            value={filters.urgency || 'all'}
                            onValueChange={(value) => onFilterChange('urgency', value)}
                        >
                            <SelectTrigger className="bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70">
                                <SelectValue placeholder="Urgency Level" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Urgency Levels</SelectItem>
                                <SelectItem value="critical">Critical</SelectItem>
                                <SelectItem value="high">High</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="low">Low</SelectItem>
                                <SelectItem value="none">None</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* ADDED: Rating Range Filter */}
                        <Select
                            value={filters.rating_range || 'all'}
                            onValueChange={(value) => onFilterChange('rating_range', value)}
                        >
                            <SelectTrigger className="bg-white/50 backdrop-blur-sm border-2 border-white/40 focus:bg-white/70">
                                <SelectValue placeholder="Rating Range" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Ratings</SelectItem>
                                <SelectItem value="5">5 Stars</SelectItem>
                                <SelectItem value="4-5">4-5 Stars</SelectItem>
                                <SelectItem value="3-5">3+ Stars</SelectItem>
                                <SelectItem value="1-2">1-2 Stars</SelectItem>
                                <SelectItem value="1">1 Star</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>
        </div>
    );
};
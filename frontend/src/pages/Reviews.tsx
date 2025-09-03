// frontend/src/pages/Reviews.tsx
import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { Building2, Brain } from 'lucide-react';
import { useBusiness } from '@/contexts/BusinessContext';
import { useReviewsByBusinessPaginated, useReview } from '@/hooks/useReviews';
import { useLocationsByBusiness } from '@/hooks/useLocations';
import { useSourcesByBusiness } from '@/hooks/useSources';
import { useJobsByBusiness } from '@/hooks/useJobs';
import { ReviewFilters, SentimentLabel } from '@/services/review';
import { ReviewStats } from '@/components/reviews/ReviewStats';
import { ReviewFiltersComponent } from '@/components/reviews/ReviewFiltersComponent';
import { ReviewTable } from '@/components/reviews/ReviewTable';
import { PaginationControls } from '@/components/reviews/PaginationControls';
import { ReviewDetailModal } from '@/components/reviews/ReviewDetailModal';
import { UrgencyLevel } from '@/services/review';

const DEFAULT_VISIBLE_COLUMNS = ['rating', 'sentiment', 'urgency', 'source', 'date'];

const Reviews = () => {
    const queryClient = useQueryClient();
    const { selectedBusiness, hasBusinesses } = useBusiness();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // State for filters - synced with URL
    const [filters, setFilters] = useState<ReviewFilters>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25); // CHANGED: Now mutable
    const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);
    
    // ADDED: Column visibility state
    const [visibleColumns, setVisibleColumns] = useState<string[]>(DEFAULT_VISIBLE_COLUMNS);

    // Initialize filters from URL params on mount
    useEffect(() => {
        const urlFilters: ReviewFilters = {};
        const urlSearchTerm = searchParams.get('search') || '';
        const urlPage = parseInt(searchParams.get('page') || '1');
        const urlPageSize = parseInt(searchParams.get('pageSize') || '25');

        // Parse filter parameters
        if (searchParams.get('has_analysis')) {
            urlFilters.has_analysis = searchParams.get('has_analysis') === 'true';
        }
        if (searchParams.get('needs_attention')) {
            urlFilters.needs_attention = searchParams.get('needs_attention') === 'true';
        }
        if (searchParams.get('sentiment')) {
            urlFilters.sentiment = searchParams.get('sentiment') as SentimentLabel;
        }
        if (searchParams.get('is_spam')) {
            urlFilters.is_spam = searchParams.get('is_spam') === 'true';
        }
        if (searchParams.get('job_id')) {
            urlFilters.job_id = searchParams.get('job_id');
        }
        if (searchParams.get('source_id')) {
            urlFilters.source_id = searchParams.get('source_id');
        }
        if (searchParams.get('location_id')) {
            urlFilters.location_id = searchParams.get('location_id');
        }
        // ADDED: New filters
        const urgencyParam = searchParams.get('urgency');
        if (urgencyParam && ['critical', 'high', 'medium', 'low', 'none'].includes(urgencyParam)) {
            urlFilters.urgency = urgencyParam as UrgencyLevel;
        }
        if (searchParams.get('rating_range')) {
            urlFilters.rating_range = searchParams.get('rating_range');
        }

        // ADDED: Column visibility from URL
        const urlColumns = searchParams.get('columns');
        if (urlColumns) {
            setVisibleColumns(urlColumns.split(','));
        }

        setFilters(urlFilters);
        setSearchTerm(urlSearchTerm);
        setCurrentPage(urlPage);
        setPageSize(urlPageSize);
    }, [searchParams]);

    // Update URL when state changes
    const updateURL = (newFilters: ReviewFilters, newSearchTerm: string, newPage: number, newPageSize: number, newColumns: string[]) => {
        const params = new URLSearchParams();
        
        if (newSearchTerm) params.set('search', newSearchTerm);
        if (newPage > 1) params.set('page', newPage.toString());
        if (newPageSize !== 25) params.set('pageSize', newPageSize.toString());
        
        // Add column visibility
        if (newColumns.length > 0 && newColumns.join(',') !== DEFAULT_VISIBLE_COLUMNS.join(',')) {
            params.set('columns', newColumns.join(','));
        }
        
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== 'all') {
                params.set(key, value.toString());
            }
        });
        
        setSearchParams(params);
    };

    // Use paginated hook with enhanced filters
    const { data: paginatedData, isLoading, error } = useReviewsByBusinessPaginated(
        selectedBusiness?.id || '',
        currentPage,
        pageSize,
        filters
    );

    // Get dropdown data for advanced filters
    const { data: locations = [] } = useLocationsByBusiness(selectedBusiness?.id || '');
    const { data: sources = [] } = useSourcesByBusiness(selectedBusiness?.id || '');
    const { data: jobs = [] } = useJobsByBusiness(selectedBusiness?.id || '');

    // Get selected review for detail modal
    const { data: selectedReview } = useReview(selectedReviewId || '');

    const reviews = paginatedData?.reviews || [];
    const totalPages = paginatedData?.pages || 0;
    const totalReviews = paginatedData?.total || 0;

    // ENHANCED: Client-side filtering with improved logic
    const searchFilteredReviews = reviews.filter(review => {
        if (!searchTerm) return true;
        
        const reviewText = (review.data?.original_text || review.data?.translated_text || '').toLowerCase();
        const username = (review.data?.username || '').toLowerCase();
        const searchLower = searchTerm.toLowerCase();
        
        return reviewText.includes(searchLower) || username.includes(searchLower);
    });

    // Handle manual refresh
    const handleRefresh = () => {
        queryClient.invalidateQueries({ 
            queryKey: ['reviews', 'business', selectedBusiness?.id], 
            exact: false 
        });
    };

    // Handle filter changes
    const handleFilterChange = (key: keyof ReviewFilters, value: any) => {
        const newFilters = {
            ...filters,
            [key]: value === 'all' ? undefined : value === 'yes' ? true : value === 'no' ? false : value
        };
        
        setFilters(newFilters);
        setCurrentPage(1); // Reset to first page when filtering
        updateURL(newFilters, searchTerm, 1, pageSize, visibleColumns);
    };

    // Handle search changes
    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
        updateURL(filters, term, currentPage, pageSize, visibleColumns);
    };

    // ADDED: Handle page size changes
    const handlePageSizeChange = (newSize: number) => {
        setPageSize(newSize);
        setCurrentPage(1); // Reset to first page
        updateURL(filters, searchTerm, 1, newSize, visibleColumns);
    };

    // ADDED: Handle column visibility changes
    const handleColumnVisibilityChange = (columns: string[]) => {
        setVisibleColumns(columns);
        updateURL(filters, searchTerm, currentPage, pageSize, columns);
    };

    // Handle page changes
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        updateURL(filters, searchTerm, page, pageSize, visibleColumns);
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({});
        setSearchTerm('');
        setCurrentPage(1);
        updateURL({}, '', 1, pageSize, visibleColumns);
    };

    // Check if any filters are active
    const hasActiveFilters = Object.values(filters).some(value => 
        value !== undefined && value !== null && value !== ''
    ) || searchTerm !== '';

    // Handle view details
    const handleViewDetails = (reviewId: string) => {
        setSelectedReviewId(reviewId);
    };

    // Early return if no business is selected
    if (!hasBusinesses) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <Building2 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">No Business Selected</h2>
                    <p className="text-gray-600 mb-6">
                        You need to create or select a business first to view reviews.
                    </p>
                </div>
            </div>
        );
    }

    if (!selectedBusiness) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 flex items-center justify-center">
                <div className="text-center">
                    <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Business</h2>
                    <p className="text-gray-600">
                        Please select a business from the sidebar to view its reviews and AI analysis.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 space-y-8">
            {/* Header */}
            <div className="relative">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl" />
                <div className="relative p-8">
                    <div className="max-w-4xl">
                        <div className="flex items-center space-x-3 mb-4">
                            <Brain className="h-8 w-8 text-blue-600" />
                            <h1 className="text-3xl font-bold text-gray-900">Review Analysis</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Building2 className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-700 font-medium">{selectedBusiness.name}</span>
                            </div>
                            <div className="h-4 w-px bg-gray-300" />
                            <p className="text-gray-600">
                                AI-powered insights and analysis for customer reviews
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Component */}
            <ReviewStats 
                reviews={reviews}
                totalReviews={totalReviews}
                isLoading={isLoading}
                onRefresh={handleRefresh}
            />

            {/* Filters Component */}
            <ReviewFiltersComponent
                filters={filters}
                searchTerm={searchTerm}
                onFilterChange={handleFilterChange}
                onSearchChange={handleSearchChange}
                onClearFilters={clearFilters}
                hasActiveFilters={hasActiveFilters}
                filteredCount={searchFilteredReviews.length}
                totalCount={totalReviews}
                locations={locations}
                sources={sources}
                jobs={jobs}
                pageSize={pageSize}
                onPageSizeChange={handlePageSizeChange}
                visibleColumns={visibleColumns}
                onColumnVisibilityChange={handleColumnVisibilityChange}
            />

            {/* Table Component */}
            <ReviewTable
                reviews={searchFilteredReviews}
                isLoading={isLoading}
                error={error}
                hasActiveFilters={hasActiveFilters}
                onRefresh={handleRefresh}
                onViewDetails={handleViewDetails}
                visibleColumns={visibleColumns}
            />

            {/* Pagination Component */}
            {totalPages > 1 && (
                <PaginationControls
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalReviews}
                    pageSize={pageSize}
                    onPageChange={handlePageChange}
                />
            )}

            {/* Detail Modal */}
            {selectedReviewId && (
                <ReviewDetailModal
                    review={selectedReview}
                    isOpen={!!selectedReviewId}
                    onClose={() => setSelectedReviewId(null)}
                />
            )}
        </div>
    );
};

export default Reviews;
// src/pages/Reviews.tsx
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

const Reviews = () => {
    const queryClient = useQueryClient();
    const { selectedBusiness, hasBusinesses } = useBusiness();
    const [searchParams, setSearchParams] = useSearchParams();
    
    // State for filters - synced with URL
    const [filters, setFilters] = useState<ReviewFilters>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(25);
    const [selectedReviewId, setSelectedReviewId] = useState<string | null>(null);

    // Initialize filters from URL params on mount
    useEffect(() => {
        const urlFilters: ReviewFilters = {};
        const urlSearchTerm = searchParams.get('search') || '';
        const urlPage = parseInt(searchParams.get('page') || '1');

        // Parse filter params
        const sentiment = searchParams.get('sentiment') as SentimentLabel;
        const hasAnalysis = searchParams.get('has_analysis');
        const needsAttention = searchParams.get('needs_attention');
        const isSpam = searchParams.get('is_spam');
        const jobId = searchParams.get('job_id');
        const sourceId = searchParams.get('source_id');
        const locationId = searchParams.get('location_id');

        if (sentiment) urlFilters.sentiment = sentiment;
        if (hasAnalysis === 'true') urlFilters.has_analysis = true;
        if (hasAnalysis === 'false') urlFilters.has_analysis = false;
        if (needsAttention === 'true') urlFilters.needs_attention = true;
        if (isSpam === 'true') urlFilters.is_spam = true;
        if (jobId) urlFilters.job_id = jobId;
        if (sourceId) urlFilters.source_id = sourceId;
        if (locationId) urlFilters.location_id = locationId;

        setFilters(urlFilters);
        setSearchTerm(urlSearchTerm);
        setCurrentPage(urlPage);
    }, [searchParams]);

    // Update URL when filters change
    const updateUrlParams = (newFilters: ReviewFilters, newSearchTerm: string, newPage: number) => {
        const params = new URLSearchParams();
        
        if (newSearchTerm) params.set('search', newSearchTerm);
        if (newPage > 1) params.set('page', newPage.toString());
        
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.set(key, value.toString());
            }
        });
        
        setSearchParams(params);
    };

    // Use paginated hook
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

    // Get selected review for detail modal - FIXED
    const { data: selectedReview } = useReview(selectedReviewId || '');

    const reviews = paginatedData?.reviews || [];
    const totalPages = paginatedData?.pages || 0;
    const totalReviews = paginatedData?.total || 0;

    // Filter reviews by search term (client-side filter for current page)
    const searchFilteredReviews = reviews.filter(review => {
        if (!searchTerm) return true;
        const reviewText = review.data?.original_text || review.data?.translated_text || '';
        return reviewText.toLowerCase().includes(searchTerm.toLowerCase());
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
        setCurrentPage(1);
        updateUrlParams(newFilters, searchTerm, 1);
    };

    // Handle search term change
    const handleSearchChange = (term: string) => {
        setSearchTerm(term);
        updateUrlParams(filters, term, currentPage);
    };

    // Handle page change
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        updateUrlParams(filters, searchTerm, page);
    };

    // Clear all filters
    const clearFilters = () => {
        setFilters({});
        setSearchTerm('');
        setCurrentPage(1);
        setSearchParams({});
    };

    // Handle view details
    const handleViewDetails = (reviewId: string) => {
        setSelectedReviewId(reviewId);
    };

    const hasActiveFilters = Object.keys(filters).length > 0 || Boolean(searchTerm);

    // Show business selection message
    if (!hasBusinesses) {
        return (
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <Building2 className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
                    <h2 className="text-2xl font-bold mb-4">No businesses found</h2>
                    <p className="text-muted-foreground mb-6">Create a business first to analyze reviews with AI.</p>
                </div>
            </div>
        );
    }

    if (!selectedBusiness) {
        return (
            <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
                <div className="text-center max-w-md mx-auto">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl rounded-full"></div>
                        <Brain className="relative w-16 h-16 text-primary mx-auto" />
                    </div>
                    <h2 className="text-2xl font-bold mb-4">Select a business</h2>
                    <p className="text-muted-foreground">Choose a business from the header to start analyzing reviews with AI.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 p-6 space-y-8">
            {/* Header */}
            <div className="relative">
                <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl"></div>
                <div className="relative p-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-gradient-to-r from-primary to-accent blur-xl opacity-30 rounded-full"></div>
                                <div className="relative w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center">
                                    <Brain className="w-8 h-8 text-white" />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                                    AI Review Analysis
                                </h1>
                                <p className="text-lg text-muted-foreground mt-1">
                                    Powered insights for <span className="font-semibold text-primary">{selectedBusiness.name}</span>
                                </p>
                            </div>
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
            />

            {/* Table Component */}
            <ReviewTable
                reviews={searchFilteredReviews}
                isLoading={isLoading}
                error={error}
                hasActiveFilters={hasActiveFilters}
                onRefresh={handleRefresh}
                onViewDetails={handleViewDetails}
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
                    reviewId={selectedReviewId}
                    review={selectedReview}
                    isOpen={!!selectedReviewId}
                    onClose={() => setSelectedReviewId(null)}
                />
            )}
        </div>
    );
};

export default Reviews;
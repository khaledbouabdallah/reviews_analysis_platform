import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
}

export const PaginationControls = ({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange
}: PaginationControlsProps) => {
    // Calculate visible page range
    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        
        for (let i = Math.max(2, currentPage - delta); 
             i <= Math.min(totalPages - 1, currentPage + delta); 
             i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            range.unshift('...');
        }

        if (currentPage + delta < totalPages - 1) {
            range.push('...');
        }

        range.unshift(1);
        if (totalPages > 1) {
            range.push(totalPages);
        }

        return range;
    };

    const visiblePages = getVisiblePages();
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    return (
        <div className="relative">
            <div className="absolute inset-0 bg-white/40 backdrop-blur-xl rounded-3xl border border-white/30 shadow-xl" />
            <div className="relative p-6">
                <div className="flex items-center justify-between">
                    {/* Page Info */}
                    <div className="text-sm text-gray-600">
                        Showing {startItem}-{endItem} of {totalItems} reviews
                    </div>

                    {/* Page Controls */}
                    <div className="flex items-center space-x-2">
                        {/* First Page */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(1)}
                            disabled={currentPage === 1}
                            className="bg-white/50 backdrop-blur-sm border-white/40"
                        >
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>

                        {/* Previous Page */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="bg-white/50 backdrop-blur-sm border-white/40"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Page Numbers */}
                        <div className="flex items-center space-x-1">
                            {visiblePages.map((page, index) => (
                                <div key={index}>
                                    {page === '...' ? (
                                        <span className="px-3 py-2 text-gray-500">...</span>
                                    ) : (
                                        <Button
                                            variant={currentPage === page ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => onPageChange(page as number)}
                                            className={
                                                currentPage === page
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-white/50 backdrop-blur-sm border-white/40 hover:bg-white/70"
                                            }
                                        >
                                            {page}
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Next Page */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="bg-white/50 backdrop-blur-sm border-white/40"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>

                        {/* Last Page */}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onPageChange(totalPages)}
                            disabled={currentPage === totalPages}
                            className="bg-white/50 backdrop-blur-sm border-white/40"
                        >
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Page Size Info */}
                    <div className="text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                    </div>
                </div>
            </div>
        </div>
    );
};
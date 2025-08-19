'use client';

import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ currentPage, totalItems, itemsPerPage, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const handlePrevious = () => {
    onPageChange(Math.max(1, currentPage - 1));
  };

  const handleNext = () => {
    onPageChange(Math.min(totalPages, currentPage + 1));
  };

  // Do not render if there's no data to paginate
  if (totalPages === 0) {
    return null;
  }

  return (
    <div className="flex items-center justify-end space-x-4">
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages > 0 ? totalPages : 1}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={currentPage === totalPages || totalPages === 0}
      >
        Next
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>
    </div>
  );
}

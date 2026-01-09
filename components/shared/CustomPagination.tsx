import Link from "next/link";
import {ChevronLeft, ChevronRight} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink
} from "@/components/ui/pagination";
import { Button } from "../ui/button";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function CustomPagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const pages = [];

  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }
  return (
    <div className="flex items-center gap-2 justify-between">
      <Button
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 font-medium text-gray-700 flex items-center gap-2 hover:bg-gray-900 hover:text-white"
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </Button>

      <Pagination>
        <PaginationContent>
          {pages.map((page, index) => {
            if (
              totalPages > 6 &&
              page === 4 &&
              currentPage < totalPages - 2
            ) {
              return (
                <PaginationItem key={index}> 
                  <PaginationEllipsis className="text-gray-500" /> 
                </PaginationItem>
              );
            }
            if (
              totalPages > 6 &&
              page > 3 &&
              page < totalPages - 2
            ) {
              return null;
            }

            return (
              <PaginationItem key={index}>
                <PaginationLink 
                  isActive={page === currentPage}
                  onClick={() => onPageChange(page)}
                  className={
                    page === currentPage
                      ? 'cursor-pointer bg-gray-50 border-gray-50'
                      : 'cursor-pointer text-gray-500 text-sm'
                  }
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            );
          })}
        </PaginationContent>
      </Pagination>

      <Button
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="cursor-pointer px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 font-medium text-gray-700 flex items-center gap-2 hover:bg-gray-900 hover:text-white"
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  )
}
import { cn } from "@/lib/utils";
import { IconChevronLeft, IconChevronRight } from "@/components/icon/chevron";

interface CustomPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function CustomPagination({
  currentPage,
  totalPages,
  onPageChange,
  className
}: CustomPaginationProps) {
  const generatePages = () => {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    if (start > 2) pages.push("ellipsis");
    for (let i = start; i <= end; i++) {
      if (i !== 1 && i !== totalPages) pages.push(i);
    }
    if (end < totalPages - 1) pages.push("ellipsis");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const pages = generatePages();
  if (totalPages <= 1) return null;

  return (
    <nav className={cn("w-full", className)} aria-label="Pagination">
      <div className="flex items-center justify-between w-full">

        {/* Previous */}
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={cn(
            "flex items-center gap-[8px] px-[14px] py-[8px] rounded-[8px] border border-[#D0D5DD] transition-all cursor-pointer text-[#344054] text-[14px] leading-[20px] font-semibold  shadow-[0px_1px_2px_0px_#1018280D]",
            currentPage === 1
              ? "border-gray-300 text-gray-400 cursor-not-allowed opacity-60"
              : "border-gray-300 hover:bg-gray-50"
          )}
        >
          <IconChevronLeft className="w-4 h-4" />
          Previous
        </button>

        {/* Page */}
        <div className="flex items-center gap-1">
          {pages.map((page, i) =>
            page === "ellipsis" ? (
              <span key={`ellipsis-${i}`} className="px-2 text-gray-400 select-none">
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page as number)}
                className={cn(
                  "w-10 h-10 font-medium transition-all cursor-pointer rounded-[8px]",
                  currentPage === page
                    ? "bg-[#F9FAFB] text-[#151C24]"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                {page}
              </button>
            )
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={cn(
            "flex items-center gap-[8px] px-[14px] py-[8px] rounded-[8px] border border-[#D0D5DD] transition-all cursor-pointer text-[#344054] text-[14px] leading-[20px] font-semibold  shadow-[0px_1px_2px_0px_#1018280D]",
            currentPage === totalPages
              ? "border-gray-300 text-gray-400 cursor-not-allowed opacity-60"
              : "border-gray-300 hover:bg-gray-900 hover:text-white"
          )}
        >
          Next
          <IconChevronRight className="w-4 h-4" />
        </button>

      </div>
    </nav>
  );
}
import {Skeleton} from "@/components/ui/skeleton";

export default function ServiceSkeleton() {
  return (
    <div className="w-full cursor-pointer shadow-[0px_2px_24px_rgba(16,24,40,0.06)] h-auto p-3 sm:p-4 justify-between border-2 border-transparent hover:border-gray-900 group"
    >
      <div className="text-left flex-1 min-w-0">
        <div className="font-medium text-gray-900 truncate sm:whitespace-normal">
          <Skeleton className="h-4 w-[150px]" />
        </div>
        <div className="text-sm font-normal text-gray-900 mt-0.5 flex gap-x-6">
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    </div>
  );
}
import {Skeleton} from "@/components/ui/skeleton";

export default function ClientSkeleton() {
  return (
    <div className={`bg-white rounded-lg px-6 py-4  shadow-[0px_2px_24px_rgba(16,24,40,0.06)] border-2 border-transparent hover:border-gray-900 hover:shadow-md transition-shadow cursor-pointer`}>
      <div className="flex items-center gap-3 flex-1">
        <div className="relative">
          <Skeleton className="h-12 w-12 rounded-full" />
        </div>
        <Skeleton className="h-4 w-[200px] mb-1" />
      </div>
    </div>
  );
}
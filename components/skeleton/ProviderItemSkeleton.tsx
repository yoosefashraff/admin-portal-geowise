import {Skeleton} from "@/components/ui/skeleton";

export default function ProviderItemSkeleton() {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
        <td className="py-4 px-6 text-sm font-medium text-gray-900">
            <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <Skeleton className="h-4 w-[250px]" />
            </div>
        </td>
        <td className="py-4 px-6 text-sm text-gray-500">
            <Skeleton className="h-4 w-[50px]" />
        </td>
        <td className="py-4 px-6 text-sm text-gray-500">
            <Skeleton className="h-4 w-[50px]" />
        </td>
        <td className="py-4 px-6 text-sm text-gray-500 h-19">
            <Skeleton className="h-4 w-[50px]" />
        </td>
        <td className="py-4 px-6 text-sm text-gray-500">
            <Skeleton className="h-4 w-[50px]" />
        </td>
    </tr>
  );
}
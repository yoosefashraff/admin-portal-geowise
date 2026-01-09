import {Skeleton} from "@/components/ui/skeleton";

export default function CompanyServiceSkeleton() {
  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
        <td className="py-4 px-6 text-sm font-medium text-gray-900">
            <Skeleton className="h-4 w-[150px]" />
        </td>
        <td className="py-4 px-6 text-sm text-gray-500">
            <Skeleton className="h-4 w-[50px]" />
        </td>
        <td className="py-4 px-6 text-sm text-gray-500">
            <Skeleton className="h-4 w-[50px]" />
        </td>
        <td className="py-4 px-6 text-sm text-gray-500 h-19">
            <Skeleton className="h-4 w-[200px]" />
        </td>
        <td className="py-4 px-6 text-sm text-gray-500">
            <Skeleton className="h-4 w-[50px]" />
        </td>
    </tr>
  );
}
'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ServiceRequestsSkeleton() {
  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6">
      {/* Header Skeleton */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <Skeleton className="h-8 sm:h-9 w-48 mb-2" />
        <Skeleton className="h-4 sm:h-5 w-64" />
      </div>

      {/* Tabs and Filters Skeleton */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 flex-1 sm:flex-none sm:w-64 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>

        {/* Table Skeleton */}
        <Card className="bg-white border-0" style={{
          boxShadow: '0px 4px 24px -2px rgba(16, 24, 40, 0.01), 0px 2px 24px -2px rgba(16, 24, 40, 0.06)'
        }}>
          <CardContent className="p-0">
            {/* Table Header */}
            <div className="border-b border-gray-200 p-4">
              <div className="grid grid-cols-12 gap-4">
                <div className="col-span-1">
                  <Skeleton className="h-4 w-4" />
                </div>
                <div className="col-span-3">
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="col-span-2">
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="col-span-2">
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="col-span-2">
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="col-span-2">
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>

            {/* Table Rows */}
            <div className="divide-y divide-gray-200">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div key={i} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-1">
                      <Skeleton className="h-4 w-4" />
                    </div>
                    <div className="col-span-3">
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <div className="col-span-2">
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <div className="col-span-2">
                      <Skeleton className="h-4 w-28" />
                    </div>
                    <div className="col-span-2">
                      <Skeleton className="h-6 w-20 rounded-md" />
                    </div>
                    <div className="col-span-2">
                      <Skeleton className="h-8 w-8 rounded-full" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Skeleton */}
            <div className="border-t border-gray-200 p-4 flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
                <Skeleton className="h-9 w-9 rounded-md" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

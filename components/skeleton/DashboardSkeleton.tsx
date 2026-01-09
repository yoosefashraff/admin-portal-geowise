'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6">
      {/* Header Skeleton */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <Skeleton className="h-8 sm:h-9 w-48 mb-2" />
        <Skeleton className="h-4 sm:h-5 w-64" />
      </div>

      {/* Tabs Skeleton */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card
              key={i}
              className="bg-white border-0"
              style={{
                boxShadow: '0px 4px 24px -2px rgba(16, 24, 40, 0.01), 0px 2px 24px -2px rgba(16, 24, 40, 0.06)'
              }}
            >
              <CardContent className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
                <div className="flex flex-col">
                  <div className="flex-shrink-0 mb-1 sm:mb-1.5">
                    <Skeleton className="h-6 w-6 rounded-md" />
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <Skeleton className="h-3 w-20 flex-1" />
                    <Skeleton className="h-6 w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Stats and Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Quick Stats Skeleton */}
        <Card
          className="bg-white border-0"
          style={{
            boxShadow: '0px 4px 24px -2px rgba(16, 24, 40, 0.01), 0px 2px 24px -2px rgba(16, 24, 40, 0.06)'
          }}
        >
          <CardHeader className="border-b border-gray-200 pb-3 sm:pb-4">
            <Skeleton className="h-5 sm:h-6 w-24" />
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Skeleton className="h-8 w-8 rounded-lg" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-5 w-8" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Activity Skeleton */}
        <div className="lg:col-span-2">
          <Card
            className="bg-white border-0"
            style={{
              boxShadow: '0px 4px 24px -2px rgba(16, 24, 40, 0.01), 0px 2px 24px -2px rgba(16, 24, 40, 0.06)'
            }}
          >
            <CardHeader className="border-b border-gray-200 pb-3 sm:pb-4">
              <Skeleton className="h-5 sm:h-6 w-32" />
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-4 sm:px-6 pt-3 sm:pt-4 border-b border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  <Skeleton className="h-9 w-full rounded-md" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              </div>
              <div className="p-4 sm:p-6 space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="p-3 sm:p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Skeleton className="h-4 w-4 rounded-full mt-1" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-48" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </div>
                      <Skeleton className="h-6 w-20 rounded-md" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

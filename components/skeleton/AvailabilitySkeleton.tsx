'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function AvailabilitySkeleton() {
  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6">
      {/* Header Skeleton */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <Skeleton className="h-8 sm:h-9 w-40 mb-2" />
        <Skeleton className="h-4 sm:h-5 w-64" />
      </div>

      {/* Provider Selection Card Skeleton */}
      <Card 
        className="mb-6 border-0"
        style={{
          boxShadow: '0px 4px 24px -2px rgba(16, 24, 40, 0.01), 0px 2px 24px -2px rgba(16, 24, 40, 0.06)'
        }}
      >
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 flex-1 max-w-md rounded-lg" />
          </div>
        </CardContent>
      </Card>

      {/* Availability Management Card Skeleton */}
      <Card 
        className="border-0"
        style={{
          boxShadow: '0px 4px 24px -2px rgba(16, 24, 40, 0.01), 0px 2px 24px -2px rgba(16, 24, 40, 0.06)'
        }}
      >
        <CardContent className="p-4 sm:p-6">
          {/* Card Header */}
          <div className="mb-6">
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-80" />
          </div>

          {/* Availability Cards Grid Skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-6">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div
                key={i}
                className="bg-white rounded-xl p-4"
                style={{
                  boxShadow: '0px 4px 24px -2px rgba(16, 24, 40, 0.01), 0px 2px 24px -2px rgba(16, 24, 40, 0.06)',
                  height: '214px'
                }}
              >
                <div className="flex flex-col h-full gap-3">
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-5 w-10 rounded-full" />
                  </div>
                  <div className="flex-1 space-y-3">
                    <Skeleton className="h-4 w-24" />
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-11 flex-1 rounded-lg" />
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-11 flex-1 rounded-lg" />
                    </div>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Save Button Skeleton */}
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

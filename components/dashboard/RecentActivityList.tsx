'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatDistanceToNow } from 'date-fns';
import { Clock, CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react';
import Link from 'next/link';
import type { ServiceRequest } from '@/lib/types/serviceRequest.types';
import type { DispatchLog } from '@/lib/types/dispatchLog.types';
import { cn } from '@/lib/utils';

interface RecentActivityListProps {
  serviceRequests: ServiceRequest[];
  dispatchLogs: DispatchLog[];
  isLoading?: boolean;
}

export function RecentActivityList({ serviceRequests, dispatchLogs, isLoading }: RecentActivityListProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'Pending':
      case 'In Progress':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'Failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
      case 'Completed':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Pending':
      case 'In Progress':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card 
        className="bg-white border-0"
        style={{
          boxShadow: '0px 4px 24px -2px rgba(16, 24, 40, 0.01), 0px 2px 24px -2px rgba(16, 24, 40, 0.06)'
        }}
      >
        <CardHeader className="border-b border-gray-200">
          <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 sm:h-20 bg-gray-100 rounded-lg" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className="bg-white border-0"
      style={{
        boxShadow: '0px 4px 24px -2px rgba(16, 24, 40, 0.01), 0px 2px 24px -2px rgba(16, 24, 40, 0.06)'
      }}
    >
      <CardHeader className="border-b border-gray-200 pb-3 sm:pb-4">
        <CardTitle className="text-base sm:text-lg font-semibold text-gray-900 animate-fade-in">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="requests" className="w-full">
          <div className="px-4 sm:px-6 pt-3 sm:pt-4 border-b border-gray-200">
            <TabsList className="grid w-full grid-cols-2 bg-transparent h-auto p-0 gap-2">
              <TabsTrigger 
                value="requests" 
                className="data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-none rounded-md px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300"
              >
                Service Requests
                <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs opacity-75">({serviceRequests.length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="logs"
                className="data-[state=active]:bg-gray-900 data-[state=active]:text-white data-[state=active]:shadow-none rounded-md px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all duration-300"
              >
                Dispatch Logs
                <span className="ml-1 sm:ml-2 text-[10px] sm:text-xs opacity-75">({dispatchLogs.length})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="requests" className="m-0 p-4 sm:p-6 animate-fade-in">
            {serviceRequests.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500 animate-fade-in">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-xs sm:text-sm font-medium">No recent service requests</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                {serviceRequests.slice(0, 10).map((request, index) => (
                  <Link
                    key={request.id}
                    href="/scheduler/service-requests"
                    className="block p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 group animate-fade-in-up"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: 'both'
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="mt-0.5 flex-shrink-0">
                          {getStatusIcon(request.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 text-xs sm:text-sm group-hover:text-gray-700 truncate">
                              {request.name}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{request.service}</p>
                          <p className="text-[10px] sm:text-xs text-gray-500 truncate">{request.address}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium border',
                            getStatusBadge(request.status)
                          )}
                        >
                          {request.status}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="logs" className="m-0 p-4 sm:p-6 animate-fade-in">
            {dispatchLogs.length === 0 ? (
              <div className="text-center py-8 sm:py-12 text-gray-500 animate-fade-in">
                <Calendar className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 text-gray-400" />
                <p className="text-xs sm:text-sm font-medium">No recent dispatch logs</p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto">
                {dispatchLogs.slice(0, 10).map((log, index) => (
                  <div
                    key={log.id}
                    className="p-3 sm:p-4 border border-gray-200 rounded-lg hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 animate-fade-in-up"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: 'both'
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 sm:gap-4">
                      <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                        <div className="mt-0.5 flex-shrink-0">
                          {getStatusIcon(log.dispatchStatus)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-gray-900 text-xs sm:text-sm truncate">
                              {log.customerName}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-gray-600 mb-1 truncate">{log.serviceName}</p>
                          {log.assignedProvider && (
                            <p className="text-[10px] sm:text-xs text-gray-500 mb-1 truncate">Provider: {log.assignedProvider}</p>
                          )}
                          <p className="text-[10px] sm:text-xs text-gray-500">
                            {formatDistanceToNow(new Date(log.dateTime), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 sm:gap-2 flex-shrink-0">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium border',
                            getStatusBadge(log.dispatchStatus)
                          )}
                        >
                          {log.dispatchStatus}
                        </span>
                        <span className="text-[10px] sm:text-xs text-gray-500 font-medium">{log.dispatchType}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

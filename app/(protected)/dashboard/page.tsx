'use client';

import React, { useEffect, useState } from 'react';
import { DashboardHeader } from '@/components/layout/DashboardHeader';
import { DashboardStatsCard } from '@/components/dashboard/DashboardStatsCard';
import { RecentActivityList } from '@/components/dashboard/RecentActivityList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardSkeleton } from '@/components/skeleton/DashboardSkeleton';
import { useAuthStore } from '@/lib/store/authStore';
import { fetchServiceRequests, fetchDispatchLogs } from '@/lib/actions/serviceRequests.actions';
import { fetchBookings } from '@/lib/actions/calendar.actions';
import { getAllProvidersForCompany } from '@/lib/actions/provider.actions';
import { getServicesForCompany } from '@/lib/actions/service.actions';
import { getZonesForCompany } from '@/lib/actions/zone.actions';
import { listApprovedUserCredits } from '@/lib/actions/approvedUserCredits.actions';
import {
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  MapPin,
  CreditCard,
  Activity,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ServiceRequest } from '@/lib/types/serviceRequest.types';
import type { DispatchLog } from '@/lib/types/dispatchLog.types';
import { toast } from 'sonner';

interface DashboardStats {
  totalServiceRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  todayRequests: number;
  totalProviders: number;
  activeProviders: number;
  todayBookings: number;
  completedToday: number;
  inProgress: number;
  totalServices: number;
  totalZones: number;
  activeCredits: number;
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalServiceRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    todayRequests: 0,
    totalProviders: 0,
    activeProviders: 0,
    todayBookings: 0,
    completedToday: 0,
    inProgress: 0,
    totalServices: 0,
    totalZones: 0,
    activeCredits: 0,
  });
  const [recentServiceRequests, setRecentServiceRequests] = useState<ServiceRequest[]>([]);
  const [recentDispatchLogs, setRecentDispatchLogs] = useState<DispatchLog[]>([]);
  const [activeTab, setActiveTab] = useState('requests');

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.UserID) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const today = new Date();
        const todayStart = new Date(today.setHours(0, 0, 0, 0));
        const todayEnd = new Date(today.setHours(23, 59, 59, 999));
        const todayStartStr = todayStart.toISOString().split('T')[0];
        const todayEndStr = todayEnd.toISOString().split('T')[0];

        // Fetch all data in parallel with error handling
        const [
          serviceRequestsResponse,
          dispatchLogsResponse,
          bookingsResponse,
          providersResponse,
          servicesResponse,
          zonesResponse,
          creditsResponse,
        ] = await Promise.allSettled([
          fetchServiceRequests(undefined, undefined, false, user.UserID),
          fetchDispatchLogs(30, false, user.UserID),
          fetchBookings({
            StartDate: `${todayStartStr}T00:00:00Z`,
            EndDate: `${todayEndStr}T23:59:59Z`,
            IsOnlyConfirmed: false,
            CompanyAdminId: user.UserID,
          }),
          getAllProvidersForCompany({
            CompanyAdminId: user.UserID,
            PageNo: 1,
            RecordsPerPage: 1000,
          }),
          getServicesForCompany({
            CompanyAdminId: user.UserID,
            PageNo: 1,
            RecordsPerPage: 1000,
          }),
          getZonesForCompany({
            CompanyAdminId: user.UserID,
            PageNo: 1,
            RecordsPerPage: 1000,
          }),
          listApprovedUserCredits({ IsActive: true }),
        ]);

        // Process service requests with error handling
        let serviceRequests: ServiceRequest[] = [];
        if (serviceRequestsResponse.status === 'fulfilled') {
          if (serviceRequestsResponse.value.Status === 201) {
          const bookings = serviceRequestsResponse.value.Object || [];
          serviceRequests = bookings.map((booking: any, index: number) => ({
            id: String(booking.id || index),
            name: booking.customerName || 'Unknown Customer',
            phone: booking.customerPhone || '',
            service: booking.serviceName || 'Unknown Service',
            address: booking.address || '',
            credits: {
              approved: 0,
              used: 0,
              remaining: 0,
            },
            preferredStaff: booking.preferredStaff || [],
            preferredDays: booking.preferredDays || [],
            status:
              booking.status === 'Approved' || booking.status === 'Confirmed'
                ? 'Approved'
                : booking.status === 'Pending'
                  ? 'Pending'
                  : 'Draft',
            userId: booking.userId,
            serviceId: booking.serviceId,
          }));
          } else {
            console.warn('Service requests API returned non-201 status:', serviceRequestsResponse.value.Status);
          }
        } else {
          console.error('Failed to fetch service requests:', serviceRequestsResponse.reason);
        }

        // Process dispatch logs with error handling
        let dispatchLogs: DispatchLog[] = [];
        if (dispatchLogsResponse.status === 'fulfilled') {
          if (dispatchLogsResponse.value.Status === 201) {
          const bookings = dispatchLogsResponse.value.Object || [];
          dispatchLogs = bookings
            .filter((booking: any) => {
              return (
                booking.status &&
                (booking.status === 'Dispatched' ||
                  booking.status === 'In Progress' ||
                  booking.status === 'Completed' ||
                  booking.status === 'Failed' ||
                  booking.status === 'Confirmed')
              );
            })
            .map((booking: any, index: number) => {
              const dispatchType: 'Auto' | 'Manual' =
                booking.dispatchType || (booking.status === 'Confirmed' ? 'Auto' : 'Manual');

              let dispatchStatus: 'Dispatched' | 'In Progress' | 'Failed' | 'Completed' = 'Dispatched';
              if (booking.status === 'Completed' || booking.status === 'Confirmed') {
                dispatchStatus = 'Completed';
              } else if (booking.status === 'In Progress') {
                dispatchStatus = 'In Progress';
              } else if (booking.status === 'Failed') {
                dispatchStatus = 'Failed';
              }

              let dateTime = '';
              if (booking.dateTime) {
                dateTime = booking.dateTime;
              } else if (booking.createdAt) {
                const date = new Date(booking.createdAt);
                dateTime = date.toLocaleString('en-US', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                });
              } else {
                dateTime = new Date().toLocaleString();
              }

              return {
                id: String(booking.id || index),
                serviceName: booking.serviceName || 'Unknown Service',
                customerName: booking.customerName || 'Unknown Customer',
                dispatchType,
                dispatchStatus,
                dateTime,
                assignedProvider: booking.assignedProvider || booking.providerName,
                failureReason: dispatchStatus === 'Failed' ? booking.failureReason || 'Unknown error' : undefined,
                reportId: booking.reportId,
              };
            })
            .sort((a: DispatchLog, b: DispatchLog) => {
              return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
            });
          } else {
            console.warn('Dispatch logs API returned non-201 status:', dispatchLogsResponse.value.Status);
          }
        } else {
          console.error('Failed to fetch dispatch logs:', dispatchLogsResponse.reason);
        }

        // Process bookings for today with error handling
        let todayBookings = 0;
        let inProgressCount = 0;
        if (bookingsResponse.status === 'fulfilled') {
          if (bookingsResponse.value.Status === 201) {
          const bookings = bookingsResponse.value.Object || [];
          todayBookings = bookings.length;
          inProgressCount = bookings.filter(
            (b: any) => b.status === 'In Progress' || b.status === 'in-progress'
          ).length;
          } else {
            console.warn('Bookings API returned non-201 status:', bookingsResponse.value.Status);
          }
        } else {
          console.error('Failed to fetch bookings:', bookingsResponse.reason);
        }

        // Process providers with error handling
        let totalProviders = 0;
        let activeProviders = 0;
        if (providersResponse.status === 'fulfilled') {
          if (providersResponse.value.Status === 201) {
          totalProviders = providersResponse.value.TotalCount || providersResponse.value.List?.length || 0;
          activeProviders = providersResponse.value.List?.filter((p: any) => p.IsActive !== false).length || 0;
          } else {
            console.warn('Providers API returned non-201 status:', providersResponse.value.Status);
          }
        } else {
          console.error('Failed to fetch providers:', providersResponse.reason);
        }

        // Process services with error handling
        let totalServices = 0;
        if (servicesResponse.status === 'fulfilled') {
          if (servicesResponse.value.Status === 201) {
            totalServices = servicesResponse.value.TotalCount || servicesResponse.value.List?.length || 0;
          } else {
            console.warn('Services API returned non-201 status:', servicesResponse.value.Status);
          }
        } else {
          console.error('Failed to fetch services:', servicesResponse.reason);
        }

        // Process zones with error handling
        let totalZones = 0;
        if (zonesResponse.status === 'fulfilled') {
          if (zonesResponse.value.Status === 201) {
            totalZones = zonesResponse.value.TotalCount || zonesResponse.value.List?.length || 0;
          } else {
            console.warn('Zones API returned non-201 status:', zonesResponse.value.Status);
          }
        } else {
          console.error('Failed to fetch zones:', zonesResponse.reason);
        }

        // Process credits with error handling
        let activeCredits = 0;
        if (creditsResponse.status === 'fulfilled') {
          if (creditsResponse.value.Status === 201) {
            activeCredits = creditsResponse.value.data?.length || 0;
          } else {
            console.warn('Credits API returned non-201 status:', creditsResponse.value.Status);
          }
        } else {
          console.error('Failed to fetch credits:', creditsResponse.reason);
        }

        // Calculate stats
        const totalServiceRequestsCount = serviceRequests.length;
        const pendingRequestsCount = serviceRequests.filter((r) => r.status === 'Pending').length;
        const approvedRequestsCount = serviceRequests.filter((r) => r.status === 'Approved').length;
        const todayRequestsCount = serviceRequests.filter((r) => {
          // Filter by today if booking date is available
          return true; // For now, show all as we don't have date in the mapped data
        }).length;

        const completedTodayCount = dispatchLogs.filter(
          (log) => log.dispatchStatus === 'Completed' && isToday(new Date(log.dateTime))
        ).length;

        setStats({
          totalServiceRequests: totalServiceRequestsCount,
          pendingRequests: pendingRequestsCount,
          approvedRequests: approvedRequestsCount,
          todayRequests: todayRequestsCount,
          totalProviders,
          activeProviders,
          todayBookings,
          completedToday: completedTodayCount,
          inProgress: inProgressCount,
          totalServices,
          totalZones,
          activeCredits,
        });

        // Set recent activity (sorted by most recent)
        setRecentServiceRequests(
          serviceRequests
            .sort((a, b) => {
              // Sort by status priority and then by id
              const statusOrder = { Approved: 1, Pending: 2, Draft: 3 };
              return (statusOrder[a.status as keyof typeof statusOrder] || 99) - (statusOrder[b.status as keyof typeof statusOrder] || 99);
            })
            .slice(0, 10)
        );
        setRecentDispatchLogs(dispatchLogs.slice(0, 10));
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load dashboard data';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Auto-rotate tabs in a loop
  useEffect(() => {
    if (isLoading) return;

    const tabs = ['requests', 'operations', 'services'];
    let currentIndex = tabs.indexOf(activeTab);
    
    const interval = setInterval(() => {
      currentIndex = (currentIndex + 1) % tabs.length;
      setActiveTab(tabs[currentIndex]);
    }, 5000); // Switch every 5 seconds

    return () => clearInterval(interval);
  }, [activeTab, isLoading]);

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (error && !isLoading) {
    return (
      <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6">
        <DashboardHeader title="Dashboard" description="Overview of your business operations" />
        <Card 
          className="bg-white border-0"
          style={{
            boxShadow: '0px 4px 24px -2px rgba(16, 24, 40, 0.01), 0px 2px 24px -2px rgba(16, 24, 40, 0.06)'
          }}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-gray-900 mb-1">Error Loading Dashboard</h3>
                <p className="text-sm text-gray-600 mb-4 break-words">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
                >
                  Retry
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-6 lg:py-8 px-4 sm:px-6">
      <div className="animate-fade-in-up">
        <DashboardHeader title="Dashboard" description="Overview of your business operations" />
      </div>

      {/* KPI Section with Auto-Rotating Tabs */}
      <div className="mb-4 sm:mb-6 animate-fade-in-up animate-delay-100">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex items-center justify-between mb-3 sm:mb-4 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
            <TabsList className="inline-flex bg-gray-100 rounded-lg p-1 h-auto border border-gray-200 min-w-fit">
              <TabsTrigger 
                value="requests" 
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 transition-all duration-300 whitespace-nowrap"
              >
                Service Requests
              </TabsTrigger>
              <TabsTrigger 
                value="operations"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 transition-all duration-300 whitespace-nowrap"
              >
                Operations
              </TabsTrigger>
              <TabsTrigger 
                value="services"
                className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm rounded-md px-3 py-1.5 text-xs font-medium text-gray-600 transition-all duration-300 whitespace-nowrap"
              >
                Services
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="requests" className="m-0 animate-fade-in animate-delay-200">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="animate-fade-in-up animate-delay-200">
                <DashboardStatsCard
                  title="Total Service Requests"
                  value={stats.totalServiceRequests}
                  icon={Calendar}
                  variant="default"
                />
              </div>
              <div className="animate-fade-in-up animate-delay-300">
                <DashboardStatsCard
                  title="Pending Requests"
                  value={stats.pendingRequests}
                  icon={Clock}
                  variant="warning"
                />
              </div>
              <div className="animate-fade-in-up animate-delay-400">
                <DashboardStatsCard
                  title="Approved Requests"
                  value={stats.approvedRequests}
                  icon={CheckCircle2}
                  variant="success"
                />
              </div>
              <div className="animate-fade-in-up animate-delay-500">
                <DashboardStatsCard
                  title="Today's Requests"
                  value={stats.todayRequests}
                  icon={Activity}
                  variant="default"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="operations" className="m-0 animate-fade-in animate-delay-200">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              <div className="animate-fade-in-up animate-delay-200">
                <DashboardStatsCard
                  title="Total Providers"
                  value={stats.totalProviders}
                  icon={Users}
                  variant="default"
                />
              </div>
              <div className="animate-fade-in-up animate-delay-300">
                <DashboardStatsCard
                  title="Active Providers"
                  value={stats.activeProviders}
                  icon={Users}
                  variant="success"
                />
              </div>
              <div className="animate-fade-in-up animate-delay-400">
                <DashboardStatsCard
                  title="Today's Bookings"
                  value={stats.todayBookings}
                  icon={Calendar}
                  variant="default"
                />
              </div>
              <div className="animate-fade-in-up animate-delay-500">
                <DashboardStatsCard
                  title="Completed Today"
                  value={stats.completedToday}
                  icon={CheckCircle2}
                  variant="success"
                />
              </div>
              <div className="animate-fade-in-up animate-delay-500">
                <DashboardStatsCard
                  title="In Progress"
                  value={stats.inProgress}
                  icon={Clock}
                  variant="warning"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="services" className="m-0 animate-fade-in animate-delay-200">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="animate-fade-in-up animate-delay-200">
                <DashboardStatsCard
                  title="Total Services"
                  value={stats.totalServices}
                  icon={Package}
                  variant="default"
                />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Quick Stats and Recent Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Quick Stats */}
        <Card 
          className="bg-white border-0 animate-fade-in-up animate-delay-300"
          style={{
            boxShadow: '0px 4px 24px -2px rgba(16, 24, 40, 0.01), 0px 2px 24px -2px rgba(16, 24, 40, 0.06)'
          }}
        >
          <CardHeader className="border-b border-gray-200 pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg font-semibold text-gray-900">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100 last:border-0 transition-all duration-200 hover:bg-gray-50 rounded-md px-2 -mx-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gray-50 transition-transform duration-200 group-hover:scale-110">
                  <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Service Zones</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-gray-900">{stats.totalZones}</span>
            </div>
            <div className="flex items-center justify-between py-2 sm:py-3 border-b border-gray-100 last:border-0 transition-all duration-200 hover:bg-gray-50 rounded-md px-2 -mx-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gray-50 transition-transform duration-200 group-hover:scale-110">
                  <CreditCard className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700">Active Credits</span>
              </div>
              <span className="text-base sm:text-lg font-bold text-gray-900">{stats.activeCredits}</span>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity - Takes 2 columns */}
        <div className="lg:col-span-2 animate-fade-in-up animate-delay-400">
          <RecentActivityList
            serviceRequests={recentServiceRequests}
            dispatchLogs={recentDispatchLogs}
            isLoading={false}
          />
        </div>
      </div>
    </div>
  );
}

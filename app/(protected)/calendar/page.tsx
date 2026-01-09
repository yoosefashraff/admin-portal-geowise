'use client';

import dynamic from 'next/dynamic';
import {DashboardHeader} from "@/components/layout/DashboardHeader";
import { Spinner } from '@/components/ui/spinner';

// Dynamically import heavy calendar component to improve initial load
const SchedulerCalendar = dynamic(
  () => import("@/components/calendar/SchedulerCalendar"),
  {
    loading: () => (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8" />
      </div>
    ),
    ssr: false, // FullCalendar doesn't need SSR
  }
);

export default function CalendarPage() {
  return (
    <div className="py-8 px-6">
      <DashboardHeader
        title="Calendar"
        description="View and manage your calendar."
      />

      <SchedulerCalendar/>
    </div>
  );
}
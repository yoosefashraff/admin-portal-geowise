import SchedulerCalendar from "@/components/calendar/SchedulerCalendar";
import {DashboardHeader} from "@/components/layout/DashboardHeader";

export default async function CalendarPage() {
  return (
    <div className="py-8 px-4">
      <DashboardHeader
        title="Calendar"
        description="View and manage your calendar."
      />

      <SchedulerCalendar/>
    </div>
  );
}
"use client"

import { useState, useEffect } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  Clock,
  MapPin,
  Phone,
  ArrowRightLeft,
  ToggleLeft,
  ChevronDown,
  ChevronUp,
  Search,
  Briefcase,
  Users,
  Activity,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ActivityIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Staff, Job, StaffStatus, JobStatus, Activity as ActivityType } from "@/lib/types"

interface StaffPanelProps {
  staff: Staff[]
  jobs: Job[]
  allJobs: Job[]
  selectedStaffId: string | null
  selectedJobId: string | null
  onStaffSelect: (staffId: string | null) => void
  onJobSelect: (jobId: string | null) => void
  width: number
  jobFilter: JobStatus | null
  activities?: ActivityType[]
}

export function StaffPanel({
  staff,
  jobs,
  allJobs,
  selectedStaffId,
  selectedJobId,
  onStaffSelect,
  onJobSelect,
  width,
  jobFilter,
  activities = [],
}: StaffPanelProps) {
  const [expandedStaffId, setExpandedStaffId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [activitySearchQuery, setActivitySearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<string>(jobFilter ? "jobs" : "staff")

  const toggleExpand = (staffId: string) => {
    setExpandedStaffId(expandedStaffId === staffId ? null : staffId)
  }

  const filteredStaff = staff.filter(
    (member) =>
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.zone.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const filteredJobs = (jobFilter ? allJobs.filter((j) => j.status === jobFilter) : allJobs).filter(
    (job) =>
      job.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.serviceType.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  useEffect(() => {
    if (jobFilter) {
      setActiveTab("jobs")
    }
  }, [jobFilter])

  return (
    <div className="flex h-full flex-col overflow-hidden bg-card">
      <Tabs value={jobFilter ? "jobs" : activeTab} onValueChange={setActiveTab} className="flex flex-col h-full gap-0">
        <div className="shrink-0 border-b px-4 pt-3 pb-2">
          <TabsList className="w-full h-8">
            <TabsTrigger value="staff" className="flex-1 text-xs gap-1.5">
              <Users className="h-3.5 w-3.5" />
              Live Staff
              <Badge variant="secondary" className="text-[10px] px-1.5 ml-1">
                {filteredStaff.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="jobs" className="flex-1 text-xs gap-1.5">
              <Briefcase className="h-3.5 w-3.5" />
              All Jobs
              <Badge variant="secondary" className="text-[10px] px-1.5 ml-1">
                {filteredJobs.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex-1 text-xs gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Activity
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </TabsTrigger>
          </TabsList>
          <div className="relative mt-2">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={
                activeTab === "staff"
                  ? "Search staff..."
                  : activeTab === "jobs"
                    ? "Search jobs..."
                    : "Search activity..."
              }
              value={activeTab === "activity" ? activitySearchQuery : searchQuery}
              onChange={(e) =>
                activeTab === "activity" ? setActivitySearchQuery(e.target.value) : setSearchQuery(e.target.value)
              }
              className="h-8 pl-8 text-sm"
            />
          </div>
        </div>

        <TabsContent value="staff" className="flex-1 min-h-0 m-0">
          <ScrollArea
            className="h-full [&_[data-radix-scroll-area-scrollbar]]:transition-opacity [&_[data-radix-scroll-area-scrollbar]]:duration-300 [&_[data-radix-scroll-area-scrollbar]]:ease-in-out [&_[data-radix-scroll-area-scrollbar]]:opacity-0 [&_[data-radix-scroll-area-scrollbar]]:hover:opacity-100 [&:hover_[data-radix-scroll-area-scrollbar]]:opacity-100"
            type="scroll"
          >
            <div className="space-y-1 p-2 bg-slate-100 min-h-full">
              {filteredStaff.map((member) => (
                <StaffCard
                  key={member.id}
                  staff={member}
                  jobs={jobs.filter((j) => j.staffId === member.id)}
                  isSelected={selectedStaffId === member.id}
                  isExpanded={expandedStaffId === member.id}
                  onSelect={() => onStaffSelect(member.id)}
                  onToggleExpand={() => toggleExpand(member.id)}
                  selectedJobId={selectedJobId}
                  onJobSelect={onJobSelect}
                />
              ))}
              {filteredStaff.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No staff found</p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="jobs" className="flex-1 min-h-0 m-0">
          <ScrollArea
            className="h-full [&_[data-radix-scroll-area-scrollbar]]:transition-opacity [&_[data-radix-scroll-area-scrollbar]]:duration-300 [&_[data-radix-scroll-area-scrollbar]]:ease-in-out [&_[data-radix-scroll-area-scrollbar]]:opacity-0 [&_[data-radix-scroll-area-scrollbar]]:hover:opacity-100 [&:hover_[data-radix-scroll-area-scrollbar]]:opacity-100"
            type="scroll"
          >
            <div className="space-y-1 p-2 min-h-full bg-slate-100">
              {filteredJobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  staff={staff}
                  isSelected={selectedJobId === job.id}
                  onSelect={() => onJobSelect(job.id)}
                />
              ))}
              {filteredJobs.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No jobs found</p>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="activity" className="flex-1 min-h-0 m-0">
          <ActivityFeed
            activities={activities}
            staff={staff}
            onStaffSelect={onStaffSelect}
            searchQuery={activitySearchQuery}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface JobCardProps {
  job: Job
  staff: Staff[]
  isSelected: boolean
  onSelect: () => void
}

function JobCard({ job, staff, isSelected, onSelect }: JobCardProps) {
  const getStatusConfig = (status: JobStatus) => {
    const config = {
      scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700" },
      "in-progress": { label: "In Progress", className: "bg-amber-100 text-amber-700" },
      completed: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
      cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-500" },
      "at-risk": { label: "At Risk", className: "bg-red-100 text-red-700" },
    }
    return config[status]
  }

  const statusConfig = getStatusConfig(job.status)
  const assignedStaff = staff.find((s) => s.id === job.staffId)

  return (
    <div
      className={cn(
        "rounded-lg border p-3 transition-all cursor-pointer bg-white",
        isSelected ? "border-primary ring-1 ring-primary" : "border-transparent hover:bg-muted/50",
      )}
      onClick={onSelect}
    >
      {assignedStaff && (
        <div className="flex items-center gap-2 mb-2 pb-2 border-b">
          <Avatar className="h-6 w-6">
            <AvatarFallback className="text-[10px] font-medium">
              {assignedStaff.name
                .split(" ")
                .map((n) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-sm">{assignedStaff.name}</span>
        </div>
      )}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{job.serviceType}</span>
            <Badge className={cn("text-[10px] px-1.5 py-0 shrink-0", statusConfig.className)}>
              {statusConfig.label}
            </Badge>
          </div>
          <div className="mt-0.5 text-foreground text-xs">Customer: {job.customerName}</div>
          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{job.address}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mt-2 text-xs">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>
            {format(job.scheduledTime, "h:mm a")} - {format(job.endTime, "h:mm a")}
          </span>
        </div>
      </div>
    </div>
  )
}

interface StaffCardProps {
  staff: Staff
  jobs: Job[]
  isSelected: boolean
  isExpanded: boolean
  onSelect: () => void
  onToggleExpand: () => void
  selectedJobId: string | null
  onJobSelect: (jobId: string | null) => void
}

function StaffCard({
  staff,
  jobs,
  isSelected,
  isExpanded,
  onSelect,
  onToggleExpand,
  selectedJobId,
  onJobSelect,
}: StaffCardProps) {
  const getStatusConfig = (status: StaffStatus) => {
    const config = {
      available: { label: "Available", className: "bg-emerald-100 text-emerald-700" },
      "on-job": { label: "On Job", className: "bg-blue-100 text-blue-700" },
      "en-route": { label: "En Route", className: "bg-amber-100 text-amber-700" },
      offline: { label: "Offline", className: "bg-slate-100 text-slate-500" },
    }
    return config[status]
  }

  const getJobStatusConfig = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      scheduled: { label: "Scheduled", className: "bg-blue-100 text-blue-700" },
      "in-progress": { label: "In Progress", className: "bg-amber-100 text-amber-700" },
      completed: { label: "Completed", className: "bg-emerald-100 text-emerald-700" },
      cancelled: { label: "Cancelled", className: "bg-slate-100 text-slate-500" },
      "at-risk": { label: "At Risk", className: "bg-red-100 text-red-700" },
    }
    return config[status] || { label: status, className: "bg-slate-100 text-slate-500" }
  }

  const statusConfig = getStatusConfig(staff.status)
  const initials = staff.name
    .split(" ")
    .map((n) => n[0])
    .join("")

  const getTimeDisplay = () => {
    if (staff.status === "on-job" && staff.timeRemaining !== undefined) {
      return `${staff.timeRemaining}m remaining`
    }
    if (staff.nextBookingTime) {
      return `Next: ${format(staff.nextBookingTime, "h:mm a")}`
    }
    return null
  }

  const timeDisplay = getTimeDisplay()

  return (
    <div
      className={cn(
        "rounded-lg border transition-all cursor-pointer bg-white",
        isSelected ? "border-primary ring-1 ring-primary" : "border-transparent hover:border-slate-200",
      )}
    >
      <div className="flex items-center gap-3 p-3" onClick={onSelect}>
        <Avatar className="h-9 w-9">
          <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm truncate">{staff.name}</span>
            <Badge className={cn("text-[10px] px-1.5 py-0", statusConfig.className)}>{statusConfig.label}</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
            <span className="whitespace-nowrap">{staff.role}</span>
            <span>•</span>
            <span className="whitespace-nowrap">{staff.zone}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          {timeDisplay && (
            <span className="text-xs text-muted-foreground flex items-center gap-1 whitespace-nowrap">
              <Clock className="h-4 w-4" />
              {timeDisplay}
            </span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={(e) => {
              e.stopPropagation()
              onToggleExpand()
            }}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t px-3 py-2 space-y-3">
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground">Today&apos;s Bookings</h4>
            {staff.bookings.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No bookings today</p>
            ) : (
              <div className="space-y-1.5">
                {staff.bookings.map((booking) => {
                  const bookingStatus = getJobStatusConfig(booking.status)
                  const isBookingSelected = selectedJobId === booking.id
                  return (
                    <div
                      key={booking.id}
                      className={cn(
                        "rounded-lg border p-3 text-xs bg-white cursor-pointer transition-all",
                        isBookingSelected
                          ? "border-primary ring-1 ring-primary"
                          : "border-slate-200 hover:border-slate-300",
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onJobSelect(isBookingSelected ? null : booking.id)
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm truncate">{booking.serviceType}</span>
                            <Badge className={cn("text-[10px] px-1.5 py-0 shrink-0", bookingStatus.className)}>
                              {bookingStatus.label}
                            </Badge>
                          </div>
                          <div className="text-xs mt-0.5 text-black text-black">Customer: {booking.customerName}</div>
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            <span className="truncate">{booking.address}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {format(booking.time, "h:mm a")} - {format(booking.endTime, "h:mm a")}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1 bg-transparent">
              <ArrowRightLeft className="h-3 w-3" />
              Reassign
            </Button>
            <Button variant="outline" size="sm" className="flex-1 h-7 text-xs gap-1 bg-transparent">
              <ToggleLeft className="h-3 w-3" />
              Availability
            </Button>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0 bg-transparent">
              <Phone className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

interface ActivityFeedProps {
  activities: ActivityType[]
  staff: Staff[]
  onStaffSelect: (staffId: string | null) => void
  searchQuery?: string
}

function ActivityFeed({ activities, staff, onStaffSelect, searchQuery = "" }: ActivityFeedProps) {
  const getActivityIcon = (type: ActivityType["type"]) => {
    const icons = {
      "booking-assigned": UserPlus,
      "booking-reassigned": RefreshCw,
      "booking-completed": CheckCircle2,
      "booking-cancelled": XCircle,
      "job-at-risk": AlertTriangle,
      "status-change": ActivityIcon,
    }
    return icons[type]
  }

  const getActivityColor = (type: ActivityType["type"], isRecent: boolean) => {
    if (!isRecent) return { bg: "bg-muted", text: "text-muted-foreground" }

    const colors = {
      "booking-assigned": { bg: "bg-blue-100", text: "text-blue-600" },
      "booking-reassigned": { bg: "bg-amber-100", text: "text-amber-600" },
      "booking-completed": { bg: "bg-emerald-100", text: "text-emerald-600" },
      "booking-cancelled": { bg: "bg-red-100", text: "text-red-600" },
      "job-at-risk": { bg: "bg-orange-100", text: "text-orange-600" },
      "status-change": { bg: "bg-primary/10", text: "text-primary" },
    }
    return colors[type]
  }

  const filteredActivities = [...activities]
    .filter(
      (activity) =>
        activity.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.action.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return (
    <ScrollArea
      className="h-full [&_[data-radix-scroll-area-scrollbar]]:transition-opacity [&_[data-radix-scroll-area-scrollbar]]:duration-300 [&_[data-radix-scroll-area-scrollbar]]:ease-in-out [&_[data-radix-scroll-area-scrollbar]]:opacity-0 [&_[data-radix-scroll-area-scrollbar]]:hover:opacity-100 [&:hover_[data-radix-scroll-area-scrollbar]]:opacity-100"
      type="scroll"
    >
      <div className="p-2 space-y-1 bg-slate-100 min-h-full">
        {filteredActivities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type)
          const isRecent = index < 5
          const colors = getActivityColor(activity.type, isRecent)

          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 cursor-pointer transition-colors bg-white",
                isRecent && "border border-primary/10",
                isRecent && activity.type === "job-at-risk" && "border-orange-200 bg-orange-50",
                isRecent && activity.type === "booking-cancelled" && "border-red-200 bg-red-50",
                isRecent && activity.type === "booking-completed" && "border-emerald-200 bg-emerald-50",
              )}
              onClick={() => activity.relatedStaffId && onStaffSelect(activity.relatedStaffId)}
            >
              <div className={cn("rounded-full p-1.5", colors.bg)}>
                <Icon className={cn("h-3.5 w-3.5", colors.text)} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-xs">
                  <span className={cn("font-medium", activity.actorType === "system" && "text-muted-foreground")}>
                    {activity.actor}
                  </span>{" "}
                  <span className="text-muted-foreground">{activity.action}</span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isRecent && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-[9px] border-0",
                      activity.type === "job-at-risk" && "bg-orange-100 text-orange-700",
                      activity.type === "booking-cancelled" && "bg-red-100 text-red-700",
                      activity.type === "booking-completed" && "bg-emerald-100 text-emerald-700",
                      !["job-at-risk", "booking-cancelled", "booking-completed"].includes(activity.type) &&
                        "bg-primary/10 text-primary",
                    )}
                  >
                    New
                  </Badge>
                )}
                <span className="text-[10px] text-muted-foreground">
                  {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                </span>
              </div>
            </div>
          )
        })}
        {filteredActivities.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">No activities found</p>
        )}
      </div>
    </ScrollArea>
  )
}

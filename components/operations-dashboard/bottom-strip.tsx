"use client"

import { useState } from "react"
import { format, formatDistanceToNow } from "date-fns"
import {
  AlertTriangle,
  Clock,
  Activity,
  ChevronRight,
  UserX,
  Timer,
  UserMinus,
  CheckCircle2,
  XCircle,
  UserPlus,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Job, Alert, Activity as ActivityType, Staff, AlertType } from "@/lib/types"

interface BottomStripProps {
  jobs: Job[]
  alerts: Alert[]
  activities: ActivityType[]
  staff: Staff[]
  selectedStaffId: string | null
  onStaffSelect: (staffId: string | null) => void
  height?: number // Add optional height prop
}

export function BottomStrip({
  jobs,
  alerts,
  activities,
  staff,
  selectedStaffId,
  onStaffSelect,
  height,
}: BottomStripProps) {
  const [activeTab, setActiveTab] = useState("activity")

  const unreadAlerts = alerts.filter((a) => !a.dismissed)

  return (
    <div className="shrink-0 border-t bg-card" style={{ height: height ? `${height}px` : "192px" }}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="flex items-center justify-between border-b px-4 bg-muted">
          <TabsList className="h-9">
            <TabsTrigger value="timeline" className="text-xs gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="alerts" className="text-xs gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Alerts
              {unreadAlerts.length > 0 && (
                <Badge variant="destructive" className="ml-1 h-4 px-1 text-[10px]">
                  {unreadAlerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Activity
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="timeline" className="flex-1 m-0 overflow-hidden">
          <Timeline jobs={jobs} staff={staff} selectedStaffId={selectedStaffId} onStaffSelect={onStaffSelect} />
        </TabsContent>

        <TabsContent value="alerts" className="flex-1 m-0 overflow-hidden">
          <AlertsPanel alerts={alerts} staff={staff} onStaffSelect={onStaffSelect} />
        </TabsContent>

        <TabsContent value="activity" className="flex-1 m-0 overflow-hidden">
          <ActivityFeed activities={activities} staff={staff} onStaffSelect={onStaffSelect} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface TimelineProps {
  jobs: Job[]
  staff: Staff[]
  selectedStaffId: string | null
  onStaffSelect: (staffId: string | null) => void
}

function Timeline({ jobs, staff, selectedStaffId, onStaffSelect }: TimelineProps) {
  const hours = Array.from({ length: 12 }, (_, i) => i + 7) // 7 AM to 6 PM
  const now = new Date()
  const currentHour = now.getHours() + now.getMinutes() / 60

  const filteredStaff = selectedStaffId ? staff.filter((s) => s.id === selectedStaffId) : staff

  return (
    <ScrollArea className="h-full" type="scroll">
      <div className="min-w-[800px]">
        {/* Time header */}
        <div className="flex border-b bg-card sticky top-0 z-10">
          <div className="w-28 shrink-0 border-r px-2 py-1 text-xs font-medium text-muted-foreground">Staff</div>
          <div className="flex-1 flex">
            {hours.map((hour) => (
              <div key={hour} className="flex-1 border-r px-1 py-1 text-center text-[10px] text-muted-foreground">
                {format(new Date().setHours(hour, 0), "h a")}
              </div>
            ))}
          </div>
        </div>

        {/* Staff rows */}
        {filteredStaff.map((member) => {
          const memberJobs = jobs.filter((j) => j.staffId === member.id)

          return (
            <div
              key={member.id}
              className={cn(
                "flex border-b hover:bg-muted/30 cursor-pointer",
                selectedStaffId === member.id && "bg-primary/5",
              )}
              onClick={() => onStaffSelect(member.id)}
            >
              <div className="w-28 shrink-0 border-r px-2 py-1.5 bg-card sticky left-0 z-[5]">
                <div className="text-xs font-medium truncate">{member.name}</div>
                <div className="text-[10px] text-muted-foreground">{member.zone}</div>
              </div>
              <div className="flex-1 relative h-10">
                {/* Job blocks */}
                {memberJobs.map((job) => {
                  const startHour = job.scheduledTime.getHours() + job.scheduledTime.getMinutes() / 60
                  const endHour = job.endTime.getHours() + job.endTime.getMinutes() / 60
                  const left = ((startHour - 7) / 12) * 100
                  const width = ((endHour - startHour) / 12) * 100

                  return (
                    <div
                      key={job.id}
                      className={cn(
                        "absolute top-1 bottom-1 rounded text-[10px] px-1 flex items-center overflow-hidden",
                        job.status === "completed" && "bg-emerald-100 text-emerald-700",
                        job.status === "in-progress" && "bg-blue-100 text-blue-700",
                        job.status === "scheduled" && "bg-slate-100 text-slate-700",
                        job.status === "at-risk" && "bg-red-100 text-red-700 ring-1 ring-red-300",
                      )}
                      style={{ left: `${left}%`, width: `${width}%` }}
                    >
                      <span className="truncate">{job.customerName}</span>
                    </div>
                  )
                })}

                {/* Current time indicator */}
                {currentHour >= 7 && currentHour <= 19 && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                    style={{ left: `${((currentHour - 7) / 12) * 100}%` }}
                  />
                )}
              </div>
            </div>
          )
        })}
      </div>
      <ScrollBar
        orientation="vertical"
        className="opacity-0 transition-opacity duration-300 ease-in-out hover:opacity-100 [&:has(+div:hover)]:opacity-100"
      />
      <ScrollBar
        orientation="horizontal"
        className="opacity-0 transition-opacity duration-300 ease-in-out hover:opacity-100"
      />
    </ScrollArea>
  )
}

interface AlertsPanelProps {
  alerts: Alert[]
  staff: Staff[]
  onStaffSelect: (staffId: string | null) => void
}

function AlertsPanel({ alerts, staff, onStaffSelect }: AlertsPanelProps) {
  const getAlertIcon = (type: AlertType) => {
    const icons = {
      "late-arrival": Timer,
      "running-long": Clock,
      unassigned: UserMinus,
      "staff-offline": UserX,
    }
    return icons[type]
  }

  const sortedAlerts = [...alerts].sort((a, b) => {
    const severityOrder = { high: 0, medium: 1, low: 2 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-2">
        {sortedAlerts.length === 0 ? (
          <div className="text-center py-8 text-sm text-muted-foreground">No active alerts</div>
        ) : (
          sortedAlerts.map((alert) => {
            const Icon = getAlertIcon(alert.type)
            const relatedStaff = alert.staffId ? staff.find((s) => s.id === alert.staffId) : null

            return (
              <div
                key={alert.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 cursor-pointer hover:bg-muted/50",
                  alert.severity === "high" && "border-red-200 bg-red-50",
                  alert.severity === "medium" && "border-amber-200 bg-amber-50",
                  alert.severity === "low" && "border-slate-200 bg-slate-50",
                )}
                onClick={() => alert.staffId && onStaffSelect(alert.staffId)}
              >
                <div
                  className={cn(
                    "rounded-full p-1.5",
                    alert.severity === "high" && "bg-red-100 text-red-600",
                    alert.severity === "medium" && "bg-amber-100 text-amber-600",
                    alert.severity === "low" && "bg-slate-100 text-slate-600",
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{alert.title}</span>
                    <Badge
                      variant="secondary"
                      className={cn(
                        "text-[10px]",
                        alert.severity === "high" && "bg-red-100 text-red-700",
                        alert.severity === "medium" && "bg-amber-100 text-amber-700",
                        alert.severity === "low" && "bg-slate-100 text-slate-700",
                      )}
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                  <span className="text-[10px] text-muted-foreground mt-1 block">
                    {formatDistanceToNow(alert.timestamp, { addSuffix: true })}
                  </span>
                </div>

                <Button variant="outline" size="sm" className="shrink-0 h-7 text-xs gap-1 bg-transparent">
                  Resolve
                  <ChevronRight className="h-3 w-3" />
                </Button>
              </div>
            )
          })
        )}
      </div>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  )
}

interface ActivityFeedProps {
  activities: ActivityType[]
  staff: Staff[]
  onStaffSelect: (staffId: string | null) => void
}

function ActivityFeed({ activities, staff, onStaffSelect }: ActivityFeedProps) {
  const getActivityIcon = (type: ActivityType["type"]) => {
    const icons = {
      "booking-assigned": UserPlus,
      "booking-reassigned": RefreshCw,
      "booking-completed": CheckCircle2,
      "booking-cancelled": XCircle,
      "job-at-risk": AlertTriangle,
      "status-change": Activity,
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

  const sortedActivities = [...activities].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

  return (
    <ScrollArea className="h-full">
      <div className="p-2 space-y-1">
        {sortedActivities.map((activity, index) => {
          const Icon = getActivityIcon(activity.type)
          const isRecent = index < 5
          const colors = getActivityColor(activity.type, isRecent)

          return (
            <div
              key={activity.id}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 cursor-pointer transition-colors",
                isRecent && "bg-primary/5 border border-primary/10",
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
      </div>
      <ScrollBar orientation="vertical" />
    </ScrollArea>
  )
}

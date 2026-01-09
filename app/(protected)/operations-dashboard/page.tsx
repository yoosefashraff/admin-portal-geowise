"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { TopControlBar } from "@/components/operations-dashboard/top-control-bar"
import { StaffPanel } from "@/components/operations-dashboard/staff-panel"
import { MapPanel } from "@/components/operations-dashboard/map-panel"
import { BottomStrip } from "@/components/operations-dashboard/bottom-strip"
import { FilterDrawer } from "@/components/operations-dashboard/filter-drawer"
import type { Staff, Job, Alert, Activity, Filters, StaffStatus, JobStatus } from "@/lib/types"
// TODO: Replace with real API calls for staff, jobs, alerts, and activities
// The operations dashboard requires specific data structures that need to be mapped from API responses

export default function OperationsDashboardPage() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    staff: [],
    zones: [],
    serviceTypes: [],
    statuses: [],
  })
  const [mapZoom, setMapZoom] = useState<"all" | "available" | "at-risk">("all")
  const [activeNavItem, setActiveNavItem] = useState("scheduler")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [legendStatusFilter, setLegendStatusFilter] = useState<StaffStatus | null>(null)
  const [legendJobFilter, setLegendJobFilter] = useState<JobStatus | null>(null)

  const [staffPanelWidth, setStaffPanelWidth] = useState(404)
  const [bottomStripHeight, setBottomStripHeight] = useState(192)
  const [staffPanelHeight, setStaffPanelHeight] = useState(500)
  const isDraggingWidth = useRef(false)
  const isDraggingHeight = useRef(false)
  const isDraggingStaffHeight = useRef(false)

  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (isDraggingWidth.current) {
      setStaffPanelWidth((prevWidth) => Math.max(404, Math.min(600, prevWidth + event.movementX)))
    }
    if (isDraggingHeight.current) {
      setBottomStripHeight((prevHeight) => Math.max(120, Math.min(500, prevHeight - event.movementY)))
    }
    if (isDraggingStaffHeight.current) {
      setStaffPanelHeight((prevHeight) => Math.max(300, Math.min(800, prevHeight + event.movementY)))
    }
  }, [])

  const handleMouseUp = useCallback(() => {
    isDraggingWidth.current = false
    isDraggingHeight.current = false
    isDraggingStaffHeight.current = false
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  const startWidthDrag = () => {
    isDraggingWidth.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }

  const startHeightDrag = () => {
    isDraggingHeight.current = true
    document.body.style.cursor = "row-resize"
    document.body.style.userSelect = "none"
  }

  const startStaffHeightDrag = () => {
    isDraggingStaffHeight.current = true
    document.body.style.cursor = "row-resize"
    document.body.style.userSelect = "none"
  }

  // TODO: Replace with real API data
  // These should be fetched from appropriate endpoints:
  // - Staff: Map from providers API (getAllProvidersForCompany)
  // - Jobs: Map from bookings API (fetchBookings)
  // - Alerts: Need to check if there's an alerts API endpoint
  // - Activities: Need to check if there's an activities/logs API endpoint
  const staff: Staff[] = []
  const jobs: Job[] = []
  const alerts: Alert[] = []
  const activities: Activity[] = []

  const kpis = {
    activeStaff: staff.filter((s) => s.status !== "offline").length,
    availableStaff: staff.filter((s) => s.status === "available").length,
    onJob: staff.filter((s) => s.status === "on-job").length,
    enRoute: staff.filter((s) => s.status === "en-route").length,
    completedToday: jobs.filter((j) => j.status === "completed").length,
    cancelledToday: jobs.filter((j) => j.status === "cancelled").length,
    jobsAtRisk: jobs.filter((j) => j.status === "at-risk").length,
    offlineStaff: staff.filter((s) => s.status === "offline").length,
    scheduledJobs: jobs.filter((j) => j.status === "scheduled").length,
    inProgressJobs: jobs.filter((j) => j.status === "in-progress").length,
  }

  const filteredStaff = staff.filter((s) => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      if (
        !s.name.toLowerCase().includes(query) &&
        !s.role.toLowerCase().includes(query) &&
        !s.zone.toLowerCase().includes(query)
      ) {
        return false
      }
    }
    if (filters.staff.length > 0 && !filters.staff.includes(s.id)) return false
    if (filters.zones.length > 0 && !filters.zones.includes(s.zone)) return false
    if (filters.statuses.length > 0 && !filters.statuses.includes(s.status)) return false
    if (legendStatusFilter && s.status !== legendStatusFilter) return false
    if (legendJobFilter) {
      const staffJobs = jobs.filter((j) => j.staffId === s.id)
      const hasMatchingJob = staffJobs.some((j) => j.status === legendJobFilter)
      if (!hasMatchingJob) return false
    }
    return true
  })

  const filteredJobs = legendJobFilter ? jobs.filter((j) => j.status === legendJobFilter) : jobs

  const handleStaffSelect = (staffId: string | null) => {
    setSelectedStaffId(staffId === selectedStaffId ? null : staffId)
    setSelectedJobId(null)
  }

  const handleJobSelect = (jobId: string | null) => {
    setSelectedJobId(jobId === selectedJobId ? null : jobId)
    setSelectedStaffId(null)
  }

  return (
    <div className="flex flex-1 flex-col min-w-0">
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        <MapPanel
          staff={filteredStaff}
          jobs={jobs}
          selectedStaffId={selectedStaffId}
          onStaffSelect={handleStaffSelect}
          zoom={mapZoom}
          onZoomChange={setMapZoom}
          kpis={kpis}
          statusFilter={legendStatusFilter}
          onStatusFilterChange={(status) => {
            setLegendStatusFilter(status)
            if (status) setLegendJobFilter(null)
          }}
          jobFilter={legendJobFilter}
          onJobFilterChange={(jobStatus) => {
            setLegendJobFilter(jobStatus)
            if (jobStatus) setLegendStatusFilter(null)
          }}
        />
        <div className="absolute left-4 right-4 top-4 z-10">
          <TopControlBar
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onFilterClick={() => setFilterDrawerOpen(true)}
            alertCount={alerts.filter((a) => !a.dismissed).length}
          />
        </div>
        <div
          className="absolute left-4 top-[72px] z-10 flex flex-col rounded-lg border bg-card shadow-sm overflow-hidden"
          style={{ width: staffPanelWidth, height: staffPanelHeight, minWidth: 480 }}
        >
          <StaffPanel
            staff={filteredStaff}
            jobs={filteredJobs}
            allJobs={jobs}
            selectedStaffId={selectedStaffId}
            selectedJobId={selectedJobId}
            onStaffSelect={handleStaffSelect}
            onJobSelect={handleJobSelect}
            jobFilter={legendJobFilter}
            activities={activities}
            width={staffPanelWidth}
          />
          <div
            className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-primary/50 transition-colors"
            onMouseDown={startWidthDrag}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-1 cursor-row-resize hover:bg-primary/50 transition-colors"
            onMouseDown={startStaffHeightDrag}
          />
        </div>
      </div>
      <div
        className="h-1 shrink-0 cursor-row-resize bg-border hover:bg-primary/50 transition-colors"
        onMouseDown={startHeightDrag}
      />
      <BottomStrip
        jobs={jobs}
        alerts={alerts}
        activities={activities}
        staff={staff}
        selectedStaffId={selectedStaffId}
        onStaffSelect={handleStaffSelect}
        height={bottomStripHeight}
      />
      <FilterDrawer
        open={filterDrawerOpen}
        onOpenChange={setFilterDrawerOpen}
        filters={filters}
        onFiltersChange={setFilters}
        staff={staff}
      />
    </div>
  )
}

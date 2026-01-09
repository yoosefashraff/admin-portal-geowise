"use client"

import { format } from "date-fns"
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Search,
  SlidersHorizontal,
  Bell,
  AlertTriangle,
  Clock,
  UserX,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TopControlBarProps {
  selectedDate: Date
  onDateChange: (date: Date) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onFilterClick: () => void
  alertCount: number
}

const notifications = [
  {
    id: 1,
    type: "warning",
    title: "Late Job Alert",
    message: "Ahmed Al-Rashid is 15 mins late for booking #1042",
    time: "2 mins ago",
  },
  {
    id: 2,
    type: "urgent",
    title: "Unassigned Booking",
    message: "Booking #1048 at Al Muruj has no staff assigned",
    time: "5 mins ago",
  },
  {
    id: 3,
    type: "info",
    title: "Staff Offline",
    message: "Fatima Hassan went offline unexpectedly",
    time: "12 mins ago",
  },
  {
    id: 4,
    type: "success",
    title: "Job Completed",
    message: "Omar Khalid completed booking #1039 successfully",
    time: "18 mins ago",
  },
]

export function TopControlBar({
  selectedDate,
  onDateChange,
  searchQuery,
  onSearchChange,
  onFilterClick,
  alertCount,
}: TopControlBarProps) {
  const isToday = format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd")

  const goToPrevDay = () => {
    const prev = new Date(selectedDate)
    prev.setDate(prev.getDate() - 1)
    onDateChange(prev)
  }

  const goToNextDay = () => {
    const next = new Date(selectedDate)
    next.setDate(next.getDate() + 1)
    onDateChange(next)
  }

  const goToToday = () => onDateChange(new Date())

  return (
    <header className="flex h-12 w-full items-center rounded-lg border bg-card shadow-sm px-4 gap-6">
      {/* Left section - Date Controls */}
      <div className="flex flex-1 items-center">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToPrevDay}>
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 gap-2 px-3 text-sm font-medium bg-transparent">
                <Calendar className="h-4 w-4" />
                {isToday ? "Today" : format(selectedDate, "MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && onDateChange(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goToNextDay}>
            <ChevronRight className="h-4 w-4" />
          </Button>

          {!isToday && (
            <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={goToToday}>
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Right section - Search, Filter, Notifications */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative w-64">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search staff, booking, customer..."
            className="h-8 pl-8 text-sm"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        {/* Filter Button */}
        <Button variant="outline" size="sm" className="h-8 gap-2 bg-transparent" onClick={onFilterClick}>
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative h-8 w-8">
              <Bell className="h-4 w-4" />
              {alertCount > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center p-0 text-[10px]">
                  {alertCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0 z-50" align="end" side="bottom" sideOffset={8}>
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold">Notifications</h3>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
              >
                Mark all read
              </Button>
            </div>
            <ScrollArea className="h-[300px]">
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="shrink-0 mt-0.5">
                      {notification.type === "warning" && <Clock className="h-4 w-4 text-amber-500" />}
                      {notification.type === "urgent" && <AlertTriangle className="h-4 w-4 text-red-500" />}
                      {notification.type === "info" && <UserX className="h-4 w-4 text-blue-500" />}
                      {notification.type === "success" && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.message}</p>
                      <p className="text-xs text-muted-foreground/70">{notification.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="border-t px-4 py-2">
              <Button variant="ghost" size="sm" className="w-full text-xs">
                View all notifications
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}

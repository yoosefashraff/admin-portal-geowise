"use client"
import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import type { Filters, Staff, StaffStatus } from "@/lib/types"

interface FilterDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: Filters
  onFiltersChange: (filters: Filters) => void
  staff: Staff[]
}

export function FilterDrawer({ open, onOpenChange, filters, onFiltersChange, staff }: FilterDrawerProps) {
  const [statusSearch, setStatusSearch] = useState("")
  const [zoneSearch, setZoneSearch] = useState("")
  const [serviceSearch, setServiceSearch] = useState("")
  const [staffSearch, setStaffSearch] = useState("")

  const zones = Array.from(new Set(staff.map((s) => s.zone)))
  const statuses: StaffStatus[] = ["available", "on-job", "en-route", "offline"]
  const serviceTypes = ["Deep Clean", "Standard Clean", "Sanitization"]

  const toggleFilter = <K extends keyof Filters>(key: K, value: Filters[K][number]) => {
    const current = filters[key] as Filters[K][number][]
    const updated = current.includes(value) ? current.filter((v) => v !== value) : [...current, value]
    onFiltersChange({ ...filters, [key]: updated })
  }

  const clearFilters = () => {
    onFiltersChange({
      staff: [],
      zones: [],
      serviceTypes: [],
      statuses: [],
    })
  }

  const hasFilters = Object.values(filters).some((arr) => arr.length > 0)

  const filteredStatuses = statuses.filter((s) =>
    s.replace("-", " ").toLowerCase().includes(statusSearch.toLowerCase()),
  )
  const filteredZones = zones.filter((z) => z.toLowerCase().includes(zoneSearch.toLowerCase()))
  const filteredServices = serviceTypes.filter((t) => t.toLowerCase().includes(serviceSearch.toLowerCase()))
  const filteredStaff = staff.filter((m) => m.name.toLowerCase().includes(staffSearch.toLowerCase()))

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="min-w-[350px] px-6 overflow-visible">
        <SheetHeader className="flex flex-row items-center justify-between space-y-0 pb-4 px-0 pl-3">
          <SheetTitle>Filters</SheetTitle>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-8 text-xs">
              Clear all
            </Button>
          )}
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)]">
          <div className="space-y-6 overflow-visible pt-0 pl-3 pr-3">
            {/* Status Filter */}
            <div className="space-y-3 overflow-visible">
              <Label className="text-sm font-medium">Status</Label>
              <div className="relative overflow-visible">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search status..."
                  value={statusSearch}
                  onChange={(e) => setStatusSearch(e.target.value)}
                  className="h-8 pl-7 text-sm"
                />
              </div>
              <div className="space-y-2 overflow-visible">
                {filteredStatuses.map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.statuses.includes(status)}
                      onCheckedChange={() => toggleFilter("statuses", status)}
                    />
                    <label htmlFor={`status-${status}`} className="text-sm capitalize cursor-pointer">
                      {status.replace("-", " ")}
                    </label>
                  </div>
                ))}
                {filteredStatuses.length === 0 && <p className="text-xs text-muted-foreground">No results found</p>}
              </div>
            </div>

            {/* Zone Filter */}
            <div className="space-y-3 overflow-visible">
              <Label className="text-sm font-medium">Zone / Area</Label>
              <div className="relative overflow-visible">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search zone..."
                  value={zoneSearch}
                  onChange={(e) => setZoneSearch(e.target.value)}
                  className="h-8 pl-7 text-sm"
                />
              </div>
              <div className="space-y-2 overflow-visible">
                {filteredZones.map((zone) => (
                  <div key={zone} className="flex items-center space-x-2">
                    <Checkbox
                      id={`zone-${zone}`}
                      checked={filters.zones.includes(zone)}
                      onCheckedChange={() => toggleFilter("zones", zone)}
                    />
                    <label htmlFor={`zone-${zone}`} className="text-sm cursor-pointer">
                      {zone}
                    </label>
                  </div>
                ))}
                {filteredZones.length === 0 && <p className="text-xs text-muted-foreground">No results found</p>}
              </div>
            </div>

            {/* Service Type Filter */}
            <div className="space-y-3 overflow-visible">
              <Label className="text-sm font-medium">Service Type</Label>
              <div className="relative overflow-visible">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search service..."
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  className="h-8 pl-7 text-sm"
                />
              </div>
              <div className="space-y-2 overflow-visible">
                {filteredServices.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`service-${type}`}
                      checked={filters.serviceTypes.includes(type)}
                      onCheckedChange={() => toggleFilter("serviceTypes", type)}
                    />
                    <label htmlFor={`service-${type}`} className="text-sm cursor-pointer">
                      {type}
                    </label>
                  </div>
                ))}
                {filteredServices.length === 0 && <p className="text-xs text-muted-foreground">No results found</p>}
              </div>
            </div>

            {/* Staff Filter */}
            <div className="space-y-3 overflow-visible">
              <Label className="text-sm font-medium">Staff</Label>
              <div className="relative overflow-visible">
                <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search staff..."
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  className="h-8 pl-7 text-sm"
                />
              </div>
              <div className="space-y-2 overflow-visible">
                {filteredStaff.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`staff-${member.id}`}
                      checked={filters.staff.includes(member.id)}
                      onCheckedChange={() => toggleFilter("staff", member.id)}
                    />
                    <label htmlFor={`staff-${member.id}`} className="text-sm cursor-pointer">
                      {member.name}
                    </label>
                  </div>
                ))}
                {filteredStaff.length === 0 && <p className="text-xs text-muted-foreground">No results found</p>}
              </div>
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}

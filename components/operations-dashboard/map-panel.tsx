"use client"

import type React from "react"

import { useEffect, useRef, useState, useCallback } from "react"
import { Layers, ZoomIn, ZoomOut, Maximize2, Minimize2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu"
import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Staff, Job, StaffStatus, JobStatus } from "@/lib/types"

const RIYADH_CENTER = { lat: 24.7136, lng: 46.6753 }
const TILE_SIZE = 256
const BASE_ZOOM = 12
const TILE_RANGE = 2
const MAP_TILES_COUNT = TILE_RANGE * 2 + 1 // 5 tiles in each direction
const GRID_SIZE = TILE_RANGE * 2 + 1

interface KPIs {
  activeStaff: number
  availableStaff: number
  onJob: number
  enRoute: number
  completedToday: number
  cancelledToday: number
  jobsAtRisk: number
  offlineStaff: number // Added offlineStaff to KPIs interface
  scheduledJobs: number // Added scheduledJobs to KPIs interface
  inProgressJobs: number // Added inProgressJobs to KPIs interface
}

interface MapPanelProps {
  staff: Staff[]
  jobs: Job[]
  selectedStaffId: string | null
  onStaffSelect: (staffId: string | null) => void
  zoom: "all" | "available" | "at-risk"
  onZoomChange: (zoom: "all" | "available" | "at-risk") => void
  kpis: KPIs
  statusFilter: StaffStatus | null
  onStatusFilterChange: (status: StaffStatus | null) => void
  jobFilter?: JobStatus | null
  onJobFilterChange?: (status: JobStatus | null) => void
}

interface LayersState {
  staff: boolean;
  jobs: boolean;
  zones: boolean;
}

export function MapPanel({
  staff,
  jobs,
  selectedStaffId,
  onStaffSelect,
  zoom,
  onZoomChange,
  kpis,
  statusFilter,
  onStatusFilterChange,
  jobFilter,
  onJobFilterChange,
}: MapPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredItem, setHoveredItem] = useState<{ type: "staff" | "job"; id: string; x: number; y: number } | null>(
    null,
  )
  const [layers, setLayers] = useState<LayersState>({ staff: true, jobs: true, zones: false })
  const [mapState, setMapState] = useState({ scale: 0, offsetX: 0, offsetY: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [mapTilesLoaded, setMapTilesLoaded] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [initialScaleSet, setInitialScaleSet] = useState(false)
  const tilesRef = useRef<Map<string, HTMLImageElement>>(new Map())

  const getMinScale = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return 1

    const rect = canvas.getBoundingClientRect()
    const mapPixelSize = MAP_TILES_COUNT * TILE_SIZE // Total map size in pixels (5 * 256 = 1280)

    // Calculate scale needed to fill width and height
    const scaleX = rect.width / mapPixelSize
    const scaleY = rect.height / mapPixelSize

    // Use the larger scale to ensure map covers entire canvas (no edges visible)
    return Math.max(scaleX, scaleY)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateInitialScale = () => {
      const minScale = getMinScale()
      if (!initialScaleSet || mapState.scale < minScale) {
        setMapState((s) => ({ ...s, scale: minScale }))
        setInitialScaleSet(true)
      }
    }

    // Run immediately
    updateInitialScale()

    // Also run on resize
    const resizeObserver = new ResizeObserver(() => {
      const minScale = getMinScale()
      // Only update if current scale is below minimum
      setMapState((s) => ({
        ...s,
        scale: Math.max(s.scale, minScale),
      }))
    })

    resizeObserver.observe(canvas)
    return () => resizeObserver.disconnect()
  }, [getMinScale, initialScaleSet, mapState.scale])

  useEffect(() => {
    // Small delay to let the DOM update after fullscreen toggle
    const timer = setTimeout(() => {
      const minScale = getMinScale()
      setMapState((s) => ({
        ...s,
        scale: Math.max(s.scale, minScale),
        // Reset offset when toggling fullscreen to center the map
        offsetX: 0,
        offsetY: 0,
      }))
    }, 50)
    return () => clearTimeout(timer)
  }, [isFullscreen, getMinScale])

  const getStatusColor = (status: StaffStatus) => {
    const colors = {
      available: "#10b981",
      "on-job": "#3b82f6",
      "en-route": "#f59e0b",
      offline: "#94a3b8",
    }
    return colors[status]
  }

  const getJobStatusColor = (status: Job["status"]) => {
    const colors = {
      scheduled: "#6b7280",
      "in-progress": "#3b82f6",
      completed: "#10b981",
      cancelled: "#94a3b8",
      "at-risk": "#ef4444",
    }
    return colors[status]
  }

  const latLngToPixel = useCallback(
    (lat: number, lng: number, width: number, height: number) => {
      const tileRange = 2

      // Calculate center tile coordinates
      const centerTileX = Math.floor(((RIYADH_CENTER.lng + 180) / 360) * Math.pow(2, BASE_ZOOM))
      const centerTileY = Math.floor(
        ((1 -
          Math.log(Math.tan((RIYADH_CENTER.lat * Math.PI) / 180) + 1 / Math.cos((RIYADH_CENTER.lat * Math.PI) / 180)) /
            Math.PI) /
          2) *
          Math.pow(2, BASE_ZOOM),
      )

      // Calculate precise tile position for the given lat/lng
      const tileX = ((lng + 180) / 360) * Math.pow(2, BASE_ZOOM)
      const tileY =
        ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
        Math.pow(2, BASE_ZOOM)

      // Calculate pixel offset from center tile
      const pixelOffsetX = (tileX - centerTileX) * TILE_SIZE
      const pixelOffsetY = (tileY - centerTileY) * TILE_SIZE

      // Calculate base position (before scaling) - center of tile grid
      const baseCenterX = width / 2
      const baseCenterY = height / 2

      // Apply scale from center of canvas and add pan offset
      const scaledX = baseCenterX + pixelOffsetX * mapState.scale + mapState.offsetX
      const scaledY = baseCenterY + pixelOffsetY * mapState.scale + mapState.offsetY

      return { x: scaledX, y: scaledY }
    },
    [mapState.scale, mapState.offsetX, mapState.offsetY],
  )

  useEffect(() => {
    const loadMapTiles = async () => {
      const zoomLevel = BASE_ZOOM

      // Calculate tile coordinates for Riyadh area
      const lat2tile = (lat: number, zoom: number) =>
        Math.floor(
          ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
            Math.pow(2, zoom),
        )
      const lng2tile = (lng: number, zoom: number) => Math.floor(((lng + 180) / 360) * Math.pow(2, zoom))

      const centerTileX = lng2tile(RIYADH_CENTER.lng, zoomLevel)
      const centerTileY = lat2tile(RIYADH_CENTER.lat, zoomLevel)

      // Load 5x5 grid of tiles around center
      const tileRange = 2
      const loadPromises: Promise<void>[] = []

      for (let dx = -tileRange; dx <= tileRange; dx++) {
        for (let dy = -tileRange; dy <= tileRange; dy++) {
          const tileX = centerTileX + dx
          const tileY = centerTileY + dy
          const key = `${tileX}-${tileY}`

          if (!tilesRef.current.has(key)) {
            const promise = new Promise<void>((resolve) => {
              const img = new Image()
              img.crossOrigin = "anonymous"
              img.src = `https://a.basemaps.cartocdn.com/rastertiles/voyager/${zoomLevel}/${tileX}/${tileY}.png`
              img.onload = () => {
                tilesRef.current.set(key, img)
                resolve()
              }
              img.onerror = () => resolve()
            })
            loadPromises.push(promise)
          }
        }
      }

      await Promise.all(loadPromises)
      setMapTilesLoaded(true)
    }

    loadMapTiles()
  }, [])

  // Draw map
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * window.devicePixelRatio
    canvas.height = rect.height * window.devicePixelRatio
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const width = rect.width
    const height = rect.height

    ctx.fillStyle = "#e8e8e8"
    ctx.fillRect(0, 0, width, height)

    if (mapState.scale === 0) return

    if (mapTilesLoaded) {
      const zoomLevel = BASE_ZOOM

      const lat2tile = (lat: number, zoom: number) =>
        Math.floor(
          ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
            Math.pow(2, zoom),
        )
      const lng2tile = (lng: number, zoom: number) => Math.floor(((lng + 180) / 360) * Math.pow(2, zoom))

      const centerTileX = lng2tile(RIYADH_CENTER.lng, zoomLevel)
      const centerTileY = lat2tile(RIYADH_CENTER.lat, zoomLevel)
      const tileRange = 2

      const tilesWidth = (tileRange * 2 + 1) * TILE_SIZE
      const tilesHeight = (tileRange * 2 + 1) * TILE_SIZE
      const scaledTilesWidth = tilesWidth * mapState.scale
      const scaledTilesHeight = tilesHeight * mapState.scale
      const startX = (width - scaledTilesWidth) / 2 + mapState.offsetX
      const startY = (height - scaledTilesHeight) / 2 + mapState.offsetY

      for (let dx = -tileRange; dx <= tileRange; dx++) {
        for (let dy = -tileRange; dy <= tileRange; dy++) {
          const tileX = centerTileX + dx
          const tileY = centerTileY + dy
          const key = `${tileX}-${tileY}`
          const img = tilesRef.current.get(key)

          if (img) {
            const x = startX + (dx + tileRange) * TILE_SIZE * mapState.scale
            const y = startY + (dy + tileRange) * TILE_SIZE * mapState.scale
            ctx.drawImage(img, x, y, TILE_SIZE * mapState.scale, TILE_SIZE * mapState.scale)
          }
        }
      }
    }

    // Draw zones if enabled
    if (layers.zones) {
      const zones = [
        { name: "Al Olaya", lat: 24.6982, lng: 46.6856, color: "rgba(59, 130, 246, 0.15)" },
        { name: "Al Malaz", lat: 24.6677, lng: 46.7272, color: "rgba(16, 185, 129, 0.15)" },
        { name: "Al Muruj", lat: 24.7574, lng: 46.6428, color: "rgba(245, 158, 11, 0.15)" },
        { name: "Diplomatic Quarter", lat: 24.6833, lng: 46.6167, color: "rgba(239, 68, 68, 0.15)" },
      ]

      zones.forEach((zone) => {
        const coords = latLngToPixel(zone.lat, zone.lng, width, height)
        ctx.fillStyle = zone.color
        ctx.beginPath()
        ctx.arc(coords.x, coords.y, 60 * mapState.scale, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = zone.color.replace("0.15", "0.4")
        ctx.lineWidth = 2
        ctx.stroke()

        ctx.fillStyle = "#374151"
        ctx.font = "11px sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(zone.name, coords.x, coords.y - 50 * mapState.scale)
      })
    }

    // Draw jobs if enabled
    if (layers.jobs) {
      jobs.forEach((job) => {
        const coords = latLngToPixel(job.location.lat, job.location.lng, width, height)
        const isHighlighted = selectedStaffId && job.staffId === selectedStaffId
        const color = getJobStatusColor(job.status)

        // Filter jobs based on jobFilter
        if (jobFilter && job.status !== jobFilter) return

        ctx.fillStyle = isHighlighted ? color : `${color}80`
        ctx.strokeStyle = color
        ctx.lineWidth = isHighlighted ? 2 : 1

        // Draw job marker (square)
        const size = isHighlighted ? 10 : 8
        ctx.fillRect(coords.x - size / 2, coords.y - size / 2, size, size)
        ctx.strokeRect(coords.x - size / 2, coords.y - size / 2, size, size)

        // Draw pulse for at-risk jobs
        if (job.status === "at-risk") {
          ctx.strokeStyle = `${color}40`
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(coords.x, coords.y, 15, 0, Math.PI * 2)
          ctx.stroke()
        }
      })
    }

    // Draw staff if enabled
    if (layers.staff) {
      staff.forEach((member) => {
        const coords = latLngToPixel(member.location.lat, member.location.lng, width, height)
        const isSelected = selectedStaffId === member.id
        const color = getStatusColor(member.status)

        // Draw outer ring for selected
        if (isSelected) {
          ctx.strokeStyle = color
          ctx.lineWidth = 3
          ctx.beginPath()
          ctx.arc(coords.x, coords.y, 18, 0, Math.PI * 2)
          ctx.stroke()
        }

        // Draw staff marker (circle)
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(coords.x, coords.y, isSelected ? 12 : 10, 0, Math.PI * 2)
        ctx.fill()

        // Draw initials
        ctx.fillStyle = "#ffffff"
        ctx.font = `${isSelected ? "bold " : ""}10px sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        const initials = member.name
          .split(" ")
          .map((n) => n[0])
          .join("")
        ctx.fillText(initials, coords.x, coords.y)
      })
    }
  }, [
    staff,
    jobs,
    selectedStaffId,
    layers,
    mapState.scale,
    mapState.offsetX,
    mapState.offsetY,
    latLngToPixel,
    mapTilesLoaded,
    jobFilter,
  ])

  // Handle canvas click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Check if clicked on a staff member
    for (const member of staff) {
      const coords = latLngToPixel(member.location.lat, member.location.lng, rect.width, rect.height)
      const distance = Math.sqrt((x - coords.x) ** 2 + (y - coords.y) ** 2)
      if (distance <= 12) {
        onStaffSelect(member.id)
        return
      }
    }

    // Clicked on empty space
    onStaffSelect(null)
  }

  // Handle canvas hover
  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (isDragging) {
      const deltaX = x - dragStart.x
      const deltaY = y - dragStart.y

      const tileGridSize = TILE_SIZE * GRID_SIZE * mapState.scale
      const maxOffsetX = Math.max(0, (tileGridSize - rect.width) / 2)
      const maxOffsetY = Math.max(0, (tileGridSize - rect.height) / 2)

      setMapState((s) => ({
        ...s,
        offsetX: Math.max(-maxOffsetX, Math.min(maxOffsetX, s.offsetX + deltaX)),
        offsetY: Math.max(-maxOffsetY, Math.min(maxOffsetY, s.offsetY + deltaY)),
      }))
      setDragStart({ x, y })
      return
    }

    // Check if hovering over staff
    for (const member of staff) {
      const coords = latLngToPixel(member.location.lat, member.location.lng, rect.width, rect.height)
      const distance = Math.sqrt((x - coords.x) ** 2 + (y - coords.y) ** 2)
      if (distance <= 12) {
        setHoveredItem({ type: "staff", id: member.id, x: e.clientX - rect.left, y: e.clientY - rect.top })
        return
      }
    }

    // Check if hovering over job
    for (const job of jobs) {
      const coords = latLngToPixel(job.location.lat, job.location.lng, rect.width, rect.height)
      const distance = Math.sqrt((x - coords.x) ** 2 + (y - coords.y) ** 2)
      if (distance <= 8) {
        setHoveredItem({ type: "job", id: job.id, x: e.clientX - rect.left, y: e.clientY - rect.top })
        return
      }
    }

    setHoveredItem(null)
  }

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDragging(true)
    setDragStart({ x, y })
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

  const handleCanvasMouseLeave = () => {
    setIsDragging(false)
    setHoveredItem(null)
  }

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? 0.9 : 1.1
    const minScale = getMinScale()
    setMapState((s) => ({
      ...s,
      scale: Math.min(Math.max(s.scale * delta, minScale), 3),
    }))
  }

  const hoveredStaff = hoveredItem?.type === "staff" ? staff.find((s) => s.id === hoveredItem.id) : null
  const hoveredJob = hoveredItem?.type === "job" ? jobs.find((j) => j.id === hoveredItem.id) : null

  const handleLegendItemClick = (status: StaffStatus) => {
    if (statusFilter === status) {
      onStatusFilterChange(null) // Toggle off if already selected
    } else {
      onStatusFilterChange(status)
    }
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative flex-1 bg-muted/30 overflow-hidden", isFullscreen && "fixed inset-0 z-50")}
    >
      {/* Map Controls */}
      <div className="absolute right-4 bottom-4 z-10 flex flex-col gap-2">
        {/* Zoom Controls */}
        <div className="flex flex-col rounded-lg border bg-card shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-b-none"
            onClick={() => setMapState((s) => ({ ...s, scale: Math.min(s.scale * 1.2, 3) }))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-t-none border-t"
            onClick={() => {
              const minScale = getMinScale()
              setMapState((s) => ({ ...s, scale: Math.max(s.scale / 1.2, minScale) }))
            }}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
        </div>

        {/* Fullscreen toggle button */}
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-card"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </Button>

        {/* Layers */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8 bg-card">
              <Layers className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuCheckboxItem
              checked={layers.staff}
              onCheckedChange={(checked) => setLayers((l) => ({ ...l, staff: checked }))}
            >
              Staff
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={layers.jobs}
              onCheckedChange={(checked) => setLayers((l) => ({ ...l, jobs: checked }))}
            >
              Jobs
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={layers.zones}
              onCheckedChange={(checked) => setLayers((l) => ({ ...l, zones: checked }))}
            >
              Zones
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Exit fullscreen button */}
      {isFullscreen && (
        <Button
          variant="outline"
          size="sm"
          className="absolute right-4 top-4 z-20 bg-card shadow-sm gap-2"
          onClick={() => setIsFullscreen(false)}
        >
          <X className="h-4 w-4" />
          Exit Fullscreen
        </Button>
      )}

      <div className={cn("absolute left-1/2 top-4 z-10 -translate-x-1/2", isFullscreen && "left-1/2")}>
        <Badge variant="secondary" className="bg-card shadow-sm font-medium">
          Riyadh, Saudi Arabia
        </Badge>
      </div>

      {/* Legend */}
      <div
        className={cn(
          "absolute z-10 rounded-lg border bg-card p-3 shadow-sm min-w-[180px]",
          isFullscreen ? "right-4 top-16" : "right-4 top-[72px]",
        )}
      >
        <h4 className="text-xs font-medium mb-2">Staff Status</h4>
        <div className="space-y-1.5">
          <div
            className={cn(
              "flex items-center justify-between text-xs cursor-pointer rounded px-1.5 py-1 -mx-1.5 transition-colors",
              statusFilter === "available" ? "bg-emerald-100" : "hover:bg-muted",
            )}
            onClick={() => handleLegendItemClick("available")}
          >
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span>Available</span>
            </div>
            <span className="font-medium">{kpis.availableStaff}</span>
          </div>
          <div
            className={cn(
              "flex items-center justify-between text-xs cursor-pointer rounded px-1.5 py-1 -mx-1.5 transition-colors",
              statusFilter === "on-job" ? "bg-blue-100" : "hover:bg-muted",
            )}
            onClick={() => handleLegendItemClick("on-job")}
          >
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <span>On Job</span>
            </div>
            <span className="font-medium">{kpis.onJob}</span>
          </div>
          <div
            className={cn(
              "flex items-center justify-between text-xs cursor-pointer rounded px-1.5 py-1 -mx-1.5 transition-colors",
              statusFilter === "en-route" ? "bg-amber-100" : "hover:bg-muted",
            )}
            onClick={() => handleLegendItemClick("en-route")}
          >
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-amber-500" />
              <span>En Route</span>
            </div>
            <span className="font-medium">{kpis.enRoute}</span>
          </div>
          <div
            className={cn(
              "flex items-center justify-between text-xs cursor-pointer rounded px-1.5 py-1 -mx-1.5 transition-colors",
              statusFilter === "offline" ? "bg-slate-200" : "hover:bg-muted",
            )}
            onClick={() => handleLegendItemClick("offline")}
          >
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-slate-400" />
              <span>Offline</span>
            </div>
            <span className="font-medium">{kpis.offlineStaff}</span>
          </div>
        </div>

        <div className="border-t pt-2 mt-2">
          <h4 className="text-xs font-medium mb-1.5">Jobs</h4>
          <div className="space-y-1.5">
            <div
              className={cn(
                "flex items-center justify-between text-xs cursor-pointer rounded px-1 py-0.5 -mx-1 transition-colors",
                jobFilter === "scheduled" && "bg-blue-50 ring-1 ring-blue-200",
              )}
              onClick={() => onJobFilterChange?.(jobFilter === "scheduled" ? null : "scheduled")}
            >
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                <span>Scheduled</span>
              </div>
              <span className="font-semibold text-blue-600">{kpis.scheduledJobs}</span>
            </div>
            <div
              className={cn(
                "flex items-center justify-between text-xs cursor-pointer rounded px-1 py-0.5 -mx-1 transition-colors",
                jobFilter === "in-progress" && "bg-amber-50 ring-1 ring-amber-200",
              )}
              onClick={() => onJobFilterChange?.(jobFilter === "in-progress" ? null : "in-progress")}
            >
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                <span>In Progress</span>
              </div>
              <span className="font-semibold text-amber-600">{kpis.inProgressJobs}</span>
            </div>
            <div
              className={cn(
                "flex items-center justify-between text-xs cursor-pointer rounded px-1 py-0.5 -mx-1 transition-colors",
                jobFilter === "completed" && "bg-emerald-50 ring-1 ring-emerald-200",
              )}
              onClick={() => onJobFilterChange?.(jobFilter === "completed" ? null : "completed")}
            >
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span>Completed</span>
              </div>
              <span className="font-semibold text-emerald-600">{kpis.completedToday}</span>
            </div>
            <div
              className={cn(
                "flex items-center justify-between text-xs cursor-pointer rounded px-1 py-0.5 -mx-1 transition-colors",
                jobFilter === "at-risk" && "bg-red-50 ring-1 ring-red-200",
              )}
              onClick={() => onJobFilterChange?.(jobFilter === "at-risk" ? null : "at-risk")}
            >
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-red-500" />
                <span>At Risk</span>
              </div>
              <span className="font-semibold text-red-600">{kpis.jobsAtRisk}</span>
            </div>
            <div
              className={cn(
                "flex items-center justify-between text-xs cursor-pointer rounded px-1 py-0.5 -mx-1 transition-colors",
                jobFilter === "cancelled" && "bg-slate-50 ring-1 ring-slate-200",
              )}
              onClick={() => onJobFilterChange?.(jobFilter === "cancelled" ? null : "cancelled")}
            >
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-slate-400" />
                <span>Cancelled</span>
              </div>
              <span className="font-semibold text-slate-600">{kpis.cancelledToday}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={cn("h-full w-full", isDragging ? "cursor-grabbing" : "cursor-grab")}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMove}
        onMouseDown={handleCanvasMouseDown}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseLeave}
        onWheel={handleCanvasWheel}
      />

      {/* Tooltip */}
      {hoveredItem && !isDragging && (hoveredStaff || hoveredJob) && (
        <div
          className="pointer-events-none absolute z-20 rounded-lg border bg-card p-2 shadow-lg"
          style={{ left: hoveredItem.x + 15, top: hoveredItem.y + 15 }}
        >
          {hoveredStaff && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: getStatusColor(hoveredStaff.status) }}
                />
                <span className="text-sm font-medium">{hoveredStaff.name}</span>
              </div>
              <div className="text-xs text-muted-foreground">{hoveredStaff.role}</div>
              <div className="text-[10px] text-muted-foreground">Last updated: 2 min ago</div>
            </div>
          )}
          {hoveredJob && (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2" style={{ backgroundColor: getJobStatusColor(hoveredJob.status) }} />
                <span>{hoveredJob.type}</span>
              </div>
              <div className="text-xs text-muted-foreground">{hoveredJob.address}</div>
              <div className="text-[10px] text-muted-foreground">
                {hoveredJob.startTime.toLocaleString()} - {hoveredJob.endTime.toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

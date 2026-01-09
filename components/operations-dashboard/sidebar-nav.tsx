"use client"

import type React from "react"

import { useState } from "react"
import {
  Search,
  LayoutGrid,
  Calendar,
  MapPin,
  Clock,
  Settings,
  Headphones,
  ChevronDown,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface SidebarNavProps {
  activeItem?: string
  onItemSelect?: (item: string) => void
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

export function SidebarNav({
  activeItem = "scheduler",
  onItemSelect,
  collapsed = false,
  onCollapsedChange,
}: SidebarNavProps) {
  const [settingsExpanded, setSettingsExpanded] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  const handleItemClick = (item: string) => {
    if (collapsed) {
      onCollapsedChange?.(false)
    }
    onItemSelect?.(item)
  }

  const toggleCollapse = () => {
    onCollapsedChange?.(!collapsed)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div
        className={cn("flex h-full flex-col border-r bg-card transition-all duration-300", collapsed ? "w-16" : "w-64")}
      >
        <div className={cn("flex items-center py-4 pb-4 pt-[18px]", collapsed ? "justify-center px-2" : "pl-4 pr-0")}>
          <div className={cn("flex items-center gap-2 min-w-0 mx-0 ml-1.5 text-left justify-start", collapsed ? "" : "flex-1")}>
            <Image src="/favicon.png" alt="GeoWise" width={24} height={24} className="shrink-0" />
            <span
              className={cn(
                "text-base font-semibold transition-opacity duration-300 whitespace-nowrap",
                collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100",
              )}
            >
              GeoWise
            </span>
          </div>
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground shrink-0"
              onClick={toggleCollapse}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center pb-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={toggleCollapse}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}

        {!collapsed && (
          <div className="px-4 pb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="h-9 pl-9 bg-muted/50 border-0"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-3">
          <div className="mb-4">
            {!collapsed && (
              <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                General
              </p>
            )}
            <div className="space-y-1">
              <NavItem
                icon={<LayoutGrid className="h-4 w-4" />}
                label="Dashboard"
                active={activeItem === "dashboard"}
                onClick={() => handleItemClick("dashboard")}
                collapsed={collapsed}
              />
              <NavItem
                icon={<Calendar className="h-4 w-4" />}
                label="Calendar"
                active={activeItem === "calendar"}
                onClick={() => handleItemClick("calendar")}
                collapsed={collapsed}
              />
            </div>
          </div>

          <div className="mb-4">
            {!collapsed && (
              <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                General
              </p>
            )}
            <div className="space-y-1">
              <NavItem
                icon={<MapPin className="h-4 w-4" />}
                label="Service Zones"
                active={activeItem === "service-zones"}
                onClick={() => handleItemClick("service-zones")}
                collapsed={collapsed}
              />
              <NavItem
                icon={<Clock className="h-4 w-4" />}
                label="Scheduler"
                active={activeItem === "scheduler"}
                onClick={() => handleItemClick("scheduler")}
                collapsed={collapsed}
              />
            </div>
          </div>

          <div className="mb-4">
            {!collapsed && (
              <p className="px-3 py-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Account
              </p>
            )}
            <div className="space-y-1">
              {!collapsed ? (
                <>
                  <button
                    onClick={() => setSettingsExpanded(!settingsExpanded)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors",
                      "hover:bg-muted text-foreground",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Settings className="h-4 w-4" />
                      <span>Settings</span>
                    </div>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", settingsExpanded && "rotate-180")} />
                  </button>

                  {settingsExpanded && (
                    <div className="ml-4 border-l border-border pl-4 space-y-1">
                      <SubNavItem
                        label="Details"
                        active={activeItem === "settings-details"}
                        onClick={() => handleItemClick("settings-details")}
                      />
                      <SubNavItem
                        label="Users"
                        badge="10"
                        active={activeItem === "settings-users"}
                        onClick={() => handleItemClick("settings-users")}
                      />
                      <SubNavItem
                        label="Teams"
                        badge="2"
                        active={activeItem === "settings-teams"}
                        onClick={() => handleItemClick("settings-teams")}
                      />
                      <SubNavItem
                        label="Services"
                        active={activeItem === "settings-services"}
                        onClick={() => handleItemClick("settings-services")}
                      />
                      <SubNavItem
                        label="Service Zones"
                        active={activeItem === "settings-service-zones"}
                        onClick={() => handleItemClick("settings-service-zones")}
                      />
                    </div>
                  )}
                </>
              ) : (
                <NavItem
                  icon={<Settings className="h-4 w-4" />}
                  label="Settings"
                  active={activeItem?.startsWith("settings")}
                  onClick={() => handleItemClick("settings-details")}
                  collapsed={collapsed}
                />
              )}

              <NavItem
                icon={<Headphones className="h-4 w-4" />}
                label="Support"
                active={activeItem === "support"}
                onClick={() => handleItemClick("support")}
                collapsed={collapsed}
              />
            </div>
          </div>
        </nav>

        <div className="border-t p-4">
          <div
            className={cn("flex items-center gap-3", collapsed && "justify-center cursor-pointer")}
            onClick={() => collapsed && onCollapsedChange?.(false)}
          >
            <Avatar className="h-9 w-9 bg-muted">
              <AvatarFallback className="bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Olivia Rhye</p>
                  <p className="text-xs text-muted-foreground truncate">olivia@untitledui.com</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  onClick?: () => void
  collapsed?: boolean
}

function NavItem({ icon, label, active, onClick, collapsed }: NavItemProps) {
  const button = (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted",
        collapsed && "justify-center px-2",
      )}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </button>
  )

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">{label}</TooltipContent>
      </Tooltip>
    )
  }

  return button
}

interface SubNavItemProps {
  label: string
  badge?: string
  active?: boolean
  onClick?: () => void
}

function SubNavItem({ label, badge, active, onClick }: SubNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm transition-colors",
        active ? "text-foreground font-medium" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span>{label}</span>
      {badge && (
        <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px] font-medium bg-primary/10 text-primary">
          {badge}
        </Badge>
      )}
    </button>
  )
}

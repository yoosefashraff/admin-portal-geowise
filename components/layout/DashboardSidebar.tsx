'use client';
import React, {useState} from 'react';
import {
  Search,
  Settings,
  CalendarDays,
  CalendarClock,
  LayoutGrid,
  CircleChevronDown,
  Headset,
  PanelLeftClose,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Package,
  MapPin,
  Users,
  Clock,
  ChevronDown,
  CreditCard
} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import Image from 'next/image';
import {MenuSection} from "@/lib/types/menu.types";
import MenuItem from "@/components/shared/MenuItem";
import Link from "next/link";
import {useAuthStore} from "@/lib/store/authStore";
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function DashboardSidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, user } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  // Track collapsed state for each section (default: all expanded)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  
  // Reorganized menu structure following clear information architecture
  const menuConfigs: MenuSection[] = [
    {
      title: "Core",
      items: [
        {
          label: "Dashboard",
          icon: LayoutGrid,
          href: "/dashboard",
        },
        {
          label: "Calendar",
          icon: CalendarDays,
          href: "/calendar",
        },
      ],
    },
    {
      title: "Operations",
      items: [
        {
          label: "Scheduler",
          icon: CalendarClock,
          href: "/scheduler",
        },
        {
          label: "Service Requests",
          icon: Clock,
          href: "/scheduler/service-requests",
        },
        {
          label: "Availability",
          icon: CalendarClock,
          href: "/scheduler/availability",
        },
      ],
    },
    {
      title: "Management",
      items: [
        {
          label: "Services",
          icon: Package,
          href: "/services",
        },
        {
          label: "Service Zones",
          icon: MapPin,
          href: "/zones",
        },
        {
          label: "Linked Users",
          icon: Users,
          href: "/linked-users",
        },
        {
          label: "Approved Credits",
          icon: CreditCard,
          href: "/credits",
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          label: "Settings",
          icon: Settings,
          href: "/settings",
          children: [
            {
              label: "Details",
              icon: Settings,
              href: "/profile",
            },
            {
              label: "Teams",
              icon: Settings,
              href: "/teams",
            },
          ],
        }
      ],
    },
  ];

  const handleLogout = async () => {
    await logout();
  }

  return (
    <div>
      {/* Mobile Header */}
      <div
        className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/images/logo.svg" alt="GeoWise" width={116} height={48}/>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-6 h-6"/> : <Menu className="w-6 h-6"/>}
        </Button>
      </div>

      {/* Overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed h-screen lg:static inset-y-0 left-0 z-40",
        "bg-white border-r border-gray-200 flex flex-col",
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-78",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className={cn(
          "hidden lg:flex py-3 items-center border-b border-gray-200",
          isCollapsed ? "justify-center px-2" : "justify-between px-6 pr-3"
        )}>
          <Link href="/dashboard" className="flex items-center gap-2">
            {isCollapsed ? (
              <div className='h-12 flex items-center justify-center'>
                <Image src="/images/logo-s.svg" alt="GeoWise" width={20} height={24}/>
              </div>
            ) : (
              <Image src="/images/logo.svg" alt="GeoWise" width={116} height={48}/>
            )}
          </Link>
          {!isCollapsed && (
            <Button 
              variant="ghost" 
              className="cursor-pointer" 
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <ChevronLeft className="w-4 h-4"/>
            </Button>
          )}
        </div>

        {/* Search */}
        {!isCollapsed ? (
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search..."
                className="pl-9 bg-gray-50"
              />
            </div>
          </div>
        ) : (
          <div className='p-2 border-b border-gray-200 flex justify-center'>
            <Button 
              variant="ghost" 
              className="cursor-pointer w-full justify-center" 
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <ChevronRight className="w-4 h-4"/>
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className={cn(
          "flex-1 overflow-y-auto",
          isCollapsed ? "p-2 space-y-1" : "p-4 space-y-1"
        )}>
          {menuConfigs.map((menuSection, index) => {
            const sectionKey = (menuSection.title || '').toLowerCase();
            const isSectionCollapsed = collapsedSections[sectionKey] ?? false;
            
            return (
              <div className={cn(isCollapsed ? "mb-4" : "mb-8")} key={index}>
                {!isCollapsed && (
                  <button
                    onClick={() => {
                      setCollapsedSections(prev => ({
                        ...prev,
                        [sectionKey]: !isSectionCollapsed
                      }));
                    }}
                    className="w-full flex items-center justify-between text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 mt-2 hover:text-gray-700 transition-colors group"
                  >
                    <span>{menuSection.title}</span>
                    <ChevronDown 
                      className={cn(
                        "w-4 h-4 transition-transform duration-200",
                        isSectionCollapsed ? "-rotate-90" : ""
                      )} 
                    />
                  </button>
                )}
                {(!isSectionCollapsed || isCollapsed) && menuSection.items.map((item, index2) => {
                  // Collect all menu items (including children) for active state comparison
                  const allMenuItems = menuConfigs.flatMap(section => 
                    section.items.flatMap(item => [
                      item,
                      ...(item.children || [])
                    ])
                  )
                  return <MenuItem 
                    key={index2} 
                    menuItem={item} 
                    isCollapsed={isCollapsed} 
                    setIsCollapsed={setIsCollapsed}
                    allMenuItems={allMenuItems}
                  />
                })}
              </div>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className={cn(
          "border-t border-gray-200",
          isCollapsed ? "p-2" : "p-4"
        )}>
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2">
              <Link 
                href="/profile" 
                className="flex items-center justify-center"
                onClick={() => setIsCollapsed(false)}
              >
                <Image 
                  src={user?.Image || "/images/avatar.png"}
                  alt="User avatar" 
                  width={36} height={36} 
                  className="rounded-full"
                  unoptimized
                />
              </Link>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-full justify-center"
                    onClick={() => handleLogout()}
                  >
                    <LogOut className="w-5 h-5"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  Logout
                </TooltipContent>
              </Tooltip>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3">
              <Link 
                href="/profile" 
                className="flex items-center gap-3"
                onClick={() => setIsCollapsed(false)}
              >
                <Image 
                  src={user?.Image || "/images/avatar.png"}
                  alt="User avatar" 
                  width={40} height={40} 
                  className="rounded-full"
                  unoptimized
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{user?.FullName}</div>
                </div>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => handleLogout()}>
                <LogOut className="w-5 h-5"/>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

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
  ChevronRight
} from 'lucide-react';
import {Input} from '@/components/ui/input';
import {Button} from '@/components/ui/button';
import {cn} from '@/lib/utils';
import Image from 'next/image';
import {MenuSection} from "@/lib/types/menu.types";
import MenuItem from "@/components/shared/MenuItem";
import Link from "next/link";
import {useAuthStore} from "@/lib/store/authStore";

export function DashboardSidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { logout, user } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const menuConfigs: MenuSection[] = [
    {
      title: "GENERAL",
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
      title: "GENERAL",
      items: [
        {
          label: "Service Zones",
          icon: PanelLeftClose,
          href: "/zones",
        },
        {
          label: "Scheduler",
          icon: CalendarClock,
          href: "/scheduler",
        },
      ],
    },
    {
      title: "ACCOUNT",
      items: [
        {
          label: "Settings",
          icon: Settings,
          href: "/settings",
          children: [
            {
              label: "Teams",
              icon: Settings,
              href: "/teams",
            },
            {
              label: "Details",
              icon: Settings,
              href: "/profile",
            },
            {
              label: "Linked users",
              icon: Settings,
              href: "/settings/linked-users",
              badge: "10",
            },
            {
              label: "Services",
              icon: Settings,
              href: "/services",
            }
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
        "w-78 bg-white border-r border-gray-200 flex flex-col",
        "transition-transform transition-all duration-300 ease-in-out",
        isCollapsed ? "w-18" : "w-78",
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className="hidden lg:flex py-3 px-6 pr-3 items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            {isCollapsed ? (
              <div className='h-12 flex items-center'><Image src="/images/logo-s.svg" alt="GeoWise" width={20} height={24}/></div>
              
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
          <div className='p-4'>
            <Button 
              variant="ghost" 
              className="cursor-pointer" 
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              <ChevronRight className="w-4 h-4"/>
            </Button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">

          {menuConfigs.map((menuSection, index) => (
            <div className="mb-12" key={index}>
              {!isCollapsed && (
                <div className="text-xs font-medium text-gray-400 uppercase mb-3 mt-2">{menuSection.title}</div>
              )}
              {menuSection.items.map((item, index2) => {
                return <MenuItem key={index2} menuItem={item} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
              })}
            </div>
          ))}

        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200">
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
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">{user?.FullName}</div>
                  {/* <div className="text-xs text-gray-500 truncate">{user?.UserEmail}</div> */}
                </div>
              )}
            </Link>
            {!isCollapsed && (
              <Button variant="ghost" size="icon" onClick={() => handleLogout()}>
                <LogOut className="w-5 h-5"/>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
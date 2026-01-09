import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Search,
  LayoutDashboard,
  Calendar,
  MapPin,
  Plus,
  Clock,
  Settings,
  ChevronUp,
  ChevronDown,
  Headphones,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface SidebarProps {
  isCollapsed?: boolean
  onToggleCollapse?: () => void
}

export default function Sidebar({ isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const location = useLocation()
  const [settingsExpanded, setSettingsExpanded] = useState(true) // Expanded by default

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/calendar', icon: Calendar, label: 'Calendar' },
    { path: '/service-zones', icon: MapPin, label: 'Service Zones', showPlus: true },
    { path: '/service-requests', icon: Clock, label: 'Scheduler' },
  ]

  const settingsItems = [
    { path: '/settings/details', label: 'Details' },
    { path: '/settings/linked-users', label: 'Linked users', badge: '10' },
    { path: '/settings/services', label: 'Services' },
    { path: '/settings/service-zones', label: 'Service Zones' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white border-r border-gray-200 h-screen flex flex-col transition-all duration-300 relative`}>
      {/* Top Section - Logo and Toggle */}
      <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-4 border-b border-gray-200`}>
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2.5">
              {/* GeoWise Logo */}
              <img
                src="/img/geowise-logo.svg"
                alt="GeoWise Logo"
                className="w-8 h-8"
              />
              <span className="text-gray-900 text-base font-semibold">GeoWise</span>
            </div>
          )}
          {isCollapsed && (
            <div className="w-full flex justify-center">
              <img
                src="/img/geowise-logo.svg"
                alt="GeoWise Logo"
                className="w-8 h-8"
              />
            </div>
          )}
          {!isCollapsed && (
            <button className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <ChevronDown className="w-3 h-3 text-gray-600" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle Button */}
      <button
        onClick={onToggleCollapse}
        className="absolute -right-3 top-20 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 shadow-sm transition-colors z-10"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-600" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-600" />
        )}
      </button>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent focus:bg-white"
            />
          </div>
        </div>
      )}
      {isCollapsed && (
        <div className="px-2 py-4 border-b border-gray-200">
          <button className="w-full flex justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors" title="Search">
            <Search className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* General Section */}
        <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-3`}>
          {!isCollapsed && (
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-3">
              GENERAL
            </h3>
          )}
          <div className="space-y-0.5">
            {navItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isCollapsed ? item.label : undefined}
                  className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {item.showPlus ? (
                    <div className="relative w-4 h-4">
                      <MapPin className={`w-4 h-4 ${active ? 'text-white' : 'text-gray-700'}`} />
                      <Plus className={`w-2.5 h-2.5 absolute -top-0.5 -right-0.5 ${active ? 'text-white' : 'text-gray-700'}`} strokeWidth={3} />
                    </div>
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  {!isCollapsed && <span>{item.label}</span>}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Account Section */}
        <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-3 border-t border-gray-200`}>
          {!isCollapsed && (
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2 px-3">
              ACCOUNT
            </h3>
          )}
          {!isCollapsed ? (
            <>
              <button
                onClick={() => setSettingsExpanded(!settingsExpanded)}
                className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </div>
                {settingsExpanded ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>
              {settingsExpanded && (
                <div className="mt-1 ml-7 space-y-0.5">
                  {settingsItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="flex items-center justify-between px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <span>{item.label}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs font-medium bg-success-100 text-success-700 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </>
          ) : (
            <button
              onClick={() => setSettingsExpanded(!settingsExpanded)}
              className="w-full flex justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
          )}
        </div>

        {/* Support */}
        <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-3 border-t border-gray-200`}>
          <Link
            to="/support"
            title={isCollapsed ? 'Support' : undefined}
            className={`flex items-center ${isCollapsed ? 'justify-center px-2' : 'gap-3 px-3'} py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors`}
          >
            <Headphones className="w-4 h-4" />
            {!isCollapsed && <span>Support</span>}
          </Link>
        </div>
      </div>

      {/* User Profile */}
      <div className={`${isCollapsed ? 'px-2' : 'px-4'} py-4 border-t border-gray-200`}>
        {isCollapsed ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center">
                <span className="text-gray-600 text-xs font-medium">OR</span>
              </div>
            </div>
            <button className="text-gray-600 hover:text-gray-900 transition-colors p-1 rounded hover:bg-gray-100" title="Logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Profile Picture */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center">
                <span className="text-gray-600 text-xs font-medium">OR</span>
              </div>
            </div>
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">Olivia Rhye</p>
              <p className="text-xs text-gray-500 truncate">olivia@untitledui.com</p>
            </div>
            {/* Logout Icon */}
            <button className="text-gray-600 hover:text-gray-900 transition-colors p-1 rounded hover:bg-gray-100 flex-shrink-0">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

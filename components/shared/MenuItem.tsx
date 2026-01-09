import {Button} from "@/components/ui/button";
import Link from "next/link";
import {Badge} from "@/components/ui/badge";
import React, {useEffect, useState} from "react";
import {MenuItemTypes} from "@/lib/types/menu.types";
import {cn} from "@/lib/utils";
import {ChevronDown, Settings} from "lucide-react";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";

type MenuItemProps = {
  menuItem: MenuItemTypes;
  isCollapsed: boolean;
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  allMenuItems?: MenuItemTypes[];
};

export default function MenuItem({menuItem, isCollapsed, setIsCollapsed, allMenuItems = []} : MenuItemProps){
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const Icon = menuItem.icon;
  const pathname = usePathname();
  
  // Check if this menu item should be active
  // Only active if pathname matches this href AND there's no more specific menu item that also matches
  const isActive = (() => {
    const exactMatch = pathname === menuItem.href;
    const prefixMatch = pathname.startsWith(menuItem.href + '/');
    
    // For parent items with children, also check if any child is active
    if (menuItem.children) {
      const hasActiveChild = menuItem.children.some(child => {
        const childExactMatch = pathname === child.href;
        const childPrefixMatch = pathname.startsWith(child.href + '/');
        return childExactMatch || childPrefixMatch;
      });
      if (hasActiveChild) {
        return true;
      }
    }
    
    if (!exactMatch && !prefixMatch) {
      return false;
    }
    
    // Check if there's a more specific menu item (longer href) that also matches
    const hasMoreSpecificMatch = allMenuItems.some(otherItem => {
      if (otherItem.href === menuItem.href) return false; // Skip self
      // Check if other item's href is longer and also matches the pathname
      return otherItem.href.length > menuItem.href.length && 
             pathname.startsWith(otherItem.href);
    });
    
    // Only active if no more specific match exists
    return !hasMoreSpecificMatch;
  })();
  useEffect(() => {
    if(isCollapsed){
      setMenuOpen(false);
    }
  }, [isCollapsed])

  // Auto-expand parent menu if a child is active
  useEffect(() => {
    if (menuItem.children && !isCollapsed) {
      const hasActiveChild = menuItem.children.some(child => {
        const childExactMatch = pathname === child.href;
        const childPrefixMatch = pathname.startsWith(child.href + '/');
        return childExactMatch || childPrefixMatch;
      });
      if (hasActiveChild) {
        setMenuOpen(true);
      }
    }
  }, [pathname, menuItem.children, isCollapsed])

  return menuItem.children ? (
    <div>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-center p-2 h-10 text-md font-normal",
                isActive && 'bg-gray-900 text-white hover:bg-gray-900 hover:text-white'
              )}
              onClick={() => {
                setIsCollapsed(false)
                setMenuOpen(!menuOpen);
              }}
            >
              <Icon className="w-5 h-5 flex-shrink-0"/>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-40" side="right">
            {menuItem.label}
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-between gap-3 text-md font-normal !pl-3",
            isActive && 'bg-gray-900 text-white hover:bg-gray-900 hover:text-white'
          )}
          onClick={() => {
            setIsCollapsed(false)
            setMenuOpen(!menuOpen);
          }}
        >
          <div className="flex items-center gap-3">
            <Icon className="w-5 h-5"/>
            {menuItem.label}
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            menuOpen ? "" : "-rotate-90"
          )}/>
        </Button>
      )}
      
      {(menuItem.children && menuOpen && !isCollapsed ) && (
        <div className="ml-8 space-y-1 mt-1">
          {menuItem.children.map((childItem, index3) => {
            // Check if child item should be active (same logic as parent)
            const childActive = (() => {
              const exactMatch = pathname === childItem.href;
              const prefixMatch = pathname.startsWith(childItem.href + '/');
              
              if (!exactMatch && !prefixMatch) {
                return false;
              }
              
              // Check if there's a more specific menu item that also matches
              const hasMoreSpecificMatch = allMenuItems.some(otherItem => {
                if (otherItem.href === childItem.href) return false;
                return otherItem.href.length > childItem.href.length && 
                       pathname.startsWith(otherItem.href);
              });
              
              return !hasMoreSpecificMatch;
            })();
            
            return (
              <Button key={index3} variant="ghost" className={cn("w-full justify-start text-gray-600", childActive && 'bg-gray-900 text-white hover:bg-gray-900 hover:text-white')}>
                <Link href={childItem.href}>{childItem.label}</Link>
                {childItem.badge && (<Badge className="bg-teal-500 hover:bg-teal-600">{childItem.badge}</Badge>)}
              </Button>
            )
          })}
        </div>
      )}
    </div>
    ) :  isCollapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            asChild
            className={cn(
              "w-full justify-center p-2 h-10 text-md font-normal",
              isActive && 'bg-gray-900 text-white hover:bg-gray-900 hover:text-white'
            )}
          >
            <Link href={menuItem.href}>
              <Icon className="w-5 h-5 flex-shrink-0"/>
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent className="max-w-40" side="right">
          {menuItem.label}
        </TooltipContent>
      </Tooltip>
    ) : (
      <Button 
        asChild
        variant="ghost" 
        className={cn(
        "w-full justify-start gap-3 text-md font-normal",
        isActive && 'bg-gray-900 text-white hover:bg-gray-900 hover:text-white'
      )}>
        <Link href={menuItem.href}>
          <Icon className="w-5 h-5"/>
          {menuItem.label}
        </Link>
      </Button>
      )
     
}
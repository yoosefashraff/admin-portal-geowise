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
  setIsCollapsed: React.Dispatch<React.SetStateAction<boolean>>
};

export default function MenuItem({menuItem, isCollapsed, setIsCollapsed} : MenuItemProps){
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const Icon = menuItem.icon;
  const pathname = usePathname();
  const isActive = pathname === menuItem.href || pathname.startsWith(menuItem.href);
  useEffect(() => {
    if(isCollapsed){
      setMenuOpen(false);
    }
  }, [isCollapsed])

  return menuItem.children ? (
    <div>
      {isCollapsed ? (
        <Tooltip>
          <TooltipTrigger>
            <Button
              variant="ghost"
              className="w-full justify-between gap-3 text-md font-normal !pl-3"
              onClick={() => {
                setIsCollapsed(false)
                setMenuOpen(!menuOpen);
              }}
            >
              <Settings className="w-5 h-5"/>
            </Button>
          </TooltipTrigger>
          <TooltipContent className="max-w-40" side="right">
            {menuItem.label}
          </TooltipContent>
        </Tooltip>
      ) : (
        <Button
          variant="ghost"
          className="w-full justify-between gap-3 text-md font-normal !pl-3"
          onClick={() => {
            setIsCollapsed(false)
            setMenuOpen(!menuOpen);
          }}
        >
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5"/>
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
            const childActive = pathname === childItem.href || pathname.startsWith(childItem.href);
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
            asChild
            variant="ghost" 
            className={cn(
            "w-full justify-start gap-3 text-md font-normal",
            isActive && 'bg-gray-900 text-white hover:bg-gray-900 hover:text-white'
          )}>
            <Link href={menuItem.href}>
              <Icon className="w-5 h-5"/>
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
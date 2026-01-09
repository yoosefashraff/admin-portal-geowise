import { ServiceZone, Zone } from "@/lib/types/zone.types";
import { MoreVertical } from "lucide-react";
import Link from "next/link";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "../ui/button";

interface ZoneItemProps {
    zone: ServiceZone;
    index: number;
    dataLength: number;
    handleDeleteItem: (serviceId: number) => void
}

export default function ZoneItem({zone, index, dataLength, handleDeleteItem}: ZoneItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return(
    <tr
      key={zone.ID}
      className={`border-b border-gray-200 hover:bg-gray-50 transition-colors ${
        index === dataLength - 1 ? 'border-b-0' : ''
      }`}
    >
      <td className="py-4 px-6 text-sm font-medium text-gray-900">
        <Link href={`/zones/${zone.ID}/edit`} >{zone.Name}</Link>
      </td>
      <td className="py-4 px-6 h-19">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 ml-2">
            {(zone.Providers && zone.Providers.length > 0) && (
              <span className="text-xs font-medium text-gray-700 bg-[#F9FAFB] px-2 py-0.5 rounded-xl">
                {zone.Providers[0].ProviderName}
              </span>
            )}
            {zone.Providers && zone.Providers.length > 1 && (
              <span className="text-xs font-medium text-gray-700 bg-[#F9FAFB] px-2 py-0.5 rounded-xl">
                {zone.Providers[1].ProviderName}
              </span>
            )}
          </div>
          
          {zone.Providers && zone.Providers.length > 2 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs font-medium bg-[#F9FAFB] px-2 py-0.5 text-cyan-700 rounded-xl">
                  +{zone.Providers.length - 2}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-40">
                {zone.Providers.slice(2).map((item) => item.ProviderName).join(', ')}
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </td>
      <td className="py-4 px-6 text-sm text-gray-500 space-x-1">
        {zone.AssignedDays && zone.AssignedDays.length && zone.AssignedDays.slice(0, 2).map((item, index) => (
          <span key={index} className="text-xs font-medium text-[#42576E] bg-[#F9FAFB] px-2 py-0.5 rounded-xl">
            {item}
          </span>
        ))}
        {zone.AssignedDays && zone.AssignedDays.length > 2 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="text-xs font-medium bg-[#F9FAFB] text-[#42576E] px-2 py-0.5 rounded-xl">
                +{zone.AssignedDays.length - 2}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-40">
              {zone.AssignedDays.slice(2).join(', ')}
            </TooltipContent>
          </Tooltip>
        )}
      </td>
      <td className="py-4 px-6">
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
          <button className="text-gray-500 hover:text-gray-600 transition-colors cursor-pointer">
              <MoreVertical className="w-5 h-5" />
          </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-40" align="end">
          <DropdownMenuGroup>
              <DropdownMenuItem>
                  <Link className='w-full' href={`/zones/${zone.ID}/edit`}>
                      Edit
                  </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={()=>setShowDeleteDialog(true)}>
                  Delete
              </DropdownMenuItem>
          </DropdownMenuGroup>
          </DropdownMenuContent>
      </DropdownMenu>
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Delete Zone</DialogTitle>
                <DialogDescription>
                    Are you sure you want to delete this zone?
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline" className="cursor-pointer">Cancel</Button>
                </DialogClose>
                <Button variant="destructive" className="cursor-pointer" onClick={() => {
                    setShowDeleteDialog(false);
                    handleDeleteItem(zone.ID)
                }}>Yes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </td>
    </tr>
  )
}
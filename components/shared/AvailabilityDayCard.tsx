import {Switch} from "@/components/ui/switch";
import {useState} from "react";

interface availabilityCardProps{
  dayOfWeek: string,
  checked?: boolean,
  onCheckedChange: (checked: boolean) => void
}

export default function AvailabilityDayCard({dayOfWeek, checked = true, onCheckedChange} : availabilityCardProps){

  return (
    <div className="px-6 py-4 bg-white space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">{ dayOfWeek }</div>
        <Switch 
          id="monday" 
          checked={checked} 
          onCheckedChange={
          (checked) => onCheckedChange(checked)} 
          className="h-5 cursor-pointer" 
          />
      </div>
      {checked ? (
        <div className="text-sm font-medium text-green-500">Opened</div>
      ) : (
        <div className="text-sm text-gray-500">Closed</div>
      )}
    </div>
  )
}
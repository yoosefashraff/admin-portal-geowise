import {Switch} from "@/components/ui/switch";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {MoveRight} from "lucide-react";
import React, {useState} from "react";

interface availabilityCardProps{
  dayOfWeek: string,
  isAvailable?: boolean
}

export default function AvailabilityCard({dayOfWeek, isAvailable = true} : availabilityCardProps){
  const [available, setAvailable] = useState<boolean>(isAvailable);

  return (
    <div className="px-6 py-4 bg-white space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">{ dayOfWeek }</div>
        <Switch id="monday" checked={available} className="h-5" />
      </div>
      {available ? (
        <div className="space-y-3">
          <div className="text-sm text-gray-500">Available hours</div>
          <div className="flex items-center gap-2">
            <Select>
              <SelectTrigger className="flex-1 min-w-[93px] data-[size=default]:h-11 data-[placeholder]:text-gray-900">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem key={1} value="1">10:30 <span className="text-gray-500">am</span></SelectItem>
                  <SelectItem key={2} value="2">11:30 <span className="text-gray-500">am</span></SelectItem>
                  <SelectItem key={3} value="3">12:30 <span className="text-gray-500">am</span></SelectItem>
                  <SelectItem key={4} value="4">13:30 <span className="text-gray-500">am</span></SelectItem>
                  <SelectItem key={5} value="5">14:30 <span className="text-gray-500">am</span></SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <MoveRight className="w-4 h-4 mx-auto text-gray-700" />
            <Select>
              <SelectTrigger className="flex-1 min-w-[93px] data-[size=default]:h-11 data-[placeholder]:text-gray-900">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem key={1} value="1">10:30 <span className="text-gray-500">am</span></SelectItem>
                  <SelectItem key={2} value="2">11:30 <span className="text-gray-500">am</span></SelectItem>
                  <SelectItem key={3} value="3">12:30 <span className="text-gray-500">am</span></SelectItem>
                  <SelectItem key={4} value="4">13:30 <span className="text-gray-500">am</span></SelectItem>
                  <SelectItem key={5} value="5">14:30 <span className="text-gray-500">am</span></SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="text-sm text-gray-500 flex items-center justify-between">
            <span>Break hours</span>
            <span className="font-semibold">Add</span>
          </div>
          <div className="text-sm text-gray-500 grid grid-cols-3">
            <div>N/A</div>
            <MoveRight className="w-4 h-4 mx-auto text-gray-700" />
            <div className='text-right'>N/A</div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">Closed</div>
      )}
    </div>
  )
}
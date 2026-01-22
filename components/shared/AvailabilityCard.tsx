import {Switch} from "@/components/ui/switch";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {MoveRight, Plus, X} from "lucide-react";
import React, {useState, useEffect} from "react";
import { cn } from "@/lib/utils";

interface BreakTime {
  id: string;
  start: string;
  end: string;
}

export interface AvailabilityDayData {
  isAvailable: boolean;
  startTime: string;
  endTime: string;
  breakTimes: BreakTime[];
}

interface availabilityCardProps{
  dayOfWeek: string,
  isAvailable?: boolean,
  startTime?: string,
  endTime?: string,
  breakStart?: string,
  breakEnd?: string,
  value?: AvailabilityDayData,
  onChange?: (data: AvailabilityDayData) => void
}

// Generate time options from 6:00 AM to 10:00 PM in 30-minute intervals
const generateTimeOptions = () => {
  const times = [];
  for (let hour = 6; hour <= 22; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const time24 = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      let hour12 = hour;
      if (hour === 0) hour12 = 12;
      else if (hour > 12) hour12 = hour - 12;
      const ampm = hour >= 12 ? 'pm' : 'am';
      const time12 = `${hour12}:${String(minute).padStart(2, '0')}`;
      times.push({ 
        value: time24, 
        label: `${time12} ${ampm}`, 
        display: `${time12} ${ampm}`,
        timePart: time12,
        ampm: ampm
      });
    }
  }
  return times;
};

const timeOptions = generateTimeOptions();

export default function AvailabilityCard({
  dayOfWeek, 
  isAvailable = true,
  startTime = '09:00',
  endTime = '17:00',
  breakStart,
  breakEnd,
  value,
  onChange
} : availabilityCardProps){
  // Use controlled value if provided, otherwise use internal state
  const isControlled = value !== undefined && onChange !== undefined;
  
  const [available, setAvailable] = useState<boolean>(value?.isAvailable ?? isAvailable);
  const [selectedStartTime, setSelectedStartTime] = useState<string>(value?.startTime ?? startTime);
  const [selectedEndTime, setSelectedEndTime] = useState<string>(value?.endTime ?? endTime);
  const [breakTimes, setBreakTimes] = useState<BreakTime[]>(() => {
    if (value?.breakTimes) return value.breakTimes;
    if (breakStart && breakEnd) {
      return [{ id: '1', start: breakStart, end: breakEnd }];
    }
    return [];
  });

  // Sync with controlled value when it changes
  React.useEffect(() => {
    if (isControlled && value) {
      setAvailable(value.isAvailable);
      setSelectedStartTime(value.startTime);
      setSelectedEndTime(value.endTime);
      setBreakTimes(value.breakTimes);
    }
  }, [value, isControlled]);

  // Notify parent of changes
  const notifyChange = (updates: Partial<AvailabilityDayData>) => {
    if (onChange) {
      onChange({
        isAvailable: available,
        startTime: selectedStartTime,
        endTime: selectedEndTime,
        breakTimes: breakTimes,
        ...updates
      });
    }
  };

  const handleAvailableChange = (checked: boolean) => {
    setAvailable(checked);
    notifyChange({ isAvailable: checked });
  };

  const handleStartTimeChange = (time: string) => {
    setSelectedStartTime(time);
    notifyChange({ startTime: time });
  };

  const handleEndTimeChange = (time: string) => {
    setSelectedEndTime(time);
    notifyChange({ endTime: time });
  };

  const handleAddBreak = () => {
    const newBreak: BreakTime = {
      id: Date.now().toString(),
      start: '12:00',
      end: '13:00',
    };
    const updated = [...breakTimes, newBreak];
    setBreakTimes(updated);
    notifyChange({ breakTimes: updated });
  };

  const handleRemoveBreak = (id: string) => {
    const updated = breakTimes.filter(bt => bt.id !== id);
    setBreakTimes(updated);
    notifyChange({ breakTimes: updated });
  };

  const handleBreakTimeChange = (id: string, field: 'start' | 'end', value: string) => {
    const updated = breakTimes.map(bt => 
      bt.id === id ? { ...bt, [field]: value } : bt
    );
    setBreakTimes(updated);
    notifyChange({ breakTimes: updated });
  };

  const formatTimeDisplay = (time24: string) => {
    const option = timeOptions.find(t => t.value === time24);
    if (!option) return 'N/A';
    return `${option.timePart} ${option.ampm}`;
  };

  return (
    <div 
      className="bg-white rounded-xl"
      style={{
        width: '312.67px',
        // Let height grow with content instead of being fixed
        paddingTop: '16px',
        paddingBottom: '16px',
        paddingLeft: '24px',
        paddingRight: '24px',
        boxShadow: '0px 4px 24px -2px rgba(16, 24, 40, 0.01), 0px 2px 24px -2px rgba(16, 24, 40, 0.06)'
      }}
    >
      <div className="flex flex-col" style={{ gap: '12px' }}>
        <div className="flex items-center justify-between">
          <div className="font-medium text-gray-900 text-base">{dayOfWeek}</div>
          <Switch 
            checked={available} 
            onCheckedChange={handleAvailableChange}
            className="h-5 data-[state=checked]:bg-green-600" 
          />
        </div>
        {available ? (
          <div className="flex-1 flex flex-col" style={{ gap: '12px' }}>
            {/* Available Hours Section */}
            <div className="text-sm text-gray-500 font-normal">Available hours</div>
            <div className="flex items-center gap-2">
            <Select 
              value={selectedStartTime} 
              onValueChange={handleStartTimeChange}
            >
              <SelectTrigger className="flex-1 min-w-[93px] h-11 data-[placeholder]:text-gray-900 border-gray-300">
                <SelectValue placeholder="Time">
                  {formatTimeDisplay(selectedStartTime)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.timePart} <span className="text-gray-500">{time.ampm}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <MoveRight className="w-4 h-4 text-gray-700 flex-shrink-0" />
            <Select 
              value={selectedEndTime} 
              onValueChange={handleEndTimeChange}
            >
              <SelectTrigger className="flex-1 min-w-[93px] h-11 data-[placeholder]:text-gray-900 border-gray-300">
                <SelectValue placeholder="Time">
                  {formatTimeDisplay(selectedEndTime)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.timePart} <span className="text-gray-500">{time.ampm}</span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Break Hours Section */}
          <div className="text-sm text-gray-500 flex items-center justify-between">
            <span>Break hours</span>
            <button
              onClick={handleAddBreak}
              type="button"
              className="font-semibold text-gray-900 hover:text-gray-700 transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>

            {/* Break Times List */}
            {breakTimes.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {breakTimes.map((breakTime, index) => (
                  <div key={breakTime.id} className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      <Select 
                        value={breakTime.start} 
                        onValueChange={(value) => handleBreakTimeChange(breakTime.id, 'start', value)}
                      >
                        <SelectTrigger className="flex-1 min-w-[93px] h-11 text-sm border-gray-300">
                          <SelectValue>
                            {formatTimeDisplay(breakTime.start)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {timeOptions.map((time) => (
                              <SelectItem key={time.value} value={time.value}>
                                {time.timePart} <span className="text-gray-500">{time.ampm}</span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      <MoveRight className="w-4 h-4 text-gray-700 flex-shrink-0" />
                      <Select 
                        value={breakTime.end} 
                        onValueChange={(value) => handleBreakTimeChange(breakTime.id, 'end', value)}
                      >
                        <SelectTrigger className="flex-1 min-w-[93px] h-11 text-sm border-gray-300">
                          <SelectValue>
                            {formatTimeDisplay(breakTime.end)}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {timeOptions.map((time) => (
                              <SelectItem key={time.value} value={time.value}>
                                {time.timePart} <span className="text-gray-500">{time.ampm}</span>
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>
                    <button
                      onClick={() => handleRemoveBreak(breakTime.id)}
                      type="button"
                      className="p-1.5 hover:bg-gray-100 rounded transition-colors ml-2"
                      aria-label="Remove break time"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 grid grid-cols-3 items-center">
                <div>N/A</div>
                <MoveRight className="w-4 h-4 mx-auto text-gray-700" />
                <div className="text-right">N/A</div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-sm text-gray-500">Closed</div>
        )}
      </div>
    </div>
  )
}

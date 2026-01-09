
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { OpeningHour } from "@/types/opening-hours";
import CustomSwitch from "@/components/ui/custom-switch";

const mockOpeningHours: OpeningHour[] = [
    { day: "Monday", isOpen: true },
    { day: "Tuesday", isOpen: true },
    { day: "Wednesday", isOpen: true },
    { day: "Thursday", isOpen: false },
    { day: "Friday", isOpen: false },
    { day: "Saturday", isOpen: false },
    { day: "Sunday", isOpen: false },
];

interface OpeningHoursDayProps {
  onChange: (day: string, isOpen: boolean, selected: OpeningHour[]) => void;
}

export default function OpeningHoursDay({ onChange }: OpeningHoursDayProps) {
    const [hours, setHours] = useState(mockOpeningHours);

    const handleToggle = (day: string, isOpen: boolean) => {
        setHours(prev => 
            prev.map(item => 
                item.day === day ? { ...item, isOpen } : item
            )
        );

        onChange(day, isOpen, hours);
    };

  return (
    <div className="space-y-3 max-w-md">
      {hours.map(({ day, isOpen }) => (
        <div key={day} className="p-[16px] rounded-[16px] bg-[#F9FAFB]">
        <div className="bg-white rounded-[16px] p-4 border-1 shadow-[0px_2px_24px_rgba(16,24,40,0.06)] border-transparent hover:border-[#101828] transition-shadow cursor-pointer">
            <div className="flex">
            <div className="flex-1 text-[#101E28] font-medium text-[16px] leading-[24px]">{day}</div>
            <div className="flex-1">
                <CustomSwitch
                    checked={isOpen}
                    onCheckedChange={(checked) => handleToggle?.(day, checked)}
                    className="justify-end"
                />
            </div>
            </div>

            <p className={cn(
                "mt-3 text-sm leading-5 font-normal",
                isOpen ? "text-green-600" : "text-[#667085]"
                )}
            >
                {isOpen ? "Open" : "Closed"}
            </p>
        </div>
        </div>
      ))}
    </div>
  );
}
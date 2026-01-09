"use client";

import { useId, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface CustomSwitchProps {
  label?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
}

export default function CustomSwitch({
  label,
  checked: controlledChecked,
  onCheckedChange,
  disabled = false,
  className,
}: CustomSwitchProps) {

  const id = useId();
  const [internalChecked, setInternalChecked] = useState(false);
  const isChecked = controlledChecked ?? internalChecked;

  const handleChange = (checked: boolean) => {
    if (!controlledChecked) {
      setInternalChecked(checked);
    }
    onCheckedChange?.(checked);
  };

  return (
    <div className={`flex items-center gap-3 ${className || ""}`}>
        <Switch
            id={id}
            checked={isChecked}
            onCheckedChange={handleChange}
            disabled={disabled}
            className={cn(
                "h-[20px] w-[36px] rounded-full border-2 border-transparent bg-[#F2F4F7] cursor-pointer",
                "data-[state=checked]:bg-[#151C24]",
                "focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2",
                "[&_[data-slot=switch-thumb]]:size-[16px]",
                "[&_[data-slot=switch-thumb]]:shadow-[0px_1px_2px_0px_#1018280F]",
                "[&_[data-slot=switch-thumb]]:data-[state=checked]:translate-x-[100%]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
        />

        {/* Label (optional) */}
        {label && (
            <Label
            htmlFor={id}
            className="text-sm font-medium text-gray-700 cursor-pointer select-none"
            >
            {label}
            </Label>
        )}
    </div>
  );
}
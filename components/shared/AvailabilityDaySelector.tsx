import { useState } from "react";
import AvailabilityDayCard from "./AvailabilityDayCard";

interface SelectedDays {
  Monday: boolean;
  Tuesday: boolean;
  Wednesday: boolean;
  Thursday: boolean;
  Friday: boolean;
  Saturday: boolean;
  Sunday: boolean;
}

interface AvailabilitySelectorProps {
  value?: string;
  onChange?: (value: string) => void;
}

export default function AvailabilitySelector({ value = '', onChange } : AvailabilitySelectorProps){
  const daysOfWeek: (keyof SelectedDays)[] = [
    'Monday',
    'Tuesday', 
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
  ];
  // Initialize state from value prop
  const initializeSelectedDays = (valueString: string): SelectedDays => {
    const days = valueString.split(',').map(d => d.trim()).filter(Boolean);
    return {
      Monday: days.includes('Monday'),
      Tuesday: days.includes('Tuesday'),
      Wednesday: days.includes('Wednesday'),
      Thursday: days.includes('Thursday'),
      Friday: days.includes('Friday'),
      Saturday: days.includes('Saturday'),
      Sunday: days.includes('Sunday')
    };
  };

  const [selectedDays, setSelectedDays] = useState<SelectedDays>(
    initializeSelectedDays(value)
  );

  const handleDayChange = (day: keyof SelectedDays, checked: boolean) => {
    const newSelectedDays = {
      ...selectedDays,
      [day]: checked
    };
    setSelectedDays(newSelectedDays);

    if (onChange) {
      const newValue = Object.entries(newSelectedDays)
        .filter(([_, isSelected]) => isSelected)
        .map(([dayName, _]) => dayName)
        .join(', ');
      onChange(newValue);
    }
  };

  return (
    <>
      {daysOfWeek.map((day, index) => (
        <AvailabilityDayCard
          key={index + 1}
          dayOfWeek={day}
          checked={selectedDays[day]}
          onCheckedChange={(checked) => handleDayChange(day, checked as boolean)}
        />
      ))}
    </>
  );
};
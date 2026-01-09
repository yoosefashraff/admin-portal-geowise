'use client';

import { useState, useRef, useEffect } from 'react';
import { formatDateToYYYYMMDD } from '@/lib/calendarUtils';
import styles from './DateRangePicker.module.css';
import { CalendarDays } from 'lucide-react';
import 'react-date-range/dist/styles.css';
import 'react-date-range/dist/theme/default.css'; 
import { DateRangePicker as ReactDateRangePicker } from 'react-date-range';
import { Button } from '@/components/ui/button';

interface DateRangePickerProps {
  startDate: Date;
  endDate: Date;
  onChange: (start: Date, end: Date) => void;
}

export default function DateRangePickerCustom({ startDate, endDate, onChange }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const pickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTempStartDate(startDate);
    setTempEndDate(endDate);
  }, [startDate, endDate]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isOpen]);

  const displayValue = 
    formatDateToYYYYMMDD(startDate) === formatDateToYYYYMMDD(endDate)
      ? formatDateToYYYYMMDD(startDate)
      : `${formatDateToYYYYMMDD(startDate)} - ${formatDateToYYYYMMDD(endDate)}`;

  const handleApply = () => {
    onChange(tempStartDate, tempEndDate);
    setIsOpen(false);
  };

  const handleSelect = (ranges: any) => {
    if (ranges.selection) {
      setTempStartDate(ranges.selection.startDate);
      setTempEndDate(ranges.selection.endDate);
    }
  }

  const selectionRange = {
    startDate: tempStartDate,
    endDate: tempEndDate,
    key: 'selection',
  }

  return (
    <div className={styles.container} ref={pickerRef}>
      <div className="flex items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <CalendarDays className="w-4 h-4 text-gray-700" />
        <input
          type="text"
          value={displayValue}
          readOnly
          placeholder="Select date range"
          className={styles.input}
        />
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <style jsx global>{`
            .rdrDefinedRangesWrapper {
              display: none !important;
            }
            .rdrDateDisplayWrapper {
              display: none !important;
            }
            .rdrInputRanges {
              display: none !important;
            }
            .rdrStaticRanges {
              display: none !important;
            }
        `}</style>
          <ReactDateRangePicker
            ranges={[selectionRange]}
            onChange={handleSelect}
            months={1}
            direction="horizontal"
            showDateDisplay={false}
            showMonthAndYearPickers={true}
            showPreview={true}
          />
          <div className="flex justify-end gap-2">
            <Button className="cursor-pointer" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button className="bg-green-600 hover:bg-green-700 cursor-pointer" onClick={handleApply}>
              Apply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
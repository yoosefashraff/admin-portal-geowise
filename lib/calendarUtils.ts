import { ColorItem, TimeSlotResult } from '@/lib/types/calendar';

export const CLIENT_TIMEZONE = 
  typeof window !== 'undefined' 
    ? Intl.DateTimeFormat().resolvedOptions().timeZone 
    : 'UTC';

export const TIMEZONE_OPTIONS: Intl.DateTimeFormatOptions = { 
  timeZone: CLIENT_TIMEZONE 
};

export const TIME_ONLY_OPTIONS: Intl.DateTimeFormatOptions = {
  timeZone: CLIENT_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
};

// Format dates to ISO strings
export function toISODateString(date: Date, time = '00:00:00'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}T${time}`;
}

// Format date to YYYY-MM-DD
export function formatDateToYYYYMMDD(date: Date): string {
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Check if date is valid
export function isValidDate(d: any): d is Date {
  return d instanceof Date && !isNaN(d.getTime());
}

// Parse time slot to ISO with error handling
export function parseTimeSlot(
  dateStr: string, 
  timeSlot: string
): TimeSlotResult | null {
  if (!dateStr || !timeSlot) return null;

  const [startTimeStr, endTimeStr] = timeSlot.split('-');
  if (!startTimeStr || !endTimeStr) return null;

  try {
    const browserTimeZone = CLIENT_TIMEZONE;

    function parseTime(timeStr: string): string | null {
      const match = timeStr.trim().match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return null;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();
      if (ampm === 'PM' && hours !== 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    }

    const dateOnly = dateStr.split('T')[0];
    const startTime = parseTime(startTimeStr);
    const endTime = parseTime(endTimeStr);

    if (!startTime || !endTime) return null;

    const startUtcStr = `${dateOnly}T${startTime}Z`;
    const endUtcStr = `${dateOnly}T${endTime}Z`;

    const startUtc = new Date(startUtcStr);
    const endUtc = new Date(endUtcStr);

    if (isNaN(startUtc.getTime()) || isNaN(endUtc.getTime())) return null;

    function convertToLocal(dateUTC: Date, timeZone: string): string {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
      const parts = formatter.formatToParts(dateUTC);
      const y = parts.find((p) => p.type === 'year')!.value;
      const m = parts.find((p) => p.type === 'month')!.value;
      const d = parts.find((p) => p.type === 'day')!.value;
      const h = parts.find((p) => p.type === 'hour')!.value;
      const min = parts.find((p) => p.type === 'minute')!.value;
      return `${y}-${m}-${d}T${h}:${min}:00`;
    }

    const localStart = convertToLocal(startUtc, browserTimeZone);
    const localEnd = convertToLocal(endUtc, browserTimeZone);

    return {
      start: startUtc.toISOString(),
      end: endUtc.toISOString(),
      startLocal: localStart,
      endLocal: localEnd,
      localDate: localStart.split('T')[0],
    };
  } catch (error) {
    console.warn('Error parsing time slot:', error, { dateStr, timeSlot });
    return null;
  }
}

// Color utilities
let colorIndex = 0;
const barberColorMap: Record<string, string> = {};

export function makeColorUltraMild(hexColor: string): string {
  const r = parseInt(hexColor.slice(1, 3), 16);
  const g = parseInt(hexColor.slice(3, 5), 16);
  const b = parseInt(hexColor.slice(5, 7), 16);
  const mildR = Math.round(r * 0.1 + 255 * 0.9);
  const mildG = Math.round(g * 0.1 + 255 * 0.9);
  const mildB = Math.round(b * 0.1 + 255 * 0.9);
  return `#${mildR.toString(16).padStart(2, '0')}${mildG
    .toString(16)
    .padStart(2, '0')}${mildB.toString(16).padStart(2, '0')}4D`;
}

export function darkenColor(hexColor: string, amount: number): string {
  const hex = hexColor.length > 7 ? hexColor.substring(0, 7) : hexColor;
  let r = parseInt(hex.substring(1, 3), 16);
  let g = parseInt(hex.substring(3, 5), 16);
  let b = parseInt(hex.substring(5, 7), 16);
  r = Math.max(0, Math.floor(r * (1 - amount)));
  g = Math.max(0, Math.floor(g * (1 - amount)));
  b = Math.max(0, Math.floor(b * (1 - amount)));
  return `#${r.toString(16).padStart(2, '0')}${g
    .toString(16)
    .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function getColorForBarber(
  barberId: string, 
  colors: ColorItem[]
): string {
  if (!barberColorMap[barberId]) {
    const keysArray = colors.map((color) => color.Key);
    const vibrantColor = keysArray[colorIndex % keysArray.length];
    barberColorMap[barberId] = makeColorUltraMild(vibrantColor);
    colorIndex++;
  }
  return barberColorMap[barberId];
}

export function getDarkerBorderColor(
  barberId: string, 
  colors: ColorItem[]
): string {
  return darkenColor(getColorForBarber(barberId, colors), 0.35);
}

export function getMediumColor(
  barberId: string, 
  colors: ColorItem[]
): string {
  const ultraMild = getColorForBarber(barberId, colors);
  const darker = getDarkerBorderColor(barberId, colors);
  const r1 = parseInt(ultraMild.substring(1, 3), 16);
  const g1 = parseInt(ultraMild.substring(3, 5), 16);
  const b1 = parseInt(ultraMild.substring(5, 7), 16);
  const r2 = parseInt(darker.substring(1, 3), 16);
  const g2 = parseInt(darker.substring(3, 5), 16);
  const b2 = parseInt(darker.substring(5, 7), 16);
  const r = Math.round(r1 * 0.8 + r2 * 0.2);
  const g = Math.round(g1 * 0.8 + g2 * 0.2);
  const b = Math.round(b1 * 0.8 + b2 * 0.2);
  return `#${r.toString(16).padStart(2, '0')}${g
    .toString(16)
    .padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
// components/EventPopup.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { BookingRequestPayload, CalendarEvent } from '@/lib/types/calendar';
import styles from './EventPopup.module.css';
import { Button } from '../ui/button';
import CustomDialog from '../shared/CustomDialog';
import EditBookingDialog from '../shared/EditBookingDialog';

interface EventPopupProps {
  event: CalendarEvent;
  position: { top: number; left: number };
  onClose: () => void;
  onCancel: (event: CalendarEvent) => void;
  onEditSubmit: (bookingPayload: BookingRequestPayload) => void;
  editLoading: boolean
}

export default function EventPopup({ event, position, onClose, onCancel, onEditSubmit, editLoading }: EventPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [showDialogEdit, setShowDialogEdit] = useState<boolean>(false);
  const isDialogOpenRef = useRef(false);

  useEffect(() => {
    isDialogOpenRef.current = isDialogOpen || showDialogEdit;
  }, [isDialogOpen, showDialogEdit]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isDialogOpenRef.current) return;

      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Delay to avoid immediate closing
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [onClose]);

  // Adjust position to keep popup in viewport
  const adjustedPosition = { ...position };
  const popupWidth = 180;
  const popupHeight = 180;

  if (typeof window !== 'undefined') {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (adjustedPosition.left + popupWidth > viewportWidth - 6) {
      adjustedPosition.left = viewportWidth - popupWidth - 6;
    }
    if (adjustedPosition.left < 6) {
      adjustedPosition.left = 6;
    }

    if (adjustedPosition.top + popupHeight > window.scrollY + viewportHeight - 6) {
      adjustedPosition.top = window.scrollY + viewportHeight - popupHeight - 6;
    }
    if (adjustedPosition.top < 6) {
      adjustedPosition.top = 6;
    }
  }

  return (
    <>
    <div
      ref={popupRef}
      className={styles.popup}
      style={{
        top: `${adjustedPosition.top}px`,
        left: `${adjustedPosition.left}px`,
      }}
    >
      <div className={styles.title}>Booking details</div>
      
      <div className={styles.details}>
        <p><strong>Date:</strong> {event.extendedProps.date || 'N/A'}</p>
        <p><strong>Time:</strong> {event.extendedProps.time || 'N/A'}</p>
        <p><strong>Customer:</strong> {event.extendedProps.customer || 'N/A'}</p>
        <p><strong>Services:</strong> {event.extendedProps.services || 'N/A'}</p>
        <p><strong>Location:</strong> {event.extendedProps.location || 'N/A'}</p>
      </div>

      <div className="mt-2 flex flex-col gap-2">
        <Button
          className='cursor-pointer p-2 h-7 w-full rounded-sm text-xs'
          onClick={() => setShowDialogEdit(true)}
        >
          Edit
        </Button>
        <Button
          className='cursor-pointer p-2 h-7 w-full rounded-sm text-xs'
          onClick={() => setIsDialogOpen(true)}
        >
          Cancel
        </Button>
        <Button 
          variant="secondary" 
          className="cursor-pointer p-2 h-7 w-full rounded-sm text-xs" 
          onClick={() => onClose()}
        >
          Close
        </Button>
      </div>
    </div>
    <CustomDialog 
        showDialog={isDialogOpen} 
        setShowDialog={setIsDialogOpen} 
        title="Cancel Booking" 
        description="Are you sure you want to cancel this booking?" 
        handleSubmit={() => onCancel(event)} 
      />
      <EditBookingDialog 
        showDialog={showDialogEdit} 
        setShowDialog={setShowDialogEdit} 
        title="Edit Booking" 
        handleSubmit={onEditSubmit} 
        event={event}
        editLoading={editLoading}
      />
    </>
  );
}
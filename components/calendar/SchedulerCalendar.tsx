'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimelinePlugin from '@fullcalendar/resource-timeline';
import interactionPlugin from '@fullcalendar/interaction';
import { EventContentArg, DatesSetArg, EventClickArg } from '@fullcalendar/core';
import { 
  CalendarResource, 
  CalendarEvent, 
  ColorItem,
  Barber, 
  BookingRequestPayload
} from '@/lib/types/calendar';
import {
  toISODateString,
  parseTimeSlot,
  getColorForBarber,
  getDarkerBorderColor,
  getMediumColor,
  TIME_ONLY_OPTIONS,
  formatDateToYYYYMMDD,
} from '@/lib/calendarUtils';
import EventPopup from './EventPopup';
import DateRangePickerCustom from './DateRangePicker';
import styles from './SchedulerCalendar.module.css';
import { fetchBookings, cancelCallout, deleteBlockHour, calendarBooking, exportCalendar } from '@/lib/actions/calendar.actions';
import { getServiceZoneColorList } from '@/lib/actions/zone.actions';
import { toast } from 'sonner';
import { useAuthStore } from '@/lib/store/authStore';
import { set } from 'date-fns';
import { Button } from '@/components/ui/button';
import EditBookingDialog from '@/components/shared/EditBookingDialog';

export default function SchedulerCalendar() {
  const calendarRef = useRef<FullCalendar>(null);
  const [resources, setResources] = useState<CalendarResource[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [colors, setColors] = useState<ColorItem[]>([]);
  const [customDateRange, setCustomDateRange] = useState<{ start: Date; end: Date } | null>(null);
  const currentViewRef = useRef<string>('resourceTimelineDay');
  const {user} = useAuthStore();
  const [selectedEvent, setSelectedEvent] = useState<{
    event: CalendarEvent;
    position: { top: number; left: number };
  } | null>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(),
    end: new Date(),
  });
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [newBookingDialog, setNewBookingDialog] = useState<boolean>(false);

  const lastFetchParamsRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchZoneColors = useCallback(async () => {
    const response = await getServiceZoneColorList();
    if (response.Status === 201) {
      setColors(response.List);
    }
  }, []);

  // Load colors on mount
  useEffect(() => {
    fetchZoneColors();
  }, []);

  useEffect(() => {
  if (user?.UserID && colors.length > 0 && dateRange.start) {
    const fetchStartISO = toISODateString(dateRange.start, '00:00:00');
    const fetchEndISO = toISODateString(dateRange.end, '23:59:59');
    fetchAndRenderCalendar(fetchStartISO, fetchEndISO);
  }
}, [user, colors]);

  // Fetch and process calendar data
  const fetchAndRenderCalendar = useCallback(async (
    startDateISO: string,
    endDateISO: string,
  ) => {

    if(!user || colors.length === 0) return;

    const currentParams = `${startDateISO}-${endDateISO}-${user?.UserID || 0}`;
    
    if ((isFetchingRef.current || lastFetchParamsRef.current === currentParams)) {
      return;
    }

    isFetchingRef.current = true;
    lastFetchParamsRef.current = currentParams;

    try {

      const response = await fetchBookings({
        StartDate: startDateISO,
        EndDate: endDateISO,
        IsOnlyConfirmed: false,
        CompanyAdminId: user?.UserID || 0
      });

      if (!response || !response.Object) {
        setResources([]);
        setEvents([]);
        return;
      }

      processAndRenderCalendar(response.Object);
    } catch (error) {
      console.error('Failed to fetch bookings:', error);
      lastFetchParamsRef.current = null;
    } finally {
      isFetchingRef.current = false;
    }

  }, [user,colors]);

  const processAndRenderCalendar = useCallback((barbers: Barber[]) => {
    // Process resources
    const newResources: CalendarResource[] = barbers.map((barber) => ({
      id: barber.UserID,
      title: barber.FullName,
      extendedProps: {
        avatar: barber.ImageUrl,
        username: barber.UserName,
      },
    }));

    // Process events
    const newEvents: CalendarEvent[] = [];
    barbers.forEach((barber) => {
      barber.Callouts.forEach((callout) => {
        const times = parseTimeSlot(callout.BookingDate, callout.TimeSlot);
        if (!times) return;

        let startDate = new Date(times.start);
        let endDate = new Date(times.end);

        if (endDate <= startDate) {
          endDate = new Date(endDate);
          endDate.setDate(endDate.getDate() + 1);
        }

        const startTimeOnly = startDate.toLocaleTimeString('en-US', TIME_ONLY_OPTIONS);
        const endTimeOnly = endDate.toLocaleTimeString('en-US', TIME_ONLY_OPTIONS);
        const convertedTimeSlot = `${startTimeOnly} - ${endTimeOnly}`;

        newEvents.push({
          id: `${barber.UserID}-${callout.BookingDate}-${callout.TimeSlot.replace(':', '')}`,
          resourceId: barber.UserID,
          title: callout.Customer?.trim() || callout.ServiceName || 'Booking',
          start: startDate,
          end: endDate,
          color: getColorForBarber(barber.UserID, colors),
          textColor: getDarkerBorderColor(barber.UserID, colors),
          borderRadius: '5px',
          borderColor: getMediumColor(barber.UserID, colors),
          borderWidth: '2px',
          extendedProps: {
            time: convertedTimeSlot || '',
            date: callout.BookingDate.split('T')[0] || '',
            services: callout.ServiceName || '',
            location: callout.Address || '',
            customer: callout.Customer || '',
            calloutId: callout.Id ?? 0,
            blockHourId: callout.BlockHourId ?? 0,
            _dateKey: callout.BookingDate,
          },
        });
      });
    });

    // Generate travel events
    const eventsByBarberAndDate: Record<string, CalendarEvent[]> = {};
    newEvents.forEach((event) => {
      const key = `${event.resourceId}-${event.extendedProps._dateKey}`;
      if (!eventsByBarberAndDate[key]) eventsByBarberAndDate[key] = [];
      eventsByBarberAndDate[key].push(event);
    });

    const travelEvents: CalendarEvent[] = [];
    Object.values(eventsByBarberAndDate).forEach((group) => {
      group.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
      group.forEach((event, idx) => {
        if (idx < group.length - 1) {
          const currentEnd = new Date(event.end);
          const nextStart = new Date(group[idx + 1].start);

          if (isNaN(currentEnd.getTime()) || isNaN(nextStart.getTime())) {
            return;
          }

          const gapMinutes = Math.round((nextStart.getTime() - currentEnd.getTime()) / (1000 * 60));
          if (
            gapMinutes > 0 &&
            event.extendedProps.services !== 'BLOCKED HOUR' &&
            group[idx + 1].extendedProps.services !== 'BLOCKED HOUR'
          ) {
            let gapText;
            if (gapMinutes >= 60) {
              const hours = Math.floor(gapMinutes / 60);
              const minutes = gapMinutes % 60;
              gapText = `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
            } else {
              gapText = `${gapMinutes} min`;
            }
            travelEvents.push({
              id: `travel-${event.id}-${group[idx + 1].id}`,
              resourceId: event.resourceId,
              title: gapText,
              start: currentEnd,
              end: nextStart,
              color: '#0080ff12',
              textColor: '#333',
              display: 'background',
              className: ['travel-event'],
              extendedProps: {
                isTravel: true,
                gapMinutes,
                fromBooking: event.id,
                toBooking: group[idx + 1].id,
              },
            });
          }
        }
      });
    });

    const allEvents = [...newEvents, ...travelEvents];
    setResources(newResources);
    setEvents(allEvents);
  }, [colors]);

  const handleDatesSet = useCallback((dateInfo: DatesSetArg) => {

    currentViewRef.current = dateInfo.view.type;

    const startDate = new Date(dateInfo.start);
    const endDate = new Date(dateInfo.end);

    const isCustomView = dateInfo.view.type === 'resourceTimelineCustomWeekly' || 
                         dateInfo.view.type === 'resourceTimelineCustomMonthly';
    
    if (!isCustomView && customDateRange) {
      setCustomDateRange(null);
    }

    if (!isCustomView) {
      endDate.setDate(endDate.getDate() - 1);
    }
    
    if (!customDateRange || !isCustomView) {
      setDateRange(prev => {
        if (
          prev.start.getTime() === startDate.getTime() &&
          prev.end.getTime() === endDate.getTime()
        ) {
          return prev;
        }
        return { start: startDate, end: endDate };
      });
    }

    const fetchStartISO = toISODateString(startDate, '00:00:00');
    const fetchEndISO = toISODateString(endDate, '23:59:59');

    fetchAndRenderCalendar(fetchStartISO, fetchEndISO);
  }, [fetchAndRenderCalendar, customDateRange]);

  const handleEventClick = (clickInfo: EventClickArg) => {
    clickInfo.jsEvent.preventDefault();
    const rect = clickInfo.el.getBoundingClientRect();
    const event = clickInfo.event.toPlainObject() as CalendarEvent;
    
    setSelectedEvent({
      event: {...event, resourceId: (clickInfo.event.getResources()[0].id || '')},
      position: {
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
      },
    });
  };

  const handleCancelBooking = async (event: CalendarEvent) => {
    try {
      let success = false;
      
      if (event.extendedProps.calloutId) {
        const response = await cancelCallout(event.extendedProps.calloutId);
        success = response.Status === 201;
      } else if (event.extendedProps.blockHourId) {
        const response = await deleteBlockHour(event.extendedProps.blockHourId);
        success = response.Status === 201;
      }

      if (success) {
        setEvents(prev => prev.filter(e => e.id !== event.id));
        toast.success('Booking cancelled successfully');
        setSelectedEvent(null);
      } else {
        toast.error('Unable to cancel booking. Please try again.');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('An unexpected error occurred. Please try again later.');
    }
  };

  const handleEditBooking = async (bookingPayload: BookingRequestPayload) => {
    // return;
    setSubmitLoading(true);
    const response = await calendarBooking(bookingPayload);
    if (response.Status === 201) {
      toast.success('Booking updated successfully');

      lastFetchParamsRef.current = null;
      isFetchingRef.current = false;
      // Update the calendar
      const fetchStartISO = toISODateString(dateRange.start, '00:00:00');
      const fetchEndISO = toISODateString(dateRange.end, '23:59:59');
      fetchAndRenderCalendar(fetchStartISO, fetchEndISO);
      setSelectedEvent(null);
    } else {
      toast.error('Unable to update booking. Please try again.');
    }
    setSubmitLoading(false);
  }

  const renderEventContent = (eventInfo: EventContentArg) => {
    // Get current view type
    const calendarApi = calendarRef.current?.getApi();
    const currentView = calendarApi?.view.type || '';
    
    if (eventInfo.event.extendedProps?.isTravel) {
      const gapMinutes = eventInfo.event.extendedProps.gapMinutes || 0;
      
      if (currentView === 'resourceTimelineWeek' || 
          currentView === 'resourceTimelineMonth' ||
          currentView === 'resourceTimelineCustomWeekly' ||
          currentView === 'resourceTimelineCustomMonthly') {
        return null;
      }
      
      if (gapMinutes > 45 && eventInfo.event.title) {
        return (
          <div 
            className={styles.travelEvent} 
            style={{ 
              color: eventInfo.textColor,
              fontSize: '8.6px',
              textAlign: 'center'
            }}
          >
            {eventInfo.event.title}
          </div>
        );
      }
      return null;
    }

    // Regular booking events
    const start = new Date(eventInfo.event.start!);
    const end = new Date(eventInfo.event.end!);
    const durationMinutes = Math.abs(Math.round((end.getTime() - start.getTime()) / (1000 * 60)));
    
    let durationText;
    if (durationMinutes >= 60) {
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      durationText = `${hours}h${minutes > 0 ? ` ${minutes}min` : ''}`;
    } else {
      durationText = `${durationMinutes} min`;
    }

    return (
      <div>
        <div className={styles.eventTitle} style={{ color: eventInfo.textColor }}>
          {eventInfo.event.extendedProps.customer}
        </div>
        <div className={styles.eventDuration} style={{ color: eventInfo.textColor }}>
          {durationText}
        </div>
      </div>
    );
  };

  const renderResourceLabel = (arg: any) => {
    return (
      <div className={styles.resourceLabel}>
        <img
          src={arg.resource.extendedProps.avatar}
          alt={arg.resource.title}
          className={styles.resourceAvatar}
        />
        <div>
          <div className={styles.resourceName}>{arg.resource.title}</div>
          <div className={styles.resourceUsername}>@{arg.resource.extendedProps.username}</div>
        </div>
      </div>
    );
  };

  const handleCustomNavigate = (direction: 1 | -1) => {
    const calendarApi = calendarRef.current?.getApi();
    if (!calendarApi) return;

    if (!customDateRange) {
      direction === 1 ? calendarApi.next() : calendarApi.prev();
      return;
    }

    const start = customDateRange.start;
    const end = customDateRange.end;

    const diffDays = Math.round(
      (end.getTime() - start.getTime()) / 86400000
    ) + 1;

    const newStart = new Date(start);
    const newEnd = new Date(end);

    newStart.setDate(newStart.getDate() + diffDays * direction);
    newEnd.setDate(newEnd.getDate() + diffDays * direction);

    setCustomDateRange({ start: newStart, end: newEnd });
    setDateRange({ start: newStart, end: newEnd });

    calendarApi.changeView(calendarApi.view.type, newStart);
  };

  const handleExportCalendar = async () => {
    const exportStartDate = dateRange.start;
    const exportEndDate = dateRange.end;

    // Format dates for the API
    const startDateStr = formatDateToYYYYMMDD(exportStartDate) + 'T00:00:00';
    const endDateStr = formatDateToYYYYMMDD(exportEndDate) + 'T23:59:59';

    const formData = {
      StartDate: startDateStr,
      EndDate: endDateStr,
      IsOnlyConfirmed: 'false',
      CompanyAdminId: user?.UserID,
      FilterType: ''
    };

    try {
      const response = await exportCalendar(formData);

      const exportName = `export-${formatDateToYYYYMMDD(exportStartDate)}-${formatDateToYYYYMMDD(exportEndDate)}.xlsx`;
      
      if (typeof response.toBase64 === 'function') {
        const base64String = response.toBase64();

        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = exportName;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
        
        toast.success('Exported successfully');
      } 
      else if (response.BYTES_PER_ELEMENT) {
        const blob = new Blob([response], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });

        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = exportName;
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }, 100);
        
        toast.success('Exported successfully');
      }
      else {
        console.error('Unknown response type. Full response:', response);
        
        if (typeof response === 'string') {
          const byteCharacters = atob(response);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });

          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = exportName;
          document.body.appendChild(link);
          link.click();
          
          setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
          }, 100);
          
          toast.success('Exported successfully');
        } else {
          throw new Error('Cannot handle this response type');
        }
      }
      
    } catch (error) {
      toast.error("Unable to export calendar. Please try again.");
      console.error('Export error:', error);
    }
  };

  const onBookingSubmit = async (bookingPayload: BookingRequestPayload) => {
    // console.log(bookingPayload);
    // return;
    setSubmitLoading(true);
    const response = await calendarBooking(bookingPayload);

    if (response.Status === 201) {
      toast.success(response.Message);
      lastFetchParamsRef.current = null;
      isFetchingRef.current = false;
      // Update the calendar
      const fetchStartISO = toISODateString(dateRange.start, '00:00:00');
      const fetchEndISO = toISODateString(dateRange.end, '23:59:59');
      fetchAndRenderCalendar(fetchStartISO, fetchEndISO);
      setSelectedEvent(null);
    } else {
      toast.error('Unable to add booking. Please try again.');
    }
    setSubmitLoading(false);
  }

  return (
    <div>
      <div className="flex justify-end mb-6 gap-2">
        <Button 
          className="cursor-pointer"
          onClick={() => setNewBookingDialog(true)}
        >
          New Booking
        </Button>
        <EditBookingDialog 
          showDialog={newBookingDialog} 
          setShowDialog={setNewBookingDialog} 
          title="New Booking" 
          handleSubmit={onBookingSubmit} 
          submitLoading={submitLoading}
        />
        <Button 
          className="cursor-pointer"
          onClick={handleExportCalendar}
        >
          Export to Excel
        </Button>
      </div>

      <div className={styles.header}>
        <DateRangePickerCustom
          startDate={dateRange.start}
          endDate={dateRange.end}
          onChange={(start, end) => {
            setCustomDateRange({ start, end});
            setDateRange({ start, end });
            
            lastFetchParamsRef.current = null;
            const fetchStartISO = toISODateString(start, '00:00:00');
            const fetchEndISO = toISODateString(end, '23:59:59');
            fetchAndRenderCalendar(fetchStartISO, fetchEndISO);

            const calendarApi = calendarRef.current?.getApi();
            if (calendarApi) {
              const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
              if (diffDays > 8) {
                calendarApi.changeView('resourceTimelineCustomMonthly');
              } else if (diffDays === 1) {
                calendarApi.changeView('resourceTimelineDay', start);
              } else {
                calendarApi.changeView('resourceTimelineCustomWeekly');
              }
            }
          }}
        />
      </div>

      <FullCalendar
        ref={calendarRef}
        plugins={[resourceTimelinePlugin, interactionPlugin]}
        initialView="resourceTimelineDay"
        schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
        nowIndicator={true}
        timeZone="local"
        resources={resources}
        events={events}
        eventContent={renderEventContent}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        resourceAreaWidth="210px"
        eventOverlap={true}
        resourceAreaColumns={[
          {
            headerContent: () => {
              return (
                <div>
                  <div style={{ fontWeight: 'bold' }}>Providers</div>
                  <div style={{ height: '1px', margin: '5px 0' }} />
                </div>
              );
            },
            cellContent: renderResourceLabel,
          },
        ]}
        slotLabelFormat={{
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        }}
        headerToolbar={{
          left: '',
          center: 'myPrev,title,myNext',
          right: 'resourceTimelineDay,resourceTimelineWeek,resourceTimelineMonth',
        }}
        customButtons={{
          myPrev: {
            text: '←',
            click: () => handleCustomNavigate(-1),
          },
          myNext: {
            text: '→',
            click: () => handleCustomNavigate(1),
          },
        }}
        views={{
          resourceTimelineDay: {
            slotDuration: '00:10:00',
            slotMinWidth: 10,
            slotLabelInterval: '01:00',
            buttonText: 'Daily',
            slotMinTime: '00:00:00',
            scrollTime: '07:00:00',
          },
          resourceTimelineWeek: {
            slotDuration: '24:00',
            slotLabelFormat: {
              weekday: 'short',
              day: 'numeric',
            },
            buttonText: 'Weekly',
          },
          resourceTimelineMonth: {
            slotDuration: { days: 1 },
            slotLabelFormat: { day: 'numeric' },
            buttonText: 'Monthly',
          },
          resourceTimelineCustomMonthly: {
            type: 'resourceTimeline',
            buttonText: 'Custom Range',
            slotDuration: { days: 1 },
            slotLabelFormat: {
              day: 'numeric',
              month: 'short',
            },
            visibleRange: () => {
              if (customDateRange) {
                const adjustedEnd = new Date(customDateRange.end);
                adjustedEnd.setDate(adjustedEnd.getDate() + 1);
                return {
                  start: customDateRange.start,
                  end: adjustedEnd,
                };
              }
              return { start: new Date(), end: new Date() };
            },
          },
          resourceTimelineCustomWeekly: {
            type: 'resourceTimeline',
            buttonText: 'Custom Range',
            slotDuration: { days: 1 },
            slotLabelFormat: {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            },
            visibleRange: () => {
              if (customDateRange) {
                const adjustedEnd = new Date(customDateRange.end);
                adjustedEnd.setDate(adjustedEnd.getDate() + 1);
                return {
                  start: customDateRange.start,
                  end: adjustedEnd,
                };
              }
              return { start: new Date(), end: new Date() };
            },
          },
        }}
      />

      {selectedEvent && (
        <EventPopup
          event={selectedEvent.event}
          position={selectedEvent.position}
          onClose={() => setSelectedEvent(null)}
          onCancel={handleCancelBooking}
          onEditSubmit={handleEditBooking}
          editLoading={submitLoading}
        />
      )}
    </div>
  );
}
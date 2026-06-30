import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
  createContext,
  useContext,
  forwardRef,
} from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import {
  Card,
  CardContent,
  CardHeader,
} from '@/components/ui/shadcn/card';
import { cn } from '@/lib/utils';

import dayjs from 'dayjs';
import weekday from 'dayjs/plugin/weekday';
import isoWeek from 'dayjs/plugin/isoWeek';
import weekOfYear from 'dayjs/plugin/weekOfYear';
import isToday from 'dayjs/plugin/isToday';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/shadcn/popover';
import UserBase from '@/types/user/UserBase';
import AssetBase from '@/types/equipment/AssetBase';
import { COLORS, dayEventVariants, getWorkOrderCardBorderColor } from '@/lib/colors';
import { EventDetailsCard } from './EventDetailsCard';
import { MaintenanceEventTypes } from '@/config/enum';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

dayjs.extend(weekday);
dayjs.extend(isoWeek);
dayjs.extend(weekOfYear);
dayjs.extend(isToday);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.extend(localizedFormat);

// Calendar Event Type
export type CalendarEvent = {
  id: string;
  event_date: Date;
  title: string;
  color: (typeof COLORS)[number];
  eventDetails: any; // Flexible type for event details (WorkOrder or TaskOccurrence)
};

// View Types
type View = 'day' | 'week' | 'month' | 'year';

// Context Type
type CalendarContextType = {
  view: View;
  setView: (view: View) => void;
  date: dayjs.Dayjs;
  setDate: (date: dayjs.Dayjs) => void;
  events: CalendarEvent[];
  setEvents: (events: CalendarEvent[]) => void;
  selectedDate: dayjs.Dayjs | null;
  setSelectedDate: (date: dayjs.Dayjs | null) => void;
  onDateClick?: (date: dayjs.Dayjs) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onRefresh?: () => Promise<void>;
  today: dayjs.Dayjs;
  assets: AssetBase[];
  users: UserBase[];
  isLoading?: boolean;
};

// Context Creation
const CalendarContext = createContext<CalendarContextType>(
  {} as CalendarContextType
);

// Custom Hook
export const useCalendar = () => {
  const context = useContext(CalendarContext);
  if (!context) {
    throw new Error('useCalendar must be used within a Calendar component');
  }
  return context;
};

// Calendar Provider Component
type CalendarProps = {
  children: React.ReactNode;
  defaultDate?: dayjs.Dayjs | Date;
  defaultView?: View;
  events: CalendarEvent[];
  onDateClick?: (date: dayjs.Dayjs) => void;
  onEventClick?: (event: CalendarEvent) => void;
  onMonthChange?: (date: dayjs.Dayjs) => void;
  onRefresh?: () => Promise<void>;
  assets: AssetBase[];
  users: UserBase[];
  isLoading?: boolean;
};

const Calendar = ({
  children,
  defaultDate = dayjs(),
  defaultView = 'month',
  events: defaultEvents = [],
  onDateClick,
  onEventClick,
  onMonthChange,
  onRefresh,
  assets,
  users,
  isLoading = false,
}: CalendarProps) => {
  const [view, setView] = useState<View>(defaultView);
  const [date, setDate] = useState<dayjs.Dayjs>(dayjs(defaultDate));
  const [events, setEvents] = useState<CalendarEvent[]>(defaultEvents);
  const [selectedDate, setSelectedDate] = useState<dayjs.Dayjs | null>(null);
  const today = dayjs();
  const isMobile = useIsMobile();

  // Set default view to week on mobile
  useEffect(() => {
    if (isMobile) {
      setView('week');
    }
  }, [isMobile]);

  // Track previous month/year to avoid unnecessary callbacks
  const prevMonthYear = useRef<{ month: number; year: number } | null>(null);

  // Sync events when defaultEvents prop changes
  useEffect(() => {
    setEvents(defaultEvents);
  }, [defaultEvents]);

  // Notify parent when month changes (skip initial mount)
  useEffect(() => {
    const currentMonthYear = { month: date.month(), year: date.year() };

    // Only notify if this is not the initial mount and month/year actually changed
    if (
      prevMonthYear.current &&
      (prevMonthYear.current.month !== currentMonthYear.month ||
        prevMonthYear.current.year !== currentMonthYear.year)
    ) {
      onMonthChange?.(date);
    }

    prevMonthYear.current = currentMonthYear;
  }, [date, onMonthChange]);

  const handleDateClick = useCallback(
    (clickedDate: dayjs.Dayjs) => {
      setSelectedDate(clickedDate);
      onDateClick?.(clickedDate);
    },
    [onDateClick]
  );

  return (
    <CalendarContext.Provider
      value={{
        view,
        setView,
        date,
        setDate,
        events,
        setEvents,
        selectedDate,
        setSelectedDate,
        onDateClick: handleDateClick,
        onEventClick,
        onRefresh,
        today,
        assets,
        users,
        isLoading,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
};

// Calendar Header Component
const CalendarHeader = () => {
  const { date, view } = useCalendar();

  const getTitle = () => {
    if (view === 'day') {
      return date.format('dddd, MMMM D, YYYY');
    } else if (view === 'week') {
      const startOfWeek = date.startOf('week');
      const endOfWeek = date.endOf('week');
      return `${startOfWeek.format('D')} - ${endOfWeek.format('D MMM YYYY')}`;
    } else if (view === 'year') {
      return date.format('YYYY');
    } else {
      return date.format('MMMM YYYY');
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <h2 className="text-xl sm:text-2xl font-bold truncate">{getTitle()}</h2>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <CalendarTodayTrigger>Today</CalendarTodayTrigger>
          <div className="flex items-center space-x-1 ml-2">
            <CalendarPrevTrigger>
              <ChevronLeft className="w-4 h-4" />
            </CalendarPrevTrigger>
            <CalendarNextTrigger>
              <ChevronRight className="w-4 h-4" />
            </CalendarNextTrigger>
          </div>
        </div>
        <div className="flex items-center border rounded-md overflow-hidden bg-background">
          <CalendarViewTrigger view="month" className="px-3">
            <CalendarIcon className="w-4 h-4" />
            <span className="ml-1 hidden xs:inline">Month</span>
          </CalendarViewTrigger>
          <CalendarViewTrigger view="week" className="px-3 text-sm">
            Week
          </CalendarViewTrigger>
        </div>
      </div>
    </div>
  );
};

// Navigation Triggers
const CalendarViewTrigger = forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement> & { view: View }
>(({ children, view, className, ...props }, ref) => {
  const { view: currentView, setView } = useCalendar();

  return (
    <Button
      ref={ref}
      size="sm"
      variant={currentView === view ? 'default' : 'ghost'}
      className={cn('rounded-none border-r last:border-r-0', className)}
      onClick={() => setView(view)}
      {...props}
    >
      {children}
    </Button>
  );
});
CalendarViewTrigger.displayName = 'CalendarViewTrigger';

const CalendarPrevTrigger = forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>(({ children, onClick, ...props }, ref) => {
  const { date, setDate, view } = useCalendar();

  const handlePrev = () => {
    switch (view) {
      case 'day':
        setDate(date.subtract(1, 'day'));
        break;
      case 'week':
        setDate(date.subtract(1, 'week'));
        break;
      case 'month':
        setDate(date.subtract(1, 'month'));
        break;
      case 'year':
        setDate(date.subtract(1, 'year'));
        break;
    }
  };

  return (
    <Button
      ref={ref}
      size="sm"
      variant="outline"
      onClick={(e) => {
        handlePrev();
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </Button>
  );
});
CalendarPrevTrigger.displayName = 'CalendarPrevTrigger';

const CalendarNextTrigger = forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>(({ children, onClick, ...props }, ref) => {
  const { date, setDate, view } = useCalendar();

  const handleNext = () => {
    switch (view) {
      case 'day':
        setDate(date.add(1, 'day'));
        break;
      case 'week':
        setDate(date.add(1, 'week'));
        break;
      case 'month':
        setDate(date.add(1, 'month'));
        break;
      case 'year':
        setDate(date.add(1, 'year'));
        break;
    }
  };

  return (
    <Button
      ref={ref}
      size="sm"
      variant="outline"
      onClick={(e) => {
        handleNext();
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </Button>
  );
});
CalendarNextTrigger.displayName = 'CalendarNextTrigger';

const CalendarTodayTrigger = forwardRef<
  HTMLButtonElement,
  React.HTMLAttributes<HTMLButtonElement>
>(({ children, onClick, ...props }, ref) => {
  const { setDate, today } = useCalendar();

  return (
    <Button
      ref={ref}
      variant="outline"
      size="sm"
      onClick={(e) => {
        setDate(today);
        onClick?.(e);
      }}
      {...props}
    >
      {children}
    </Button>
  );
});
CalendarTodayTrigger.displayName = 'CalendarTodayTrigger';

// Selected Date Display
const CalendarSelectedDate = () => {
  const { selectedDate, events } = useCalendar();

  if (!selectedDate) return null;

  const dayEvents = events.filter((event) =>
    dayjs(event.event_date).isSame(selectedDate, 'day')
  );

  return (
    <div className="p-3 bg-muted rounded-md">
      <p className="text-sm font-medium">
        {selectedDate.format('dddd, MMMM D, YYYY')}
      </p>
      {dayEvents.length > 0 && (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted-foreground">Events:</p>
          {dayEvents.map((event) => (
            <div
              key={event.id}
              className={cn(
                'text-xs px-2 py-1 rounded inline-block mr-1',
                dayEventVariants[event.color]
              )}
            >
              {event.title}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Event Popover Component
const EventPopover = ({
  event,
  children,
}: {
  event: CalendarEvent;
  children: React.ReactNode;
}) => {
  const { assets, users, onRefresh } = useCalendar();
  const [open, setOpen] = useState(false);

  const asset = assets.find((a) => a.id === event.eventDetails?.assetId);
  const workOrder = event.eventDetails?.workOrder;
  const occurrence = event.eventDetails?.occurrence;
  const isWorkOrder = event.eventDetails?.type === MaintenanceEventTypes.WorkOrder;
  const assignedUserEmails = isWorkOrder
    ? workOrder?.assignedUserEmails
    : occurrence?.assignedUserEmails;
  const assignedUsers = users.filter((u) =>
    assignedUserEmails?.includes(u.email)
  );

  const handleConvertToWorkOrder = async () => {
    if (onRefresh) {
      await onRefresh();
    }
    setOpen(false); // Close popover after refresh
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="p-0 w-100" align="center" sideOffset={8}>
        <EventDetailsCard
          title={event.title}
          description={event.eventDetails?.description}
          date={event.event_date.toString()}
          assetName={asset?.name}
          isWorkOrder={isWorkOrder}
          workOrderId={workOrder?.id}
          taskId={occurrence?.taskId}
          occurrenceDate={occurrence?.occurrenceDate}
          status={workOrder?.status}
          assignedUsers={assignedUsers}
          showDate={true}
          compact={true}
          className="max-w-xl min-w-0"
          onConvertToWorkOrder={
            !isWorkOrder && occurrence?.taskId
              ? handleConvertToWorkOrder
              : undefined
          }
        />
      </PopoverContent>
    </Popover>
  );
};

// More Events Popover Component
const MoreEventsPopover = ({
  date,
  events,
  children,
}: {
  date: dayjs.Dayjs;
  events: CalendarEvent[];
  children: React.ReactNode;
}) => {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-1.5rem)] sm:w-80 p-0 overflow-hidden" align="start" sideOffset={8}>
        <div className="p-4">
          <div className="flex items-start justify-between mb-3 gap-3">
            <h3 className="font-semibold">
              {date.format('dddd, MMMM D, YYYY')}
            </h3>
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              {events.length} events
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {events.map((event) => {
              const isWorkOrder = event.eventDetails?.type === MaintenanceEventTypes.WorkOrder;
              const status = event.eventDetails?.workOrder?.status;

              return (
                <EventPopover key={event.id} event={event}>
                  <div
                    className={cn(
                      'text-xs px-1 py-0.5 rounded truncate w-full text-left cursor-pointer',
                      'bg-muted text-muted-foreground transition-colors hover:bg-muted/50 font-medium',
                      getWorkOrderCardBorderColor(status, isWorkOrder, true)
                    )}
                  >
                    {event.title}
                  </div>
                </EventPopover>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Month View
const CalendarMonthView = () => {
  const { view, date, events, onDateClick, selectedDate, today, isLoading } =
    useCalendar();

  const getDaysInMonth = useMemo(() => {
    const startOfMonth = date.startOf('month');
    const endOfMonth = date.endOf('month');
    const startOfCalendar = startOfMonth.startOf('week');
    const endOfCalendar = endOfMonth.endOf('week');

    const days: { date: dayjs.Dayjs; isCurrentMonth: boolean }[] = [];
    let current = startOfCalendar;

    while (current.isSameOrBefore(endOfCalendar, 'day')) {
      days.push({
        date: current,
        isCurrentMonth: current.month() === date.month(),
      });
      current = current.add(1, 'day');
    }

    return days;
  }, [date]);

  if (view !== 'month') return null;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDate = (checkDate: dayjs.Dayjs) =>
    events.filter((event) => dayjs(event.event_date).isSame(checkDate, 'day'));

  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="grid grid-cols-7 gap-px border-b mb-2">
          {dayNames.map((day) => (
            <div
              key={day}
              className="p-2 text-center font-medium text-sm text-muted-foreground"
            >
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 flex-1">
          {Array.from({ length: getDaysInMonth.length }).map((_, index) => (
            <div
              key={index}
              className="h-30 p-2 flex flex-col items-start justify-start border rounded-md"
            >
              <Skeleton className="h-4 w-6 mb-1" />
              <div className="w-full space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="grid grid-cols-7 gap-px border-b mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className="p-2 text-center font-medium text-sm text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1 flex-1">
        {getDaysInMonth.map((dayObj, index) => {
          const isSelected =
            selectedDate && dayObj.date.isSame(selectedDate, 'day');
          const isToday = dayObj.date.isSame(today, 'day');
          const dayEvents = getEventsForDate(dayObj.date);

          return (
            <div
              key={`calendar-field-${index}`}
              style={
                !dayObj.isCurrentMonth
                  ? { backgroundColor: 'rgb(0, 0, 0)' }
                  : undefined
              }
              className={cn(
                'cursor-pointer whitespace-nowrap rounded-md text-sm font-medium h-30 p-2 flex flex-col items-start justify-start relative transition-all duration-200 border',
                dayObj.isCurrentMonth
                  ? 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  : 'text-muted-foreground',
                isToday ? 'bg-sidebar-primary text-sidebar-primary-foreground font-bold' : '',
                isSelected ? 'bg-accent text-accent-foreground' : ''
              )}
              onClick={() => onDateClick?.(dayObj.date)}
            >
              <span className={cn('text-sm mb-1')}>{dayObj.date.date()}</span>
              <div className="w-full space-y-1 overflow-hidden">
                {dayEvents.slice(0, 2).map((event) => {
                  const isWorkOrder = event.eventDetails?.type === MaintenanceEventTypes.WorkOrder;
                  const status = event.eventDetails?.workOrder?.status;

                  return (
                    <EventPopover key={`${event.id}-${event.eventDetails.type}`} event={event}>
                      <div
                        className={cn(
                          'text-xs px-1 py-0.5 rounded truncate text-left cursor-pointer',
                          'bg-transparent transition-colors',
                          getWorkOrderCardBorderColor(status, isWorkOrder, true)
                        )}
                      >
                        {event.title}
                      </div>
                    </EventPopover>
                  );
                })}
                {dayEvents.length > 2 && (
                  <MoreEventsPopover
                    date={dayObj.date}
                    events={dayEvents.slice(2)}
                  >
                    <div className="text-xs text-muted-foreground">
                      +{dayEvents.length - 2} more
                    </div>
                  </MoreEventsPopover>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Week View
const CalendarWeekView = () => {
  const { view, date, onDateClick, selectedDate, today, events } =
    useCalendar();

  const getWeekDays = useMemo(() => {
    const startOfWeek = date.startOf('week');
    return Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'));
  }, [date]);

  if (view !== 'week') return null;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDate = (checkDate: dayjs.Dayjs) =>
    events.filter((event) => dayjs(event.event_date).isSame(checkDate, 'day'));

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3">
        {getWeekDays.map((weekDate, index) => {
          const isSelected = selectedDate && weekDate.isSame(selectedDate, 'day');
          const isToday = weekDate.isSame(today, 'day');
          const dayEvents = getEventsForDate(weekDate);

          return (
            <div
              key={index}
              className={cn(
                'flex items-start gap-4 p-3 rounded-lg border transition-all duration-200',
                isToday ? 'bg-primary/5 border-primary/20' : 'bg-background hover:bg-muted/30',
                isSelected ? 'ring-2 ring-primary ring-offset-2' : ''
              )}
            >
              <div
                className={cn(
                  "flex flex-col items-center justify-center min-w-[60px] h-full py-1 rounded-md cursor-pointer",
                  isToday ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}
                onClick={() => onDateClick?.(weekDate)}
              >
                <span className="text-[10px] uppercase font-bold tracking-tighter opacity-80">
                  {dayNames[weekDate.day()]}
                </span>
                <span className="text-xl font-bold leading-none">
                  {weekDate.date()}
                </span>
              </div>

              <div className="flex-1 min-h-[60px]">
                {dayEvents.length === 0 ? (
                  <div className="h-full flex items-center">
                    <p className="text-xs text-muted-foreground italic">
                      No events scheduled
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {dayEvents.map((event) => {
                      const isWorkOrder = event.eventDetails?.type === MaintenanceEventTypes.WorkOrder;
                      const status = event.eventDetails?.workOrder?.status;

                      return (
                        <EventPopover key={event.id} event={event}>
                          <div
                            className={cn(
                              'text-xs p-2 rounded-md border-l-4 cursor-pointer transition-all hover:translate-x-1 flex flex-col gap-1',
                              'bg-muted/40 text-foreground hover:bg-muted/60',
                              getWorkOrderCardBorderColor(status, isWorkOrder, true)
                            )}
                          >
                            <span className="font-semibold line-clamp-1">{event.title}</span>
                            {event.eventDetails?.description && (
                              <span className="text-[10px] text-muted-foreground line-clamp-1 opacity-80">
                                {event.eventDetails.description}
                              </span>
                            )}
                          </div>
                        </EventPopover>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Day View
const _CalendarDayView = () => {
  const { view, date, events } = useCalendar();

  if (view !== 'day') return null;

  const dayEvents = events.filter((event) =>
    dayjs(event.event_date).isSame(date, 'day')
  );

  const allDayEvents = dayEvents.filter(e => {
    const d = dayjs(e.event_date);
    return d.hour() === 0 && d.minute() === 0 && d.second() === 0;
  });

  const timedEvents = dayEvents.filter(e => {
    const d = dayjs(e.event_date);
    return !(d.hour() === 0 && d.minute() === 0 && d.second() === 0);
  });

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold border-b pb-2">{date.format('dddd, MMMM D')}</h3>

      {/* All Day / General Events */}
      {allDayEvents.length > 0 && (
        <div className="bg-muted/30 rounded-lg p-4 border border-dashed border-muted-foreground/20">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">All Day / General</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {allDayEvents.map((event) => {
              const isWorkOrder = event.eventDetails?.type === MaintenanceEventTypes.WorkOrder;
              const status = event.eventDetails?.workOrder?.status;

              return (
                <EventPopover key={event.id} event={event}>
                  <div
                    className={cn(
                      'px-3 py-2 rounded-md text-sm border-l-4 cursor-pointer transition-all hover:translate-x-1',
                      'bg-background shadow-sm',
                      getWorkOrderCardBorderColor(status, isWorkOrder, true)
                    )}
                  >
                    <p className="font-medium truncate">{event.title}</p>
                    {event.eventDetails?.description && (
                      <p className="text-xs text-muted-foreground truncate opacity-70 mt-0.5">
                        {event.eventDetails.description}
                      </p>
                    )}
                  </div>
                </EventPopover>
              );
            })}
          </div>
        </div>
      )}

      {/* Hourly Timeline */}
      <div className="space-y-1">
        {Array.from({ length: 24 }, (_, hour) => hour).map((hour) => {
          const hourEvents = timedEvents.filter((e) => dayjs(e.event_date).hour() === hour);

          return (
            <div
              key={hour}
              className="flex items-start space-x-4 group"
            >
              <span className="text-xs font-medium text-muted-foreground w-16 py-3 text-right sticky left-0">
                {dayjs().hour(hour).minute(0).format('h A')}
              </span>
              <div className={cn(
                "flex-1 min-h-[60px] border-t border-border/40 py-2 transition-colors group-hover:bg-muted/10 relative",
                hourEvents.length > 0 ? "bg-muted/5" : ""
              )}>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {hourEvents.map((event) => {
                    const isWorkOrder = event.eventDetails?.type === MaintenanceEventTypes.WorkOrder;
                    const status = event.eventDetails?.workOrder?.status;

                    return (
                      <EventPopover key={event.id} event={event}>
                        <div
                          className={cn(
                            'px-2 py-1.5 rounded text-sm border-l-4 cursor-pointer transition-all hover:scale-[1.02]',
                            'bg-background shadow-sm border',
                            getWorkOrderCardBorderColor(status, isWorkOrder, true)
                          )}
                        >
                          <p className="font-medium truncate text-xs">{event.title}</p>
                        </div>
                      </EventPopover>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Main Calendar Component
const InteractiveCalendar: React.FC<Omit<CalendarProps, 'children'>> = ({
  events = [],
  defaultDate = dayjs(),
  defaultView = 'month',
  onDateClick,
  onEventClick,
  onMonthChange,
  onRefresh,
  assets = [],
  users = [],
  isLoading = false,
}) => {
  return (
    <Calendar
      defaultDate={defaultDate}
      defaultView={defaultView}
      events={events}
      onDateClick={onDateClick}
      onEventClick={onEventClick}
      onMonthChange={onMonthChange}
      onRefresh={onRefresh}
      assets={assets}
      users={users}
      isLoading={isLoading}
    >
      <Card className="w-full">
        <CardHeader className="space-y-4">
          <CalendarHeader />
          {/* <CalendarSelectedDate /> */}
        </CardHeader>
        <CardContent className="min-h-[600px] overflow-auto py-2">
          <CalendarMonthView />
          <CalendarWeekView />
        </CardContent>
      </Card>
    </Calendar>
  );
};

export default InteractiveCalendar;

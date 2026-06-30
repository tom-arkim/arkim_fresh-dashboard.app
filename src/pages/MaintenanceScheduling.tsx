import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';

import maintenanceTaskService from '@/services/api/maintenanceTaskService';
import workOrderService from '@/services/api/workOrderService';
import { TaskOccurrence } from '@/types/maintenance/MaintenanceTask';
import { WorkOrder } from '@/types/maintenance/WorkOrder';
import UserBase from '@/types/user/UserBase';
import AssetBase from '@/types/equipment/AssetBase';
import InteractiveCalendar, {
  CalendarEvent,
} from '@/components/maintenance/Calendar';
import dayjs from 'dayjs';
import { createHashFromString } from '@/lib/utils';
import { COLORS } from '@/lib/colors';

import useSiteStore from '@/store/siteStore';
import useDataStore from '@/store/dataStore';
import { logger } from '@/lib/logger';
import { EventDetailsCard, EventDetailsCardSkeleton } from '@/components/maintenance/EventDetailsCard';
import { MaintenanceEventTypes } from '@/config/enum';
import { debounce } from 'lodash';
import { useMaintenanceScheduleBroadcast } from '@/hooks/broadcasts/use-maintenance-schedule-broadcast';

interface CombinedEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  assetId: string;
  assetName: string;
  assignedUserEmails: string[];
  type: MaintenanceEventTypes;
  workOrder?: WorkOrder;
  occurrence?: TaskOccurrence;
}

const MaintenanceScheduling: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<CombinedEvent[]>([]);
  const { users: availableUsers, assets: availableAssets, assetMap, userMap } = useDataStore();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const { currentSite } = useSiteStore();

  const { requestMaintenanceScheduleRefresh } = useMaintenanceScheduleBroadcast((event) => {
    if (event.type === 'MAINTENANCE_SCHEDULE_REFRESHED') {
      fetchEvents(currentMonth);
    }
  });


  // Fetch maintenance events (work orders + task occurrences)
  const fetchEvents = useCallback(
    async (month: dayjs.Dayjs) => {
      try {
        setLoading(true);
        setEvents([]);
        if (!currentSite || !currentSite.id || availableAssets.length === 0) {
          if (!currentSite) {
            setLoading(false);
          }
          return;
        }
        setRefreshing(true);

        // For work orders: use full calendar range
        const calendarStartDate = month.startOf('month').format('YYYY-MM-DD');
        const calendarEndDate = month.endOf('month').format('YYYY-MM-DD');

        // For occurrences: use Max(today, firstDateInCalendar)
        const firstDateInCalendar = month.startOf('month');
        const today = dayjs().startOf('day');
        const occurrenceStartDate = firstDateInCalendar.isAfter(today)
          ? firstDateInCalendar.format('YYYY-MM-DD')
          : today.format('YYYY-MM-DD');

        // Fetch both work orders and task occurrences in parallel
        const [workOrders, taskOccurrences] = await Promise.all([
          workOrderService.list(
            currentSite.id,
            undefined,
            undefined,
            calendarStartDate,
            calendarEndDate
          ),
          maintenanceTaskService.listOccurrences(
            occurrenceStartDate,
            calendarEndDate,
            currentSite.id
          ),
        ]);

        // Combine work orders and occurrences
        const combinedEvents: CombinedEvent[] = [
          // Materialized work orders
          ...workOrders.map((wo) => ({
            id: wo.id,
            date: wo.dueDate,
            title: wo.title,
            description: wo.description || '',
            assetId: wo.assetId,
            assetName: wo.assetName,
            assignedUserEmails: wo.assignedUserEmails || [],
            type: MaintenanceEventTypes.WorkOrder,
            workOrder: wo,
          })),
          // Non-materialized task occurrences
          ...taskOccurrences.map((occ) => ({
            id: `occurrence-${occ.assetId}-${occ.occurrenceDate}-${occ.taskId}`,
            date: occ.occurrenceDate,
            title: occ.title,
            description: occ.description,
            assetId: occ.assetId,
            assetName: assetMap[occ.assetId]?.name || occ.assetId,
            assignedUserEmails: occ.assignedUserEmails,
            type: MaintenanceEventTypes.TaskOccurrence,
            occurrence: occ,
          })),
        ];

        // Sort by date
        combinedEvents.sort((a, b) => a.date.localeCompare(b.date));

        setEvents(combinedEvents);
      } catch (error) {
        logger.error('Error fetching maintenance events:', error);
        setEvents([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [currentSite, availableAssets]
  );

  // Handle converting task occurrence to work order
  const handleConvertToWorkOrder = async () => {
    // Refresh events to show the new work order
    await fetchEvents(currentMonth);
  };

  // Fetch events when current month changes or assets are loaded
  useEffect(() => {
    if (availableAssets.length > 0) {
      fetchEvents(currentMonth);
    }
  }, [currentMonth, availableAssets.length, fetchEvents]);

  // Filter events based on search term
  const filteredEvents = useMemo(() => {
    return events;
  }, [events]);

  // Create calendar events
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return filteredEvents.map((event) => {
      const isWorkOrder = event.type === MaintenanceEventTypes.WorkOrder;
      const colorIndex = createHashFromString(event.assetId);

      return {
        id: event.id,
        event_date: dayjs(event.date).toDate(),
        title: event.title,
        color: isWorkOrder
          ? COLORS[colorIndex % COLORS.length]
          : COLORS[(colorIndex + 5) % COLORS.length],
        eventDetails: event as unknown, // Placeholder for compatibility
      };
    });
  }, [filteredEvents]);

  const debouncedSetMonth = useMemo(
    () =>
      debounce((month: dayjs.Dayjs) => {
        setCurrentMonth(month);
      }, 500),
    []
  );

  const handleMonthChange = useCallback(
    (newMonth: dayjs.Dayjs) => {
      setLoading(true);
      debouncedSetMonth(newMonth);
    },
    [debouncedSetMonth]
  );
  // Handle refresh
  const handleRefresh = async () => {
    requestMaintenanceScheduleRefresh();
    await fetchEvents(currentMonth);
  };

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header">{t('maintenance.planning.title')}</h1>
          <p className="page-subTitle">{t('maintenance.planning.subTitle')}</p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`}
            />
            {t('common.refresh')}
          </Button>
        </div>
      </div>

      <InteractiveCalendar
        defaultDate={currentMonth}
        events={calendarEvents}
        assets={availableAssets}
        users={availableUsers}
        onMonthChange={handleMonthChange}
        onRefresh={handleRefresh}
        isLoading={loading}
      />

      {/* Events List */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <EventDetailsCardSkeleton key={index} />
          ))}
        </div>
      ) : filteredEvents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('maintenance.planning.noEvents')}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {t('maintenance.planning.noEventsDescription')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event, index) => {
            const isWorkOrder = event.type === MaintenanceEventTypes.WorkOrder;
            const workOrder = event.workOrder;
            const assignedUserEmails = isWorkOrder
              ? workOrder?.assignedUserEmails
              : event.occurrence?.assignedUserEmails;
            const assignedUsers = availableUsers.filter((u) =>
              assignedUserEmails?.includes(u.email)
            );

            return (
              <EventDetailsCard
                key={`${event.id}-${index}`}
                title={event.title}
                description={event.description}
                date={event.date}
                assetName={event.assetName}
                isWorkOrder={isWorkOrder}
                workOrderId={workOrder?.id}
                taskId={event.occurrence?.taskId}
                occurrenceDate={event.occurrence?.occurrenceDate}
                status={workOrder?.status}
                assignedUsers={assignedUsers}
                showDate={true}
                compact={false}
                onConvertToWorkOrder={
                  !isWorkOrder && event.occurrence?.taskId
                    ? handleConvertToWorkOrder
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MaintenanceScheduling;

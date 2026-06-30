import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, RefreshCw } from 'lucide-react';

import { Button } from '@/components/ui/shadcn/button';
import { Card, CardContent } from '@/components/ui/shadcn/card';

import maintenanceTaskServiceV2 from '@/services/api/maintenanceTaskService';
import workOrderService from '@/services/api/workOrderService';
import { TaskOccurrence } from '@/types/maintenance/MaintenanceTask';
import { WorkOrder } from '@/types/maintenance/WorkOrder';
import dayjs from 'dayjs';

import CompactLoader from '@/components/ui/CompactLoader';
import useSiteStore from '@/store/siteStore';
import { logger } from '@/lib/logger';
import { MaintenanceEventTypes } from '@/config/enum';

interface CombinedEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  assetId: string;
  type: MaintenanceEventTypes;
  workOrder?: WorkOrder;
  occurrence?: TaskOccurrence;
}

const MaintenancePlanning: React.FC = () => {
  const { t } = useTranslation();
  const [events, setEvents] = useState<CombinedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  const { currentSite } = useSiteStore();

  // Fetch work orders and task occurrences for the selected month
  const fetchEvents = useCallback(async () => {
    try {
      if (!currentSite?.id) {
        setEvents([]);
        setLoading(false);
        return;
      }

      setRefreshing(true);

      // Get month boundaries
      const startDate = dayjs(selectedMonth)
        .startOf('month')
        .format('YYYY-MM-DD');
      const endDate = dayjs(selectedMonth).endOf('month').format('YYYY-MM-DD');

      // Fetch both work orders and task occurrences in parallel
      const [workOrders, taskOccurrences] = await Promise.all([
        workOrderService.list(currentSite.id),
        maintenanceTaskServiceV2.listOccurrences(
          startDate,
          endDate,
          currentSite.id
        ),
      ]);

      // Filter work orders for the selected month
      const monthWorkOrders = workOrders.filter((wo) => {
        const woDate = dayjs(wo.dueDate);
        return (
          woDate.isSameOrAfter(startDate, 'day') &&
          woDate.isSameOrBefore(endDate, 'day')
        );
      });

      // Combine work orders and occurrences
      const combinedEvents: CombinedEvent[] = [
        // Materialized work orders
        ...monthWorkOrders.map((wo) => ({
          id: wo.id,
          date: wo.dueDate,
          title: wo.title,
          description: wo.description || '',
          assetId: wo.assetId,
          type: MaintenanceEventTypes.WorkOrder,
          workOrder: wo,
        })),
        // Non-materialized task occurrences
        ...taskOccurrences.map((occ) => ({
          id: `occurrence-${occ.assetId}-${occ.occurrenceDate}`,
          date: occ.occurrenceDate,
          title: occ.title,
          description: occ.description,
          assetId: occ.assetId,
          type: MaintenanceEventTypes.TaskOccurrence,
          occurrence: occ,
        })),
      ];

      // Sort by date
      combinedEvents.sort((a, b) => a.date.localeCompare(b.date));

      setEvents(combinedEvents);
    } catch (error) {
      logger.error('Error fetching maintenance planning events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedMonth, currentSite]);

  // Initial load and refresh when month or site changes
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle refresh
  const handleRefresh = () => {
    fetchEvents();
  };

  // Summary statistics
  const stats = useMemo(() => {
    const workOrderCount = events.filter((e) => e.type === MaintenanceEventTypes.WorkOrder).length;
    const occurrenceCount = events.filter(
      (e) => e.type === MaintenanceEventTypes.TaskOccurrence
    ).length;

    return {
      total: events.length,
      workOrders: workOrderCount,
      occurrences: occurrenceCount,
    };
  }, [events]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <CompactLoader loadingMessage={t('common.loading')} />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-header flex items-center gap-2">
            <CalendarDays className="h-6 w-6" />
            {t('maintenance.planning.title')}
          </h1>
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

      {/* Summary Stats */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t('maintenance.planning.totalEvents')}
              </p>
              <p className="text-lg font-bold">{stats.total}</p>
            </div>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t('maintenance.planning.workOrders')}
              </p>
              <p className="text-lg font-bold">{stats.workOrders}</p>
              <p className="text-xs text-muted-foreground">
                {t('maintenance.planning.materialized')}
              </p>
            </div>
            <div className="h-3 w-3 rounded-full bg-blue-500" />
          </div>
        </Card>

        <Card className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                {t('maintenance.planning.plannedTasks')}
              </p>
              <p className="text-lg font-bold">{stats.occurrences}</p>
              <p className="text-xs text-muted-foreground">
                {t('maintenance.planning.fromSchedule')}
              </p>
            </div>
            <div className="h-3 w-3 rounded-full bg-gray-400" />
          </div>
        </Card>
      </div>

      {/* Month Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedMonth(
                  dayjs(selectedMonth).subtract(1, 'month').toDate()
                )
              }
            >
              &larr; Previous
            </Button>
            <h3 className="text-lg font-medium">
              {dayjs(selectedMonth).format('MMMM YYYY')}
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setSelectedMonth(dayjs(selectedMonth).add(1, 'month').toDate())
              }
            >
              Next &rarr;
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {events.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <CalendarDays className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {t('maintenance.planning.noEvents')}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {t('maintenance.planning.noEventsDescription')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium mb-3">
                {t('maintenance.planning.eventsForMonth', {
                  month: dayjs(selectedMonth).format('MMMM YYYY'),
                })}
              </h3>
              {events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div
                    className={`h-10 w-1 rounded-full flex-shrink-0 ${event.type === MaintenanceEventTypes.WorkOrder ? 'bg-blue-500' : 'bg-gray-400'
                      }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">
                        {event.title}
                      </p>
                      <span className="text-xs text-muted-foreground ml-2">
                        {dayjs(event.date).format('MMM D, YYYY')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {event.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${event.type === MaintenanceEventTypes.WorkOrder
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                      >
                        {event.type === MaintenanceEventTypes.WorkOrder
                          ? t('maintenance.planning.workOrder')
                          : t('maintenance.planning.planned')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MaintenancePlanning;

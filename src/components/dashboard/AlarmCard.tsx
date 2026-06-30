import React, { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/shadcn/button';
import { Badge } from '@/components/ui/shadcn/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Skeleton } from '@/components/ui/shadcn/skeleton';
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { isApiError } from '@/lib/utils';
import useSiteStore from '@/store/siteStore';
import { AlertPriority } from '@/config/enum';

// Priority configuration using theme-friendly variants
const priorityConfig = {
  [AlertPriority.High]: {
    label: 'Critical',
    icon: AlertTriangle,
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
  },
  [AlertPriority.Medium]: {
    label: 'Warning',
    icon: AlertCircle,
    textColor: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
  },
  [AlertPriority.Low]: {
    label: 'Info',
    icon: CheckCircle,
    textColor: 'text-green-700',
    bgColor: 'bg-green-50',
  },
};

// Mock data for UI development
const MOCK_ALERTS = [
  {
    id: '1',
    assetName: 'Cooling Tower D',
    assetType: 'Cooling System',
    description: 'Temperature exceeding threshold (72°C)',
    priority: AlertPriority.High,
    timeAgo: '10 minutes ago',
    acknowledged: false,
  },
  {
    id: '2',
    assetName: 'Pump Station B',
    assetType: 'Pump',
    description: 'Vibration levels increasing (1.7)',
    priority: AlertPriority.Medium,
    timeAgo: '45 minutes ago',
    acknowledged: false,
  },
  {
    id: '3',
    assetName: 'Compressor A',
    assetType: 'Compressor',
    description: 'Scheduled maintenance due in 5 days',
    priority: AlertPriority.Low,
    timeAgo: '2 hours ago',
    acknowledged: false,
  },
  {
    id: '4',
    assetName: 'Conveyor Belt C',
    assetType: 'Conveyor',
    description: 'Performance optimization recommended',
    priority: AlertPriority.Low,
    timeAgo: '3 hours ago',
    acknowledged: false,
  },
];

const AlarmCard: React.FC = () => {
  const [loader, setLoader] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const navigate = useNavigate();

  const { currentSite } = useSiteStore();

  const getAlertsForTheDashboard = useCallback(async () => {
    try {
      if (!currentSite) return;
      setLoader(true);
      setError(null);
      // TODO: Map real data to alert format when API is ready
      // const response = await alertService.list(currentSite.id!);
      // setAlerts(mappedData);
    } catch (error: any) {
      if (isApiError(error)) {
        setError(
          error.message ?? 'Failed to load equipment status. Please try again.'
        );
      }
    } finally {
      setLoader(false);
    }
  }, [currentSite]);

  const handleAcknowledgeAll = () => {
    setAlerts(alerts.map(alert => ({ ...alert, acknowledged: true })));
  };

  const handleAcknowledge = (id: string) => {
    setAlerts(alerts.map(alert =>
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ));
  };

  const handleAlertClick = (alertId: string) => {
    navigate('/notifications');
  };

  const getPriorityConfig = (priority: AlertPriority) => {
    return priorityConfig[priority] || priorityConfig[AlertPriority.Low];
  };

  // Compact card view for each alert
  const AlertCompactCard = ({ alert }: { alert: typeof MOCK_ALERTS[0] }) => {
    const config = getPriorityConfig(alert.priority);
    const Icon = config.icon;

    return (
      <div
        onClick={() => handleAlertClick(alert.id)}
        className={`border rounded-lg p-3 mb-2 cursor-pointer hover:bg-accent transition-colors ${alert.acknowledged ? 'opacity-60' : ''
          }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <div className="shrink-0 mt-0.5">
              <Icon className={`h-4 w-4 ${config.textColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold mb-0.5">
                {alert.assetName}
              </h3>
              <p className="text-xs text-muted-foreground mb-1.5">
                {alert.description}
              </p>
              <p className="text-xs text-muted-foreground">
                {alert.timeAgo}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Badge
              className={`font-semibold text-xs ${config.bgColor} ${config.textColor}`}
            >
              {config.label}
            </Badge>
            {!alert.acknowledged && (
              <Button
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleAcknowledge(alert.id);
                }}
                className="text-xs h-6 px-2"
              >
                Ack
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  useEffect(() => {
    getAlertsForTheDashboard();
  }, [getAlertsForTheDashboard]);

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>System Alerts</CardTitle>
          <p className="text-muted-foreground">{error}</p>
        </CardHeader>
      </Card>
    );
  }

  // Loading state
  if (loader) {
    return (
      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3">
          <div className="space-y-2">
            <CardTitle className="text-lg font-bold">
              <Skeleton className="h-6 w-64" />
            </CardTitle>
          </div>
          <Skeleton className="h-9 w-32" />
        </CardHeader>
        <CardContent className="p-0">
          <div className="px-4 pb-4">
            <div className="max-h-[450px] overflow-y-auto pr-2 space-y-0">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="border rounded-lg p-4 mb-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1">
                      <Skeleton className="h-5 w-5" />
                      <div className="flex-1">
                        <Skeleton className="h-5 w-40 mb-2" />
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <Skeleton className="h-7 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Main content
  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3">
        <CardTitle className="text-lg font-bold">
          Active Alerts
        </CardTitle>
        <Button
          onClick={handleAcknowledgeAll}
          className="w-full sm:w-auto text-sm"
          size="sm"
        >
          Acknowledge All
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-4 pb-4">
          <div className="max-h-[450px] overflow-y-auto pr-2 space-y-0">
            {alerts.map((alert) => (
              <AlertCompactCard key={alert.id} alert={alert} />
            ))}
            {alerts.length === 0 && (
              <div className="flex items-center justify-center h-[450px]">
                <span className="text-lg text-muted-foreground">
                  No alerts found
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlarmCard;
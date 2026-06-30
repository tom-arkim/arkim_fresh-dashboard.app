import useSiteStore from "@/store/siteStore";
import dayjs from "dayjs";
import { CheckCircle, Clock, Minus, TrendingDown, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import CompactLoader from "@/components/ui/CompactLoader";
import { Badge } from "@/components/ui/shadcn/badge";

const VFDMonitoring = () => {
  const [selectedPumpIdx, setSelectedPumpIdx] = useState<number>(0);
  const [loading, setIsLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<any | null>(null);
  const { currentSite } = useSiteStore();

  const getStatusBadgeColor = (statusCode: string) => {
    if (statusCode === 'NORMAL')
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (statusCode === 'HIGH_ACTIVITY')
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    if (statusCode === 'LOW_ACTIVITY')
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  const getStatusBorderColor = (statusCode: string) => {
    if (statusCode === 'NORMAL')
      return 'border-green-200 dark:border-green-800';
    if (statusCode === 'HIGH_ACTIVITY')
      return 'border-red-200 dark:border-red-800';
    if (statusCode === 'LOW_ACTIVITY')
      return 'border-yellow-200 dark:border-yellow-800';
    return 'border-gray-200 dark:border-gray-800';
  };

  const getStatusColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      green: 'bg-green-500',
      red: 'bg-red-500',
      blue: 'bg-blue-500',
      yellow: 'bg-yellow-500',
    };
    return colorMap[color] || 'bg-gray-500';
  };

  const getTrendIcon = (pct: number) => {
    if (pct > 0)
      return <TrendingUp className="h-3 w-3 text-muted-foreground" />;
    if (pct < 0)
      return <TrendingDown className="h-3 w-3 text-muted-foreground" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getPercentageColor = (color: string) => {
    const colorMap: { [key: string]: string } = {
      green: 'text-green-500',
      red: 'text-red-500',
      blue: 'text-blue-500',
      yellow: 'text-yellow-500',
    };
    return colorMap[color] || 'text-gray-500';
  };

  const getLastUpdatedDisplay = () => {
    if (!apiResponse?.lastUpdated) return '';
    const date = dayjs(apiResponse.lastUpdated);
    return date.format('DD MMMM YYYY, h:mm A');
  };

  const pumps = useMemo(() => {
    if (!apiResponse) return [];
    return apiResponse.performanceOverview ?? [];
  }, [apiResponse]);

  const currentSelectedPump = useMemo(() => {
    return pumps[selectedPumpIdx];
  }, [pumps, selectedPumpIdx]);

  const lastUpdatedTime = useMemo(() => {
    if (!currentSelectedPump) return '';
    return dayjs(currentSelectedPump.pumpDetail.lastRunTime).format(
      'DD MMMM YYYY, h:mm A'
    );
  }, [currentSelectedPump]);

  const efficiencyStats = useMemo(() => {
    return {
      moreEfficient: pumps.filter((p: any) => p.efficiencyChangePercent < -10)
        .length,
      same: pumps.filter((p: any) => Math.abs(p.efficiencyChangePercent) <= 10)
        .length,
      lessEfficient: pumps.filter((p: any) => p.efficiencyChangePercent > 10).length,
    };
  }, [pumps]);

  if (!apiResponse || loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-background">
        {/* Left Panel */}
        <Card>
          <CardHeader>
            <CardTitle>Pump Performance Overview</CardTitle>
            <CardDescription>
              Click a pump to view detailed monitoring • Percentages show
              current 24h vs. historical average
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CompactLoader />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">VFD Pump Monitoring</CardTitle>
            <CardDescription className="text-lg">-</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <CompactLoader />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-background">
      {/* Left Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Pump Performance Overview</CardTitle>
          <CardDescription>
            Click a pump to view detailed monitoring • Percentages show current
            24h vs. historical average
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pumps.map((pump: any, idx: number) => (
            <button
              key={idx}
              onClick={() => setSelectedPumpIdx(idx)}
              className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all cursor-pointer ${selectedPumpIdx === idx
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'bg-card hover:shadow-sm hover:border-primary/20'
                }`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className={`h-2.5 w-2.5 rounded-full shrink-0 ${getStatusColor(pump.statusColor)}`}
                ></div>
                <p className="text-sm font-medium truncate">
                  {pump.name} - {pump.location}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-mono font-semibold">
                      {pump.currentCycles}
                    </span>
                    {getTrendIcon(pump.efficiencyChangePercent)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    avg: {pump.averageCycles}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className={`font-mono text-xs min-w-[60px] justify-center ${getPercentageColor(pump.statusColor)}`}
                  title={`Current 24h cycles (${pump.currentCycles}) vs. historical average (${pump.averageCycles})`}
                >
                  {pump.efficiencyChangePercent > 0 ? '+' : ''}
                  {pump.efficiencyChangePercent.toFixed(1)}%
                </Badge>
              </div>
            </button>
          ))}

          <div className="mt-4 pt-4 border-t">
            <div className="mb-3 text-center text-xs text-muted-foreground">
              Efficiency: Current 24h cycles vs. historical average
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    {efficiencyStats.moreEfficient}
                  </span>
                </div>
                <p className="text-muted-foreground">More Efficient</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                  <span className="font-medium text-blue-600 dark:text-blue-400">
                    {efficiencyStats.same}
                  </span>
                </div>
                <p className="text-muted-foreground">Same</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    {efficiencyStats.lessEfficient}
                  </span>
                </div>
                <p className="text-muted-foreground">Less Efficient</p>
              </div>
            </div>
          </div>

          <div className="mt-3 text-center text-xs text-muted-foreground">
            Last updated: {getLastUpdatedDisplay()}
          </div>
        </CardContent>
      </Card>

      {/* Right Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">VFD Pump Monitoring</CardTitle>
          <CardDescription className="text-lg">
            {currentSelectedPump.name} - {currentSelectedPump.location}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status Alert */}
          <div
            className={`rounded-lg border-2 p-4 transition-colors ${getStatusBorderColor(currentSelectedPump.pumpDetail.statusCode)}`}
          >
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 mt-0.5" />
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">
                    {currentSelectedPump.pumpDetail.status}
                  </h3>
                  <Badge
                    className={getStatusBadgeColor(
                      currentSelectedPump.pumpDetail.statusCode
                    )}
                  >
                    {currentSelectedPump.pumpDetail.statusCode.replace(
                      /_/g,
                      ' '
                    )}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentSelectedPump.pumpDetail.statusDescription}
                </p>
              </div>
            </div>
          </div>

          {/* Cycles Display */}
          <div className="bg-linear-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 rounded-xl p-6 border border-primary/20">
            <div className="text-center space-y-2">
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Total Cycles (Last 24 Hours)
              </p>
              <p className="text-5xl font-bold bg-linear-to-br from-primary to-primary/60 bg-clip-text text-transparent">
                {currentSelectedPump.pumpDetail.totalCyclesLast24h}
              </p>
              <p className="text-xs text-muted-foreground">
                {currentSelectedPump.pumpDetail.operatingRangeNote}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm font-medium">Avg Run Time / Cycle</p>
                </div>
              </div>
              <p className="text-2xl font-bold">
                {currentSelectedPump.pumpDetail.avgRunTimePerCycleMin.toFixed(
                  1
                )}{' '}
                min
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium">Last Run</p>
              </div>
              <p className="text-2xl font-bold">
                {currentSelectedPump.pumpDetail.lastRunAgoMins}m ago
              </p>
              <p className="text-xs text-muted-foreground">{lastUpdatedTime}</p>
            </div>
          </div>

          {/* Chart */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-sm mb-1">
                7-Day Cycle History
              </h3>
              <p className="text-xs text-muted-foreground">
                Daily cycle counts for the past week
              </p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={currentSelectedPump.pumpDetail.cycleHistory7Day}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#f0f2f4',
                    border: '#ced4d9',
                    borderRadius: '0.5rem',
                    color: '#22222a',
                  }}
                />
                <Bar dataKey="cycleCount" fill="#3b82f6" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Motor Details */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Motor Frequency</p>
              <p className="text-sm font-mono font-medium">
                {currentSelectedPump.pumpDetail.motor.frequencyHz.toFixed(1)} Hz
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Motor Speed</p>
              <p className="text-sm font-mono font-medium">
                {currentSelectedPump.pumpDetail.motor.speedRpm} RPM
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
            <span>Auto-refresh: Every 5 minutes</span>
            <span>Last updated: {getLastUpdatedDisplay()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

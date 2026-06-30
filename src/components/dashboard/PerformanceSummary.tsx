import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/shadcn/card';
import { Badge } from '../ui/shadcn/badge';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import SiteDetails from '@/types/sites/SiteDetails';
import AssetStatus from '@/types/equipment/AssetStatus';

interface PerformanceSummaryProps {
  locationData: {
    location: SiteDetails;
    assets: AssetStatus[];
  };
}

const PerformanceSummary: React.FC<PerformanceSummaryProps> = ({
  locationData,
}) => {
  // Calculate performance metrics
  const totalAssets = locationData.assets.length;

  // Categorize assets by status
  const operationalAssets = locationData.assets.filter((asset) => {
    const hasIssues =
      asset.issues &&
      typeof asset.issues === 'object' &&
      Object.keys(asset.issues).length > 0;
    const hasRecentData =
      asset.lastRegisteredTempTimeUtc &&
      new Date(asset.lastRegisteredTempTimeUtc).getTime() >
      Date.now() - 24 * 60 * 60 * 1000;
    return !hasIssues && hasRecentData;
  });

  const criticalAssets = locationData.assets.filter(
    (asset) =>
      asset.issues &&
      typeof asset.issues === 'object' &&
      Object.keys(asset.issues).length > 0
  );

  const offlineAssets = locationData.assets.filter((asset) => {
    const hasIssues =
      asset.issues &&
      typeof asset.issues === 'object' &&
      Object.keys(asset.issues).length > 0;
    const hasRecentData =
      asset.lastRegisteredTempTimeUtc &&
      new Date(asset.lastRegisteredTempTimeUtc).getTime() >
      Date.now() - 24 * 60 * 60 * 1000;
    return !hasIssues && !hasRecentData;
  });

  // Prepare data for donut chart with error message tooltips
  const chartData = [
    {
      name: 'Operational',
      value: operationalAssets.length,
      color: '#22c55e', // green-500
      errorMessages: [],
    },
    {
      name: 'Critical',
      value: criticalAssets.length,
      color: '#ef4444', // red-500
      errorMessages: criticalAssets.map((asset) => ({
        assetName: asset.asset.name,
        issues:
          asset.issues && typeof asset.issues === 'object'
            ? Object.entries(asset.issues).map(([code, value]) =>
              getIssueDescription(code, value)
            )
            : [],
      })),
    },
    {
      name: 'Offline',
      value: offlineAssets.length,
      color: '#6b7280', // gray-500
      errorMessages: offlineAssets.map((asset) => ({
        assetName: asset.asset.name,
        issues: ['Device offline - no recent data'],
      })),
    },
  ].filter((item) => item.value > 0);

  const overallHealth =
    totalAssets > 0
      ? Math.round((operationalAssets.length / totalAssets) * 100)
      : 0;

  // Collect all error messages from critical assets
  const errorMessages = criticalAssets.flatMap((asset) => {
    if (asset.issues && typeof asset.issues === 'object') {
      return Object.entries(asset.issues).map(([issueCode, issueValue]) => ({
        assetName: asset.asset.name,
        issueCode,
        issueValue,
        description: getIssueDescription(issueCode, issueValue),
      }));
    }
    return [];
  });

  function getIssueDescription(issueCode: string, issueValue: any): string {
    // Map issue codes to human-readable descriptions based on AssetIssueTypes enum
    const issueDescriptions: Record<string, string> = {
      '1': 'Temperature below operating range',
      '2': 'Temperature above operating range',
      '3': 'Temperature sensor not responding',
      '4': 'Humidity below operating range',
      '5': 'Humidity above operating range',
      '6': 'Humidity sensor not responding',
    };
    return (
      issueDescriptions[issueCode] ||
      `Unknown issue type ${issueCode}: ${issueValue}`
    );
  }

  const getHealthStatus = (health: number) => {
    if (health >= 90)
      return { status: 'Excellent', color: 'bg-green-500', icon: CheckCircle };
    if (health >= 70)
      return { status: 'Good', color: 'bg-blue-500', icon: CheckCircle };
    if (health >= 50)
      return { status: 'Warning', color: 'bg-yellow-500', icon: AlertTriangle };
    return { status: 'Critical', color: 'bg-red-500', icon: AlertTriangle };
  };

  const healthStatus = getHealthStatus(overallHealth);
  const HealthIcon = healthStatus.icon;

  // Custom tooltip for donut chart that shows error messages
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage =
        totalAssets > 0 ? ((data.value / totalAssets) * 100).toFixed(1) : 0;

      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border max-w-xs">
          <p className="font-medium">{`${data.name}: ${data.value} (${percentage}%)`}</p>
          {data.errorMessages && data.errorMessages.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="text-xs font-medium text-red-700">Issues:</p>
              {data.errorMessages
                .slice(0, 3)
                .map((error: any, index: number) => (
                  <div key={index} className="text-xs text-red-600">
                    <p className="font-medium">{error.assetName}:</p>
                    {error.issues
                      .slice(0, 2)
                      .map((issue: string, issueIndex: number) => (
                        <p key={issueIndex} className="ml-2">
                          • {issue}
                        </p>
                      ))}
                  </div>
                ))}
              {data.errorMessages.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{data.errorMessages.length - 3} more...
                </p>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Overall Health Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg font-semibold">
                System Health
              </CardTitle>
              <CardDescription>{locationData.location.name}</CardDescription>
            </div>
            <Badge
              variant="secondary"
              className={`${healthStatus.color} text-white px-3 py-1`}
            >
              <HealthIcon className="w-4 h-4 mr-1" />
              {overallHealth}%
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="space-y-1">
              <div className="text-2xl font-bold text-green-600">
                {operationalAssets.length}
              </div>
              <div className="text-xs text-muted-foreground">Operational</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-red-600">
                {criticalAssets.length}
              </div>
              <div className="text-xs text-muted-foreground">Critical</div>
            </div>
            <div className="space-y-1">
              <div className="text-2xl font-bold text-gray-600">
                {offlineAssets.length}
              </div>
              <div className="text-xs text-muted-foreground">Offline</div>
            </div>
          </div>

          {/* Health Score Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Health Score</span>
              <span className="text-sm text-muted-foreground">
                {overallHealth}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${healthStatus.color}`}
                style={{ width: `${overallHealth}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Status Donut Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">
            Equipment Status
          </CardTitle>
          <CardDescription>
            Current operational status of {totalAssets} assets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Error Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Active Issues
          </CardTitle>
          <CardDescription>
            {errorMessages.length} issue(s) requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {errorMessages.length === 0 ? (
            <div className="text-center py-4">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                All systems operational
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[180px] overflow-y-auto">
              {errorMessages.slice(0, 5).map((error, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-2 bg-red-50 rounded-lg border border-red-200"
                >
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-red-800 truncate">
                      {error.assetName}
                    </p>
                    <p className="text-xs text-red-600">{error.description}</p>
                  </div>
                </div>
              ))}
              {errorMessages.length > 5 && (
                <div className="text-xs text-muted-foreground text-center pt-2">
                  +{errorMessages.length - 5} more issues
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PerformanceSummary;

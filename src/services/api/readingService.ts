import { apiClientMonitoring as apiClient } from './apiClient';
import { createArrayQueryParam } from '@/lib/utils';
import { CancelToken } from 'axios';
import { SensorReading, SensorReadingConfigurationParameters, SensorReadingsBrowserReportParameters, SensorReadingsLatestParameters } from '@/types/readings/SensorReading';
import { SensorReadingsReport } from '@/types/reports/SensorReadingsBrowserReport';

const readingService = {
  getReadingsConfiguration: async (
    params: SensorReadingConfigurationParameters,
    cancelToken?: CancelToken
  ): Promise<Array<string>> => {
    const response = await apiClient.get<Array<string>>(
      `/metrics/distinct?${createArrayQueryParam(params.asset_ids, 'asset_ids')}`,
      {
        params: {
          days: params.days,
        },
        cancelToken: cancelToken,
      }
    );
    return response.data;
  },

  getReadings: async (
    params: SensorReadingsBrowserReportParameters,
    cancelToken?: CancelToken
  ): Promise<SensorReadingsReport> => {
    const response = await apiClient.get<SensorReadingsReport>(
      `/metrics/readings?${createArrayQueryParam(params.asset_ids, 'asset_ids')}&${params.metrics ? createArrayQueryParam(params.metrics, 'metrics') : ''}`,
      {
        params: {
          hours: params.hours,
          nextToken: params.nextToken,
          timezone_offset_hours: params.timezone_offset_hours,
          filter: params.filter,
          down_sample: params.down_sample,
          page_size: params.page_size,
        },
        cancelToken: cancelToken,
      }
    );
    return response.data;
  },

  getLatestReadings: async (
    filters: SensorReadingsLatestParameters,
    cancelToken?: CancelToken
  ): Promise<SensorReading[]> => {
    const response = await apiClient.get<SensorReading[]>(
      `metrics/readings/latest?${createArrayQueryParam(filters.asset_ids, 'asset_ids')}&${filters.metrics ? createArrayQueryParam(filters.metrics, 'metrics') : ''}`,
      {
        params: {
          days: filters.days,
        },
        cancelToken: cancelToken,
      }
    );

    return response.data;
  },
};

export default readingService;

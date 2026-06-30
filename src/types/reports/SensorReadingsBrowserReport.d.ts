import { SensorReading } from '../readings/SensorReading';

export interface SensorReadingsReport {
  rows: SensorReading[];
  nextToken?: string;
}
export type AlertSeverity = 'info' | 'warning' | 'error' | 'success';

export interface AlertDetails {
  id: string;
  title: string;
  text: string;
  severity: AlertSeverity;
  timeUtc: string; // ISO string format
  isHandled: boolean;
  navigationLink?: string;
  handledBy?: string;
  handleTimeUtc?: string; // ISO string format
}

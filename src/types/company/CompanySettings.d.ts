export default interface CompanySettings {
  // Basic information
  id: string;
  name: string;
  address: string;
  email: string;

  // Units of measure settings
  useMetricSystem: boolean;

  // Default user preferences
  defaultTheme: 'light' | 'dark' | 'system';
  defaultLanguage: string;
}

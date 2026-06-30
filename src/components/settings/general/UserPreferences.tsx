import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth, useUserContext } from '@/components/contexts/AuthContext';
import SiteBase from '@/types/sites/SiteBase';
import MessengerService from '@/services/ui/messengerService';
import { useTheme } from '@/components/contexts/ThemeContext';
import userService from '@/services/api/userService';
import siteService from '@/services/api/siteService';
import { User, Palette, Globe, MapPin, Shield } from 'lucide-react';
import ThemeSwitcher from '@/components/ui/ThemeSwitcher';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/shadcn/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import PasswordResetForm from '@/components/settings/general/PasswordResetForm';
import { logger } from '@/lib/logger';

const UserPreferences: React.FC = () => {
  const auth = useAuth();
  const { t } = useTranslation();
  const userContextDetails = useUserContext();
  const userDetails = userContextDetails?.user;
  const { themeMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [sites, setSites] = useState<SiteBase[]>([]);

  const updatePreferences = async (
    updateHandler: () => Promise<void>
  ) => {
    setLoading(true);
    try {
      await updateHandler();
      MessengerService.success(t('layout.preferences.updateSuccess'));
      auth.refreshContext();
    } catch (error) {
      logger.error('Failed to update preferences:', error);
      MessengerService.error(t('layout.preferences.updateError'));
    } finally {
      setLoading(false);
    }
  };

  // Handler for theme change - now persists to backend
  const handleThemeChange = (theme: string) => {
    updatePreferences(async () => await userService.setTheme(theme));
  };

  // Handler for language change - now persists to backend
  const handleLanguageChange = (language: string) => {
    updatePreferences(async () => await userService.setLanguage(language));
  };

  // Handler for default site change
  const handleSiteChange = (siteId: string) => {
    updatePreferences(
      async () => await userService.setDefaultLocation(siteId)
    );
  };

  // Load available sites that the user has access to
  useEffect(() => {
    if (
      userDetails?.assignedSites &&
      userDetails.assignedSites.length > 0
    ) {
      const fetchSites = async () => {
        try {
          const userSites = await siteService.listUserSites();
          setSites(userSites);
        } catch (error) {
          logger.error('Failed to fetch sites:', error);
          MessengerService.error('Failed to load site information');
        }
      };
      fetchSites();
    }
  }, [userDetails?.assignedSites]);

  return (
    <div className="grid gap-6">
      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t('settings.general.profile.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.general.profile.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">
                    {userDetails?.userName || ''}
                  </h3>
                </div>
                <p className="text-sm font-medium">
                  {`${userDetails?.firstName || ''} ${userDetails?.lastName || ''}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {userDetails?.email || ''}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Theme Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t('settings.general.theme.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.general.theme.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ThemeSwitcher
              themeMode={themeMode}
              onThemeChange={handleThemeChange}
              disabled={loading}
            />
          </CardContent>
        </Card>

        {/* Language Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              {t('settings.general.language.title')}
            </CardTitle>
            <CardDescription>
              {t('settings.general.language.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LanguageSwitcher
              disabled={loading}
              language={userDetails?.language}
              onLanguageChange={handleLanguageChange}
            />
          </CardContent>
        </Card>
      </div>

      {/* Default Location Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            {t('settings.general.defaultSite.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.general.defaultSite.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <Select
              value={userDetails?.defaultSite || ''}
              onValueChange={handleSiteChange}
              disabled={loading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select site" />
              </SelectTrigger>
              <SelectContent>
                {sites?.map((site) => (
                  <SelectItem key={site.id} value={site.id!}>
                    {site.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('settings.general.security.title')}
          </CardTitle>
          <CardDescription>
            {t('settings.general.security.description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordResetForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default UserPreferences;

import UserPreferences from '@/components/settings/general/UserPreferences';
import { useTranslation } from 'react-i18next';

function GeneralSettings() {
  const { t } = useTranslation();
  return (
    <div className='space-y-6'>
      {/* Page Title */}
      <div>
        <h1 className="page-header">
          {t('settings.general.title')}
        </h1>
        <p className="page-subTitle">
          {t('settings.general.description')}
        </p>
      </div>
      <section className='space-y-8'>
        <UserPreferences />
      </section>
    </div>
  );
}

export default GeneralSettings;

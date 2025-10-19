import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Card, Button, Input } from '../../components/ui';

const SettingsPage = () => {
  const { user, tenant } = useAuth();
  const { t } = useTranslation(['dashboard', 'common']);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t('dashboard:settings.title', { defaultValue: 'Settings' })}
        </h1>
        <p className="mt-2 text-gray-600">
          {t('dashboard:settings.subtitle', {
            defaultValue: 'Manage your account and tenant preferences',
          })}
        </p>
      </div>

      {/* Profile Settings */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {t('dashboard:settings.profile_title', { defaultValue: 'Profile Information' })}
        </h2>
        <form className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label={t('dashboard:settings.first_name', { defaultValue: 'First Name' })}
              type="text"
              defaultValue={user?.firstName || ''}
              fullWidth
            />
            <Input
              label={t('dashboard:settings.last_name', { defaultValue: 'Last Name' })}
              type="text"
              defaultValue={user?.lastName || ''}
              fullWidth
            />
          </div>
          <Input
            label={t('dashboard:settings.email', { defaultValue: 'Email' })}
            type="email"
            defaultValue={user?.email || ''}
            fullWidth
            disabled
          />
          <div className="flex justify-end">
            <Button variant="primary">
              {t('dashboard:settings.save_changes', { defaultValue: 'Save Changes' })}
            </Button>
          </div>
        </form>
      </Card>

      {/* Password Settings */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {t('dashboard:settings.password_title', { defaultValue: 'Change Password' })}
        </h2>
        <form className="space-y-4">
          <Input
            label={t('dashboard:settings.current_password', {
              defaultValue: 'Current Password',
            })}
            type="password"
            fullWidth
          />
          <Input
            label={t('dashboard:settings.new_password', { defaultValue: 'New Password' })}
            type="password"
            fullWidth
          />
          <Input
            label={t('dashboard:settings.confirm_password', {
              defaultValue: 'Confirm Password',
            })}
            type="password"
            fullWidth
          />
          <div className="flex justify-end">
            <Button variant="primary">
              {t('dashboard:settings.update_password', { defaultValue: 'Update Password' })}
            </Button>
          </div>
        </form>
      </Card>

      {/* Tenant Settings */}
      {tenant && (user?.globalRole === 'TENANT_ADMIN' || tenant.role === 'TENANT_ADMIN') && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            {t('dashboard:settings.tenant_title', { defaultValue: 'Tenant Settings' })}
          </h2>
          <form className="space-y-4">
            <Input
              label={t('dashboard:settings.tenant_name', { defaultValue: 'Tenant Name' })}
              type="text"
              defaultValue={tenant.name}
              fullWidth
            />
            <Input
              label={t('dashboard:settings.tenant_slug', { defaultValue: 'Slug' })}
              type="text"
              defaultValue={tenant.slug}
              fullWidth
              disabled
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('dashboard:settings.description', { defaultValue: 'Description' })}
              </label>
              <textarea
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
                placeholder={t('dashboard:settings.description_placeholder', {
                  defaultValue: 'Tell us about your venue...',
                })}
              />
            </div>
            <div className="flex justify-end">
              <Button variant="primary">
                {t('dashboard:settings.save_changes', { defaultValue: 'Save Changes' })}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* Notifications */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          {t('dashboard:settings.notifications_title', {
            defaultValue: 'Notification Preferences',
          })}
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {t('dashboard:settings.email_notifications', {
                  defaultValue: 'Email Notifications',
                })}
              </p>
              <p className="text-sm text-gray-500">
                {t('dashboard:settings.email_notifications_desc', {
                  defaultValue: 'Receive email updates about your events',
                })}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {t('dashboard:settings.push_notifications', {
                  defaultValue: 'Push Notifications',
                })}
              </p>
              <p className="text-sm text-gray-500">
                {t('dashboard:settings.push_notifications_desc', {
                  defaultValue: 'Receive push notifications on your devices',
                })}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">
                {t('dashboard:settings.marketing_emails', {
                  defaultValue: 'Marketing Emails',
                })}
              </p>
              <p className="text-sm text-gray-500">
                {t('dashboard:settings.marketing_emails_desc', {
                  defaultValue: 'Receive updates about new features',
                })}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-accent-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-600"></div>
            </label>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="border-red-200">
        <h2 className="text-xl font-semibold text-red-900 mb-6">
          {t('dashboard:settings.danger_zone', { defaultValue: 'Danger Zone' })}
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">
                {t('dashboard:settings.deactivate_account', {
                  defaultValue: 'Deactivate Account',
                })}
              </p>
              <p className="text-sm text-gray-500">
                {t('dashboard:settings.deactivate_account_desc', {
                  defaultValue: 'Temporarily disable your account',
                })}
              </p>
            </div>
            <Button variant="outline" className="border-red-300 text-red-700 hover:bg-red-50">
              {t('dashboard:settings.deactivate', { defaultValue: 'Deactivate' })}
            </Button>
          </div>

          <div className="flex items-center justify-between p-4 border border-red-200 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">
                {t('dashboard:settings.delete_account', { defaultValue: 'Delete Account' })}
              </p>
              <p className="text-sm text-gray-500">
                {t('dashboard:settings.delete_account_desc', {
                  defaultValue: 'Permanently delete your account and all data',
                })}
              </p>
            </div>
            <Button variant="outline" className="border-red-500 text-red-700 hover:bg-red-50">
              {t('dashboard:settings.delete', { defaultValue: 'Delete' })}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
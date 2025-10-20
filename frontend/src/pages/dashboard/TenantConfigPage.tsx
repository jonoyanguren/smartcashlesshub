import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, Button, LoadingState } from '../../components/ui';
import { getTenantConfig, updateTenantConfig, type TenantBranding } from '../../api/tenants';
import { useTenantBranding } from '../../contexts/TenantBrandingContext';

const TenantConfigPage = () => {
  const { t } = useTranslation(['dashboard']);
  const { refreshBranding } = useTenantBranding();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [tenantName, setTenantName] = useState('');
  const [branding, setBranding] = useState<TenantBranding>({
    logo: null,
    heroImage: null,
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    accentColor: '#ec4899',
  });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const config = await getTenantConfig();
      setTenantName(config.tenantName);
      setBranding(config.branding);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
      console.error('Error loading tenant config:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await updateTenantConfig(branding);

      // Refresh branding in the context to apply colors immediately
      await refreshBranding();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save configuration');
      console.error('Error saving tenant config:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = (colorType: keyof Pick<TenantBranding, 'primaryColor' | 'secondaryColor' | 'accentColor'>, value: string) => {
    setBranding(prev => ({ ...prev, [colorType]: value }));
  };

  const handleReset = () => {
    loadConfig();
    setSuccess(false);
    setError(null);
  };

  if (loading) {
    return (
      <LoadingState
        message={t('dashboard:config.loading', { defaultValue: 'Loading configuration...' })}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t('dashboard:config.title', { defaultValue: 'Tenant Configuration' })}
        </h1>
        <p className="mt-2 text-gray-600">
          {t('dashboard:config.subtitle', {
            defaultValue: 'Customize your brand colors and logo for the dashboard and mobile app',
          })}
        </p>
      </div>

      {/* Success Alert */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">
                {t('dashboard:config.success', { defaultValue: 'Configuration saved successfully!' })}
              </h3>
            </div>
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Tenant Info */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('dashboard:config.tenant_info', { defaultValue: 'Tenant Information' })}
        </h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            {t('dashboard:config.configuring_for', { defaultValue: 'Configuring branding for:' })}
          </p>
          <p className="text-lg font-semibold text-gray-900 mt-1">{tenantName}</p>
        </div>
      </Card>

      {/* Brand Colors */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('dashboard:config.brand_colors', { defaultValue: 'Brand Colors' })}
        </h2>

        <div className="space-y-6">
          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard:config.primary_color', { defaultValue: 'Primary Color' })}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={branding.primaryColor}
                onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                className="h-12 w-20 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={branding.primaryColor}
                onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 font-mono"
                placeholder="#6366f1"
              />
              <div
                className="h-12 w-32 rounded-lg border border-gray-300"
                style={{ backgroundColor: branding.primaryColor }}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {t('dashboard:config.primary_color_desc', {
                defaultValue: 'Main brand color used for buttons, links, and primary elements',
              })}
            </p>
          </div>

          {/* Secondary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard:config.secondary_color', { defaultValue: 'Secondary Color' })}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={branding.secondaryColor}
                onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                className="h-12 w-20 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={branding.secondaryColor}
                onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 font-mono"
                placeholder="#8b5cf6"
              />
              <div
                className="h-12 w-32 rounded-lg border border-gray-300"
                style={{ backgroundColor: branding.secondaryColor }}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {t('dashboard:config.secondary_color_desc', {
                defaultValue: 'Secondary brand color for accents and highlights',
              })}
            </p>
          </div>

          {/* Accent Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard:config.accent_color', { defaultValue: 'Accent Color' })}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={branding.accentColor}
                onChange={(e) => handleColorChange('accentColor', e.target.value)}
                className="h-12 w-20 rounded-lg border border-gray-300 cursor-pointer"
              />
              <input
                type="text"
                value={branding.accentColor}
                onChange={(e) => handleColorChange('accentColor', e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 font-mono"
                placeholder="#ec4899"
              />
              <div
                className="h-12 w-32 rounded-lg border border-gray-300"
                style={{ backgroundColor: branding.accentColor }}
              />
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {t('dashboard:config.accent_color_desc', {
                defaultValue: 'Accent color for special elements and call-to-actions',
              })}
            </p>
          </div>
        </div>
      </Card>

      {/* Logo & Assets */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('dashboard:config.logo_assets', { defaultValue: 'Logo & Assets' })}
        </h2>

        <div className="space-y-6">
          {/* Logo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard:config.logo_url')}
            </label>
            <input
              type="text"
              value={branding.logo || ''}
              onChange={(e) => setBranding(prev => ({ ...prev, logo: e.target.value || null }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              placeholder="https://example.com/logo.png"
            />
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 font-medium mb-1">📍 {t('dashboard:config.logo_where_used')}</p>
              <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                <li>{t('dashboard:config.logo_sidebar')}</li>
                <li>{t('dashboard:config.logo_preview')}</li>
                <li>{t('dashboard:config.logo_mobile')}</li>
              </ul>
              <p className="text-sm text-blue-900 font-medium mt-3 mb-1">📏 {t('dashboard:config.logo_size')}</p>
              <p className="text-sm text-blue-800">{t('dashboard:config.logo_size_detail')}</p>
              <p className="text-sm text-blue-800">{t('dashboard:config.logo_format')}</p>
            </div>
            {branding.logo && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">{t('dashboard:config.preview')}:</p>
                <img src={branding.logo} alt="Logo preview" className="max-h-16" onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }} />
              </div>
            )}
          </div>

          {/* Hero Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard:config.hero_url')}
            </label>
            <input
              type="text"
              value={branding.heroImage || ''}
              onChange={(e) => setBranding(prev => ({ ...prev, heroImage: e.target.value || null }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              placeholder="https://example.com/hero-banner.jpg"
            />
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-900 font-medium mb-1">📍 {t('dashboard:config.hero_where_used')}</p>
              <ul className="text-sm text-blue-800 space-y-1 ml-4 list-disc">
                <li>{t('dashboard:config.hero_preview')}</li>
                <li>{t('dashboard:config.hero_mobile')}</li>
                <li>{t('dashboard:config.hero_public')}</li>
              </ul>
              <p className="text-sm text-blue-900 font-medium mt-3 mb-1">📏 {t('dashboard:config.hero_size')}</p>
              <p className="text-sm text-blue-800">{t('dashboard:config.hero_size_detail')}</p>
              <p className="text-sm text-blue-800">{t('dashboard:config.hero_aspect')}</p>
              <p className="text-sm text-blue-800">{t('dashboard:config.hero_format')}</p>
            </div>
            {branding.heroImage && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-2">{t('dashboard:config.preview')}:</p>
                <img
                  src={branding.heroImage}
                  alt="Hero image preview"
                  className="w-full max-h-48 object-cover rounded-lg"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Color Preview */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          {t('dashboard:config.preview', { defaultValue: 'Preview' })}
        </h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div
              className="h-24 rounded-lg mb-2 flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: branding.primaryColor }}
            >
              Primary
            </div>
            <p className="text-sm text-gray-600">Buttons & Links</p>
          </div>
          <div className="text-center">
            <div
              className="h-24 rounded-lg mb-2 flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: branding.secondaryColor }}
            >
              Secondary
            </div>
            <p className="text-sm text-gray-600">Accents</p>
          </div>
          <div className="text-center">
            <div
              className="h-24 rounded-lg mb-2 flex items-center justify-center text-white font-semibold"
              style={{ backgroundColor: branding.accentColor }}
            >
              Accent
            </div>
            <p className="text-sm text-gray-600">CTAs</p>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button variant="secondary" onClick={handleReset} disabled={saving}>
          {t('dashboard:config.reset', { defaultValue: 'Reset' })}
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {t('dashboard:config.saving', { defaultValue: 'Saving...' })}
            </>
          ) : (
            t('dashboard:config.save', { defaultValue: 'Save Configuration' })
          )}
        </Button>
      </div>
    </div>
  );
};

export default TenantConfigPage;
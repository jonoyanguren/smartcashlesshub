import { useState } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '../components/ui';

const ChangePasswordPage = () => {
  const { t } = useTranslation(['auth']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.currentPassword.trim()) {
      newErrors.currentPassword = t('auth:change_password.errors.current_password_required');
    }

    if (!formData.newPassword.trim()) {
      newErrors.newPassword = t('auth:change_password.errors.new_password_required');
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = t('auth:change_password.errors.password_too_short');
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = t('auth:change_password.errors.confirm_password_required');
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('auth:change_password.errors.passwords_do_not_match');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('accessToken');

      const response = await fetch('http://localhost:3001/api/v1/auth/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      // Password changed successfully, redirect to dashboard with full reload
      // This ensures ProtectedRoute re-checks mustChangePassword status
      window.location.href = '/dashboard';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
      console.error('Error changing password:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-50 to-white px-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
            {t('auth:change_password.title')}
          </h1>
          <p className="text-center text-gray-600 mb-8">
            {t('auth:change_password.subtitle')}
          </p>

          {/* Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="h-5 w-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="ml-3 text-sm text-amber-800">
                {t('auth:change_password.warning')}
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Current Password */}
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth:change_password.current_password')}
              </label>
              <Input
                id="currentPassword"
                type="password"
                value={formData.currentPassword}
                onChange={(e) => handleChange('currentPassword', e.target.value)}
                placeholder={t('auth:change_password.current_password_placeholder')}
                error={errors.currentPassword}
                required
              />
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth:change_password.new_password')}
              </label>
              <Input
                id="newPassword"
                type="password"
                value={formData.newPassword}
                onChange={(e) => handleChange('newPassword', e.target.value)}
                placeholder={t('auth:change_password.new_password_placeholder')}
                error={errors.newPassword}
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                {t('auth:change_password.password_requirements')}
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                {t('auth:change_password.confirm_password')}
              </label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                placeholder={t('auth:change_password.confirm_password_placeholder')}
                error={errors.confirmPassword}
                required
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              loading={loading}
              fullWidth
            >
              {t('auth:change_password.submit')}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-600">
          {t('auth:change_password.need_help')}{' '}
          <a href="mailto:support@smartcashless.com" className="text-accent-600 hover:text-accent-700 font-medium">
            {t('auth:change_password.contact_support')}
          </a>
        </p>
      </div>
    </div>
  );
};

export default ChangePasswordPage;
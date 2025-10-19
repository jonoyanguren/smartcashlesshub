import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { createUser, updateUser, type CreateUserRequest, type User, type CreateUserResponse } from '../../api/users';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (response?: CreateUserResponse) => void;
  user?: User | null; // Optional user for editing
}

const CreateUserModal = ({ isOpen, onClose, onSuccess, user }: CreateUserModalProps) => {
  const isEditing = !!user;
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CreateUserRequest>({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'END_USER',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form with user data when editing
  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        email: user.email,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phone: user.phone || '',
        role: user.role,
      });
    } else if (!user && isOpen) {
      // Reset form when creating new user
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'END_USER',
      });
    }
    setError('');
    setErrors({});
  }, [user, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = t('dashboard:users.form.errors.email_required', { defaultValue: 'Email is required' });
    } else {
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = t('dashboard:users.form.errors.email_invalid', { defaultValue: 'Email is invalid' });
      }
    }

    if (!formData.role) {
      newErrors.role = t('dashboard:users.form.errors.role_required', { defaultValue: 'Role is required' });
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

      if (isEditing && user) {
        // Update existing user
        await updateUser(user.id, {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone,
          role: formData.role,
        });
        onSuccess();
      } else {
        // Create new user
        const response = await createUser(formData);
        onSuccess(response);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
      console.error('Error saving user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CreateUserRequest, value: string) => {
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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing
        ? t('dashboard:users.edit_user', { defaultValue: 'Edit User' })
        : t('dashboard:users.create_user', { defaultValue: 'Create User' })
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Email (disabled when editing) */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            {t('dashboard:users.form.email', { defaultValue: 'Email' })} *
          </label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder={t('dashboard:users.form.email_placeholder', { defaultValue: 'user@example.com' })}
            error={errors.email}
            disabled={isEditing}
            required
          />
          {isEditing && (
            <p className="mt-1 text-xs text-gray-500">
              {t('dashboard:users.form.email_cannot_change', { defaultValue: 'Email cannot be changed' })}
            </p>
          )}
        </div>

        {/* First Name */}
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
            {t('dashboard:users.form.first_name', { defaultValue: 'First Name' })}
          </label>
          <Input
            id="firstName"
            type="text"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            placeholder={t('dashboard:users.form.first_name_placeholder', { defaultValue: 'John' })}
          />
        </div>

        {/* Last Name */}
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
            {t('dashboard:users.form.last_name', { defaultValue: 'Last Name' })}
          </label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            placeholder={t('dashboard:users.form.last_name_placeholder', { defaultValue: 'Doe' })}
          />
        </div>

        {/* Phone */}
        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            {t('dashboard:users.form.phone', { defaultValue: 'Phone' })}
          </label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder={t('dashboard:users.form.phone_placeholder', { defaultValue: '+34 600 000 000' })}
          />
        </div>

        {/* Role */}
        <div>
          <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
            {t('dashboard:users.form.role', { defaultValue: 'Role' })} *
          </label>
          <select
            id="role"
            value={formData.role}
            onChange={(e) => handleChange('role', e.target.value as any)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 ${
              errors.role ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          >
            <option value="END_USER">{t('dashboard:users.roles.end_user', { defaultValue: 'Customer' })}</option>
            <option value="TENANT_STAFF">{t('dashboard:users.roles.tenant_staff', { defaultValue: 'Staff' })}</option>
            <option value="TENANT_ADMIN">{t('dashboard:users.roles.tenant_admin', { defaultValue: 'Admin' })}</option>
          </select>
          {errors.role && (
            <p className="mt-1 text-sm text-red-600">{errors.role}</p>
          )}
        </div>

        {/* Info message for new users */}
        {!isEditing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              {t('dashboard:users.form.password_info', {
                defaultValue: 'A temporary password will be generated and shown once. The user must change it on first login.'
              })}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            fullWidth
          >
            {t('dashboard:common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            fullWidth
          >
            {isEditing
              ? t('dashboard:users.save_changes', { defaultValue: 'Save Changes' })
              : t('dashboard:users.create_user', { defaultValue: 'Create User' })
            }
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateUserModal;
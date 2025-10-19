import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

interface PasswordDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  temporaryPassword: string;
}

const PasswordDisplayModal = ({ isOpen, onClose, email, temporaryPassword }: PasswordDisplayModalProps) => {
  const { t } = useTranslation(['dashboard']);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  };

  const handleClose = () => {
    setCopied(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('dashboard:users.password_modal.title', { defaultValue: 'User Created Successfully' })}
    >
      <div className="space-y-6">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* User Email */}
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">
            {t('dashboard:users.password_modal.user_created', { defaultValue: 'User created for' })}
          </p>
          <p className="text-lg font-semibold text-gray-900">{email}</p>
        </div>

        {/* Warning */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-amber-800">
                {t('dashboard:users.password_modal.warning_title', { defaultValue: 'Important: Save This Password' })}
              </h3>
              <p className="mt-1 text-sm text-amber-700">
                {t('dashboard:users.password_modal.warning_message', {
                  defaultValue: 'This is the only time you will see this password. Make sure to copy it and share it securely with the user.'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Temporary Password Display */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dashboard:users.password_modal.temporary_password', { defaultValue: 'Temporary Password' })}
          </label>
          <div className="relative">
            <input
              type="text"
              value={temporaryPassword}
              readOnly
              className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg bg-gray-50 font-mono text-lg"
              onClick={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={handleCopy}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-600 hover:text-gray-900 transition-colors"
              title={t('dashboard:users.password_modal.copy', { defaultValue: 'Copy to clipboard' })}
            >
              {copied ? (
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
          {copied && (
            <p className="mt-2 text-sm text-green-600">
              {t('dashboard:users.password_modal.copied', { defaultValue: 'Copied to clipboard!' })}
            </p>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2">
            {t('dashboard:users.password_modal.next_steps', { defaultValue: 'Next Steps' })}
          </h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>
              {t('dashboard:users.password_modal.step1', { defaultValue: 'Share this password securely with the user' })}
            </li>
            <li>
              {t('dashboard:users.password_modal.step2', { defaultValue: 'User must change password on first login' })}
            </li>
            <li>
              {t('dashboard:users.password_modal.step3', { defaultValue: 'Password cannot be recovered after closing this window' })}
            </li>
          </ul>
        </div>

        {/* Close Button */}
        <div className="pt-4">
          <Button
            type="button"
            variant="primary"
            onClick={handleClose}
            fullWidth
          >
            {t('dashboard:users.password_modal.close', { defaultValue: 'I Have Saved The Password' })}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default PasswordDisplayModal;
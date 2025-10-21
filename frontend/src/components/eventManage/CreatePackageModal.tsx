// Create Package Modal
// Modal for creating/editing packages

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Button } from '../ui';
import { createPackage, updatePackage, type Package, type CreatePackageRequest } from '../../api/packages';

interface CreatePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  eventId: string;
  package?: Package | null;
}

const CreatePackageModal = ({
  isOpen,
  onClose,
  onSuccess,
  eventId,
  package: editPackage,
}: CreatePackageModalProps) => {
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [maxQuantity, setMaxQuantity] = useState('');
  const [maxPerUser, setMaxPerUser] = useState('1');
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'INACTIVE'>('DRAFT');

  useEffect(() => {
    if (editPackage) {
      setName(editPackage.name);
      setDescription(editPackage.description || '');
      setPrice(editPackage.price.toString());
      setOriginalPrice(editPackage.originalPrice?.toString() || '');
      setMaxQuantity(editPackage.maxQuantity?.toString() || '');
      setMaxPerUser(editPackage.maxPerUser?.toString() || '1');
      setStatus(editPackage.status as any);
    } else {
      resetForm();
    }
  }, [editPackage, isOpen]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setOriginalPrice('');
    setMaxQuantity('');
    setMaxPerUser('1');
    setStatus('DRAFT');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data: CreatePackageRequest = {
        eventId,
        name,
        description: description || undefined,
        price: parseFloat(price),
        originalPrice: originalPrice ? parseFloat(originalPrice) : undefined,
        maxQuantity: maxQuantity ? parseInt(maxQuantity) : undefined,
        maxPerUser: maxPerUser ? parseInt(maxPerUser) : 1,
      };

      if (editPackage) {
        await updatePackage(editPackage.id, { ...data, status });
      } else {
        await createPackage(data);
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save package');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editPackage
        ? t('dashboard:packages.edit_package', { defaultValue: 'Edit Package' })
        : t('dashboard:packages.create_package', { defaultValue: 'Create Package' })
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('dashboard:packages.name', { defaultValue: 'Package Name' })} *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            placeholder="Early Bird VIP Package"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('dashboard:packages.description', { defaultValue: 'Description' })}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            placeholder="Description of what's included..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard:packages.price', { defaultValue: 'Price (€)' })} *
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard:packages.original_price', { defaultValue: 'Original Price (€)' })}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={originalPrice}
              onChange={(e) => setOriginalPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard:packages.max_quantity', { defaultValue: 'Max Quantity' })}
            </label>
            <input
              type="number"
              min="1"
              value={maxQuantity}
              onChange={(e) => setMaxQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              placeholder="Unlimited"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard:packages.max_per_user', { defaultValue: 'Max Per User' })}
            </label>
            <input
              type="number"
              min="1"
              value={maxPerUser}
              onChange={(e) => setMaxPerUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>
        </div>

        {editPackage && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('dashboard:packages.status', { defaultValue: 'Status' })}
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            >
              <option value="DRAFT">Draft</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t('dashboard:packages.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading
              ? t('dashboard:packages.saving', { defaultValue: 'Saving...' })
              : editPackage
                ? t('dashboard:packages.update', { defaultValue: 'Update' })
                : t('dashboard:packages.create', { defaultValue: 'Create' })
            }
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreatePackageModal;
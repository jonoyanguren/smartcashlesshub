// Packages Section
// Manage pre-event packages for an event

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, LoadingState } from '../ui';
import { listPackages, deletePackage, type Package } from '../../api/packages';
import CreatePackageModal from './CreatePackageModal';

interface PackagesSectionProps {
  eventId: string;
}

const PackagesSection = ({ eventId }: PackagesSectionProps) => {
  const { t } = useTranslation(['dashboard']);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);

  useEffect(() => {
    loadPackages();
  }, [eventId]);

  const loadPackages = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await listPackages({ eventId });
      setPackages(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load packages');
      console.error('Error loading packages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (packageId: string) => {
    if (!confirm(t('dashboard:packages.confirm_delete', { defaultValue: 'Are you sure you want to delete this package?' }))) {
      return;
    }

    try {
      await deletePackage(packageId);
      await loadPackages();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete package');
    }
  };

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingPackage(null);
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-800',
      ACTIVE: 'bg-green-100 text-green-800',
      INACTIVE: 'bg-yellow-100 text-yellow-800',
      EXPIRED: 'bg-red-100 text-red-800',
      SOLD_OUT: 'bg-purple-100 text-purple-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <LoadingState message={t('dashboard:packages.loading', { defaultValue: 'Loading packages...' })} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t('dashboard:packages.title', { defaultValue: 'Packages' })}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t('dashboard:packages.subtitle', { defaultValue: 'Pre-event packages available for purchase' })}
          </p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('dashboard:packages.create', { defaultValue: 'Create Package' })}
        </Button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Packages List */}
      {packages.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {t('dashboard:packages.no_packages', { defaultValue: 'No packages' })}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {t('dashboard:packages.no_packages_desc', { defaultValue: 'Get started by creating a new package.' })}
          </p>
          <div className="mt-6">
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              {t('dashboard:packages.create', { defaultValue: 'Create Package' })}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div key={pkg.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                    {pkg.description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{pkg.description}</p>
                    )}
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(pkg.status)}`}>
                    {pkg.status}
                  </span>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                    <span className="text-lg text-gray-400 line-through">€{pkg.originalPrice.toFixed(2)}</span>
                  )}
                  <span className="text-2xl font-bold text-accent-600">€{pkg.price.toFixed(2)}</span>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">{t('dashboard:packages.sold', { defaultValue: 'Sold' })}</span>
                    <p className="font-semibold text-gray-900">
                      {pkg.soldQuantity} {pkg.maxQuantity ? `/ ${pkg.maxQuantity}` : ''}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('dashboard:packages.purchases', { defaultValue: 'Purchases' })}</span>
                    <p className="font-semibold text-gray-900">{pkg._count?.purchases || 0}</p>
                  </div>
                </div>

                {/* Items Count */}
                {pkg.items && pkg.items.length > 0 && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{pkg.items.length}</span> {t('dashboard:packages.items', { defaultValue: 'items included' })}
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200 flex gap-2">
                  <Button variant="outline" size="sm" fullWidth onClick={() => handleEdit(pkg)}>
                    {t('dashboard:packages.edit', { defaultValue: 'Edit' })}
                  </Button>
                  <Button variant="ghost" size="sm" fullWidth onClick={() => handleDelete(pkg.id)}>
                    {t('dashboard:packages.delete', { defaultValue: 'Delete' })}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <CreatePackageModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={() => {
          loadPackages();
          handleCloseModal();
        }}
        eventId={eventId}
        package={editingPackage}
      />
    </div>
  );
};

export default PackagesSection;
import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import {
  createOffer,
  updateOffer,
  type CreateOfferRequest,
  type Offer,
  type OfferType,
  type OfferStatus,
  type OfferItemType,
} from '../../api/offers';
import { getEvents, type Event } from '../../api/events';

interface CreateOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  offer?: Offer | null; // Optional offer for editing
}

interface OfferItemForm {
  name: string;
  description?: string;
  type: OfferItemType;
  quantity: number;
  braceletAmount?: number;
  voucherDiscount?: number;
}

const CreateOfferModal = ({ isOpen, onClose, onSuccess, offer }: CreateOfferModalProps) => {
  const isEditing = !!offer;
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [formData, setFormData] = useState<CreateOfferRequest>({
    eventId: '',
    name: '',
    description: '',
    type: 'BUNDLE',
    price: 0,
    originalPrice: undefined,
    discountPercentage: undefined,
    maxQuantity: undefined,
    maxPerUser: 1,
    validFrom: undefined,
    validUntil: undefined,
    items: [],
  });

  const [currentItem, setCurrentItem] = useState<OfferItemForm>({
    name: '',
    description: '',
    type: 'ENTRY',
    quantity: 1,
    braceletAmount: undefined,
    voucherDiscount: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper function to convert ISO date to datetime-local format
  const toDateTimeLocalFormat = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Load events when modal opens
  useEffect(() => {
    if (isOpen && events.length === 0) {
      loadEvents();
    }
  }, [isOpen]);

  const loadEvents = async () => {
    try {
      setLoadingEvents(true);
      const data = await getEvents();
      setEvents(data);
    } catch (err) {
      console.error('Error loading events:', err);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Initialize form with offer data when editing
  useEffect(() => {
    if (offer && isOpen) {
      setFormData({
        eventId: offer.eventId,
        name: offer.name,
        description: offer.description || '',
        type: offer.type,
        status: offer.status,
        price: offer.price,
        originalPrice: offer.originalPrice,
        discountPercentage: offer.discountPercentage,
        maxQuantity: offer.maxQuantity,
        maxPerUser: offer.maxPerUser,
        validFrom: offer.validFrom ? toDateTimeLocalFormat(offer.validFrom) : undefined,
        validUntil: offer.validUntil ? toDateTimeLocalFormat(offer.validUntil) : undefined,
        items: offer.items || [],
      } as any);
    } else if (!offer && isOpen) {
      // Reset form when creating new offer
      setFormData({
        eventId: '',
        name: '',
        description: '',
        type: 'BUNDLE',
        price: 0,
        originalPrice: undefined,
        discountPercentage: undefined,
        maxQuantity: undefined,
        maxPerUser: 1,
        validFrom: undefined,
        validUntil: undefined,
        items: [],
      });
      setCurrentItem({
        name: '',
        description: '',
        type: 'ENTRY',
        quantity: 1,
        braceletAmount: undefined,
        voucherDiscount: undefined,
      });
    }
  }, [offer, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.eventId) {
      newErrors.eventId = t('dashboard:offers.form.errors.event_required', { defaultValue: 'Event is required' });
    }

    if (!formData.name.trim()) {
      newErrors.name = t('dashboard:offers.form.errors.name_required', { defaultValue: 'Name is required' });
    }

    if (formData.price < 0) {
      newErrors.price = t('dashboard:offers.form.errors.price_invalid', { defaultValue: 'Price must be positive' });
    }

    if (formData.originalPrice !== undefined && formData.originalPrice < formData.price) {
      newErrors.originalPrice = t('dashboard:offers.form.errors.original_price_invalid', {
        defaultValue: 'Original price must be greater than price',
      });
    }

    if (
      formData.discountPercentage !== undefined &&
      (formData.discountPercentage < 0 || formData.discountPercentage > 100)
    ) {
      newErrors.discountPercentage = t('dashboard:offers.form.errors.discount_invalid', {
        defaultValue: 'Discount must be between 0 and 100',
      });
    }

    if (formData.maxQuantity !== undefined && formData.maxQuantity < 1) {
      newErrors.maxQuantity = t('dashboard:offers.form.errors.quantity_invalid', {
        defaultValue: 'Quantity must be at least 1',
      });
    }

    if (formData.maxPerUser !== undefined && formData.maxPerUser < 1) {
      newErrors.maxPerUser = t('dashboard:offers.form.errors.max_per_user_invalid', {
        defaultValue: 'Max per user must be at least 1',
      });
    }

    if (formData.validFrom && formData.validUntil) {
      const start = new Date(formData.validFrom);
      const end = new Date(formData.validUntil);
      if (end < start) {
        newErrors.validUntil = t('dashboard:offers.form.errors.valid_until_before_from', {
          defaultValue: 'Valid until must be after valid from',
        });
      }
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

      // Prepare data
      const dataToSend: CreateOfferRequest = {
        eventId: formData.eventId,
        name: formData.name,
        type: formData.type,
        price: formData.price,
        maxPerUser: formData.maxPerUser,
      };

      if (formData.description?.trim()) {
        dataToSend.description = formData.description;
      }

      if (formData.originalPrice !== undefined && formData.originalPrice > 0) {
        dataToSend.originalPrice = formData.originalPrice;
      }

      if (formData.discountPercentage !== undefined && formData.discountPercentage > 0) {
        dataToSend.discountPercentage = formData.discountPercentage;
      }

      if (formData.maxQuantity !== undefined && formData.maxQuantity > 0) {
        dataToSend.maxQuantity = formData.maxQuantity;
      }

      if (formData.validFrom) {
        dataToSend.validFrom = formData.validFrom;
      }

      if (formData.validUntil) {
        dataToSend.validUntil = formData.validUntil;
      }

      if (formData.items && formData.items.length > 0) {
        dataToSend.items = formData.items;
      }

      // Include status when editing
      if (isEditing && (formData as any).status) {
        (dataToSend as any).status = (formData as any).status;
      }

      if (isEditing && offer) {
        await updateOffer(offer.id, dataToSend);
      } else {
        await createOffer(dataToSend);
      }

      // Reset form
      setFormData({
        eventId: '',
        name: '',
        description: '',
        type: 'BUNDLE',
        price: 0,
        originalPrice: undefined,
        discountPercentage: undefined,
        maxQuantity: undefined,
        maxPerUser: 1,
        validFrom: undefined,
        validUntil: undefined,
        items: [],
      });
      setCurrentItem({
        name: '',
        description: '',
        type: 'ENTRY',
        quantity: 1,
        braceletAmount: undefined,
        voucherDiscount: undefined,
      });

      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = isEditing
        ? t('dashboard:offers.form.errors.update_failed', { defaultValue: 'Failed to update offer' })
        : t('dashboard:offers.form.errors.create_failed', { defaultValue: 'Failed to create offer' });
      setError(err instanceof Error ? err.message : errorMsg);
      console.error(`Error ${isEditing ? 'updating' : 'creating'} offer:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        eventId: '',
        name: '',
        description: '',
        type: 'BUNDLE',
        price: 0,
        originalPrice: undefined,
        discountPercentage: undefined,
        maxQuantity: undefined,
        maxPerUser: 1,
        validFrom: undefined,
        validUntil: undefined,
        items: [],
      });
      setCurrentItem({
        name: '',
        description: '',
        type: 'ENTRY',
        quantity: 1,
        braceletAmount: undefined,
        voucherDiscount: undefined,
      });
      setErrors({});
      setError('');
      onClose();
    }
  };

  const handleAddItem = () => {
    if (!currentItem.name.trim()) {
      alert(t('dashboard:offers.form.errors.item_name_required', { defaultValue: 'Item name is required' }));
      return;
    }

    const newItem = { ...currentItem };
    setFormData({
      ...formData,
      items: [...(formData.items || []), newItem],
    });

    // Reset current item
    setCurrentItem({
      name: '',
      description: '',
      type: 'ENTRY',
      quantity: 1,
      braceletAmount: undefined,
      voucherDiscount: undefined,
    });
  };

  const handleRemoveItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items?.filter((_, i) => i !== index) || [],
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        isEditing
          ? t('dashboard:offers.form.edit_title', { defaultValue: 'Edit Offer' })
          : t('dashboard:offers.form.create_title', { defaultValue: 'Create Offer' })
      }
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Event Selection */}
          <div className="md:col-span-2">
            <label htmlFor="eventId" className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard:offers.form.event', { defaultValue: 'Event' })} *
            </label>
            <select
              id="eventId"
              value={formData.eventId}
              onChange={(e) => setFormData({ ...formData, eventId: e.target.value })}
              className={`block w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                errors.eventId ? 'border-red-300' : 'border-gray-300'
              }`}
              disabled={loading || loadingEvents}
            >
              <option value="">
                {loadingEvents
                  ? t('dashboard:offers.form.loading_events', { defaultValue: 'Loading events...' })
                  : t('dashboard:offers.form.select_event', { defaultValue: 'Select an event' })}
              </option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name} - {new Date(event.startDate).toLocaleDateString()}
                </option>
              ))}
            </select>
            {errors.eventId && <p className="mt-1 text-sm text-red-600">{errors.eventId}</p>}
          </div>

          {/* Name */}
          <div className="md:col-span-2">
            <Input
              label={`${t('dashboard:offers.form.name', { defaultValue: 'Name' })} *`}
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              error={errors.name}
              disabled={loading}
              placeholder={t('dashboard:offers.form.name_placeholder', {
                defaultValue: 'e.g., Early Bird VIP Package',
              })}
            />
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard:offers.form.description', { defaultValue: 'Description' })}
            </label>
            <textarea
              id="description"
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
              placeholder={t('dashboard:offers.form.description_placeholder', {
                defaultValue: 'Describe what is included in this offer...',
              })}
            />
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard:offers.form.type', { defaultValue: 'Type' })} *
            </label>
            <select
              id="type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as OfferType })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="BUNDLE">{t('dashboard:offers.type_bundle', { defaultValue: 'Bundle' })}</option>
              <option value="EARLY_BIRD">{t('dashboard:offers.type_early_bird', { defaultValue: 'Early Bird' })}</option>
              <option value="DISCOUNT_PERCENTAGE">
                {t('dashboard:offers.type_discount', { defaultValue: 'Discount' })}
              </option>
            </select>
          </div>

          {/* Status (only shown when editing) */}
          {isEditing && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                {t('dashboard:offers.form.status', { defaultValue: 'Status' })} *
              </label>
              <select
                id="status"
                value={(formData as any).status || 'DRAFT'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as OfferStatus } as any)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="DRAFT">{t('dashboard:offers.status_draft', { defaultValue: 'Draft' })}</option>
                <option value="ACTIVE">{t('dashboard:offers.status_active', { defaultValue: 'Active' })}</option>
                <option value="INACTIVE">{t('dashboard:offers.status_inactive', { defaultValue: 'Inactive' })}</option>
                <option value="EXPIRED">{t('dashboard:offers.status_expired', { defaultValue: 'Expired' })}</option>
                <option value="SOLD_OUT">{t('dashboard:offers.status_sold_out', { defaultValue: 'Sold Out' })}</option>
              </select>
            </div>
          )}

          {/* Price */}
          <div>
            <Input
              label={`${t('dashboard:offers.form.price', { defaultValue: 'Price' })} (€) *`}
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
              error={errors.price}
              disabled={loading}
            />
          </div>

          {/* Original Price */}
          <div>
            <Input
              label={`${t('dashboard:offers.form.original_price', { defaultValue: 'Original Price' })} (€)`}
              type="number"
              step="0.01"
              min="0"
              value={formData.originalPrice || ''}
              onChange={(e) =>
                setFormData({ ...formData, originalPrice: e.target.value ? parseFloat(e.target.value) : undefined })
              }
              error={errors.originalPrice}
              disabled={loading}
            />
          </div>

          {/* Discount Percentage */}
          <div>
            <Input
              label={`${t('dashboard:offers.form.discount_percentage', { defaultValue: 'Discount %' })}`}
              type="number"
              step="1"
              min="0"
              max="100"
              value={formData.discountPercentage || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discountPercentage: e.target.value ? parseFloat(e.target.value) : undefined,
                })
              }
              error={errors.discountPercentage}
              disabled={loading}
            />
          </div>

          {/* Max Quantity */}
          <div>
            <Input
              label={t('dashboard:offers.form.max_quantity', { defaultValue: 'Max Quantity' })}
              type="number"
              min="1"
              value={formData.maxQuantity || ''}
              onChange={(e) =>
                setFormData({ ...formData, maxQuantity: e.target.value ? parseInt(e.target.value) : undefined })
              }
              error={errors.maxQuantity}
              disabled={loading}
              placeholder={t('dashboard:offers.form.unlimited', { defaultValue: 'Unlimited' })}
            />
          </div>

          {/* Max Per User */}
          <div>
            <Input
              label={`${t('dashboard:offers.form.max_per_user', { defaultValue: 'Max Per User' })} *`}
              type="number"
              min="1"
              value={formData.maxPerUser || 1}
              onChange={(e) => setFormData({ ...formData, maxPerUser: parseInt(e.target.value) || 1 })}
              error={errors.maxPerUser}
              disabled={loading}
            />
          </div>

          {/* Valid From */}
          <div>
            <Input
              label={t('dashboard:offers.form.valid_from', { defaultValue: 'Valid From' })}
              type="datetime-local"
              value={formData.validFrom || ''}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value || undefined })}
              disabled={loading}
            />
          </div>

          {/* Valid Until */}
          <div>
            <Input
              label={t('dashboard:offers.form.valid_until', { defaultValue: 'Valid Until' })}
              type="datetime-local"
              value={formData.validUntil || ''}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value || undefined })}
              error={errors.validUntil}
              disabled={loading}
            />
          </div>
        </div>

        {/* Items Section */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            {t('dashboard:offers.form.items_section', { defaultValue: 'Offer Items' })}
          </h3>

          {/* Add Item Form */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label={t('dashboard:offers.form.item_name', { defaultValue: 'Item Name' })}
                type="text"
                value={currentItem.name}
                onChange={(e) => setCurrentItem({ ...currentItem, name: e.target.value })}
                placeholder={t('dashboard:offers.form.item_name_placeholder', { defaultValue: 'e.g., Entry Ticket' })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('dashboard:offers.form.item_type', { defaultValue: 'Item Type' })}
                </label>
                <select
                  value={currentItem.type}
                  onChange={(e) => setCurrentItem({ ...currentItem, type: e.target.value as OfferItemType })}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ENTRY">{t('dashboard:offers.item_type_entry', { defaultValue: 'Entry' })}</option>
                  <option value="BRACELET">
                    {t('dashboard:offers.item_type_bracelet', { defaultValue: 'Bracelet' })}
                  </option>
                  <option value="VOUCHER">{t('dashboard:offers.item_type_voucher', { defaultValue: 'Voucher' })}</option>
                  <option value="MERCHANDISE">
                    {t('dashboard:offers.item_type_merchandise', { defaultValue: 'Merchandise' })}
                  </option>
                  <option value="SERVICE">{t('dashboard:offers.item_type_service', { defaultValue: 'Service' })}</option>
                </select>
              </div>

              <Input
                label={t('dashboard:offers.form.item_quantity', { defaultValue: 'Quantity' })}
                type="number"
                min="1"
                value={currentItem.quantity}
                onChange={(e) => setCurrentItem({ ...currentItem, quantity: parseInt(e.target.value) || 1 })}
              />

              {currentItem.type === 'BRACELET' && (
                <Input
                  label={t('dashboard:offers.form.bracelet_amount', { defaultValue: 'Preloaded Amount (€)' })}
                  type="number"
                  step="0.01"
                  min="0"
                  value={currentItem.braceletAmount || ''}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      braceletAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              )}

              {currentItem.type === 'VOUCHER' && (
                <Input
                  label={t('dashboard:offers.form.voucher_discount', { defaultValue: 'Discount %' })}
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={currentItem.voucherDiscount || ''}
                  onChange={(e) =>
                    setCurrentItem({
                      ...currentItem,
                      voucherDiscount: e.target.value ? parseFloat(e.target.value) : undefined,
                    })
                  }
                />
              )}
            </div>

            <Button type="button" variant="outline" size="sm" onClick={handleAddItem}>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('dashboard:offers.form.add_item', { defaultValue: 'Add Item' })}
            </Button>
          </div>

          {/* Items List */}
          {formData.items && formData.items.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">
                {t('dashboard:offers.form.included_items', { defaultValue: 'Included Items' })} ({formData.items.length})
              </h4>
              <div className="space-y-2">
                {formData.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">{item.type}</span>
                        {item.quantity > 1 && (
                          <span className="text-sm text-gray-600">x{item.quantity}</span>
                        )}
                      </div>
                      {item.braceletAmount && (
                        <span className="text-sm text-gray-600">€{item.braceletAmount} preloaded</span>
                      )}
                      {item.voucherDiscount && (
                        <span className="text-sm text-gray-600">{item.voucherDiscount}% discount</span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t">
          <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
            {t('dashboard:offers.form.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            {isEditing
              ? t('dashboard:offers.form.update', { defaultValue: 'Update Offer' })
              : t('dashboard:offers.form.create', { defaultValue: 'Create Offer' })}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateOfferModal;
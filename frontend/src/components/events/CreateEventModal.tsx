import { useState, useEffect } from 'react';
import type { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { createEvent, updateEvent, type CreateEventRequest, type Event } from '../../api/events';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  event?: Event | null; // Optional event for editing
}

const CreateEventModal = ({ isOpen, onClose, onSuccess, event }: CreateEventModalProps) => {
  const isEditing = !!event;
  const { t } = useTranslation(['dashboard']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState<CreateEventRequest>({
    name: '',
    description: '',
    location: '',
    address: '',
    startDate: '',
    endDate: '',
    status: 'DRAFT',
    capacity: undefined,
    images: [],
  });

  const [newImageUrl, setNewImageUrl] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper function to convert ISO date to datetime-local format
  const toDateTimeLocalFormat = (isoString: string): string => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Format: YYYY-MM-DDTHH:mm
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Initialize form with event data when editing
  useEffect(() => {
    if (event && isOpen) {
      setFormData({
        name: event.name,
        description: event.description || '',
        location: event.location,
        address: event.address || '',
        startDate: toDateTimeLocalFormat(event.startDate),
        endDate: toDateTimeLocalFormat(event.endDate),
        status: event.status,
        capacity: event.capacity,
        images: event.images || [],
      });
    } else if (!event && isOpen) {
      // Reset form when creating new event
      setFormData({
        name: '',
        description: '',
        location: '',
        address: '',
        startDate: '',
        endDate: '',
        status: 'DRAFT',
        capacity: undefined,
        images: [],
      });
    }
    setNewImageUrl('');
  }, [event, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('dashboard:events.form.errors.name_required');
    }

    if (!formData.location.trim()) {
      newErrors.location = t('dashboard:events.form.errors.location_required');
    }

    if (!formData.startDate) {
      newErrors.startDate = t('dashboard:events.form.errors.start_date_required');
    }

    if (!formData.endDate) {
      newErrors.endDate = t('dashboard:events.form.errors.end_date_required');
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end < start) {
        newErrors.endDate = t('dashboard:events.form.errors.end_date_before_start');
      }
    }

    if (formData.capacity !== undefined && formData.capacity < 1) {
      newErrors.capacity = t('dashboard:events.form.errors.capacity_invalid');
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

      // Prepare data - remove empty optional fields
      const dataToSend: CreateEventRequest = {
        name: formData.name,
        location: formData.location,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
      };

      if (formData.description?.trim()) {
        dataToSend.description = formData.description;
      }

      if (formData.address?.trim()) {
        dataToSend.address = formData.address;
      }

      if (formData.capacity !== undefined && formData.capacity > 0) {
        dataToSend.capacity = formData.capacity;
      }

      if (formData.images && formData.images.length > 0) {
        dataToSend.images = formData.images;
      }

      if (isEditing && event) {
        await updateEvent(event.id, dataToSend);
      } else {
        await createEvent(dataToSend);
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        location: '',
        address: '',
        startDate: '',
        endDate: '',
        status: 'DRAFT',
        capacity: undefined,
        images: [],
      });
      setNewImageUrl('');

      onSuccess();
      onClose();
    } catch (err) {
      const errorMsg = isEditing
        ? t('dashboard:events.form.errors.update_failed')
        : t('dashboard:events.form.errors.create_failed');
      setError(err instanceof Error ? err.message : errorMsg);
      console.error(`Error ${isEditing ? 'updating' : 'creating'} event:`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        name: '',
        description: '',
        location: '',
        address: '',
        startDate: '',
        endDate: '',
        status: 'DRAFT',
        capacity: undefined,
        images: [],
      });
      setNewImageUrl('');
      setErrors({});
      setError('');
      onClose();
    }
  };

  const handleAddImage = () => {
    if (newImageUrl.trim()) {
      setFormData({ ...formData, images: [...(formData.images || []), newImageUrl.trim()] });
      setNewImageUrl('');
    }
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = formData.images?.filter((_, i) => i !== index) || [];
    setFormData({ ...formData, images: updatedImages });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEditing ? t('dashboard:events.form.edit_title') : t('dashboard:events.form.create_title')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Event Name */}
        <Input
          label={t('dashboard:events.form.name')}
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          placeholder={t('dashboard:events.form.name_placeholder')}
          fullWidth
          required
        />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('dashboard:events.form.description')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('dashboard:events.form.description_placeholder')}
            rows={3}
            className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-accent-500 focus:ring-accent-500/20 transition-all duration-200"
          />
        </div>

        {/* Location */}
        <Input
          label={t('dashboard:events.form.location')}
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          error={errors.location}
          placeholder={t('dashboard:events.form.location_placeholder')}
          fullWidth
          required
        />

        {/* Address */}
        <Input
          label={t('dashboard:events.form.address')}
          type="text"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          placeholder={t('dashboard:events.form.address_placeholder')}
          fullWidth
        />

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={t('dashboard:events.form.start_date')}
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
            error={errors.startDate}
            fullWidth
            required
          />
          <Input
            label={t('dashboard:events.form.end_date')}
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
            error={errors.endDate}
            fullWidth
            required
          />
        </div>

        {/* Status and Capacity */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('dashboard:events.form.status')}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as CreateEventRequest['status'] })}
              className="block w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 focus:outline-none focus:ring-2 focus:border-accent-500 focus:ring-accent-500/20 transition-all duration-200"
            >
              <option value="DRAFT">{t('dashboard:events.form.status_draft')}</option>
              <option value="SCHEDULED">{t('dashboard:events.form.status_scheduled')}</option>
              <option value="ACTIVE">{t('dashboard:events.form.status_active')}</option>
              <option value="COMPLETED">{t('dashboard:events.form.status_completed')}</option>
              <option value="CANCELLED">{t('dashboard:events.form.status_cancelled')}</option>
            </select>
          </div>

          <Input
            label={t('dashboard:events.form.capacity')}
            type="number"
            value={formData.capacity?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value ? parseInt(e.target.value) : undefined })}
            error={errors.capacity}
            placeholder={t('dashboard:events.form.capacity_placeholder')}
            min="1"
            fullWidth
          />
        </div>

        {/* Event Images */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('dashboard:events.form.images', { defaultValue: 'Event Images' })}
          </label>
          <div className="flex gap-2 mb-3">
            <input
              type="url"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              placeholder={t('dashboard:events.form.image_url_placeholder', { defaultValue: 'https://example.com/image.jpg' })}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddImage();
                }
              }}
            />
            <Button type="button" variant="secondary" onClick={handleAddImage}>
              {t('dashboard:events.form.add_image', { defaultValue: 'Add' })}
            </Button>
          </div>
          {formData.images && formData.images.length > 0 && (
            <div className="space-y-2">
              {formData.images.map((img, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <img src={img} alt={`Preview ${index + 1}`} className="h-16 w-16 object-cover rounded" onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/64?text=Error';
                  }} />
                  <span className="flex-1 text-sm text-gray-700 truncate">{img}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-sm text-gray-500">
            {t('dashboard:events.form.images_help', { defaultValue: 'Add image URLs to display in the event preview' })}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            {t('dashboard:events.form.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            loading={loading}
            disabled={loading}
          >
            {isEditing ? t('dashboard:events.form.update') : t('dashboard:events.form.create')}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateEventModal;
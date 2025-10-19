import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { getEventById, type Event } from '../../api/events';
import { Button, LoadingState } from '../../components/ui';

const EventPreviewPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard']);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (eventId) {
      loadEvent(eventId);
    }
  }, [eventId]);

  const loadEvent = async (id: string) => {
    try {
      setLoading(true);
      setError('');
      const data = await getEventById(id);
      setEvent(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load event');
      console.error('Error loading event:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-500';
      case 'SCHEDULED':
        return 'bg-blue-500';
      case 'ACTIVE':
        return 'bg-green-500';
      case 'COMPLETED':
        return 'bg-purple-500';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-50 to-white">
        <LoadingState
          size="lg"
          message={t('dashboard:events.preview.loading')}
        />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-accent-50 to-white">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="mt-4 text-xl font-semibold text-gray-900">{t('dashboard:events.preview.not_found')}</h3>
          <p className="mt-2 text-gray-600">{error}</p>
          <div className="mt-6">
            <Button variant="primary" onClick={() => navigate('/dashboard/events')}>
              {t('dashboard:events.preview.back_to_events')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isSameDay = startDate.toDateString() === endDate.toDateString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent-50 via-white to-accent-50/30">
      {/* Header with back button */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/dashboard/events')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">{t('dashboard:events.preview.back_to_events')}</span>
          </button>
        </div>
      </div>

      {/* Event Preview */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Status Badge */}
        <div className="flex justify-center mb-6">
          <span className={`inline-flex items-center px-4 py-2 rounded-full text-white text-sm font-semibold ${getStatusColor(event.status)}`}>
            {event.status}
          </span>
        </div>

        {/* Event Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">{event.name}</h1>
          {event.description && (
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">{event.description}</p>
          )}
        </div>

        {/* Event Details Card */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
          <div className="p-8 md:p-12">
            {/* Date & Time */}
            <div className="flex items-start gap-6 mb-8 pb-8 border-b border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-accent-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('dashboard:events.preview.when')}
                </h3>
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-gray-900">
                    {startDate.toLocaleDateString(undefined, {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="text-gray-600">
                    {startDate.toLocaleTimeString(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' - '}
                    {isSameDay
                      ? endDate.toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : endDate.toLocaleString(undefined, {
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                  </p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div className="flex items-start gap-6 mb-8 pb-8 border-b border-gray-200">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-accent-100 flex items-center justify-center">
                  <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  {t('dashboard:events.preview.where')}
                </h3>
                <p className="text-lg font-semibold text-gray-900">{event.location}</p>
                {event.address && (
                  <p className="text-gray-600 mt-1">{event.address}</p>
                )}
              </div>
            </div>

            {/* Capacity */}
            {event.capacity && (
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-accent-100 flex items-center justify-center">
                    <svg className="w-8 h-8 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    {t('dashboard:events.preview.capacity')}
                  </h3>
                  <p className="text-lg font-semibold text-gray-900">
                    {t('dashboard:events.preview.up_to_attendees', { count: event.capacity })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate('/dashboard/events')}
          >
            {t('dashboard:events.preview.back_to_events')}
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              // In a real app, this would take the user to a registration/purchase page
              alert('Registration/Purchase functionality would go here!');
            }}
          >
            {t('dashboard:events.preview.register')}
          </Button>
        </div>

        {/* Preview Notice */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-blue-800">
            {t('dashboard:events.preview.preview_notice')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventPreviewPage;

// Event Management Page
// Centralized page for managing event packages and rewards

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, LoadingState, Button } from '../../components/ui';
import { getEventById, type Event } from '../../api/events';
import PackagesSection from '../../components/eventManage/PackagesSection';
import RewardsSection from '../../components/eventManage/RewardsSection';

type TabType = 'preevent' | 'event';

const EventManagePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard']);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('preevent');

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

  const loadEvent = async () => {
    if (!id) return;

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

  if (loading) {
    return (
      <LoadingState
        size="lg"
        message={t('dashboard:manage.loading', { defaultValue: 'Loading event...' })}
      />
    );
  }

  if (error || !event) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                {t('dashboard:manage.error_loading', { defaultValue: 'Error loading event' })}
              </h3>
              <p className="mt-1 text-sm text-red-700">{error || 'Event not found'}</p>
              <button
                onClick={() => navigate('/dashboard/events')}
                className="mt-2 text-sm font-medium text-red-800 hover:text-red-900"
              >
                {t('dashboard:manage.back_to_events', { defaultValue: 'Back to Events' })}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate('/dashboard/events')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-2"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('dashboard:manage.back', { defaultValue: 'Back to Events' })}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('dashboard:manage.title', { defaultValue: 'Manage Event' })}
          </h1>
          <p className="mt-2 text-gray-600">{event.name}</p>
        </div>
      </div>

      {/* Event Info Card */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">
                {t('dashboard:manage.event_status', { defaultValue: 'Status' })}
              </span>
              <span className="text-lg font-semibold text-gray-900">{event.status}</span>
            </div>
            <div className="h-12 w-px bg-gray-200"></div>
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">
                {t('dashboard:manage.event_dates', { defaultValue: 'Event Dates' })}
              </span>
              <span className="text-lg font-semibold text-gray-900">
                {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Card className="p-0">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('preevent')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'preevent'
                  ? 'border-accent-500 text-accent-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {t('dashboard:manage.tab_preevent', { defaultValue: 'Pre-event (Packages)' })}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('event')}
              className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'event'
                  ? 'border-accent-500 text-accent-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('dashboard:manage.tab_event', { defaultValue: 'Event (Rewards)' })}
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'preevent' ? (
            <PackagesSection eventId={event.id} />
          ) : (
            <RewardsSection eventId={event.id} />
          )}
        </div>
      </Card>
    </div>
  );
};

export default EventManagePage;
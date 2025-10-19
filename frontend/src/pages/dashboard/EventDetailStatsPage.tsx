import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, LoadingState, Button } from '../../components/ui';
import { getEvents, type Event } from '../../api/events';

const EventDetailStatsPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard']);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const events = await getEvents();
      const foundEvent = events.find((e) => e.id === eventId);
      setEvent(foundEvent || null);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message={t('dashboard:stats.loading', { defaultValue: 'Loading statistics...' })} />;
  }

  if (!event) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('dashboard:stats.event_not_found', { defaultValue: 'Event not found' })}
          </h2>
          <Button variant="primary" onClick={() => navigate('/dashboard/events')}>
            {t('dashboard:stats.back_to_events', { defaultValue: 'Back to Events' })}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/dashboard/events')}>
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('dashboard:events.preview.back_to_events', { defaultValue: 'Back to Events' })}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
            <p className="mt-1 text-gray-600">{event.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${
            event.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
            event.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800' :
            event.status === 'COMPLETED' ? 'bg-purple-100 text-purple-800' :
            event.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {t(`dashboard:events.status.${event.status}`, { defaultValue: event.status })}
          </span>
          {event.status === 'ACTIVE' && (
            <span className="px-2 py-1 text-xs font-bold rounded bg-red-600 text-white flex items-center gap-1 animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              {t('dashboard:events.live_now', { defaultValue: 'LIVE NOW' })}
            </span>
          )}
        </div>
      </div>

      {/* Event Basic Info Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('dashboard:stats.event_capacity', { defaultValue: 'Capacity' })}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{event.capacity || '∞'}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('dashboard:stats.event_duration', { defaultValue: 'Duration' })}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {Math.ceil((new Date(event.endDate).getTime() - new Date(event.startDate).getTime()) / (1000 * 60 * 60))}h
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('dashboard:stats.event_start', { defaultValue: 'Start Date' })}
              </p>
              <p className="text-lg font-bold text-gray-900 mt-2">
                {new Date(event.startDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('dashboard:stats.event_end', { defaultValue: 'End Date' })}
              </p>
              <p className="text-lg font-bold text-gray-900 mt-2">
                {new Date(event.endDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(event.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Stats - Placeholders */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t('dashboard:stats.payment_stats', { defaultValue: 'Payment Statistics' })}
          <span className="ml-3 text-sm font-normal text-gray-500">
            ({t('dashboard:stats.coming_soon', { defaultValue: 'Coming soon from Django' })})
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gray-50 opacity-50"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t('dashboard:stats.event_revenue', { defaultValue: 'Event Revenue' })}
                  </p>
                  <p className="text-3xl font-bold text-gray-400 mt-2">€0.00</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('dashboard:stats.pending_integration', { defaultValue: 'Pending Django integration' })}
                  </p>
                </div>
                <div className="p-3 bg-gray-200 rounded-lg">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gray-50 opacity-50"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t('dashboard:stats.total_transactions', { defaultValue: 'Transactions' })}
                  </p>
                  <p className="text-3xl font-bold text-gray-400 mt-2">0</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('dashboard:stats.pending_integration', { defaultValue: 'Pending Django integration' })}
                  </p>
                </div>
                <div className="p-3 bg-gray-200 rounded-lg">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>

          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gray-50 opacity-50"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t('dashboard:stats.avg_transaction', { defaultValue: 'Avg. Transaction' })}
                  </p>
                  <p className="text-3xl font-bold text-gray-400 mt-2">€0.00</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('dashboard:stats.pending_integration', { defaultValue: 'Pending Django integration' })}
                  </p>
                </div>
                <div className="p-3 bg-gray-200 rounded-lg">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Revenue Over Time - Placeholder Chart */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-50 opacity-30"></div>
        <div className="relative">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('dashboard:stats.revenue_over_time', { defaultValue: 'Revenue Over Time' })}
            <span className="ml-3 text-sm font-normal text-gray-500">
              ({t('dashboard:stats.coming_soon', { defaultValue: 'Coming soon from Django' })})
            </span>
          </h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="mx-auto w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <p className="text-sm">
                {t('dashboard:stats.chart_coming_soon', { defaultValue: 'Chart will display revenue trends over time' })}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* User Activations - Placeholder */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gray-50 opacity-30"></div>
        <div className="relative">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('dashboard:stats.user_activations', { defaultValue: 'User Activations' })}
            <span className="ml-3 text-sm font-normal text-gray-500">
              ({t('dashboard:stats.coming_soon', { defaultValue: 'Coming soon from Django' })})
            </span>
          </h3>
          <div className="h-64 flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="mx-auto w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <p className="text-sm">
                {t('dashboard:stats.activations_coming_soon', { defaultValue: 'Track user activations and engagement' })}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Transaction Types Distribution - Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gray-50 opacity-30"></div>
          <div className="relative">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('dashboard:stats.payment_methods', { defaultValue: 'Payment Methods' })}
              <span className="ml-3 text-sm font-normal text-gray-500">
                ({t('dashboard:stats.coming_soon', { defaultValue: 'Coming soon from Django' })})
              </span>
            </h3>
            <div className="h-48 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="mx-auto w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                <p className="text-xs">
                  {t('dashboard:stats.payment_dist', { defaultValue: 'Payment method distribution' })}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gray-50 opacity-30"></div>
          <div className="relative">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t('dashboard:stats.hourly_activity', { defaultValue: 'Hourly Activity' })}
              <span className="ml-3 text-sm font-normal text-gray-500">
                ({t('dashboard:stats.coming_soon', { defaultValue: 'Coming soon from Django' })})
              </span>
            </h3>
            <div className="h-48 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <svg className="mx-auto w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-xs">
                  {t('dashboard:stats.hourly_dist', { defaultValue: 'Activity by hour of day' })}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default EventDetailStatsPage;
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, LoadingState, Button } from '../../components/ui';
import { getEvents, type Event } from '../../api/events';

const EventStatsPage = () => {
  const { t } = useTranslation(['dashboard']);
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await getEvents();
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics for ALL events
  const totalEvents = events.length;
  const eventsByStatus = {
    DRAFT: events.filter((e) => e.status === 'DRAFT').length,
    SCHEDULED: events.filter((e) => e.status === 'SCHEDULED').length,
    ACTIVE: events.filter((e) => e.status === 'ACTIVE').length,
    COMPLETED: events.filter((e) => e.status === 'COMPLETED').length,
    CANCELLED: events.filter((e) => e.status === 'CANCELLED').length,
  };

  const totalCapacity = events.reduce((sum, event) => sum + (event.capacity || 0), 0);
  const avgCapacity = totalEvents > 0 ? Math.round(totalCapacity / totalEvents) : 0;

  // Get upcoming and past events
  const now = new Date();
  const upcomingEvents = events.filter((e) => new Date(e.startDate) > now).length;
  const pastEvents = events.filter((e) => new Date(e.endDate) < now).length;

  const handleViewEventStats = (eventId: string) => {
    navigate(`/dashboard/events/${eventId}/stats`);
  };

  if (loading) {
    return <LoadingState message={t('dashboard:stats.loading', { defaultValue: 'Loading statistics...' })} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t('dashboard:stats.title', { defaultValue: 'Event Statistics' })}
        </h1>
        <p className="mt-2 text-gray-600">
          {t('dashboard:stats.subtitle', {
            defaultValue: 'Analyze your events performance and insights',
          })}
        </p>
      </div>

      {/* Events List with Stats Buttons */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('dashboard:stats.event_details', { defaultValue: 'View Event Details' })}
        </h3>
        <div className="space-y-2">
          {events.slice(0, 10).map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-900">{event.name}</h4>
                <p className="text-xs text-gray-500">{event.location}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleViewEventStats(event.id)}>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {t('dashboard:stats.view_details', { defaultValue: 'View Details' })}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Events */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('dashboard:stats.total_events', { defaultValue: 'Total Events' })}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalEvents}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('dashboard:stats.upcoming_events', { defaultValue: 'Upcoming' })}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{upcomingEvents}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Past Events */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('dashboard:stats.past_events', { defaultValue: 'Past Events' })}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{pastEvents}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>

        {/* Average Capacity */}
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('dashboard:stats.avg_capacity', { defaultValue: 'Avg. Capacity' })}
              </p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{avgCapacity}</p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment Placeholders - Coming Soon */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t('dashboard:stats.payment_stats', { defaultValue: 'Payment Statistics' })}
          <span className="ml-3 text-sm font-normal text-gray-500">
            ({t('dashboard:stats.coming_soon', { defaultValue: 'Coming soon from Django' })})
          </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Revenue - Placeholder */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gray-50 opacity-50"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t('dashboard:stats.total_revenue', { defaultValue: 'Total Revenue' })}
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

          {/* Total Transactions - Placeholder */}
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

          {/* Tickets Sold - Placeholder */}
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gray-50 opacity-50"></div>
            <div className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    {t('dashboard:stats.tickets_sold', { defaultValue: 'Tickets Sold' })}
                  </p>
                  <p className="text-3xl font-bold text-gray-400 mt-2">0</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('dashboard:stats.pending_integration', { defaultValue: 'Pending Django integration' })}
                  </p>
                </div>
                <div className="p-3 bg-gray-200 rounded-lg">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  </svg>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Events Distribution by Status */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          {t('dashboard:stats.events_by_status', { defaultValue: 'Events by Status' })}
        </h3>
        <div className="space-y-4">
          {Object.entries(eventsByStatus).map(([status, count]) => {
            const percentage = totalEvents > 0 ? (count / totalEvents) * 100 : 0;
            const colors = {
              DRAFT: 'bg-gray-500',
              SCHEDULED: 'bg-blue-500',
              ACTIVE: 'bg-green-500',
              COMPLETED: 'bg-purple-500',
              CANCELLED: 'bg-red-500',
            };

            return (
              <div key={status}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{status}</span>
                  <span className="text-sm text-gray-600">
                    {count} ({percentage.toFixed(0)}%)
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${colors[status as keyof typeof colors]}`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Upcoming Events Timeline */}
      {upcomingEvents > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-6">
            {t('dashboard:stats.upcoming_timeline', { defaultValue: 'Upcoming Events Timeline' })}
          </h3>
          <div className="space-y-4">
            {events
              .filter((e) => new Date(e.startDate) > now)
              .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
              .slice(0, 5)
              .map((event) => (
                <div key={event.id} className="flex items-start gap-4 p-4 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0 w-16 text-center">
                    <div className="text-2xl font-bold text-accent-600">
                      {new Date(event.startDate).getDate()}
                    </div>
                    <div className="text-xs text-gray-500 uppercase">
                      {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short' })}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-base font-semibold text-gray-900">{event.name}</h4>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {new Date(event.startDate).toLocaleTimeString(undefined, {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        {event.location}
                      </span>
                    </div>
                  </div>
                  <div>
                    <span className="px-3 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                      {event.status}
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default EventStatsPage;
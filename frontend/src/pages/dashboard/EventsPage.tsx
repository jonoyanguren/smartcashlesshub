import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, Button, LoadingState } from '../../components/ui';
import { getEvents, type Event } from '../../api/events';
import CreateEventModal from '../../components/events/CreateEventModal';

const EventsPage = () => {
  const { t } = useTranslation(['dashboard']);
  const navigate = useNavigate();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Fetch events from API (only once on mount)
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getEvents(); // Load all events
      setEvents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load events');
      console.error('Error loading events:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter events locally
  const filteredEvents = events.filter((event) => {
    // Filter by status
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;

    // Filter by search text (name, location, description)
    const searchLower = searchText.toLowerCase();
    const matchesSearch = !searchText ||
      event.name.toLowerCase().includes(searchLower) ||
      event.location.toLowerCase().includes(searchLower) ||
      event.description?.toLowerCase().includes(searchLower);

    return matchesStatus && matchesSearch;
  });

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setShowCreateModal(true);
  };

  const handleViewEvent = (eventId: string) => {
    navigate(`/dashboard/events/${eventId}/preview`);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingEvent(null);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-purple-100 text-purple-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (loading && events.length === 0) {
    return (
      <LoadingState
        size="lg"
        message={t('dashboard:events.loading', { defaultValue: 'Loading events...' })}
      />
    );
  }

  return (
    <div className="space-y-6">
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
              <h3 className="text-sm font-medium text-red-800">
                {t('dashboard:events.error_loading', { defaultValue: 'Error loading events' })}
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={loadEvents}
                className="mt-2 text-sm font-medium text-red-800 hover:text-red-900"
              >
                {t('dashboard:events.try_again', { defaultValue: 'Try again' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('dashboard:events.title', { defaultValue: 'Events' })}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('dashboard:events.subtitle', {
              defaultValue: 'Manage your events and track attendance',
            })}
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setShowCreateModal(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('dashboard:events.create_event', { defaultValue: 'Create Event' })}
        </Button>
      </div>

      {/* Filters and View Toggle */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            >
              <option value="all">
                {t('dashboard:events.all_statuses', { defaultValue: 'All Statuses' })}
              </option>
              <option value="DRAFT">Draft</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="ACTIVE">Active</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder={t('dashboard:events.search_placeholder', {
                defaultValue: 'Search events...',
              })}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('grid')}
              className={`p-2 rounded-lg transition-colors ${
                view === 'grid'
                  ? 'bg-accent-100 text-accent-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
            <button
              onClick={() => setView('list')}
              className={`p-2 rounded-lg transition-colors ${
                view === 'list'
                  ? 'bg-accent-100 text-accent-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </Card>

      {/* Events Grid/List */}
      {view === 'grid' ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <Card key={event.id} hoverable className="cursor-pointer">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {event.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      event.status
                    )}`}
                  >
                    {event.status}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>
                      {new Date(event.startDate).toLocaleDateString()} -{' '}
                      {new Date(event.endDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{event.location}</span>
                  </div>
                  {event.capacity && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      <span>
                        {t('dashboard:events.capacity', { defaultValue: 'Capacity' })}: {event.capacity}
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200 flex gap-2">
                  <Button variant="outline" size="sm" fullWidth onClick={() => handleEditEvent(event)}>
                    {t('dashboard:events.edit', { defaultValue: 'Edit' })}
                  </Button>
                  <Button variant="primary" size="sm" fullWidth onClick={() => handleViewEvent(event.id)}>
                    {t('dashboard:events.view', { defaultValue: 'View' })}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard:events.table.name', { defaultValue: 'Event Name' })}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard:events.table.status', { defaultValue: 'Status' })}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard:events.table.dates', { defaultValue: 'Dates' })}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard:events.table.attendees', { defaultValue: 'Attendees' })}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard:events.table.actions', { defaultValue: 'Actions' })}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{event.name}</div>
                      <div className="text-sm text-gray-500">{event.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                          event.status
                        )}`}
                      >
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(event.startDate).toLocaleDateString()} -{' '}
                      {new Date(event.endDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {event.capacity
                        ? `${t('dashboard:events.max', { defaultValue: 'Max' })}: ${event.capacity}`
                        : t('dashboard:events.unlimited', { defaultValue: 'Unlimited' })
                      }
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditEvent(event)}
                        className="text-accent-600 hover:text-accent-900 mr-4"
                      >
                        {t('dashboard:events.edit', { defaultValue: 'Edit' })}
                      </button>
                      <button
                        onClick={() => handleViewEvent(event.id)}
                        className="text-accent-600 hover:text-accent-900"
                      >
                        {t('dashboard:events.view', { defaultValue: 'View' })}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {filteredEvents.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {t('dashboard:events.no_events', { defaultValue: 'No events' })}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('dashboard:events.no_events_desc', {
                defaultValue: 'Get started by creating a new event.',
              })}
            </p>
            <div className="mt-6">
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('dashboard:events.create_event', { defaultValue: 'Create Event' })}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Create/Edit Event Modal */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={() => {
          loadEvents(); // Refresh events list
          handleCloseModal();
        }}
        event={editingEvent}
      />
    </div>
  );
};

export default EventsPage;
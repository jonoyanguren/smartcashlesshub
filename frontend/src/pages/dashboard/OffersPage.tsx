import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, Button, LoadingState } from '../../components/ui';
import { getOffers, deleteOffer, type Offer, type OfferStatus, type OfferType } from '../../api/offers';
import { getEvents, type Event } from '../../api/events';
import CreateOfferModal from '../../components/offers/CreateOfferModal';

const OffersPage = () => {
  const { t } = useTranslation(['dashboard']);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);

  // Fetch offers and events from API
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [offersData, eventsData] = await Promise.all([
        getOffers(),
        getEvents()
      ]);
      setOffers(offersData);
      setEvents(eventsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load offers');
      console.error('Error loading offers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter offers locally
  const filteredOffers = offers.filter((offer) => {
    // Filter by status
    const matchesStatus = statusFilter === 'all' || offer.status === statusFilter;

    // Filter by type
    const matchesType = typeFilter === 'all' || offer.type === typeFilter;

    // Filter by event
    const matchesEvent = eventFilter === 'all' || offer.eventId === eventFilter;

    // Filter by search text (name, description)
    const searchLower = searchText.toLowerCase();
    const matchesSearch = !searchText ||
      offer.name.toLowerCase().includes(searchLower) ||
      offer.description?.toLowerCase().includes(searchLower);

    return matchesStatus && matchesType && matchesEvent && matchesSearch;
  });

  const handleDeleteOffer = async (offerId: string) => {
    if (!confirm(t('dashboard:offers.confirm_delete', { defaultValue: 'Are you sure you want to delete this offer?' }))) {
      return;
    }

    try {
      await deleteOffer(offerId);
      await loadData(); // Reload data
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete offer');
    }
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingOffer(null);
  };

  const getStatusColor = (status: OfferStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-gray-100 text-gray-800';
      case 'ACTIVE':
        return 'bg-green-100 text-green-800';
      case 'INACTIVE':
        return 'bg-yellow-100 text-yellow-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      case 'SOLD_OUT':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: OfferType) => {
    switch (type) {
      case 'BUNDLE':
        return 'bg-blue-100 text-blue-800';
      case 'EARLY_BIRD':
        return 'bg-orange-100 text-orange-800';
      case 'DISCOUNT_PERCENTAGE':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeLabel = (type: OfferType) => {
    switch (type) {
      case 'BUNDLE':
        return t('dashboard:offers.type_bundle', { defaultValue: 'Bundle' });
      case 'EARLY_BIRD':
        return t('dashboard:offers.type_early_bird', { defaultValue: 'Early Bird' });
      case 'DISCOUNT_PERCENTAGE':
        return t('dashboard:offers.type_discount', { defaultValue: 'Discount' });
      default:
        return type;
    }
  };

  // Loading state
  if (loading && offers.length === 0) {
    return (
      <LoadingState
        size="lg"
        message={t('dashboard:offers.loading', { defaultValue: 'Loading offers...' })}
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
                {t('dashboard:offers.error_loading', { defaultValue: 'Error loading offers' })}
              </h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={loadData}
                className="mt-2 text-sm font-medium text-red-800 hover:text-red-900"
              >
                {t('dashboard:offers.try_again', { defaultValue: 'Try again' })}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('dashboard:offers.title', { defaultValue: 'Offers & Packages' })}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('dashboard:offers.subtitle', {
              defaultValue: 'Create and manage pre-sale offers for your events',
            })}
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setShowCreateModal(true)}>
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('dashboard:offers.create_new', { defaultValue: 'Create Offer' })}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <div className="p-4 space-y-4">
          {/* Search Bar */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard:offers.search', { defaultValue: 'Search' })}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                id="search"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                placeholder={t('dashboard:offers.search_placeholder', { defaultValue: 'Search by name or description...' })}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-2">
                {t('dashboard:offers.filter_status', { defaultValue: 'Status' })}
              </label>
              <select
                id="status-filter"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">{t('dashboard:offers.all_statuses', { defaultValue: 'All Statuses' })}</option>
                <option value="DRAFT">{t('dashboard:offers.status_draft', { defaultValue: 'Draft' })}</option>
                <option value="ACTIVE">{t('dashboard:offers.status_active', { defaultValue: 'Active' })}</option>
                <option value="INACTIVE">{t('dashboard:offers.status_inactive', { defaultValue: 'Inactive' })}</option>
                <option value="EXPIRED">{t('dashboard:offers.status_expired', { defaultValue: 'Expired' })}</option>
                <option value="SOLD_OUT">{t('dashboard:offers.status_sold_out', { defaultValue: 'Sold Out' })}</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label htmlFor="type-filter" className="block text-sm font-medium text-gray-700 mb-2">
                {t('dashboard:offers.filter_type', { defaultValue: 'Type' })}
              </label>
              <select
                id="type-filter"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">{t('dashboard:offers.all_types', { defaultValue: 'All Types' })}</option>
                <option value="BUNDLE">{t('dashboard:offers.type_bundle', { defaultValue: 'Bundle' })}</option>
                <option value="EARLY_BIRD">{t('dashboard:offers.type_early_bird', { defaultValue: 'Early Bird' })}</option>
                <option value="DISCOUNT_PERCENTAGE">{t('dashboard:offers.type_discount', { defaultValue: 'Discount' })}</option>
              </select>
            </div>

            {/* Event Filter */}
            <div>
              <label htmlFor="event-filter" className="block text-sm font-medium text-gray-700 mb-2">
                {t('dashboard:offers.filter_event', { defaultValue: 'Event' })}
              </label>
              <select
                id="event-filter"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                value={eventFilter}
                onChange={(e) => setEventFilter(e.target.value)}
              >
                <option value="all">{t('dashboard:offers.all_events', { defaultValue: 'All Events' })}</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-4">
            <div className="text-sm font-medium text-gray-600">
              {t('dashboard:offers.total_offers', { defaultValue: 'Total Offers' })}
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-900">{filteredOffers.length}</div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm font-medium text-gray-600">
              {t('dashboard:offers.active_offers', { defaultValue: 'Active' })}
            </div>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {filteredOffers.filter(o => o.status === 'ACTIVE').length}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm font-medium text-gray-600">
              {t('dashboard:offers.draft_offers', { defaultValue: 'Draft' })}
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-600">
              {filteredOffers.filter(o => o.status === 'DRAFT').length}
            </div>
          </div>
        </Card>
        <Card>
          <div className="p-4">
            <div className="text-sm font-medium text-gray-600">
              {t('dashboard:offers.sold_out', { defaultValue: 'Sold Out' })}
            </div>
            <div className="mt-2 text-3xl font-bold text-purple-600">
              {filteredOffers.filter(o => o.status === 'SOLD_OUT').length}
            </div>
          </div>
        </Card>
      </div>

      {/* Offers List */}
      {filteredOffers.length === 0 ? (
        <Card>
          <div className="p-12 text-center">
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {t('dashboard:offers.no_offers', { defaultValue: 'No offers found' })}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('dashboard:offers.no_offers_description', {
                defaultValue: 'Get started by creating a new offer for your events.',
              })}
            </p>
            <div className="mt-6">
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                {t('dashboard:offers.create_first', { defaultValue: 'Create your first offer' })}
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredOffers.map((offer) => (
            <Card key={offer.id}>
              <div className="p-6 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900">{offer.name}</h3>
                    {offer.description && (
                      <p className="mt-1 text-sm text-gray-600 line-clamp-2">{offer.description}</p>
                    )}
                  </div>
                </div>

                {/* Event & Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(offer.status)}`}>
                    {offer.status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(offer.type)}`}>
                    {getTypeLabel(offer.type)}
                  </span>
                </div>

                {offer.event && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{t('dashboard:offers.event', { defaultValue: 'Event' })}:</span> {offer.event.name}
                  </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-2">
                  {offer.originalPrice && offer.originalPrice > offer.price && (
                    <span className="text-lg text-gray-400 line-through">€{offer.originalPrice.toFixed(2)}</span>
                  )}
                  <span className="text-2xl font-bold text-gray-900">€{offer.price.toFixed(2)}</span>
                  {offer.discountPercentage && (
                    <span className="text-sm text-green-600">-{offer.discountPercentage}%</span>
                  )}
                </div>

                {/* Items */}
                {offer.items && offer.items.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">
                      {t('dashboard:offers.includes', { defaultValue: 'Includes' })}:
                    </span>
                    <ul className="mt-1 space-y-1">
                      {offer.items.slice(0, 3).map((item) => (
                        <li key={item.id} className="text-gray-600">
                          • {item.quantity > 1 && `${item.quantity}x `}{item.name}
                        </li>
                      ))}
                      {offer.items.length > 3 && (
                        <li className="text-gray-500 italic">
                          +{offer.items.length - 3} {t('dashboard:offers.more_items', { defaultValue: 'more items' })}
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                {/* Stock */}
                {offer.maxQuantity && (
                  <div className="text-sm">
                    <div className="flex justify-between text-gray-600 mb-1">
                      <span>{t('dashboard:offers.sold', { defaultValue: 'Sold' })}</span>
                      <span>{offer.soldQuantity} / {offer.maxQuantity}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(offer.soldQuantity / offer.maxQuantity) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEditOffer(offer)}>
                    {t('dashboard:offers.edit', { defaultValue: 'Edit' })}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteOffer(offer.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {t('dashboard:offers.delete', { defaultValue: 'Delete' })}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Offer Modal */}
      <CreateOfferModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={loadData}
        offer={editingOffer}
      />
    </div>
  );
};

export default OffersPage;
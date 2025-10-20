import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, Button, LoadingState } from '../../components/ui';
import { getUserDetails, type UserDetail } from '../../api/users';

const UserDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard']);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedEvent, setSelectedEvent] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  useEffect(() => {
    if (id) {
      loadUserDetails(id);
    }
  }, [id]);

  const loadUserDetails = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUserDetails(userId);
      setUser(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load user details');
      console.error('Error loading user details:', err);
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'TENANT_ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'TENANT_STAFF':
        return 'bg-blue-100 text-blue-800';
      case 'END_USER':
        return 'bg-gray-100 text-gray-800';
      case 'SUPERADMIN':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'TENANT_ADMIN':
        return t('dashboard:users.roles.tenant_admin');
      case 'TENANT_STAFF':
        return t('dashboard:users.roles.tenant_staff');
      case 'END_USER':
        return t('dashboard:users.roles.end_user');
      case 'SUPERADMIN':
        return t('dashboard:users.roles.superadmin');
      default:
        return role;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'REFUNDED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPaymentMethod = (method: string) => {
    return method.charAt(0) + method.slice(1).toLowerCase();
  };

  // Get unique events the user has attended
  const eventsAttended = useMemo(() => {
    if (!user) return [];

    const eventMap = new Map();
    user.paymentHistory.forEach((payment) => {
      if (!eventMap.has(payment.event.id)) {
        eventMap.set(payment.event.id, {
          ...payment.event,
          paymentCount: 1,
          totalSpent: payment.amount,
        });
      } else {
        const existing = eventMap.get(payment.event.id);
        existing.paymentCount += 1;
        existing.totalSpent += payment.amount;
      }
    });

    return Array.from(eventMap.values()).sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    );
  }, [user]);

  // Filtered payment history
  const filteredPayments = useMemo(() => {
    if (!user) return [];

    let filtered = [...user.paymentHistory];

    // Filter by event
    if (selectedEvent !== 'all') {
      filtered = filtered.filter((p) => p.event.id === selectedEvent);
    }

    // Filter by date from
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter((p) => new Date(p.createdAt) >= fromDate);
    }

    // Filter by date to
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter((p) => new Date(p.createdAt) <= toDate);
    }

    return filtered;
  }, [user, selectedEvent, dateFrom, dateTo]);

  if (loading) {
    return (
      <LoadingState
        message={t('dashboard:users.detail.loading', { defaultValue: 'Loading user details...' })}
      />
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error || 'User not found'}</h3>
            </div>
          </div>
        </div>
        <Button variant="secondary" onClick={() => navigate('/dashboard/users')}>
          {t('dashboard:users.detail.back', { defaultValue: 'Back to Users' })}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button variant="secondary" onClick={() => navigate('/dashboard/users')}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t('dashboard:users.detail.back', { defaultValue: 'Back' })}
        </Button>
      </div>

      {/* User Info Header */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            <div className="h-20 w-20 rounded-full bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white font-semibold text-2xl">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {user.firstName} {user.lastName}
              </h1>
              <p className="text-gray-600 mt-1">{user.email}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(user.role)}`}>
                  {getRoleLabel(user.role)}
                </span>
                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {user.isActive ? t('dashboard:users.status.active') : t('dashboard:users.status.inactive')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional User Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-500">{t('dashboard:users.detail.phone', { defaultValue: 'Phone' })}</p>
            <p className="text-sm font-medium text-gray-900">{user.phone || '-'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('dashboard:users.detail.joined', { defaultValue: 'Joined' })}</p>
            <p className="text-sm font-medium text-gray-900">{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('dashboard:users.detail.last_updated', { defaultValue: 'Last Updated' })}</p>
            <p className="text-sm font-medium text-gray-900">{new Date(user.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </Card>

      {/* Payment Summary Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {t('dashboard:users.detail.payment_summary', { defaultValue: 'Payment Summary' })}
        </h2>
      </div>

      {/* Payment Summary Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-green-100 rounded-lg text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">
                {t('dashboard:users.detail.total_spent', { defaultValue: 'Total Spent' })}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {user.paymentSummary.currency} {user.paymentSummary.totalSpent}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">
                {t('dashboard:users.detail.total_transactions', { defaultValue: 'Total Transactions' })}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {user.paymentSummary.totalTransactions}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">
                {t('dashboard:users.detail.average_transaction', { defaultValue: 'Avg Transaction' })}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {user.paymentSummary.currency} {user.paymentSummary.averageTransaction}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">
                {t('dashboard:users.detail.completed_transactions', { defaultValue: 'Completed' })}
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {user.paymentSummary.completedTransactions}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('dashboard:users.detail.pending_transactions', { defaultValue: 'Pending Transactions' })}
            </p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {user.paymentSummary.pendingTransactions}
            </p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('dashboard:users.detail.refunded_transactions', { defaultValue: 'Refunded Transactions' })}
            </p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {user.paymentSummary.refundedTransactions}
            </p>
          </div>
        </Card>

        <Card>
          <div>
            <p className="text-sm font-medium text-gray-500">
              {t('dashboard:users.detail.last_payment', { defaultValue: 'Last Payment' })}
            </p>
            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {user.paymentSummary.lastPaymentDate
                ? new Date(user.paymentSummary.lastPaymentDate).toLocaleDateString()
                : '-'
              }
            </p>
          </div>
        </Card>
      </div>

      {/* Events Attended */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {t('dashboard:users.detail.events_attended', { defaultValue: 'Events Attended' })}
        </h2>
      </div>

      {eventsAttended.length === 0 ? (
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
              {t('dashboard:users.detail.no_events', { defaultValue: 'No events attended' })}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('dashboard:users.detail.no_events_desc', {
                defaultValue: 'This user has not attended any events yet.',
              })}
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {eventsAttended.map((event) => (
            <Card key={event.id}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-indigo-100 rounded-lg text-indigo-600">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900">{event.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{event.location}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(event.startDate).toLocaleDateString()}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-gray-500">
                      {event.paymentCount} {event.paymentCount === 1 ? 'payment' : 'payments'}
                    </span>
                    <span className="font-semibold text-gray-900">
                      {user.paymentSummary.currency} {event.totalSpent.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Payment History */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          {t('dashboard:users.detail.payment_history', { defaultValue: 'Payment History' })}
        </h2>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard:users.detail.filter_by_event', { defaultValue: 'Filter by Event' })}
            </label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            >
              <option value="all">
                {t('dashboard:users.detail.all_events', { defaultValue: 'All Events' })}
              </option>
              {eventsAttended.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard:users.detail.date_from', { defaultValue: 'From Date' })}
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('dashboard:users.detail.date_to', { defaultValue: 'To Date' })}
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
            />
          </div>
        </div>
        {(selectedEvent !== 'all' || dateFrom || dateTo) && (
          <div className="mt-4">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedEvent('all');
                setDateFrom('');
                setDateTo('');
              }}
            >
              {t('dashboard:users.detail.clear_filters', { defaultValue: 'Clear Filters' })}
            </Button>
          </div>
        )}
      </Card>

      <Card>
        {filteredPayments.length === 0 ? (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {t('dashboard:users.detail.no_payments', { defaultValue: 'No payment history' })}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('dashboard:users.detail.no_payments_desc', {
                defaultValue: user.paymentHistory.length === 0
                  ? 'This user has not made any payments yet.'
                  : 'No payments match the selected filters.',
              })}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard:users.detail.table.date', { defaultValue: 'Date' })}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard:users.detail.table.event', { defaultValue: 'Event' })}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard:users.detail.table.amount', { defaultValue: 'Amount' })}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard:users.detail.table.method', { defaultValue: 'Method' })}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('dashboard:users.detail.table.status', { defaultValue: 'Status' })}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(payment.createdAt).toLocaleDateString()}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(payment.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.event.name}</div>
                      <div className="text-sm text-gray-500">{payment.event.location}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {payment.currency} {payment.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatPaymentMethod(payment.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(payment.status)}`}>
                        {payment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default UserDetailPage;
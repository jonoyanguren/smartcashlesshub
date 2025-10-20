import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, LoadingState, Button } from '../../components/ui';
import { getEvents, type Event } from '../../api/events';
import { getEventPaymentStats, type PaymentStats } from '../../api/payments';
import { exportEventStats, type ReportFormat } from '../../api/reports';

const EventDetailStatsPage = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(['dashboard']);
  const [event, setEvent] = useState<Event | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(60); // seconds (default: 1 minute)
  const [exporting, setExporting] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh && event) {
      intervalRef.current = setInterval(() => {
        handleRefresh();
      }, refreshInterval * 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, event]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const events = await getEvents();
      const foundEvent = events.find((e) => e.id === eventId);
      setEvent(foundEvent || null);

      // Load payment stats if event found
      if (foundEvent) {
        loadPaymentStats(foundEvent.id);
      }
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentStats = async (eventId: string) => {
    try {
      setStatsLoading(true);
      const stats = await getEventPaymentStats(eventId);
      setPaymentStats(stats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading payment stats:', error);
      // Don't show error to user - just keep showing no data
    } finally {
      setStatsLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!event) return;
    try {
      setRefreshing(true);
      const stats = await getEventPaymentStats(event.id);
      setPaymentStats(stats);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error refreshing payment stats:', error);
    } finally {
      setRefreshing(false);
    }
  };

  // Helper to format "time ago"
  const getTimeAgo = (date: Date | null): string => {
    if (!date) return '';
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 10) return t('dashboard:stats.just_now', { defaultValue: 'just now' });
    if (seconds < 60) return t('dashboard:stats.seconds_ago', { defaultValue: `${seconds}s ago`, count: seconds });

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return t('dashboard:stats.minutes_ago', { defaultValue: `${minutes}m ago`, count: minutes });

    const hours = Math.floor(minutes / 60);
    return t('dashboard:stats.hours_ago', { defaultValue: `${hours}h ago`, count: hours });
  };

  // Handle export
  const handleExport = async (format: ReportFormat) => {
    if (!event) return;
    try {
      setExporting(true);
      setShowExportMenu(false);
      await exportEventStats(event.id, format);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    } finally {
      setExporting(false);
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
          {/* Export Button with Dropdown - Only for COMPLETED events */}
          {event.status === 'COMPLETED' && (
            <div className="relative">
              <Button
                variant="outline"
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={exporting}
                className="flex items-center gap-2"
              >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {exporting ? t('dashboard:stats.exporting', { defaultValue: 'Exporting...' }) : t('dashboard:stats.export', { defaultValue: 'Export' })}
            </Button>

            {showExportMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleExport('excel')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    CSV (.csv)
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    PDF (.pdf)
                  </button>
                </div>
              </div>
            )}
            </div>
          )}

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

      {/* Refresh Controls - Only show for ACTIVE events */}
      {event.status === 'ACTIVE' && (
        <Card>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Manual Refresh Button */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2"
            >
              <svg
                className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {t('dashboard:stats.refresh', { defaultValue: 'Refresh' })}
            </Button>

            {/* Last Updated Indicator */}
            {lastUpdated && (
              <span className="text-sm text-gray-500">
                {t('dashboard:stats.updated', { defaultValue: 'Updated' })} {getTimeAgo(lastUpdated)}
              </span>
            )}
          </div>

          {/* Auto-Refresh Controls */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4 text-accent-600 border-gray-300 rounded focus:ring-accent-500"
              />
              <span className="text-sm font-medium text-gray-700">
                {t('dashboard:stats.auto_refresh', { defaultValue: 'Auto-refresh' })}
              </span>
            </label>

            {/* Interval Selector */}
            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
              >
                <option value={60}>1m</option>
                <option value={180}>3m</option>
                <option value={300}>5m</option>
              </select>
            )}
          </div>
        </div>
      </Card>
      )}

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

      {/* Payment Stats - Real Data */}
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {t('dashboard:stats.payment_stats', { defaultValue: 'Payment Statistics' })}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('dashboard:stats.event_revenue', { defaultValue: 'Event Revenue' })}
                </p>
                {statsLoading ? (
                  <p className="text-3xl font-bold text-gray-400 mt-2">{t('dashboard:stats.loading_data', { defaultValue: '...' })}</p>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      €{paymentStats?.totalRevenue.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      {paymentStats?.totalTransactions || 0} {t('dashboard:stats.completed_payments', { defaultValue: 'completed payments' })}
                    </p>
                  </>
                )}
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('dashboard:stats.total_transactions', { defaultValue: 'Transactions' })}
                </p>
                {statsLoading ? (
                  <p className="text-3xl font-bold text-gray-400 mt-2">{t('dashboard:stats.loading_data', { defaultValue: '...' })}</p>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {paymentStats?.totalTransactions || 0}
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {t('dashboard:stats.completed_payments_label', { defaultValue: 'Completed payments' })}
                    </p>
                  </>
                )}
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {t('dashboard:stats.avg_transaction', { defaultValue: 'Avg. Transaction' })}
                </p>
                {statsLoading ? (
                  <p className="text-3xl font-bold text-gray-400 mt-2">{t('dashboard:stats.loading_data', { defaultValue: '...' })}</p>
                ) : (
                  <>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      €{paymentStats?.avgTransaction.toFixed(2) || '0.00'}
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      {t('dashboard:stats.per_transaction', { defaultValue: 'Per transaction' })}
                    </p>
                  </>
                )}
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Revenue Over Time - Real Data */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('dashboard:stats.revenue_over_time', { defaultValue: 'Revenue Over Time' })}
        </h3>
        {statsLoading ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-400">{t('dashboard:stats.loading_data', { defaultValue: 'Loading...' })}</p>
          </div>
        ) : paymentStats && Object.keys(paymentStats.revenueByHour).length > 0 ? (
          <div className="h-64">
            <div className="flex items-end justify-between h-full pb-8 gap-2">
              {Array.from({ length: 24 }, (_, hour) => {
                const revenue = paymentStats.revenueByHour[hour] || 0;
                const maxRevenue = Math.max(...Object.values(paymentStats.revenueByHour), 1);
                const heightPercentage = (revenue / maxRevenue) * 100;
                const hasData = revenue > 0;
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                    <div
                      className={`w-full rounded-t transition-all ${hasData ? 'bg-gradient-to-t from-green-500 to-green-400 hover:from-green-600 hover:to-green-500' : 'bg-gray-200'}`}
                      style={{ height: `${Math.max(heightPercentage, hasData ? 3 : 1)}%` }}
                    >
                      {hasData && (
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {hour}:00<br/>€{revenue.toFixed(2)}
                        </div>
                      )}
                    </div>
                    {hour % 3 === 0 && (
                      <span className="text-xs text-gray-500 mt-2 absolute bottom-0">{hour}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-400 text-sm">{t('dashboard:stats.no_revenue_data', { defaultValue: 'No revenue data available' })}</p>
          </div>
        )}
      </Card>

      {/* User Activations - Real Data */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {t('dashboard:stats.user_activations', { defaultValue: 'Payment Activity Summary' })}
        </h3>
        {statsLoading ? (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-400">{t('dashboard:stats.loading_data', { defaultValue: 'Loading...' })}</p>
          </div>
        ) : paymentStats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-blue-500 rounded-full">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-blue-900">{paymentStats.totalTransactions}</p>
              <p className="text-sm text-blue-700 mt-1">{t('dashboard:stats.total_payments_label', { defaultValue: 'Total Payments' })}</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-green-500 rounded-full">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-green-900">
                €{paymentStats.totalRevenue.toFixed(0)}
              </p>
              <p className="text-sm text-green-700 mt-1">{t('dashboard:stats.total_revenue_label', { defaultValue: 'Total Revenue' })}</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-purple-500 rounded-full">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-purple-900">
                €{paymentStats.avgTransaction.toFixed(2)}
              </p>
              <p className="text-sm text-purple-700 mt-1">{t('dashboard:stats.avg_transaction_label', { defaultValue: 'Avg. Transaction' })}</p>
            </div>

            <div className="text-center p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-amber-500 rounded-full">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <p className="text-3xl font-bold text-amber-900">
                {Object.keys(paymentStats.revenueByHour).length}
              </p>
              <p className="text-sm text-amber-700 mt-1">{t('dashboard:stats.active_hours_label', { defaultValue: 'Active Hours' })}</p>
            </div>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-400 text-sm">{t('dashboard:stats.no_activity_data', { defaultValue: 'No activity data available' })}</p>
          </div>
        )}
      </Card>

      {/* Transaction Types Distribution - Real Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('dashboard:stats.payment_methods', { defaultValue: 'Payment Methods' })}
          </h3>
          {statsLoading ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-gray-400">{t('dashboard:stats.loading_data', { defaultValue: 'Loading...' })}</p>
            </div>
          ) : paymentStats && Object.keys(paymentStats.paymentMethodStats).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(paymentStats.paymentMethodStats)
                .sort(([, a], [, b]) => b - a)
                .map(([method, count]) => {
                  const total = Object.values(paymentStats.paymentMethodStats).reduce((sum, val) => sum + val, 0);
                  const percentage = total > 0 ? (count / total) * 100 : 0;
                  const methodColors: Record<string, string> = {
                    BRACELET: 'bg-purple-500',
                    CARD: 'bg-blue-500',
                    CASH: 'bg-green-500',
                    WALLET: 'bg-amber-500',
                    TRANSFER: 'bg-cyan-500',
                    OTHER: 'bg-gray-500',
                  };
                  return (
                    <div key={method}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">{method}</span>
                        <span className="text-sm text-gray-600">{count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`${methodColors[method] || 'bg-gray-500'} h-2 rounded-full transition-all duration-300`}
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-gray-400 text-sm">{t('dashboard:stats.no_payment_data', { defaultValue: 'No payment data available' })}</p>
            </div>
          )}
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('dashboard:stats.hourly_activity', { defaultValue: 'Hourly Activity' })}
          </h3>
          {statsLoading ? (
            <div className="h-48 flex items-center justify-center">
              <p className="text-gray-400">{t('dashboard:stats.loading_data', { defaultValue: 'Loading...' })}</p>
            </div>
          ) : paymentStats && Object.keys(paymentStats.revenueByHour).length > 0 ? (
            <div className="h-48 flex items-end justify-between gap-1">
              {Array.from({ length: 24 }, (_, hour) => {
                const revenue = paymentStats.revenueByHour[hour] || 0;
                const maxRevenue = Math.max(...Object.values(paymentStats.revenueByHour), 1);
                const heightPercentage = (revenue / maxRevenue) * 100;
                return (
                  <div key={hour} className="flex-1 flex flex-col items-center group">
                    <div className="w-full bg-blue-500 rounded-t hover:bg-blue-600 transition-colors relative"
                         style={{ height: `${Math.max(heightPercentage, 2)}%` }}
                         title={`${hour}:00 - €${revenue.toFixed(2)}`}>
                    </div>
                    {hour % 3 === 0 && (
                      <span className="text-xs text-gray-500 mt-1">{hour}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center">
              <p className="text-gray-400 text-sm">{t('dashboard:stats.no_hourly_data', { defaultValue: 'No hourly data available' })}</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default EventDetailStatsPage;
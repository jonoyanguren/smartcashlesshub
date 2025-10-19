import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { Card } from '../../components/ui';
import { useState, useEffect } from 'react';
import { getEvents, type Event } from '../../api/events';
import { getUsers, type User } from '../../api/users';

// Helper function to format relative time
const formatRelativeTime = (date: string, t: any): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return t('dashboard:activity.just_now', { defaultValue: 'Just now' });
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return t('dashboard:activity.minutes_ago', { defaultValue: '{{count}} minutes ago', count: diffInMinutes });
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return t('dashboard:activity.hours_ago', { defaultValue: '{{count}} hours ago', count: diffInHours });
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return t('dashboard:activity.days_ago', { defaultValue: '{{count}} days ago', count: diffInDays });
  }

  return past.toLocaleDateString();
};

interface Activity {
  id: string;
  type: 'event' | 'user';
  title: string;
  description: string;
  time: string;
  icon: string;
  createdAt: string;
}

const OverviewPage = () => {
  const { user, tenant } = useAuth();
  const { t } = useTranslation(['dashboard', 'common']);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);

  // Load recent activity
  useEffect(() => {
    const loadRecentActivity = async () => {
      try {
        setLoadingActivity(true);

        // Load events and users in parallel
        const [events, users] = await Promise.all([
          getEvents().catch(() => [] as Event[]),
          getUsers().catch(() => [] as User[]),
        ]);

        // Combine events and users into activities
        const activities: Activity[] = [];

        // Add events as activities
        events.forEach((event) => {
          activities.push({
            id: `event-${event.id}`,
            type: 'event',
            title: t('dashboard:activity.event_created', { defaultValue: 'New event created' }),
            description: event.name,
            time: formatRelativeTime(event.createdAt, t),
            icon: '📅',
            createdAt: event.createdAt,
          });
        });

        // Add users as activities
        users.forEach((user) => {
          activities.push({
            id: `user-${user.id}`,
            type: 'user',
            title: t('dashboard:activity.user_created', { defaultValue: 'New user created' }),
            description: `${user.firstName} ${user.lastName} (${user.email})`,
            time: formatRelativeTime(user.createdAt, t),
            icon: '👤',
            createdAt: user.createdAt,
          });
        });

        // Sort by creation date (newest first) and take only the 5 most recent
        activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setRecentActivity(activities.slice(0, 5));
      } catch (error) {
        console.error('Error loading recent activity:', error);
      } finally {
        setLoadingActivity(false);
      }
    };

    loadRecentActivity();
  }, [t]);

  const stats = [
    {
      name: t('dashboard:stats.total_events', { defaultValue: 'Total Events' }),
      value: '12',
      change: '+2',
      changeType: 'increase',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
    },
    {
      name: t('dashboard:stats.active_users', { defaultValue: 'Active Users' }),
      value: '1,234',
      change: '+12%',
      changeType: 'increase',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      name: t('dashboard:stats.revenue', { defaultValue: 'Revenue' }),
      value: '€45,234',
      change: '+8%',
      changeType: 'increase',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      name: t('dashboard:stats.transactions', { defaultValue: 'Transactions' }),
      value: '3,456',
      change: '+18%',
      changeType: 'increase',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {t('dashboard:welcome', { defaultValue: 'Welcome back' })},{' '}
          {user?.firstName || 'User'}!
        </h1>
        <p className="mt-2 text-gray-600">
          {t('dashboard:overview_subtitle', {
            defaultValue: "Here's what's happening with your events today.",
          })}
        </p>
      </div>

      {/* Tenant Info */}
      {tenant && (
        <Card className="bg-gradient-to-r from-accent-500 to-accent-700 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">{tenant.name}</h2>
              <p className="mt-1 text-accent-100">
                {t('dashboard:tenant_role', { defaultValue: 'Role' })}: {tenant.role}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-accent-100">
                {t('dashboard:tenant_slug', { defaultValue: 'Slug' })}
              </p>
              <p className="text-lg font-mono">{tenant.slug}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="p-3 bg-accent-100 rounded-lg text-accent-600">
                  {stat.icon}
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                    <div
                      className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.changeType === 'increase'
                          ? 'text-green-600'
                          : 'text-red-600'
                      }`}
                    >
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('dashboard:recent_activity', { defaultValue: 'Recent Activity' })}
          </h3>
          {loadingActivity ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-accent-200 border-t-accent-600 rounded-full animate-spin"></div>
            </div>
          ) : recentActivity.length === 0 ? (
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
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                {t('dashboard:activity.no_activity', { defaultValue: 'No recent activity' })}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('dashboard:activity.no_activity_desc', {
                  defaultValue: 'Create an event or add a user to get started.',
                })}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Actions */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {t('dashboard:quick_actions', { defaultValue: 'Quick Actions' })}
          </h3>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-3 text-left border-2 border-gray-200 rounded-lg hover:border-accent-500 hover:bg-accent-50 transition-all">
              <div className="flex-shrink-0 w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center text-accent-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {t('dashboard:create_event', { defaultValue: 'Create New Event' })}
                </p>
                <p className="text-sm text-gray-500">
                  {t('dashboard:create_event_desc', {
                    defaultValue: 'Set up a new event for your venue',
                  })}
                </p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 p-3 text-left border-2 border-gray-200 rounded-lg hover:border-accent-500 hover:bg-accent-50 transition-all">
              <div className="flex-shrink-0 w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center text-accent-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {t('dashboard:add_user', { defaultValue: 'Add User' })}
                </p>
                <p className="text-sm text-gray-500">
                  {t('dashboard:add_user_desc', {
                    defaultValue: 'Invite staff or customers',
                  })}
                </p>
              </div>
            </button>

            <button className="w-full flex items-center gap-3 p-3 text-left border-2 border-gray-200 rounded-lg hover:border-accent-500 hover:bg-accent-50 transition-all">
              <div className="flex-shrink-0 w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center text-accent-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {t('dashboard:view_reports', { defaultValue: 'View Reports' })}
                </p>
                <p className="text-sm text-gray-500">
                  {t('dashboard:view_reports_desc', {
                    defaultValue: 'Check your analytics and insights',
                  })}
                </p>
              </div>
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default OverviewPage;
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Button, LoadingState } from '../../components/ui';
import UnauthorizedState from '../../components/ui/UnauthorizedState';
import { getUsers, deleteUser, type User, type CreateUserResponse } from '../../api/users';
import CreateUserModal from '../../components/users/CreateUserModal';
import PasswordDisplayModal from '../../components/users/PasswordDisplayModal';

const UsersPage = () => {
  const { t } = useTranslation(['dashboard']);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newUserData, setNewUserData] = useState<{ email: string; password: string } | null>(null);

  // Check URL params to auto-open create modal
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'create') {
      setShowCreateModal(true);
      // Remove the param from URL
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch users from API
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      console.error('Error loading users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setShowCreateModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setShowCreateModal(true);
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setEditingUser(null);
  };

  const handleUserSuccess = (response?: CreateUserResponse) => {
    loadUsers(); // Refresh user list
    handleCloseModal();

    // If creating a new user with temporary password, show it
    if (response && response.temporaryPassword) {
      setNewUserData({
        email: response.email,
        password: response.temporaryPassword,
      });
      setShowPasswordModal(true);
    }
  };

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    const confirmed = window.confirm(
      t('dashboard:users.confirm_delete', {
        defaultValue: 'Are you sure you want to remove {{email}} from this tenant?',
        email: userEmail
      })
    );

    if (!confirmed) return;

    try {
      await deleteUser(userId);
      loadUsers(); // Refresh list
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      setError(errorMessage);
      console.error('Error deleting user:', err);
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

  const filteredUsers =
    selectedRole === 'all' ? users : users.filter((u) => u.role === selectedRole);

  // Show loading state
  if (loading) {
    return (
      <LoadingState
        message={t('dashboard:users.loading', { defaultValue: 'Loading users...' })}
      />
    );
  }

  // Check if error is an authorization error
  const isUnauthorized = error && (
    error.includes('AUTH_INSUFFICIENT_PERMISSIONS') ||
    error.includes('INSUFFICIENT_PERMISSIONS') ||
    error.includes('Unauthorized')
  );

  // Show unauthorized state if permission error
  if (isUnauthorized) {
    return (
      <UnauthorizedState
        message={t('dashboard:users.unauthorized_title', { defaultValue: 'Unauthorized Access' })}
        description={t('dashboard:users.unauthorized_description', {
          defaultValue: 'You do not have permission to manage users. Please contact your administrator if you believe this is an error.',
        })}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">{error}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {t('dashboard:users.title', { defaultValue: 'Users' })}
          </h1>
          <p className="mt-2 text-gray-600">
            {t('dashboard:users.subtitle', {
              defaultValue: 'Manage staff and customer accounts',
            })}
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={handleCreateUser}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {t('dashboard:users.add_user', { defaultValue: 'Add User' })}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-purple-100 rounded-lg text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">{t('dashboard:users.stats.admins')}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter((u) => u.role === 'TENANT_ADMIN').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-blue-100 rounded-lg text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">{t('dashboard:users.stats.staff')}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter((u) => u.role === 'TENANT_STAFF').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-green-100 rounded-lg text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">{t('dashboard:users.stats.customers')}</p>
              <p className="text-2xl font-semibold text-gray-900">
                {users.filter((u) => u.role === 'END_USER').length}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-accent-100 rounded-lg text-accent-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-500">{t('dashboard:users.stats.total')}</p>
              <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          >
            <option value="all">
              {t('dashboard:users.all_roles', { defaultValue: 'All Roles' })}
            </option>
            <option value="TENANT_ADMIN">{t('dashboard:users.roles.tenant_admin')}</option>
            <option value="TENANT_STAFF">{t('dashboard:users.roles.tenant_staff')}</option>
            <option value="END_USER">{t('dashboard:users.roles.end_user')}</option>
          </select>
          <input
            type="text"
            placeholder={t('dashboard:users.search_placeholder', {
              defaultValue: 'Search users...',
            })}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500"
          />
        </div>
      </Card>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard:users.table.user', { defaultValue: 'User' })}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard:users.table.role', { defaultValue: 'Role' })}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard:users.table.status', { defaultValue: 'Status' })}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard:users.table.created', { defaultValue: 'Created' })}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('dashboard:users.table.actions', { defaultValue: 'Actions' })}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-accent-500 to-accent-700 flex items-center justify-center text-white font-semibold">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadge(
                        user.role
                      )}`}
                    >
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.isActive ? t('dashboard:users.status.active') : t('dashboard:users.status.inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => navigate(`/dashboard/users/${user.id}`)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      {t('dashboard:users.view', { defaultValue: 'View' })}
                    </button>
                    <button
                      onClick={() => handleEditUser(user)}
                      className="text-accent-600 hover:text-accent-900 mr-4"
                    >
                      {t('dashboard:users.edit', { defaultValue: 'Edit' })}
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id, user.email)}
                      className="text-red-600 hover:text-red-900"
                    >
                      {t('dashboard:users.delete', { defaultValue: 'Delete' })}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Empty State */}
      {filteredUsers.length === 0 && (
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
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {t('dashboard:users.no_users', { defaultValue: 'No users found' })}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {t('dashboard:users.no_users_desc', {
                defaultValue: 'Try adjusting your filters or add a new user.',
              })}
            </p>
          </div>
        </Card>
      )}

      {/* Create/Edit User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={handleCloseModal}
        onSuccess={handleUserSuccess}
        user={editingUser}
      />

      {/* Password Display Modal */}
      {newUserData && (
        <PasswordDisplayModal
          isOpen={showPasswordModal}
          onClose={() => setShowPasswordModal(false)}
          email={newUserData.email}
          temporaryPassword={newUserData.password}
        />
      )}
    </div>
  );
};

export default UsersPage;
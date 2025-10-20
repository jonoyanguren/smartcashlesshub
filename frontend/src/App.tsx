import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Dashboard Layout and Pages
import DashboardLayout from './layouts/DashboardLayout';
import OverviewPage from './pages/dashboard/OverviewPage';
import EventsPage from './pages/dashboard/EventsPage';
import EventPreviewPage from './pages/dashboard/EventPreviewPage';
import EventStatsPage from './pages/dashboard/EventStatsPage';
import EventDetailStatsPage from './pages/dashboard/EventDetailStatsPage';
import UsersPage from './pages/dashboard/UsersPage';
import UserDetailPage from './pages/dashboard/UserDetailPage';
import OffersPage from './pages/dashboard/OffersPage';
import SettingsPage from './pages/dashboard/SettingsPage';
import TenantConfigPage from './pages/dashboard/TenantConfigPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Change Password - Protected but allows mustChangePassword users */}
      <Route
        path="/change-password"
        element={
          <ProtectedRoute requirePasswordChange={false}>
            <ChangePasswordPage />
          </ProtectedRoute>
        }
      />

      {/* Protected Dashboard Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<OverviewPage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:eventId/preview" element={<EventPreviewPage />} />
        <Route path="events/:eventId/stats" element={<EventDetailStatsPage />} />
        <Route path="stats" element={<EventStatsPage />} />
        <Route path="offers" element={<OffersPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="users/:id" element={<UserDetailPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="config" element={<TenantConfigPage />} />
      </Route>
    </Routes>
  );
}

export default App;
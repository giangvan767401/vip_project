import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { StudentDashboardPage } from './pages/StudentDashboardPage';
import { CheckInPage } from './pages/CheckInPage';
import { JournalPage } from './pages/JournalPage';
import { CounselorDashboardPage } from './pages/CounselorDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';

const RootRedirect: React.FC = () => {
  const { user, isLoading, getDefaultPathForRole } = useAuth();

  if (isLoading) {
    return null;
  }

  if (user) {
    return <Navigate to={getDefaultPathForRole(user.role)} replace />;
  }

  return <Navigate to="/login" replace />;
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />

          {/* Student (USER) Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <StudentDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/checkin"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <CheckInPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/journal"
            element={
              <ProtectedRoute allowedRoles={['USER']}>
                <JournalPage />
              </ProtectedRoute>
            }
          />

          {/* Counselor Protected Routes */}
          <Route
            path="/counselor/dashboard"
            element={
              <ProtectedRoute allowedRoles={['COUNSELOR']}>
                <CounselorDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Root and Catch-all */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

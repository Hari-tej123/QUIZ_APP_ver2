import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-primary-600" />
          <span className="text-sm font-semibold text-neutral-500">Checking credentials...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const canonicalRole = ({ STUDENT: 'student', EDUCATOR: 'educator', ADMIN: 'admin' })[user?.role] || user?.role;
  if (allowedRoles && !allowedRoles.includes(canonicalRole)) {
    // If not authorized for this route, redirect to default dashboard by role
    const defaultDashboards = {
      admin: '/admin',
      educator: '/questions',
      faculty: '/faculty',
      student: '/student'
    };
    return <Navigate to={defaultDashboards[canonicalRole] || '/login'} replace />;
  }

  return children;
}

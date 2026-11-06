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

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If not authorized for this route, redirect to default dashboard by role
    const defaultDashboards = {
      admin: '/admin',
      faculty: '/faculty',
      student: '/student'
    };
    return <Navigate to={defaultDashboards[user.role] || '/login'} replace />;
  }

  return children;
}

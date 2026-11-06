import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './routes/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';

// Public Landing & Auth Views
import LandingPage from './views/LandingPage';
import Login from './views/auth/Login';
import Register from './views/auth/Register';

// Admin Views
import AdminDashboard from './views/admin/Dashboard';
import ReviewQueue from './views/admin/ReviewQueue';
import ContributorManagement from './views/admin/ContributorManagement';
import PayoutSettings from './views/admin/PayoutSettings';
import FacultyManagement from './views/admin/FacultyManagement';
import ExamManagement from './views/admin/ExamManagement';

// Contributor / Educator Views
import ContributorDashboard from './views/contributor/Dashboard';
import CreateQuiz from './views/contributor/CreateQuiz';
import ManageQuizzes from './views/contributor/ManageQuizzes';
import StudyMaterials from './views/contributor/StudyMaterials';
import Submissions from './views/contributor/Submissions';
import EarningsPayouts from './views/contributor/EarningsPayouts';

// Faculty Views
import FacultyDashboard from './views/faculty/Dashboard';
import CourseManagement from './views/faculty/CourseManagement';

// Student Views
import StudentDashboard from './views/student/Dashboard';
import BrowseCourses from './views/student/BrowseCourses';
import BrowseExams from './views/student/BrowseExams';
import CourseDetails from './views/student/CourseDetails';
import TopicResources from './views/student/TopicResources';
import QuizAttempt from './views/student/QuizAttempt';
import RevisionFolder from './views/student/RevisionFolder';
import PerformanceTrends from './views/student/PerformanceTrends';

// Design System Reference
import DesignSystem from './views/DesignSystem';

// Dashboard role redirect helper
function DashboardRedirect() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-9 w-9 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const routes = {
    admin: '/admin',
    contributor: '/contributor',
    faculty: '/faculty',
    student: '/student'
  };

  return <Navigate to={routes[user.role] || '/student'} replace />;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* 1. Public Landing Page */}
            <Route path="/" element={<LandingPage />} />

            {/* 2. Public Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />

            {/* 3. Admin Protected Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout>
                    <AdminDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/review-queue"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout>
                    <ReviewQueue />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/contributors"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout>
                    <ContributorManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payout-settings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout>
                    <PayoutSettings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/faculty"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout>
                    <FacultyManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/exams"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <DashboardLayout>
                    <ExamManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* 4. Contributor / Educator Protected Routes */}
            <Route
              path="/contributor"
              element={
                <ProtectedRoute allowedRoles={['contributor', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <ContributorDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contributor/quizzes/create"
              element={
                <ProtectedRoute allowedRoles={['contributor', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <CreateQuiz />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contributor/quizzes"
              element={
                <ProtectedRoute allowedRoles={['contributor', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <ManageQuizzes />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contributor/materials"
              element={
                <ProtectedRoute allowedRoles={['contributor', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <StudyMaterials />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contributor/submissions"
              element={
                <ProtectedRoute allowedRoles={['contributor', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <Submissions />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contributor/payouts"
              element={
                <ProtectedRoute allowedRoles={['contributor', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <EarningsPayouts />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* 5. Faculty Protected Routes */}
            <Route
              path="/faculty"
              element={
                <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                  <DashboardLayout>
                    <FacultyDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/faculty/courses"
              element={
                <ProtectedRoute allowedRoles={['faculty', 'admin']}>
                  <DashboardLayout>
                    <CourseManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* 6. Student Protected Routes */}
            <Route
              path="/student"
              element={
                <ProtectedRoute allowedRoles={['student', 'contributor', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <StudentDashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/exams"
              element={
                <ProtectedRoute allowedRoles={['student', 'contributor', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <BrowseExams />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/courses"
              element={
                <ProtectedRoute allowedRoles={['student', 'contributor', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <BrowseCourses />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/courses/:courseId"
              element={
                <ProtectedRoute allowedRoles={['student', 'contributor', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <CourseDetails />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/topics/:topicId/resources"
              element={
                <ProtectedRoute allowedRoles={['student', 'contributor', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <TopicResources />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/quizzes/:quizId/attempt"
              element={
                <ProtectedRoute allowedRoles={['student', 'contributor', 'faculty', 'admin']}>
                  <QuizAttempt />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/revision"
              element={
                <ProtectedRoute allowedRoles={['student', 'contributor', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <RevisionFolder />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/performance"
              element={
                <ProtectedRoute allowedRoles={['student', 'contributor', 'faculty', 'admin']}>
                  <DashboardLayout>
                    <PerformanceTrends />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* 7. Shared Design System Protected Route */}
            <Route
              path="/design-system"
              element={
                <ProtectedRoute allowedRoles={['admin', 'faculty', 'contributor', 'student']}>
                  <DashboardLayout>
                    <DesignSystem />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* 8. Catch-all Redirect to Landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ToastProvider>
  );
}

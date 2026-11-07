import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu, X, Bell, LogOut, LayoutDashboard, Users, BookOpen,
  HelpCircle, Settings, FileText, Key, Shield, User, Award, ListChecks, BookMarked,
  GraduationCap, Sparkles, ChevronRight, Layers, Clock
} from 'lucide-react';

import { Modal, Input, Button, Badge } from '../components/UI';

export default function DashboardLayout({ children }) {
  const { user, logout, changePassword } = useAuth();
  const { showSuccess, showError, showWarning } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);
  const [pwdModalOpen, setPwdModalOpen] = useState(false);

  // Change password form state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Force password change check
  useEffect(() => {
    if (user?.mustChangePassword && location.pathname !== '/login') {
      setPwdModalOpen(true);
    }
  }, [user, location.pathname]);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      return showError('New passwords do not match.');
    }
    if (newPwd.length < 6) {
      return showError('Password must be at least 6 characters long.');
    }

    setPwdLoading(true);
    try {
      await changePassword(currentPwd, newPwd);
      showSuccess('Password updated successfully.');
      setPwdModalOpen(false);
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (err) {
      showError(err.message || 'Failed to update password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    showSuccess('Logged out successfully.');
    navigate('/login');
  };

  const role = ({ STUDENT: 'student', EDUCATOR: 'educator', ADMIN: 'admin' })[user?.role] || user?.role || 'student';

  // Sidebar links based on role
  const sidebarLinks = {
    admin: [
      { path: '/admin', label: 'Admin Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
      { path: '/admin/review-queue', label: 'Content Review Queue', icon: <Clock className="w-5 h-5" />, badge: 'Live' },
      { path: '/admin/contributors', label: 'Educators & Applicants', icon: <Sparkles className="w-5 h-5" /> },
      { path: '/admin/payout-settings', label: 'Payouts & Settings', icon: <Settings className="w-5 h-5" /> },
      { path: '/admin/faculty', label: 'Faculty Management', icon: <Users className="w-5 h-5" /> },
      { path: '/admin/access', label: 'User Management', icon: <Shield className="w-5 h-5" /> },
      { path: '/admin/operations', label: 'Applications & Quiz Review', icon: <ListChecks className="w-5 h-5" /> },
      { path: '/questions?view=mine', label: 'Question Management', icon: <HelpCircle className="w-5 h-5" /> },
      { path: '/admin/exams', label: 'Exam Hierarchy', icon: <BookMarked className="w-5 h-5" /> },
      { path: '/design-system', label: 'Design System', icon: <Layers className="w-5 h-5" /> }
    ],
    contributor: [
      { path: '/contributor', label: 'Educator Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { path: '/contributor/quizzes/create', label: 'Create Question Set', icon: <Sparkles className="w-5 h-5" /> },
      { path: '/contributor/quizzes', label: 'Authored Quizzes', icon: <ListChecks className="w-5 h-5" /> },
      { path: '/contributor/materials', label: 'Topic Study Materials', icon: <FileText className="w-5 h-5" /> },
      { path: '/contributor/submissions', label: 'Review Pipeline', icon: <Clock className="w-5 h-5" /> },
      { path: '/contributor/payouts', label: 'Earnings & Payouts', icon: <Award className="w-5 h-5" /> }
    ],
    educator: [
      { path: '/contributor', label: 'Educator Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { path: '/contributor/quizzes/create', label: 'Create Question Set', icon: <Sparkles className="w-5 h-5" /> },
      { path: '/contributor/quizzes', label: 'Authored Quizzes', icon: <ListChecks className="w-5 h-5" /> },
      { path: '/questions?view=mine', label: 'Question Bank', icon: <HelpCircle className="w-5 h-5" /> },
      { path: '/contributor/materials', label: 'Topic Study Materials', icon: <FileText className="w-5 h-5" /> },
      { path: '/contributor/submissions', label: 'Review Pipeline', icon: <Clock className="w-5 h-5" /> },
      ...(user?.educatorType === 'COLLEGE' || user?.educatorType === 'BOTH' ? [
        { path: '/faculty/courses', label: 'College Courses', icon: <BookOpen className="w-5 h-5" /> }
      ] : [])
    ],
    faculty: [
      { path: '/faculty', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { path: '/faculty/courses', label: 'Courses & Quizzes', icon: <BookOpen className="w-5 h-5" /> },
      { path: '/questions?view=create', label: 'Add Question', icon: <HelpCircle className="w-5 h-5" /> },
      { path: '/questions?view=mine', label: 'My Questions', icon: <ListChecks className="w-5 h-5" /> }
    ],
    student: [
      { path: '/student', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
      { path: '/student/exams', label: 'Competitive Exams', icon: <BookMarked className="w-5 h-5" />, track: 'competitive' },
      { path: '/student/courses', label: 'College Courses', icon: <BookOpen className="w-5 h-5" />, track: 'college' },
      { path: '/student/revision', label: 'Mistakes & Bookmarks', icon: <Sparkles className="w-5 h-5" /> },
      { path: '/student/performance', label: 'Performance & Ranks', icon: <Award className="w-5 h-5" /> },
      { path: '/student/access-request', label: 'Request Educator Access', icon: <Shield className="w-5 h-5" /> }
    ]
  };

  const activeLinks = sidebarLinks[role] || [];

  const getBreadcrumbs = () => {
    const paths = location.pathname.split('/').filter(p => p);
    if (paths.length === 0) return 'Dashboard';
    return paths.map(p => {
      if (p === 'exams') return 'Competitive Exams';
      if (p === 'courses') return 'College Courses';
      if (p === 'performance') return 'Performance Analytics';
      if (p === 'revision') return 'Revision Hub';
      if (p === 'review-queue') return 'Review Queue';
      if (p === 'payouts') return 'Earnings & Payouts';
      if (p === 'materials') return 'Study Materials';
      if (p === 'contributors') return 'Educator Directory';
      if (p === 'access') return 'Access Approvals';
      if (p === 'access-request') return 'Access Request';
      if (p === 'questions') return 'Question Management';
      return p.charAt(0).toUpperCase() + p.slice(1);
    }).join(' / ');
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex selection:bg-primary-500 selection:text-white">
      
      {/* ─── 1. DESKTOP SIDEBAR (LIGHT MODERN ED-TECH) ─────────────────────── */}
      <aside className="hidden lg:flex flex-col w-66 bg-white border-r border-neutral-200/90 shrink-0 z-30 shadow-xs">
        {/* Brand Header */}
        <div className="h-18 flex items-center justify-between px-6 border-b border-neutral-100">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-sm group-hover:scale-105 transition-transform">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-lg font-display tracking-tight text-neutral-900 leading-none">
                Quizzify
              </span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-primary-600 mt-0.5">
                {role === 'student' ? 'Student Workspace' : ['contributor', 'educator'].includes(role) ? 'Verified Educator' : role === 'faculty' ? 'Faculty Portal' : 'Administrator'}
              </span>
            </div>
          </Link>
        </div>

        {/* Dual-Track Quick Switcher (Student Only) */}
        {role === 'student' && (
          <div className="p-4 border-b border-neutral-100 bg-neutral-50/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              Exam Tracks
            </span>
            <div className="flex flex-col gap-1">
              <Link
                to="/student/exams"
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all ${
                  location.pathname.startsWith('/student/exams')
                    ? 'bg-primary-50 text-primary-700 border border-primary-200 font-bold shadow-xs'
                    : 'text-neutral-600 hover:bg-white hover:text-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary-600" />
                  <span>🎯 Competitive Track</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              </Link>

              <Link
                to="/student/courses"
                className={`flex items-center justify-between p-2 rounded-xl text-xs font-semibold transition-all ${
                  location.pathname.startsWith('/student/courses')
                    ? 'bg-amber-50 text-amber-800 border border-amber-200 font-bold shadow-xs'
                    : 'text-neutral-600 hover:bg-white hover:text-neutral-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>🏛️ College Courses</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-neutral-400" />
              </Link>
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 px-4 py-5 space-y-1.5 overflow-y-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 px-3 block mb-2">
            Navigation Menu
          </span>
          {activeLinks.map((link) => {
            const isActive = `${location.pathname}${location.search}` === link.path;
            let activeStyle = 'bg-primary-50 text-primary-700 border border-primary-200 font-bold shadow-xs';
            if (link.track === 'college') {
              activeStyle = 'bg-amber-50 text-amber-800 border border-amber-200 font-bold shadow-xs';
            }

            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? activeStyle
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100/70 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <span className={isActive ? (link.track === 'college' ? 'text-amber-600' : 'text-primary-600') : 'text-neutral-400'}>
                    {link.icon}
                  </span>
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-primary-100 text-primary-800">
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer / User Info */}
        <div className="p-4 border-t border-neutral-100 bg-neutral-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-800 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs border border-primary-200/80">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="min-w-0 flex flex-col">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-xs font-bold text-neutral-900 truncate">{user?.name}</span>
              </div>
              <span className="text-[10px] text-neutral-400 truncate">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-neutral-400 hover:text-danger-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* ─── 2. MOBILE DRAWER SIDEBAR ──────────────────────────────────────── */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-neutral-900/40 backdrop-blur-xs transition-opacity duration-200 ${
            sidebarOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          className={`absolute top-0 bottom-0 left-0 w-72 bg-white flex flex-col shadow-card-hover border-r border-neutral-200/80 transition-transform duration-250 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="h-18 flex items-center justify-between px-6 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg font-display text-neutral-900">Quizzify</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1 rounded-lg text-neutral-400 hover:text-neutral-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {activeLinks.map((link) => {
              const isActive = `${location.pathname}${location.search}` === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-primary-50 text-primary-700 border border-primary-200 font-bold'
                      : 'text-neutral-600 hover:text-neutral-900'
                  }`}
                >
                  <span className={isActive ? 'text-primary-600' : 'text-neutral-400'}>{link.icon}</span>
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="min-w-0 flex flex-col">
                <span className="text-xs font-bold text-neutral-900 truncate">{user?.name}</span>
                <span className="text-[10px] text-neutral-400 truncate">{user?.email}</span>
              </div>
            </div>
            <button onClick={handleLogout} className="p-2 text-neutral-400 hover:text-danger-600">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </aside>
      </div>

      {/* ─── 3. MAIN WORKSPACE CONTAINER ───────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <header className="h-18 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 px-6 sm:px-8 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 transition-colors cursor-pointer"
              aria-label="Toggle Navigation Sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-xs font-bold text-neutral-400 tracking-wider hidden sm:inline-block">
              {getBreadcrumbs()}
            </span>
          </div>

          {/* Right Header User Dropdown */}
          <div className="flex items-center gap-3 relative">
            <Link to="/">
              <Button variant="ghost" size="xs" className="text-xs font-semibold text-neutral-500 hidden sm:inline-flex">
                Landing Page
              </Button>
            </Link>

            <button className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-all relative cursor-pointer">
              <Bell className="w-4.5 h-4.5" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary-600 border-2 border-white" />
            </button>

            <div className="relative">
              <button
                onClick={() => setAvatarMenuOpen(!avatarMenuOpen)}
                className="flex items-center gap-2 p-1 rounded-xl hover:bg-neutral-100 transition-all focus:outline-none cursor-pointer"
              >
                <div className="w-8.5 h-8.5 rounded-xl bg-primary-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </button>

              {avatarMenuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setAvatarMenuOpen(false)} />
                  <div className="absolute right-0 mt-2.5 w-56 bg-white rounded-2xl border border-neutral-200/90 shadow-card-hover py-2 z-20 animate-fade-in">
                    <div className="px-4 py-2.5 border-b border-neutral-100">
                      <p className="text-xs font-bold text-neutral-900 truncate">{user?.name}</p>
                      <p className="text-[10px] text-neutral-400 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => {
                        setAvatarMenuOpen(false);
                        setPwdModalOpen(true);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition-colors flex items-center gap-2 cursor-pointer"
                    >
                      <Key className="w-3.5 h-3.5 text-neutral-400" /> Change Password
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-2 border-t border-neutral-100 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 overflow-y-auto px-6 py-6 md:px-8 bg-neutral-50">
          {children}
        </main>
      </div>

      {/* Password Change Modal */}
      <Modal
        isOpen={pwdModalOpen}
        onClose={() => {
          if (!user?.mustChangePassword) {
            setPwdModalOpen(false);
          } else {
            showWarning('You must change your password on first login to proceed.');
          }
        }}
        title="Update Account Password"
      >
        <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
          {user?.mustChangePassword && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3.5 text-xs font-semibold">
              ⚠️ This is your first login with temporary credentials. You are required to update your password before proceeding.
            </div>
          )}

          <Input
            label="Current Password"
            type="password"
            placeholder="Enter current password"
            value={currentPwd}
            onChange={(e) => setCurrentPwd(e.target.value)}
            required
          />

          <Input
            label="New Password"
            type="password"
            placeholder="Minimum 6 characters"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            required
          />

          <Input
            label="Confirm New Password"
            type="password"
            placeholder="Retype new password"
            value={confirmPwd}
            onChange={(e) => setConfirmPwd(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 mt-3">
            {!user?.mustChangePassword && (
              <Button variant="secondary" onClick={() => setPwdModalOpen(false)} disabled={pwdLoading}>
                Cancel
              </Button>
            )}
            <Button variant="primary" type="submit" isLoading={pwdLoading} className="shadow-indigo">
              Update Password
            </Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

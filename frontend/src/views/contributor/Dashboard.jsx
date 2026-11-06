import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  DollarSign,
  FileQuestion,
  FileText,
  Layers,
  PlusCircle,
  TrendingUp,
  Upload,
  Users,
  AlertCircle,
  ArrowUpRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { Button, Card, Badge, Modal } from '../../components/UI';
import api from '../../utils/api';

export default function ContributorDashboard() {
  const { user } = useAuth();
  const { showError } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contributor/stats');
      setData(res?.data || res);

    } catch (err) {
      showError(err.message || 'Failed to fetch contributor overview');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const contributor = data?.contributor || user || {};
  const isApproved = contributor.contributorStatus === 'approved';

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-fade-in">
      {/* ─── 1. EDUCATOR BANNER ─────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 via-indigo-950 to-primary-950 p-8 text-white shadow-xl">
        <div className="absolute right-0 top-0 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-primary-500/20 text-primary-300 border border-primary-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-primary-400" />
                Educator & Creator Portal
              </span>
              {isApproved ? (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified Educator
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Application Pending Review
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-display">
              Welcome back, {contributor.name || user?.name}! 👋
            </h1>
            <p className="text-neutral-300 text-sm max-w-2xl leading-relaxed">
              {contributor.bio || 'Create high-yield question sets, upload rich topic study handouts, and earn bounties & revenue share as thousands of students practice your material.'}
            </p>

            {contributor.subjectExpertise && (
              <p className="text-xs text-primary-300 font-semibold flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                Domain Expertise: {contributor.subjectExpertise}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/contributor/quizzes/create">
              <Button variant="primary" size="md" className="shadow-lg shadow-primary-900/40 bg-primary-600 hover:bg-primary-500 border-none font-bold">
                <PlusCircle className="w-4.5 h-4.5 mr-2" />
                Create Question Set
              </Button>
            </Link>
            <Link to="/contributor/materials">
              <Button variant="secondary" size="md" className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold backdrop-blur-sm">
                <Upload className="w-4.5 h-4.5 mr-2" />
                Upload Material
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 2. STATUS ALERT IF PENDING ────────────────────────────────────── */}
      {!isApproved && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-900">Application Under Verification</h3>
            <p className="text-xs text-amber-800 leading-relaxed">
              Your educator profile is currently in the Admin verification queue. You can draft and submit quizzes and study handouts; once approved, they will be published immediately to all students and payouts will be credited.
            </p>
          </div>
        </div>
      )}

      {/* ─── 3. KPI METRICS CARDS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Earnings Balance Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-100 shadow-xs relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Available Balance</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-sm">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-neutral-900 font-display">
              ${(metrics.earningsBalance || 0).toFixed(2)}
            </h3>
            <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-emerald-200/60">
              <span>Lifetime: ${(metrics.totalEarned || 0).toFixed(2)}</span>
              <Link to="/contributor/payouts" className="text-emerald-700 font-bold hover:underline flex items-center gap-0.5">
                Withdraw <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Quizzes Authored */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs relative group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Quizzes Authored</span>
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <FileQuestion className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-neutral-900 font-display">
              {metrics.totalQuizzes || 0}
            </h3>
            <div className="flex items-center gap-2 text-xs text-neutral-500 pt-2 border-t border-neutral-100">
              <span className="text-emerald-600 font-semibold">{metrics.approvedQuizzes || 0} published</span>
              <span>•</span>
              <span className="text-amber-600 font-semibold">{metrics.pendingQuizzes || 0} in review</span>
            </div>
          </div>
        </div>

        {/* Study Materials */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs relative group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Study Handouts</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-neutral-900 font-display">
              {metrics.totalMaterials || 0}
            </h3>
            <div className="flex items-center gap-2 text-xs text-neutral-500 pt-2 border-t border-neutral-100">
              <span className="text-emerald-600 font-semibold">{metrics.approvedMaterials || 0} approved</span>
              <span>•</span>
              <span>PDFs, Notes & Videos</span>
            </div>
          </div>
        </div>

        {/* Student Attempts Volume */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs relative group hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Student Attempts</span>
            <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-extrabold text-neutral-900 font-display">
              {metrics.totalStudentAttempts || 0}
            </h3>
            <div className="flex items-center justify-between text-xs text-neutral-500 pt-2 border-t border-neutral-100">
              <span className="text-neutral-500">Generating rev-share</span>
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── 4. QUICK ACTIONS & WORKSPACE NAV ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/contributor/quizzes/create" className="group">
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 hover:border-primary-300 hover:shadow-card-hover transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <PlusCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 group-hover:text-primary-600 transition-colors">
              Create Question Bank / Quiz
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Add individual questions or bulk upload via Excel/CSV for Competitive Exams (GATE, JEE, UPSC, CAT) or College Courses.
            </p>
          </div>
        </Link>

        <Link to="/contributor/materials" className="group">
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 hover:border-indigo-300 hover:shadow-card-hover transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors">
              Topic Study Materials
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Upload PDF lecture notes, formula cheat sheets, or attach embedded YouTube video walkthroughs tied directly to specific topics.
            </p>
          </div>
        </Link>

        <Link to="/contributor/submissions" className="group">
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 hover:border-amber-300 hover:shadow-card-hover transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-neutral-900 group-hover:text-amber-700 transition-colors">
              Review Status & Feedback
            </h3>
            <p className="text-xs text-neutral-500 leading-relaxed">
              Track live review queue states (Pending, Approved, Rejected, Changes Requested) along with Admin reviewer feedback.
            </p>
          </div>
        </Link>
      </div>

      {/* ─── 5. EDUCATOR REVENUE & BOUNTY EXPLAINER ─────────────────────────── */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-primary-900 to-indigo-900 text-white shadow-lg space-y-4">
        <div className="flex items-center gap-3">
          <Award className="w-6 h-6 text-amber-400" />
          <h3 className="text-base font-bold font-display">How Educator Earnings & Payouts Work</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-neutral-200">
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs space-y-1">
            <span className="font-bold text-white text-sm">1. Flat Bounty per Quiz</span>
            <p className="text-neutral-300">Earn a direct platform bounty (default $15.00) instantly credited to your balance upon Admin review and approval.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs space-y-1">
            <span className="font-bold text-white text-sm">2. Revenue Share per Attempt</span>
            <p className="text-neutral-300">Earn continuous passive revenue ($0.10+ per completion) every time a student takes your quizzes.</p>
          </div>
          <div className="p-4 rounded-xl bg-white/10 backdrop-blur-xs space-y-1">
            <span className="font-bold text-white text-sm">3. Instant Withdrawal</span>
            <p className="text-neutral-300">Request payout directly to Razorpay, Stripe Connect, or Direct UPI/Bank transfer once you reach the minimum balance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

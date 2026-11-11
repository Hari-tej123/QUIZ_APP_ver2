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

            <h1 className="text-white text-2xl sm:text-[30px] font-extrabold tracking-tight font-display flex flex-wrap items-center gap-2 leading-tight">
              <span>Welcome back, {contributor.name || user?.name}!</span>
              <span className="inline-block transform hover:rotate-12 transition-transform duration-200 select-none text-2xl sm:text-3xl" role="img" aria-label="waving hand">👋</span>
            </h1>
            <p className="text-slate-200 text-sm sm:text-base max-w-2xl leading-relaxed font-normal">
              {contributor.bio || 'Create high-yield question sets, upload rich topic study handouts, and earn bounties & revenue share as thousands of students practice your material.'}
            </p>

            {contributor.subjectExpertise && (
              <p className="text-xs text-primary-200 font-semibold flex items-center gap-1.5 pt-1">
                <BookOpen className="w-4 h-4 text-primary-300" />
                Domain Expertise: <span className="text-white font-medium">{contributor.subjectExpertise}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/contributor/quizzes/create">
              <Button variant="primary" size="md" className="shadow-lg shadow-primary-900/40 bg-primary-600 hover:bg-primary-500 border-none font-bold min-h-[42px] px-5">
                <PlusCircle className="w-4.5 h-4.5 mr-2" />
                Create Question Set
              </Button>
            </Link>
            <Link to="/contributor/materials">
              <Button variant="secondary" size="md" className="bg-white/10 hover:bg-white/20 text-white border-white/20 font-bold backdrop-blur-sm min-h-[42px] px-5">
                <Upload className="w-4.5 h-4.5 mr-2" />
                Upload Material
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 2. STATUS ALERT IF PENDING ────────────────────────────────────── */}
      {!isApproved && (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 flex items-start gap-4 shadow-xs">
          <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-amber-950 font-display">Application Under Verification</h3>
            <p className="text-xs text-amber-900 leading-relaxed font-medium">
              Your educator profile is currently in the Admin verification queue. You can draft and submit quizzes and study handouts; once approved, they will be published immediately to all students and payouts will be credited.
            </p>
          </div>
        </div>
      )}

      {/* ─── 3. KPI METRICS CARDS ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Earnings Balance Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/80 shadow-xs relative overflow-hidden group hover:shadow-card-hover transition-all flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Available Balance</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-extrabold text-neutral-900 font-display tracking-tight">
                ${(metrics.earningsBalance || 0).toFixed(2)}
              </h3>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-600 pt-3 border-t border-emerald-200/60 mt-4">
            <span className="font-medium">Lifetime: ${(metrics.totalEarned || 0).toFixed(2)}</span>
            <Link to="/contributor/payouts" className="text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 transition-colors">
              Withdraw <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Quizzes Authored */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs relative group hover:shadow-card-hover transition-all flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Quizzes Authored</span>
              <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
                <FileQuestion className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-extrabold text-neutral-900 font-display tracking-tight">
                {metrics.totalQuizzes || 0}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 pt-3 border-t border-neutral-100 mt-4 font-medium">
            <span className="text-emerald-700 font-semibold">{metrics.approvedQuizzes || 0} published</span>
            <span>•</span>
            <span className="text-amber-700 font-semibold">{metrics.pendingQuizzes || 0} in review</span>
          </div>
        </div>

        {/* Study Materials */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs relative group hover:shadow-card-hover transition-all flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Study Handouts</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-extrabold text-neutral-900 font-display tracking-tight">
                {metrics.totalMaterials || 0}
              </h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 pt-3 border-t border-neutral-100 mt-4 font-medium">
            <span className="text-emerald-700 font-semibold">{metrics.approvedMaterials || 0} approved</span>
            <span>•</span>
            <span>{metrics.totalMaterials === 0 ? 'No uploads yet' : 'PDFs & Notes'}</span>
          </div>
        </div>

        {/* Student Attempts Volume */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs relative group hover:shadow-card-hover transition-all flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Student Attempts</span>
              <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="space-y-1">
              <h3 className="text-3xl font-extrabold text-neutral-900 font-display tracking-tight">
                {metrics.totalStudentAttempts || 0}
              </h3>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-neutral-500 pt-3 border-t border-neutral-100 mt-4 font-medium">
            <span>{metrics.totalStudentAttempts === 0 ? 'Awaiting student practice' : 'Generating rev-share'}</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* ─── 4. QUICK ACTIONS & WORKSPACE NAV ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/contributor/quizzes/create" className="group">
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 hover:border-primary-400 hover:shadow-card-hover transition-all duration-200 space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-primary-100">
                <PlusCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 group-hover:text-primary-600 transition-colors font-display">
                Create Question Bank / Quiz
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Add individual questions or bulk upload via Excel/CSV for Competitive Exams (GATE, JEE, UPSC, CAT) or College Courses.
              </p>
            </div>
            <span className="text-xs font-bold text-primary-600 flex items-center gap-1 pt-2">
              Start building <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        <Link to="/contributor/materials" className="group">
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 hover:border-indigo-400 hover:shadow-card-hover transition-all duration-200 space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-indigo-100">
                <Upload className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 group-hover:text-indigo-600 transition-colors font-display">
                Topic Study Materials
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Upload PDF lecture notes, formula cheat sheets, or attach embedded YouTube video walkthroughs tied directly to specific topics.
              </p>
            </div>
            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 pt-2">
              Upload resources <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>

        <Link to="/contributor/submissions" className="group">
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 hover:border-amber-400 hover:shadow-card-hover transition-all duration-200 space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform border border-amber-100">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 group-hover:text-amber-700 transition-colors font-display">
                Review Status & Feedback
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                Track live review queue states (Pending, Approved, Rejected, Changes Requested) along with Admin reviewer feedback.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-700 flex items-center gap-1 pt-2">
              Check review queue <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </Link>
      </div>

      {/* ─── 5. EDUCATOR REVENUE & BOUNTY EXPLAINER ─────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-primary-900 via-indigo-950 to-neutral-900 text-white shadow-lg space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold font-display text-white">How Educator Earnings & Payouts Work</h3>
            <p className="text-xs text-slate-300">Transparent compensation model for verified educators and academic contributors</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-1.5">
            <span className="font-bold text-white text-sm block">1. Flat Bounty per Quiz</span>
            <p className="text-slate-200 leading-relaxed">Earn a direct platform bounty (default $15.00) instantly credited to your balance upon Admin review and approval.</p>
          </div>
          <div className="p-4.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-1.5">
            <span className="font-bold text-white text-sm block">2. Revenue Share per Attempt</span>
            <p className="text-slate-200 leading-relaxed">Earn continuous passive revenue ($0.10+ per completion) every time a student takes your quizzes.</p>
          </div>
          <div className="p-4.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 space-y-1.5">
            <span className="font-bold text-white text-sm block">3. Instant Withdrawal</span>
            <p className="text-slate-200 leading-relaxed">Request payout directly to Razorpay, Stripe Connect, or Direct UPI/Bank transfer once you reach the minimum balance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

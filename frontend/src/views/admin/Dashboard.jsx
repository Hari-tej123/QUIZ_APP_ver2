import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { Card, Badge, Button } from '../../components/UI';
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  Award,
  BookMarked,
  Layers,
  Sparkles,
  ShieldCheck,
  Clock,
  ArrowRight,
  TrendingUp,
  FileQuestion,
  FileText
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar, Legend
} from 'recharts';

export default function AdminDashboard() {
  const { showError } = useToast();
  const [stats, setStats] = useState(null);
  const [accessCounts, setAccessCounts] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, leadRes, accessRes] = await Promise.all([
          apiClient.get('/admin/stats'),
          api.get('/admin/contributor-leaderboard'),
          apiClient.get('/admin/dashboard-counts')
        ]);
        setStats(statsRes.data);
        setLeaderboard(leadRes.data.data || []);
        setAccessCounts(accessRes.data || null);
      } catch (err) {
        showError('Failed to fetch system stats.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [showError]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-neutral-200 rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const kpis = stats?.kpis || {};
  const usersByRole = accessCounts?.usersByRole || {};

  const kpiConfig = [
    { title: 'Students', value: usersByRole.STUDENT ?? kpis.totalStudents ?? 0, icon: <GraduationCap className="w-5 h-5 text-primary-500" />, desc: 'Registered student learners', accent: 'primary', link: '/admin/access' },
    { title: 'Educators', value: usersByRole.EDUCATOR ?? kpis.totalContributors ?? 0, icon: <Sparkles className="w-5 h-5 text-amber-500" />, desc: `${accessCounts?.pendingApplications ?? kpis.pendingApplications ?? 0} applications pending`, accent: 'amber', link: '/admin/operations' },
    { title: 'Administrators', value: usersByRole.ADMIN ?? 1, icon: <ShieldCheck className="w-5 h-5 text-rose-500" />, desc: 'Platform operators', accent: 'rose', link: '/admin/access' },
    { title: 'Pending Applications', value: accessCounts?.pendingApplications ?? 0, icon: <Clock className="w-5 h-5 text-violet-500" />, desc: 'Educator verification requests', accent: 'violet', link: '/admin/operations' },
    { title: 'Pending Quizzes', value: accessCounts?.pendingQuizzes ?? kpis.pendingSubmissions ?? 0, icon: <ClipboardCheck className="w-5 h-5 text-indigo-500" />, desc: 'Awaiting quality review', accent: 'indigo', link: '/admin/operations' },
    { title: 'Published Quizzes', value: accessCounts?.publishedQuizzes ?? 0, icon: <BookMarked className="w-5 h-5 text-emerald-500" />, desc: 'Live practice assessments', accent: 'emerald', link: '/admin/exams' },
    { title: 'Total Attempts', value: accessCounts?.totalAttempts ?? kpis.totalAttempts ?? 0, icon: <Award className="w-5 h-5 text-teal-500" />, desc: `Average score: ${kpis.averageScore || '0'}%`, accent: 'teal' }
  ];

  return (
    <div className="flex flex-col gap-8 w-full pb-16 animate-fade-in">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 font-display">Command Center</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-display">System Administration</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Monitor educator content review queues, contributor leaderboards, and attempt analytics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link to="/admin/review-queue">
            <Button variant="primary" size="sm" className="font-bold">
              Review Queue ({kpis.pendingSubmissions || 0})
            </Button>
          </Link>
          <Link to="/admin/payout-settings">
            <Button variant="secondary" size="sm" className="font-bold">
              Payout Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* ─── 1. KPI STATS CARDS ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {kpiConfig.map((kpi, idx) => (
          <div
            key={idx}
            className={`border rounded-2xl p-4.5 shadow-xs hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between bg-white border-neutral-200/90 ${
              kpi.link ? 'cursor-pointer hover:border-primary-300' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">{kpi.title}</span>
              <div className="p-2 rounded-xl bg-neutral-50 border border-neutral-100">
                {kpi.icon}
              </div>
            </div>
            <div>
              <span className="text-2xl font-extrabold text-neutral-900 font-display">{kpi.value}</span>
              <span className="block text-[10px] text-neutral-400 mt-1 font-semibold">{kpi.desc}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ─── 2. CONTRIBUTOR LEADERBOARD ─────────────────────────────────────── */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-primary-600 text-white flex items-center justify-center shadow-xs">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Verified Educator Leaderboard</h3>
              <p className="text-xs text-neutral-400">Most active, highest-rated, and most-approved content creators</p>
            </div>
          </div>
          <Link to="/admin/contributors" className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1">
            View All Educators <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {leaderboard.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            No active contributors ranked yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 px-3">Rank</th>
                  <th className="pb-3 px-3">Educator</th>
                  <th className="pb-3 px-3">Expertise</th>
                  <th className="pb-3 px-3 text-center">Quizzes</th>
                  <th className="pb-3 px-3 text-center">Materials</th>
                  <th className="pb-3 px-3 text-center">Student Attempts</th>
                  <th className="pb-3 px-3 text-right">Total Earned</th>
                  <th className="pb-3 px-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {leaderboard.slice(0, 5).map((e, index) => (
                  <tr key={e.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-3 font-extrabold text-neutral-900">
                      {index === 0 ? '🥇 #1' : index === 1 ? '🥈 #2' : index === 2 ? '🥉 #3' : `#${index + 1}`}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-neutral-900">{e.name}</span>
                        {e.badge && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ {e.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-neutral-400">{e.email}</span>
                    </td>
                    <td className="py-3 px-3 text-neutral-600 font-medium">{e.subjectExpertise}</td>
                    <td className="py-3 px-3 text-center font-bold text-primary-700">{e.quizzesCount}</td>
                    <td className="py-3 px-3 text-center font-bold text-indigo-700">{e.materialsCount}</td>
                    <td className="py-3 px-3 text-center font-bold text-teal-700">{e.totalAttempts}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-emerald-600">${(e.totalEarned || 0).toFixed(2)}</td>
                    <td className="py-3 px-3 text-right font-extrabold text-amber-700">{e.activityScore} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ─── 3. CHARTS GRID ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Quiz Attempt Trends" subtitle="Chronological attempt frequency volume">
          <div className="h-72 mt-4">
            {stats?.attemptsTrend?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400 font-semibold">
                No attempt logs recorded in database.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats?.attemptsTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Area type="monotone" dataKey="count" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" name="Attempts" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card title="Popular Course Metrics" subtitle="Enrolled students & assessments count per course">
          <div className="h-72 mt-4">
            {stats?.topCourses?.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400 font-semibold">
                No active courses created in database.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats?.topCourses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="title" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                  <Legend wrapperStyle={{ fontSize: '10px' }} verticalAlign="top" height={36} />
                  <Bar dataKey="enrollments" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Students Enrolled" />
                  <Bar dataKey="quizzes" fill="#7c3aed" radius={[4, 4, 0, 0]} name="Available Quizzes" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

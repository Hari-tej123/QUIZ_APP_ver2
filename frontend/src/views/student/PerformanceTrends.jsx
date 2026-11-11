import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { Card, Badge, Button } from '../../components/UI';
import {
  Award,
  TrendingUp,
  BookOpen,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  Users,
  Star,
  Sparkles,
  ArrowUpRight,
  BarChart3,
  Flame
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend
} from 'recharts';

export default function PerformanceTrends() {
  const { showError } = useToast();
  const [analytics, setAnalytics] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trackFilter, setTrackFilter] = useState('all'); // 'all' | 'competitive' | 'college'

  useEffect(() => {
    fetchPerformance();
  }, [trackFilter]);

  const fetchPerformance = async () => {
    try {
      setLoading(true);
      const [anaRes, leadRes] = await Promise.all([
        api.get('/student/performance-analytics'),
        api.get(`/student/leaderboard?track=${trackFilter}`)
      ]);
      setAnalytics(anaRes?.data || anaRes);
      setLeaderboardData(leadRes?.data || leadRes);

    } catch (err) {
      showError('Failed to load performance analytics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-neutral-200 rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const accuracyOverTime = analytics?.accuracyOverTime || [];
  const topicBreakdown = analytics?.topicBreakdown || [];
  const strongestTopics = analytics?.strongestTopics || [];
  const weakestTopics = analytics?.weakestTopics || [];

  const myStats = leaderboardData?.myStats || {};
  const peersLeaderboard = leaderboardData?.leaderboard || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 font-display">Student Analytics</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-display">
            Performance Trends & Peer Rankings
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Real-time mastery tracking, accuracy trends over time, topic strengths/weaknesses, and peer percentiles.
          </p>
        </div>

        <Link to="/student/revision">
          <Button variant="primary" size="md" className="font-bold">
            <Zap className="w-4.5 h-4.5 mr-2 text-amber-300" />
            Revision Folder
          </Button>
        </Link>
      </div>

      {/* ─── 1. SUMMARY KPI CARDS ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Peer Rank & Percentile */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 to-primary-950 text-white shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-200">Cohort Ranking</span>
            <Award className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-3xl font-extrabold font-display text-white">
              {myStats.rank ? `#${myStats.rank}` : 'Top Rank'}
            </h3>
            <p className="text-xs text-slate-200 mt-1">
              Top {myStats.percentile || 95}% percentile among {myStats.totalPeers || peersLeaderboard.length} peers
            </p>
          </div>
        </div>

        {/* Overall Accuracy */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Overall Accuracy</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-neutral-900 font-display">
              {summary.overallAccuracy || 0}%
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              {summary.totalCorrect || 0} / {summary.totalQuestionsSolved || 0} questions correct
            </p>
          </div>
        </div>

        {/* Total Questions Solved */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Questions Solved</span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-neutral-900 font-display">
              {summary.totalQuestionsSolved || 0}
            </h3>
            <p className="text-xs text-neutral-400 mt-1">Across {summary.totalAttempts || 0} assessments</p>
          </div>
        </div>

        {/* Study Hours */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Practice Time</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-neutral-900 font-display">
              {summary.totalStudyHours || '0.0'} hrs
            </h3>
            <p className="text-xs text-neutral-400 mt-1">Avg score: {summary.averageScore || 0} pts</p>
          </div>
        </div>
      </div>

      {/* ─── 2. CHARTS: ACCURACY OVER TIME & TOPICS BREAKDOWN ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Over Time Line Chart */}
        <Card title="Accuracy Progression Trend" subtitle="Percentage accuracy achieved per completed attempt">
          <div className="h-72 mt-4">
            {accuracyOverTime.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400 font-semibold">
                No attempt logs recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={accuracyOverTime} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="accColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Area type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#accColor)" name="Accuracy (%)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Topic Breakdown Bar Chart */}
        <Card title="Topic Mastery Accuracy" subtitle="Accuracy percentage breakdown per syllabus topic">
          <div className="h-72 mt-4">
            {topicBreakdown.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400 font-semibold">
                No topic attempt logs recorded yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topicBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="topic" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Bar dataKey="accuracy" fill="#6366f1" radius={[6, 6, 0, 0]} name="Accuracy (%)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* ─── 3. STRONGEST VS WEAKEST TOPICS HEATMAP / BARS ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strongest Topics */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
            <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              🔥
            </span>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Strongest Topics (Top Mastery)</h3>
              <p className="text-xs text-neutral-400">High accuracy and conceptual clarity</p>
            </div>
          </div>

          <div className="space-y-3">
            {strongestTopics.map((t, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-emerald-950">{t.topic}</span>
                  <span className="font-extrabold text-emerald-700">{t.accuracy}% Accuracy</span>
                </div>
                <div className="w-full h-2 bg-emerald-200/50 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${t.accuracy}%` }} />
                </div>
              </div>
            ))}
            {strongestTopics.length === 0 && (
              <p className="text-xs text-neutral-400 text-center py-4">Attempt more quizzes to calculate top topics.</p>
            )}
          </div>
        </Card>

        {/* Weakest Topics (Need Revision) */}
        <Card className="p-6 space-y-4">
          <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-3">
            <span className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs">
              ⚠️
            </span>
            <div>
              <h3 className="text-sm font-bold text-neutral-900">Weakest Topics (Revision Recommended)</h3>
              <p className="text-xs text-neutral-400">Focus your revision quizzes here</p>
            </div>
          </div>

          <div className="space-y-3">
            {weakestTopics.map((t, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-100 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-rose-950">{t.topic}</span>
                  <span className="font-extrabold text-rose-700">{t.accuracy}% Accuracy</span>
                </div>
                <div className="w-full h-2 bg-rose-200/50 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full" style={{ width: `${t.accuracy}%` }} />
                </div>
              </div>
            ))}
            {weakestTopics.length === 0 && (
              <p className="text-xs text-neutral-400 text-center py-4">No weak topic areas detected yet.</p>
            )}
          </div>
        </Card>
      </div>

      {/* ─── 4. PEER LEADERBOARD TABLE ─────────────────────────────────────── */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary-600" />
              Cohort Peer Leaderboard
            </h3>
            <p className="text-xs text-neutral-400">Rankings across all students attempting this track</p>
          </div>

          <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
            {['all', 'competitive', 'college'].map((t) => (
              <button
                key={t}
                onClick={() => setTrackFilter(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
                  trackFilter === t
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {peersLeaderboard.length === 0 ? (
          <div className="py-8 text-center text-xs text-neutral-400">
            No peer ranking records available.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 px-3">Rank</th>
                  <th className="pb-3 px-3">Student Peer</th>
                  <th className="pb-3 px-3 text-center">Assessments</th>
                  <th className="pb-3 px-3 text-center">Correct Qs</th>
                  <th className="pb-3 px-3 text-center">Accuracy</th>
                  <th className="pb-3 px-3 text-right">Total Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {peersLeaderboard.map((peer, idx) => (
                  <tr key={peer.id} className="hover:bg-neutral-50/60 transition-colors">
                    <td className="py-3 px-3 font-extrabold text-neutral-900">
                      {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `#${idx + 1}`}
                    </td>
                    <td className="py-3 px-3 font-bold text-neutral-900">
                      {peer.name} {peer.rollNumber ? `(${peer.rollNumber})` : ''}
                    </td>
                    <td className="py-3 px-3 text-center text-neutral-600 font-semibold">{peer.totalAttempts}</td>
                    <td className="py-3 px-3 text-center text-emerald-600 font-bold">{peer.totalCorrect}</td>
                    <td className="py-3 px-3 text-center font-extrabold text-indigo-600">{peer.accuracy}%</td>
                    <td className="py-3 px-3 text-right font-extrabold text-neutral-900">{peer.totalScore} pts</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Badge } from '../../components/UI';
import {
  BookOpen, BookMarked, GraduationCap, Award, ClipboardCheck, ArrowRight,
  TrendingUp, Layers, Play, CheckCircle2, Clock, Sparkles, FileText,
  Star, AlertOctagon, Zap, Target, Users
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function StudentDashboard() {
  const { showError } = useToast();
  const navigate = useNavigate();

  const [activeTrack, setActiveTrack] = useState('all'); // 'all' | 'competitive' | 'college'
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [targetExams, setTargetExams] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [trends, setTrends] = useState([]);
  const [mistakesCount, setMistakesCount] = useState(0);
  const [bookmarksCount, setBookmarksCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [enrolledRes, trendsRes, targetExamsRes, examsRes, mistRes, bookRes] = await Promise.all([
          apiClient.get('/student/courses/enrolled').catch(() => ({ data: [] })),
          apiClient.get('/student/performance/trends').catch(() => ({ data: { data: [] } })),
          apiClient.get('/student/me/exam-preferences').catch(() => ({ data: { data: [] } })),
          apiClient.get('/exams').catch(() => ({ data: { data: [] } })),
          api.get('/student/mistakes').catch(() => ({ data: { data: [] } })),
          api.get('/student/bookmarks').catch(() => ({ data: { data: [] } }))
        ]);

        const enrolledList = Array.isArray(enrolledRes?.data) ? enrolledRes.data : (Array.isArray(enrolledRes) ? enrolledRes : []);
        const trendsList = Array.isArray(trendsRes?.data) ? trendsRes.data : (Array.isArray(trendsRes?.data?.data) ? trendsRes.data.data : (Array.isArray(trendsRes) ? trendsRes : []));
        const targetExamsList = Array.isArray(targetExamsRes?.data) ? targetExamsRes.data : (Array.isArray(targetExamsRes) ? targetExamsRes : []);
        const allExamsList = Array.isArray(examsRes?.data) ? examsRes.data : (Array.isArray(examsRes) ? examsRes : []);
        const mistakesList = Array.isArray(mistRes?.data) ? mistRes.data : (Array.isArray(mistRes) ? mistRes : []);
        const bookmarksList = Array.isArray(bookRes?.data) ? bookRes.data : (Array.isArray(bookRes) ? bookRes : []);

        setEnrolledCourses(enrolledList);
        setTrends(trendsList);
        setTargetExams(targetExamsList);
        setAllExams(allExamsList);
        setMistakesCount(mistakesList.length);
        setBookmarksCount(bookmarksList.length);

      } catch (err) {
        showError('Failed to load student dashboard data.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [showError]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-neutral-200 rounded-2xl p-5 h-28 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const totalAttempts = trends.length;
  const avgScore = totalAttempts > 0
    ? (trends.reduce((acc, curr) => acc + (curr.score || 0), 0) / totalAttempts).toFixed(1)
    : '0.0';

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* ─── 1. HERO LEARNING BANNER ────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-neutral-900 via-indigo-950 to-primary-950 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-primary-500/20 text-primary-300 border border-primary-500/30 inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary-400" />
              Comprehensive Learning Journey
            </span>
            <h1 className="text-white text-2xl sm:text-[30px] font-extrabold tracking-tight font-display flex flex-wrap items-center gap-2">
              <span>Ready to practice today?</span>
              <span className="inline-block transform hover:scale-110 transition-transform duration-200 select-none text-2xl sm:text-3xl" role="img" aria-label="rocket">🚀</span>
            </h1>
            <p className="text-slate-200 text-xs sm:text-sm max-w-2xl leading-relaxed font-normal">
              Drill down into competitive exams or university courses, practice timed mock tests, and resolve tricky concepts in your revision folder.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link to="/student/exams">
              <Button variant="primary" size="md" className="bg-primary-600 hover:bg-primary-500 font-bold border-none shadow-lg shadow-primary-900/40 min-h-[42px] px-5">
                🎯 Competitive Track
              </Button>
            </Link>
            <Link to="/student/courses">
              <Button variant="secondary" size="md" className="bg-white/10 hover:bg-white/20 text-white font-bold border-white/20 backdrop-blur-sm min-h-[42px] px-5">
                🏛️ College Courses
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── 2. REVISION & QUICK ACCESS CARDS ──────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Mistakes Folder */}
        <Link to="/student/revision?tab=mistakes" className="group">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-rose-50 to-red-50/50 border border-rose-200/90 hover:border-rose-400 hover:shadow-card-hover transition-all space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-800">My Mistakes</span>
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <AlertOctagon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-neutral-900 font-display tracking-tight">{mistakesCount}</h3>
              </div>
            </div>
            <p className="text-xs text-rose-900 font-bold flex items-center gap-1 pt-2">
              Revise incorrect questions <ArrowRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </Link>

        {/* Bookmarks Folder */}
        <Link to="/student/revision?tab=bookmarks" className="group">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50/50 border border-amber-200/90 hover:border-amber-400 hover:shadow-card-hover transition-all space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-900">Bookmarked</span>
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                  <Star className="w-5 h-5 fill-white" />
                </div>
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-neutral-900 font-display tracking-tight">{bookmarksCount}</h3>
              </div>
            </div>
            <p className="text-xs text-amber-950 font-bold flex items-center gap-1 pt-2">
              Starred question bank <ArrowRight className="w-3.5 h-3.5" />
            </p>
          </div>
        </Link>

        {/* Total Attempts */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Quizzes Completed</span>
            <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <ClipboardCheck className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-3xl font-extrabold text-neutral-900 font-display">{totalAttempts}</h3>
            <p className="text-xs text-neutral-400 mt-1">Avg score: {avgScore} pts</p>
          </div>
        </div>

        {/* Performance Analytics */}
        <Link to="/student/performance" className="group">
          <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50/50 border border-indigo-100 hover:border-indigo-300 hover:shadow-card-hover transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700">Cohort Ranking</span>
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                <Award className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-neutral-900 font-display">Peer Leaderboard</h3>
              <p className="text-xs text-indigo-800 font-semibold mt-1 flex items-center gap-1">
                View rank & percentiles <ArrowRight className="w-3.5 h-3.5" />
              </p>
            </div>
          </div>
        </Link>
      </div>

      {/* ─── 3. DUAL-TRACK EXPLORATION HUBS ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Competitive Track Card */}
        <Card className="p-6 space-y-4 hover:shadow-card-hover transition-all border-primary-200/80 bg-gradient-to-br from-white to-primary-50/30">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-100 text-primary-800">
              🎯 Competitive Exams
            </span>
            <Link to="/student/exams" className="text-xs font-bold text-primary-600 hover:underline flex items-center gap-1">
              Browse All <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div>
            <h3 className="text-lg font-bold text-neutral-900">National Competitive Examinations</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Drill down: Exam → Year Edition → Subject → Topic. Access topic question sets, mock exams, and video solutions.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {targetExams.length > 0 ? (
              targetExams.map((exam) => (
                <span key={exam.id} className="px-3 py-1 rounded-xl bg-primary-100/70 border border-primary-200 text-xs font-bold text-primary-800 shadow-xs flex items-center gap-1">
                  <Target className="w-3 h-3 text-primary-600" /> {exam.code || exam.name}
                </span>
              ))
            ) : (
              <span className="text-xs text-neutral-400">
                No exams registered yet. Click below to choose your target exams!
              </span>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-100">
            <Link to="/student/exams">
              <Button variant="primary" size="sm" className="w-full font-bold">
                Enter Competitive Track
              </Button>
            </Link>
          </div>
        </Card>

        {/* College Track Card */}
        <Card className="p-6 space-y-4 hover:shadow-card-hover transition-all border-amber-200/80 bg-gradient-to-br from-white to-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800">
              🏛️ University Courses
            </span>
            <Link to="/student/courses" className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1">
              Browse Catalog <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div>
            <h3 className="text-lg font-bold text-neutral-900">Curriculum & Semester Subjects</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              Drill down: Course → Subtopic Unit → Handouts. Enrolled courses: {enrolledCourses.length}.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {enrolledCourses.slice(0, 3).map((e) => (
              <span key={e.enrollmentId || e.course?.id} className="px-3 py-1 rounded-xl bg-white border border-neutral-200 text-xs font-semibold text-neutral-700 shadow-xs">
                {e.course?.title}
              </span>
            ))}
            {enrolledCourses.length === 0 && (
              <span className="text-xs text-neutral-400">Self-enroll in courses to access lecture notes.</span>
            )}
          </div>

          <div className="pt-3 border-t border-neutral-100">
            <Link to="/student/courses">
              <Button variant="secondary" size="sm" className="w-full font-bold text-amber-800 bg-amber-100/60 hover:bg-amber-100 border-amber-200">
                Enter College Courses Track
              </Button>
            </Link>
          </div>
        </Card>
      </div>

      {/* ─── 4. RECENT ATTEMPTS & PROGRESS CHART ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Attempts Table */}
        <Card title="Recent Quiz Attempts" subtitle="Your latest mock and practice scores">
          <div className="mt-4 space-y-3">
            {trends.length === 0 ? (
              <div className="py-8 text-center text-xs text-neutral-400">
                No quiz attempts yet. Pick a track above to begin!
              </div>
            ) : (
              trends.slice(-5).reverse().map((t, idx) => (
                <div key={t.id || idx} className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/70 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-neutral-900">{t.quizTitle}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-neutral-200 text-neutral-700 font-semibold">
                        {t.category}
                      </span>
                    </div>
                    <span className="text-[11px] text-neutral-400">{t.submitDate}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-primary-600">{t.score} pts</span>
                    <Link to={`/student/quizzes/${t.quizId}/attempt`}>
                      <Button variant="ghost" size="xs">
                        Retake
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Progress Chart */}
        <Card title="Score Progression" subtitle="Chronological attempt trend">
          <div className="h-64 mt-4">
            {trends.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-neutral-400">
                Attempt assessments to visualize your score progression.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="submitDate" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ fontSize: '11px', borderRadius: '12px', border: '1px solid #e2e8f0' }} />
                  <Area type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#scoreColor)" name="Score" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

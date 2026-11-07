import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button, Badge } from '../components/UI';
import {
  GraduationCap, BookMarked, BookOpen, Layers, Search, Sparkles, CheckCircle,
  ArrowRight, Award, TrendingUp, Clock, ShieldCheck, Star, Users, Check,
  ChevronRight, HelpCircle, FileText, BarChart3, Zap, BrainCircuit, Play,
  ChevronDown
} from 'lucide-react';

export default function LandingPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTrackTab, setActiveTrackTab] = useState('competitive'); // 'competitive' | 'college'

  // Interactive Live Quiz Demo State
  const [demoSelectedOption, setDemoSelectedOption] = useState(null);
  const [demoSubmitted, setDemoSubmitted] = useState(false);
  const [demoActiveQuestion, setDemoActiveQuestion] = useState(0);

  // FAQ Accordion State
  const [openFaq, setOpenFaq] = useState(0);

  const demoQuestions = [
    {
      track: 'Competitive Exam Track (GATE CS)',
      subject: 'Algorithms & Data Structures',
      topic: 'Binary Search Trees & AVL Trees',
      question: 'What is the worst-case time complexity of searching for an element in a self-balancing AVL Tree with N nodes?',
      options: [
        { key: 'A', text: 'O(1)' },
        { key: 'B', text: 'O(log N)' },
        { key: 'C', text: 'O(N)' },
        { key: 'D', text: 'O(N log N)' }
      ],
      correct: 'B',
      explanation: 'In an AVL tree, the balance factor is maintained strictly between -1, 0, and +1, ensuring tree height is bounded by O(log N). Thus searching takes worst-case O(log N) comparisons.'
    },
    {
      track: 'College / Academic Track (University Core)',
      subject: 'Computer Networks',
      topic: 'Network Layer & Routing',
      question: 'Which routing algorithm relies on Dijkstra\'s shortest path algorithm using the global state of the network?',
      options: [
        { key: 'A', text: 'Distance Vector Routing (Bellman-Ford)' },
        { key: 'B', text: 'Link-State Routing (OSPF)' },
        { key: 'C', text: 'Flooding Protocol' },
        { key: 'D', text: 'Border Gateway Protocol (BGP)' }
      ],
      correct: 'B',
      explanation: 'Link-State routing protocols (like OSPF) distribute complete topological graph information to every node, allowing each router to run Dijkstra\'s algorithm independently.'
    }
  ];

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase();
    if (['gate', 'jee', 'upsc', 'cat', 'neet', 'competitive', 'entrance'].some(k => q.includes(k))) {
      navigate('/login?redirect=/student/exams');
    } else {
      navigate('/login?redirect=/student/courses');
    }
  };

  const handleChipClick = (term, track) => {
    setSearchQuery(term);
    setActiveTrackTab(track);
  };

  const faqs = [
    {
      q: 'How does Quizzify support both Competitive Exams and College Courses?',
      a: 'Quizzify provides two distinct, parallel tracks: the Competitive Exam Track is structured as Year Edition → Subject → Topic (e.g. GATE 2026 → CS → Algorithms), while the College Academic Track is organized by Course → Unit/Module → Topic (e.g. DSA → Unit 3: Trees → Binary Search Trees). Both tracks share the same powerful assessment engine, timing controls, and analytics.'
    },
    {
      q: 'Can I take topic-level quizzes without taking a full 3-hour exam?',
      a: 'Yes! Quizzify allows you to drill down to specific topics (e.g., Big O, Dijkstra Routing, Normalization, Mechanics) with focused 10–20 minute quizzes to master concepts before full mock tests.'
    },
    {
      q: 'Can I download lecture slides and study materials for university courses?',
      a: 'Absolutely. In the College / Academic track, faculty and university curators upload slide decks and notes organized by Unit/Module, downloadable directly with one click.'
    },
    {
      q: 'Is Quizzify free for students?',
      a: 'Yes, our core platform, topic drills, lecture handouts, and baseline performance analytics are 100% free for students and aspirants.'
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-800 flex flex-col selection:bg-primary-500 selection:text-white">
      
      {/* ─── 1. NAVBAR / HEADER ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-neutral-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 to-indigo-500 flex items-center justify-center text-white shadow-premium group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl font-display tracking-tight text-neutral-900 leading-none">
                Quizzify
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary-600 mt-0.5">
                Exam & University Prep
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-neutral-600">
            <a href="#tracks" className="hover:text-primary-600 transition-colors flex items-center gap-1">
              <BookMarked className="w-4 h-4 text-primary-500" /> Competitive Exams
            </a>
            <a href="#tracks" onClick={() => setActiveTrackTab('college')} className="hover:text-amber-600 transition-colors flex items-center gap-1">
              <BookOpen className="w-4 h-4 text-amber-500" /> College Courses
            </a>
            <a href="#demo" className="hover:text-neutral-900 transition-colors">
              Live Demo
            </a>
            <a href="#features" className="hover:text-neutral-900 transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-neutral-900 transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-neutral-900 transition-colors">
              FAQ
            </a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(user?.role === 'ADMIN' ? '/admin' : user?.role === 'EDUCATOR' ? '/questions' : '/student')}
                className="gap-2"
              >
                Go to Dashboard <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="font-semibold text-neutral-700">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm" className="shadow-indigo font-bold">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── 2. HERO SECTION ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24 bg-gradient-to-b from-neutral-50 via-white to-neutral-50">
        {/* Subtle Ambient Radial Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[750px] h-[380px] bg-gradient-to-tr from-primary-200/40 via-indigo-100/30 to-amber-200/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50/90 border border-primary-200/90 text-primary-700 text-xs font-bold shadow-xs mb-6 animate-fade-in">
            <span className="flex h-2 w-2 rounded-full bg-primary-600 animate-ping" />
            🎓 India's Smartest Exam Prep & University Learning Platform
          </div>

          {/* Large Bold Two-Line Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-neutral-900 tracking-tight leading-[1.12] font-display max-w-4xl">
            Master Every Exam & Subject <br />
            <span className="gradient-text-indigo">With Topic-Level Precision.</span>
          </h1>

          {/* Supporting Subheading in Muted Gray */}
          <p className="mt-5 text-base sm:text-lg text-neutral-500 max-w-2xl leading-relaxed font-medium">
            Whether you are preparing for national entrance exams like <strong className="text-neutral-700 font-semibold">GATE, JEE, & UPSC</strong> or mastering college engineering core courses like <strong className="text-neutral-700 font-semibold">DSA, OS, Networks, & DBMS</strong> — drill by exact topic, take timed quizzes, and measure growth.
          </p>

          {/* Search / CTA Bar */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-8 w-full max-w-2xl bg-white p-2 rounded-2xl border border-neutral-200/90 shadow-card-hover flex flex-col sm:flex-row items-center gap-2"
          >
            <div className="flex items-center gap-3 pl-3.5 pr-2 py-1.5 flex-1 w-full">
              <Search className="w-5 h-5 text-neutral-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search exam or subject (e.g., UPSC, GATE, DSA, Networks)..."
                className="w-full text-sm text-neutral-800 placeholder:text-neutral-400 focus:outline-none bg-transparent"
              />
            </div>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full sm:w-auto px-6 py-2.5 font-bold shrink-0 shadow-indigo"
            >
              Explore Tracks <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </form>

          {/* Quick Filter Chips */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 max-w-3xl">
            <span className="text-xs font-semibold text-neutral-400 mr-1">Popular:</span>
            {[
              { name: 'UPSC', track: 'competitive' },
              { name: 'GATE CS', track: 'competitive' },
              { name: 'JEE Main', track: 'competitive' },
              { name: 'DSA (Trees & Graphs)', track: 'college' },
              { name: 'Operating Systems', track: 'college' },
              { name: 'Computer Networks', track: 'college' },
              { name: 'DBMS', track: 'college' },
              { name: 'Linear Algebra', track: 'college' }
            ].map((chip) => (
              <button
                key={chip.name}
                onClick={() => handleChipClick(chip.name, chip.track)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-white border border-neutral-200/80 text-neutral-600 hover:text-primary-600 hover:border-primary-300 hover:shadow-xs transition-all cursor-pointer"
              >
                {chip.name}
              </button>
            ))}
          </div>

          {/* ─── 3. STATS BAR (4 KEY METRICS) ─────────────────────────────────── */}
          <div className="mt-14 w-full grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 pt-10 border-t border-neutral-200/80">
            <div className="bg-white/80 p-5 rounded-2xl border border-neutral-200/70 shadow-xs flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-extrabold font-display text-primary-600 tracking-tight">
                50,000+
              </span>
              <span className="text-xs font-bold text-neutral-700 mt-1">Active Students</span>
              <span className="text-[11px] text-neutral-400 mt-0.5">Cracking top exams</span>
            </div>

            <div className="bg-white/80 p-5 rounded-2xl border border-neutral-200/70 shadow-xs flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-extrabold font-display text-amber-600 tracking-tight">
                200+
              </span>
              <span className="text-xs font-bold text-neutral-700 mt-1">Exams & Courses</span>
              <span className="text-[11px] text-neutral-400 mt-0.5">Competitive & University</span>
            </div>

            <div className="bg-white/80 p-5 rounded-2xl border border-neutral-200/70 shadow-xs flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-extrabold font-display text-emerald-600 tracking-tight">
                95%
              </span>
              <span className="text-xs font-bold text-neutral-700 mt-1">Score Improvement</span>
              <span className="text-[11px] text-neutral-400 mt-0.5">Through topic drilling</span>
            </div>

            <div className="bg-white/80 p-5 rounded-2xl border border-neutral-200/70 shadow-xs flex flex-col items-center">
              <span className="text-3xl sm:text-4xl font-extrabold font-display text-neutral-900 tracking-tight">
                4.8★
              </span>
              <span className="text-xs font-bold text-neutral-700 mt-1">Average Rating</span>
              <span className="text-[11px] text-neutral-400 mt-0.5">From 12,000+ reviews</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. TWO PARALLEL TRACKS SHOWCASE ─────────────────────────────────── */}
      <section id="tracks" className="py-16 md:py-24 bg-white border-y border-neutral-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <Badge variant="primary" className="mb-3 uppercase tracking-wider font-bold">
              Dual-Track Architecture
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight font-display">
              Two Tailored Tracks. One Unified Engine.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-neutral-500 font-medium">
              We tailored the taxonomy for each learning path so you never waste time navigating disjointed notes.
            </p>

            {/* Track Selector Segmented Tabs */}
            <div className="mt-8 inline-flex p-1.5 bg-neutral-100 rounded-2xl border border-neutral-200/80 shadow-xs">
              <button
                onClick={() => setActiveTrackTab('competitive')}
                className={`flex items-center gap-2.5 px-6 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  activeTrackTab === 'competitive'
                    ? 'bg-white text-primary-700 shadow-sm border border-primary-200'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <BookMarked className="w-4 h-4 text-primary-600" />
                🎯 Competitive Exam Track
              </button>
              <button
                onClick={() => setActiveTrackTab('college')}
                className={`flex items-center gap-2.5 px-6 py-2.5 text-sm font-bold rounded-xl transition-all cursor-pointer ${
                  activeTrackTab === 'college'
                    ? 'bg-white text-amber-800 shadow-sm border border-amber-200'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <BookOpen className="w-4 h-4 text-amber-600" />
                🏛️ College & University Track
              </button>
            </div>
          </div>

          {/* Tab Content 1: Competitive Exam Track */}
          {activeTrackTab === 'competitive' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="p-2 w-fit rounded-xl bg-primary-50 text-primary-600 border border-primary-100">
                  <BookMarked className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 font-display">
                  Drill Down by Year Edition → Subject → Topic
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Engineered specifically for national exams such as <strong className="text-neutral-800">GATE, JEE Main, UPSC Civil Services, and CAT</strong>. Practice individual topic question sets to master formulas and concepts before testing full-length edition papers.
                </p>

                <div className="flex flex-col gap-2.5 mt-2">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-700">
                    <CheckCircle className="w-4 h-4 text-primary-600 shrink-0" />
                    Full hierarchical taxonomy: Year Edition → Subject → Topic → Quizzes
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-700">
                    <CheckCircle className="w-4 h-4 text-primary-600 shrink-0" />
                    Target Exam Bookmarking to personalize your dashboard
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-700">
                    <CheckCircle className="w-4 h-4 text-primary-600 shrink-0" />
                    Detailed question-by-question scoring and solutions
                  </div>
                </div>

                <div className="mt-4">
                  <Link to="/login?redirect=/student/exams">
                    <Button variant="primary" size="md" className="font-bold gap-2 shadow-indigo">
                      Explore Competitive Catalog <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Visual Demo Card */}
              <div className="lg:col-span-7 bg-neutral-50/80 border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-card">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-200/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    <span className="text-primary-600 font-extrabold">GATE 2026</span> / <span>Computer Science</span> / <span className="text-neutral-800">Algorithms & Complexity</span>
                  </div>
                  <Badge variant="trackCompetitive">Competitive Track</Badge>
                </div>

                <div className="mt-6 flex flex-col gap-3.5">
                  <div className="bg-white p-4.5 rounded-2xl border border-primary-200/60 shadow-xs flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">Topic Assessment</span>
                      <h4 className="text-sm font-bold text-neutral-900 mt-0.5">Linear Algebra & Matrix Decompositions</h4>
                      <p className="text-xs text-neutral-500 mt-1">Eigenvalues, rank, vector spaces, and determinants</p>
                    </div>
                    <Link to="/login?redirect=/student/exams">
                      <Button variant="primary" size="sm" className="shrink-0 font-bold gap-1.5">
                        <Play className="w-3.5 h-3.5 fill-white" /> Start Topic Quiz
                      </Button>
                    </Link>
                  </div>

                  <div className="bg-white p-4.5 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">Topic Assessment</span>
                      <h4 className="text-sm font-bold text-neutral-900 mt-0.5">Dynamic Programming & Graph Traversals</h4>
                      <p className="text-xs text-neutral-500 mt-1">Shortest path algorithms, BFS/DFS, memoization models</p>
                    </div>
                    <Link to="/login?redirect=/student/exams">
                      <Button variant="secondary" size="sm" className="shrink-0 font-bold gap-1.5">
                        <Play className="w-3.5 h-3.5 text-neutral-500" /> Start Topic Quiz
                      </Button>
                    </Link>
                  </div>

                  <div className="bg-white p-4.5 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">Topic Assessment</span>
                      <h4 className="text-sm font-bold text-neutral-900 mt-0.5">Operating Systems: Virtual Memory & Paging</h4>
                      <p className="text-xs text-neutral-500 mt-1">TLB hit ratios, page replacement (LRU, FIFO), segmentation</p>
                    </div>
                    <Link to="/login?redirect=/student/exams">
                      <Button variant="secondary" size="sm" className="shrink-0 font-bold gap-1.5">
                        <Play className="w-3.5 h-3.5 text-neutral-500" /> Start Topic Quiz
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab Content 2: College / Academic Track */}
          {activeTrackTab === 'college' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center animate-fade-in">
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="p-2 w-fit rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 font-display">
                  Structured as Course → Unit/Module → Topic
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed">
                  Tailored for university curricula including <strong className="text-neutral-800">Data Structures & Algorithms, Computer Networks, Operating Systems, DBMS, OOP, and Discrete Mathematics</strong>. Review syllabus modules, download slide handouts, and take topic quizzes.
                </p>

                <div className="flex flex-col gap-2.5 mt-2">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-700">
                    <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    University course taxonomy: Course → Unit/Module → Topic
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-700">
                    <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    Downloadable lecture notes, PDF slides & handouts
                  </div>
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-neutral-700">
                    <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    Topic-level quizzes to prepare for semester midterms & finals
                  </div>
                </div>

                <div className="mt-4">
                  <Link to="/login?redirect=/student/courses">
                    <Button variant="amber" size="md" className="font-bold gap-2 shadow-amber">
                      Browse University Courses <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Visual Demo Card */}
              <div className="lg:col-span-7 bg-neutral-50/80 border border-neutral-200/80 rounded-3xl p-6 sm:p-8 shadow-card">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-200/80">
                  <div className="flex items-center gap-2 text-xs font-bold text-neutral-400 uppercase tracking-wider">
                    <span className="text-amber-600 font-extrabold">Data Structures & Algorithms</span> / <span>Unit 3: Trees</span> / <span className="text-neutral-800">Binary Search Trees</span>
                  </div>
                  <Badge variant="trackCollege">College Track</Badge>
                </div>

                <div className="mt-6 flex flex-col gap-3.5">
                  <div className="bg-white p-4.5 rounded-2xl border border-amber-200/60 shadow-xs flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Module 1 • Lecture & Handout</span>
                      </div>
                      <h4 className="text-sm font-bold text-neutral-900 mt-0.5">Asymptotic Analysis & Big O</h4>
                      <p className="text-xs text-neutral-500 mt-1">Runtime analysis, recurrence relations, best and worst-case bounds</p>
                    </div>
                    <Link to="/login?redirect=/student/courses">
                      <Button variant="amber" size="sm" className="shrink-0 font-bold gap-1.5">
                        <Play className="w-3.5 h-3.5 fill-white" /> Take Quiz
                      </Button>
                    </Link>
                  </div>

                  <div className="bg-white p-4.5 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Module 2 • Lecture & Handout</span>
                      </div>
                      <h4 className="text-sm font-bold text-neutral-900 mt-0.5">Binary Search Trees & AVL Rotations</h4>
                      <p className="text-xs text-neutral-500 mt-1">Self-balancing search trees, left/right rotations, height proofs</p>
                    </div>
                    <Link to="/login?redirect=/student/courses">
                      <Button variant="secondary" size="sm" className="shrink-0 font-bold gap-1.5">
                        <Play className="w-3.5 h-3.5 text-neutral-500" /> Take Quiz
                      </Button>
                    </Link>
                  </div>

                  <div className="bg-white p-4.5 rounded-2xl border border-neutral-200/80 shadow-xs flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Module 3 • Lecture & Handout</span>
                      </div>
                      <h4 className="text-sm font-bold text-neutral-900 mt-0.5">Graph Algorithms: Shortest Paths & MST</h4>
                      <p className="text-xs text-neutral-500 mt-1">Dijkstra, Bellman-Ford, Kruskal and Prim minimum spanning trees</p>
                    </div>
                    <Link to="/login?redirect=/student/courses">
                      <Button variant="secondary" size="sm" className="shrink-0 font-bold gap-1.5">
                        <Play className="w-3.5 h-3.5 text-neutral-500" /> Take Quiz
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── 5. LIVE INTERACTIVE QUIZ DEMO ───────────────────────────────────── */}
      <section id="demo" className="py-16 md:py-24 bg-neutral-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="primary" className="mb-3 uppercase tracking-wider font-bold">
            Interactive Live Demonstration
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight font-display">
            Experience the Quiz Engine Right Now
          </h2>
          <p className="mt-3 text-sm text-neutral-500 font-medium">
            Test your knowledge with this live sample question from our curriculum.
          </p>

          <div className="mt-8 bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-card-hover text-left">
            {/* Demo Question Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-neutral-100">
              <div>
                <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">
                  {demoQuestions[demoActiveQuestion].track}
                </span>
                <h3 className="text-base font-bold text-neutral-900 mt-0.5">
                  {demoQuestions[demoActiveQuestion].subject} &bull; {demoQuestions[demoActiveQuestion].topic}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setDemoActiveQuestion(0);
                    setDemoSelectedOption(null);
                    setDemoSubmitted(false);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    demoActiveQuestion === 0 ? 'bg-primary-50 text-primary-700 border border-primary-200' : 'text-neutral-500 hover:bg-neutral-100'
                  }`}
                >
                  Question 1 (GATE CS)
                </button>
                <button
                  onClick={() => {
                    setDemoActiveQuestion(1);
                    setDemoSelectedOption(null);
                    setDemoSubmitted(false);
                  }}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                    demoActiveQuestion === 1 ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'text-neutral-500 hover:bg-neutral-100'
                  }`}
                >
                  Question 2 (College Networks)
                </button>
              </div>
            </div>

            {/* Question Text */}
            <p className="mt-6 text-base font-bold text-neutral-900 leading-relaxed font-display">
              {demoQuestions[demoActiveQuestion].question}
            </p>

            {/* Options List */}
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {demoQuestions[demoActiveQuestion].options.map((opt) => {
                const isSelected = demoSelectedOption === opt.key;
                const isCorrect = opt.key === demoQuestions[demoActiveQuestion].correct;

                let optionClasses = 'bg-neutral-50 hover:bg-neutral-100/80 border-neutral-200/90 text-neutral-800';
                if (isSelected && !demoSubmitted) {
                  optionClasses = 'bg-primary-50 border-primary-400 text-primary-900 shadow-xs';
                }
                if (demoSubmitted) {
                  if (isCorrect) {
                    optionClasses = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold';
                  } else if (isSelected && !isCorrect) {
                    optionClasses = 'bg-rose-50 border-rose-300 text-rose-900';
                  }
                }

                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => {
                      if (!demoSubmitted) setDemoSelectedOption(opt.key);
                    }}
                    className={`p-4 rounded-xl border text-left text-sm transition-all flex items-start gap-3 cursor-pointer ${optionClasses}`}
                  >
                    <span className="w-6 h-6 rounded-lg bg-white border border-neutral-200/80 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                      {opt.key}
                    </span>
                    <span className="font-medium mt-0.5">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {/* Submit / Result Section */}
            <div className="mt-6 pt-5 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              {!demoSubmitted ? (
                <>
                  <span className="text-xs text-neutral-400 font-medium">
                    Select an option and click submit to test the engine.
                  </span>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={!demoSelectedOption}
                    onClick={() => setDemoSubmitted(true)}
                    className="font-bold px-5 shadow-indigo"
                  >
                    Submit Answer
                  </Button>
                </>
              ) : (
                <div className="w-full flex flex-col gap-3">
                  <div className={`p-4 rounded-xl text-xs leading-relaxed ${
                    demoSelectedOption === demoQuestions[demoActiveQuestion].correct
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    <p className="font-bold text-sm mb-1">
                      {demoSelectedOption === demoQuestions[demoActiveQuestion].correct
                        ? '🎉 Correct! Brilliant problem-solving.'
                        : '💡 Almost there! Check the official explanation below.'}
                    </p>
                    <p className="mt-1 font-medium">{demoQuestions[demoActiveQuestion].explanation}</p>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setDemoSelectedOption(null);
                        setDemoSubmitted(false);
                      }}
                    >
                      Try Again
                    </Button>
                    <Link to="/register">
                      <Button variant="primary" size="sm" className="font-bold shadow-indigo">
                        Create Free Account to Access 5,000+ Questions <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 6. PLATFORM FEATURES ───────────────────────────────────────────── */}
      <section id="features" className="py-16 md:py-24 bg-white border-y border-neutral-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge variant="primary" className="mb-3 uppercase tracking-wider font-bold">
              Feature Suite
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight font-display">
              Everything You Need to Ace Your Exams
            </h2>
            <p className="mt-3 text-sm sm:text-base text-neutral-500 font-medium">
              A comprehensive learning environment built for depth, speed, and real mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-neutral-50/80 p-6 rounded-2xl border border-neutral-200/80 shadow-xs hover:shadow-card hover:border-neutral-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600 mb-4 shadow-xs">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 tracking-tight font-display">
                  Granular Taxonomy
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed mt-2 font-medium">
                  Never get lost in generic test series. Drill down by Edition → Subject → Topic or Course → Unit → Topic with pinpoint accuracy.
                </p>
              </div>
              <span className="text-[11px] font-bold text-primary-600 mt-4 flex items-center gap-1">
                Zero clutter <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div className="bg-neutral-50/80 p-6 rounded-2xl border border-neutral-200/80 shadow-xs hover:shadow-card hover:border-neutral-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 tracking-tight font-display">
                  Timed Quiz Engine
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed mt-2 font-medium">
                  Real exam simulation with live countdown progress, question navigation palette, instant answer auto-saving, and auto-submit.
                </p>
              </div>
              <span className="text-[11px] font-bold text-amber-600 mt-4 flex items-center gap-1">
                Sub-second response <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div className="bg-neutral-50/80 p-6 rounded-2xl border border-neutral-200/80 shadow-xs hover:shadow-card hover:border-neutral-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 shadow-xs">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 tracking-tight font-display">
                  Progress Analytics
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed mt-2 font-medium">
                  Track score trajectories over time, benchmark your personal bests, and review complete historical attempt logs.
                </p>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 mt-4 flex items-center gap-1">
                Visual trend charts <ArrowRight className="w-3 h-3" />
              </span>
            </div>

            <div className="bg-neutral-50/80 p-6 rounded-2xl border border-neutral-200/80 shadow-xs hover:shadow-card hover:border-neutral-300 transition-all flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-4 shadow-xs">
                  <FileText className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-neutral-900 tracking-tight font-display">
                  Lecture Slides & Notes
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed mt-2 font-medium">
                  Download high-yield PDF slides, handouts, and revision summaries uploaded directly by top educators and faculty.
                </p>
              </div>
              <span className="text-[11px] font-bold text-blue-600 mt-4 flex items-center gap-1">
                1-click download <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. TESTIMONIALS / SOCIAL PROOF ─────────────────────────────────── */}
      <section className="py-16 md:py-24 bg-neutral-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <Badge variant="primary" className="mb-3 uppercase tracking-wider font-bold">
              Student Stories
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight font-display">
              Trusted by 50,000+ Students & Aspirants
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                  "The topic-level drill in GATE CS Algorithms & Linear Algebra helped me identify exact subtopic weaknesses that standard mock test series missed. Secured AIR 42!"
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 font-bold flex items-center justify-center text-xs">
                  AK
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Ananya Kulkarni</h4>
                  <p className="text-[10px] text-neutral-400">GATE CS Aspirant (IIT Bombay)</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                  "Having both our university DSA course slides and quizzes organized by Unit/Module made studying for semester finals straightforward. Highest GPA in my batch."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                  RS
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Rohan Sharma</h4>
                  <p className="text-[10px] text-neutral-400">Computer Science Sophomore</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-card flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-current" />
                  ))}
                </div>
                <p className="text-xs text-neutral-600 leading-relaxed font-medium">
                  "The clean interface with no distracting ads or clunky menus is a breath of fresh air. Switching between JEE physics and College calculus in 1 click is seamless."
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                  PV
                </div>
                <div>
                  <h4 className="text-xs font-bold text-neutral-900">Pooja Verma</h4>
                  <p className="text-[10px] text-neutral-400">Engineering Aspirant</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 8. PRICING SECTION ─────────────────────────────────────────────── */}
      <section id="pricing" className="py-16 md:py-24 bg-white border-y border-neutral-200/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="primary" className="mb-3 uppercase tracking-wider font-bold">
            Transparent Access
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight font-display">
            Start Learning for Free
          </h2>
          <p className="mt-3 text-sm text-neutral-500 font-medium max-w-xl mx-auto">
            Get unlimited access to competitive exam drills, college curricula, and progress tracking.
          </p>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-2xl mx-auto">
            {/* Free Tier Card */}
            <div className="bg-neutral-50/80 rounded-3xl p-6 sm:p-8 border border-neutral-200/90 shadow-card flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Student Free Plan</span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-neutral-900 font-display">₹0</span>
                  <span className="text-xs text-neutral-400 font-semibold">/ forever</span>
                </div>
                <p className="text-xs text-neutral-500 mt-2">Perfect for all competitive exam aspirants & university students.</p>

                <div className="mt-6 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Access both Competitive & College Tracks
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Unlimited topic-level quiz attempts
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Full lecture slide and note downloads
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" /> Performance trends and score history
                  </div>
                </div>
              </div>

              <Link to="/register" className="mt-8">
                <Button variant="primary" size="md" className="w-full font-bold shadow-indigo">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Pro Plan Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-primary-500 shadow-premium flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-4 right-4">
                <Badge variant="primary">Popular</Badge>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary-600">Institution & Pro</span>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-4xl font-black text-neutral-900 font-display">Custom</span>
                </div>
                <p className="text-xs text-neutral-500 mt-2">For colleges, universities, and coaching academies managing large batches.</p>

                <div className="mt-6 flex flex-col gap-2.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                    <Check className="w-4 h-4 text-primary-600 shrink-0" /> Everything in Student Free
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                    <Check className="w-4 h-4 text-primary-600 shrink-0" /> Faculty Course & Exam Management portal
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                    <Check className="w-4 h-4 text-primary-600 shrink-0" /> Batch roster & attendance analytics
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-neutral-700">
                    <Check className="w-4 h-4 text-primary-600 shrink-0" /> Custom question bank import (.csv / json)
                  </div>
                </div>
              </div>

              <Link to="/register" className="mt-8">
                <Button variant="secondary" size="md" className="w-full font-bold">
                  Contact Academic Team
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 9. FAQ SECTION ─────────────────────────────────────────────────── */}
      <section id="faq" className="py-16 md:py-24 bg-neutral-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="primary" className="mb-3 uppercase tracking-wider font-bold">
              Got Questions?
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight font-display">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? -1 : idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 font-bold text-sm text-neutral-900 cursor-pointer hover:bg-neutral-50/50"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform shrink-0 ${
                      openFaq === idx ? 'rotate-180 text-primary-600' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-6 pb-5 pt-1 text-xs text-neutral-500 leading-relaxed font-medium animate-fade-in border-t border-neutral-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 10. FOOTER ──────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-neutral-200/80 pt-16 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-1 flex flex-col gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary-600 flex items-center justify-center text-white font-bold shadow-xs">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <span className="font-extrabold text-lg font-display text-neutral-900">Quizzify</span>
              </div>
              <p className="text-xs text-neutral-500 leading-relaxed mt-1">
                India's smartest topic-level preparation platform for competitive entrance exams and university academic curricula.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3 font-display">
                Competitive Track
              </h4>
              <ul className="space-y-2 text-xs font-medium text-neutral-500">
                <li><Link to="/login?redirect=/student/exams" className="hover:text-primary-600">GATE (CS & Maths)</Link></li>
                <li><Link to="/login?redirect=/student/exams" className="hover:text-primary-600">JEE Main (Physics & Chem)</Link></li>
                <li><Link to="/login?redirect=/student/exams" className="hover:text-primary-600">UPSC Civil Services</Link></li>
                <li><Link to="/login?redirect=/student/exams" className="hover:text-primary-600">CAT Quantitative Aptitude</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3 font-display">
                College Track
              </h4>
              <ul className="space-y-2 text-xs font-medium text-neutral-500">
                <li><Link to="/login?redirect=/student/courses" className="hover:text-amber-600">Data Structures & Algorithms</Link></li>
                <li><Link to="/login?redirect=/student/courses" className="hover:text-amber-600">Computer Networks</Link></li>
                <li><Link to="/login?redirect=/student/courses" className="hover:text-amber-600">Operating Systems</Link></li>
                <li><Link to="/login?redirect=/student/courses" className="hover:text-amber-600">Database Management (DBMS)</Link></li>
                <li><Link to="/login?redirect=/student/courses" className="hover:text-amber-600">Linear Algebra & Calculus</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900 mb-3 font-display">
                Platform
              </h4>
              <ul className="space-y-2 text-xs font-medium text-neutral-500">
                <li><Link to="/login" className="hover:text-neutral-900">Sign In</Link></li>
                <li><Link to="/register" className="hover:text-neutral-900">Create Free Account</Link></li>
                <li><a href="#features" className="hover:text-neutral-900">Feature Roadmap</a></li>
                <li><a href="#faq" className="hover:text-neutral-900">Help & Support</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-400 font-medium">
            <p>&copy; {new Date().getFullYear()} Quizzify Inc. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-neutral-600">Privacy Policy</a>
              <a href="#" className="hover:text-neutral-600">Terms of Service</a>
              <a href="#" className="hover:text-neutral-600">Security</a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Badge, EmptyState } from '../../components/UI';
import {
  BookMarked, Layers, BookOpen, Star, ArrowRight,
  ChevronRight, ArrowLeft, Play, Clock, HelpCircle, Award, Target,
  Filter, Sparkles, Check, Search, CheckCircle2, Bookmark, BookmarkCheck,
  PlusCircle, Trash2, XCircle, FileQuestion, GraduationCap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function BrowseExams() {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // Mode: if user has registered exams, default to viewing registered exams; otherwise 'register'
  const [activeTabExamId, setActiveTabExamId] = useState(null);
  const [showAddAnother, setShowAddAnother] = useState(false);

  // Search & Filter for registration catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Data lists
  const [allExams, setAllExams] = useState([]);
  const [registeredExams, setRegisteredExams] = useState([]);
  const [preferredExamIds, setPreferredExamIds] = useState([]);

  // Topic content state for selected registered exam
  const [examTopicsData, setExamTopicsData] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  const [loading, setLoading] = useState(true);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(searchQuery.trim()), 300);
    return () => window.clearTimeout(timeout);
  }, [searchQuery]);

  // Load all exams and current user registered preferences
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [allExamsRes, prefsRes] = await Promise.all([
        apiClient.get('/exams?track=COMPETITIVE'),
        apiClient.get('/student/me/exam-preferences').catch(() => ({ data: [] }))
      ]);

      const examsList = allExamsRes.data || allExamsRes || [];
      const prefsList = prefsRes.data || prefsRes || [];
      const registeredIds = prefsList.map(p => p.examId || p.id);

      setAllExams(examsList);
      setPreferredExamIds(registeredIds);

      const registered = examsList.filter(e => registeredIds.includes(e.id));
      setRegisteredExams(registered);

      if (registered.length > 0 && !activeTabExamId) {
        setActiveTabExamId(registered[0].id);
      }
    } catch (err) {
      showError('Failed to load competitive exams catalog.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Whenever activeTabExamId changes, fetch its topic-wise hierarchy with counts
  useEffect(() => {
    if (!activeTabExamId || showAddAnother) return;
    async function fetchExamTopics() {
      setTopicsLoading(true);
      try {
        const res = await apiClient.get(`/student/exams/${activeTabExamId}/topics`);
        const payload = res.data || res || {};
        setExamTopicsData(payload);
        // Default select first topic if available
        const firstTopic = payload.subjects?.[0]?.topics?.[0] || null;
        setSelectedTopic(firstTopic);
      } catch (err) {
        showError(err.message || 'Could not load topics for this exam.');
        setExamTopicsData(null);
      } finally {
        setTopicsLoading(false);
      }
    }
    fetchExamTopics();
  }, [activeTabExamId, showAddAnother, showError]);

  // Register for an exam
  const handleRegister = async (examId) => {
    setActionLoadingId(examId);
    try {
      await apiClient.post(`/student/exams/${examId}`);
      showSuccess('Exam registered as your target goal!');
      const newPrefIds = [...preferredExamIds, examId];
      setPreferredExamIds(newPrefIds);
      const newRegistered = allExams.filter(e => newPrefIds.includes(e.id));
      setRegisteredExams(newRegistered);
      setActiveTabExamId(examId);
      setShowAddAnother(false);
    } catch (err) {
      showError(err.message || 'Failed to register exam.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Unregister an exam
  const handleUnregister = async (examId) => {
    setActionLoadingId(examId);
    try {
      await apiClient.delete(`/student/exams/${examId}`);
      showSuccess('Exam removed from your target list.');
      const newPrefIds = preferredExamIds.filter(id => id !== examId);
      setPreferredExamIds(newPrefIds);
      const newRegistered = allExams.filter(e => newPrefIds.includes(e.id));
      setRegisteredExams(newRegistered);

      if (newRegistered.length > 0) {
        setActiveTabExamId(newRegistered[0].id);
      } else {
        setActiveTabExamId(null);
        setShowAddAnother(false);
      }
    } catch (err) {
      showError(err.message || 'Failed to unregister exam.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter exams for registration catalog
  const filteredCatalogExams = allExams.filter(exam => {
    const matchesCategory =
      selectedCategory === 'all' ||
      (selectedCategory === 'engineering' && exam.category === 'ENGINEERING') ||
      (selectedCategory === 'civil' && exam.category === 'CIVIL_SERVICES') ||
      (selectedCategory === 'management' && exam.category === 'MANAGEMENT') ||
      (selectedCategory === 'medical' && exam.category === 'MEDICAL');

    const matchesSearch =
      !debouncedSearch ||
      exam.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      exam.code?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      exam.description?.toLowerCase().includes(debouncedSearch.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse p-4">
        <div className="h-28 bg-white border border-neutral-200/80 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-neutral-200/80 rounded-2xl p-6 h-48" />
          ))}
        </div>
      </div>
    );
  }

  const isStateA = registeredExams.length === 0 || showAddAnother;

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-12">
      {/* ─── HEADER BANNER WITH REAL COUNTS ─────────────────────────────────── */}
      <div className="bg-white border border-neutral-200/90 p-6 md:p-8 rounded-3xl shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="trackCompetitive">
              🎯 Competitive Exam Prep
            </Badge>
            <span className="text-xs text-neutral-400 font-semibold">• Goal-Based Syllabus</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight font-display">
            {isStateA ? 'Choose Your Target Exams' : 'My Registered Competitive Exams'}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-2 leading-relaxed font-medium">
            {isStateA
              ? 'Select the national competitive exams you are preparing for (GATE, JEE Main, NEET, UPSC Civil Services, CAT) to unlock topic-wise questions, study notes, and mock tests.'
              : 'Explore syllabus topics, test your knowledge with topic-level quiz drills, and prepare for your target competitive exams.'}
          </p>
        </div>

        {/* Real Live Counters */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-primary-50 border border-primary-100 p-3.5 rounded-2xl text-center min-w-[100px]">
            <span className="text-2xl font-black text-primary-700 font-display block">
              {registeredExams.length}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">Target Goals</span>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 p-3.5 rounded-2xl text-center min-w-[100px]">
            <span className="text-2xl font-black text-neutral-800 font-display block">
              {allExams.length}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Available</span>
          </div>
        </div>
      </div>

      {/* ─── STATE A: CHOOSE TARGET EXAMS (REGISTRATION CATALOG) ──────────── */}
      {isStateA ? (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-neutral-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search competitive exams..."
                className="w-full pl-10 pr-4 py-2.2 text-sm border border-neutral-200/90 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-xs"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'All Exams' },
                { id: 'engineering', label: 'Engineering' },
                { id: 'civil', label: 'Civil Services' },
                { id: 'management', label: 'Management' },
                { id: 'medical', label: 'Medical' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-primary-600 text-white shadow-xs font-bold'
                      : 'bg-white text-neutral-600 hover:bg-neutral-100 border border-neutral-200/80'
                  }`}
                >
                  {cat.label}
                </button>
              ))}

              {registeredExams.length > 0 && showAddAnother && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowAddAnother(false)}
                  className="text-neutral-500 font-bold ml-2"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {filteredCatalogExams.length === 0 ? (
            <Card className="text-center py-16">
              <EmptyState
                icon={<BookMarked className="w-8 h-8 text-neutral-400" />}
                title="No competitive exams match your criteria"
                description="Try clearing your search query or switching the category filter."
                actionLabel="Clear Filters"
                onAction={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                actionVariant="secondary"
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCatalogExams.map((exam) => {
                const isRegistered = preferredExamIds.includes(exam.id);
                const isBusy = actionLoadingId === exam.id;

                return (
                  <div
                    key={exam.id}
                    className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:border-primary-300 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <Badge variant="primary" className="font-bold">
                          {exam.code}
                        </Badge>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          {exam.category}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-neutral-900 font-display tracking-tight">
                        {exam.name}
                      </h3>
                      <p className="text-xs text-neutral-500 leading-relaxed mt-2 line-clamp-3 font-medium">
                        {exam.description || 'Access full topic taxonomy, practice question drills, and mock exams.'}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                      {isRegistered ? (
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Registered
                          </span>
                          <Button
                            variant="danger"
                            size="xs"
                            isLoading={isBusy}
                            onClick={() => handleUnregister(exam.id)}
                            className="font-bold"
                          >
                            Unregister
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          isLoading={isBusy}
                          onClick={() => handleRegister(exam.id)}
                          className="w-full font-bold shadow-xs"
                        >
                          <Target className="w-4 h-4 mr-1.5" /> Register / Add to Goals
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ─── STATE B: REGISTERED EXAMS TOPIC-WISE VIEW ────────────────────── */
        <div className="space-y-6">
          {/* Registered Exam Tabs Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 pb-3">
            <div className="flex items-center gap-2 overflow-x-auto">
              {registeredExams.map((exam) => (
                <button
                  key={exam.id}
                  onClick={() => setActiveTabExamId(exam.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTabExamId === exam.id
                      ? 'bg-primary-600 text-white shadow-xs'
                      : 'bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200/90'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>{exam.code}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => setShowAddAnother(true)}
                className="font-bold text-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" /> Add Another Exam
              </Button>
              {activeTabExamId && (
                <Button
                  variant="ghost"
                  size="xs"
                  onClick={() => handleUnregister(activeTabExamId)}
                  isLoading={actionLoadingId === activeTabExamId}
                  className="text-rose-600 hover:bg-rose-50 text-xs font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Unregister {allExams.find(e => e.id === activeTabExamId)?.code}
                </Button>
              )}
            </div>
          </div>

          {topicsLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
            </div>
          ) : !examTopicsData || !examTopicsData.subjects || examTopicsData.subjects.length === 0 ? (
            <Card className="text-center py-16">
              <EmptyState
                icon={<BookOpen className="w-8 h-8 text-neutral-400" />}
                title="No questions added for this exam yet."
                description="Our educators are drafting high-yield question sets for this syllabus. Check back soon!"
                actionLabel="Explore Other Exams"
                onAction={() => setShowAddAnother(true)}
                actionVariant="secondary"
              />
            </Card>
          ) : (
            /* Multi-panel Topic-Wise Workspace */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Subjects & Topics Navigator */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-card space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                    <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-primary-600" /> Syllabus Topics
                    </h3>
                    <Badge variant="neutral">
                      {examTopicsData.subjects.reduce((sum, s) => sum + (s.topics?.length || 0), 0)} Topics
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    {examTopicsData.subjects.map((subject) => (
                      <div key={subject.id} className="space-y-1.5">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 block px-2">
                          {subject.name}
                        </span>
                        <div className="space-y-1">
                          {subject.topics?.map((topic) => {
                            const isSelected = selectedTopic?.id === topic.id;
                            return (
                              <button
                                key={topic.id}
                                onClick={() => setSelectedTopic(topic)}
                                className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                  isSelected
                                    ? 'bg-primary-50/90 border-primary-400 text-primary-900 shadow-xs font-bold'
                                    : 'bg-white hover:bg-neutral-50 border-neutral-200/80 text-neutral-700'
                                }`}
                              >
                                <div className="min-w-0">
                                  <span className="text-xs font-bold block truncate">{topic.name}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-neutral-500">
                                      {topic.quizCount || 0} quizzes
                                    </span>
                                    <span className="text-[10px] text-neutral-400">•</span>
                                    <span className="text-[10px] text-neutral-500">
                                      {topic.questionCount || 0} questions
                                    </span>
                                  </div>
                                </div>
                                <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary-600' : 'text-neutral-400'}`} />
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: Quizzes & Practice drills under selected topic */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                {selectedTopic ? (
                  <div className="space-y-4">
                    {/* Topic Header Card */}
                    <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-card">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="primary">Topic Practice</Badge>
                        <span className="text-xs text-neutral-400 font-semibold">• Timed Drills</span>
                      </div>
                      <h2 className="text-xl font-extrabold text-neutral-900 font-display">
                        {selectedTopic.name}
                      </h2>
                      <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                        {selectedTopic.description || 'Topic question sets and mock tests.'}
                      </p>

                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-neutral-100 text-xs font-semibold text-neutral-600">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-primary-600" /> {selectedTopic.quizCount || 0} Published Quizzes
                        </span>
                        <span className="flex items-center gap-1">
                          <FileQuestion className="w-3.5 h-3.5 text-amber-600" /> {selectedTopic.questionCount || 0} Practice Questions
                        </span>
                      </div>
                    </div>

                    {/* Published Quizzes List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Available Quizzes ({selectedTopic.quizzes?.length || 0})
                      </h4>

                      {!selectedTopic.quizzes || selectedTopic.quizzes.length === 0 ? (
                        <div className="p-8 text-center bg-white border border-neutral-200/90 rounded-2xl text-neutral-400 space-y-1">
                          <FileQuestion className="w-8 h-8 mx-auto text-neutral-300" />
                          <p className="text-xs font-semibold text-neutral-600">No quizzes published under this topic yet.</p>
                          <p className="text-[11px] text-neutral-400">Our faculty members are adding question banks.</p>
                        </div>
                      ) : (
                        selectedTopic.quizzes.map((quiz) => (
                          <div
                            key={quiz.id}
                            className="bg-white border border-neutral-200/90 rounded-2xl p-4.5 shadow-card flex items-center justify-between gap-4 hover:border-primary-300 transition-all"
                          >
                            <div>
                              <h4 className="text-sm font-bold text-neutral-900">{quiz.title}</h4>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500 font-medium">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5 text-neutral-400" /> {quiz.duration || 15} mins
                                </span>
                              </div>
                            </div>

                            <Link to={`/student/quizzes/${quiz.id}/attempt?mode=mock`}>
                              <Button variant="primary" size="sm" className="font-bold shadow-xs">
                                <Play className="w-3.5 h-3.5 mr-1" /> Start Drill
                              </Button>
                            </Link>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white border border-neutral-200/90 rounded-2xl text-neutral-400">
                    <BookOpen className="w-10 h-10 mx-auto text-neutral-300 mb-2" />
                    <p className="text-sm font-semibold">Select a topic from the left syllabus menu to see questions and quizzes.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

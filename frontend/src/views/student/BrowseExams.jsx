import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Badge, ProgressBar, EmptyState, Input } from '../../components/UI';
import {
  BookMarked, Layers, BookOpen, CheckCircle, Star, ArrowRight,
  ChevronRight, ArrowLeft, Play, Clock, HelpCircle, Award, Target,
  Filter, Sparkles, Check, Search, CheckCircle2, Bookmark, BookmarkCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function BrowseExams() {
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  // Navigation / Drill-down state
  // views: 'exams' | 'edition'
  const [currentView, setCurrentView] = useState('exams');
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedEdition, setSelectedEdition] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Data lists
  const [exams, setExams] = useState([]);
  const [editions, setEditions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [topicQuizzes, setTopicQuizzes] = useState([]);
  const [preferredExamIds, setPreferredExamIds] = useState([]);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [prefLoading, setPrefLoading] = useState(false);

  // Fetch all exams and student preferences on mount
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [examsRes, prefsRes] = await Promise.all([
        apiClient.get('/exams'),
        apiClient.get('/student/me/exam-preferences').catch(() => ({ data: { data: [] } }))
      ]);

      const examsList = examsRes.data.data || [];
      setExams(examsList);

      const savedPrefs = (prefsRes.data?.data || []).map(p => p.examId || p.id);
      setPreferredExamIds(savedPrefs);
    } catch (err) {
      showError('Failed to load competitive exams catalog.');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle student target exam preference
  const togglePreference = async (examId, e) => {
    e.stopPropagation();
    setPrefLoading(true);
    try {
      const newPrefs = preferredExamIds.includes(examId)
        ? preferredExamIds.filter(id => id !== examId)
        : [...preferredExamIds, examId];

      await apiClient.post('/student/me/exam-preferences', { examIds: newPrefs });
      setPreferredExamIds(newPrefs);
      showSuccess(
        newPrefs.includes(examId)
          ? 'Exam bookmarked as your target prep goal.'
          : 'Exam removed from your target list.'
      );
    } catch (err) {
      showError('Failed to update target exam preferences.');
    } finally {
      setPrefLoading(false);
    }
  };

  // Select an Exam -> fetch editions
  const handleSelectExam = async (exam) => {
    setSelectedExam(exam);
    setSelectedEdition(null);
    setSelectedSubject(null);
    setSelectedTopic(null);
    setDetailLoading(true);
    try {
      const res = await apiClient.get(`/exams/${exam.id}/editions`);
      const edList = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
      setEditions(edList);
      setCurrentView('edition');

      // Default select the latest active edition if available
      if (edList.length > 0) {
        handleSelectEdition(edList[0]);
      } else {
        setSubjects([]);
      }
    } catch (err) {
      showError('Failed to load exam editions.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Select Edition -> fetch subjects
  const handleSelectEdition = async (edition) => {
    setSelectedEdition(edition);
    setSelectedSubject(null);
    setSelectedTopic(null);
    setDetailLoading(true);
    try {
      const res = await apiClient.get(`/editions/${edition.id}/subjects`);
      const subjList = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
      setSubjects(subjList);
      if (subjList.length > 0) {
        handleSelectSubject(subjList[0]);
      } else {
        setTopics([]);
      }
    } catch (err) {
      showError('Failed to load subjects for this edition.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Select Subject -> fetch topics
  const handleSelectSubject = async (subject) => {
    setSelectedSubject(subject);
    setSelectedTopic(null);
    setTopicQuizzes([]);
    setDetailLoading(true);
    try {
      const res = await apiClient.get(`/subjects/${subject.id}/topics`);
      const topList = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
      setTopics(topList);
      if (topList.length > 0) {
        handleSelectTopic(topList[0]);
      }
    } catch (err) {
      showError('Failed to load topics for this subject.');
    } finally {
      setDetailLoading(false);
    }
  };

  // Select Topic -> fetch quizzes attached to this topic
  const handleSelectTopic = async (topic) => {
    setSelectedTopic(topic);
    setDetailLoading(true);
    try {
      const res = await apiClient.get(`/topics/${topic.id}/quizzes`);
      const qList = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
      setTopicQuizzes(qList);

    } catch (err) {
      showError('Failed to load practice quizzes for this topic.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleBackToExams = () => {
    setCurrentView('exams');
    setSelectedExam(null);
    setSelectedEdition(null);
    setSelectedSubject(null);
    setSelectedTopic(null);
  };

  const filteredExams = exams.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.code && e.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (e.description && e.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedCategory === 'all') return matchesSearch;
    if (selectedCategory === 'engineering') return matchesSearch && ['GATE', 'JEE', 'JEE_MAIN', 'BITSAT'].some(k => e.code?.includes(k) || e.name?.includes(k));
    if (selectedCategory === 'civil') return matchesSearch && ['UPSC', 'IAS', 'STATE_PSC'].some(k => e.code?.includes(k) || e.name?.includes(k));
    if (selectedCategory === 'management') return matchesSearch && ['CAT', 'XAT', 'GMAT'].some(k => e.code?.includes(k) || e.name?.includes(k));
    return matchesSearch;
  });

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div className="h-28 bg-white border border-neutral-200/80 rounded-2xl shadow-card" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-neutral-200/80 rounded-2xl p-6 h-52 shadow-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-12">
      
      {/* ─── VIEW 1: EXAMS CATALOG ────────────────────────────────────────── */}
      {currentView === 'exams' && (
        <>
          {/* Header Card (Light Theme) */}
          <div className="bg-white border border-neutral-200/90 p-6 md:p-8 rounded-3xl shadow-card flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="trackCompetitive">
                  🎯 Competitive Exam Track
                </Badge>
                <span className="text-xs text-neutral-400 font-semibold">• Multi-Year Taxonomy</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight font-display">
                National Entrance & Competitive Exams
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 mt-2 leading-relaxed font-medium">
                Drill through standardized exams like <strong className="text-neutral-800">GATE, JEE Main, UPSC Civil Services, and CAT</strong>. Select an exam to explore edition papers, subjects, and topic-level practice drills.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-primary-50 border border-primary-100 p-3.5 rounded-2xl text-center">
                <span className="text-2xl font-black text-primary-700 font-display block">{preferredExamIds.length}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary-600">Target Goals</span>
              </div>
              <div className="bg-neutral-50 border border-neutral-200 p-3.5 rounded-2xl text-center">
                <span className="text-2xl font-black text-neutral-800 font-display block">{exams.length}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Available</span>
              </div>
            </div>
          </div>

          {/* Search & Category Filter Chips */}
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
                { id: 'engineering', label: 'Engineering (GATE / JEE)' },
                { id: 'civil', label: 'Civil Services (UPSC)' },
                { id: 'management', label: 'Management (CAT)' }
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
            </div>
          </div>

          {/* Exams Grid */}
          {filteredExams.length === 0 ? (
            <Card className="text-center py-16">
              <EmptyState
                icon={<BookMarked className="w-8 h-8 text-neutral-400" />}
                title="No competitive exams match your criteria"
                description="Try clearing your search query or switching the category filter."
                actionLabel="Clear Search"
                onAction={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
                actionVariant="secondary"
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExams.map((exam) => {
                const isTarget = preferredExamIds.includes(exam.id);
                return (
                  <div
                    key={exam.id}
                    onClick={() => handleSelectExam(exam)}
                    className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-card hover:shadow-card-hover hover:border-primary-300 transition-all duration-200 flex flex-col justify-between cursor-pointer group"
                  >
                    <div>
                      {/* Card Header Badge & Target Star */}
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <Badge variant="trackCompetitive">
                          {exam.code || 'EXAM'}
                        </Badge>
                        <button
                          type="button"
                          onClick={(e) => togglePreference(exam.id, e)}
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isTarget
                              ? 'bg-primary-50 border-primary-200 text-primary-600 shadow-xs'
                              : 'bg-neutral-50 border-neutral-200/80 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100'
                          }`}
                          title={isTarget ? 'Target Goal' : 'Bookmark as Target Exam'}
                        >
                          {isTarget ? <BookmarkCheck className="w-4 h-4 fill-primary-600" /> : <Bookmark className="w-4 h-4" />}
                        </button>
                      </div>

                      <h3 className="text-lg font-bold text-neutral-900 group-hover:text-primary-600 transition-colors font-display tracking-tight">
                        {exam.name}
                      </h3>
                      <p className="text-xs text-neutral-500 leading-relaxed mt-2 line-clamp-3 font-medium">
                        {exam.description || 'Access structured year edition papers, core subjects, and topic practice question sets.'}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-neutral-100 flex items-center justify-between">
                      <span className="text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" /> {exam.editions?.length || 1} Edition Available
                      </span>
                      <Button variant="primary" size="xs" className="font-bold gap-1 group-hover:translate-x-0.5 transition-transform">
                        Explore Syllabus <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ─── VIEW 2: DRILL DOWN (EDITION -> SUBJECT -> TOPIC) ─────────────── */}
      {currentView === 'edition' && selectedExam && (
        <div className="flex flex-col gap-6 animate-fade-in">
          
          {/* Breadcrumb Navigation Bar */}
          <div className="bg-white border border-neutral-200/90 p-4 rounded-2xl shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto text-xs font-semibold text-neutral-500">
              <button
                onClick={handleBackToExams}
                className="hover:text-primary-600 flex items-center gap-1 font-bold text-neutral-700 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> All Exams
              </button>
              <span>/</span>
              <span className="text-primary-700 font-bold">{selectedExam.name}</span>
              {selectedEdition && (
                <>
                  <span>/</span>
                  <span className="text-neutral-700 font-bold">{selectedEdition.year} Edition</span>
                </>
              )}
              {selectedSubject && (
                <>
                  <span>/</span>
                  <span className="text-neutral-900 font-bold">{selectedSubject.name}</span>
                </>
              )}
            </div>

            <Button variant="secondary" size="xs" onClick={handleBackToExams} className="self-start sm:self-auto font-bold gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
            </Button>
          </div>

          {/* Exam Edition Info Banner */}
          <div className="bg-white border border-neutral-200/90 p-6 rounded-3xl shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Badge variant="trackCompetitive">{selectedExam.code}</Badge>
                {selectedEdition && <span className="text-xs font-bold text-neutral-500">Edition Year {selectedEdition.year}</span>}
              </div>
              <h2 className="text-2xl font-black text-neutral-900 font-display">{selectedExam.name}</h2>
              <p className="text-xs text-neutral-500 mt-1 max-w-2xl leading-relaxed font-medium">
                {selectedEdition?.description || selectedExam.description}
              </p>
            </div>

            {/* Year Editions Selector */}
            {editions.length > 1 && (
              <div className="flex items-center gap-2 bg-neutral-100 p-1.5 rounded-xl border border-neutral-200/80">
                <span className="text-[11px] font-bold text-neutral-500 px-2 uppercase">Edition:</span>
                {editions.map((ed) => (
                  <button
                    key={ed.id}
                    onClick={() => handleSelectEdition(ed)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      selectedEdition?.id === ed.id
                        ? 'bg-white text-primary-700 shadow-xs border border-neutral-200'
                        : 'text-neutral-600 hover:text-neutral-900'
                    }`}
                  >
                    {ed.year}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Multi-Panel Drill Down Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Subjects list (4 cols) */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-card">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-primary-600" /> Subjects ({subjects.length})
                  </h3>
                </div>

                {subjects.length === 0 ? (
                  <p className="text-xs text-neutral-400 py-6 text-center font-medium">No subjects found for this edition.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {subjects.map((subj) => {
                      const isSelected = selectedSubject?.id === subj.id;
                      return (
                        <button
                          key={subj.id}
                          type="button"
                          onClick={() => handleSelectSubject(subj)}
                          className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-primary-50/90 border-primary-300 text-primary-900 shadow-xs font-bold'
                              : 'bg-white hover:bg-neutral-50 border-neutral-200/80 text-neutral-700'
                          }`}
                        >
                          <div className="min-w-0 flex flex-col">
                            <span className="text-xs font-bold truncate">{subj.name}</span>
                            <span className="text-[10px] text-neutral-400 font-medium line-clamp-1 mt-0.5">
                              {subj.description || 'Core syllabus module'}
                            </span>
                          </div>
                          <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-primary-600' : 'text-neutral-400'}`} />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Topics & Practice Quizzes (8 cols) */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {selectedSubject ? (
                <>
                  {/* Topic Selection Chips */}
                  <div className="bg-white border border-neutral-200/90 rounded-2xl p-5 shadow-card">
                    <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100">
                      <div>
                        <span className="text-[10px] font-bold text-primary-600 uppercase tracking-wider">{selectedSubject.name}</span>
                        <h3 className="text-sm font-bold text-neutral-900 mt-0.5">Select a Topic to Drill</h3>
                      </div>
                      <Badge variant="neutral">{topics.length} Topics</Badge>
                    </div>

                    {topics.length === 0 ? (
                      <p className="text-xs text-neutral-400 py-6 text-center font-medium">No topics added under this subject yet.</p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {topics.map((top) => {
                          const isSelected = selectedTopic?.id === top.id;
                          return (
                            <button
                              key={top.id}
                              type="button"
                              onClick={() => handleSelectTopic(top)}
                              className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                                isSelected
                                  ? 'bg-primary-50/90 border-primary-400 text-primary-900 shadow-xs'
                                  : 'bg-white hover:bg-neutral-50/80 border-neutral-200/80 text-neutral-700'
                              }`}
                            >
                              <span className="text-xs font-bold line-clamp-1">{top.name}</span>
                              <span className="text-[10px] text-neutral-500 line-clamp-2 leading-relaxed font-medium">
                                {top.description || 'Topic assessment drills & question sets'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Quizzes list & Resources for selected topic */}
                  {selectedTopic && (
                    <div className="space-y-4">
                      {/* Topic Resources Banner */}
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-primary-900 to-indigo-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary-300">Learning Materials</span>
                          <h4 className="text-sm font-bold">{selectedTopic.name} Study Hub</h4>
                          <p className="text-xs text-neutral-300">Access educator lecture handouts, formula sheets, and video solutions.</p>
                        </div>
                        <Link to={`/student/topics/${selectedTopic.id}/resources?track=competitive`}>
                          <Button variant="secondary" size="sm" className="bg-white text-neutral-900 font-bold shrink-0 hover:bg-neutral-100">
                            <BookOpen className="w-4 h-4 mr-1.5" /> Open Resources & Videos
                          </Button>
                        </Link>
                      </div>

                      <Card
                        title={`⚡ Topic Quizzes: ${selectedTopic.name}`}
                        subtitle="Practice and mock assessments with instant explanations"
                      >
                        {detailLoading ? (
                          <div className="flex flex-col gap-3">
                            <div className="h-18 bg-neutral-100 rounded-xl animate-pulse" />
                            <div className="h-18 bg-neutral-100 rounded-xl animate-pulse" />
                          </div>
                        ) : topicQuizzes.length === 0 ? (
                          <EmptyState
                            icon={<ClipboardCheck className="w-8 h-8 text-neutral-400" />}
                            title="No quizzes attached to this topic yet"
                            description="New question banks are scheduled regularly by verified educators."
                          />
                        ) : (
                          <div className="flex flex-col gap-3.5">
                            {topicQuizzes.map((quiz) => (
                              <div
                                key={quiz.id}
                                className="bg-neutral-50/60 border border-neutral-200/80 rounded-2xl p-5 hover:bg-white hover:border-primary-200 hover:shadow-card transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                              >
                                <div className="min-w-0 flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="text-sm font-bold text-neutral-900">{quiz.title}</h4>
                                    <Badge variant="primary" className="text-[10px] py-0 px-2">
                                      <Clock className="w-3 h-3" /> {quiz.duration} min
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-neutral-500 font-medium mt-0.5 line-clamp-2">
                                    {quiz.description || 'Full multiple choice practice drill covering all topic concepts.'}
                                  </p>
                                  <div className="flex items-center gap-3 text-[11px] text-neutral-400 font-semibold mt-1">
                                    <span>{quiz.questionCount || 5} Questions</span>
                                    <span>•</span>
                                    <span>{quiz.totalMarks || 10} Total Marks</span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <Link to={`/student/quizzes/${quiz.id}/attempt?mode=practice`}>
                                    <Button variant="secondary" size="xs" className="font-bold text-indigo-700 bg-indigo-50 border-indigo-200">
                                      📖 Practice
                                    </Button>
                                  </Link>
                                  <Link to={`/student/quizzes/${quiz.id}/attempt?mode=mock`}>
                                    <Button variant="primary" size="xs" className="font-bold gap-1 shadow-xs">
                                      <Play className="w-3 h-3 fill-white" /> Timed Mock
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </Card>
                    </div>
                  )}
                </>
              ) : (
                <Card className="text-center py-16">
                  <EmptyState
                    icon={<Layers className="w-8 h-8 text-neutral-300" />}
                    title="Select a subject from the left column"
                    description="Choose a subject to reveal topics and launch practice quizzes."
                  />
                </Card>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

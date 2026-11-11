import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import apiClient from '../../utils/apiClient';
import { useToast } from '../../context/ToastContext';
import { Button, Card, Badge, DataTable, EmptyState } from '../../components/UI';
import {
  BookOpen, FileText, ChevronDown, ChevronRight, Play, CheckCircle,
  FileText as DOCIcon, Trash2, ArrowLeft, Clock, Download, Layers,
  CheckCircle2, Sparkles, User, Award
} from 'lucide-react';

export default function CourseDetails() {
  const { courseId } = useParams();
  const { showSuccess, showError, showWarning } = useToast();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('curriculum'); // 'curriculum', 'materials', 'quizzes'

  // Quiz details & attempts history
  const [expandedQuizId, setExpandedQuizId] = useState(null);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [maxPossibleMarks, setMaxPossibleMarks] = useState(0);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchCourse = async () => {
    try {
      const response = await apiClient.get(`/student/courses/${courseId}`);
      const payload = response.data?.course || response.data?.data?.course || response.data?.data || response.data;
      const courseObj = payload?.course ? { ...payload.course, isEnrolled: payload.isEnrolled ?? payload.course.isEnrolled } : payload;
      setCourse(courseObj);
    } catch (err) {
      showError(err.message || 'Failed to load course details.');
      navigate('/student/courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourse();
  }, [courseId]);

  const toggleQuizHistory = async (quizId) => {
    if (expandedQuizId === quizId) {
      setExpandedQuizId(null);
      setAttemptHistory([]);
    } else {
      setExpandedQuizId(quizId);
      setHistoryLoading(true);
      try {
        const response = await apiClient.get(`/student/quizzes/${quizId}/attempts`);
        setAttemptHistory(response.data?.data || response.data || []);
        setMaxPossibleMarks(response.data?.maxPossibleMarks || response.maxPossibleMarks || 10);
      } catch (err) {
        showError('Failed to fetch attempt history.');
      } finally {
        setHistoryLoading(false);
      }
    }
  };

  const handleStartQuiz = (quiz) => {
    const now = new Date();
    if (quiz.startTimeWindow && now < new Date(quiz.startTimeWindow)) {
      return showWarning('This quiz has not opened yet.');
    }
    if (quiz.endTimeWindow && now > new Date(quiz.endTimeWindow)) {
      return showWarning('This quiz window has closed.');
    }

    showSuccess('Starting quiz. Good luck!');
    navigate(`/student/quizzes/${quiz.id}/attempt`);
  };

  const handleDeleteAttempt = async (attemptId) => {
    if (!window.confirm('Delete this attempt from your history? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/student/attempts/${attemptId}`);
      showSuccess('Attempt removed from your history.');
      const quizId = expandedQuizId;
      setHistoryLoading(true);
      const response = await apiClient.get(`/student/quizzes/${quizId}/attempts`);
      setAttemptHistory(response.data?.data || response.data || []);
      setMaxPossibleMarks(response.data?.maxPossibleMarks || response.maxPossibleMarks || 10);
      setHistoryLoading(false);
    } catch (err) {
      setHistoryLoading(false);
      showError(err.message || 'Failed to delete attempt.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 w-full animate-pulse">
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-8 h-40 shadow-card" />
        <div className="h-10 bg-neutral-200/80 rounded-xl w-72" />
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 h-28 shadow-card" />
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 h-28 shadow-card" />
        </div>
      </div>
    );
  }

  if (!course) return null;

  const historyColumns = [
    { key: 'attemptNumber', label: 'Attempt #' },
    {
      key: 'score',
      label: 'Score Obtained',
      render: (score, row) => (
        row.status === 'in-progress'
          ? <span className="font-semibold text-neutral-400">In Progress</span>
          : <span className="font-bold text-neutral-800">{score} / {maxPossibleMarks} marks</span>
      )
    },
    {
      key: 'status',
      label: 'Completion Status',
      render: (val, row) => {
        if (row.status === 'in-progress') {
          return <Badge variant="info">IN-PROGRESS</Badge>;
        }
        if (row.status === 'aborted') {
          return <Badge variant="warning">TERMINATED</Badge>;
        }
        return <Badge variant={val === 'completed' ? 'success' : 'warning'}>{val.toUpperCase()}</Badge>;
      }
    },
    {
      key: 'submitTime',
      label: 'Completed On',
      render: (val, row) => (row.status === 'in-progress' || !val) ? 'In Progress' : new Date(val).toLocaleString()
    },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <button
          onClick={() => handleDeleteAttempt(row.id)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-danger-600 hover:bg-danger-500/10 transition-all cursor-pointer"
          title="Delete attempt"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full animate-fade-in pb-12">
      
      {/* ─── BREADCRUMB & BACK ACTION ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
          <Link to="/student/courses" className="hover:text-amber-600 flex items-center gap-1 font-bold text-neutral-700">
            <ArrowLeft className="w-3.5 h-3.5" /> All Courses
          </Link>
          <span>/</span>
          <span className="text-amber-700 font-bold">{course.subject}</span>
          <span>/</span>
          <span className="text-neutral-900 font-bold">{course.title}</span>
        </div>

        <Link to="/student/courses">
          <Button variant="secondary" size="xs" className="font-bold gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
          </Button>
        </Link>
      </div>

      {/* ─── COURSE HEADER CARD (LIGHT THEME) ─────────────────────────────── */}
      <div className="bg-white border border-neutral-200/90 rounded-3xl p-6 sm:p-8 shadow-card flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="trackCollege">{course.subject || 'University Curriculum'}</Badge>
            <span className="text-xs text-neutral-400 font-semibold">• College Academic Track</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 tracking-tight font-display">
            {course.title}
          </h1>
          <p className="text-[11px] font-semibold text-neutral-400 mt-1.5 uppercase tracking-wider flex items-center gap-1">
            <User className="w-3.5 h-3.5 text-neutral-400" /> Lecturer: {course.faculty?.name || 'Faculty Professor'}
          </p>
          <p className="text-xs sm:text-sm text-neutral-500 leading-relaxed mt-3 font-medium">
            {course.description}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-amber-50 border border-amber-100 p-3.5 rounded-2xl text-center">
            <span className="text-2xl font-black text-amber-700 font-display block">
              {course.subtopics?.length || 0}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Units / Modules</span>
          </div>
          <div className="bg-neutral-50 border border-neutral-200 p-3.5 rounded-2xl text-center">
            <span className="text-2xl font-black text-neutral-800 font-display block">
              {course.quizzes?.length || 0}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Quizzes</span>
          </div>
        </div>
      </div>

      {/* ─── TABS NAVIGATION ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-neutral-200/80">
        <button
          onClick={() => setActiveTab('curriculum')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'curriculum'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Layers className="w-4 h-4" /> Syllabus & Modules ({course.subtopics?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('materials')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'materials'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <FileText className="w-4 h-4" /> Slide Handouts
        </button>
        <button
          onClick={() => setActiveTab('quizzes')}
          className={`px-5 py-3 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'quizzes'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Award className="w-4 h-4" /> Quizzes & Attempts ({course.quizzes?.length || 0})
        </button>
      </div>

      {/* ─── TAB 1: CURRICULUM HIERARCHY (COURSE -> UNIT/MODULE -> TOPIC) ──── */}
      {activeTab === 'curriculum' && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">
              Course Units & Lesson Modules
            </h3>
            <span className="text-xs text-neutral-400 font-medium">Topic-level drills available for each module</span>
          </div>

          {course.subtopics?.length === 0 ? (
            <Card className="text-center py-16">
              <EmptyState
                icon={<Layers className="w-8 h-8 text-neutral-400" />}
                title="No modules uploaded yet"
                description="The course instructor will publish syllabus units, slide decks, and quizzes soon."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {course.subtopics?.map((unit, index) => {
                // Find quizzes matching this unit
                const unitQuizzes = course.quizzes?.filter(q => q.subtopicId === unit.id) || [];
                return (
                  <div
                    key={unit.id}
                    className="bg-white border border-neutral-200/80 rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between gap-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200/80">
                            Unit / Module {index + 1}
                          </span>
                          {unit.filePath && (
                            <span className="text-[10px] font-semibold text-neutral-400 flex items-center gap-1">
                              <FileText className="w-3 h-3 text-amber-600" /> Slide Note Attached
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-neutral-900 tracking-tight font-display">{unit.title}</h4>
                        <p className="text-xs text-neutral-500 mt-1.5 leading-relaxed font-medium">{unit.description}</p>
                      </div>

                      {unit.filePath && (
                        <a
                          href={`http://localhost:5000/${unit.filePath}`}
                          download={unit.fileName || 'handout'}
                          target="_blank"
                          rel="noreferrer"
                          className="shrink-0"
                        >
                          <Button variant="secondary" size="xs" className="font-bold gap-1.5">
                            <Download className="w-3.5 h-3.5 text-amber-600" /> Download Slide
                          </Button>
                        </a>
                      )}
                    </div>

                    {/* Topic Quizzes attached to this unit */}
                    <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500">
                        <span>{unitQuizzes.length > 0 ? `${unitQuizzes.length} Topic Quiz Scheduled` : 'Self-assessment module'}</span>
                      </div>

                      {unitQuizzes.length > 0 ? (
                        <div className="flex items-center gap-2">
                          {unitQuizzes.map((q) => (
                            <Button
                              key={q.id}
                              variant="amber"
                              size="xs"
                              className="font-bold gap-1.5 shadow-amber"
                              onClick={() => handleStartQuiz(q)}
                            >
                              <Play className="w-3 h-3 fill-white" /> Take Quiz: {q.title}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[11px] text-neutral-400 font-medium">Review slide notes before quiz release</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 2: SLIDE HANDOUTS ────────────────────────────────────────── */}
      {activeTab === 'materials' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">
            Downloadable Lecture Slides & Notes
          </h3>

          {course.subtopics?.filter(s => s.filePath).length === 0 ? (
            <Card className="text-center py-16">
              <EmptyState
                icon={<FileText className="w-8 h-8 text-neutral-400" />}
                title="No slide handouts uploaded yet"
                description="The lecturer has not uploaded slide notes for this curriculum yet."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {course.subtopics?.filter(s => s.filePath).map((sub) => (
                <div
                  key={sub.id}
                  className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-card flex items-center justify-between gap-4"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="amber">{sub.fileType?.toUpperCase() || 'PDF'} Slide</Badge>
                    </div>
                    <h4 className="text-sm font-bold text-neutral-900 truncate">{sub.title}</h4>
                    <p className="text-[11px] text-neutral-400 truncate mt-0.5">{sub.fileName || 'lecture-slide.pdf'}</p>
                  </div>

                  <a
                    href={`http://localhost:5000/${sub.filePath}`}
                    download={sub.fileName}
                    target="_blank"
                    rel="noreferrer"
                    className="shrink-0"
                  >
                    <Button variant="amber" size="xs" className="font-bold gap-1 shadow-amber">
                      <Download className="w-3.5 h-3.5" /> Download
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: QUIZZES & ATTEMPT HISTORY ─────────────────────────────── */}
      {activeTab === 'quizzes' && (
        <div className="flex flex-col gap-4">
          <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">
            Online Topic Assessments
          </h3>

          {course.quizzes?.length === 0 ? (
            <Card className="text-center py-16">
              <EmptyState
                icon={<Award className="w-8 h-8 text-neutral-400" />}
                title="No quizzes scheduled for this course yet"
                description="Quizzes will be added as semester modules progress."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {course.quizzes?.map((quiz) => {
                const isExpanded = expandedQuizId === quiz.id;
                return (
                  <div
                    key={quiz.id}
                    className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-card transition-all"
                  >
                    <div
                      onClick={() => toggleQuizHistory(quiz.id)}
                      className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50/50 transition-colors"
                    >
                      <div className="min-w-0 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-neutral-900 font-display">{quiz.title}</h4>
                          <Badge variant="amber">
                            <Clock className="w-3 h-3" /> {quiz.duration || quiz.durationMin || 15} min
                          </Badge>
                        </div>
                        <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2 font-medium">{quiz.description}</p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="amber"
                          size="sm"
                          className="font-bold gap-1.5 shadow-amber"
                          onClick={() => handleStartQuiz(quiz)}
                        >
                          <Play className="w-3.5 h-3.5 fill-white" /> Take Quiz
                        </Button>
                        <button
                          type="button"
                          onClick={() => toggleQuizHistory(quiz.id)}
                          className="p-1.5 rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 cursor-pointer"
                        >
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-neutral-100 p-5 bg-neutral-50/40 flex flex-col gap-3 animate-fade-in">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                          Attempt History & Grading Breakdown
                        </span>
                        {historyLoading ? (
                          <div className="h-32 bg-white border border-neutral-200/50 rounded-xl animate-pulse" />
                        ) : (
                          <DataTable
                            columns={historyColumns}
                            data={attemptHistory}
                            emptyStateMessage="You haven't attempted this assessment yet. Click 'Take Quiz' above to start!"
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}

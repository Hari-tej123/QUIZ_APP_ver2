import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  FileQuestion,
  PlusCircle,
  Trash2,
  Upload,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  HelpCircle,
  Layers,
  ArrowRight,
  BookOpen,
  Tag,
  Lightbulb
} from 'lucide-react';
import { Button, Card, Input, Badge, Modal } from '../../components/UI';
import api from '../../utils/api';

export default function CreateQuiz() {
  const navigate = useNavigate();
  const { showSuccess, showError, showWarning } = useToast();

  const [loading, setLoading] = useState(false);
  const [hierarchyLoading, setHierarchyLoading] = useState(true);
  const [hierarchy, setHierarchy] = useState({ competitiveExams: [], collegeCourses: [] });

  // Quiz Meta State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(15);
  const [trackType, setTrackType] = useState('competitive'); // 'competitive' | 'college'

  // Competitive Track Selection
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedEditionId, setSelectedEditionId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');

  // College Track Selection
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [selectedSubtopicId, setSelectedSubtopicId] = useState('');

  // Questions List
  const [questions, setQuestions] = useState([]);

  // Active Tab: 'manual' or 'bulk'
  const [activeTab, setActiveTab] = useState('manual');

  // Single Question Form State
  const [currentQ, setCurrentQ] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    explanation: '',
    difficulty: 'medium',
    tags: '',
    marks: 1
  });

  // Bulk Upload State
  const [uploadFile, setUploadFile] = useState(null);
  const [bulkErrors, setBulkErrors] = useState([]);
  const [bulkParsing, setBulkParsing] = useState(false);

  useEffect(() => {
    fetchHierarchy();
  }, []);

  const fetchHierarchy = async () => {
    try {
      setHierarchyLoading(true);
      const res = await api.get('/contributor/hierarchy');
      const data = res?.data || res || { competitiveExams: [], collegeCourses: [] };
      setHierarchy({
        competitiveExams: data.competitiveExams || [],
        collegeCourses: data.collegeCourses || []
      });

      if (data.competitiveExams?.length > 0) {
        const firstExam = data.competitiveExams[0];
        setSelectedExamId(firstExam.id);
        if (firstExam.editions?.length > 0) {
          const firstEdition = firstExam.editions[0];
          setSelectedEditionId(firstEdition.id);
          if (firstEdition.subjects?.length > 0) {
            const firstSub = firstEdition.subjects[0];
            setSelectedSubjectId(firstSub.id);
            if (firstSub.topics?.length > 0) {
              setSelectedTopicId(firstSub.topics[0].id);
            }
          }
        }
      }

      if (data.collegeCourses?.length > 0) {
        const firstCourse = data.collegeCourses[0];
        setSelectedCourseId(firstCourse.id);
        if (firstCourse.subtopics?.length > 0) {
          setSelectedSubtopicId(firstCourse.subtopics[0].id);
        }
      }
    } catch (err) {
      showError('Failed to load track hierarchy');
    } finally {
      setHierarchyLoading(false);
    }
  };

  // Helper for cascading competitive dropdowns
  const currentExam = hierarchy?.competitiveExams?.find(e => e.id === selectedExamId);
  const currentEditions = currentExam?.editions || [];
  const currentEdition = currentEditions.find(ed => ed.id === selectedEditionId) || currentEditions[0];
  const currentSubjects = currentEdition?.subjects || [];
  const currentSubject = currentSubjects.find(s => s.id === selectedSubjectId) || currentSubjects[0];
  const currentTopics = currentSubject?.topics || [];

  // Helper for cascading college dropdowns
  const currentCourse = hierarchy?.collegeCourses?.find(c => c.id === selectedCourseId);
  const currentSubtopics = currentCourse?.subtopics || [];


  const handleAddSingleQuestion = (e) => {
    e.preventDefault();
    if (!currentQ.questionText || !currentQ.optionA || !currentQ.optionB || !currentQ.optionC || !currentQ.optionD) {
      return showError('Please fill in question text and all 4 options.');
    }

    setQuestions([...questions, { ...currentQ, id: Date.now() }]);
    showSuccess('Question added to queue!');
    setCurrentQ({
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      explanation: '',
      difficulty: 'medium',
      tags: '',
      marks: 1
    });
  };

  const handleRemoveQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  // Bulk Excel / CSV Upload Handler
  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      return showError('Please select a CSV or Excel file.');
    }

    const formData = new FormData();
    formData.append('file', uploadFile);

    setBulkParsing(true);
    setBulkErrors([]);
    try {
      const res = await api.post('/contributor/quizzes/bulk-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const resultData = res?.data || res || {};
      const parsed = resultData.questions || [];
      const errors = resultData.errors || [];


      if (parsed && parsed.length > 0) {
        setQuestions([...questions, ...parsed]);
        showSuccess(`Successfully imported ${parsed.length} questions!`);
        setUploadFile(null);
      }
      if (errors.length > 0) {
        setBulkErrors(errors);
        showWarning(`${errors.length} rows had errors and were skipped.`);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to parse template file.');
      if (err.response?.data?.errors) {
        setBulkErrors(err.response.data.errors);
      }
    } finally {
      setBulkParsing(false);
    }
  };

  // Download Sample Template
  const handleDownloadTemplate = () => {
    window.open(`${api.defaults.baseURL}/contributor/quizzes/template`, '_blank');
  };

  // Submit Final Quiz
  const handleSubmitQuiz = async () => {
    if (!title) {
      return showError('Please enter a quiz title.');
    }
    if (questions.length === 0) {
      return showError('Please add at least one question before submitting.');
    }

    setLoading(true);
    try {
      const payload = {
        title,
        description,
        duration: parseInt(duration, 10) || 15,
        trackType,
        examEditionId: trackType === 'competitive' ? selectedEditionId : null,
        examSubjectId: trackType === 'competitive' ? selectedSubjectId : null,
        examTopicId: trackType === 'competitive' ? selectedTopicId : null,
        courseId: trackType === 'college' ? selectedCourseId : null,
        subtopicId: trackType === 'college' ? selectedSubtopicId : null,
        questions
      };

      const res = await api.post('/contributor/quizzes', payload);
      showSuccess(res.data.message || 'Quiz submitted successfully for Admin review!');
      navigate('/contributor/submissions');
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit quiz.');
    } finally {
      setLoading(false);
    }
  };

  if (hierarchyLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600">Educator Workspace</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-display">
            Create Question Bank / Quiz Set
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Build high-yield question sets for students. Approved quizzes earn instant bounties and recurring rev-share!
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmitQuiz}
            isLoading={loading}
            disabled={questions.length === 0}
            className="shadow-md shadow-primary-900/20 font-bold"
          >
            <CheckCircle2 className="w-4.5 h-4.5 mr-2" />
            Submit for Review ({questions.length} Qs)
          </Button>
        </div>
      </div>

      {/* ─── 1. TRACK & TARGET TOPIC SELECTION ─────────────────────────────── */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm">
              1
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Select Track & Target Topic</h2>
              <p className="text-xs text-neutral-400">Map this quiz to the syllabus hierarchy</p>
            </div>
          </div>

          {/* Track Switcher */}
          <div className="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200">
            <button
              type="button"
              onClick={() => setTrackType('competitive')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                trackType === 'competitive'
                  ? 'bg-white text-primary-700 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              🎯 Competitive Exams
            </button>
            <button
              type="button"
              onClick={() => setTrackType('college')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                trackType === 'college'
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              🏛️ College Courses
            </button>
          </div>
        </div>

        {trackType === 'competitive' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Exam</label>
              <select
                value={selectedExamId}
                onChange={(e) => {
                  setSelectedExamId(e.target.value);
                  const exam = hierarchy.competitiveExams.find(ex => ex.id === e.target.value);
                  if (exam?.editions?.[0]) {
                    setSelectedEditionId(exam.editions[0].id);
                    if (exam.editions[0].subjects?.[0]) {
                      setSelectedSubjectId(exam.editions[0].subjects[0].id);
                      if (exam.editions[0].subjects[0].topics?.[0]) {
                        setSelectedTopicId(exam.editions[0].subjects[0].topics[0].id);
                      }
                    }
                  }
                }}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-primary-500"
              >
                {hierarchy.competitiveExams.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({e.code})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Edition / Year</label>
              <select
                value={selectedEditionId}
                onChange={(e) => {
                  setSelectedEditionId(e.target.value);
                  const ed = currentEditions.find(item => item.id === e.target.value);
                  if (ed?.subjects?.[0]) {
                    setSelectedSubjectId(ed.subjects[0].id);
                    if (ed.subjects[0].topics?.[0]) {
                      setSelectedTopicId(ed.subjects[0].topics[0].id);
                    }
                  }
                }}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-primary-500"
              >
                {currentEditions.map(ed => (
                  <option key={ed.id} value={ed.id}>{ed.title || ed.year}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => {
                  setSelectedSubjectId(e.target.value);
                  const sub = currentSubjects.find(item => item.id === e.target.value);
                  if (sub?.topics?.[0]) {
                    setSelectedTopicId(sub.topics[0].id);
                  }
                }}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-primary-500"
              >
                {currentSubjects.map(sub => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Topic</label>
              <select
                value={selectedTopicId}
                onChange={(e) => setSelectedTopicId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-primary-500"
              >
                {currentTopics.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Course</label>
              <select
                value={selectedCourseId}
                onChange={(e) => {
                  setSelectedCourseId(e.target.value);
                  const c = hierarchy.collegeCourses.find(item => item.id === e.target.value);
                  if (c?.subtopics?.[0]) {
                    setSelectedSubtopicId(c.subtopics[0].id);
                  }
                }}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-primary-500"
              >
                {hierarchy.collegeCourses.map(c => (
                  <option key={c.id} value={c.id}>{c.title} ({c.subject})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1.5">Unit / Subtopic</label>
              <select
                value={selectedSubtopicId}
                onChange={(e) => setSelectedSubtopicId(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-primary-500"
              >
                {currentSubtopics.map(st => (
                  <option key={st.id} value={st.id}>{st.title}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Quiz Meta Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-100">
          <div className="sm:col-span-2">
            <Input
              label="Quiz Title"
              placeholder="e.g. Master Theorem & Recurrence Relations Drill"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              label="Duration (Minutes)"
              type="number"
              min="1"
              max="180"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-3">
            <label className="block text-xs font-bold text-neutral-700 mb-1">Description / Instructions</label>
            <textarea
              rows="2"
              className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Provide a brief context or instructions for this quiz set..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* ─── 2. QUESTION ADDITION MODES ───────────────────────────────────── */}
      <Card className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm">
              2
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Add Questions</h2>
              <p className="text-xs text-neutral-400">Choose manual input or bulk Excel import</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('manual')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'manual'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <PlusCircle className="w-4 h-4" /> Single Question Builder
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('bulk')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'bulk'
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              <Upload className="w-4 h-4" /> Bulk Excel / CSV Upload
            </button>
          </div>
        </div>

        {/* MANUAL QUESTION FORM */}
        {activeTab === 'manual' ? (
          <form onSubmit={handleAddSingleQuestion} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">
                Question Text <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows="3"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Enter the complete question prompt..."
                value={currentQ.questionText}
                onChange={(e) => setCurrentQ({ ...currentQ, questionText: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Option A"
                placeholder="Option A value"
                value={currentQ.optionA}
                onChange={(e) => setCurrentQ({ ...currentQ, optionA: e.target.value })}
                required
              />
              <Input
                label="Option B"
                placeholder="Option B value"
                value={currentQ.optionB}
                onChange={(e) => setCurrentQ({ ...currentQ, optionB: e.target.value })}
                required
              />
              <Input
                label="Option C"
                placeholder="Option C value"
                value={currentQ.optionC}
                onChange={(e) => setCurrentQ({ ...currentQ, optionC: e.target.value })}
                required
              />
              <Input
                label="Option D"
                placeholder="Option D value"
                value={currentQ.optionD}
                onChange={(e) => setCurrentQ({ ...currentQ, optionD: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">
                  Correct Answer <span className="text-rose-500">*</span>
                </label>
                <select
                  value={currentQ.correctOption}
                  onChange={(e) => setCurrentQ({ ...currentQ, correctOption: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Difficulty Level</label>
                <select
                  value={currentQ.difficulty}
                  onChange={(e) => setCurrentQ({ ...currentQ, difficulty: e.target.value })}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-neutral-300 bg-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="easy">🟢 Easy</option>
                  <option value="medium">🟡 Medium</option>
                  <option value="hard">🔴 Hard</option>
                </select>
              </div>

              <div>
                <Input
                  label="Tags (Comma separated)"
                  placeholder="e.g. Asymptotics, GATE 2024"
                  value={currentQ.tags}
                  onChange={(e) => setCurrentQ({ ...currentQ, tags: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Step-by-Step Explanation & Derivation
              </label>
              <textarea
                rows="2"
                className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-primary-500 outline-none"
                placeholder="Explain why this answer is correct and break down the steps..."
                value={currentQ.explanation}
                onChange={(e) => setCurrentQ({ ...currentQ, explanation: e.target.value })}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" variant="secondary" size="md" className="font-bold">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Add Question to Set
              </Button>
            </div>
          </form>
        ) : (
          /* BULK UPLOAD TAB */
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-primary-50/60 border border-primary-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-primary-950 flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-primary-600" />
                  Excel / CSV Questions Template
                </h4>
                <p className="text-xs text-primary-800">
                  Download our formatted sample sheet with columns for Question, Option A-D, Correct Answer, Explanation, Difficulty, and Tags.
                </p>
              </div>
              <Button variant="secondary" size="sm" onClick={handleDownloadTemplate} className="bg-white shrink-0 font-bold">
                Download Template (.xlsx)
              </Button>
            </div>

            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div className="border-2 border-dashed border-neutral-300 hover:border-primary-400 rounded-2xl p-8 text-center transition-colors bg-neutral-50/50 flex flex-col items-center justify-center">
                <Upload className="w-10 h-10 text-neutral-400 mb-3" />
                <span className="text-sm font-bold text-neutral-700">Choose Excel or CSV spreadsheet file</span>
                <span className="text-xs text-neutral-400 mt-1">Supports .xlsx and .csv files up to 10MB</span>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="mt-4 text-xs font-semibold file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 cursor-pointer"
                />
              </div>

              {bulkErrors.length > 0 && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
                  <h5 className="text-xs font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    Validation Warnings ({bulkErrors.length} errors found):
                  </h5>
                  <ul className="text-[11px] list-disc list-inside space-y-0.5 text-rose-700">
                    {bulkErrors.slice(0, 5).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {bulkErrors.length > 5 && <li>...and {bulkErrors.length - 5} more</li>}
                  </ul>
                </div>
              )}

              <div className="flex justify-end">
                <Button type="submit" variant="primary" size="md" isLoading={bulkParsing} disabled={!uploadFile} className="font-bold">
                  <Upload className="w-4 h-4 mr-1.5" />
                  Parse & Import Questions
                </Button>
              </div>
            </form>
          </div>
        )}
      </Card>

      {/* ─── 3. QUESTIONS QUEUE PREVIEW ──────────────────────────────────── */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm">
              3
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">
                Questions Queue ({questions.length})
              </h2>
              <p className="text-xs text-neutral-400">Review all questions before submitting</p>
            </div>
          </div>

          {questions.length > 0 && (
            <Button
              variant="danger"
              size="xs"
              onClick={() => setQuestions([])}
              className="text-xs font-semibold"
            >
              Clear All
            </Button>
          )}
        </div>

        {questions.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 space-y-2">
            <FileQuestion className="w-12 h-12 mx-auto text-neutral-300" />
            <p className="text-sm font-semibold">No questions added yet.</p>
            <p className="text-xs text-neutral-400">Add questions above to preview them here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, idx) => (
              <div key={idx} className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/80 space-y-3 relative group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-lg bg-neutral-200 text-neutral-800 text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">{q.questionText}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          q.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-800' :
                          q.difficulty === 'hard' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {q.difficulty?.toUpperCase()}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-100 text-primary-800">
                          Answer: Option {q.correctOption}
                        </span>
                        {q.tags && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-neutral-200 text-neutral-700">
                            🏷️ {q.tags}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveQuestion(idx)}
                    className="p-1.5 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Remove question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-neutral-600 bg-white p-3 rounded-xl border border-neutral-200">
                  <div className={q.correctOption === 'A' ? 'font-bold text-emerald-700' : ''}>
                    A. {q.optionA} {q.correctOption === 'A' && '✓'}
                  </div>
                  <div className={q.correctOption === 'B' ? 'font-bold text-emerald-700' : ''}>
                    B. {q.optionB} {q.correctOption === 'B' && '✓'}
                  </div>
                  <div className={q.correctOption === 'C' ? 'font-bold text-emerald-700' : ''}>
                    C. {q.optionC} {q.correctOption === 'C' && '✓'}
                  </div>
                  <div className={q.correctOption === 'D' ? 'font-bold text-emerald-700' : ''}>
                    D. {q.optionD} {q.correctOption === 'D' && '✓'}
                  </div>
                </div>

                {q.explanation && (
                  <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900">
                    <span className="font-bold">Explanation:</span> {q.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import apiClient, { BASE_URL } from '../../utils/apiClient';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Select, Textarea, Badge, Card, Modal, DataTable } from '../../components/UI';
import {
  PlusCircle, BookOpen, FileText, Download, UploadCloud,
  ChevronDown, ChevronRight, BarChart2, Award, Calendar, AlertOctagon, HelpCircle, FileText as DOCIcon, Trash2
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function CourseManagement() {
  const { showSuccess, showError, showWarning } = useToast();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('subtopics'); // 'subtopics', 'quizzes'

  // Modals state
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [subtopicModalOpen, setSubtopicModalOpen] = useState(false);
  const [quizModalOpen, setQuizModalOpen] = useState(false);

  // Form fields: Course
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDesc, setCourseDesc] = useState('');
  const [courseSubject, setCourseSubject] = useState('');

  // Form fields: Subtopic
  const [subtopicTitle, setSubtopicTitle] = useState('');
  const [subtopicDesc, setSubtopicDesc] = useState('');
  const [subtopicFile, setSubtopicFile] = useState(null);

  // Form fields: Quiz
  const [quizTitle, setQuizTitle] = useState('');
  const [quizDesc, setQuizDesc] = useState('');
  const [quizDuration, setQuizDuration] = useState('');
  const [quizMaxAttempts, setQuizMaxAttempts] = useState('');
  const [quizStart, setQuizStart] = useState('');
  const [quizEnd, setQuizEnd] = useState('');
  const [quizSubtopicId, setQuizSubtopicId] = useState('');

  // Quiz Interaction States
  const [expandedQuizId, setExpandedQuizId] = useState(null);
  const [quizAttempts, setQuizAttempts] = useState([]);
  const [quizAnalytics, setQuizAnalytics] = useState(null);
  const [attemptsLoading, setAttemptsLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Excel Questions upload & validation
  const [uploadingQuizId, setUploadingQuizId] = useState(null);
  const [excelErrors, setExcelErrors] = useState(null); // stores row-level errors

  // Optional Exam Hierarchy Linkage state for quiz creation
  const [examHierarchyOpen, setExamHierarchyOpen] = useState(false);
  const [allExamsList, setAllExamsList] = useState([]);
  const [availableEditions, setAvailableEditions] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedEditionId, setSelectedEditionId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');

  const fetchCourses = async (selectId = null) => {
    setLoading(true);
    try {
      const response = await apiClient.get('/faculty/courses');
      setCourses(response.data);
      if (response.data.length > 0) {
        if (selectId) {
          const match = response.data.find(c => c.id === selectId);
          setSelectedCourse(match || response.data[0]);
        } else if (!selectedCourse) {
          setSelectedCourse(response.data[0]);
        } else {
          // Refresh active course
          const match = response.data.find(c => c.id === selectedCourse.id);
          setSelectedCourse(match || response.data[0]);
        }
      }
    } catch (err) {
      showError('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseTitle || !courseDesc || !courseSubject) return showError('Please fill all fields.');

    try {
      const response = await apiClient.post('/faculty/courses', {
        title: courseTitle,
        description: courseDesc,
        subject: courseSubject
      });
      showSuccess('Course created successfully.');
      setCourseModalOpen(false);
      setCourseTitle('');
      setCourseDesc('');
      setCourseSubject('');
      fetchCourses(response.data.id);
    } catch (err) {
      showError(err.message || 'Failed to create course.');
    }
  };

  const handleCreateSubtopic = async (e) => {
    e.preventDefault();
    if (!subtopicTitle) return showError('Subtopic title is required.');

    const formData = new FormData();
    formData.append('courseId', selectedCourse.id);
    formData.append('title', subtopicTitle);
    formData.append('description', subtopicDesc);
    if (subtopicFile) {
      formData.append('file', subtopicFile);
    }

    try {
      await apiClient.post('/faculty/subtopics', formData);
      showSuccess('Subtopic added successfully.');
      setSubtopicModalOpen(false);
      setSubtopicTitle('');
      setSubtopicDesc('');
      setSubtopicFile(null);
      fetchCourses(selectedCourse.id);
    } catch (err) {
      showError(err.message || 'Failed to create subtopic.');
    }
  };

  // Load exam hierarchy when quiz modal opens
  useEffect(() => {
    if (quizModalOpen && allExamsList.length === 0) {
      apiClient.get('/exams').then(res => {
        setAllExamsList(res.data.data || []);
      }).catch(() => {});
    }
  }, [quizModalOpen, allExamsList.length]);

  const handleExamChange = async (examId) => {
    setSelectedExamId(examId);
    setSelectedEditionId('');
    setSelectedSubjectId('');
    setSelectedTopicId('');
    setAvailableEditions([]);
    setAvailableSubjects([]);
    setAvailableTopics([]);
    if (!examId) return;
    try {
      const res = await apiClient.get(`/exams/${examId}/editions`);
      setAvailableEditions(res.data.data || []);
    } catch (err) {}
  };

  const handleEditionChange = async (editionId) => {
    setSelectedEditionId(editionId);
    setSelectedSubjectId('');
    setSelectedTopicId('');
    setAvailableSubjects([]);
    setAvailableTopics([]);
    if (!editionId) return;
    try {
      const res = await apiClient.get(`/editions/${editionId}/subjects`);
      setAvailableSubjects(res.data.data || []);
    } catch (err) {}
  };

  const handleSubjectChange = async (subjectId) => {
    setSelectedSubjectId(subjectId);
    setSelectedTopicId('');
    setAvailableTopics([]);
    if (!subjectId) return;
    try {
      const res = await apiClient.get(`/subjects/${subjectId}/topics`);
      setAvailableTopics(res.data.data || []);
    } catch (err) {}
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    if (!quizTitle || !quizDuration || !quizSubtopicId) {
      return showError('Title, duration, and subtopic are required.');
    }

    try {
      await apiClient.post('/faculty/quizzes', {
        courseId: selectedCourse.id,
        subtopicId: quizSubtopicId,
        title: quizTitle,
        description: quizDesc,
        duration: quizDuration,
        maxAttempts: quizMaxAttempts || null,
        startTimeWindow: quizStart || null,
        endTimeWindow: quizEnd || null,
        examEditionId: selectedEditionId || null,
        examSubjectId: selectedSubjectId || null,
        examTopicId: selectedTopicId || null
      });
      showSuccess('Quiz assessment added successfully.');
      setQuizModalOpen(false);
      setQuizTitle('');
      setQuizDesc('');
      setQuizDuration('');
      setQuizMaxAttempts('');
      setQuizStart('');
      setQuizEnd('');
      setQuizSubtopicId('');
      setSelectedExamId('');
      setSelectedEditionId('');
      setSelectedSubjectId('');
      setSelectedTopicId('');
      setExamHierarchyOpen(false);
      fetchCourses(selectedCourse.id);
    } catch (err) {
      showError(err.message || 'Failed to create quiz.');
    }
  };

  const handleDownloadTemplate = async () => {
  try {
    const response = await fetch(`${BASE_URL}/faculty/quizzes/template`, {
      credentials: 'include'
    });
    if (!response.ok) throw new Error('Failed to download template');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'questions_upload_template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (err) {
    showError(err.message || 'Failed to download template.');
  }
};

  const handleExcelUpload = async (e, quizId) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingQuizId(quizId);
    setExcelErrors(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await apiClient.post(`/faculty/quizzes/${quizId}/questions`, formData);
      showSuccess('Questions uploaded and validated successfully!');
      fetchCourses(selectedCourse.id);
    } catch (err) {
      if (err.status === 400 && err.response?.errors) {
        setExcelErrors(err.response.errors);
        showWarning('Excel validation failed. Please see row errors below.');
      } else {
        showError(err.message || 'Failed to upload questions.');
      }
    } finally {
      setUploadingQuizId(null);
      // Reset input element value so same file can be uploaded again
      e.target.value = '';
    }
  };

  const toggleQuizExpand = async (quizId) => {
    if (expandedQuizId === quizId) {
      setExpandedQuizId(null);
      setQuizAttempts([]);
      setQuizAnalytics(null);
    } else {
      setExpandedQuizId(quizId);
      setExcelErrors(null);
      
      // Load attempts
      setAttemptsLoading(true);
      try {
        const attemptsResponse = await apiClient.get(`/faculty/quizzes/${quizId}/attempts`);
        setQuizAttempts(attemptsResponse.data);
      } catch (err) {
        showError('Failed to load quiz attempts.');
      } finally {
        setAttemptsLoading(false);
      }

      // Load analytics
      setAnalyticsLoading(true);
      try {
        const analyticsResponse = await apiClient.get(`/faculty/quizzes/${quizId}/analytics`);
        setQuizAnalytics(analyticsResponse.data);
      } catch (err) {
        showError('Failed to load quiz analytics.');
      } finally {
        setAnalyticsLoading(false);
      }
    }
  };

  if (loading && courses.length === 0) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  // Attempts columns
  const attemptColumns = [
    { key: 'studentName', label: 'Student', render: (_, row) => row.student?.name },
    { key: 'studentRoll', label: 'Roll Number', render: (_, row) => row.student?.rollNumber },
    { key: 'attemptNumber', label: 'Attempt #' },
    { key: 'score', label: 'Score Obtained', render: (val, row) => row.status === 'in-progress' ? 'In Progress' : `${val} marks` },
    {
      key: 'status',
      label: 'Status',
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
    { key: 'submitTime', label: 'Submitted On', render: (val, row) => row.status === 'in-progress' || !val ? 'In Progress' : new Date(val).toLocaleString() },
    {
      key: 'actions',
      label: '',
      render: (_, row) => (
        <button
          onClick={() => handleDeleteAttempt(row.id)}
          className="p-1.5 rounded-lg text-neutral-400 hover:text-danger-600 hover:bg-danger-500/10 transition-all"
          title="Delete attempt"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  const handleDeleteAttempt = async (attemptId) => {
    if (!window.confirm('Delete this attempt from the quiz log? This cannot be undone.')) return;
    try {
      await apiClient.delete(`/faculty/quizzes/${expandedQuizId}/attempts/${attemptId}`);
      showSuccess('Attempt deleted from the quiz log.');
      setAttemptsLoading(true);
      const attemptsResponse = await apiClient.get(`/faculty/quizzes/${expandedQuizId}/attempts`);
      setQuizAttempts(attemptsResponse.data);
      setAttemptsLoading(false);
    } catch (err) {
      setAttemptsLoading(false);
      showError(err.message || 'Failed to delete attempt.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 w-full items-start">
      
      {/* 1. LEFT COLUMN: Course Selector Panel */}
      <div className="lg:col-span-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Courses</h3>
          <Button size="sm" onClick={() => setCourseModalOpen(true)} className="flex items-center gap-1">
            <PlusCircle className="w-3.5 h-3.5" /> Course
          </Button>
        </div>

        <div className="flex flex-row lg:flex-col gap-2.5 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0">
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCourse(c);
                setExpandedQuizId(null);
                setExcelErrors(null);
              }}
              className={`flex-shrink-0 text-left px-4 py-3 rounded-xl border transition-all text-xs font-semibold select-none flex items-center justify-between gap-3 ${
                selectedCourse?.id === c.id
                  ? 'bg-primary-50 border-primary-300 text-primary-900 shadow-sm'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50/50'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <BookOpen className={`w-4 h-4 shrink-0 ${selectedCourse?.id === c.id ? 'text-primary-600' : 'text-neutral-400'}`} />
                <span className="truncate">{c.title}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 hidden lg:inline-block text-neutral-400" />
            </button>
          ))}
        </div>
      </div>

      {/* 2. RIGHT COLUMN: Active Course Curriculum Workspace */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        {selectedCourse ? (
          <>
            {/* Header info */}
            <div className="bg-white border border-neutral-200/80 rounded-xl p-6 shadow-premium">
              <span className="text-xs font-bold text-primary-600 uppercase tracking-wider">{selectedCourse.subject}</span>
              <h2 className="text-2xl font-bold text-neutral-900 tracking-tight mt-1">{selectedCourse.title}</h2>
              <p className="text-xs text-neutral-500 leading-relaxed mt-2">{selectedCourse.description}</p>
            </div>

            {/* Course workspace Tabs */}
            <div className="flex border-b border-neutral-200">
              <button
                onClick={() => { setActiveTab('subtopics'); setExcelErrors(null); }}
                className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'subtopics'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Subtopic Materials
              </button>
              <button
                onClick={() => { setActiveTab('quizzes'); setExcelErrors(null); }}
                className={`px-5 py-2.5 text-xs font-bold border-b-2 transition-all ${
                  activeTab === 'quizzes'
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800'
                }`}
              >
                Quiz Assessments
              </button>
            </div>

            {/* Subtopics Tab Workspace */}
            {activeTab === 'subtopics' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Subtopic Lessons</h3>
                  <Button size="sm" onClick={() => setSubtopicModalOpen(true)} className="flex items-center gap-1">
                    <PlusCircle className="w-3.5 h-3.5" /> Add Subtopic
                  </Button>
                </div>

                {selectedCourse.subtopics?.length === 0 ? (
                  <Card className="text-center py-10">
                    <p className="text-xs text-neutral-400 font-semibold">No subtopics added to this course curriculum yet.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {selectedCourse.subtopics?.map((sub) => (
                      <div key={sub.id} className="bg-white border border-neutral-200 rounded-xl p-5 shadow-premium flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex flex-col gap-1 min-w-0">
                          <h4 className="text-sm font-bold text-neutral-800 truncate">{sub.title}</h4>
                          <p className="text-xs text-neutral-500 leading-relaxed mt-0.5">{sub.description || 'No description provided.'}</p>
                        </div>
                        {sub.filePath ? (
                          <div className="shrink-0 flex items-center gap-2">
                            <Badge variant="primary" className="flex items-center gap-1 py-1 px-2.5">
                              <FileText className="w-3 h-3 text-primary-600" />
                              <span className="font-semibold">{sub.fileType?.toUpperCase()} Material</span>
                            </Badge>
                            <a
                              href={`http://localhost:5000/${sub.filePath}`}
                              download={sub.fileName}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary-600 hover:underline font-bold"
                            >
                              Download
                            </a>
                          </div>
                        ) : (
                          <Badge variant="neutral">No Attachment</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quizzes Tab Workspace */}
            {activeTab === 'quizzes' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-neutral-800 uppercase tracking-wider">Configure Assessments</h3>
                  <Button size="sm" onClick={() => setQuizModalOpen(true)} className="flex items-center gap-1">
                    <PlusCircle className="w-3.5 h-3.5" /> Create Quiz
                  </Button>
                </div>

                {/* Inline Excel row error display logic */}
                {excelErrors && (
                  <Card className="border-danger-200 bg-danger-500/5 animate-slide-up">
                    <div className="flex items-start gap-3 border-b border-danger-200/50 pb-3 mb-3">
                      <AlertOctagon className="w-5 h-5 text-danger-500 mt-0.5 shrink-0" />
                      <div>
                        <h4 className="text-sm font-bold text-danger-800">Excel Schema Row Validation Report</h4>
                        <p className="text-[10px] text-danger-600 leading-relaxed mt-0.5">
                          Questions could not be saved. Please correct the row errors highlighted in the table below and re-upload.
                        </p>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto border border-danger-100 rounded-lg max-h-[300px] overflow-y-auto bg-white">
                      <table className="min-w-full divide-y divide-danger-100">
                        <thead className="bg-danger-500/5">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-bold text-danger-700">Row</th>
                            <th className="px-4 py-2 text-left text-xs font-bold text-danger-700">Question Snippet</th>
                            <th className="px-4 py-2 text-left text-xs font-bold text-danger-700">Validation Failures</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-danger-100 bg-white">
                          {excelErrors.map((errItem, idx) => (
                            <tr key={idx} className="hover:bg-danger-50/20 text-xs">
                              <td className="px-4 py-2.5 font-bold text-danger-800">{errItem.row}</td>
                              <td className="px-4 py-2.5 text-neutral-600 truncate max-w-[200px]" title={errItem.question}>
                                {errItem.question}
                              </td>
                              <td className="px-4 py-2.5 text-danger-600 font-medium">
                                <ul className="list-disc pl-4 space-y-0.5">
                                  {errItem.errorList.map((errTxt, eIdx) => (
                                    <li key={eIdx}>{errTxt}</li>
                                  ))}
                                </ul>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>
                )}

                {selectedCourse.quizzes?.length === 0 ? (
                  <Card className="text-center py-10">
                    <p className="text-xs text-neutral-400 font-semibold">No quizzes created for this course yet.</p>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {selectedCourse.quizzes?.map((quiz) => {
                      const isExpanded = expandedQuizId === quiz.id;
                      return (
                        <div key={quiz.id} className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-premium">
                          <div
                            onClick={() => toggleQuizExpand(quiz.id)}
                            className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-neutral-50/30 transition-colors"
                          >
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-neutral-800 truncate">{quiz.title}</h4>
                                <Badge variant="primary">{quiz.duration} min</Badge>
                                <Badge variant="neutral">Attempts: {quiz.maxAttempts || 'unlimited'}</Badge>
                              </div>
                              <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{quiz.description}</p>
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="flex flex-col items-end gap-1.5">
                                <span className="text-[10px] text-neutral-400 font-semibold uppercase">Import Sheets</span>
                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                  <button onClick={() => handleDownloadTemplate()} className="focus:outline-none">
                                    <Button variant="secondary" size="sm" className="h-8 text-xs font-semibold px-2.5 flex items-center gap-1 hover:border-neutral-400">
                                      <Download className="w-3.5 h-3.5 text-neutral-500" /> Template
                                    </Button>
                                  </button>

                                  <label className="cursor-pointer">
                                    <input
                                      type="file"
                                      accept=".xlsx, .xls"
                                      className="hidden"
                                      onChange={(e) => handleExcelUpload(e, quiz.id)}
                                    />
                                    <span
                                      className={`inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 active:scale-98 h-8 text-xs px-2.5 border border-primary-200 hover:border-primary-400 bg-primary-50/50 hover:bg-primary-50 text-primary-700 gap-1 ${
                                        uploadingQuizId === quiz.id ? 'opacity-50 pointer-events-none' : ''
                                      }`}
                                    >
                                      <UploadCloud className="w-3.5 h-3.5 text-primary-600" />
                                      {uploadingQuizId === quiz.id ? 'Uploading...' : 'Upload Excel'}
                                    </span>
                                  </label>
                                </div>
                              </div>
                              {isExpanded ? <ChevronDown className="w-4 h-4 text-neutral-500" /> : <ChevronRight className="w-4 h-4 text-neutral-500" />}
                            </div>
                          </div>

                          {/* Expanded Quiz attempts and analytics segment */}
                          {isExpanded && (
                            <div className="border-t border-neutral-100 p-5 bg-neutral-50/20 flex flex-col gap-6 animate-fade-in">
                              
                              {/* Analytics & Score Distribution Charts */}
                              <div>
                                <h5 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                  <BarChart2 className="w-4 h-4 text-neutral-500" /> Quiz Grade Analytics
                                </h5>
                                {analyticsLoading ? (
                                  <div className="h-40 bg-white border border-neutral-200/50 rounded-lg animate-pulse" />
                                ) : quizAnalytics && quizAnalytics.totalAttempts > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    
                                    {/* Stats block */}
                                    <div className="md:col-span-1 bg-white border border-neutral-200/80 rounded-xl p-4 flex flex-col gap-3 justify-center shadow-premium">
                                      <div className="flex justify-between items-center text-xs border-b border-neutral-100 pb-2">
                                        <span className="text-neutral-500 font-semibold">Total Submissions</span>
                                        <span className="font-bold text-neutral-800">{quizAnalytics.totalAttempts} attempts</span>
                                      </div>
                                      <div className="flex justify-between items-center text-xs border-b border-neutral-100 pb-2">
                                        <span className="text-neutral-500 font-semibold">Average Grade Score</span>
                                        <span className="font-bold text-primary-600">{quizAnalytics.averageScore} marks</span>
                                      </div>
                                      <div className="flex justify-between items-center text-xs border-b border-neutral-100 pb-2">
                                        <span className="text-neutral-500 font-semibold">Highest Score</span>
                                        <span className="font-bold text-success-600">{quizAnalytics.highestScore} marks</span>
                                      </div>
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="text-neutral-500 font-semibold">Lowest Score</span>
                                        <span className="font-bold text-danger-600">{quizAnalytics.lowestScore} marks</span>
                                      </div>
                                    </div>

                                    {/* Score distribution bar chart */}
                                    <div className="md:col-span-2 bg-white border border-neutral-200/80 rounded-xl p-4 shadow-premium">
                                      <span className="text-[10px] font-bold text-neutral-400 block mb-2 uppercase">Score distribution (Attempts count)</span>
                                      <div className="h-36">
                                        <ResponsiveContainer width="100%" height="100%">
                                          <BarChart data={quizAnalytics.distribution} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="range" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
                                            <Tooltip contentStyle={{ fontSize: '10px' }} />
                                            <Bar dataKey="count" fill="#7c3aed" radius={[3, 3, 0, 0]} name="Students" />
                                          </BarChart>
                                        </ResponsiveContainer>
                                      </div>
                                    </div>
                                    
                                  </div>
                                ) : (
                                  <div className="bg-white border border-neutral-200/60 rounded-xl p-6 text-center shadow-premium">
                                    <p className="text-xs text-neutral-400 font-medium">No student submissions recorded for this quiz yet.</p>
                                  </div>
                                )}
                              </div>

                              {/* Student Attempts history table */}
                              <div>
                                <h5 className="text-xs font-bold text-neutral-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                  <Award className="w-4 h-4 text-neutral-500" /> Student Attempts Log
                                </h5>
                                {attemptsLoading ? (
                                  <div className="h-44 bg-white border border-neutral-200/50 rounded-lg animate-pulse" />
                                ) : (
                                  <DataTable
                                    columns={attemptColumns}
                                    data={quizAttempts}
                                    emptyStateMessage="No quiz attempts recorded."
                                  />
                                )}
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <Card className="text-center py-20">
            <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-neutral-800">No Course Created</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto leading-relaxed">
              Create a new course curriculum from the side menu to organize subtopic files and online quiz questions.
            </p>
            <Button onClick={() => setCourseModalOpen(true)} className="mt-4 flex items-center gap-1.5 mx-auto">
              <PlusCircle className="w-4 h-4" /> Create Course
            </Button>
          </Card>
        )}
      </div>

      {/* 3. MODAL: Create Course */}
      <Modal
        isOpen={courseModalOpen}
        onClose={() => setCourseModalOpen(false)}
        title="Initialize New Course Curriculum"
      >
        <form onSubmit={handleCreateCourse} className="flex flex-col gap-4">
          <Input
            label="Course Title"
            placeholder="e.g. Database Management Systems"
            value={courseTitle}
            onChange={(e) => setCourseTitle(e.target.value)}
            required
          />
          <Input
            label="Course Subject / Department"
            placeholder="e.g. Computer Science"
            value={courseSubject}
            onChange={(e) => setCourseSubject(e.target.value)}
            required
          />
          <Textarea
            label="Curriculum Description"
            placeholder="A short overview of course objectives, grading matrix..."
            value={courseDesc}
            onChange={(e) => setCourseDesc(e.target.value)}
            required
          />
          <div className="flex justify-end gap-3 mt-3 border-t border-neutral-100 pt-4">
            <Button variant="secondary" onClick={() => setCourseModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Create Course</Button>
          </div>
        </form>
      </Modal>

      {/* 4. MODAL: Create Subtopic */}
      <Modal
        isOpen={subtopicModalOpen}
        onClose={() => setSubtopicModalOpen(false)}
        title="Add Subtopic Lesson"
      >
        <form onSubmit={handleCreateSubtopic} className="flex flex-col gap-4">
          <Input
            label="Subtopic Lesson Title"
            placeholder="e.g. Normalization and BCNF"
            value={subtopicTitle}
            onChange={(e) => setSubtopicTitle(e.target.value)}
            required
          />
          <Textarea
            label="Lesson Summary"
            placeholder="Key concepts covered in this subtopic..."
            value={subtopicDesc}
            onChange={(e) => setSubtopicDesc(e.target.value)}
          />
          
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">
              Attach Study Material (Optional)
            </label>
            <input
              type="file"
              accept=".pdf, .ppt, .pptx, .doc, .docx"
              onChange={(e) => setSubtopicFile(e.target.files[0])}
              className="text-xs text-neutral-600 border border-neutral-200 p-2.5 rounded-lg bg-white"
            />
            <span className="text-[10px] text-neutral-400">Acceptable types: PDF, PPT, DOC (Max 10MB)</span>
          </div>

          <div className="flex justify-end gap-3 mt-3 border-t border-neutral-100 pt-4">
            <Button variant="secondary" onClick={() => setSubtopicModalOpen(false)}>Cancel</Button>
            <Button variant="primary" type="submit">Save Lesson</Button>
          </div>
        </form>
      </Modal>

      {/* 5. MODAL: Create Quiz */}
      <Modal
        isOpen={quizModalOpen}
        onClose={() => setQuizModalOpen(false)}
        title="Configure Quiz Assessment"
      >
        <form onSubmit={handleCreateQuiz} className="flex flex-col gap-4">
          <Input
            label="Quiz Assessment Title"
            placeholder="e.g. Relational Calculus Quiz"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            required
          />
          <Textarea
            label="Instructions"
            placeholder="Rules, guidelines, number of marks..."
            value={quizDesc}
            onChange={(e) => setQuizDesc(e.target.value)}
          />
          
          <Select
            label="Select Associated Subtopic Lesson"
            options={selectedCourse?.subtopics?.map(s => ({ value: s.id, label: s.title })) || []}
            value={quizSubtopicId}
            onChange={(e) => setQuizSubtopicId(e.target.value)}
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Duration Limit (Minutes)"
              type="number"
              min="1"
              placeholder="e.g. 15"
              value={quizDuration}
              onChange={(e) => setQuizDuration(e.target.value)}
              required
            />
            <Input
              label="Max Attempt Count"
              type="number"
              min="1"
              placeholder="Leave blank for unlimited"
              value={quizMaxAttempts}
              onChange={(e) => setQuizMaxAttempts(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Availability Opens (Optional)"
              type="datetime-local"
              value={quizStart}
              onChange={(e) => setQuizStart(e.target.value)}
            />
            <Input
              label="Availability Closes (Optional)"
              type="datetime-local"
              value={quizEnd}
              onChange={(e) => setQuizEnd(e.target.value)}
            />
          </div>

          {/* Optional Exam Hierarchy Linkage Accordion */}
          <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50/50 flex flex-col gap-3">
            <div
              onClick={() => setExamHierarchyOpen(!examHierarchyOpen)}
              className="flex items-center justify-between cursor-pointer select-none"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-800">
                  Link to Competitive Exam Hierarchy (Optional)
                </span>
                {selectedTopicId && (
                  <Badge variant="success">Linked</Badge>
                )}
              </div>
              <span className="text-xs text-primary-600 font-semibold">
                {examHierarchyOpen ? 'Hide' : 'Configure Link'}
              </span>
            </div>

            {examHierarchyOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200/80">
                <Select
                  label="1. Target Exam"
                  options={allExamsList.map(e => ({ value: e.id, label: `${e.code} - ${e.name}` }))}
                  value={selectedExamId}
                  onChange={(e) => handleExamChange(e.target.value)}
                />

                <Select
                  label="2. Exam Edition"
                  options={availableEditions.map(ed => ({ value: ed.id, label: `Edition ${ed.year}` }))}
                  value={selectedEditionId}
                  onChange={(e) => handleEditionChange(e.target.value)}
                  disabled={!selectedExamId}
                />

                <Select
                  label="3. Exam Subject"
                  options={availableSubjects.map(s => ({ value: s.id, label: s.name }))}
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  disabled={!selectedEditionId}
                />

                <Select
                  label="4. Exam Topic"
                  options={availableTopics.map(t => ({ value: t.id, label: t.name }))}
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  disabled={!selectedSubjectId}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 mt-3 border-t border-neutral-100 pt-4">
            <Button variant="secondary" onClick={() => {
              setQuizModalOpen(false);
              setExamHierarchyOpen(false);
            }}>Cancel</Button>
            <Button variant="primary" type="submit">Create Quiz</Button>
          </div>
        </form>
      </Modal>

    </div>
  );
}

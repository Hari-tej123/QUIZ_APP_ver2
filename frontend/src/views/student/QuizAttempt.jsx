import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { BASE_URL } from '../../utils/apiClient';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import { Button, Card, Badge, Modal, ProgressBar } from '../../components/UI';
import {
  Clock, Flag, ChevronLeft, ChevronRight, CheckSquare, Award,
  AlertCircle, RefreshCw, CheckCircle2, Play, XCircle, ArrowLeft,
  RotateCcw, Sparkles, Star, Lightbulb, Zap, HelpCircle, Layers, Check
} from 'lucide-react';

export default function QuizAttempt() {
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const urlMode = searchParams.get('mode') || 'mock'; // 'mock' | 'practice'

  const { showSuccess, showError, showWarning } = useToast();
  const navigate = useNavigate();

  // Screen Status: 'loading' | 'quiz' | 'submitting' | 'results'
  const [screenStatus, setScreenStatus] = useState('loading');

  // Resume / Terminate Decision Modal
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionMessage, setDecisionMessage] = useState('');
  const [existingAttemptData, setExistingAttemptData] = useState(null);

  // Attempt Data
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizMeta, setQuizMeta] = useState({ title: '', duration: 10, mode: urlMode, author: null });

  // Answers & State
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [qId]: 'A'|'B'|'C'|'D' }
  const [flaggedQuestions, setFlaggedQuestions] = useState({}); // { [qId]: boolean }
  const [bookmarkedQuestions, setBookmarkedQuestions] = useState({}); // { [qId]: boolean }
  const [practiceFeedback, setPracticeFeedback] = useState({}); // { [qId]: { isCorrect, correctOption, explanation } }

  // Timer States (Mock Mode)
  const [timeLeftStr, setTimeLeftStr] = useState('00:00');
  const [timerAlertClass, setTimerAlertClass] = useState('text-neutral-700 bg-neutral-100 border border-neutral-200');
  const timerRef = useRef(null);

  // Submit Modal & Results State
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [resultsData, setResultsData] = useState(null);
  const [resultsFilter, setResultsFilter] = useState('all'); // 'all' | 'mistakes' | 'correct' | 'skipped' | 'bookmarked'
  const [submitting, setSubmitting] = useState(false);

  // Initialize Quiz
  useEffect(() => {
    initQuiz();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [quizId]);

  const initQuiz = async (action = null) => {
    try {
      setScreenStatus('loading');
      const payload = { mode: urlMode };
      if (action) payload.action = action;

      const res = await api.post(`/quizzes/${quizId}/attempts`, payload);
      const data = res?.attempt || res?.questions ? res : (res?.data || res);

      if (data.needsDecision) {
        setDecisionMessage(data.message || 'You have an unfinished attempt.');
        setExistingAttemptData(data);
        setDecisionModalOpen(true);
        setScreenStatus('decision');
        return;
      }

      setupAttempt(data);

    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Failed to start quiz.');
      navigate('/student');
    }
  };

  const setupAttempt = (data) => {
    const att = data.attempt;
    const qs = data.questions || [];
    const mode = data.mode || att?.mode || urlMode;

    setAttempt(att);
    setQuestions(qs);
    setQuizMeta({
      title: data.quizTitle || 'Quiz Assessment',
      duration: data.quizDuration || 15,
      mode,
      author: data.author
    });

    // Populate bookmarks & saved answers
    const bMap = {};
    qs.forEach(q => { if (q.isBookmarked) bMap[q.id] = true; });
    setBookmarkedQuestions(bMap);

    const ansMap = {};
    if (data.savedAnswers?.length > 0) {
      data.savedAnswers.forEach(a => {
        const question = qs.find(item => item.id === a.questionId);
        if (question?.questionType === 'multiple-select') {
          try { ansMap[a.questionId] = JSON.parse(a.selectedOption); }
          catch { ansMap[a.questionId] = []; }
        } else {
          ansMap[a.questionId] = a.selectedOption;
        }
      });
    }
    setSelectedAnswers(ansMap);

    setScreenStatus('quiz');

    // If Mock Mode: start timer countdown
    if (mode === 'mock' && att?.startTime) {
      startTimer(att.startTime, data.quizDuration || 15);
    }
  };

  // Timer Countdown for Mock Mode
  const startTimer = (startTime, durationMins) => {
    if (timerRef.current) clearInterval(timerRef.current);

    const startMs = new Date(startTime).getTime();
    const endMs = startMs + durationMins * 60 * 1000;

    const tick = () => {
      const now = Date.now();
      const remainMs = endMs - now;

      if (remainMs <= 0) {
        setTimeLeftStr('00:00');
        clearInterval(timerRef.current);
        handleAutoSubmit();
        return;
      }

      const totalSec = Math.floor(remainMs / 1000);
      const m = Math.floor(totalSec / 60);
      const s = totalSec % 60;
      setTimeLeftStr(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);

      if (totalSec <= 60) {
        setTimerAlertClass('text-rose-600 bg-rose-50 border border-rose-200 animate-pulse font-extrabold');
      } else if (totalSec <= 300) {
        setTimerAlertClass('text-amber-600 bg-amber-50 border border-amber-200 font-bold');
      } else {
        setTimerAlertClass('text-neutral-800 bg-neutral-100 border border-neutral-200 font-bold');
      }
    };

    tick();
    timerRef.current = setInterval(tick, 1000);
  };

  // Option Selection Handler
  const handleSelectOption = async (option) => {
    const currentQ = questions[currentIndex];
    if (!currentQ || !attempt) return;

    const qId = currentQ.id;
    const answer = currentQ.questionType === 'multiple-select'
      ? (() => {
          const current = Array.isArray(selectedAnswers[qId]) ? selectedAnswers[qId] : [];
          return current.includes(option) ? current.filter(value => value !== option) : [...current, option];
        })()
      : option;
    setSelectedAnswers(prev => ({ ...prev, [qId]: answer }));

    if (quizMeta.mode === 'practice') {
      // Practice mode: instant check
      try {
        const res = await api.post(`/attempts/${attempt.id}/check-answer`, {
          questionId: qId,
          selectedOption: answer
        });
        const feedback = res?.data || res;
        setPracticeFeedback(prev => ({ ...prev, [qId]: feedback }));
      } catch (err) {
        console.error('Practice check error:', err);
      }
    } else {
      // Mock mode: save answer silently
      try {
        await api.post(`/attempts/${attempt.id}/answers`, {
          questionId: qId,
          selectedOption: answer
        });
      } catch (err) {
        console.error('Autosave error:', err);
      }
    }
  };

  // Bookmark Toggle
  const handleToggleBookmark = async (qId) => {
    try {
      const res = await api.post(`/student/questions/${qId}/bookmark`);
      const isBookmarked = res?.isBookmarked !== undefined ? res.isBookmarked : res?.data?.isBookmarked;
      setBookmarkedQuestions(prev => ({ ...prev, [qId]: isBookmarked }));
      showSuccess(isBookmarked ? 'Question bookmarked for revision!' : 'Removed from bookmarks.');
    } catch (err) {
      showError('Failed to update bookmark.');
    }
  };

  // Flag Question for Review (Mock Mode)
  const handleToggleFlag = (qId) => {
    setFlaggedQuestions(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  // Submit Quiz
  const handleSubmitQuiz = async () => {
    if (!attempt) return;
    setSubmitting(true);
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      await api.post(`/attempts/${attempt.id}/submit`);
      
      // Fetch full detailed breakdown
      const res = await api.get(`/attempts/${attempt.id}/results`);
      setResultsData(res?.data || res);
      setSubmitModalOpen(false);
      setScreenStatus('results');
      showSuccess('Quiz submitted successfully!');
    } catch (err) {
      showError(err.message || 'Failed to submit quiz attempt.');
    } finally {
      setSubmitting(false);
    }
  };


  const handleAutoSubmit = async () => {
    showWarning('Time has expired! Submitting your answers automatically.');
    handleSubmitQuiz();
  };

  const currentQ = questions[currentIndex] || {};
  const currentAnswer = selectedAnswers[currentQ.id];
  const currentFeedback = practiceFeedback[currentQ.id];
  const isCurrentBookmarked = bookmarkedQuestions[currentQ.id];
  const isCurrentFlagged = flaggedQuestions[currentQ.id];

  // ─── DECISION SCREEN (Resume or Terminate) ──────────────────────────────────
  if (screenStatus === 'decision') {
    return (
      <div className="max-w-md mx-auto py-16 animate-fade-in">
        <Card className="p-8 text-center space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
            <Clock className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-neutral-900">Unfinished Attempt Detected</h3>
            <p className="text-xs text-neutral-500 leading-relaxed">{decisionMessage}</p>
          </div>
          <div className="flex flex-col gap-2.5">
            <Button variant="primary" size="md" onClick={() => initQuiz('resume')} className="font-bold">
              <Play className="w-4 h-4 mr-2" /> Resume Previous Attempt
            </Button>
            <Button variant="secondary" size="md" onClick={() => initQuiz('terminate')} className="text-neutral-600 font-semibold">
              <RotateCcw className="w-4 h-4 mr-2" /> Discard & Start Fresh
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ─── LOADING SCREEN ────────────────────────────────────────────────────────
  if (screenStatus === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600" />
      </div>
    );
  }

  // ─── 1. RESULTS SCREEN ─────────────────────────────────────────────────────
  if (screenStatus === 'results' && resultsData) {
    const att = resultsData.attempt || {};
    const qs = resultsData.questions || [];

    const filteredQs = qs.filter(q => {
      if (resultsFilter === 'mistakes') return !q.isCorrect && !q.isSkipped;
      if (resultsFilter === 'correct') return q.isCorrect;
      if (resultsFilter === 'skipped') return q.isSkipped;
      if (resultsFilter === 'bookmarked') return q.isBookmarked;
      return true;
    });

    return (
      <div className="max-w-5xl mx-auto space-y-8 pb-16 animate-fade-in">
        {/* Results Banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-neutral-900 via-indigo-950 to-primary-950 text-white shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30">
                {att.mode === 'practice' ? '📖 Practice Session Complete' : '⏱️ Timed Mock Results'}
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-display">{att.quizTitle}</h1>
              <p className="text-xs text-neutral-300">Topic: {att.topicName} • Author: {att.author?.name}</p>
            </div>

            <div className="flex items-center gap-3">
              <Link to="/student/revision">
                <Button variant="secondary" size="sm" className="bg-white/10 hover:bg-white/20 text-white font-bold border-white/20">
                  <Star className="w-4 h-4 mr-1.5 fill-amber-400 text-amber-400" /> Revision Hub
                </Button>
              </Link>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate(0)}
                className="bg-primary-600 hover:bg-primary-500 font-bold"
              >
                <RotateCcw className="w-4 h-4 mr-1.5" /> Retake Quiz
              </Button>
            </div>
          </div>

          {/* Performance Stats Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-white/10">
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Score</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold">{att.score} / {att.maxPossibleMarks}</h3>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Accuracy</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{att.accuracy}%</h3>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Correct / Total</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold">{att.correctCount} / {att.totalQuestions}</h3>
            </div>
            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-xs space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Time Spent</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold">
                {Math.floor((att.timeSpentSeconds || 0) / 60)}m {(att.timeSpentSeconds || 0) % 60}s
              </h3>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-3">
          {[
            { id: 'all', label: `All Questions (${qs.length})` },
            { id: 'mistakes', label: `❌ Mistakes (${att.incorrectCount || 0})` },
            { id: 'correct', label: `✅ Correct (${att.correctCount || 0})` },
            { id: 'skipped', label: `⚠️ Skipped (${att.skippedCount || 0})` },
            { id: 'bookmarked', label: `⭐ Bookmarked` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setResultsFilter(f.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                resultsFilter === f.id
                  ? 'bg-neutral-900 text-white shadow-xs'
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Question-by-Question Detailed Review */}
        <div className="space-y-6">
          {filteredQs.map((q, idx) => (
            <Card key={q.id || idx} className="p-6 space-y-4 hover:shadow-card-hover transition-all">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                      q.isCorrect ? 'bg-emerald-100 text-emerald-800' :
                      q.isSkipped ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {q.isCorrect ? '✓ CORRECT' : q.isSkipped ? '⚠️ SKIPPED' : '❌ INCORRECT'}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100">
                      {q.difficulty?.toUpperCase()}
                    </span>
                    <span className="text-xs text-neutral-400">+{q.marksObtained} / {q.marks} pts</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                    {idx + 1}. {q.questionText}
                  </h3>
                </div>

                <button
                  onClick={() => handleToggleBookmark(q.id)}
                  className="p-2 rounded-xl text-neutral-400 hover:text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
                  title="Bookmark"
                >
                  <Star className={`w-5 h-5 ${q.isBookmarked ? 'fill-amber-400 text-amber-400' : ''}`} />
                </button>
              </div>

              {/* Options Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {(q.options?.length ? q.options : ['A', 'B', 'C', 'D'].map(key => q[`option${key}`]).filter(Boolean)).map((opText, index) => {
                  const opKey = String.fromCharCode(65 + index);
                  let selected = q.selectedOption;
                  if (typeof selected === 'string' && selected.startsWith('[')) {
                    try { selected = JSON.parse(selected); } catch { selected = []; }
                  }
                  const isUserPick = Array.isArray(selected) ? selected.includes(opKey) : selected === opKey;
                  const correctAnswers = q.correctAnswers?.length ? q.correctAnswers : [q.correctOption];
                  const isCorrect = correctAnswers.includes(opKey);

                  let style = 'bg-neutral-50 border-neutral-200 text-neutral-700';
                  if (isCorrect) style = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                  if (isUserPick && !isCorrect) style = 'bg-rose-50 border-rose-300 text-rose-900 font-semibold';

                  return (
                    <div key={opKey} className={`p-3 rounded-xl border flex items-center justify-between ${style}`}>
                      <span>{opKey}. {opText}</span>
                      <div className="flex items-center gap-1 text-[11px]">
                        {isUserPick && <span className="text-neutral-500">(Your Answer)</span>}
                        {isCorrect && <Check className="w-4 h-4 text-emerald-600" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Step-by-step Explanation */}
              {q.explanation && (
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 space-y-1">
                  <span className="font-bold flex items-center gap-1.5 text-amber-900">
                    <Lightbulb className="w-4 h-4 text-amber-600" /> Step-by-Step Explanation:
                  </span>
                  <p className="leading-relaxed whitespace-pre-wrap">{q.explanation}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ─── 2. LIVE QUIZ INTERFACE (MOCK & PRACTICE MODES) ─────────────────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* ─── QUIZ HEADER ──────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-neutral-200/90 shadow-xs">
        <div className="flex items-center gap-3">
          <Link to="/student" className="p-2 rounded-xl text-neutral-400 hover:bg-neutral-100 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                quizMeta.mode === 'practice'
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                  : 'bg-primary-50 text-primary-700 border border-primary-200'
              }`}>
                {quizMeta.mode === 'practice' ? '📖 PRACTICE MODE (Untimed)' : '⏱️ TIMED MOCK TEST'}
              </span>
              {quizMeta.author?.name && (
                <span className="text-[11px] text-neutral-400">By {quizMeta.author.name}</span>
              )}
            </div>
            <h2 className="text-base font-bold text-neutral-900 truncate">{quizMeta.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-center">
          {/* Mock Timer */}
          {quizMeta.mode === 'mock' && (
            <div className={`px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold shadow-xs ${timerAlertClass}`}>
              <Clock className="w-4 h-4" />
              <span>{timeLeftStr}</span>
            </div>
          )}

          <Button
            variant="primary"
            size="sm"
            onClick={() => setSubmitModalOpen(true)}
            className="font-bold shadow-xs"
          >
            <CheckSquare className="w-4 h-4 mr-1.5" />
            Finish & Submit
          </Button>
        </div>
      </div>

      {/* ─── MAIN QUIZ BODY ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT / CENTER: ACTIVE QUESTION CARD */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="p-6 sm:p-8 space-y-6 shadow-xs">
            {/* Question Top Bar */}
            <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-xl bg-primary-50 text-primary-700 font-extrabold text-sm flex items-center justify-center">
                  {currentIndex + 1}
                </span>
                <span className="text-xs font-semibold text-neutral-400">
                  Question {currentIndex + 1} of {questions.length}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700">
                  {currentQ.marks || 1} mark{(currentQ.marks || 1) > 1 ? 's' : ''}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 uppercase">
                  {currentQ.difficulty || 'medium'}
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleBookmark(currentQ.id)}
                  className={`p-2 rounded-xl border transition-all cursor-pointer ${
                    isCurrentBookmarked
                      ? 'border-amber-300 bg-amber-50 text-amber-500 fill-amber-400'
                      : 'border-neutral-200 text-neutral-400 hover:bg-neutral-50 hover:text-amber-500'
                  }`}
                  title="Star / Bookmark Question"
                >
                  <Star className={`w-4 h-4 ${isCurrentBookmarked ? 'fill-amber-400' : ''}`} />
                </button>

                {quizMeta.mode === 'mock' && (
                  <button
                    type="button"
                    onClick={() => handleToggleFlag(currentQ.id)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer ${
                      isCurrentFlagged
                        ? 'border-rose-300 bg-rose-50 text-rose-600 font-bold'
                        : 'border-neutral-200 text-neutral-400 hover:bg-neutral-50 hover:text-rose-600'
                    }`}
                    title="Flag for Review"
                  >
                    <Flag className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Question Prompt */}
            <div className="text-base sm:text-lg font-bold text-neutral-900 leading-relaxed">
              {currentQ.questionText}
            </div>
            {currentQ.imageUrl && <img src={`${BASE_URL.replace('/api', '')}${currentQ.imageUrl}`} alt="Question reference" className="max-h-80 max-w-full rounded-lg object-contain" />}

            {['numeric', 'short-answer'].includes(currentQ.questionType) ? (
              <label className="block text-xs font-bold text-neutral-700">{currentQ.questionType === 'numeric' ? 'Numeric answer' : 'Your answer'}
                <input
                  type={currentQ.questionType === 'numeric' ? 'number' : 'text'}
                  value={currentAnswer || ''}
                  maxLength={500}
                  onChange={event => handleSelectOption(event.target.value)}
                  className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-sm font-medium"
                />
              </label>
            ) : (
              <div className="space-y-3">
                {(currentQ.options?.length ? currentQ.options : ['A', 'B', 'C', 'D'].map(key => currentQ[`option${key}`]).filter(Boolean)).map((opText, index) => {
                  const opKey = String.fromCharCode(65 + index);
                  const isSelected = Array.isArray(currentAnswer) ? currentAnswer.includes(opKey) : currentAnswer === opKey;
                  const isPractice = quizMeta.mode === 'practice';
                  const fb = currentFeedback;
                  const correctAnswers = fb?.correctAnswers?.length ? fb.correctAnswers : [fb?.correctOption];
                  let btnStyle = 'border-neutral-200 hover:border-primary-300 hover:bg-neutral-50/60 bg-white text-neutral-800';

                  if (isSelected && !isPractice) {
                    btnStyle = 'border-primary-600 bg-primary-50/80 text-primary-950 ring-2 ring-primary-500/20 font-bold';
                  }

                  if (isPractice && fb) {
                    if (correctAnswers.includes(opKey)) {
                      btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-bold';
                    } else if (isSelected && !fb.isCorrect) {
                      btnStyle = 'border-rose-500 bg-rose-50 text-rose-950 font-semibold';
                    }
                  }

                  return (
                    <button
                      key={opKey}
                      type="button"
                      onClick={() => handleSelectOption(opKey)}
                      aria-pressed={isSelected}
                      className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-neutral-100 text-neutral-800 font-bold text-xs flex items-center justify-center shrink-0">{opKey}</span>
                        <span>{opText}</span>
                      </div>
                      {isPractice && fb && correctAnswers.includes(opKey) && <Check className="w-5 h-5 text-emerald-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Instant Practice Explanation Box */}
            {quizMeta.mode === 'practice' && currentFeedback && (
              <div className={`p-5 rounded-2xl space-y-2 animate-fade-in ${
                currentFeedback.isCorrect
                  ? 'bg-emerald-50/80 border border-emerald-200 text-emerald-950'
                  : 'bg-rose-50/80 border border-rose-200 text-rose-950'
              }`}>
                <div className="flex items-center gap-2 font-extrabold text-sm">
                  {currentFeedback.isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <span>Correct Answer! (+{currentFeedback.marksObtained} marks)</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5 text-rose-600" />
                      <span>Incorrect. Correct Answer: {(currentFeedback.correctAnswers || [currentFeedback.correctOption]).filter(Boolean).join(', ')}</span>
                    </>
                  )}
                </div>

                {currentFeedback.explanation && (
                  <div className="text-xs pt-2 border-t border-black/5 leading-relaxed whitespace-pre-wrap">
                    <span className="font-bold block mb-1">Step-by-Step Derivation & Explanation:</span>
                    {currentFeedback.explanation}
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                disabled={currentIndex === 0}
                className="font-semibold"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>

              {currentIndex === questions.length - 1 ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setSubmitModalOpen(true)}
                  className="font-bold"
                >
                  <CheckSquare className="w-4 h-4 mr-1" /> Finish Assessment
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
                  className="font-semibold"
                >
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* RIGHT: QUESTION PALETTE GRID */}
        <div className="space-y-4">
          <Card className="p-5 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Question Palette ({Object.keys(selectedAnswers).length} / {questions.length} answered)
            </h4>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = !!selectedAnswers[q.id];
                const isFlagged = flaggedQuestions[q.id];
                const isCurrent = idx === currentIndex;

                let btnStyle = 'bg-neutral-100 text-neutral-600 border border-neutral-200';
                if (isAnswered) btnStyle = 'bg-primary-600 text-white font-bold border border-primary-700';
                if (isFlagged) btnStyle = 'bg-amber-400 text-amber-950 font-bold border border-amber-500';
                if (isCurrent) btnStyle += ' ring-2 ring-primary-500 ring-offset-2';

                return (
                  <button
                    key={q.id || idx}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-xl text-xs font-extrabold flex items-center justify-center transition-all cursor-pointer ${btnStyle}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Palette Legend */}
            <div className="pt-3 border-t border-neutral-100 space-y-1.5 text-[11px] text-neutral-500 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-primary-600" />
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded bg-neutral-100 border border-neutral-300" />
                <span>Unattempted</span>
              </div>
              {quizMeta.mode === 'mock' && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-amber-400" />
                  <span>Flagged for Review</span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* ─── SUBMIT CONFIRMATION MODAL ─────────────────────────────────────── */}
      <Modal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="Submit Quiz Assessment"
      >
        <div className="space-y-4">
          <p className="text-xs text-neutral-500 leading-relaxed">
            Are you sure you want to finalize and submit your quiz attempt?
          </p>

          <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-neutral-500">Total Questions:</span>
              <span className="font-bold text-neutral-900">{questions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Answered:</span>
              <span className="font-bold text-emerald-600">{Object.keys(selectedAnswers).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-500">Unanswered / Skipped:</span>
              <span className="font-bold text-amber-600">{questions.length - Object.keys(selectedAnswers).length}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
            <Button variant="secondary" onClick={() => setSubmitModalOpen(false)}>
              Back to Quiz
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmitQuiz}
              isLoading={submitting}
              className="font-bold"
            >
              Submit Now
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

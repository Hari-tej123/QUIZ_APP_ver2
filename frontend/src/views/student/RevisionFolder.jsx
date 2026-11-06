import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  Bookmark,
  AlertOctagon,
  Sparkles,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  Layers,
  Star,
  Trash2,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Button, Card, Badge, Modal, Input } from '../../components/UI';
import api from '../../utils/api';

export default function RevisionFolder() {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState('mistakes'); // 'mistakes' | 'bookmarks'
  const [mistakes, setMistakes] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Custom Revision Quiz Builder Modal
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [revisionSource, setRevisionSource] = useState('mistakes');
  const [revisionLimit, setRevisionLimit] = useState(10);
  const [revisionMode, setRevisionMode] = useState('practice'); // 'practice' | 'mock'
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [mRes, bRes] = await Promise.all([
        api.get('/student/mistakes'),
        api.get('/student/bookmarks')
      ]);
      const mList = Array.isArray(mRes?.data) ? mRes.data : (Array.isArray(mRes?.data?.data) ? mRes.data.data : (Array.isArray(mRes) ? mRes : []));
      const bList = Array.isArray(bRes?.data) ? bRes.data : (Array.isArray(bRes?.data?.data) ? bRes.data.data : (Array.isArray(bRes) ? bRes : []));
      setMistakes(mList);
      setBookmarks(bList);
    } catch (err) {
      showError('Failed to load revision folder data.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBookmark = async (questionId) => {
    try {
      const res = await api.post(`/student/questions/${questionId}/bookmark`);
      showSuccess(res?.message || 'Bookmark updated.');
      fetchData();
    } catch (err) {
      showError('Failed to update bookmark.');
    }
  };

  const handleLaunchRevisionQuiz = async (e) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const res = await api.post('/student/revision/quiz', {
        source: revisionSource,
        limit: parseInt(revisionLimit, 10) || 10,
        mode: revisionMode
      });
      showSuccess('Revision Quiz generated! Redirecting...');
      const quizId = res?.data?.quiz?.id || res?.quiz?.id;
      setRevisionModalOpen(false);
      navigate(`/student/quizzes/${quizId}/attempt?mode=${revisionMode}`);
    } catch (err) {
      showError(err.message || 'Failed to generate revision quiz.');
    } finally {
      setGenerating(false);
    }
  };


  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 font-display">Targeted Mastery</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-display">
            Bookmarks & Revision Hub
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Turn your past mistakes and starred questions into high-yield adaptive revision sessions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setRevisionSource(activeTab);
              setRevisionModalOpen(true);
            }}
            disabled={(activeTab === 'mistakes' ? mistakes.length : bookmarks.length) === 0}
            className="font-bold shadow-md shadow-primary-900/20"
          >
            <Zap className="w-4.5 h-4.5 mr-2 text-amber-300" />
            Launch Custom Revision Quiz
          </Button>
        </div>
      </div>

      {/* ─── TABS SWITCHER ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 border-b border-neutral-200 pb-1">
        <button
          onClick={() => setActiveTab('mistakes')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'mistakes'
              ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <AlertOctagon className="w-4 h-4 text-rose-600" />
          My Mistakes ({mistakes.length})
        </button>

        <button
          onClick={() => setActiveTab('bookmarks')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'bookmarks'
              ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-xs'
              : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
          Bookmarked Questions ({bookmarks.length})
        </button>
      </div>

      {/* ─── CONTENT LIST ─────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : activeTab === 'mistakes' ? (
        /* MISTAKES TAB */
        mistakes.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" />
            <h3 className="text-lg font-bold text-neutral-800">No mistakes logged!</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Any questions you answer incorrectly during mock tests or practice sessions will automatically appear here for revision.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {mistakes.map((m, idx) => {
              const q = m.question || {};
              const quiz = q.quiz || {};
              const topicName = quiz.examTopic?.name || quiz.subtopic?.title || 'General Topic';

              return (
                <Card key={m.id || idx} className="p-6 space-y-4 hover:shadow-card-hover transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200">
                          ⚠️ Mistake Count: {m.mistakeCount || 1}x
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700">
                          📚 {topicName}
                        </span>
                        <span className="text-xs text-neutral-400">
                          Last attempted: {new Date(m.updatedAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                        {idx + 1}. {q.questionText}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleToggleBookmark(q.id)}
                      className="p-2 rounded-xl text-neutral-400 hover:text-amber-500 hover:bg-amber-50 transition-colors cursor-pointer"
                      title="Bookmark Question"
                    >
                      <Star className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-700 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                    <div className={q.correctOption === 'A' ? 'font-bold text-emerald-700' : m.lastSelectedOption === 'A' ? 'text-rose-600 font-semibold' : ''}>
                      A. {q.optionA} {q.correctOption === 'A' && '✓ (Correct)'} {m.lastSelectedOption === 'A' && '❌ (Your Answer)'}
                    </div>
                    <div className={q.correctOption === 'B' ? 'font-bold text-emerald-700' : m.lastSelectedOption === 'B' ? 'text-rose-600 font-semibold' : ''}>
                      B. {q.optionB} {q.correctOption === 'B' && '✓ (Correct)'} {m.lastSelectedOption === 'B' && '❌ (Your Answer)'}
                    </div>
                    <div className={q.correctOption === 'C' ? 'font-bold text-emerald-700' : m.lastSelectedOption === 'C' ? 'text-rose-600 font-semibold' : ''}>
                      C. {q.optionC} {q.correctOption === 'C' && '✓ (Correct)'} {m.lastSelectedOption === 'C' && '❌ (Your Answer)'}
                    </div>
                    <div className={q.correctOption === 'D' ? 'font-bold text-emerald-700' : m.lastSelectedOption === 'D' ? 'text-rose-600 font-semibold' : ''}>
                      D. {q.optionD} {q.correctOption === 'D' && '✓ (Correct)'} {m.lastSelectedOption === 'D' && '❌ (Your Answer)'}
                    </div>
                  </div>

                  {q.explanation && (
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                      <span className="font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Step-by-Step Explanation:
                      </span>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )
      ) : (
        /* BOOKMARKS TAB */
        bookmarks.length === 0 ? (
          <Card className="p-12 text-center space-y-3">
            <Star className="w-16 h-16 mx-auto text-neutral-300" />
            <h3 className="text-lg font-bold text-neutral-800">No bookmarked questions yet</h3>
            <p className="text-xs text-neutral-500 max-w-md mx-auto">
              Click the star icon next to any tricky question during a quiz to save it for quick revision anytime.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((b, idx) => {
              const q = b.question || {};
              const quiz = q.quiz || {};
              const topicName = quiz.examTopic?.name || quiz.subtopic?.title || 'General Topic';

              return (
                <Card key={b.id || idx} className="p-6 space-y-4 hover:shadow-card-hover transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Bookmarked
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-700">
                          📚 {topicName}
                        </span>
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-neutral-900">
                        {idx + 1}. {q.questionText}
                      </h3>
                    </div>

                    <button
                      onClick={() => handleToggleBookmark(q.id)}
                      className="p-2 rounded-xl text-amber-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-neutral-700 bg-neutral-50 p-4 rounded-2xl border border-neutral-200">
                    <div className={q.correctOption === 'A' ? 'font-bold text-emerald-700' : ''}>A. {q.optionA} {q.correctOption === 'A' && '✓'}</div>
                    <div className={q.correctOption === 'B' ? 'font-bold text-emerald-700' : ''}>B. {q.optionB} {q.correctOption === 'B' && '✓'}</div>
                    <div className={q.correctOption === 'C' ? 'font-bold text-emerald-700' : ''}>C. {q.optionC} {q.correctOption === 'C' && '✓'}</div>
                    <div className={q.correctOption === 'D' ? 'font-bold text-emerald-700' : ''}>D. {q.optionD} {q.correctOption === 'D' && '✓'}</div>
                  </div>

                  {q.explanation && (
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs text-amber-950 space-y-1">
                      <span className="font-bold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Step-by-Step Explanation:
                      </span>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )
      )}

      {/* ─── CUSTOM REVISION QUIZ MODAL ────────────────────────────────────── */}
      <Modal
        isOpen={revisionModalOpen}
        onClose={() => setRevisionModalOpen(false)}
        title="⚡ Generate Custom Revision Quiz"
      >
        <form onSubmit={handleLaunchRevisionQuiz} className="space-y-4">
          <p className="text-xs text-neutral-500">
            Generate an adaptive quiz assembled dynamically from your past attempts.
          </p>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">Question Pool Source</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRevisionSource('mistakes')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                  revisionSource === 'mistakes'
                    ? 'border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-500/20'
                    : 'border-neutral-200 bg-white text-neutral-600'
                }`}
              >
                <AlertOctagon className="w-4 h-4 text-rose-600" />
                My Mistakes ({mistakes.length})
              </button>

              <button
                type="button"
                onClick={() => setRevisionSource('bookmarks')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                  revisionSource === 'bookmarks'
                    ? 'border-amber-500 bg-amber-50 text-amber-900 ring-2 ring-amber-500/20'
                    : 'border-neutral-200 bg-white text-neutral-600'
                }`}
              >
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                Bookmarked ({bookmarks.length})
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">Quiz Mode</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRevisionMode('practice')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  revisionMode === 'practice'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/20'
                    : 'border-neutral-200 bg-white text-neutral-600'
                }`}
              >
                <span>📖 Practice Mode</span>
                <span className="text-[10px] text-neutral-400 font-normal">Instant answer & explanation</span>
              </button>

              <button
                type="button"
                onClick={() => setRevisionMode('mock')}
                className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 cursor-pointer transition-all ${
                  revisionMode === 'mock'
                    ? 'border-primary-500 bg-primary-50 text-primary-900 ring-2 ring-primary-500/20'
                    : 'border-neutral-200 bg-white text-neutral-600'
                }`}
              >
                <span>⏱️ Timed Mock</span>
                <span className="text-[10px] text-neutral-400 font-normal">Countdown timer</span>
              </button>
            </div>
          </div>

          <Input
            label="Number of Questions"
            type="number"
            min="1"
            max={Math.max(1, revisionSource === 'mistakes' ? mistakes.length : bookmarks.length)}
            value={revisionLimit}
            onChange={(e) => setRevisionLimit(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
            <Button variant="secondary" onClick={() => setRevisionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={generating} className="font-bold">
              Start Revision Now
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import {
  FileQuestion,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Users,
  Eye,
  Layers,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Button, Card, Badge, Modal } from '../../components/UI';
import api from '../../utils/api';

export default function ManageQuizzes() {
  const { showError } = useToast();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contributor/quizzes');
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
      setQuizzes(list);

    } catch (err) {
      showError('Failed to fetch authored quizzes.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PUBLISHED':
      case 'approved':
        return <Badge variant="success">Approved & Live</Badge>;
      case 'PENDING_REVIEW':
      case 'pending':
        return <Badge variant="warning">Pending Review</Badge>;
      case 'REJECTED':
      case 'rejected':
        return <Badge variant="danger">Rejected</Badge>;
      case 'DRAFT':
        return <Badge variant="neutral">Draft</Badge>;
      case 'ARCHIVED':
        return <Badge variant="neutral">Archived</Badge>;
      case 'changes_requested':
        return <Badge variant="warning">Changes Requested</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600">My Question Banks</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-display">
            Authored Quizzes
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Track published quizzes, student attempt volume, and pending submissions.
          </p>
        </div>

        <Link to="/contributor/quizzes/create">
          <Button variant="primary" size="md" className="font-bold">
            <PlusCircle className="w-4.5 h-4.5 mr-2" />
            Create New Quiz
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : quizzes.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <FileQuestion className="w-16 h-16 mx-auto text-neutral-300" />
          <h3 className="text-lg font-bold text-neutral-800">No quizzes authored yet</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Start contributing question sets to earn bounties and revenue share when students practice.
          </p>
          <Link to="/contributor/quizzes/create">
            <Button variant="primary" size="md">
              Create First Quiz
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quizzes.map((quiz) => {
            const topicName = quiz.examTopic?.name || quiz.subtopic?.title || 'General Topic';
            const subjectName = quiz.examTopic?.subject?.name || quiz.subtopic?.course?.title || '';

            return (
              <Card key={quiz.id} className="p-6 space-y-4 flex flex-col justify-between hover:shadow-card-hover transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    {getStatusBadge(quiz.status)}
                    <span className="text-xs font-bold text-neutral-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {quiz.duration} mins
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-neutral-900">{quiz.title}</h3>
                    <p className="text-xs text-neutral-500 line-clamp-2 mt-1">
                      {quiz.description || 'No description provided.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-100 text-xs text-neutral-600">
                    <span className="px-2.5 py-1 rounded-lg bg-neutral-100 font-semibold">
                      📚 {subjectName ? `${subjectName} • ` : ''}{topicName}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 font-semibold">
                      ❓ {quiz.questions?.length || 0} Questions
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-neutral-700">
                    <Users className="w-4 h-4 text-primary-600" />
                    <span>{quiz.totalAttempts || 0} Attempts</span>
                  </div>

                  <Button
                    variant="secondary"
                    size="xs"
                    onClick={() => {
                      setSelectedQuiz(quiz);
                      setPreviewOpen(true);
                    }}
                    className="font-bold"
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    Preview Questions
                  </Button>
                  {['DRAFT', 'REJECTED'].includes(quiz.status) && <Link to={`/contributor/quizzes/create?edit=${quiz.id}`}><Button variant="secondary" size="xs" className="ml-2">Edit & Resubmit</Button></Link>}
                  {quiz.status === 'PUBLISHED' && <Button variant="secondary" size="xs" className="ml-2" onClick={async () => { try { await api.post(`/contributor/quizzes/${quiz.id}/archive`); await fetchQuizzes(); } catch { showError('Could not archive this quiz.'); } }}>Archive</Button>}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* PREVIEW MODAL */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={selectedQuiz?.title || 'Quiz Preview'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-1">
            <p><span className="font-bold">Status:</span> {selectedQuiz?.status?.toUpperCase()}</p>
            <p><span className="font-bold">Duration:</span> {selectedQuiz?.duration} minutes</p>
            {selectedQuiz?.reviewNotes && (
              <p className="text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2">
                <span className="font-bold">Admin Feedback:</span> {selectedQuiz.reviewNotes}
              </p>
            )}
          </div>

          <h4 className="text-sm font-bold text-neutral-900">
            Questions ({selectedQuiz?.questions?.length || 0})
          </h4>

          {selectedQuiz?.questions?.map((q, idx) => (
            <div key={q.id || idx} className="p-4 rounded-xl bg-white border border-neutral-200 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-xs font-bold text-neutral-800">
                  {idx + 1}. {q.questionText}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-100">
                  {q.difficulty?.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-xs text-neutral-600">
                <div className={q.correctOption === 'A' ? 'font-bold text-emerald-700' : ''}>A. {q.optionA}</div>
                <div className={q.correctOption === 'B' ? 'font-bold text-emerald-700' : ''}>B. {q.optionB}</div>
                <div className={q.correctOption === 'C' ? 'font-bold text-emerald-700' : ''}>C. {q.optionC}</div>
                <div className={q.correctOption === 'D' ? 'font-bold text-emerald-700' : ''}>D. {q.optionD}</div>
              </div>

              {q.explanation && (
                <p className="text-[11px] text-amber-900 bg-amber-50/60 p-2 rounded-lg">
                  <span className="font-bold">Explanation:</span> {q.explanation}
                </p>
              )}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}

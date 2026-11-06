import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileQuestion,
  FileText,
  Video,
  DollarSign,
  AlertCircle,
  Eye,
  MessageSquare,
  Sparkles,
  Download,
  Filter,
  User
} from 'lucide-react';
import { Button, Card, Input, Badge, Modal } from '../../components/UI';
import api from '../../utils/api';

export default function ReviewQueue() {
  const { showSuccess, showError } = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending'); // 'pending' | 'approved' | 'rejected' | 'all'
  const [typeFilter, setTypeFilter] = useState('all');

  // Review Action Modal
  const [selectedSub, setSelectedSub] = useState(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [decisionType, setDecisionType] = useState('approved'); // 'approved' | 'rejected' | 'changes_requested'
  const [adminFeedback, setAdminFeedback] = useState('');
  const [bountyAmount, setBountyAmount] = useState('15.00');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Full Content Preview Modal
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewSub, setPreviewSub] = useState(null);

  useEffect(() => {
    fetchReviewQueue();
  }, [statusFilter, typeFilter]);

  const fetchReviewQueue = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/review-queue?status=${statusFilter}&type=${typeFilter}`);
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
      setSubmissions(list);

    } catch (err) {
      showError('Failed to fetch content review queue.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDecision = (sub, decision) => {
    setSelectedSub(sub);
    setDecisionType(decision);
    setAdminFeedback(decision === 'approved' ? 'High quality content. Approved for all students.' : '');
    setBountyAmount('15.00');
    setDecisionModalOpen(true);
  };

  const handleSubmitDecision = async (e) => {
    e.preventDefault();
    if (!selectedSub) return;

    setSubmittingDecision(true);
    try {
      await api.post(`/admin/review-queue/${selectedSub.id}/decision`, {
        decision: decisionType,
        feedback: adminFeedback,
        bountyAmount: decisionType === 'approved' ? parseFloat(bountyAmount) || 15 : 0
      });

      showSuccess(`Submission marked as ${decisionType}!`);
      setDecisionModalOpen(false);
      fetchReviewQueue();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit review decision.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 font-display">Quality Control</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-display">
            Content Review Queue
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Review quizzes, question banks, and topic materials submitted by educators before publishing.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
            {['pending', 'approved', 'rejected', 'all'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
                  statusFilter === st
                    ? 'bg-white text-neutral-900 shadow-xs'
                    : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs font-semibold px-3 py-2 rounded-xl border border-neutral-300 bg-white"
          >
            <option value="all">All Content Types</option>
            <option value="quiz">Quizzes Only</option>
            <option value="study_material">Materials Only</option>
          </select>
        </div>
      </div>

      {/* ─── QUEUE LIST ──────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : submissions.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <CheckCircle2 className="w-16 h-16 mx-auto text-emerald-500" />
          <h3 className="text-lg font-bold text-neutral-800">Review Queue is Clear!</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            No pending submissions matching the selected filters.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const isQuiz = sub.contentType === 'quiz';
            const author = sub.contributor || {};
            const isPending = sub.status === 'pending';

            return (
              <Card key={sub.id} className="p-6 space-y-4 hover:shadow-card-hover transition-all">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      isQuiz ? 'bg-primary-100 text-primary-700' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {isQuiz ? <FileQuestion className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant={isQuiz ? 'primary' : 'neutral'}>
                          {isQuiz ? 'Quiz Set' : 'Study Material'}
                        </Badge>
                        <Badge variant={sub.status === 'approved' ? 'success' : sub.status === 'pending' ? 'warning' : 'danger'}>
                          {sub.status.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-neutral-400">
                          Submitted on {new Date(sub.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-neutral-900">{sub.title}</h3>

                      {/* Author Info */}
                      <div className="flex items-center gap-2 text-xs text-neutral-600">
                        <span className="font-semibold text-neutral-900 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-neutral-400" />
                          {author.name || 'Educator'}
                        </span>
                        {author.badge && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ {author.badge}
                          </span>
                        )}
                        <span>•</span>
                        <span className="text-neutral-400">{author.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2.5 self-end lg:self-center">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setPreviewSub(sub);
                        setPreviewOpen(true);
                      }}
                      className="font-bold"
                    >
                      <Eye className="w-4 h-4 mr-1.5" />
                      Preview Content
                    </Button>

                    {isPending && (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleOpenDecision(sub, 'rejected')}
                          className="font-bold"
                        >
                          <XCircle className="w-4 h-4 mr-1.5" />
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenDecision(sub, 'approved')}
                          className="bg-emerald-600 hover:bg-emerald-500 border-none font-bold shadow-xs"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1.5" />
                          Approve & Publish
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {sub.adminFeedback && (
                  <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-700">
                    <span className="font-bold">Admin Feedback:</span> {sub.adminFeedback}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── REVIEW DECISION MODAL ────────────────────────────────────────── */}
      <Modal
        isOpen={decisionModalOpen}
        onClose={() => setDecisionModalOpen(false)}
        title={decisionType === 'approved' ? 'Approve & Publish Content' : 'Reject / Request Changes'}
      >
        <form onSubmit={handleSubmitDecision} className="space-y-4">
          <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-1">
            <p><span className="font-bold">Content:</span> {selectedSub?.title}</p>
            <p><span className="font-bold">Author:</span> {selectedSub?.contributor?.name}</p>
          </div>

          {decisionType === 'approved' && (
            <Input
              label="Flat Bounty Payout ($)"
              type="number"
              step="0.50"
              value={bountyAmount}
              onChange={(e) => setBountyAmount(e.target.value)}
              helperText="This amount will be directly credited to the educator's earnings balance."
              required
            />
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              Reviewer Notes & Feedback to Contributor
            </label>
            <textarea
              rows="3"
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-primary-500 outline-none"
              placeholder="Enter constructive feedback or approval remarks..."
              value={adminFeedback}
              onChange={(e) => setAdminFeedback(e.target.value)}
              required={decisionType !== 'approved'}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
            <Button variant="secondary" onClick={() => setDecisionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={decisionType === 'approved' ? 'primary' : 'danger'}
              type="submit"
              isLoading={submittingDecision}
              className="font-bold"
            >
              Confirm {decisionType === 'approved' ? 'Approval' : 'Rejection'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* ─── FULL PREVIEW MODAL ───────────────────────────────────────────── */}
      <Modal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={`Preview: ${previewSub?.title || 'Submission'}`}
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-2">
          {previewSub?.contentType === 'quiz' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 text-xs grid grid-cols-2 gap-2">
                <div><span className="font-bold">Duration:</span> {previewSub?.quiz?.duration} mins</div>
                <div><span className="font-bold">Total Questions:</span> {previewSub?.quiz?.questions?.length || 0}</div>
              </div>

              <div className="space-y-3">
                {previewSub?.quiz?.questions?.map((q, idx) => (
                  <div key={q.id || idx} className="p-4 rounded-xl bg-white border border-neutral-200 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-bold text-neutral-900">
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
                      <div className="p-2 rounded-lg bg-amber-50 text-[11px] text-amber-900">
                        <span className="font-bold">Explanation:</span> {q.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {previewSub?.contentType === 'study_material' && (
            <div className="space-y-4">
              {previewSub?.material?.type === 'video' && previewSub?.material?.videoUrl && (
                <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black">
                  <iframe
                    src={getYoutubeEmbed(previewSub.material.videoUrl)}
                    title={previewSub.title}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}

              {previewSub?.material?.type === 'pdf' && previewSub?.material?.fileUrl && (
                <div className="p-6 rounded-2xl bg-neutral-100 text-center space-y-3">
                  <FileText className="w-12 h-12 text-primary-600 mx-auto" />
                  <a
                    href={`${api.defaults.baseURL.replace('/api', '')}${previewSub.material.fileUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 text-white font-bold text-xs"
                  >
                    <Download className="w-4 h-4" /> Download / Open PDF
                  </a>
                </div>
              )}

              {previewSub?.material?.content && (
                <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-xs text-neutral-800 whitespace-pre-wrap">
                  {previewSub.material.content}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}

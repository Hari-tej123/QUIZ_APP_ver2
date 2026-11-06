import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileQuestion,
  FileText,
  MessageSquare,
  Sparkles,
  DollarSign,
  ChevronRight
} from 'lucide-react';
import { Button, Card, Badge } from '../../components/UI';
import api from '../../utils/api';

export default function Submissions() {
  const { showError } = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contributor/submissions');
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
      setSubmissions(list);

    } catch (err) {
      showError('Failed to fetch submission review status.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = submissions.filter(s => filter === 'all' || s.status === filter);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600">Review Pipeline</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-display">
            Submissions & Review Feedback
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Real-time status updates from Admin reviewers and bounty confirmations.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-neutral-100 p-1 rounded-xl border border-neutral-200 self-start">
          {['all', 'pending', 'approved', 'rejected'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer capitalize ${
                filter === st
                  ? 'bg-white text-neutral-900 shadow-xs'
                  : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center space-y-4">
          <Clock className="w-16 h-16 mx-auto text-neutral-300" />
          <h3 className="text-lg font-bold text-neutral-800">No submissions found</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            Your submitted quizzes and study handouts will show up here along with reviewer feedback.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((sub) => {
            const isApproved = sub.status === 'approved';
            const isPending = sub.status === 'pending';
            const isRejected = sub.status === 'rejected';

            return (
              <Card key={sub.id} className="p-6 space-y-4 hover:shadow-card-hover transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      sub.contentType === 'quiz' ? 'bg-primary-50 text-primary-600' : 'bg-indigo-50 text-indigo-600'
                    }`}>
                      {sub.contentType === 'quiz' ? <FileQuestion className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          {sub.contentType === 'quiz' ? 'Question Bank Set' : 'Topic Handout'}
                        </span>
                        <span>•</span>
                        <span className="text-xs text-neutral-400">
                          {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-neutral-900">{sub.title}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {isApproved && (
                      <Badge variant="success">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approved & Published
                      </Badge>
                    )}
                    {isPending && (
                      <Badge variant="warning">
                        <Clock className="w-3.5 h-3.5 mr-1" /> Pending Admin Review
                      </Badge>
                    )}
                    {isRejected && (
                      <Badge variant="danger">
                        <XCircle className="w-3.5 h-3.5 mr-1" /> Needs Revision / Rejected
                      </Badge>
                    )}

                    {sub.payoutAmount > 0 && (
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200">
                        +${sub.payoutAmount.toFixed(2)} Bounty
                      </span>
                    )}
                  </div>
                </div>

                {/* Admin Feedback Box */}
                {sub.adminFeedback && (
                  <div className={`p-4 rounded-xl text-xs space-y-1 ${
                    isApproved ? 'bg-emerald-50/70 border border-emerald-200/80 text-emerald-900' :
                    isRejected ? 'bg-rose-50/70 border border-rose-200/80 text-rose-900' : 'bg-amber-50/70 border border-amber-200/80 text-amber-900'
                  }`}>
                    <div className="flex items-center gap-1.5 font-bold">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Reviewer Feedback {sub.reviewer?.name ? `(${sub.reviewer.name})` : ''}:
                    </div>
                    <p className="leading-relaxed">{sub.adminFeedback}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

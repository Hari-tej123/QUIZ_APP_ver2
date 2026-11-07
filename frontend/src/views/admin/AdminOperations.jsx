import React, { useCallback, useEffect, useState } from 'react';
import { Copy, ExternalLink, RefreshCw } from 'lucide-react';
import { Button, Card } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import apiClient, { BASE_URL } from '../../utils/apiClient';

const tabs = ['Applications', 'Quiz review', 'Invite educator', 'Audit log'];

export default function AdminOperations() {
  const { showSuccess, showError } = useToast();
  const [tab, setTab] = useState(tabs[0]);
  const [applicationStatus, setApplicationStatus] = useState('PENDING');
  const [applications, setApplications] = useState([]);
  const [quizQueue, setQuizQueue] = useState([]);
  const [quizEdits, setQuizEdits] = useState({});
  const [auditLogs, setAuditLogs] = useState([]);
  const [educatorTypes, setEducatorTypes] = useState({});
  const [invite, setInvite] = useState({ email: '', educatorType: 'COMPETITIVE' });
  const [inviteUrl, setInviteUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const loadTab = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'Applications') {
        const result = await apiClient.get(`/admin/educator-applications?status=${applicationStatus}`);
        setApplications(result.data || []);
      } else if (tab === 'Quiz review') {
        const result = await apiClient.get('/admin/quiz-review');
        setQuizQueue(result.data || []);
      } else if (tab === 'Audit log') {
        const result = await apiClient.get('/admin/audit-logs');
        setAuditLogs(result.data || []);
      }
    } catch (error) {
      showError(error.message || `Could not load ${tab.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  }, [tab, applicationStatus, showError]);

  useEffect(() => { loadTab(); }, [loadTab]);

  const reviewApplication = async (application, decision) => {
    let reason = '';
    if (decision === 'REJECTED') {
      reason = window.prompt('Enter a rejection reason:') || '';
      if (!reason.trim()) return showError('A rejection reason is required.');
    }
    try {
      await apiClient.put(`/admin/educator-applications/${application.id}/review`, {
        decision,
        reason,
        educatorType: educatorTypes[application.id] || application.requestedEducatorType || 'COMPETITIVE'
      });
      showSuccess(`Application ${decision.toLowerCase()}.`);
      await loadTab();
    } catch (error) {
      showError(error.message || 'Could not review application.');
    }
  };

  const reviewQuiz = async (quiz, decision) => {
    let reason = '';
    if (decision === 'REJECTED') {
      reason = window.prompt('Enter changes required / rejection reason:') || '';
      if (!reason.trim()) return showError('A rejection reason is required.');
    }
    try {
      await apiClient.put(`/admin/quiz-review/${quiz.id}`, {
        decision,
        reason,
        ...(quizEdits[quiz.id] ? { edits: quizEdits[quiz.id] } : {})
      });
      showSuccess(decision === 'PUBLISHED' ? 'Quiz published.' : 'Quiz returned with a rejection reason.');
      await loadTab();
    } catch (error) {
      showError(error.message || 'Could not review quiz.');
    }
  };

  const beginQuizEdit = (quiz) => {
    setQuizEdits(current => current[quiz.id] ? current : ({
      ...current,
      [quiz.id]: {
        title: quiz.title,
        description: quiz.description || '',
        durationMin: quiz.durationMin || quiz.duration,
        questions: (quiz.questions || []).map(question => ({
          questionText: question.questionText,
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          correctOption: question.correctOption,
          explanation: question.explanation || '',
          difficulty: question.difficulty || 'medium',
          tags: question.tags || '',
          marks: question.marks || 1
        }))
      }
    }));
  };

  const updateQuestionEdit = (quizId, index, field, value) => {
    setQuizEdits(current => ({
      ...current,
      [quizId]: {
        ...current[quizId],
        questions: current[quizId].questions.map((question, questionIndex) => questionIndex === index
          ? { ...question, [field]: value }
          : question)
      }
    }));
  };

  const createInvite = async (event) => {
    event.preventDefault();
    try {
      const result = await apiClient.post('/admin/educator-invites', invite);
      setInviteUrl(result.data.inviteUrl);
      showSuccess('Educator invite created.');
    } catch (error) {
      showError(error.message || 'Could not create invite.');
    }
  };

  const copyInvite = async () => {
    await navigator.clipboard.writeText(inviteUrl);
    showSuccess('Invite link copied.');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-4">
        <div><p className="text-xs font-bold uppercase text-primary-700">Admin operations</p><h1 className="text-2xl font-extrabold text-neutral-900">Review and governance</h1></div>
        <Button variant="secondary" size="sm" onClick={loadTab}><RefreshCw className="mr-1.5 h-4 w-4" /> Refresh</Button>
      </header>
      <nav className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3" aria-label="Admin operation views">
        {tabs.map(item => <button key={item} onClick={() => setTab(item)} className={`px-3 py-2 text-sm font-bold ${tab === item ? 'border-b-2 border-primary-600 text-primary-700' : 'text-neutral-500 hover:text-neutral-900'}`}>{item}</button>)}
      </nav>

      {tab === 'Applications' && <section className="space-y-4">
        <div className="flex items-center justify-between"><div><h2 className="text-lg font-bold">Educator applications</h2><p className="text-xs text-neutral-500">Review qualifications, teaching areas, and private proof files.</p></div><select aria-label="Application status" value={applicationStatus} onChange={event => setApplicationStatus(event.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"><option>PENDING</option><option>APPROVED</option><option>REJECTED</option></select></div>
        {applications.map(application => <Card key={application.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div><h3 className="font-bold">{application.fullName}</h3><p className="text-xs text-neutral-500">{application.applicant?.email} · {application.qualification} · {application.experienceYears} years</p><p className="mt-1 text-xs text-neutral-600">{application.institution || 'Institution not provided'} · {application.requestedEducatorType}</p></div>
            <div className="flex items-center gap-2"><span className="text-xs font-bold">{application.status}</span>{application.status === 'PENDING' && <select aria-label={`Educator type for ${application.fullName}`} value={educatorTypes[application.id] || application.requestedEducatorType} onChange={event => setEducatorTypes(current => ({ ...current, [application.id]: event.target.value }))} className="rounded border border-neutral-300 px-2 py-1 text-xs"><option>COMPETITIVE</option><option>COLLEGE</option><option>BOTH</option></select>}</div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-neutral-700">{application.motivation}</p>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-3 text-xs">{application.proofUrl && <a className="font-bold text-primary-700 underline" href={application.proofUrl} target="_blank" rel="noreferrer">Proof link</a>}{application.proofFilePath && <a className="inline-flex items-center gap-1 font-bold text-primary-700 underline" href={`${BASE_URL}/admin/educator-applications/${application.id}/proof`} target="_blank" rel="noreferrer">Private proof <ExternalLink className="h-3 w-3" /></a>}</div>
            {application.status === 'PENDING' && <div className="flex gap-2"><Button size="xs" variant="primary" onClick={() => reviewApplication(application, 'APPROVED')}>Approve</Button><Button size="xs" variant="secondary" onClick={() => reviewApplication(application, 'REJECTED')}>Reject</Button></div>}
            {application.rejectionReason && <p className="w-full text-xs text-rose-700">Reason: {application.rejectionReason}</p>}
          </div>
        </Card>)}
        {!loading && !applications.length && <Card className="p-8 text-center text-sm text-neutral-500">No applications in this status.</Card>}
      </section>}

      {tab === 'Quiz review' && <section className="space-y-4">
        <div><h2 className="text-lg font-bold">Pending quiz review</h2><p className="text-xs text-neutral-500">Review all question keys and explanations before publishing.</p></div>
        {quizQueue.map(quiz => <Card key={quiz.id} className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><h3 className="font-bold">{quiz.title}</h3><p className="text-xs text-neutral-500">{quiz.owner?.name} · {quiz.owner?.email} · {quiz.durationMin || quiz.duration} min</p><p className="text-xs text-neutral-500">{quiz.examTopic?.subject?.edition?.exam?.name} / {quiz.examTopic?.name}</p></div><span className="text-xs font-bold">{quiz.status}</span></div>
          <details className="mt-4"><summary className="cursor-pointer text-sm font-bold text-primary-700">Preview {quiz.questions?.length || 0} questions and answers</summary><div className="mt-3 space-y-3">
            <Button size="xs" variant="secondary" onClick={() => beginQuizEdit(quiz)}>{quizEdits[quiz.id] ? 'Editing quiz' : 'Edit before decision'}</Button>
            {quizEdits[quiz.id] && <div className="grid gap-3 rounded-lg bg-neutral-50 p-3 sm:grid-cols-2"><label className="text-xs font-bold">Title<input value={quizEdits[quiz.id].title} onChange={event => setQuizEdits(current => ({ ...current, [quiz.id]: { ...current[quiz.id], title: event.target.value } }))} className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm" /></label><label className="text-xs font-bold">Duration (minutes)<input type="number" min="1" max="600" value={quizEdits[quiz.id].durationMin} onChange={event => setQuizEdits(current => ({ ...current, [quiz.id]: { ...current[quiz.id], durationMin: event.target.value } }))} className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm" /></label><label className="sm:col-span-2 text-xs font-bold">Description<textarea value={quizEdits[quiz.id].description} onChange={event => setQuizEdits(current => ({ ...current, [quiz.id]: { ...current[quiz.id], description: event.target.value } }))} className="mt-1 w-full rounded border border-neutral-300 px-2 py-1.5 text-sm" /></label></div>}
            {quiz.questions?.map((question, index) => {
              const edit = quizEdits[quiz.id]?.questions[index];
              return <div key={question.id} className="space-y-2 border-l-2 border-neutral-200 pl-3 text-sm">
                {edit ? <>
                  <textarea aria-label={`Question ${index + 1}`} value={edit.questionText} onChange={event => updateQuestionEdit(quiz.id, index, 'questionText', event.target.value)} className="w-full rounded border border-neutral-300 p-2 text-sm font-bold" />
                  <div className="grid gap-2 sm:grid-cols-2">{['optionA', 'optionB', 'optionC', 'optionD'].map((field, optionIndex) => <input key={field} aria-label={`Question ${index + 1} option ${String.fromCharCode(65 + optionIndex)}`} value={edit[field]} onChange={event => updateQuestionEdit(quiz.id, index, field, event.target.value)} className="rounded border border-neutral-300 px-2 py-1.5 text-xs" />)}</div>
                  <div className="grid gap-2 sm:grid-cols-2"><label className="text-xs font-bold">Correct answer<select value={edit.correctOption} onChange={event => updateQuestionEdit(quiz.id, index, 'correctOption', event.target.value)} className="ml-2 rounded border border-neutral-300 px-2 py-1"><option>A</option><option>B</option><option>C</option><option>D</option></select></label><label className="text-xs font-bold">Difficulty<select value={edit.difficulty} onChange={event => updateQuestionEdit(quiz.id, index, 'difficulty', event.target.value)} className="ml-2 rounded border border-neutral-300 px-2 py-1"><option>easy</option><option>medium</option><option>hard</option></select></label></div>
                  <textarea aria-label={`Question ${index + 1} explanation`} value={edit.explanation} onChange={event => updateQuestionEdit(quiz.id, index, 'explanation', event.target.value)} placeholder="Explanation" className="w-full rounded border border-neutral-300 p-2 text-xs" />
                </> : <><p className="font-bold">{index + 1}. {question.questionText}</p><p className="text-neutral-600">A. {question.optionA} · B. {question.optionB} · C. {question.optionC} · D. {question.optionD}</p><p className="text-emerald-800">Correct: {question.correctOption}</p>{question.explanation && <p className="text-xs text-neutral-600">{question.explanation}</p>}</>}
              </div>;
            })}</div></details>
          <div className="mt-4 flex justify-end gap-2"><Button size="xs" variant="primary" onClick={() => reviewQuiz(quiz, 'PUBLISHED')}>Publish</Button><Button size="xs" variant="secondary" onClick={() => reviewQuiz(quiz, 'REJECTED')}>Reject</Button></div>
        </Card>)}
        {!loading && !quizQueue.length && <Card className="p-8 text-center text-sm text-neutral-500">No quizzes are waiting for review.</Card>}
      </section>}

      {tab === 'Invite educator' && <section className="max-w-2xl space-y-4">
        <div><h2 className="text-lg font-bold">Invite an educator</h2><p className="text-xs text-neutral-500">The single-use link expires after seven days and grants access only to the invited email.</p></div>
        <Card className="p-5"><form onSubmit={createInvite} className="grid gap-4 sm:grid-cols-2"><label className="text-xs font-bold">Email<input required type="email" value={invite.email} onChange={event => setInvite(current => ({ ...current, email: event.target.value }))} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" /></label><label className="text-xs font-bold">Educator type<select value={invite.educatorType} onChange={event => setInvite(current => ({ ...current, educatorType: event.target.value }))} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"><option>COMPETITIVE</option><option>COLLEGE</option><option>BOTH</option></select></label><div className="sm:col-span-2"><Button type="submit" variant="primary">Create invite link</Button></div></form>
          {inviteUrl && <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4"><input readOnly value={inviteUrl} className="min-w-0 flex-1 rounded border border-neutral-300 p-2 text-xs" /><Button size="xs" variant="secondary" onClick={copyInvite}><Copy className="mr-1 h-3.5 w-3.5" /> Copy</Button></div>}
        </Card>
      </section>}

      {tab === 'Audit log' && <section className="space-y-4"><div><h2 className="text-lg font-bold">Audit log</h2><p className="text-xs text-neutral-500">Recent approvals, role changes, publishing decisions, and other administrative actions.</p></div><Card className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-neutral-50 text-xs uppercase text-neutral-500"><tr><th className="p-3">When</th><th className="p-3">Actor</th><th className="p-3">Action</th><th className="p-3">Target</th><th className="p-3">Details</th></tr></thead><tbody className="divide-y divide-neutral-100">{auditLogs.map(log => <tr key={log.id}><td className="p-3">{new Date(log.createdAt).toLocaleString()}</td><td className="p-3">{log.actor?.name || 'System'}</td><td className="p-3">{log.action}</td><td className="p-3">{log.targetType} · {log.targetId}</td><td className="max-w-sm p-3 text-xs">{JSON.stringify(log.metadata)}</td></tr>)}{!auditLogs.length && <tr><td colSpan="5" className="p-8 text-center text-neutral-500">No audit events.</td></tr>}</tbody></table></Card></section>}
    </div>
  );
}
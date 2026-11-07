import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Download, FileUp, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { Button, Card, Input } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import apiClient, { BASE_URL } from '../../utils/apiClient';

const emptyForm = {
  questionText: '', questionType: 'mcq', options: [], correctAnswers: [], explanation: '',
  subject: '', topic: '', difficulty: 'medium', marks: 1, tags: [], track: 'competitive',
  status: 'draft', quizId: ''
};

export default function QuestionManager() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [image, setImage] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [filters, setFilters] = useState({ search: '', track: '', status: '', difficulty: '' });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const view = searchParams.get('view') || 'create';
  const canCreateExam = ['ADMIN', 'EDUCATOR', 'admin', 'faculty'].includes(user?.role) &&
    (user?.educatorType === 'COLLEGE' || user?.educatorType === 'BOTH' || ['ADMIN', 'admin', 'faculty'].includes(user?.role));

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({ page: String(page), limit: '20' });
      Object.entries(filters).forEach(([key, value]) => { if (value) query.set(key, value); });
      const response = await apiClient.get(`/questions/mine?${query}`);
      setQuestions(response.data || []);
      setPages(response.pages || 1);
    } catch (error) {
      showError(error.message || 'Could not load questions.');
    } finally {
      setLoading(false);
    }
  }, [page, filters, showError]);

  useEffect(() => { loadQuestions(); }, [loadQuestions]);

  const updateForm = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const switchView = (nextView) => setSearchParams({ view: nextView });

  const startEdit = (question) => {
    setEditingId(question.id);
    setForm({
      ...emptyForm,
      ...question,
      options: question.options || [],
      correctAnswers: question.correctAnswers || (question.correctOption ? [question.correctOption] : []),
      tags: Array.isArray(question.tags) ? question.tags : String(question.tags || '').split(',').map(tag => tag.trim()).filter(Boolean),
      quizId: question.quizId || ''
    });
    setImage(null);
    switchView('create');
  };

  const resetForm = () => {
    setEditingId(null);
    setImage(null);
    setForm(emptyForm);
  };

  const submitQuestion = async (event) => {
    event.preventDefault();
    setSaving(true);
    const body = new FormData();
    body.append('questionText', form.questionText);
    body.append('questionType', form.questionType);
    body.append('options', JSON.stringify(form.optionsText === undefined ? form.options : form.optionsText.split('\n').map(option => option.trim()).filter(Boolean)));
    body.append('correctAnswers', JSON.stringify(form.answersText === undefined ? form.correctAnswers : form.answersText.split(/[\n,]/).map(answer => answer.trim()).filter(Boolean)));
    body.append('explanation', form.explanation || '');
    body.append('subject', form.subject);
    body.append('topic', form.topic);
    body.append('difficulty', form.difficulty);
    body.append('marks', String(form.marks));
    body.append('tags', JSON.stringify(form.tagsText === undefined ? form.tags : form.tagsText.split(',').map(tag => tag.trim()).filter(Boolean)));
    body.append('track', form.track);
    body.append('status', form.status);
    body.append('quizId', form.quizId || '');
    if (image) body.append('image', image);
    try {
      await apiClient.request(editingId ? `/questions/${editingId}` : '/questions', {
        method: editingId ? 'PUT' : 'POST',
        body
      });
      showSuccess(editingId ? 'Question updated.' : 'Question created.');
      resetForm();
      switchView('mine');
      await loadQuestions();
    } catch (error) {
      showError(error.message || 'Could not save this question.');
    } finally {
      setSaving(false);
    }
  };

  const removeQuestion = async (questionId) => {
    if (!window.confirm('Delete this question?')) return;
    try {
      await apiClient.delete(`/questions/${questionId}`);
      showSuccess('Question deleted.');
      await loadQuestions();
    } catch (error) {
      showError(error.message || 'Could not delete this question.');
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`${BASE_URL}/questions/template?track=${form.track}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Template download failed.');
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement('a');
      link.href = url;
      link.download = 'question-upload-template.xlsx';
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      showError(error.message);
    }
  };

  const bulkUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const body = new FormData();
    body.append('file', file);
    body.append('track', form.track);
    try {
      const response = await apiClient.post('/questions/bulk-upload', body);
      showSuccess(`${response.created || 0} rows imported${response.errors?.length ? `; ${response.errors.length} rows need attention` : ''}.`);
      if (response.errors?.length) window.alert(response.errors.map(item => `Row ${item.row}: ${item.error}`).join('\n'));
      await loadQuestions();
    } catch (error) {
      showError(error.message || 'Bulk upload failed.');
    } finally {
      event.target.value = '';
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <p className="text-xs font-bold uppercase text-primary-700">Question workspace</p>
          <h1 className="text-2xl font-extrabold text-neutral-900">Manage questions</h1>
        </div>
        <div className="flex gap-2">
          <Button variant={view === 'create' ? 'primary' : 'secondary'} onClick={() => { resetForm(); switchView('create'); }}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Question
          </Button>
          <Button variant={view === 'mine' ? 'primary' : 'secondary'} onClick={() => switchView('mine')}>My Questions</Button>
        </div>
      </header>

      {view === 'create' ? (
        <Card className="p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-neutral-900">{editingId ? 'Edit question' : 'New question'}</h2>
            <Button variant="secondary" size="sm" onClick={downloadTemplate}><Download className="mr-1.5 h-4 w-4" /> Download template</Button>
          </div>
          <form onSubmit={submitQuestion} className="grid gap-4 md:grid-cols-2">
            <label className="md:col-span-2 text-xs font-bold text-neutral-700">Question text
              <textarea required maxLength={5000} rows={4} value={form.questionText} onChange={event => updateForm('questionText', event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-bold text-neutral-700">Type
              <select value={form.questionType} onChange={event => updateForm('questionType', event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm">
                <option value="mcq">MCQ</option><option value="multiple-select">Multiple-select</option><option value="numeric">Numeric</option><option value="short-answer">Short answer</option>
              </select>
            </label>
            <label className="text-xs font-bold text-neutral-700">Track
              <select value={form.track} onChange={event => updateForm('track', event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm">
                <option value="competitive">Competitive</option>{canCreateExam && <><option value="exam">Exam</option><option value="college">College</option></>}
              </select>
            </label>
            {['mcq', 'multiple-select'].includes(form.questionType) && <label className="text-xs font-bold text-neutral-700">Options, one per line (2-4)
              <textarea required rows={4} value={form.optionsText ?? form.options.join('\n')} onChange={event => setForm(current => ({ ...current, optionsText: event.target.value }))} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
            </label>}
            <label className="text-xs font-bold text-neutral-700">Correct answer{form.questionType === 'multiple-select' ? 's' : ''}{['mcq', 'multiple-select'].includes(form.questionType) ? ' (A-D)' : ''}
              <textarea required rows={2} value={form.answersText ?? form.correctAnswers.join(', ')} onChange={event => setForm(current => ({ ...current, answersText: event.target.value }))} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
            </label>
            <Input label="Subject" required maxLength={120} value={form.subject} onChange={event => updateForm('subject', event.target.value)} />
            <Input label="Topic" required maxLength={120} value={form.topic} onChange={event => updateForm('topic', event.target.value)} />
            <label className="text-xs font-bold text-neutral-700">Difficulty
              <select value={form.difficulty} onChange={event => updateForm('difficulty', event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"><option>easy</option><option>medium</option><option>hard</option></select>
            </label>
            <Input label="Marks" type="number" min="1" max="100" required value={form.marks} onChange={event => updateForm('marks', event.target.value)} />
            <Input label="Tags (comma separated)" value={form.tagsText ?? form.tags.join(', ')} onChange={event => setForm(current => ({ ...current, tagsText: event.target.value }))} />
            <Input label="Quiz ID (optional)" value={form.quizId} onChange={event => updateForm('quizId', event.target.value)} />
            <label className="text-xs font-bold text-neutral-700">Status
              <select value={form.status} onChange={event => updateForm('status', event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"><option value="draft">Draft</option><option value="published">Published</option></select>
            </label>
            <label className="text-xs font-bold text-neutral-700">Question image (PNG, JPEG, WebP; max 5 MB)
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={event => setImage(event.target.files?.[0] || null)} className="mt-1 block w-full text-sm" />
            </label>
            <label className="md:col-span-2 text-xs font-bold text-neutral-700">Explanation
              <textarea rows={3} maxLength={5000} value={form.explanation || ''} onChange={event => updateForm('explanation', event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" />
            </label>
            <div className="md:col-span-2 flex flex-wrap gap-2">
              <Button type="submit" variant="primary" isLoading={saving}>{editingId ? 'Save changes' : 'Create question'}</Button>
              {editingId && <Button type="button" variant="secondary" onClick={resetForm}>Cancel edit</Button>}
            </div>
          </form>
          <div className="mt-6 border-t border-neutral-200 pt-4">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-bold text-neutral-700">
              <FileUp className="h-4 w-4" /> Bulk upload CSV / Excel
              <input type="file" accept=".csv,.xlsx,.xls" onChange={bulkUpload} className="sr-only" />
            </label>
          </div>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="grid gap-3 border-b border-neutral-200 p-4 sm:grid-cols-2 lg:grid-cols-5">
            <label className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-neutral-400" /><input placeholder="Search question text" value={filters.search} onChange={event => { setPage(1); setFilters(current => ({ ...current, search: event.target.value })); }} className="w-full rounded-lg border border-neutral-300 py-2 pl-9 pr-3 text-sm" /></label>
            <select aria-label="Track filter" value={filters.track} onChange={event => setFilters(current => ({ ...current, track: event.target.value }))} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"><option value="">All tracks</option><option value="competitive">Competitive</option><option value="exam">Exam</option><option value="college">College</option></select>
            <select aria-label="Status filter" value={filters.status} onChange={event => setFilters(current => ({ ...current, status: event.target.value }))} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"><option value="">All statuses</option><option value="draft">Draft</option><option value="published">Published</option></select>
            <select aria-label="Difficulty filter" value={filters.difficulty} onChange={event => setFilters(current => ({ ...current, difficulty: event.target.value }))} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"><option value="">All difficulty</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase text-neutral-500"><tr><th className="p-3">Question</th><th className="p-3">Track</th><th className="p-3">Topic</th><th className="p-3">Level</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr></thead>
              <tbody className="divide-y divide-neutral-100">
                {questions.map(question => <tr key={question.id}>
                  <td className="max-w-[360px] p-3 font-semibold text-neutral-800"><span className="line-clamp-2">{question.questionText}</span></td>
                  <td className="p-3 capitalize">{question.track}</td><td className="p-3">{question.subject} / {question.topic}</td><td className="p-3 capitalize">{question.difficulty}</td><td className="p-3 capitalize">{question.status}</td>
                  <td className="p-3"><div className="flex justify-end gap-2"><button title="Edit question" onClick={() => startEdit(question)} className="rounded p-2 text-neutral-500 hover:bg-neutral-100"><Pencil className="h-4 w-4" /></button><button title="Delete question" onClick={() => removeQuestion(question.id)} className="rounded p-2 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button></div></td>
                </tr>)}
                {!loading && !questions.length && <tr><td colSpan="6" className="p-8 text-center text-sm text-neutral-500">No questions match these filters.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-4 text-xs text-neutral-500"><span>{loading ? 'Loading…' : `${questions.length} shown`}</span><div className="flex items-center gap-2"><Button size="xs" variant="secondary" disabled={page <= 1} onClick={() => setPage(current => current - 1)}>Previous</Button><span>Page {page} of {pages}</span><Button size="xs" variant="secondary" disabled={page >= pages} onClick={() => setPage(current => current + 1)}>Next</Button></div></div>
        </Card>
      )}
    </div>
  );
}
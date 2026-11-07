import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../utils/apiClient';
import { useToast } from '../../context/ToastContext';
import { Card, Button, Input, Textarea, Modal, Badge, DataTable } from '../../components/UI';
import {
  BookMarked, ChevronRight, Plus, Pencil, Trash2, ToggleLeft, ToggleRight,
  Layers, Library, FileText, ArrowLeft, GraduationCap, BookOpen, Tag
} from 'lucide-react';

// ─── Breadcrumb ───────────────────────────────────────────────────────────────
function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-1.5 text-xs text-neutral-500 mb-5 flex-wrap">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-neutral-300 shrink-0" />}
          {item.onClick ? (
            <button
              onClick={item.onClick}
              className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
            >
              {item.label}
            </button>
          ) : (
            <span className="font-semibold text-neutral-700">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}

// ─── Skeleton rows ────────────────────────────────────────────────────────────
function SkeletonRows({ cols = 4, rows = 3 }) {
  return Array.from({ length: rows }).map((_, r) => (
    <div key={r} className="flex items-center gap-4 px-5 py-4 border-b border-neutral-100 last:border-0 animate-pulse">
      {Array.from({ length: cols }).map((_, c) => (
        <div key={c} className={`h-4 bg-neutral-200 rounded-sm ${c === 0 ? 'w-1/4' : c === cols - 1 ? 'w-16' : 'flex-1'}`} />
      ))}
    </div>
  ));
}

// ─── Confirmation Modal ────────────────────────────────────────────────────────
function ConfirmModal({ isOpen, onClose, onConfirm, title, message, loading }) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm} isLoading={loading}>Delete</Button>
        </>
      }
    >
      <p className="text-sm text-neutral-600">{message}</p>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function ExamManagement() {
  // Navigation state: null | 'editions' | 'subjects' | 'topics'
  const [view, setView] = useState('exams');
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedEdition, setSelectedEdition] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);

  const { showSuccess, showError } = useToast();

  // Data
  const [exams, setExams] = useState([]);
  const [editions, setEditions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [formModal, setFormModal] = useState({ open: false, mode: 'create', data: null });
  const [deleteModal, setDeleteModal] = useState({ open: false, id: null });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const initialForm = { name: '', code: '', description: '', logo_url: '', status: 'active', category: 'ENGINEERING', track: 'COMPETITIVE', year: '', is_active: true };
  const [form, setForm] = useState(initialForm);

  // ─── Fetch helpers ────────────────────────────────────────────────────────
  const fetchExams = useCallback(async () => {
    setLoading(true);
    try { const r = await apiClient.get('/exams'); setExams(r.data || []); }
    catch { showError('Failed to load exams.'); }
    finally { setLoading(false); }
  }, [showError]);

  const fetchEditions = useCallback(async (examId) => {
    setLoading(true);
    try { const r = await apiClient.get(`/exams/${examId}/editions`); setEditions(r.data || []); }
    catch { showError('Failed to load editions.'); }
    finally { setLoading(false); }
  }, [showError]);

  const fetchSubjects = useCallback(async (editionId) => {
    setLoading(true);
    try { const r = await apiClient.get(`/editions/${editionId}/subjects`); setSubjects(r.data || []); }
    catch { showError('Failed to load subjects.'); }
    finally { setLoading(false); }
  }, [showError]);

  const fetchTopics = useCallback(async (subjectId) => {
    setLoading(true);
    try { const r = await apiClient.get(`/subjects/${subjectId}/topics`); setTopics(r.data || []); }
    catch { showError('Failed to load topics.'); }
    finally { setLoading(false); }
  }, [showError]);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  // ─── Navigation ───────────────────────────────────────────────────────────
  const drillIntoExam = (exam) => {
    setSelectedExam(exam);
    setView('editions');
    fetchEditions(exam.id);
  };

  const drillIntoEdition = (edition) => {
    setSelectedEdition(edition);
    setView('subjects');
    fetchSubjects(edition.id);
  };

  const drillIntoSubject = (subject) => {
    setSelectedSubject(subject);
    setView('topics');
    fetchTopics(subject.id);
  };

  const goBack = () => {
    if (view === 'topics') { setView('subjects'); setSelectedSubject(null); }
    else if (view === 'subjects') { setView('editions'); setSelectedEdition(null); }
    else if (view === 'editions') { setView('exams'); setSelectedExam(null); }
  };

  // ─── Open form modal ──────────────────────────────────────────────────────
  const openCreate = () => {
    setForm(initialForm);
    setFormModal({ open: true, mode: 'create', data: null });
  };

  const openEdit = (item) => {
    setForm({
      name: item.name || '',
      code: item.code || '',
      description: item.description || '',
      logo_url: item.logo_url || '',
      status: item.status || 'active',
      category: item.category || 'ENGINEERING',
      track: item.track || 'COMPETITIVE',
      year: item.year || '',
      is_active: item.is_active !== undefined ? item.is_active : true,
    });
    setFormModal({ open: true, mode: 'edit', data: item });
  };

  // ─── Save (create or update) ──────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      if (view === 'exams') {
        if (formModal.mode === 'create') {
          await apiClient.post('/exams', { name: form.name, code: form.code, description: form.description, logo_url: form.logo_url, status: form.status, category: form.category, track: form.track });
        } else {
          await apiClient.put(`/exams/${formModal.data.id}`, { name: form.name, description: form.description, logo_url: form.logo_url, status: form.status, category: form.category, track: form.track });
        }
        fetchExams();
      } else if (view === 'editions') {
        if (formModal.mode === 'create') {
          await apiClient.post(`/exams/${selectedExam.id}/editions`, { year: form.year, description: form.description, is_active: form.is_active });
        } else {
          await apiClient.put(`/editions/${formModal.data.id}`, { year: form.year, description: form.description, is_active: form.is_active });
        }
        fetchEditions(selectedExam.id);
      } else if (view === 'subjects') {
        if (formModal.mode === 'create') {
          await apiClient.post(`/editions/${selectedEdition.id}/subjects`, { name: form.name, description: form.description, status: form.status });
        } else {
          await apiClient.put(`/subjects/${formModal.data.id}`, { name: form.name, description: form.description, status: form.status });
        }
        fetchSubjects(selectedEdition.id);
      } else if (view === 'topics') {
        if (formModal.mode === 'create') {
          await apiClient.post(`/subjects/${selectedSubject.id}/topics`, { name: form.name, description: form.description, status: form.status });
        } else {
          await apiClient.put(`/topics/${formModal.data.id}`, { name: form.name, description: form.description, status: form.status });
        }
        fetchTopics(selectedSubject.id);
      }
      showSuccess(formModal.mode === 'create' ? 'Created successfully.' : 'Updated successfully.');
      setFormModal({ open: false, mode: 'create', data: null });
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Delete ───────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { id } = deleteModal;
      if (view === 'exams') await apiClient.delete(`/exams/${id}`);
      else if (view === 'editions') await apiClient.delete(`/editions/${id}`);
      else if (view === 'subjects') await apiClient.delete(`/subjects/${id}`);
      else if (view === 'topics') await apiClient.delete(`/topics/${id}`);

      showSuccess('Deleted successfully.');
      setDeleteModal({ open: false, id: null });

      if (view === 'exams') fetchExams();
      else if (view === 'editions') fetchEditions(selectedExam.id);
      else if (view === 'subjects') fetchSubjects(selectedEdition.id);
      else if (view === 'topics') fetchTopics(selectedSubject.id);
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete.');
    } finally {
      setDeleting(false);
    }
  };

  // ─── Toggle status ────────────────────────────────────────────────────────
  const toggleStatus = async (item) => {
    try {
      if (view === 'exams') {
        await apiClient.put(`/exams/${item.id}`, { status: item.status === 'active' ? 'inactive' : 'active' });
        fetchExams();
      } else if (view === 'editions') {
        await apiClient.put(`/editions/${item.id}`, { is_active: !item.is_active });
        fetchEditions(selectedExam.id);
      } else if (view === 'subjects' || view === 'topics') {
        const endpoint = view === 'subjects' ? `/subjects/${item.id}` : `/topics/${item.id}`;
        await apiClient.put(endpoint, { status: item.status === 'active' ? 'inactive' : 'active' });
        if (view === 'subjects') fetchSubjects(selectedEdition.id);
        else fetchTopics(selectedSubject.id);
      }
      showSuccess('Status updated.');
    } catch { showError('Failed to update status.'); }
  };

  // ─── Breadcrumb config ────────────────────────────────────────────────────
  const breadcrumbs = [
    { label: 'Exam Management', onClick: view !== 'exams' ? () => { setView('exams'); setSelectedExam(null); setSelectedEdition(null); setSelectedSubject(null); } : null }
  ];
  if (selectedExam) breadcrumbs.push({ label: selectedExam.name, onClick: view !== 'editions' ? () => { setView('editions'); setSelectedEdition(null); setSelectedSubject(null); fetchEditions(selectedExam.id); } : null });
  if (selectedEdition) breadcrumbs.push({ label: `${selectedEdition.year} Edition`, onClick: view !== 'subjects' ? () => { setView('subjects'); setSelectedSubject(null); fetchSubjects(selectedEdition.id); } : null });
  if (selectedSubject) breadcrumbs.push({ label: selectedSubject.name });

  // ─── View config ──────────────────────────────────────────────────────────
  const viewConfig = {
    exams: {
      title: 'Exam Catalog',
      subtitle: 'Manage competitive exam entries (GATE, JEE, UPSC, etc.)',
      icon: <GraduationCap className="w-5 h-5 text-primary-600" />,
      addLabel: 'Add Exam',
      items: exams
    },
    editions: {
      title: `${selectedExam?.name} — Editions`,
      subtitle: 'Year-based versions of the exam for each cycle',
      icon: <Library className="w-5 h-5 text-primary-600" />,
      addLabel: 'Add Edition',
      items: editions
    },
    subjects: {
      title: `${selectedEdition?.year} Edition — Subjects`,
      subtitle: 'Subject areas within this exam edition',
      icon: <BookOpen className="w-5 h-5 text-primary-600" />,
      addLabel: 'Add Subject',
      items: subjects
    },
    topics: {
      title: `${selectedSubject?.name} — Topics`,
      subtitle: 'Granular topic units with linked quizzes',
      icon: <Tag className="w-5 h-5 text-primary-600" />,
      addLabel: 'Add Topic',
      items: topics
    }
  };

  const cfg = viewConfig[view];

  // ─── Form modal fields based on view ──────────────────────────────────────
  const renderFormFields = () => {
    if (view === 'exams') {
      return (
        <div className="flex flex-col gap-4">
          <Input label="Exam Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. GATE" required />
          {formModal.mode === 'create' && (
            <Input label="Exam Code" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="e.g. GATE (unique, uppercase)" required />
          )}
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." rows={3} />
          <label className="text-xs font-semibold text-neutral-600">Category<select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"><option value="ENGINEERING">Engineering</option><option value="CIVIL_SERVICES">Civil Services</option><option value="MANAGEMENT">Management</option><option value="OTHER">Other</option></select></label>
          <label className="text-xs font-semibold text-neutral-600">Track<select value={form.track} onChange={e => setForm(f => ({ ...f, track: e.target.value }))} className="mt-1 w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm"><option value="COMPETITIVE">Competitive</option><option value="COLLEGE">College</option></select></label>
          <Input label="Logo URL (optional)" value={form.logo_url} onChange={e => setForm(f => ({ ...f, logo_url: e.target.value }))} placeholder="https://..." />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3.5 py-2 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      );
    }
    if (view === 'editions') {
      return (
        <div className="flex flex-col gap-4">
          <Input label="Year" type="number" value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} placeholder="e.g. 2026" required />
          <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Edition details..." rows={3} />
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Active Edition</span>
            <button type="button" onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))} className="transition-colors">
              {form.is_active
                ? <ToggleRight className="w-8 h-8 text-success-600" />
                : <ToggleLeft className="w-8 h-8 text-neutral-400" />}
            </button>
          </div>
        </div>
      );
    }
    // Subjects & Topics share the same form shape
    return (
      <div className="flex flex-col gap-4">
        <Input label="Name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={view === 'subjects' ? 'e.g. Engineering Mathematics' : 'e.g. Linear Algebra'} required />
        <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description..." rows={3} />
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-neutral-600 uppercase tracking-wider">Status</label>
          <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full px-3.5 py-2 text-sm rounded-lg border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500">
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>
    );
  };

  // ─── Row renderer ─────────────────────────────────────────────────────────
  const renderItem = (item) => {
    const isActive = item.status === 'active' || item.is_active === true;
    const label = item.name || `${item.year} Edition`;
    const subCount = item.editions?.length ?? item.subjects?.length ?? item.topics?.length ?? null;
    const isDrillable = view !== 'topics';

    return (
      <div
        key={item.id}
        className={`group flex items-center justify-between px-5 py-4 border-b border-neutral-100 last:border-0 transition-colors ${isDrillable ? 'hover:bg-neutral-50 cursor-pointer' : 'hover:bg-neutral-50/50'}`}
        onClick={isDrillable ? () => {
          if (view === 'exams') drillIntoExam(item);
          else if (view === 'editions') drillIntoEdition(item);
          else if (view === 'subjects') drillIntoSubject(item);
        } : undefined}
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${isActive ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-400'}`}>
            {view === 'exams' && <GraduationCap className="w-4 h-4" />}
            {view === 'editions' && <Library className="w-4 h-4" />}
            {view === 'subjects' && <BookOpen className="w-4 h-4" />}
            {view === 'topics' && <Tag className="w-4 h-4" />}
          </div>
          <div className="min-w-0 flex flex-col">
            <span className="text-sm font-semibold text-neutral-800 truncate">{label}</span>
            {item.description && <span className="text-xs text-neutral-400 truncate mt-0.5">{item.description}</span>}
            {item.code && <span className="text-[10px] font-mono text-neutral-400 mt-0.5">{item.code}</span>}
          </div>
        </div>

        <div className="flex items-center gap-3 ml-4 shrink-0" onClick={e => e.stopPropagation()}>
          {subCount !== null && <span className="text-xs text-neutral-400 font-medium">{subCount} {view === 'exams' ? 'editions' : view === 'editions' ? 'subjects' : 'topics'}</span>}
          <Badge variant={isActive ? 'success' : 'warning'}>{isActive ? 'Active' : 'Inactive'}</Badge>
          <button onClick={() => toggleStatus(item)} className="p-1.5 rounded-md text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all" title="Toggle status">
            {isActive ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
          </button>
          <button onClick={() => openEdit(item)} className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-all" title="Edit">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteModal({ open: true, id: item.id })} className="p-1.5 rounded-md text-neutral-400 hover:text-danger-600 hover:bg-danger-50 transition-all" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {isDrillable && <ChevronRight className="w-4 h-4 text-neutral-300 group-hover:text-primary-500 transition-colors" />}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            {view !== 'exams' && (
              <button onClick={goBack} className="p-1.5 rounded-lg text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="flex items-center gap-2">
              {cfg.icon}
              <h2 className="text-2xl font-bold text-neutral-800 tracking-tight">{cfg.title}</h2>
            </div>
          </div>
          <Breadcrumb items={breadcrumbs} />
          <p className="text-xs text-neutral-500">{cfg.subtitle}</p>
        </div>
        <Button variant="primary" onClick={openCreate} className="shrink-0">
          <Plus className="w-4 h-4 mr-1.5" />{cfg.addLabel}
        </Button>
      </div>

      {/* Content card */}
      <div className="bg-white border border-neutral-200/80 rounded-xl shadow-premium overflow-hidden">
        {loading ? (
          <SkeletonRows cols={4} rows={4} />
        ) : cfg.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
              <Layers className="w-7 h-7 text-neutral-400" />
            </div>
            <p className="text-sm font-semibold text-neutral-500">No {view} created yet.</p>
            <p className="text-xs text-neutral-400 mt-1 max-w-xs">Click "{cfg.addLabel}" to get started building the exam hierarchy.</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={openCreate}>
              <Plus className="w-3.5 h-3.5 mr-1" />{cfg.addLabel}
            </Button>
          </div>
        ) : (
          <div>{cfg.items.map(renderItem)}</div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={formModal.open}
        onClose={() => setFormModal({ open: false, mode: 'create', data: null })}
        title={`${formModal.mode === 'create' ? 'Create' : 'Edit'} ${view.slice(0, -1).charAt(0).toUpperCase() + view.slice(1, -1)}`}
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormModal({ open: false, mode: 'create', data: null })} disabled={saving}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} isLoading={saving}>{formModal.mode === 'create' ? 'Create' : 'Save Changes'}</Button>
          </>
        }
      >
        {renderFormFields()}
      </Modal>

      {/* Delete confirmation */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        onConfirm={handleDelete}
        loading={deleting}
        title="Confirm Deletion"
        message="This will permanently delete this record and all its children. This action cannot be undone."
      />
    </div>
  );
}

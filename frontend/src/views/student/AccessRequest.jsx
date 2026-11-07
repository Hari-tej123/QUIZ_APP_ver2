import React, { useEffect, useState } from 'react';
import { FileUp } from 'lucide-react';
import { Card, Button, Input } from '../../components/UI';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../utils/apiClient';

const emptyRequest = {
  fullName: '', qualification: '', experienceYears: '0', subjectsExams: [],
  institution: '', proofUrl: '', motivation: '', requestedEducatorType: 'COMPETITIVE'
};

export default function AccessRequest() {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  const [request, setRequest] = useState(null);
  const [taxonomy, setTaxonomy] = useState([]);
  const [proofFile, setProofFile] = useState(null);
  const [form, setForm] = useState(emptyRequest);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      apiClient.get('/educator-applications/mine'),
      apiClient.get('/educator-applications/taxonomy-options')
    ]).then(([applicationResponse, taxonomyResponse]) => {
      setRequest(applicationResponse.data || null);
      setTaxonomy(taxonomyResponse.data || []);
    }).catch(() => {});
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const body = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        body.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
      });
      if (proofFile) body.append('proof', proofFile);
      const response = await apiClient.post('/educator-applications', body);
      setRequest(response.data);
      setProofFile(null);
      showSuccess('Your access request was submitted for review.');
    } catch (error) {
      showError(error.message || 'Could not submit the access request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header className="border-b border-neutral-200 pb-4"><p className="text-xs font-bold uppercase text-primary-700">Access request</p><h1 className="text-2xl font-extrabold text-neutral-900">Educator and faculty access</h1></header>
      {request && <div className={`border-l-4 p-4 text-sm ${request.status === 'APPROVED' ? 'border-emerald-500 bg-emerald-50 text-emerald-900' : request.status === 'REJECTED' ? 'border-rose-500 bg-rose-50 text-rose-900' : 'border-amber-500 bg-amber-50 text-amber-900'}`}>
        {request.status === 'PENDING' ? 'Your educator application is pending approval.' : request.status === 'APPROVED' ? `Your educator access was approved (${request.requestedEducatorType}). Sign in again to refresh your workspace.` : `Your application was rejected.${request.rejectionReason ? ` Reason: ${request.rejectionReason}` : ''}`}
      </div>}
      {user?.role !== 'student' && user?.role !== 'STUDENT' ? <Card className="p-5 text-sm text-neutral-700">Your account already has educator access.</Card> : (
        <Card className="p-5 sm:p-7">
          <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
            <Input label="Full name" required maxLength={120} value={form.fullName} onChange={event => setForm(current => ({ ...current, fullName: event.target.value }))} />
            <Input label="Qualification" required maxLength={240} placeholder="e.g. M.Sc. Mathematics" value={form.qualification} onChange={event => setForm(current => ({ ...current, qualification: event.target.value }))} />
            <Input label="Teaching experience (years)" type="number" min="0" max="70" required value={form.experienceYears} onChange={event => setForm(current => ({ ...current, experienceYears: event.target.value }))} />
            <label className="text-xs font-bold text-neutral-700">Educator affiliation
              <select value={form.requestedEducatorType} onChange={event => setForm(current => ({ ...current, requestedEducatorType: event.target.value }))} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-sm"><option value="COMPETITIVE">Competitive</option><option value="COLLEGE">College</option><option value="BOTH">Both</option></select>
            </label>
            <Input label="Institution (optional)" maxLength={180} value={form.institution} onChange={event => setForm(current => ({ ...current, institution: event.target.value }))} />
            <Input label="Proof link (optional if uploading a file)" type="url" maxLength={500} value={form.proofUrl} onChange={event => setForm(current => ({ ...current, proofUrl: event.target.value }))} />
            <label className="sm:col-span-2 text-xs font-bold text-neutral-700">Subjects and exams to teach
              <select multiple required value={form.subjectsExams} onChange={event => setForm(current => ({ ...current, subjectsExams: [...event.target.selectedOptions].map(option => option.value) }))} className="mt-1 h-40 w-full rounded-lg border border-neutral-300 p-2 text-sm">
                {taxonomy.map(item => <option key={item.id} value={item.id}>{[item.exam, item.subject, item.name].filter(Boolean).join(' / ')}</option>)}
              </select>
              {!taxonomy.length && <span className="mt-1 block font-normal text-neutral-500">Taxonomy topics have not been seeded yet.</span>}
            </label>
            <label className="sm:col-span-2 text-xs font-bold text-neutral-700">Proof document (PDF, PNG, or JPEG; max 5 MB)
              <span className="mt-1 flex items-center gap-2 rounded-lg border border-dashed border-neutral-300 p-3 font-medium text-neutral-600"><FileUp className="h-4 w-4" /><input type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={event => setProofFile(event.target.files?.[0] || null)} />{proofFile?.name}</span>
            </label>
            <label className="sm:col-span-2 text-xs font-bold text-neutral-700">Motivation<textarea required minLength={20} maxLength={2000} rows={4} value={form.motivation} onChange={event => setForm(current => ({ ...current, motivation: event.target.value }))} className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm" /></label>
            <div className="sm:col-span-2"><Button type="submit" variant="primary" isLoading={saving} disabled={request?.status === 'PENDING'}>Submit application</Button></div>
          </form>
        </Card>
      )}
    </div>
  );
}
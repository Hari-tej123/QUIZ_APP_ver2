import React, { useCallback, useEffect, useState } from 'react';
import { Card, Button } from '../../components/UI';
import { useToast } from '../../context/ToastContext';
import apiClient from '../../utils/apiClient';

export default function AccessManagement() {
  const { showSuccess, showError } = useToast();
  const [status, setStatus] = useState('');
  const [requests, setRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [userStatus, setUserStatus] = useState('');
  const [edits, setEdits] = useState({});

  const load = useCallback(async () => {
    try {
      const requestQuery = status ? `?status=${status}` : '';
      const userQuery = new URLSearchParams({ limit: '50' });
      if (search) userQuery.set('search', search);
      if (role) userQuery.set('role', role);
      if (userStatus) userQuery.set('status', userStatus);
      const [requestResponse, userResponse] = await Promise.all([
        apiClient.get(`/admin/access-requests${requestQuery}`),
        apiClient.get(`/admin/users?${userQuery}`)
      ]);
      setRequests(requestResponse.data || []);
      setUsers(userResponse.data || []);
      setEdits(Object.fromEntries((userResponse.data || []).map(user => [user.id, { role: user.role, educatorType: user.educatorType, status: user.status }])));
    } catch (error) {
      showError(error.message || 'Could not load access management data.');
    }
  }, [status, search, role, userStatus, showError]);

  useEffect(() => { load(); }, [load]);

  const decide = async (request, decision) => {
    const reason = decision === 'rejected' ? window.prompt('Optional rejection reason:') : '';
    if (decision === 'rejected' && reason === null) return;
    try {
      await apiClient.put(`/admin/access-requests/${request.id}/decision`, { status: decision, reason: reason || '' });
      showSuccess(`Request ${decision}.`);
      await load();
    } catch (error) {
      showError(error.message || 'Could not update request.');
    }
  };

  const saveUser = async (userId) => {
    try {
      await apiClient.put(`/admin/users/${userId}/access`, edits[userId]);
      showSuccess('User access updated.');
      await load();
    } catch (error) {
      showError(error.message || 'Could not update user access.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-12">
      <header className="border-b border-neutral-200 pb-4"><p className="text-xs font-bold uppercase text-primary-700">Administration</p><h1 className="text-2xl font-extrabold text-neutral-900">Access and approvals</h1></header>
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-lg font-bold text-neutral-900">Faculty and educator requests</h2><p className="text-xs text-neutral-500">Approval changes the server-side account role.</p></div><select aria-label="Request status" value={status} onChange={event => setStatus(event.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"><option value="">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
        <Card className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="bg-neutral-50 text-xs uppercase text-neutral-500"><tr><th className="p-3">Applicant</th><th className="p-3">Request</th><th className="p-3">Institution</th><th className="p-3">Evidence / reason</th><th className="p-3">Status</th><th className="p-3">Review</th></tr></thead><tbody className="divide-y divide-neutral-100">
          {requests.map(request => <tr key={request.id}><td className="p-3"><strong>{request.name}</strong><span className="block text-xs text-neutral-500">{request.user?.email}</span></td><td className="p-3 capitalize">{request.requestedRole}<span className="block text-xs text-neutral-500">{request.department}</span></td><td className="p-3">{request.institution}<span className="block text-xs text-neutral-500">{request.employeeId || request.proofUrl}</span></td><td className="max-w-sm p-3 text-xs">{request.reason}{request.reviewReason && <span className="mt-1 block text-rose-700">Review: {request.reviewReason}</span>}</td><td className="p-3 capitalize">{request.status}</td><td className="p-3"><div className="flex gap-2">{request.status !== 'approved' && <><Button size="xs" variant="primary" onClick={() => decide(request, 'approved')}>Approve</Button><Button size="xs" variant="secondary" onClick={() => decide(request, 'rejected')}>Reject</Button></>}</div></td></tr>)}
          {!requests.length && <tr><td colSpan="6" className="p-8 text-center text-neutral-500">No access requests found.</td></tr>}
        </tbody></table></Card>
      </section>
      <section className="space-y-3">
        <div><h2 className="text-lg font-bold text-neutral-900">User access</h2><p className="text-xs text-neutral-500">Search by name/email, filter accounts, and revoke or change roles.</p></div>
        <div className="grid gap-2 sm:grid-cols-3"><input aria-label="Search users" placeholder="Name or email" value={search} onChange={event => setSearch(event.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm" /><select aria-label="Filter role" value={role} onChange={event => setRole(event.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"><option value="">All roles</option>{['STUDENT', 'EDUCATOR', 'ADMIN'].map(value => <option key={value} value={value}>{value}</option>)}</select><select aria-label="Filter status" value={userStatus} onChange={event => setUserStatus(event.target.value)} className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"><option value="">All account statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        <Card className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-sm"><thead className="bg-neutral-50 text-xs uppercase text-neutral-500"><tr><th className="p-3">User</th><th className="p-3">Role</th><th className="p-3">Status</th><th className="p-3">Action</th></tr></thead><tbody className="divide-y divide-neutral-100">
          {users.map(user => <tr key={user.id}><td className="p-3"><strong>{user.name}</strong><span className="block text-xs text-neutral-500">{user.email}</span></td><td className="p-3"><div className="flex flex-wrap gap-2"><select aria-label={`Role for ${user.email}`} value={edits[user.id]?.role || user.role} onChange={event => setEdits(current => ({ ...current, [user.id]: { ...current[user.id], role: event.target.value } }))} className="rounded border border-neutral-300 px-2 py-1 text-sm">{['STUDENT', 'EDUCATOR', 'ADMIN'].map(value => <option key={value} value={value}>{value}</option>)}</select>{edits[user.id]?.role === 'EDUCATOR' && <select aria-label={`Educator type for ${user.email}`} value={edits[user.id]?.educatorType || 'BOTH'} onChange={event => setEdits(current => ({ ...current, [user.id]: { ...current[user.id], educatorType: event.target.value } }))} className="rounded border border-neutral-300 px-2 py-1 text-xs"><option>COMPETITIVE</option><option>COLLEGE</option><option>BOTH</option></select>}</div></td><td className="p-3"><select aria-label={`Status for ${user.email}`} value={edits[user.id]?.status || user.status} onChange={event => setEdits(current => ({ ...current, [user.id]: { ...current[user.id], status: event.target.value } }))} className="rounded border border-neutral-300 px-2 py-1 text-sm"><option value="active">active</option><option value="inactive">inactive</option></select></td><td className="p-3"><Button size="xs" variant="secondary" onClick={() => saveUser(user.id)}>Save</Button></td></tr>)}
          {!users.length && <tr><td colSpan="4" className="p-8 text-center text-neutral-500">No users found.</td></tr>}
        </tbody></table></Card>
      </section>
    </div>
  );
}
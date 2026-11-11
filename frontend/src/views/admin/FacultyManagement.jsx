import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/apiClient';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Modal, DataTable, Badge, Card } from '../../components/UI';
import { UserPlus, Edit2, ShieldAlert, Key, Clipboard, Check, RefreshCw, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function FacultyManagement() {
  const { showSuccess, showError, showWarning } = useToast();

  const [activeTab, setActiveTab] = useState('approved'); // 'approved' | 'pending'
  const [faculty, setFaculty] = useState([]);
  const [pendingFaculty, setPendingFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null); // null means adding new

  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectingFacultyId, setRejectingFacultyId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [subject, setSubject] = useState('');
  const [phone, setPhone] = useState('');
  const [initialPassword, setInitialPassword] = useState('');

  // Password Reveal Banner after Faculty Creation
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchFaculty = async () => {
    setLoading(true);
    try {
      const [approvedRes, pendingRes] = await Promise.all([
        apiClient.get('/admin/faculty?status=APPROVED'),
        apiClient.get('/admin/faculty?status=PENDING')
      ]);
      setFaculty(approvedRes.data || approvedRes || []);
      setPendingFaculty(pendingRes.data || pendingRes || []);
    } catch (err) {
      showError('Failed to fetch faculty list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleApprove = async (fac) => {
    try {
      await apiClient.patch(`/admin/faculty/${fac.id}/approve`);
      showSuccess(`Approved faculty account for ${fac.name}!`);
      fetchFaculty();
    } catch (err) {
      showError(err.message || 'Failed to approve faculty account.');
    }
  };

  const openRejectModal = (fac) => {
    setRejectingFacultyId(fac.id);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiClient.patch(`/admin/faculty/${rejectingFacultyId}/reject`, { reason: rejectReason });
      showSuccess('Faculty application rejected.');
      setRejectModalOpen(false);
      fetchFaculty();
    } catch (err) {
      showError(err.message || 'Failed to reject faculty.');
    }
  };

  const openAddModal = () => {
    setEditingFaculty(null);
    setName('');
    setEmail('');
    setDepartment('');
    setSubject('');
    setPhone('');
    setInitialPassword('');
    setCreatedCredentials(null);
    setModalOpen(true);
  };

  const openEditModal = (fac) => {
    setEditingFaculty(fac);
    setName(fac.name);
    setEmail(fac.email);
    setDepartment(fac.department);
    setSubject(fac.subject);
    setPhone(fac.phone);
    setCreatedCredentials(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !department || !subject || !phone) {
      return showError('All fields are required.');
    }

    try {
      if (editingFaculty) {
        // Edit Faculty
        await apiClient.put(`/admin/faculty/${editingFaculty.id}`, {
          name, email, department, subject, phone
        });
        showSuccess('Faculty member details updated successfully.');
        setModalOpen(false);
        fetchFaculty();
      } else {
        // Add Faculty
        const response = await apiClient.post('/admin/faculty', {
          name, email, department, subject, phone, initialPassword
        });
        showSuccess('Faculty account created successfully.');
        // Store credentials to show Admin
        setCreatedCredentials({
          email: response.faculty.email,
          password: response.generatedPassword
        });
        fetchFaculty();
      }
    } catch (err) {
      showError(err.message || 'An error occurred.');
    }
  };

  const toggleFacultyStatus = async (fac) => {
    const newStatus = fac.status === 'active' ? 'inactive' : 'active';
    try {
      await apiClient.put(`/admin/faculty/${fac.id}/deactivate`, { status: newStatus });
      showSuccess(`Faculty account status changed to ${newStatus}.`);
      fetchFaculty();
    } catch (err) {
      showError(err.message || 'Failed to toggle status.');
    }
  };

  const copyToClipboard = () => {
    if (!createdCredentials) return;
    const text = `Faculty Login Details:\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.password}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Columns for Pending Faculty Approvals
  const pendingColumns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'institute',
      label: 'Institution',
      render: (_, row) => (
        <span className="font-semibold text-neutral-800">
          {row.institute?.name || row.instituteId || 'Unspecified'}
        </span>
      )
    },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'employeeId', label: 'Employee ID' },
    {
      key: 'createdAt',
      label: 'Registered',
      render: (val) => new Date(val).toLocaleDateString()
    },
    {
      key: 'actions',
      label: 'Decision',
      render: (_, row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="success"
            size="sm"
            onClick={() => handleApprove(row)}
            className="h-8 text-xs font-bold px-2.5 flex items-center gap-1 shadow-xs"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Approve
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => openRejectModal(row)}
            className="h-8 text-xs font-bold px-2.5 flex items-center gap-1 shadow-xs"
          >
            <XCircle className="w-3.5 h-3.5" /> Reject
          </Button>
        </div>
      )
    }
  ];

  // Columns definition for DataTable (Approved)
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'institute',
      label: 'Institution',
      render: (_, row) => row.institute?.name || row.instituteId || 'MIT'
    },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'subject', label: 'Specialization' },
    {
      key: 'status',
      label: 'Status',
      render: (status, row) => (
        <button
          onClick={() => toggleFacultyStatus(row)}
          className="focus:outline-none focus:ring-0 active:scale-95 transition-transform"
          title={`Click to toggle account status`}
        >
          <Badge variant={status === 'active' ? 'success' : 'danger'}>
            {status.toUpperCase()}
          </Badge>
        </button>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (_, row) => (
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEditModal(row)} className="h-8 w-8 !p-0" title="Edit details">
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant={row.status === 'active' ? 'destructive' : 'secondary'}
            size="sm"
            onClick={() => toggleFacultyStatus(row)}
            className="h-8 text-xs font-semibold px-2.5"
          >
            {row.status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-neutral-800 tracking-tight">Faculty Management</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Review registration requests, approve new college educators, and manage active faculty rosters.
          </p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add Faculty
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-200">
        <button
          type="button"
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'approved'
              ? 'border-primary-600 text-primary-700'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Approved Faculty ({faculty.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-2 ${
            activeTab === 'pending'
              ? 'border-amber-600 text-amber-800'
              : 'border-transparent text-neutral-500 hover:text-neutral-800'
          }`}
        >
          Pending Verification
          {pendingFaculty.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white">
              {pendingFaculty.length}
            </span>
          )}
        </button>
      </div>

      {/* Table Card */}
      <Card>
        {activeTab === 'approved' ? (
          <DataTable
            columns={columns}
            data={faculty}
            searchable={true}
            searchKey="name"
            searchPlaceholder="Search active faculty by name..."
            isLoading={loading}
            emptyStateMessage="No active faculty records registered."
          />
        ) : (
          <DataTable
            columns={pendingColumns}
            data={pendingFaculty}
            searchable={true}
            searchKey="name"
            searchPlaceholder="Search pending applicants by name..."
            isLoading={loading}
            emptyStateMessage="No pending faculty applications awaiting verification."
          />
        )}
      </Card>

      {/* Reject Reason Modal */}
      <Modal
        isOpen={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject Faculty Application"
      >
        <form onSubmit={handleRejectSubmit} className="flex flex-col gap-4">
          <p className="text-xs text-neutral-600">
            Please provide a reason for rejecting this faculty registration application. The user will be notified.
          </p>
          <Input
            label="Rejection Reason"
            placeholder="e.g. Could not verify college affiliation or employee ID."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
          <div className="flex justify-end gap-2 mt-2">
            <Button type="button" variant="secondary" onClick={() => setRejectModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="destructive">
              Confirm Rejection
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit/Add Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingFaculty ? 'Modify Faculty details' : 'Register New Faculty'}
      >
        {!createdCredentials ? (
          <form onSubmit={handleFormSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                placeholder="e.g. Dr. Alan Turing"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                label="Official Email"
                type="email"
                placeholder="alan.turing@univ.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Department"
                placeholder="e.g. Computer Science"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                required
              />
              <Input
                label="Primary Subject Specialization"
                placeholder="e.g. Algorithms & Complexity"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Contact Phone"
                placeholder="+1 234 567 890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
              {!editingFaculty && (
                <Input
                  label="Initial Password (Optional)"
                  type="password"
                  placeholder="Auto-generated if blank"
                  value={initialPassword}
                  onChange={(e) => setInitialPassword(e.target.value)}
                />
              )}
            </div>

            <div className="flex justify-end gap-3 mt-4">
              <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {editingFaculty ? 'Save Modifications' : 'Confirm Registration'}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4 p-2 text-center items-center">
            <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
              <Check className="h-6 w-6 stroke-[3]" />
            </div>
            <div>
              <h4 className="text-base font-semibold text-neutral-800">Account Provisioned Successfully</h4>
              <p className="text-xs text-neutral-500 max-w-sm mt-1">
                Please securely copy these initial credentials. The faculty member must change this password upon initial login.
              </p>
            </div>

            <div className="w-full bg-neutral-50 border border-neutral-200 rounded-lg p-3 text-left font-mono text-xs space-y-1">
              <div><span className="text-neutral-400 select-none">Email: </span><span className="font-semibold text-neutral-800">{createdCredentials.email}</span></div>
              <div><span className="text-neutral-400 select-none">Password: </span><span className="font-semibold text-emerald-600">{createdCredentials.password}</span></div>
            </div>

            <div className="flex gap-2 w-full mt-2">
              <Button onClick={copyToClipboard} variant="secondary" className="w-full flex items-center justify-center gap-2">
                <Clipboard className="w-4 h-4" /> {copied ? 'Copied to Clipboard' : 'Copy Credentials'}
              </Button>
              <Button onClick={() => setModalOpen(false)} variant="primary" className="w-full">
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

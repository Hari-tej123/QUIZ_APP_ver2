import React, { useState, useEffect } from 'react';
import apiClient from '../../utils/apiClient';
import { useToast } from '../../context/ToastContext';
import { Button, Input, Modal, DataTable, Badge, Card } from '../../components/UI';
import { UserPlus, Edit2, ShieldAlert, Key, Clipboard, Check, RefreshCw } from 'lucide-react';

export default function FacultyManagement() {
  const { showSuccess, showError, showWarning } = useToast();

  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null); // null means adding new

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
      const response = await apiClient.get('/admin/faculty');
      setFaculty(response.data);
    } catch (err) {
      showError('Failed to fetch faculty list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

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

  // Columns definition for DataTable
  const columns = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'department', label: 'Department', sortable: true },
    { key: 'subject', label: 'Specialization', sortable: true },
    { key: 'phone', label: 'Phone' },
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
          <h2 className="text-2xl font-bold text-neutral-800 tracking-tight">Faculty Roster</h2>
          <p className="text-xs text-neutral-500 mt-1">
            Register and manage accounts of teaching lecturers, subject allocations, and account access permissions.
          </p>
        </div>
        <Button onClick={openAddModal} className="flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Add Faculty
        </Button>
      </div>

      {/* Main Roster Table Card */}
      <Card>
        <DataTable
          columns={columns}
          data={faculty}
          searchable={true}
          searchKey="name"
          searchPlaceholder="Search faculty members by name..."
          isLoading={loading}
          emptyStateMessage="No faculty records registered."
        />
      </Card>

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
                label="Email Address"
                type="email"
                placeholder="e.g. turing@university.edu"
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
                label="Primary Subject"
                placeholder="e.g. Discrete Math"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            
            <Input
              label="Contact Phone"
              placeholder="e.g. +1 555-0199"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />

            {!editingFaculty && (
              <Input
                label="Initial Password (Optional)"
                type="password"
                placeholder="Leave blank to auto-generate"
                value={initialPassword}
                onChange={(e) => setInitialPassword(e.target.value)}
              />
            )}

            <div className="flex justify-end gap-3 mt-4 border-t border-neutral-100 pt-4">
              <Button variant="secondary" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingFaculty ? 'Save Changes' : 'Create Account'}
              </Button>
            </div>
          </form>
        ) : (
          /* Credentials disclosure block */
          <div className="flex flex-col gap-5 p-1">
            <div className="bg-success-500/10 border border-success-500/20 text-success-700 rounded-lg p-3 text-xs leading-relaxed font-semibold flex items-start gap-2.5">
              <ShieldAlert className="w-5 h-5 shrink-0 text-success-600 mt-0.5" />
              <div>
                <p className="font-bold text-success-800">Faculty Registered Successfully!</p>
                <p className="mt-1 font-medium">Please copy these credentials and share them securely. For security, this password will not be shown again.</p>
              </div>
            </div>

            <div className="border border-neutral-200 rounded-lg p-4 bg-neutral-50 flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-neutral-400">EMAIL</span>
                <span className="font-mono text-neutral-800 font-bold select-all">{createdCredentials.email}</span>
              </div>
              <div className="flex justify-between items-center text-xs mt-1">
                <span className="font-bold text-neutral-400">TEMPORARY PASSWORD</span>
                <span className="font-mono text-neutral-800 font-bold select-all bg-neutral-200/60 px-2 py-0.5 rounded">{createdCredentials.password}</span>
              </div>
            </div>

            <div className="flex justify-end gap-3.5 mt-2">
              <Button variant="secondary" className="flex items-center gap-1.5" onClick={copyToClipboard}>
                {copied ? <Check className="w-4 h-4 text-success-600" /> : <Clipboard className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy Credentials'}
              </Button>
              <Button variant="primary" onClick={() => setModalOpen(false)}>
                Close Panel
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

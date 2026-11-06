import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  Users,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Sparkles,
  BookOpen,
  DollarSign,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { Button, Card, Badge, Modal, Input } from '../../components/UI';
import api from '../../utils/api';

export default function ContributorManagement() {
  const { showSuccess, showError } = useToast();
  const [contributors, setContributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'pending' | 'approved' | 'rejected'
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchContributors();
  }, []);

  const fetchContributors = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/contributors');
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
      setContributors(list);

    } catch (err) {
      showError('Failed to fetch contributors list.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (userId, newStatus) => {
    try {
      await api.put(`/admin/contributors/${userId}/status`, {
        status: newStatus,
        badge: newStatus === 'approved' ? 'Verified Educator' : null
      });
      showSuccess(`Contributor account marked as ${newStatus}!`);
      fetchContributors();
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to update contributor status.');
    }
  };

  const filtered = contributors.filter(c => {
    const matchesSearch = c.name?.toLowerCase().includes(search.toLowerCase()) ||
                          c.email?.toLowerCase().includes(search.toLowerCase()) ||
                          c.subjectExpertise?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.contributorStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary-600 font-display">Educator Community</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-display">
            Contributor & Educator Applications
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Review applicant credentials, approve domain specialists, and manage verified educator badges.
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <Input
            placeholder="Search educator, subject..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-56 text-xs"
          />

          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-neutral-200">
            {['all', 'pending', 'approved', 'rejected'].map((st) => (
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
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Users className="w-16 h-16 mx-auto text-neutral-300" />
          <h3 className="text-lg font-bold text-neutral-800">No contributors found</h3>
          <p className="text-xs text-neutral-500 max-w-md mx-auto">
            No contributor accounts match your search or filter criteria.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((c) => {
            const isApproved = c.contributorStatus === 'approved';
            const isPending = c.contributorStatus === 'pending';

            return (
              <Card key={c.id} className="p-6 space-y-4 flex flex-col justify-between hover:shadow-card-hover transition-all">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-500 text-white font-extrabold flex items-center justify-center text-sm shadow-sm">
                        {c.name ? c.name.charAt(0).toUpperCase() : 'E'}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-neutral-900">{c.name}</h3>
                        <p className="text-xs text-neutral-400">{c.email}</p>
                      </div>
                    </div>

                    <Badge variant={isApproved ? 'success' : isPending ? 'warning' : 'danger'}>
                      {c.contributorStatus?.toUpperCase()}
                    </Badge>
                  </div>

                  {c.badge && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      {c.badge}
                    </div>
                  )}

                  <div className="space-y-1.5 text-xs text-neutral-600">
                    <p><span className="font-bold text-neutral-800">Expertise:</span> {c.subjectExpertise || 'General Subjects'}</p>
                    <p className="line-clamp-2 text-neutral-500"><span className="font-bold text-neutral-800">Bio:</span> {c.bio || 'No bio provided.'}</p>
                    {c.credentials && (
                      <p className="line-clamp-1 text-primary-700 font-semibold"><span className="font-bold text-neutral-800">Credentials:</span> {c.credentials}</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-100 flex items-center justify-between gap-2">
                  <span className="text-xs text-neutral-400 font-medium">
                    Earned: ${(c.totalEarned || 0).toFixed(2)}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {isPending ? (
                      <>
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => handleUpdateStatus(c.id, 'rejected')}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => handleUpdateStatus(c.id, 'approved')}
                          className="bg-emerald-600 hover:bg-emerald-500 font-bold"
                        >
                          Approve & Verify
                        </Button>
                      </>
                    ) : isApproved ? (
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => handleUpdateStatus(c.id, 'rejected')}
                        className="text-rose-600 hover:bg-rose-50"
                      >
                        Revoke Badge
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => handleUpdateStatus(c.id, 'approved')}
                      >
                        Re-Approve
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

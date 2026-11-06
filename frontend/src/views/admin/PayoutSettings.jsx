import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  DollarSign,
  Settings,
  ArrowUpRight,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  ShieldCheck,
  Receipt,
  Users
} from 'lucide-react';
import { Button, Card, Input, Badge, Modal } from '../../components/UI';
import api from '../../utils/api';

export default function PayoutSettings() {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    flat_fee_per_quiz: '15.00',
    rev_share_per_attempt: '0.10',
    min_withdrawal: '20.00'
  });
  const [saving, setSaving] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);

  // Process Modal
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [processModalOpen, setProcessModalOpen] = useState(false);
  const [processStatus, setProcessStatus] = useState('completed'); // 'completed' | 'rejected'
  const [referenceId, setReferenceId] = useState('');
  const [processNotes, setProcessNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchSettings();
    fetchWithdrawals();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/payout-settings');
      const data = res?.data || res || {};
      if (data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      showError('Failed to fetch payout rules.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      setWithdrawalsLoading(true);
      const res = await api.get('/admin/withdrawals');
      const list = Array.isArray(res?.data) ? res.data : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
      setWithdrawals(list);

    } catch (err) {
      showError('Failed to fetch withdrawal requests.');
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/admin/payout-settings', {
        flatFeePerQuiz: settings.flat_fee_per_quiz,
        revSharePerAttempt: settings.rev_share_per_attempt,
        minWithdrawal: settings.min_withdrawal
      });
      showSuccess('Platform payout rules updated successfully.');
    } catch (err) {
      showError('Failed to update payout settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenProcess = (w, status) => {
    setSelectedWithdrawal(w);
    setProcessStatus(status);
    setReferenceId(status === 'completed' ? `PAY-RZP-${Math.floor(1000000 + Math.random() * 9000000)}` : '');
    setProcessNotes(status === 'completed' ? 'Payout transferred successfully to registered account' : 'Withdrawal rejected');
    setProcessModalOpen(true);
  };

  const handleSubmitProcess = async (e) => {
    e.preventDefault();
    if (!selectedWithdrawal) return;

    setProcessing(true);
    try {
      await api.put(`/admin/withdrawals/${selectedWithdrawal.id}/status`, {
        status: processStatus,
        referenceId,
        notes: processNotes
      });
      showSuccess(`Withdrawal marked as ${processStatus}!`);
      setProcessModalOpen(false);
      fetchWithdrawals();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to process withdrawal.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16 animate-fade-in">
      {/* ─── HEADER ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 font-display">Revenue Operations</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-display">
            Payout Rules & Educator Withdrawals
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Configure bounty reward models and process pending educator withdrawal payouts.
          </p>
        </div>
      </div>

      {/* ─── 1. PLATFORM REVENUE SHARE SETTINGS ─────────────────────────────── */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center gap-2.5 border-b border-neutral-100 pb-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-neutral-900">Platform Payout Rules</h2>
            <p className="text-xs text-neutral-400">Rules apply dynamically across all approved submissions</p>
          </div>
        </div>

        <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Input
            label="Flat Bounty per Approved Quiz ($)"
            type="number"
            step="0.50"
            value={settings.flat_fee_per_quiz || '15.00'}
            onChange={(e) => setSettings({ ...settings, flat_fee_per_quiz: e.target.value })}
            helperText="Default payout awarded upon Admin approval."
            required
          />

          <Input
            label="RevShare per Student Attempt ($)"
            type="number"
            step="0.01"
            value={settings.rev_share_per_attempt || '0.10'}
            onChange={(e) => setSettings({ ...settings, rev_share_per_attempt: e.target.value })}
            helperText="Credited to author on every student quiz completion."
            required
          />

          <Input
            label="Minimum Withdrawal Balance ($)"
            type="number"
            step="1.00"
            value={settings.min_withdrawal || '20.00'}
            onChange={(e) => setSettings({ ...settings, min_withdrawal: e.target.value })}
            helperText="Threshold before educator can request a payout."
            required
          />

          <div className="sm:col-span-3 flex justify-end">
            <Button type="submit" variant="primary" size="md" isLoading={saving} className="bg-emerald-600 hover:bg-emerald-500 font-bold">
              <Save className="w-4 h-4 mr-2" />
              Save Platform Rules
            </Button>
          </div>
        </form>
      </Card>

      {/* ─── 2. WITHDRAWAL REQUESTS QUEUE ──────────────────────────────────── */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-neutral-900">Educator Withdrawal Requests</h2>
              <p className="text-xs text-neutral-400">Review and mark payouts as completed via Razorpay / Stripe / Bank</p>
            </div>
          </div>
        </div>

        {withdrawalsLoading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 space-y-2">
            <DollarSign className="w-12 h-12 mx-auto text-neutral-300" />
            <p className="text-sm font-semibold">No withdrawal requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Educator</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3">Method & Details</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {withdrawals.map((w) => {
                  const isPending = w.status === 'pending';
                  return (
                    <tr key={w.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3.5 px-3 text-neutral-600 font-medium">
                        {new Date(w.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-neutral-900 block">{w.contributor?.name || 'Educator'}</span>
                        <span className="text-[11px] text-neutral-400">{w.contributor?.email}</span>
                      </td>
                      <td className="py-3.5 px-3 font-extrabold text-sm text-emerald-600">
                        ${w.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-neutral-700 max-w-xs truncate">
                        <span className="font-bold">{w.paymentMethod}</span>
                        <span className="block text-[11px] text-neutral-400 truncate">{w.paymentDetails || w.notes}</span>
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge variant={w.status === 'completed' ? 'success' : w.status === 'pending' ? 'warning' : 'danger'}>
                          {w.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        {isPending ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="danger"
                              size="xs"
                              onClick={() => handleOpenProcess(w, 'rejected')}
                            >
                              Reject & Refund
                            </Button>
                            <Button
                              variant="primary"
                              size="xs"
                              onClick={() => handleOpenProcess(w, 'completed')}
                              className="bg-emerald-600 hover:bg-emerald-500 font-bold"
                            >
                              Mark Paid
                            </Button>
                          </div>
                        ) : (
                          <span className="text-neutral-400 text-[11px] font-semibold">{w.referenceId || 'Processed'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ─── PROCESS WITHDRAWAL MODAL ──────────────────────────────────────── */}
      <Modal
        isOpen={processModalOpen}
        onClose={() => setProcessModalOpen(false)}
        title={processStatus === 'completed' ? 'Confirm Payout Transfer' : 'Reject Withdrawal Request'}
      >
        <form onSubmit={handleSubmitProcess} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs space-y-1">
            <p><span className="font-bold">Educator:</span> {selectedWithdrawal?.contributor?.name}</p>
            <p><span className="font-bold">Amount:</span> ${selectedWithdrawal?.amount?.toFixed(2)}</p>
            <p><span className="font-bold">Method:</span> {selectedWithdrawal?.paymentMethod}</p>
          </div>

          {processStatus === 'completed' && (
            <Input
              label="Transaction / Reference ID"
              placeholder="e.g. PAY-RZP-9842187 or Bank UTR"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              required
            />
          )}

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1">
              {processStatus === 'completed' ? 'Processing Remarks' : 'Reason for Rejection (Refunds balance back to educator)'}
            </label>
            <textarea
              rows="2"
              className="w-full px-3 py-2 rounded-xl border border-neutral-300 text-xs focus:ring-2 focus:ring-primary-500 outline-none"
              value={processNotes}
              onChange={(e) => setProcessNotes(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
            <Button variant="secondary" onClick={() => setProcessModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={processStatus === 'completed' ? 'primary' : 'danger'}
              type="submit"
              isLoading={processing}
              className="font-bold"
            >
              Confirm {processStatus === 'completed' ? 'Payment' : 'Rejection'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

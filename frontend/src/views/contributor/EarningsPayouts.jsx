import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import {
  DollarSign,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Building2,
  QrCode,
  Sparkles,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { Button, Card, Input, Badge, Modal } from '../../components/UI';
import api from '../../utils/api';

export default function EarningsPayouts() {
  const { showSuccess, showError } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  // Withdrawal Form State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Razorpay UPI'); // 'Razorpay UPI' | 'Stripe Connect' | 'Bank Transfer'
  const [paymentDetails, setPaymentDetails] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    fetchPayouts();
  }, []);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/contributor/payouts');
      setData(res?.data || res || { balance: 0, totalEarned: 0, totalWithdrawn: 0, history: [], platformRules: {} });

    } catch (err) {
      showError('Failed to fetch payout records.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestWithdrawal = async (e) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      return showError('Please enter a valid withdrawal amount.');
    }

    const min = parseFloat(data?.platformRules?.minWithdrawal || 20);
    if (amount < min) {
      return showError(`Minimum withdrawal threshold is $${min.toFixed(2)}.`);
    }

    if (amount > (data?.balance || 0)) {
      return showError('Withdrawal amount exceeds your current available balance.');
    }

    setWithdrawing(true);
    try {
      await api.post('/contributor/payouts/withdraw', {
        amount,
        paymentMethod,
        paymentDetails: { details: paymentDetails, timestamp: new Date() },
        notes: `Payout request via ${paymentMethod}`
      });
      showSuccess('Withdrawal request submitted successfully!');
      setWithdrawModalOpen(false);
      setWithdrawAmount('');
      setPaymentDetails('');
      fetchPayouts();
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to submit withdrawal request.');
    } finally {
      setWithdrawing(false);
    }
  };

  const balance = data?.balance || 0;
  const totalEarned = data?.totalEarned || 0;
  const rules = data?.platformRules || {};
  const transactions = data?.transactions || [];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 font-display">Financial Portal</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-neutral-900 font-display">
            Earnings & Payouts
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Track question set bounties, student attempt revenue shares, and request payouts.
          </p>
        </div>

        <Button
          variant="primary"
          size="md"
          onClick={() => setWithdrawModalOpen(true)}
          disabled={balance < parseFloat(rules.minWithdrawal || 20)}
          className="bg-emerald-600 hover:bg-emerald-500 font-bold shadow-md shadow-emerald-900/20"
        >
          <ArrowUpRight className="w-4.5 h-4.5 mr-1.5" />
          Request Withdrawal
        </Button>
      </div>

      {/* ─── 1. BALANCE CARDS & REVENUE RULES ──────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Balance */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-950 text-white shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">Available Balance</span>
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-300">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-extrabold font-display text-white tracking-tight">${balance.toFixed(2)}</h2>
            <p className="text-xs text-emerald-200 mt-1 font-medium">
              Minimum withdrawal: ${parseFloat(rules.minWithdrawal || 20).toFixed(2)}
            </p>
          </div>
        </div>

        {/* Lifetime Earnings */}
        <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">Lifetime Earnings</span>
            <div className="w-9 h-9 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h2 className="text-4xl font-extrabold text-neutral-900 font-display tracking-tight">${totalEarned.toFixed(2)}</h2>
            <p className="text-xs text-neutral-500 mt-1 font-medium">Aggregated bounties & attempt rev-shares</p>
          </div>
        </div>

        {/* Platform Payout Rules */}
        <div className="p-6 rounded-2xl bg-neutral-900 text-white shadow-xs space-y-3 border border-neutral-800">
          <span className="text-xs font-bold uppercase tracking-wider text-primary-300 block">Payout Rate Structure</span>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-neutral-800">
              <span className="text-slate-300">Approved Quiz Bounty:</span>
              <span className="font-bold text-emerald-400">${parseFloat(rules.bountyPerQuiz || 15).toFixed(2)} / set</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-neutral-800">
              <span className="text-slate-300">Student Attempt RevShare:</span>
              <span className="font-bold text-emerald-400">${parseFloat(rules.revSharePerAttempt || 0.1).toFixed(2)} / attempt</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-300">Min. Payout Threshold:</span>
              <span className="font-bold text-white">${parseFloat(rules.minWithdrawal || 20).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. TRANSACTION HISTORY / LEDGER ───────────────────────────────── */}
      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
              <Receipt className="w-5 h-5 text-neutral-500" />
              Payout & Earnings Ledger
            </h3>
            <p className="text-xs text-neutral-400">Full audit trail of all credits and withdrawals</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 space-y-2">
            <DollarSign className="w-12 h-12 mx-auto text-neutral-300" />
            <p className="text-sm font-semibold">No transactions recorded yet.</p>
            <p className="text-xs text-neutral-400">Your bounties and attempt shares will appear here once approved.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider font-bold">
                  <th className="pb-3 px-3">Date</th>
                  <th className="pb-3 px-3">Type</th>
                  <th className="pb-3 px-3">Reference & Notes</th>
                  <th className="pb-3 px-3">Payment Method</th>
                  <th className="pb-3 px-3">Amount</th>
                  <th className="pb-3 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {transactions.map((tx) => {
                  const isCredit = tx.type === 'bounty_quiz' || tx.type === 'revenue_share';
                  const isApproved = tx.status === 'completed' || tx.status === 'approved';

                  return (
                    <tr key={tx.id} className="hover:bg-neutral-50/60 transition-colors">
                      <td className="py-3.5 px-3 text-neutral-600 font-medium">
                        {new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="py-3.5 px-3 font-bold">
                        {tx.type === 'bounty_quiz' && <span className="text-primary-700">🎯 Quiz Bounty</span>}
                        {tx.type === 'revenue_share' && <span className="text-teal-700">📈 RevShare</span>}
                        {tx.type === 'withdrawal' && <span className="text-amber-700">💸 Withdrawal</span>}
                      </td>
                      <td className="py-3.5 px-3 text-neutral-700 max-w-xs truncate">
                        <span className="font-semibold text-neutral-900">{tx.referenceId || '-'}</span>
                        <span className="block text-[11px] text-neutral-400 truncate">{tx.notes}</span>
                      </td>
                      <td className="py-3.5 px-3 text-neutral-600 font-medium">
                        {tx.paymentMethod || 'Platform'}
                      </td>
                      <td className={`py-3.5 px-3 font-extrabold text-sm ${isCredit ? 'text-emerald-600' : 'text-neutral-900'}`}>
                        {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <Badge variant={isApproved ? 'success' : tx.status === 'pending' ? 'warning' : 'danger'}>
                          {tx.status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ─── 3. WITHDRAWAL MODAL ───────────────────────────────────────────── */}
      <Modal
        isOpen={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        title="Request Payout Withdrawal"
      >
        <form onSubmit={handleRequestWithdrawal} className="space-y-4">
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex justify-between items-center">
            <span>Available Balance to Withdraw:</span>
            <span className="text-sm font-extrabold">${balance.toFixed(2)}</span>
          </div>

          <Input
            label="Withdrawal Amount ($)"
            type="number"
            step="0.01"
            min={rules.minWithdrawal || 20}
            max={balance}
            placeholder={`Min $${parseFloat(rules.minWithdrawal || 20).toFixed(2)}`}
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            required
          />

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-1.5">Payment Method</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Razorpay UPI', label: 'UPI / VPA', icon: <QrCode className="w-4 h-4" /> },
                { id: 'Stripe Connect', label: 'Stripe', icon: <CreditCard className="w-4 h-4" /> },
                { id: 'Bank Transfer', label: 'Bank IMPS/NEFT', icon: <Building2 className="w-4 h-4" /> }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                    paymentMethod === m.id
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {m.icon}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <Input
            label={paymentMethod === 'Razorpay UPI' ? 'UPI ID (e.g. educator@okhdfcbank)' : paymentMethod === 'Stripe Connect' ? 'Stripe Connect Account ID or Email' : 'Account Number & IFSC Code'}
            placeholder={paymentMethod === 'Razorpay UPI' ? 'username@upi' : 'account details...'}
            value={paymentDetails}
            onChange={(e) => setPaymentDetails(e.target.value)}
            required
          />

          <div className="flex justify-end gap-3 pt-3 border-t border-neutral-100">
            <Button variant="secondary" onClick={() => setWithdrawModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" isLoading={withdrawing} className="bg-emerald-600 hover:bg-emerald-500 font-bold">
              Submit Withdrawal
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

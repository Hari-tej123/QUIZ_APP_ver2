import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Input, Button } from '../../components/UI';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';

export default function Register() {
  const { register } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return showError('Please fill in name, email, and password.');
    }

    if (password.length < 8) {
      return showError('Password must be at least 8 characters long.');
    }

    setLoading(true);
    try {
      const newUser = await register({ name, email, password, rollNumber, inviteToken: searchParams.get('invite') || undefined });
      showSuccess('Registration successful! Welcome to Quizzify.');
      navigate(newUser.role === 'EDUCATOR' ? '/questions' : '/student');
    } catch (err) {
      showError(err.response?.data?.message || err.message || 'Registration failed. Email may already exist.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-primary-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute w-[500px] h-[300px] bg-gradient-to-tr from-primary-200/40 via-indigo-100/30 to-amber-200/30 rounded-full blur-3xl -top-12 -left-12 -z-10" />
      <div className="absolute w-[400px] h-[300px] bg-gradient-to-tr from-amber-200/30 to-primary-100/20 rounded-full blur-3xl -bottom-12 -right-12 -z-10" />

      {/* Back to Home link */}
      <div className="w-full max-w-lg mb-4 flex justify-between items-center">
        <Link to="/" className="text-xs font-semibold text-neutral-500 hover:text-primary-600 flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <span className="text-xs font-bold text-primary-600">Quizzify Dual-Track Platform</span>
      </div>

      <div className="max-w-lg w-full bg-white border border-neutral-200/90 rounded-3xl shadow-card p-8 animate-slide-up">
        <div className="flex flex-col items-center text-center mb-6">
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight font-display">
            Create Free Student Account
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-medium">
            Join Quizzify to practice competitive exams and university courses
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <Input
            label="Full Name"
            placeholder="e.g. Prof. Rajesh Sharma"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. educator@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Roll Number / Student ID (optional)"
            placeholder="e.g. CS-2026-104"
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-9 text-neutral-400 hover:text-neutral-600 transition-colors p-1 cursor-pointer"
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Button type="submit" variant="primary" size="md" className="w-full mt-2 font-bold shadow-indigo" isLoading={loading}>
            Create Free Student Account
          </Button>
        </form>

        <div className="mt-6 border-t border-neutral-100 pt-4 text-center">
          <p className="text-xs text-neutral-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:underline font-bold transition-all">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

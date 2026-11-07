import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Input, Button, Badge } from '../../components/UI';
import { Eye, EyeOff, Lock, Mail, GraduationCap, ArrowLeft, Sparkles } from 'lucide-react';
import { BASE_URL } from '../../utils/apiClient';

export default function Login() {
  const { login } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTarget = searchParams.get('redirect');
  const googleStatus = searchParams.get('google');
  const inviteToken = searchParams.get('invite');
  const demoAdminEmail = (import.meta.env.DEV ? import.meta.env.VITE_DEMO_ADMIN_EMAIL : '') || 'admin@quizapp.com';
  const demoAdminPassword = (import.meta.env.DEV ? import.meta.env.VITE_DEMO_ADMIN_PASSWORD : '') || 'AdminSecurePass2026!';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return showError('Please fill in all fields.');
    }

    setLoading(true);
    try {
      const user = await login(email, password);
      showSuccess(`Welcome back, ${user.name}!`);

      if (redirectTarget) {
        navigate(redirectTarget);
        return;
      }

      // Redirect based on role
      if (user.role === 'ADMIN') navigate('/admin');
      else if (user.role === 'EDUCATOR') navigate('/contributor');
      else navigate('/student');
    } catch (err) {
      showError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick fill demo account credentials
  const fillCredentials = (roleEmail, rolePass = 'password123') => {
    setEmail(roleEmail);
    setPassword(rolePass);
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-primary-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute w-[500px] h-[300px] bg-gradient-to-tr from-primary-200/40 via-indigo-100/30 to-amber-200/30 rounded-full blur-3xl -top-12 -left-12 -z-10" />
      <div className="absolute w-[400px] h-[300px] bg-gradient-to-tr from-amber-200/30 to-primary-100/20 rounded-full blur-3xl -bottom-12 -right-12 -z-10" />

      {/* Back to Home link */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <Link to="/" className="text-xs font-semibold text-neutral-500 hover:text-primary-600 flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <Badge variant="primary">Platform v2.0</Badge>
      </div>

      {/* Main Glassmorphic Card */}
      <div className="max-w-md w-full bg-white border border-neutral-200/90 rounded-3xl shadow-card p-8 animate-slide-up">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 bg-gradient-to-tr from-primary-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-sm mb-3">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight font-display">
            Sign In to Quizzify
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-medium">
            Access your competitive exam goals & educator workspace
          </p>
        </div>

        {googleStatus && (
          <div role="status" className={`mb-4 rounded-lg border p-3 text-xs ${googleStatus === 'not-configured' ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-rose-300 bg-rose-50 text-rose-800'}`}>
            {googleStatus === 'not-configured'
              ? 'Google sign-in is not configured yet. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL to backend/.env, then restart the backend.'
              : 'Google sign-in did not complete. Please try again or use email and password.'}
          </div>
        )}

        {import.meta.env.DEV && <div className="mb-6 p-3 bg-neutral-50 border border-neutral-200/80 rounded-2xl">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2 text-center">
            ⚡ Quick-Fill Demo Credentials
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            <button
              type="button"
              onClick={() => fillCredentials('student1@quizapp.com')}
              className="px-2 py-1.5 text-[10px] font-bold rounded-lg bg-white border border-neutral-200/90 text-neutral-700 hover:border-primary-400 hover:text-primary-600 transition-all cursor-pointer shadow-xs"
            >
              🎓 Student
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('contributor1@quizapp.com')}
              className="px-2 py-1.5 text-[10px] font-bold rounded-lg bg-primary-50 border border-primary-200 text-primary-800 hover:border-primary-400 transition-all cursor-pointer shadow-xs"
            >
              ✨ Educator
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('faculty1@quizapp.com')}
              className="px-2 py-1.5 text-[10px] font-bold rounded-lg bg-amber-50 border border-amber-200 text-amber-800 hover:border-amber-400 transition-all cursor-pointer shadow-xs"
            >
              🏛️ Faculty
            </button>
            {demoAdminEmail && demoAdminPassword && <button
              type="button"
              onClick={() => fillCredentials(demoAdminEmail, demoAdminPassword)}
              className="px-2 py-1.5 text-[10px] font-bold rounded-lg bg-neutral-900 border border-neutral-900 text-white hover:bg-neutral-700 transition-all cursor-pointer shadow-xs"
            >
              Admin
            </button>}
          </div>
        </div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="e.g. student1@quizapp.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
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
            Sign In
          </Button>
        </form>

        <div className="relative my-5 text-center">
          <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-neutral-400">or continue with</span>
          <span className="absolute left-0 right-0 top-1/2 -z-10 border-t border-neutral-200" />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="w-full font-bold"
          onClick={() => window.location.assign(`${BASE_URL}/auth/google${inviteToken ? `?invite=${encodeURIComponent(inviteToken)}` : ''}`)}
        >
          <span className="mr-2 font-black text-base text-blue-600">G</span> Sign in with Google
        </Button>

        <div className="mt-6 border-t border-neutral-100 pt-4 text-center">
          <p className="text-xs text-neutral-500 font-medium">
            Don't have an account?{' '}
            <Link to={inviteToken ? `/register?invite=${encodeURIComponent(inviteToken)}` : '/register'} className="text-primary-600 hover:underline font-bold transition-all">
              Register Free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

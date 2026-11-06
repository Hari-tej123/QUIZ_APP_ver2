import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate, Link } from 'react-router-dom';
import { Input, Button, Badge } from '../../components/UI';
import { Eye, EyeOff, GraduationCap, ArrowLeft, Sparkles, BookOpen, ShieldCheck } from 'lucide-react';
import api from '../../utils/api';

export default function Register() {
  const { register } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [role, setRole] = useState('student'); // 'student' | 'contributor'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  // Contributor specific
  const [subjectExpertise, setSubjectExpertise] = useState('');
  const [credentials, setCredentials] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      return showError('Please fill in name, email, and password.');
    }

    if (role === 'student' && !rollNumber) {
      return showError('Please enter your roll number.');
    }

    if (role === 'contributor' && !subjectExpertise) {
      return showError('Please enter your subject domain expertise.');
    }

    if (password.length < 6) {
      return showError('Password must be at least 6 characters long.');
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        role,
        rollNumber: role === 'student' ? rollNumber : null,
        subjectExpertise: role === 'contributor' ? subjectExpertise : null,
        credentials: role === 'contributor' ? credentials : null,
        bio: role === 'contributor' ? bio : null,
        phone: role === 'contributor' ? phone : null
      });

      const data = res.data;
      localStorage.setItem('quizapp_token', data.token);
      localStorage.setItem('quizapp_user', JSON.stringify(data.user));

      if (role === 'contributor') {
        showSuccess('Educator application submitted! Welcome to Quizzify Creator Portal.');
        navigate('/contributor');
      } else {
        showSuccess('Registration successful! Welcome to Quizzify.');
        navigate('/student');
      }
      window.location.reload();
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
        {/* Role Switcher */}
        <div className="flex items-center bg-neutral-100 p-1.5 rounded-2xl mb-6 border border-neutral-200">
          <button
            type="button"
            onClick={() => setRole('student')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              role === 'student'
                ? 'bg-white text-primary-700 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <GraduationCap className="w-4 h-4" /> Student Account
          </button>
          <button
            type="button"
            onClick={() => setRole('contributor')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              role === 'contributor'
                ? 'bg-gradient-to-r from-primary-600 to-indigo-600 text-white shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Sparkles className="w-4 h-4" /> Educator / Creator
          </button>
        </div>

        <div className="flex flex-col items-center text-center mb-6">
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight font-display">
            {role === 'student' ? 'Create Free Student Account' : 'Apply as Verified Educator'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1 font-medium">
            {role === 'student'
              ? 'Join 50,000+ students practicing mock tests & university courses'
              : 'Create high-yield question sets, upload study materials, and earn bounties & revenue share'}
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

          {role === 'student' ? (
            <Input
              label="Roll Number / Student ID"
              placeholder="e.g. CS-2026-104"
              value={rollNumber}
              onChange={(e) => setRollNumber(e.target.value)}
              required
            />
          ) : (
            <>
              <Input
                label="Subject Domain Expertise"
                placeholder="e.g. GATE CSE, Algorithms, JEE Physics"
                value={subjectExpertise}
                onChange={(e) => setSubjectExpertise(e.target.value)}
                required
              />

              <Input
                label="Credentials / Degrees & Experience"
                placeholder="e.g. M.Tech (IIT KGP), 10+ Years Coaching"
                value={credentials}
                onChange={(e) => setCredentials(e.target.value)}
              />

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1">Bio / Profile Summary</label>
                <textarea
                  rows="2"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 text-xs font-medium focus:ring-2 focus:ring-primary-500 outline-none"
                  placeholder="Tell students about your teaching experience..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>

              <Input
                label="Phone Number (for Payout Verification)"
                placeholder="e.g. +91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </>
          )}

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
            {role === 'student' ? 'Create Free Student Account' : 'Submit Educator Application'}
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

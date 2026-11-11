import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Input, Button, Badge } from '../../components/UI';
import {
  Eye, EyeOff, ArrowLeft, GraduationCap, Building2,
  CheckCircle2, Target, Sparkles, AlertCircle, RefreshCw
} from 'lucide-react';
import apiClient from '../../utils/apiClient';

export default function Register() {
  const { register } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const isGoogleComplete = searchParams.get('google') === 'complete-profile';
  const initialRoleParam = searchParams.get('role');
  const [role, setRole] = useState(
    ['student', 'faculty'].includes(initialRoleParam) ? initialRoleParam : null
  );

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Student specific
  const [selectedExams, setSelectedExams] = useState([]);

  // Common/Faculty specific
  const [instituteId, setInstituteId] = useState('');
  const [department, setDepartment] = useState('');
  const [designation, setDesignation] = useState('');
  const [employeeId, setEmployeeId] = useState('');

  // Dropdown data & states
  const [institutes, setInstitutes] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // Fetch institutes and competitive exams
  useEffect(() => {
    async function fetchMetadata() {
      setDataLoading(true);
      try {
        const [instRes, examRes] = await Promise.all([
          apiClient.get('/institutes').catch(() => ({ data: [] })),
          apiClient.get('/exams').catch(() => ({ data: [] }))
        ]);
        setInstitutes(instRes.data || instRes || []);
        setExams(examRes.data || examRes || []);
      } catch (err) {
        // Soft fail
      } finally {
        setDataLoading(false);
      }
    }
    fetchMetadata();
  }, []);

  const toggleExam = (id) => {
    if (selectedExams.includes(id)) {
      setSelectedExams(selectedExams.filter(eId => eId !== id));
    } else {
      setSelectedExams([...selectedExams, id]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFieldErrors({});

    if (!isGoogleComplete) {
      if (!name.trim()) {
        setFieldErrors(prev => ({ ...prev, name: 'Full name is required.' }));
        return showError('Please enter your full name.');
      }
      if (!email.trim()) {
        setFieldErrors(prev => ({ ...prev, email: 'Email is required.' }));
        return showError('Please enter your email.');
      }
      if (!password || password.length < 8) {
        setFieldErrors(prev => ({ ...prev, password: 'Password must be at least 8 characters long.' }));
        return showError('Password must be at least 8 characters long.');
      }
      if (password !== confirmPassword) {
        setFieldErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
        return showError('Passwords do not match.');
      }
    }

    if (role === 'faculty' && !instituteId) {
      setFieldErrors(prev => ({ ...prev, instituteId: 'Institute affiliation is required for faculty.' }));
      return showError('Please select your institution.');
    }

    setLoading(true);
    try {
      const payload = {
        role,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        instituteId: instituteId || null,
        department: role === 'faculty' ? department.trim() : null,
        designation: role === 'faculty' ? designation.trim() : null,
        employeeId: role === 'faculty' ? employeeId.trim() : null,
        registeredExams: role === 'student' ? selectedExams : [],
        inviteToken: searchParams.get('invite') || undefined
      };

      if (isGoogleComplete) {
        await apiClient.post('/auth/complete-profile', payload);
        showSuccess('Profile setup complete!');
        if (role === 'faculty') navigate('/contributor');
        else navigate('/student');
        return;
      }

      const newUser = await register(payload);

      if (role === 'faculty') {
        showSuccess('Registration successful! Your faculty account is awaiting verification.');
        navigate('/contributor');
      } else {
        showSuccess(`Welcome to Quizzify, ${newUser.name || 'Student'}!`);
        navigate('/student');
      }
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors) && apiErrors.length > 0) {
        const errorMap = {};
        apiErrors.forEach(errItem => {
          if (errItem.field) errorMap[errItem.field] = errItem.message;
        });
        setFieldErrors(errorMap);
      }
      showError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-primary-500 selection:text-white">
      {/* Background ambient lighting */}
      <div className="absolute w-[500px] h-[300px] bg-gradient-to-tr from-primary-200/40 via-indigo-100/30 to-amber-200/30 rounded-full blur-3xl -top-12 -left-12 -z-10" />
      <div className="absolute w-[400px] h-[300px] bg-gradient-to-tr from-amber-200/30 to-primary-100/20 rounded-full blur-3xl -bottom-12 -right-12 -z-10" />

      {/* Top Header */}
      <div className="w-full max-w-xl mb-4 flex justify-between items-center">
        <Link to="/" className="text-xs font-semibold text-neutral-500 hover:text-primary-600 flex items-center gap-1.5 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <span className="text-xs font-bold text-primary-600 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" /> Quizzify Dual-Track
        </span>
      </div>

      <div className="max-w-xl w-full bg-white border border-neutral-200/90 rounded-3xl shadow-card p-8 animate-slide-up">
        {/* Step 1: Role Selection Cards */}
        {!role ? (
          <div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-black text-neutral-900 tracking-tight font-display">
                I am registering as...
              </h1>
              <p className="text-xs text-neutral-500 mt-1 font-medium">
                Choose your role to get access to the appropriate tools and content
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Student Card */}
              <div
                onClick={() => setRole('student')}
                className="group relative p-6 rounded-2xl border-2 border-neutral-200 hover:border-primary-500 hover:bg-primary-50/20 transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-extrabold text-neutral-900 font-display">Student</h3>
                    <Badge variant="success" size="sm">Instant Access</Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Prepare for competitive exams (GATE, JEE, NEET, etc.) or study your college coursework.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center text-xs font-bold text-primary-600">
                  Select Student Account →
                </div>
              </div>

              {/* Faculty Card */}
              <div
                onClick={() => setRole('faculty')}
                className="group relative p-6 rounded-2xl border-2 border-neutral-200 hover:border-amber-500 hover:bg-amber-50/20 transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:shadow-md"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-base font-extrabold text-neutral-900 font-display">Faculty</h3>
                    <Badge variant="warning" size="sm">Verification</Badge>
                  </div>
                  <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
                    Teach at a verified college or institute, manage internal courses, and create question sets.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-neutral-100 flex items-center text-xs font-bold text-amber-700">
                  Select Faculty Account →
                </div>
              </div>
            </div>

            <div className="p-3.5 bg-neutral-50 rounded-2xl border border-neutral-200/80 text-center mb-6">
              <p className="text-[11px] text-neutral-500">
                <span className="font-semibold text-neutral-700">Looking to contribute competitive exams?</span> Independent educators can request Educator Access from the student dashboard.
              </p>
            </div>

            <div className="border-t border-neutral-100 pt-4 text-center">
              <p className="text-xs text-neutral-500 font-medium">
                Already have an account?{' '}
                <Link to="/login" className="text-primary-600 hover:underline font-bold transition-all">
                  Sign In
                </Link>
              </p>
            </div>
          </div>
        ) : (
          /* Step 2: Form with Role Header and Back Link */
          <div>
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white ${role === 'faculty' ? 'bg-amber-600' : 'bg-primary-600'}`}>
                  {role === 'faculty' ? <Building2 className="w-4 h-4" /> : <GraduationCap className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-lg font-black text-neutral-900 font-display">
                    {role === 'faculty' ? 'Faculty Registration' : 'Student Registration'}
                  </h2>
                  <p className="text-[11px] text-neutral-400">
                    {role === 'faculty' ? 'College affiliation required' : 'Free access to platform'}
                  </p>
                </div>
              </div>

              {!isGoogleComplete && (
                <button
                  type="button"
                  onClick={() => { setRole(null); setFieldErrors({}); }}
                  className="text-xs font-bold text-neutral-500 hover:text-neutral-800 transition-colors px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 cursor-pointer"
                >
                  Change role
                </button>
              )}
            </div>

            {isGoogleComplete && (
              <div className="mb-4 p-3 bg-primary-50 border border-primary-200 rounded-xl text-xs text-primary-800 font-medium">
                Complete your profile to finish Google sign-in.
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
              {!isGoogleComplete && (
                <>
                  <div>
                    <Input
                      label="Full Name *"
                      placeholder={role === 'faculty' ? 'e.g. Dr. Rajesh Sharma' : 'e.g. Alex Johnson'}
                      value={name}
                      onChange={(e) => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: null })); }}
                      required
                    />
                    {fieldErrors.name && (
                      <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.name}</p>
                    )}
                  </div>

                  <div>
                    <Input
                      label="Email Address *"
                      type="email"
                      placeholder={role === 'faculty' ? 'e.g. r.sharma@mit.edu' : 'e.g. student@gmail.com'}
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: null })); }}
                      required
                    />
                    {fieldErrors.email && (
                      <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="relative">
                      <Input
                        label="Password *"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="At least 8 characters"
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: null })); }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-9 text-neutral-400 hover:text-neutral-600 transition-colors p-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      {fieldErrors.password && (
                        <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.password}</p>
                      )}
                    </div>

                    <div>
                      <Input
                        label="Confirm Password *"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Re-enter password"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(p => ({ ...p, confirmPassword: null })); }}
                        required
                      />
                      {fieldErrors.confirmPassword && (
                        <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Institute Dropdown */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1.5">
                  {role === 'faculty' ? 'College / University Affiliation *' : 'College / University Affiliation (Optional)'}
                </label>
                <select
                  value={instituteId}
                  onChange={(e) => { setInstituteId(e.target.value); setFieldErrors(p => ({ ...p, instituteId: null })); }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-medium transition-all outline-none ${
                    fieldErrors.instituteId ? 'border-rose-400 bg-rose-50/30' : 'border-neutral-200 bg-white focus:border-primary-500 focus:ring-2 focus:ring-primary-100'
                  }`}
                  required={role === 'faculty'}
                >
                  <option value="">{role === 'faculty' ? '— Select your institution (Required) —' : '— Select your institution (Optional) —'}</option>
                  {institutes.map((inst) => (
                    <option key={inst.id} value={inst.id}>
                      {inst.name} ({inst.code})
                    </option>
                  ))}
                </select>
                {fieldErrors.instituteId && (
                  <p className="text-[11px] font-semibold text-rose-600 mt-1">{fieldErrors.instituteId}</p>
                )}
                {role === 'faculty' && (
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Your institution is required so you can manage your college track courses.
                  </p>
                )}
              </div>

              {/* Faculty-specific fields */}
              {role === 'faculty' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <Input
                      label="Department *"
                      placeholder="e.g. Computer Science"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      label="Designation"
                      placeholder="e.g. Associate Professor"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <Input
                      label="Employee ID / Staff Number"
                      placeholder="e.g. EMP-9821"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Student-specific: Interested Competitive Exams */}
              {role === 'student' && exams.length > 0 && (
                <div className="pt-2">
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-2">
                    Competitive Exams I'm Targetting (Optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {exams.map((exam) => {
                      const isSelected = selectedExams.includes(exam.id);
                      return (
                        <button
                          key={exam.id}
                          type="button"
                          onClick={() => toggleExam(exam.id)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                            isSelected
                              ? 'bg-primary-600 border-primary-600 text-white shadow-xs'
                              : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:border-primary-300'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {exam.code || exam.name}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[11px] text-neutral-400 mt-1.5">
                    You can change these target goals anytime from your exams page.
                  </p>
                </div>
              )}

              <Button
                type="submit"
                variant={role === 'faculty' ? 'warning' : 'primary'}
                size="md"
                className="w-full mt-3 font-bold shadow-indigo"
                isLoading={loading}
              >
                {role === 'faculty' ? 'Register Faculty Account' : 'Create Student Account'}
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
        )}
      </div>
    </div>
  );
}

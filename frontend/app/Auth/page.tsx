'use client';

import React, { useState } from 'react';
import {
  Eye,
  EyeOff,
  Building2,
  User as UserIcon,
  ArrowRight,
  ArrowLeft,
  Warehouse,
  Check,
  Sparkles,
  CheckCircle2,
  Lock,
  Mail,
  Phone,
  Briefcase,
  FileText,
  Users
} from 'lucide-react';
import { useApp } from '@/app/store';
import LogoImage from '@/components/layout/logo';
import Badge from '@/components/ui/Badge';

function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-3 group focus:outline-none cursor-pointer"
    >
      <LogoImage className="h-10 sm:h-11 w-auto" />
      <span className="font-semibold text-soot text-lg sm:text-xl group-hover:text-moss transition-colors duration-200">
        Coworking Pass
      </span>
    </button>
  );
}

function AuthVisualBanner({
  quote,
  author,
  role,
  tag = 'Verified Saudi Workspace Network'
}: {
  quote: string;
  author: string;
  role: string;
  tag?: string;
}) {
  return (
    <div className="hidden lg:block lg:w-1/2 p-4 lg:p-6 h-[100dvh]">
      <div className="relative h-full w-full rounded-3xl overflow-hidden border border-soot/12 shadow-2xl bg-soot">
        <img
          src="https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&auto=format&fit=crop&q=80"
          alt="Modern coworking interior"
          className="w-full h-full object-cover saturate-110"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-soot/95 via-soot/40 to-transparent pointer-events-none" />

        <div className="absolute bottom-6 left-6 right-6 bg-plaster-surface/95 backdrop-blur-md rounded-2xl p-5 border border-soot/12 shadow-xl">
          <div className="flex items-center gap-2 text-moss text-xs font-bold uppercase tracking-wider mb-2">
            <CheckCircle2 size={15} className="text-eucalyptus shrink-0" />
            <span className="text-soot">{tag}</span>
          </div>
          <p className="text-sm font-serif-display leading-relaxed italic text-soot mb-2.5">
            &ldquo;{quote}&rdquo;
          </p>
          <div className="text-xs text-moss">
            <span className="font-semibold text-soot">{author}</span> &bull; {role}
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginScreen() {
  const { login, navigate } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) { setError('Please enter your email address.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    setLoading(true);
    setTimeout(() => {
      const result = login(email, password);
      if (!result.success) setError(result.error || 'Login failed.');
      setLoading(false);
    }, 600);
  };

  return (
    <div className="min-h-screen w-full flex bg-plaster text-soot">
      {/* Left Form Column */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 min-h-screen">
        {/* Top Bar */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
          <Logo onClick={() => navigate('landing')} />
          <button
            type="button"
            onClick={() => navigate('landing')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-soot/5 hover:bg-soot/10 border border-soot/10 text-xs font-semibold text-soot transition-all duration-200 cursor-pointer group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Home</span>
          </button>
        </div>

        {/* Centered Form */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="mb-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-soot/5 border border-soot/10 text-moss text-xs font-semibold mb-3.5">
              <Sparkles size={13} className="text-eucalyptus shrink-0" />
              <span>Member Portal</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal font-serif-display text-soot tracking-tight mb-2">
              Welcome back
            </h1>
            <p className="text-moss text-xs sm:text-sm leading-relaxed">
              Sign in to manage your active passes, bookings, and team access.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs sm:text-sm font-medium rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-soot mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-plaster-surface border border-soot/15 text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-soot uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => navigate('forgot-password')}
                  className="text-xs font-medium text-moss hover:text-soot hover:underline transition-colors cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-plaster-surface border border-soot/15 text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-moss hover:text-soot cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-3 disabled:opacity-70"
            >
              {loading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Sign in to Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs sm:text-sm text-moss mt-6 pt-4 border-t border-soot/10">
            Don&apos;t have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('signup')}
              className="text-soot font-bold hover:underline cursor-pointer"
            >
              Create an account
            </button>
          </p>
        </div>

        {/* Bottom Micro Footer */}
        <div className="w-full max-w-md mx-auto text-center text-[11px] text-moss">
          &copy; 2026 Coworking Pass Inc. All rights reserved.
        </div>
      </div>

      {/* Right Visual Image */}
      <AuthVisualBanner
        quote="One single pass gave our distributed team instant access to Riyadh and Jeddah's top workspaces."
        author="Sarah Al-Qahtani"
        role="Head of People & Culture at TechFlow"
      />
    </div>
  );
}

export function SignUpScreen() {
  const { signup, completeSignup, setPendingUser, navigate } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<'individual' | 'organization' | 'provider'>('individual');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [orgName, setOrgName] = useState('');
  const [orgSize, setOrgSize] = useState('');
  const [industry, setIndustry] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [crNumber, setCrNumber] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSelectRoleAndNext = (selectedRole: 'individual' | 'organization' | 'provider') => {
    setRole(selectedRole);
    setStep(2);
  };

  const validateStep2 = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!email.trim()) e.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email address.';
    if (!phone.trim()) e.phone = 'Phone number is required.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (password !== confirm) e.confirm = 'Passwords do not match.';

    if (role === 'organization') {
      if (!orgName.trim()) e.orgName = 'Organization name is required.';
    } else if (role === 'provider') {
      if (!businessName.trim()) e.businessName = 'Partner business name is required.';
    }
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateStep2();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const newUser = signup(name, email, password, phone);
    setPendingUser(newUser);

    if (role === 'organization') {
      (completeSignup as (r: string, d?: unknown) => void)(role, { orgName, orgSize: parseInt(orgSize, 10) || 10, industry });
    } else if (role === 'provider') {
      (completeSignup as (r: string, d?: unknown) => void)(role, { businessName, crNumber });
    } else {
      (completeSignup as (r: string) => void)(role);
    }
  };

  const erdBadge = {
    individual: { label: 'Individual Member', code: 'B2C' },
    organization: { label: 'Organization HR Admin', code: 'HR_ADMIN' },
    provider: { label: 'Space Venue Partner', code: 'PARTNER_ADMIN' },
  }[role];

  return (
    <div className="min-h-screen w-full flex bg-plaster text-soot">
      {/* Left Form Column */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-12 min-h-screen overflow-y-auto">
        {/* Top Header */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto mb-3">
          <Logo onClick={() => navigate('landing')} />
          <button
            type="button"
            onClick={() => (step === 2 ? setStep(1) : navigate('landing'))}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-soot/5 hover:bg-soot/10 border border-soot/10 text-xs font-semibold text-soot transition-all duration-200 cursor-pointer group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>{step === 2 ? 'Change Role' : 'Home'}</span>
          </button>
        </div>

        {/* Center Form */}
        <div className="w-full max-w-md mx-auto my-auto py-2">
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-normal font-serif-display text-soot tracking-tight mb-1">
              {step === 1 ? 'Choose Account Type' : 'Create Account'}
            </h1>
            <p className="text-moss text-xs sm:text-sm leading-relaxed">
              {step === 1
                ? 'Select how you plan to use Coworking Pass'
                : `Step 2 of 2: Registering as ${erdBadge.label}`}
            </p>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-moss' : 'bg-soot/10'}`} />
            <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-moss' : 'bg-soot/10'}`} />
          </div>

          {step === 1 ? (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleSelectRoleAndNext('individual')}
                className="w-full p-4 rounded-2xl border border-soot/12 bg-plaster-surface hover:bg-plaster-dark/40 text-left transition-all duration-200 group shadow-xs hover:shadow-md cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-eucalyptus/25 text-soot flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <UserIcon size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-soot text-sm sm:text-base flex items-center justify-between">
                      <span>Individual Member</span>
                      <Badge variant="eucalyptus">B2C</Badge>
                    </div>
                    <p className="text-xs text-moss mt-1 leading-relaxed">
                      For freelancers, solo workers, and remote employees needing day/monthly desk passes.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRoleAndNext('organization')}
                className="w-full p-4 rounded-2xl border border-soot/12 bg-plaster-surface hover:bg-plaster-dark/40 text-left transition-all duration-200 group shadow-xs hover:shadow-md cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-soot text-plaster flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-soot text-sm sm:text-base flex items-center justify-between">
                      <span>Organization / B2B</span>
                      <Badge variant="soot">HR_ADMIN</Badge>
                    </div>
                    <p className="text-xs text-moss mt-1 leading-relaxed">
                      For corporate teams purchasing employee passes, managing centralized billing and bookings.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleSelectRoleAndNext('provider')}
                className="w-full p-4 rounded-2xl border border-soot/12 bg-plaster-surface hover:bg-plaster-dark/40 text-left transition-all duration-200 group shadow-xs hover:shadow-md cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-mist-light text-soot flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Warehouse size={20} />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-soot text-sm sm:text-base flex items-center justify-between">
                      <span>Space Venue Partner</span>
                      <Badge variant="mist">PARTNER_ADMIN</Badge>
                    </div>
                    <p className="text-xs text-moss mt-1 leading-relaxed">
                      For venue owners listing spaces and tracking check-ins across the Kingdom.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3.5">
              {/* Row 1: Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">Full Name *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                      <UserIcon size={15} />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ahmed Al-Mansoori"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-plaster-surface border border-soot/15 text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs transition-all"
                    />
                  </div>
                  {errors.name && <p className="text-red-500 text-xs mt-0.5 font-medium">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">Phone Number *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                      <Phone size={15} />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+966 55 123 4567"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-plaster-surface border border-soot/15 text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs transition-all"
                    />
                  </div>
                  {errors.phone && <p className="text-red-500 text-xs mt-0.5 font-medium">{errors.phone}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">Email Address *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-plaster-surface border border-soot/15 text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs transition-all"
                  />
                </div>
                {errors.email && <p className="text-red-500 text-xs mt-0.5 font-medium">{errors.email}</p>}
              </div>

              {/* Organization Fields */}
              {role === 'organization' && (
                <div className="p-3.5 rounded-2xl bg-plaster-surface border border-soot/12 space-y-3 shadow-xs">
                  <div className="text-xs font-semibold text-soot uppercase tracking-wider flex items-center justify-between">
                    <span>Company Details</span>
                    <Badge variant="soot">HR_ADMIN</Badge>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-soot mb-1">Company Name *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                        <Building2 size={15} />
                      </div>
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="Saudi Tech Solutions LLC"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-plaster-dark/20 border border-soot/15 text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs"
                      />
                    </div>
                    {errors.orgName && <p className="text-red-500 text-xs mt-0.5 font-medium">{errors.orgName}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-medium text-soot mb-1">Team Size</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-moss">
                          <Users size={14} />
                        </div>
                        <input
                          type="number"
                          min="1"
                          value={orgSize}
                          onChange={(e) => setOrgSize(e.target.value)}
                          placeholder="15"
                          className="w-full pl-8 pr-2 py-2 rounded-xl bg-plaster-dark/20 border border-soot/15 text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-soot mb-1">Industry</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-moss">
                          <Briefcase size={14} />
                        </div>
                        <input
                          type="text"
                          value={industry}
                          onChange={(e) => setIndustry(e.target.value)}
                          placeholder="Technology"
                          className="w-full pl-8 pr-2 py-2 rounded-xl bg-plaster-dark/20 border border-soot/15 text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Provider Fields */}
              {role === 'provider' && (
                <div className="p-3.5 rounded-2xl bg-plaster-surface border border-soot/12 space-y-3 shadow-xs">
                  <div className="text-xs font-semibold text-soot uppercase tracking-wider flex items-center justify-between">
                    <span>Partner Information</span>
                    <Badge variant="mist">PARTNER_ADMIN</Badge>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-soot mb-1">Partner / Brand Name *</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                        <Warehouse size={15} />
                      </div>
                      <input
                        type="text"
                        value={businessName}
                        onChange={(e) => setBusinessName(e.target.value)}
                        placeholder="The Hub Riyadh Holdings"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-plaster-dark/20 border border-soot/15 text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs"
                      />
                    </div>
                    {errors.businessName && <p className="text-red-500 text-xs mt-0.5 font-medium">{errors.businessName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-soot mb-1">CR Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                        <FileText size={15} />
                      </div>
                      <input
                        type="text"
                        value={crNumber}
                        onChange={(e) => setCrNumber(e.target.value)}
                        placeholder="1010xxxxxx"
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-plaster-dark/20 border border-soot/15 text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Password & Confirm Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">Password *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                      <Lock size={15} />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 chars"
                      className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-plaster-surface border border-soot/15 text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-moss hover:text-soot cursor-pointer"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {errors.password && <p className="text-red-500 text-xs mt-0.5 font-medium">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">Confirm Password *</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                      <Lock size={15} />
                    </div>
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-plaster-surface border border-soot/15 text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs transition-all"
                    />
                  </div>
                  {errors.confirm && <p className="text-red-500 text-xs mt-0.5 font-medium">{errors.confirm}</p>}
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5 mt-3"
              >
                <span>Complete Registration & Sign In</span>
                <ArrowRight size={16} />
              </button>
            </form>
          )}

          <p className="text-center text-xs sm:text-sm text-moss mt-4 pt-3 border-t border-soot/10">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => navigate('login')}
              className="text-soot font-bold hover:underline cursor-pointer"
            >
              Log in
            </button>
          </p>
        </div>

        {/* Bottom Micro Footer */}
        <div className="w-full max-w-md mx-auto text-center text-[11px] text-moss mt-2">
          &copy; 2026 Coworking Pass Inc. All rights reserved.
        </div>
      </div>

      {/* Right Image Column */}
      <AuthVisualBanner
        quote="Empowering companies and individuals to work with ultimate flexibility anywhere in Saudi Arabia."
        author="Fahad Al-Husseini"
        role="Operations Director at Nexus Hub"
      />
    </div>
  );
}

export function ChooseAccountType() {
  const { navigate, completeSignup, pendingUser, setPendingUser } = useApp();
  const [selected, setSelected] = useState<'individual' | 'organization' | 'provider' | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgSize, setOrgSize] = useState('');
  const [industry, setIndustry] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [crNumber, setCrNumber] = useState('');

  const handleContinue = () => {
    if (!selected) return;
    if (selected === 'organization' && !orgName.trim()) return;
    if (selected === 'provider' && !businessName.trim()) return;

    if (!pendingUser) {
      const tempUser = {
        id: `user-${Date.now()}`,
        name: 'New Member',
        email: 'member@coworkingpass.sa',
        password: 'password',
        role: selected,
        phone: '+966 50 123 4567',
        avatar: '',
        isBlocked: false,
        joinDate: new Date().toISOString().split('T')[0],
      };
      setPendingUser(tempUser);
    }

    if (selected === 'organization') {
      (completeSignup as (r: string, d?: unknown) => void)(selected, { orgName, orgSize: parseInt(orgSize, 10) || 10, industry: industry || 'Technology' });
    } else if (selected === 'provider') {
      (completeSignup as (r: string, d?: unknown) => void)(selected, { businessName, crNumber });
    } else {
      (completeSignup as (r: string) => void)(selected);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex bg-plaster text-soot">
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-12 min-h-[100dvh] overflow-y-auto">
        <div className="flex items-center justify-between w-full max-w-lg mx-auto mb-4">
          <Logo onClick={() => navigate('landing')} />
          <button
            type="button"
            onClick={() => navigate('landing')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-soot/5 hover:bg-soot/10 border border-soot/10 text-xs font-semibold text-soot transition-all duration-200 cursor-pointer group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Home</span>
          </button>
        </div>

        <div className="w-full max-w-lg mx-auto my-auto py-6">
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-normal font-serif-display text-soot tracking-tight mb-2">
              Finish Setup
            </h1>
            <p className="text-moss text-xs sm:text-sm leading-relaxed">
              Select how you will use Coworking Pass to complete onboarding.
            </p>
          </div>

          <div className="space-y-3 mb-6">
            <button
              type="button"
              onClick={() => setSelected('individual')}
              className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                selected === 'individual'
                  ? 'border-eucalyptus-dark bg-eucalyptus/25 shadow-sm'
                  : 'border-soot/12 bg-plaster-surface hover:bg-plaster-dark/40'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selected === 'individual' ? 'bg-eucalyptus text-soot' : 'bg-soot/10 text-soot'}`}>
                  <UserIcon size={20} />
                </div>
                <div>
                  <div className="font-semibold text-soot text-sm sm:text-base">Individual Member</div>
                  <div className="text-xs text-moss mt-0.5 leading-relaxed">
                    For freelancers, remote workers, and solo professionals looking for flexible workspace.
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelected('organization')}
              className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                selected === 'organization'
                  ? 'border-soot bg-soot text-plaster shadow-sm'
                  : 'border-soot/12 bg-plaster-surface hover:bg-plaster-dark/40'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selected === 'organization' ? 'bg-plaster text-soot' : 'bg-soot/10 text-soot'}`}>
                  <Building2 size={20} />
                </div>
                <div>
                  <div className={`font-semibold text-sm sm:text-base ${selected === 'organization' ? 'text-plaster' : 'text-soot'}`}>Organization / B2B</div>
                  <div className={`text-xs mt-0.5 leading-relaxed ${selected === 'organization' ? 'text-plaster/80' : 'text-moss'}`}>
                    For companies booking spaces for teams, managing multiple employees, and team bookings.
                  </div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setSelected('provider')}
              className={`w-full p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer active:scale-[0.99] ${
                selected === 'provider'
                  ? 'border-mist-dark bg-mist-light/70 shadow-sm'
                  : 'border-soot/12 bg-plaster-surface hover:bg-plaster-dark/40'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-colors ${selected === 'provider' ? 'bg-mist text-soot' : 'bg-soot/10 text-soot'}`}>
                  <Warehouse size={20} />
                </div>
                <div>
                  <div className="font-semibold text-soot text-sm sm:text-base">Space Venue Partner</div>
                  <div className="text-xs text-moss mt-0.5 leading-relaxed">
                    For businesses that own a coworking space and want to list it and track its bookings.
                  </div>
                </div>
              </div>
            </button>
          </div>

          {selected === 'provider' && (
            <div className="bg-plaster-dark/35 rounded-2xl border border-soot/12 p-4 mb-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">Business Name *</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="The Hub Riyadh Holdings"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-plaster-surface border border-soot/15 text-soot placeholder:text-moss/60 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">CR Number</label>
                <input
                  type="text"
                  value={crNumber}
                  onChange={(e) => setCrNumber(e.target.value)}
                  placeholder="1010xxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-plaster-surface border border-soot/15 text-soot placeholder:text-moss/60 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs"
                />
              </div>
            </div>
          )}

          {selected === 'organization' && (
            <div className="bg-plaster-dark/35 rounded-2xl border border-soot/12 p-4 mb-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">Organization Name *</label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  placeholder="Saudi Tech Solutions"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-plaster-surface border border-soot/15 text-soot placeholder:text-moss/60 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">Team Size</label>
                  <input
                    type="number"
                    min="1"
                    value={orgSize}
                    onChange={(e) => setOrgSize(e.target.value)}
                    placeholder="15"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-plaster-surface border border-soot/15 text-soot placeholder:text-moss/60 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">Industry</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    placeholder="Technology"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-plaster-surface border border-soot/15 text-soot placeholder:text-moss/60 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs"
                  />
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={!selected || (selected === 'organization' && !orgName.trim()) || (selected === 'provider' && !businessName.trim())}
            className="btn-primary w-full py-3.5 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Check size={17} className="text-eucalyptus" />
            <span>Complete Setup</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="w-full max-w-lg mx-auto text-center text-[11px] text-moss">
          &copy; 2026 Coworking Pass Inc. All rights reserved.
        </div>
      </div>

      <AuthVisualBanner
        quote="Choose the membership model that suits your exact workflow requirements."
        author="Rayan Al-Ghamdi"
        role="Community Lead"
      />
    </div>
  );
}

export function ForgotPasswordScreen() {
  const { navigate } = useApp();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen w-full flex bg-plaster text-soot">
      {/* Left Form Column */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 min-h-screen">
        {/* Top Header */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
          <Logo onClick={() => navigate('landing')} />
          <button
            type="button"
            onClick={() => navigate('login')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-soot/5 hover:bg-soot/10 border border-soot/10 text-xs font-semibold text-soot transition-all duration-200 cursor-pointer group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Sign in</span>
          </button>
        </div>

        {/* Center Form */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="mb-7">
            {!submitted ? (
              <>
                <h1 className="text-3xl sm:text-4xl font-normal font-serif-display text-soot tracking-tight mb-2">
                  Forgot your password?
                </h1>
                <p className="text-moss text-xs sm:text-sm leading-relaxed">
                  Enter your registered email and we&apos;ll send you a password reset link.
                </p>
              </>
            ) : (
              <div className="text-center sm:text-left">
                <div className="w-12 h-12 rounded-2xl bg-eucalyptus/25 border border-eucalyptus/40 flex items-center justify-center mb-4">
                  <Check size={22} className="text-soot" />
                </div>
                <h1 className="text-3xl font-normal font-serif-display text-soot tracking-tight mb-2">
                  Check your email
                </h1>
                <p className="text-moss text-xs sm:text-sm leading-relaxed">
                  If an account exists for <span className="font-semibold text-soot">{email}</span>, you will receive a reset instructions link shortly.
                </p>
              </div>
            )}
          </div>

          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs sm:text-sm font-medium rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-soot mb-1.5 uppercase tracking-wider">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-plaster-surface border border-soot/15 text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full py-3.5 mt-2"
              >
                <span>Send Reset Link</span>
                <ArrowRight size={16} />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => navigate('login')}
              className="btn-primary w-full py-3.5 mt-2"
            >
              <span>Return to Sign In</span>
            </button>
          )}

          <p className="text-center text-xs sm:text-sm text-moss mt-6 pt-4 border-t border-soot/10">
            Remembered your password?{' '}
            <button
              type="button"
              onClick={() => navigate('login')}
              className="text-soot font-bold hover:underline cursor-pointer"
            >
              Sign in
            </button>
          </p>
        </div>

        {/* Micro Footer */}
        <div className="w-full max-w-md mx-auto text-center text-[11px] text-moss">
          &copy; 2026 Coworking Pass Inc. All rights reserved.
        </div>
      </div>

      {/* Right Visual Image */}
      <AuthVisualBanner
        quote="Account recovery is seamless and protected by industry-standard encryption."
        author="Security Operations"
        role="Coworking Pass Platform"
      />
    </div>
  );
}

export default function AuthPage() {
  const { nav } = useApp();
  if (nav.screen === 'signup') return <SignUpScreen />;
  if (nav.screen === 'choose-type') return <ChooseAccountType />;
  if (nav.screen === 'forgot-password') return <ForgotPasswordScreen />;
  return <LoginScreen />;
}

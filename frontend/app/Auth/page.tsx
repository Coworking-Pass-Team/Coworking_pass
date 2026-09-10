'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  Users,
  ShieldCheck,
  Clock
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const errs: Record<string, string> = {};
    if (!email || !email.trim()) errs.email = 'Email address is required.';
    if (!password) errs.password = 'Password is required.';

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setError('Please fill in all required fields highlighted in red.');
      return;
    }
    setFieldErrors({});

    setLoading(true);
    const result = await login(email, password);
    if (!result.success) {
      setError(result.error || 'Login failed.');
      setLoading(false);
    }
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
                Email Address <span className="text-rose-600">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (fieldErrors.email) setFieldErrors((errs) => ({ ...errs, email: '' }));
                  }}
                  placeholder="name@company.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl bg-plaster-surface border ${
                    fieldErrors.email ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-soot/15 focus-visible:ring-2 focus-visible:ring-eucalyptus'
                  } text-soot placeholder:text-moss/50 text-sm shadow-xs transition-all`}
                />
              </div>
              {fieldErrors.email && <p className="text-xs text-rose-600 font-medium mt-1">* {fieldErrors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-soot uppercase tracking-wider">
                  Password <span className="text-rose-600">*</span>
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
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((errs) => ({ ...errs, password: '' }));
                  }}
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-11 py-3 rounded-xl bg-plaster-surface border ${
                    fieldErrors.password ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-soot/15 focus-visible:ring-2 focus-visible:ring-eucalyptus'
                  } text-soot placeholder:text-moss/50 text-sm shadow-xs transition-all`}
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
              {fieldErrors.password && <p className="text-xs text-rose-600 font-medium mt-1">* {fieldErrors.password}</p>}
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
  const { signup, requestSignupOtp, setPendingUser, navigate } = useApp();

  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<'individual' | 'organization' | 'provider'>('individual');

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [orgName, setOrgName] = useState('');
  const [orgSize, setOrgSize] = useState('');
  const [industry, setIndustry] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [crNumber, setCrNumber] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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
    if (!agreedToTerms) e.agreedToTerms = 'You must agree to the Terms of Service and Privacy Policy.';

    if (role === 'organization') {
      if (!orgName.trim()) e.orgName = 'Organization name is required.';
    } else if (role === 'provider') {
      if (!businessName.trim()) e.businessName = 'Partner business name is required.';
    }
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateStep2();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setLoading(true);
    const newUser = signup(name, email, password, phone);
    setPendingUser(newUser);

    let res;
    if (role === 'organization') {
      res = await requestSignupOtp(newUser, role, { orgName, orgSize: parseInt(orgSize, 10) || 10, industry });
    } else if (role === 'provider') {
      res = await requestSignupOtp(newUser, role, { businessName, crNumber });
    } else {
      res = await requestSignupOtp(newUser, role);
    }

    setLoading(false);
    if (res && !res.success && res.error) {
      setErrors({ global: res.error });
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
                  <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
                    Full Name <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                      <UserIcon size={15} />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ahmed Al-Mansoori"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-plaster-surface border ${
                        errors.name ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-soot/15 focus-visible:ring-2 focus-visible:ring-eucalyptus'
                      } text-soot placeholder:text-moss/50 text-sm shadow-xs transition-all`}
                    />
                  </div>
                  {errors.name && <p className="text-rose-600 text-xs mt-0.5 font-medium">* {errors.name}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
                    Phone Number <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                      <Phone size={15} />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+966 55 123 4567"
                      className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-plaster-surface border ${
                        errors.phone ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-soot/15 focus-visible:ring-2 focus-visible:ring-eucalyptus'
                      } text-soot placeholder:text-moss/50 text-sm shadow-xs transition-all`}
                    />
                  </div>
                  {errors.phone && <p className="text-rose-600 text-xs mt-0.5 font-medium">* {errors.phone}</p>}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-soot mb-1 uppercase tracking-wider">
                  Email Address <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                    <Mail size={15} />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className={`w-full pl-9 pr-3 py-2.5 rounded-xl bg-plaster-surface border ${
                      errors.email ? 'border-rose-500 ring-2 ring-rose-500/20' : 'border-soot/15 focus-visible:ring-2 focus-visible:ring-eucalyptus'
                    } text-soot placeholder:text-moss/50 text-sm shadow-xs transition-all`}
                  />
                </div>
                {errors.email && <p className="text-rose-600 text-xs mt-0.5 font-medium">* {errors.email}</p>}
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

              {/* Terms and Policies Agreement Checkbox */}
              <div className="pt-2">
                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-moss select-none">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={(e) => {
                      setAgreedToTerms(e.target.checked);
                      if (errors.agreedToTerms) {
                        setErrors((prev) => {
                          const copy = { ...prev };
                          delete copy.agreedToTerms;
                          return copy;
                        });
                      }
                    }}
                    className="mt-0.5 h-4 w-4 rounded border-soot/20 text-soot focus:ring-eucalyptus accent-soot cursor-pointer shrink-0"
                  />
                  <span className="leading-relaxed">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={(evt) => {
                        evt.preventDefault();
                        navigate('terms-of-service');
                      }}
                      className="text-soot font-bold underline hover:text-emerald-800 cursor-pointer"
                    >
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={(evt) => {
                        evt.preventDefault();
                        navigate('privacy-policy');
                      }}
                      className="text-soot font-bold underline hover:text-emerald-800 cursor-pointer"
                    >
                      Privacy Policy
                    </button>{' '}
                    <span className="text-rose-600">*</span>
                  </span>
                </label>
                {errors.agreedToTerms && (
                  <p className="text-rose-600 text-xs mt-1 font-medium">* {errors.agreedToTerms}</p>
                )}
              </div>

              {errors.global && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs sm:text-sm font-medium rounded-xl px-4 py-3 mt-2">
                  {errors.global}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3.5 mt-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span>Registering account...</span>
                ) : (
                  <>
                    <span>Complete Registration & Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
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
  const { navigate, requestSignupOtp, pendingUser, setPendingUser } = useApp();
  const [selected, setSelected] = useState<'individual' | 'organization' | 'provider' | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgSize, setOrgSize] = useState('');
  const [industry, setIndustry] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [crNumber, setCrNumber] = useState('');

  const handleContinue = async () => {
    if (!selected) return;
    if (selected === 'organization' && !orgName.trim()) return;
    if (selected === 'provider' && !businessName.trim()) return;

    const targetUser = pendingUser || {
      id: `user-${Date.now()}`,
      name: 'New Member',
      username: `user_${Date.now().toString().slice(-4)}`,
      email: 'member@coworkingpass.sa',
      password: 'password',
      role: selected,
      phone: '+966 50 123 4567',
      avatar: '',
      isBlocked: false,
      joinDate: new Date().toISOString().split('T')[0],
      loyaltyPoints: 0,
    };
    if (!pendingUser) setPendingUser(targetUser);

    if (selected === 'organization') {
      await requestSignupOtp(targetUser as any, selected, { orgName, orgSize: parseInt(orgSize, 10) || 10, industry: industry || 'Technology' });
    } else if (selected === 'provider') {
      await requestSignupOtp(targetUser as any, selected, { businessName, crNumber });
    } else {
      await requestSignupOtp(targetUser as any, selected);
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
  const { navigate, requestForgotPasswordOtp } = useApp();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    const res = requestForgotPasswordOtp(email.trim());
    if (!res.success) {
      setError(res.error || 'No account found with this email address.');
      setLoading(false);
    }
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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-eucalyptus/20 border border-eucalyptus/40 text-soot text-xs font-semibold mb-3.5">
              <ShieldCheck size={14} className="text-emerald-800 shrink-0" />
              <span>Password Recovery</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal font-serif-display text-soot tracking-tight mb-2">
              Forgot your password?
            </h1>
            <p className="text-moss text-xs sm:text-sm leading-relaxed">
              Enter your registered account email and we&apos;ll send a 6-digit one-time verification code to reset your password.
            </p>
          </div>

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
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-plaster-surface border border-soot/15 text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Sending code...</span>
              ) : (
                <>
                  <span>Send Verification Code</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

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
        quote="Account recovery is seamless and protected by two-factor verification across the network."
        author="Security Operations"
        role="Coworking Pass Platform"
      />
    </div>
  );
}

export function OtpVerificationScreen() {
  const { otpSession, verifyOtp, resendOtp, cancelOtp, navigate } = useApp();
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input & reset form on OTP session change
  useEffect(() => {
    setLoading(false);
    setDigits(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
  }, [otpSession?.targetEmailOrPhone, otpSession?.mode, otpSession?.userId]);

  // Timer countdown
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleDigitChange = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const nextDigits = [...digits];
      nextDigits[index] = '';
      setDigits(nextDigits);
      return;
    }

    const lastChar = cleaned[cleaned.length - 1];
    const nextDigits = [...digits];
    nextDigits[index] = lastChar;
    setDigits(nextDigits);
    setError('');

    if (index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        const nextDigits = [...digits];
        nextDigits[index - 1] = '';
        setDigits(nextDigits);
        inputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const nextDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = pasteData[i] || '';
    }
    setDigits(nextDigits);
    setError('');

    const focusIndex = Math.min(pasteData.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < 6) {
      setError('Please enter all 6 digits of the verification code.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await verifyOtp(code);
      if (!res.success) {
        setError(res.error || 'Invalid verification code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (!canResend) return;
    resendOtp();
    setCountdown(60);
    setCanResend(false);
    setError('');
  };

  const recipient = otpSession?.targetEmailOrPhone || 'your registered contact';
  const isSignup = otpSession?.mode === 'signup';
  const isForgotPassword = otpSession?.mode === 'forgot-password';

  return (
    <div className="min-h-screen w-full flex bg-plaster text-soot">
      {/* Left Form Column */}
      <div className="w-full lg:w-1/2 flex flex-col justify-between p-6 sm:p-10 lg:p-14 min-h-screen">
        {/* Top Header */}
        <div className="flex items-center justify-between w-full max-w-md mx-auto">
          <Logo onClick={() => navigate('landing')} />
          <button
            type="button"
            onClick={cancelOtp}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-soot/5 hover:bg-soot/10 border border-soot/10 text-xs font-semibold text-soot transition-all duration-200 cursor-pointer group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>{isSignup ? 'Back to Sign Up' : isForgotPassword ? 'Back to Forgot Password' : 'Back to Sign In'}</span>
          </button>
        </div>

        {/* Center Content */}
        <div className="w-full max-w-md mx-auto my-auto py-8">
          <div className="mb-7">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-eucalyptus/20 border border-eucalyptus/40 text-soot text-xs font-semibold mb-3.5">
              <ShieldCheck size={14} className="text-emerald-800 shrink-0" />
              <span>{isForgotPassword ? 'Password Recovery Verification' : 'Two-Factor Security Verification'}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal font-serif-display text-soot tracking-tight mb-2">
              Enter verification code
            </h1>
            <p className="text-moss text-xs sm:text-sm leading-relaxed">
              We&apos;ve sent a 6-digit one-time code to{' '}
              <span className="font-semibold text-soot">{recipient}</span>. Enter the code below to {isSignup ? 'complete your account registration' : isForgotPassword ? 'verify your identity and reset your password' : 'complete your sign in'}.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs sm:text-sm font-medium rounded-xl px-4 py-3">
                {error}
              </div>
            )}



            {/* 6 Digit Input Boxes */}
            <div>
              <label className="block text-xs font-semibold text-soot mb-2.5 uppercase tracking-wider text-center">
                6-Digit Security Code
              </label>
              <div className="flex items-center justify-center gap-2 sm:gap-3">
                {digits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => { inputRefs.current[idx] = el; }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(idx, e)}
                    onPaste={handlePaste}
                    className={`w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono rounded-2xl bg-plaster-surface border ${
                      digit
                        ? 'border-eucalyptus bg-white ring-2 ring-eucalyptus/20 text-soot'
                        : 'border-soot/15 text-soot focus:border-eucalyptus focus:ring-2 focus:ring-eucalyptus'
                    } shadow-xs transition-all outline-none`}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || digits.join('').length < 6}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <span>Verifying code...</span>
              ) : (
                <>
                  <span>Verify & Continue</span>
                  <CheckCircle2 size={16} />
                </>
              )}
            </button>
          </form>

          {/* Resend & Timer */}
          <div className="mt-6 text-center text-xs text-moss space-y-2">
            <div>
              {!canResend ? (
                <span className="flex items-center justify-center gap-1.5 font-medium">
                  <Clock size={13} className="text-moss" />
                  <span>Resend code in {Math.floor(countdown / 60)}:{countdown % 60 < 10 ? `0${countdown % 60}` : countdown % 60}</span>
                </span>
              ) : (
                <span>
                  Didn&apos;t receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    className="text-soot font-bold hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                </span>
              )}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={cancelOtp}
                className="text-moss hover:text-soot underline transition-colors cursor-pointer text-[11px]"
              >
                Use a different account or return
              </button>
            </div>
          </div>
        </div>

        {/* Micro Footer */}
        <div className="w-full max-w-md mx-auto text-center text-[11px] text-moss">
          &copy; 2026 Coworking Pass Inc. All rights reserved.
        </div>
      </div>

      {/* Right Visual Image */}
      <AuthVisualBanner
        quote="Multi-factor authentication guarantees trusted and authenticated identity verification across all spaces in Saudi Arabia."
        author="Security Operations"
        role="Coworking Pass Platform"
        tag="Two-Factor Verified Access"
      />
    </div>
  );
}

export function ResetPasswordScreen() {
  const { navigate, resetPassword, pendingResetUser } = useApp();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter a new password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify and try again.');
      return;
    }

    setError('');
    setLoading(true);

    setTimeout(() => {
      const res = resetPassword(password);
      if (!res.success) {
        setError(res.error || 'Failed to update password.');
        setLoading(false);
      }
    }, 400);
  };

  const userEmail = pendingResetUser?.email || pendingResetUser?.username || 'your account';

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
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-eucalyptus/20 border border-eucalyptus/40 text-soot text-xs font-semibold mb-3.5">
              <Lock size={14} className="text-emerald-800 shrink-0" />
              <span>Identity Verified</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal font-serif-display text-soot tracking-tight mb-2">
              Set new password
            </h1>
            <p className="text-moss text-xs sm:text-sm leading-relaxed">
              Create a new secure password for <span className="font-semibold text-soot">{userEmail}</span>.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-700 text-xs sm:text-sm font-medium rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-soot mb-1.5 uppercase tracking-wider">
                New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                  <Lock size={16} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-plaster-surface border border-soot/15 text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-moss hover:text-soot cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-soot mb-1.5 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-moss">
                  <Lock size={16} />
                </div>
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError('');
                  }}
                  placeholder="Repeat new password"
                  className="w-full pl-10 pr-11 py-3 rounded-xl bg-plaster-surface border border-soot/15 text-soot placeholder:text-moss/50 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-eucalyptus shadow-xs transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-moss hover:text-soot cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirmPassword}
              className="btn-primary w-full py-3.5 mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Saving new password...</span>
              ) : (
                <>
                  <span>Save Password & Sign In</span>
                  <CheckCircle2 size={16} />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs sm:text-sm text-moss mt-6 pt-4 border-t border-soot/10">
            Cancel and return to{' '}
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
        quote="A strong and updated password keeps your workspaces, teams, and billing secure across Saudi Arabia."
        author="Account Security"
        role="Coworking Pass Platform"
        tag="Secure Password Reset"
      />
    </div>
  );
}

export default function AuthPage() {
  const { nav } = useApp();
  if (nav.screen === 'signup') return <SignUpScreen />;
  if (nav.screen === 'choose-type') return <ChooseAccountType />;
  if (nav.screen === 'forgot-password') return <ForgotPasswordScreen />;
  if (nav.screen === 'otp-verify') return <OtpVerificationScreen />;
  if (nav.screen === 'reset-password') return <ResetPasswordScreen />;
  return <LoginScreen />;
}

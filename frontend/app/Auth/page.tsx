'use client';
import { useState } from 'react';
import { Eye, EyeOff, Building2, User, ArrowRight } from 'lucide-react';
import { useApp } from '@/app/store';
import LogoImage from '@/components/layout/logo';


function Logo({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5">
      <LogoImage className="w-8 h-8 rounded-lg" />
      <span className="font-semibold text-soot text-[15px]">
        Coworking Pass
      </span>
    </button>
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
    <div className="min-h-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <Logo onClick={() => navigate('landing')} />
          </div>
          <h1 className="text-2xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>Welcome back</h1>
          <p className="text-moss text-sm mt-1">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-moss mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus focus:ring-2 focus:ring-eucalyptus/20 placeholder:text-moss/50"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-moss mb-1.5">
              Password
            </label>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 pr-10 rounded-xl border border-soot/12 bg-white text-soot text-sm outline-none focus:border-eucalyptus focus:ring-2 focus:ring-eucalyptus/20 placeholder:text-moss/50"
              />

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-moss hover:text-soot"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end -mt-2">
            <button
              type="button"
              onClick={() => alert('Password reset feature coming soon.')}
              className="text-xs text-moss hover:text-soot hover:underline transition-colors"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-soot text-plaster font-semibold text-sm hover:bg-soot-light disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Signing in...' : 'Sign in'}
            {!loading && <ArrowRight size={15} />}
          </button>

        </form>

        <p className="text-center text-sm text-moss mt-5">
          No account?{' '}
          <button onClick={() => navigate('signup')} className="text-soot font-medium hover:underline">
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}

export function SignUpScreen() {
  const { signup, navigate, setPendingUser } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Full name is required.';
    if (!email.trim()) e.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Enter a valid email.';
    if (!phone.trim()) e.phone = 'Phone number is required.';
    if (!password) e.password = 'Password is required.';
    else if (password.length < 6) e.password = 'Password must be at least 6 characters.';
    if (password !== confirm) e.confirm = 'Passwords do not match.';
    return e;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    const newUser = signup(name, email, password, phone);
    setPendingUser(newUser);
    navigate('choose-type');
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-5">
            <Logo onClick={() => navigate('landing')} />
          </div>
          <h1 className="text-2xl text-soot" style={{ fontFamily: 'DM Serif Display, serif' }}>Create account</h1>
          <p className="text-moss text-sm mt-1">Join Coworking Pass today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Full name" error={errors.name}>
            <input
              value={name} onChange={e => setName(e.target.value)}
              placeholder="Ahmed Al-Mansoori"
              className={inputCls(!!errors.name)}
            />
          </Field>

          <Field label="Email address" error={errors.email}>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputCls(!!errors.email)}
            />
          </Field>

          <Field label="Phone number" error={errors.phone}>
            <input
              type="tel" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+966 55 123 4567"
              className={inputCls(!!errors.phone)}
            />
          </Field>

          <Field label="Password" error={errors.password}>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                className={inputCls(!!errors.password) + ' pr-10'}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-moss">
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </Field>

          <Field label="Confirm password" error={errors.confirm}>
            <input
              type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="Re-enter password"
              className={inputCls(!!errors.confirm)}
            />
          </Field>

          <button type="submit" className="w-full py-3 rounded-xl bg-soot text-plaster font-semibold text-sm hover:bg-soot-light transition-colors flex items-center justify-center gap-2">
            Continue
            <ArrowRight size={15} />
          </button>
        </form>

        <p className="text-center text-sm text-moss mt-5">
          Already have an account?{' '}
          <button onClick={() => navigate('login')} className="text-soot font-medium hover:underline">Log in</button>
        </p>
      </div>
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `w-full px-4 py-2.5 rounded-xl border ${hasError ? 'border-red-300 focus:border-red-400' : 'border-soot/12 focus:border-eucalyptus'} bg-white text-soot text-sm outline-none focus:ring-2 ${hasError ? 'focus:ring-red-100' : 'focus:ring-eucalyptus/20'} placeholder:text-moss/50`;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-moss mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

export function ChooseAccountType() {
  const { navigate, completeSignup, pendingUser } = useApp();
  const [selected, setSelected] = useState<'individual' | 'organization' | null>(null);
  const [orgName, setOrgName] = useState('');
  const [orgSize, setOrgSize] = useState('');
  const [industry, setIndustry] = useState('');

  const handleContinue = () => {
    if (!selected) return;
    if (!pendingUser) { navigate('login'); return; }
    if (selected === 'organization' && !orgName.trim()) return;
    completeSignup(selected, selected === 'organization' ? { orgName, orgSize: parseInt(orgSize) || 10, industry } : undefined);
  };

  return (
    <div className="min-h-full flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Logo onClick={() => navigate('landing')} />
          <h1 className="text-2xl text-soot mt-5" style={{ fontFamily: 'DM Serif Display, serif' }}>How will you use Coworking Pass?</h1>
          <p className="text-moss text-sm mt-2">Choose your account type to get started</p>
        </div>

        <div className="space-y-3 mb-6">
          <button
            onClick={() => setSelected('individual')}
            className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
              selected === 'individual' ? 'border-eucalyptus bg-eucalyptus/10' : 'border-soot/10 bg-white hover:border-eucalyptus/40'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selected === 'individual' ? 'bg-eucalyptus' : 'bg-soot/8'}`}>
                <User size={18} className={selected === 'individual' ? 'text-soot' : 'text-moss'} />
              </div>
              <div>
                <div className="font-semibold text-soot">Individual</div>
                <div className="text-sm text-moss mt-0.5 leading-relaxed">
                  For freelancers, remote workers, and solo professionals looking for flexible workspace.
                </div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelected('organization')}
            className={`w-full p-5 rounded-2xl border-2 text-left transition-all ${
              selected === 'organization' ? 'border-eucalyptus bg-eucalyptus/10' : 'border-soot/10 bg-white hover:border-eucalyptus/40'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${selected === 'organization' ? 'bg-eucalyptus' : 'bg-soot/8'}`}>
                <Building2 size={18} className={selected === 'organization' ? 'text-soot' : 'text-moss'} />
              </div>
              <div>
                <div className="font-semibold text-soot">Organization</div>
                <div className="text-sm text-moss mt-0.5 leading-relaxed">
                  For companies booking spaces for teams, managing multiple employees, and team bookings.
                </div>
              </div>
            </div>
          </button>
        </div>

        {selected === 'organization' && (
          <div className="bg-white rounded-2xl border border-soot/8 p-5 mb-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-moss mb-1.5">Organization name <span className="text-red-400">*</span></label>
              <input
                value={orgName} onChange={e => setOrgName(e.target.value)}
                placeholder="Saudi Tech Solutions"
                className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-moss mb-1.5">Team size</label>
                <input
                  type="number" min="1"
                  value={orgSize} onChange={e => setOrgSize(e.target.value)}
                  placeholder="e.g. 15"
                  className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-moss mb-1.5">Industry</label>
                <input
                  value={industry} onChange={e => setIndustry(e.target.value)}
                  placeholder="e.g. Technology"
                  className="w-full px-4 py-2.5 rounded-xl border border-soot/12 bg-plaster text-soot text-sm outline-none focus:border-eucalyptus"
                />
              </div>
            </div>
          </div>
        )}

        <button
          onClick={handleContinue}
          disabled={!selected || (selected === 'organization' && !orgName.trim())}
          className="w-full py-3 rounded-xl bg-soot text-plaster font-semibold text-sm hover:bg-soot-light disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
        >
          Go to my dashboard
          <ArrowRight size={15} />
        </button>
      </div>
    </div>
  );
}

export default function AuthPage() {
  const { nav } = useApp();
  if (nav.screen === 'signup') return <SignUpScreen />;
  if (nav.screen === 'choose-type') return <ChooseAccountType />;
  return <LoginScreen />;
}

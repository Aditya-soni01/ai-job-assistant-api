import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { authStore } from '@/store/authStore';
import apiClient from '@/lib/api';
import { CheckCircle, AlertCircle, LogOut, X, Zap } from 'lucide-react';

type Tab = 'account' | 'preferences' | 'subscription';

interface Resume {
  id: number;
  optimized_content: string | null;
}

const FREE_LIMIT = 5;

const SettingsPage: React.FC = () => {
  const { user, logout } = authStore();
  const [activeTab, setActiveTab] = useState<Tab>('account');

  // Account form
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
  });
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');

  // Password form
  const [pwModal, setPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');

  // Preferences
  const [tone, setTone] = useState(
    () => localStorage.getItem('resumeTone') || 'Professional'
  );
  const [defaultFormat, setDefaultFormat] = useState(
    () => localStorage.getItem('defaultFormat') || 'PDF'
  );

  // Upgrade modal
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState(user?.email || '');
  const [waitlistDone, setWaitlistDone] = useState(false);

  // Usage data
  const { data: resumes = [] } = useQuery<Resume[]>({
    queryKey: ['resumes'],
    queryFn: () => apiClient.get<Resume[]>('/resumes').then((r) => r.data),
  });
  const optimizationsUsed = resumes.filter((r) => r.optimized_content).length;
  const usagePercent = Math.min(100, Math.round((optimizationsUsed / FREE_LIMIT) * 100));

  // Mutations
  const saveMutation = useMutation({
    mutationFn: () =>
      apiClient.put('/auth/me', {
        first_name: formData.first_name || undefined,
        last_name: formData.last_name || undefined,
      }),
    onSuccess: (res) => {
      authStore.getState().setUser(res.data);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    },
    onError: () => {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2500);
    },
  });

  const pwMutation = useMutation({
    mutationFn: () =>
      apiClient.put('/auth/change-password', {
        current_password: pwForm.current,
        new_password: pwForm.next,
      }),
    onSuccess: () => {
      setPwModal(false);
      setPwForm({ current: '', next: '', confirm: '' });
      setPwError('');
    },
    onError: (err: any) => {
      setPwError(err.response?.data?.detail || 'Password change failed.');
    },
  });

  const handlePwSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) { setPwError("Passwords don't match."); return; }
    if (pwForm.next.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    pwMutation.mutate();
  };

  const handleSavePreferences = () => {
    localStorage.setItem('resumeTone', tone);
    localStorage.setItem('defaultFormat', defaultFormat);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);
  };

  const tabs: Array<{ key: Tab; label: string }> = [
    { key: 'account', label: 'Account' },
    { key: 'preferences', label: 'Preferences' },
    { key: 'subscription', label: 'Subscription' },
  ];

  return (
    <div className="min-h-screen bg-[#051424] p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-4xl font-bold tracking-tight text-[#d4e4fa] mb-1">Settings</h2>
        <p className="mono-label text-[#cbc3d7]/60 text-sm uppercase tracking-widest">
          Account · Preferences · Subscription
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit mb-8" style={{ background: 'rgba(39,54,71,0.4)' }}>
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === key
                ? 'text-[#d0bcff] bg-[#273647]/80'
                : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── ACCOUNT TAB ─────────────────────────────────────────────── */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-[#273647]/10 space-y-5">
            <h3 className="font-bold text-[#d4e4fa]">Profile</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(['first_name', 'last_name'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs mono-label text-slate-500 uppercase tracking-widest mb-1.5">
                    {field === 'first_name' ? 'First Name' : 'Last Name'}
                  </label>
                  <input
                    type="text"
                    value={formData[field]}
                    onChange={(e) => setFormData((p) => ({ ...p, [field]: e.target.value }))}
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-[#d4e4fa] bg-transparent focus:outline-none focus:ring-1 focus:ring-[#d0bcff]/40"
                    style={{ background: 'rgba(39,54,71,0.4)', border: '1px solid rgba(73,68,84,0.3)' }}
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-xs mono-label text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
              <input
                type="email"
                value={formData.email}
                readOnly
                className="w-full rounded-xl px-4 py-2.5 text-sm text-slate-500 bg-transparent cursor-not-allowed"
                style={{ background: 'rgba(39,54,71,0.2)', border: '1px solid rgba(73,68,84,0.2)' }}
              />
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="px-6 py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)', color: '#340080' }}
              >
                {saveMutation.isPending ? 'Saving…' : 'Save Changes'}
              </button>
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1.5 text-sm text-[#4edea3]">
                  <CheckCircle className="w-4 h-4" />Saved
                </span>
              )}
              {saveStatus === 'error' && (
                <span className="flex items-center gap-1.5 text-sm text-[#ffb4ab]">
                  <AlertCircle className="w-4 h-4" />Failed
                </span>
              )}
            </div>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-[#273647]/10 space-y-4">
            <h3 className="font-bold text-[#d4e4fa]">Security</h3>
            <button
              onClick={() => { setPwModal(true); setPwError(''); setPwForm({ current: '', next: '', confirm: '' }); }}
              className="text-sm font-semibold text-[#d0bcff] hover:underline"
            >
              Change Password →
            </button>
          </div>

          <div className="glass-card rounded-2xl p-6 border border-[#273647]/10">
            <h3 className="font-bold text-[#d4e4fa] mb-4">Session</h3>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm font-semibold text-[#ffb4ab] hover:opacity-80 transition-opacity"
            >
              <LogOut className="w-4 h-4" />Logout
            </button>
          </div>
        </div>
      )}

      {/* ── PREFERENCES TAB ──────────────────────────────────────────── */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          <div className="glass-card rounded-2xl p-6 border border-[#273647]/10 space-y-5">
            <h3 className="font-bold text-[#d4e4fa]">Resume Preferences</h3>
            <div>
              <label className="block text-xs mono-label text-slate-500 uppercase tracking-widest mb-2">Resume Tone</label>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full rounded-xl px-4 py-2.5 text-sm text-[#d4e4fa] focus:outline-none"
                style={{ background: 'rgba(39,54,71,0.4)', border: '1px solid rgba(73,68,84,0.3)' }}
              >
                {['Professional', 'Concise', 'Detailed', 'Creative'].map((t) => (
                  <option key={t} value={t} className="bg-[#122131]">{t}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1.5">Controls the AI writing style when optimizing your resume.</p>
            </div>
            <div>
              <label className="block text-xs mono-label text-slate-500 uppercase tracking-widest mb-2">Default Download Format</label>
              <div className="flex gap-3">
                {['PDF', 'DOCX'].map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setDefaultFormat(fmt)}
                    className={`px-5 py-2 rounded-xl text-sm font-semibold transition-all ${
                      defaultFormat === fmt
                        ? 'text-[#340080]'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    style={defaultFormat === fmt
                      ? { background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)' }
                      : { background: 'rgba(39,54,71,0.4)', border: '1px solid rgba(73,68,84,0.3)' }}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSavePreferences}
                className="px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)', color: '#340080' }}
              >
                Save Preferences
              </button>
              {saveStatus === 'saved' && (
                <span className="flex items-center gap-1.5 text-sm text-[#4edea3]">
                  <CheckCircle className="w-4 h-4" />Saved
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBSCRIPTION TAB ─────────────────────────────────────────── */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          {/* Usage */}
          <div className="glass-card rounded-2xl p-6 border border-[#273647]/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="mono-label text-xs font-bold text-[#d0bcff] uppercase tracking-widest mb-0.5">Current Plan: Free</p>
                <p className="text-sm text-[#cbc3d7]">{optimizationsUsed} of {FREE_LIMIT} optimizations used this month</p>
              </div>
            </div>
            <div className="w-full h-2.5 rounded-full bg-[#273647]/60 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${usagePercent}%`, background: 'linear-gradient(90deg, #d0bcff 0%, #4edea3 100%)' }}
              />
            </div>
          </div>

          {/* Plan comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Free plan */}
            <div className="glass-card rounded-2xl p-6 border border-[#273647]/20 space-y-4">
              <div>
                <p className="mono-label text-xs text-slate-500 uppercase tracking-widest mb-1">Current</p>
                <h3 className="text-xl font-bold text-[#d4e4fa]">Free</h3>
                <p className="text-slate-500 text-sm">₹0 / month</p>
              </div>
              <ul className="space-y-2 text-sm text-[#cbc3d7]">
                {[
                  '5 optimizations / month',
                  'Basic ATS score',
                  'PDF download',
                  'Resume comparison view',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-[#4edea3]">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                disabled
                className="w-full py-2.5 rounded-xl text-sm font-bold text-slate-600 cursor-default"
                style={{ background: 'rgba(39,54,71,0.3)', border: '1px solid rgba(73,68,84,0.2)' }}
              >
                Current Plan
              </button>
            </div>

            {/* Pro plan */}
            <div
              className="rounded-2xl p-6 space-y-4 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, rgba(208,188,255,0.08) 0%, rgba(78,222,163,0.06) 100%)',
                border: '1px solid rgba(208,188,255,0.25)',
              }}
            >
              <div
                className="absolute top-3 right-3 mono-label text-[10px] font-bold px-2.5 py-1 rounded-full uppercase"
                style={{ background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)', color: '#340080' }}
              >
                Recommended
              </div>
              <div>
                <p className="mono-label text-xs text-[#d0bcff] uppercase tracking-widest mb-1">Upgrade</p>
                <h3 className="text-xl font-bold text-[#d4e4fa]">Pro</h3>
                <p className="text-[#4edea3] text-sm font-semibold">₹499 / month</p>
              </div>
              <ul className="space-y-2 text-sm text-[#cbc3d7]">
                {[
                  'Unlimited optimizations',
                  'Advanced ATS insights',
                  'PDF + DOCX downloads',
                  'Section-by-section AI rewrite',
                  'Resume comparison view',
                  'Multiple resume versions',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-[#4edea3]">✓</span>{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setUpgradeModal(true)}
                className="w-full py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)', color: '#340080' }}
              >
                Upgrade to Pro →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Password Modal ───────────────────────────────────────────── */}
      {pwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div
            className="w-full max-w-md rounded-2xl p-6 space-y-5"
            style={{ background: 'rgba(13,28,45,0.98)', border: '1px solid rgba(73,68,84,0.3)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-[#d4e4fa]">Change Password</h3>
              <button onClick={() => setPwModal(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePwSubmit} className="space-y-4">
              {(['current', 'next', 'confirm'] as const).map((field) => (
                <div key={field}>
                  <label className="block text-xs mono-label text-slate-500 uppercase tracking-widest mb-1.5">
                    {field === 'current' ? 'Current Password' : field === 'next' ? 'New Password' : 'Confirm New Password'}
                  </label>
                  <input
                    type="password"
                    value={pwForm[field]}
                    onChange={(e) => setPwForm((p) => ({ ...p, [field]: e.target.value }))}
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-[#d4e4fa] bg-transparent focus:outline-none focus:ring-1 focus:ring-[#d0bcff]/40"
                    style={{ background: 'rgba(39,54,71,0.4)', border: '1px solid rgba(73,68,84,0.3)' }}
                    required
                  />
                </div>
              ))}
              {pwError && (
                <p className="flex items-center gap-2 text-sm text-[#ffb4ab]">
                  <AlertCircle className="w-4 h-4" />{pwError}
                </p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={pwMutation.isPending}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)', color: '#340080' }}
                >
                  {pwMutation.isPending ? 'Saving…' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={() => setPwModal(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white transition-colors"
                  style={{ background: 'rgba(39,54,71,0.4)', border: '1px solid rgba(73,68,84,0.2)' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Upgrade Modal ────────────────────────────────────────────── */}
      {upgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <div
            className="w-full max-w-md rounded-2xl p-8 text-center space-y-5"
            style={{ background: 'rgba(13,28,45,0.98)', border: '1px solid rgba(208,188,255,0.2)' }}
          >
            <button onClick={() => setUpgradeModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{ background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)' }}>
              <Zap className="w-7 h-7 text-[#340080]" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#d4e4fa] mb-1">Payment integration coming soon</h3>
              <p className="text-sm text-[#cbc3d7]/70">Join the waitlist and we'll notify you when Pro launches.</p>
            </div>
            {!waitlistDone ? (
              <div className="space-y-3">
                <input
                  type="email"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl px-4 py-2.5 text-sm text-[#d4e4fa] bg-transparent focus:outline-none focus:ring-1 focus:ring-[#d0bcff]/40 text-center"
                  style={{ background: 'rgba(39,54,71,0.4)', border: '1px solid rgba(73,68,84,0.3)' }}
                />
                <button
                  onClick={() => setWaitlistDone(true)}
                  className="w-full py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                  style={{ background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)', color: '#340080' }}
                >
                  Notify Me
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2 text-[#4edea3] font-semibold">
                <CheckCircle className="w-5 h-5" />You're on the waitlist!
              </div>
            )}
            <button onClick={() => setUpgradeModal(false)} className="text-xs text-slate-600 hover:text-slate-400">
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;

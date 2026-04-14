import React, { useState } from 'react';
import { Check, Zap, X, CheckCircle, FileText, ChevronDown, Flame, Sparkles } from 'lucide-react';
import { authStore } from '@/store/authStore';

// TODO: map plan IDs to backend billing tiers when payment is wired
// TODO: gate feature visibility (template count, optimization limits) from user.plan_tier

// ─── Config ───────────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  name: string;
  tagline: string;
  helperText: string;
  price: number;
  currency: string;
  visibleFeatures: string[];   // shown by default (4–5)
  hiddenFeatures: string[];    // revealed on expand
  ctaLabel: string;
  ctaStyle: 'muted' | 'outlined' | 'gradient';
  badge?: string;
  highlighted?: boolean;
  stats?: { label: string; value: string }[];
  templateCount: string;
  templateQuality: string;
  templateLabel: string;
  templateExamples: string[];  // max 3 chips shown below
  isCurrent?: boolean;
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    tagline: 'Perfect to explore RoleGenie',
    helperText: 'Good to get started, not enough to get hired',
    price: 0,
    currency: '₹',
    visibleFeatures: [
      '3 resume optimizations / month',
      'Basic ATS match score',
      'Basic keyword match',
      '1 resume template',
    ],
    hiddenFeatures: [
      'Limited JD matching',
      'PDF download',
    ],
    ctaLabel: 'Current Plan',
    ctaStyle: 'muted',
    templateCount: '1',
    templateQuality: 'ATS-friendly',
    templateLabel: '1 essential ATS-optimised template',
    templateExamples: ['ATS-friendly classic'],
    isCurrent: true,
  },
  {
    id: 'job-seeker',
    name: 'Job Seeker',
    tagline: 'For active job hunters',
    helperText: 'Apply smarter, not harder',
    price: 299,
    currency: '₹',
    visibleFeatures: [
      '30 AI resume optimizations / month',
      'JD-based resume tailoring',
      'Keyword gap analysis',
      '5 resume templates',
    ],
    hiddenFeatures: [
      'Resume comparison (before/after)',
      'Cover letter generator',
      'PDF + DOCX download',
    ],
    ctaLabel: 'Upgrade to Job Seeker',
    ctaStyle: 'outlined',
    templateCount: '5',
    templateQuality: 'Recruiter-friendly layouts',
    templateLabel: '5 tailored templates for different application styles',
    templateExamples: ['ATS-friendly', 'Modern professional', 'Clean executive'],
  },
  {
    id: 'interview-cracker',
    name: 'Interview Cracker',
    tagline: 'For serious candidates who want results',
    helperText: 'Built for people serious about getting hired fast',
    price: 799,
    currency: '₹',
    visibleFeatures: [
      'Unlimited optimizations',
      'AI resume rewriting',
      'Interview question generator',
      '10+ premium resume templates',
      'High-paying job optimization (₹15L+)',
    ],
    hiddenFeatures: [
      'Recruiter rejection insights',
      'STAR bullet generator',
      'Multiple resume versions',
      'Interview Prediction Engine',
      'Priority support',
      'PDF + DOCX download',
    ],
    ctaLabel: 'Upgrade to Interview Cracker',
    ctaStyle: 'gradient',
    badge: 'Most Popular',
    highlighted: true,
    stats: [
      { value: '2.3×', label: 'more interview calls' },
      { value: '40%', label: 'faster job conversion' },
    ],
    templateCount: '10+',
    templateQuality: 'Premium modern designs',
    templateLabel: '10+ premium templates for tech, corporate, leadership & high-paying roles',
    templateExamples: ['Premium recruiter-friendly', 'Leadership & executive', 'Modern professional'],
  },
];

// ─── CTA Button ───────────────────────────────────────────────────────────────

const CtaButton: React.FC<{
  style: Plan['ctaStyle'];
  label: string;
  disabled?: boolean;
  onClick?: () => void;
}> = ({ style, label, disabled, onClick }) => {
  if (disabled) {
    return (
      <button
        disabled
        className="w-full py-3 rounded-xl font-bold text-sm text-slate-600 cursor-default tracking-wide"
        style={{ background: 'rgba(39,54,71,0.35)', border: '1px solid rgba(73,68,84,0.25)' }}
      >
        {label}
      </button>
    );
  }
  if (style === 'outlined') {
    return (
      <button
        onClick={onClick}
        className="w-full py-3 rounded-xl font-bold text-sm tracking-wide transition-all hover:bg-[#1a2e44] active:scale-[0.98]"
        style={{ border: '1px solid rgba(208,188,255,0.3)', color: '#d0bcff', background: 'transparent' }}
      >
        {label}
      </button>
    );
  }
  return (
    <button
      onClick={onClick}
      className="w-full py-3 rounded-xl font-bold text-sm tracking-wide flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.98]"
      style={{
        background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)',
        color: '#340080',
        boxShadow: '0 4px 24px rgba(208,188,255,0.25)',
      }}
    >
      <Zap className="w-4 h-4" />
      {label}
    </button>
  );
};

// ─── Feature Row ─────────────────────────────────────────────────────────────

const FeatureRow: React.FC<{ text: string; highlighted: boolean }> = ({ text, highlighted }) => (
  <li className="flex items-start gap-2.5 text-sm leading-snug">
    <span
      className="flex-shrink-0 mt-0.5 w-4 h-4 rounded-full flex items-center justify-center"
      style={highlighted ? { background: 'rgba(78,222,163,0.14)' } : {}}
    >
      <Check
        className="w-2.5 h-2.5"
        style={{ color: highlighted ? '#4edea3' : '#3d9e77' }}
      />
    </span>
    <span style={{ color: highlighted ? '#d4e4fa' : '#8da8c0' }}>{text}</span>
  </li>
);

// ─── Plan Card ────────────────────────────────────────────────────────────────

const PlanCard: React.FC<{ plan: Plan; onUpgrade: () => void }> = ({ plan, onUpgrade }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    // Outer wrapper: reserves vertical space for floating badge; lifts highlighted card up slightly
    <div className={`relative flex flex-col ${plan.badge ? 'pt-6' : ''} ${plan.highlighted ? 'md:-mt-4' : ''}`}>

      {/* Floating badge — centered above card top edge */}
      {plan.badge && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap pointer-events-none">
          <span
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold tracking-widest mono-label uppercase"
            style={{
              background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)',
              color: '#340080',
              boxShadow: '0 2px 20px rgba(208,188,255,0.35)',
            }}
          >
            <Sparkles className="w-3 h-3" />
            {plan.badge}
          </span>
        </div>
      )}

      {/* Card shell */}
      <div
        className="flex-1 flex flex-col rounded-2xl overflow-hidden"
        style={
          plan.highlighted
            ? {
                background: 'rgba(16,32,52,1)',
                border: '1px solid rgba(208,188,255,0.28)',
                boxShadow: '0 0 0 1px rgba(208,188,255,0.06), 0 28px 72px rgba(208,188,255,0.09)',
              }
            : {
                background: 'rgba(13,28,45,1)',
                border: '1px solid rgba(73,68,84,0.22)',
              }
        }
      >
        {/* Top gradient accent — highlighted only */}
        {plan.highlighted && (
          <div
            className="h-[3px] w-full flex-shrink-0"
            style={{ background: 'linear-gradient(90deg, #d0bcff 0%, #4edea3 100%)' }}
          />
        )}

        <div className="flex flex-col p-6">

          {/* ── Header block ──────────────────────────────────────────────
              Fixed min-height so every card's CTA lands at the same level.
              flex-col + flex-1 spacer pushes the fire pill to the bottom
              of this block, keeping name/price/tagline/helper top-aligned.
          ──────────────────────────────────────────────────────────────── */}
          <div className="flex flex-col min-h-[200px] mb-5">
            {/* Plan label */}
            <p
              className="mono-label text-[11px] font-bold tracking-[0.15em] uppercase mb-3"
              style={{ color: plan.highlighted ? '#d0bcff' : '#64748b' }}
            >
              {plan.name}
            </p>

            {/* Price */}
            <div className="flex items-end gap-1.5 mb-3">
              <span
                className="font-bold text-[#d4e4fa] leading-none"
                style={{ fontSize: plan.highlighted ? '2.75rem' : '2.5rem' }}
              >
                {plan.currency}{plan.price.toLocaleString('en-IN')}
              </span>
              <span className="text-sm text-slate-500 mb-1 leading-none">/ month</span>
            </div>

            {/* Tagline */}
            <p className="text-sm font-semibold text-[#4edea3] mb-1.5">{plan.tagline}</p>

            {/* Helper text */}
            <p className="text-xs text-slate-500 leading-relaxed">{plan.helperText}</p>

            {/* Spacer: pushes fire pill to the bottom of this fixed-height block */}
            <div className="flex-1" />

            {/* Fire pill — Interview Cracker only. Other cards get the spacer space. */}
            {plan.highlighted && (
              <div
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-medium"
                style={{
                  background: 'rgba(255,140,0,0.08)',
                  border: '1px solid rgba(255,140,0,0.2)',
                  color: '#f5deb3',
                }}
              >
                <Flame className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                Most users get hired with this plan
              </div>
            )}
          </div>

          {/* ── CTA — always at same vertical position ─────────────────── */}
          <CtaButton
            style={plan.ctaStyle}
            label={plan.ctaLabel}
            disabled={plan.isCurrent}
            onClick={plan.isCurrent ? undefined : onUpgrade}
          />

          {/* ── Divider ─────────────────────────────────────────────────── */}
          <div className="border-t border-[#1e3248] my-5" />

          {/* ── Visible features ────────────────────────────────────────── */}
          <ul className="space-y-3">
            {plan.visibleFeatures.map((f) => (
              <FeatureRow key={f} text={f} highlighted={!!plan.highlighted} />
            ))}
          </ul>

          {/* ── Expand toggle ────────────────────────────────────────────── */}
          {plan.hiddenFeatures.length > 0 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1.5 mt-4 text-xs font-semibold transition-colors w-fit"
              style={{ color: plan.highlighted ? '#a89fd4' : '#4e6880' }}
            >
              <ChevronDown
                className="w-3.5 h-3.5 transition-transform duration-300"
                style={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
              {expanded ? 'See less features' : 'See all features'}
            </button>
          )}

          {/* ── Hidden features (smooth expand) ──────────────────────────── */}
          <div
            style={{
              maxHeight: expanded ? '600px' : '0',
              overflow: 'hidden',
              opacity: expanded ? 1 : 0,
              transition: 'max-height 0.35s ease, opacity 0.25s ease',
            }}
          >
            <ul className="space-y-3 pt-4">
              {plan.hiddenFeatures.map((f) => (
                <FeatureRow key={f} text={f} highlighted={!!plan.highlighted} />
              ))}
            </ul>
          </div>

          {/* ── Stats — Interview Cracker, always below features ──────────── */}
          {plan.stats && (
            <>
              <div className="border-t border-[#1e3248] mt-5 mb-4" />
              <p className="mono-label text-[10px] font-bold uppercase tracking-widest text-slate-600 mb-3">
                Users report
              </p>
              <div className="grid grid-cols-2 gap-2.5">
                {plan.stats.map((s) => (
                  <div
                    key={s.label}
                    className="rounded-xl px-3 py-3 text-center"
                    style={{
                      background: 'rgba(78,222,163,0.07)',
                      border: '1px solid rgba(78,222,163,0.14)',
                    }}
                  >
                    <p className="text-xl font-bold text-[#4edea3] leading-none mb-1">{s.value}</p>
                    <p className="text-[10px] text-slate-500 leading-tight">{s.label}</p>
                  </div>
                ))}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

// ─── Page ─────────────────────────────────────────────────────────────────────

const SubscriptionPage: React.FC = () => {
  const { user } = authStore();
  const [upgradeModal, setUpgradeModal] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState(user?.email || '');
  const [waitlistDone, setWaitlistDone] = useState(false);

  const openModal = () => setUpgradeModal(true);
  const closeModal = () => { setUpgradeModal(false); setWaitlistDone(false); };

  return (
    <div className="min-h-screen bg-[#051424]">
      <div className="max-w-5xl mx-auto px-4 py-10 lg:py-14">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-6">
            <span
              className="text-xs font-semibold px-3.5 py-1.5 rounded-full mono-label uppercase tracking-widest"
              style={{
                background: 'rgba(208,188,255,0.1)',
                border: '1px solid rgba(208,188,255,0.2)',
                color: '#d0bcff',
              }}
            >
              Limited-time pricing
            </span>
            <span className="text-xs text-slate-500">· Prices increasing soon</span>
          </div>

          <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-[#d4e4fa] mb-3">
            Get Interview Calls Faster 🚀
          </h2>
          <p className="text-base text-[#9cb3cc] mb-2 max-w-lg mx-auto">
            Choose a plan that actually helps you get hired
          </p>
          <p className="text-sm text-slate-500 max-w-xl mx-auto leading-relaxed">
            From first-time applicants to serious job seekers — tailor resumes,
            improve ATS fit, and prepare for interviews.
          </p>
        </div>

        {/* ── Plan Cards ──────────────────────────────────────────────── */}
        {/* items-start: all cards top-aligned, no bottom-stretching */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start mb-8">
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onUpgrade={openModal} />
          ))}
        </div>

        {/* Reassurance line */}
        <p className="text-center text-xs text-slate-600 mb-14">
          No credit card required for Starter · Cancel anytime
        </p>

        {/* ── Resume Templates Section ────────────────────────────────── */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: '1px solid rgba(73,68,84,0.22)' }}
        >
          {/* Header */}
          <div
            className="flex items-center gap-3 px-6 py-4 border-b border-[#1e3248]"
            style={{ background: 'rgba(13,28,45,1)' }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(208,188,255,0.1)' }}
            >
              <FileText className="w-3.5 h-3.5 text-[#d0bcff]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#d4e4fa]">Resume Templates Included with Your Plan</h3>
              <p className="text-xs text-slate-500">Professionally designed, ATS-optimised for every industry</p>
            </div>
          </div>

          {/* Three columns */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#1e3248]"
            style={{ background: 'rgba(10,22,38,1)' }}
          >
            {PLANS.map((plan) => (
              <div key={plan.id} className="p-5">
                {/* Plan name + count badge */}
                <div className="flex items-center justify-between mb-3">
                  <p
                    className="mono-label text-[11px] font-bold uppercase tracking-widest"
                    style={{ color: plan.highlighted ? '#d0bcff' : '#64748b' }}
                  >
                    {plan.name}
                  </p>
                  <span
                    className="text-xs font-bold px-2.5 py-0.5 rounded-full"
                    style={
                      plan.highlighted
                        ? { background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)', color: '#340080' }
                        : { background: 'rgba(39,54,71,0.7)', color: '#64748b', border: '1px solid rgba(73,68,84,0.3)' }
                    }
                  >
                    {plan.templateCount} {plan.templateCount === '1' ? 'template' : 'templates'}
                  </span>
                </div>

                {/* Count (large) + quality */}
                <div className="flex items-baseline gap-2 mb-3">
                  <span
                    className="text-2xl font-bold leading-none"
                    style={
                      plan.highlighted
                        ? {
                            background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                          }
                        : { color: '#d4e4fa' }
                    }
                  >
                    {plan.templateCount}
                  </span>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: plan.highlighted ? '#a89fd4' : '#64748b' }}
                  >
                    {plan.templateQuality}
                  </span>
                </div>

                {/* Template label */}
                <p className="text-xs text-slate-500 leading-relaxed mb-3">{plan.templateLabel}</p>

                {/* Style chips — max 3 */}
                <div className="flex flex-wrap gap-1.5">
                  {plan.templateExamples.map((t) => (
                    <span
                      key={t}
                      className="text-[10px] px-2 py-0.5 rounded-full mono-label leading-5"
                      style={
                        plan.highlighted
                          ? { background: 'rgba(208,188,255,0.1)', border: '1px solid rgba(208,188,255,0.18)', color: '#c4b0f5' }
                          : { background: 'rgba(39,54,71,0.5)', border: '1px solid rgba(73,68,84,0.28)', color: '#64748b' }
                      }
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── Upgrade Modal ───────────────────────────────────────────────── */}
      {upgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            className="w-full max-w-md rounded-2xl p-8 text-center space-y-5 relative"
            style={{
              background: 'rgba(13,28,45,0.98)',
              border: '1px solid rgba(208,188,255,0.2)',
              boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
            }}
          >
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full text-slate-500 hover:text-white hover:bg-[#273647]/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto"
              style={{
                background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)',
                boxShadow: '0 8px 24px rgba(208,188,255,0.3)',
              }}
            >
              <Zap className="w-7 h-7 text-[#340080]" />
            </div>

            <div>
              <h3 className="text-xl font-bold text-[#d4e4fa] mb-1.5">Payment integration coming soon</h3>
              <p className="text-sm text-[#9cb3cc]">
                Join the waitlist and we'll notify you the moment paid plans go live.
              </p>
            </div>

            {!waitlistDone ? (
              <div className="space-y-3">
                <input
                  type="email"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full rounded-xl px-4 py-3 text-sm text-[#d4e4fa] bg-transparent focus:outline-none focus:ring-1 focus:ring-[#d0bcff]/40 text-center placeholder:text-slate-600"
                  style={{ background: 'rgba(39,54,71,0.4)', border: '1px solid rgba(73,68,84,0.35)' }}
                />
                <button
                  onClick={() => setWaitlistDone(true)}
                  className="w-full py-3 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                  style={{
                    background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)',
                    color: '#340080',
                    boxShadow: '0 4px 20px rgba(208,188,255,0.25)',
                  }}
                >
                  Notify Me
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2.5 py-2 text-[#4edea3] font-semibold">
                <CheckCircle className="w-5 h-5" />
                You're on the waitlist!
              </div>
            )}

            <button
              onClick={closeModal}
              className="block mx-auto text-xs text-slate-600 hover:text-slate-400 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPage;

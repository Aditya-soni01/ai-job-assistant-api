import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles, Menu, X, Check, ChevronDown, ArrowRight,
  FileText, Target, Zap, LayoutTemplate, Mail, MessageSquare,
  TrendingUp, Star, Search, Download, Users, Award,
  CheckCircle, Brain, Rocket
} from 'lucide-react';

// ─── Brand helpers ──────────────────────────────────────────────────────────
const GRAD = 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)';

// ─── Static data ─────────────────────────────────────────────────────────────

const NAV_LINKS = ['Features', 'How It Works', 'Templates', 'Pricing', 'FAQ'];

const STATS = [
  { value: '2.3×', label: 'more interview calls' },
  { value: '< 5 min', label: 'per optimized resume' },
  { value: '40%', label: 'faster job conversion' },
  { value: '10k+', label: 'resumes optimized' },
];
// TODO: Replace above with real analytics when backend tracking is wired

const PROBLEMS = [
  'Generic resume sent to every job',
  'Important keywords missed by ATS',
  'Rejected before a human reads it',
  'Rewriting resume from scratch each time',
  'No idea how to prep for interviews',
  'Weak bullet points that don\'t quantify impact',
];

const SOLUTIONS = [
  'Tailored resume for every job description',
  'Full keyword gap analysis + suggestions',
  'ATS-friendly structure that passes filters',
  'One-click AI rewrite and section improvement',
  'Auto-generated job-specific interview questions',
  'STAR-method bullet points with measurable impact',
];

const STEPS = [
  {
    num: '01',
    icon: FileText,
    title: 'Upload your resume',
    desc: 'Paste text or upload a PDF/DOCX. RoleGenie parses your existing experience instantly.',
  },
  {
    num: '02',
    icon: Search,
    title: 'Paste a job description',
    desc: 'Drop in any JD from any job board. No special formatting required.',
  },
  {
    num: '03',
    icon: Zap,
    title: 'Get AI optimizations',
    desc: 'Receive ATS score, keyword gap analysis, improved bullet points, and a rewritten summary — in seconds.',
  },
  {
    num: '04',
    icon: Download,
    title: 'Download and apply',
    desc: 'Export your tailored resume as PDF or DOCX and step into the interview with confidence.',
  },
];

const FEATURES = [
  {
    icon: Target,
    title: 'JD-Based Resume Tailoring',
    desc: 'Every job is different. RoleGenie rewrites your resume specifically for the role — not just generic improvements.',
    highlight: false,
  },
  {
    icon: TrendingUp,
    title: 'ATS Match + Keyword Gap Analysis',
    desc: 'See exactly which keywords are missing, why the ATS might reject you, and how to fix it.',
    highlight: true,
  },
  {
    icon: Star,
    title: 'STAR Bullet Generation',
    desc: 'Transform weak bullet points into results-driven STAR-method achievements that recruiters notice.',
    highlight: false,
  },
  {
    icon: LayoutTemplate,
    title: 'Resume Templates by Plan',
    desc: 'Choose from ATS-friendly to premium modern templates — from 1 essential layout to 10+ premium designs.',
    highlight: false,
  },
  {
    icon: Mail,
    title: 'Cover Letter Generator',
    desc: 'Generate a personalized cover letter for each job in seconds — no copy-pasting the same template.',
    highlight: false,
  },
  {
    icon: MessageSquare,
    title: 'Interview Question Generator',
    desc: 'Get predicted interview questions based on the job description and prepare targeted answers.',
    highlight: true,
  },
];

const TEMPLATES = [
  {
    plan: 'Starter',
    count: '1 Template',
    quality: 'ATS-friendly',
    desc: 'Clean, minimal layout optimized for parsing. Gets past the bots.',
    styles: ['Minimal Clean'],
    price: 'Free',
    color: '#8da8c0',
  },
  {
    plan: 'Job Seeker',
    count: '5 Templates',
    quality: 'Recruiter-friendly',
    desc: 'Modern layouts that look good to a hiring manager after passing ATS filters.',
    styles: ['Modern Sidebar', 'Two-Column', 'Bold Header', 'Classic Pro'],
    price: '₹299/mo',
    color: '#d0bcff',
  },
  {
    plan: 'Interview Cracker',
    count: '10+ Templates',
    quality: 'Premium modern designs',
    desc: 'Premium, polished layouts for senior roles, creative fields, and high-paying positions.',
    styles: ['Executive', 'Creative Pro', 'Tech Lead', 'Infographic'],
    price: '₹799/mo',
    highlighted: true,
    color: '#4edea3',
  },
];

const BEFORE_AFTER = [
  {
    before: 'Responsible for managing team projects',
    after: 'Led cross-functional team of 6 engineers to deliver 3 product launches, reducing deployment time by 40%',
  },
  {
    before: 'Worked on improving website performance',
    after: 'Optimized frontend bundle size by 62%, improving Lighthouse score from 48 → 91 and reducing bounce rate by 23%',
  },
  {
    before: 'Handled customer support tickets',
    after: 'Resolved 200+ support tickets/month with 98% satisfaction rate, cutting average resolution time from 4h to 45min',
  },
];

const INTERVIEW_CHIPS = [
  'Interview question generator',
  'Recruiter rejection insights',
  'STAR answer guidance',
  'High-paying role targeting (₹15L+)',
  'Interview Prediction Engine',
];

const PRICING_PREVIEW = [
  {
    name: 'Starter',
    price: 'Free',
    tagline: 'Try it out',
    features: ['3 optimizations / month', 'Basic ATS score', '1 resume template'],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Job Seeker',
    price: '₹299',
    period: '/month',
    tagline: 'For active job hunters',
    features: ['30 AI optimizations / month', 'JD-based tailoring', '5 templates', 'Keyword gap analysis'],
    cta: 'Upgrade to Job Seeker',
    highlighted: false,
  },
  {
    name: 'Interview Cracker',
    price: '₹799',
    period: '/month',
    tagline: 'Get hired, not just shortlisted',
    badge: 'Most Popular',
    features: ['Unlimited optimizations', 'AI resume rewriting', '10+ premium templates', 'Interview question generator'],
    cta: 'Start Cracking Interviews',
    highlighted: true,
  },
];

const FAQS = [
  {
    q: 'What does RoleGenie actually do?',
    a: 'RoleGenie is an AI-powered career tool that tailors your resume to any job description, optimizes it for ATS systems, identifies keyword gaps, generates stronger bullet points, and helps you prepare for interviews — all in one workflow.',
  },
  {
    q: 'Is this only for ATS optimization?',
    a: 'No. ATS optimization is one part. RoleGenie also rewrites your resume content, generates STAR-method bullet points, creates cover letters, and generates job-specific interview questions to give you an end-to-end advantage.',
  },
  {
    q: 'Can I upload PDF and DOCX files?',
    a: 'Yes. RoleGenie supports both PDF and DOCX uploads up to 10 MB. After optimization, you can download the improved version in either format.',
  },
  {
    q: 'Do I need a different resume for each job application?',
    a: 'Yes — and that\'s exactly what RoleGenie automates. Recruiters and ATS systems respond far better to tailored resumes. RoleGenie makes it easy to create a customized version for every role in minutes, not hours.',
  },
  {
    q: 'Does RoleGenie help with interviews too?',
    a: 'Yes. The Interview Cracker plan includes an interview question generator based on the specific job description, recruiter rejection insights, and an Interview Prediction Engine. You go from resume to interview-ready in one place.',
  },
  {
    q: 'Are resume templates included in every plan?',
    a: 'Every plan includes at least 1 ATS-friendly template. Upgrading to Job Seeker gives you 5 recruiter-friendly layouts, and Interview Cracker unlocks 10+ premium modern designs.',
  },
  {
    q: 'Can I try RoleGenie before paying?',
    a: 'Absolutely. The Starter plan is free with 3 resume optimizations per month. No credit card required to sign up.',
  },
  {
    q: 'Which plan is best for serious job seekers?',
    a: 'Interview Cracker is our most powerful plan — designed for job seekers targeting high-paying roles. It includes unlimited optimizations, full AI rewriting, premium templates, and interview preparation tools.',
  },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

const GradientText: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <span
    className={className}
    style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
  >
    {children}
  </span>
);

const Chip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
    style={{ background: 'rgba(208,188,255,0.12)', color: '#d0bcff', border: '1px solid rgba(208,188,255,0.2)' }}
  >
    {children}
  </span>
);

// ─── Section: Navbar ─────────────────────────────────────────────────────────

const Navbar: React.FC<{ navigate: ReturnType<typeof useNavigate> }> = ({ navigate }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const NAV_TARGETS: Record<string, string> = {
    'Features': 'features',
    'How It Works': 'how-it-works',
    'Templates': 'templates',
    'Pricing': 'pricing',
    'FAQ': 'faq',
  };

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(5,20,36,0.96)' : 'rgba(5,20,36,0.7)',
        backdropFilter: 'blur(20px)',
        borderBottom: scrolled ? '1px solid rgba(39,54,71,0.5)' : '1px solid transparent',
      }}
    >
      <div className="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 no-underline">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: GRAD }}
          >
            <Sparkles className="w-4 h-4 text-[#340080]" />
          </div>
          <span className="text-xl font-bold tracking-tighter genie-gradient-text">RoleGenie</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((label) => (
            <button
              key={label}
              onClick={() => scrollTo(NAV_TARGETS[label])}
              className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-[#d4e4fa] transition-colors rounded-lg hover:bg-[#273647]/30"
            >
              {label}
            </button>
          ))}
        </div>

        {/* Desktop CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Log In
          </button>
          <button
            onClick={() => navigate('/login')}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
            style={{ background: GRAD, color: '#340080' }}
          >
            Try for Free
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="lg:hidden text-slate-400 hover:text-white p-1"
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="lg:hidden px-5 pb-5 pt-2 space-y-1"
          style={{ borderTop: '1px solid rgba(39,54,71,0.4)', background: 'rgba(5,20,36,0.98)' }}
        >
          {NAV_LINKS.map((label) => (
            <button
              key={label}
              onClick={() => scrollTo(NAV_TARGETS[label])}
              className="w-full text-left px-4 py-3 text-sm font-medium text-slate-300 hover:text-white hover:bg-[#273647]/40 rounded-lg transition-colors"
            >
              {label}
            </button>
          ))}
          <div className="flex flex-col gap-2 pt-3 border-t border-[#273647]/40">
            <button
              onClick={() => { setMenuOpen(false); navigate('/login'); }}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white border border-[#273647]/60 hover:bg-[#273647]/30 transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => { setMenuOpen(false); navigate('/login'); }}
              className="px-4 py-2.5 rounded-xl text-sm font-bold"
              style={{ background: GRAD, color: '#340080' }}
            >
              Try for Free
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

// ─── Section: Hero ───────────────────────────────────────────────────────────

const HeroSection: React.FC<{ navigate: ReturnType<typeof useNavigate> }> = ({ navigate }) => (
  <section className="pt-28 pb-20 lg:pt-36 lg:pb-28 px-5 lg:px-8">
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left: copy */}
        <div>
          <div className="mb-6">
            <Chip><Rocket className="w-3 h-3" />AI-Powered Career Copilot</Chip>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#d4e4fa] leading-[1.1] mb-6">
            Get Interview Calls{' '}
            <GradientText>Faster</GradientText>{' '}🚀
          </h1>
          <p className="text-lg text-[#cbc3d7] leading-relaxed mb-3 max-w-xl">
            Turn any job description into a tailored, ATS-friendly, recruiter-ready resume in minutes.
          </p>
          <p className="text-sm text-[#8da8c0] leading-relaxed mb-8 max-w-xl">
            Upload your resume, paste a job description, and get AI-powered improvements, keyword guidance, and interview prep — all in one workflow.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold transition-all hover:opacity-90 hover:scale-[1.02]"
              style={{ background: GRAD, color: '#340080' }}
            >
              <Sparkles className="w-4 h-4" />
              Try for Free
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-base font-semibold text-[#d0bcff] border transition-all hover:bg-[#273647]/30"
              style={{ borderColor: 'rgba(208,188,255,0.3)' }}
            >
              See How It Works
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap gap-3">
            {['ATS-friendly', 'Recruiter-focused', 'Built for job seekers'].map((badge) => (
              <span key={badge} className="flex items-center gap-1.5 text-xs text-[#8da8c0]">
                <CheckCircle className="w-3.5 h-3.5 text-[#4edea3]" />
                {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Right: product mockup */}
        <div className="relative">
          {/* Glow */}
          <div
            className="absolute inset-0 rounded-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(208,188,255,0.08) 0%, transparent 70%)' }}
          />

          <div
            className="rounded-2xl p-5 space-y-3"
            style={{ background: 'rgba(13,28,45,0.9)', border: '1px solid rgba(73,68,84,0.25)', backdropFilter: 'blur(20px)' }}
          >
            {/* Score panel */}
            <div
              className="rounded-xl p-4 flex items-center gap-4"
              style={{ background: 'rgba(39,54,71,0.5)', border: '1px solid rgba(73,68,84,0.2)' }}
            >
              <div className="flex-shrink-0 relative">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(39,54,71,0.8)" strokeWidth="6" />
                  <circle
                    cx="32" cy="32" r="26" fill="none"
                    stroke="url(#scoreGrad)" strokeWidth="6"
                    strokeDasharray="163.36" strokeDashoffset="24.5"
                    strokeLinecap="round" transform="rotate(-90 32 32)"
                  />
                  <defs>
                    <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#d0bcff" />
                      <stop offset="100%" stopColor="#4edea3" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-[#d4e4fa]">85</span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#d0bcff] uppercase tracking-widest mono-label mb-0.5">ATS Match Score</p>
                <p className="text-[#d4e4fa] font-semibold text-sm">Senior Frontend Engineer @ Stripe</p>
                <p className="text-xs text-[#4edea3] mt-0.5">↑ from 42 after optimization</p>
              </div>
            </div>

            {/* Keyword gaps */}
            <div
              className="rounded-xl p-4"
              style={{ background: 'rgba(39,54,71,0.5)', border: '1px solid rgba(73,68,84,0.2)' }}
            >
              <p className="text-xs font-bold text-[#d4e4fa] uppercase tracking-widest mono-label mb-3">Keyword Gaps Fixed</p>
              <div className="flex flex-wrap gap-2">
                {['React Query', 'TypeScript', 'System Design', 'CI/CD', 'GraphQL'].map((kw) => (
                  <span
                    key={kw}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={{ background: 'rgba(78,222,163,0.12)', color: '#4edea3', border: '1px solid rgba(78,222,163,0.2)' }}
                  >
                    ✓ {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Before / After bullet */}
            <div
              className="rounded-xl p-4 space-y-2"
              style={{ background: 'rgba(39,54,71,0.5)', border: '1px solid rgba(73,68,84,0.2)' }}
            >
              <p className="text-xs font-bold text-[#d4e4fa] uppercase tracking-widest mono-label mb-1">Bullet Rewrite</p>
              <div className="space-y-1.5">
                <p className="text-xs text-[#8da8c0] line-through leading-snug">
                  Responsible for improving website speed
                </p>
                <p className="text-xs text-[#d4e4fa] leading-snug">
                  <span className="text-[#4edea3] font-semibold">✓ </span>
                  Reduced page load time by 62% via bundle optimization, boosting Lighthouse score from 48 → 91
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Section: Stats strip ────────────────────────────────────────────────────

const StatsSection: React.FC = () => (
  <section className="py-14 px-5 lg:px-8">
    <div
      className="max-w-5xl mx-auto rounded-2xl px-8 py-8"
      style={{ background: 'rgba(13,28,45,0.7)', border: '1px solid rgba(73,68,84,0.2)' }}
    >
      <p className="text-center text-xs text-[#8da8c0] mono-label uppercase tracking-widest mb-7">
        Built for job seekers who want better results, not generic AI output
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-0 lg:divide-x lg:divide-[#273647]/60">
        {STATS.map(({ value, label }) => (
          <div key={label} className="text-center px-4">
            <p
              className="text-3xl font-bold mb-1"
              style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
            >
              {value}
            </p>
            <p className="text-xs text-[#8da8c0]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Section: Problem / Solution ─────────────────────────────────────────────

const ProblemSolutionSection: React.FC = () => (
  <section className="py-20 px-5 lg:px-8">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl lg:text-4xl font-bold text-[#d4e4fa] tracking-tight mb-3">
          The job search is broken.{' '}
          <GradientText>We fix it.</GradientText>
        </h2>
        <p className="text-[#8da8c0] text-sm max-w-xl mx-auto">
          Most resumes never reach a human. RoleGenie changes the equation from the first step.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Before */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'rgba(13,28,45,0.8)', border: '1px solid rgba(200,80,80,0.15)' }}
        >
          <p className="text-xs font-bold text-red-400 uppercase tracking-widest mono-label mb-5">
            Without RoleGenie
          </p>
          <ul className="space-y-3">
            {PROBLEMS.map((p) => (
              <li key={p} className="flex items-start gap-3 text-sm text-[#8da8c0]">
                <X className="w-4 h-4 text-red-400/70 flex-shrink-0 mt-0.5" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* After */}
        <div
          className="rounded-2xl p-6"
          style={{ background: 'rgba(13,28,45,0.8)', border: '1px solid rgba(78,222,163,0.15)' }}
        >
          <p className="text-xs font-bold text-[#4edea3] uppercase tracking-widest mono-label mb-5">
            With RoleGenie
          </p>
          <ul className="space-y-3">
            {SOLUTIONS.map((s) => (
              <li key={s} className="flex items-start gap-3 text-sm text-[#d4e4fa]">
                <Check className="w-4 h-4 text-[#4edea3] flex-shrink-0 mt-0.5" />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  </section>
);

// ─── Section: How It Works ────────────────────────────────────────────────────

const HowItWorksSection: React.FC<{ navigate: ReturnType<typeof useNavigate> }> = ({ navigate }) => (
  <section id="how-it-works" className="py-20 px-5 lg:px-8">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <p className="mono-label text-xs font-bold uppercase tracking-widest text-[#d0bcff] mb-3">How It Works</p>
        <h2 className="text-3xl lg:text-4xl font-bold text-[#d4e4fa] tracking-tight">
          From resume to interview-ready{' '}
          <GradientText>in 4 steps</GradientText>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STEPS.map(({ num, icon: Icon, title, desc }, i) => (
          <div key={num} className="relative">
            {/* Connector line */}
            {i < STEPS.length - 1 && (
              <div
                className="hidden lg:block absolute top-8 left-[calc(100%+10px)] w-[calc(100%-20px)] h-px"
                style={{ background: 'linear-gradient(90deg, rgba(208,188,255,0.3), rgba(78,222,163,0.1))' }}
              />
            )}
            <div
              className="rounded-2xl p-5 h-full"
              style={{ background: 'rgba(13,28,45,0.8)', border: '1px solid rgba(73,68,84,0.2)' }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(208,188,255,0.1)', border: '1px solid rgba(208,188,255,0.15)' }}
                >
                  <Icon className="w-5 h-5 text-[#d0bcff]" />
                </div>
                <span className="text-xs font-bold mono-label text-[#d0bcff]/40">{num}</span>
              </div>
              <h3 className="text-sm font-bold text-[#d4e4fa] mb-2">{title}</h3>
              <p className="text-xs text-[#8da8c0] leading-relaxed">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <button
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
          style={{ background: GRAD, color: '#340080' }}
        >
          <Sparkles className="w-4 h-4" />
          Try for Free — No Credit Card
        </button>
      </div>
    </div>
  </section>
);

// ─── Section: Features ────────────────────────────────────────────────────────

const FeaturesSection: React.FC = () => (
  <section id="features" className="py-20 px-5 lg:px-8">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <p className="mono-label text-xs font-bold uppercase tracking-widest text-[#d0bcff] mb-3">Features</p>
        <h2 className="text-3xl lg:text-4xl font-bold text-[#d4e4fa] tracking-tight">
          Everything you need to{' '}
          <GradientText>land the role</GradientText>
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {FEATURES.map(({ icon: Icon, title, desc, highlight }) => (
          <div
            key={title}
            className="rounded-2xl p-5 transition-all hover:scale-[1.01]"
            style={{
              background: highlight ? 'rgba(39,54,71,0.5)' : 'rgba(13,28,45,0.8)',
              border: highlight ? '1px solid rgba(208,188,255,0.2)' : '1px solid rgba(73,68,84,0.2)',
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
              style={{
                background: highlight ? 'rgba(208,188,255,0.12)' : 'rgba(39,54,71,0.6)',
                border: highlight ? '1px solid rgba(208,188,255,0.2)' : '1px solid rgba(73,68,84,0.2)',
              }}
            >
              <Icon className="w-5 h-5" style={{ color: highlight ? '#d0bcff' : '#8da8c0' }} />
            </div>
            <h3 className="text-sm font-bold text-[#d4e4fa] mb-2">{title}</h3>
            <p className="text-xs text-[#8da8c0] leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Section: Templates ───────────────────────────────────────────────────────

const TemplatesSection: React.FC<{ navigate: ReturnType<typeof useNavigate> }> = ({ navigate }) => (
  <section id="templates" className="py-20 px-5 lg:px-8">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <p className="mono-label text-xs font-bold uppercase tracking-widest text-[#d0bcff] mb-3">Resume Templates</p>
        <h2 className="text-3xl lg:text-4xl font-bold text-[#d4e4fa] tracking-tight mb-3">
          Templates that match{' '}
          <GradientText>your career goal</GradientText>
        </h2>
        <p className="text-sm text-[#8da8c0] max-w-xl mx-auto">
          Choose from ATS-friendly to premium modern layouts — designed for clean formatting, recruiter readability, and different application styles.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {TEMPLATES.map((t) => (
          <div
            key={t.plan}
            className="rounded-2xl p-6 flex flex-col"
            style={{
              background: t.highlighted ? 'rgba(39,54,71,0.6)' : 'rgba(13,28,45,0.8)',
              border: t.highlighted ? '1px solid rgba(78,222,163,0.25)' : '1px solid rgba(73,68,84,0.2)',
            }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-bold mono-label uppercase tracking-widest mb-1" style={{ color: t.color }}>
                  {t.plan}
                </p>
                <p
                  className="text-2xl font-bold"
                  style={{ background: GRAD, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
                >
                  {t.count}
                </p>
              </div>
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(39,54,71,0.8)', color: t.color, border: `1px solid ${t.color}22` }}
              >
                {t.price}
              </span>
            </div>

            <p className="text-sm font-semibold text-[#d4e4fa] mb-1">{t.quality}</p>
            <p className="text-xs text-[#8da8c0] mb-5 leading-relaxed flex-1">{t.desc}</p>

            {/* Style chips */}
            <div className="flex flex-wrap gap-1.5 mb-5">
              {t.styles.map((s) => (
                <span
                  key={s}
                  className="px-2 py-0.5 rounded text-xs"
                  style={{ background: 'rgba(39,54,71,0.7)', color: '#8da8c0', border: '1px solid rgba(73,68,84,0.3)' }}
                >
                  {s}
                </span>
              ))}
              {t.highlighted && (
                <span
                  className="px-2 py-0.5 rounded text-xs"
                  style={{ background: 'rgba(39,54,71,0.7)', color: '#8da8c0', border: '1px solid rgba(73,68,84,0.3)' }}
                >
                  +6 more
                </span>
              )}
            </div>

            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
              style={t.highlighted ? { background: GRAD, color: '#340080' } : { background: 'rgba(39,54,71,0.6)', color: '#d4e4fa', border: '1px solid rgba(73,68,84,0.4)' }}
            >
              Get {t.count}
            </button>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Section: Before / After ──────────────────────────────────────────────────

const BeforeAfterSection: React.FC = () => (
  <section className="py-20 px-5 lg:px-8">
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-12">
        <p className="mono-label text-xs font-bold uppercase tracking-widest text-[#d0bcff] mb-3">The Difference</p>
        <h2 className="text-3xl lg:text-4xl font-bold text-[#d4e4fa] tracking-tight mb-3">
          See what <GradientText>AI optimization</GradientText> actually does
        </h2>
        <p className="text-sm text-[#8da8c0] max-w-lg mx-auto">
          Real before/after bullet points — not just keyword stuffing, but properly structured achievement statements.
        </p>
      </div>

      <div className="space-y-4">
        {BEFORE_AFTER.map(({ before, after }, i) => (
          <div
            key={i}
            className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid rgba(73,68,84,0.2)' }}
          >
            <div
              className="p-4 flex items-start gap-3"
              style={{ background: 'rgba(200,80,80,0.05)', borderBottom: '1px solid rgba(73,68,84,0.15)' }}
            >
              <X className="w-4 h-4 text-red-400/70 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#8da8c0] line-through leading-relaxed">{before}</p>
            </div>
            <div
              className="p-4 flex items-start gap-3"
              style={{ background: 'rgba(78,222,163,0.04)' }}
            >
              <Check className="w-4 h-4 text-[#4edea3] flex-shrink-0 mt-0.5" />
              <p className="text-sm text-[#d4e4fa] leading-relaxed">{after}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

// ─── Section: Interview prep ──────────────────────────────────────────────────

const InterviewSection: React.FC<{ navigate: ReturnType<typeof useNavigate> }> = ({ navigate }) => (
  <section className="py-20 px-5 lg:px-8">
    <div className="max-w-5xl mx-auto">
      <div
        className="rounded-3xl p-8 lg:p-12 overflow-hidden relative"
        style={{ background: 'rgba(13,28,45,0.9)', border: '1px solid rgba(208,188,255,0.15)' }}
      >
        {/* Ambient glow */}
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(208,188,255,0.06) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
        />

        <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <p className="mono-label text-xs font-bold uppercase tracking-widest text-[#d0bcff] mb-3">
              Don't Stop at Resume Optimization
            </p>
            <h2 className="text-3xl lg:text-4xl font-bold text-[#d4e4fa] tracking-tight mb-4">
              Prepare to <GradientText>ace the interview</GradientText> too
            </h2>
            <p className="text-sm text-[#cbc3d7] leading-relaxed mb-6">
              RoleGenie goes beyond resume tweaks. Get job-specific interview questions, answer guidance, and recruiter-focused insights so you walk into every interview prepared.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
              style={{ background: GRAD, color: '#340080' }}
            >
              <Brain className="w-4 h-4" />
              Start Interview Prep
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {INTERVIEW_CHIPS.map((chip) => (
              <div
                key={chip}
                className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm text-[#d4e4fa] font-medium"
                style={{ background: 'rgba(39,54,71,0.5)', border: '1px solid rgba(208,188,255,0.1)' }}
              >
                <CheckCircle className="w-4 h-4 text-[#4edea3] flex-shrink-0" />
                {chip}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </section>
);

// ─── Section: Pricing preview ─────────────────────────────────────────────────

const PricingPreviewSection: React.FC<{ navigate: ReturnType<typeof useNavigate> }> = ({ navigate }) => (
  <section id="pricing" className="py-20 px-5 lg:px-8">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <p className="mono-label text-xs font-bold uppercase tracking-widest text-[#d0bcff] mb-3">Pricing</p>
        <h2 className="text-3xl lg:text-4xl font-bold text-[#d4e4fa] tracking-tight mb-3">
          Start free. <GradientText>Upgrade when you're ready.</GradientText>
        </h2>
        <p className="text-sm text-[#8da8c0] max-w-md mx-auto">
          No credit card needed to get started. Upgrade any time when you want more.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start mb-8">
        {PRICING_PREVIEW.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl p-6 flex flex-col ${plan.highlighted ? 'relative' : ''}`}
            style={{
              background: plan.highlighted ? 'rgba(39,54,71,0.6)' : 'rgba(13,28,45,0.8)',
              border: plan.highlighted ? '1px solid rgba(208,188,255,0.25)' : '1px solid rgba(73,68,84,0.2)',
            }}
          >
            {plan.badge && (
              <span
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: GRAD, color: '#340080' }}
              >
                {plan.badge}
              </span>
            )}
            <p className="text-xs font-bold mono-label uppercase tracking-widest text-[#d0bcff] mb-2">{plan.name}</p>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-3xl font-bold text-[#d4e4fa]">{plan.price}</span>
              {plan.period && <span className="text-sm text-[#8da8c0]">{plan.period}</span>}
            </div>
            <p className="text-xs text-[#8da8c0] mb-5">{plan.tagline}</p>
            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-[#cbc3d7]">
                  <Check className="w-3.5 h-3.5 text-[#4edea3] flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-2.5 rounded-xl text-sm font-bold transition-opacity hover:opacity-90"
              style={plan.highlighted ? { background: GRAD, color: '#340080' } : { background: 'rgba(39,54,71,0.6)', color: '#d4e4fa', border: '1px solid rgba(73,68,84,0.4)' }}
            >
              {plan.cta}
            </button>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={() => navigate('/subscription')}
          className="inline-flex items-center gap-2 text-sm text-[#d0bcff] hover:text-[#d4e4fa] transition-colors"
        >
          View full pricing details
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  </section>
);

// ─── Section: FAQ ─────────────────────────────────────────────────────────────

const FAQSection: React.FC = () => {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <section id="faq" className="py-20 px-5 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <p className="mono-label text-xs font-bold uppercase tracking-widest text-[#d0bcff] mb-3">FAQ</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#d4e4fa] tracking-tight">
            Common <GradientText>questions</GradientText>
          </h2>
        </div>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(13,28,45,0.8)', border: '1px solid rgba(73,68,84,0.2)' }}
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-[#273647]/20 transition-colors"
              >
                <span className="text-sm font-semibold text-[#d4e4fa] pr-4">{faq.q}</span>
                <ChevronDown
                  className="w-4 h-4 text-[#d0bcff] flex-shrink-0 transition-transform duration-200"
                  style={{ transform: open === i ? 'rotate(180deg)' : 'rotate(0deg)' }}
                />
              </button>
              {open === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-[#cbc3d7] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Section: Final CTA ───────────────────────────────────────────────────────

const FinalCTASection: React.FC<{ navigate: ReturnType<typeof useNavigate> }> = ({ navigate }) => (
  <section className="py-24 px-5 lg:px-8">
    <div className="max-w-2xl mx-auto text-center">
      <div
        className="rounded-3xl p-10 lg:p-14 relative overflow-hidden"
        style={{ background: 'rgba(13,28,45,0.9)', border: '1px solid rgba(208,188,255,0.15)' }}
      >
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% -20%, rgba(208,188,255,0.07) 0%, transparent 65%)' }}
        />
        <div className="relative">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-6"
            style={{ background: GRAD }}
          >
            <Sparkles className="w-7 h-7 text-[#340080]" />
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-[#d4e4fa] tracking-tight mb-4">
            Ready to turn job descriptions into{' '}
            <GradientText>interview-ready resumes?</GradientText>
          </h2>
          <p className="text-sm text-[#8da8c0] mb-8 max-w-md mx-auto">
            Start for free — no credit card required. Upgrade when you're ready to go all-in on your job search.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-bold hover:opacity-90 hover:scale-[1.02] transition-all"
              style={{ background: GRAD, color: '#340080' }}
            >
              <Sparkles className="w-4 h-4" />
              Try for Free
            </button>
            <button
              onClick={() => navigate('/subscription')}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold text-[#d0bcff] border transition-all hover:bg-[#273647]/30"
              style={{ borderColor: 'rgba(208,188,255,0.3)' }}
            >
              View Pricing
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-[#8da8c0] mt-5">
            Free plan includes 3 AI optimizations/month · No setup required
          </p>
        </div>
      </div>
    </div>
  </section>
);

// ─── Footer ───────────────────────────────────────────────────────────────────

const Footer: React.FC<{ navigate: ReturnType<typeof useNavigate> }> = ({ navigate }) => (
  <footer
    className="py-10 px-5 lg:px-8"
    style={{ borderTop: '1px solid rgba(39,54,71,0.4)' }}
  >
    <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-5">
      <div className="flex items-center gap-2.5">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: GRAD }}
        >
          <Sparkles className="w-3.5 h-3.5 text-[#340080]" />
        </div>
        <span className="font-bold tracking-tighter genie-gradient-text">RoleGenie</span>
        <span className="text-xs text-[#8da8c0] hidden sm:inline">· AI Career Copilot by Auronex</span>
      </div>

      <div className="flex items-center gap-5 text-xs text-[#8da8c0]">
        <button onClick={() => navigate('/login')} className="hover:text-[#d4e4fa] transition-colors">Log In</button>
        <button onClick={() => navigate('/login')} className="hover:text-[#d4e4fa] transition-colors">Sign Up Free</button>
        <button onClick={() => navigate('/subscription')} className="hover:text-[#d4e4fa] transition-colors">Pricing</button>
      </div>

      <p className="text-xs text-[#8da8c0]/50">© 2025 RoleGenie. All rights reserved.</p>
    </div>
  </footer>
);

// ─── Main LandingPage ─────────────────────────────────────────────────────────

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#051424] overflow-x-hidden">
      {/* Ambient background glows */}
      <div
        className="fixed top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none -z-10"
        style={{ background: 'radial-gradient(circle, rgba(208,188,255,0.04) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
      />
      <div
        className="fixed bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none -z-10"
        style={{ background: 'radial-gradient(circle, rgba(78,222,163,0.03) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}
      />

      <Navbar navigate={navigate} />
      <HeroSection navigate={navigate} />
      <StatsSection />
      <ProblemSolutionSection />
      <HowItWorksSection navigate={navigate} />
      <FeaturesSection />
      <TemplatesSection navigate={navigate} />
      <BeforeAfterSection />
      <InterviewSection navigate={navigate} />
      <PricingPreviewSection navigate={navigate} />
      <FAQSection />
      <FinalCTASection navigate={navigate} />
      <Footer navigate={navigate} />
    </div>
  );
};

export default LandingPage;

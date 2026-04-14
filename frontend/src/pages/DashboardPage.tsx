import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, Sparkles, TrendingUp, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/lib/api';
import { authStore } from '@/store/authStore';

interface Resume {
  id: number;
  original_filename: string;
  optimized_content: string | null;
  created_at: string;
}

interface OptimizedData {
  optimized?: { ats_score_after?: number; ats_score_before?: number };
  analysis?: { job_title?: string };
}

const FREE_PLAN_LIMIT = 5;

function tryParseOptimized(content: string | null): OptimizedData | null {
  if (!content) return null;
  try { return JSON.parse(content); } catch { return null; }
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = authStore();
  const firstName = user?.first_name || user?.username || 'there';

  const { data: resumes = [], isLoading } = useQuery<Resume[]>({
    queryKey: ['resumes'],
    queryFn: () => apiClient.get<Resume[]>('/resumes').then((r) => r.data),
  });

  const optimized = resumes.filter((r) => r.optimized_content);
  const totalResumes = resumes.length;
  const totalOptimizations = optimized.length;
  const avgAts =
    optimized.length > 0
      ? Math.round(
          optimized.reduce((sum, r) => {
            const parsed = tryParseOptimized(r.optimized_content);
            return sum + (parsed?.optimized?.ats_score_after ?? 0);
          }, 0) / optimized.length
        )
      : 0;

  const recentOptimizations = [...optimized]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const optimizationsUsed = totalOptimizations;
  const usagePercent = Math.min(100, Math.round((optimizationsUsed / FREE_PLAN_LIMIT) * 100));

  const stats = [
    {
      label: 'Resumes',
      value: isLoading ? '—' : String(totalResumes),
      icon: FileText,
      iconColor: 'text-[#d0bcff]',
      iconBg: 'bg-[#d0bcff]/10',
    },
    {
      label: 'Optimizations',
      value: isLoading ? '—' : String(totalOptimizations),
      icon: Sparkles,
      iconColor: 'text-[#4edea3]',
      iconBg: 'bg-[#4edea3]/10',
    },
    {
      label: 'Avg ATS Score',
      value: isLoading ? '—' : avgAts > 0 ? String(avgAts) : '—',
      icon: TrendingUp,
      iconColor: 'text-[#ffb3af]',
      iconBg: 'bg-[#ffb3af]/10',
    },
  ];

  return (
    <div className="min-h-screen bg-[#051424] p-6 lg:p-8 max-w-5xl mx-auto">
      {/* ── Welcome ─────────────────────────────────────────────────── */}
      <section className="mb-10">
        <h2 className="text-4xl font-bold tracking-tight text-[#d4e4fa] mb-1">
          Welcome back, <span className="genie-gradient-text">{firstName}</span>
        </h2>
        <p className="text-[#cbc3d7]/70 mono-label tracking-tight text-sm">
          Your AI resume optimization workspace
        </p>
      </section>

      {/* ── Start New Optimization CTA ──────────────────────────────── */}
      <section className="mb-8">
        <div
          className="relative overflow-hidden rounded-2xl p-8 border border-[#d0bcff]/20"
          style={{
            background: 'linear-gradient(135deg, rgba(208,188,255,0.08) 0%, rgba(78,222,163,0.06) 100%)',
            backdropFilter: 'blur(20px)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{ background: 'radial-gradient(ellipse at top left, #d0bcff 0%, transparent 60%)' }}
          />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)' }}>
                <Zap className="w-6 h-6 text-[#340080]" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-[#d4e4fa] mb-1">Start New Optimization</h3>
                <p className="text-sm text-[#cbc3d7]/80 max-w-sm">
                  Upload your resume and paste a job description to get AI-powered suggestions and an ATS score.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/resume')}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm whitespace-nowrap flex-shrink-0 transition-opacity hover:opacity-90"
              style={{ background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)', color: '#340080' }}
            >
              Optimize Resume
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <section className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, iconColor, iconBg }) => (
          <div
            key={label}
            className="glass-card p-5 rounded-xl border border-[#273647]/10"
          >
            <div className={`w-9 h-9 rounded-lg ${iconBg} flex items-center justify-center mb-3`}>
              <Icon className={`${iconColor} w-4 h-4`} />
            </div>
            <p className="text-2xl font-bold text-[#d4e4fa] mb-0.5">{value}</p>
            <p className="mono-label text-[10px] text-[#cbc3d7] uppercase tracking-widest">{label}</p>
          </div>
        ))}
      </section>

      {/* ── Recent Optimizations ─────────────────────────────────────── */}
      <section className="mb-8">
        <h3 className="text-base font-bold text-[#d4e4fa] uppercase tracking-widest mono-label mb-4">
          Recent Optimizations
        </h3>
        <div className="glass-card rounded-xl border border-[#273647]/10 overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-[#273647]/40 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : recentOptimizations.length === 0 ? (
            <div className="p-10 text-center text-slate-500">
              <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No optimizations yet. Upload a resume to get started!</p>
            </div>
          ) : (
            recentOptimizations.map((r, idx) => {
              const parsed = tryParseOptimized(r.optimized_content);
              const scoreBefore = parsed?.optimized?.ats_score_before ?? '?';
              const scoreAfter = parsed?.optimized?.ats_score_after ?? '?';
              const jobTitle = parsed?.analysis?.job_title ?? 'Unknown Role';
              const date = new Date(r.created_at).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', year: 'numeric',
              });

              return (
                <div
                  key={r.id}
                  className={`flex items-center justify-between p-4 gap-4 ${
                    idx < recentOptimizations.length - 1 ? 'border-b border-[#273647]/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-[#273647]/60 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-4 h-4 text-[#d0bcff]" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#d4e4fa] truncate">
                        {r.original_filename}
                      </p>
                      <p className="text-xs text-[#cbc3d7]/60 truncate">
                        → "{jobTitle}" · {date}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs text-[#cbc3d7]/60 mono-label">ATS</p>
                      <p className="text-sm font-bold text-[#4edea3]">
                        {scoreBefore} → {scoreAfter}
                      </p>
                    </div>
                    <button
                      onClick={() => navigate('/resume', { state: { resumeId: r.id } })}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg text-[#d0bcff] border border-[#d0bcff]/30 hover:bg-[#d0bcff]/10 transition-colors"
                    >
                      View
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* ── Plan Usage ──────────────────────────────────────────────── */}
      <section>
        <div
          className="glass-card rounded-xl border border-[#273647]/10 p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="mono-label text-xs font-bold tracking-widest uppercase text-[#d0bcff] mb-0.5">
                Free Plan
              </p>
              <p className="text-sm text-[#cbc3d7]">
                {optimizationsUsed} of {FREE_PLAN_LIMIT} optimizations used this month
              </p>
            </div>
            <button
              onClick={() => navigate('/subscription')}
              className="text-xs font-bold px-4 py-2 rounded-lg transition-opacity hover:opacity-90 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)', color: '#340080' }}
            >
              Upgrade to Pro
            </button>
          </div>
          <div className="w-full h-2 bg-[#273647]/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${usagePercent}%`,
                background: 'linear-gradient(90deg, #d0bcff 0%, #4edea3 100%)',
              }}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Zap } from 'lucide-react';
import apiClient from '@/lib/api';
import { authStore } from '@/store/authStore';
import { RESUME_TEMPLATES } from '@/data/resumeTemplates';
import ResumeTemplatePreview from '@/components/ResumeTemplatePreview';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiTemplate {
  id: string;          // legacy "template_N" key
  sort_order: number;
  locked: boolean;
}

interface ApiResponse {
  plan: string;
  templates: ApiTemplate[];
}

interface TemplateSelectorProps {
  selectedId: string;
  onSelect: (templateId: string) => void;
  onUpgradeCta?: () => void;
}

// ─── Plan display helpers ─────────────────────────────────────────────────────

const PLAN_DISPLAY: Record<string, string> = {
  starter: 'Starter',
  job_seeker: 'Job Seeker',
  interview_cracker: 'Interview Cracker',
};

// ─── Main component ───────────────────────────────────────────────────────────

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  selectedId,
  onSelect,
  onUpgradeCta,
}) => {
  const { user } = authStore();
  const [showAll, setShowAll] = useState(false);

  // Fetch plan + locked status from API
  const { data, isLoading } = useQuery<ApiResponse>({
    queryKey: ['templates'],
    queryFn: () => apiClient.get('/templates').then((r) => r.data),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Merge API locked status (sorted by sort_order 1..10) with local template data
  // The API and local arrays both have 10 entries in the same positional order
  const apiByIndex = data?.templates
    ? [...data.templates].sort((a, b) => a.sort_order - b.sort_order)
    : null;

  const templatesWithLock = RESUME_TEMPLATES.map((t, i) => ({
    ...t,
    // If API responded, use its locked value; otherwise fall back to tier-based gating
    locked: apiByIndex ? (apiByIndex[i]?.locked ?? (t.tier === 'pro')) : (t.tier === 'pro'),
  }));

  const unlockedCount = templatesWithLock.filter((t) => !t.locked).length;
  const visibleTemplates = showAll ? templatesWithLock : templatesWithLock.slice(0, 4);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-6 text-slate-500 text-sm">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#d0bcff] border-t-transparent" />
        Loading templates…
      </div>
    );
  }

  return (
    <div>
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {unlockedCount} unlocked · {templatesWithLock.length - unlockedCount} locked
          </p>
        </div>
        {templatesWithLock.length > 4 && (
          <button
            onClick={() => setShowAll((v) => !v)}
            className="text-xs text-[#d0bcff] hover:text-white transition-colors font-semibold"
          >
            {showAll ? 'Show less' : `See all ${templatesWithLock.length}`}
          </button>
        )}
      </div>

      {/* ── Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
        {visibleTemplates.map((tmpl) => (
          <ResumeTemplatePreview
            key={tmpl.id}
            template={tmpl}
            selected={selectedId === tmpl.id}
            locked={tmpl.locked}
            onClick={() => {
              if (tmpl.locked) {
                onUpgradeCta?.();
                return;
              }
              onSelect(tmpl.id);
            }}
          />
        ))}
      </div>

      {/* ── Plan info + upgrade CTA ── */}
      <div className="flex items-center gap-3 mt-4">
        <p className="text-[10px] text-slate-600 mono-label uppercase tracking-widest">
          Plan: {PLAN_DISPLAY[data?.plan ?? ''] ?? (data?.plan ?? 'Free')}
        </p>
        {data?.plan !== 'interview_cracker' && (
          <button
            onClick={onUpgradeCta}
            className="flex items-center gap-1 text-[10px] text-[#d0bcff] hover:text-white transition-colors font-semibold mono-label uppercase tracking-widest"
          >
            <Zap className="w-2.5 h-2.5" />
            Upgrade for more templates
          </button>
        )}
      </div>
    </div>
  );
};

export default TemplateSelector;

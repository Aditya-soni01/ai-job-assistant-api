import React, { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Upload, FileText, Trash2, Zap, Download, X, ChevronRight,
  CheckCircle, AlertCircle, TrendingUp, Tag, FileDown,
} from 'lucide-react';
import apiClient from '@/lib/api';
import { authStore } from '@/store/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Resume {
  id: number;
  file_name: string;
  original_content: string;
  optimized_content?: string;
  created_at: string;
}

interface Job {
  id: number;
  title: string;
  company: string;
  description: string;
}

interface StructuredResume {
  full_name: string;
  contact: string;
  summary: string;
  skills: string[];
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    achievements: string[];
  }>;
  education: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
  projects: Array<{
    name: string;
    description: string;
    technologies: string[];
  }>;
  certifications: string[];
  ats_score_before: number;
  ats_score_after: number;
  keywords_added: string[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function tryParseStructured(content?: string): StructuredResume | null {
  if (!content) return null;
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed === 'object' && 'summary' in parsed) return parsed as StructuredResume;
  } catch {}
  return null;
}

async function downloadBlob(url: string, filename: string) {
  // responseType: 'blob' means res.data is already a Blob — use it directly.
  const res = await apiClient.get(url, { responseType: 'blob' });
  const href = URL.createObjectURL(res.data as Blob);
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(href);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const ATSScoreBadge: React.FC<{ before: number; after: number }> = ({ before, after }) => {
  const delta = after - before;
  return (
    <div className="flex items-center gap-4 rounded-xl bg-slate-900/60 border border-slate-700 p-4">
      <div className="text-center">
        <p className="text-xs text-slate-500 mb-1">Before</p>
        <p className="text-2xl font-bold text-red-400">{before}</p>
      </div>
      <div className="flex-1 flex flex-col items-center">
        <TrendingUp className="h-5 w-5 text-green-400 mb-1" />
        <span className="text-xs font-semibold text-green-400">+{delta} pts</span>
      </div>
      <div className="text-center">
        <p className="text-xs text-slate-500 mb-1">After</p>
        <p className="text-2xl font-bold text-green-400">{after}</p>
      </div>
      <div className="flex-1">
        <p className="text-xs text-slate-400 mb-1.5">ATS Score</p>
        <div className="h-2 w-full rounded-full bg-slate-700">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-700"
            style={{ width: `${after}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const KeywordsAdded: React.FC<{ keywords: string[] }> = ({ keywords }) => (
  <div className="rounded-xl bg-slate-900/60 border border-slate-700 p-4">
    <div className="flex items-center gap-2 mb-3">
      <Tag className="h-4 w-4 text-primary-400" />
      <p className="text-xs font-semibold text-primary-400 uppercase tracking-wide">Keywords Added</p>
    </div>
    <div className="flex flex-wrap gap-2">
      {keywords.map((kw, i) => (
        <span key={i} className="rounded-full bg-primary-900/40 border border-primary-700 px-2.5 py-0.5 text-xs text-primary-300">
          {kw}
        </span>
      ))}
    </div>
  </div>
);

const ResumePreview: React.FC<{ data: StructuredResume }> = ({ data }) => (
  <div className="rounded-xl border border-slate-700 bg-white text-slate-900 p-8 shadow-lg font-sans text-sm leading-relaxed">
    {/* Header */}
    <div className="text-center mb-4 pb-4 border-b-2 border-blue-600">
      <h1 className="text-2xl font-bold text-slate-900">{data.full_name}</h1>
      <p className="text-slate-500 text-xs mt-1">{data.contact}</p>
    </div>

    {/* Summary */}
    {data.summary && (
      <section className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 border-b border-blue-200 pb-1 mb-2">
          Professional Summary
        </h2>
        <p className="text-slate-700">{data.summary}</p>
      </section>
    )}

    {/* Skills */}
    {data.skills?.length > 0 && (
      <section className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 border-b border-blue-200 pb-1 mb-2">
          Skills
        </h2>
        <p className="text-slate-700">{data.skills.join(' • ')}</p>
      </section>
    )}

    {/* Experience */}
    {data.experience?.length > 0 && (
      <section className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 border-b border-blue-200 pb-1 mb-2">
          Experience
        </h2>
        {data.experience.map((exp, i) => (
          <div key={i} className="mb-3">
            <div className="flex items-baseline justify-between">
              <p className="font-semibold text-slate-900">{exp.title} — {exp.company}</p>
              <p className="text-xs text-slate-500 flex-shrink-0 ml-4">{exp.duration}</p>
            </div>
            <ul className="mt-1 space-y-0.5 ml-4">
              {exp.achievements?.map((ach, j) => (
                <li key={j} className="text-slate-700 before:content-['•'] before:mr-2 before:text-blue-600">
                  {ach}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    )}

    {/* Education */}
    {data.education?.length > 0 && (
      <section className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 border-b border-blue-200 pb-1 mb-2">
          Education
        </h2>
        {data.education.map((edu, i) => (
          <div key={i} className="flex items-baseline justify-between mb-1">
            <p className="font-semibold text-slate-900">{edu.degree}</p>
            <p className="text-xs text-slate-500 ml-4">{edu.institution} | {edu.year}</p>
          </div>
        ))}
      </section>
    )}

    {/* Projects */}
    {data.projects?.length > 0 && (
      <section className="mb-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 border-b border-blue-200 pb-1 mb-2">
          Projects
        </h2>
        {data.projects.map((proj, i) => (
          <div key={i} className="mb-3">
            <p className="font-semibold text-slate-900">{proj.name}</p>
            <p className="text-slate-700 mt-0.5">{proj.description}</p>
            {proj.technologies?.length > 0 && (
              <p className="text-xs text-slate-500 mt-0.5 italic">
                Technologies: {proj.technologies.join(', ')}
              </p>
            )}
          </div>
        ))}
      </section>
    )}

    {/* Certifications */}
    {data.certifications?.length > 0 && (
      <section className="mb-2">
        <h2 className="text-xs font-bold uppercase tracking-widest text-blue-700 border-b border-blue-200 pb-1 mb-2">
          Certifications
        </h2>
        <ul className="space-y-0.5">
          {data.certifications.map((cert, i) => (
            <li key={i} className="text-slate-700 before:content-['•'] before:mr-2 before:text-blue-600">{cert}</li>
          ))}
        </ul>
      </section>
    )}
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

const ResumePage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = authStore();

  const [selectedResumeId, setSelectedResumeId] = useState<number | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<number | ''>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'download'>('preview');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ── Queries ────────────────────────────────────────────────────────────────

  const { data: resumes = [], isLoading: resumesLoading } = useQuery<Resume[]>({
    queryKey: ['resumes'],
    queryFn: () => apiClient.get<Resume[]>('/resumes').then((r) => r.data),
    enabled: !!user,
  });

  const { data: jobs = [] } = useQuery<Job[]>({
    queryKey: ['jobs-all'],
    queryFn: () => apiClient.get<Job[]>('/jobs', { params: { limit: 100 } }).then((r) => r.data),
    enabled: !!user,
  });

  // ── Mutations ──────────────────────────────────────────────────────────────

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append('file', file);
      return apiClient.post<Resume>('/resumes/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }).then((r) => r.data);
    },
    onSuccess: (resume) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      setSelectedResumeId(resume.id);
      showToast('Resume uploaded! Text extracted successfully.');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.detail || 'Upload failed.', 'error');
    },
  });

  const optimizeMutation = useMutation({
    mutationFn: ({ resumeId, jobId }: { resumeId: number; jobId: number }) =>
      apiClient
        .post<Resume>(`/resumes/${resumeId}/optimize`, null, { params: { job_id: jobId } })
        .then((r) => r.data),
    onSuccess: (updated) => {
      // Immediately write the mutation result into the cache so `structured`
      // is non-null on the very next render — no waiting for a refetch.
      queryClient.setQueryData<Resume[]>(['resumes'], (old = []) =>
        old.map((r) => (r.id === updated.id ? updated : r))
      );
      setSelectedResumeId(updated.id);
      setActiveTab('preview');
      showToast('AI optimization complete!');
    },
    onError: (err: any) => {
      showToast(err.response?.data?.detail || 'AI optimization failed.', 'error');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/resumes/${id}`),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      if (selectedResumeId === id) setSelectedResumeId(null);
      showToast('Resume deleted.');
    },
  });

  // ── Derived state ──────────────────────────────────────────────────────────

  const selectedResume = resumes.find((r) => r.id === selectedResumeId) ?? null;
  const structured = tryParseStructured(selectedResume?.optimized_content);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = '';
  };

  const handleOptimize = () => {
    if (!selectedResumeId) {
      showToast('Select a resume first.', 'error');
      return;
    }
    if (!selectedJobId) {
      showToast('Select a Job Description to optimize for.', 'error');
      return;
    }
    optimizeMutation.mutate({ resumeId: selectedResumeId, jobId: Number(selectedJobId) });
  };

  const handleDownload = async (type: 'pdf' | 'docx') => {
    if (!selectedResume) return;
    const base = selectedResume.file_name.replace(/\.[^.]+$/, '');
    const filename = `${base}_optimized.${type}`;
    try {
      await downloadBlob(`/resumes/${selectedResume.id}/download/${type}`, filename);
      showToast(`Downloaded ${filename}`);
    } catch (err: any) {
      // When responseType is 'blob', error response bodies are also Blobs — parse them.
      let detail = err?.message || 'Unknown error';
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await (err.response.data as Blob).text();
          const json = JSON.parse(text);
          if (json?.detail) detail = json.detail;
        } catch {}
      } else if (err?.response?.data?.detail) {
        detail = err.response.data.detail;
      }
      showToast(`Download failed: ${detail}`, 'error');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900">
        <p className="text-slate-400">Please log in to manage your resumes.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-xl transition-all
          ${toast.type === 'success' ? 'bg-green-900/90 border border-green-700 text-green-200' : 'bg-red-900/90 border border-red-700 text-red-200'}`}>
          {toast.type === 'success'
            ? <CheckCircle className="h-4 w-4 flex-shrink-0" />
            : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
          {toast.msg}
          <button onClick={() => setToast(null)} className="ml-2 opacity-60 hover:opacity-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <FileText className="h-8 w-8 text-primary-400" />
          <div>
            <h1 className="text-3xl font-bold text-white">AI Resume Optimizer</h1>
            <p className="text-slate-400 text-sm mt-0.5">Upload your resume, pick a job, let AI tailor it perfectly</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ── LEFT PANEL ── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Upload zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 cursor-pointer transition-colors
                ${uploadMutation.isPending
                  ? 'border-primary-500 bg-primary-900/10'
                  : 'border-slate-600 bg-slate-800 hover:border-primary-500 hover:bg-slate-800/80'}`}
            >
              <Upload className={`h-9 w-9 ${uploadMutation.isPending ? 'text-primary-400 animate-bounce' : 'text-slate-400'}`} />
              {uploadMutation.isPending ? (
                <div className="flex items-center gap-2 text-sm text-primary-400">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
                  Extracting text from file…
                </div>
              ) : (
                <>
                  <p className="text-sm font-medium text-slate-300">Click to upload resume</p>
                  <p className="text-xs text-slate-500">PDF, DOCX, or TXT — max 5 MB</p>
                </>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Resume list */}
            <div className="rounded-xl border border-slate-700 bg-slate-800">
              <div className="px-4 py-3 border-b border-slate-700">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
                  Your Resumes ({resumes.length})
                </p>
              </div>

              {resumesLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-400 border-t-transparent" />
                </div>
              ) : resumes.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No resumes yet</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-700">
                  {resumes.map((resume) => {
                    const isSelected = resume.id === selectedResumeId;
                    const isOpt = !!tryParseStructured(resume.optimized_content);
                    return (
                      <div
                        key={resume.id}
                        onClick={() => setSelectedResumeId(resume.id)}
                        className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                          ${isSelected ? 'bg-primary-900/30 border-l-2 border-primary-500' : 'hover:bg-slate-700/40 border-l-2 border-transparent'}`}
                      >
                        <FileText className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-primary-400' : 'text-slate-500'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {resume.file_name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {new Date(resume.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                            {isOpt && <span className="ml-2 text-green-400 font-medium">✓ Optimized</span>}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          {isSelected && <ChevronRight className="h-4 w-4 text-primary-400" />}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete "${resume.file_name}"?`)) deleteMutation.mutate(resume.id);
                            }}
                            className="rounded p-1 text-slate-500 hover:text-red-400 hover:bg-slate-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="lg:col-span-3 space-y-4">

            {/* No selection placeholder */}
            {!selectedResume ? (
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/50 py-24">
                <Zap className="h-12 w-12 text-slate-600 mb-3" />
                <p className="text-slate-400 font-medium">Select a resume to optimize</p>
                <p className="text-slate-500 text-sm mt-1">Upload or click a resume on the left</p>
              </div>
            ) : (
              <>
                {/* Optimization controls */}
                <div className="rounded-xl border border-slate-700 bg-slate-800 p-5">
                  <p className="text-sm font-semibold text-white mb-3">
                    Optimizing: <span className="text-primary-400">{selectedResume.file_name}</span>
                  </p>

                  {/* Job selector */}
                  <div className="mb-4">
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Select Job Description <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={selectedJobId}
                      onChange={(e) => setSelectedJobId(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-600 bg-slate-700 text-white px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none"
                    >
                      <option value="">— Choose a job to tailor the resume —</option>
                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title} @ {job.company}
                        </option>
                      ))}
                    </select>
                    {selectedJobId && (
                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {jobs.find((j) => j.id === Number(selectedJobId))?.description?.slice(0, 120)}…
                      </p>
                    )}
                  </div>

                  {/* Validations */}
                  {!selectedJobId && (
                    <p className="flex items-center gap-1.5 text-xs text-amber-400 mb-3">
                      <AlertCircle className="h-3.5 w-3.5" /> Select a job description to enable optimization
                    </p>
                  )}

                  {/* Optimize button */}
                  <button
                    onClick={handleOptimize}
                    disabled={optimizeMutation.isPending || !selectedJobId}
                    className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary-600 py-2.5 text-sm font-semibold text-white
                      hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {optimizeMutation.isPending ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Optimizing with AI…
                      </>
                    ) : (
                      <>
                        <Zap className="h-4 w-4" />
                        AI Optimize Resume
                      </>
                    )}
                  </button>
                </div>

                {/* ATS + Keywords (only after optimization) */}
                {structured && (
                  <>
                    <ATSScoreBadge
                      before={structured.ats_score_before ?? 0}
                      after={structured.ats_score_after ?? 0}
                    />
                    {structured.keywords_added?.length > 0 && (
                      <KeywordsAdded keywords={structured.keywords_added} />
                    )}
                  </>
                )}

                {/* Tabs: Preview / Download */}
                {structured && (
                  <div className="rounded-xl border border-slate-700 bg-slate-800 overflow-hidden">
                    {/* Tab bar */}
                    <div className="flex border-b border-slate-700">
                      {(['preview', 'download'] as const).map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`flex-1 py-3 text-sm font-medium transition-colors capitalize
                            ${activeTab === tab
                              ? 'bg-slate-700 text-white border-b-2 border-primary-500'
                              : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`}
                        >
                          {tab === 'preview' ? '👁 Preview' : '⬇ Download'}
                        </button>
                      ))}
                    </div>

                    {/* Preview tab */}
                    {activeTab === 'preview' && (
                      <div className="p-4 max-h-[70vh] overflow-y-auto">
                        <ResumePreview data={structured} />
                      </div>
                    )}

                    {/* Download tab */}
                    {activeTab === 'download' && (
                      <div className="p-6 space-y-4">
                        <p className="text-sm text-slate-400">
                          Your optimized resume is ready. Download in your preferred format:
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <button
                            onClick={() => handleDownload('pdf')}
                            className="flex flex-col items-center gap-2 rounded-xl border border-red-700/50 bg-red-900/20 p-5 hover:bg-red-900/30 hover:border-red-600 transition-colors"
                          >
                            <FileDown className="h-8 w-8 text-red-400" />
                            <span className="text-sm font-semibold text-white">Download PDF</span>
                            <span className="text-xs text-slate-400">Best for sharing</span>
                          </button>
                          <button
                            onClick={() => handleDownload('docx')}
                            className="flex flex-col items-center gap-2 rounded-xl border border-blue-700/50 bg-blue-900/20 p-5 hover:bg-blue-900/30 hover:border-blue-600 transition-colors"
                          >
                            <FileText className="h-8 w-8 text-blue-400" />
                            <span className="text-sm font-semibold text-white">Download DOCX</span>
                            <span className="text-xs text-slate-400">Best for editing</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 text-center">
                          Both formats are ATS-optimized and professionally formatted
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Prompt when no optimization yet */}
                {!structured && !optimizeMutation.isPending && (
                  <div className="rounded-xl border border-dashed border-slate-700 bg-slate-800/40 p-8 text-center">
                    <Zap className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-400 text-sm">Select a job and click <strong>AI Optimize Resume</strong> to see the magic</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResumePage;

import React, { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Sparkles, Upload, Edit3, CheckCircle, ArrowRight, X, Check } from 'lucide-react';
import apiClient from '@/lib/api';
import { useNavigate } from 'react-router-dom';

type OnboardingStep = 'welcome' | 'upload' | 'review' | 'manual' | 'complete' | null;

interface OnboardingTourProps {
  onDismiss: () => void;
}

const cardStyle: React.CSSProperties = {
  background: 'rgba(13,28,45,0.98)',
  border: '1px solid rgba(208,188,255,0.2)',
  borderRadius: '20px',
  padding: '40px',
  maxWidth: '480px',
  width: '100%',
  position: 'relative',
};

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(5,20,36,0.88)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 2000,
  padding: '20px',
  backdropFilter: 'blur(4px)',
};

const btnPrimary: React.CSSProperties = {
  background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)',
  color: '#051424',
  border: 'none',
  borderRadius: '10px',
  padding: '12px 24px',
  fontSize: '14px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(73,68,84,0.4)',
  borderRadius: '10px',
  color: '#7b9ab8',
  padding: '12px 24px',
  fontSize: '14px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
};

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onDismiss }) => {
  const [step, setStep] = useState<OnboardingStep>('welcome');
  const [parsedData, setParsedData] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const importMutation = useMutation({
    mutationFn: (d: any) => apiClient.post('/profile/import-parsed', d),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setStep('complete');
    },
  });

  const markCompleteMutation = useMutation({
    mutationFn: () => apiClient.put('/profile', { is_profile_complete: true } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      onDismiss();
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setParseError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await apiClient.post('/profile/parse-resume', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setParsedData(res.data.data);
      setStep('review');
    } catch (err: any) {
      setParseError(err.response?.data?.detail || 'Failed to parse resume. Please try again.');
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Step: Welcome ──────────────────────────────────────────────────────────
  if (step === 'welcome') return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(208,188,255,0.12)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
            <Sparkles size={32} style={{ color: '#d0bcff' }} />
          </div>
          <h2 style={{ color: '#d4e4fa', fontWeight: 700, fontSize: '24px', margin: '0 0 8px' }}>Welcome to RoleGenie!</h2>
          <p style={{ color: '#7b9ab8', fontSize: '14px', lineHeight: 1.6 }}>
            Let's set up your profile to get the best resume optimizations.<br />Your profile is the source of truth — AI can only use what's in it.
          </p>
        </div>

        <p style={{ color: '#d4e4fa', fontSize: '13px', fontWeight: 600, marginBottom: '12px', textAlign: 'center' }}>Choose how to get started:</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <button onClick={() => fileInputRef.current?.click()} style={btnPrimary}>
            <Upload size={16} /> Upload Existing Resume — Auto-fill profile
          </button>
          <button onClick={() => { setStep('manual'); onDismiss(); navigate('/profile'); }} style={btnGhost}>
            <Edit3 size={16} /> Fill in Manually
          </button>
        </div>

        <p style={{ color: '#494454', fontSize: '11px', textAlign: 'center', marginTop: '16px', cursor: 'pointer' }} onClick={onDismiss}>
          Skip for now
        </p>

        <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />

        {parsing && (
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#d0bcff', justifyContent: 'center' }}>
            <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid rgba(208,188,255,0.3)', borderTopColor: '#d0bcff', animation: 'spin 0.8s linear infinite' }} />
            Parsing your resume with AI…
          </div>
        )}
        {parseError && <p style={{ color: '#ffb4ab', fontSize: '12px', marginTop: '12px', textAlign: 'center' }}>{parseError}</p>}
      </div>
    </div>
  );

  // ── Step: Review extracted data ────────────────────────────────────────────
  if (step === 'review' && parsedData) {
    const stats = [
      { label: 'Name', value: [parsedData.first_name, parsedData.last_name].filter(Boolean).join(' ') || '—', ok: !!(parsedData.first_name || parsedData.last_name) },
      { label: 'Skills', value: `${(parsedData.skills || []).length} found`, ok: (parsedData.skills || []).length > 0 },
      { label: 'Experience', value: `${(parsedData.experiences || []).length} role${(parsedData.experiences || []).length !== 1 ? 's' : ''}`, ok: (parsedData.experiences || []).length > 0 },
      { label: 'Projects', value: `${(parsedData.experiences || []).reduce((a: number, e: any) => a + (e.projects || []).length, 0)} found`, ok: true },
      { label: 'Education', value: `${(parsedData.education || []).length} entr${(parsedData.education || []).length !== 1 ? 'ies' : 'y'}`, ok: (parsedData.education || []).length > 0 },
      { label: 'Certifications', value: `${(parsedData.certifications || []).length} found`, ok: true },
    ];

    return (
      <div style={overlayStyle}>
        <div style={cardStyle}>
          <h2 style={{ color: '#d4e4fa', fontWeight: 700, fontSize: '20px', margin: '0 0 4px' }}>We extracted this from your resume</h2>
          <p style={{ color: '#7b9ab8', fontSize: '13px', marginBottom: '24px' }}>Review and confirm to save everything to your profile.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
            {stats.map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#7b9ab8', fontSize: '14px' }}>{s.label}</span>
                <span style={{ color: s.ok ? '#4edea3' : '#ffb4ab', fontSize: '14px', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {s.ok ? <Check size={13} /> : <X size={13} />} {s.value}
                </span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => { importMutation.mutate(parsedData); }} disabled={importMutation.isPending} style={btnPrimary}>
              {importMutation.isPending ? 'Saving…' : <><CheckCircle size={16} /> Confirm & Save</>}
            </button>
            <button onClick={() => { onDismiss(); navigate('/profile'); }} style={btnGhost}>
              <Edit3 size={14} /> Edit First
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Step: Complete ─────────────────────────────────────────────────────────
  if (step === 'complete') return (
    <div style={overlayStyle}>
      <div style={{ ...cardStyle, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', background: 'rgba(78,222,163,0.12)', borderRadius: '16px', padding: '16px', marginBottom: '16px' }}>
          <CheckCircle size={32} style={{ color: '#4edea3' }} />
        </div>
        <h2 style={{ color: '#d4e4fa', fontWeight: 700, fontSize: '22px', margin: '0 0 8px' }}>
          Profile Complete! ({queryClient.getQueryData<any>(['profile'])?.profile_completeness ?? '—'}%)
        </h2>
        <p style={{ color: '#7b9ab8', fontSize: '14px', lineHeight: 1.6, marginBottom: '28px' }}>
          You're ready to optimize resumes. Head to Resume Optimizer to start tailoring your profile for any job.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' }}>
          <button onClick={() => { markCompleteMutation.mutate(); navigate('/resume'); }} style={btnPrimary}>
            Go to Resume Optimizer <ArrowRight size={16} />
          </button>
          <button onClick={() => markCompleteMutation.mutate()} style={btnGhost}>
            Add more details later
          </button>
        </div>
      </div>
    </div>
  );

  return null;
};

export default OnboardingTour;

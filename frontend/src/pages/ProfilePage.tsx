import React, { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  User, Briefcase, GraduationCap, Award, FolderOpen,
  Plus, X, Edit2, Check, ChevronDown, ChevronUp, Upload,
  Sparkles, AlertCircle,
} from 'lucide-react';
import apiClient from '@/lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Skill { id: number; name: string; category: string }
interface Project { id: number; name: string; description?: string; technologies?: string; bullets?: string[]; experience_id?: number }
interface Experience { id: number; job_title: string; company: string; location?: string; start_date: string; end_date?: string; is_current: boolean; description?: string; projects: Project[] }
interface Education { id: number; degree: string; institution: string; year?: string; details?: string }
interface Certification { id: number; name: string; issuer?: string; date?: string; credential_url?: string }

interface FullProfile {
  id: number; email: string; username: string;
  first_name?: string; last_name?: string;
  profile_headline?: string; phone?: string; location?: string;
  linkedin_url?: string; github_url?: string; portfolio_url?: string;
  professional_summary?: string;
  profile_completeness: number; is_profile_complete: boolean;
  skills: Skill[]; experiences: Experience[];
  education: Education[]; certifications: Certification[];
  standalone_projects: Project[];
}

const SKILL_CATEGORIES = ['language', 'framework', 'database', 'tool', 'cloud', 'soft_skill', 'other'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  language: 'Languages', framework: 'Frameworks', database: 'Databases',
  tool: 'Tools', cloud: 'Cloud', soft_skill: 'Soft Skills', other: 'Other',
};

// ─── Shared styling ───────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'rgba(13,28,45,0.9)',
  border: '1px solid rgba(73,68,84,0.3)',
  borderRadius: '16px',
  padding: '24px',
};

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(73,68,84,0.4)',
  borderRadius: '8px',
  color: '#d4e4fa',
  padding: '8px 12px',
  width: '100%',
  fontSize: '14px',
  outline: 'none',
};

const labelStyle: React.CSSProperties = {
  fontSize: '11px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#7b9ab8',
  marginBottom: '4px',
  display: 'block',
};

const btnPrimary: React.CSSProperties = {
  background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)',
  color: '#051424',
  border: 'none',
  borderRadius: '8px',
  padding: '8px 16px',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
};

const btnGhost: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid rgba(73,68,84,0.4)',
  borderRadius: '8px',
  color: '#7b9ab8',
  padding: '6px 12px',
  fontSize: '12px',
  cursor: 'pointer',
};

// ─── Completeness Bar ─────────────────────────────────────────────────────────

const CompletenessBar: React.FC<{ score: number }> = ({ score }) => {
  const next = score < 100 ? Math.min(score + 10, 100) : 100;
  return (
    <div style={{ ...cardStyle, marginBottom: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <span style={{ color: '#d4e4fa', fontWeight: 600, fontSize: '15px' }}>Profile Completeness</span>
        <span style={{ color: '#4edea3', fontWeight: 700, fontSize: '18px' }}>{score}%</span>
      </div>
      <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(90deg,#d0bcff,#4edea3)', height: '100%', width: `${score}%`, borderRadius: '999px', transition: 'width 0.5s ease' }} />
      </div>
      {score < 100 && (
        <p style={{ color: '#7b9ab8', fontSize: '12px', marginTop: '8px' }}>
          Complete missing sections to reach {next}%
        </p>
      )}
    </div>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{ icon: React.ReactNode; title: string; onAdd?: () => void; addLabel?: string }> = ({ icon, title, onAdd, addLabel }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span style={{ color: '#d0bcff' }}>{icon}</span>
      <h3 style={{ color: '#d4e4fa', fontWeight: 700, fontSize: '15px', margin: 0 }}>{title}</h3>
    </div>
    {onAdd && (
      <button onClick={onAdd} style={btnGhost}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Plus size={13} /> {addLabel || 'Add'}
        </span>
      </button>
    )}
  </div>
);

// ─── Basic Info Section ───────────────────────────────────────────────────────

const BasicInfoSection: React.FC<{ profile: FullProfile; onSave: (d: any) => void; saving: boolean }> = ({ profile, onSave, saving }) => {
  const [form, setForm] = useState({
    first_name: profile.first_name || '',
    last_name: profile.last_name || '',
    profile_headline: profile.profile_headline || '',
    phone: profile.phone || '',
    location: profile.location || '',
    linkedin_url: profile.linkedin_url || '',
    github_url: profile.github_url || '',
    portfolio_url: profile.portfolio_url || '',
    professional_summary: profile.professional_summary || '',
  });

  const Field: React.FC<{ label: string; field: keyof typeof form; placeholder?: string; textarea?: boolean }> = ({ label, field, placeholder, textarea }) => (
    <div>
      <label style={labelStyle}>{label}</label>
      {textarea ? (
        <textarea
          value={form[field]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          placeholder={placeholder}
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      ) : (
        <input
          type="text"
          value={form[field]}
          onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
          placeholder={placeholder}
          style={inputStyle}
        />
      )}
    </div>
  );

  return (
    <div style={cardStyle}>
      <SectionHeader icon={<User size={16} />} title="Basic Info" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <Field label="First Name" field="first_name" placeholder="Aditya" />
        <Field label="Last Name" field="last_name" placeholder="Soni" />
        <Field label="Profile Headline" field="profile_headline" placeholder="Software Developer | .NET Core | React" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={labelStyle}>Email</label>
          <input type="text" value={profile.email} disabled style={{ ...inputStyle, opacity: 0.5 }} />
        </div>
        <Field label="Phone" field="phone" placeholder="+1 234 567 8900" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <Field label="Location" field="location" placeholder="City, Country" />
        <Field label="LinkedIn URL" field="linkedin_url" placeholder="linkedin.com/in/..." />
        <Field label="GitHub URL" field="github_url" placeholder="github.com/..." />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <Field label="Portfolio URL" field="portfolio_url" placeholder="yoursite.com" />
      </div>
      <div style={{ marginBottom: '16px' }}>
        <Field label="Professional Summary" field="professional_summary" placeholder="Brief professional overview..." textarea />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button onClick={() => onSave(form)} disabled={saving} style={btnPrimary}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

// ─── Skills Section ───────────────────────────────────────────────────────────

const SkillsSection: React.FC<{ skills: Skill[]; onAdd: (s: { name: string; category: string }) => void; onDelete: (id: number) => void }> = ({ skills, onAdd, onDelete }) => {
  const [newSkill, setNewSkill] = useState('');
  const [newCat, setNewCat] = useState('language');
  const [adding, setAdding] = useState(false);

  const byCategory = SKILL_CATEGORIES.reduce<Record<string, Skill[]>>((acc, cat) => {
    acc[cat] = skills.filter(s => s.category === cat);
    return acc;
  }, {} as Record<string, Skill[]>);

  const handleAdd = () => {
    if (!newSkill.trim()) return;
    onAdd({ name: newSkill.trim(), category: newCat });
    setNewSkill('');
    setAdding(false);
  };

  return (
    <div style={cardStyle}>
      <SectionHeader icon={<Award size={16} />} title="Skills" onAdd={() => setAdding(a => !a)} addLabel="Add Skill" />

      {adding && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Skill name"
            style={{ ...inputStyle, width: '200px', flex: '0 0 200px' }}
            autoFocus
          />
          <select
            value={newCat}
            onChange={e => setNewCat(e.target.value)}
            style={{ ...inputStyle, width: '160px', flex: '0 0 160px' }}
          >
            {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
          <button onClick={handleAdd} style={btnPrimary}>Add</button>
          <button onClick={() => setAdding(false)} style={btnGhost}>Cancel</button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {SKILL_CATEGORIES.map(cat => {
          const catSkills = byCategory[cat];
          if (catSkills.length === 0) return null;
          return (
            <div key={cat} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ ...labelStyle, margin: 0, minWidth: '90px', textAlign: 'right', paddingRight: '8px', borderRight: '1px solid rgba(73,68,84,0.3)' }}>{CATEGORY_LABELS[cat]}</span>
              {catSkills.map(s => (
                <span key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(208,188,255,0.08)', border: '1px solid rgba(208,188,255,0.2)', borderRadius: '999px', padding: '3px 10px', color: '#d0bcff', fontSize: '12px' }}>
                  {s.name}
                  <button onClick={() => onDelete(s.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 2px', color: '#7b9ab8', display: 'flex' }}>
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          );
        })}
        {skills.length === 0 && <p style={{ color: '#7b9ab8', fontSize: '13px' }}>No skills added yet. Click "Add Skill" to start.</p>}
      </div>
    </div>
  );
};

// ─── Project Form ─────────────────────────────────────────────────────────────

const ProjectForm: React.FC<{
  initial?: Partial<Project>;
  onSave: (d: any) => void;
  onCancel: () => void;
  experienceId?: number;
}> = ({ initial, onSave, onCancel, experienceId }) => {
  const [form, setForm] = useState({
    name: initial?.name || '',
    description: initial?.description || '',
    technologies: initial?.technologies || '',
    bullets: (initial?.bullets || []).join('\n'),
  });

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(73,68,84,0.25)', borderRadius: '10px', padding: '14px', marginTop: '8px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        <div>
          <label style={labelStyle}>Project Name *</label>
          <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="Data Centre Management App" />
        </div>
        <div>
          <label style={labelStyle}>Technologies</label>
          <input value={form.technologies} onChange={e => setForm(f => ({ ...f, technologies: e.target.value }))} style={inputStyle} placeholder="C#, .NET Core, SQL Server" />
        </div>
      </div>
      <div style={{ marginBottom: '10px' }}>
        <label style={labelStyle}>Description</label>
        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} placeholder="What was built and why" />
      </div>
      <div style={{ marginBottom: '12px' }}>
        <label style={labelStyle}>Bullet Points (one per line)</label>
        <textarea value={form.bullets} onChange={e => setForm(f => ({ ...f, bullets: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Optimized APIs, reducing response time by 40%&#10;Designed Generator Log API handling 1000+ records" />
      </div>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button onClick={onCancel} style={btnGhost}>Cancel</button>
        <button onClick={() => onSave({ ...form, bullets: form.bullets.split('\n').map(b => b.trim()).filter(Boolean), experience_id: experienceId })} style={btnPrimary}>Save Project</button>
      </div>
    </div>
  );
};

// ─── Experience Section ───────────────────────────────────────────────────────

const ExperienceSection: React.FC<{
  experiences: Experience[];
  onAddExp: (d: any) => void;
  onUpdateExp: (id: number, d: any) => void;
  onDeleteExp: (id: number) => void;
  onAddProject: (d: any) => void;
  onUpdateProject: (id: number, d: any) => void;
  onDeleteProject: (id: number) => void;
}> = ({ experiences, onAddExp, onUpdateExp, onDeleteExp, onAddProject, onUpdateProject, onDeleteProject }) => {
  const [editingExpId, setEditingExpId] = useState<number | 'new' | null>(null);
  const [addingProjectFor, setAddingProjectFor] = useState<number | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [expandedExp, setExpandedExp] = useState<Set<number>>(new Set(experiences.map(e => e.id)));

  const ExpForm: React.FC<{ initial?: Partial<Experience>; onSave: (d: any) => void; onCancel: () => void }> = ({ initial, onSave, onCancel }) => {
    const [form, setForm] = useState({
      job_title: initial?.job_title || '',
      company: initial?.company || '',
      location: initial?.location || '',
      start_date: initial?.start_date || '',
      end_date: initial?.end_date || '',
      is_current: initial?.is_current || false,
      description: initial?.description || '',
    });
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(73,68,84,0.25)', borderRadius: '10px', padding: '14px', marginBottom: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div><label style={labelStyle}>Job Title *</label><input value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} style={inputStyle} placeholder="Software Developer" /></div>
          <div><label style={labelStyle}>Company *</label><input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} style={inputStyle} placeholder="PODTECH" /></div>
          <div><label style={labelStyle}>Location</label><input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} style={inputStyle} placeholder="Johannesburg, SA" /></div>
          <div><label style={labelStyle}>Start Date</label><input value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} style={inputStyle} placeholder="Jun 2025" /></div>
          <div>
            <label style={labelStyle}>End Date</label>
            <input value={form.is_current ? '' : form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} style={{ ...inputStyle, opacity: form.is_current ? 0.4 : 1 }} placeholder="May 2027" disabled={form.is_current} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: '2px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#d4e4fa', fontSize: '13px' }}>
              <input type="checkbox" checked={form.is_current} onChange={e => setForm(f => ({ ...f, is_current: e.target.checked, end_date: e.target.checked ? '' : f.end_date }))} />
              Current position
            </label>
          </div>
        </div>
        <div style={{ marginBottom: '12px' }}>
          <label style={labelStyle}>Role Overview</label>
          <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Brief description of this role..." />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={btnGhost}>Cancel</button>
          <button onClick={() => onSave(form)} style={btnPrimary}>Save Experience</button>
        </div>
      </div>
    );
  };

  return (
    <div style={cardStyle}>
      <SectionHeader icon={<Briefcase size={16} />} title="Experience" onAdd={() => setEditingExpId('new')} addLabel="Add Experience" />

      {editingExpId === 'new' && (
        <ExpForm onSave={(d) => { onAddExp(d); setEditingExpId(null); }} onCancel={() => setEditingExpId(null)} />
      )}

      {experiences.length === 0 && <p style={{ color: '#7b9ab8', fontSize: '13px' }}>No experience added yet.</p>}

      {experiences.map(exp => {
        const isExpanded = expandedExp.has(exp.id);
        return (
          <div key={exp.id} style={{ border: '1px solid rgba(73,68,84,0.2)', borderRadius: '10px', marginBottom: '12px', overflow: 'hidden' }}>
            {/* Experience header */}
            {editingExpId === exp.id ? (
              <div style={{ padding: '12px' }}>
                <ExpForm
                  initial={exp}
                  onSave={(d) => { onUpdateExp(exp.id, d); setEditingExpId(null); }}
                  onCancel={() => setEditingExpId(null)}
                />
              </div>
            ) : (
              <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button onClick={() => setExpandedExp(s => { const n = new Set(s); isExpanded ? n.delete(exp.id) : n.add(exp.id); return n; })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7b9ab8', display: 'flex' }}>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                    <span style={{ color: '#d4e4fa', fontWeight: 600, fontSize: '14px' }}>{exp.job_title} · {exp.company}</span>
                  </div>
                  <p style={{ color: '#7b9ab8', fontSize: '12px', marginTop: '2px', paddingLeft: '22px' }}>
                    {exp.start_date} – {exp.is_current ? 'Present' : exp.end_date || ''}
                    {exp.location && ` · ${exp.location}`}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => setEditingExpId(exp.id)} style={{ ...btnGhost, padding: '4px 8px' }}><Edit2 size={12} /></button>
                  <button onClick={() => onDeleteExp(exp.id)} style={{ ...btnGhost, padding: '4px 8px', color: '#ffb4ab' }}><X size={12} /></button>
                </div>
              </div>
            )}

            {/* Projects nested under experience */}
            {isExpanded && editingExpId !== exp.id && (
              <div style={{ padding: '8px 14px 14px 36px', borderTop: '1px solid rgba(73,68,84,0.15)' }}>
                <p style={{ ...labelStyle, marginBottom: '8px' }}>Projects</p>

                {exp.projects.map(proj => (
                  <div key={proj.id} style={{ marginBottom: '8px' }}>
                    {editingProjectId === proj.id ? (
                      <ProjectForm
                        initial={proj}
                        experienceId={exp.id}
                        onSave={(d) => { onUpdateProject(proj.id, d); setEditingProjectId(null); }}
                        onCancel={() => setEditingProjectId(null)}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', padding: '8px 10px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <FolderOpen size={13} style={{ color: '#4edea3' }} />
                            <span style={{ color: '#d4e4fa', fontSize: '13px', fontWeight: 500 }}>{proj.name}</span>
                          </div>
                          {proj.technologies && <p style={{ color: '#7b9ab8', fontSize: '11px', marginTop: '2px' }}>{proj.technologies}</p>}
                          {proj.bullets && proj.bullets.length > 0 && (
                            <ul style={{ marginTop: '4px', paddingLeft: '14px' }}>
                              {proj.bullets.slice(0, 2).map((b, i) => <li key={i} style={{ color: '#7b9ab8', fontSize: '11px' }}>{b}</li>)}
                              {proj.bullets.length > 2 && <li style={{ color: '#494454', fontSize: '11px' }}>+{proj.bullets.length - 2} more…</li>}
                            </ul>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          <button onClick={() => setEditingProjectId(proj.id)} style={{ ...btnGhost, padding: '3px 7px' }}><Edit2 size={11} /></button>
                          <button onClick={() => onDeleteProject(proj.id)} style={{ ...btnGhost, padding: '3px 7px', color: '#ffb4ab' }}><X size={11} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {addingProjectFor === exp.id ? (
                  <ProjectForm
                    experienceId={exp.id}
                    onSave={(d) => { onAddProject(d); setAddingProjectFor(null); }}
                    onCancel={() => setAddingProjectFor(null)}
                  />
                ) : (
                  <button onClick={() => setAddingProjectFor(exp.id)} style={{ ...btnGhost, marginTop: '6px', fontSize: '11px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={11} /> Add Project</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ─── Education Section ────────────────────────────────────────────────────────

const EducationSection: React.FC<{
  education: Education[];
  onAdd: (d: any) => void;
  onUpdate: (id: number, d: any) => void;
  onDelete: (id: number) => void;
}> = ({ education, onAdd, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);

  const EduForm: React.FC<{ initial?: Partial<Education>; onSave: (d: any) => void; onCancel: () => void }> = ({ initial, onSave, onCancel }) => {
    const [form, setForm] = useState({ degree: initial?.degree || '', institution: initial?.institution || '', year: initial?.year || '', details: initial?.details || '' });
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(73,68,84,0.25)', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div><label style={labelStyle}>Degree *</label><input value={form.degree} onChange={e => setForm(f => ({ ...f, degree: e.target.value }))} style={inputStyle} placeholder="B.E. Computer Science" /></div>
          <div><label style={labelStyle}>Institution *</label><input value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} style={inputStyle} placeholder="Gyan Ganga College" /></div>
          <div><label style={labelStyle}>Year</label><input value={form.year} onChange={e => setForm(f => ({ ...f, year: e.target.value }))} style={inputStyle} placeholder="2015 – 2019" /></div>
          <div><label style={labelStyle}>Details</label><input value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))} style={inputStyle} placeholder="Relevant coursework, honors..." /></div>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={btnGhost}>Cancel</button>
          <button onClick={() => onSave(form)} style={btnPrimary}>Save Education</button>
        </div>
      </div>
    );
  };

  return (
    <div style={cardStyle}>
      <SectionHeader icon={<GraduationCap size={16} />} title="Education" onAdd={() => setEditingId('new')} addLabel="Add Education" />
      {editingId === 'new' && <EduForm onSave={(d) => { onAdd(d); setEditingId(null); }} onCancel={() => setEditingId(null)} />}
      {education.length === 0 && <p style={{ color: '#7b9ab8', fontSize: '13px' }}>No education added yet.</p>}
      {education.map(edu => editingId === edu.id ? (
        <EduForm key={edu.id} initial={edu} onSave={(d) => { onUpdate(edu.id, d); setEditingId(null); }} onCancel={() => setEditingId(null)} />
      ) : (
        <div key={edu.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '10px', border: '1px solid rgba(73,68,84,0.2)', borderRadius: '8px', marginBottom: '8px' }}>
          <div>
            <p style={{ color: '#d4e4fa', fontSize: '14px', fontWeight: 600 }}>{edu.degree}</p>
            <p style={{ color: '#7b9ab8', fontSize: '12px' }}>{edu.institution}{edu.year ? ` · ${edu.year}` : ''}</p>
            {edu.details && <p style={{ color: '#7b9ab8', fontSize: '11px', fontStyle: 'italic' }}>{edu.details}</p>}
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setEditingId(edu.id)} style={{ ...btnGhost, padding: '4px 8px' }}><Edit2 size={12} /></button>
            <button onClick={() => onDelete(edu.id)} style={{ ...btnGhost, padding: '4px 8px', color: '#ffb4ab' }}><X size={12} /></button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Certifications Section ───────────────────────────────────────────────────

const CertificationsSection: React.FC<{
  certifications: Certification[];
  onAdd: (d: any) => void;
  onUpdate: (id: number, d: any) => void;
  onDelete: (id: number) => void;
}> = ({ certifications, onAdd, onUpdate, onDelete }) => {
  const [editingId, setEditingId] = useState<number | 'new' | null>(null);

  const CertForm: React.FC<{ initial?: Partial<Certification>; onSave: (d: any) => void; onCancel: () => void }> = ({ initial, onSave, onCancel }) => {
    const [form, setForm] = useState({ name: initial?.name || '', issuer: initial?.issuer || '', date: initial?.date || '', credential_url: initial?.credential_url || '' });
    return (
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(73,68,84,0.25)', borderRadius: '10px', padding: '14px', marginBottom: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
          <div><label style={labelStyle}>Certification Name *</label><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="AZ-900: Azure Fundamentals" /></div>
          <div><label style={labelStyle}>Issuer</label><input value={form.issuer} onChange={e => setForm(f => ({ ...f, issuer: e.target.value }))} style={inputStyle} placeholder="Microsoft" /></div>
          <div><label style={labelStyle}>Date</label><input value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} style={inputStyle} placeholder="Jan 2024" /></div>
          <div><label style={labelStyle}>Credential URL</label><input value={form.credential_url} onChange={e => setForm(f => ({ ...f, credential_url: e.target.value }))} style={inputStyle} placeholder="https://..." /></div>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={btnGhost}>Cancel</button>
          <button onClick={() => onSave(form)} style={btnPrimary}>Save Certification</button>
        </div>
      </div>
    );
  };

  return (
    <div style={cardStyle}>
      <SectionHeader icon={<Award size={16} />} title="Certifications" onAdd={() => setEditingId('new')} addLabel="Add Certification" />
      {editingId === 'new' && <CertForm onSave={(d) => { onAdd(d); setEditingId(null); }} onCancel={() => setEditingId(null)} />}
      {certifications.length === 0 && <p style={{ color: '#7b9ab8', fontSize: '13px' }}>No certifications added yet.</p>}
      {certifications.map(cert => editingId === cert.id ? (
        <CertForm key={cert.id} initial={cert} onSave={(d) => { onUpdate(cert.id, d); setEditingId(null); }} onCancel={() => setEditingId(null)} />
      ) : (
        <div key={cert.id} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '10px', border: '1px solid rgba(73,68,84,0.2)', borderRadius: '8px', marginBottom: '8px' }}>
          <div>
            <p style={{ color: '#d4e4fa', fontSize: '14px', fontWeight: 600 }}>{cert.name}</p>
            <p style={{ color: '#7b9ab8', fontSize: '12px' }}>{[cert.issuer, cert.date].filter(Boolean).join(' · ')}</p>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button onClick={() => setEditingId(cert.id)} style={{ ...btnGhost, padding: '4px 8px' }}><Edit2 size={12} /></button>
            <button onClick={() => onDelete(cert.id)} style={{ ...btnGhost, padding: '4px 8px', color: '#ffb4ab' }}><X size={12} /></button>
          </div>
        </div>
      ))}
    </div>
  );
};

// ─── Import Banner ────────────────────────────────────────────────────────────

const ImportBanner: React.FC<{ onImport: () => void }> = ({ onImport }) => (
  <div style={{ ...cardStyle, marginBottom: '24px', background: 'linear-gradient(135deg, rgba(208,188,255,0.06) 0%, rgba(78,222,163,0.06) 100%)', border: '1px solid rgba(208,188,255,0.2)' }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ background: 'rgba(208,188,255,0.15)', borderRadius: '10px', padding: '10px', display: 'flex' }}>
          <Sparkles size={20} style={{ color: '#d0bcff' }} />
        </div>
        <div>
          <p style={{ color: '#d4e4fa', fontWeight: 600, fontSize: '14px', margin: 0 }}>Quick Setup: Import from your resume</p>
          <p style={{ color: '#7b9ab8', fontSize: '12px', margin: '2px 0 0' }}>Upload a PDF/DOCX and we'll auto-fill your profile in seconds</p>
        </div>
      </div>
      <button onClick={onImport} style={btnPrimary}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><Upload size={14} /> Upload Resume to Import</span>
      </button>
    </div>
  </div>
);

// ─── Import Review Modal ──────────────────────────────────────────────────────

const ImportReviewModal: React.FC<{
  data: any;
  onConfirm: () => void;
  onCancel: () => void;
  importing: boolean;
}> = ({ data, onConfirm, onCancel, importing }) => {
  const stats = [
    { label: 'Name', value: [data.first_name, data.last_name].filter(Boolean).join(' ') || '—' },
    { label: 'Skills', value: `${(data.skills || []).length} found` },
    { label: 'Experience', value: `${(data.experiences || []).length} role${(data.experiences || []).length !== 1 ? 's' : ''}` },
    { label: 'Projects', value: `${(data.experiences || []).reduce((acc: number, e: any) => acc + (e.projects || []).length, 0)} found` },
    { label: 'Education', value: `${(data.education || []).length} entr${(data.education || []).length !== 1 ? 'ies' : 'y'}` },
    { label: 'Certifications', value: `${(data.certifications || []).length} found` },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(5,20,36,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
      <div style={{ ...cardStyle, maxWidth: '480px', width: '100%' }}>
        <h3 style={{ color: '#d4e4fa', fontWeight: 700, fontSize: '18px', marginBottom: '4px' }}>We extracted this from your resume</h3>
        <p style={{ color: '#7b9ab8', fontSize: '13px', marginBottom: '20px' }}>Review the summary below and confirm to save everything to your profile.</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
          {stats.map(s => (
            <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#7b9ab8', fontSize: '13px' }}>{s.label}</span>
              <span style={{ color: '#4edea3', fontSize: '13px', fontWeight: 500 }}>
                <Check size={12} style={{ display: 'inline', marginRight: '4px' }} />{s.value}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={btnGhost}>Cancel</button>
          <button onClick={onConfirm} disabled={importing} style={btnPrimary}>
            {importing ? 'Importing…' : 'Confirm & Save to Profile'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main ProfilePage ─────────────────────────────────────────────────────────

const ProfilePage: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedData, setParsedData] = useState<any>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  const { data: profile, isLoading } = useQuery<FullProfile>({
    queryKey: ['profile'],
    queryFn: async () => (await apiClient.get('/profile')).data,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['profile'] });

  // Basic info
  const updateBasicsMutation = useMutation({
    mutationFn: (d: any) => apiClient.put('/profile', d),
    onSuccess: invalidate,
  });

  // Skills
  const addSkillMutation = useMutation({ mutationFn: (d: any) => apiClient.post('/profile/skills', d), onSuccess: invalidate });
  const deleteSkillMutation = useMutation({ mutationFn: (id: number) => apiClient.delete(`/profile/skills/${id}`), onSuccess: invalidate });

  // Experiences
  const addExpMutation = useMutation({ mutationFn: (d: any) => apiClient.post('/profile/experiences', d), onSuccess: invalidate });
  const updateExpMutation = useMutation({ mutationFn: ({ id, d }: { id: number; d: any }) => apiClient.put(`/profile/experiences/${id}`, d), onSuccess: invalidate });
  const deleteExpMutation = useMutation({ mutationFn: (id: number) => apiClient.delete(`/profile/experiences/${id}`), onSuccess: invalidate });

  // Projects
  const addProjMutation = useMutation({ mutationFn: (d: any) => apiClient.post('/profile/projects', d), onSuccess: invalidate });
  const updateProjMutation = useMutation({ mutationFn: ({ id, d }: { id: number; d: any }) => apiClient.put(`/profile/projects/${id}`, d), onSuccess: invalidate });
  const deleteProjMutation = useMutation({ mutationFn: (id: number) => apiClient.delete(`/profile/projects/${id}`), onSuccess: invalidate });

  // Education
  const addEduMutation = useMutation({ mutationFn: (d: any) => apiClient.post('/profile/education', d), onSuccess: invalidate });
  const updateEduMutation = useMutation({ mutationFn: ({ id, d }: { id: number; d: any }) => apiClient.put(`/profile/education/${id}`, d), onSuccess: invalidate });
  const deleteEduMutation = useMutation({ mutationFn: (id: number) => apiClient.delete(`/profile/education/${id}`), onSuccess: invalidate });

  // Certifications
  const addCertMutation = useMutation({ mutationFn: (d: any) => apiClient.post('/profile/certifications', d), onSuccess: invalidate });
  const updateCertMutation = useMutation({ mutationFn: ({ id, d }: { id: number; d: any }) => apiClient.put(`/profile/certifications/${id}`, d), onSuccess: invalidate });
  const deleteCertMutation = useMutation({ mutationFn: (id: number) => apiClient.delete(`/profile/certifications/${id}`), onSuccess: invalidate });

  // Import
  const importMutation = useMutation({
    mutationFn: (d: any) => apiClient.post('/profile/import-parsed', d),
    onSuccess: () => { invalidate(); setParsedData(null); },
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
    } catch (err: any) {
      setParseError(err.response?.data?.detail || 'Failed to parse resume. Please try again.');
    } finally {
      setParsing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading || !profile) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(73,68,84,0.3)', borderTopColor: '#d0bcff', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Page title */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ color: '#d4e4fa', fontWeight: 700, fontSize: '22px', margin: 0 }}>My Profile</h1>
        <p style={{ color: '#7b9ab8', fontSize: '13px', marginTop: '4px' }}>Your profile is the source of truth for all resume generation.</p>
      </div>

      {/* Completeness bar */}
      <CompletenessBar score={profile.profile_completeness} />

      {/* Import banner */}
      <ImportBanner onImport={() => fileInputRef.current?.click()} />
      <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />

      {parsing && (
        <div style={{ ...cardStyle, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', color: '#d0bcff' }}>
          <div style={{ width: '18px', height: '18px', borderRadius: '50%', border: '2px solid rgba(208,188,255,0.3)', borderTopColor: '#d0bcff', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          Parsing your resume with AI…
        </div>
      )}
      {parseError && (
        <div style={{ ...cardStyle, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px', color: '#ffb4ab', border: '1px solid rgba(255,180,171,0.25)' }}>
          <AlertCircle size={16} /> {parseError}
        </div>
      )}

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <BasicInfoSection
          profile={profile}
          onSave={(d) => updateBasicsMutation.mutate(d)}
          saving={updateBasicsMutation.isPending}
        />

        <SkillsSection
          skills={profile.skills}
          onAdd={(s) => addSkillMutation.mutate(s)}
          onDelete={(id) => deleteSkillMutation.mutate(id)}
        />

        <ExperienceSection
          experiences={profile.experiences}
          onAddExp={(d) => addExpMutation.mutate(d)}
          onUpdateExp={(id, d) => updateExpMutation.mutate({ id, d })}
          onDeleteExp={(id) => deleteExpMutation.mutate(id)}
          onAddProject={(d) => addProjMutation.mutate(d)}
          onUpdateProject={(id, d) => updateProjMutation.mutate({ id, d })}
          onDeleteProject={(id) => deleteProjMutation.mutate(id)}
        />

        <EducationSection
          education={profile.education}
          onAdd={(d) => addEduMutation.mutate(d)}
          onUpdate={(id, d) => updateEduMutation.mutate({ id, d })}
          onDelete={(id) => deleteEduMutation.mutate(id)}
        />

        <CertificationsSection
          certifications={profile.certifications}
          onAdd={(d) => addCertMutation.mutate(d)}
          onUpdate={(id, d) => updateCertMutation.mutate({ id, d })}
          onDelete={(id) => deleteCertMutation.mutate(id)}
        />
      </div>

      {/* Import review modal */}
      {parsedData && (
        <ImportReviewModal
          data={parsedData}
          onConfirm={() => importMutation.mutate(parsedData)}
          onCancel={() => setParsedData(null)}
          importing={importMutation.isPending}
        />
      )}
    </div>
  );
};

export default ProfilePage;

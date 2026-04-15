import React from 'react';
import { ResumeTemplate } from '@/data/resumeTemplates';

interface Props {
  template: ResumeTemplate;
  selected?: boolean;
  locked?: boolean;
  onClick?: () => void;
}

// ─── SVG Builder ─────────────────────────────────────────────────────────────

function buildPreviewSvg(t: ResumeTemplate): string {
  const W = 240;
  const H = 310;
  const P = 14; // padding
  const CW = W - P * 2; // content width = 212

  const { colorScheme: cs, features: f } = t;
  const elems: string[] = [];

  const r = (x: number, y: number, w: number, h: number, fill: string, rx = 2) =>
    `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${Math.max(w, 1).toFixed(1)}" height="${h.toFixed(1)}" rx="${rx}" fill="${fill}"/>`;

  const hline = (x: number, y: number, w: number, color: string) =>
    `<line x1="${x.toFixed(1)}" y1="${y.toFixed(1)}" x2="${(x + w).toFixed(1)}" y2="${y.toFixed(1)}" stroke="${color}" stroke-width="0.75"/>`;

  const dot = (x: number, y: number) =>
    `<circle cx="${(x + 1.5).toFixed(1)}" cy="${(y + 2.5).toFixed(1)}" r="1.2" fill="${cs.mutedText}"/>`;

  // Light gray placeholder bar for body text
  const bar = (x: number, y: number, w: number) =>
    r(x, y, w, 4.5, '#e2e8f0', 2);

  let y = 0;

  // ── Background ──
  elems.push(r(0, 0, W, H, cs.background, 0));

  // ── Header ──
  if (f.hasColoredHeader) {
    const headerH = 50;
    elems.push(r(0, 0, W, headerH, cs.headerBg, 0));
    y = P;

    // Name bar (white, centered in colored header)
    const nameW = CW * 0.60;
    elems.push(r((W - nameW) / 2, y, nameW, 8, cs.headerText, 3));
    y += 12;

    // Contact bars (white-ish)
    const c1 = CW * 0.35, c2 = CW * 0.28;
    const totalCW = c1 + 6 + c2;
    const startX = (W - totalCW) / 2;
    elems.push(r(startX, y, c1, 4, `${cs.headerText}80`, 2));
    elems.push(r(startX + c1 + 6, y, c2, 4, `${cs.headerText}80`, 2));
    y = headerH + 8;
  } else {
    y = P;

    // Name bar (primary color, centered)
    const nameW = CW * 0.62;
    const nameX = (W - nameW) / 2;
    elems.push(r(nameX, y, nameW, 8, cs.primary, 3));
    y += 12;

    // Contact bars — three small gray bars
    const c1 = CW * 0.30, c2 = CW * 0.25, c3 = CW * 0.22;
    const gap = (CW - c1 - c2 - c3) / 2;
    elems.push(bar(P, y, c1));
    elems.push(bar(P + c1 + gap, y, c2));
    elems.push(bar(P + c1 + gap + c2 + gap, y, c3));
    y += 9;

    // Thin accent line under header area
    elems.push(hline(P, y, CW, cs.primary));
    y += 8;
  }

  // ── Section order based on template features ──
  const sections: string[] = [];
  if (f.skillsPosition === 'top') sections.push('skills');
  sections.push('summary');
  if (f.skillsPosition === 'after-summary') sections.push('skills');
  if (f.projectsPosition === 'top') sections.push('projects');
  sections.push('experience');
  if (f.projectsPosition === 'after-experience') sections.push('projects');
  sections.push('education');
  if (f.skillsPosition === 'bottom') sections.push('skills');

  // ── Section heading helper ──
  const sectionHead = (label: string): boolean => {
    if (y > H - 28) return false;
    const lw = Math.min(label.length * 4.6, CW * 0.58);
    elems.push(r(P, y, lw, 6, cs.primary, 1));
    y += 9;
    elems.push(hline(P, y, CW, cs.sectionBorder));
    y += 5;
    return true;
  };

  // ── Text bar width sequence (varies to look natural) ──
  const W_SEQ = [0.92, 0.85, 0.73, 0.88, 0.68, 0.80, 0.76, 0.90, 0.71, 0.83];

  const bodyBars = (count: number) => {
    for (let i = 0; i < count; i++) {
      if (y > H - 12) break;
      elems.push(bar(P, y, CW * W_SEQ[i % W_SEQ.length]));
      y += 7;
    }
  };

  const skillPills = () => {
    const row1 = [32, 28, 38, 26, 30];
    const row2 = [30, 34, 24, 32];

    const drawRow = (widths: number[]) => {
      let x = P;
      for (const pw of widths) {
        if (x + pw > P + CW) break;
        elems.push(r(x, y, pw, 11, cs.skillPillBg, 5));
        elems.push(r(x + 4, y + 3.5, pw - 8, 4, `${cs.skillPillText}80`, 1));
        x += pw + 4;
      }
    };

    drawRow(row1);
    y += 14;
    if (y < H - 16) { drawRow(row2); y += 14; }
  };

  const skillsInline = () => {
    elems.push(bar(P, y, CW * 0.90));
    y += 7;
    if (y < H - 10) { elems.push(bar(P, y, CW * 0.72)); y += 7; }
  };

  const expEntry = () => {
    if (y > H - 38) return;

    // Job title (bold-ish bar) + date (right-aligned gray bar)
    elems.push(r(P, y, CW * 0.52, 5.5, `${cs.bodyText}90`, 2));
    elems.push(bar(P + CW * 0.60, y, CW * 0.38));
    y += 8;

    // Company name (primary-tinted)
    if (y < H - 10) {
      elems.push(r(P, y, CW * 0.38, 5, `${cs.primary}55`, 2));
      y += 7;
    }

    // Bullets (3 lines with dot)
    const bW = [0.80, 0.70, 0.76];
    for (let i = 0; i < 3; i++) {
      if (y > H - 10) break;
      elems.push(dot(P + 2, y));
      elems.push(bar(P + 9, y, (CW - 9) * bW[i]));
      y += 6.5;
    }
    y += 4;
  };

  // ── Render each section ──
  for (const section of sections) {
    if (y > H - 22) break;

    switch (section) {
      case 'summary': {
        if (!sectionHead('SUMMARY')) break;
        bodyBars(3);
        y += 4;
        break;
      }
      case 'skills': {
        if (!sectionHead('SKILLS')) break;
        if (f.hasSkillPills) skillPills();
        else skillsInline();
        y += 3;
        break;
      }
      case 'experience': {
        if (!sectionHead('EXPERIENCE')) break;
        expEntry();
        if (y < H - 42) expEntry();
        break;
      }
      case 'projects': {
        if (!sectionHead('PROJECTS')) break;
        // Project name bar
        if (y < H - 10) {
          elems.push(r(P, y, CW * 0.46, 5.5, `${cs.bodyText}70`, 2));
          y += 8;
        }
        // Two bullet bars
        if (y < H - 10) {
          elems.push(dot(P + 2, y));
          elems.push(bar(P + 9, y, (CW - 9) * 0.76));
          y += 7;
        }
        if (y < H - 10) {
          elems.push(dot(P + 2, y));
          elems.push(bar(P + 9, y, (CW - 9) * 0.62));
          y += 8;
        }
        break;
      }
      case 'education': {
        if (!sectionHead('EDUCATION')) break;
        if (y < H - 10) {
          elems.push(r(P, y, CW * 0.58, 5.5, `${cs.bodyText}80`, 2));
          y += 8;
        }
        if (y < H - 10) {
          elems.push(bar(P, y, CW * 0.44));
          y += 7;
        }
        break;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <filter id="sh-${t.id}" x="-5%" y="-5%" width="110%" height="110%">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.12)"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" rx="0" fill="${cs.background}" filter="url(#sh-${t.id})"/>
  ${elems.join('\n  ')}
</svg>`;
}

// ─── Component ────────────────────────────────────────────────────────────────

const ResumeTemplatePreview: React.FC<Props> = ({ template: t, selected, locked, onClick }) => {
  const svgString = buildPreviewSvg(t);

  return (
    <div
      onClick={onClick}
      style={{
        cursor: locked ? 'default' : 'pointer',
        position: 'relative',
        borderRadius: 12,
        border: selected
          ? `2px solid ${t.colorScheme.primary}`
          : '2px solid rgba(73,68,84,0.25)',
        overflow: 'hidden',
        opacity: locked ? 0.72 : 1,
        transition: 'border-color 0.18s ease, box-shadow 0.18s ease',
        boxShadow: selected
          ? `0 0 0 3px ${t.colorScheme.primary}30`
          : 'none',
      }}
      onMouseEnter={(e) => {
        if (!selected && !locked) {
          (e.currentTarget as HTMLDivElement).style.borderColor = `${t.colorScheme.primary}70`;
        }
      }}
      onMouseLeave={(e) => {
        if (!selected && !locked) {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(73,68,84,0.25)';
        }
      }}
    >
      {/* SVG miniature preview */}
      <div
        style={{ display: 'block', lineHeight: 0 }}
        dangerouslySetInnerHTML={{ __html: svgString }}
      />

      {/* PRO lock overlay */}
      {locked && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(5,20,36,0.58)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backdropFilter: 'blur(2px)',
          }}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #d0bcff, #4edea3)',
              padding: '5px 14px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              color: '#051424',
              letterSpacing: '0.05em',
            }}
          >
            PRO
          </div>
        </div>
      )}

      {/* Selected checkmark badge */}
      {selected && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: t.colorScheme.primary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {/* Name + description footer */}
      <div style={{ padding: '9px 11px 10px', background: 'rgba(13,28,45,0.88)' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#d4e4fa', marginBottom: 2 }}>
          {t.name}
        </div>
        <div
          style={{
            fontSize: 10,
            color: '#6b7d8e',
            lineHeight: 1.4,
            marginBottom: 6,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {t.description}
        </div>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {t.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 8,
                padding: '2px 5px',
                borderRadius: 3,
                background: `${t.colorScheme.primary}20`,
                color: locked ? '#4b5563' : t.colorScheme.primary,
                fontFamily: "'JetBrains Mono', 'Courier New', monospace",
                letterSpacing: '0.03em',
                fontWeight: 600,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ResumeTemplatePreview;

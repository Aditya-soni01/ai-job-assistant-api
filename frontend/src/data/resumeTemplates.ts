export interface ResumeTemplate {
  id: string;
  name: string;
  description: string;
  tags: string[];
  tier: 'free' | 'pro';
  layout: 'single-column' | 'two-column' | 'sidebar-left' | 'sidebar-right';
  colorScheme: {
    primary: string;
    secondary: string;
    headerBg: string;
    headerText: string;
    bodyText: string;
    mutedText: string;
    sectionBorder: string;
    skillPillBg: string;
    skillPillText: string;
    background: string;
  };
  typography: {
    nameSize: number;
    headlineSize: number;
    sectionHeadingSize: number;
    bodySize: number;
    fontFamily: string;
    headingStyle: 'uppercase' | 'titlecase' | 'bold-only';
  };
  features: {
    hasPhoto: boolean;
    hasSidebarSkills: boolean;
    hasSkillBars: boolean;
    hasSkillPills: boolean;
    hasSectionDividers: boolean;
    hasColoredHeader: boolean;
    projectsPosition: 'after-experience' | 'top' | 'sidebar';
    skillsPosition: 'top' | 'after-summary' | 'sidebar' | 'bottom';
  };
}

export const RESUME_TEMPLATES: ResumeTemplate[] = [
  {
    id: 'classic-professional',
    name: 'Classic Professional',
    description: 'Clean layout with centered header and blue section dividers. Standard ATS-safe structure.',
    tags: ['ATS', 'PROFESSIONAL', 'GENERAL'],
    tier: 'free',
    layout: 'single-column',
    colorScheme: {
      primary: '#1a5276',
      secondary: '#2e86c1',
      headerBg: '#ffffff',
      headerText: '#1a5276',
      bodyText: '#2c3e50',
      mutedText: '#7f8c8d',
      sectionBorder: '#1a5276',
      skillPillBg: '#eaf2f8',
      skillPillText: '#1a5276',
      background: '#ffffff',
    },
    typography: {
      nameSize: 22,
      headlineSize: 11,
      sectionHeadingSize: 13,
      bodySize: 10,
      fontFamily: 'Helvetica',
      headingStyle: 'uppercase',
    },
    features: {
      hasPhoto: false,
      hasSidebarSkills: false,
      hasSkillBars: false,
      hasSkillPills: false,
      hasSectionDividers: true,
      hasColoredHeader: false,
      projectsPosition: 'after-experience',
      skillsPosition: 'after-summary',
    },
  },
  {
    id: 'compact-ats',
    name: 'Compact ATS',
    description: 'Dense single-column with teal accents. Fits more content on one page without sacrificing readability.',
    tags: ['ATS', 'COMPACT', 'ONE-PAGE'],
    tier: 'free',
    layout: 'single-column',
    colorScheme: {
      primary: '#0e8a7d',
      secondary: '#14b8a6',
      headerBg: '#ffffff',
      headerText: '#0e8a7d',
      bodyText: '#1f2937',
      mutedText: '#6b7280',
      sectionBorder: '#0e8a7d',
      skillPillBg: '#f0fdfa',
      skillPillText: '#0e8a7d',
      background: '#ffffff',
    },
    typography: {
      nameSize: 20,
      headlineSize: 10,
      sectionHeadingSize: 11,
      bodySize: 9.5,
      fontFamily: 'Helvetica',
      headingStyle: 'bold-only',
    },
    features: {
      hasPhoto: false,
      hasSidebarSkills: false,
      hasSkillBars: false,
      hasSkillPills: true,
      hasSectionDividers: true,
      hasColoredHeader: false,
      projectsPosition: 'after-experience',
      skillsPosition: 'after-summary',
    },
  },
  {
    id: 'modern-ats-professional',
    name: 'Modern ATS Professional',
    description: 'Contemporary design with left-aligned name, violet accents, and bold section headers.',
    tags: ['ATS', 'MODERN', 'TECH'],
    tier: 'free',
    layout: 'single-column',
    colorScheme: {
      primary: '#6c3483',
      secondary: '#a569bd',
      headerBg: '#ffffff',
      headerText: '#6c3483',
      bodyText: '#2c3e50',
      mutedText: '#7f8c8d',
      sectionBorder: '#6c3483',
      skillPillBg: '#f4ecf7',
      skillPillText: '#6c3483',
      background: '#ffffff',
    },
    typography: {
      nameSize: 24,
      headlineSize: 12,
      sectionHeadingSize: 13,
      bodySize: 10,
      fontFamily: 'Helvetica',
      headingStyle: 'uppercase',
    },
    features: {
      hasPhoto: false,
      hasSidebarSkills: false,
      hasSkillBars: false,
      hasSkillPills: false,
      hasSectionDividers: true,
      hasColoredHeader: false,
      projectsPosition: 'after-experience',
      skillsPosition: 'after-summary',
    },
  },
  {
    id: 'clean-minimal',
    name: 'Clean Minimal One-Column',
    description: 'Typography-first minimalist resume. Maximum whitespace, understated section markers.',
    tags: ['MINIMAL', 'ATS', 'CLEAN'],
    tier: 'pro',
    layout: 'single-column',
    colorScheme: {
      primary: '#374151',
      secondary: '#9ca3af',
      headerBg: '#ffffff',
      headerText: '#111827',
      bodyText: '#374151',
      mutedText: '#9ca3af',
      sectionBorder: '#e5e7eb',
      skillPillBg: '#f3f4f6',
      skillPillText: '#374151',
      background: '#ffffff',
    },
    typography: {
      nameSize: 26,
      headlineSize: 11,
      sectionHeadingSize: 11,
      bodySize: 10,
      fontFamily: 'Times-Roman',
      headingStyle: 'titlecase',
    },
    features: {
      hasPhoto: false,
      hasSidebarSkills: false,
      hasSkillBars: false,
      hasSkillPills: false,
      hasSectionDividers: false,
      hasColoredHeader: false,
      projectsPosition: 'after-experience',
      skillsPosition: 'bottom',
    },
  },
  {
    id: 'technical-engineer',
    name: 'Technical Engineer',
    description: 'Skills section promoted to top. Green-accented layout built for software and backend engineers.',
    tags: ['ATS', 'TECHNICAL', 'ENGINEER'],
    tier: 'pro',
    layout: 'single-column',
    colorScheme: {
      primary: '#166534',
      secondary: '#22c55e',
      headerBg: '#ffffff',
      headerText: '#166534',
      bodyText: '#1f2937',
      mutedText: '#6b7280',
      sectionBorder: '#166534',
      skillPillBg: '#f0fdf4',
      skillPillText: '#166534',
      background: '#ffffff',
    },
    typography: {
      nameSize: 20,
      headlineSize: 11,
      sectionHeadingSize: 12,
      bodySize: 10,
      fontFamily: 'Helvetica',
      headingStyle: 'uppercase',
    },
    features: {
      hasPhoto: false,
      hasSidebarSkills: false,
      hasSkillBars: false,
      hasSkillPills: true,
      hasSectionDividers: true,
      hasColoredHeader: false,
      projectsPosition: 'after-experience',
      skillsPosition: 'top',
    },
  },
  {
    id: 'compact-one-page',
    name: 'Compact One-Page ATS',
    description: 'Tightly spaced ATS-safe layout optimized to fit maximum professional history on one page.',
    tags: ['ATS', 'COMPACT', 'ONE-PAGE'],
    tier: 'pro',
    layout: 'single-column',
    colorScheme: {
      primary: '#1e40af',
      secondary: '#3b82f6',
      headerBg: '#ffffff',
      headerText: '#1e40af',
      bodyText: '#1f2937',
      mutedText: '#6b7280',
      sectionBorder: '#1e40af',
      skillPillBg: '#eff6ff',
      skillPillText: '#1e40af',
      background: '#ffffff',
    },
    typography: {
      nameSize: 18,
      headlineSize: 9,
      sectionHeadingSize: 11,
      bodySize: 9,
      fontFamily: 'Helvetica',
      headingStyle: 'bold-only',
    },
    features: {
      hasPhoto: false,
      hasSidebarSkills: false,
      hasSkillBars: false,
      hasSkillPills: false,
      hasSectionDividers: true,
      hasColoredHeader: false,
      projectsPosition: 'after-experience',
      skillsPosition: 'after-summary',
    },
  },
  {
    id: 'executive-professional',
    name: 'Executive Professional',
    description: 'Conservative, authoritative layout for senior and leadership positions. No-frills corporate styling.',
    tags: ['EXECUTIVE', 'LEADERSHIP', 'CORPORATE'],
    tier: 'pro',
    layout: 'single-column',
    colorScheme: {
      primary: '#1f2937',
      secondary: '#4b5563',
      headerBg: '#1f2937',
      headerText: '#ffffff',
      bodyText: '#1f2937',
      mutedText: '#6b7280',
      sectionBorder: '#1f2937',
      skillPillBg: '#f3f4f6',
      skillPillText: '#1f2937',
      background: '#ffffff',
    },
    typography: {
      nameSize: 22,
      headlineSize: 11,
      sectionHeadingSize: 12,
      bodySize: 10.5,
      fontFamily: 'Times-Roman',
      headingStyle: 'uppercase',
    },
    features: {
      hasPhoto: false,
      hasSidebarSkills: false,
      hasSkillBars: false,
      hasSkillPills: false,
      hasSectionDividers: true,
      hasColoredHeader: true,
      projectsPosition: 'after-experience',
      skillsPosition: 'after-summary',
    },
  },
  {
    id: 'skills-first-hybrid',
    name: 'Skills-First Hybrid',
    description: 'Skills section leads above experience. Great for career changers and tech specialists.',
    tags: ['ATS', 'SKILLS', 'HYBRID'],
    tier: 'pro',
    layout: 'single-column',
    colorScheme: {
      primary: '#7c3aed',
      secondary: '#a78bfa',
      headerBg: '#ffffff',
      headerText: '#7c3aed',
      bodyText: '#1f2937',
      mutedText: '#6b7280',
      sectionBorder: '#7c3aed',
      skillPillBg: '#f5f3ff',
      skillPillText: '#7c3aed',
      background: '#ffffff',
    },
    typography: {
      nameSize: 20,
      headlineSize: 11,
      sectionHeadingSize: 12,
      bodySize: 10,
      fontFamily: 'Helvetica',
      headingStyle: 'uppercase',
    },
    features: {
      hasPhoto: false,
      hasSidebarSkills: false,
      hasSkillBars: false,
      hasSkillPills: true,
      hasSectionDividers: true,
      hasColoredHeader: false,
      projectsPosition: 'after-experience',
      skillsPosition: 'top',
    },
  },
  {
    id: 'project-heavy-developer',
    name: 'Project-Heavy Developer',
    description: 'Projects elevated near the top. Ideal for developers and engineers with a strong project portfolio.',
    tags: ['ATS', 'PROJECTS', 'DEVELOPER'],
    tier: 'pro',
    layout: 'single-column',
    colorScheme: {
      primary: '#dc2626',
      secondary: '#f87171',
      headerBg: '#ffffff',
      headerText: '#dc2626',
      bodyText: '#1f2937',
      mutedText: '#6b7280',
      sectionBorder: '#dc2626',
      skillPillBg: '#fef2f2',
      skillPillText: '#dc2626',
      background: '#ffffff',
    },
    typography: {
      nameSize: 20,
      headlineSize: 11,
      sectionHeadingSize: 12,
      bodySize: 10,
      fontFamily: 'Helvetica',
      headingStyle: 'bold-only',
    },
    features: {
      hasPhoto: false,
      hasSidebarSkills: false,
      hasSkillBars: false,
      hasSkillPills: true,
      hasSectionDividers: true,
      hasColoredHeader: false,
      projectsPosition: 'top',
      skillsPosition: 'after-summary',
    },
  },
  {
    id: 'elegant-corporate',
    name: 'Elegant Corporate ATS',
    description: 'Refined amber-accented layout with subtle borders. Ideal for finance, consulting, and corporate roles.',
    tags: ['ATS', 'CORPORATE', 'ELEGANT'],
    tier: 'pro',
    layout: 'single-column',
    colorScheme: {
      primary: '#b45309',
      secondary: '#f59e0b',
      headerBg: '#ffffff',
      headerText: '#b45309',
      bodyText: '#1f2937',
      mutedText: '#6b7280',
      sectionBorder: '#b45309',
      skillPillBg: '#fffbeb',
      skillPillText: '#b45309',
      background: '#ffffff',
    },
    typography: {
      nameSize: 22,
      headlineSize: 11,
      sectionHeadingSize: 12,
      bodySize: 10,
      fontFamily: 'Times-Roman',
      headingStyle: 'titlecase',
    },
    features: {
      hasPhoto: false,
      hasSidebarSkills: false,
      hasSkillBars: false,
      hasSkillPills: false,
      hasSectionDividers: true,
      hasColoredHeader: false,
      projectsPosition: 'after-experience',
      skillsPosition: 'after-summary',
    },
  },
];

export const FREE_TEMPLATE_IDS = ['classic-professional', 'compact-ats', 'modern-ats-professional'];

/** Map new slug IDs to legacy template_N keys used by the backend dispatch tables */
export const SLUG_TO_LEGACY: Record<string, string> = {
  'classic-professional':   'template_1',
  'compact-ats':            'template_2',
  'modern-ats-professional':'template_3',
  'clean-minimal':          'template_4',
  'technical-engineer':     'template_5',
  'compact-one-page':       'template_6',
  'executive-professional': 'template_7',
  'skills-first-hybrid':    'template_8',
  'project-heavy-developer':'template_9',
  'elegant-corporate':      'template_10',
};

import React, { useState } from 'react';
import { ChevronDown, Send, CheckCircle } from 'lucide-react';

const FAQS = [
  {
    q: 'How does resume optimization work?',
    a: 'RoleGenie uses a two-stage AI pipeline powered by Claude. Stage 1 analyzes your resume against the job description — identifying matched skills, gaps, and ATS compatibility. Stage 2 rewrites your resume with natural keyword integration, STAR-method bullet points, and a quantified summary tailored to the role.',
  },
  {
    q: 'What is an ATS score?',
    a: 'ATS stands for Applicant Tracking System — software that recruiters use to filter resumes before a human reads them. The ATS score (0–100) measures how well your resume matches the job\'s keywords, formatting, and requirements. A score above 75 significantly increases your chances of reaching the interview stage.',
  },
  {
    q: 'What file formats are supported?',
    a: 'You can upload PDF and DOCX files (up to 10 MB). After optimization, you can download the result as PDF or DOCX.',
  },
  {
    q: 'How many optimizations can I do for free?',
    a: 'The Free plan includes 5 optimizations per month. Each optimization counts as one use. Upgrading to Pro gives you unlimited optimizations along with advanced ATS insights and section-by-section AI rewrites.',
  },
  {
    q: 'Is my resume data secure?',
    a: 'Yes. Your resume content is transmitted over TLS (HTTPS) and stored encrypted at rest. We do not share your resume data with third parties, recruiters, or employers. You can delete your resumes at any time from the Resume Optimizer page.',
  },
];

const SupportPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // mailto fallback — swap for API call when support endpoint is ready
    const subject = encodeURIComponent('RoleGenie Support Request');
    const body = encodeURIComponent(
      `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`
    );
    window.open(`mailto:support@rolegenie.com?subject=${subject}&body=${body}`);
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-[#051424] p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-10">
        <h2 className="text-4xl font-bold tracking-tight text-[#d4e4fa] mb-1">Support</h2>
        <p className="mono-label text-[#cbc3d7]/60 text-sm uppercase tracking-widest">
          FAQ · Contact
        </p>
      </div>

      {/* ── FAQ ───────────────────────────────────────────────────────── */}
      <section className="mb-12">
        <h3 className="text-base font-bold text-[#d4e4fa] uppercase tracking-widest mono-label mb-5">
          Frequently Asked Questions
        </h3>
        <div className="space-y-2">
          {FAQS.map((faq, i) => (
            <div
              key={i}
              className="rounded-xl overflow-hidden"
              style={{ background: 'rgba(13,28,45,1)', border: '1px solid rgba(73,68,84,0.2)' }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-[#273647]/20 transition-colors"
              >
                <span className="text-sm font-semibold text-[#d4e4fa] pr-4">{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-[#d0bcff] flex-shrink-0 transition-transform duration-200 ${
                    openFaq === i ? 'rotate-180' : ''
                  }`}
                />
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-[#cbc3d7] leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Contact Form ─────────────────────────────────────────────── */}
      <section>
        <h3 className="text-base font-bold text-[#d4e4fa] uppercase tracking-widest mono-label mb-5">
          Contact Us
        </h3>
        <div
          className="rounded-2xl p-6"
          style={{ background: 'rgba(13,28,45,1)', border: '1px solid rgba(73,68,84,0.2)' }}
        >
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <CheckCircle className="w-12 h-12 text-[#4edea3] mx-auto" />
              <p className="font-bold text-[#d4e4fa]">Message sent!</p>
              <p className="text-sm text-[#cbc3d7]/70">We'll get back to you within 24 hours.</p>
              <button
                onClick={() => { setSubmitted(false); setForm({ name: '', email: '', message: '' }); }}
                className="text-xs text-[#d0bcff] hover:underline mt-2"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs mono-label text-slate-500 uppercase tracking-widest mb-1.5">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                    required
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-[#d4e4fa] bg-transparent focus:outline-none focus:ring-1 focus:ring-[#d0bcff]/40"
                    style={{ background: 'rgba(39,54,71,0.4)', border: '1px solid rgba(73,68,84,0.3)' }}
                  />
                </div>
                <div>
                  <label className="block text-xs mono-label text-slate-500 uppercase tracking-widest mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    required
                    className="w-full rounded-xl px-4 py-2.5 text-sm text-[#d4e4fa] bg-transparent focus:outline-none focus:ring-1 focus:ring-[#d0bcff]/40"
                    style={{ background: 'rgba(39,54,71,0.4)', border: '1px solid rgba(73,68,84,0.3)' }}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs mono-label text-slate-500 uppercase tracking-widest mb-1.5">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                  rows={5}
                  required
                  placeholder="Describe your issue or question…"
                  className="w-full rounded-xl px-4 py-3 text-sm text-[#d4e4fa] placeholder:text-slate-600 bg-transparent resize-none focus:outline-none focus:ring-1 focus:ring-[#d0bcff]/40"
                  style={{ background: 'rgba(39,54,71,0.4)', border: '1px solid rgba(73,68,84,0.3)' }}
                />
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold hover:opacity-90 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #d0bcff 0%, #4edea3 100%)', color: '#340080' }}
              >
                <Send className="w-4 h-4" />Send Message
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
};

export default SupportPage;

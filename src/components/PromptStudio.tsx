import React, { useState } from 'react';
import {
  GraduationCap,
  Briefcase,
  Mail,
  FileText,
  Calendar,
  Share2,
  TrendingUp,
  Award,
  Sparkles,
  Copy,
  Check,
  RotateCw,
  Download,
  BookOpen,
  Send,
  Building,
  UserCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { AIModelPersona } from '../types';
import { AIModelSelector } from './AIModelSelector';
import { exportToWord, exportToPdf, exportToTxt } from '../utils/exportUtils';

interface PromptStudioProps {
  isDark: boolean;
  themeStyles: any;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export type TemplateCategory = 'job' | 'academic';

export interface PromptTemplateItem {
  id: string;
  category: TemplateCategory;
  name: string;
  icon: React.ReactNode;
  tagline: string;
  defaultTopic: string;
  defaultRecipient: string;
  defaultDates: string;
  defaultDetails: string;
  suggestedTone: string;
}

export const TEMPLATES: PromptTemplateItem[] = [
  // Job Holders & Professionals
  {
    id: 'leave_letter',
    category: 'job',
    name: 'Official Leave Letter',
    icon: <Calendar className="w-4 h-4 text-emerald-500" />,
    tagline: 'Formal sick leave, annual vacation, or emergency absence application',
    defaultTopic: 'Annual Vacation Leave',
    defaultRecipient: 'Hiring Manager & HR Department',
    defaultDates: 'Nov 10 to Nov 17, 2026',
    defaultDetails: 'Taking scheduled family time. Handover prepared with Senior Developer Sarah.',
    suggestedTone: 'Formal, Courteous & Responsible',
  },
  {
    id: 'executive_email',
    category: 'job',
    name: 'Executive Email Writer',
    icon: <Mail className="w-4 h-4 text-blue-500" />,
    tagline: 'High-impact client proposals, urgent escalations & follow-ups',
    defaultTopic: 'Quarterly Strategic Deliverables & Timeline Sign-off',
    defaultRecipient: 'Client Executive Director',
    defaultDates: 'By Friday 5 PM EST',
    defaultDetails: 'Scope reviewed, 3 deliverables completed ahead of schedule, requesting final authorization.',
    suggestedTone: 'Executive, Crisp & Decisive',
  },
  {
    id: 'linkedin_post',
    category: 'job',
    name: 'LinkedIn Thought Leadership',
    icon: <Share2 className="w-4 h-4 text-sky-500" />,
    tagline: 'Viral career insights, project milestones, and recruiter connection notes',
    defaultTopic: 'Lessons learned scaling an AI engineering team from 2 to 20',
    defaultRecipient: 'Professional Network & Industry Peers',
    defaultDates: 'Immediate release',
    defaultDetails: 'Focus on communication clarity, psychological safety, and technical rigor.',
    suggestedTone: 'Inspirational, Authoritative & Engaging',
  },
  {
    id: 'salary_negotiation',
    category: 'job',
    name: 'Salary & Promotion Memo',
    icon: <TrendingUp className="w-4 h-4 text-amber-500" />,
    tagline: 'Value-driven case for compensation review and promotion elevation',
    defaultTopic: 'Senior Lead Promotion & Compensation Realignment',
    defaultRecipient: 'VP of Engineering',
    defaultDates: 'Annual Performance Review',
    defaultDetails: 'Spearheaded 40% latency reduction, saved $120k cloud expenditure, mentored 4 junior engineers.',
    suggestedTone: 'Confident, Objective & Collaborative',
  },
  {
    id: 'resignation_letter',
    category: 'job',
    name: 'Formal Resignation Letter',
    icon: <FileText className="w-4 h-4 text-rose-500" />,
    tagline: 'Graceful departure notice with transition commitments and gratitude',
    defaultTopic: 'Notice of Resignation',
    defaultRecipient: 'Department Head & People Operations',
    defaultDates: 'Two-week notice ending Nov 15, 2026',
    defaultDetails: 'Accepted new career opportunity. Committed to comprehensive knowledge transfer.',
    suggestedTone: 'Polite, Gracious & Professional',
  },

  // School & University
  {
    id: 'professor_email',
    category: 'academic',
    name: 'Professor / Teacher Email',
    icon: <GraduationCap className="w-4 h-4 text-purple-500" />,
    tagline: 'Assignment extension, office hours request, or grade clarification',
    defaultTopic: 'Assignment 3 Extension Request — CS 410',
    defaultRecipient: 'Professor Martinez',
    defaultDates: 'Extension until Wednesday midnight',
    defaultDetails: 'Recovering from mild flu, completed 70% of the lab work, seeking brief extension to polish analysis.',
    suggestedTone: 'Respectful, Humble & Well-Mannered',
  },
  {
    id: 'academic_outline',
    category: 'academic',
    name: 'Research Paper & Thesis Outline',
    icon: <BookOpen className="w-4 h-4 text-indigo-500" />,
    tagline: 'Thesis abstract, literature review breakdown, and methodology structure',
    defaultTopic: 'Impact of Real-Time Context Models on Human Communication Quality',
    defaultRecipient: 'Academic Review Committee',
    defaultDates: 'Semester Capstone',
    defaultDetails: 'Empirical study comparing generative responses vs human baseline conversations across 500 scenarios.',
    suggestedTone: 'Scholarly, Methodological & Rigorous',
  },
  {
    id: 'university_sop',
    category: 'academic',
    name: 'University SOP & Recommendation',
    icon: <Award className="w-4 h-4 text-cyan-500" />,
    tagline: 'Master’s / PhD Statement of Purpose or Professor Recommendation Letter',
    defaultTopic: 'Master of Science in Artificial Intelligence Application',
    defaultRecipient: 'Graduate Admissions Board',
    defaultDates: 'Fall 2027 Cohort',
    defaultDetails: 'Highlighting undergraduate research, open-source projects, and career vision in conversational agents.',
    suggestedTone: 'Passionate, Articulate & Goal-Driven',
  },
];

export const PromptStudio: React.FC<PromptStudioProps> = ({
  isDark,
  themeStyles,
  onShowToast,
}) => {
  const [activeCategory, setActiveCategory] = useState<TemplateCategory>('job');
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplateItem>(TEMPLATES[0]);
  const [aiModel, setAiModel] = useState<AIModelPersona>('gemini');

  // Input states
  const [topic, setTopic] = useState(selectedTemplate.defaultTopic);
  const [recipient, setRecipient] = useState(selectedTemplate.defaultRecipient);
  const [dates, setDates] = useState(selectedTemplate.defaultDates);
  const [details, setDetails] = useState(selectedTemplate.defaultDetails);
  const [tone, setTone] = useState(selectedTemplate.suggestedTone);
  const [includeHashtags, setIncludeHashtags] = useState(true);
  const [includeLinks, setIncludeLinks] = useState(true);

  // Output states
  const [generatedResult, setGeneratedResult] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Switch template
  const handleSelectTemplate = (tmpl: PromptTemplateItem) => {
    setSelectedTemplate(tmpl);
    setTopic(tmpl.defaultTopic);
    setRecipient(tmpl.defaultRecipient);
    setDates(tmpl.defaultDates);
    setDetails(tmpl.defaultDetails);
    setTone(tmpl.suggestedTone);
    setGeneratedResult('');
  };

  // Generate specialized content
  const handleGenerate = async () => {
    setIsGenerating(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 28000);
    try {
      const res = await fetch('/api/generate-specialized-template', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: selectedTemplate.id,
          subjectOrTopic: topic,
          recipient,
          details,
          dates,
          tone,
          includeHashtags,
          includeLinks,
          aiModel,
        }),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed with HTTP ${res.status}`);
      }
      if (data.content) {
        setGeneratedResult(data.content);
        onShowToast(`Generated ${selectedTemplate.name} successfully!`, 'success');
      } else {
        throw new Error(data.error || 'Failed to generate');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.name === 'AbortError' ? 'Request timed out. Please try again.' : err.message;
      onShowToast(`Generation error: ${msg}`, 'error');
    } finally {
      clearTimeout(timer);
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult);
    setCopied(true);
    onShowToast('Copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportWord = async () => {
    if (!generatedResult) return;
    try {
      await exportToWord({
        title: topic || selectedTemplate.name,
        template: selectedTemplate.name,
        platform: 'Professional Document',
        customNotes: generatedResult,
      });
      onShowToast('Word Document (.docx) downloaded successfully!', 'success');
    } catch (err: any) {
      onShowToast(`Failed to export Word: ${err.message}`, 'error');
    }
  };

  const handleExportPdf = async () => {
    if (!generatedResult) return;
    try {
      await exportToPdf({
        title: topic || selectedTemplate.name,
        template: selectedTemplate.name,
        platform: 'Professional Document',
        customNotes: generatedResult,
      });
      onShowToast('PDF Document (.pdf) downloaded successfully!', 'success');
    } catch (err: any) {
      onShowToast(`Failed to export PDF: ${err.message}`, 'error');
    }
  };

  const filteredTemplates = TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
            <h2 className={`text-xl font-black ${themeStyles.textPrimary}`}>
              Universal Prompt & Career Generator
            </h2>
          </div>
          <p className={`text-xs mt-1 ${themeStyles.textMuted}`}>
            Instant professional writing studio for job holders, corporate professionals, school
            students, and university academics.
          </p>
        </div>

        {/* Category Switcher Pill */}
        <div
          className={`flex items-center p-1 rounded-xl border ${
            isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-300 bg-slate-100'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              setActiveCategory('job');
              handleSelectTemplate(TEMPLATES.find((t) => t.category === 'job')!);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'job'
                ? 'bg-blue-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Job Holders & Career</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveCategory('academic');
              handleSelectTemplate(TEMPLATES.find((t) => t.category === 'academic')!);
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === 'academic'
                ? 'bg-purple-600 text-white shadow-sm'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>School & University</span>
          </button>
        </div>
      </div>

      {/* AI Model Persona Picker */}
      <AIModelSelector
        selectedModel={aiModel}
        onSelectModel={setAiModel}
        isDark={isDark}
        themeStyles={themeStyles}
      />

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Template Selector Column */}
        <div className="lg:col-span-4 space-y-2">
          <label className={`text-xs font-bold tracking-wide uppercase block mb-1 ${themeStyles.textSecondary}`}>
            Select Template ({filteredTemplates.length})
          </label>
          <div className="space-y-2">
            {filteredTemplates.map((tmpl) => {
              const isSelected = selectedTemplate.id === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tmpl)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start gap-3 ${
                    isSelected
                      ? `${isDark ? 'bg-[#1E2430] border-blue-500' : 'bg-blue-50 border-blue-600'} ring-1 ring-blue-500 shadow-sm`
                      : `${isDark ? 'bg-[#12161F] border-slate-800 hover:bg-[#1E2430]' : 'bg-white border-slate-200 hover:bg-slate-50'}`
                  }`}
                >
                  <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50 shrink-0 mt-0.5">
                    {tmpl.icon}
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${themeStyles.textPrimary}`}>
                      {tmpl.name}
                    </h4>
                    <p className={`text-[11px] leading-tight mt-0.5 ${themeStyles.textMuted}`}>
                      {tmpl.tagline}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Inputs & Result Column */}
        <div className="lg:col-span-8 space-y-4">
          <div
            className={`p-5 rounded-2xl border ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
            } space-y-4`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/30">
              <div className="flex items-center gap-2">
                {selectedTemplate.icon}
                <h3 className={`text-sm font-bold ${themeStyles.textPrimary}`}>
                  Configure: {selectedTemplate.name}
                </h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${themeStyles.badgeBg}`}>
                Ready to Generate
              </span>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${themeStyles.textSecondary}`}>
                  Subject / Main Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-bold mb-1 ${themeStyles.textSecondary}`}>
                  Recipient / Target Authority
                </label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-bold mb-1 ${themeStyles.textSecondary}`}>
                  Dates / Timeline
                </label>
                <input
                  type="text"
                  value={dates}
                  onChange={(e) => setDates(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-bold mb-1 ${themeStyles.textSecondary}`}>
                  Tone & Manner
                </label>
                <input
                  type="text"
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border focus:outline-none ${
                    isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className={`block text-[11px] font-bold mb-1 ${themeStyles.textSecondary}`}>
                Specific Details, Handover Notes, or Key Background
              </label>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                className={`w-full p-3 rounded-xl text-xs border focus:outline-none ${
                  isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-300'
                }`}
              />
            </div>

            {/* Checkboxes: Hashtags & Links */}
            <div className="flex flex-wrap items-center gap-5 pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHashtags}
                  onChange={(e) => setIncludeHashtags(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className={themeStyles.textPrimary}>Include Contextual #Hashtags</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeLinks}
                  onChange={(e) => setIncludeLinks(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className={themeStyles.textPrimary}>Include Actionable Resource Links</span>
              </label>
            </div>

            {/* Generate Button */}
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerate}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50`}
            >
              {isGenerating ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Flawless Draft...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate {selectedTemplate.name}</span>
                </>
              )}
            </button>
          </div>

          {/* Generated Result Output Box */}
          {generatedResult && (
            <div
              className={`p-5 rounded-2xl border transition-all ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
              } space-y-3 shadow-lg`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/30">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" /> Generated Ready-to-Use Draft
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportWord}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xs"
                  >
                    <FileSpreadsheet className="w-3 h-3" />
                    <span>Word (.docx)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-xs"
                  >
                    <Download className="w-3 h-3" />
                    <span>PDF</span>
                  </button>
                </div>
              </div>

              <div
                className={`p-4 rounded-xl font-mono text-xs leading-relaxed whitespace-pre-wrap select-text ${
                  isDark ? 'bg-slate-950 text-slate-200 border border-slate-800' : 'bg-slate-50 text-slate-900 border border-slate-200'
                }`}
              >
                {generatedResult}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

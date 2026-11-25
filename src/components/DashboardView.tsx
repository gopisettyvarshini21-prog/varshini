import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  FileText,
  Briefcase,
  LogOut,
  ShieldAlert,
  CheckCircle2,
  ThumbsUp,
  BadgeCheck,
  User,
  MessageSquareCode,
  Cpu,
  History,
  PenTool,
  ChevronRight,
  Sun,
  Sunset,
  Moon,
  Settings,
} from 'lucide-react';
import {
  ActiveTab,
  AIModelPersona,
  ReplyPreferenceProfile,
  SavedConversation,
  UILanguage,
  UserAuth,
} from '../types';
import { SampleChatPreset } from '../utils/sampleChats';
import { AI_MODELS } from './AIModelSelector';
import { BrandLogo } from './BrandLogo';
import { getTranslations } from '../utils/i18n';

interface DashboardViewProps {
  onStartNew: (sample?: SampleChatPreset) => void;
  onNavigate: (tab: ActiveTab) => void;
  recentConversations: SavedConversation[];
  currentUser: UserAuth | null;
  onLogin: (user: UserAuth) => void;
  onLogout: () => void;
  onOpenAuthModal: (
    tab?: 'user' | 'admin',
    providerDrawer?: 'google' | 'apple' | 'microsoft' | null,
    mode?: 'login' | 'signup',
    initialError?: string | null
  ) => void;
  feedbackProfile?: ReplyPreferenceProfile;
  onOpenFeedbackHistory?: () => void;
  onShowToast?: (text: string, type?: 'success' | 'error' | 'info') => void;
  activeModel?: AIModelPersona;
  hasApiKey?: boolean;
  isDark: boolean;
  themeStyles: any;
  uiLanguage?: UILanguage;
}

function getTimeGreeting(): { label: string; period: 'morning' | 'afternoon' | 'evening'; dateText: string } {
  const now = new Date();
  const hour = now.getHours();
  const dateText = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  if (hour >= 5 && hour < 12) {
    return { label: 'Good morning', period: 'morning', dateText };
  }
  if (hour >= 12 && hour < 17) {
    return { label: 'Good afternoon', period: 'afternoon', dateText };
  }
  return { label: 'Good evening', period: 'evening', dateText };
}

function getProviderLabel(provider?: UserAuth['provider']): string {
  switch (provider) {
    case 'google':
      return 'Google Account';
    case 'apple':
      return 'Apple ID';
    case 'microsoft':
      return 'Microsoft Account';
    case 'admin_portal':
      return 'Admin Credentials';
    default:
      return 'Email & Password';
  }
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onStartNew,
  onNavigate,
  recentConversations,
  currentUser,
  onLogout,
  onOpenAuthModal,
  feedbackProfile,
  onOpenFeedbackHistory,
  activeModel = 'gemini',
  hasApiKey = false,
  isDark,
  themeStyles,
  uiLanguage = 'en',
}) => {
  const activeModelMeta = AI_MODELS.find((m) => m.id === activeModel) || AI_MODELS[0];
  const greeting = useMemo(() => getTimeGreeting(), []);

  const t = getTranslations(uiLanguage);
  const firstName = currentUser?.name?.trim().split(/\s+/)[0] || '';
  const boardBoxClass = isDark
    ? 'bg-[#161B22] border border-slate-700/80 shadow-lg shadow-black/25'
    : 'bg-white border border-slate-300 shadow-sm shadow-slate-200/60';

  const renderGreetingIcon = () => {
    if (greeting.period === 'morning') return <Sun className="w-4 h-4 text-amber-400 shrink-0" />;
    if (greeting.period === 'afternoon') return <Sunset className="w-4 h-4 text-orange-400 shrink-0" />;
    return <Moon className="w-4 h-4 text-blue-400 shrink-0" />;
  };

  // Verified Account Panel for Signed-In Workspace
  const renderSignedInAccountPanel = () => {
    if (!currentUser) return null;
    return (
      <div
        className={`lg:col-span-5 xl:col-span-4 rounded-2xl p-6 flex flex-col justify-between gap-5 transition-colors ${boardBoxClass}`}
      >
        <div className="flex items-center justify-between gap-3 flex-nowrap">
          <div className="flex items-center gap-3 min-w-0">
            {currentUser.photoUrl ? (
              <img
                src={currentUser.photoUrl}
                alt={currentUser.name}
                referrerPolicy="no-referrer"
                className="w-10 h-10 rounded-full object-cover border border-blue-500/40 shrink-0"
              />
            ) : (
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 ${
                  currentUser.role === 'admin'
                    ? 'bg-slate-700 border border-slate-500'
                    : 'bg-blue-600'
                }`}
              >
                {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-nowrap">
                <h2 className={`text-sm font-bold truncate whitespace-nowrap ${themeStyles.textPrimary}`}>
                  {currentUser.name}
                </h2>
                {currentUser.emailVerified && (
                  <BadgeCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                )}
              </div>
              <p className={`text-[11px] truncate whitespace-nowrap ${themeStyles.textSecondary}`}>
                {currentUser.email}
              </p>
            </div>
          </div>

          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-500 whitespace-nowrap shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>Verified</span>
          </span>
        </div>

        <div className={`text-[11px] truncate whitespace-nowrap ${themeStyles.textMuted}`}>
          {currentUser.role === 'admin' ? 'Administrator' : 'Member'} · {getProviderLabel(currentUser.provider)}
        </div>

        <div
          className={`py-3 border-y grid grid-cols-3 gap-2 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="min-w-0">
            <span className={`text-[11px] block truncate whitespace-nowrap ${themeStyles.textMuted}`}>
              Saved Chats
            </span>
            <span className={`text-base font-extrabold tabular-nums whitespace-nowrap ${themeStyles.textPrimary}`}>
              {recentConversations.length}
            </span>
          </div>
          <div className="min-w-0">
            <span className={`text-[11px] block truncate whitespace-nowrap ${themeStyles.textMuted}`}>
              Rated
            </span>
            <span className={`text-base font-extrabold tabular-nums whitespace-nowrap ${themeStyles.textPrimary}`}>
              {feedbackProfile?.totalRatings || 0}
            </span>
          </div>
          <div className="min-w-0">
            <span className={`text-[11px] block truncate whitespace-nowrap ${themeStyles.textMuted}`}>
              Approval
            </span>
            <span className="text-base font-extrabold tabular-nums whitespace-nowrap text-emerald-500">
              {feedbackProfile && feedbackProfile.totalRatings > 0
                ? `${feedbackProfile.approvalRate}%`
                : '—'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {currentUser.role === 'admin' ? (
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Admin</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
                isDark
                  ? 'border-slate-700 bg-[#0D1117] hover:bg-slate-800 text-slate-200'
                  : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>Settings</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => onOpenAuthModal(currentUser.role === 'admin' ? 'admin' : 'user')}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
              isDark
                ? 'border-slate-700 bg-[#0D1117] hover:bg-slate-800 text-slate-200'
                : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
            }`}
          >
            <User className="w-3.5 h-3.5 shrink-0" />
            <span>Switch</span>
          </button>
          <button
            type="button"
            onClick={onLogout}
            className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-colors whitespace-nowrap ${
              isDark
                ? 'border-slate-700 bg-[#0D1117] text-rose-400 hover:bg-slate-800'
                : 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <LogOut className="w-3.5 h-3.5 shrink-0" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    );
  };

  // ============================================================================
  // VIEW 1: HIGH-CLARITY HOMEPAGE ON INITIAL LOAD (WHEN SIGNED OUT)
  // ============================================================================
  if (!currentUser) {
    const coreSolutions = [
      {
        num: '01',
        title: 'Intent & Tone Analysis',
        desc: 'Uncover urgency, hidden subtext, and relationship risk before sending a single word.',
        icon: <MessageSquareCode className="w-5 h-5 text-blue-500 shrink-0" />,
        iconWrap: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200',
        cta: 'Analyze a thread',
      },
      {
        num: '02',
        title: 'Multi-Persona Replies',
        desc: 'Draft three calibrated reply options across 8 AI personas matched to your exact voice.',
        icon: <PenTool className="w-5 h-5 text-blue-500 shrink-0" />,
        iconWrap: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200',
        cta: 'Generate replies',
      },
      {
        num: '03',
        title: 'Career & Leave Studio',
        desc: 'Write executive leave letters, salary negotiations, SOPs, and academic outreach in seconds.',
        icon: <Briefcase className="w-5 h-5 text-blue-500 shrink-0" />,
        iconWrap: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200',
        cta: 'Open templates',
      },
      {
        num: '04',
        title: 'Word & PDF Briefs',
        desc: 'Compile full situation assessments and ready-to-send memos into formatted .DOCX and .PDF files.',
        icon: <FileText className="w-5 h-5 text-blue-500 shrink-0" />,
        iconWrap: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200',
        cta: 'Export briefs',
      },
    ];

    const workflowBoardSteps = [
      {
        num: '01',
        title: 'Analyze Intent & Tone Radar',
        desc: 'Map empathy, directness, urgency, warmth, formality, and assertiveness on an interactive radar chart before replying.',
        icon: <MessageSquareCode className="w-4 h-4 text-blue-500 shrink-0" />,
        iconWrap: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200',
      },
      {
        num: '02',
        title: 'Draft Calibrated Replies',
        desc: 'Compare three natural response angles across 8 AI personas tuned to your relationship context and preferred length.',
        icon: <PenTool className="w-4 h-4 text-blue-500 shrink-0" />,
        iconWrap: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200',
      },
      {
        num: '03',
        title: 'Export Word & PDF Briefs',
        desc: 'Generate clean executive memos, formal leave letters, and structured assessment documents in .DOCX or .PDF.',
        icon: <FileText className="w-4 h-4 text-emerald-500 shrink-0" />,
        iconWrap: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200',
      },
    ];

    return (
      <div className="pb-10">
        {/* ================================================================ */}
        {/* 1. HERO SECTION (VALUE PROP + WORKSPACE WORKFLOW BOARD BOX)      */}
        {/* ================================================================ */}
        <section
          id="overview"
          className="pt-4 pb-8 lg:pt-6 lg:pb-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch"
        >
          {/* Left Column: Crisp Framed Hero Board Box */}
          <div
            className={`lg:col-span-7 rounded-2xl p-7 sm:p-9 flex flex-col justify-between gap-8 ${boardBoxClass}`}
          >
            <div className="space-y-5">
              {/* Time-Aware Greeting */}
              <div className="flex items-center gap-2.5 flex-nowrap">
                {renderGreetingIcon()}
                <span className={`text-xs sm:text-sm font-bold whitespace-nowrap ${themeStyles.textPrimary}`}>
                  {greeting.label}
                </span>
                <span className={`text-xs whitespace-nowrap ${themeStyles.textMuted}`}>
                  · {greeting.dateText}
                </span>
              </div>

              <h1
                className={`font-extrabold tracking-[-0.03em] leading-[1.06] [text-wrap:balance] max-w-xl ${themeStyles.textPrimary}`}
                style={{ fontSize: 'clamp(2.15rem, 3.6vw, 3.25rem)' }}
              >
                Read any message.{' '}
                <span className="text-blue-500">Reply with clarity.</span>
              </h1>

              <p className={`text-base sm:text-[17px] leading-relaxed max-w-xl ${themeStyles.textSecondary}`}>
                Built for leaders, advisors, and graduate professionals handling high-stakes messages. Situation AI decodes tone, urgency, and hidden risk—then drafts calibrated replies and executive Word and PDF briefs in seconds.
              </p>

              {/* High-Contrast Primary Sign In + Login & Admin Portal Access */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('user', null, 'signup')}
                  className="min-h-[48px] inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all whitespace-nowrap shrink-0"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuthModal('user', null, 'login')}
                  className={`min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                    isDark
                      ? 'border-slate-700 text-slate-200 hover:bg-slate-800/70'
                      : 'border-slate-300 text-slate-800 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  <span>Login</span>
                </button>

                <button
                  type="button"
                  onClick={() => onOpenAuthModal('admin', null, 'login')}
                  className={`min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                    isDark
                      ? 'border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                      : 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Admin Portal</span>
                </button>
              </div>
            </div>

            {/* Clean Specs Strip Inside Hero Box */}
            <div
              className={`pt-6 border-t grid grid-cols-3 gap-6 ${
                isDark ? 'border-slate-700/70' : 'border-slate-200'
              }`}
            >
              <div>
                <div className={`text-xl sm:text-2xl font-extrabold tabular-nums ${themeStyles.textPrimary}`}>
                  8
                </div>
                <div className={`text-xs mt-0.5 ${themeStyles.textMuted}`}>AI Personas</div>
              </div>
              <div>
                <div className={`text-xl sm:text-2xl font-extrabold tabular-nums ${themeStyles.textPrimary}`}>
                  22
                </div>
                <div className={`text-xs mt-0.5 ${themeStyles.textMuted}`}>Situation Presets</div>
              </div>
              <div>
                <div className={`text-xl sm:text-2xl font-extrabold tabular-nums ${themeStyles.textPrimary}`}>
                  .DOCX &amp; .PDF
                </div>
                <div className={`text-xs mt-0.5 ${themeStyles.textMuted}`}>Instant Export</div>
              </div>
            </div>
          </div>

          {/* Right Column: Structured 3-Step Workflow & Portal Access Board Box */}
          <div
            className={`lg:col-span-5 rounded-2xl p-6 sm:p-7 flex flex-col justify-between gap-5 ${boardBoxClass}`}
          >
            <div className="space-y-1">
              <h2 className={`text-base font-bold tracking-tight ${themeStyles.textPrimary}`}>
                Workspace Workflow
              </h2>
              <p className={`text-xs ${themeStyles.textMuted}`}>
                Three focused stages from incoming thread to final response
              </p>
            </div>

            <div
              className={`divide-y ${
                isDark ? 'divide-slate-700/70' : 'divide-slate-200'
              }`}
            >
              {workflowBoardSteps.map((step) => (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => onOpenAuthModal('user', null, 'signup')}
                  className={`w-full py-4 first:pt-1 last:pb-1 text-left flex items-start gap-3.5 transition-colors rounded-lg ${
                    isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50/80'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${step.iconWrap}`}>
                    {step.icon}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-blue-500 tabular-nums">
                        {step.num}
                      </span>
                      <h3 className={`text-xs sm:text-sm font-bold truncate ${themeStyles.textPrimary}`}>
                        {step.title}
                      </h3>
                    </div>
                    <p className={`text-xs leading-relaxed ${themeStyles.textSecondary}`}>
                      {step.desc}
                    </p>
                  </div>
                </button>
              ))}
            </div>

            <div
              className={`pt-3.5 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
                isDark ? 'border-slate-700/70' : 'border-slate-200'
              }`}
            >
              <span className={themeStyles.textMuted}>
                Direct Portal Access
              </span>
              <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('user', null, 'login')}
                  className="font-semibold text-blue-500 hover:underline"
                >
                  Login
                </button>
                <span aria-hidden="true" className={themeStyles.textMuted}>·</span>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('user', null, 'signup')}
                  className="font-semibold text-blue-500 hover:underline"
                >
                  Sign In
                </button>
                <span aria-hidden="true" className={themeStyles.textMuted}>·</span>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('admin', null, 'login')}
                  className="font-semibold text-purple-500 hover:underline"
                >
                  Admin Portal
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 2. CORE CONTENT & SOLUTIONS (BORDERED BOARD BOXES)               */}
        {/* ================================================================ */}
        <section id="solutions" className="py-10 lg:py-14 space-y-10">
          <div className="max-w-2xl space-y-3">
            <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight [text-wrap:balance] ${themeStyles.textPrimary}`}>
              Everything you need when every word carries weight
            </h2>
            <p className={`text-sm sm:text-base leading-relaxed ${themeStyles.textSecondary}`}>
              Four specialized tools engineered to evaluate stakes accurately, prevent tone missteps, and turn threads into formal deliverables.
            </p>
          </div>

          {/* 4-Column Benefit Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreSolutions.map((item) => (
              <button
                key={item.num}
                type="button"
                onClick={() => onOpenAuthModal('user', null, 'signup')}
                className={`group p-7 rounded-2xl text-left flex flex-col justify-between gap-7 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/70 ${boardBoxClass}`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className={`w-11 h-11 rounded-xl border flex items-center justify-center ${item.iconWrap}`}>
                      {item.icon}
                    </div>
                    <span className={`text-xs font-mono font-semibold tabular-nums ${themeStyles.textMuted}`}>
                      {item.num}
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h3 className={`text-base font-bold ${themeStyles.textPrimary}`}>{item.title}</h3>
                    <p className={`text-[13.5px] leading-relaxed ${themeStyles.textSecondary}`}>
                      {item.desc}
                    </p>
                  </div>
                </div>

                <span className="text-xs font-bold text-blue-500 inline-flex items-center gap-1 whitespace-nowrap">
                  <span>{item.cta}</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            ))}
          </div>

          {/* 3-Column Audience Solutions Board Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 sm:p-7 rounded-2xl space-y-2.5 ${boardBoxClass}`}>
              <h3 className={`text-sm font-bold ${themeStyles.textPrimary}`}>
                01. For Executives &amp; Team Leads
              </h3>
              <p className={`text-xs sm:text-[13.5px] leading-relaxed ${themeStyles.textSecondary}`}>
                De-escalate tense client threads, align distributed stakeholders, and export crisp Word or PDF status briefs directly from chat history.
              </p>
            </div>
            <div className={`p-6 sm:p-7 rounded-2xl space-y-2.5 ${boardBoxClass}`}>
              <h3 className={`text-sm font-bold ${themeStyles.textPrimary}`}>
                02. For Career &amp; Academic Applicants
              </h3>
              <p className={`text-xs sm:text-[13.5px] leading-relaxed ${themeStyles.textSecondary}`}>
                Draft respectful leave notifications, compensation counter-offers, SOP letters, and faculty outreach without awkward phrasing.
              </p>
            </div>
            <div className={`p-6 sm:p-7 rounded-2xl space-y-2.5 ${boardBoxClass}`}>
              <h3 className={`text-sm font-bold ${themeStyles.textPrimary}`}>
                03. For Client &amp; Advisory Teams
              </h3>
              <p className={`text-xs sm:text-[13.5px] leading-relaxed ${themeStyles.textSecondary}`}>
                Adapt responses automatically with local Preference Memory so every message preserves your professional standards across channels.
              </p>
            </div>
          </div>

          {/* Compelling Final Call-to-Action Board Box */}
          <div
            className={`p-8 sm:p-10 rounded-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-8 ${boardBoxClass}`}
          >
            <div className="max-w-xl space-y-3">
              <h2 className={`text-2xl sm:text-3xl font-extrabold tracking-tight [text-wrap:balance] ${themeStyles.textPrimary}`}>
                Send your next difficult reply with complete confidence.
              </h2>
              <p className={`text-sm sm:text-base leading-relaxed ${themeStyles.textSecondary}`}>
                Decode intent, map tone dimensions on a live radar chart, generate three response angles, and download a clean Word or PDF brief in under 60 seconds.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onOpenAuthModal('user', null, 'signup')}
                className="min-h-[48px] inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 transition-all whitespace-nowrap"
              >
                <span>Analyze Your First Message Free</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </button>

              <div className={`flex items-center justify-center lg:justify-end gap-3 text-xs whitespace-nowrap ${themeStyles.textMuted}`}>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('user', null, 'login')}
                  className="hover:underline font-medium"
                >
                  Login
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('user', null, 'signup')}
                  className="hover:underline font-medium"
                >
                  Sign In
                </button>
                <span aria-hidden="true">·</span>
                <button
                  type="button"
                  onClick={() => onOpenAuthModal('admin', null, 'login')}
                  className="hover:underline font-medium text-purple-500"
                >
                  Admin Portal
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* 3. QUIET SUPPORTED CHANNELS & FORMATS FOOTER                     */}
        {/* ================================================================ */}
        <footer
          id="formats"
          className={`pt-8 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            isDark ? 'border-slate-800/90' : 'border-slate-200'
          }`}
        >
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <BrandLogo size="sm" isDark={isDark} themeStyles={themeStyles} showSubtitle={false} />
              <span className={`text-xs ${themeStyles.textMuted}`}>· Supported Channels &amp; Exports</span>
            </div>
            <p className={`text-xs ${themeStyles.textSecondary}`}>
              WhatsApp · Slack · Microsoft Teams · LinkedIn · Email · SMS · Word (.DOCX) · PDF (.PDF)
            </p>
          </div>

          <div className={`flex items-center gap-6 text-xs font-medium shrink-0 whitespace-nowrap ${themeStyles.textMuted}`}>
            <a href="#overview" className="hover:underline">Overview</a>
            <a href="#solutions" className="hover:underline">Solutions</a>
            <a href="#formats" className="hover:underline">Formats</a>
          </div>
        </footer>
      </div>
    );
  }

  // ============================================================================
  // VIEW 2: SIGNED-IN EXECUTIVE WORKSPACE DASHBOARD (STRICT SINGLE-LINE LAYOUT)
  // ============================================================================
  return (
    <div className="space-y-6">
      {/* Framed Single-Line Time-Aware Greeting & Workspace Status Box */}
      <div className={`px-5 py-3.5 rounded-2xl flex items-center justify-between gap-4 flex-nowrap ${boardBoxClass}`}>
        <div className="flex items-center gap-2.5 min-w-0">
          {renderGreetingIcon()}
          <h2 className={`text-base sm:text-lg font-bold tracking-tight truncate whitespace-nowrap ${themeStyles.textPrimary}`}>
            {greeting.label}
            {firstName ? `, ${firstName}` : ''}
          </h2>
          <span className={`hidden sm:inline text-xs whitespace-nowrap shrink-0 ${themeStyles.textMuted}`}>
            · {greeting.dateText}
          </span>
          <span className={`hidden md:inline text-xs truncate whitespace-nowrap ${themeStyles.textMuted}`}>
            · Workspace ready
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0 whitespace-nowrap">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-500 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            <span>{currentUser.role === 'admin' ? 'Admin Authenticated' : 'Signed In'}</span>
            <span className={`hidden sm:inline font-normal ${themeStyles.textMuted}`}>
              · {activeModelMeta?.name || 'Gemini'}
            </span>
          </span>
        </div>
      </div>

      {/* Top Workspace Hero & Verified Account Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Single-Line Workspace Hero */}
        <div
          className={`lg:col-span-7 xl:col-span-8 rounded-2xl p-6 transition-colors flex flex-col justify-between gap-5 ${boardBoxClass}`}
        >
          <div className="space-y-3 min-w-0">
            <div className="flex items-center justify-between gap-3 flex-nowrap">
              <BrandLogo size="md" isDark={isDark} themeStyles={themeStyles} showSubtitle={false} />
              <span className={`text-xs font-medium truncate whitespace-nowrap ${themeStyles.textMuted}`}>
                {t.dashboard.heroBadge}
              </span>
            </div>

            <h1
              className={`text-lg sm:text-xl xl:text-[22px] font-black tracking-tight whitespace-nowrap truncate ${themeStyles.textPrimary}`}
              title={`${t.dashboard.heroTitlePart1} ${t.dashboard.heroTitlePart2}`}
            >
              {t.dashboard.heroTitlePart1}{' '}
              <span className={themeStyles.secondaryAccent}>{t.dashboard.heroTitlePart2}</span>
            </h1>

            <p
              className={`text-xs sm:text-[13px] truncate whitespace-nowrap ${themeStyles.textSecondary}`}
              title={t.dashboard.heroSubtitle}
            >
              {t.dashboard.heroSubtitle}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-2.5 flex-nowrap overflow-x-auto pb-0.5">
              <button
                type="button"
                onClick={() => onStartNew()}
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${themeStyles.primaryAccent}`}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{t.dashboard.launchEngineBtn}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('templates')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                  isDark
                    ? 'border-slate-700 bg-[#0D1117] hover:bg-slate-800 text-slate-200'
                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>{t.dashboard.careerHubBtn}</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('documents')}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 ${
                  isDark
                    ? 'border-slate-700 bg-[#0D1117] hover:bg-slate-800 text-slate-200'
                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{t.dashboard.wordPdfStudioBtn}</span>
              </button>
            </div>

            {feedbackProfile && feedbackProfile.totalRatings > 0 && (
              <div
                className={`pt-2.5 border-t flex items-center justify-between gap-3 flex-nowrap ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <div className={`flex items-center gap-2 min-w-0 text-xs whitespace-nowrap truncate ${themeStyles.textSecondary}`}>
                  <ThumbsUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-semibold shrink-0">Preference Memory</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums shrink-0">
                    {feedbackProfile.positiveCount} liked / {feedbackProfile.negativeCount} disliked
                  </span>
                  {feedbackProfile.preferredTones.length > 0 && (
                    <span className="hidden sm:inline truncate">
                      · Favoring {feedbackProfile.preferredTones.slice(0, 2).join(', ')}
                    </span>
                  )}
                </div>
                {onOpenFeedbackHistory && (
                  <button
                    type="button"
                    onClick={onOpenFeedbackHistory}
                    className="text-xs font-semibold text-blue-500 hover:underline whitespace-nowrap shrink-0"
                  >
                    Manage →
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Active Verified Account Panel */}
        {renderSignedInAccountPanel()}
      </div>

      {/* Executive Workspace Metrics Summary (3-Column Single-Line Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('settings')}
          className={`p-5 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/70 min-w-0 ${boardBoxClass}`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className={`text-[11px] font-semibold tracking-wide truncate whitespace-nowrap ${themeStyles.textMuted}`}>
              Active AI Engine
            </span>
            <Cpu className="w-4 h-4 text-blue-500 shrink-0" />
          </div>
          <p className={`text-lg font-extrabold truncate whitespace-nowrap ${themeStyles.textPrimary}`}>
            {activeModelMeta?.name || 'Gemini'}
          </p>
          <p className={`text-xs mt-1 truncate whitespace-nowrap ${themeStyles.textMuted}`}>
            {hasApiKey ? 'Cloud API Configured' : 'Local Persona Mode'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('history')}
          className={`p-5 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/70 min-w-0 ${boardBoxClass}`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className={`text-[11px] font-semibold tracking-wide truncate whitespace-nowrap ${themeStyles.textMuted}`}>
              Saved Threads
            </span>
            <History className="w-4 h-4 text-emerald-500 shrink-0" />
          </div>
          <p className={`text-lg font-extrabold tabular-nums truncate whitespace-nowrap ${themeStyles.textPrimary}`}>
            {recentConversations.length}
          </p>
          <p className={`text-xs mt-1 truncate whitespace-nowrap ${themeStyles.textMuted}`}>
            Stored locally in workspace
          </p>
        </button>

        <button
          type="button"
          onClick={() => onOpenFeedbackHistory?.()}
          className={`p-5 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/70 min-w-0 ${boardBoxClass}`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className={`text-[11px] font-semibold tracking-wide truncate whitespace-nowrap ${themeStyles.textMuted}`}>
              Reply Quality Score
            </span>
            <ThumbsUp className="w-4 h-4 text-amber-500 shrink-0" />
          </div>
          <p className={`text-lg font-extrabold tabular-nums truncate whitespace-nowrap ${themeStyles.textPrimary}`}>
            {feedbackProfile && feedbackProfile.totalRatings > 0
              ? `${feedbackProfile.approvalRate}% Approval`
              : 'No Ratings Yet'}
          </p>
          <p className={`text-xs mt-1 truncate whitespace-nowrap ${themeStyles.textMuted}`}>
            {feedbackProfile && feedbackProfile.totalRatings > 0
              ? `${feedbackProfile.positiveCount} liked · ${feedbackProfile.negativeCount} disliked`
              : 'Rate replies to calibrate tone'}
          </p>
        </button>
      </div>

      {/* Workspace Modules (3-Column Single-Line Card Grid) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-nowrap">
          <h3 className={`text-sm font-bold whitespace-nowrap ${themeStyles.textPrimary}`}>
            Workspace Modules
          </h3>
          <span className={`text-xs truncate whitespace-nowrap ${themeStyles.textMuted}`}>
            Select any workspace module to launch
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              id: 'settings',
              tab: 'settings' as ActiveTab,
              title: 'Core Engine & Settings',
              desc: 'Default AI personas, language, typography & rigor.',
              icon: <Cpu className="w-4 h-4 text-blue-500 shrink-0" />,
              iconWrap: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200',
              actionLabel: 'Configure',
            },
            {
              id: 'generator',
              tab: 'generator' as ActiveTab,
              title: 'AI Reply Engine',
              desc: 'Craft replies across 8 personas with smart filters.',
              icon: <PenTool className="w-4 h-4 text-blue-500 shrink-0" />,
              iconWrap: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200',
              actionLabel: 'Open Engine',
            },
            {
              id: 'analyzer',
              tab: 'analyzer' as ActiveTab,
              title: 'Situation Analyzer',
              desc: 'Audit intent, signals, urgency & reply strategy.',
              icon: <MessageSquareCode className="w-4 h-4 text-amber-500 shrink-0" />,
              iconWrap: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200',
              actionLabel: 'Open Analyzer',
            },
            {
              id: 'templates',
              tab: 'templates' as ActiveTab,
              title: 'Career & Academic Hub',
              desc: 'Formal leave letters, executive emails & SOP drafts.',
              icon: <Briefcase className="w-4 h-4 text-sky-500 shrink-0" />,
              iconWrap: isDark ? 'bg-sky-500/10 border-sky-500/20' : 'bg-sky-50 border-sky-200',
              actionLabel: 'Open Studio',
            },
            {
              id: 'documents',
              tab: 'documents' as ActiveTab,
              title: 'Word & PDF Studio',
              desc: 'Generate complete, formatted .DOCX & .PDF briefs.',
              icon: <FileText className="w-4 h-4 text-emerald-500 shrink-0" />,
              iconWrap: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200',
              actionLabel: 'Open Export',
            },
            {
              id: 'history',
              tab: 'history' as ActiveTab,
              title: 'Saved History & Memory',
              desc: 'Review archived threads & reply feedback ratings.',
              icon: <History className="w-4 h-4 text-emerald-500 shrink-0" />,
              iconWrap: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200',
              actionLabel: 'Open History',
            },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.tab)}
              className={`group p-5 rounded-2xl text-left flex flex-col justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/70 min-w-0 ${boardBoxClass}`}
            >
              <div className="min-w-0 space-y-2.5">
                <div className="flex items-center justify-between gap-2 flex-nowrap">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${item.iconWrap}`}
                    >
                      {item.icon}
                    </div>
                    <h4 className={`text-xs sm:text-[13px] font-bold truncate whitespace-nowrap ${themeStyles.textPrimary}`}>
                      {item.title}
                    </h4>
                  </div>
                  <span className="text-[11px] font-semibold text-blue-500 inline-flex items-center gap-0.5 whitespace-nowrap shrink-0">
                    <span>{item.actionLabel}</span>
                    <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>

                <p
                  className={`text-xs truncate whitespace-nowrap ${themeStyles.textMuted}`}
                  title={item.desc}
                >
                  {item.desc}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Single-Line Quick Navigation Strip */}
      <div
        className={`px-5 py-4 rounded-2xl flex items-center justify-between gap-3 flex-nowrap ${boardBoxClass}`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <PenTool className="w-4 h-4 text-blue-500 shrink-0" />
          <p className={`text-xs truncate whitespace-nowrap ${themeStyles.textSecondary}`}>
            <strong className={themeStyles.textPrimary}>Standalone Reply Engine:</strong> Draft context-aware replies with 22 presets, 8 AI personas, and tone filters.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('generator')}
          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${themeStyles.primaryAccent}`}
        >
          <span>Open Reply Engine</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        </button>
      </div>

      {/* Recent Saved Conversations (Single-Line Cards or Clean Empty State) */}
      {recentConversations.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-nowrap">
            <h3 className={`text-sm font-bold truncate whitespace-nowrap ${themeStyles.textPrimary}`}>
              {t.dashboard.recentHeading}
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-blue-500 hover:underline whitespace-nowrap shrink-0"
            >
              {t.dashboard.viewAll} ({recentConversations.length}) →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentConversations.slice(0, 3).map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => onNavigate('history')}
                className={`p-4 rounded-2xl text-left cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-500/70 min-w-0 ${boardBoxClass}`}
              >
                <div className={`flex items-center justify-between gap-2 mb-1.5 text-[11px] flex-nowrap ${themeStyles.textMuted}`}>
                  <span className="font-semibold truncate whitespace-nowrap">{conv.platform}</span>
                  <span className="tabular-nums whitespace-nowrap shrink-0">
                    {new Date(conv.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <h4 className={`text-xs font-bold truncate whitespace-nowrap ${themeStyles.textPrimary}`}>
                  {conv.title}
                </h4>
                <p className={`text-[11.5px] italic mt-1 truncate whitespace-nowrap ${themeStyles.textSecondary}`}>
                  "{conv.latestMessage}"
                </p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div
          className={`px-5 py-4 rounded-2xl flex items-center justify-between gap-3 flex-nowrap ${boardBoxClass}`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <History className="w-4 h-4 text-slate-400 shrink-0" />
            <p className={`text-xs truncate whitespace-nowrap ${themeStyles.textMuted}`}>
              No saved threads yet — generate and favorite a reply in the AI Reply Engine to build your workspace history.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onStartNew()}
            className="text-xs font-semibold text-blue-500 hover:underline whitespace-nowrap shrink-0"
          >
            Start First Thread →
          </button>
        </div>
      )}
    </div>
  );
};

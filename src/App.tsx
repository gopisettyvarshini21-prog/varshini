import React, { useState, useEffect } from 'react';
import {
  BrightnessMode,
  ActiveTab,
  PlatformId,
  EmojiIntensity,
  ResponseLength,
  SituationAnalysis,
  ReplyOption,
  SavedConversation,
  UserSettings,
  UserAuth,
  AIModelPersona,
  ThreadSummary,
  FeedbackRating,
  ReplyFeedbackEntry,
  FontFamilyId,
} from './types';
import { getFontOption } from './utils/fonts';
import { isAdminEmail } from './utils/adminConfig';
import { getEffectiveTheme } from './utils/themes';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/DashboardView';
import { MainEngine } from './components/MainEngine';
import { PromptStudio } from './components/PromptStudio';
import { DocumentBuilder } from './components/DocumentBuilder';
import { HistoryView } from './components/HistoryView';
import { AdminPortal } from './components/AdminPortal';
import { SeparateAdminPortal } from './components/SeparateAdminPortal';
import { SettingsView } from './components/SettingsView';
import { AuthModal } from './components/AuthModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { SAMPLE_CHATS, SampleChatPreset } from './utils/sampleChats';
import { initAuth, firebaseLogout } from './utils/auth';
import {
  loadFeedbackHistory,
  saveFeedbackHistory,
  recordReplyFeedback,
  buildPreferenceProfile,
} from './utils/feedbackHistory';

const DEFAULT_SETTINGS: UserSettings = {
  uiLanguage: 'en',
  fontFamily: 'plus-jakarta',
  defaultPlatform: 'whatsapp',
  defaultLanguage: 'Auto Detect',
  defaultTones: ['Friendly'],
  defaultModel: 'gemini',
  writingStandard: 'executive',
  emojiIntensity: 'Natural Emojis',
  responseLength: 'Balanced',
  brightnessMode: 'dark',
  themeId: 'executive-navy',
  saveHistory: true,
  autoAnalyzeOnGenerate: true,
  autoRefineReplies: true,
  autoSummarizeThreads: true,
  includeHashtagsDefault: true,
  includeLinksDefault: true,
};

const TAB_PATHS: Record<ActiveTab, string> = {
  dashboard: '/dashboard',
  generator: '/reply-engine',
  analyzer: '/analyzer',
  templates: '/career-hub',
  documents: '/word-pdf',
  history: '/history',
  admin: '/admin',
  settings: '/settings',
};

const TAB_TITLES: Record<ActiveTab, string> = {
  dashboard: 'Situation AI — Workspace Dashboard',
  generator: 'Situation AI — AI Reply Engine',
  analyzer: 'Situation AI — Situation Analyzer',
  templates: 'Situation AI — Career & Leave Studio',
  documents: 'Situation AI — Word & PDF Studio',
  history: 'Situation AI — Saved History',
  admin: 'Situation AI — Admin Portal',
  settings: 'Situation AI — Settings',
};

function getTabFromLocation(): ActiveTab {
  if (typeof window === 'undefined') return 'dashboard';
  const path = window.location.pathname.toLowerCase().replace(/\/+$/, '') || '/';
  if (path === '/reply-engine' || path === '/engine' || path === '/generator') return 'generator';
  if (path === '/analyzer') return 'analyzer';
  if (path === '/career-hub' || path === '/templates') return 'templates';
  if (path === '/word-pdf' || path === '/documents') return 'documents';
  if (path === '/history') return 'history';
  if (path === '/settings') return 'settings';
  return 'dashboard';
}

async function fetchJsonWithTimeout(url: string, body: any, timeoutMs = 26000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(payload?.error || `Request failed with HTTP ${res.status}`);
    }
    return payload;
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

function normalizeClientReplies(rawList: any): ReplyOption[] {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .map((r: any, idx: number) => {
      const content = typeof r?.content === 'string' ? r.content.trim() : '';
      if (!content) return null;
      return {
        id: typeof r?.id === 'string' && r.id.trim() ? r.id.trim() : `reply-${idx + 1}`,
        styleLabel:
          typeof r?.styleLabel === 'string' && r.styleLabel.trim()
            ? r.styleLabel.trim()
            : `Option ${idx + 1}`,
        tone: typeof r?.tone === 'string' && r.tone.trim() ? r.tone.trim() : 'Natural',
        content,
        explanation:
          typeof r?.explanation === 'string' && r.explanation.trim()
            ? r.explanation.trim()
            : 'Crafted to fit your conversation context.',
        matchScore: typeof r?.matchScore === 'number' ? r.matchScore : 94,
        hashtags: Array.isArray(r?.hashtags) ? r.hashtags : [],
        suggestedLinks: Array.isArray(r?.suggestedLinks) ? r.suggestedLinks : [],
        saved: !!r?.saved,
        autoRefined: !!r?.autoRefined,
        refinementNotes: typeof r?.refinementNotes === 'string' ? r.refinementNotes : undefined,
      } as ReplyOption;
    })
    .filter((r): r is ReplyOption => r !== null);
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message || 'Unexpected rendering error' };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full rounded-2xl border border-slate-800 bg-slate-900 p-6 text-center space-y-4">
            <h2 className="text-lg font-bold text-rose-400">Something went wrong</h2>
            <p className="text-xs text-slate-300">{this.state.message}</p>
            <button
              type="button"
              onClick={() => this.setState({ hasError: false, message: '' })}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white"
            >
              Recover View
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  // Load settings from storage
  const [settings, setSettings] = useState<UserSettings>(() => {
    try {
      const stored = localStorage.getItem('situation_ai_settings');
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserAuth | null>(() => {
    try {
      const savedUser = localStorage.getItem('situation_ai_user');
      if (!savedUser) return null;
      const parsed = JSON.parse(savedUser) as UserAuth;
      if (parsed && isAdminEmail(parsed.email)) {
        return {
          ...parsed,
          role: 'admin',
          title: parsed.title || 'Chief Administrator (Owner)',
        };
      }
      return parsed;
    } catch {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'user' | 'admin'>('user');
  const [authModalProviderDrawer, setAuthModalProviderDrawer] = useState<
    'google' | 'apple' | 'microsoft' | null
  >(null);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');
  const [authModalInitialError, setAuthModalInitialError] = useState<string | null>(null);
  const [isStandaloneAdminView, setIsStandaloneAdminView] = useState<boolean>(() => {
    try {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      return (
        path.startsWith('/admin') ||
        params.get('admin') === '1' ||
        params.get('admin') === 'true' ||
        params.get('portal') === 'admin'
      );
    } catch {
      return false;
    }
  });

  const openAuthModal = (
    tab: 'user' | 'admin' = 'user',
    providerDrawer: 'google' | 'apple' | 'microsoft' | null = null,
    mode: 'login' | 'signup' = 'login',
    initialError: string | null = null
  ) => {
    setAuthModalTab(tab);
    setAuthModalProviderDrawer(providerDrawer);
    setAuthModalMode(mode);
    setAuthModalInitialError(initialError);
    setIsAuthModalOpen(true);
  };

  const [brightnessMode, setBrightnessMode] = useState<BrightnessMode>(settings.brightnessMode);
  const [activeTab, setActiveTab] = useState<ActiveTab>(() => getTabFromLocation());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Multi-model & Option States
  const [aiModel, setAiModel] = useState<AIModelPersona>(settings.defaultModel || 'gemini');
  const [includeHashtags, setIncludeHashtags] = useState<boolean>(settings.includeHashtagsDefault ?? true);
  const [includeLinks, setIncludeLinks] = useState<boolean>(settings.includeLinksDefault ?? true);
  const [autoRefineEnabled, setAutoRefineEnabled] = useState<boolean>(settings.autoRefineReplies ?? true);
  const [autoSummarizeEnabled, setAutoSummarizeEnabled] = useState<boolean>(settings.autoSummarizeThreads ?? true);
  const [preferredEmojis, setPreferredEmojis] = useState<string[]>([]);

  // Core Inputs
  const [chatHistory, setChatHistory] = useState<string>('');
  const [latestMessage, setLatestMessage] = useState<string>('');
  const [platform, setPlatform] = useState<PlatformId>(settings.defaultPlatform);
  const [tones, setTones] = useState<string[]>(settings.defaultTones);
  const [customTone, setCustomTone] = useState<string>('');
  const [emojiIntensity, setEmojiIntensity] = useState<EmojiIntensity>(settings.emojiIntensity);
  const [language, setLanguage] = useState<string>(settings.defaultLanguage);
  const [responseLength, setResponseLength] = useState<ResponseLength>(settings.responseLength);
  const [relationship, setRelationship] = useState<string>('');
  const [purpose, setPurpose] = useState<string>('');
  const [additionalContext, setAdditionalContext] = useState<string>('');

  // Analysis, Thread Summary & Replies State
  const [threadSummary, setThreadSummary] = useState<ThreadSummary | null>(null);
  const [isSummarizingThread, setIsSummarizingThread] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<SituationAnalysis | null>(null);
  const [analysisSourceHash, setAnalysisSourceHash] = useState<string>('');
  const [replies, setReplies] = useState<ReplyOption[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAutoRefining, setIsAutoRefining] = useState<boolean>(false);
  const [isImproving, setIsImproving] = useState<string | null>(null);
  const [selectedDocReplyId, setSelectedDocReplyId] = useState<string | undefined>(undefined);
  const [selectedDocReplyTrigger, setSelectedDocReplyTrigger] = useState<number>(0);
  const generationEpochRef = React.useRef<number>(0);

  // Saved History & Reply Feedback Preferences
  const [history, setHistory] = useState<SavedConversation[]>(() => {
    try {
      const saved = localStorage.getItem('situation_ai_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [historySection, setHistorySection] = useState<'conversations' | 'feedback'>('conversations');
  const [feedbackHistory, setFeedbackHistory] = useState<ReplyFeedbackEntry[]>(() =>
    loadFeedbackHistory()
  );
  const feedbackProfile = React.useMemo(
    () => buildPreferenceProfile(feedbackHistory),
    [feedbackHistory]
  );

  // Toasts
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString() + Math.random().toString();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check backend health & subscribe to Firebase Auth session
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.hasApiKey) {
          setHasApiKey(true);
        }
      })
      .catch(() => {});

    const syncRouteFromBrowser = () => {
      const path = window.location.pathname.toLowerCase();
      const params = new URLSearchParams(window.location.search);
      const isAdminRoute =
        path.startsWith('/admin') ||
        params.get('admin') === '1' ||
        params.get('admin') === 'true' ||
        params.get('portal') === 'admin';
      if (isAdminRoute) {
        setIsStandaloneAdminView(true);
      } else {
        setIsStandaloneAdminView(false);
        setActiveTab(getTabFromLocation());
      }
    };
    window.addEventListener('popstate', syncRouteFromBrowser);

    const unsubscribe = initAuth((fbUser, token) => {
      const userEmail = fbUser.email || '';
      const displayName = fbUser.displayName || userEmail.split('@')[0] || 'Member';
      const isAdmin = isAdminEmail(userEmail);
      const fbProviderId = fbUser.providerData?.[0]?.providerId || '';
      const detectedProvider: UserAuth['provider'] =
        fbProviderId === 'apple.com'
          ? 'apple'
          : fbProviderId === 'password'
          ? 'email'
          : 'google';
      setCurrentUser((prev) => {
        // Keep active manual session unless OAuth just returned a live token or provider matches
        if (prev && prev.provider && prev.provider !== detectedProvider && !token) {
          return prev;
        }
        return {
          id: fbUser.uid,
          name: displayName,
          email: userEmail,
          role: isAdmin ? 'admin' : 'user',
          title: isAdmin
            ? 'Chief Administrator (Owner)'
            : detectedProvider === 'apple'
            ? 'Apple ID Account'
            : detectedProvider === 'email'
            ? 'Member Account'
            : 'Verified Google Account',
          company: isAdmin ? 'Situation AI Executive' : 'Situation AI',
          avatar: displayName.slice(0, 2).toUpperCase(),
          photoUrl: fbUser.photoURL || undefined,
          emailVerified: fbUser.emailVerified,
          provider: detectedProvider,
        };
      });
    });

    return () => {
      window.removeEventListener('popstate', syncRouteFromBrowser);
      unsubscribe();
    };
  }, []);

  // Keep engine pipeline flags synchronized with governance/settings updates
  useEffect(() => {
    setAutoSummarizeEnabled(settings.autoSummarizeThreads ?? true);
    setAutoRefineEnabled(settings.autoRefineReplies ?? true);
  }, [settings.autoSummarizeThreads, settings.autoRefineReplies]);

  // Save user when changed
  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('situation_ai_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('situation_ai_user');
      }
    } catch {}
  }, [currentUser]);

  // Save settings when changed
  useEffect(() => {
    try {
      localStorage.setItem('situation_ai_settings', JSON.stringify(settings));
    } catch {}
  }, [settings]);

  // Save history when changed
  useEffect(() => {
    try {
      localStorage.setItem('situation_ai_history', JSON.stringify(history));
    } catch {}
  }, [history]);

  // Save thumbs-up / thumbs-down feedback history when changed
  useEffect(() => {
    saveFeedbackHistory(feedbackHistory);
  }, [feedbackHistory]);

  // Palette resolution (fixed professional palette with dark/bright mode)
  const { isDark, styles: themeStyles, canvasHex } = getEffectiveTheme('executive-navy', brightnessMode);

  useEffect(() => {
    document.documentElement.style.backgroundColor = canvasHex;
    document.body.style.backgroundColor = canvasHex;
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
  }, [canvasHex, isDark]);

  useEffect(() => {
    const selectedFont = getFontOption(settings.fontFamily);
    document.documentElement.style.setProperty('--font-sans', selectedFont.cssStack);
  }, [settings.fontFamily]);

  useEffect(() => {
    if (isStandaloneAdminView) {
      document.title = TAB_TITLES.admin;
    } else {
      document.title = TAB_TITLES[activeTab] || 'Situation AI';
    }
  }, [activeTab, isStandaloneAdminView]);

  const handleBrightnessChange = (mode: BrightnessMode) => {
    setBrightnessMode(mode);
    setSettings((prev) => ({ ...prev, brightnessMode: mode }));
  };

  // Load sample chat
  const handleLoadSample = (sample: SampleChatPreset) => {
    if (!currentUser) {
      openAuthModal('user');
      addToast('Please sign in first to access AI Reply Engine scenarios.', 'info');
      return;
    }
    generationEpochRef.current += 1;
    setChatHistory(sample.chatHistory);
    setLatestMessage(sample.latestMessage);
    setPlatform(sample.platform);
    setRelationship(sample.relationship);
    setPurpose(sample.purpose);
    setTones(sample.suggestedTones);
    setThreadSummary(null);
    setAnalysis(null);
    setAnalysisSourceHash('');
    setReplies([]);
    handleTabChange('generator');
    addToast(`Loaded preset "${sample.title}"`, 'info');
  };

  const handleStartNew = (sample?: SampleChatPreset) => {
    if (!currentUser) {
      openAuthModal('user');
      addToast('Please sign in first to unlock the AI Reply Engine.', 'info');
      return;
    }
    if (sample) {
      handleLoadSample(sample);
    } else {
      generationEpochRef.current += 1;
      setChatHistory('');
      setLatestMessage('');
      setRelationship('');
      setPurpose('');
      setAdditionalContext('');
      setThreadSummary(null);
      setAnalysis(null);
      setAnalysisSourceHash('');
      setReplies([]);
      handleTabChange('generator');
    }
  };

  const handleClearInputs = () => {
    generationEpochRef.current += 1;
    setChatHistory('');
    setLatestMessage('');
    setRelationship('');
    setPurpose('');
    setAdditionalContext('');
    setThreadSummary(null);
    setAnalysis(null);
    setAnalysisSourceHash('');
    setReplies([]);
    addToast('Inputs cleared.', 'info');
  };

  // Detect whether a chat thread is complex enough for automatic bullet digestion
  const isComplexThread = (text: string): boolean => {
    const trimmed = text.trim();
    if (!trimmed) return false;
    const lines = trimmed.split(/\r?\n/).filter((l) => l.trim()).length;
    return trimmed.length >= 160 || lines >= 4;
  };

  // Action: Summarize complex chat thread into bullet points for faster context ingestion
  const handleSummarizeThread = async (force = false): Promise<ThreadSummary | null> => {
    const sourceHash = chatHistory.trim() || latestMessage.trim();
    if (!sourceHash) {
      if (force) {
        addToast('Please paste a chat thread or message to summarize.', 'error');
      }
      return null;
    }

    if (!force && threadSummary && threadSummary.sourceHash === sourceHash) {
      return threadSummary;
    }

    const requestEpoch = generationEpochRef.current;
    setIsSummarizingThread(true);
    try {
      const data = await fetchJsonWithTimeout(
        '/api/summarize-thread',
        {
          chatHistory,
          latestMessage,
          aiModel,
        },
        20000
      );
      if (generationEpochRef.current !== requestEpoch) {
        return null;
      }
      if (data.summary) {
        const builtSummary: ThreadSummary = {
          keyTopic: data.summary.keyTopic || 'Conversation Summary',
          bullets: Array.isArray(data.summary.bullets) ? data.summary.bullets : [],
          participants: Array.isArray(data.summary.participants) ? data.summary.participants : [],
          openQuestions: Array.isArray(data.summary.openQuestions) ? data.summary.openQuestions : [],
          messageCount: typeof data.summary.messageCount === 'number' ? data.summary.messageCount : 1,
          sourceHash,
          source: data.source,
        };
        setThreadSummary(builtSummary);
        if (force) {
          addToast('Complex thread condensed into bullet-point digest.', 'success');
        }
        return builtSummary;
      }
      throw new Error(data.error || 'Failed to summarize thread');
    } catch (err: any) {
      console.warn('Thread summary non-blocking fallback:', err);
      if (force && generationEpochRef.current === requestEpoch) {
        addToast(`Summarization error: ${err.message}`, 'error');
      }
      return null;
    } finally {
      setIsSummarizingThread(false);
    }
  };

  // Action: Analyze Situation
  const handleAnalyze = async () => {
    if (!latestMessage.trim() && !chatHistory.trim()) {
      addToast('Please enter an incoming message or conversation history.', 'error');
      return;
    }

    const requestEpoch = ++generationEpochRef.current;
    setIsAnalyzing(true);
    try {
      const summaryKey = chatHistory.trim() || latestMessage.trim();
      const inputHash = `${chatHistory.trim()}||${latestMessage.trim()}`;
      let activeSummary: ThreadSummary | null =
        threadSummary && threadSummary.sourceHash === summaryKey ? threadSummary : null;

      if (autoSummarizeEnabled && isComplexThread(chatHistory)) {
        activeSummary = await handleSummarizeThread(false);
      }
      if (generationEpochRef.current !== requestEpoch) return;

      const data = await fetchJsonWithTimeout(
        '/api/analyze',
        {
          chatHistory,
          latestMessage,
          platform,
          relationship,
          purpose,
          language,
          additionalContext,
          threadSummary: activeSummary,
          aiModel,
        },
        28000
      );
      if (generationEpochRef.current !== requestEpoch) return;

      if (data.analysis) {
        setAnalysis(data.analysis);
        setAnalysisSourceHash(inputHash);
        addToast(`Situation intelligence analysis completed via ${aiModel.toUpperCase()}.`, 'success');
      } else {
        throw new Error(data.error || 'Failed to complete analysis');
      }
    } catch (err: any) {
      if (generationEpochRef.current !== requestEpoch) return;
      console.error(err);
      addToast(`Analysis error: ${err.message}`, 'error');
    } finally {
      if (generationEpochRef.current === requestEpoch) {
        setIsAnalyzing(false);
      }
    }
  };

  // Action: Generate Replies (renders replies immediately, then runs Situation-Aware Auto-Refine pass)
  const handleGenerateReplies = async () => {
    if (!latestMessage.trim() && !chatHistory.trim()) {
      addToast('Please enter an incoming message or paste chat history.', 'error');
      return;
    }

    const requestEpoch = ++generationEpochRef.current;
    setIsGenerating(true);
    setIsAutoRefining(false);
    try {
      const summaryKey = chatHistory.trim() || latestMessage.trim();
      const inputHash = `${chatHistory.trim()}||${latestMessage.trim()}`;
      let activeSummary: ThreadSummary | null =
        threadSummary && threadSummary.sourceHash === summaryKey ? threadSummary : null;

      if (autoSummarizeEnabled && isComplexThread(chatHistory)) {
        activeSummary = await handleSummarizeThread(false);
      }
      if (generationEpochRef.current !== requestEpoch) return;

      // Only reuse prior Situation Analysis if it matches the exact current conversation input
      let currentAnalysis: SituationAnalysis | null =
        analysis && analysisSourceHash === inputHash ? analysis : null;

      if (!currentAnalysis && (settings.autoAnalyzeOnGenerate || autoRefineEnabled)) {
        try {
          const aData = await fetchJsonWithTimeout(
            '/api/analyze',
            {
              chatHistory,
              latestMessage,
              platform,
              relationship,
              purpose,
              language,
              additionalContext,
              threadSummary: activeSummary,
              aiModel,
            },
            28000
          );
          if (generationEpochRef.current !== requestEpoch) return;
          if (aData.analysis) {
            currentAnalysis = aData.analysis;
            setAnalysis(aData.analysis);
            setAnalysisSourceHash(inputHash);
          }
        } catch (e) {
          console.warn('Auto-analyze non-blocking error:', e);
        }
      }
      if (generationEpochRef.current !== requestEpoch) return;

      const data = await fetchJsonWithTimeout(
        '/api/generate-replies',
        {
          chatHistory,
          latestMessage,
          platform,
          relationship,
          purpose,
          language,
          tones,
          customTone,
          emojiIntensity,
          preferredEmojis,
          responseLength,
          additionalContext,
          situationAnalysis: currentAnalysis,
          aiModel,
          includeHashtags,
          includeLinks,
          userPreferences: feedbackProfile.totalRatings > 0 ? feedbackProfile : null,
        },
        32000
      );
      if (generationEpochRef.current !== requestEpoch) return;

      const initialReplies = normalizeClientReplies(data.replies);
      if (initialReplies.length > 0) {
        // Show replies immediately so user never waits blindly on secondary refinement
        setReplies(initialReplies);
        setTimeout(() => {
          const el = document.getElementById('generated-replies-section');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);

        let finalReplies: ReplyOption[] = initialReplies;
        let refinedApplied = false;

        // Run second pass against the identified Situation Analysis and upgrade in-place
        if (autoRefineEnabled && currentAnalysis) {
          setIsAutoRefining(true);
          try {
            const refineData = await fetchJsonWithTimeout(
              '/api/auto-refine-replies',
              {
                replies: initialReplies,
                situationAnalysis: currentAnalysis,
                chatHistory,
                latestMessage,
                platform,
                tones,
                customTone,
                emojiIntensity,
                responseLength,
                language,
                aiModel,
                includeHashtags,
                includeLinks,
                userPreferences: feedbackProfile.totalRatings > 0 ? feedbackProfile : null,
              },
              32000
            );
            if (generationEpochRef.current !== requestEpoch) return;
            const normalizedRefined = normalizeClientReplies(refineData.replies);
            if (normalizedRefined.length > 0) {
              finalReplies = normalizedRefined;
              setReplies(normalizedRefined);
              refinedApplied = true;
            }
          } catch (refineErr) {
            console.warn('Auto-refine non-blocking fallback:', refineErr);
          } finally {
            if (generationEpochRef.current === requestEpoch) {
              setIsAutoRefining(false);
            }
          }
        }

        if (generationEpochRef.current !== requestEpoch) return;
        addToast(
          refinedApplied
            ? `Generated & Auto-Refined ${finalReplies.length} replies against Situation Analysis!`
            : `Generated ${finalReplies.length} contextual replies using ${aiModel.toUpperCase()} persona!`,
          'success'
        );
      } else {
        throw new Error(data.error || 'Failed to generate replies');
      }
    } catch (err: any) {
      if (generationEpochRef.current !== requestEpoch) return;
      console.error(err);
      addToast(`Generation error: ${err.message}`, 'error');
    } finally {
      if (generationEpochRef.current === requestEpoch) {
        setIsAutoRefining(false);
        setIsGenerating(false);
      }
    }
  };

  // Action: Improve Reply
  const handleImproveReply = async (
    replyId: string,
    action: string,
    customInstruction?: string
  ) => {
    const targetReply = replies.find((r) => r.id === replyId);
    if (!targetReply) return;

    setIsImproving(replyId);
    try {
      const data = await fetchJsonWithTimeout('/api/improve-reply', {
        currentReply: targetReply.content,
        action,
        customInstruction,
        platform,
        latestMessage,
        chatHistory,
        aiModel,
      });

      if (typeof data.improvedReply === 'string' && data.improvedReply.trim()) {
        setReplies((prev) =>
          prev.map((r) =>
            r.id === replyId
              ? {
                  ...r,
                  content: data.improvedReply.trim(),
                  explanation: `Refined via "${customInstruction?.trim() || action}" (${aiModel.toUpperCase()})`,
                  autoRefined: true,
                  refinementNotes: `Manually refined via "${customInstruction?.trim() || action}"`,
                  feedback: undefined,
                  feedbackReason: undefined,
                }
              : r
          )
        );
        addToast(`Refined reply: "${action}" applied`, 'success');
      } else {
        throw new Error('Could not refine reply');
      }
    } catch (err: any) {
      console.error(err);
      addToast(`Failed to improve reply: ${err.message}`, 'error');
    } finally {
      setIsImproving(null);
    }
  };

  // Action: Copy
  const handleCopyReply = (content: string) => {
    navigator.clipboard.writeText(content);
    addToast('Reply copied to clipboard!', 'success');
  };

  // Action: Save to favorites / history
  const handleSaveReply = (reply: ReplyOption) => {
    const title =
      latestMessage.slice(0, 40) ||
      (chatHistory ? chatHistory.slice(0, 40) : 'Untitled Conversation');

    const newRecord: SavedConversation = {
      id: Date.now().toString(),
      title: title.endsWith('?') || title.endsWith('.') ? title : `${title}...`,
      timestamp: new Date().toISOString(),
      platform,
      chatHistory,
      latestMessage,
      analysis: analysis || undefined,
      replies: [reply],
      tones,
      emojiIntensity,
      aiModel,
    };

    setHistory((prev) => [newRecord, ...prev]);
    setReplies((prev) =>
      prev.map((r) => (r.id === reply.id ? { ...r, saved: true } : r))
    );
    addToast('Conversation saved to local history ❤️', 'success');
  };

  const handleEditReply = (id: string, newContent: string) => {
    setReplies((prev) =>
      prev.map((r) => (r.id === id ? { ...r, content: newContent } : r))
    );
    addToast('Reply edited.', 'info');
  };

  const handleExportReplySingle = (reply: ReplyOption) => {
    setSelectedDocReplyId(reply.id);
    setSelectedDocReplyTrigger((prev) => prev + 1);
    setActiveTab('documents');
    addToast(`Opened Document Studio with "${reply.styleLabel}" selected for export.`, 'info');
  };

  // Thumbs-up / thumbs-down preference feedback logging
  const handleRateReply = (
    reply: ReplyOption,
    rating: FeedbackRating | null,
    reason?: string
  ) => {
    const { nextEntries, appliedRating } = recordReplyFeedback({
      entries: feedbackHistory,
      reply,
      rating,
      reason,
      platform,
      responseLength,
      latestMessage,
      situationCategory: analysis?.category,
      aiModel,
    });
    setFeedbackHistory(nextEntries);
    setReplies((prev) =>
      prev.map((r) =>
        r.id === reply.id
          ? {
              ...r,
              feedback: appliedRating,
              feedbackReason: appliedRating === 'down' ? reason || r.feedbackReason : undefined,
            }
          : r
      )
    );
    if (appliedRating === 'up') {
      addToast(`Liked "${reply.styleLabel}" — saved to your local preferences for future replies.`, 'success');
    } else if (appliedRating === 'down') {
      addToast(
        reason
          ? `Feedback logged (${reason}) — future replies will avoid this pattern.`
          : 'Disliked reply logged — future generations will adapt.',
        'info'
      );
    } else {
      addToast('Reply feedback cleared.', 'info');
    }
  };

  const handleDeleteFeedback = (id: string) => {
    setFeedbackHistory((prev) => prev.filter((item) => item.id !== id));
    addToast('Feedback entry removed.', 'info');
  };

  const handleClearFeedback = () => {
    setFeedbackHistory([]);
    setReplies((prev) => prev.map((r) => ({ ...r, feedback: undefined, feedbackReason: undefined })));
    addToast('Reply feedback preferences cleared.', 'info');
  };

  const handleOpenFeedbackHistory = () => {
    setHistorySection('feedback');
    setActiveTab('history');
  };

  // History operations
  const handleOpenConversation = (conv: SavedConversation) => {
    generationEpochRef.current += 1;
    setChatHistory(conv.chatHistory || '');
    setLatestMessage(conv.latestMessage || '');
    setPlatform((conv.platform as PlatformId) || 'whatsapp');
    setTones(conv.tones || ['Friendly']);
    setEmojiIntensity(conv.emojiIntensity || 'Natural Emojis');
    if (conv.aiModel) setAiModel(conv.aiModel);
    setThreadSummary(null);
    if (conv.analysis) {
      setAnalysis(conv.analysis);
      setAnalysisSourceHash(`${(conv.chatHistory || '').trim()}||${(conv.latestMessage || '').trim()}`);
    } else {
      setAnalysis(null);
      setAnalysisSourceHash('');
    }
    if (conv.replies) setReplies(conv.replies);
    handleTabChange('generator');
    addToast(`Restored "${conv.title}"`, 'info');
  };

  const handleDeleteConversation = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    addToast('Conversation removed from history.', 'info');
  };

  const handleRenameConversation = (id: string, newTitle: string) => {
    setHistory((prev) =>
      prev.map((item) => (item.id === id ? { ...item, title: newTitle } : item))
    );
    addToast('Conversation title updated.', 'success');
  };

  const handleClearAllHistory = () => {
    setHistory([]);
    addToast('Conversation history cleared.', 'info');
  };

  const handleExportConversationDoc = (conv: SavedConversation) => {
    setChatHistory(conv.chatHistory || '');
    setLatestMessage(conv.latestMessage || '');
    if (conv.analysis) setAnalysis(conv.analysis);
    if (conv.replies) setReplies(conv.replies);
    handleTabChange('documents');
  };

  const handleTabChange = (tab: ActiveTab) => {
    if (!currentUser && tab !== 'dashboard') {
      openAuthModal(tab === 'admin' ? 'admin' : 'user');
      addToast('Please sign in first to access all workspace options.', 'info');
      return;
    }
    if (tab === 'admin') {
      setIsStandaloneAdminView(true);
      try {
        if (window.location.pathname !== '/admin') {
          window.history.pushState({}, '', '/admin');
        }
      } catch {}
      return;
    }
    if (tab === 'history') {
      setHistorySection('conversations');
    }
    setActiveTab(tab);
    try {
      const targetPath = TAB_PATHS[tab] || '/dashboard';
      if (window.location.pathname !== targetPath) {
        window.history.pushState({}, '', targetPath);
      }
    } catch {}
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const handleExitAdminPortal = () => {
    setIsStandaloneAdminView(false);
    setActiveTab('dashboard');
    try {
      window.history.replaceState({}, '', '/dashboard');
    } catch {}
  };

  if (isStandaloneAdminView) {
    return (
      <AppErrorBoundary>
        <SeparateAdminPortal
          currentUser={currentUser}
          settings={settings}
          onUpdateSettings={(partial) => setSettings((prev) => ({ ...prev, ...partial }))}
          onLogin={(user) => setCurrentUser(user)}
          onLogout={() => {
            firebaseLogout();
            setCurrentUser(null);
            addToast('Signed out of Admin Portal.', 'info');
          }}
          onExitToUserApp={handleExitAdminPortal}
          isDark={isDark}
          themeStyles={themeStyles}
          onShowToast={addToast}
        />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </AppErrorBoundary>
    );
  }

  return (
    <AppErrorBoundary>
    <div className={`min-h-screen transition-colors duration-200 ${themeStyles.bgGradient}`}>
      {/* Top Navigation */}
      <Navbar
        brightnessMode={brightnessMode}
        onBrightnessChange={handleBrightnessChange}
        fontFamily={settings.fontFamily || 'plus-jakarta'}
        onFontChange={(font: FontFamilyId) => {
          setSettings((prev) => ({ ...prev, fontFamily: font }));
          addToast(`Font switched to ${getFontOption(font).name}`, 'info');
        }}
        isDark={isDark}
        themeStyles={themeStyles}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        mobileMenuOpen={mobileMenuOpen}
        onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)}
        hasApiKey={hasApiKey}
        currentUser={currentUser}
        onOpenAuthModal={openAuthModal}
        onLogout={() => {
          firebaseLogout();
          setCurrentUser(null);
          addToast('Signed out successfully.', 'info');
        }}
        uiLanguage={settings.uiLanguage}
      />

      {/* Main App Layout */}
      <div className="flex max-w-7xl mx-auto">
        {/* Desktop Sidebar & Mobile Drawer — only shown after Sign In */}
        {currentUser && (
          <Sidebar
            activeTab={activeTab}
            onTabChange={handleTabChange}
            isDark={isDark}
            themeStyles={themeStyles}
            mobileMenuOpen={mobileMenuOpen}
            onCloseMobileMenu={() => setMobileMenuOpen(false)}
            savedCount={history.length}
            currentUser={currentUser}
            uiLanguage={settings.uiLanguage}
          />
        )}

        {/* Content Area */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          {/* Sign-In Gate / Dashboard Tab (/dashboard) */}
          {(!currentUser || activeTab === 'dashboard') && (
            <DashboardView
              onStartNew={handleStartNew}
              onNavigate={handleTabChange}
              recentConversations={history}
              currentUser={currentUser}
              onLogin={(user) => setCurrentUser(user)}
              onLogout={() => {
                firebaseLogout();
                setCurrentUser(null);
                setActiveTab('dashboard');
                try {
                  window.history.replaceState({}, '', '/dashboard');
                } catch {}
                addToast('Signed out successfully.', 'info');
              }}
              onOpenAuthModal={openAuthModal}
              feedbackProfile={feedbackProfile}
              onOpenFeedbackHistory={() => {
                setHistorySection('feedback');
                handleTabChange('history');
              }}
              onShowToast={addToast}
              activeModel={aiModel}
              hasApiKey={hasApiKey}
              isDark={isDark}
              themeStyles={themeStyles}
              uiLanguage={settings.uiLanguage}
            />
          )}

          {/* Protected Workspace Modules (Unlocked after Sign In) */}
          {currentUser && activeTab === 'generator' && (
            <MainEngine
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              latestMessage={latestMessage}
              setLatestMessage={setLatestMessage}
              platform={platform}
              setPlatform={setPlatform}
              tones={tones}
              setTones={setTones}
              customTone={customTone}
              setCustomTone={setCustomTone}
              emojiIntensity={emojiIntensity}
              setEmojiIntensity={setEmojiIntensity}
              language={language}
              setLanguage={setLanguage}
              responseLength={responseLength}
              setResponseLength={setResponseLength}
              relationship={relationship}
              setRelationship={setRelationship}
              purpose={purpose}
              setPurpose={setPurpose}
              additionalContext={additionalContext}
              setAdditionalContext={setAdditionalContext}
              analysis={analysis}
              replies={replies}
              aiModel={aiModel}
              setAiModel={setAiModel}
              includeHashtags={includeHashtags}
              setIncludeHashtags={setIncludeHashtags}
              includeLinks={includeLinks}
              setIncludeLinks={setIncludeLinks}
              autoRefineEnabled={autoRefineEnabled}
              setAutoRefineEnabled={(val) => {
                setAutoRefineEnabled(val);
                setSettings((prev) => ({ ...prev, autoRefineReplies: val }));
              }}
              threadSummary={threadSummary}
              isSummarizingThread={isSummarizingThread}
              autoSummarizeEnabled={autoSummarizeEnabled}
              setAutoSummarizeEnabled={(val) => {
                setAutoSummarizeEnabled(val);
                setSettings((prev) => ({ ...prev, autoSummarizeThreads: val }));
              }}
              onSummarizeThread={async () => {
                await handleSummarizeThread(true);
              }}
              onDismissThreadSummary={() => setThreadSummary(null)}
              preferredEmojis={preferredEmojis}
              setPreferredEmojis={setPreferredEmojis}
              isAnalyzing={isAnalyzing}
              isGenerating={isGenerating}
              isAutoRefining={isAutoRefining}
              isImproving={isImproving}
              onAnalyze={handleAnalyze}
              onGenerateReplies={handleGenerateReplies}
              onImproveReply={handleImproveReply}
              onCopyReply={handleCopyReply}
              onSaveReply={handleSaveReply}
              onEditReply={handleEditReply}
              onExportReply={handleExportReplySingle}
              onRateReply={handleRateReply}
              feedbackProfile={feedbackProfile}
              onOpenFeedbackHistory={() => {
                setHistorySection('feedback');
                handleTabChange('history');
              }}
              onBackToDashboard={() => handleTabChange('dashboard')}
              onClearInputs={handleClearInputs}
              onLoadSample={handleLoadSample}
              isDark={isDark}
              themeStyles={themeStyles}
              uiLanguage={settings.uiLanguage}
            />
          )}

          {/* Situation Analyzer Tab (/analyzer) */}
          {currentUser && activeTab === 'analyzer' && (
            <MainEngine
              chatHistory={chatHistory}
              setChatHistory={setChatHistory}
              latestMessage={latestMessage}
              setLatestMessage={setLatestMessage}
              platform={platform}
              setPlatform={setPlatform}
              tones={tones}
              setTones={setTones}
              customTone={customTone}
              setCustomTone={setCustomTone}
              emojiIntensity={emojiIntensity}
              setEmojiIntensity={setEmojiIntensity}
              language={language}
              setLanguage={setLanguage}
              responseLength={responseLength}
              setResponseLength={setResponseLength}
              relationship={relationship}
              setRelationship={setRelationship}
              purpose={purpose}
              setPurpose={setPurpose}
              additionalContext={additionalContext}
              setAdditionalContext={setAdditionalContext}
              analysis={analysis}
              replies={replies}
              aiModel={aiModel}
              setAiModel={setAiModel}
              includeHashtags={includeHashtags}
              setIncludeHashtags={setIncludeHashtags}
              includeLinks={includeLinks}
              setIncludeLinks={setIncludeLinks}
              autoRefineEnabled={autoRefineEnabled}
              setAutoRefineEnabled={(val) => {
                setAutoRefineEnabled(val);
                setSettings((prev) => ({ ...prev, autoRefineReplies: val }));
              }}
              threadSummary={threadSummary}
              isSummarizingThread={isSummarizingThread}
              autoSummarizeEnabled={autoSummarizeEnabled}
              setAutoSummarizeEnabled={(val) => {
                setAutoSummarizeEnabled(val);
                setSettings((prev) => ({ ...prev, autoSummarizeThreads: val }));
              }}
              onSummarizeThread={async () => {
                await handleSummarizeThread(true);
              }}
              onDismissThreadSummary={() => setThreadSummary(null)}
              preferredEmojis={preferredEmojis}
              setPreferredEmojis={setPreferredEmojis}
              isAnalyzing={isAnalyzing}
              isGenerating={isGenerating}
              isAutoRefining={isAutoRefining}
              isImproving={isImproving}
              onAnalyze={handleAnalyze}
              onGenerateReplies={handleGenerateReplies}
              onImproveReply={handleImproveReply}
              onCopyReply={handleCopyReply}
              onSaveReply={handleSaveReply}
              onEditReply={handleEditReply}
              onExportReply={handleExportReplySingle}
              onBackToDashboard={() => handleTabChange('dashboard')}
              onClearInputs={handleClearInputs}
              onLoadSample={handleLoadSample}
              isDark={isDark}
              themeStyles={themeStyles}
              modeOnlyAnalyzer={true}
              uiLanguage={settings.uiLanguage}
            />
          )}

          {/* Career & Academic Hub (Prompt Studio) */}
          {currentUser && activeTab === 'templates' && (
            <PromptStudio
              isDark={isDark}
              themeStyles={themeStyles}
              onShowToast={addToast}
            />
          )}

          {/* Documents & Exports Tab */}
          {currentUser && activeTab === 'documents' && (
            <DocumentBuilder
              currentAnalysis={analysis}
              currentReplies={replies}
              chatHistory={chatHistory}
              latestMessage={latestMessage}
              platform={platform}
              selectedReplyId={selectedDocReplyId}
              selectedReplyTrigger={selectedDocReplyTrigger}
              defaultFontFamily={settings.fontFamily || 'plus-jakarta'}
              isDark={isDark}
              themeId="executive-navy"
              themeStyles={themeStyles}
              onShowToast={addToast}
            />
          )}

          {/* Conversation History Tab */}
          {currentUser && activeTab === 'history' && (
            <HistoryView
              history={history}
              onOpenConversation={handleOpenConversation}
              onDeleteConversation={handleDeleteConversation}
              onRenameConversation={handleRenameConversation}
              onClearAllHistory={handleClearAllHistory}
              onExportConversation={handleExportConversationDoc}
              feedbackHistory={feedbackHistory}
              feedbackProfile={feedbackProfile}
              onDeleteFeedback={handleDeleteFeedback}
              onClearFeedback={handleClearFeedback}
              initialSection={historySection}
              isDark={isDark}
              themeStyles={themeStyles}
            />
          )}

          {/* Admin Portal Tab */}
          {currentUser && activeTab === 'admin' && (
            <AdminPortal
              currentUser={currentUser}
              onOpenAuthModal={() => openAuthModal('admin')}
              isDark={isDark}
              themeStyles={themeStyles}
              onShowToast={addToast}
            />
          )}

          {/* Settings Tab */}
          {currentUser && activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              onUpdateSettings={(newVals) => setSettings((prev) => ({ ...prev, ...newVals }))}
              onResetSettings={() => {
                setSettings(DEFAULT_SETTINGS);
                setBrightnessMode(DEFAULT_SETTINGS.brightnessMode);
                setAiModel(DEFAULT_SETTINGS.defaultModel);
              }}
              onClearAllData={() => {
                localStorage.removeItem('situation_ai_history');
                setHistory([]);
              }}
              isDark={isDark}
              themeStyles={themeStyles}
              onShowToast={addToast}
            />
          )}
        </main>
      </div>

      {/* User Login & Admin Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={(user) => {
          setCurrentUser(user);
          if (user.role === 'admin' && user.provider === 'admin_portal') {
            setActiveTab('admin');
          }
        }}
        onLogout={() => {
          firebaseLogout();
          setCurrentUser(null);
        }}
        isDark={isDark}
        themeStyles={themeStyles}
        onShowToast={addToast}
        initialTab={authModalTab}
        initialProviderDrawer={authModalProviderDrawer}
        initialMode={authModalMode}
        initialError={authModalInitialError}
      />

      {/* Floating Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
    </AppErrorBoundary>
  );
}

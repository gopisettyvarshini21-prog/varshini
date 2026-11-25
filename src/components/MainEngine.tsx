import React, { useState, useRef } from 'react';
import {
  Sparkles,
  ClipboardPaste,
  Trash2,
  Upload,
  Compass,
  ArrowRight,
  RotateCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  BookOpen,
  Info,
  Hash,
  Link as LinkIcon,
  Filter,
  Eye,
  EyeOff,
  RotateCcw,
  Search,
  X,
  ArrowUpDown,
  Briefcase,
  Zap,
  Palette,
  ShieldCheck,
  ListChecks,
  Copy,
  Check,
  Users,
  HelpCircle,
  Mic,
  MicOff,
  Square,
  Volume2,
} from 'lucide-react';
import {
  PlatformId,
  EmojiIntensity,
  ResponseLength,
  SituationAnalysis,
  ReplyOption,
  AIModelPersona,
  UILanguage,
  ThreadSummary,
  FeedbackRating,
  ReplyPreferenceProfile,
} from '../types';
import { getTranslations } from '../utils/i18n';
import { PlatformSelector } from './PlatformSelector';
import { ToneSelector } from './ToneSelector';
import { EmojiIntensitySelector } from './EmojiIntensitySelector';
import { SituationCard } from './SituationCard';
import { ToneRadarChart, deriveToneDimensions } from './ToneRadarChart';
import { RepliesPanel } from './RepliesPanel';
import { AIModelSelector } from './AIModelSelector';
import { SAMPLE_CHATS, SampleChatPreset } from '../utils/sampleChats';
import {
  SPEECH_LOCALE_OPTIONS,
  SpeechRecognitionInstance,
  getSpeechRecognitionConstructor,
  getSpeechErrorMessage,
  mapAppLanguageToSpeechLocale,
} from '../utils/speechUtils';

interface MainEngineProps {
  chatHistory: string;
  setChatHistory: (val: string) => void;
  latestMessage: string;
  setLatestMessage: (val: string) => void;
  platform: PlatformId;
  setPlatform: (val: PlatformId) => void;
  tones: string[];
  setTones: (val: string[]) => void;
  customTone: string;
  setCustomTone: (val: string) => void;
  emojiIntensity: EmojiIntensity;
  setEmojiIntensity: (val: EmojiIntensity) => void;
  language: string;
  setLanguage: (val: string) => void;
  responseLength: ResponseLength;
  setResponseLength: (val: ResponseLength) => void;
  relationship: string;
  setRelationship: (val: string) => void;
  purpose: string;
  setPurpose: (val: string) => void;
  additionalContext: string;
  setAdditionalContext: (val: string) => void;
  analysis: SituationAnalysis | null;
  replies: ReplyOption[];
  aiModel: AIModelPersona;
  setAiModel: (model: AIModelPersona) => void;
  includeHashtags: boolean;
  setIncludeHashtags: (val: boolean) => void;
  includeLinks: boolean;
  setIncludeLinks: (val: boolean) => void;
  autoRefineEnabled?: boolean;
  setAutoRefineEnabled?: (val: boolean) => void;
  threadSummary?: ThreadSummary | null;
  isSummarizingThread?: boolean;
  autoSummarizeEnabled?: boolean;
  setAutoSummarizeEnabled?: (val: boolean) => void;
  onSummarizeThread?: () => Promise<void> | void;
  onDismissThreadSummary?: () => void;
  preferredEmojis?: string[];
  setPreferredEmojis?: React.Dispatch<React.SetStateAction<string[]>>;
  isAnalyzing: boolean;
  isGenerating: boolean;
  isAutoRefining?: boolean;
  isImproving: string | null;
  onAnalyze: () => Promise<void>;
  onGenerateReplies: () => Promise<void>;
  onImproveReply: (replyId: string, action: string, customInstruction?: string) => Promise<void>;
  onCopyReply: (content: string) => void;
  onSaveReply: (reply: ReplyOption) => void;
  onEditReply: (id: string, newContent: string) => void;
  onExportReply: (reply: ReplyOption) => void;
  onRateReply?: (reply: ReplyOption, rating: FeedbackRating | null, reason?: string) => void;
  feedbackProfile?: ReplyPreferenceProfile;
  onOpenFeedbackHistory?: () => void;
  onBackToDashboard?: () => void;
  onClearInputs: () => void;
  onLoadSample: (sample: SampleChatPreset) => void;
  isDark: boolean;
  themeStyles: any;
  modeOnlyAnalyzer?: boolean;
  uiLanguage?: UILanguage;
}

export const MainEngine: React.FC<MainEngineProps> = ({
  chatHistory,
  setChatHistory,
  latestMessage,
  setLatestMessage,
  platform,
  setPlatform,
  tones,
  setTones,
  customTone,
  setCustomTone,
  emojiIntensity,
  setEmojiIntensity,
  language,
  setLanguage,
  responseLength,
  setResponseLength,
  relationship,
  setRelationship,
  purpose,
  setPurpose,
  additionalContext,
  setAdditionalContext,
  analysis,
  replies,
  aiModel,
  setAiModel,
  includeHashtags,
  setIncludeHashtags,
  includeLinks,
  setIncludeLinks,
  autoRefineEnabled = true,
  setAutoRefineEnabled,
  threadSummary = null,
  isSummarizingThread = false,
  autoSummarizeEnabled = true,
  setAutoSummarizeEnabled,
  onSummarizeThread,
  onDismissThreadSummary,
  preferredEmojis = [],
  setPreferredEmojis,
  isAnalyzing,
  isGenerating,
  isAutoRefining = false,
  isImproving,
  onAnalyze,
  onGenerateReplies,
  onImproveReply,
  onCopyReply,
  onSaveReply,
  onEditReply,
  onExportReply,
  onRateReply,
  feedbackProfile,
  onOpenFeedbackHistory,
  onBackToDashboard,
  onClearInputs,
  onLoadSample,
  isDark,
  themeStyles,
  modeOnlyAnalyzer = false,
  uiLanguage = 'en',
}) => {
  const t = getTranslations(uiLanguage);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [showPresetsDrawer, setShowPresetsDrawer] = useState(false);
  const [presetCategory, setPresetCategory] = useState<'all' | 'work' | 'personal' | 'social' | 'academic'>('all');
  const [copiedDigest, setCopiedDigest] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Web Speech API Dictation States
  const [dictationTarget, setDictationTarget] = useState<'history' | 'latest' | null>(null);
  const [speechLocale, setSpeechLocale] = useState<string>(() => mapAppLanguageToSpeechLocale(language));
  const [historySpeakerMode, setHistorySpeakerMode] = useState<'plain' | 'other' | 'you'>('plain');
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const chatHistoryRef = useRef(chatHistory);
  const latestMessageRef = useRef(latestMessage);
  const historySpeakerModeRef = useRef(historySpeakerMode);

  React.useEffect(() => {
    chatHistoryRef.current = chatHistory;
  }, [chatHistory]);

  React.useEffect(() => {
    latestMessageRef.current = latestMessage;
  }, [latestMessage]);

  React.useEffect(() => {
    historySpeakerModeRef.current = historySpeakerMode;
  }, [historySpeakerMode]);

  React.useEffect(() => {
    setSpeechLocale(mapAppLanguageToSpeechLocale(language));
  }, [language]);

  const stopDictation = React.useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setDictationTarget(null);
    setInterimTranscript('');
  }, []);

  React.useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const toggleDictation = (target: 'history' | 'latest') => {
    setSpeechError(null);

    if (dictationTarget === target) {
      stopDictation();
      return;
    }

    stopDictation();

    const RecognitionCtor = getSpeechRecognitionConstructor();
    if (!RecognitionCtor) {
      setSpeechError(
        'Voice dictation uses the Web Speech API, which is supported in Chrome, Edge, and Safari.'
      );
      return;
    }

    try {
      const recognition = new RecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = speechLocale || 'en-US';
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        setDictationTarget(target);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcriptText = event.results[i]?.[0]?.transcript || '';
          if (event.results[i].isFinal) {
            finalChunk += transcriptText;
          } else {
            interimChunk += transcriptText;
          }
        }

        setInterimTranscript(interimChunk.trim());

        const cleanFinal = finalChunk.trim();
        if (cleanFinal) {
          if (target === 'latest') {
            const current = latestMessageRef.current.trim();
            setLatestMessage(current ? `${current} ${cleanFinal}` : cleanFinal);
          } else {
            const current = chatHistoryRef.current.trimEnd();
            const prefix =
              historySpeakerModeRef.current === 'other'
                ? 'Other Person: '
                : historySpeakerModeRef.current === 'you'
                ? 'You: '
                : '';
            const formattedTurn = `${prefix}${cleanFinal}`;
            setChatHistory(current ? `${current}\n${formattedTurn}` : formattedTurn);
          }
        }
      };

      recognition.onerror = (event) => {
        const msg = getSpeechErrorMessage(event.error);
        if (msg) {
          setSpeechError(msg);
        }
        if (event.error !== 'no-speech') {
          stopDictation();
        }
      };

      recognition.onend = () => {
        setDictationTarget(null);
        setInterimTranscript('');
        recognitionRef.current = null;
      };

      recognition.start();
    } catch (err: any) {
      setSpeechError(err?.message || 'Unable to start microphone dictation.');
      stopDictation();
    }
  };

  const handleTogglePreferredEmoji = (emoji: string) => {
    if (!setPreferredEmojis) return;
    setPreferredEmojis((prev) =>
      prev.includes(emoji) ? prev.filter((e) => e !== emoji) : [...prev.slice(-7), emoji]
    );
  };

  const handleInsertEmoji = (emoji: string) => {
    const current = latestMessage.trimEnd();
    setLatestMessage(current ? `${current} ${emoji}` : emoji);
  };

  const historyTrimmed = chatHistory.trim();
  const historyLines = historyTrimmed
    ? historyTrimmed.split(/\r?\n/).filter((l) => l.trim()).length
    : 0;
  const isComplexThread = historyTrimmed.length >= 160 || historyLines >= 4;

  const handleCopyDigest = () => {
    if (!threadSummary) return;
    const text = [
      `Topic: ${threadSummary.keyTopic}`,
      ...threadSummary.bullets.map((b) => `• ${b}`),
      threadSummary.openQuestions && threadSummary.openQuestions.length > 0
        ? `Open Questions: ${threadSummary.openQuestions.join('; ')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedDigest(true);
    setTimeout(() => setCopiedDigest(false), 1800);
  };

  // Reply Filter & Sort System States
  const [filterMode, setFilterMode] = useState<'hide' | 'highlight'>('highlight');
  const [sortBy, setSortBy] = useState<
    'default' | 'most-professional' | 'concise' | 'most-creative' | 'best-match'
  >('default');
  const [lengthFilter, setLengthFilter] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [toneFilter, setToneFilter] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState<string>('');

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        if (!latestMessage) {
          setLatestMessage(text);
        } else {
          setChatHistory(chatHistory ? `${chatHistory}\n${text}` : text);
        }
      }
    } catch (e) {
      // Browser permissions fallback
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          setChatHistory(content);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = '';
  };

  // Trait Scoring Helpers for Sorting & Smart Filtering
  const getProfessionalismScore = (rep: ReplyOption): number => {
    const meta = `${rep.tone || ''} ${rep.styleLabel || ''} ${rep.explanation || ''}`.toLowerCase();
    const content = (rep.content || '').toLowerCase();
    let score = 0;

    const proMetaKeywords = [
      'profess',
      'formal',
      'diplomat',
      'polite',
      'executive',
      'business',
      'workplace',
      'tactful',
      'courteous',
      'respectful',
      'balanced',
    ];
    proMetaKeywords.forEach((kw) => {
      if (meta.includes(kw)) score += 25;
    });

    const proContentKeywords = [
      'please',
      'thank',
      'appreciate',
      'happy to',
      'certainly',
      'would you',
      'let me know',
      'regards',
      'schedule',
      'clarify',
      'understand',
      'apologize',
      'forward to',
      'collaborat',
    ];
    proContentKeywords.forEach((kw) => {
      if (content.includes(kw)) score += 8;
    });

    const casualPenalty = [
      'gen z',
      'slang',
      'sarcas',
      'rizz',
      'no cap',
      'lol',
      'lmao',
      'bruh',
      'lowkey',
      'slay',
      'vibe',
      'haha',
      'omg',
      'bestie',
    ];
    casualPenalty.forEach((kw) => {
      if (meta.includes(kw) || content.includes(kw)) score -= 25;
    });

    if (/^[A-Z]/.test((rep.content || '').trim()) && /[.!?]$/.test((rep.content || '').trim())) {
      score += 5;
    }

    return score + (rep.matchScore || 0) * 0.1;
  };

  const getConcisenessScore = (rep: ReplyOption): number => {
    const trimmed = (rep.content || '').trim();
    return 100000 - trimmed.length * 10 + (rep.matchScore || 0) * 0.01;
  };

  const getCreativityScore = (rep: ReplyOption): number => {
    const meta = `${rep.tone || ''} ${rep.styleLabel || ''} ${rep.explanation || ''}`.toLowerCase();
    const content = rep.content || '';
    const lowerContent = content.toLowerCase();
    let score = 0;

    const creativeMetaKeywords = [
      'creativ',
      'witty',
      'playful',
      'humor',
      'funny',
      'sarcas',
      'gen z',
      'slang',
      'bold',
      'clever',
      'expressive',
      'charming',
      'memorable',
      'fresh',
      'rizz',
      'unconventional',
    ];
    creativeMetaKeywords.forEach((kw) => {
      if (meta.includes(kw)) score += 25;
    });

    if (/[—!?]/.test(content)) score += 8;
    if (/[\u{1F300}-\u{1FAFF}]/u.test(content)) score += 10;

    const words = lowerContent.split(/\s+/).filter(Boolean);
    if (words.length > 0) {
      const uniqueRatio = new Set(words).size / words.length;
      score += Math.round(uniqueRatio * 20);
    }

    const dryPhrases = ['per my last', 'kindly advise', 'attached please find', 'sincerely'];
    dryPhrases.forEach((kw) => {
      if (lowerContent.includes(kw)) score -= 12;
    });

    return score + (rep.matchScore || 0) * 0.1;
  };

  // Filter Match Calculations
  const getReplyLengthCategory = (text: string): 'short' | 'medium' | 'long' => {
    const len = (text || '').trim().length;
    if (len < 160) return 'short';
    if (len <= 380) return 'medium';
    return 'long';
  };

  const matchesLength = (rep: ReplyOption) => {
    if (lengthFilter === 'all') return true;
    return getReplyLengthCategory(rep.content || '') === lengthFilter;
  };

  const matchesTone = (rep: ReplyOption) => {
    if (toneFilter === 'all') return true;
    const combined = `${rep.tone || ''} ${rep.styleLabel || ''} ${rep.explanation || ''}`.toLowerCase();
    switch (toneFilter) {
      case 'natural':
        return combined.includes('natural') || combined.includes('casual') || combined.includes('everyday');
      case 'warm':
        return (
          combined.includes('warm') ||
          combined.includes('friendly') ||
          combined.includes('empath') ||
          combined.includes('heartfelt') ||
          combined.includes('support')
        );
      case 'direct':
        return (
          combined.includes('direct') ||
          combined.includes('confident') ||
          combined.includes('clear') ||
          combined.includes('punchy') ||
          combined.includes('bold')
        );
      case 'professional':
        return (
          combined.includes('profess') ||
          combined.includes('polite') ||
          combined.includes('diplomat') ||
          combined.includes('business') ||
          combined.includes('workplace') ||
          combined.includes('formal') ||
          combined.includes('executive') ||
          getProfessionalismScore(rep) >= 25
        );
      case 'creative':
        return (
          combined.includes('creativ') ||
          combined.includes('witty') ||
          combined.includes('playful') ||
          combined.includes('humor') ||
          combined.includes('funny') ||
          combined.includes('sarcas') ||
          combined.includes('bold') ||
          combined.includes('clever') ||
          combined.includes('expressive') ||
          combined.includes('gen z') ||
          combined.includes('slang') ||
          getCreativityScore(rep) >= 25
        );
      case 'genz':
        return (
          combined.includes('gen z') ||
          combined.includes('genz') ||
          combined.includes('slang') ||
          combined.includes('rizz') ||
          combined.includes('playful') ||
          combined.includes('funny') ||
          combined.includes('no cap')
        );
      default:
        return combined.includes(toneFilter.toLowerCase());
    }
  };

  const matchesSearch = (rep: ReplyOption) => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      (rep.content || '').toLowerCase().includes(q) ||
      (rep.styleLabel || '').toLowerCase().includes(q) ||
      (rep.tone && rep.tone.toLowerCase().includes(q)) ||
      (rep.explanation && rep.explanation.toLowerCase().includes(q))
    );
  };

  const dynamicToneLabels = React.useMemo(() => {
    const seen = new Set<string>();
    const labels: string[] = [];
    (replies || []).forEach((rep) => {
      const toneVal = (rep.tone || '').trim();
      if (toneVal && !seen.has(toneVal.toLowerCase())) {
        seen.add(toneVal.toLowerCase());
        labels.push(toneVal);
      }
    });
    return labels;
  }, [replies]);

  const [showToneLabelsPanel, setShowToneLabelsPanel] = useState<boolean>(true);

  const isReplyMatched = (rep: ReplyOption) => {
    return matchesLength(rep) && matchesTone(rep) && matchesSearch(rep);
  };

  const isAnyFilterActive =
    lengthFilter !== 'all' || toneFilter !== 'all' || searchFilter.trim() !== '';

  const isAnySortOrFilterActive = isAnyFilterActive || sortBy !== 'default';

  const matchingReplyIds = (replies || []).filter(isReplyMatched).map((r) => r.id);

  const filteredReplies =
    filterMode === 'hide' && isAnyFilterActive
      ? (replies || []).filter(isReplyMatched)
      : [...(replies || [])];

  const displayedReplies = [...filteredReplies].sort((a, b) => {
    switch (sortBy) {
      case 'most-professional':
        return getProfessionalismScore(b) - getProfessionalismScore(a);
      case 'concise': {
        const lenDiff = (a.content || '').trim().length - (b.content || '').trim().length;
        return lenDiff !== 0 ? lenDiff : (b.matchScore || 0) - (a.matchScore || 0);
      }
      case 'most-creative':
        return getCreativityScore(b) - getCreativityScore(a);
      case 'best-match':
        return (b.matchScore || 0) - (a.matchScore || 0);
      default:
        return 0;
    }
  });

  const handleResetFilters = () => {
    setSortBy('default');
    setLengthFilter('all');
    setToneFilter('all');
    setSearchFilter('');
  };

  const prevRepliesRef = React.useRef<ReplyOption[]>(replies);

  React.useEffect(() => {
    const prev = prevRepliesRef.current;
    prevRepliesRef.current = replies;
    if (
      prev !== replies &&
      replies &&
      replies.length > 0 &&
      filterMode === 'hide' &&
      isAnyFilterActive &&
      displayedReplies.length === 0
    ) {
      handleResetFilters();
    }
  }, [replies, filterMode, isAnyFilterActive, displayedReplies.length]);

  return (
    <div className="space-y-5">
      {/* Workspace Header & Collapsible Presets Drawer */}
      <div
        className={`p-4 rounded-2xl border flex flex-col gap-3 ${
          isDark ? `${themeStyles.cardBg} ${themeStyles.cardBorder}` : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              {onBackToDashboard && (
                <button
                  type="button"
                  onClick={onBackToDashboard}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[11px] font-semibold transition-colors ${
                    isDark
                      ? 'border-slate-700 bg-[#12161F] hover:bg-[#1E2430] text-slate-300'
                      : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>← Dashboard</span>
                </button>
              )}
              <Sparkles className="w-4 h-4 text-blue-500" />
              <h1 className={`text-base sm:text-lg font-black tracking-tight ${themeStyles.textPrimary}`}>
                {modeOnlyAnalyzer ? t.nav.analyzer : t.nav.replyEngine}
              </h1>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                  isDark
                    ? 'bg-[#1E2430] text-slate-300 border-slate-700'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                {modeOnlyAnalyzer ? '/analyzer · Audit Mode' : `/reply-engine · ${aiModel.toUpperCase()}`}
              </span>
            </div>
            <p className={`text-xs mt-1 ${themeStyles.textMuted}`}>
              {modeOnlyAnalyzer
                ? 'Dedicated analysis view — audit sender intent, emotional subtext, risks, and strategy.'
                : 'Dedicated AI Reply Engine — compose human-like multi-option replies tailored to platform, relationship, and tone.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowPresetsDrawer((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
              isDark
                ? 'border-slate-700 bg-[#12161F] hover:bg-[#1E2430] text-slate-200'
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800'
            }`}
          >
            <span>Load Scenario Preset ({SAMPLE_CHATS.length})</span>
            {showPresetsDrawer ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {showPresetsDrawer && (
          <div className={`pt-3 border-t space-y-2.5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'work', 'personal', 'social', 'academic'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setPresetCategory(cat)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border capitalize transition-colors ${
                    presetCategory === cat
                      ? themeStyles.primaryAccent
                      : isDark
                      ? 'border-slate-700 bg-[#12161F] text-slate-300 hover:bg-[#1E2430]'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 max-h-36 overflow-y-auto pr-1">
              {SAMPLE_CHATS.filter(
                (s) => presetCategory === 'all' || s.category === presetCategory
              ).map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => {
                    onLoadSample(sample);
                    setShowPresetsDrawer(false);
                  }}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-all ${
                    isDark
                      ? 'border-slate-700 bg-[#12161F] text-slate-200 hover:bg-[#1E2430] hover:border-blue-500/60'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100 shadow-xs'
                  }`}
                >
                  {sample.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Form Input Panel */}
      <div
        className={`rounded-2xl border p-5 md:p-6 transition-all shadow-sm ${themeStyles.cardBg} ${themeStyles.cardBorder} space-y-5`}
      >
        {/* Header with tool buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/30">
          <div>
            <h2 className={`text-base font-black ${themeStyles.textPrimary}`}>
              {modeOnlyAnalyzer ? t.engine.analyzerHeading : t.engine.inputHeading}
            </h2>
            <p className={`text-xs ${themeStyles.textMuted}`}>
              {t.engine.inputSubheading}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePasteClipboard}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>{t.engine.pasteBtn}</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{t.engine.uploadBtn}</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".txt,.json,.log"
              className="hidden"
            />

            <button
              type="button"
              onClick={onClearInputs}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t.engine.clearBtn}</span>
            </button>
          </div>
        </div>

        {/* AI Model Persona Selector */}
        <AIModelSelector
          selectedModel={aiModel}
          onSelectModel={setAiModel}
          isDark={isDark}
          themeStyles={themeStyles}
        />

        {/* Voice Dictation Studio Bar (Web Speech API) */}
        <div
          className={`p-3 rounded-xl border flex flex-col gap-2 transition-colors ${
            dictationTarget
              ? isDark
                ? 'bg-[#161B22] border-emerald-600/70'
                : 'bg-emerald-50 border-emerald-300'
              : isDark
              ? 'bg-[#161B22] border-slate-800'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  dictationTarget
                    ? 'bg-rose-500 text-white'
                    : isDark
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                {dictationTarget ? <Volume2 className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </div>
              <div>
                <span className={`text-xs font-bold block ${themeStyles.textPrimary}`}>
                  {dictationTarget === 'history'
                    ? 'Listening for Chat History...'
                    : dictationTarget === 'latest'
                    ? 'Listening for Latest Incoming Message...'
                    : 'Voice Dictation Studio (Web Speech API)'}
                </span>
                <span className={`text-[10.5px] ${themeStyles.textMuted}`}>
                  Speak naturally to dictate conversation turns or incoming messages hands-free
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <select
                aria-label="Dictation Speech Language"
                value={speechLocale}
                onChange={(e) => setSpeechLocale(e.target.value)}
                className={`py-1 px-2 rounded-lg text-[11px] font-semibold border focus:outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-slate-200'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                {SPEECH_LOCALE_OPTIONS.map((loc) => (
                  <option key={loc.code} value={loc.code}>
                    {loc.label}
                  </option>
                ))}
              </select>

              <select
                aria-label="Chat History Speaker Label"
                value={historySpeakerMode}
                onChange={(e) => setHistorySpeakerMode(e.target.value as 'plain' | 'other' | 'you')}
                title="Prefix appended when dictating into Chat History"
                className={`py-1 px-2 rounded-lg text-[11px] font-semibold border focus:outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-slate-200'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="plain">History Turn: Plain</option>
                <option value="other">Turn: Other Person</option>
                <option value="you">Turn: You</option>
              </select>

              {dictationTarget && (
                <button
                  type="button"
                  onClick={stopDictation}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-rose-600 text-white hover:bg-rose-500 transition-colors"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop Mic</span>
                </button>
              )}
            </div>
          </div>

          {interimTranscript && (
            <div
              className={`px-3 py-1.5 rounded-lg text-xs italic border ${
                isDark
                  ? 'bg-slate-950/80 border-emerald-500/30 text-emerald-300'
                  : 'bg-white border-emerald-300 text-emerald-800'
              }`}
            >
              Hearing: "{interimTranscript}"
            </div>
          )}

          {speechError && (
            <div className="px-3 py-1.5 rounded-lg text-[11px] font-medium border border-amber-500/40 bg-amber-500/10 text-amber-500 flex items-center justify-between gap-2">
              <span>{speechError}</span>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="text-xs font-bold hover:underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Input A: Previous Chat History */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <label className={`text-xs font-bold tracking-wide uppercase ${themeStyles.textSecondary}`}>
                {t.engine.historyLabel} <span className="opacity-60 normal-case font-normal">{t.engine.historyHint}</span>
              </label>
              {isComplexThread && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                    isDark
                      ? 'bg-[#1F242D] text-slate-300 border-slate-700'
                      : 'bg-sky-50 text-sky-800 border-sky-200'
                  }`}
                >
                  Complex Thread · Auto-Digest Ready
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 tabular-nums">
                {chatHistory.length} chars · {historyLines} lines
              </span>
              <button
                type="button"
                onClick={() => toggleDictation('history')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  dictationTarget === 'history'
                    ? 'border-rose-500 bg-rose-600 text-white shadow-xs'
                    : isDark
                    ? 'border-slate-700 bg-slate-900 text-slate-200 hover:border-blue-500/60'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {dictationTarget === 'history' ? (
                  <>
                    <MicOff className="w-3 h-3" />
                    <span>Stop History Mic</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3 text-blue-500" />
                    <span>Dictate History</span>
                  </>
                )}
              </button>
              {onSummarizeThread && (
                <button
                  type="button"
                  disabled={isSummarizingThread || (!chatHistory.trim() && !latestMessage.trim())}
                  onClick={() => onSummarizeThread()}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                    isDark
                      ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                      : 'border-sky-300 bg-sky-50 text-sky-800 hover:bg-sky-100'
                  } disabled:opacity-40`}
                >
                  {isSummarizingThread ? (
                    <RotateCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <ListChecks className="w-3 h-3 text-blue-500" />
                  )}
                  <span>{isSummarizingThread ? 'Summarizing...' : 'Summarize Bullets'}</span>
                </button>
              )}
            </div>
          </div>
          <textarea
            id="chat-history-input"
            value={chatHistory}
            onChange={(e) => setChatHistory(e.target.value)}
            rows={4}
            placeholder={`Paste conversation history here...\nExample:\n[Yesterday 4:00 PM] Alex: Are you coming tonight?\n[Yesterday 4:30 PM] You: Yes, on my way soon!\n[Today 10:00 AM] Alex: We waited for an hour.`}
            className={`w-full p-3 rounded-xl text-xs font-mono leading-relaxed border focus:outline-none focus:ring-1 transition-all ${
              isDark
                ? 'bg-[#0D1117] border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600'
            }`}
          />

          {/* Complex Thread Pre-Analysis Bullet Summary Card */}
          {(isSummarizingThread || (threadSummary && threadSummary.bullets.length > 0)) && (
            <div
              className={`mt-2.5 p-3.5 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-[#161B22] border-slate-700 text-slate-200'
                  : 'bg-sky-50/70 border-sky-200 text-slate-800'
              }`}
            >
              {isSummarizingThread && !threadSummary ? (
                <div className="flex items-center gap-2.5 text-xs font-semibold text-blue-400">
                  <RotateCw className="w-4 h-4 animate-spin shrink-0" />
                  <span>
                    Condensing complex chat thread into crisp bullet points for faster context ingestion...
                  </span>
                </div>
              ) : (
                threadSummary && (
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                          <ListChecks className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-black uppercase tracking-wider text-blue-400">
                              Thread Context Digest
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                isDark ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-600 border border-slate-200'
                              }`}
                            >
                              ~{threadSummary.messageCount} msgs ingested
                            </span>
                          </div>
                          <p className={`text-xs font-bold truncate ${themeStyles.textPrimary}`}>
                            {threadSummary.keyTopic}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {onSummarizeThread && (
                          <button
                            type="button"
                            onClick={() => onSummarizeThread()}
                            disabled={isSummarizingThread}
                            title="Refresh bullet summary"
                            className={`p-1.5 rounded-lg border text-xs transition-all ${
                              isDark
                                ? 'border-slate-700 bg-slate-900/70 text-slate-300 hover:bg-slate-800'
                                : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <RotateCw className={`w-3.5 h-3.5 ${isSummarizingThread ? 'animate-spin' : ''}`} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleCopyDigest}
                          title="Copy bullet summary"
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                            isDark
                              ? 'border-slate-700 bg-slate-900/70 text-slate-300 hover:bg-slate-800'
                              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {copiedDigest ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                        {onDismissThreadSummary && (
                          <button
                            type="button"
                            onClick={onDismissThreadSummary}
                            title="Dismiss summary"
                            className={`p-1.5 rounded-lg border transition-all ${
                              isDark
                                ? 'border-slate-700 bg-slate-900/70 text-slate-400 hover:text-rose-400'
                                : 'border-slate-300 bg-white text-slate-500 hover:text-rose-600'
                            }`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <ul className="space-y-1.5 pl-1">
                      {threadSummary.bullets.map((bullet, idx) => (
                        <li
                          key={idx}
                          className={`flex items-start gap-2 text-xs leading-relaxed ${
                            isDark ? 'text-slate-200' : 'text-slate-700'
                          }`}
                        >
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>

                    {((threadSummary.participants && threadSummary.participants.length > 0) ||
                      (threadSummary.openQuestions && threadSummary.openQuestions.length > 0)) && (
                      <div className="pt-2 border-t border-cyan-500/20 flex flex-wrap items-center gap-3 text-[11px]">
                        {threadSummary.participants && threadSummary.participants.length > 0 && (
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                            <span className="font-bold opacity-80">Participants:</span>
                            {threadSummary.participants.map((p, i) => (
                              <span
                                key={i}
                                className={`px-1.5 py-0.5 rounded font-semibold ${
                                  isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700 border border-slate-200'
                                }`}
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        )}
                        {threadSummary.openQuestions && threadSummary.openQuestions.length > 0 && (
                          <div className="flex items-start gap-1.5">
                            <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                            <span className="text-amber-500 font-semibold">
                              Pending: {threadSummary.openQuestions.join(' · ')}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {/* Input B: Latest Incoming Message */}
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <label className={`text-xs font-bold tracking-wide uppercase text-blue-500 flex items-center gap-1`}>
              <span>{t.engine.latestLabel}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-bold">
                {t.engine.actionRequired}
              </span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 tabular-nums">{latestMessage.length} characters</span>
              <button
                type="button"
                onClick={() => toggleDictation('latest')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                  dictationTarget === 'latest'
                    ? 'border-rose-500 bg-rose-600 text-white shadow-xs'
                    : isDark
                    ? 'border-slate-700 bg-[#161B22] text-slate-200 hover:bg-[#1E2430]'
                    : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {dictationTarget === 'latest' ? (
                  <>
                    <MicOff className="w-3 h-3" />
                    <span>Stop Message Mic</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3" />
                    <span>Dictate Message</span>
                  </>
                )}
              </button>
            </div>
          </div>
          <input
            id="latest-message-input"
            type="text"
            value={latestMessage}
            onChange={(e) => setLatestMessage(e.target.value)}
            placeholder="Type or click 'Dictate Message' — e.g. 'Can you send the revised budget today?'"
            className={`w-full p-3 rounded-xl text-xs sm:text-sm font-semibold border focus:outline-none focus:ring-1 transition-all ${
              dictationTarget === 'latest'
                ? 'border-rose-500 ring-1 ring-rose-500'
                : isDark
                ? 'bg-slate-950 border-blue-500/40 text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500'
                : 'bg-white border-blue-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600 shadow-xs'
            }`}
          />
        </div>

        {/* Platform Selection */}
        <PlatformSelector
          selectedPlatform={platform}
          onSelectPlatform={setPlatform}
          isDark={isDark}
          themeStyles={themeStyles}
        />

        {/* Response Style & Tones */}
        {!modeOnlyAnalyzer && (
          <>
            <ToneSelector
              selectedTones={tones}
              onChangeTones={setTones}
              customTone={customTone}
              onChangeCustomTone={setCustomTone}
              isDark={isDark}
              themeStyles={themeStyles}
            />

            {/* Emoji, Language, Length Controls + Quick Emoji Studio */}
            <EmojiIntensitySelector
              emojiIntensity={emojiIntensity}
              onChangeEmojiIntensity={setEmojiIntensity}
              language={language}
              onChangeLanguage={setLanguage}
              responseLength={responseLength}
              onChangeResponseLength={setResponseLength}
              onInsertEmoji={handleInsertEmoji}
              selectedEmojis={preferredEmojis}
              onTogglePreferredEmoji={handleTogglePreferredEmoji}
              isDark={isDark}
              themeStyles={themeStyles}
            />
          </>
        )}

        {/* Options: Hashtags, Links & Auto-Refine */}
        <div className="flex flex-wrap items-center gap-6 pt-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeHashtags}
              onChange={(e) => setIncludeHashtags(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="flex items-center gap-1 font-semibold text-blue-500">
              <Hash className="w-3.5 h-3.5" />
              <span>{t.engine.includeHashtags}</span>
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeLinks}
              onChange={(e) => setIncludeLinks(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span className="flex items-center gap-1 font-semibold text-emerald-500">
              <LinkIcon className="w-3.5 h-3.5" />
              <span>{t.engine.includeLinks}</span>
            </span>
          </label>

          {setAutoRefineEnabled && (
            <label
              className="flex items-center gap-2 cursor-pointer"
              title="Automatically runs a second quality pass against the Situation Analysis before showing replies"
            >
              <input
                type="checkbox"
                checked={autoRefineEnabled}
                onChange={(e) => setAutoRefineEnabled(e.target.checked)}
                className="rounded text-amber-500 focus:ring-amber-500"
              />
              <span className="flex items-center gap-1 font-semibold text-amber-500">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{t.engine.autoRefine}</span>
              </span>
            </label>
          )}

          {setAutoSummarizeEnabled && (
            <label
              className="flex items-center gap-2 cursor-pointer"
              title="Automatically condenses long or multi-turn chat threads into bullet points before running analysis"
            >
              <input
                type="checkbox"
                checked={autoSummarizeEnabled}
                onChange={(e) => setAutoSummarizeEnabled(e.target.checked)}
                className="rounded text-cyan-500 focus:ring-cyan-500"
              />
              <span className="flex items-center gap-1 font-semibold text-cyan-500">
                <ListChecks className="w-3.5 h-3.5" />
                <span>Auto-Summarize Complex Threads (Bullets)</span>
              </span>
            </label>
          )}
        </div>

        {/* Collapsible Optional Contextual Fields */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className={`flex items-center gap-1.5 text-xs font-bold ${themeStyles.secondaryAccent} hover:underline`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>
              {showOptionalFields ? t.engine.optionalHide : t.engine.optionalShow}
            </span>
            {showOptionalFields ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          {showOptionalFields && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-700/30">
              <div>
                <label className={`text-[11px] font-bold block mb-1 ${themeStyles.textSecondary}`}>
                  Relationship Dynamics
                </label>
                <input
                  type="text"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  placeholder="e.g. Close friend, Boss, New Client, Ex, Match"
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-400'
                      : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[11px] font-bold block mb-1 ${themeStyles.textSecondary}`}>
                  Goal / Purpose of Reply
                </label>
                <input
                  type="text"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="e.g. De-escalate gently, Politely decline, Plan call"
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-400'
                      : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                  }`}
                />
              </div>

              <div>
                <label className={`text-[11px] font-bold block mb-1 ${themeStyles.textSecondary}`}>
                  Private Operator Notes
                </label>
                <input
                  type="text"
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  placeholder="e.g. I was stuck in transit, don't mention work"
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-400'
                      : 'bg-white border-slate-300 text-slate-800 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-3 border-t border-slate-700/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isAnalyzing || (!latestMessage.trim() && !chatHistory.trim())}
              onClick={onAnalyze}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                isDark
                  ? 'border-slate-700 bg-[#161B22] hover:bg-[#1E2430] text-slate-200'
                  : 'border-blue-300 bg-blue-50 hover:bg-blue-100 text-blue-800'
              } disabled:opacity-50`}
            >
              {isAnalyzing ? (
                <RotateCw className="w-4 h-4 animate-spin text-blue-400" />
              ) : (
                <Compass className="w-4 h-4 text-blue-400" />
              )}
              <span>{t.engine.analyzeOnlyBtn}</span>
            </button>
          </div>

          <button
            type="button"
            disabled={isGenerating || (!latestMessage.trim() && !chatHistory.trim())}
            onClick={onGenerateReplies}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black tracking-wide shadow-lg transition-all scale-[1.01] hover:scale-[1.02] active:scale-[0.99] ${themeStyles.primaryAccent} disabled:opacity-50`}
          >
            {isGenerating ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" />
                <span>
                  {isAutoRefining
                    ? 'Auto-Refining Against Situation Analysis...'
                    : 'Reading Context & Writing Human Replies...'}
                </span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{t.engine.generateBtn}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Live Tone Radar Preview in Situation Analyzer Tab before running full analysis */}
      {modeOnlyAnalyzer && !analysis && (() => {
        const { dimensions, isBaseline } = deriveToneDimensions(null, chatHistory, latestMessage);
        return (
          <div className={`rounded-2xl border p-5 sm:p-6 shadow-sm ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
            <ToneRadarChart
              dimensions={dimensions}
              isBaseline={isBaseline}
              isDark={isDark}
              themeStyles={themeStyles}
              title="Live Tone Signal Radar"
              subtitle={
                isBaseline
                  ? 'Maps empathy, directness, urgency, warmth, formality, and assertiveness once text is entered'
                  : 'Real-time signal estimate from your draft text — click Analyze Situation for deep AI verification'
              }
            />
          </div>
        );
      })()}

      {/* Situation Analysis Section (Includes Full AI Tone Radar Chart) */}
      {analysis && (
        <SituationCard
          analysis={analysis}
          isDark={isDark}
          themeStyles={themeStyles}
          onApplyStrategy={() => {
            if (analysis.recommendedStrategy) {
              setPurpose(analysis.recommendedStrategy);
              setShowOptionalFields(true);
            }
          }}
        />
      )}

      {/* Generated Replies Filter & View Toggle System Toolbar */}
      {!modeOnlyAnalyzer && replies && replies.length > 0 && (
        <div
          className={`p-4 rounded-2xl border transition-all ${
            isDark ? `${themeStyles.cardBg} ${themeStyles.cardBorder}` : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          {/* Top Row: Title, Active Status, Highlight/Hide Mode Toggle, and Reset */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-700/30">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold">
                <Filter className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className={`text-xs font-bold ${themeStyles.textPrimary}`}>
                    Reply View Toggle & Filter System
                  </h4>
                  {isAnySortOrFilterActive ? (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        filterMode === 'highlight' && isAnyFilterActive
                          ? isDark
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                            : 'bg-amber-100 text-amber-800 border-amber-300'
                          : isDark
                          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                          : 'bg-blue-100 text-blue-800 border-blue-300'
                      }`}
                    >
                      {isAnyFilterActive
                        ? filterMode === 'highlight'
                          ? `Highlighting ${matchingReplyIds.length} of ${replies.length}`
                          : `Showing ${displayedReplies.length} of ${replies.length}`
                        : `View: ${
                            sortBy === 'best-match'
                              ? 'Highest Match Score'
                              : sortBy === 'concise'
                              ? 'Shortest'
                              : sortBy.replace('-', ' ').toUpperCase()
                          }`}
                    </span>
                  ) : (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                        isDark
                          ? 'text-slate-300 bg-[#12161F] border-slate-700'
                          : 'text-slate-600 bg-slate-100 border-slate-300'
                      }`}
                    >
                      All {replies.length} options active
                    </span>
                  )}
                </div>
                <p className={`text-[10.5px] ${themeStyles.textMuted}`}>
                  Toggle view by Highest Match Score, Shortest, or Tone labels — plus search and length filters
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Highlight vs Hide mode switcher */}
              <div
                className={`flex items-center p-0.5 rounded-xl border ${
                  isDark ? 'border-slate-800 bg-[#0D1117]' : 'border-slate-300 bg-slate-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setFilterMode('highlight')}
                  title="Highlight matching replies and softly dim non-matching cards"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterMode === 'highlight'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Highlight</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('hide')}
                  title="Hide non-matching replies completely"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    filterMode === 'hide'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : isDark
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <EyeOff className="w-3 h-3" />
                  <span>Filter Out</span>
                </button>
              </div>

              {/* Reset button */}
              {isAnySortOrFilterActive && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-500 border border-rose-500/30 hover:bg-rose-500/10 transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset All</span>
                </button>
              )}
            </div>
          </div>

          {/* Primary Toggle View Bar: Highest Match Score, Shortest, Tone Labels */}
          <div className="pt-3 pb-3 border-b border-slate-700/20 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={`text-[10.5px] font-bold uppercase tracking-wider flex items-center gap-1 mr-1 ${themeStyles.textSecondary}`}
              >
                <ArrowUpDown className="w-3 h-3 text-blue-500" />
                <span>Toggle View:</span>
              </span>
              {[
                { id: 'default', label: 'AI Ranked', icon: null },
                { id: 'best-match', label: 'Highest Match Score', icon: <Sparkles className="w-3 h-3" /> },
                { id: 'concise', label: 'Shortest', icon: <Zap className="w-3 h-3" /> },
                { id: 'most-professional', label: 'Most Professional', icon: <Briefcase className="w-3 h-3" /> },
                { id: 'most-creative', label: 'Most Creative', icon: <Palette className="w-3 h-3" /> },
              ].map((opt) => {
                const isSelected = sortBy === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      setSortBy((prev) =>
                        prev === opt.id && opt.id !== 'default' ? 'default' : (opt.id as any)
                      )
                    }
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-bold transition-all ${
                      isSelected
                        ? `${themeStyles.primaryAccent} shadow-xs`
                        : isDark
                        ? 'border-slate-800 bg-[#12161F] text-slate-300 hover:bg-[#1E2430]'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setShowToneLabelsPanel((prev) => !prev)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-bold transition-all ${
                  toneFilter !== 'all' || showToneLabelsPanel
                    ? isDark
                      ? 'border-blue-500 bg-[#1E2430] text-blue-300'
                      : 'border-blue-500 bg-blue-50 text-blue-700'
                    : isDark
                    ? 'border-slate-800 bg-[#12161F] text-slate-300 hover:bg-[#1E2430]'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Tone</span>
                {dynamicToneLabels.length > 0 && (
                  <span className="text-[10px] opacity-80">({dynamicToneLabels.length})</span>
                )}
              </button>
            </div>
          </div>

          {/* Filter Criteria Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-3">
            {/* Length Filters */}
            <div className="md:col-span-4 space-y-1.5">
              <span className={`text-[10.5px] font-bold uppercase tracking-wider block ${themeStyles.textSecondary}`}>
                Length Filter:
              </span>
              <div className="flex flex-wrap gap-1">
                {[
                  { id: 'all', label: 'All Lengths' },
                  { id: 'short', label: 'Short (<160c)' },
                  { id: 'medium', label: 'Balanced (160–380c)' },
                  { id: 'long', label: 'Detailed (>380c)' },
                ].map((item) => {
                  const isSelected = lengthFilter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setLengthFilter(item.id as any)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                        isSelected
                          ? `${themeStyles.primaryAccent} shadow-xs`
                          : isDark
                          ? 'border-slate-800 bg-[#12161F] text-slate-300 hover:bg-[#1E2430]'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dynamic + Preset Tone Label Filters */}
            {showToneLabelsPanel && (
              <div className="md:col-span-5 space-y-1.5">
                <span className={`text-[10.5px] font-bold uppercase tracking-wider block ${themeStyles.textSecondary}`}>
                  Tone Labels:
                </span>
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => setToneFilter('all')}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                      toneFilter === 'all'
                        ? `${themeStyles.primaryAccent} shadow-xs`
                        : isDark
                        ? 'border-slate-800 bg-[#12161F] text-slate-300 hover:bg-[#1E2430]'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    All Tones
                  </button>

                  {dynamicToneLabels.map((toneLabel) => {
                    const isSelected = toneFilter.toLowerCase() === toneLabel.toLowerCase();
                    return (
                      <button
                        key={toneLabel}
                        type="button"
                        onClick={() =>
                          setToneFilter((prev) =>
                            prev.toLowerCase() === toneLabel.toLowerCase() ? 'all' : toneLabel
                          )
                        }
                        className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                          isSelected
                            ? `${themeStyles.primaryAccent} shadow-xs`
                            : isDark
                            ? 'border-slate-800 bg-[#12161F] text-slate-300 hover:bg-[#1E2430]'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {toneLabel}
                      </button>
                    );
                  })}

                  {[
                    { id: 'professional', label: 'Professional' },
                    { id: 'warm', label: 'Warm / Friendly' },
                    { id: 'direct', label: 'Direct' },
                    { id: 'creative', label: 'Creative' },
                  ]
                    .filter(
                      (preset) =>
                        !dynamicToneLabels.some((lbl) => lbl.toLowerCase().includes(preset.id))
                    )
                    .map((item) => {
                      const isSelected = toneFilter === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() =>
                            setToneFilter((prev) => (prev === item.id ? 'all' : item.id))
                          }
                          className={`text-xs px-2.5 py-1 rounded-lg border font-semibold transition-all ${
                            isSelected
                              ? `${themeStyles.primaryAccent} shadow-xs`
                              : isDark
                              ? 'border-slate-800 bg-[#12161F] text-slate-300 hover:bg-[#1E2430]'
                              : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Keyword Quick Filter */}
            <div className={`${showToneLabelsPanel ? 'md:col-span-3' : 'md:col-span-8'} space-y-1.5`}>
              <span className={`text-[10.5px] font-bold uppercase tracking-wider block ${themeStyles.textSecondary}`}>
                Quick Search:
              </span>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder="Keyword or phrase..."
                  className={`w-full pl-8 pr-6 py-1 rounded-lg text-xs border focus:outline-none ${
                    isDark
                      ? 'bg-[#0D1117] border-slate-800 text-slate-200 focus:border-blue-500'
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-blue-600'
                  }`}
                />
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => setSearchFilter('')}
                    className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-200"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Generated Replies Panel */}
      {!modeOnlyAnalyzer && (
        <div id="generated-replies-section" className="scroll-mt-6">
          <RepliesPanel
            replies={displayedReplies}
            isGenerating={isGenerating}
            onCopyReply={onCopyReply}
            onRegenerateAll={onGenerateReplies}
            onSaveReply={onSaveReply}
            onEditReply={onEditReply}
            onImproveReply={onImproveReply}
            onExportReply={onExportReply}
            onRateReply={onRateReply}
            feedbackProfile={feedbackProfile}
            onOpenFeedbackHistory={onOpenFeedbackHistory}
            isImproving={isImproving}
            isDark={isDark}
            themeStyles={themeStyles}
            highlightedIds={matchingReplyIds}
            filterActive={isAnyFilterActive}
            filterMode={filterMode}
            sortBy={sortBy}
            onResetFilters={handleResetFilters}
            filterSummary={
              isAnyFilterActive
                ? `Length: ${lengthFilter.toUpperCase()} | Tone: ${toneFilter.toUpperCase()}${
                    searchFilter ? ` | Keyword: "${searchFilter}"` : ''
                  }`
                : undefined
            }
          />
        </div>
      )}
    </div>
  );
};

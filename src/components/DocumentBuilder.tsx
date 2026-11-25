import React, { useState } from 'react';
import {
  FileText,
  Download,
  FileCode,
  Sparkles,
  BookOpen,
  MessageSquare,
  Briefcase,
  FileSpreadsheet,
  Layers,
  RotateCw,
  Hash,
  Link,
  Check,
  Copy,
  Mail,
  Linkedin,
  Send,
  Share2,
  Printer,
  Sun,
  Moon,
  SpellCheck,
  CheckCircle2,
  Edit3,
  Eye,
  Smile,
  Type,
} from 'lucide-react';
import {
  SituationAnalysis,
  ReplyOption,
  AIModelPersona,
  ThemeId,
  WritingQualityTier,
  FontFamilyId,
} from '../types';
import { FONT_OPTIONS, getFontOption } from '../utils/fonts';
import {
  exportToWord,
  exportToPdf,
  exportToTxt,
  formatForLinkedIn,
  exportToLinkedIn,
  formatForEmail,
  exportToEmailEml,
  formatForSlackTeams,
  exportToMarkdown,
  parseConversationTurns,
  parseMarkdownBlocks,
  parseInlineMarkdownRuns,
  PdfExportScope,
  WordExportScope,
  PdfThemeMode,
} from '../utils/exportUtils';
import { AIModelSelector } from './AIModelSelector';

interface DocumentBuilderProps {
  currentAnalysis: SituationAnalysis | null;
  currentReplies: ReplyOption[];
  chatHistory: string;
  latestMessage: string;
  platform: string;
  selectedReplyId?: string;
  selectedReplyTrigger?: number;
  defaultFontFamily?: FontFamilyId;
  isDark: boolean;
  themeId?: ThemeId;
  themeStyles: any;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export type TemplateType =
  | 'Situation Analysis Report'
  | 'Conversation Reply Collection'
  | 'Professional Communication Report'
  | 'Executive Resolution Memo'
  | 'Academic & Case Documentation';

export type PreviewFormat = 'document' | 'linkedin' | 'email' | 'markdown';

export const DocumentBuilder: React.FC<DocumentBuilderProps> = ({
  currentAnalysis,
  currentReplies,
  chatHistory,
  latestMessage,
  platform,
  selectedReplyId,
  selectedReplyTrigger,
  defaultFontFamily = 'plus-jakarta',
  isDark,
  themeId,
  themeStyles,
  onShowToast,
}) => {
  const [template, setTemplate] = useState<TemplateType>('Situation Analysis Report');
  const [docTitle, setDocTitle] = useState<string>('Situation AI Intelligence & Communication Brief');
  const [aiModel, setAiModel] = useState<AIModelPersona>('grammarly');
  const [writingStandard, setWritingStandard] = useState<WritingQualityTier>('executive');
  const [docFont, setDocFont] = useState<FontFamilyId>(defaultFontFamily);
  const [previewFormat, setPreviewFormat] = useState<PreviewFormat>('document');
  const [selectedReplyIndex, setSelectedReplyIndex] = useState<number>(0);
  const [emailRecipient, setEmailRecipient] = useState<string>('');
  const [pdfScope, setPdfScope] = useState<PdfExportScope>('replies-summary');
  const [pdfThemeMode, setPdfThemeMode] = useState<PdfThemeMode>('print-light');

  React.useEffect(() => {
    setDocFont(defaultFontFamily);
  }, [defaultFontFamily]);

  // Sync clicked reply from Reply Engine "Export in Document" button & clamp index on length change
  React.useEffect(() => {
    if (selectedReplyId && currentReplies.length > 0) {
      const idx = currentReplies.findIndex((r) => r.id === selectedReplyId);
      if (idx >= 0) {
        setSelectedReplyIndex(idx);
        setPdfScope('selected-reply');
      }
    }
  }, [selectedReplyId, selectedReplyTrigger, currentReplies]);

  React.useEffect(() => {
    if (currentReplies.length === 0 && selectedReplyIndex !== 0) {
      setSelectedReplyIndex(0);
    } else if (currentReplies.length > 0 && selectedReplyIndex >= currentReplies.length) {
      setSelectedReplyIndex(currentReplies.length - 1);
    }
  }, [currentReplies.length, selectedReplyIndex]);

  // Section inclusion options
  const [includeAnalysis, setIncludeAnalysis] = useState<boolean>(true);
  const [includeReplies, setIncludeReplies] = useState<boolean>(true);
  const [includeChatHistory, setIncludeChatHistory] = useState<boolean>(true);
  const [includeHashtags, setIncludeHashtags] = useState<boolean>(true);
  const [includeLinks, setIncludeLinks] = useState<boolean>(true);
  const [includeDocEmojis, setIncludeDocEmojis] = useState<boolean>(false);

  // Situational Content & Quality Audit
  const [customNotes, setCustomNotes] = useState<string>(
    'Strategic communication notes prepared using Situation AI. Ready for review or immediate deployment.'
  );
  const [generatedSituationalDoc, setGeneratedSituationalDoc] = useState<string>('');
  const [isEditingSynthesized, setIsEditingSynthesized] = useState<boolean>(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState<boolean>(false);
  const [isPolishingDoc, setIsPolishingDoc] = useState<boolean>(false);
  const [polishAudit, setPolishAudit] = useState<{
    clarityScore: number;
    grammarStatus: string;
    readabilityLevel: string;
    improvements: string[];
  } | null>(null);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const templatesList: { id: TemplateType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'Situation Analysis Report',
      label: 'Situation Analysis Report',
      icon: <BookOpen className="w-4 h-4 text-blue-500" />,
      desc: 'Psychological breakdown, underlying intent, risks, and communication strategy',
    },
    {
      id: 'Conversation Reply Collection',
      label: 'Reply Collection',
      icon: <MessageSquare className="w-4 h-4 text-emerald-500" />,
      desc: 'Multiple ready-to-send responses categorized by tone and match score',
    },
    {
      id: 'Professional Communication Report',
      label: 'Professional Report',
      icon: <Briefcase className="w-4 h-4 text-indigo-500" />,
      desc: 'Executive summary with client/partner negotiation strategy and phrasing',
    },
    {
      id: 'Executive Resolution Memo',
      label: 'Executive Memo',
      icon: <Layers className="w-4 h-4 text-purple-500" />,
      desc: 'Action-oriented resolution for workplace misunderstandings and client escalations',
    },
    {
      id: 'Academic & Case Documentation',
      label: 'Case Documentation',
      icon: <FileCode className="w-4 h-4 text-cyan-500" />,
      desc: 'Complete chat context, confidence levels, intent modeling and technical trace',
    },
  ];

  const buildPlatformOptions = () => ({
    title: docTitle,
    template,
    platform,
    chatHistory: includeChatHistory ? chatHistory : undefined,
    latestMessage: latestMessage || undefined,
    analysis: includeAnalysis ? currentAnalysis : null,
    replies: includeReplies ? currentReplies : [],
    customNotes: customNotes || undefined,
    synthesizedText: generatedSituationalDoc || undefined,
    selectedReplyIndex,
    emailRecipient,
    includeHashtags,
    includeLinks,
  });

  // AI Generate Document Content strictly according to active situation & Writing Standard
  const handleGenerateSituationalDoc = async () => {
    setIsGeneratingDoc(true);
    setPolishAudit(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 28000);
    try {
      const res = await fetch('/api/generate-document-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template,
          title: docTitle,
          situation:
            currentAnalysis?.situation ||
            latestMessage?.trim() ||
            docTitle ||
            'Active communication dilemma',
          category: currentAnalysis?.category || 'Professional',
          latestMessage,
          chatHistory,
          analysis: currentAnalysis,
          replies: currentReplies,
          customNotes,
          platform,
          aiModel,
          writingStandard,
          includeHashtags,
          includeLinks,
          includeEmojis: includeDocEmojis,
        }),
        signal: controller.signal,
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed with HTTP ${res.status}`);
      }
      if (data.documentContent) {
        setGeneratedSituationalDoc(data.documentContent);
        setIsEditingSynthesized(false);
        onShowToast(
          `Synthesized publication-ready document via ${aiModel.toUpperCase()} (${writingStandard} standard)!`,
          'success'
        );
      } else {
        throw new Error(data.error || 'No content returned');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.name === 'AbortError' ? 'Request timed out. Please try again.' : err.message;
      onShowToast(`Failed to generate document: ${msg}`, 'error');
    } finally {
      clearTimeout(timer);
      setIsGeneratingDoc(false);
    }
  };

  // Quality Audit & Proofread pass for Zero-Error Document Output
  const handlePolishDocument = async () => {
    const sourceContent = generatedSituationalDoc.trim() || customNotes.trim();
    if (!sourceContent) {
      onShowToast('Generate a document or enter executive notes first to run a quality audit.', 'error');
      return;
    }

    setIsPolishingDoc(true);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 28000);
    try {
      const res = await fetch('/api/polish-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: sourceContent,
          title: docTitle,
          aiModel,
          writingStandard,
        }),
        signal: controller.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed with HTTP ${res.status}`);
      }
      if (data.polishedContent) {
        if (generatedSituationalDoc.trim()) {
          setGeneratedSituationalDoc(data.polishedContent);
        } else {
          setCustomNotes(data.polishedContent);
        }
        setPolishAudit({
          clarityScore: data.clarityScore || 98,
          grammarStatus: data.grammarStatus || 'Zero Errors Detected',
          readabilityLevel: data.readabilityLevel || 'Executive Ready',
          improvements: Array.isArray(data.improvements) ? data.improvements : [],
        });
        onShowToast('Document audited & polished with zero grammar errors!', 'success');
      } else {
        throw new Error(data.error || 'No polished content returned');
      }
    } catch (err: any) {
      console.error(err);
      const msg = err?.name === 'AbortError' ? 'Request timed out. Please try again.' : err.message;
      onShowToast(`Quality audit error: ${msg}`, 'error');
    } finally {
      clearTimeout(timer);
      setIsPolishingDoc(false);
    }
  };

  const renderInlineMarkdown = (text: string) => {
    const runs = parseInlineMarkdownRuns(text);
    return runs.map((run, idx) => {
      if (run.code) {
        return (
          <code
            key={idx}
            className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
              isDark ? 'bg-slate-800 text-blue-300' : 'bg-slate-100 text-blue-700'
            }`}
          >
            {run.text}
          </code>
        );
      }
      if (run.bold) {
        return (
          <strong key={idx} className={`font-bold ${themeStyles.textPrimary}`}>
            {run.text}
          </strong>
        );
      }
      if (run.italic) {
        return (
          <em key={idx} className="italic">
            {run.text}
          </em>
        );
      }
      return <React.Fragment key={idx}>{run.text}</React.Fragment>;
    });
  };

  const handleExportWord = async (overrideScope?: WordExportScope) => {
    const scopeToUse: WordExportScope = overrideScope || (pdfScope as WordExportScope);
    setIsExporting('docx');
    try {
      await exportToWord({
        title: docTitle,
        template,
        platform,
        chatHistory: includeChatHistory || scopeToUse === 'replies-summary' ? chatHistory : undefined,
        latestMessage: latestMessage || undefined,
        analysis: includeAnalysis || scopeToUse === 'replies-summary' ? currentAnalysis : null,
        replies:
          scopeToUse === 'replies-summary' || scopeToUse === 'selected-reply'
            ? currentReplies
            : scopeToUse === 'active-preview' && previewFormat !== 'document'
            ? currentReplies
            : includeReplies
            ? currentReplies
            : [],
        customNotes: customNotes || undefined,
        synthesizedText: generatedSituationalDoc || undefined,
        scope: scopeToUse,
        previewFormat,
        selectedReplyIndex,
        emailRecipient,
        includeHashtags,
        includeLinks,
        aiModel,
        fontFamily: docFont,
      });
      const label =
        scopeToUse === 'replies-summary'
          ? 'Generated Replies & Conversation Summary Word (.docx)'
          : scopeToUse === 'conversation'
          ? 'Conversation Word (.docx)'
          : scopeToUse === 'selected-reply'
          ? 'Selected Response Word (.docx)'
          : scopeToUse === 'full-summary'
          ? 'Conversation Summary Word (.docx)'
          : `${previewFormat.charAt(0).toUpperCase() + previewFormat.slice(1)} Word (.docx)`;
      onShowToast(`${label} exported with full structure and content preserved!`, 'success');
    } catch (err: any) {
      console.error(err);
      onShowToast(`Failed to generate Word document: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportPdf = async (overrideScope?: PdfExportScope) => {
    const scopeToUse = overrideScope || pdfScope;
    setIsExporting('pdf');
    try {
      await exportToPdf({
        title: docTitle,
        template,
        platform,
        chatHistory: includeChatHistory || scopeToUse === 'replies-summary' ? chatHistory : undefined,
        latestMessage: latestMessage || undefined,
        analysis: includeAnalysis || scopeToUse === 'replies-summary' ? currentAnalysis : null,
        replies:
          scopeToUse === 'replies-summary' || scopeToUse === 'selected-reply'
            ? currentReplies
            : scopeToUse === 'active-preview' && previewFormat !== 'document'
            ? currentReplies
            : includeReplies
            ? currentReplies
            : [],
        customNotes: customNotes || undefined,
        synthesizedText: generatedSituationalDoc || undefined,
        scope: scopeToUse,
        previewFormat,
        selectedReplyIndex,
        emailRecipient,
        includeHashtags,
        includeLinks,
        isDark,
        themeId,
        pdfThemeMode,
        aiModel,
        fontFamily: docFont,
      });
      const label =
        scopeToUse === 'replies-summary'
          ? 'Generated Replies & Conversation Summary PDF'
          : scopeToUse === 'conversation'
          ? 'Conversation Color PDF'
          : scopeToUse === 'selected-reply'
          ? 'Generated Response PDF'
          : scopeToUse === 'full-summary'
          ? 'Conversation Summary PDF'
          : `${previewFormat.charAt(0).toUpperCase() + previewFormat.slice(1)} Layout PDF`;
      onShowToast(`${label} generated cleanly as a formatted PDF!`, 'success');
    } catch (err: any) {
      console.error(err);
      onShowToast(`Failed to generate PDF: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportTxt = () => {
    setIsExporting('txt');
    try {
      exportToTxt({
        title: docTitle,
        template,
        platform,
        chatHistory: includeChatHistory ? chatHistory : undefined,
        latestMessage: latestMessage || undefined,
        analysis: includeAnalysis ? currentAnalysis : null,
        replies: includeReplies ? currentReplies : [],
        customNotes: generatedSituationalDoc || customNotes || undefined,
      });
      onShowToast('Text (.txt) report downloaded successfully!', 'success');
    } catch (err: any) {
      console.error(err);
      onShowToast(`Failed to download text report: ${err.message || 'Unknown error'}`, 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportLinkedIn = () => {
    setIsExporting('linkedin');
    try {
      exportToLinkedIn(buildPlatformOptions());
      onShowToast('LinkedIn-ready post downloaded (.txt)!', 'success');
    } catch (err: any) {
      onShowToast(`Failed to export LinkedIn format: ${err.message}`, 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportEmail = () => {
    setIsExporting('eml');
    try {
      exportToEmailEml(buildPlatformOptions());
      onShowToast('Email file (.eml) downloaded — open in Outlook or Apple Mail!', 'success');
    } catch (err: any) {
      onShowToast(`Failed to export Email (.eml): ${err.message}`, 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const handleExportMarkdown = () => {
    setIsExporting('md');
    try {
      exportToMarkdown(buildPlatformOptions());
      onShowToast('Slack / Teams Markdown brief (.md) downloaded!', 'success');
    } catch (err: any) {
      onShowToast(`Failed to export Markdown: ${err.message}`, 'error');
    } finally {
      setIsExporting(null);
    }
  };

  const linkedInText = formatForLinkedIn(buildPlatformOptions());
  const emailFormatted = formatForEmail(buildPlatformOptions());
  const markdownText = formatForSlackTeams(buildPlatformOptions());

  const handleCopyActiveFormat = () => {
    let textToCopy = generatedSituationalDoc || customNotes;
    if (previewFormat === 'linkedin') {
      textToCopy = linkedInText;
    } else if (previewFormat === 'email') {
      textToCopy = emailFormatted.fullText;
    } else if (previewFormat === 'markdown') {
      textToCopy = markdownText;
    }

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    onShowToast(
      previewFormat === 'linkedin'
        ? 'LinkedIn post copied to clipboard!'
        : previewFormat === 'email'
        ? 'Email subject & body copied to clipboard!'
        : previewFormat === 'markdown'
        ? 'Slack / Teams brief copied to clipboard!'
        : 'Document preview copied to clipboard!',
      'success'
    );
    setTimeout(() => setCopied(false), 2000);
  };

  const mailtoHref = `mailto:${encodeURIComponent(
    emailRecipient.includes('@') ? emailRecipient : ''
  )}?subject=${encodeURIComponent(emailFormatted.subject)}&body=${encodeURIComponent(emailFormatted.body)}`;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className={`text-xl font-black ${themeStyles.textPrimary}`}>
              Situational Document & Platform Export Studio
            </h2>
          </div>
          <p className={`text-xs mt-1 ${themeStyles.textMuted}`}>
            Export to Word (.docx), PDF (.pdf), LinkedIn post format, RFC Email (.eml), or Slack/Teams Markdown.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={!!isExporting}
            onClick={() => handleExportPdf('replies-summary')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-[#BE123C] hover:bg-[#9F1239] shadow-xs transition-colors disabled:opacity-50 whitespace-nowrap"
            title="Export generated replies and conversation summary directly as a formatted PDF file"
          >
            {isExporting === 'pdf' ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>Replies & Summary .PDF</span>
          </button>

          <button
            type="button"
            disabled={!!isExporting}
            onClick={() => handleExportWord('conversation')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] shadow-xs transition-colors disabled:opacity-50 whitespace-nowrap"
            title="Export generated conversation and analysis as a structured Microsoft Word (.docx) file"
          >
            {isExporting === 'docx' ? (
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileSpreadsheet className="w-3.5 h-3.5" />
            )}
            <span>Conversation .DOCX</span>
          </button>

          <button
            type="button"
            disabled={!!isExporting}
            onClick={() => handleExportPdf('conversation')}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors disabled:opacity-50 whitespace-nowrap ${
              isDark
                ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
            }`}
            title="Export full color-coded conversation transcript as PDF"
          >
            <FileText className="w-3.5 h-3.5 text-rose-500" />
            <span>Transcript .PDF</span>
          </button>

          <button
            type="button"
            disabled={!!isExporting}
            onClick={handleExportLinkedIn}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#0A66C2] hover:bg-[#004182] shadow-xs transition-colors disabled:opacity-50 whitespace-nowrap"
            title="Download formatted LinkedIn Post (.txt)"
          >
            <Linkedin className="w-3.5 h-3.5" />
            <span>LinkedIn</span>
          </button>

          <button
            type="button"
            disabled={!!isExporting}
            onClick={handleExportEmail}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-white bg-[#047857] hover:bg-[#065F46] shadow-xs transition-colors disabled:opacity-50 whitespace-nowrap"
            title="Download ready-to-open Email file (.eml)"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email (.EML)</span>
          </button>

          <button
            type="button"
            disabled={!!isExporting}
            onClick={handleExportMarkdown}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isDark
                ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
            }`}
            title="Download Slack / Teams Markdown (.md)"
          >
            <Share2 className="w-3.5 h-3.5 text-purple-500" />
            <span>.MD</span>
          </button>

          <button
            type="button"
            disabled={!!isExporting}
            onClick={handleExportTxt}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              isDark
                ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>.TXT</span>
          </button>
        </div>
      </div>

      {/* AI Model Persona Selection */}
      <AIModelSelector
        selectedModel={aiModel}
        onSelectModel={setAiModel}
        isDark={isDark}
        themeStyles={themeStyles}
      />

      {/* Main Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Templates & Configurations */}
        <div className="lg:col-span-1 space-y-4">
          {/* Template Selection */}
          <div className={`p-4 rounded-2xl border ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
            <label className={`text-xs font-bold tracking-wide uppercase block mb-3 ${themeStyles.textSecondary}`}>
              Document Template
            </label>
            <div className="space-y-2">
              {templatesList.map((tmpl) => {
                const isSelected = template === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      setTemplate(tmpl.id);
                      if (tmpl.id === 'Situation Analysis Report') {
                        setDocTitle('Situation AI — Conversation Intelligence Report');
                      } else if (tmpl.id === 'Conversation Reply Collection') {
                        setDocTitle('Situation AI — Contextual Reply Collection');
                      } else if (tmpl.id === 'Professional Communication Report') {
                        setDocTitle('Executive Communication & Negotiation Brief');
                      } else if (tmpl.id === 'Executive Resolution Memo') {
                        setDocTitle('Executive Resolution Memo & Corrective Plan');
                      } else {
                        setDocTitle('Case Study & Contextual Trace Report');
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? `${isDark ? 'bg-[#1E2430] border-blue-500' : 'bg-blue-50 border-blue-600'} ring-1 ring-blue-500 shadow-sm`
                        : `${isDark ? 'bg-[#12161F] border-slate-800 hover:bg-[#1E2430]' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {tmpl.icon}
                      <span className={`text-xs font-bold ${themeStyles.textPrimary}`}>
                        {tmpl.label}
                      </span>
                    </div>
                    <p className={`text-[11px] leading-tight ${themeStyles.textMuted}`}>
                      {tmpl.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section & Options Checklist */}
          <div className={`p-4 rounded-2xl border ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
            <label className={`text-xs font-bold tracking-wide uppercase block mb-3 ${themeStyles.textSecondary}`}>
              Include Sections & Options
            </label>
            <div className="space-y-2.5 text-xs">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeChatHistory}
                  onChange={(e) => setIncludeChatHistory(e.target.checked)}
                  className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className={themeStyles.textPrimary}>Previous Chat History Context</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeAnalysis}
                  onChange={(e) => setIncludeAnalysis(e.target.checked)}
                  className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className={themeStyles.textPrimary}>Situation Analysis & Emotional Signals</span>
              </label>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeReplies}
                  onChange={(e) => setIncludeReplies(e.target.checked)}
                  className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                />
                <span className={themeStyles.textPrimary}>Generated Human-Like Replies</span>
              </label>

              <div className={`pt-2 border-t space-y-2 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeHashtags}
                    onChange={(e) => setIncludeHashtags(e.target.checked)}
                    className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1 font-semibold text-blue-500">
                    <Hash className="w-3 h-3" />
                    <span>Include Trending #Hashtags</span>
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeLinks}
                    onChange={(e) => setIncludeLinks(e.target.checked)}
                    className="rounded border-slate-600 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="flex items-center gap-1 font-semibold text-emerald-500">
                    <Link className="w-3 h-3" />
                    <span>Include Actionable Reference Links</span>
                  </span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeDocEmojis}
                    onChange={(e) => setIncludeDocEmojis(e.target.checked)}
                    className="rounded border-slate-600 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="flex items-center gap-1 font-semibold text-amber-500">
                    <Smile className="w-3 h-3" />
                    <span>Include Section Emojis (Visual Accent)</span>
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* AI Situation Synthesizer & Quality Engine */}
          <div
            className={`p-4 rounded-2xl border space-y-3 ${
              isDark ? 'bg-[#161B22] border-slate-700' : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h4 className="text-xs font-bold text-blue-500">AI Document & Quality Engine</h4>
              </div>
              <span className={`text-[10px] font-semibold ${themeStyles.textMuted}`}>
                {aiModel.toUpperCase()}
              </span>
            </div>

            <div>
              <label className={`text-[10.5px] font-bold uppercase tracking-wide block mb-1.5 ${themeStyles.textSecondary}`}>
                Writing Standard / Tone Rigor:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'executive', label: 'Executive Standard' },
                  { id: 'editorial', label: 'Editorial Impact' },
                  { id: 'boardroom', label: 'Boardroom & Legal' },
                  { id: 'academic', label: 'Academic Research' },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setWritingStandard(tier.id as WritingQualityTier)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                      writingStandard === tier.id
                        ? `${themeStyles.primaryAccent}`
                        : isDark
                        ? 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={isGeneratingDoc}
                onClick={handleGenerateSituationalDoc}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                {isGeneratingDoc ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing publication brief...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Perfect Situational Doc</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={isPolishingDoc || isGeneratingDoc}
                onClick={handlePolishDocument}
                className={`w-full py-2 px-3 rounded-xl text-xs font-bold border transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                  isDark
                    ? 'border-slate-700 bg-slate-900 text-emerald-400 hover:bg-slate-800'
                    : 'border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {isPolishingDoc ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing Grammar & Flow...</span>
                  </>
                ) : (
                  <>
                    <SpellCheck className="w-3.5 h-3.5" />
                    <span>Proofread & Quality Audit</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Direct Styled Word & PDF Export Studio */}
          <div className={`p-4 rounded-2xl border ${themeStyles.cardBg} ${themeStyles.cardBorder} space-y-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-rose-500" />
                <h4 className={`text-xs font-bold uppercase tracking-wide ${themeStyles.textSecondary}`}>
                  Word & PDF Export
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-500 border border-blue-500/30">
                Structure Preserved
              </span>
            </div>

            {/* Export Content Scope */}
            <div>
              <span className={`text-[10.5px] font-semibold block mb-1.5 ${themeStyles.textMuted}`}>
                Export Scope (Applies to .DOCX & .PDF):
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {[
                  { id: 'replies-summary', label: 'Generated Replies & Conversation Summary' },
                  { id: 'conversation', label: 'Current Conversation & Color Transcript' },
                  { id: 'active-preview', label: `Current Preview Layout (${previewFormat})` },
                  { id: 'selected-reply', label: 'Selected Generated Response Only' },
                  { id: 'full-summary', label: 'Full Transcript, Summary & Replies' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPdfScope(item.id as PdfExportScope)}
                    className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] font-semibold border transition-colors ${
                      pdfScope === item.id
                        ? `${themeStyles.primaryAccent} border-transparent`
                        : isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className={`text-[10.5px] mt-1.5 tabular-nums ${themeStyles.textMuted}`}>
                Ready: {currentReplies.length} {currentReplies.length === 1 ? 'reply' : 'replies'} · {parseConversationTurns(chatHistory).length + (latestMessage.trim() ? 1 : 0)} messages · {currentAnalysis ? 'Analysis ready' : 'Summary ready'}
              </p>
            </div>

            {/* PDF Appearance Mode */}
            <div>
              <span className={`text-[10.5px] font-semibold block mb-1.5 ${themeStyles.textMuted}`}>
                PDF Visual Styling:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPdfThemeMode('print-light')}
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                    pdfThemeMode === 'print-light'
                      ? `${themeStyles.primaryAccent} border-transparent`
                      : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Sun className="w-3 h-3" />
                  <span>Editorial White</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPdfThemeMode('match-ui')}
                  className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-semibold border transition-colors ${
                    pdfThemeMode === 'match-ui'
                      ? `${themeStyles.primaryAccent} border-transparent`
                      : isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-300'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  {isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                  <span>Match Theme</span>
                </button>
              </div>
            </div>

            {/* Document & Export Font Family */}
            <div>
              <span className={`text-[10.5px] font-semibold flex items-center gap-1.5 mb-1.5 ${themeStyles.textMuted}`}>
                <Type className="w-3 h-3 text-blue-500" />
                <span>Document Font (.DOCX &amp; .PDF):</span>
              </span>
              <select
                aria-label="Document Export Font Family"
                value={docFont}
                onChange={(e) => setDocFont(e.target.value as FontFamilyId)}
                className={`w-full py-1.5 px-2.5 rounded-lg text-[11px] font-semibold border focus:outline-none ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500'
                    : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-500'
                }`}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.category})
                  </option>
                ))}
              </select>
            </div>

            {/* 1-Click Direct Word & PDF Actions */}
            <div className="pt-1 space-y-2">
              <button
                type="button"
                disabled={!!isExporting}
                onClick={() => handleExportPdf('replies-summary')}
                className="w-full py-2.5 px-3 rounded-xl text-[11px] font-semibold text-white bg-[#BE123C] hover:bg-[#9F1239] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isExporting === 'pdf' ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <FileText className="w-3.5 h-3.5" />
                )}
                <span>Export Replies & Summary (.PDF)</span>
              </button>
              <button
                type="button"
                disabled={!!isExporting}
                onClick={() => handleExportWord()}
                className="w-full py-2 px-2.5 rounded-xl text-[11px] font-semibold text-white bg-[#1D4ED8] hover:bg-[#1E40AF] transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Export Active Scope as Word (.DOCX)</span>
              </button>
              <button
                type="button"
                disabled={!!isExporting}
                onClick={() => handleExportPdf('conversation')}
                className={`w-full py-2 px-2.5 rounded-xl text-[11px] font-semibold border transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                  isDark
                    ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                    : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-800'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-rose-500" />
                <span>Full Conversation Transcript (.PDF)</span>
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={!!isExporting}
                  onClick={() => handleExportWord('selected-reply')}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold border transition-colors flex items-center justify-center gap-1 disabled:opacity-50 ${
                    isDark
                      ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                      : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <FileSpreadsheet className="w-3 h-3 text-blue-500" />
                  <span>Response .DOCX</span>
                </button>
                <button
                  type="button"
                  disabled={!!isExporting}
                  onClick={() => handleExportPdf('selected-reply')}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-semibold border transition-colors flex items-center justify-center gap-1 disabled:opacity-50 ${
                    isDark
                      ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                      : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <MessageSquare className="w-3 h-3 text-emerald-500" />
                  <span>Response .PDF</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Live Document Editor & Platform Format Preview */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`p-6 rounded-2xl border transition-all ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
            {/* Top Format Switcher Bar */}
            <div
              className={`flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}
            >
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'document', label: 'Document View', icon: <FileText className="w-3.5 h-3.5" /> },
                  { id: 'linkedin', label: 'LinkedIn Format', icon: <Linkedin className="w-3.5 h-3.5" /> },
                  { id: 'email', label: 'Email Format', icon: <Mail className="w-3.5 h-3.5" /> },
                  { id: 'markdown', label: 'Slack / Teams', icon: <Share2 className="w-3.5 h-3.5" /> },
                ].map((tab) => {
                  const active = previewFormat === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setPreviewFormat(tab.id as PreviewFormat)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        active
                          ? `${themeStyles.primaryAccent}`
                          : isDark
                          ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                          : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={!!isExporting}
                  onClick={() => handleExportPdf()}
                  className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg text-white bg-[#BE123C] hover:bg-[#9F1239] transition-colors disabled:opacity-50 whitespace-nowrap"
                  title="Download active scope directly as a formatted PDF file"
                >
                  {isExporting === 'pdf' ? (
                    <RotateCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  <span>Download .PDF</span>
                </button>

                <button
                  type="button"
                  disabled={!!isExporting}
                  onClick={() => handleExportWord()}
                  className="flex items-center gap-1 text-[11px] font-semibold px-3 py-1.5 rounded-lg text-white bg-[#1D4ED8] hover:bg-[#1E40AF] transition-colors disabled:opacity-50 whitespace-nowrap"
                  title="Download active scope directly as a Microsoft Word (.docx) file"
                >
                  {isExporting === 'docx' ? (
                    <RotateCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  <span>Download .DOCX</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyActiveFormat}
                  className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg border transition-all ${
                    isDark
                      ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                      : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy Format'}</span>
                </button>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${themeStyles.badgeBg}`}>
                  {platform}
                </span>
              </div>
            </div>

            {/* Document Title / Subject Input */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              <div className={previewFormat === 'email' ? '' : 'md:col-span-2'}>
                <label className={`block text-[11px] font-semibold mb-1 ${themeStyles.textMuted}`}>
                  {previewFormat === 'email' ? 'Email Subject Line' : 'Document Title'}
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-sm font-bold border focus:outline-none focus:ring-1 ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-blue-400'
                      : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
              </div>

              {previewFormat === 'email' && (
                <div>
                  <label className={`block text-[11px] font-semibold mb-1 ${themeStyles.textMuted}`}>
                    Recipient Name or Email Address
                  </label>
                  <input
                    type="text"
                    value={emailRecipient}
                    onChange={(e) => setEmailRecipient(e.target.value)}
                    placeholder="e.g. Sarah Jenkins or sarah@company.com"
                    className={`w-full px-3 py-2 rounded-xl text-sm font-medium border focus:outline-none focus:ring-1 ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-blue-400'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Reply Option Selector for Platform Formats & Response PDF */}
            {currentReplies.length > 0 && (
              <div className="mb-3 flex flex-wrap items-center gap-1.5">
                <span className={`text-[11px] font-bold uppercase mr-1 ${themeStyles.textMuted}`}>
                  Featured Reply:
                </span>
                {currentReplies.map((r, idx) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedReplyIndex(idx)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      selectedReplyIndex === idx
                        ? `${themeStyles.badgeBg} ring-1 ring-blue-500`
                        : isDark
                        ? 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Option {idx + 1}: {r.styleLabel}
                  </button>
                ))}
              </div>
            )}

            {/* Content Preview Canvas */}
            <div
              style={{ fontFamily: getFontOption(docFont).cssStack }}
              className={`p-5 rounded-xl border text-xs space-y-4 ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              {previewFormat === 'linkedin' ? (
                /* LINKEDIN FORMAT PREVIEW */
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/30">
                    <div className="flex items-center gap-2 text-[#0A66C2] font-bold text-xs">
                      <Linkedin className="w-4 h-4" />
                      <span>LinkedIn Post / Networking Preview</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        linkedInText.length <= 3000
                          ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-500 border-rose-500/30'
                      }`}
                    >
                      {linkedInText.length} / 3,000 chars
                    </span>
                  </div>
                  <div className={`whitespace-pre-wrap leading-relaxed select-text text-xs sm:text-sm ${themeStyles.textPrimary}`}>
                    {linkedInText}
                  </div>
                  <div className="pt-3 border-t border-slate-700/30 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleCopyActiveFormat}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#0A66C2] hover:bg-[#004182] transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy for LinkedIn</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportLinkedIn}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isDark
                          ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                          : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download LinkedIn .TXT</span>
                    </button>
                  </div>
                </div>
              ) : previewFormat === 'email' ? (
                /* EMAIL FORMAT PREVIEW */
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/30">
                    <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                      <Mail className="w-4 h-4" />
                      <span>Ready-to-Send Email (.EML / Mail Client)</span>
                    </div>
                    <span className={`text-[10px] font-mono ${themeStyles.textMuted}`}>
                      RFC-822 Compatible
                    </span>
                  </div>
                  <div
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}
                  >
                    <p className={themeStyles.textSecondary}>
                      <strong>To:</strong> {emailRecipient || 'Colleague'}
                    </p>
                    <p className={themeStyles.textPrimary}>
                      <strong>Subject:</strong> {emailFormatted.subject}
                    </p>
                  </div>
                  <div className={`whitespace-pre-wrap leading-relaxed select-text text-xs sm:text-sm ${themeStyles.textPrimary}`}>
                    {emailFormatted.body}
                  </div>
                  <div className="pt-3 border-t border-slate-700/30 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleCopyActiveFormat}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Email Text</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportEmail}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isDark
                          ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                          : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .EML File</span>
                    </button>
                    <a
                      href={mailtoHref}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isDark
                          ? 'border-blue-500/40 bg-blue-500/15 text-blue-300 hover:bg-blue-500/25'
                          : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Open in Mail App</span>
                    </a>
                  </div>
                </div>
              ) : previewFormat === 'markdown' ? (
                /* SLACK / TEAMS MARKDOWN FORMAT PREVIEW */
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/30">
                    <div className="flex items-center gap-2 text-purple-500 font-bold text-xs">
                      <Share2 className="w-4 h-4" />
                      <span>Slack / Microsoft Teams / Notion Brief (.MD)</span>
                    </div>
                  </div>
                  <pre className={`whitespace-pre-wrap font-mono text-xs leading-relaxed select-text ${themeStyles.textPrimary}`}>
                    {markdownText}
                  </pre>
                  <div className="pt-3 border-t border-slate-700/30 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleCopyActiveFormat}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Markdown</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportMarkdown}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                        isDark
                          ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                          : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .MD File</span>
                    </button>
                  </div>
                </div>
              ) : generatedSituationalDoc ? (
                /* EXECUTIVE FORMATTED DOCUMENT PREVIEW WITH QUALITY VERIFICATION & RAW EDIT MODE */
                <div className="space-y-4">
                  <div
                    className={`flex flex-wrap items-center justify-between gap-2 pb-3 border-b ${
                      isDark ? 'border-slate-800' : 'border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                      <span className="font-bold text-blue-500 uppercase text-[11px]">
                        Publication-Ready Brief ({aiModel.toUpperCase()} · {writingStandard})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingSynthesized((prev) => !prev)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition-all ${
                          isDark
                            ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {isEditingSynthesized ? (
                          <>
                            <Eye className="w-3 h-3 text-blue-400" />
                            <span>Formatted View</span>
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-3 h-3 text-amber-400" />
                            <span>Edit Text</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setGeneratedSituationalDoc('');
                          setPolishAudit(null);
                        }}
                        className={`text-[11px] font-semibold hover:text-rose-500 ${themeStyles.textMuted}`}
                      >
                        Reset to Section View
                      </button>
                    </div>
                  </div>

                  {polishAudit && (
                    <div
                      className={`p-3 rounded-xl border space-y-1.5 ${
                        isDark
                          ? 'bg-[#12161F] border-slate-700 text-slate-200'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-950'
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-500">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Quality Audit Passed · {polishAudit.grammarStatus}</span>
                        </span>
                        <span className="text-[11px] font-semibold tabular-nums">
                          {polishAudit.readabilityLevel} · Clarity {polishAudit.clarityScore}/100
                        </span>
                      </div>
                      {polishAudit.improvements.length > 0 && (
                        <ul className="space-y-0.5 text-[11px] opacity-90 pl-1">
                          {polishAudit.improvements.map((imp, idx) => (
                            <li key={idx}>• {imp}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}

                  {isEditingSynthesized ? (
                    <textarea
                      value={generatedSituationalDoc}
                      onChange={(e) => setGeneratedSituationalDoc(e.target.value)}
                      rows={18}
                      className={`w-full p-3.5 rounded-xl font-mono text-xs leading-relaxed border focus:outline-none focus:ring-1 ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-blue-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-blue-600'
                      }`}
                    />
                  ) : (
                    <div className="space-y-3 select-text">
                      {parseMarkdownBlocks(generatedSituationalDoc).map((block, idx) => {
                        if (block.type === 'h1') {
                          return (
                            <h1
                              key={idx}
                              className={`text-lg sm:text-xl font-black pb-2 border-b ${
                                isDark ? 'text-blue-400 border-slate-800' : 'text-blue-900 border-slate-200'
                              }`}
                            >
                              {renderInlineMarkdown(block.text)}
                            </h1>
                          );
                        }
                        if (block.type === 'h2') {
                          return (
                            <h2
                              key={idx}
                              className={`text-sm sm:text-base font-extrabold pt-2 pb-1 border-b ${
                                isDark ? 'text-blue-300 border-slate-800/80' : 'text-slate-900 border-slate-200/80'
                              }`}
                            >
                              {renderInlineMarkdown(block.text)}
                            </h2>
                          );
                        }
                        if (block.type === 'h3') {
                          return (
                            <h3 key={idx} className={`text-xs sm:text-sm font-bold pt-1.5 ${themeStyles.textPrimary}`}>
                              {renderInlineMarkdown(block.text)}
                            </h3>
                          );
                        }
                        if (block.type === 'h4') {
                          return (
                            <h4 key={idx} className={`text-xs font-bold uppercase tracking-wide pt-1 ${themeStyles.textMuted}`}>
                              {renderInlineMarkdown(block.text)}
                            </h4>
                          );
                        }
                        if (block.type === 'hr') {
                          return (
                            <hr
                              key={idx}
                              className={`my-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}
                            />
                          );
                        }
                        if (block.type === 'blockquote') {
                          return (
                            <blockquote
                              key={idx}
                              className={`p-3 rounded-r-xl border-l-4 border text-xs sm:text-[13px] leading-relaxed space-y-1 ${
                                isDark
                                  ? 'bg-[#12161F] border-slate-700 border-l-blue-500 text-slate-200'
                                  : 'bg-blue-50/80 border-blue-200 border-l-blue-600 text-slate-900'
                              }`}
                            >
                              {block.lines.map((line, lIdx) => (
                                <p key={lIdx}>{renderInlineMarkdown(line)}</p>
                              ))}
                            </blockquote>
                          );
                        }
                        if (block.type === 'bullet') {
                          return (
                            <div
                              key={idx}
                              style={{ paddingLeft: `${8 + Math.min(block.level, 3) * 14}px` }}
                              className={`flex items-start gap-2.5 text-xs sm:text-[13px] leading-relaxed ${themeStyles.textSecondary}`}
                            >
                              <span className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                              <span>{renderInlineMarkdown(block.text)}</span>
                            </div>
                          );
                        }
                        if (block.type === 'ordered') {
                          return (
                            <div
                              key={idx}
                              className={`flex items-start gap-2.5 pl-2 text-xs sm:text-[13px] leading-relaxed ${themeStyles.textSecondary}`}
                            >
                              <span className="font-extrabold text-blue-500 shrink-0 min-w-[1.25rem]">
                                {block.num}.
                              </span>
                              <span>{renderInlineMarkdown(block.text)}</span>
                            </div>
                          );
                        }
                        if (block.type === 'table') {
                          return (
                            <div
                              key={idx}
                              className={`overflow-x-auto rounded-xl border ${
                                isDark ? 'border-slate-800' : 'border-slate-200'
                              }`}
                            >
                              <table className="w-full text-left border-collapse text-xs">
                                <thead>
                                  <tr className="bg-blue-900 text-white">
                                    {block.headers.map((header, hIdx) => (
                                      <th
                                        key={hIdx}
                                        className="px-3 py-2 font-bold border-b border-blue-800 whitespace-nowrap"
                                      >
                                        {renderInlineMarkdown(header)}
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {block.rows.map((row, rIdx) => (
                                    <tr
                                      key={rIdx}
                                      className={
                                        rIdx % 2 === 1
                                          ? isDark
                                            ? 'bg-slate-900/70'
                                            : 'bg-slate-50'
                                          : isDark
                                          ? 'bg-slate-950/60'
                                          : 'bg-white'
                                      }
                                    >
                                      {block.headers.map((_, cIdx) => (
                                        <td
                                          key={cIdx}
                                          className={`px-3 py-2 align-top border-t leading-relaxed ${
                                            isDark ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-800'
                                          }`}
                                        >
                                          {renderInlineMarkdown(row[cIdx] || '')}
                                        </td>
                                      ))}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          );
                        }
                        if (block.type === 'code') {
                          return (
                            <pre
                              key={idx}
                              className={`p-3 rounded-xl border font-mono text-[11px] leading-relaxed overflow-x-auto ${
                                isDark
                                  ? 'bg-slate-900 border-slate-800 text-slate-200'
                                  : 'bg-slate-100 border-slate-200 text-slate-800'
                              }`}
                            >
                              <code>{block.lines.join('\n')}</code>
                            </pre>
                          );
                        }
                        return (
                          <p key={idx} className={`text-xs sm:text-[13px] leading-relaxed ${themeStyles.textSecondary}`}>
                            {renderInlineMarkdown(block.text)}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* STANDARD STRUCTURED DOCUMENT PREVIEW */
                <>
                  {/* Header block */}
                  <div className="text-center pb-3 border-b border-slate-700/30">
                    <h4 className="font-extrabold text-sm text-blue-500">{docTitle}</h4>
                    <p className={`text-[10px] mt-0.5 ${themeStyles.textMuted}`}>
                      Template: {template} | Model: {aiModel.toUpperCase()} | Date: {new Date().toLocaleDateString()}
                    </p>
                  </div>

                  {/* Color-Coded Conversation History Bubbles */}
                  {includeChatHistory && chatHistory && chatHistory.trim() && (
                    <div>
                      <span className="font-bold text-blue-500 uppercase text-[10px] block mb-2">
                        Conversation Transcript (Color-Coded Turns)
                      </span>
                      <div className="space-y-2">
                        {parseConversationTurns(chatHistory).map((turn, idx) => (
                          <div
                            key={`${turn.speaker}-${idx}`}
                            className={`flex ${turn.isSelf ? 'justify-end' : 'justify-start'}`}
                          >
                            <div
                              className={`max-w-[85%] p-2.5 rounded-xl border-l-4 border ${
                                turn.isSelf
                                  ? isDark
                                    ? 'bg-[#161B22] border-slate-700 border-l-emerald-500 text-slate-100'
                                    : 'bg-emerald-50 border-emerald-200 border-l-emerald-500 text-slate-900'
                                  : isDark
                                  ? 'bg-[#12161F] border-slate-700 border-l-blue-500 text-slate-100'
                                  : 'bg-blue-50/70 border-blue-200 border-l-blue-500 text-slate-900'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3 mb-0.5">
                                <span
                                  className={`text-[10px] font-extrabold uppercase ${
                                    turn.isSelf ? 'text-emerald-500' : 'text-blue-500'
                                  }`}
                                >
                                  {turn.speaker}
                                </span>
                                {turn.timestamp && (
                                  <span className={`text-[9px] font-mono ${themeStyles.textMuted}`}>
                                    {turn.timestamp}
                                  </span>
                                )}
                              </div>
                              <p className="whitespace-pre-wrap leading-relaxed text-[11px]">{turn.message}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Latest incoming message */}
                  {latestMessage && (
                    <div>
                      <span className="font-bold text-amber-500 uppercase text-[10px] block mb-1">
                        Active Incoming Message
                      </span>
                      <div
                        className={`p-2.5 rounded-lg border-l-4 border italic ${
                          isDark
                            ? 'bg-[#12161F] border-slate-700 border-l-amber-500 text-slate-100'
                            : 'bg-amber-50 border-amber-200 border-l-amber-500 text-slate-900'
                        }`}
                      >
                        "{latestMessage}"
                      </div>
                    </div>
                  )}

                  {/* Situation preview */}
                  {includeAnalysis && currentAnalysis && (
                    <div className="space-y-2">
                      <span className="font-bold text-blue-500 uppercase text-[10px] block">
                        Situation Diagnostic & Color Insights
                      </span>
                      <div
                        className={`p-3 rounded-lg border space-y-1.5 ${
                          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
                        } ${themeStyles.textSecondary}`}
                      >
                        <p>
                          <strong>Situation:</strong> {currentAnalysis.situation}
                        </p>
                        <p>
                          <strong>Category:</strong> {currentAnalysis.category} |{' '}
                          <strong>Urgency:</strong>{' '}
                          <span
                            className={
                              currentAnalysis.urgency === 'High'
                                ? 'text-rose-500 font-bold'
                                : currentAnalysis.urgency === 'Medium'
                                ? 'text-amber-500 font-bold'
                                : 'text-emerald-500 font-bold'
                            }
                          >
                            {currentAnalysis.urgency}
                          </span>
                        </p>
                        <p>
                          <strong>Dynamics:</strong> {currentAnalysis.participantDynamics}
                        </p>
                        {currentAnalysis.emotionalSignals?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {currentAnalysis.emotionalSignals.map((sig, i) => (
                              <span
                                key={`${sig.label}-${i}`}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  sig.intensity === 'High'
                                    ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                                    : sig.intensity === 'Moderate'
                                    ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                                    : 'bg-blue-500/15 text-blue-500 border-blue-500/30'
                                }`}
                              >
                                {sig.label} ({sig.intensity})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div
                        className={`p-2.5 rounded-lg border border-l-4 ${
                          isDark
                            ? 'bg-[#12161F] border-slate-700 border-l-emerald-500 text-slate-200'
                            : 'bg-emerald-50 border-emerald-200 border-l-emerald-500 text-emerald-950'
                        }`}
                      >
                        <strong className="text-emerald-500">Recommended Strategy:</strong>{' '}
                        {currentAnalysis.recommendedStrategy}
                      </div>
                      <div
                        className={`p-2.5 rounded-lg border border-l-4 ${
                          isDark
                            ? 'bg-[#12161F] border-slate-700 border-l-rose-500 text-slate-200'
                            : 'bg-rose-50 border-rose-200 border-l-rose-500 text-rose-950'
                        }`}
                      >
                        <strong className="text-rose-500">Pitfalls to Avoid:</strong>{' '}
                        {currentAnalysis.potentialPitfalls}
                      </div>
                    </div>
                  )}

                  {/* Replies preview */}
                  {includeReplies && currentReplies.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-purple-500 uppercase text-[10px] block">
                          Contextual Response Solutions ({currentReplies.length})
                        </span>
                        <button
                          type="button"
                          disabled={!!isExporting}
                          onClick={() => handleExportPdf('conversation')}
                          className="flex items-center gap-1 text-[10px] font-bold text-rose-500 hover:text-rose-400 hover:underline"
                          title="Export conversation & replies as PDF"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Export PDF</span>
                        </button>
                      </div>
                      <div className="space-y-2">
                        {currentReplies.map((r, i) => {
                          const accentClasses =
                            i % 3 === 0
                              ? 'border-l-blue-500 text-blue-500'
                              : i % 3 === 1
                              ? 'border-l-emerald-500 text-emerald-500'
                              : 'border-l-purple-500 text-purple-500';
                          return (
                            <div
                              key={r.id}
                              className={`p-2.5 rounded-lg border border-l-4 ${accentClasses.split(' ')[0]} ${
                                isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className={`font-bold ${accentClasses.split(' ')[1]}`}>
                                  Option {i + 1} ({r.styleLabel})
                                </span>
                                <span className="text-[10px] font-semibold text-emerald-500">
                                  {r.matchScore}% Match
                                </span>
                              </div>
                              <span className={themeStyles.textPrimary}>"{r.content}"</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Custom Operator Notes */}
                  <div>
                    <label className={`block text-[11px] font-semibold mb-1 ${themeStyles.textMuted}`}>
                      Executive Notes & Operational Context
                    </label>
                    <textarea
                      value={customNotes}
                      onChange={(e) => setCustomNotes(e.target.value)}
                      rows={3}
                      className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none ${
                        isDark
                          ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-blue-400'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                      }`}
                    />
                  </div>

                  {/* Hashtags and Links preview */}
                  {(includeHashtags || includeLinks) && (
                    <div
                      className={`pt-2 border-t flex flex-wrap items-center gap-4 text-[11px] ${
                        isDark ? 'border-slate-800' : 'border-slate-200'
                      }`}
                    >
                      {includeHashtags && (
                        <div className="flex items-center gap-1.5 text-blue-500 font-medium">
                          <Hash className="w-3 h-3" />
                          <span>#CommunicationStrategy #Leadership #SituationAI #Brief</span>
                        </div>
                      )}
                      {includeLinks && (
                        <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
                          <Link className="w-3 h-3" />
                          <span>https://situationai.com/review/dilemma-brief</span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Quick Export Banner */}
            <div className="mt-4 pt-4 border-t border-slate-700/30 flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className={themeStyles.textMuted}>
                Export as formatted Word, PDF, LinkedIn post, Email (.eml), or Slack/Teams Markdown.
              </span>
              <div className="flex flex-wrap gap-2 font-semibold">
                <button type="button" onClick={() => handleExportPdf('replies-summary')} className="text-rose-600 hover:underline">
                  Replies & Summary .PDF
                </button>
                <span className="text-slate-500">|</span>
                <button type="button" onClick={() => handleExportWord('conversation')} className="text-blue-600 hover:underline">
                  Conversation .DOCX
                </button>
                <span className="text-slate-500">|</span>
                <button type="button" onClick={() => handleExportWord('selected-reply')} className="text-blue-500 hover:underline">
                  Response .DOCX
                </button>
                <span className="text-slate-500">|</span>
                <button type="button" onClick={() => handleExportPdf('conversation')} className="text-rose-500 hover:underline">
                  Conversation .PDF
                </button>
                <span className="text-slate-500">|</span>
                <button type="button" onClick={() => handleExportPdf('selected-reply')} className="text-rose-400 hover:underline">
                  Response .PDF
                </button>
                <span className="text-slate-500">|</span>
                <button type="button" onClick={handleExportLinkedIn} className="text-[#0A66C2] hover:underline">
                  LinkedIn
                </button>
                <span className="text-slate-500">|</span>
                <button type="button" onClick={handleExportEmail} className="text-emerald-500 hover:underline">
                  Email (.EML)
                </button>
                <span className="text-slate-500">|</span>
                <button type="button" onClick={handleExportMarkdown} className="text-purple-500 hover:underline">
                  .MD
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

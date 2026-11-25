import React, { useState } from 'react';
import {
  Copy,
  Check,
  RotateCw,
  Edit3,
  Heart,
  FileText,
  Sparkles,
  Scissors,
  FilePlus,
  Smile,
  Briefcase,
  Feather,
  Target,
  Laugh,
  Globe,
  RefreshCw,
  Save,
  X,
  ExternalLink,
  Filter,
  ShieldCheck,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import { FeedbackRating, ReplyOption, ReplyPreferenceProfile } from '../types';

interface RepliesPanelProps {
  replies: ReplyOption[];
  isGenerating: boolean;
  onCopyReply: (content: string) => void;
  onRegenerateAll: () => void;
  onSaveReply: (reply: ReplyOption) => void;
  onEditReply: (id: string, newContent: string) => void;
  onImproveReply: (replyId: string, action: string, customInstruction?: string) => Promise<void>;
  onExportReply: (reply: ReplyOption) => void;
  onRateReply?: (reply: ReplyOption, rating: FeedbackRating | null, reason?: string) => void;
  feedbackProfile?: ReplyPreferenceProfile;
  onOpenFeedbackHistory?: () => void;
  isImproving: string | null;
  isDark: boolean;
  themeStyles: any;
  highlightedIds?: string[];
  filterActive?: boolean;
  filterMode?: 'hide' | 'highlight';
  sortBy?: 'default' | 'most-professional' | 'concise' | 'most-creative' | 'best-match';
  onResetFilters?: () => void;
  filterSummary?: string;
}

export const RepliesPanel: React.FC<RepliesPanelProps> = ({
  replies,
  isGenerating,
  onCopyReply,
  onRegenerateAll,
  onSaveReply,
  onEditReply,
  onImproveReply,
  onExportReply,
  onRateReply,
  feedbackProfile,
  onOpenFeedbackHistory,
  isImproving,
  isDark,
  themeStyles,
  highlightedIds,
  filterActive = false,
  filterMode = 'highlight',
  sortBy = 'default',
  onResetFilters,
  filterSummary,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [activeReplyForImprove, setActiveReplyForImprove] = useState<string>(
    replies[0]?.id || ''
  );
  const [customActionText, setCustomActionText] = useState<string>('');
  const [showTranslateInput, setShowTranslateInput] = useState<boolean>(false);
  const [downvoteReasonForId, setDownvoteReasonForId] = useState<string | null>(null);

  const downvoteReasons = [
    'Too stiff / formal',
    'Too long',
    'Too short',
    'Wrong tone',
    'Sounds robotic',
  ];

  const effectiveActiveReplyId = replies.some((r) => r.id === activeReplyForImprove)
    ? activeReplyForImprove
    : replies[0]?.id || '';

  const handleCopy = (id: string, content: string) => {
    onCopyReply(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startEdit = (rep: ReplyOption) => {
    setEditingId(rep.id);
    setEditText(rep.content);
  };

  const saveEdit = (id: string) => {
    onEditReply(id, editText);
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const improvementActions = [
    { label: 'Make More Natural', icon: <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> },
    { label: 'Make Shorter', icon: <Scissors className="w-3.5 h-3.5 text-amber-400" /> },
    { label: 'Add More Detail', icon: <FilePlus className="w-3.5 h-3.5 text-emerald-400" /> },
    { label: 'Make Friendlier', icon: <Smile className="w-3.5 h-3.5 text-pink-400" /> },
    { label: 'Make Professional', icon: <Briefcase className="w-3.5 h-3.5 text-blue-400" /> },
    { label: 'Make More Polite', icon: <Feather className="w-3.5 h-3.5 text-teal-400" /> },
    { label: 'Make More Direct', icon: <Target className="w-3.5 h-3.5 text-rose-400" /> },
    { label: 'Add Humor', icon: <Laugh className="w-3.5 h-3.5 text-yellow-400" /> },
    { label: 'Rewrite Completely', icon: <RefreshCw className="w-3.5 h-3.5 text-purple-400" /> },
  ];

  const getLengthBadge = (text: string) => {
    const len = (text || '').trim().length;
    if (len < 160) {
      return {
        label: 'Short',
        chars: len,
        badgeStyle: isDark
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          : 'bg-amber-50 text-amber-800 border-amber-200',
      };
    }
    if (len <= 380) {
      return {
        label: 'Balanced',
        chars: len,
        badgeStyle: isDark
          ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
          : 'bg-blue-50 text-blue-800 border-blue-200',
      };
    }
    return {
      label: 'Detailed',
      chars: len,
      badgeStyle: isDark
        ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
        : 'bg-purple-50 text-purple-800 border-purple-200',
    };
  };

  if (!replies || replies.length === 0) {
    if (filterActive && filterMode === 'hide') {
      return (
        <div
          className={`p-8 rounded-2xl border text-center transition-all ${
            isDark ? 'bg-[#12161F] border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mx-auto mb-3">
            <Filter className="w-5 h-5" />
          </div>
          <h4 className={`text-sm font-bold ${themeStyles.textPrimary}`}>
            No Replies Match Your Current Filter
          </h4>
          <p className={`text-xs mt-1 max-w-md mx-auto ${themeStyles.textMuted}`}>
            {filterSummary || 'Try selecting a different length or tone category, or switch to Highlight Mode to view all responses.'}
          </p>
          {onResetFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="mt-4 px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-sm"
            >
              Reset Filters
            </button>
          )}
        </div>
      );
    }

    return (
      <div
        className={`p-10 rounded-2xl border text-center ${
          isDark ? 'bg-[#12161F] border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <Sparkles className={`w-8 h-8 mx-auto mb-3 opacity-40 ${themeStyles.secondaryAccent}`} />
        <h3 className={`text-sm font-bold ${themeStyles.textPrimary}`}>
          Ready to Craft Natural Human Replies
        </h3>
        <p className={`text-xs max-w-sm mx-auto mt-1 ${themeStyles.textMuted}`}>
          Enter the latest incoming message above and click "Generate Human-Like Replies".
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Bar with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-base font-bold flex items-center gap-2 ${themeStyles.textPrimary}`}>
            <Sparkles className={`w-4 h-4 ${themeStyles.secondaryAccent}`} />
            Suggested Human-Like Replies
          </h3>
          <p className={`text-xs ${themeStyles.textMuted}`}>
            Ready to send. Choose the tone and length that best reflects your intent.
          </p>
        </div>
        <button
          type="button"
          onClick={onRegenerateAll}
          disabled={isGenerating}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            isDark
              ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
              : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm'
          }`}
        >
          <RotateCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>Regenerate All</span>
        </button>
      </div>

      {/* Learned Preference Memory Banner */}
      {feedbackProfile && feedbackProfile.totalRatings > 0 && (
        <div
          className={`px-3.5 py-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex flex-wrap items-center gap-2 min-w-0">
            <span className="font-bold text-emerald-500 whitespace-nowrap">Preference Learning Active</span>
            <span className={themeStyles.textMuted} aria-hidden="true">·</span>
            <span className={`tabular-nums ${themeStyles.textSecondary}`}>
              {feedbackProfile.positiveCount} liked / {feedbackProfile.negativeCount} disliked ({feedbackProfile.approvalRate}% approval)
            </span>
            {feedbackProfile.preferredTones.length > 0 && (
              <>
                <span className={themeStyles.textMuted} aria-hidden="true">·</span>
                <span className={themeStyles.textMuted}>
                  Favoring: <strong className={themeStyles.textPrimary}>{feedbackProfile.preferredTones.join(', ')}</strong>
                </span>
              </>
            )}
          </div>
          {onOpenFeedbackHistory && (
            <button
              type="button"
              onClick={onOpenFeedbackHistory}
              className="text-[11px] font-bold text-blue-500 hover:underline whitespace-nowrap shrink-0"
            >
              View Preference Log →
            </button>
          )}
        </div>
      )}

      {/* 3 Reply Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {replies.map((rep, idx) => {
          const isSelectedForImprove = effectiveActiveReplyId === rep.id;
          const isThisImproving = isImproving === rep.id;
          const isCurrentlyEditing = editingId === rep.id;
          const lengthMeta = getLengthBadge(rep.content);
          const isMatch = !highlightedIds || highlightedIds.includes(rep.id);
          const isDimmed = filterActive && filterMode === 'highlight' && !isMatch;
          const isHighlighted = filterActive && filterMode === 'highlight' && isMatch;
          const sortBadgeLabel =
            sortBy === 'most-professional'
              ? `#${idx + 1} Most Professional`
              : sortBy === 'concise'
              ? `#${idx + 1} Shortest`
              : sortBy === 'most-creative'
              ? `#${idx + 1} Most Creative`
              : sortBy === 'best-match'
              ? `#${idx + 1} Highest Match Score`
              : null;

          return (
            <div
              key={rep.id}
              onClick={() => setActiveReplyForImprove(rep.id)}
              className={`relative rounded-2xl border p-4 flex flex-col justify-between transition-all duration-200 cursor-pointer ${
                isHighlighted
                  ? `${
                      isDark
                        ? 'bg-[#1C212B] border-blue-500 shadow-md ring-1 ring-blue-500'
                        : 'bg-white border-blue-500 shadow-xl ring-2 ring-blue-500/60 shadow-blue-500/10'
                    }`
                  : isSelectedForImprove
                  ? `${
                      isDark
                        ? 'bg-[#1A202A] border-blue-500 shadow-sm ring-1 ring-blue-500/60'
                        : 'bg-white border-blue-600 shadow-lg shadow-blue-500/10 ring-1 ring-blue-400'
                    }`
                  : `${
                      isDark
                        ? 'bg-[#12161F] border-slate-800 hover:border-slate-700'
                        : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                    }`
              } ${isDimmed ? 'opacity-40 hover:opacity-100 grayscale-[20%]' : ''}`}
            >
              {/* Highlight or Sort Rank Ribbon Indicator */}
              {isHighlighted ? (
                <div className="absolute -top-2.5 right-4 z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500 text-slate-950 shadow-md flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 fill-current" />
                    Highlighted Match
                  </span>
                </div>
              ) : sortBadgeLabel && idx === 0 ? (
                <div className="absolute -top-2.5 right-4 z-10">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-600 text-white shadow-md flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 fill-current" />
                    {sortBadgeLabel}
                  </span>
                </div>
              ) : null}

              {/* Header: Label, Tone, Length, Match Score */}
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1.5 mb-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      idx === 0
                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                        : idx === 1
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                    }`}
                  >
                    {rep.styleLabel}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Length badge */}
                    <span
                      title={`${(rep.content || '').length} characters`}
                      className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-full border ${lengthMeta.badgeStyle}`}
                    >
                      {lengthMeta.label} ({lengthMeta.chars}c)
                    </span>

                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      {rep.matchScore}% fit
                    </span>
                  </div>
                </div>

                {/* Tone tag & Auto-Refine badge */}
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${themeStyles.badgeBg}`}>
                    Tone: {rep.tone}
                  </span>
                  {rep.autoRefined && (
                    <span
                      title={rep.refinementNotes || 'Verified against Situation Analysis'}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                        isDark
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      <span>Auto-Refined</span>
                    </span>
                  )}
                </div>

                {/* Reply Content or Inline Editor */}
                {isCurrentlyEditing ? (
                  <div className="my-2 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={4}
                      className={`w-full p-2.5 rounded-xl text-xs border focus:outline-none focus:ring-1 ${
                        isDark
                          ? 'bg-slate-950 border-slate-700 text-slate-100 focus:border-blue-400'
                          : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                      }`}
                    />
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-2 py-1 rounded text-[11px] text-slate-400 hover:text-slate-200"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => saveEdit(rep.id)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold flex items-center gap-1 ${themeStyles.primaryAccent}`}
                      >
                        <Save className="w-3 h-3" /> Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative my-2 min-h-[4.5rem]">
                    {isThisImproving && (
                      <div className="absolute inset-0 bg-[#0D1117]/90 rounded-xl flex items-center justify-center z-10">
                        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400">
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Refining Reply...</span>
                        </div>
                      </div>
                    )}
                    <p
                      className={`text-xs sm:text-sm font-medium leading-relaxed select-text ${themeStyles.textPrimary}`}
                    >
                      "{rep.content}"
                    </p>
                  </div>
                )}

                {/* Explanation & Auto-Refine Note */}
                <p className={`text-[10.5px] italic leading-normal mb-2 ${themeStyles.textMuted}`}>
                  {rep.explanation}
                </p>
                {rep.autoRefined && rep.refinementNotes && (
                  <p
                    className={`text-[10px] leading-snug mb-3 px-2 py-1 rounded-lg border ${
                      isDark
                        ? 'bg-[#161B22] border-slate-700 text-slate-300'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    }`}
                  >
                    <strong>Situation Audit:</strong> {rep.refinementNotes}
                  </p>
                )}
              </div>

              {/* Downvote Quick-Reason Drawer (shown on Thumbs Down) */}
              {rep.feedback === 'down' && downvoteReasonForId === rep.id && onRateReply && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className={`mb-3 p-2.5 rounded-xl border text-[11px] space-y-1.5 ${
                    isDark
                      ? 'bg-[#161B22] border-slate-700 border-l-2 border-l-rose-500 text-slate-200'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold">What should we improve next time?</span>
                    <button
                      type="button"
                      onClick={() => setDownvoteReasonForId(null)}
                      className="text-[10px] opacity-75 hover:opacity-100"
                    >
                      Close
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {downvoteReasons.map((reason) => {
                      const activeReason = rep.feedbackReason === reason;
                      return (
                        <button
                          key={reason}
                          type="button"
                          onClick={() => {
                            onRateReply(rep, 'down', reason);
                            setDownvoteReasonForId(null);
                          }}
                          className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold transition-colors ${
                            activeReason
                              ? 'bg-rose-600 border-rose-600 text-white'
                              : isDark
                              ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
                              : 'bg-white border-rose-200 text-rose-800 hover:bg-rose-100'
                          }`}
                        >
                          {reason}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Saved Feedback Tag */}
              {rep.feedback && (
                <div className={`mb-2 text-[10.5px] font-semibold flex items-center justify-between gap-1.5 ${
                  rep.feedback === 'up' ? 'text-emerald-500' : 'text-rose-500'
                }`}>
                  <span>
                    {rep.feedback === 'up'
                      ? 'Liked — future replies will favor this voice'
                      : `Disliked${rep.feedbackReason ? ` (${rep.feedbackReason})` : ''} — logged to adjust future replies`}
                  </span>
                </div>
              )}

              {/* Bottom Controls Bar */}
              <div className="pt-3 border-t border-slate-700/30 flex items-center justify-between gap-1">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(rep.id, rep.content);
                    }}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      copiedId === rep.id
                        ? 'bg-emerald-500 text-white'
                        : isDark
                        ? 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {copiedId === rep.id ? (
                      <>
                        <Check className="w-3 h-3" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>

                  {onRateReply && (
                    <div className="flex items-center gap-0.5 ml-0.5">
                      <button
                        type="button"
                        aria-label={`Thumbs up ${rep.styleLabel}`}
                        aria-pressed={rep.feedback === 'up'}
                        title="Like this reply style to improve future suggestions"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDownvoteReasonForId(null);
                          onRateReply(rep, rep.feedback === 'up' ? null : 'up');
                        }}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          rep.feedback === 'up'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : isDark
                            ? 'border-slate-700 text-slate-400 hover:text-emerald-400 hover:border-emerald-500/40 bg-slate-900'
                            : 'border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 bg-white'
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        aria-label={`Thumbs down ${rep.styleLabel}`}
                        aria-pressed={rep.feedback === 'down'}
                        title="Dislike this reply style so future replies avoid it"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (rep.feedback === 'down') {
                            setDownvoteReasonForId(null);
                            onRateReply(rep, null);
                          } else {
                            setDownvoteReasonForId(rep.id);
                            onRateReply(rep, 'down');
                          }
                        }}
                        className={`p-1.5 rounded-lg border text-xs transition-colors ${
                          rep.feedback === 'down'
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : isDark
                            ? 'border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-500/40 bg-slate-900'
                            : 'border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-300 bg-white'
                        }`}
                      >
                        <ThumbsDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEdit(rep);
                    }}
                    title="Edit Reply"
                    className={`p-1.5 rounded-lg text-xs transition-all ${
                      isDark
                        ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                    }`}
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveReply(rep);
                    }}
                    title={rep.saved ? 'Saved' : 'Save to Favorites'}
                    className={`p-1.5 rounded-lg text-xs transition-all ${
                      rep.saved
                        ? 'text-rose-500 bg-rose-500/10'
                        : isDark
                        ? 'text-slate-400 hover:text-rose-400 hover:bg-slate-800'
                        : 'text-slate-500 hover:text-rose-500 hover:bg-slate-100'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${rep.saved ? 'fill-current' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onExportReply(rep);
                    }}
                    title="Export in Document"
                    className={`p-1.5 rounded-lg text-xs transition-all ${
                      isDark
                        ? 'text-slate-400 hover:text-blue-400 hover:bg-slate-800'
                        : 'text-slate-500 hover:text-blue-600 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reply Improvement Tools Toolbar */}
      <div
        className={`p-4 rounded-2xl border transition-all ${
          isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
              ✨
            </div>
            <div>
              <h4 className={`text-xs font-bold ${themeStyles.textPrimary}`}>
                Smart Reply Refiner & Improvement Toolbar
              </h4>
              <p className={`text-[10.5px] ${themeStyles.textMuted}`}>
                Select an action to polish or adapt the selected reply immediately
              </p>
            </div>
          </div>

          {/* Active Reply Selector */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className={themeStyles.textMuted}>Target:</span>
            <select
              value={effectiveActiveReplyId}
              onChange={(e) => setActiveReplyForImprove(e.target.value)}
              className={`text-xs py-1 px-2 rounded-lg border font-semibold ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-blue-400'
                  : 'bg-white border-slate-300 text-blue-600'
              }`}
            >
              {replies.map((r, i) => (
                <option key={r.id} value={r.id}>
                  Option {i + 1}: {r.styleLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-1.5">
          {improvementActions.map((action) => (
            <button
              key={action.label}
              type="button"
              disabled={!!isImproving}
              onClick={() => onImproveReply(effectiveActiveReplyId, action.label)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                isDark
                  ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
                  : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
              } disabled:opacity-50`}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}

          {/* Translate Button */}
          <button
            type="button"
            onClick={() => setShowTranslateInput(!showTranslateInput)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
              showTranslateInput
                ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                : isDark
                ? 'bg-slate-800/80 hover:bg-slate-700/80 border-slate-700 text-slate-200'
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
            }`}
          >
            <Globe className="w-3.5 h-3.5 text-blue-400" />
            <span>Translate...</span>
          </button>
        </div>

        {/* Custom Instruction Refiner */}
        <div className="mt-3 pt-3 border-t border-slate-700/20 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={customActionText}
            onChange={(e) => setCustomActionText(e.target.value)}
            placeholder="Custom instruction (e.g. 'Add gratitude and propose Tuesday 2 PM')"
            className={`flex-1 px-3 py-1.5 rounded-xl border text-xs focus:outline-none focus:ring-1 ${
              isDark
                ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600'
            }`}
          />
          <button
            type="button"
            disabled={!!isImproving || !customActionText.trim()}
            onClick={() => {
              const trimmed = customActionText.trim();
              if (!trimmed) return;
              onImproveReply(effectiveActiveReplyId, 'Custom Refinement', trimmed);
              setCustomActionText('');
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-45 transition-colors whitespace-nowrap"
          >
            Apply Instruction
          </button>
        </div>

        {/* Translate Options Drawer */}
        {showTranslateInput && (
          <div className="mt-3 pt-3 border-t border-slate-700/30 flex flex-wrap items-center gap-2">
            <span className={`text-xs font-medium ${themeStyles.textSecondary}`}>
              Translate selected reply into:
            </span>
            {['Telugu', 'Hindi', 'Hinglish', 'Tamil', 'Spanish', 'French', 'German'].map(
              (lang) => (
                <button
                  key={lang}
                  type="button"
                  disabled={!!isImproving}
                  onClick={() =>
                    onImproveReply(effectiveActiveReplyId, 'Translate', `Translate naturally into ${lang}`)
                  }
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {lang}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
};

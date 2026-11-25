import React, { useState, useMemo, useDeferredValue, useRef } from 'react';
import {
  History,
  Search,
  Trash2,
  ExternalLink,
  Edit2,
  Check,
  X,
  FileText,
  Calendar,
  ShieldCheck,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import {
  SavedConversation,
  ReplyFeedbackEntry,
  ReplyPreferenceProfile,
} from '../types';

interface HistoryViewProps {
  history: SavedConversation[];
  onOpenConversation: (conv: SavedConversation) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onClearAllHistory: () => void;
  onExportConversation: (conv: SavedConversation) => void;
  feedbackHistory?: ReplyFeedbackEntry[];
  feedbackProfile?: ReplyPreferenceProfile;
  onDeleteFeedback?: (id: string) => void;
  onClearFeedback?: () => void;
  initialSection?: 'conversations' | 'feedback';
  isDark: boolean;
  themeStyles: any;
}

type SearchScope = 'all' | 'title' | 'content' | 'platform';

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  onOpenConversation,
  onDeleteConversation,
  onRenameConversation,
  onClearAllHistory,
  onExportConversation,
  feedbackHistory = [],
  feedbackProfile,
  onDeleteFeedback,
  onClearFeedback,
  initialSection = 'conversations',
  isDark,
  themeStyles,
}) => {
  const [activeSection, setActiveSection] = useState<'conversations' | 'feedback'>(initialSection);
  const [feedbackFilter, setFeedbackFilter] = useState<'all' | 'up' | 'down'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<SearchScope>('all');
  const [selectedPlatform, setSelectedPlatform] = useState('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  React.useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(searchQuery.trim().toLowerCase());

  const startRename = (conv: SavedConversation) => {
    setEditingId(conv.id);
    setNewTitle(conv.title);
  };

  const saveRename = (id: string) => {
    if (newTitle.trim()) {
      onRenameConversation(id, newTitle.trim());
    }
    setEditingId(null);
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSearchScope('all');
    setSelectedPlatform('all');
    searchInputRef.current?.focus();
  };

  // Pre-index searchable fields and filter via tokenized matching for fast retrieval
  const filteredHistory = useMemo(() => {
    const tokens = deferredQuery ? deferredQuery.split(/\s+/).filter(Boolean) : [];

    return history.filter((item) => {
      const matchesPlatformDropdown =
        selectedPlatform === 'all' ||
        (item.platform || '').toLowerCase() === selectedPlatform.toLowerCase();

      if (!matchesPlatformDropdown) return false;
      if (tokens.length === 0) return true;

      const titleText = (item.title || '').toLowerCase();
      const platformText = (item.platform || '').toLowerCase();
      const contentText = [
        item.latestMessage || '',
        item.chatHistory || '',
        ...(item.replies || []).map((r) => `${r.content || ''} ${r.tone || ''} ${r.styleLabel || ''}`),
        item.analysis?.situation || '',
        item.analysis?.category || '',
      ]
        .join(' ')
        .toLowerCase();

      let haystack = '';
      switch (searchScope) {
        case 'title':
          haystack = titleText;
          break;
        case 'content':
          haystack = contentText;
          break;
        case 'platform':
          haystack = platformText;
          break;
        case 'all':
        default:
          haystack = `${titleText} ${platformText} ${contentText}`;
          break;
      }

      return tokens.every((token) => haystack.includes(token));
    });
  }, [history, deferredQuery, searchScope, selectedPlatform]);

  // Highlight matched search tokens in displayed text
  const renderHighlightedText = (text: string) => {
    if (!deferredQuery || !text) return text;
    const tokens = Array.from(
      new Set(
        deferredQuery
          .split(/\s+/)
          .filter((t) => t.length >= 2)
          .map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      )
    );
    if (tokens.length === 0) return text;

    const regex = new RegExp(`(${tokens.join('|')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <mark
          key={i}
          className={`px-0.5 rounded ${
            isDark ? 'bg-amber-400/25 text-amber-200' : 'bg-amber-200/80 text-slate-900'
          }`}
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedPlatform !== 'all' || searchScope !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <History className={`w-5 h-5 ${themeStyles.secondaryAccent}`} />
            <h2 className={`text-xl font-black ${themeStyles.textPrimary}`}>
              Saved Conversation History
            </h2>
            {history.length > 0 && (
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                }`}
              >
                {filteredHistory.length} / {history.length}
              </span>
            )}
          </div>
          <p className={`text-xs mt-1 ${themeStyles.textMuted}`}>
            Private local session history and reply preference logs used to calibrate future reply generations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented Section Switcher */}
          <div
            className={`flex items-center p-1 rounded-xl border ${
              isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-slate-100'
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveSection('conversations')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeSection === 'conversations'
                  ? themeStyles.primaryAccent
                  : isDark
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Saved Chats ({history.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSection('feedback')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                activeSection === 'feedback'
                  ? themeStyles.primaryAccent
                  : isDark
                  ? 'text-slate-300 hover:text-white'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              Feedback Preferences ({feedbackHistory.length})
            </button>
          </div>

          {activeSection === 'conversations' && history.length > 0 && (
            <div>
              {showClearConfirm ? (
                <div className="flex items-center gap-2 p-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 text-xs">
                  <span className="text-rose-400 font-semibold text-[11px]">Clear all items?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClearAllHistory();
                      setShowClearConfirm(false);
                    }}
                    className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px]"
                  >
                    Yes, Clear
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowClearConfirm(false)}
                    className="px-2 py-0.5 rounded bg-slate-700 text-slate-200 text-[10px]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All History</span>
                </button>
              )}
            </div>
          )}

          {activeSection === 'feedback' && feedbackHistory.length > 0 && onClearFeedback && (
            <button
              type="button"
              onClick={onClearFeedback}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 text-xs font-semibold transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Feedback Log</span>
            </button>
          )}
        </div>
      </div>

      {activeSection === 'feedback' ? (
        <div className="space-y-4">
          {/* Learned Preference Summary Grid */}
          {feedbackProfile && (
            <div className={`p-4 rounded-2xl border grid grid-cols-2 sm:grid-cols-4 gap-3 ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
              <div>
                <span className={`text-[11px] block ${themeStyles.textMuted}`}>Total Ratings</span>
                <span className={`text-lg font-bold tabular-nums ${themeStyles.textPrimary}`}>
                  {feedbackProfile.totalRatings}
                </span>
              </div>
              <div>
                <span className={`text-[11px] block ${themeStyles.textMuted}`}>Approval Rate</span>
                <span className="text-lg font-bold tabular-nums text-emerald-500">
                  {feedbackProfile.totalRatings > 0 ? `${feedbackProfile.approvalRate}%` : '—'}
                </span>
              </div>
              <div>
                <span className={`text-[11px] block ${themeStyles.textMuted}`}>Preferred Tones</span>
                <span className={`text-xs font-semibold block mt-1 ${themeStyles.textPrimary}`}>
                  {feedbackProfile.preferredTones.length > 0
                    ? feedbackProfile.preferredTones.join(', ')
                    : 'Rate replies to learn'}
                </span>
              </div>
              <div>
                <span className={`text-[11px] block ${themeStyles.textMuted}`}>Avoidance Guardrails</span>
                <span className={`text-xs font-semibold block mt-1 ${themeStyles.textSecondary}`}>
                  {feedbackProfile.avoidanceNotes.length > 0
                    ? feedbackProfile.avoidanceNotes.slice(0, 2).join(' · ')
                    : 'None logged yet'}
                </span>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {[
                { id: 'all', label: `All (${feedbackHistory.length})` },
                { id: 'up', label: `Liked (${feedbackHistory.filter((f) => f.rating === 'up').length})` },
                { id: 'down', label: `Disliked (${feedbackHistory.filter((f) => f.rating === 'down').length})` },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFeedbackFilter(opt.id as 'all' | 'up' | 'down')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                    feedbackFilter === opt.id
                      ? themeStyles.primaryAccent
                      : isDark
                      ? 'border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feedback Entries List */}
          {feedbackHistory.filter((f) => feedbackFilter === 'all' || f.rating === feedbackFilter).length === 0 ? (
            <div className={`p-10 rounded-2xl border text-center ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
              <ThumbsUp className={`w-8 h-8 mx-auto mb-2.5 opacity-40 ${themeStyles.secondaryAccent}`} />
              <h3 className={`text-sm font-bold ${themeStyles.textPrimary}`}>
                No Reply Feedback Logged Yet
              </h3>
              <p className={`text-xs max-w-md mx-auto mt-1 ${themeStyles.textMuted}`}>
                Click Thumbs Up or Thumbs Down on any generated reply in the Reply Engine. Your preferences are stored locally and automatically guide future generations.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {feedbackHistory
                .filter((f) => feedbackFilter === 'all' || f.rating === feedbackFilter)
                .map((entry) => (
                  <div
                    key={entry.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${themeStyles.cardBg} ${themeStyles.cardBorder}`}
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span
                          className={`inline-flex items-center gap-1 font-bold ${
                            entry.rating === 'up' ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {entry.rating === 'up' ? (
                            <ThumbsUp className="w-3.5 h-3.5" />
                          ) : (
                            <ThumbsDown className="w-3.5 h-3.5" />
                          )}
                          <span>{entry.rating === 'up' ? 'Liked' : 'Disliked'}</span>
                        </span>
                        <span className={themeStyles.textMuted} aria-hidden="true">·</span>
                        <span className={`font-semibold ${themeStyles.textPrimary}`}>
                          {entry.styleLabel} ({entry.tone})
                        </span>
                        <span className={themeStyles.textMuted} aria-hidden="true">·</span>
                        <span className={themeStyles.textMuted}>
                          {entry.platform} · {entry.responseLength}
                        </span>
                        {entry.reason && (
                          <>
                            <span className={themeStyles.textMuted} aria-hidden="true">·</span>
                            <span className="text-rose-500 font-medium">{entry.reason}</span>
                          </>
                        )}
                      </div>
                      <p className={`text-xs line-clamp-2 ${themeStyles.textSecondary}`}>
                        "{entry.replyExcerpt}"
                      </p>
                      <span className={`text-[11px] tabular-nums block ${themeStyles.textMuted}`}>
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {onDeleteFeedback && (
                      <button
                        type="button"
                        onClick={() => onDeleteFeedback(entry.id)}
                        title="Remove feedback entry"
                        className="p-2 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 self-start sm:self-center shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      ) : (
        <>

      {/* Fast Text Search Bar, Match Scope & Platform Filter */}
      <div
        className={`p-3.5 rounded-2xl border space-y-2.5 ${
          isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
        }`}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
            <input
              ref={searchInputRef}
              id="history-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape' && searchQuery) {
                  setSearchQuery('');
                }
              }}
              placeholder="Search by title, message content, reply text, or platform (e.g. WhatsApp, LinkedIn)..."
              aria-label="Filter saved conversations by title, content, or platform"
              className={`w-full pl-9 pr-9 py-2 rounded-xl text-xs border focus:outline-none focus:ring-2 transition-all ${
                isDark
                  ? 'bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/25'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-500/20'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                title="Clear search text"
                aria-label="Clear search text"
                className={`absolute right-2.5 top-2 p-0.5 rounded-md transition-colors ${
                  isDark
                    ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                }`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            aria-label="Filter by platform"
            className={`py-2 px-3 rounded-xl text-xs font-medium border focus:outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-blue-500'
                : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-blue-600'
            }`}
          >
            <option value="all">All Platforms</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="telegram">Telegram</option>
            <option value="snapchat">Snapchat</option>
            <option value="discord">Discord</option>
            <option value="custom">Other / Custom</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className={`flex items-center gap-1 px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
                isDark
                  ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>

        {/* Search Field Scope Selector & Live Match Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`font-semibold mr-1 ${themeStyles.textMuted}`}>Search in:</span>
            {(
              [
                { id: 'all', label: 'All Fields' },
                { id: 'title', label: 'Title' },
                { id: 'content', label: 'Content & Replies' },
                { id: 'platform', label: 'Platform' },
              ] as { id: SearchScope; label: string }[]
            ).map((scope) => {
              const active = searchScope === scope.id;
              return (
                <button
                  key={scope.id}
                  type="button"
                  onClick={() => setSearchScope(scope.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold border transition-all ${
                    active
                      ? `${themeStyles.primaryAccent} shadow-xs`
                      : isDark
                      ? 'border-slate-800 bg-slate-950/70 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {scope.label}
                </button>
              );
            })}
          </div>

          <span className={themeStyles.textMuted}>
            Showing <strong className={themeStyles.textPrimary}>{filteredHistory.length}</strong> of{' '}
            {history.length} saved conversation{history.length === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {/* History Items List */}
      {filteredHistory.length === 0 ? (
        <div
          className={`p-12 rounded-2xl border text-center ${
            isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <History className={`w-10 h-10 mx-auto mb-3 opacity-30 ${themeStyles.secondaryAccent}`} />
          <h3 className={`text-base font-bold ${themeStyles.textPrimary}`}>
            {history.length === 0 ? 'No Conversations Saved Yet' : 'No Matching Conversations'}
          </h3>
          <p className={`text-xs max-w-sm mx-auto mt-1 ${themeStyles.textMuted}`}>
            {history.length === 0
              ? 'When you generate replies in Situation AI, you can click the heart icon to save them to this private history.'
              : 'No saved chats matched your search or platform filter. Try different keywords or reset filters.'}
          </p>
          {history.length > 0 && hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className={`mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold ${themeStyles.primaryAccent}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Clear Search & Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => (
            <div
              key={item.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                isDark
                  ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              } shadow-xs`}
            >
              {/* Left Details */}
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {editingId === item.id ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRename(item.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        className={`text-xs font-bold px-2 py-1 rounded border ${
                          isDark ? 'bg-slate-950 border-slate-700 text-white' : 'bg-slate-50 border-slate-300'
                        }`}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => saveRename(item.id)}
                        className="p-1 rounded bg-emerald-500 text-white"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1 rounded bg-slate-700 text-slate-300"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <h4 className={`text-sm font-bold ${themeStyles.textPrimary}`}>
                        {searchScope === 'all' || searchScope === 'title'
                          ? renderHighlightedText(item.title)
                          : item.title}
                      </h4>
                      <button
                        type="button"
                        onClick={() => startRename(item)}
                        title="Rename"
                        className="opacity-50 hover:opacity-100 p-0.5 text-slate-400"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${themeStyles.badgeBg}`}>
                    {searchScope === 'all' || searchScope === 'platform'
                      ? renderHighlightedText(item.platform)
                      : item.platform}
                  </span>

                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(item.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Latest message preview */}
                <p className={`text-xs italic ${themeStyles.textSecondary}`}>
                  "{searchScope === 'all' || searchScope === 'content'
                    ? renderHighlightedText(item.latestMessage)
                    : item.latestMessage}"
                </p>

                {/* Best reply preview */}
                {item.replies && item.replies.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-emerald-400 text-[11px] shrink-0">Saved Reply:</span>
                    <span className={`line-clamp-1 ${themeStyles.textPrimary}`}>
                      "{searchScope === 'all' || searchScope === 'content'
                        ? renderHighlightedText(item.replies[0].content)
                        : item.replies[0].content}"
                    </span>
                  </div>
                )}
              </div>

              {/* Right Controls */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onOpenConversation(item)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${themeStyles.primaryAccent}`}
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open in Engine</span>
                </button>

                <button
                  type="button"
                  onClick={() => onExportConversation(item)}
                  title="Export to Document"
                  className={`p-2 rounded-xl border text-xs transition-all ${
                    isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteConversation(item.id)}
                  title="Delete"
                  className="p-2 rounded-xl border border-rose-500/20 text-rose-400 hover:bg-rose-500/10 text-xs transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}

      {/* Privacy Guarantee Box */}
      <div
        className={`p-4 rounded-2xl border text-xs flex items-start gap-3 ${
          isDark ? 'bg-slate-900/40 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}
      >
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div>
          <h4 className={`font-bold ${themeStyles.textPrimary}`}>Local Privacy Guarantee</h4>
          <p className="mt-0.5 leading-relaxed">
            All conversations and saved history are stored directly in your local browser sandbox
            (IndexedDB/localStorage). We never retain or sell conversational logs to third parties.
          </p>
        </div>
      </div>
    </div>
  );
};

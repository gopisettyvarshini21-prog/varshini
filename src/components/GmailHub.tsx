import React, { useState, useEffect } from 'react';
import {
  Mail,
  RefreshCw,
  Search,
  Send,
  FileEdit,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Inbox,
  User,
  Clock,
  ArrowRight,
  Copy,
  Check,
  RotateCw,
  X,
  PlusCircle,
  FilePlus,
} from 'lucide-react';
import { UserAuth, ReplyOption, PlatformId, AIModelPersona } from '../types';
import { getAccessToken, googleSignIn, googleSignInWithRedirect, subscribeAccessToken } from '../utils/auth';
import {
  listGmailMessages,
  createGmailDraft,
  sendGmailMessage,
  GmailMessageSummary,
  GmailSendDraftOptions,
} from '../utils/gmailUtils';

interface GmailHubProps {
  currentUser: UserAuth | null;
  onOpenAuthModal: () => void;
  onImportToEngine: (options: {
    subject: string;
    bodyText: string;
    sender: string;
  }) => void;
  isDark: boolean;
  themeStyles: any;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const GmailHub: React.FC<GmailHubProps> = ({
  currentUser,
  onOpenAuthModal,
  onImportToEngine,
  isDark,
  themeStyles,
  onShowToast,
}) => {
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Quick In-Hub Reply Generator
  const [quickTone, setQuickTone] = useState<string>('Professional');
  const [quickReplies, setQuickReplies] = useState<ReplyOption[]>([]);
  const [isGeneratingQuickReply, setIsGeneratingQuickReply] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Mutating Action Confirmation Modal (MANDATORY per Workspace Integration Guidelines)
  const [confirmModalOpen, setConfirmModalOpen] = useState<boolean>(false);
  const [modalActionType, setModalActionType] = useState<'send' | 'draft'>('send');
  const [modalDraftOptions, setModalDraftOptions] = useState<GmailSendDraftOptions>({
    to: '',
    subject: '',
    body: '',
  });
  const [isExecutingAction, setIsExecutingAction] = useState<boolean>(false);

  // Reactive access token check
  const [hasToken, setHasToken] = useState<boolean>(() => !!getAccessToken());

  useEffect(() => {
    setHasToken(!!getAccessToken());
    return subscribeAccessToken(setHasToken);
  }, []);

  const fetchInbox = async (queryToUse = searchQuery) => {
    if (!getAccessToken()) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const msgs = await listGmailMessages(12, queryToUse);
      setMessages(msgs);
      if (msgs.length > 0) {
        setSelectedMessage(msgs[0]);
      } else {
        setSelectedMessage(null);
      }
    } catch (err: any) {
      console.error('Failed to list Gmail messages:', err);
      setError(err.message || 'Could not fetch messages from Gmail API.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (hasToken) {
      fetchInbox();
    }
  }, [hasToken]);

  const handleSignInGoogle = async () => {
    try {
      setIsLoading(true);
      await googleSignIn();
      onShowToast('Connected to Google & Gmail successfully!', 'success');
      await fetchInbox();
    } catch (err: any) {
      if (err?.code === 'auth/popup-blocked') {
        onShowToast('Popup blocked. Switching to Google Redirect Sign-In...', 'info');
        await googleSignInWithRedirect().catch((e) =>
          onShowToast(`Redirect sign-in failed: ${e.message}`, 'error')
        );
      } else {
        onShowToast(`Failed to connect Google: ${err.message}`, 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Open confirmation modal for drafting or sending
  const requestSendOrDraft = (
    type: 'send' | 'draft',
    targetTo: string,
    targetSubject: string,
    targetBody: string,
    threadId?: string
  ) => {
    setModalActionType(type);
    setModalDraftOptions({
      to: targetTo,
      subject: targetSubject.startsWith('Re: ') ? targetSubject : `Re: ${targetSubject}`,
      body: targetBody,
      threadId,
    });
    setConfirmModalOpen(true);
  };

  const executeConfirmedAction = async () => {
    if (!modalDraftOptions.to.trim()) {
      onShowToast('Please provide a recipient email address.', 'error');
      return;
    }
    if (!modalDraftOptions.body.trim()) {
      onShowToast('Please provide email body content.', 'error');
      return;
    }

    setIsExecutingAction(true);
    try {
      if (modalActionType === 'send') {
        const result = await sendGmailMessage(modalDraftOptions);
        onShowToast(`Email sent via Gmail! (Message ID: ${result.id.slice(0, 8)})`, 'success');
      } else {
        const draft = await createGmailDraft(modalDraftOptions);
        onShowToast(`Draft saved in your Gmail! (Draft ID: ${draft.id.slice(0, 8)})`, 'success');
      }
      setConfirmModalOpen(false);
    } catch (err: any) {
      console.error(err);
      onShowToast(`Failed to ${modalActionType} email: ${err.message}`, 'error');
    } finally {
      setIsExecutingAction(false);
    }
  };

  // Quick In-Hub Reply Generation
  const handleQuickReplyGeneration = async () => {
    if (!selectedMessage) return;
    setIsGeneratingQuickReply(true);
    setQuickReplies([]);
    try {
      const res = await fetch('/api/generate-replies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatHistory: `From: ${selectedMessage.from}\nDate: ${selectedMessage.date}`,
          latestMessage: `${selectedMessage.subject}\n\n${selectedMessage.bodyText}`,
          platform: 'custom',
          relationship: 'Email Correspondent',
          purpose: 'Reply to professional email thread',
          language: 'Auto Detect',
          tones: [quickTone],
          emojiIntensity: 'Minimal Emojis',
          responseLength: 'Balanced',
          aiModel: 'gemini',
          includeHashtags: false,
          includeLinks: false,
        }),
      });

      const data = await res.json();
      if (data.replies && Array.isArray(data.replies)) {
        setQuickReplies(data.replies);
        onShowToast(`Generated ${data.replies.length} email replies in ${quickTone} tone.`, 'success');
      } else {
        throw new Error(data.error || 'Failed to generate replies');
      }
    } catch (err: any) {
      onShowToast(`Quick Reply error: ${err.message}`, 'error');
    } finally {
      setIsGeneratingQuickReply(false);
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast('Copied reply to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Parse recipient address from header e.g. "John Doe <john@company.com>" -> "john@company.com"
  const extractEmailAddress = (raw: string): string => {
    const match = raw.match(/<([^>]+)>/);
    if (match && match[1]) return match[1];
    if (raw.includes('@')) return raw.trim();
    return raw;
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold shadow-md shadow-red-500/20">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-xl font-black ${themeStyles.textPrimary}`}>
                Gmail Workspace Intelligence Hub
              </h2>
            </div>
          </div>
          <p className={`text-xs mt-1 ${themeStyles.textMuted}`}>
            Connect your Gmail inbox to analyze incoming threads, draft human-like email responses, and send replies securely.
          </p>
        </div>

        {/* Status / Connect Button */}
        <div className="flex items-center gap-2">
          {hasToken ? (
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Connected ({currentUser?.email || 'Google Account'})</span>
              </span>
              <button
                type="button"
                onClick={() => fetchInbox()}
                disabled={isLoading}
                className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                  isDark
                    ? 'border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200'
                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                }`}
                title="Refresh Inbox"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSignInGoogle}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-md shadow-red-500/20 transition-all"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Connect Google & Gmail</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Gmail Interface */}
      {!hasToken ? (
        /* Not connected state card */
        <div
          className={`p-8 sm:p-12 rounded-3xl border text-center transition-all ${
            isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="w-16 h-16 rounded-3xl bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8" />
          </div>
          <h3 className={`text-lg font-black ${themeStyles.textPrimary}`}>
            Connect Gmail to Enable Situational Email Intelligence
          </h3>
          <p className={`text-xs max-w-lg mx-auto mt-2 leading-relaxed ${themeStyles.textMuted}`}>
            Access your recent Gmail inbox, analyze complex email threads with Situation AI, draft high-impact replies with customizable tones, and send or save drafts in 1 click.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleSignInGoogle}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-lg shadow-red-600/25 transition-all"
            >
              {isLoading ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#fff"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#fff"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#fff"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#fff"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Sign In with Google to Authorize Gmail</span>
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-red-500 font-bold text-xs mb-1">1. Live Inbox Ingestion</div>
              <p className={`text-[11px] leading-relaxed ${themeStyles.textMuted}`}>
                Fetch real email threads directly from your inbox into Situation AI with one click.
              </p>
            </div>
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-blue-500 font-bold text-xs mb-1">2. AI Draft Creation</div>
              <p className={`text-[11px] leading-relaxed ${themeStyles.textMuted}`}>
                Save generated replies as Gmail drafts to review at your convenience inside mail.google.com.
              </p>
            </div>
            <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="text-emerald-500 font-bold text-xs mb-1">3. Confirmed Sending</div>
              <p className={`text-[11px] leading-relaxed ${themeStyles.textMuted}`}>
                Dispatch emails with mandatory explicit review confirmation to ensure 100% zero unintended sends.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Authenticated Gmail View */
        <div className="space-y-4">
          {/* Search & Query Bar */}
          <div
            className={`p-3 rounded-2xl border flex flex-wrap items-center justify-between gap-3 ${
              isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}
          >
            <div className="flex-1 min-w-[240px] relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search inbox (e.g. is:unread, from:boss, or keywords)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    fetchInbox(searchQuery);
                  }
                }}
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-red-500'
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-red-500'
                }`}
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchInbox(searchQuery)}
                disabled={isLoading}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-xs transition-all disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  fetchInbox('');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                  isDark
                    ? 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-800'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() =>
                  requestSendOrDraft(
                    'draft',
                    '',
                    'New Conversation',
                    'Hello,\n\nI wanted to reach out regarding...'
                  )
                }
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-white'
                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-900 shadow-xs'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>Compose New</span>
              </button>
            </div>
          </div>

          {error && (
            <div
              className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
                isDark ? 'bg-[#161B22] border-slate-700 border-l-4 border-l-rose-500 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => fetchInbox()}
                className="text-xs font-bold underline hover:no-underline shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* 2-Column Split: Messages List & Message Reader / AI Reply Hub */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left Column: Email Thread List (5 cols) */}
            <div className="lg:col-span-5 space-y-2">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className={`text-xs font-bold uppercase tracking-wider ${themeStyles.textSecondary}`}>
                  Inbox Threads ({messages.length})
                </span>
                {isLoading && (
                  <span className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
                    <RotateCw className="w-3 h-3 animate-spin" />
                    <span>Updating...</span>
                  </span>
                )}
              </div>

              {messages.length === 0 && !isLoading ? (
                <div
                  className={`p-8 rounded-2xl border text-center ${
                    isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-400 opacity-60" />
                  <p className={`text-xs font-bold ${themeStyles.textPrimary}`}>No emails found</p>
                  <p className={`text-[11px] mt-1 ${themeStyles.textMuted}`}>
                    Try clearing your search query or check back later.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
                  {messages.map((msg) => {
                    const isSelected = selectedMessage?.id === msg.id;
                    return (
                      <div
                        key={msg.id}
                        onClick={() => setSelectedMessage(msg)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? isDark
                              ? 'bg-slate-800/90 border-red-500 shadow-md ring-1 ring-red-500/40'
                              : 'bg-red-50/50 border-red-500 shadow-md ring-1 ring-red-400'
                            : isDark
                            ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {msg.unread && (
                              <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" title="Unread" />
                            )}
                            <span className={`text-xs font-bold truncate ${themeStyles.textPrimary}`}>
                              {msg.from.split('<')[0].replace(/"/g, '') || msg.from}
                            </span>
                          </div>
                          <span className={`text-[10px] shrink-0 ${themeStyles.textMuted}`}>
                            {msg.date.split(',')[0]}
                          </span>
                        </div>

                        <h4 className={`text-xs font-semibold truncate mb-1 ${themeStyles.textPrimary}`}>
                          {msg.subject || '(No Subject)'}
                        </h4>

                        <p className={`text-[11px] line-clamp-2 leading-relaxed ${themeStyles.textMuted}`}>
                          {msg.snippet || msg.bodyText}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Detailed Reader & AI Reply Generation (7 cols) */}
            <div className="lg:col-span-7">
              {selectedMessage ? (
                <div
                  className={`p-5 rounded-2xl border space-y-4 ${
                    isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}
                >
                  {/* Subject & Meta */}
                  <div className={`pb-3 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <h3 className={`text-base font-black ${themeStyles.textPrimary}`}>
                        {selectedMessage.subject || '(No Subject)'}
                      </h3>
                      {selectedMessage.unread && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                          Unread
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                      <div>
                        <span className={themeStyles.textMuted}>From: </span>
                        <span className={`font-semibold ${themeStyles.textPrimary}`}>{selectedMessage.from}</span>
                      </div>
                      <div>
                        <span className={themeStyles.textMuted}>To: </span>
                        <span className={`font-semibold ${themeStyles.textPrimary}`}>{selectedMessage.to || 'Me'}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className={themeStyles.textMuted}>Date: </span>
                        <span className={themeStyles.textSecondary}>{selectedMessage.date}</span>
                      </div>
                    </div>
                  </div>

                  {/* Body Preview */}
                  <div>
                    <label className={`text-[10px] font-bold uppercase tracking-wider block mb-1.5 ${themeStyles.textMuted}`}>
                      Email Body Content
                    </label>
                    <div
                      className={`p-4 rounded-xl border text-xs leading-relaxed max-h-56 overflow-y-auto whitespace-pre-wrap ${
                        isDark ? 'bg-slate-950/80 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {selectedMessage.bodyText || selectedMessage.snippet || '(Empty email body)'}
                    </div>
                  </div>

                  {/* Action Bar */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                    {/* Primary Button: Load into full Situation AI Engine */}
                    <button
                      type="button"
                      onClick={() => {
                        const targetSender = extractEmailAddress(selectedMessage.from);
                        onImportToEngine({
                          subject: selectedMessage.subject,
                          bodyText: selectedMessage.bodyText || selectedMessage.snippet,
                          sender: targetSender,
                        });
                        onShowToast('Loaded into Situation AI Reply Engine!', 'success');
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>⚡ Open in Full Situation Engine</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          requestSendOrDraft(
                            'draft',
                            extractEmailAddress(selectedMessage.from),
                            selectedMessage.subject,
                            `Hello,\n\nThank you for reaching out.\n\nBest regards,\n${currentUser?.name || ''}`,
                            selectedMessage.threadId
                          )
                        }
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
                          isDark
                            ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                            : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <FileEdit className="w-3.5 h-3.5 text-amber-500" />
                        <span>Save Custom Draft</span>
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          requestSendOrDraft(
                            'send',
                            extractEmailAddress(selectedMessage.from),
                            selectedMessage.subject,
                            `Hello,\n\nThank you for your message.\n\nBest regards,\n${currentUser?.name || ''}`,
                            selectedMessage.threadId
                          )
                        }
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 shadow-xs transition-all"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Direct Reply</span>
                      </button>
                    </div>
                  </div>

                  {/* Quick In-Hub Reply Assistant */}
                  <div
                    className={`mt-4 p-4 rounded-2xl border space-y-3 ${
                      isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-red-500" />
                        <h4 className={`text-xs font-bold ${themeStyles.textPrimary}`}>
                          Quick Email Response Assistant
                        </h4>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] ${themeStyles.textMuted}`}>Tone:</span>
                        <select
                          value={quickTone}
                          onChange={(e) => setQuickTone(e.target.value)}
                          className={`text-xs py-1 px-2 rounded-lg border font-semibold ${
                            isDark
                              ? 'bg-slate-800 border-slate-700 text-slate-200'
                              : 'bg-white border-slate-300 text-slate-800'
                          }`}
                        >
                          <option value="Professional">Professional</option>
                          <option value="Friendly">Friendly</option>
                          <option value="Concise">Concise & Direct</option>
                          <option value="Polite Decline">Polite Decline</option>
                          <option value="Appreciative">Appreciative</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={isGeneratingQuickReply}
                      onClick={handleQuickReplyGeneration}
                      className="w-full py-2 px-3 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-500 transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
                    >
                      {isGeneratingQuickReply ? (
                        <>
                          <RotateCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Generating AI email replies...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Generate 3 Quick Email Replies</span>
                        </>
                      )}
                    </button>

                    {/* Quick Generated Replies List */}
                    {quickReplies.length > 0 && (
                      <div className="space-y-2 pt-2">
                        {quickReplies.map((reply, idx) => (
                          <div
                            key={reply.id}
                            className={`p-3 rounded-xl border space-y-2 transition-all ${
                              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-bold uppercase tracking-wider text-red-500">
                                Option {idx + 1}: {reply.styleLabel}
                              </span>
                              <span className="text-emerald-400 font-semibold">{reply.matchScore}% Match</span>
                            </div>

                            <p className={`text-xs leading-relaxed ${themeStyles.textPrimary}`}>
                              "{reply.content}"
                            </p>

                            <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-700/20">
                              <button
                                type="button"
                                onClick={() => handleCopyText(reply.id, reply.content)}
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                                  copiedId === reply.id
                                    ? 'bg-emerald-500 text-white'
                                    : isDark
                                    ? 'border-slate-700 hover:bg-slate-800 text-slate-300'
                                    : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                {copiedId === reply.id ? (
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

                              <button
                                type="button"
                                onClick={() =>
                                  requestSendOrDraft(
                                    'draft',
                                    extractEmailAddress(selectedMessage.from),
                                    selectedMessage.subject,
                                    reply.content,
                                    selectedMessage.threadId
                                  )
                                }
                                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                                  isDark
                                    ? 'border-slate-700 hover:bg-slate-800 text-amber-400'
                                    : 'border-slate-200 hover:bg-slate-100 text-amber-600'
                                }`}
                              >
                                <FilePlus className="w-3 h-3" />
                                <span>Save Draft</span>
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  requestSendOrDraft(
                                    'send',
                                    extractEmailAddress(selectedMessage.from),
                                    selectedMessage.subject,
                                    reply.content,
                                    selectedMessage.threadId
                                  )
                                }
                                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white bg-red-600 hover:bg-red-500 shadow-xs"
                              >
                                <Send className="w-3 h-3" />
                                <span>Send via Gmail</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className={`p-10 rounded-2xl border text-center ${
                    isDark ? 'bg-slate-900/30 border-slate-800' : 'bg-white border-slate-200'
                  }`}
                >
                  <Mail className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                  <p className={`text-xs font-bold ${themeStyles.textPrimary}`}>
                    Select an email thread from the inbox to read and generate replies
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Explicit Confirmation Modal for Mutating Email Actions (Sending & Drafting) */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => {
              if (!isExecutingAction) setConfirmModalOpen(false);
            }}
          />
          <div
            className={`relative w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all z-10 ${
              isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-700/40 mb-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-white ${
                    modalActionType === 'send' ? 'bg-red-600' : 'bg-amber-600'
                  }`}
                >
                  {modalActionType === 'send' ? <Send className="w-4 h-4" /> : <FileEdit className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className={`text-sm font-black ${themeStyles.textPrimary}`}>
                    {modalActionType === 'send'
                      ? 'Confirm Dispatch via Gmail'
                      : 'Confirm Saving Gmail Draft'}
                  </h3>
                  <p className={`text-[11px] ${themeStyles.textMuted}`}>
                    {modalActionType === 'send'
                      ? 'Review recipient and email content before sending'
                      : 'Review draft details before saving to your Gmail account'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                disabled={isExecutingAction}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className={`block text-[11px] font-bold mb-1 ${themeStyles.textSecondary}`}>
                  Recipient (To:)
                </label>
                <input
                  type="email"
                  value={modalDraftOptions.to}
                  onChange={(e) =>
                    setModalDraftOptions((prev) => ({ ...prev, to: e.target.value }))
                  }
                  placeholder="recipient@example.com"
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-bold mb-1 ${themeStyles.textSecondary}`}>
                  Subject Line
                </label>
                <input
                  type="text"
                  value={modalDraftOptions.subject}
                  onChange={(e) =>
                    setModalDraftOptions((prev) => ({ ...prev, subject: e.target.value }))
                  }
                  className={`w-full px-3 py-2 rounded-xl border text-xs focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-[11px] font-bold mb-1 ${themeStyles.textSecondary}`}>
                  Email Body
                </label>
                <textarea
                  rows={6}
                  value={modalDraftOptions.body}
                  onChange={(e) =>
                    setModalDraftOptions((prev) => ({ ...prev, body: e.target.value }))
                  }
                  className={`w-full p-3 rounded-xl border text-xs leading-relaxed focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div
                className={`p-2.5 rounded-xl border text-[11px] flex items-center gap-2 ${
                  isDark ? 'bg-[#161B22] border-slate-700 text-slate-300' : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <span>
                  {modalActionType === 'send'
                    ? 'This will immediately dispatch the message from your authorized Gmail address.'
                    : 'This will add a draft into your Gmail account without sending.'}
                </span>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isExecutingAction}
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isExecutingAction}
                onClick={executeConfirmedAction}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all ${
                  modalActionType === 'send'
                    ? 'bg-red-600 hover:bg-red-500 shadow-red-600/30'
                    : 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                } disabled:opacity-50`}
              >
                {isExecutingAction ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    {modalActionType === 'send' ? <Send className="w-3.5 h-3.5" /> : <FileEdit className="w-3.5 h-3.5" />}
                    <span>{modalActionType === 'send' ? 'Confirm & Send Email' : 'Confirm & Save Draft'}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

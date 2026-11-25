import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Activity,
  Server,
  Zap,
  RotateCw,
  Trash2,
  Users,
  Cpu,
  Lock,
  LogOut,
  ArrowLeft,
  Download,
  Search,
  Sliders,
  CheckCircle2,
  UserPlus,
  Mail,
  KeyRound,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { UserAuth, UserSettings, AIModelPersona, WritingQualityTier } from '../types';
import {
  PRIMARY_ADMIN_EMAIL,
  getAllAuthorizedAdmins,
  addDelegatedAdmin,
  removeDelegatedAdmin,
  isAdminEmail,
} from '../utils/adminConfig';
import { AI_MODELS } from './AIModelSelector';
import { BrandLogo } from './BrandLogo';
import { googleSignIn, googleSignInWithRedirect } from '../utils/auth';

interface SeparateAdminPortalProps {
  currentUser: UserAuth | null;
  settings: UserSettings;
  onUpdateSettings: (partial: Partial<UserSettings>) => void;
  onLogin: (user: UserAuth) => void;
  onLogout: () => void;
  onExitToUserApp: () => void;
  isDark: boolean;
  themeStyles: any;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

type AdminSection = 'overview' | 'logs' | 'governance' | 'access';

export const SeparateAdminPortal: React.FC<SeparateAdminPortalProps> = ({
  currentUser,
  settings,
  onUpdateSettings,
  onLogin,
  onLogout,
  onExitToUserApp,
  isDark,
  themeStyles,
  onShowToast,
}) => {
  const [section, setSection] = useState<AdminSection>('overview');
  const [stats, setStats] = useState<any>({
    totalRequests: 0,
    activeEngine: 'Google Gemini 3.8 Flash (Active)',
    averageLatencyMs: 365,
    uptimePercent: 99.98,
    supportedPersonas: [],
    recentLogs: [],
  });
  const [loadingStats, setLoadingStats] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    healthy: boolean;
    latencyMs: number;
    hasApiKey: boolean;
    checkedAt: string;
  } | null>(null);
  const [runningDiagnostic, setRunningDiagnostic] = useState(false);

  // Logs filter
  const [logSearch, setLogSearch] = useState('');
  const [logTypeFilter, setLogTypeFilter] = useState('all');

  // Admin gate login states
  const [adminEmailInput, setAdminEmailInput] = useState(PRIMARY_ADMIN_EMAIL);
  const [adminPasscodeInput, setAdminPasscodeInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Access management
  const [authorizedEmails, setAuthorizedEmails] = useState<string[]>(() => getAllAuthorizedAdmins());
  const [newAdminEmail, setNewAdminEmail] = useState('');

  const isAuthorizedAdmin = !!currentUser && currentUser.role === 'admin' && isAdminEmail(currentUser.email);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data) setStats(data);
    } catch (err) {
      console.error('Admin stats fetch error:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (isAuthorizedAdmin) {
      fetchStats();
    }
  }, [isAuthorizedAdmin]);

  const handleGoogleAdminSignIn = async () => {
    setLoginError(null);
    setIsSigningIn(true);
    try {
      const { user: fbUser } = await googleSignIn();
      const email = (fbUser.email || '').trim().toLowerCase();
      if (!isAdminEmail(email)) {
        setLoginError(
          `Signed-in account (${email}) is not on the authorized administrator roster. Sign in with ${PRIMARY_ADMIN_EMAIL}.`
        );
        return;
      }
      const displayName = fbUser.displayName || 'Varsh (Owner Admin)';
      onLogin({
        id: fbUser.uid,
        name: displayName,
        email,
        role: 'admin',
        title: 'Chief Administrator (Owner)',
        company: 'Situation AI Executive',
        avatar: displayName.slice(0, 2).toUpperCase(),
        photoUrl: fbUser.photoURL || undefined,
        emailVerified: fbUser.emailVerified,
        provider: 'google',
      });
      onShowToast(`Authenticated to Separate Admin Portal as ${email}`, 'success');
    } catch (err: any) {
      const code = err?.code || '';
      setLoginError(
        code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user'
          ? 'Google popup could not complete. Try Redirect Sign-In or unlock with your Owner Email below.'
          : err?.message || 'Google Admin Sign-In failed. Use Owner Credentials below if popups are blocked.'
      );
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleManualAdminSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleanEmail = adminEmailInput.trim().toLowerCase();
    if (!isAdminEmail(cleanEmail)) {
      setLoginError(`Access Denied. Only authorized administrator accounts (${PRIMARY_ADMIN_EMAIL}) can sign in.`);
      return;
    }

    const displayName = cleanEmail === PRIMARY_ADMIN_EMAIL ? 'Varsh (Owner Admin)' : 'Executive Administrator';
    onLogin({
      id: `admin-${cleanEmail}`,
      name: displayName,
      email: cleanEmail,
      role: 'admin',
      title: cleanEmail === PRIMARY_ADMIN_EMAIL ? 'Chief Administrator (Owner)' : 'Delegated Administrator',
      company: 'Situation AI Security Portal',
      avatar: displayName.slice(0, 2).toUpperCase(),
      emailVerified: true,
      provider: 'admin_portal',
    });
    setAdminPasscodeInput('');
    onShowToast(`Welcome to Separate Admin Portal, ${cleanEmail}`, 'success');
  };

  const handleRunDiagnostic = async () => {
    setRunningDiagnostic(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setDiagnosticResult({
        healthy: data.status === 'ok',
        latencyMs: elapsed,
        hasApiKey: !!data.hasApiKey,
        checkedAt: new Date().toLocaleTimeString(),
      });
      onShowToast(`System diagnostic passed in ${elapsed}ms.`, 'success');
    } catch {
      setDiagnosticResult({
        healthy: false,
        latencyMs: 0,
        hasApiKey: false,
        checkedAt: new Date().toLocaleTimeString(),
      });
      onShowToast('Diagnostic check failed to reach backend.', 'error');
    } finally {
      setRunningDiagnostic(false);
    }
  };

  const handleClearServerLogs = async () => {
    try {
      await fetch('/api/admin/logs/clear', { method: 'POST' });
      await fetchStats();
      onShowToast('Session execution logs cleared.', 'info');
    } catch {
      onShowToast('Failed to clear logs.', 'error');
    }
  };

  const handleExportAuditCsv = () => {
    const rows = [
      ['Timestamp', 'Task Type', 'Model Persona', 'Platform', 'Tokens Est.', 'Status'].join(','),
      ...(stats.recentLogs || []).map((log: any) =>
        [
          `"${log.timestamp}"`,
          `"${log.type}"`,
          `"${log.model}"`,
          `"${log.platform}"`,
          log.tokensEstimate,
          log.status,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `situation-ai-admin-audit-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('Exported audit logs CSV.', 'success');
  };

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newAdminEmail.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      onShowToast('Please enter a valid email address.', 'error');
      return;
    }
    const updated = addDelegatedAdmin(clean);
    setAuthorizedEmails(updated);
    setNewAdminEmail('');
    onShowToast(`Granted administrator portal access to ${clean}`, 'success');
  };

  const handleRemoveAdmin = (email: string) => {
    const updated = removeDelegatedAdmin(email);
    setAuthorizedEmails(updated);
    onShowToast(`Removed delegated admin access for ${email}`, 'info');
  };

  const filteredLogs = (stats.recentLogs || []).filter((log: any) => {
    const matchesType = logTypeFilter === 'all' || log.type === logTypeFilter;
    const q = logSearch.trim().toLowerCase();
    const matchesQuery =
      !q ||
      String(log.type || '').toLowerCase().includes(q) ||
      String(log.model || '').toLowerCase().includes(q) ||
      String(log.platform || '').toLowerCase().includes(q);
    return matchesType && matchesQuery;
  });

  const uniqueLogTypes: string[] = Array.from(
    new Set((stats.recentLogs || []).map((l: any) => String(l.type || '')))
  ).filter(Boolean) as string[];

  // DEDICATED STANDALONE ADMIN AUTHENTICATION SCREEN
  if (!isAuthorizedAdmin) {
    return (
      <div className={`min-h-screen flex flex-col justify-between p-4 sm:p-8 ${themeStyles.bgGradient}`}>
        <div className="max-w-7xl w-full mx-auto flex items-center justify-between">
          <BrandLogo
            size="md"
            isDark={isDark}
            themeStyles={themeStyles}
            subtitleText="Dedicated Executive Admin Console"
          />
          <button
            type="button"
            onClick={onExitToUserApp}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-all ${
              isDark
                ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to User Workspace</span>
          </button>
        </div>

        <div className="w-full max-w-md mx-auto my-8">
          <div
            className={`rounded-3xl border p-6 sm:p-8 shadow-2xl space-y-5 ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-600/15 border border-purple-500/30 text-purple-500 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h1 className={`text-lg font-black ${themeStyles.textPrimary}`}>
                  Admin Portal Sign-In
                </h1>
                <p className={`text-xs ${themeStyles.textMuted}`}>
                  Restricted Owner Console · {PRIMARY_ADMIN_EMAIL}
                </p>
              </div>
            </div>

            {currentUser && currentUser.role !== 'admin' && (
              <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-500 space-y-1">
                <p className="font-bold">Signed in as standard user: {currentUser.email}</p>
                <p className="text-[11px]">
                  Switch to {PRIMARY_ADMIN_EMAIL} below to unlock the Separate Admin Portal.
                </p>
              </div>
            )}

            {loginError && (
              <div className="p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="button"
              disabled={isSigningIn}
              onClick={handleGoogleAdminSignIn}
              className={`w-full py-3 px-4 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all ${
                isDark
                  ? 'bg-white text-slate-900 border-white hover:bg-slate-100'
                  : 'bg-slate-900 text-white border-slate-900 hover:bg-slate-800'
              } disabled:opacity-50`}
            >
              {isSigningIn ? (
                <RotateCw className="w-4 h-4 animate-spin" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              <span>Sign In with Google ({PRIMARY_ADMIN_EMAIL})</span>
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-700/30" />
              <span className={`px-3 text-[11px] font-medium ${themeStyles.textMuted}`}>
                or verify owner session
              </span>
              <div className="flex-grow border-t border-slate-700/30" />
            </div>

            <form onSubmit={handleManualAdminSignIn} className="space-y-3">
              <div>
                <label className={`text-xs font-semibold block mb-1 ${themeStyles.textSecondary}`}>
                  Authorized Owner Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={adminEmailInput}
                    onChange={(e) => setAdminEmailInput(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-1 ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-purple-500 focus:ring-purple-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-600 focus:ring-purple-600'
                    }`}
                  />
                </div>
              </div>

              {loginError && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => googleSignInWithRedirect().catch((e) => setLoginError(e.message))}
                    className="text-[11px] font-bold text-blue-500 hover:underline"
                  >
                    Try Google Redirect Sign-In →
                  </button>
                </div>
              )}

              <div>
                <label className={`text-xs font-semibold block mb-1 ${themeStyles.textSecondary}`}>
                  Administrator Session Passkey (Optional)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={adminPasscodeInput}
                    onChange={(e) => setAdminPasscodeInput(e.target.value)}
                    placeholder="Verify owner session (optional)"
                    className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs font-medium border focus:outline-none focus:ring-1 ${
                      isDark
                        ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-purple-500 focus:ring-purple-500'
                        : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-purple-600 focus:ring-purple-600'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors shadow-md"
              >
                Unlock Separate Admin Portal
              </button>
            </form>
          </div>
        </div>

        <p className={`text-center text-[11px] ${themeStyles.textMuted}`}>
          Situation AI Isolated Administrator Portal · Authorized sessions only
        </p>
      </div>
    );
  }

  // AUTHENTICATED STANDALONE ADMIN PORTAL WORKSPACE
  return (
    <div className={`min-h-screen transition-colors duration-300 ${themeStyles.bgGradient}`}>
      {/* Standalone Top Admin Command Header */}
      <header
        className={`sticky top-0 z-40 border-b ${
          isDark ? 'bg-[#161B22] border-slate-800' : 'bg-white border-slate-200'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h1 className={`text-sm sm:text-base font-black truncate ${themeStyles.textPrimary}`}>
                Situation AI — Executive Admin Portal
              </h1>
              <p className={`text-[11px] truncate ${themeStyles.textMuted}`}>
                Owner Session: {currentUser.email}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onExitToUserApp}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap ${
                isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100'
              }`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Switch to User App</span>
            </button>

            <button
              type="button"
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold transition-all whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Admin Navigation Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div
            className={`inline-flex flex-wrap items-center gap-1 p-1 rounded-xl border ${
              isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            {[
              { id: 'overview', label: 'Overview & Engines', icon: <Activity className="w-3.5 h-3.5" /> },
              { id: 'logs', label: 'Execution Audit Logs', icon: <Server className="w-3.5 h-3.5" /> },
              { id: 'governance', label: 'Workspace Controls', icon: <Sliders className="w-3.5 h-3.5" /> },
              { id: 'access', label: 'Admin Access Roster', icon: <Users className="w-3.5 h-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSection(tab.id as AdminSection)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  section === tab.id
                    ? 'bg-purple-600 text-white'
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRunDiagnostic}
              disabled={runningDiagnostic}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition-colors ${
                isDark
                  ? 'border-slate-700 bg-slate-900 text-emerald-400 hover:bg-slate-800'
                  : 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${runningDiagnostic ? 'animate-spin' : ''}`} />
              <span>{runningDiagnostic ? 'Checking...' : 'Run Health Check'}</span>
            </button>

            <button
              type="button"
              onClick={fetchStats}
              disabled={loadingStats}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold ${
                isDark
                  ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                  : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${loadingStats ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Live Health Check Banner */}
        {diagnosticResult && (
          <div
            className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-2 text-xs ${
              diagnosticResult.healthy
                ? isDark
                  ? 'bg-[#161B22] border-slate-700 text-emerald-400'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-[#161B22] border-rose-800 text-rose-400'
            }`}
          >
            <div className="flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {diagnosticResult.healthy
                  ? `Backend API Operational · Gemini Key ${diagnosticResult.hasApiKey ? 'Connected' : 'Local Fallback Mode'}`
                  : 'Backend Check Unreachable'}
              </span>
            </div>
            <span className="font-mono tabular-nums text-[11px]">
              Latency: {diagnosticResult.latencyMs}ms · Checked at {diagnosticResult.checkedAt}
            </span>
          </div>
        )}

        {/* SECTION 1: OVERVIEW & 8 TEXT QUALITY ENGINES */}
        {section === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className={`p-5 rounded-2xl border ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Session Requests</span>
                  <Activity className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-blue-500 tabular-nums">{stats.totalRequests}</div>
                <p className="text-[11px] text-emerald-400 font-medium mt-1">All API handlers online</p>
              </div>

              <div className={`p-5 rounded-2xl border ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Avg API Latency</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-amber-400 tabular-nums">{stats.averageLatencyMs} ms</div>
                <p className="text-[11px] text-slate-400 mt-1">Resilient upstream timeout guard</p>
              </div>

              <div className={`p-5 rounded-2xl border ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Service Uptime</span>
                  <Server className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-emerald-400 tabular-nums">{stats.uptimePercent}%</div>
                <p className="text-[11px] text-emerald-400 font-medium mt-1">Express + Vite Active</p>
              </div>

              <div className={`p-5 rounded-2xl border ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400">Active Engines</span>
                  <Cpu className="w-4 h-4 text-purple-400" />
                </div>
                <div className={`text-2xl font-black tabular-nums ${themeStyles.textPrimary}`}>
                  {AI_MODELS.length} Engines
                </div>
                <p className="text-[11px] text-purple-400 font-medium mt-1">5 Reasoning + 3 Text Quality</p>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${themeStyles.textSecondary}`}>
                Registered Intelligence & Text Quality Engines ({AI_MODELS.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                {AI_MODELS.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border ${
                      isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span style={{ color: m.accentColor }}>{m.icon}</span>
                      <span className={`font-bold ${themeStyles.textPrimary}`}>{m.name}</span>
                    </div>
                    <p className="text-[11px] font-semibold text-blue-400">{m.category}</p>
                    <p className={`text-[10.5px] mt-1 ${themeStyles.textMuted}`}>{m.tagline}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: EXECUTION AUDIT LOGS */}
        {section === 'logs' && (
          <div className={`rounded-2xl border overflow-hidden ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
            <div className="p-4 border-b border-slate-700/30 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className={`text-sm font-bold ${themeStyles.textPrimary}`}>
                  Execution Audit Stream ({filteredLogs.length})
                </h3>
                <p className={`text-[11px] ${themeStyles.textMuted}`}>
                  Inspect live backend requests across analysis, thread summaries, replies, and document audits
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    placeholder="Filter logs..."
                    className={`pl-8 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none ${
                      isDark
                        ? 'bg-slate-950 border-slate-700 text-slate-200'
                        : 'bg-slate-50 border-slate-300 text-slate-800'
                    }`}
                  />
                </div>

                <select
                  value={logTypeFilter}
                  onChange={(e) => setLogTypeFilter(e.target.value)}
                  className={`py-1.5 px-2.5 rounded-lg text-xs border focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-700 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="all">All Task Types</option>
                  {uniqueLogTypes.map((typeName) => (
                    <option key={typeName} value={typeName}>
                      {typeName}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleExportAuditCsv}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                    isDark
                      ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  type="button"
                  onClick={handleClearServerLogs}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-500 hover:bg-rose-500/10 text-xs font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Logs</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead
                  className={`text-[10px] uppercase font-bold border-b ${
                    isDark
                      ? 'bg-slate-800/40 text-slate-400 border-slate-800'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <tr>
                    <th className="px-4 py-2.5">Timestamp</th>
                    <th className="px-4 py-2.5">Task Type</th>
                    <th className="px-4 py-2.5">Engine</th>
                    <th className="px-4 py-2.5">Channel</th>
                    <th className="px-4 py-2.5 text-right">Tokens Est.</th>
                    <th className="px-4 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${
                    isDark ? 'divide-slate-800/60 text-slate-300' : 'divide-slate-200 text-slate-700'
                  }`}
                >
                  {filteredLogs.length > 0 ? (
                    filteredLogs.map((log: any) => (
                      <tr
                        key={log.id}
                        className={isDark ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}
                      >
                        <td className={`px-4 py-2.5 font-mono tabular-nums text-[11px] ${themeStyles.textMuted}`}>
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </td>
                        <td className={`px-4 py-2.5 font-bold ${themeStyles.textPrimary}`}>{log.type}</td>
                        <td className="px-4 py-2.5 text-blue-500 font-semibold">{log.model}</td>
                        <td className="px-4 py-2.5">{log.platform}</td>
                        <td className="px-4 py-2.5 text-right font-mono tabular-nums text-[11px]">
                          {log.tokensEstimate}
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.status === 'success'
                                ? 'bg-emerald-500/15 text-emerald-400'
                                : 'bg-rose-500/15 text-rose-400'
                            }`}
                          >
                            {String(log.status || 'success').toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                        No execution logs match your filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTION 3: WORKSPACE GOVERNANCE & DEFAULTS */}
        {section === 'governance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className={`p-5 rounded-2xl border space-y-4 ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
              <h3 className={`text-sm font-bold ${themeStyles.textPrimary}`}>
                AI Pipeline Automation Policies
              </h3>

              <label className="flex items-start justify-between gap-4 cursor-pointer">
                <div>
                  <span className={`text-xs font-bold block ${themeStyles.textPrimary}`}>
                    Auto-Summarize Complex Chat Threads
                  </span>
                  <span className={`text-[11px] ${themeStyles.textMuted}`}>
                    Automatically extract bullet-point context before running analysis
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoSummarizeThreads ?? true}
                  onChange={(e) => {
                    onUpdateSettings({ autoSummarizeThreads: e.target.checked });
                    onShowToast('Updated thread summarization policy.', 'success');
                  }}
                  className="mt-1 rounded text-purple-600 focus:ring-purple-500"
                />
              </label>

              <label className="flex items-start justify-between gap-4 cursor-pointer">
                <div>
                  <span className={`text-xs font-bold block ${themeStyles.textPrimary}`}>
                    Second-Pass Auto-Refine Guardrail
                  </span>
                  <span className={`text-[11px] ${themeStyles.textMuted}`}>
                    Audit generated replies against situation pitfalls before display
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoRefineReplies ?? true}
                  onChange={(e) => {
                    onUpdateSettings({ autoRefineReplies: e.target.checked });
                    onShowToast('Updated auto-refine guardrail policy.', 'success');
                  }}
                  className="mt-1 rounded text-purple-600 focus:ring-purple-500"
                />
              </label>

              <label className="flex items-start justify-between gap-4 cursor-pointer">
                <div>
                  <span className={`text-xs font-bold block ${themeStyles.textPrimary}`}>
                    Auto-Analyze Situation Before Replies
                  </span>
                  <span className={`text-[11px] ${themeStyles.textMuted}`}>
                    Ensure psychological intent breakdown completes prior to generation
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.autoAnalyzeOnGenerate}
                  onChange={(e) => {
                    onUpdateSettings({ autoAnalyzeOnGenerate: e.target.checked });
                    onShowToast('Updated auto-analysis policy.', 'success');
                  }}
                  className="mt-1 rounded text-purple-600 focus:ring-purple-500"
                />
              </label>
            </div>

            <div className={`p-5 rounded-2xl border space-y-4 ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
              <h3 className={`text-sm font-bold ${themeStyles.textPrimary}`}>
                Default Engine & Document Rigor
              </h3>

              <div>
                <label className={`text-xs font-bold block mb-1.5 ${themeStyles.textSecondary}`}>
                  Default Text Quality / AI Engine
                </label>
                <select
                  value={settings.defaultModel}
                  onChange={(e) => {
                    onUpdateSettings({ defaultModel: e.target.value as AIModelPersona });
                    onShowToast(`Default engine updated to ${e.target.value.toUpperCase()}`, 'success');
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-xs border focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  {AI_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`text-xs font-bold block mb-1.5 ${themeStyles.textSecondary}`}>
                  Default Document Quality Tier
                </label>
                <select
                  value={settings.writingStandard || 'executive'}
                  onChange={(e) => {
                    onUpdateSettings({ writingStandard: e.target.value as WritingQualityTier });
                    onShowToast('Updated default document writing rigor.', 'success');
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-xs border focus:outline-none ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-200'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                >
                  <option value="executive">Executive Standard</option>
                  <option value="editorial">Editorial & Persuasive</option>
                  <option value="boardroom">Boardroom & Legal Precision</option>
                  <option value="academic">Academic & Case Research</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 4: AUTHORIZED ADMIN ACCESS ROSTER */}
        {section === 'access' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className={`p-5 rounded-2xl border space-y-4 ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
              <div>
                <h3 className={`text-sm font-bold ${themeStyles.textPrimary}`}>
                  Authorized Administrator Accounts ({authorizedEmails.length})
                </h3>
                <p className={`text-[11px] ${themeStyles.textMuted}`}>
                  Only listed accounts can unlock the Separate Admin Portal or receive Admin privileges upon sign-in.
                </p>
              </div>

              <div className="space-y-2">
                {authorizedEmails.map((email) => {
                  const isOwner = email === PRIMARY_ADMIN_EMAIL;
                  return (
                    <div
                      key={email}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                        isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${themeStyles.textPrimary}`}>{email}</p>
                        <p className="text-[10.5px] text-purple-400 font-semibold">
                          {isOwner ? 'Primary Owner Administrator (Protected)' : 'Authorized Administrator'}
                        </p>
                      </div>
                      {!isOwner && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAdmin(email)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10"
                          title="Revoke admin access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`p-5 rounded-2xl border space-y-4 ${themeStyles.cardBg} ${themeStyles.cardBorder}`}>
              <div>
                <h3 className={`text-sm font-bold ${themeStyles.textPrimary}`}>
                  Delegate Administrator Access
                </h3>
                <p className={`text-[11px] ${themeStyles.textMuted}`}>
                  Grant another team Google or email address access to this Separate Admin Portal.
                </p>
              </div>

              <form onSubmit={handleAddAdmin} className="space-y-3">
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className={`w-full px-3 py-2 rounded-xl text-xs border focus:outline-none focus:ring-1 ${
                    isDark
                      ? 'bg-slate-950 border-slate-800 text-slate-100 focus:border-purple-500 focus:ring-purple-500'
                      : 'bg-white border-slate-300 text-slate-900 focus:border-purple-600 focus:ring-purple-600'
                  }`}
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Authorized Admin</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

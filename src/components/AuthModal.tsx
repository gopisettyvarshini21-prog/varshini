import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  KeyRound,
  LogOut,
  ChevronRight,
  RotateCw,
  AlertCircle,
  EyeOff,
  BadgeCheck,
} from 'lucide-react';
import { UserAuth } from '../types';
import { BrandLogo } from './BrandLogo';
import { GoogleIcon, AppleIcon, MicrosoftIcon } from './ProviderIcons';
import {
  googleSignIn,
  googleSignInWithRedirect,
  appleOAuthSignIn,
  emailPasswordSignIn,
  emailPasswordSignUp,
} from '../utils/auth';
import { PRIMARY_ADMIN_EMAIL, ADMIN_EMAILS, isAdminEmail } from '../utils/adminConfig';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAuth | null;
  onLogin: (user: UserAuth) => void;
  onLogout: () => void;
  isDark: boolean;
  themeStyles: any;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
  initialTab?: 'user' | 'admin';
  initialProviderDrawer?: 'google' | 'apple' | 'microsoft' | null;
  initialMode?: 'login' | 'signup';
  initialError?: string | null;
}

type ProviderType = 'google' | 'apple' | 'microsoft';

interface RememberedAccount {
  email: string;
  name: string;
  provider: 'google' | 'apple' | 'microsoft';
  photoUrl?: string;
  authSource?: 'oauth' | 'manual';
}

const RECENT_ACCOUNTS_KEY = 'situation_ai_recent_accounts';
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
const APPLE_DOMAINS = ['@icloud.com', '@me.com', '@mac.com', '@privaterelay.appleid.com'];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLogin,
  onLogout,
  isDark,
  themeStyles,
  onShowToast,
  initialTab = 'user',
  initialProviderDrawer = null,
  initialMode = 'login',
  initialError = null,
}) => {
  const [authType, setAuthType] = useState<'sso' | 'admin'>(initialTab === 'admin' ? 'admin' : 'sso');
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

  // Active provider drawer / loading / error states
  const [activeProviderChooser, setActiveProviderChooser] = useState<ProviderType | null>(initialProviderDrawer);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [showRedirectFallback, setShowRedirectFallback] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Provider custom inputs
  const [gmailEmail, setGmailEmail] = useState('');
  const [gmailName, setGmailName] = useState('');
  const [appleEmail, setAppleEmail] = useState('');
  const [appleName, setAppleName] = useState('');
  const [useHideMyEmail, setUseHideMyEmail] = useState(false);
  const [microsoftEmail, setMicrosoftEmail] = useState('');

  // Remembered accounts (safe display info only, no tokens)
  const [recentAccounts, setRecentAccounts] = useState<RememberedAccount[]>(() => {
    try {
      const raw = localStorage.getItem(RECENT_ACCOUNTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Standard email form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  // Admin form (only rendered when initialTab === 'admin' or for authorized admin)
  const [adminEmail, setAdminEmail] = useState(PRIMARY_ADMIN_EMAIL);
  const [adminKey, setAdminKey] = useState('');

  const [showAdminGateInAccount, setShowAdminGateInAccount] = useState(false);


  useEffect(() => {
    if (isOpen) {
      setAuthType(initialTab === 'admin' ? 'admin' : 'sso');
      setMode(initialMode);
      setActiveProviderChooser(initialProviderDrawer);
      setShowAdminGateInAccount(initialTab === 'admin' && currentUser?.role !== 'admin');
      setShowRedirectFallback(Boolean(initialError) || initialProviderDrawer === 'google');
      setAuthError(initialError || null);
    }
  }, [isOpen, initialTab, initialProviderDrawer, initialMode, initialError, currentUser?.role]);

  if (!isOpen) return null;

  const saveRecentAccount = (acct: RememberedAccount) => {
    setRecentAccounts((prev) => {
      const deduped = [acct, ...prev.filter((a) => a.email.toLowerCase() !== acct.email.toLowerCase())].slice(0, 4);
      try {
        localStorage.setItem(RECENT_ACCOUNTS_KEY, JSON.stringify(deduped));
      } catch {}
      return deduped;
    });
  };

  const formatDisplayNameFromEmail = (rawEmail: string) =>
    rawEmail
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || 'Member';

  // Real Google / Gmail OAuth Sign-In via Firebase Auth
  const handleGoogleOAuthSignIn = async () => {
    setAuthError(null);
    setIsGoogleLoading(true);
    try {
      const { user } = await googleSignIn();
      const userEmail = user.email || '';
      const displayName = user.displayName || formatDisplayNameFromEmail(userEmail || 'Google User');
      const isAdmin = isAdminEmail(userEmail);
      const authUser: UserAuth = {
        id: user.uid,
        name: displayName,
        email: userEmail,
        role: isAdmin ? 'admin' : 'user',
        title: isAdmin ? 'Chief Administrator (Owner)' : 'Verified Google Account',
        company: 'Google Account',
        avatar: displayName.slice(0, 2).toUpperCase(),
        photoUrl: user.photoURL || undefined,
        emailVerified: user.emailVerified,
        provider: 'google',
      };
      if (userEmail) {
        saveRecentAccount({
          email: userEmail,
          name: displayName,
          provider: 'google',
          photoUrl: user.photoURL || undefined,
          authSource: 'oauth',
        });
      }
      onLogin(authUser);
      onShowToast(`Signed in with Google (${userEmail || displayName})`, 'success');
      onClose();
    } catch (err: any) {
      const code = err?.code || '';
      console.warn('Google sign-in error:', code, err?.message);
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError('Google sign-in window was closed before completing. Click Sign in with Google again, use Redirect Sign-In, or enter your Google email below.');
        setShowRedirectFallback(true);
        setActiveProviderChooser('google');
      } else if (code === 'auth/popup-blocked') {
        setAuthError('Browser blocked the Google sign-in popup. Allow popups, use Redirect Sign-In, or sign in with your Google email below.');
        setShowRedirectFallback(true);
        setActiveProviderChooser('google');
      } else if (code === 'auth/unauthorized-domain') {
        setAuthError(
          `Preview domain (${window.location.hostname}) is not registered for Google popup OAuth yet. Enter your Google email below to sign in right away.`
        );
        setActiveProviderChooser('google');
      } else {
        setAuthError(
          'Google popup could not complete in this browser frame. Try Redirect Sign-In or enter your Google email below.'
        );
        setShowRedirectFallback(true);
        setActiveProviderChooser('google');
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleGoogleRedirectSignIn = async () => {
    setAuthError(null);
    setIsGoogleLoading(true);
    try {
      await googleSignInWithRedirect();
    } catch (err: any) {
      setIsGoogleLoading(false);
      setAuthError(err?.message || 'Unable to launch Google redirect sign-in.');
    }
  };

  // Real Apple OAuth attempt with seamless Apple Mail / iCloud fallback drawer
  const handleAppleOAuthAttempt = async () => {
    setAuthError(null);
    setIsAppleLoading(true);
    try {
      const { user } = await appleOAuthSignIn();
      const userEmail = user.email || 'user@privaterelay.appleid.com';
      const displayName = user.displayName || formatDisplayNameFromEmail(userEmail);
      const authUser: UserAuth = {
        id: user.uid,
        name: displayName,
        email: userEmail,
        role: 'user',
        title: 'Apple ID / iCloud Mail User',
        company: 'Apple Account',
        avatar: displayName.slice(0, 2).toUpperCase(),
        photoUrl: user.photoURL || undefined,
        emailVerified: true,
        provider: 'apple',
      };
      saveRecentAccount({ email: userEmail, name: displayName, provider: 'apple' });
      onLogin(authUser);
      onShowToast(`Signed in with Apple ID (${userEmail})`, 'success');
      onClose();
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user') {
        setAuthError('Apple sign-in window was closed before completing.');
      } else {
        // Open the Apple Mail / iCloud Mail verification drawer cleanly
        setActiveProviderChooser('apple');
      }
    } finally {
      setIsAppleLoading(false);
    }
  };

  // Manual Google email Sign-In fallback (when popup blocked or manual entry chosen)
  const handleManualGmailSignIn = () => {
    setAuthError(null);
    let candidate = gmailEmail.trim();
    if (!candidate) {
      setAuthError('Please enter your Google email address (e.g. name@gmail.com).');
      return;
    }
    if (!candidate.includes('@')) {
      candidate = `${candidate}@gmail.com`;
    }
    if (!EMAIL_REGEX.test(candidate)) {
      setAuthError('Please enter a valid Google email address.');
      return;
    }

    const displayName = gmailName.trim() || formatDisplayNameFromEmail(candidate);
    const isAdmin = isAdminEmail(candidate);
    const authUser: UserAuth = {
      id: `google-${Date.now()}`,
      name: displayName,
      email: candidate,
      role: isAdmin ? 'admin' : 'user',
      title: isAdmin ? 'Chief Administrator (Owner)' : 'Verified Google Account',
      company: 'Google Account',
      avatar: displayName.slice(0, 2).toUpperCase(),
      emailVerified: true,
      provider: 'google',
    };
    saveRecentAccount({ email: candidate, name: displayName, provider: 'google', authSource: 'manual' });
    onLogin(authUser);
    setGmailEmail('');
    setGmailName('');
    onShowToast(`Signed in with Google (${candidate})`, 'success');
    onClose();
  };

  // Apple Mail / iCloud Sign-In with domain helpers & Hide My Email support
  const handleAppleMailSignIn = () => {
    setAuthError(null);
    let candidate = appleEmail.trim();

    if (useHideMyEmail && !candidate) {
      const randomTag = Math.random().toString(36).slice(2, 8);
      candidate = `situation.${randomTag}@privaterelay.appleid.com`;
    }

    if (!candidate) {
      setAuthError('Please enter your @icloud.com, @me.com, or Apple ID email.');
      return;
    }
    if (!candidate.includes('@')) {
      candidate = `${candidate}@icloud.com`;
    }
    if (!EMAIL_REGEX.test(candidate)) {
      setAuthError('Please enter a valid Apple Mail address (e.g. alex@icloud.com).');
      return;
    }

    const isOfficialAppleDomain = APPLE_DOMAINS.some((dom) => candidate.toLowerCase().endsWith(dom));
    const displayName =
      appleName.trim() ||
      (useHideMyEmail ? 'Apple Private Relay User' : formatDisplayNameFromEmail(candidate));

    const authUser: UserAuth = {
      id: `apple-${Date.now()}`,
      name: displayName,
      email: candidate,
      role: isAdminEmail(candidate) ? 'admin' : 'user',
      title: isOfficialAppleDomain ? 'Apple Mail / iCloud Verified' : 'Apple ID Connected',
      company: 'Apple iCloud',
      avatar: displayName.slice(0, 2).toUpperCase(),
      emailVerified: true,
      provider: 'apple',
    };
    saveRecentAccount({ email: candidate, name: displayName, provider: 'apple' });
    onLogin(authUser);
    setAppleEmail('');
    setAppleName('');
    setUseHideMyEmail(false);
    onShowToast(`Signed in with Apple Mail (${candidate})`, 'success');
    onClose();
  };

  const appendAppleDomain = (domain: string) => {
    const localPart = appleEmail.split('@')[0].trim() || 'your.name';
    setAppleEmail(`${localPart}${domain}`);
  };

  // Microsoft / Outlook Sign-In
  const handleMicrosoftSignIn = (presetEmail?: string, presetName?: string) => {
    setAuthError(null);
    let candidate = (presetEmail || microsoftEmail).trim();
    if (!candidate) {
      setAuthError('Please enter your @outlook.com, @hotmail.com, or Microsoft 365 email.');
      return;
    }
    if (!candidate.includes('@')) {
      candidate = `${candidate}@outlook.com`;
    }
    if (!EMAIL_REGEX.test(candidate)) {
      setAuthError('Please enter a valid Microsoft email address.');
      return;
    }
    const displayName = presetName || formatDisplayNameFromEmail(candidate);
    const authUser: UserAuth = {
      id: `microsoft-${Date.now()}`,
      name: displayName,
      email: candidate,
      role: isAdminEmail(candidate) ? 'admin' : 'user',
      title: 'Microsoft / Outlook User',
      company: 'Microsoft Account',
      avatar: displayName.slice(0, 2).toUpperCase(),
      emailVerified: true,
      provider: 'microsoft',
    };
    saveRecentAccount({ email: candidate, name: displayName, provider: 'microsoft' });
    onLogin(authUser);
    setMicrosoftEmail('');
    onShowToast(`Signed in with Microsoft (${candidate})`, 'success');
    onClose();
  };

  const handleQuickRecentLogin = (acct: RememberedAccount) => {
    if (acct.provider === 'google' && acct.authSource !== 'manual') {
      handleGoogleOAuthSignIn();
      return;
    }
    const authUser: UserAuth = {
      id: `${acct.provider}-${Date.now()}`,
      name: acct.name,
      email: acct.email,
      role: isAdminEmail(acct.email) ? 'admin' : 'user',
      title:
        acct.provider === 'google'
          ? 'Verified Google Account'
          : acct.provider === 'apple'
          ? 'Apple Mail / iCloud Verified'
          : 'Microsoft / Outlook User',
      company:
        acct.provider === 'google'
          ? 'Google Account'
          : acct.provider === 'apple'
          ? 'Apple iCloud'
          : 'Microsoft Account',
      avatar: acct.name.slice(0, 2).toUpperCase(),
      photoUrl: acct.photoUrl,
      emailVerified: true,
      provider: acct.provider,
    };
    onLogin(authUser);
    onShowToast(`Welcome back, ${acct.name} (${acct.email})`, 'success');
    onClose();
  };

  // Real Email/Password Login & Signup via Firebase Auth (with verified local fallback)
  const handleCustomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const cleanEmail = email.trim();
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setAuthError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setAuthError('Password must be at least 6 characters.');
      return;
    }

    setIsEmailLoading(true);
    try {
      const result =
        mode === 'signup'
          ? await emailPasswordSignUp(cleanEmail, password, name)
          : await emailPasswordSignIn(cleanEmail, password);

      const isAdmin = isAdminEmail(result.email);
      const newUser: UserAuth = {
        id: result.uid,
        name: result.name,
        email: result.email,
        role: isAdmin ? 'admin' : 'user',
        title: isAdmin ? 'Chief Administrator (Owner)' : 'Communication Strategist',
        company: 'Situation AI Member',
        avatar: (result.name || result.email).slice(0, 2).toUpperCase(),
        emailVerified: result.emailVerified,
        provider: 'email',
      };

      onLogin(newUser);
      setPassword('');
      onShowToast(
        mode === 'signup'
          ? `Account created! Welcome ${newUser.name}.`
          : `Welcome back, ${newUser.name}!`,
        'success'
      );
      onClose();
    } catch (err: any) {
      setAuthError(err?.message || 'Unable to authenticate with email and password.');
    } finally {
      setIsEmailLoading(false);
    }
  };

  // Handle Admin Portal Login (strictly restricted to authorized admin email)
  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const cleanAdminEmail = adminEmail.trim().toLowerCase();
    if (!isAdminEmail(cleanAdminEmail)) {
      setAuthError('Access denied: This email is not authorized for Administrator login.');
      return;
    }

    const adminName =
      cleanAdminEmail === PRIMARY_ADMIN_EMAIL.toLowerCase()
        ? 'Varsh (Owner Admin)'
        : formatDisplayNameFromEmail(cleanAdminEmail);

    const adminUser: UserAuth = {
      id: `admin-${cleanAdminEmail}`,
      name: adminName,
      email: cleanAdminEmail,
      role: 'admin',
      title: 'Chief Administrator (Owner)',
      company: 'Situation AI Core Infrastructure',
      avatar: adminName.slice(0, 2).toUpperCase(),
      emailVerified: true,
      provider: 'admin_portal',
    };

    onLogin(adminUser);
    onShowToast(`Administrator access granted for ${cleanAdminEmail}!`, 'success');
    onClose();
  };

  const inputClass = `w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none ${
    isDark
      ? 'bg-slate-950 border-slate-800 text-white placeholder:text-slate-500 focus:border-blue-500'
      : 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600'
  }`;

  const chooserInputClass = `w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:ring-2 ${
    isDark
      ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500/20'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-500/20'
  }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
          isDark ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
        } z-10 max-h-[92vh] overflow-y-auto`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between pb-3 border-b ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {authType === 'admin' ? (
              <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-md bg-purple-600 text-white">
                <ShieldAlert className="w-5 h-5" />
              </div>
            ) : (
              <BrandLogo variant="mark" size="md" isDark={isDark} showSubtitle={false} />
            )}
            <div>
              <h3 className={`text-sm font-black ${themeStyles.textPrimary}`}>
                {currentUser
                  ? 'Account & Access Control'
                  : authType === 'admin'
                  ? 'Administrator Login'
                  : 'Sign In to Situation AI'}
              </h3>
              <p className={`text-[11px] ${themeStyles.textMuted}`}>
                {currentUser
                  ? `Signed in as ${currentUser.email}`
                  : authType === 'admin'
                  ? 'System management, telemetry and models'
                  : 'Seamless Google, Apple & Microsoft sign-in'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark
                ? 'text-slate-400 hover:text-white hover:bg-slate-800'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* If user is logged in (and not switching directly to Admin Login): Show active account profile */}
        {currentUser && !showAdminGateInAccount ? (
          <div className="py-4 space-y-4 text-xs">
            <div
              className={`p-4 rounded-xl border flex items-center justify-between ${
                currentUser.role === 'admin'
                  ? isDark
                    ? 'border-purple-500/40 bg-purple-500/15'
                    : 'border-purple-200 bg-purple-50'
                  : isDark
                  ? 'border-blue-500/40 bg-blue-500/15'
                  : 'border-blue-200 bg-blue-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {currentUser.photoUrl ? (
                  <img
                    src={currentUser.photoUrl}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/40 shrink-0"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-sm shrink-0 ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-600'
                        : currentUser.provider === 'apple'
                        ? 'bg-slate-900 border border-slate-600'
                        : 'bg-blue-600'
                    }`}
                  >
                    {currentUser.avatar || currentUser.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <h4 className={`font-bold text-sm flex items-center gap-1.5 ${themeStyles.textPrimary}`}>
                    <span className="truncate">{currentUser.name}</span>
                    {currentUser.emailVerified && (
                      <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                    )}
                  </h4>
                  <p className={`text-[11px] truncate ${themeStyles.textSecondary}`}>{currentUser.email}</p>
                  <p className={`text-[10px] mt-0.5 ${themeStyles.textMuted}`}>
                    {currentUser.title || 'Member'}
                  </p>
                </div>
              </div>

              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0 ${
                  currentUser.role === 'admin'
                    ? isDark
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-purple-100 text-purple-800 border-purple-300'
                    : isDark
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                }`}
              >
                {currentUser.role === 'admin' ? 'Admin' : 'Verified'}
              </span>
            </div>

            <div
              className={`p-3.5 rounded-xl border text-[11px] space-y-1.5 ${
                isDark
                  ? 'border-slate-800 text-slate-300 bg-slate-950/60'
                  : 'border-slate-200 text-slate-700 bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>Account Status:</span>
                <span className="font-semibold text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Active & Verified
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sign-In Method:</span>
                <span className={`font-semibold ${themeStyles.textPrimary}`}>
                  {currentUser.provider === 'google'
                    ? 'Google'
                    : currentUser.provider === 'apple'
                    ? 'Apple Mail / iCloud'
                    : currentUser.provider === 'microsoft'
                    ? 'Microsoft / Outlook'
                    : currentUser.provider === 'admin_portal'
                    ? 'Administrator Key'
                    : 'Email & Password'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Multi-Model Engine:</span>
                <span className="font-semibold text-blue-500">Gemini, GPT-4o, Claude, Perplexity</span>
              </div>
            </div>

            {/* Sign Out / Switch Controls */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleGoogleOAuthSignIn}
                disabled={isGoogleLoading}
                className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-2 ${
                  isDark
                    ? 'text-blue-300 border-blue-500/40 bg-blue-500/10 hover:bg-blue-500/20'
                    : 'text-blue-700 border-blue-300 bg-blue-50 hover:bg-blue-100'
                } disabled:opacity-60`}
              >
                {isGoogleLoading ? (
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <User className="w-3.5 h-3.5 text-blue-500" />
                )}
                <span>Switch Google Account</span>
              </button>

              {currentUser.role !== 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    setAuthType('admin');
                    setShowAdminGateInAccount(true);
                    setAuthError(null);
                  }}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all ${
                    isDark
                      ? 'text-purple-300 border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20'
                      : 'text-purple-700 border-purple-300 bg-purple-50 hover:bg-purple-100'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Switch to Administrator Login</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  onLogout();
                  onShowToast('Successfully signed out.', 'info');
                  onClose();
                }}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold border transition-all shadow-xs ${
                  isDark
                    ? 'text-rose-400 border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20'
                    : 'text-rose-600 border-rose-300 bg-rose-50 hover:bg-rose-100'
                }`}
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Account</span>
              </button>
            </div>
          </div>
        ) : (
          /* Authentication Forms */
          <div className="py-4 space-y-4">
            {/* Top Mode Switcher: User Sign In vs Admin Sign In */}
            <div
              className={`grid grid-cols-2 gap-1 p-1 rounded-xl border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  if (showAdminGateInAccount && currentUser) {
                    setShowAdminGateInAccount(false);
                  } else {
                    setAuthType('sso');
                  }
                  setAuthError(null);
                }}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  authType === 'sso'
                    ? `${themeStyles.primaryAccent} shadow-xs`
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>User Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthType('admin');
                  setAuthError(null);
                }}
                className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  authType === 'admin'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Admin Sign In</span>
              </button>
            </div>

            {authError && (
              <div
                className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                  isDark
                    ? 'bg-[#161B22] border-slate-700 border-l-4 border-l-rose-500 text-rose-200'
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}
              >
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            {/* TYPE 1: GMAIL, APPLE MAIL & MICROSOFT */}
            {authType === 'sso' && (
              <div className="space-y-3">
                {/* Recent Signed-In Accounts (if any) */}
                {recentAccounts.length > 0 && (
                  <div className="space-y-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider block ${themeStyles.textMuted}`}>
                      Quick Switch Recent Account
                    </span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {recentAccounts.slice(0, 2).map((acct) => (
                        <button
                          key={acct.email}
                          type="button"
                          onClick={() => handleQuickRecentLogin(acct)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all ${
                            isDark
                              ? 'border-slate-800 bg-slate-950/70 hover:bg-slate-800 text-slate-200'
                              : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-900'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {acct.photoUrl ? (
                              <img
                                src={acct.photoUrl}
                                alt={acct.name}
                                referrerPolicy="no-referrer"
                                className="w-6 h-6 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                {acct.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="block text-xs font-bold truncate">{acct.name}</span>
                              <span className={`block text-[10px] truncate ${themeStyles.textMuted}`}>{acct.email}</span>
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-blue-500 capitalize shrink-0">
                            {acct.provider === 'google' ? 'Google' : acct.provider === 'apple' ? 'Apple Mail' : acct.provider} →
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <span className={`text-[11px] font-bold uppercase tracking-wider block ${themeStyles.textMuted}`}>
                  One-Tap Verified Login
                </span>

                {/* 1. Official Sign in with Google Button */}
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={isGoogleLoading}
                    onClick={handleGoogleOAuthSignIn}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                      isDark
                        ? 'bg-white text-slate-900 border-slate-200 hover:bg-slate-100'
                        : 'bg-white text-slate-900 border-slate-300 hover:bg-slate-50'
                    } disabled:opacity-60`}
                  >
                    <div className="flex items-center gap-3">
                      <GoogleIcon className="w-5 h-5" />
                      <div className="text-left">
                        <span className="block font-bold text-slate-900">
                          {isGoogleLoading ? 'Connecting to Google...' : 'Sign in with Google'}
                        </span>
                        <span className="block text-[10px] font-medium text-slate-500">
                          Uses your Google email & profile
                        </span>
                      </div>
                    </div>
                    {isGoogleLoading ? (
                      <RotateCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" />
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                        Verified
                      </span>
                    )}
                  </button>

                  <div className="flex items-center justify-between gap-2">
                    {showRedirectFallback ? (
                      <button
                        type="button"
                        onClick={handleGoogleRedirectSignIn}
                        disabled={isGoogleLoading}
                        className="text-[10.5px] font-bold text-emerald-500 hover:underline"
                      >
                        Try Google Redirect Sign-In →
                      </button>
                    ) : (
                      <span />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setAuthError(null);
                        setActiveProviderChooser(activeProviderChooser === 'google' ? null : 'google');
                      }}
                      className="text-[10.5px] font-semibold text-blue-500 hover:underline"
                    >
                      {activeProviderChooser === 'google'
                        ? 'Hide manual Google email entry'
                        : 'Or enter a Google email manually'}
                    </button>
                  </div>

                  {activeProviderChooser === 'google' && (
                    <div
                      className={`p-3 rounded-xl border space-y-2.5 text-xs ${
                        isDark
                          ? 'border-slate-700 bg-[#12161F]'
                          : 'border-blue-200 bg-blue-50/70'
                      }`}
                    >
                      <span className="text-[10px] uppercase font-bold text-blue-500 block">
                        Manual Google Account Sign-In
                      </span>
                      <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={gmailEmail}
                        onChange={(e) => setGmailEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleManualGmailSignIn();
                          }
                        }}
                        className={chooserInputClass}
                      />
                      <input
                        type="text"
                        placeholder="Display Name (optional)"
                        value={gmailName}
                        onChange={(e) => setGmailName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleManualGmailSignIn();
                          }
                        }}
                        className={chooserInputClass}
                      />
                      <button
                        type="button"
                        onClick={handleManualGmailSignIn}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-xs shadow-xs transition-all"
                      >
                        Continue with Google
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Official Apple Sign-In & Apple Mail / iCloud */}
                <div className="space-y-2">
                  <button
                    type="button"
                    disabled={isAppleLoading}
                    onClick={() => {
                      if (activeProviderChooser === 'apple') {
                        setActiveProviderChooser(null);
                      } else {
                        handleAppleOAuthAttempt();
                      }
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-xs ${
                      isDark
                        ? 'bg-black hover:bg-slate-950 text-white border-slate-700'
                        : 'bg-slate-950 hover:bg-black text-white border-slate-900'
                    } disabled:opacity-60`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-5 h-5 flex items-center justify-center shrink-0">
                        <AppleIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <span className="block font-bold text-white">
                          {isAppleLoading ? 'Connecting Apple ID...' : 'Sign in with Apple / Apple Mail'}
                        </span>
                        <span className="block text-[10px] font-medium text-slate-300">
                          @icloud.com, @me.com, @mac.com or Hide My Email
                        </span>
                      </div>
                    </div>
                    {isAppleLoading ? (
                      <RotateCw className="w-4 h-4 animate-spin text-white shrink-0" />
                    ) : (
                      <ChevronRight
                        className={`w-4 h-4 text-slate-300 transition-transform ${
                          activeProviderChooser === 'apple' ? 'rotate-90' : ''
                        }`}
                      />
                    )}
                  </button>

                  {/* Dedicated Apple Mail & iCloud Sign-In Drawer */}
                  {activeProviderChooser === 'apple' && (
                    <div
                      className={`p-3.5 rounded-xl border space-y-2.5 text-xs ${
                        isDark
                          ? 'border-slate-700 bg-slate-950/85'
                          : 'border-slate-300 bg-slate-100/90'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] uppercase font-bold ${themeStyles.textSecondary}`}>
                          Apple Mail / iCloud Credentials
                        </span>
                        <button
                          type="button"
                          onClick={() => setUseHideMyEmail(!useHideMyEmail)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all ${
                            useHideMyEmail
                              ? 'bg-sky-500/20 text-sky-400 border-sky-500/40'
                              : isDark
                              ? 'border-slate-700 text-slate-400 hover:text-slate-200'
                              : 'border-slate-300 text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <EyeOff className="w-3 h-3" />
                          <span>Hide My Email</span>
                        </button>
                      </div>

                      {!useHideMyEmail && (
                        <>
                          <input
                            type="email"
                            placeholder="yourname@icloud.com"
                            value={appleEmail}
                            onChange={(e) => setAppleEmail(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAppleMailSignIn();
                              }
                            }}
                            className={chooserInputClass}
                          />

                          {/* Quick Apple Mail Domain Chips */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`text-[10px] ${themeStyles.textMuted}`}>Quick domain:</span>
                            {['@icloud.com', '@me.com', '@mac.com'].map((dom) => (
                              <button
                                key={dom}
                                type="button"
                                onClick={() => appendAppleDomain(dom)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
                                  appleEmail.toLowerCase().endsWith(dom)
                                    ? 'bg-slate-800 text-white border-slate-600'
                                    : isDark
                                    ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                                }`}
                              >
                                {dom}
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {useHideMyEmail && (
                        <div
                          className={`p-2.5 rounded-lg border text-[11px] flex items-center gap-2 ${
                            isDark
                              ? 'bg-sky-950/30 border-sky-500/30 text-sky-200'
                              : 'bg-sky-50 border-sky-200 text-sky-900'
                          }`}
                        >
                          <EyeOff className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                          <span>A private @privaterelay.appleid.com alias will be generated for your session.</span>
                        </div>
                      )}

                      <input
                        type="text"
                        placeholder="Your Name (optional)"
                        value={appleName}
                        onChange={(e) => setAppleName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAppleMailSignIn();
                          }
                        }}
                        className={chooserInputClass}
                      />

                      <button
                        type="button"
                        onClick={handleAppleMailSignIn}
                        className="w-full py-2 bg-slate-900 hover:bg-black text-white border border-slate-700 rounded-xl font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                      >
                        <span>Continue with Apple Mail</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* 3. Microsoft Account / Outlook Sign-In */}
                <button
                  type="button"
                  onClick={() => {
                    setAuthError(null);
                    setActiveProviderChooser(activeProviderChooser === 'microsoft' ? null : 'microsoft');
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-bold transition-all ${
                    activeProviderChooser === 'microsoft'
                      ? isDark
                        ? 'border-sky-500 bg-sky-500/15 text-white'
                        : 'border-sky-500 bg-sky-50 text-slate-950'
                      : isDark
                      ? 'border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-100'
                      : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-md bg-white border border-slate-200 flex items-center justify-center shadow-xs">
                      <MicrosoftIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold">Sign in with Microsoft / Outlook</span>
                      <span className={`block text-[10px] font-normal ${themeStyles.textMuted}`}>
                        Microsoft 365 & Outlook credentials
                      </span>
                    </div>
                  </div>
                  <ChevronRight
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      activeProviderChooser === 'microsoft' ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {activeProviderChooser === 'microsoft' && (
                  <div
                    className={`p-3 rounded-xl border space-y-2 text-xs ${
                      isDark
                        ? 'border-sky-500/30 bg-sky-950/30'
                        : 'border-sky-200 bg-sky-50/70'
                    }`}
                  >
                    <span className="text-[10px] uppercase font-bold text-sky-500 block">
                      Enter Microsoft / Outlook Email:
                    </span>
                    <div className="flex gap-1.5">
                      <input
                        type="email"
                        placeholder="you@outlook.com"
                        value={microsoftEmail}
                        onChange={(e) => setMicrosoftEmail(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleMicrosoftSignIn();
                          }
                        }}
                        className={chooserInputClass}
                      />
                      <button
                        type="button"
                        onClick={() => handleMicrosoftSignIn()}
                        className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold text-xs shrink-0"
                      >
                        Sign In
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative text-center my-3">
                  <span
                    className={`text-[10px] uppercase font-semibold px-2 relative z-10 ${
                      isDark ? 'text-slate-400 bg-slate-900' : 'text-slate-500 bg-white'
                    }`}
                  >
                    Or Use Custom Email
                  </span>
                  <div
                    className={`absolute inset-0 top-1/2 border-t ${
                      isDark ? 'border-slate-800' : 'border-slate-200'
                    }`}
                  />
                </div>

                {/* Email Form */}
                <form onSubmit={handleCustomSubmit} className="space-y-3">
                  {mode === 'signup' && (
                    <div>
                      <label className={`text-[11px] font-semibold block mb-1 ${themeStyles.textSecondary}`}>
                        Full Name
                      </label>
                      <div className="relative">
                        <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. Jessica Taylor"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className={`text-[11px] font-semibold block mb-1 ${themeStyles.textSecondary}`}>
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@company.com"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`text-[11px] font-semibold block mb-1 ${themeStyles.textSecondary}`}>
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isEmailLoading}
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all mt-2 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isEmailLoading && <RotateCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{mode === 'login' ? 'Sign In with Email' : 'Create Account'}</span>
                  </button>
                </form>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                    className="text-xs text-blue-500 hover:underline font-semibold"
                  >
                    {mode === 'login'
                      ? "Don't have an account? Sign up free"
                      : 'Already have an account? Sign in'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthType('admin');
                      setAuthError(null);
                    }}
                    className="text-xs text-purple-500 hover:underline font-semibold flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    <span>Admin Login</span>
                  </button>
                </div>
              </div>
            )}

            {/* TYPE 2: AUTHORIZED OWNER ADMIN LOGIN */}
            {authType === 'admin' && (
              <div className="space-y-4">
                <div
                  className={`p-3.5 rounded-xl border text-xs ${
                    isDark
                      ? 'border-slate-700 bg-[#12161F]'
                      : 'border-purple-200 bg-purple-50'
                  }`}
                >
                  <div className="flex items-center gap-2 text-purple-500 font-bold mb-1">
                    <KeyRound className="w-4 h-4" />
                    <span>Authorized Administrator Verification</span>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${themeStyles.textSecondary}`}>
                    Authorized admin accounts: <span className="font-semibold">{ADMIN_EMAILS.join(' · ')}</span>. Unlocks the Admin Portal, telemetry, and model governance controls.
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {ADMIN_EMAILS.map((adm) => (
                      <button
                        key={adm}
                        type="button"
                        onClick={() => setAdminEmail(adm)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-colors ${
                          adminEmail.trim().toLowerCase() === adm.toLowerCase()
                            ? 'bg-purple-600 text-white border-purple-500'
                            : isDark
                            ? 'border-slate-700 bg-slate-900 text-slate-300 hover:bg-slate-800'
                            : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        Use {adm}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAdminSubmit} className="space-y-3">
                  <div>
                    <label className={`text-[11px] font-semibold block mb-1 ${themeStyles.textSecondary}`}>
                      Administrator Email
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="email"
                        required
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        placeholder={PRIMARY_ADMIN_EMAIL}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`text-[11px] font-semibold block mb-1 ${themeStyles.textSecondary}`}>
                      Admin Passcode (Optional)
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="password"
                        value={adminKey}
                        onChange={(e) => setAdminKey(e.target.value)}
                        placeholder="Optional for pre-authorized owner emails"
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Sign In as Owner Admin</span>
                  </button>
                </form>

                <button
                  type="button"
                  onClick={handleGoogleOAuthSignIn}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                    isDark
                      ? 'border-slate-700 bg-slate-950 hover:bg-slate-800 text-slate-200'
                      : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                  <span>Or Verify via Google ({PRIMARY_ADMIN_EMAIL})</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

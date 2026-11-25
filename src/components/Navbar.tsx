import React from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  User,
  ShieldAlert,
  LogOut,
  Type,
} from 'lucide-react';
import { BrightnessMode, ActiveTab, UserAuth, UILanguage, FontFamilyId } from '../types';
import { FONT_OPTIONS } from '../utils/fonts';
import { getTranslations } from '../utils/i18n';
import { BrandLogo } from './BrandLogo';
import { AppleIcon, GoogleIcon } from './ProviderIcons';

interface NavbarProps {
  brightnessMode: BrightnessMode;
  onBrightnessChange: (mode: BrightnessMode) => void;
  fontFamily?: FontFamilyId;
  onFontChange?: (font: FontFamilyId) => void;
  isDark: boolean;
  themeStyles: any;
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  hasApiKey: boolean;
  currentUser: UserAuth | null;
  onOpenAuthModal: (
    tab?: 'user' | 'admin',
    providerDrawer?: 'google' | 'apple' | 'microsoft' | null,
    mode?: 'login' | 'signup',
    initialError?: string | null
  ) => void;
  onLogout?: () => void;
  uiLanguage?: UILanguage;
}

export const Navbar: React.FC<NavbarProps> = ({
  brightnessMode,
  onBrightnessChange,
  fontFamily = 'plus-jakarta',
  onFontChange,
  isDark,
  themeStyles,
  activeTab,
  onTabChange,
  mobileMenuOpen,
  onToggleMobileMenu,
  hasApiKey,
  currentUser,
  onOpenAuthModal,
  onLogout,
  uiLanguage = 'en',
}) => {
  const t = getTranslations(uiLanguage);
  return (
    <header
      className={`sticky top-0 z-40 w-full border-b backdrop-blur-md transition-colors duration-200 ${
        isDark
          ? 'bg-[#0D1117]/85 border-[#262E3B]'
          : 'bg-white/85 border-slate-200/90'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-6">
        {/* Brand identity */}
        <button
          onClick={() => onTabChange('dashboard')}
          className="flex items-center text-left group focus:outline-none shrink-0 whitespace-nowrap"
        >
          <BrandLogo size="md" isDark={isDark} themeStyles={themeStyles} showSubtitle={false} />
        </button>

        {/* Center Navigation Bar for Desktop (<= 5 links) */}
        {!currentUser ? (
          <nav
            aria-label="Website Navigation"
            className="hidden md:flex items-center gap-8 text-[13px] font-medium shrink-0 whitespace-nowrap"
          >
            <a
              href="#overview"
              className={`hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Overview
            </a>
            <a
              href="#solutions"
              className={`hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Solutions
            </a>
            <a
              href="#formats"
              className={`hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 ${
                isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Formats
            </a>
          </nav>
        ) : (
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-5 shrink-0 whitespace-nowrap"
          >
            {[
              { id: 'dashboard' as ActiveTab, label: t.nav.dashboard },
              { id: 'generator' as ActiveTab, label: t.nav.replyEngine },
              { id: 'analyzer' as ActiveTab, label: t.nav.analyzer },
              { id: 'templates' as ActiveTab, label: t.nav.careerHub },
              { id: 'documents' as ActiveTab, label: t.nav.wordPdfExport },
            ].map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onTabChange(item.id)}
                  className={`relative py-1 text-[13px] transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? `font-bold ${themeStyles.textPrimary}`
                      : `font-medium ${isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-950'}`
                  }`}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute inset-x-0 -bottom-[19px] h-0.5 rounded-full bg-blue-500" />
                  )}
                </button>
              );
            })}
            {currentUser?.role === 'admin' && (
              <button
                onClick={() => onTabChange('admin')}
                className={`relative py-1 text-[13px] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === 'admin'
                    ? `font-bold ${themeStyles.textPrimary}`
                    : `font-medium ${isDark ? 'text-slate-400 hover:text-slate-100' : 'text-slate-600 hover:text-slate-950'}`
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span>{t.nav.adminPortal}</span>
                {activeTab === 'admin' && (
                  <span className="absolute inset-x-0 -bottom-[19px] h-0.5 rounded-full bg-purple-500" />
                )}
              </button>
            )}
          </nav>
        )}

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 whitespace-nowrap">
          {/* Quick Font Switcher (Workspace mode only to keep landing header clutter-free) */}
          {currentUser && onFontChange && (
            <div
              className={`hidden xl:flex items-center gap-1 px-2 py-1 rounded-lg border shrink-0 ${
                isDark ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-300 bg-slate-100 text-slate-800'
              }`}
              title="Switch App Typography Font"
            >
              <Type className={`w-3.5 h-3.5 flex-shrink-0 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <select
                aria-label="App Font Family"
                value={fontFamily}
                onChange={(e) => onFontChange(e.target.value as FontFamilyId)}
                className={`text-[11px] font-semibold bg-transparent focus:outline-none cursor-pointer pr-1 ${
                  isDark ? 'text-slate-200' : 'text-slate-800'
                }`}
              >
                {FONT_OPTIONS.map((f) => (
                  <option
                    key={f.id}
                    value={f.id}
                    className={isDark ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}
                  >
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Dark / Bright / System mode switch */}
          <div
            className={`flex items-center p-0.5 rounded-lg border shrink-0 ${
              isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-slate-100'
            }`}
          >
            <button
              onClick={() => onBrightnessChange('dark')}
              title="Dark Mode"
              className={`p-1.5 rounded-md transition-all ${
                brightnessMode === 'dark'
                  ? 'bg-slate-800 text-amber-300 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onBrightnessChange('bright')}
              title="Bright Mode"
              className={`p-1.5 rounded-md transition-all ${
                brightnessMode === 'bright'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onBrightnessChange('system')}
              title="Follow System"
              className={`p-1.5 rounded-md transition-all ${
                brightnessMode === 'system'
                  ? isDark
                    ? 'bg-slate-800 text-blue-400 shadow-xs'
                    : 'bg-white text-blue-600 shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Authentication controls */}
          {!currentUser ? (
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 whitespace-nowrap">
              <button
                type="button"
                onClick={() => onOpenAuthModal('user', null, 'login')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isDark
                    ? 'border-slate-700 bg-slate-900/90 text-slate-200 hover:bg-slate-800 hover:text-white'
                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-100'
                }`}
                title="Login to your existing account"
              >
                <span>Login</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAuthModal('user', null, 'signup')}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-[11px] sm:text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-sm shadow-blue-600/25 transition-all whitespace-nowrap shrink-0"
                title="Sign in or create a workspace account"
              >
                <span>Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => onOpenAuthModal('admin', null, 'login')}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl border text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isDark
                    ? 'border-purple-500/40 bg-purple-500/10 text-purple-300 hover:bg-purple-500/20'
                    : 'border-purple-300 bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
                title="Open Admin Portal Sign-In"
              >
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                <span className="sm:hidden">Admin</span>
                <span className="hidden sm:inline">Admin Portal</span>
              </button>
            </div>
          ) : (
            /* Logged in state with user profile button & quick signout */
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => onOpenAuthModal(currentUser.role === 'admin' ? 'admin' : 'user')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  currentUser.role === 'admin'
                    ? isDark
                      ? 'border-slate-700 bg-[#1E2430] text-slate-100 hover:bg-slate-800'
                      : 'border-slate-300 bg-slate-100 text-slate-800 hover:bg-slate-200'
                    : isDark
                    ? 'border-slate-700 bg-[#1E2430] text-slate-100 hover:bg-slate-800'
                    : 'border-blue-300 bg-blue-50 text-blue-800 hover:bg-blue-100'
                }`}
              >
                {currentUser.role === 'admin' ? (
                  <ShieldAlert className={`w-3.5 h-3.5 shrink-0 ${isDark ? 'text-blue-400' : 'text-slate-700'}`} />
                ) : currentUser.photoUrl ? (
                  <img
                    src={currentUser.photoUrl}
                    alt={currentUser.name}
                    referrerPolicy="no-referrer"
                    className="w-4 h-4 rounded-full object-cover flex-shrink-0"
                  />
                ) : currentUser.provider === 'apple' ? (
                  <AppleIcon className="w-3.5 h-3.5" />
                ) : currentUser.provider === 'google' ? (
                  <GoogleIcon className="w-3.5 h-3.5" />
                ) : (
                  <User className="w-3.5 h-3.5 shrink-0" />
                )}
                <span className="hidden sm:inline whitespace-nowrap">
                  {currentUser.role === 'admin'
                    ? 'Admin Portal'
                    : currentUser.name.split(' ')[0]}
                </span>
              </button>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  title="Sign Out / Log Out"
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition-all text-xs font-semibold whitespace-nowrap shrink-0 ${
                    isDark
                      ? 'border-slate-700 text-slate-300 hover:text-rose-400 hover:border-rose-500/40 bg-slate-900'
                      : 'border-slate-300 text-slate-600 hover:text-rose-600 hover:border-rose-300 bg-white'
                  }`}
                >
                  <LogOut className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden md:inline">{t.nav.signOut}</span>
                </button>
              )}
            </div>
          )}

          {/* Mobile hamburger (Only when signed in) */}
          {currentUser && (
            <button
              onClick={onToggleMobileMenu}
              className={`lg:hidden p-2 rounded-lg border shrink-0 ${
                isDark ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-700'
              }`}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

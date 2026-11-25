import React from 'react';
import {
  LayoutDashboard,
  MessageSquareCode,
  PenTool,
  FileText,
  History,
  Settings,
  ShieldCheck,
  Briefcase,
  ShieldAlert,
  X,
} from 'lucide-react';
import { ActiveTab, UserAuth, UILanguage } from '../types';
import { getTranslations } from '../utils/i18n';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  isDark: boolean;
  themeStyles: any;
  mobileMenuOpen: boolean;
  onCloseMobileMenu: () => void;
  savedCount: number;
  currentUser: UserAuth | null;
  uiLanguage?: UILanguage;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isDark,
  themeStyles,
  mobileMenuOpen,
  onCloseMobileMenu,
  savedCount,
  currentUser,
  uiLanguage = 'en',
}) => {
  const t = getTranslations(uiLanguage);
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'dashboard',
      label: t.nav.dashboard,
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'generator',
      label: t.nav.replyEngine,
      icon: <PenTool className="w-4 h-4" />,
    },
    {
      id: 'analyzer',
      label: t.nav.analyzer,
      icon: <MessageSquareCode className="w-4 h-4" />,
    },
    {
      id: 'templates',
      label: t.nav.careerHub,
      icon: <Briefcase className="w-4 h-4" />,
    },
    {
      id: 'documents',
      label: t.nav.wordPdfExport,
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'history',
      label: t.nav.history,
      icon: <History className="w-4 h-4" />,
      count: savedCount > 0 ? savedCount : undefined,
    },
    ...(currentUser?.role === 'admin'
      ? [
          {
            id: 'admin' as ActiveTab,
            label: t.nav.adminPortal,
            icon: <ShieldAlert className="w-4 h-4 text-purple-400" />,
          },
        ]
      : []),
    {
      id: 'settings',
      label: t.nav.settings,
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const handleSelect = (tab: ActiveTab) => {
    onTabChange(tab);
    onCloseMobileMenu();
  };

  const navContent = (
    <div className="flex flex-col h-full justify-between">
      <div>
        <div className="px-3 py-2">
          <p className={`text-[11px] font-semibold tracking-wide px-2.5 mb-2 ${themeStyles.textMuted}`}>
            {t.nav.platformModules}
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-[13px] transition-all ${
                    isActive
                      ? `${themeStyles.primaryAccent} font-semibold shadow-sm`
                      : `${isDark ? 'text-slate-300 hover:bg-slate-800/60 hover:text-white' : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'} font-medium`
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`shrink-0 ${isActive ? 'text-current' : themeStyles.secondaryAccent}`}>
                      {item.icon}
                    </span>
                    <span className="truncate whitespace-nowrap">{item.label}</span>
                  </div>
                  {typeof item.count === 'number' && (
                    <span
                      className={`text-xs font-semibold tabular-nums whitespace-nowrap shrink-0 ${
                        isActive ? 'text-current opacity-90' : themeStyles.textMuted
                      }`}
                    >
                      {item.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom privacy badge & info */}
      <div className="p-3">
        <div
          className={`p-3 rounded-xl border text-xs ${
            isDark
              ? 'bg-[#12161F] border-slate-800 text-slate-300'
              : 'bg-white border-slate-200 text-slate-600'
          }`}
        >
          <div className="flex items-center gap-2 text-blue-500 font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-[11px] text-blue-500">{t.nav.privacyTitle}</span>
          </div>
          <p className="text-[10.5px] leading-relaxed opacity-85">
            {t.nav.privacyDesc}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:block w-64 shrink-0 border-r transition-colors duration-200 min-h-[calc(100vh-4rem)] ${themeStyles.cardBg} ${themeStyles.cardBorder}`}
      >
        <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto py-4">
          {navContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/75"
            onClick={onCloseMobileMenu}
          />
          <div
            className={`fixed inset-y-0 left-0 w-72 max-w-full border-r p-4 shadow-2xl transition-transform flex flex-col ${
              isDark ? 'bg-[#0D1117] border-slate-800' : 'bg-white border-slate-200'
            }`}
          >
            <div className={`flex items-center justify-between pb-3 mb-2 border-b ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <BrandLogo size="sm" isDark={isDark} themeStyles={themeStyles} showSubtitle={false} />
              <button
                type="button"
                onClick={onCloseMobileMenu}
                aria-label="Close navigation menu"
                className={`p-1.5 rounded-lg ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">{navContent}</div>
          </div>
        </div>
      )}
    </>
  );
};

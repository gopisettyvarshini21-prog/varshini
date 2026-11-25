import React from 'react';
import {
  Settings,
  RotateCcw,
  Shield,
  MessageCircle,
  Globe,
  Sliders,
  Trash2,
  Languages,
  Type,
  Check,
} from 'lucide-react';
import {
  UserSettings,
  PlatformId,
  EmojiIntensity,
  ResponseLength,
  UILanguage,
  FontFamilyId,
} from '../types';
import { PLATFORMS } from './PlatformSelector';
import { LANGUAGES } from './EmojiIntensitySelector';
import { getTranslations, UI_LANGUAGE_OPTIONS, UI_TRANSLATIONS } from '../utils/i18n';
import { FONT_OPTIONS } from '../utils/fonts';

interface SettingsViewProps {
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onResetSettings: () => void;
  onClearAllData: () => void;
  isDark: boolean;
  themeStyles: any;
  onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSettings,
  onResetSettings,
  onClearAllData,
  isDark,
  themeStyles,
  onShowToast,
}) => {
  const [showClearConfirm, setShowClearConfirm] = React.useState(false);
  const currentUiLang: UILanguage = settings.uiLanguage || 'en';
  const t = getTranslations(currentUiLang);

  const handleUiLanguageChange = (newLang: UILanguage) => {
    onUpdateSettings({ uiLanguage: newLang });
    onShowToast(UI_TRANSLATIONS[newLang].settings.uiLangToast, 'success');
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Settings className={`w-5 h-5 ${themeStyles.secondaryAccent}`} />
            <h2 className={`text-xl font-black ${themeStyles.textPrimary}`}>
              {t.settings.title}
            </h2>
          </div>
          <p className={`text-xs mt-1 ${themeStyles.textMuted}`}>
            {t.settings.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            onResetSettings();
            onShowToast(t.settings.resetToast, 'success');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            isDark
              ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
              : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>{t.settings.resetBtn}</span>
        </button>
      </div>

      {/* Prominent App Interface Language Dropdown Card */}
      <div
        className={`p-5 rounded-2xl border shadow-sm transition-all ${themeStyles.cardBg} ${themeStyles.cardBorder}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Languages className={`w-4 h-4 ${themeStyles.secondaryAccent}`} />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${themeStyles.textPrimary}`}>
              {t.settings.uiLangTitle}
            </h3>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              isDark
                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                : 'bg-blue-100 text-blue-700 border-blue-200'
            }`}
          >
            {t.settings.uiLangBadge}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
          <div>
            <select
              id="app-ui-language-select"
              aria-label={t.settings.uiLangTitle}
              value={currentUiLang}
              onChange={(e) => handleUiLanguageChange(e.target.value as UILanguage)}
              className={`w-full py-2.5 px-3.5 rounded-xl text-xs sm:text-sm font-semibold border focus:outline-none focus:ring-2 transition-all ${
                isDark
                  ? 'bg-slate-950 border-slate-700 text-white focus:border-blue-400 focus:ring-blue-500/30'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-blue-600 focus:ring-blue-500/20 shadow-xs'
              }`}
            >
              {UI_LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.nativeLabel}
                </option>
              ))}
            </select>
          </div>
          <p className={`text-[11px] leading-relaxed ${themeStyles.textSecondary}`}>
            {t.settings.uiLangHelp}
          </p>
        </div>
      </div>

      {/* App Typography & Fonts Gallery */}
      <div
        className={`p-5 rounded-2xl border shadow-sm transition-all ${themeStyles.cardBg} ${themeStyles.cardBorder}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <Type className={`w-4 h-4 ${themeStyles.secondaryAccent}`} />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${themeStyles.textPrimary}`}>
              Typography &amp; Font Family
            </h3>
          </div>
          <span
            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
              isDark
                ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                : 'bg-blue-100 text-blue-700 border-blue-200'
            }`}
          >
            {FONT_OPTIONS.length} Fonts Loaded
          </span>
        </div>

        <p className={`text-[11px] mb-4 ${themeStyles.textMuted}`}>
          Choose a crisp sans-serif, architectural geometric, editorial serif, or technical monospace typeface for the workspace and exported briefs.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {FONT_OPTIONS.map((font) => {
            const isSelected = (settings.fontFamily || 'plus-jakarta') === font.id;
            return (
              <button
                key={font.id}
                type="button"
                onClick={() => {
                  onUpdateSettings({ fontFamily: font.id as FontFamilyId });
                  onShowToast(`Typography switched to ${font.name}.`, 'success');
                }}
                style={{ fontFamily: font.cssStack }}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? isDark
                      ? 'bg-[#1E2430] border-blue-500 ring-1 ring-blue-500'
                      : 'bg-blue-50 border-blue-600 ring-1 ring-blue-500'
                    : isDark
                    ? 'bg-[#12161F] border-slate-800 hover:bg-[#1A202C] hover:border-slate-700'
                    : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-sm font-bold truncate ${themeStyles.textPrimary}`}>
                      {font.name}
                    </span>
                    <span
                      className={`text-[9.5px] font-semibold px-1.5 py-0.5 rounded border ${
                        isDark
                          ? 'bg-slate-900 border-slate-700 text-slate-300'
                          : 'bg-white border-slate-300 text-slate-600'
                      }`}
                    >
                      {font.category}
                    </span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-500 flex-shrink-0" />}
                </div>
                <p className={`text-xs leading-snug mb-1 ${themeStyles.textSecondary}`}>
                  {font.sampleText}
                </p>
                <p className={`text-[10.5px] ${themeStyles.textMuted}`}>
                  {font.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Default Platform & Channel */}
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className={`w-4 h-4 ${themeStyles.secondaryAccent}`} />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${themeStyles.textSecondary}`}>
              {t.settings.defaultPlatformTitle}
            </h3>
          </div>
          <select
            value={settings.defaultPlatform}
            onChange={(e) => onUpdateSettings({ defaultPlatform: e.target.value as PlatformId })}
            className={`w-full py-2 px-3 rounded-xl text-xs border focus:outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-cyan-400'
                : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-500'
            }`}
          >
            {PLATFORMS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.tagline}
              </option>
            ))}
          </select>
          <p className={`text-[11px] mt-2 ${themeStyles.textMuted}`}>
            {t.settings.defaultPlatformHelp}
          </p>
        </div>

        {/* Default Reply Language & Slang */}
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Globe className={`w-4 h-4 ${themeStyles.secondaryAccent}`} />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${themeStyles.textSecondary}`}>
              {t.settings.replyLangTitle}
            </h3>
          </div>
          <select
            value={settings.defaultLanguage}
            onChange={(e) => onUpdateSettings({ defaultLanguage: e.target.value })}
            className={`w-full py-2 px-3 rounded-xl text-xs border focus:outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-cyan-400'
                : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-500'
            }`}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang === 'Auto Detect' ? '🌐 Auto Detect (Adapts to chat language)' : lang}
              </option>
            ))}
          </select>
          <p className={`text-[11px] mt-2 ${themeStyles.textMuted}`}>
            {t.settings.replyLangHelp}
          </p>
        </div>

        {/* Emoji Intensity */}
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sliders className={`w-4 h-4 ${themeStyles.secondaryAccent}`} />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${themeStyles.textSecondary}`}>
              {t.settings.emojiTitle}
            </h3>
          </div>
          <select
            value={settings.emojiIntensity}
            onChange={(e) => onUpdateSettings({ emojiIntensity: e.target.value as EmojiIntensity })}
            className={`w-full py-2 px-3 rounded-xl text-xs border focus:outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-cyan-400'
                : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-500'
            }`}
          >
            <option value="No Emojis">🚫 No Emojis (Strict formal text)</option>
            <option value="Minimal Emojis">🙂 Minimal Emojis (1 subtle emoji max)</option>
            <option value="Natural Emojis">😊 Natural Emojis (Human everyday cadence)</option>
            <option value="Expressive Emojis">🥳 Expressive Emojis (Vibrant emotional intensity)</option>
            <option value="Rich & Playful">🤩 Rich & Playful (Layered mood & reaction emojis)</option>
            <option value="Emoji-Forward">🚀 Emoji-Forward (High-energy expressive style)</option>
          </select>
        </div>

        {/* Target Response Length */}
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Sliders className={`w-4 h-4 ${themeStyles.secondaryAccent}`} />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${themeStyles.textSecondary}`}>
              {t.settings.lengthTitle}
            </h3>
          </div>
          <select
            value={settings.responseLength}
            onChange={(e) => onUpdateSettings({ responseLength: e.target.value as ResponseLength })}
            className={`w-full py-2 px-3 rounded-xl text-xs border focus:outline-none ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-cyan-400'
                : 'bg-slate-50 border-slate-300 text-slate-800 focus:border-indigo-500'
            }`}
          >
            <option value="Short">Short & Punchy (1-2 sentences)</option>
            <option value="Balanced">Balanced (2-3 natural sentences)</option>
            <option value="Detailed">Detailed (Full contextual paragraph)</option>
          </select>
        </div>

        {/* Privacy & Auto-Save */}
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 mb-3">
            <Shield className={`w-4 h-4 ${themeStyles.secondaryAccent}`} />
            <h3 className={`text-xs font-bold uppercase tracking-wider ${themeStyles.textSecondary}`}>
              {t.settings.privacyTitle}
            </h3>
          </div>
          <div className="space-y-3 text-xs">
            <label className="flex items-center justify-between cursor-pointer">
              <span className={themeStyles.textPrimary}>{t.settings.allowSaveHistory}</span>
              <input
                type="checkbox"
                checked={settings.saveHistory}
                onChange={(e) => onUpdateSettings({ saveHistory: e.target.checked })}
                className="rounded border-slate-600 text-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <span className={themeStyles.textPrimary}>{t.settings.autoAnalyzeLabel}</span>
              <input
                type="checkbox"
                checked={settings.autoAnalyzeOnGenerate}
                onChange={(e) => onUpdateSettings({ autoAnalyzeOnGenerate: e.target.checked })}
                className="rounded border-slate-600 text-indigo-600"
              />
            </label>
          </div>
        </div>

        {/* Danger Zone: Clear Local Data */}
        <div
          className={`p-5 rounded-2xl border ${
            isDark ? 'bg-[#12161F] border-slate-800 border-l-4 border-l-rose-500' : 'bg-rose-50/50 border-rose-500/25'
          }`}
        >
          <div className="flex items-center gap-2 mb-2 text-rose-400">
            <Trash2 className="w-4 h-4 text-rose-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-500">
              {t.settings.cleanupTitle}
            </h3>
          </div>
          <p className={`text-xs mb-3 ${themeStyles.textMuted}`}>
            {t.settings.cleanupDesc}
          </p>
          {showClearConfirm ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-rose-500">{t.settings.cleanupConfirmPrompt}</span>
              <button
                type="button"
                onClick={() => {
                  onClearAllData();
                  setShowClearConfirm(false);
                  onShowToast(t.settings.cleanupToast, 'success');
                }}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-sm"
              >
                {t.settings.cleanupConfirmBtn}
              </button>
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {t.settings.cleanupCancelBtn}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-sm"
            >
              {t.settings.cleanupActionBtn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

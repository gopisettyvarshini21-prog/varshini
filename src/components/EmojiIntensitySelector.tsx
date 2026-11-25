import React, { useState } from 'react';
import { Smile, Globe, Clock, Sparkles, Plus } from 'lucide-react';
import { EmojiIntensity, ResponseLength } from '../types';

interface ControlsProps {
  emojiIntensity: EmojiIntensity;
  onChangeEmojiIntensity: (intensity: EmojiIntensity) => void;
  language: string;
  onChangeLanguage: (lang: string) => void;
  responseLength: ResponseLength;
  onChangeResponseLength: (len: ResponseLength) => void;
  onInsertEmoji?: (emoji: string) => void;
  selectedEmojis?: string[];
  onTogglePreferredEmoji?: (emoji: string) => void;
  isDark: boolean;
  themeStyles: any;
}

export const LANGUAGES = [
  'Auto Detect',
  'English',
  'Hinglish',
  'Hindi',
  'Telugu',
  'Tamil',
  'Kannada',
  'Malayalam',
  'Bengali',
  'Marathi',
  'Spanish',
  'French',
  'German',
  'Japanese',
];

const EMOJI_PACKS: {
  id: 'work' | 'warm' | 'fun' | 'hype';
  label: string;
  emojis: string[];
}[] = [
  {
    id: 'work',
    label: 'Work & Wins',
    emojis: ['🤝', '💼', '✅', '📊', '🎯', '📌', '🗓️', '🚀', '💡', '👏'],
  },
  {
    id: 'warm',
    label: 'Warm & Care',
    emojis: ['😊', '💖', '🫶', '🙏', '🌟', '🥹', '🫂', '🌸', '☀️', '💐'],
  },
  {
    id: 'fun',
    label: 'Fun & Reactions',
    emojis: ['😂', '🤣', '😉', '😎', '☕', '🥳', '🎉', '🙌', '🤩', '✌️'],
  },
  {
    id: 'hype',
    label: 'Gen Z & Bold',
    emojis: ['🔥', '💯', '🧢', '💅', '✨', '⚡', '👑', '🫡', '🫠', '💫'],
  },
];

export const EmojiIntensitySelector: React.FC<ControlsProps> = ({
  emojiIntensity,
  onChangeEmojiIntensity,
  language,
  onChangeLanguage,
  responseLength,
  onChangeResponseLength,
  onInsertEmoji,
  selectedEmojis = [],
  onTogglePreferredEmoji,
  isDark,
  themeStyles,
}) => {
  const [activePack, setActivePack] = useState<'work' | 'warm' | 'fun' | 'hype'>('warm');

  const emojiOptions: { id: EmojiIntensity; label: string; icon: string; desc: string }[] = [
    { id: 'No Emojis', label: 'None', icon: '🚫', desc: '0 emojis (strict formal)' },
    { id: 'Minimal Emojis', label: 'Minimal', icon: '🙂', desc: '1 subtle emoji max' },
    { id: 'Natural Emojis', label: 'Natural', icon: '😊', desc: '1-2 human-like emojis' },
    { id: 'Expressive Emojis', label: 'Expressive', icon: '🥳', desc: 'Vibrant & emotional' },
    { id: 'Rich & Playful', label: 'Rich Mood', icon: '🤩', desc: 'Layered warm & witty emojis' },
    { id: 'Emoji-Forward', label: 'Vibrant+', icon: '🚀', desc: 'High-energy reaction emojis' },
  ];

  const lengthOptions: { id: ResponseLength; label: string; desc: string }[] = [
    { id: 'Short', label: 'Short & Punchy', desc: '1–2 crisp sentences' },
    { id: 'Balanced', label: 'Balanced', desc: '3–5 natural sentences' },
    { id: 'Detailed', label: 'Detailed', desc: '2–3 full paragraphs' },
  ];

  const currentPack = EMOJI_PACKS.find((p) => p.id === activePack) || EMOJI_PACKS[0];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        {/* Emoji Intelligence */}
        <div
          className={`lg:col-span-5 p-3 rounded-xl border ${
            isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1.5">
              <Smile className={`w-3.5 h-3.5 ${themeStyles.secondaryAccent}`} />
              <label className={`text-xs font-bold tracking-wide uppercase ${themeStyles.textSecondary}`}>
                Emoji Intelligence
              </label>
            </div>
            <span className={`text-[10px] ${themeStyles.textMuted}`}>{emojiIntensity}</span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
            {emojiOptions.map((opt) => {
              const isSelected = emojiIntensity === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeEmojiIntensity(opt.id)}
                  title={opt.desc}
                  className={`py-1.5 px-1 rounded-lg text-center transition-all border flex flex-col items-center justify-center ${
                    isSelected
                      ? `${themeStyles.primaryAccent} font-semibold shadow-sm`
                      : isDark
                      ? 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-sm leading-none mb-0.5">{opt.icon}</span>
                  <span className="text-[10px] leading-tight truncate w-full">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Language / Code-switching */}
        <div
          className={`lg:col-span-4 p-3 rounded-xl border ${
            isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Globe className={`w-3.5 h-3.5 ${themeStyles.secondaryAccent}`} />
              <label className={`text-xs font-bold tracking-wide uppercase ${themeStyles.textSecondary}`}>
                Language / Slang
              </label>
            </div>
            <span className="text-[10px] text-emerald-400 font-medium">Code-Switch Ready</span>
          </div>
          <select
            value={language}
            onChange={(e) => onChangeLanguage(e.target.value)}
            className={`w-full py-1.5 px-2.5 rounded-lg text-xs border focus:outline-none focus:ring-1 transition-all ${
              isDark
                ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-cyan-400 focus:ring-cyan-400'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:ring-indigo-500'
            }`}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang === 'Auto Detect' ? '🌐 Auto Detect (Matches chat cadence)' : lang}
              </option>
            ))}
          </select>
          <p className={`text-[10px] mt-1.5 ${themeStyles.textMuted}`}>
            Supports Hinglish, Telugu & dialect nuances naturally.
          </p>
        </div>

        {/* Response Length */}
        <div
          className={`lg:col-span-3 p-3 rounded-xl border ${
            isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className={`w-3.5 h-3.5 ${themeStyles.secondaryAccent}`} />
            <label className={`text-xs font-bold tracking-wide uppercase ${themeStyles.textSecondary}`}>
              Target Length
            </label>
          </div>
          <div className="grid grid-cols-3 gap-1">
            {lengthOptions.map((opt) => {
              const isSelected = responseLength === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeResponseLength(opt.id)}
                  title={opt.desc}
                  className={`py-2 px-1 rounded-lg text-center transition-all border flex flex-col items-center justify-center ${
                    isSelected
                      ? `${themeStyles.primaryAccent} font-semibold shadow-sm`
                      : isDark
                      ? 'border-slate-800 bg-slate-950/60 text-slate-300 hover:bg-slate-800'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[11px] font-semibold leading-tight">{opt.id}</span>
                  <span className="text-[9px] opacity-75 mt-0.5">{opt.desc.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Interactive Emoji Studio Bar */}
      {(onInsertEmoji || onTogglePreferredEmoji) && (
        <div
          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
            isDark ? 'bg-slate-900/35 border-slate-800' : 'bg-slate-50/80 border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`text-[11px] font-bold flex items-center gap-1 mr-1 ${themeStyles.textSecondary}`}>
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Emoji Pack:</span>
            </span>
            {EMOJI_PACKS.map((pack) => (
              <button
                key={pack.id}
                type="button"
                onClick={() => setActivePack(pack.id)}
                className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors whitespace-nowrap ${
                  activePack === pack.id
                    ? `${themeStyles.primaryAccent}`
                    : isDark
                    ? 'text-slate-300 hover:bg-slate-800'
                    : 'text-slate-600 hover:bg-slate-200/70'
                }`}
              >
                {pack.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1">
            {currentPack.emojis.map((emoji) => {
              const isPinned = selectedEmojis.includes(emoji);
              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onInsertEmoji?.(emoji);
                    onTogglePreferredEmoji?.(emoji);
                  }}
                  title={`Add ${emoji} to input & prioritize in replies`}
                  className={`w-8 h-8 rounded-lg text-base flex items-center justify-center border transition-transform hover:scale-110 ${
                    isPinned
                      ? isDark
                        ? 'bg-blue-500/20 border-blue-400 ring-1 ring-blue-400/50'
                        : 'bg-blue-50 border-blue-500 ring-1 ring-blue-300'
                      : isDark
                      ? 'bg-slate-950/70 border-slate-800 hover:border-slate-600'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
            {selectedEmojis.length > 0 && (
              <span className={`ml-1 text-[10px] font-semibold flex items-center gap-0.5 ${themeStyles.textMuted}`}>
                <Plus className="w-3 h-3" /> {selectedEmojis.length} pinned
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

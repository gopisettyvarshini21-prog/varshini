import React, { useState } from 'react';
import { Plus, X, Sparkles } from 'lucide-react';

interface ToneSelectorProps {
  selectedTones: string[];
  onChangeTones: (tones: string[]) => void;
  customTone: string;
  onChangeCustomTone: (tone: string) => void;
  isDark: boolean;
  themeStyles: any;
}

export const AVAILABLE_TONES = [
  { label: 'Friendly', emoji: '😊', desc: 'Warm, conversational & approachable' },
  { label: 'Funny', emoji: '😂', desc: 'Witty, humorous & lighthearted' },
  { label: 'Warm', emoji: '💖', desc: 'Heartfelt, gentle & empathetic' },
  { label: 'Emotional', emoji: '🥹', desc: 'Vulnerable & emotionally attuned' },
  { label: 'Confident', emoji: '😎', desc: 'Decisive, self-assured & clear' },
  { label: 'Professional', emoji: '🤝', desc: 'Polished, courteous & business-ready' },
  { label: 'Calm', emoji: '🧊', desc: 'Composed, steady & de-escalating' },
  { label: 'Direct', emoji: '🎯', desc: 'Straight to the point with zero fluff' },
  { label: 'Supportive', emoji: '🫶', desc: 'Encouraging, caring & reassuring' },
  { label: 'Gen Z Slang', emoji: '🧢', desc: 'No cap, fr fr, bet, lowkey, cooked & rizz' },
  { label: 'Sarcastic & Witty', emoji: '💅', desc: 'Cheeky banter, dry humor & side-eye' },
  { label: 'Playful', emoji: '😉', desc: 'Teasing, spirited & cheerful' },
  { label: 'Polite', emoji: '🙏', desc: 'Respectful, grateful & well-mannered' },
  { label: 'Bold', emoji: '🔥', desc: 'Assertive, vibrant & impactful' },
  { label: 'Creative', emoji: '✨', desc: 'Unique phrasing, imaginative & colorful' },
  { label: 'Diplomatic', emoji: '🕊️', desc: 'Tactful, balanced & bridging' },
  { label: 'Empathetic', emoji: '🫂', desc: 'Deeply understanding & reassuring' },
  { label: 'Persuasive', emoji: '💡', desc: 'Compelling, clear & solution-oriented' },
  { label: 'Enthusiastic', emoji: '🚀', desc: 'High-energy, optimistic & encouraging' },
  { label: 'Executive Brief', emoji: '📋', desc: 'Crisp boardroom clarity & authority' },
];

export const ToneSelector: React.FC<ToneSelectorProps> = ({
  selectedTones,
  onChangeTones,
  customTone,
  onChangeCustomTone,
  isDark,
  themeStyles,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);

  const toggleTone = (label: string) => {
    if (selectedTones.includes(label)) {
      if (selectedTones.length > 1) {
        onChangeTones(selectedTones.filter((t) => t !== label));
      }
    } else {
      onChangeTones([...selectedTones, label]);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <label className={`text-xs font-bold tracking-wide uppercase ${themeStyles.textSecondary}`}>
            Response Style & Tones
          </label>
          <p className={`text-[11px] ${themeStyles.textMuted}`}>
            Select one or combine compatible styles. Add custom instructions below.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowCustomInput(!showCustomInput)}
            className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1 transition-all ${
              showCustomInput || customTone
                ? isDark
                  ? 'bg-[#1E2430] border-blue-500 text-slate-100'
                  : 'bg-blue-50 border-blue-500 text-blue-800'
                : isDark
                ? 'border-slate-700 bg-[#161B22] text-slate-300 hover:bg-[#1E2430]'
                : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>{showCustomInput ? 'Hide Custom' : '+ Custom Style'}</span>
          </button>
        </div>
      </div>

      {/* Chips */}
      <div className="flex flex-wrap gap-1.5">
        {AVAILABLE_TONES.map((tone) => {
          const isSelected = selectedTones.includes(tone.label);
          return (
            <button
              key={tone.label}
              type="button"
              onClick={() => toggleTone(tone.label)}
              title={tone.desc}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                isSelected
                  ? `${themeStyles.primaryAccent} shadow-sm font-semibold scale-[1.02]`
                  : `${
                      isDark
                        ? 'bg-slate-800/70 border border-slate-700/70 text-slate-300 hover:bg-slate-700/60'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`
              }`}
            >
              <span>{tone.emoji}</span>
              <span>{tone.label}</span>
            </button>
          );
        })}
      </div>

      {/* Custom Style Input Box */}
      {(showCustomInput || customTone) && (
        <div
          className={`p-3 rounded-xl border mt-2 transition-all ${
            isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-semibold flex items-center gap-1 ${themeStyles.textPrimary}`}>
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              Custom Style / Persona Instructions
            </span>
            {customTone && (
              <button
                type="button"
                onClick={() => onChangeCustomTone('')}
                className="text-[11px] text-rose-400 hover:underline flex items-center gap-0.5"
              >
                <X className="w-3 h-3" /> Clear
              </button>
            )}
          </div>
          <input
            type="text"
            value={customTone}
            onChange={(e) => onChangeCustomTone(e.target.value)}
            placeholder="e.g. 'Reply like an older brother', 'Simple English with Telugu touches', 'Polite but not overly formal'"
            className={`w-full px-3 py-2 rounded-lg text-xs border focus:outline-none focus:ring-1 transition-all ${
              isDark
                ? 'bg-[#0D1117] border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500'
                : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600'
            }`}
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              'Reply like a close friend',
              'Keep it subtle & understated',
              'Natural Hinglish code-switching',
              'Polite but firm boundary',
            ].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onChangeCustomTone(preset)}
                className={`text-[10px] px-2 py-0.5 rounded-md border ${
                  isDark
                    ? 'border-slate-800 bg-slate-900 text-slate-400 hover:text-slate-200'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
                }`}
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

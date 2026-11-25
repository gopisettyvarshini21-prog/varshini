import React, { useMemo } from 'react';
import {
  Compass,
  Heart,
  TrendingUp,
  ShieldAlert,
  Lightbulb,
  Target,
  Sparkles,
} from 'lucide-react';
import { SituationAnalysis } from '../types';
import { ToneRadarChart, deriveToneDimensions } from './ToneRadarChart';

interface SituationCardProps {
  analysis: SituationAnalysis;
  isDark: boolean;
  themeStyles: any;
  onApplyStrategy?: () => void;
}

export const SituationCard: React.FC<SituationCardProps> = ({
  analysis,
  isDark,
  themeStyles,
  onApplyStrategy,
}) => {
  const { dimensions, isBaseline } = useMemo(() => deriveToneDimensions(analysis), [analysis]);

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'High':
        return isDark
          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          : 'bg-rose-50 text-rose-700 border-rose-300';
      case 'Medium':
        return isDark
          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
          : 'bg-amber-50 text-amber-800 border-amber-300';
      default:
        return isDark
          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
          : 'bg-emerald-50 text-emerald-700 border-emerald-300';
    }
  };

  return (
    <div
      className={`rounded-2xl border p-5 sm:p-6 transition-all shadow-sm space-y-5 ${themeStyles.cardBg} ${themeStyles.cardBorder}`}
    >
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-700/25">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${themeStyles.primaryAccent}`}>
            <Compass className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className={`text-[11px] font-semibold ${themeStyles.secondaryAccent}`}>
              Situation Intelligence Breakdown
            </span>
            <h3 className={`text-base font-bold truncate ${themeStyles.textPrimary}`}>
              {analysis.situation}
            </h3>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`px-2.5 py-1 rounded-lg font-semibold border ${getUrgencyColor(analysis.urgency)}`}>
            {analysis.urgency} Urgency
          </span>
          <span className={`px-2.5 py-1 rounded-lg font-semibold border ${themeStyles.badgeBg}`}>
            {analysis.category}
          </span>
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold border tabular-nums ${
              isDark
                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/25'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>{analysis.confidenceScore}% Match</span>
          </div>
        </div>
      </div>

      {/* Tone Radar Chart Visualization */}
      <ToneRadarChart
        dimensions={dimensions}
        isBaseline={isBaseline}
        isDark={isDark}
        themeStyles={themeStyles}
      />

      {/* Grid: Dynamics & Intent */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Participant Dynamics */}
        <div
          className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#12161F] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Heart className="w-4 h-4 text-pink-400" />
            <h4 className={`text-xs font-bold ${themeStyles.textSecondary}`}>
              Relationship Dynamics
            </h4>
          </div>
          <p className={`text-xs leading-relaxed ${themeStyles.textPrimary}`}>
            {analysis.participantDynamics}
          </p>
        </div>

        {/* Sender's True Intent */}
        <div
          className={`p-4 rounded-xl border ${
            isDark ? 'bg-[#12161F] border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target className="w-4 h-4 text-blue-400" />
            <h4 className={`text-xs font-bold ${themeStyles.textSecondary}`}>
              Underlying Sender Intent
            </h4>
          </div>
          <p className={`text-xs leading-relaxed ${themeStyles.textPrimary}`}>
            {analysis.latestMessageIntent}
          </p>
        </div>
      </div>

      {/* Emotional Signals */}
      {analysis.emotionalSignals && analysis.emotionalSignals.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            <h4 className={`text-xs font-bold ${themeStyles.textSecondary}`}>
              Detected Emotional Signals
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.emotionalSignals.map((signal, idx) => (
              <div
                key={idx}
                className={`px-3 py-2 rounded-xl border text-xs flex items-center gap-2 ${
                  isDark ? 'bg-[#12161F] border-slate-800' : 'bg-white border-slate-200'
                }`}
              >
                <span className={`font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                  {signal.label}
                </span>
                <span
                  className={`text-[11px] px-1.5 py-0.5 rounded font-semibold ${
                    signal.intensity === 'High'
                      ? isDark
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-rose-100 text-rose-800'
                      : signal.intensity === 'Moderate'
                      ? isDark
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-amber-100 text-amber-800'
                      : isDark
                      ? 'bg-blue-500/20 text-blue-300'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {signal.intensity}
                </span>
                {signal.context && (
                  <span className={`text-[11px] italic ${themeStyles.textMuted}`}>
                    — &ldquo;{signal.context}&rdquo;
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategic Recommendation & Pitfalls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-700/25">
        {/* Recommended Strategy */}
        <div
          className={`p-4 rounded-xl border ${
            isDark
              ? 'bg-[#12161F] border-slate-700 text-slate-200'
              : 'bg-sky-50/70 border-sky-200 text-sky-950'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-1.5 text-blue-500 font-bold text-xs">
              <Lightbulb className="w-4 h-4 text-blue-500" />
              <span>Recommended Human Strategy</span>
            </div>
            {onApplyStrategy && (
              <button
                type="button"
                onClick={onApplyStrategy}
                className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                Use as Goal
              </button>
            )}
          </div>
          <p className="text-xs leading-relaxed">{analysis.recommendedStrategy}</p>
        </div>

        {/* Pitfalls to Avoid */}
        <div
          className={`p-4 rounded-xl border ${
            isDark
              ? 'bg-[#12161F] border-slate-700 text-slate-200'
              : 'bg-rose-50/70 border-rose-200 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1.5 text-rose-500 font-bold text-xs">
            <ShieldAlert className="w-4 h-4 text-rose-500" />
            <span>Pitfalls &amp; What Not to Say</span>
          </div>
          <p className="text-xs leading-relaxed">{analysis.potentialPitfalls}</p>
        </div>
      </div>
    </div>
  );
};

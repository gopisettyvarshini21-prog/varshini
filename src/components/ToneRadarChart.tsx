import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { Activity } from 'lucide-react';
import { SituationAnalysis, ToneDimension } from '../types';

export function deriveToneDimensions(
  analysis?: SituationAnalysis | null,
  chatHistory: string = '',
  latestMessage: string = ''
): { dimensions: ToneDimension[]; isBaseline: boolean } {
  if (analysis?.toneDimensions && analysis.toneDimensions.length >= 3) {
    return {
      dimensions: analysis.toneDimensions.map((d) => ({
        axis: d.axis,
        score: Math.min(100, Math.max(0, Math.round(d.score))),
      })),
      isBaseline: false,
    };
  }

  const combined = `${chatHistory || ''} ${latestMessage || ''}`.trim();

  if (analysis && !combined) {
    const urgencyBase = analysis.urgency === 'High' ? 84 : analysis.urgency === 'Medium' ? 56 : 28;
    const signalsText = (analysis.emotionalSignals || []).map((s) => s.label.toLowerCase()).join(' ');
    const cat = (analysis.category || '').toLowerCase();

    const empathy =
      /empath|care|support|apolog|grat|warm|kind|concern/.test(signalsText) || /apology|romantic|friendship/.test(cat)
        ? 78
        : 54;
    const directness = /business|workplace|urgent|support/.test(cat) ? 74 : 58;
    const warmth = /romantic|friendship|casual|invitation/.test(cat) ? 80 : 48;
    const formality = /business|workplace|academic/.test(cat) ? 78 : /casual|romantic/.test(cat) ? 28 : 55;
    const assertiveness =
      analysis.urgency === 'High' || /frustr|firm|assert|boundar|pressure/.test(signalsText) ? 76 : 52;

    return {
      dimensions: [
        { axis: 'Empathy', score: empathy },
        { axis: 'Directness', score: directness },
        { axis: 'Urgency', score: urgencyBase },
        { axis: 'Warmth', score: warmth },
        { axis: 'Formality', score: formality },
        { axis: 'Assertiveness', score: assertiveness },
      ],
      isBaseline: false,
    };
  }

  if (!combined) {
    return {
      dimensions: [
        { axis: 'Empathy', score: 0 },
        { axis: 'Directness', score: 0 },
        { axis: 'Urgency', score: 0 },
        { axis: 'Warmth', score: 0 },
        { axis: 'Formality', score: 0 },
        { axis: 'Assertiveness', score: 0 },
      ],
      isBaseline: true,
    };
  }

  const lower = combined.toLowerCase();
  const countMatches = (re: RegExp) => (lower.match(re) || []).length;
  const clamp = (n: number) => Math.min(98, Math.max(15, Math.round(n)));

  const urgencyHits =
    countMatches(/\b(asap|urgent|urgently|immediately|today|eod|deadline|hurry|critical|emergency|now|soon|priority)\b/g) +
    countMatches(/!/g);
  const empathyHits = countMatches(
    /\b(understand|appreciate|sorry|apologize|thank|thanks|grateful|hope|care|feel|support|please|kindly)\b/g
  );
  const directHits = countMatches(
    /\b(need|must|confirm|send|clarify|require|expect|update|when|what|status|deliver|provide|decide)\b/g
  );
  const warmthHits = countMatches(
    /\b(hi|hello|hey|glad|happy|excited|great|wonderful|love|best|warm|cheers|take care)\b/g
  );
  const formalHits = countMatches(
    /\b(sincerely|regarding|attached|dear|respectfully|pursuant|hereby|request|faculty|manager|director|review|schedule|contract|proposal)\b/g
  );
  const assertiveHits = countMatches(
    /\b(must|require|cannot|won't|boundary|non-negotiable|firm|expect|final|ensure|immediately|approve)\b/g
  );

  return {
    dimensions: [
      { axis: 'Empathy', score: clamp(36 + empathyHits * 13) },
      { axis: 'Directness', score: clamp(44 + directHits * 12) },
      {
        axis: 'Urgency',
        score: analysis?.urgency === 'High' ? Math.max(76, clamp(32 + urgencyHits * 15)) : clamp(32 + urgencyHits * 15),
      },
      { axis: 'Warmth', score: clamp(34 + warmthHits * 13 + empathyHits * 5) },
      { axis: 'Formality', score: clamp(38 + formalHits * 12 - warmthHits * 3) },
      { axis: 'Assertiveness', score: clamp(38 + assertiveHits * 14 + directHits * 5) },
    ],
    isBaseline: false,
  };
}

function getLevelText(score: number): string {
  if (score === 0) return 'Pending';
  if (score >= 75) return 'Strong';
  if (score >= 50) return 'Moderate';
  return 'Low';
}

interface ToneRadarChartProps {
  dimensions: ToneDimension[];
  isBaseline?: boolean;
  isDark: boolean;
  themeStyles: any;
  title?: string;
  subtitle?: string;
}

export const ToneRadarChart: React.FC<ToneRadarChartProps> = ({
  dimensions,
  isBaseline = false,
  isDark,
  themeStyles,
  title = 'Conversation Tone Radar',
  subtitle = 'Detected intensity across six core communication signals (0–100 scale)',
}) => {
  const sortedTop = [...dimensions]
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2);

  return (
    <div
      className={`rounded-2xl border p-5 transition-colors ${
        isDark
          ? 'bg-[#12161F] border-slate-700/80'
          : 'bg-slate-50/90 border-slate-300'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-700/20">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 ${
              isDark ? 'bg-blue-500/10 border-blue-500/25 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
            }`}
          >
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className={`text-xs sm:text-sm font-bold truncate ${themeStyles.textPrimary}`}>
              {title}
            </h4>
            <p className={`text-[11px] truncate ${themeStyles.textMuted}`}>
              {subtitle}
            </p>
          </div>
        </div>

        {!isBaseline && sortedTop.length > 0 && (
          <div className={`text-[11px] font-semibold tabular-nums whitespace-nowrap ${themeStyles.textSecondary}`}>
            Lead tones: {sortedTop.map((d) => `${d.axis} (${d.score})`).join(' · ')}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center pt-4">
        {/* Recharts Radar Visualization */}
        <div className="lg:col-span-7 min-w-0 h-[270px] relative">
          <ResponsiveContainer width="100%" height={270}>
            <RadarChart cx="50%" cy="50%" outerRadius="72%" data={dimensions}>
              <PolarGrid stroke={isDark ? '#2B3547' : '#CBD5E1'} />
              <PolarAngleAxis
                dataKey="axis"
                tick={{
                  fill: isDark ? '#CBD5E1' : '#334155',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tickCount={5}
                tick={{
                  fill: isDark ? '#64748B' : '#94A3B8',
                  fontSize: 10,
                }}
                axisLine={false}
              />
              <Radar
                name="Detected Tone"
                dataKey="score"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={isBaseline ? 0.08 : 0.28}
                strokeWidth={2.5}
                dot={{ r: 3.5, fill: '#60A5FA', strokeWidth: 0 }}
              />
              <Tooltip
                formatter={(value: any) => [`${value} / 100`, 'Intensity']}
                contentStyle={{
                  backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
                  borderColor: isDark ? '#334155' : '#CBD5E1',
                  borderRadius: '10px',
                  fontSize: '12px',
                  color: isDark ? '#F8FAFC' : '#0F172A',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                }}
                labelStyle={{
                  fontWeight: 700,
                  marginBottom: '2px',
                  color: isDark ? '#93C5FD' : '#1D4ED8',
                }}
              />
            </RadarChart>
          </ResponsiveContainer>

          {isBaseline && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <span
                className={`px-3 py-1.5 rounded-lg border text-xs font-medium ${
                  isDark
                    ? 'bg-[#0D1117]/90 border-slate-700 text-slate-300'
                    : 'bg-white/95 border-slate-300 text-slate-700'
                }`}
              >
                Enter a message above or run Analyze Situation
              </span>
            </div>
          )}
        </div>

        {/* Tabular Breakdown of All 6 Mapped Tone Dimensions */}
        <div className="lg:col-span-5 space-y-2.5 min-w-0">
          {dimensions.map((dim) => (
            <div key={dim.axis} className="space-y-1">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className={`font-semibold truncate ${themeStyles.textPrimary}`}>
                  {dim.axis}
                </span>
                <div className="flex items-center gap-2 shrink-0 tabular-nums">
                  <span className={`text-[11px] ${themeStyles.textMuted}`}>
                    {getLevelText(dim.score)}
                  </span>
                  <span className={`font-bold w-8 text-right ${themeStyles.textPrimary}`}>
                    {dim.score}
                  </span>
                </div>
              </div>
              <div
                className={`h-2 rounded-full overflow-hidden ${
                  isDark ? 'bg-slate-800' : 'bg-slate-200'
                }`}
              >
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${dim.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Sparkles,
  Bot,
  Zap,
  Search,
  Briefcase,
  Check,
  SpellCheck,
  PenTool,
  Languages,
} from 'lucide-react';
import { AIModelPersona } from '../types';

interface AIModelSelectorProps {
  selectedModel: AIModelPersona;
  onSelectModel: (model: AIModelPersona) => void;
  isDark: boolean;
  themeStyles: any;
}

export interface ModelPersonaMeta {
  id: AIModelPersona;
  name: string;
  creator: string;
  category: 'Reasoning Engine' | 'Text Quality Engine';
  tagline: string;
  badge: string;
  icon: React.ReactNode;
  accentColor: string;
}

export const AI_MODELS: ModelPersonaMeta[] = [
  {
    id: 'gemini',
    name: 'Gemini 3.8 Flash',
    creator: 'Google',
    category: 'Reasoning Engine',
    tagline: 'Deep conversational context, multi-layered reasoning & psychological attunement',
    badge: 'Flagship Active',
    icon: <Sparkles className="w-4 h-4" />,
    accentColor: '#2563EB',
  },
  {
    id: 'chatgpt',
    name: 'ChatGPT (GPT-4o)',
    creator: 'OpenAI Persona',
    category: 'Reasoning Engine',
    tagline: 'Conversational warmth, dynamic adaptability, and spontaneous natural pacing',
    badge: 'Adaptive Flow',
    icon: <Bot className="w-4 h-4" />,
    accentColor: '#10A37F',
  },
  {
    id: 'claude',
    name: 'Claude 3.7 Sonnet',
    creator: 'Anthropic Persona',
    category: 'Reasoning Engine',
    tagline: 'Deep emotional tact, intellectual eloquence, and careful de-escalation',
    badge: 'Nuanced Etiquette',
    icon: <Zap className="w-4 h-4" />,
    accentColor: '#D97706',
  },
  {
    id: 'perplexity',
    name: 'Perplexity Sonar',
    creator: 'Perplexity Persona',
    category: 'Reasoning Engine',
    tagline: 'Grounded in facts, crisp structured points, and clear verification links',
    badge: 'Fact-Grounded',
    icon: <Search className="w-4 h-4" />,
    accentColor: '#06B6D4',
  },
  {
    id: 'copilot',
    name: 'Microsoft Copilot',
    creator: 'Microsoft Persona',
    category: 'Text Quality Engine',
    tagline: 'Executive workplace brevity, polished office etiquette, and action items',
    badge: 'Workplace Brevity',
    icon: <Briefcase className="w-4 h-4" />,
    accentColor: '#0078D4',
  },
  {
    id: 'grammarly',
    name: 'Grammarly Executive',
    creator: 'Text Quality Engine',
    category: 'Text Quality Engine',
    tagline: 'Zero-error grammar perfection, crisp clarity calibration, and executive readability',
    badge: 'Precision Polish',
    icon: <SpellCheck className="w-4 h-4" />,
    accentColor: '#15C39A',
  },
  {
    id: 'jasper',
    name: 'Jasper Editorial',
    creator: 'Text Quality Engine',
    category: 'Text Quality Engine',
    tagline: 'High-impact persuasive narrative, storytelling hooks, and refined brand voice',
    badge: 'Editorial Impact',
    icon: <PenTool className="w-4 h-4" />,
    accentColor: '#8B5CF6',
  },
  {
    id: 'deepl',
    name: 'DeepL Write Stylist',
    creator: 'Text Quality Engine',
    category: 'Text Quality Engine',
    tagline: 'Native-level idiomatic fluency across languages, slang, and formal register',
    badge: 'Multilingual Flow',
    icon: <Languages className="w-4 h-4" />,
    accentColor: '#0F62FE',
  },
];

export const AIModelSelector: React.FC<AIModelSelectorProps> = ({
  selectedModel,
  onSelectModel,
  isDark,
  themeStyles,
}) => {
  const activeMeta = AI_MODELS.find((m) => m.id === selectedModel);

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <label className={`text-xs font-bold tracking-wide uppercase ${themeStyles.textSecondary}`}>
            AI Intelligence & Text Quality Engines ({AI_MODELS.length})
          </label>
          <p className={`text-[11px] ${themeStyles.textMuted}`}>
            Select an AI reasoning model or dedicated Text Quality Engine for grammar polish, editorial cadence, or multilingual precision
          </p>
        </div>
        {activeMeta && (
          <span className={`text-[11px] font-semibold whitespace-nowrap ${themeStyles.secondaryAccent}`}>
            Active: {activeMeta.name} · {activeMeta.badge}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {AI_MODELS.map((model) => {
          const isSelected = selectedModel === model.id;
          return (
            <button
              key={model.id}
              type="button"
              onClick={() => onSelectModel(model.id)}
              className={`relative p-3 rounded-xl border text-left transition-colors duration-150 flex flex-col justify-between group ${
                isSelected
                  ? `${isDark ? 'bg-[#1E2430] border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-blue-50/80 border-blue-600 shadow-xs ring-1 ring-blue-400'}`
                  : `${isDark ? 'bg-[#12161F] border-slate-800 hover:bg-[#1A202C]' : 'bg-white border-slate-200 hover:bg-slate-50'}`
              }`}
            >
              {isSelected && (
                <div className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              <div>
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center mb-2 transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${model.accentColor}18`,
                    color: model.accentColor,
                  }}
                >
                  {model.icon}
                </div>
                <h4 className={`text-xs font-bold leading-tight pr-4 ${themeStyles.textPrimary}`}>
                  {model.name}
                </h4>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                  {model.creator} · {model.badge}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

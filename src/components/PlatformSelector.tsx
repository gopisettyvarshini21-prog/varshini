import React from 'react';
import {
  Instagram,
  MessageCircle,
  Linkedin,
  Send,
  Ghost,
  Gamepad2,
  Globe,
  Check,
} from 'lucide-react';
import { PlatformId } from '../types';

interface PlatformSelectorProps {
  selectedPlatform: PlatformId;
  onSelectPlatform: (platform: PlatformId) => void;
  isDark: boolean;
  themeStyles: any;
}

export interface PlatformMeta {
  id: PlatformId;
  name: string;
  badge: string;
  icon: React.ReactNode;
  tagline: string;
  styleAdvice: string;
  accentColor: string;
}

export const PLATFORMS: PlatformMeta[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    badge: '💬 Everyday Chat',
    icon: <MessageCircle className="w-5 h-5" />,
    tagline: 'Personal, friends & family chats',
    styleAdvice: 'Short natural replies, natural conversational phrasing, friendly cadence.',
    accentColor: '#25D366',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    badge: '📸 DMs & Stories',
    icon: <Instagram className="w-5 h-5" />,
    tagline: 'Casual DMs, stories, witty reactions',
    styleAdvice: 'Playful, modern, concise, aesthetic, story-friendly banter.',
    accentColor: '#E1306C',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    badge: '💼 Professional',
    icon: <Linkedin className="w-5 h-5" />,
    tagline: 'Recruiters, networking & business',
    styleAdvice: 'Polished, respectful, clear value, executive composure, restrained emojis.',
    accentColor: '#0A66C2',
  },
  {
    id: 'telegram',
    name: 'Telegram',
    badge: '✈️ Fast & Direct',
    icon: <Send className="w-5 h-5" />,
    tagline: 'Direct messages & community channels',
    styleAdvice: 'Direct, contextual, adaptable from tech banter to private dialog.',
    accentColor: '#229ED9',
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    badge: '👻 Spontaneous',
    icon: <Ghost className="w-5 h-5" />,
    tagline: 'Fast, playful & informal snappiness',
    styleAdvice: 'Ultra short, quick, unpretentious, slang-friendly phrasing.',
    accentColor: '#FFFC00',
  },
  {
    id: 'discord',
    name: 'Discord',
    badge: '🎮 Gaming & Squads',
    icon: <Gamepad2 className="w-5 h-5" />,
    tagline: 'Servers, gaming squads & teams',
    styleAdvice: 'Gamer culture, community slang, witty meme-awareness, relaxed flow.',
    accentColor: '#5865F2',
  },
  {
    id: 'custom',
    name: 'Other / Custom',
    badge: '🌐 Universal',
    icon: <Globe className="w-5 h-5" />,
    tagline: 'Emails, SMS, Slack or pasted chats',
    styleAdvice: 'Balanced situation-driven response tailored strictly to context.',
    accentColor: '#8B5CF6',
  },
];

export const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatform,
  onSelectPlatform,
  isDark,
  themeStyles,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className={`text-xs font-bold tracking-wide uppercase ${themeStyles.textSecondary}`}>
            Communication Platform
          </label>
          <p className={`text-[11px] ${themeStyles.textMuted}`}>
            Shapes tone, phrasing conventions, and platform-specific etiquette
          </p>
        </div>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${themeStyles.badgeBg}`}>
          {PLATFORMS.find((p) => p.id === selectedPlatform)?.name} Selected
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
        {PLATFORMS.map((platform) => {
          const isSelected = selectedPlatform === platform.id;
          return (
            <button
              key={platform.id}
              type="button"
              onClick={() => onSelectPlatform(platform.id)}
              className={`relative p-3 rounded-xl border text-left transition-colors duration-150 group flex flex-col justify-between ${
                isSelected
                  ? `${isDark ? 'bg-[#1E2430] border-blue-500 shadow-sm ring-1 ring-blue-500' : 'bg-slate-50 border-blue-600 shadow-sm ring-1 ring-blue-500'}`
                  : `${isDark ? 'bg-[#12161F] border-slate-800 hover:bg-[#1A202C]' : 'bg-white border-slate-200 hover:bg-slate-50'}`
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] shadow-sm">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
              )}

              <div>
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 shadow-sm transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: `${platform.accentColor}20`,
                    color: platform.id === 'snapchat' && !isDark ? '#CA8A04' : platform.accentColor,
                  }}
                >
                  {platform.icon}
                </div>
                <h4 className={`text-xs font-bold leading-tight ${themeStyles.textPrimary}`}>
                  {platform.name}
                </h4>
                <p className={`text-[10px] leading-tight line-clamp-1 mt-0.5 ${themeStyles.textMuted}`}>
                  {platform.tagline}
                </p>
              </div>

              <div className="mt-2 pt-1 border-t border-slate-700/20">
                <span className="text-[9.5px] font-medium opacity-75 block truncate">
                  {platform.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

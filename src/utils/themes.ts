import { ThemeId, BrightnessMode } from '../types';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  emoji: string;
  tagline: string;
  previewColors: string[];
  darkBgHex: string;
  brightBgHex: string;
  dark: {
    bgGradient: string;
    cardBg: string;
    cardBorder: string;
    primaryAccent: string;
    secondaryAccent: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    badgeBg: string;
    glowColor: string;
  };
  bright: {
    bgGradient: string;
    cardBg: string;
    cardBorder: string;
    primaryAccent: string;
    secondaryAccent: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    badgeBg: string;
    glowColor: string;
  };
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  'executive-navy': {
    id: 'executive-navy',
    name: 'Executive Slate',
    emoji: '🏛️',
    tagline: 'Solid deep slate canvas, crisp white ink, authoritative cobalt primary actions',
    previewColors: ['#0D1117', '#161B22', '#2563EB', '#F8FAFC'],
    darkBgHex: '#0D1117',
    brightBgHex: '#F8FAFC',
    dark: {
      bgGradient: 'bg-[#0D1117]',
      cardBg: 'bg-[#161B22]',
      cardBorder: 'border-[#262E3B]',
      primaryAccent: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold',
      secondaryAccent: 'text-[#60A5FA]',
      textPrimary: 'text-[#F8FAFC]',
      textSecondary: 'text-[#CBD5E1]',
      textMuted: 'text-[#94A3B8]',
      badgeBg: 'bg-[#1E2430] text-[#CBD5E1] border border-[#30394A]',
      glowColor: 'transparent',
    },
    bright: {
      bgGradient: 'bg-[#F8FAFC]',
      cardBg: 'bg-[#FFFFFF]',
      cardBorder: 'border-[#E2E8F0] shadow-xs',
      primaryAccent: 'bg-[#1D4ED8] hover:bg-[#1E40AF] text-white font-semibold',
      secondaryAccent: 'text-[#1D4ED8]',
      textPrimary: 'text-[#0F172A]',
      textSecondary: 'text-[#334155]',
      textMuted: 'text-[#64748B]',
      badgeBg: 'bg-[#EFF6FF] text-[#1E40AF] border border-[#BFDBFE]',
      glowColor: 'transparent',
    },
  },

  'sapphire-white': {
    id: 'sapphire-white',
    name: 'Charcoal & Royal',
    emoji: '💎',
    tagline: 'Pure neutral charcoal dark mode & clean alabaster light mode with royal blue controls',
    previewColors: ['#111317', '#181B20', '#2563EB', '#F9FAFB'],
    darkBgHex: '#111317',
    brightBgHex: '#FFFFFF',
    dark: {
      bgGradient: 'bg-[#111317]',
      cardBg: 'bg-[#181B20]',
      cardBorder: 'border-[#262A33]',
      primaryAccent: 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-semibold',
      secondaryAccent: 'text-[#60A5FA]',
      textPrimary: 'text-[#F9FAFB]',
      textSecondary: 'text-[#D1D5DB]',
      textMuted: 'text-[#9CA3AF]',
      badgeBg: 'bg-[#1F232B] text-[#D1D5DB] border border-[#303642]',
      glowColor: 'transparent',
    },
    bright: {
      bgGradient: 'bg-[#FFFFFF]',
      cardBg: 'bg-[#F8FAFC]',
      cardBorder: 'border-[#E2E8F0]',
      primaryAccent: 'bg-[#1E40AF] hover:bg-[#1E3A8A] text-white font-semibold',
      secondaryAccent: 'text-[#1E40AF]',
      textPrimary: 'text-[#0F172A]',
      textSecondary: 'text-[#334155]',
      textMuted: 'text-[#64748B]',
      badgeBg: 'bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE]',
      glowColor: 'transparent',
    },
  },

  'corporate-slate': {
    id: 'corporate-slate',
    name: 'Corporate Slate',
    emoji: '🏢',
    tagline: 'Solid enterprise graphite & steel surfaces with razor-sharp contrast',
    previewColors: ['#0F172A', '#1E293B', '#0284C7', '#E2E8F0'],
    darkBgHex: '#0F172A',
    brightBgHex: '#F1F5F9',
    dark: {
      bgGradient: 'bg-[#0F172A]',
      cardBg: 'bg-[#1E293B]',
      cardBorder: 'border-[#334155]',
      primaryAccent: 'bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold',
      secondaryAccent: 'text-[#7DD3FC]',
      textPrimary: 'text-[#F8FAFC]',
      textSecondary: 'text-[#CBD5E1]',
      textMuted: 'text-[#94A3B8]',
      badgeBg: 'bg-[#0F172A] text-[#E2E8F0] border border-[#334155]',
      glowColor: 'transparent',
    },
    bright: {
      bgGradient: 'bg-[#F1F5F9]',
      cardBg: 'bg-[#FFFFFF]',
      cardBorder: 'border-[#CBD5E1] shadow-xs',
      primaryAccent: 'bg-[#0F172A] hover:bg-[#1E293B] text-white font-semibold',
      secondaryAccent: 'text-[#0F172A]',
      textPrimary: 'text-[#0F172A]',
      textSecondary: 'text-[#334155]',
      textMuted: 'text-[#64748B]',
      badgeBg: 'bg-[#F1F5F9] text-[#1E293B] border border-[#CBD5E1]',
      glowColor: 'transparent',
    },
  },

  'nordic-minimal': {
    id: 'nordic-minimal',
    name: 'Nordic Graphite',
    emoji: '🌐',
    tagline: 'Matte neutral graphite dark mode & Scandinavian paper light mode with calm steel blue',
    previewColors: ['#121417', '#1B1E23', '#0284C7', '#F9FAFB'],
    darkBgHex: '#121417',
    brightBgHex: '#F9FAFB',
    dark: {
      bgGradient: 'bg-[#121417]',
      cardBg: 'bg-[#1B1E23]',
      cardBorder: 'border-[#2A2E36]',
      primaryAccent: 'bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold',
      secondaryAccent: 'text-[#93C5FD]',
      textPrimary: 'text-[#F3F4F6]',
      textSecondary: 'text-[#D1D5DB]',
      textMuted: 'text-[#9CA3AF]',
      badgeBg: 'bg-[#22262E] text-[#E5E7EB] border border-[#323742]',
      glowColor: 'transparent',
    },
    bright: {
      bgGradient: 'bg-[#F9FAFB]',
      cardBg: 'bg-[#FFFFFF]',
      cardBorder: 'border-[#E5E7EB] shadow-xs',
      primaryAccent: 'bg-[#0369A1] hover:bg-[#075985] text-white font-semibold',
      secondaryAccent: 'text-[#0369A1]',
      textPrimary: 'text-[#111827]',
      textSecondary: 'text-[#374151]',
      textMuted: 'text-[#6B7280]',
      badgeBg: 'bg-[#F0F9FF] text-[#0369A1] border border-[#BAE6FD]',
      glowColor: 'transparent',
    },
  },

  'obsidian-enterprise': {
    id: 'obsidian-enterprise',
    name: 'Obsidian Neutral',
    emoji: '🛡️',
    tagline: 'Pure neutral zinc palette with crisp monochrome surfaces and high-clarity focus',
    previewColors: ['#09090B', '#141417', '#27272A', '#FAFAFA'],
    darkBgHex: '#09090B',
    brightBgHex: '#FAFAFA',
    dark: {
      bgGradient: 'bg-[#09090B]',
      cardBg: 'bg-[#141417]',
      cardBorder: 'border-[#27272A]',
      primaryAccent: 'bg-[#FAFAFA] hover:bg-[#E4E4E7] text-[#09090B] font-semibold',
      secondaryAccent: 'text-[#E4E4E7]',
      textPrimary: 'text-[#FAFAFA]',
      textSecondary: 'text-[#D4D4D8]',
      textMuted: 'text-[#A1A1AA]',
      badgeBg: 'bg-[#18181B] text-[#E4E4E7] border border-[#27272A]',
      glowColor: 'transparent',
    },
    bright: {
      bgGradient: 'bg-[#FAFAFA]',
      cardBg: 'bg-[#FFFFFF]',
      cardBorder: 'border-[#E4E4E7] shadow-xs',
      primaryAccent: 'bg-[#18181B] hover:bg-[#27272A] text-white font-semibold',
      secondaryAccent: 'text-[#18181B]',
      textPrimary: 'text-[#09090B]',
      textSecondary: 'text-[#3F3F46]',
      textMuted: 'text-[#71717A]',
      badgeBg: 'bg-[#F4F4F5] text-[#18181B] border border-[#E4E4E7]',
      glowColor: 'transparent',
    },
  },

  'pacific-blue': {
    id: 'pacific-blue',
    name: 'Steel Enterprise',
    emoji: '🌊',
    tagline: 'Neutral charcoal dark canvas & pale-sky paper engineered for focused SaaS workspaces',
    previewColors: ['#0E1116', '#161B22', '#0369A1', '#F4F8FB'],
    darkBgHex: '#0E1116',
    brightBgHex: '#F4F8FB',
    dark: {
      bgGradient: 'bg-[#0E1116]',
      cardBg: 'bg-[#161B22]',
      cardBorder: 'border-[#252C38]',
      primaryAccent: 'bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold',
      secondaryAccent: 'text-[#60A5FA]',
      textPrimary: 'text-[#F1F5F9]',
      textSecondary: 'text-[#CBD5E1]',
      textMuted: 'text-[#94A3B8]',
      badgeBg: 'bg-[#1E242E] text-[#CBD5E1] border border-[#2E3645]',
      glowColor: 'transparent',
    },
    bright: {
      bgGradient: 'bg-[#F4F8FB]',
      cardBg: 'bg-[#FFFFFF]',
      cardBorder: 'border-[#D5E3EE] shadow-xs',
      primaryAccent: 'bg-[#0369A1] hover:bg-[#075985] text-white font-semibold',
      secondaryAccent: 'text-[#0369A1]',
      textPrimary: 'text-[#0F172A]',
      textSecondary: 'text-[#334155]',
      textMuted: 'text-[#64748B]',
      badgeBg: 'bg-[#EFF6FF] text-[#0369A1] border border-[#BFDBFE]',
      glowColor: 'transparent',
    },
  },

  'oxford-academic': {
    id: 'oxford-academic',
    name: 'Oxford Editorial',
    emoji: '🎓',
    tagline: 'Deep editorial charcoal & warm stone parchment paired with restrained amber accents',
    previewColors: ['#101216', '#181B21', '#B45309', '#FAF9F6'],
    darkBgHex: '#101216',
    brightBgHex: '#FAF9F6',
    dark: {
      bgGradient: 'bg-[#101216]',
      cardBg: 'bg-[#181B21]',
      cardBorder: 'border-[#292D36]',
      primaryAccent: 'bg-[#B45309] hover:bg-[#92400E] text-white font-semibold',
      secondaryAccent: 'text-[#D97706]',
      textPrimary: 'text-[#F8FAFC]',
      textSecondary: 'text-[#E2E8F0]',
      textMuted: 'text-[#94A3B8]',
      badgeBg: 'bg-[#21252D] text-[#E2E8F0] border border-[#323844]',
      glowColor: 'transparent',
    },
    bright: {
      bgGradient: 'bg-[#FAF9F6]',
      cardBg: 'bg-[#FFFFFF]',
      cardBorder: 'border-[#E7E5E4] shadow-xs',
      primaryAccent: 'bg-[#1E293B] hover:bg-[#0F172A] text-white font-semibold',
      secondaryAccent: 'text-[#1E293B]',
      textPrimary: 'text-[#1C1917]',
      textSecondary: 'text-[#44403C]',
      textMuted: 'text-[#78716C]',
      badgeBg: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]',
      glowColor: 'transparent',
    },
  },

  'monochrome-pro': {
    id: 'monochrome-pro',
    name: 'Monochrome Pro',
    emoji: '💼',
    tagline: 'Strict black and white broadsheet precision with zero decorative color distraction',
    previewColors: ['#0A0A0A', '#141414', '#525252', '#FFFFFF'],
    darkBgHex: '#0A0A0A',
    brightBgHex: '#FFFFFF',
    dark: {
      bgGradient: 'bg-[#0A0A0A]',
      cardBg: 'bg-[#141414]',
      cardBorder: 'border-[#262626]',
      primaryAccent: 'bg-[#FFFFFF] hover:bg-[#E5E5E5] text-[#0A0A0A] font-semibold',
      secondaryAccent: 'text-[#E5E5E5]',
      textPrimary: 'text-[#FFFFFF]',
      textSecondary: 'text-[#D4D4D4]',
      textMuted: 'text-[#A3A3A3]',
      badgeBg: 'bg-[#1F1F1F] text-[#F5F5F5] border border-[#333333]',
      glowColor: 'transparent',
    },
    bright: {
      bgGradient: 'bg-[#FFFFFF]',
      cardBg: 'bg-[#FAFAFA]',
      cardBorder: 'border-[#E5E5E5]',
      primaryAccent: 'bg-[#171717] hover:bg-[#000000] text-white font-semibold',
      secondaryAccent: 'text-[#171717]',
      textPrimary: 'text-[#0A0A0A]',
      textSecondary: 'text-[#404040]',
      textMuted: 'text-[#737373]',
      badgeBg: 'bg-[#F5F5F5] text-[#171717] border border-[#E5E5E5]',
      glowColor: 'transparent',
    },
  },

  'emerald-trust': {
    id: 'emerald-trust',
    name: 'Advisory Neutral',
    emoji: '🌿',
    tagline: 'Neutral carbon dark mode & crisp off-white with measured forest green action buttons',
    previewColors: ['#0E1111', '#161A1A', '#047857', '#F6FAF8'],
    darkBgHex: '#0E1111',
    brightBgHex: '#F6FAF8',
    dark: {
      bgGradient: 'bg-[#0E1111]',
      cardBg: 'bg-[#161A1A]',
      cardBorder: 'border-[#262D2D]',
      primaryAccent: 'bg-[#047857] hover:bg-[#065F46] text-white font-semibold',
      secondaryAccent: 'text-[#34D399]',
      textPrimary: 'text-[#F8FAFC]',
      textSecondary: 'text-[#D1D5DB]',
      textMuted: 'text-[#9CA3AF]',
      badgeBg: 'bg-[#1D2423] text-[#D1D5DB] border border-[#2C3635]',
      glowColor: 'transparent',
    },
    bright: {
      bgGradient: 'bg-[#F6FAF8]',
      cardBg: 'bg-[#FFFFFF]',
      cardBorder: 'border-[#D1DFD8] shadow-xs',
      primaryAccent: 'bg-[#047857] hover:bg-[#065F46] text-white font-semibold',
      secondaryAccent: 'text-[#047857]',
      textPrimary: 'text-[#0F172A]',
      textSecondary: 'text-[#334155]',
      textMuted: 'text-[#64748B]',
      badgeBg: 'bg-[#ECFDF5] text-[#065F46] border border-[#A7F3D0]',
      glowColor: 'transparent',
    },
  },

  'modern-cobalt': {
    id: 'modern-cobalt',
    name: 'Modern Carbon',
    emoji: '⚡',
    tagline: 'Solid deep carbon dark canvas & crisp white light mode with understated indigo focus',
    previewColors: ['#0F1115', '#171A21', '#4338CA', '#F8FAFC'],
    darkBgHex: '#0F1115',
    brightBgHex: '#F8FAFC',
    dark: {
      bgGradient: 'bg-[#0F1115]',
      cardBg: 'bg-[#171A21]',
      cardBorder: 'border-[#272C37]',
      primaryAccent: 'bg-[#4338CA] hover:bg-[#3730A3] text-white font-semibold',
      secondaryAccent: 'text-[#818CF8]',
      textPrimary: 'text-[#F8FAFC]',
      textSecondary: 'text-[#CBD5E1]',
      textMuted: 'text-[#94A3B8]',
      badgeBg: 'bg-[#1F242D] text-[#CBD5E1] border border-[#2E3543]',
      glowColor: 'transparent',
    },
    bright: {
      bgGradient: 'bg-[#F8FAFC]',
      cardBg: 'bg-[#FFFFFF]',
      cardBorder: 'border-[#E2E8F0] shadow-xs',
      primaryAccent: 'bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold',
      secondaryAccent: 'text-[#4338CA]',
      textPrimary: 'text-[#0F172A]',
      textSecondary: 'text-[#334155]',
      textMuted: 'text-[#64748B]',
      badgeBg: 'bg-[#EEF2FF] text-[#3730A3] border border-[#C7D2FE]',
      glowColor: 'transparent',
    },
  },
};

export function getEffectiveTheme(themeId: ThemeId, brightness: BrightnessMode) {
  const theme = THEMES[themeId] || THEMES['executive-navy'];
  const isDark =
    brightness === 'dark'
      ? true
      : brightness === 'bright'
      ? false
      : typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true;

  return {
    theme,
    isDark,
    styles: isDark ? theme.dark : theme.bright,
    canvasHex: isDark ? theme.darkBgHex : theme.brightBgHex,
  };
}

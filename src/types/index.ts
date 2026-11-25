export type ThemeId =
  | 'executive-navy'
  | 'sapphire-white'
  | 'corporate-slate'
  | 'nordic-minimal'
  | 'obsidian-enterprise'
  | 'pacific-blue'
  | 'oxford-academic'
  | 'monochrome-pro'
  | 'emerald-trust'
  | 'modern-cobalt';

export type BrightnessMode = 'dark' | 'bright' | 'system';

export type AIModelPersona =
  | 'gemini'
  | 'chatgpt'
  | 'claude'
  | 'perplexity'
  | 'copilot'
  | 'grammarly'
  | 'jasper'
  | 'deepl';

export type WritingQualityTier =
  | 'executive'
  | 'editorial'
  | 'boardroom'
  | 'academic';

export type PlatformId =
  | 'whatsapp'
  | 'linkedin'
  | 'instagram'
  | 'telegram'
  | 'snapchat'
  | 'discord'
  | 'custom';

export type EmojiIntensity =
  | 'No Emojis'
  | 'Minimal Emojis'
  | 'Natural Emojis'
  | 'Expressive Emojis'
  | 'Rich & Playful'
  | 'Emoji-Forward';

export type ResponseLength = 'Short' | 'Balanced' | 'Detailed';

export interface EmotionalSignal {
  label: string;
  intensity: 'Mild' | 'Moderate' | 'High';
  context: string;
}

export interface ToneDimension {
  axis: string;
  score: number;
}

export interface SituationAnalysis {
  situation: string;
  category: string;
  urgency: 'Low' | 'Medium' | 'High';
  participantDynamics: string;
  latestMessageIntent: string;
  emotionalSignals: EmotionalSignal[];
  toneDimensions?: ToneDimension[];
  underlyingContext: string;
  conversationPurpose: string;
  recommendedStrategy: string;
  potentialPitfalls: string;
  recommendedLength: string;
  confidenceScore: number;
}

export type FeedbackRating = 'up' | 'down';

export interface ReplyOption {
  id: string;
  styleLabel: string;
  tone: string;
  content: string;
  explanation: string;
  matchScore: number;
  saved?: boolean;
  isEditing?: boolean;
  hashtags?: string[];
  suggestedLinks?: string[];
  autoRefined?: boolean;
  refinementNotes?: string;
  feedback?: FeedbackRating;
  feedbackReason?: string;
}

export interface ReplyFeedbackEntry {
  id: string;
  replyId: string;
  rating: FeedbackRating;
  timestamp: string;
  platform: string;
  styleLabel: string;
  tone: string;
  responseLength: ResponseLength | string;
  replyExcerpt: string;
  incomingExcerpt?: string;
  situationCategory?: string;
  aiModel?: string;
  reason?: string;
}

export interface ReplyPreferenceProfile {
  totalRatings: number;
  positiveCount: number;
  negativeCount: number;
  approvalRate: number;
  preferredTones: string[];
  avoidedTones: string[];
  preferredStyles: string[];
  avoidedStyles: string[];
  preferredLength?: string;
  topPositiveExamples: { styleLabel: string; tone: string; excerpt: string }[];
  avoidanceNotes: string[];
}

export interface SavedConversation {
  id: string;
  title: string;
  timestamp: string;
  platform: string;
  chatHistory: string;
  latestMessage: string;
  analysis?: SituationAnalysis;
  replies: ReplyOption[];
  tones: string[];
  emojiIntensity: EmojiIntensity;
  aiModel?: AIModelPersona;
}

export interface UserAuth {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  title?: string;
  company?: string;
  avatar?: string;
  photoUrl?: string;
  emailVerified?: boolean;
  provider?: 'google' | 'apple' | 'microsoft' | 'email' | 'admin_portal';
}

export type UILanguage = 'en' | 'te' | 'hi-slang';

export interface ThreadSummary {
  keyTopic: string;
  bullets: string[];
  participants?: string[];
  openQuestions?: string[];
  messageCount: number;
  sourceHash: string;
  source?: string;
}

export type FontFamilyId =
  | 'plus-jakarta'
  | 'inter'
  | 'dm-sans'
  | 'ibm-plex'
  | 'manrope'
  | 'space-grotesk'
  | 'merriweather'
  | 'lora'
  | 'playfair'
  | 'jetbrains-mono';

export interface UserSettings {
  uiLanguage?: UILanguage;
  fontFamily?: FontFamilyId;
  defaultPlatform: PlatformId;
  defaultLanguage: string;
  defaultTones: string[];
  defaultModel: AIModelPersona;
  emojiIntensity: EmojiIntensity;
  responseLength: ResponseLength;
  brightnessMode: BrightnessMode;
  themeId: ThemeId;
  saveHistory: boolean;
  autoAnalyzeOnGenerate: boolean;
  autoRefineReplies?: boolean;
  autoSummarizeThreads?: boolean;
  writingStandard?: WritingQualityTier;
  includeHashtagsDefault: boolean;
  includeLinksDefault: boolean;
}

export type ActiveTab =
  | 'dashboard'
  | 'generator'
  | 'analyzer'
  | 'templates' // School/University & Job Holder Prompt Studio
  | 'documents'
  | 'history'
  | 'admin'
  | 'settings';

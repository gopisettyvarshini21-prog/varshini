export interface SpeechRecognitionAlternativeLike {
  transcript: string;
  confidence: number;
}

export interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

export interface SpeechRecognitionResultListLike {
  length: number;
  [index: number]: SpeechRecognitionResultLike;
}

export interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultListLike;
}

export interface SpeechRecognitionErrorEventLike extends Event {
  error: string;
  message?: string;
}

export interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives?: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

export type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

export interface SpeechLocaleOption {
  code: string;
  label: string;
}

export const SPEECH_LOCALE_OPTIONS: SpeechLocaleOption[] = [
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-IN', label: 'English (India)' },
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'te-IN', label: 'Telugu (తెలుగు)' },
  { code: 'hi-IN', label: 'Hindi / Hinglish (हिंदी)' },
  { code: 'ta-IN', label: 'Tamil (தமிழ்)' },
  { code: 'kn-IN', label: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml-IN', label: 'Malayalam (മലയാളം)' },
  { code: 'bn-IN', label: 'Bengali (বাংলা)' },
  { code: 'mr-IN', label: 'Marathi (मराठी)' },
  { code: 'es-ES', label: 'Spanish (Español)' },
  { code: 'fr-FR', label: 'French (Français)' },
  { code: 'de-DE', label: 'German (Deutsch)' },
  { code: 'ja-JP', label: 'Japanese (日本語)' },
];

export function mapAppLanguageToSpeechLocale(lang: string): string {
  switch (lang) {
    case 'Telugu':
      return 'te-IN';
    case 'Hindi':
    case 'Hinglish':
      return 'hi-IN';
    case 'Tamil':
      return 'ta-IN';
    case 'Kannada':
      return 'kn-IN';
    case 'Malayalam':
      return 'ml-IN';
    case 'Bengali':
      return 'bn-IN';
    case 'Marathi':
      return 'mr-IN';
    case 'Spanish':
      return 'es-ES';
    case 'French':
      return 'fr-FR';
    case 'German':
      return 'de-DE';
    case 'Japanese':
      return 'ja-JP';
    case 'English':
    case 'Auto Detect':
    default:
      return 'en-US';
  }
}

export function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function isWebSpeechSupported(): boolean {
  return getSpeechRecognitionConstructor() !== null;
}

export function getSpeechErrorMessage(errorCode: string): string {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was blocked. Allow microphone permission in your browser address bar to dictate.';
    case 'audio-capture':
      return 'No working microphone was detected on this device.';
    case 'network':
      return 'Speech recognition network connection interrupted. Try again.';
    case 'no-speech':
      return 'No speech detected. Speak clearly closer to your microphone.';
    case 'aborted':
      return '';
    default:
      return `Voice dictation paused (${errorCode}). Click the microphone to resume.`;
  }
}

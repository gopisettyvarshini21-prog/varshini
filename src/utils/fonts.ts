import { FontFamilyId } from '../types';

export interface FontOption {
  id: FontFamilyId;
  name: string;
  category: 'Sans-Serif' | 'Geometric' | 'Editorial Serif' | 'Monospace';
  description: string;
  cssStack: string;
  wordFont: string;
  pdfFont: 'helvetica' | 'times' | 'courier';
  sampleText: string;
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: 'plus-jakarta',
    name: 'Plus Jakarta Sans',
    category: 'Sans-Serif',
    description: 'Clean executive geometric sans-serif (Default)',
    cssStack: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
    wordFont: 'Calibri',
    pdfFont: 'helvetica',
    sampleText: 'Clear, human-centered communication for every context.',
  },
  {
    id: 'inter',
    name: 'Inter',
    category: 'Sans-Serif',
    description: 'Crisp enterprise UI typeface tuned for dense readability',
    cssStack: "'Inter', system-ui, -apple-system, sans-serif",
    wordFont: 'Segoe UI',
    pdfFont: 'helvetica',
    sampleText: 'Structured clarity for executive briefs and messages.',
  },
  {
    id: 'dm-sans',
    name: 'DM Sans',
    category: 'Sans-Serif',
    description: 'Balanced low-contrast grotesk for modern workspaces',
    cssStack: "'DM Sans', system-ui, -apple-system, sans-serif",
    wordFont: 'Arial',
    pdfFont: 'helvetica',
    sampleText: 'Friendly, poised tone across every chat channel.',
  },
  {
    id: 'ibm-plex',
    name: 'IBM Plex Sans',
    category: 'Sans-Serif',
    description: 'Neutral corporate grotesk designed for analytical clarity',
    cssStack: "'IBM Plex Sans', system-ui, -apple-system, sans-serif",
    wordFont: 'Calibri',
    pdfFont: 'helvetica',
    sampleText: 'Precision strategy and confident business writing.',
  },
  {
    id: 'manrope',
    name: 'Manrope',
    category: 'Geometric',
    description: 'Contemporary semi-condensed sans with sharp proportions',
    cssStack: "'Manrope', system-ui, -apple-system, sans-serif",
    wordFont: 'Segoe UI',
    pdfFont: 'helvetica',
    sampleText: 'Modern, composed typography for daily correspondence.',
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    category: 'Geometric',
    description: 'Architectural display sans with distinctive technical edge',
    cssStack: "'Space Grotesk', system-ui, -apple-system, sans-serif",
    wordFont: 'Arial',
    pdfFont: 'helvetica',
    sampleText: 'Distinctive voice for high-impact proposals.',
  },
  {
    id: 'merriweather',
    name: 'Merriweather',
    category: 'Editorial Serif',
    description: 'Classic high-legibility serif for long-form reading & memos',
    cssStack: "'Merriweather', Georgia, 'Times New Roman', serif",
    wordFont: 'Georgia',
    pdfFont: 'times',
    sampleText: 'Authoritative editorial poise for formal reports.',
  },
  {
    id: 'lora',
    name: 'Lora',
    category: 'Editorial Serif',
    description: 'Warm contemporary serif ideal for thoughtful letters & notes',
    cssStack: "'Lora', Georgia, 'Times New Roman', serif",
    wordFont: 'Georgia',
    pdfFont: 'times',
    sampleText: 'Warm, articulate expression with literary balance.',
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    category: 'Editorial Serif',
    description: 'High-contrast executive publishing serif for prestigious briefs',
    cssStack: "'Playfair Display', Georgia, 'Times New Roman', serif",
    wordFont: 'Times New Roman',
    pdfFont: 'times',
    sampleText: 'Refined editorial presence for leadership memos.',
  },
  {
    id: 'jetbrains-mono',
    name: 'JetBrains Mono',
    category: 'Monospace',
    description: 'Fixed-width technical typeface for structured logs & code',
    cssStack: "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace",
    wordFont: 'Consolas',
    pdfFont: 'courier',
    sampleText: 'Aligned precision for technical reviews and traces.',
  },
];

export function getFontOption(fontId?: FontFamilyId): FontOption {
  return FONT_OPTIONS.find((f) => f.id === fontId) || FONT_OPTIONS[0];
}

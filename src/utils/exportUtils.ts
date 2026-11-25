import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
} from 'docx';
import { jsPDF } from 'jspdf';
import { SituationAnalysis, ReplyOption, FontFamilyId } from '../types';
import { getFontOption } from './fonts';

export interface ExportData {
  title: string;
  template: string;
  platform: string;
  chatHistory?: string;
  latestMessage?: string;
  analysis?: SituationAnalysis | null;
  replies?: ReplyOption[];
  customNotes?: string;
  date?: string;
}

// Download helper (delayed revoke so browser/iframe downloads never cancel mid-flight)
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener noreferrer';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    try {
      if (a.parentNode) {
        a.parentNode.removeChild(a);
      }
    } catch {}
  }, 250);
  setTimeout(() => {
    try {
      URL.revokeObjectURL(url);
    } catch {}
  }, 15000);
}

// ============================================================================
// RICH MARKDOWN BLOCK & INLINE SPAN PARSER (GEMINI / CHATGPT QUALITY)
// ============================================================================

export interface InlineRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

export type MarkdownBlock =
  | { type: 'h1'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'h4'; text: string }
  | { type: 'hr' }
  | { type: 'blockquote'; lines: string[] }
  | { type: 'bullet'; text: string; level: number }
  | { type: 'ordered'; num: string; text: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'code'; lang?: string; lines: string[] }
  | { type: 'paragraph'; text: string };

/**
 * Parses inline markdown formatting (**bold**, __bold__, *italic*, _italic_, `code`, [label](url))
 * into clean styled spans without ever leaving stray markdown asterisks or backticks.
 */
export function parseInlineMarkdownRuns(input: string): InlineRun[] {
  if (!input) return [];
  // Normalize HTML <br> tags and markdown links [Label](https://...) -> Label (https://...) cleanly
  const normalized = input
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '$1 ($2)');

  const runs: InlineRun[] = [];
  const tokenRegex = /(\*\*\*[^*]+\*\*\*|\*\*[^*]+\*\*|__[^_]+__|`[^`]+`|\*[^*\n]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = tokenRegex.exec(normalized)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: normalized.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith('***') && token.endsWith('***')) {
      runs.push({ text: token.slice(3, -3), bold: true, italic: true });
    } else if ((token.startsWith('**') && token.endsWith('**')) || (token.startsWith('__') && token.endsWith('__'))) {
      runs.push({ text: token.slice(2, -2), bold: true });
    } else if (token.startsWith('`') && token.endsWith('`')) {
      runs.push({ text: token.slice(1, -1), code: true });
    } else if (token.startsWith('*') && token.endsWith('*')) {
      runs.push({ text: token.slice(1, -1), italic: true });
    } else {
      runs.push({ text: token });
    }
    lastIndex = tokenRegex.lastIndex;
  }

  if (lastIndex < normalized.length) {
    runs.push({ text: normalized.slice(lastIndex) });
  }

  return runs.length > 0 ? runs : [{ text: normalized }];
}

function stripInlineMarkdownSyntax(input: string): string {
  return parseInlineMarkdownRuns(input)
    .map((r) => r.text)
    .join('');
}

function isMarkdownTableSeparator(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed.includes('|')) return false;
  const cells = trimmed
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((c) => c.trim());
  return cells.length > 0 && cells.every((c) => /^:?-{2,}:?$/.test(c));
}

function splitMarkdownTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

/**
 * Parses full ChatGPT / Gemini style markdown into structured blocks:
 * headings (H1-H4), tables, blockquotes, ordered/bullet lists, code blocks, dividers, and paragraphs.
 */
export function parseMarkdownBlocks(rawText?: string): MarkdownBlock[] {
  const clean = (rawText || '').replace(/\r\n/g, '\n').trim();
  if (!clean) return [];

  const lines = clean.split('\n');
  const blocks: MarkdownBlock[] = [];
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    // Fenced code blocks ```lang ... ```
    if (trimmed.startsWith('```')) {
      const lang = trimmed.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) i++;
      blocks.push({ type: 'code', lang: lang || undefined, lines: codeLines });
      continue;
    }

    // Horizontal rule --- / *** / ___
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'hr' });
      i++;
      continue;
    }

    // Headings # ... ####
    const hMatch = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (hMatch) {
      const level = hMatch[1].length;
      const text = hMatch[2].trim();
      if (level === 1) blocks.push({ type: 'h1', text });
      else if (level === 2) blocks.push({ type: 'h2', text });
      else if (level === 3) blocks.push({ type: 'h3', text });
      else blocks.push({ type: 'h4', text });
      i++;
      continue;
    }

    // Markdown Table (header row + |---|---| separator + body rows)
    if (trimmed.includes('|') && i + 1 < lines.length && isMarkdownTableSeparator(lines[i + 1])) {
      const headers = splitMarkdownTableRow(trimmed);
      i += 2;
      const rows: string[][] = [];
      while (i < lines.length && lines[i].trim().includes('|') && !isMarkdownTableSeparator(lines[i])) {
        const rowCells = splitMarkdownTableRow(lines[i]);
        if (rowCells.some((c) => c.length > 0)) {
          // Normalize column count to header count
          const normalizedRow = headers.map((_, idx) => rowCells[idx] ?? '');
          rows.push(normalizedRow);
        }
        i++;
      }
      blocks.push({ type: 'table', headers, rows });
      continue;
    }

    // Multi-line Blockquote > ...
    if (trimmed.startsWith('>')) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('>')) {
        const qContent = lines[i].trim().replace(/^>\s?/, '').trim();
        if (qContent) quoteLines.push(qContent);
        i++;
      }
      if (quoteLines.length > 0) {
        blocks.push({ type: 'blockquote', lines: quoteLines });
      }
      continue;
    }

    // Unordered Bullet list (- / * / •)
    const bulletMatch = rawLine.match(/^(\s*)([-*•])\s+(.+)$/);
    if (bulletMatch) {
      const indentSpaces = bulletMatch[1].length;
      const level = indentSpaces >= 2 ? 1 : 0;
      blocks.push({ type: 'bullet', text: bulletMatch[3].trim(), level });
      i++;
      continue;
    }

    // Ordered List (1. / 2. / 1) )
    const orderedMatch = rawLine.match(/^\s*(\d+)[.)]\s+(.+)$/);
    if (orderedMatch) {
      blocks.push({ type: 'ordered', num: orderedMatch[1], text: orderedMatch[2].trim() });
      i++;
      continue;
    }

    // Standard Paragraph (preserve intentional line breaks in letters, headers, signatures, and hard Markdown breaks)
    const isShortStructuredLine = (line: string): boolean => {
      const cleaned = line.trim();
      return (
        /^(subject|to|from|date|cc|bcc|re|dear|hi|hello|warm regards|best regards|kind regards|sincerely|yours sincerely|yours truly|respectfully|regards|thank you|thanks)\b/i.test(
          cleaned
        ) ||
        /^\[[^\]]+\]$/.test(cleaned) ||
        cleaned.length <= 45
      );
    };

    const rawLineHasHardBreak = / {2,}$/.test(rawLine);
    const paraLines: string[] = [trimmed];
    i++;
    if (!rawLineHasHardBreak && !isShortStructuredLine(trimmed)) {
      while (i < lines.length) {
        const nextRaw = lines[i];
        const next = nextRaw.trim();
        if (
          !next ||
          next.startsWith('#') ||
          next.startsWith('>') ||
          next.startsWith('```') ||
          /^(-{3,}|\*{3,}|_{3,})$/.test(next) ||
          /^(\s*)([-*•])\s+/.test(nextRaw) ||
          /^\s*\d+[.)]\s+/.test(nextRaw) ||
          (next.includes('|') && i + 1 < lines.length && isMarkdownTableSeparator(lines[i + 1])) ||
          isShortStructuredLine(next)
        ) {
          break;
        }
        paraLines.push(next);
        i++;
        if (/ {2,}$/.test(nextRaw)) {
          break;
        }
      }
    }
    blocks.push({ type: 'paragraph', text: paraLines.join(' ') });
  }

  return blocks;
}

function buildSafeFilenameBase(title: string | undefined, fallback: string): string {
  const cleaned = (title || fallback)
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return cleaned || fallback;
}

export type WordExportScope = 'replies-summary' | 'conversation' | 'full-summary' | 'selected-reply' | 'active-preview';

export interface WordExportOptions extends ExportData {
  scope?: WordExportScope;
  previewFormat?: 'document' | 'linkedin' | 'email' | 'markdown';
  selectedReplyIndex?: number;
  emailRecipient?: string;
  includeHashtags?: boolean;
  includeLinks?: boolean;
  synthesizedText?: string;
  aiModel?: string;
  fontFamily?: FontFamilyId;
}

/**
 * Generates a structured Microsoft Word (.docx) document with ChatGPT / Gemini editorial polish:
 * real bold/italic/code inline runs, styled tables, clean H1-H4 hierarchy, blockquotes,
 * ordered/bullet lists, horizontal dividers, and color-coded conversation bubbles.
 */
export async function exportToWord(data: WordExportOptions): Promise<boolean> {
  try {
    const baseWordFont = getFontOption(data.fontFamily).wordFont;
    const docChildren: (Paragraph | Table)[] = [];
    const scope: WordExportScope = data.scope || 'conversation';
    const previewFormat = data.previewFormat || 'document';
    const dateStr =
      data.date ||
      new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });

    const chosenReply =
      data.replies && data.replies.length > 0
        ? data.replies[data.selectedReplyIndex ?? 0] || data.replies[0]
        : null;

    const cleanDocxText = (val?: string) => (val || '').replace(/\r\n/g, '\n').trim();

    const buildWordTextRuns = (
      text: string,
      defaults: { size?: number; color?: string; bold?: boolean; italics?: boolean; font?: string } = {}
    ): TextRun[] => {
      const size = defaults.size ?? 21; // 10.5pt
      const color = defaults.color ?? '1E293B';
      const font = defaults.font ?? baseWordFont;
      return parseInlineMarkdownRuns(text).map(
        (run) =>
          new TextRun({
            text: run.text,
            bold: defaults.bold || !!run.bold,
            italics: defaults.italics || !!run.italic,
            font: run.code ? 'Courier New' : font,
            size: run.code ? Math.max(18, size - 2) : size,
            color: run.bold ? '0F172A' : run.code ? '1D4ED8' : color,
          })
      );
    };

    const makeCalloutBox = (
      headerText: string,
      bodyLines: string[],
      options: {
        fillHex: string;
        accentHex: string;
        headerHex: string;
        textHex?: string;
        badgeText?: string;
        italicBody?: boolean;
      }
    ): Table => {
      const cellParagraphs: Paragraph[] = [];

      if (headerText) {
        cellParagraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: headerText,
                bold: true,
                font: baseWordFont,
                size: 19,
                color: options.headerHex,
              }),
              ...(options.badgeText
                ? [
                    new TextRun({
                      text: `   [${options.badgeText}]`,
                      bold: true,
                      font: baseWordFont,
                      size: 17,
                      color: '64748B',
                    }),
                  ]
                : []),
            ],
            spacing: { after: 80 },
          })
        );
      }

      bodyLines.forEach((line, idx) => {
        cellParagraphs.push(
          new Paragraph({
            children: buildWordTextRuns(line || ' ', {
              size: 21,
              color: options.textHex || '0F172A',
              italics: options.italicBody,
            }),
            spacing: { line: 300, after: idx === bodyLines.length - 1 ? 0 : 70 },
          })
        );
      });

      if (cellParagraphs.length === 0) {
        cellParagraphs.push(new Paragraph({ text: '' }));
      }

      return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { type: ShadingType.CLEAR, color: 'auto', fill: options.fillHex },
                margins: { top: 150, bottom: 150, left: 220, right: 200 },
                borders: {
                  top: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                  right: { style: BorderStyle.SINGLE, size: 4, color: 'E2E8F0' },
                  left: { style: BorderStyle.SINGLE, size: 24, color: options.accentHex },
                },
                children: cellParagraphs,
              }),
            ],
          }),
        ],
      });
    };

    const addSectionTitle = (title: string) => {
      docChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: title,
              bold: true,
              font: baseWordFont,
              size: 26,
              color: '1E3A8A',
            }),
          ],
          heading: HeadingLevel.HEADING_2,
          keepNext: true,
          spacing: { before: 280, after: 120 },
          border: {
            bottom: { style: BorderStyle.SINGLE, size: 8, color: '2563EB' },
          },
        })
      );
    };

    const addRichMarkdownToWord = (rawText: string) => {
      const blocks = parseMarkdownBlocks(rawText);

      blocks.forEach((block) => {
        if (block.type === 'h1') {
          docChildren.push(
            new Paragraph({
              children: buildWordTextRuns(block.text, { size: 32, bold: true, color: '0F172A' }),
              heading: HeadingLevel.HEADING_1,
              keepNext: true,
              spacing: { before: 260, after: 120 },
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 12, color: '1E3A8A' },
              },
            })
          );
          return;
        }

        if (block.type === 'h2') {
          docChildren.push(
            new Paragraph({
              children: buildWordTextRuns(block.text, { size: 26, bold: true, color: '1E3A8A' }),
              heading: HeadingLevel.HEADING_2,
              keepNext: true,
              spacing: { before: 240, after: 100 },
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
              },
            })
          );
          return;
        }

        if (block.type === 'h3' || block.type === 'h4') {
          docChildren.push(
            new Paragraph({
              children: buildWordTextRuns(block.text, {
                size: block.type === 'h3' ? 23 : 21,
                bold: true,
                color: '1E40AF',
              }),
              heading: HeadingLevel.HEADING_3,
              keepNext: true,
              spacing: { before: 180, after: 80 },
            })
          );
          return;
        }

        if (block.type === 'hr') {
          docChildren.push(
            new Paragraph({
              text: '',
              spacing: { before: 120, after: 140 },
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 6, color: 'CBD5E1' },
              },
            })
          );
          return;
        }

        if (block.type === 'blockquote') {
          docChildren.push(
            makeCalloutBox('', block.lines, {
              fillHex: 'EFF6FF',
              accentHex: '2563EB',
              headerHex: '1D4ED8',
              textHex: '0F172A',
              italicBody: false,
            }),
            new Paragraph({ text: '', spacing: { after: 100 } })
          );
          return;
        }

        if (block.type === 'code') {
          docChildren.push(
            makeCalloutBox(block.lang ? block.lang.toUpperCase() : 'CODE / TEMPLATE', block.lines, {
              fillHex: 'F8FAFC',
              accentHex: '475569',
              headerHex: '334155',
              textHex: '0F172A',
            }),
            new Paragraph({ text: '', spacing: { after: 100 } })
          );
          return;
        }

        if (block.type === 'table') {
          const colCount = Math.max(1, block.headers.length);
          const colWidthPct = Math.floor(100 / colCount);
          const tableRows: TableRow[] = [
            new TableRow({
              tableHeader: true,
              children: block.headers.map(
                (header) =>
                  new TableCell({
                    width: { size: colWidthPct, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, color: 'auto', fill: '1E3A8A' },
                    margins: { top: 110, bottom: 110, left: 140, right: 140 },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: '1E3A8A' },
                      bottom: { style: BorderStyle.SINGLE, size: 6, color: '1E3A8A' },
                      left: { style: BorderStyle.SINGLE, size: 4, color: '1E40AF' },
                      right: { style: BorderStyle.SINGLE, size: 4, color: '1E40AF' },
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: stripInlineMarkdownSyntax(header),
                            bold: true,
                            font: baseWordFont,
                            size: 20,
                            color: 'FFFFFF',
                          }),
                        ],
                      }),
                    ],
                  })
              ),
            }),
            ...block.rows.map(
              (row, rIdx) =>
                new TableRow({
                  children: block.headers.map((_, cIdx) => {
                    const cellText = row[cIdx] ?? '';
                    return new TableCell({
                      width: { size: colWidthPct, type: WidthType.PERCENTAGE },
                      shading: {
                        type: ShadingType.CLEAR,
                        color: 'auto',
                        fill: rIdx % 2 === 0 ? 'FFFFFF' : 'F8FAFC',
                      },
                      margins: { top: 95, bottom: 95, left: 140, right: 140 },
                      borders: {
                        top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                        left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                        right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      },
                      children: [
                        new Paragraph({
                          children: buildWordTextRuns(cellText || '-', {
                            size: 19,
                            color: '1E293B',
                          }),
                          spacing: { line: 276 },
                        }),
                      ],
                    });
                  }),
                })
            ),
          ];

          docChildren.push(
            new Table({
              width: { size: 100, type: WidthType.PERCENTAGE },
              rows: tableRows,
            }),
            new Paragraph({ text: '', spacing: { after: 120 } })
          );
          return;
        }

        if (block.type === 'bullet') {
          const leftIndent = block.level > 0 ? 640 : 380;
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: block.level > 0 ? '◦   ' : '•   ',
                  bold: true,
                  font: baseWordFont,
                  size: 21,
                  color: '2563EB',
                }),
                ...buildWordTextRuns(block.text, { size: 21, color: '1E293B' }),
              ],
              indent: { left: leftIndent, hanging: 200 },
              spacing: { line: 300, after: 75 },
            })
          );
          return;
        }

        if (block.type === 'ordered') {
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${block.num}.  `,
                  bold: true,
                  font: baseWordFont,
                  size: 21,
                  color: '1E3A8A',
                }),
                ...buildWordTextRuns(block.text, { size: 21, color: '1E293B' }),
              ],
              indent: { left: 400, hanging: 220 },
              spacing: { line: 300, after: 80 },
            })
          );
          return;
        }

        // Standard paragraph with inline formatting
        docChildren.push(
          new Paragraph({
            children: buildWordTextRuns(block.text, { size: 21, color: '1E293B' }),
            spacing: { line: 310, after: 105 },
          })
        );
      });
    };

    const scopeSubtitle =
      scope === 'conversation'
        ? 'CONVERSATION TRANSCRIPT & INTELLIGENCE BRIEF'
        : scope === 'selected-reply'
        ? 'SELECTED RESPONSE BRIEF'
        : scope === 'active-preview'
        ? `${previewFormat.toUpperCase()} PLATFORM EXPORT`
        : 'EXECUTIVE COMMUNICATION BRIEF';

    // Executive Banner Header Table
    docChildren.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              new TableCell({
                shading: { type: ShadingType.CLEAR, color: 'auto', fill: '0F172A' },
                margins: { top: 200, bottom: 200, left: 240, right: 240 },
                borders: {
                  top: { style: BorderStyle.NONE, size: 0, color: '0F172A' },
                  bottom: { style: BorderStyle.SINGLE, size: 18, color: '2563EB' },
                  left: { style: BorderStyle.NONE, size: 0, color: '0F172A' },
                  right: { style: BorderStyle.NONE, size: 0, color: '0F172A' },
                },
                children: [
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `SITUATION AI  |  ${scopeSubtitle}`,
                        bold: true,
                        font: baseWordFont,
                        size: 18,
                        color: '93C5FD',
                      }),
                    ],
                    spacing: { after: 80 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: data.title || 'Conversation Intelligence Analysis',
                        bold: true,
                        font: baseWordFont,
                        size: 30,
                        color: 'FFFFFF',
                      }),
                    ],
                    spacing: { after: 100 },
                  }),
                  new Paragraph({
                    children: [
                      new TextRun({
                        text: `Date: ${dateStr}   |   Platform: ${data.platform}   |   Template: ${data.template}   |   Model: ${(data.aiModel || 'gemini').toUpperCase()}`,
                        font: baseWordFont,
                        size: 18,
                        color: 'CBD5E1',
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      new Paragraph({ text: '', spacing: { after: 160 } })
    );

    let sectionNum = 1;

    const addConversationSection = (includeChosenReplyBubble: boolean) => {
      const turns = parseConversationTurns(data.chatHistory);
      if (turns.length === 0 && !data.latestMessage) return;

      addSectionTitle(`${sectionNum++}. Current Conversation Thread`);

      turns.forEach((turn) => {
        const header = turn.timestamp
          ? `${turn.speaker.toUpperCase()}  (${turn.timestamp})`
          : turn.speaker.toUpperCase();
        docChildren.push(
          makeCalloutBox(header, turn.message.split('\n'), {
            fillHex: turn.isSelf ? 'ECFDF5' : 'EFF6FF',
            accentHex: turn.isSelf ? '059669' : '2563EB',
            headerHex: turn.isSelf ? '047857' : '1D4ED8',
            textHex: '0F172A',
            badgeText: turn.isSelf ? 'You' : 'Participant',
          }),
          new Paragraph({ text: '', spacing: { after: 80 } })
        );
      });

      if (data.latestMessage) {
        docChildren.push(
          makeCalloutBox('LATEST INCOMING MESSAGE', cleanDocxText(data.latestMessage).split('\n'), {
            fillHex: 'FFFBEB',
            accentHex: 'D97706',
            headerHex: 'B45309',
            textHex: '0F172A',
            badgeText: 'Active Turn',
            italicBody: true,
          }),
          new Paragraph({ text: '', spacing: { after: 80 } })
        );
      }

      if (includeChosenReplyBubble && chosenReply) {
        docChildren.push(
          makeCalloutBox(
            `YOU (SUGGESTED REPLY: ${chosenReply.styleLabel.toUpperCase()})`,
            chosenReply.content.split('\n'),
            {
              fillHex: 'ECFDF5',
              accentHex: '059669',
              headerHex: '047857',
              textHex: '0F172A',
              badgeText: `${chosenReply.tone} | ${chosenReply.matchScore}% Match`,
            }
          ),
          new Paragraph({ text: '', spacing: { after: 100 } })
        );
      }
    };

    const addAnalysisSection = () => {
      if (!data.analysis) return;
      addSectionTitle(`${sectionNum++}. Situation Analysis & Psychological Dynamics`);

      const summaryRows: [string, string][] = [
        ['Identified Situation', data.analysis.situation],
        [
          'Category / Urgency',
          `${data.analysis.category}  |  ${data.analysis.urgency} Urgency (${data.analysis.confidenceScore}% Confidence)`,
        ],
        ['Participant Dynamics', data.analysis.participantDynamics],
        ['Underlying Intent', data.analysis.latestMessageIntent],
        ['Conversation Purpose', data.analysis.conversationPurpose],
      ];

      docChildren.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: summaryRows.map(
            ([label, value]) =>
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 28, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'F1F5F9' },
                    margins: { top: 95, bottom: 95, left: 140, right: 120 },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: label, bold: true, font: baseWordFont, size: 19, color: '1E3A8A' }),
                        ],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 72, type: WidthType.PERCENTAGE },
                    shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FFFFFF' },
                    margins: { top: 95, bottom: 95, left: 140, right: 140 },
                    borders: {
                      top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                      right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
                    },
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({ text: value || '-', font: baseWordFont, size: 20, color: '0F172A' }),
                        ],
                        spacing: { line: 280 },
                      }),
                    ],
                  }),
                ],
              })
          ),
        }),
        new Paragraph({ text: '', spacing: { after: 120 } })
      );

      if (data.analysis.emotionalSignals && data.analysis.emotionalSignals.length > 0) {
        docChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: 'Detected Emotional Signals:',
                bold: true,
                font: baseWordFont,
                size: 21,
                color: '1E3A8A',
              }),
            ],
            spacing: { after: 60 },
          })
        );
        data.analysis.emotionalSignals.forEach((sig) => {
          const sigColor =
            sig.intensity === 'High' ? 'BE123C' : sig.intensity === 'Moderate' ? 'B45309' : '1D4ED8';
          docChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `•  ${sig.label} (${sig.intensity})`,
                  bold: true,
                  font: baseWordFont,
                  size: 20,
                  color: sigColor,
                }),
                ...(sig.context
                  ? [new TextRun({ text: ` — ${sig.context}`, font: baseWordFont, size: 20, color: '334155' })]
                  : []),
              ],
              indent: { left: 220 },
              spacing: { after: 55 },
            })
          );
        });
        docChildren.push(new Paragraph({ text: '', spacing: { after: 80 } }));
      }

      if (data.analysis.recommendedStrategy) {
        docChildren.push(
          makeCalloutBox('RECOMMENDED STRATEGY', [data.analysis.recommendedStrategy], {
            fillHex: 'ECFDF5',
            accentHex: '059669',
            headerHex: '047857',
            textHex: '064E3B',
          }),
          new Paragraph({ text: '', spacing: { after: 80 } })
        );
      }

      if (data.analysis.potentialPitfalls) {
        docChildren.push(
          makeCalloutBox('POTENTIAL PITFALLS TO AVOID', [data.analysis.potentialPitfalls], {
            fillHex: 'FFF1F2',
            accentHex: 'E11D48',
            headerHex: 'BE123C',
            textHex: '881337',
          }),
          new Paragraph({ text: '', spacing: { after: 100 } })
        );
      }
    };

    const addRepliesSection = (replies: ReplyOption[]) => {
      if (!replies || replies.length === 0) return;
      addSectionTitle(`${sectionNum++}. Generated Contextual Replies`);

      const optionColors = ['2563EB', '059669', '7C3AED'];
      replies.forEach((rep, idx) => {
        const accentHex = optionColors[idx % optionColors.length];
        const lines = [...rep.content.split('\n')];
        if (rep.explanation) {
          lines.push(`**Strategic Rationale:** ${rep.explanation}`);
        }
        if (rep.autoRefined && rep.refinementNotes) {
          lines.push(`**Situation Audit:** ${rep.refinementNotes}`);
        }
        if (data.includeHashtags !== false && rep.hashtags?.length) {
          lines.push(`**Hashtags:** ${rep.hashtags.join(' ')}`);
        }
        if (data.includeLinks !== false && rep.suggestedLinks?.length) {
          lines.push(`**Reference Links:** ${rep.suggestedLinks.join(', ')}`);
        }

        const badge = `${rep.autoRefined ? 'Auto-Refined | ' : ''}${rep.tone} | ${rep.matchScore}% Fit`;
        docChildren.push(
          makeCalloutBox(`Option ${idx + 1}: ${rep.styleLabel}`, lines, {
            fillHex: 'F8FAFC',
            accentHex,
            headerHex: accentHex,
            textHex: '0F172A',
            badgeText: badge,
          }),
          new Paragraph({ text: '', spacing: { after: 95 } })
        );
      });
    };

    if (scope === 'active-preview' && previewFormat !== 'document') {
      if (previewFormat === 'linkedin') {
        addSectionTitle('LinkedIn Post / Networking Format');
        const postText = formatForLinkedIn({ ...data, selectedReplyIndex: data.selectedReplyIndex ?? 0 });
        docChildren.push(
          makeCalloutBox('LINKEDIN POST CONTENT', postText.split('\n'), {
            fillHex: 'EFF6FF',
            accentHex: '0A66C2',
            headerHex: '0A66C2',
            badgeText: `${postText.length} / 3,000 chars`,
          })
        );
      } else if (previewFormat === 'email') {
        addSectionTitle('Email Communication Format');
        const emailData = formatForEmail({ ...data, selectedReplyIndex: data.selectedReplyIndex ?? 0 });
        docChildren.push(
          makeCalloutBox(
            'EMAIL HEADERS',
            [`**To:** ${data.emailRecipient?.trim() || 'Colleague'}`, `**Subject:** ${emailData.subject}`],
            {
              fillHex: 'F1F5F9',
              accentHex: '059669',
              headerHex: '047857',
            }
          ),
          new Paragraph({ text: '', spacing: { after: 80 } }),
          makeCalloutBox('EMAIL MESSAGE BODY', emailData.body.split('\n'), {
            fillHex: 'FFFFFF',
            accentHex: '059669',
            headerHex: '047857',
          })
        );
      } else if (previewFormat === 'markdown') {
        addSectionTitle('Slack / Microsoft Teams / Notion Brief');
        const mdText = formatForSlackTeams({ ...data, selectedReplyIndex: data.selectedReplyIndex ?? 0 });
        addRichMarkdownToWord(mdText);
      }
    } else if (scope === 'selected-reply') {
      if (data.latestMessage) {
        addSectionTitle('1. Incoming Message Context');
        docChildren.push(
          makeCalloutBox('INCOMING MESSAGE', cleanDocxText(data.latestMessage).split('\n'), {
            fillHex: 'FFFBEB',
            accentHex: 'D97706',
            headerHex: 'B45309',
            italicBody: true,
          }),
          new Paragraph({ text: '', spacing: { after: 100 } })
        );
      }

      if (chosenReply) {
        addSectionTitle(`${data.latestMessage ? '2.' : '1.'} Recommended Response`);
        addRepliesSection([chosenReply]);
      } else if (data.synthesizedText || data.customNotes) {
        addRichMarkdownToWord(data.synthesizedText || data.customNotes || '');
      }
    } else {
      const hasPrimaryConversationData = Boolean(
        data.chatHistory?.trim() ||
          data.latestMessage?.trim() ||
          data.analysis ||
          (data.replies && data.replies.length > 0)
      );

      const DEFAULT_PLACEHOLDER_NOTES =
        'Strategic communication notes prepared using Situation AI. Ready for review or immediate deployment.';
      const meaningfulCustomNotes =
        data.customNotes?.trim() && data.customNotes.trim() !== DEFAULT_PLACEHOLDER_NOTES
          ? data.customNotes.trim()
          : '';

      if (scope === 'active-preview' && data.synthesizedText?.trim()) {
        addRichMarkdownToWord(data.synthesizedText);
      } else if (!hasPrimaryConversationData && (data.synthesizedText?.trim() || data.customNotes?.trim())) {
        // Standalone Document / PromptStudio export: render Gemini/ChatGPT markdown natively
        addRichMarkdownToWord(data.synthesizedText?.trim() || data.customNotes?.trim() || '');
      } else if (scope === 'replies-summary') {
        const turns = parseConversationTurns(data.chatHistory);
        const participants = Array.from(new Set(turns.map((t) => t.speaker))).slice(0, 6);
        const totalMessages = turns.length + (data.latestMessage?.trim() ? 1 : 0);
        const summaryLines: string[] = [
          `**Platform:** ${data.platform}   |   **Messages Analyzed:** ${totalMessages}   |   **Generated Replies:** ${data.replies?.length || 0}`,
        ];
        if (participants.length > 0) {
          summaryLines.push(`**Participants:** ${participants.join(', ')}`);
        }
        if (data.analysis?.situation) {
          summaryLines.push(`**Headline Situation:** ${data.analysis.situation}`);
        }
        if (data.analysis?.underlyingContext) {
          summaryLines.push(`**Thread Background:** ${data.analysis.underlyingContext}`);
        }
        if (data.analysis?.conversationPurpose) {
          summaryLines.push(`**Communication Goal:** ${data.analysis.conversationPurpose}`);
        }
        if (!data.analysis && turns.length > 0) {
          const previewTurns = turns
            .slice(-3)
            .map((t) => `**${t.speaker}:** ${t.message.replace(/\s+/g, ' ').slice(0, 140)}`)
            .join('  |  ');
          summaryLines.push(`**Recent Thread Highlights:** ${previewTurns}`);
        }
        if (data.latestMessage?.trim()) {
          summaryLines.push(`**Latest Incoming Message:** "${cleanDocxText(data.latestMessage.trim())}"`);
        }
        addSectionTitle(`${sectionNum++}. Conversation Summary`);
        docChildren.push(
          makeCalloutBox('CONVERSATION OVERVIEW', summaryLines, {
            fillHex: 'F8FAFC',
            accentHex: '1D4ED8',
            headerHex: '1E3A8A',
            textHex: '0F172A',
          }),
          new Paragraph({ text: '', spacing: { after: 100 } })
        );
        addAnalysisSection();
        if (data.replies && data.replies.length > 0) {
          addRepliesSection(data.replies);
        } else {
          docChildren.push(
            makeCalloutBox(
              'GENERATED REPLIES',
              [
                'No generated replies were attached to this export yet. Generate replies in the Reply Engine or click "Generate Perfect Situational Doc" to synthesize complete drafts.',
              ],
              {
                fillHex: 'F8FAFC',
                accentHex: '64748B',
                headerHex: '475569',
                textHex: '475569',
              }
            ),
            new Paragraph({ text: '', spacing: { after: 95 } })
          );
        }
        if (data.synthesizedText?.trim()) {
          addSectionTitle(`${sectionNum++}. AI Synthesized Situational Brief`);
          addRichMarkdownToWord(data.synthesizedText.trim());
        } else if (meaningfulCustomNotes) {
          addSectionTitle(`${sectionNum++}. Executive Notes & Brief`);
          addRichMarkdownToWord(meaningfulCustomNotes);
        }
      } else {
        addConversationSection(scope === 'conversation');
        addAnalysisSection();
        if (data.replies && data.replies.length > 0) {
          addRepliesSection(data.replies);
        }

        if (data.synthesizedText?.trim()) {
          addSectionTitle(`${sectionNum++}. Executive Synthesized Document`);
          addRichMarkdownToWord(data.synthesizedText.trim());
        } else if (meaningfulCustomNotes) {
          addSectionTitle(`${sectionNum++}. Executive Notes & Operational Context`);
          addRichMarkdownToWord(meaningfulCustomNotes);
        }
      }
    }

    if (
      (data.includeHashtags !== false || data.includeLinks !== false) &&
      (data.analysis || data.replies?.length) &&
      !(scope === 'active-preview' && data.synthesizedText?.trim())
    ) {
      const metaLines: string[] = [];
      if (data.includeHashtags !== false) {
        const tags = chosenReply?.hashtags?.length
          ? chosenReply.hashtags.join(' ')
          : '#CommunicationStrategy #Leadership #SituationAI #Brief';
        metaLines.push(`**Hashtags:** ${tags}`);
      }
      if (data.includeLinks !== false) {
        const link = chosenReply?.suggestedLinks?.[0] || 'https://situationai.com/review/dilemma-brief';
        metaLines.push(`**Reference Link:** ${link}`);
      }
      if (metaLines.length > 0) {
        docChildren.push(
          new Paragraph({ text: '', spacing: { after: 80 } }),
          makeCalloutBox('TAGS & REFERENCE LINKS', metaLines, {
            fillHex: 'F8FAFC',
            accentHex: '2563EB',
            headerHex: '1D4ED8',
            textHex: '334155',
          })
        );
      }
    }

    // Footer
    docChildren.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Generated by Situation AI — Understand Every Conversation. Respond Like a Human.',
            italics: true,
            font: baseWordFont,
            color: '64748B',
            size: 18,
          }),
        ],
        alignment: AlignmentType.CENTER,
        spacing: { before: 360 },
      })
    );

    const doc = new Document({
      styles: {
        default: {
          document: {
            run: {
              font: baseWordFont,
              size: 21,
              color: '1E293B',
            },
            paragraph: {
              spacing: { line: 300 },
            },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1080,
                bottom: 1080,
                left: 1080,
                right: 1080,
              },
            },
          },
          children: docChildren,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const suffix =
      scope === 'conversation' && data.replies?.length
        ? '_Conversation'
        : scope === 'selected-reply'
        ? '_Response'
        : scope === 'active-preview' && previewFormat !== 'document'
        ? `_${previewFormat}`
        : '';
    const safeTitle = buildSafeFilenameBase(data.title, 'Situation_AI_Report');
    const filename = `${safeTitle}${suffix}.docx`;
    downloadBlob(blob, filename);
    return true;
  } catch (err) {
    console.error('Word export error:', err);
    throw err;
  }
}

export type PdfExportScope = 'replies-summary' | 'conversation' | 'full-summary' | 'selected-reply' | 'active-preview';
export type PdfThemeMode = 'match-ui' | 'print-light';

export interface PdfExportOptions extends ExportData {
  scope?: PdfExportScope;
  previewFormat?: 'document' | 'linkedin' | 'email' | 'markdown';
  selectedReplyIndex?: number;
  emailRecipient?: string;
  includeHashtags?: boolean;
  includeLinks?: boolean;
  synthesizedText?: string;
  isDark?: boolean;
  themeId?: string;
  pdfThemeMode?: PdfThemeMode;
  aiModel?: string;
  fontFamily?: FontFamilyId;
}

export interface ConversationTurn {
  speaker: string;
  timestamp?: string;
  message: string;
  isSelf: boolean;
}

/**
 * Parses raw chat transcripts (e.g. "[10:15 AM] Alex: Hey" or "You: Sounds good")
 * into structured speaker turns for color-coded UI preview and PDF bubble rendering.
 */
export function parseConversationTurns(chatHistory?: string): ConversationTurn[] {
  if (!chatHistory || !chatHistory.trim()) return [];

  const rawLines = chatHistory.split(/\r?\n/);
  const turns: ConversationTurn[] = [];

  const timestampSpeakerRegex =
    /^(?:\[([^\]]{1,30})\]|\(([^)]{1,24})\)|(\d{1,2}:\d{2}(?:\s?[APap][Mm])?)\s*[-|])\s*([^:\n]{1,36}):\s*(.*)$/;
  const plainSpeakerRegex = /^([A-Za-z][A-Za-z0-9 ._'()-]{0,32}):\s+(.+)$/;

  const isSelfSpeaker = (name: string): boolean => {
    const norm = name.trim().toLowerCase();
    return (
      norm === 'you' ||
      norm === 'me' ||
      norm === 'myself' ||
      norm === 'self' ||
      norm === 'sender' ||
      norm === 'operator' ||
      norm === 'user' ||
      norm.startsWith('you (') ||
      norm.startsWith('me (')
    );
  };

  for (const rawLine of rawLines) {
    const line = rawLine.trim();
    if (!line) continue;

    const tsMatch = line.match(timestampSpeakerRegex);
    if (tsMatch) {
      const timestamp = (tsMatch[1] || tsMatch[2] || tsMatch[3] || '').trim();
      const speaker = tsMatch[4].trim();
      const message = tsMatch[5].trim();
      turns.push({
        speaker,
        timestamp: timestamp || undefined,
        message,
        isSelf: isSelfSpeaker(speaker),
      });
      continue;
    }

    const plainMatch = line.match(plainSpeakerRegex);
    if (plainMatch && !/^https?$/i.test(plainMatch[1].trim())) {
      const speaker = plainMatch[1].trim();
      const message = plainMatch[2].trim();
      turns.push({
        speaker,
        message,
        isSelf: isSelfSpeaker(speaker),
      });
      continue;
    }

    if (turns.length > 0) {
      turns[turns.length - 1].message += `\n${line}`;
    } else {
      turns.push({
        speaker: 'Conversation Context',
        message: line,
        isSelf: false,
      });
    }
  }

  return turns;
}

type Rgb = [number, number, number];

interface PdfPalette {
  isDarkPdf: boolean;
  pageBg: Rgb;
  cardBg: Rgb;
  innerBg: Rgb;
  border: Rgb;
  headerBg: Rgb;
  headerSubText: Rgb;
  headerText: Rgb;
  accent: Rgb;
  tableHeaderBg: Rgb;
  tableHeaderText: Rgb;
  tableStripeBg: Rgb;
  purple: Rgb;
  emerald: Rgb;
  emeraldBg: Rgb;
  emeraldBorder: Rgb;
  rose: Rgb;
  roseBg: Rgb;
  roseBorder: Rgb;
  amber: Rgb;
  amberBg: Rgb;
  amberBorder: Rgb;
  youBubbleBg: Rgb;
  youBubbleBorder: Rgb;
  otherBubbleBg: Rgb;
  otherBubbleBorder: Rgb;
  textPrimary: Rgb;
  textSecondary: Rgb;
  textMuted: Rgb;
  badgeBg: Rgb;
  badgeText: Rgb;
}

function getPdfPalette(themeId?: string, isDark?: boolean, pdfThemeMode: PdfThemeMode = 'print-light'): PdfPalette {
  const useDark = pdfThemeMode === 'match-ui' && !!isDark;
  const id = themeId || 'executive-navy';

  const darkAccentMap: Record<string, Rgb> = {
    'executive-navy': [96, 165, 250],
    'sapphire-white': [96, 165, 250],
    'corporate-slate': [56, 189, 248],
    'nordic-minimal': [56, 189, 248],
    'obsidian-enterprise': [228, 228, 231],
    'pacific-blue': [56, 189, 248],
    'oxford-academic': [251, 191, 36],
    'monochrome-pro': [229, 229, 229],
    'emerald-trust': [52, 211, 153],
    'modern-cobalt': [129, 140, 248],
  };

  const lightAccentMap: Record<string, Rgb> = {
    'executive-navy': [29, 78, 216],
    'sapphire-white': [30, 64, 175],
    'corporate-slate': [15, 23, 42],
    'nordic-minimal': [3, 105, 161],
    'obsidian-enterprise': [24, 24, 27],
    'pacific-blue': [3, 105, 161],
    'oxford-academic': [30, 41, 59],
    'monochrome-pro': [23, 23, 23],
    'emerald-trust': [4, 120, 87],
    'modern-cobalt': [79, 70, 229],
  };

  if (useDark) {
    const darkSchemes: Record<
      string,
      { page: Rgb; card: Rgb; inner: Rgb; border: Rgb; header: Rgb; otherBg: Rgb; otherBorder: Rgb; youBg: Rgb; youBorder: Rgb }
    > = {
      'executive-navy': {
        page: [11, 17, 32],
        card: [19, 28, 49],
        inner: [26, 37, 64],
        border: [36, 50, 77],
        header: [37, 99, 235],
        otherBg: [19, 28, 49],
        otherBorder: [59, 130, 246],
        youBg: [11, 34, 29],
        youBorder: [16, 185, 129],
      },
      'sapphire-white': {
        page: [9, 14, 26],
        card: [17, 24, 39],
        inner: [24, 34, 54],
        border: [31, 41, 55],
        header: [37, 99, 235],
        otherBg: [17, 24, 39],
        otherBorder: [59, 130, 246],
        youBg: [11, 34, 29],
        youBorder: [16, 185, 129],
      },
      'corporate-slate': {
        page: [15, 23, 42],
        card: [30, 41, 59],
        inner: [39, 52, 73],
        border: [51, 65, 85],
        header: [2, 132, 199],
        otherBg: [30, 41, 59],
        otherBorder: [56, 189, 248],
        youBg: [11, 36, 32],
        youBorder: [16, 185, 129],
      },
      'nordic-minimal': {
        page: [17, 19, 24],
        card: [24, 27, 34],
        inner: [31, 36, 45],
        border: [39, 43, 54],
        header: [2, 132, 199],
        otherBg: [24, 27, 34],
        otherBorder: [56, 189, 248],
        youBg: [14, 36, 31],
        youBorder: [16, 185, 129],
      },
      'obsidian-enterprise': {
        page: [9, 9, 11],
        card: [20, 20, 23],
        inner: [28, 28, 33],
        border: [39, 39, 42],
        header: [39, 39, 42],
        otherBg: [24, 24, 27],
        otherBorder: [113, 113, 122],
        youBg: [14, 34, 28],
        youBorder: [16, 185, 129],
      },
      'pacific-blue': {
        page: [10, 22, 34],
        card: [17, 34, 51],
        inner: [23, 45, 68],
        border: [30, 58, 82],
        header: [2, 132, 199],
        otherBg: [17, 34, 51],
        otherBorder: [56, 189, 248],
        youBg: [10, 38, 35],
        youBorder: [20, 184, 166],
      },
      'oxford-academic': {
        page: [13, 19, 33],
        card: [22, 31, 51],
        inner: [30, 41, 68],
        border: [42, 55, 84],
        header: [30, 41, 59],
        otherBg: [22, 31, 51],
        otherBorder: [217, 119, 6],
        youBg: [12, 36, 31],
        youBorder: [16, 185, 129],
      },
      'monochrome-pro': {
        page: [10, 10, 10],
        card: [20, 20, 20],
        inner: [31, 31, 31],
        border: [38, 38, 38],
        header: [23, 23, 23],
        otherBg: [24, 24, 24],
        otherBorder: [163, 163, 163],
        youBg: [16, 36, 28],
        youBorder: [52, 211, 153],
      },
      'emerald-trust': {
        page: [10, 21, 18],
        card: [17, 34, 29],
        inner: [24, 46, 40],
        border: [31, 58, 50],
        header: [5, 150, 105],
        otherBg: [17, 34, 29],
        otherBorder: [52, 211, 153],
        youBg: [13, 46, 35],
        youBorder: [52, 211, 153],
      },
      'modern-cobalt': {
        page: [13, 15, 24],
        card: [21, 25, 41],
        inner: [30, 34, 56],
        border: [38, 45, 71],
        header: [79, 70, 229],
        otherBg: [21, 25, 41],
        otherBorder: [129, 140, 248],
        youBg: [12, 36, 32],
        youBorder: [16, 185, 129],
      },
    };

    const scheme = darkSchemes[id] || darkSchemes['executive-navy'];
    const accent = darkAccentMap[id] || [96, 165, 250];

    return {
      isDarkPdf: true,
      pageBg: scheme.page,
      cardBg: scheme.card,
      innerBg: scheme.inner,
      border: scheme.border,
      headerBg: scheme.header,
      headerSubText: [226, 232, 240],
      headerText: [255, 255, 255],
      accent,
      tableHeaderBg: scheme.header,
      tableHeaderText: [255, 255, 255],
      tableStripeBg: scheme.inner,
      purple: [192, 132, 252],
      emerald: [52, 211, 153],
      emeraldBg: [6, 46, 36],
      emeraldBorder: [16, 185, 129],
      rose: [251, 113, 133],
      roseBg: [56, 18, 28],
      roseBorder: [225, 29, 72],
      amber: [251, 191, 36],
      amberBg: [58, 38, 12],
      amberBorder: [217, 119, 6],
      youBubbleBg: scheme.youBg,
      youBubbleBorder: scheme.youBorder,
      otherBubbleBg: scheme.otherBg,
      otherBubbleBorder: scheme.otherBorder,
      textPrimary: [248, 250, 252],
      textSecondary: [226, 232, 240],
      textMuted: [148, 163, 184],
      badgeBg: [30, 41, 59],
      badgeText: accent,
    };
  }

  // Editorial Light Mode Palettes (Crisp Gemini / ChatGPT paper white quality)
  const lightSchemes: Record<
    string,
    { page: Rgb; card: Rgb; inner: Rgb; border: Rgb; header: Rgb; badgeBg: Rgb; otherBg: Rgb; otherBorder: Rgb }
  > = {
    'executive-navy': {
      page: [255, 255, 255],
      card: [255, 255, 255],
      inner: [248, 250, 252],
      border: [203, 213, 225],
      header: [15, 23, 42],
      badgeBg: [239, 246, 255],
      otherBg: [239, 246, 255],
      otherBorder: [147, 197, 253],
    },
    'sapphire-white': {
      page: [255, 255, 255],
      card: [255, 255, 255],
      inner: [241, 245, 253],
      border: [191, 219, 254],
      header: [29, 78, 216],
      badgeBg: [239, 246, 255],
      otherBg: [239, 246, 255],
      otherBorder: [96, 165, 250],
    },
    'corporate-slate': {
      page: [255, 255, 255],
      card: [255, 255, 255],
      inner: [248, 250, 252],
      border: [203, 213, 225],
      header: [15, 23, 42],
      badgeBg: [226, 232, 240],
      otherBg: [241, 245, 249],
      otherBorder: [148, 163, 184],
    },
    'nordic-minimal': {
      page: [255, 255, 255],
      card: [255, 255, 255],
      inner: [244, 244, 245],
      border: [228, 228, 231],
      header: [2, 132, 199],
      badgeBg: [240, 249, 255],
      otherBg: [240, 249, 255],
      otherBorder: [125, 211, 252],
    },
    'obsidian-enterprise': {
      page: [255, 255, 255],
      card: [255, 255, 255],
      inner: [244, 244, 245],
      border: [212, 212, 216],
      header: [24, 24, 27],
      badgeBg: [228, 228, 231],
      otherBg: [244, 244, 245],
      otherBorder: [161, 161, 170],
    },
    'pacific-blue': {
      page: [255, 255, 255],
      card: [255, 255, 255],
      inner: [240, 249, 255],
      border: [186, 230, 253],
      header: [2, 132, 199],
      badgeBg: [224, 242, 254],
      otherBg: [224, 242, 254],
      otherBorder: [56, 189, 248],
    },
    'oxford-academic': {
      page: [255, 255, 255],
      card: [255, 255, 255],
      inner: [248, 246, 241],
      border: [214, 211, 209],
      header: [28, 37, 65],
      badgeBg: [254, 243, 199],
      otherBg: [245, 243, 238],
      otherBorder: [217, 119, 6],
    },
    'monochrome-pro': {
      page: [255, 255, 255],
      card: [255, 255, 255],
      inner: [244, 244, 245],
      border: [212, 212, 216],
      header: [15, 15, 18],
      badgeBg: [228, 228, 231],
      otherBg: [244, 244, 245],
      otherBorder: [113, 113, 122],
    },
    'emerald-trust': {
      page: [255, 255, 255],
      card: [255, 255, 255],
      inner: [240, 253, 244],
      border: [167, 243, 208],
      header: [4, 120, 87],
      badgeBg: [209, 250, 229],
      otherBg: [240, 253, 250],
      otherBorder: [94, 234, 212],
    },
    'modern-cobalt': {
      page: [255, 255, 255],
      card: [255, 255, 255],
      inner: [239, 246, 255],
      border: [191, 219, 254],
      header: [37, 99, 235],
      badgeBg: [219, 234, 254],
      otherBg: [239, 246, 255],
      otherBorder: [147, 197, 253],
    },
  };

  const light = lightSchemes[id] || lightSchemes['executive-navy'];
  const accent = lightAccentMap[id] || [30, 64, 175];

  return {
    isDarkPdf: false,
    pageBg: light.page,
    cardBg: light.card,
    innerBg: light.inner,
    border: light.border,
    headerBg: light.header,
    headerSubText: [226, 232, 240],
    headerText: [255, 255, 255],
    accent,
    tableHeaderBg: [30, 58, 138],
    tableHeaderText: [255, 255, 255],
    tableStripeBg: [248, 250, 252],
    purple: [126, 34, 206],
    emerald: [5, 150, 105],
    emeraldBg: [236, 253, 245],
    emeraldBorder: [110, 231, 183],
    rose: [190, 18, 60],
    roseBg: [255, 241, 242],
    roseBorder: [253, 164, 175],
    amber: [180, 83, 9],
    amberBg: [255, 251, 235],
    amberBorder: [252, 211, 77],
    youBubbleBg: [236, 253, 245],
    youBubbleBorder: [52, 211, 153],
    otherBubbleBg: light.otherBg,
    otherBubbleBorder: light.otherBorder,
    textPrimary: [15, 23, 42],
    textSecondary: [51, 65, 85],
    textMuted: [100, 116, 139],
    badgeBg: light.badgeBg,
    badgeText: accent,
  };
}

const NON_LATIN_PDF_NOTICE =
  '[Non-Latin script content -- export as Word (.docx) for native script rendering]';

function sanitizePdfRunText(input?: string): string {
  if (!input) return '';
  return input
    .replace(/\u00A0/g, ' ')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, '--')
    .replace(/\u2013/g, '-')
    .replace(/[\u2022\u25E6\u25AA\u25AB\u25B8\u2023]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u2192\u21D2\u279C\u2794\u27A4]/g, '->')
    .replace(/[\u2190\u21D0]/g, '<-')
    .replace(/\u2194/g, '<->')
    .replace(/\u2265/g, '>=')
    .replace(/\u2264/g, '<=')
    .replace(/\u2260/g, '!=')
    .replace(/\u2248/g, '~')
    .replace(/\u221E/g, 'infinity')
    .replace(/[\u2713\u2714\u2705]/g, '[OK]')
    .replace(/[\u2715\u2716\u274C]/g, '[X]')
    .replace(/\u26A0/g, '[!]')
    .replace(/[\u2605\u2606]/g, '*')
    .replace(/\u20AC/g, 'EUR ')
    .replace(/\u20B9/g, 'INR ')
    // Replace remaining unsupported emojis/non-Latin1 symbols with space so adjacent words stay cleanly separated
    .replace(/[^\x09\x0A\x0D\x20-\xFF]+/g, ' ')
    .replace(/[ \t]+/g, ' ');
}

function sanitizePdfText(input?: string): string {
  return sanitizePdfRunText(input).trim();
}

function hasStrippedNonLatinText(input?: string): boolean {
  if (!input || !input.trim()) return false;
  return /[^\x09\x0A\x0D\x20-\xFF]/.test(input) && sanitizePdfText(input).length === 0;
}

interface PdfStyledToken {
  text: string;
  bold?: boolean;
  italic?: boolean;
  code?: boolean;
}

/**
 * Wraps inline markdown runs token-by-token so bold, italic, and code spans flow seamlessly
 * across lines inside jsPDF at exact pixel width.
 */
function wrapInlineRunsForPdf(
  doc: jsPDF,
  rawText: string,
  maxWidth: number,
  fontSize: number
): PdfStyledToken[][] {
  const runs = parseInlineMarkdownRuns(rawText);
  const tokens: PdfStyledToken[] = [];

  runs.forEach((run) => {
    const clean = sanitizePdfRunText(run.text);
    if (!clean) return;
    const pieces = clean.split(/(\s+)/);
    pieces.forEach((piece) => {
      if (!piece) return;
      tokens.push({
        text: piece,
        bold: run.bold,
        italic: run.italic,
        code: run.code,
      });
    });
  });

  if (tokens.length === 0 && hasStrippedNonLatinText(rawText)) {
    tokens.push({ text: NON_LATIN_PDF_NOTICE, italic: true });
  }

  if (tokens.length === 0) return [];

  const setTokenFont = (tok: PdfStyledToken) => {
    const family = tok.code ? 'courier' : 'helvetica';
    const style = tok.bold && tok.italic ? 'bolditalic' : tok.bold ? 'bold' : tok.italic ? 'italic' : 'normal';
    doc.setFont(family, style);
    doc.setFontSize(tok.code ? Math.max(8, fontSize - 0.8) : fontSize);
  };

  const lines: PdfStyledToken[][] = [];
  let currentLine: PdfStyledToken[] = [];
  let currentWidth = 0;

  tokens.forEach((tok) => {
    const isWhitespace = /^\s+$/.test(tok.text);
    if (isWhitespace && currentLine.length === 0) {
      return;
    }

    setTokenFont(tok);
    const tokWidth = doc.getTextWidth(tok.text);

    if (currentWidth + tokWidth > maxWidth && currentLine.length > 0 && !isWhitespace) {
      // Trim trailing whitespace token on wrapped line
      if (currentLine.length > 0 && /^\s+$/.test(currentLine[currentLine.length - 1].text)) {
        currentLine.pop();
      }
      lines.push(currentLine);
      currentLine = [];
      currentWidth = 0;
    }

    // Handle extra-long unbroken tokens (e.g. URLs) gracefully
    if (tokWidth > maxWidth && !isWhitespace) {
      const splitChunks = doc.splitTextToSize(tok.text, maxWidth) as string[];
      splitChunks.forEach((chunk, idx) => {
        if (idx > 0) {
          lines.push(currentLine);
          currentLine = [];
          currentWidth = 0;
        }
        setTokenFont(tok);
        const w = doc.getTextWidth(chunk);
        currentLine.push({ ...tok, text: chunk });
        currentWidth += w;
      });
      return;
    }

    currentLine.push(tok);
    currentWidth += tokWidth;
  });

  if (currentLine.length > 0) {
    if (/^\s+$/.test(currentLine[currentLine.length - 1].text)) {
      currentLine.pop();
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }
  }

  return lines;
}

/**
 * Generates a styled, layout- and color-preserving PDF file with ChatGPT / Gemini
 * typography, inline bold/italic/code spans, structured tables, blockquotes, lists, and bubbles.
 */
export async function exportToPdf(data: PdfExportOptions): Promise<boolean> {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    });

    const basePdfFont = getFontOption(data.fontFamily).pdfFont;
    const origSetFont = doc.setFont.bind(doc);
    doc.setFont = ((fontName: string, fontStyle?: string, fontWeight?: string | number) => {
      const mapped = fontName === 'helvetica' ? basePdfFont : fontName;
      return origSetFont(mapped, fontStyle as any, fontWeight as any);
    }) as typeof doc.setFont;

    const palette = getPdfPalette(data.themeId, data.isDark, data.pdfThemeMode || 'print-light');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    const scope: PdfExportScope = data.scope || 'conversation';
    const previewFormat = data.previewFormat || 'document';
    const dateStr =
      data.date ||
      new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

    const paintPageBackground = () => {
      doc.setFillColor(...palette.pageBg);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');
    };

    paintPageBackground();
    let y = margin;

    const ensureSpace = (needed: number) => {
      if (y + needed > pageHeight - 48) {
        doc.addPage();
        paintPageBackground();
        y = margin;
      }
    };

    const drawInlineWrappedLines = (
      wrappedLines: PdfStyledToken[][],
      startX: number,
      lineHeight: number,
      colors: { text: Rgb; bold: Rgb; codeText: Rgb; codeBg: Rgb },
      fontSize: number,
      paginate: boolean = true
    ) => {
      wrappedLines.forEach((lineTokens) => {
        if (paginate) ensureSpace(lineHeight + 2);
        let curX = startX;
        lineTokens.forEach((tok) => {
          const family = tok.code ? 'courier' : 'helvetica';
          const style =
            tok.bold && tok.italic ? 'bolditalic' : tok.bold ? 'bold' : tok.italic ? 'italic' : 'normal';
          const sz = tok.code ? Math.max(8, fontSize - 0.8) : fontSize;
          doc.setFont(family, style);
          doc.setFontSize(sz);
          const w = doc.getTextWidth(tok.text);

          if (tok.code && tok.text.trim()) {
            doc.setFillColor(...colors.codeBg);
            doc.roundedRect(curX - 1.5, y - sz + 1, w + 3, sz + 3, 2, 2, 'F');
            doc.setTextColor(...colors.codeText);
          } else if (tok.bold) {
            doc.setTextColor(...colors.bold);
          } else {
            doc.setTextColor(...colors.text);
          }

          doc.text(tok.text, curX, y);
          curX += w;
        });
        y += lineHeight;
      });
    };

    const drawSectionHeading = (title: string, color: Rgb = palette.accent, subtitle?: string) => {
      ensureSpace(28);
      doc.setFillColor(...color);
      doc.roundedRect(margin, y + 1, 4, 13, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.setTextColor(...color);
      doc.text(sanitizePdfText(title.toUpperCase()), margin + 10, y + 11);
      if (subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...palette.textMuted);
        doc.text(sanitizePdfText(subtitle), pageWidth - margin, y + 11, { align: 'right' });
      }
      y += 22;
    };

    const drawRichMarkdownToPdf = (rawText: string) => {
      const blocks = parseMarkdownBlocks(rawText);
      const inlineColors = {
        text: palette.textSecondary,
        bold: palette.textPrimary,
        codeText: palette.accent,
        codeBg: palette.innerBg,
      };

      blocks.forEach((block) => {
        if (block.type === 'h1') {
          const strippedH1 = stripInlineMarkdownSyntax(block.text);
          const cleanH1 = sanitizePdfText(strippedH1) || (hasStrippedNonLatinText(strippedH1) ? NON_LATIN_PDF_NOTICE : '');
          if (!cleanH1) return;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14.5);
          const wrapped = doc.splitTextToSize(cleanH1, contentWidth) as string[];
          ensureSpace(wrapped.length * 18 + 18);
          y += 4;
          doc.setTextColor(...palette.textPrimary);
          wrapped.forEach((line) => {
            doc.text(line, margin, y + 11);
            y += 18;
          });
          doc.setDrawColor(...palette.accent);
          doc.setLineWidth(1.2);
          doc.line(margin, y + 1, pageWidth - margin, y + 1);
          y += 12;
          return;
        }

        if (block.type === 'h2') {
          const strippedH2 = stripInlineMarkdownSyntax(block.text);
          const cleanH2 = sanitizePdfText(strippedH2) || (hasStrippedNonLatinText(strippedH2) ? NON_LATIN_PDF_NOTICE : '');
          if (!cleanH2) return;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(12);
          const wrapped = doc.splitTextToSize(cleanH2, contentWidth - 14) as string[];
          ensureSpace(wrapped.length * 16 + 16);
          y += 6;
          doc.setFillColor(...palette.accent);
          doc.roundedRect(margin, y + 1, 3.5, 13, 1.5, 1.5, 'F');
          doc.setTextColor(...palette.accent);
          wrapped.forEach((line, idx) => {
            doc.text(line, margin + 10, y + 11);
            y += idx === wrapped.length - 1 ? 15 : 16;
          });
          doc.setDrawColor(...palette.border);
          doc.setLineWidth(0.6);
          doc.line(margin, y + 2, pageWidth - margin, y + 2);
          y += 12;
          return;
        }

        if (block.type === 'h3' || block.type === 'h4') {
          const sz = block.type === 'h3' ? 10.8 : 10;
          const strippedH = stripInlineMarkdownSyntax(block.text);
          const cleanH = sanitizePdfText(strippedH) || (hasStrippedNonLatinText(strippedH) ? NON_LATIN_PDF_NOTICE : '');
          if (!cleanH) return;
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(sz);
          const wrapped = doc.splitTextToSize(cleanH, contentWidth) as string[];
          ensureSpace(wrapped.length * 14 + 10);
          y += 4;
          doc.setTextColor(...palette.textPrimary);
          wrapped.forEach((line) => {
            doc.text(line, margin, y + 10);
            y += 14;
          });
          y += 4;
          return;
        }

        if (block.type === 'hr') {
          ensureSpace(16);
          y += 4;
          doc.setDrawColor(...palette.border);
          doc.setLineWidth(0.7);
          doc.line(margin, y, pageWidth - margin, y);
          y += 12;
          return;
        }

        if (block.type === 'blockquote') {
          const innerWidth = contentWidth - 28;
          const fontSize = 10;
          const lineH = 14.5;
          const allWrapped: PdfStyledToken[][][] = block.lines.map((l) =>
            wrapInlineRunsForPdf(doc, l, innerWidth, fontSize)
          );
          const flatLines = allWrapped.flat();
          if (flatLines.length === 0) return;
          const boxHeight = Math.max(28, flatLines.length * lineH + 16);
          ensureSpace(boxHeight + 8);

          const boxTop = y;
          doc.setFillColor(...palette.innerBg);
          doc.setDrawColor(...palette.border);
          doc.setLineWidth(0.7);
          doc.roundedRect(margin, boxTop, contentWidth, boxHeight, 6, 6, 'FD');

          doc.setFillColor(...palette.accent);
          doc.roundedRect(margin, boxTop, 4, boxHeight, 2, 2, 'F');

          y = boxTop + 17;
          drawInlineWrappedLines(
            flatLines,
            margin + 16,
            lineH,
            {
              text: palette.textPrimary,
              bold: palette.textPrimary,
              codeText: palette.accent,
              codeBg: palette.cardBg,
            },
            fontSize,
            false
          );
          y = boxTop + boxHeight + 10;
          return;
        }

        if (block.type === 'code') {
          const lineH = 13;
          const fontSize = 8.8;
          const wrappedCode: string[] = [];
          doc.setFont('courier', 'normal');
          doc.setFontSize(fontSize);
          block.lines.forEach((l) => {
            const chunks = doc.splitTextToSize(sanitizePdfText(l) || ' ', contentWidth - 24) as string[];
            wrappedCode.push(...chunks);
          });
          const boxHeight = wrappedCode.length * lineH + 22;
          ensureSpace(boxHeight + 8);

          const boxTop = y;
          doc.setFillColor(...palette.innerBg);
          doc.setDrawColor(...palette.border);
          doc.setLineWidth(0.7);
          doc.roundedRect(margin, boxTop, contentWidth, boxHeight, 6, 6, 'FD');

          let codeY = boxTop + 16;
          doc.setFont('courier', 'normal');
          doc.setFontSize(fontSize);
          doc.setTextColor(...palette.textPrimary);
          wrappedCode.forEach((cl) => {
            doc.text(cl, margin + 12, codeY);
            codeY += lineH;
          });
          y = boxTop + boxHeight + 10;
          return;
        }

        if (block.type === 'table') {
          const colCount = Math.max(1, block.headers.length);
          const colWidth = contentWidth / colCount;
          const cellPadX = 8;
          const cellPadY = 7;
          const cellLineH = 13;
          const cellFontSize = 9;
          const headerFontSize = 9;

          const drawTableHeader = () => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(headerFontSize);
            const wrappedHeaders = block.headers.map(
              (h) => doc.splitTextToSize(sanitizePdfText(stripInlineMarkdownSyntax(h)), colWidth - cellPadX * 2) as string[]
            );
            const maxLines = Math.max(1, ...wrappedHeaders.map((w) => w.length));
            const rowH = maxLines * cellLineH + cellPadY * 2;
            ensureSpace(rowH + 14);

            const rowTop = y;
            block.headers.forEach((_, cIdx) => {
              const cx = margin + cIdx * colWidth;
              doc.setFillColor(...palette.tableHeaderBg);
              doc.setDrawColor(...palette.tableHeaderBg);
              doc.setLineWidth(0.5);
              doc.rect(cx, rowTop, colWidth, rowH, 'FD');

              doc.setFont('helvetica', 'bold');
              doc.setFontSize(headerFontSize);
              doc.setTextColor(...palette.tableHeaderText);
              wrappedHeaders[cIdx].forEach((hl, lineIdx) => {
                doc.text(hl, cx + cellPadX, rowTop + cellPadY + 9 + lineIdx * cellLineH);
              });
            });
            y += rowH;
          };

          drawTableHeader();

          block.rows.forEach((row, rIdx) => {
            const wrappedCells = block.headers.map((_, cIdx) =>
              wrapInlineRunsForPdf(doc, row[cIdx] ?? '-', colWidth - cellPadX * 2, cellFontSize)
            );
            const maxLines = Math.max(1, ...wrappedCells.map((w) => w.length));
            const rowH = maxLines * cellLineH + cellPadY * 2;

            if (y + rowH > pageHeight - 48) {
              doc.addPage();
              paintPageBackground();
              y = margin;
              drawTableHeader();
            }

            const rowTop = y;
            const fillColor = rIdx % 2 === 0 ? palette.cardBg : palette.tableStripeBg;

            block.headers.forEach((_, cIdx) => {
              const cx = margin + cIdx * colWidth;
              doc.setFillColor(...fillColor);
              doc.setDrawColor(...palette.border);
              doc.setLineWidth(0.5);
              doc.rect(cx, rowTop, colWidth, rowH, 'FD');

              const cellLines = wrappedCells[cIdx];
              const savedY = y;
              y = rowTop + cellPadY + 9;
              drawInlineWrappedLines(
                cellLines,
                cx + cellPadX,
                cellLineH,
                inlineColors,
                cellFontSize,
                false
              );
              y = savedY;
            });

            y = rowTop + rowH;
          });

          y += 12;
          return;
        }

        if (block.type === 'bullet') {
          const indentX = margin + (block.level > 0 ? 26 : 14);
          const fontSize = 10;
          const lineH = 14.5;
          const wrapped = wrapInlineRunsForPdf(doc, block.text, pageWidth - margin - indentX - 10, fontSize);
          if (wrapped.length === 0) return;
          ensureSpace(lineH + 4);
          // Draw crisp vector bullet aligned to first line
          doc.setFillColor(...palette.accent);
          doc.circle(indentX - 7, y - 3, block.level > 0 ? 1.5 : 2, 'F');
          drawInlineWrappedLines(wrapped, indentX, lineH, inlineColors, fontSize, true);
          y += 3;
          return;
        }

        if (block.type === 'ordered') {
          const numStr = `${block.num}.`;
          const indentX = margin + 20;
          const fontSize = 10;
          const lineH = 14.5;
          const wrapped = wrapInlineRunsForPdf(doc, block.text, pageWidth - margin - indentX - 6, fontSize);
          if (wrapped.length === 0) return;
          ensureSpace(lineH + 4);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(fontSize);
          doc.setTextColor(...palette.accent);
          doc.text(numStr, margin + 2, y);
          drawInlineWrappedLines(wrapped, indentX, lineH, inlineColors, fontSize, true);
          y += 3;
          return;
        }

        // Standard paragraph
        const fontSize = 10;
        const lineH = 15;
        const wrapped = wrapInlineRunsForPdf(doc, block.text, contentWidth, fontSize);
        if (wrapped.length > 0) {
          ensureSpace(lineH + 4);
          drawInlineWrappedLines(wrapped, margin, lineH, inlineColors, fontSize, true);
          y += 5;
        }
      });
    };

    // Draw a styled card container with inline bold/italic/code formatting
    const drawCard = (
      title: string,
      lines: string[],
      options?: {
        titleColor?: Rgb;
        bgColor?: Rgb;
        borderColor?: Rgb;
        textColor?: Rgb;
        fontStyle?: 'normal' | 'bold' | 'italic';
        fontSize?: number;
        lineHeight?: number;
        badge?: string;
        badgeBg?: Rgb;
        badgeText?: Rgb;
        accentBarColor?: Rgb;
      }
    ) => {
      const fontSize = options?.fontSize ?? 10;
      const lineHeight = options?.lineHeight ?? 14.5;
      const textColor = options?.textColor ?? palette.textSecondary;
      const bgColor = options?.bgColor ?? palette.cardBg;
      const borderColor = options?.borderColor ?? palette.border;
      const titleColor = options?.titleColor ?? palette.accent;
      const defaultItalic = options?.fontStyle === 'italic';

      interface CardLine {
        tokens: PdfStyledToken[];
        isEmpty?: boolean;
      }

      const cardLines: CardLine[] = [];
      lines.forEach((raw) => {
        if (!raw || !raw.trim()) {
          cardLines.push({ tokens: [], isEmpty: true });
          return;
        }
        const wrapped = wrapInlineRunsForPdf(doc, raw, contentWidth - 28, fontSize);
        if (wrapped.length === 0) {
          cardLines.push({ tokens: [], isEmpty: true });
        } else {
          wrapped.forEach((wLine) => {
            cardLines.push({
              tokens: defaultItalic ? wLine.map((t) => ({ ...t, italic: true })) : wLine,
            });
          });
        }
      });

      const headerHeight = title ? 22 : 8;
      const paddingBottom = 14;
      const maxChunkLines = 34;

      for (let start = 0; start < Math.max(cardLines.length, 1); start += maxChunkLines) {
        const chunk = cardLines.slice(start, start + maxChunkLines);
        const isFirstChunk = start === 0;
        const blockHeight = (isFirstChunk ? headerHeight : 14) + chunk.length * lineHeight + paddingBottom;

        ensureSpace(blockHeight + 8);

        doc.setFillColor(...bgColor);
        doc.setDrawColor(...borderColor);
        doc.setLineWidth(0.9);
        doc.roundedRect(margin, y, contentWidth, blockHeight, 8, 8, 'FD');

        if (options?.accentBarColor) {
          doc.setFillColor(...options.accentBarColor);
          doc.roundedRect(margin, y, 4, blockHeight, 2, 2, 'F');
        }

        let innerY = y + 18;
        if (isFirstChunk && title) {
          let badgeWidth = 0;
          if (options?.badge) {
            const badgeText = sanitizePdfText(options.badge);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.8);
            badgeWidth = doc.getTextWidth(badgeText) + 12;
            doc.setFillColor(...(options.badgeBg || palette.badgeBg));
            doc.roundedRect(margin + contentWidth - badgeWidth - 12, innerY - 9, badgeWidth, 13, 4, 4, 'F');
            doc.setTextColor(...(options.badgeText || palette.badgeText));
            doc.text(badgeText, margin + contentWidth - badgeWidth - 6, innerY);
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(9.5);
          doc.setTextColor(...titleColor);
          const maxTitleW = contentWidth - 28 - (badgeWidth > 0 ? badgeWidth + 10 : 0);
          let safeTitle = sanitizePdfText(title.toUpperCase());
          while (safeTitle.length > 6 && doc.getTextWidth(safeTitle) > maxTitleW) {
            safeTitle = `${safeTitle.slice(0, -4)}...`;
          }
          doc.text(safeTitle, margin + 14, innerY);

          innerY += 16;
        } else {
          innerY = y + 18;
        }

        const savedY = y;
        y = innerY;
        chunk.forEach((cLine) => {
          if (cLine.isEmpty || cLine.tokens.length === 0) {
            y += lineHeight * 0.65;
            return;
          }
          drawInlineWrappedLines(
            [cLine.tokens],
            margin + 14,
            lineHeight,
            {
              text: textColor,
              bold: palette.textPrimary,
              codeText: palette.accent,
              codeBg: palette.innerBg,
            },
            fontSize,
            false
          );
        });

        y = savedY + blockHeight + 10;
      }
    };

    // Draw color-coded chat turn bubbles preserving speaker alignment & theme colors
    const drawConversationBubble = (turn: ConversationTurn, badgeLabel?: string) => {
      const bubbleWidth = contentWidth - 46;
      const bubbleX = turn.isSelf ? margin + 46 : margin;
      const bubbleBg = turn.isSelf ? palette.youBubbleBg : palette.otherBubbleBg;
      const bubbleBorder = turn.isSelf ? palette.youBubbleBorder : palette.otherBubbleBorder;
      const speakerColor = turn.isSelf ? palette.emerald : palette.accent;

      const cleanMsg =
        sanitizePdfText(turn.message) ||
        (hasStrippedNonLatinText(turn.message) ? NON_LATIN_PDF_NOTICE : '(No message text)');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.8);
      const wrappedMsg = doc.splitTextToSize(cleanMsg, bubbleWidth - 24) as string[];
      const lineH = 13.5;
      const maxBubbleLines = 28;

      for (let start = 0; start < wrappedMsg.length; start += maxBubbleLines) {
        const chunk = wrappedMsg.slice(start, start + maxBubbleLines);
        const isFirst = start === 0;
        const headerH = isFirst ? 20 : 8;
        const height = headerH + chunk.length * lineH + 12;

        ensureSpace(height + 7);

        doc.setFillColor(...bubbleBg);
        doc.setDrawColor(...bubbleBorder);
        doc.setLineWidth(0.9);
        doc.roundedRect(bubbleX, y, bubbleWidth, height, 8, 8, 'FD');

        // Left/right accent stripe on bubble
        doc.setFillColor(...bubbleBorder);
        const stripeX = turn.isSelf ? bubbleX + bubbleWidth - 3.5 : bubbleX;
        doc.roundedRect(stripeX, y + 3, 3.5, height - 6, 1.5, 1.5, 'F');

        let textY = y + 15;
        if (isFirst) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(...speakerColor);
          const speakerLabel = sanitizePdfText(turn.speaker.toUpperCase());
          doc.text(speakerLabel, bubbleX + 12, textY);

          const rightMeta = sanitizePdfText([badgeLabel, turn.timestamp].filter(Boolean).join('  |  '));
          if (rightMeta) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(...palette.textMuted);
            const mw = doc.getTextWidth(rightMeta);
            doc.text(rightMeta, bubbleX + bubbleWidth - 12 - mw, textY);
          }
          textY += 15;
        } else {
          textY = y + 16;
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.8);
        doc.setTextColor(...palette.textPrimary);
        chunk.forEach((line) => {
          doc.text(line, bubbleX + 12, textY);
          textY += lineH;
        });

        y += height + 7;
      }
    };

    // Draw color-coded Emotional Signals pill row
    const drawEmotionalSignals = (analysis: SituationAnalysis) => {
      if (!analysis.emotionalSignals || analysis.emotionalSignals.length === 0) return;
      ensureSpace(46);

      const chipHeights = 18;
      let cx = margin + 12;
      const rows: {
        label: string;
        intensity: string;
        x: number;
        rowOffset: number;
        w: number;
        bg: Rgb;
        border: Rgb;
        text: Rgb;
      }[] = [];
      let rowOffset = 0;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);

      analysis.emotionalSignals.forEach((sig) => {
        const text = sanitizePdfText(`${sig.label} (${sig.intensity})`);
        const w = doc.getTextWidth(text) + 16;
        if (cx + w > pageWidth - margin - 12) {
          cx = margin + 12;
          rowOffset += 22;
        }
        const isHigh = sig.intensity === 'High';
        const isMod = sig.intensity === 'Moderate';
        rows.push({
          label: text,
          intensity: sig.intensity,
          x: cx,
          rowOffset,
          w,
          bg: isHigh ? palette.roseBg : isMod ? palette.amberBg : palette.badgeBg,
          border: isHigh ? palette.roseBorder : isMod ? palette.amberBorder : palette.accent,
          text: isHigh ? palette.rose : isMod ? palette.amber : palette.accent,
        });
        cx += w + 6;
      });

      const boxHeight = 36 + rowOffset + chipHeights;
      ensureSpace(boxHeight + 8);
      const cy = y + 26;

      doc.setFillColor(...palette.cardBg);
      doc.setDrawColor(...palette.border);
      doc.setLineWidth(0.8);
      doc.roundedRect(margin, y, contentWidth, boxHeight, 8, 8, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...palette.accent);
      doc.text('DETECTED EMOTIONAL SIGNALS', margin + 12, y + 16);

      rows.forEach((chip) => {
        const ry = cy + chip.rowOffset;
        doc.setFillColor(...chip.bg);
        doc.setDrawColor(...chip.border);
        doc.setLineWidth(0.7);
        doc.roundedRect(chip.x, ry, chip.w, chipHeights, 4, 4, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(...chip.text);
        doc.text(chip.label, chip.x + 8, ry + 11.5);
      });

      y += boxHeight + 10;
    };

    // Header Banner
    const headerTitle = sanitizePdfText(data.title || 'Situation AI Intelligence & Communication Brief');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const wrappedHeaderTitle = doc.splitTextToSize(headerTitle, contentWidth - 32);
    const bannerHeight = 58 + wrappedHeaderTitle.length * 16;

    doc.setFillColor(...palette.headerBg);
    doc.roundedRect(margin, y, contentWidth, bannerHeight, 10, 10, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...palette.headerText);
    const scopeLabel =
      scope === 'replies-summary'
        ? 'GENERATED REPLIES & CONVERSATION SUMMARY'
        : scope === 'conversation'
        ? 'CONVERSATION TRANSCRIPT & COLOR BRIEF'
        : scope === 'selected-reply'
        ? 'GENERATED RESPONSE BRIEF'
        : scope === 'active-preview'
        ? `${previewFormat.toUpperCase()} FORMAT EXPORT`
        : 'EXECUTIVE INTELLIGENCE SUMMARY';
    doc.text(`SITUATION AI  |  ${scopeLabel}`, margin + 16, y + 20);

    doc.setFontSize(14);
    let hy = y + 40;
    wrappedHeaderTitle.forEach((line: string) => {
      doc.text(line, margin + 16, hy);
      hy += 16;
    });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...palette.headerSubText);
    doc.text(
      sanitizePdfText(
        `Platform: ${data.platform}  |  Template: ${data.template}  |  Model: ${(data.aiModel || 'gemini').toUpperCase()}  |  ${dateStr}`
      ),
      margin + 16,
      y + bannerHeight - 12
    );

    y += bannerHeight + 16;

    const chosenReply =
      data.replies && data.replies.length > 0
        ? data.replies[data.selectedReplyIndex ?? 0] || data.replies[0]
        : null;

    const drawAnalysisSection = (analysis: SituationAnalysis) => {
      const urgencyColor =
        analysis.urgency === 'High'
          ? palette.rose
          : analysis.urgency === 'Medium'
          ? palette.amber
          : palette.emerald;
      const urgencyBg =
        analysis.urgency === 'High'
          ? palette.roseBg
          : analysis.urgency === 'Medium'
          ? palette.amberBg
          : palette.emeraldBg;

      drawCard(
        'Situation Diagnostic & Psychological Dynamics',
        [
          `**Situation:** ${analysis.situation}`,
          `**Category:** ${analysis.category}  |  **Urgency:** ${analysis.urgency}  |  **Confidence:** ${analysis.confidenceScore}%`,
          `**Participant Dynamics:** ${analysis.participantDynamics}`,
          `**Underlying Intent:** ${analysis.latestMessageIntent}`,
        ],
        {
          titleColor: palette.accent,
          badge: `${analysis.urgency} Urgency | ${analysis.confidenceScore}%`,
          badgeBg: urgencyBg,
          badgeText: urgencyColor,
          textColor: palette.textSecondary,
          accentBarColor: palette.accent,
        }
      );

      drawEmotionalSignals(analysis);

      if (analysis.recommendedStrategy) {
        drawCard('Recommended Strategy', [analysis.recommendedStrategy], {
          titleColor: palette.emerald,
          bgColor: palette.emeraldBg,
          borderColor: palette.emeraldBorder,
          textColor: palette.textPrimary,
          accentBarColor: palette.emerald,
        });
      }

      if (analysis.potentialPitfalls) {
        drawCard('Potential Pitfalls to Avoid', [analysis.potentialPitfalls], {
          titleColor: palette.rose,
          bgColor: palette.roseBg,
          borderColor: palette.roseBorder,
          textColor: palette.textPrimary,
          accentBarColor: palette.rose,
        });
      }
    };

    const drawReplyCards = (replies: ReplyOption[]) => {
      const tierColors: { title: Rgb; border: Rgb }[] = [
        { title: palette.accent, border: palette.accent },
        { title: palette.emerald, border: palette.emerald },
        { title: palette.purple, border: palette.purple },
      ];

      replies.forEach((rep, idx) => {
        const tier = tierColors[idx % tierColors.length];
        const lines = [...rep.content.split('\n')];
        if (rep.explanation) {
          lines.push('', `**Rationale:** ${rep.explanation}`);
        }
        if (rep.autoRefined && rep.refinementNotes) {
          lines.push(`**Situation Audit:** ${rep.refinementNotes}`);
        }
        const badgeText = `${rep.autoRefined ? 'Auto-Refined | ' : ''}${rep.tone} | ${rep.matchScore}% Fit`;
        drawCard(`Option ${idx + 1}: ${rep.styleLabel}`, lines, {
          titleColor: tier.title,
          borderColor: tier.border,
          accentBarColor: tier.title,
          badge: badgeText,
          badgeBg: rep.autoRefined ? palette.emeraldBg : palette.badgeBg,
          badgeText: rep.autoRefined ? palette.emerald : tier.title,
          fontSize: 10,
          lineHeight: 14.5,
        });
      });
    };

    const hasPrimaryConversationData = Boolean(
      data.chatHistory?.trim() ||
        data.latestMessage?.trim() ||
        data.analysis ||
        (data.replies && data.replies.length > 0)
    );

    if (scope === 'active-preview' && previewFormat !== 'document') {
      if (previewFormat === 'linkedin') {
        const postText = formatForLinkedIn({
          ...data,
          selectedReplyIndex: data.selectedReplyIndex ?? 0,
        });
        drawCard('LinkedIn Post / Networking Layout', postText.split('\n'), {
          titleColor: [10, 102, 194],
          borderColor: [10, 102, 194],
          accentBarColor: [10, 102, 194],
          badge: `${postText.length} / 3,000 chars`,
          fontSize: 10.5,
          lineHeight: 15,
        });
      } else if (previewFormat === 'email') {
        const emailData = formatForEmail({
          ...data,
          selectedReplyIndex: data.selectedReplyIndex ?? 0,
        });
        drawCard(
          'Email Headers',
          [`**To:** ${data.emailRecipient?.trim() || 'Colleague'}`, `**Subject:** ${emailData.subject}`],
          {
            titleColor: palette.emerald,
            borderColor: palette.emeraldBorder,
            bgColor: palette.innerBg,
            badge: 'RFC-822 Format',
          }
        );
        drawCard('Email Message Body', emailData.body.split('\n'), {
          titleColor: palette.emerald,
          borderColor: palette.emeraldBorder,
          accentBarColor: palette.emerald,
          fontSize: 10.5,
          lineHeight: 15,
        });
      } else if (previewFormat === 'markdown') {
        const mdText = formatForSlackTeams({
          ...data,
          selectedReplyIndex: data.selectedReplyIndex ?? 0,
        });
        drawSectionHeading('Slack / Microsoft Teams / Notion Brief', palette.purple);
        drawRichMarkdownToPdf(mdText);
      }
    } else if (scope === 'selected-reply') {
      if (data.latestMessage) {
        drawConversationBubble(
          {
            speaker: 'Incoming Message',
            message: data.latestMessage,
            isSelf: false,
          },
          'Context'
        );
      }

      if (chosenReply) {
        drawCard(`Recommended Response -- ${chosenReply.styleLabel}`, chosenReply.content.split('\n'), {
          titleColor: palette.emerald,
          bgColor: palette.emeraldBg,
          borderColor: palette.emeraldBorder,
          accentBarColor: palette.emerald,
          badge: `${chosenReply.autoRefined ? 'Auto-Refined | ' : ''}${chosenReply.tone} | ${chosenReply.matchScore}% Fit`,
          badgeBg: palette.cardBg,
          badgeText: palette.emerald,
          fontSize: 11,
          lineHeight: 16,
        });

        if (chosenReply.explanation) {
          drawCard('Strategic Rationale & Delivery Tip', [chosenReply.explanation], {
            bgColor: palette.innerBg,
            textColor: palette.textSecondary,
            fontStyle: 'italic',
          });
        }

        const extraMeta: string[] = [];
        if (data.includeHashtags !== false && chosenReply.hashtags?.length) {
          extraMeta.push(`**Hashtags:** ${chosenReply.hashtags.join(' ')}`);
        }
        if (data.includeLinks !== false && chosenReply.suggestedLinks?.length) {
          extraMeta.push(`**Reference Links:** ${chosenReply.suggestedLinks.join(', ')}`);
        }
        if (extraMeta.length > 0) {
          drawCard('Tags & Actionable Links', extraMeta, {
            titleColor: palette.accent,
          });
        }
      } else if (data.synthesizedText || data.customNotes) {
        drawRichMarkdownToPdf(data.synthesizedText || data.customNotes || '');
      }
    } else if (scope === 'active-preview' && data.synthesizedText?.trim()) {
      drawRichMarkdownToPdf(data.synthesizedText);
    } else if (!hasPrimaryConversationData && (data.synthesizedText?.trim() || data.customNotes?.trim())) {
      // Standalone editorial document (e.g. PromptStudio or pure synthesized document)
      drawRichMarkdownToPdf(data.synthesizedText?.trim() || data.customNotes?.trim() || '');
    } else if (scope === 'conversation') {
      const turns = parseConversationTurns(data.chatHistory);

      if (turns.length > 0 || data.latestMessage) {
        drawSectionHeading(
          'Current Conversation Transcript',
          palette.accent,
          `${turns.length + (data.latestMessage ? 1 : 0)} message${turns.length === 0 ? '' : 's'}`
        );
        turns.forEach((t) => drawConversationBubble(t));

        if (data.latestMessage) {
          drawConversationBubble(
            {
              speaker: 'Latest Incoming Message',
              message: data.latestMessage,
              isSelf: false,
            },
            'Active Turn'
          );
        }

        if (chosenReply && data.replies && data.replies.length > 0) {
          drawConversationBubble(
            {
              speaker: `You (Suggested: ${chosenReply.styleLabel})`,
              message: chosenReply.content,
              isSelf: true,
            },
            `${chosenReply.matchScore}% Match`
          );
        }
      }

      if (data.analysis) {
        drawSectionHeading('Situation Analysis & Color Insights', palette.emerald);
        drawAnalysisSection(data.analysis);
      }

      if (data.replies && data.replies.length > 0) {
        drawSectionHeading('Generated Reply Options', palette.purple);
        drawReplyCards(data.replies);
      }

      if (data.synthesizedText?.trim()) {
        drawSectionHeading('AI Synthesized Situational Document', palette.accent);
        drawRichMarkdownToPdf(data.synthesizedText);
      } else if (data.customNotes?.trim()) {
        drawSectionHeading('Executive Notes & Operational Context', palette.accent);
        drawRichMarkdownToPdf(data.customNotes);
      }
    } else if (scope === 'replies-summary') {
      const turns = parseConversationTurns(data.chatHistory);
      const participants = Array.from(new Set(turns.map((t) => t.speaker))).slice(0, 6);
      const totalMessages = turns.length + (data.latestMessage?.trim() ? 1 : 0);

      const replyCount = data.replies?.length || 0;
      drawSectionHeading(
        'Conversation Summary & Context Overview',
        palette.accent,
        `${totalMessages} message${totalMessages === 1 ? '' : 's'} · ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`
      );

      const summaryLines: string[] = [
        `**Platform:** ${data.platform}  |  **Messages Analyzed:** ${totalMessages}  |  **Reply Options:** ${data.replies?.length || 0}`,
      ];
      if (participants.length > 0) {
        summaryLines.push(`**Participants:** ${participants.join(', ')}`);
      }
      if (data.analysis?.situation) {
        summaryLines.push(`**Headline Situation:** ${data.analysis.situation}`);
      }
      if (data.analysis?.underlyingContext) {
        summaryLines.push(`**Thread Background:** ${data.analysis.underlyingContext}`);
      }
      if (data.analysis?.conversationPurpose) {
        summaryLines.push(`**Communication Goal:** ${data.analysis.conversationPurpose}`);
      }
      if (!data.analysis && turns.length > 0) {
        const previewTurns = turns
          .slice(-3)
          .map((t) => `**${t.speaker}:** ${t.message.replace(/\s+/g, ' ').slice(0, 140)}`)
          .join('  |  ');
        summaryLines.push(`**Recent Thread Highlights:** ${previewTurns}`);
      }

      drawCard('Executive Conversation Summary', summaryLines, {
        titleColor: palette.accent,
        bgColor: palette.innerBg,
        borderColor: palette.border,
        accentBarColor: palette.accent,
        badge: data.analysis ? `${data.analysis.urgency} Urgency` : 'Summary',
      });

      if (data.latestMessage?.trim()) {
        drawCard('Latest Incoming Message', [`"${data.latestMessage.trim()}"`], {
          titleColor: palette.amber,
          bgColor: palette.amberBg,
          borderColor: palette.amberBorder,
          accentBarColor: palette.amber,
          fontStyle: 'italic',
          badge: 'Incoming Turn',
          badgeBg: palette.cardBg,
          badgeText: palette.amber,
        });
      }

      if (data.analysis) {
        drawAnalysisSection(data.analysis);
      }

      if (data.replies && data.replies.length > 0) {
        drawSectionHeading(
          'Generated Human-Like Replies',
          palette.emerald,
          `${data.replies.length} option${data.replies.length === 1 ? '' : 's'}`
        );
        drawReplyCards(data.replies);
      } else {
        drawCard(
          'Generated Replies',
          ['No generated replies were attached to this export yet. Generate replies in the Reply Engine tab and re-export to include them here.'],
          {
            titleColor: palette.textMuted,
            bgColor: palette.innerBg,
          }
        );
      }

      if (data.synthesizedText?.trim()) {
        drawSectionHeading('AI Synthesized Situational Brief', palette.accent);
        drawRichMarkdownToPdf(data.synthesizedText);
      } else if (
        data.customNotes?.trim() &&
        data.customNotes.trim() !==
          'Strategic communication notes prepared using Situation AI. Ready for review or immediate deployment.'
      ) {
        drawSectionHeading('Executive Notes', palette.accent);
        drawRichMarkdownToPdf(data.customNotes);
      }

      if (data.includeHashtags !== false || data.includeLinks !== false) {
        const footerMeta: string[] = [];
        if (data.includeHashtags !== false && chosenReply?.hashtags?.length) {
          footerMeta.push(`**Hashtags:** ${chosenReply.hashtags.join(' ')}`);
        }
        if (data.includeLinks !== false && chosenReply?.suggestedLinks?.length) {
          footerMeta.push(`**Reference Link:** ${chosenReply.suggestedLinks[0]}`);
        }
        if (footerMeta.length > 0) {
          drawCard('Tags & Actionable References', footerMeta, {
            bgColor: palette.innerBg,
            textColor: palette.accent,
            fontSize: 9,
          });
        }
      }
    } else {
      // Full Conversation Summary
      const turns = parseConversationTurns(data.chatHistory);
      if (turns.length > 0) {
        drawSectionHeading('Conversation Thread Context', palette.accent, `${turns.length} turns`);
        turns.forEach((t) => drawConversationBubble(t));
      }

      if (data.latestMessage) {
        drawCard('Active Incoming Message', [data.latestMessage], {
          titleColor: palette.amber,
          bgColor: palette.amberBg,
          borderColor: palette.amberBorder,
          accentBarColor: palette.amber,
          fontStyle: 'italic',
          badge: 'Action Required',
          badgeBg: palette.cardBg,
          badgeText: palette.amber,
        });
      }

      if (data.analysis) {
        drawAnalysisSection(data.analysis);
      }

      if (data.replies && data.replies.length > 0) {
        drawSectionHeading(
          'Generated Reply Options',
          palette.purple,
          `${data.replies.length} option${data.replies.length === 1 ? '' : 's'}`
        );
        drawReplyCards(data.replies);
      }

      if (data.synthesizedText?.trim()) {
        drawSectionHeading('AI Synthesized Situational Document', palette.accent);
        drawRichMarkdownToPdf(data.synthesizedText);
      } else if (data.customNotes?.trim()) {
        drawSectionHeading('Executive Notes & Operational Context', palette.accent);
        drawRichMarkdownToPdf(data.customNotes);
      }

      if (data.includeHashtags !== false || data.includeLinks !== false) {
        const footerMeta: string[] = [];
        if (data.includeHashtags !== false) {
          const tags = chosenReply?.hashtags?.length
            ? chosenReply.hashtags.join(' ')
            : '#CommunicationStrategy #Leadership #SituationAI #Brief';
          footerMeta.push(`**Hashtags:** ${tags}`);
        }
        if (data.includeLinks !== false) {
          const link = chosenReply?.suggestedLinks?.[0] || 'https://situationai.com/review/dilemma-brief';
          footerMeta.push(`**Reference Link:** ${link}`);
        }
        if (footerMeta.length > 0) {
          drawCard('Hashtags & References', footerMeta, {
            bgColor: palette.innerBg,
            textColor: palette.accent,
            fontSize: 9,
          });
        }
      }
    }

    // Styled Footer on all pages
    const totalPages = doc.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setDrawColor(...palette.border);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 32, pageWidth - margin, pageHeight - 32);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(...palette.textMuted);
      doc.text(
        'Situation AI -- Understand Every Conversation. Respond Like a Human.',
        margin,
        pageHeight - 18
      );
      doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin, pageHeight - 18, { align: 'right' });
    }

    const suffix =
      scope === 'replies-summary'
        ? '_Replies_Summary'
        : scope === 'conversation' && data.replies?.length
        ? '_Conversation'
        : scope === 'selected-reply'
        ? '_Response'
        : scope === 'active-preview' && previewFormat !== 'document'
        ? `_${previewFormat}`
        : '';
    const safeTitle = buildSafeFilenameBase(sanitizePdfText(data.title), 'Situation_AI_Report');
    const filename = `${safeTitle}${suffix}.pdf`;
    const pdfBlob = doc.output('blob');
    downloadBlob(pdfBlob, filename);
    return true;
  } catch (err) {
    console.error('PDF export error:', err);
    throw err;
  }
}

/**
 * Generates a clean text file
 */
export function exportToTxt(data: ExportData): boolean {
  try {
    let out = `========================================================\n`;
    out += `SITUATION AI — CONVERSATION REPORT\n`;
    out += `========================================================\n\n`;
    out += `Title: ${data.title}\n`;
    out += `Date: ${data.date || new Date().toLocaleString()}\n`;
    out += `Platform: ${data.platform}\n`;
    out += `Template: ${data.template}\n\n`;

    if (data.latestMessage) {
      out += `--- LATEST INCOMING MESSAGE ---\n`;
      out += `"${data.latestMessage}"\n\n`;
    }

    if (data.chatHistory) {
      out += `--- PREVIOUS CHAT HISTORY ---\n`;
      out += `${data.chatHistory}\n\n`;
    }

    if (data.analysis) {
      out += `--- SITUATION ANALYSIS ---\n`;
      out += `Situation: ${data.analysis.situation}\n`;
      out += `Category: ${data.analysis.category}\n`;
      out += `Urgency: ${data.analysis.urgency}\n`;
      out += `Participant Dynamics: ${data.analysis.participantDynamics}\n`;
      out += `Intent: ${data.analysis.latestMessageIntent}\n`;
      out += `Recommended Strategy: ${data.analysis.recommendedStrategy}\n`;
      out += `Potential Pitfalls: ${data.analysis.potentialPitfalls}\n\n`;
    }

    if (data.replies && data.replies.length > 0) {
      out += `--- GENERATED REPLIES ---\n`;
      data.replies.forEach((rep, idx) => {
        out += `\n[Option ${idx + 1}: ${rep.styleLabel} (${rep.tone})]\n`;
        out += `"${rep.content}"\n`;
        out += `Rationale: ${rep.explanation}\n`;
      });
      out += `\n`;
    }

    if (data.customNotes) {
      out += `--- NOTES ---\n${data.customNotes}\n\n`;
    }

    out += `========================================================\n`;
    out += `Generated by Situation AI — Understand Every Conversation. Respond Like a Human.\n`;

    const blob = new Blob([out], { type: 'text/plain;charset=utf-8' });
    const filename = `${buildSafeFilenameBase(data.title, 'Situation_AI_Report')}.txt`;
    downloadBlob(blob, filename);
    return true;
  } catch (err) {
    console.error('Txt export error:', err);
    throw err;
  }
}

export interface PlatformExportOptions extends ExportData {
  selectedReplyIndex?: number;
  emailRecipient?: string;
  includeHashtags?: boolean;
  includeLinks?: boolean;
  synthesizedText?: string;
}

/**
 * Formats conversation intelligence / document content into a ready-to-publish LinkedIn post or DM brief
 */
export function formatForLinkedIn(data: PlatformExportOptions): string {
  const chosenReply =
    data.replies && data.replies.length > 0
      ? data.replies[data.selectedReplyIndex ?? 0] || data.replies[0]
      : null;

  const lines: string[] = [];

  const headline = data.analysis?.situation || data.title || 'Communication Insight';
  lines.push(`${headline} 💡`);
  lines.push('');

  if (data.synthesizedText && data.synthesizedText.trim()) {
    lines.push(data.synthesizedText.trim());
  } else {
    if (data.latestMessage) {
      lines.push(`Context: "${data.latestMessage}"`);
      lines.push('');
    }

    if (data.analysis) {
      lines.push('Key Takeaways:');
      lines.push(`• Situation Dynamic: ${data.analysis.participantDynamics}`);
      lines.push(`• Core Strategy: ${data.analysis.recommendedStrategy}`);
      if (data.analysis.potentialPitfalls) {
        lines.push(`• What to Avoid: ${data.analysis.potentialPitfalls}`);
      }
      lines.push('');
    }

    if (chosenReply) {
      lines.push(`Recommended Response (${chosenReply.styleLabel}):`);
      lines.push(`"${chosenReply.content}"`);
      lines.push('');
    } else if (data.customNotes) {
      lines.push(data.customNotes);
      lines.push('');
    }

    lines.push('How would you navigate this conversation? Share your thoughts below. 👇');
  }

  if (data.includeLinks !== false) {
    const replyLinks = chosenReply?.suggestedLinks?.filter(Boolean) || [];
    const linkStr = replyLinks.length > 0 ? replyLinks[0] : 'https://situationai.com/review';
    lines.push('');
    lines.push(`🔗 Read more: ${linkStr}`);
  }

  if (data.includeHashtags !== false) {
    const replyTags = chosenReply?.hashtags?.filter(Boolean) || [];
    const tagsStr =
      replyTags.length > 0
        ? replyTags.join(' ')
        : '#Communication #Leadership #WorkplaceCulture #ProfessionalGrowth #SituationAI';
    lines.push('');
    lines.push(tagsStr);
  }

  return lines.join('\n');
}

export function exportToLinkedIn(data: PlatformExportOptions): boolean {
  const formatted = formatForLinkedIn(data);
  const blob = new Blob([formatted], { type: 'text/plain;charset=utf-8' });
  const filename = `${buildSafeFilenameBase(data.title, 'LinkedIn_Post')}_LinkedIn.txt`;
  downloadBlob(blob, filename);
  return true;
}

/**
 * Formats conversation into a structured Email body + Subject
 */
export function formatForEmail(data: PlatformExportOptions): { subject: string; body: string; fullText: string } {
  const chosenReply =
    data.replies && data.replies.length > 0
      ? data.replies[data.selectedReplyIndex ?? 0] || data.replies[0]
      : null;

  const subject = data.title?.trim() || data.analysis?.situation || 'Follow-Up & Next Steps';
  const recipient = data.emailRecipient?.trim() || 'Colleague';

  const bodyLines: string[] = [];

  if (data.synthesizedText && data.synthesizedText.trim()) {
    bodyLines.push(data.synthesizedText.trim());
  } else if (chosenReply) {
    bodyLines.push(`Hi ${recipient},`);
    bodyLines.push('');
    bodyLines.push(chosenReply.content);
    bodyLines.push('');
    if (data.analysis?.conversationPurpose) {
      bodyLines.push(`Next Steps: ${data.analysis.conversationPurpose}`);
      bodyLines.push('');
    }
    if (data.includeLinks !== false && chosenReply.suggestedLinks && chosenReply.suggestedLinks.length > 0) {
      bodyLines.push(`Reference: ${chosenReply.suggestedLinks[0]}`);
      bodyLines.push('');
    }
    bodyLines.push('Best regards,');
    bodyLines.push('[Your Name]');
  } else {
    bodyLines.push(`Hi ${recipient},`);
    bodyLines.push('');
    if (data.latestMessage) {
      bodyLines.push(`Regarding: "${data.latestMessage}"`);
      bodyLines.push('');
    }
    if (data.analysis) {
      bodyLines.push(`Summary: ${data.analysis.situation}`);
      bodyLines.push(`Recommended Approach: ${data.analysis.recommendedStrategy}`);
      bodyLines.push('');
    }
    if (data.customNotes) {
      bodyLines.push(data.customNotes);
      bodyLines.push('');
    }
    bodyLines.push('Best regards,');
    bodyLines.push('[Your Name]');
  }

  const body = bodyLines.join('\n');
  const fullText = `Subject: ${subject}\nTo: ${recipient}\n\n${body}`;
  return { subject, body, fullText };
}

/**
 * Exports a real RFC-822 .eml file that opens directly in Outlook, Apple Mail, or email clients
 */
export function exportToEmailEml(data: PlatformExportOptions): boolean {
  const { subject, body } = formatForEmail(data);
  const toHeader = data.emailRecipient?.includes('@') ? data.emailRecipient : '';
  const emlContent = [
    `MIME-Version: 1.0`,
    `Date: ${new Date().toUTCString()}`,
    `Subject: ${subject}`,
    ...(toHeader ? [`To: ${toHeader}`] : []),
    `Content-Type: text/plain; charset=UTF-8`,
    `X-Generated-By: Situation AI`,
    ``,
    body,
  ].join('\r\n');

  const blob = new Blob([emlContent], { type: 'message/rfc822;charset=utf-8' });
  const filename = `${buildSafeFilenameBase(data.title, 'Situation_AI_Email')}.eml`;
  downloadBlob(blob, filename);
  return true;
}

/**
 * Formats conversation into Slack / Microsoft Teams compatible Markdown
 */
export function formatForSlackTeams(data: PlatformExportOptions): string {
  const chosenReply =
    data.replies && data.replies.length > 0
      ? data.replies[data.selectedReplyIndex ?? 0] || data.replies[0]
      : null;

  const lines: string[] = [];
  lines.push(`# ${data.title || 'Situation Brief'}`);
  lines.push(`**Platform:** ${data.platform} | **Template:** ${data.template}`);
  lines.push('');

  if (data.synthesizedText && data.synthesizedText.trim()) {
    lines.push(data.synthesizedText.trim());
  } else {
    if (data.latestMessage) {
      lines.push(`**Incoming Message:**`);
      lines.push(`> ${data.latestMessage}`);
      lines.push('');
    }
    if (data.analysis) {
      lines.push(`**Situation Analysis (${data.analysis.urgency} Urgency):**`);
      lines.push(`- **Situation:** ${data.analysis.situation}`);
      lines.push(`- **Intent:** ${data.analysis.latestMessageIntent}`);
      lines.push(`- **Recommended Strategy:** ${data.analysis.recommendedStrategy}`);
      lines.push('');
    }
    if (chosenReply) {
      lines.push(`**Ready-to-Send Reply (${chosenReply.styleLabel}):**`);
      lines.push('```');
      lines.push(chosenReply.content);
      lines.push('```');
      lines.push('');
    }
    if (data.customNotes) {
      lines.push(`**Notes:** ${data.customNotes}`);
    }
  }

  return lines.join('\n');
}

export function exportToMarkdown(data: PlatformExportOptions): boolean {
  const md = formatForSlackTeams(data);
  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const filename = `${buildSafeFilenameBase(data.title, 'Situation_AI_Brief')}.md`;
  downloadBlob(blob, filename);
  return true;
}

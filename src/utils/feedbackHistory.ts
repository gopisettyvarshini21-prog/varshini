import {
  FeedbackRating,
  ReplyFeedbackEntry,
  ReplyOption,
  ReplyPreferenceProfile,
  ResponseLength,
} from '../types';

export const FEEDBACK_STORAGE_KEY = 'situation_ai_reply_feedback';
const MAX_FEEDBACK_ENTRIES = 100;

export function loadFeedbackHistory(): ReplyFeedbackEntry[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveFeedbackHistory(entries: ReplyFeedbackEntry[]): void {
  try {
    localStorage.setItem(
      FEEDBACK_STORAGE_KEY,
      JSON.stringify(entries.slice(0, MAX_FEEDBACK_ENTRIES))
    );
  } catch {}
}

export interface RecordFeedbackParams {
  entries: ReplyFeedbackEntry[];
  reply: ReplyOption;
  rating: FeedbackRating | null;
  reason?: string;
  platform: string;
  responseLength: ResponseLength | string;
  latestMessage?: string;
  situationCategory?: string;
  aiModel?: string;
}

/**
 * Logs or updates a user's thumbs-up / thumbs-down preference for a generated reply.
 * Clicking the same rating clears it unless an explicit reason is being attached.
 */
export function recordReplyFeedback(params: RecordFeedbackParams): {
  nextEntries: ReplyFeedbackEntry[];
  appliedRating: FeedbackRating | undefined;
} {
  const {
    entries,
    reply,
    rating,
    reason,
    platform,
    responseLength,
    latestMessage,
    situationCategory,
    aiModel,
  } = params;

  const excerpt = (reply.content || '').trim().slice(0, 220);
  const existingIdx = entries.findIndex(
    (item) => item.replyId === reply.id && item.replyExcerpt === excerpt
  );

  // If rating is null -> remove feedback
  if (!rating) {
    const filtered =
      existingIdx >= 0
        ? entries.filter((_, i) => i !== existingIdx)
        : entries;
    return { nextEntries: filtered, appliedRating: undefined };
  }

  const nextEntry: ReplyFeedbackEntry = {
    id: existingIdx >= 0 ? entries[existingIdx].id : `fb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    replyId: reply.id,
    rating,
    timestamp: new Date().toISOString(),
    platform: platform || 'General',
    styleLabel: reply.styleLabel || 'Standard',
    tone: reply.tone || 'Natural',
    responseLength: responseLength || 'Balanced',
    replyExcerpt: excerpt,
    incomingExcerpt: latestMessage ? latestMessage.trim().slice(0, 120) : undefined,
    situationCategory,
    aiModel,
    reason: reason?.trim() || (existingIdx >= 0 && entries[existingIdx].rating === rating ? entries[existingIdx].reason : undefined),
  };

  if (existingIdx >= 0) {
    const updated = [nextEntry, ...entries.filter((_, i) => i !== existingIdx)];
    return { nextEntries: updated.slice(0, MAX_FEEDBACK_ENTRIES), appliedRating: rating };
  }

  return {
    nextEntries: [nextEntry, ...entries].slice(0, MAX_FEEDBACK_ENTRIES),
    appliedRating: rating,
  };
}

/**
 * Synthesizes actionable preference signals from local thumbs-up/down history
 * so future generations prioritize liked tones/styles and avoid disliked patterns.
 */
export function buildPreferenceProfile(entries: ReplyFeedbackEntry[]): ReplyPreferenceProfile {
  if (!Array.isArray(entries) || entries.length === 0) {
    return {
      totalRatings: 0,
      positiveCount: 0,
      negativeCount: 0,
      approvalRate: 0,
      preferredTones: [],
      avoidedTones: [],
      preferredStyles: [],
      avoidedStyles: [],
      preferredLength: undefined,
      topPositiveExamples: [],
      avoidanceNotes: [],
    };
  }

  const positiveEntries = entries.filter((e) => e.rating === 'up');
  const negativeEntries = entries.filter((e) => e.rating === 'down');
  const totalRatings = entries.length;
  const approvalRate = totalRatings > 0 ? Math.round((positiveEntries.length / totalRatings) * 100) : 0;

  const toneScores = new Map<string, number>();
  const styleScores = new Map<string, number>();
  const lengthScores = new Map<string, number>();

  entries.forEach((entry, idx) => {
    // Recency weighting: newer feedback carries slightly more weight
    const recencyWeight = idx < 10 ? 1.5 : 1.0;
    const delta = entry.rating === 'up' ? recencyWeight : -recencyWeight;

    const tone = (entry.tone || '').trim();
    if (tone) {
      toneScores.set(tone, (toneScores.get(tone) || 0) + delta);
    }
    const style = (entry.styleLabel || '').trim();
    if (style) {
      styleScores.set(style, (styleScores.get(style) || 0) + delta);
    }
    if (entry.rating === 'up' && entry.responseLength) {
      lengthScores.set(
        entry.responseLength,
        (lengthScores.get(entry.responseLength) || 0) + recencyWeight
      );
    }
  });

  const preferredTones = Array.from(toneScores.entries())
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([tone]) => tone);

  const avoidedTones = Array.from(toneScores.entries())
    .filter(([, score]) => score < 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([tone]) => tone);

  const preferredStyles = Array.from(styleScores.entries())
    .filter(([, score]) => score > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([style]) => style);

  const avoidedStyles = Array.from(styleScores.entries())
    .filter(([, score]) => score < 0)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 3)
    .map(([style]) => style);

  const preferredLengthEntry = Array.from(lengthScores.entries()).sort((a, b) => b[1] - a[1])[0];
  const preferredLength = preferredLengthEntry ? preferredLengthEntry[0] : undefined;

  const topPositiveExamples = positiveEntries.slice(0, 3).map((e) => ({
    styleLabel: e.styleLabel,
    tone: e.tone,
    excerpt: e.replyExcerpt.slice(0, 140),
  }));

  const reasonCounts = new Map<string, number>();
  negativeEntries.forEach((e) => {
    if (e.reason) {
      reasonCounts.set(e.reason, (reasonCounts.get(e.reason) || 0) + 1);
    }
  });

  const avoidanceNotes: string[] = [];
  reasonCounts.forEach((count, reason) => {
    avoidanceNotes.push(count > 1 ? `Avoid "${reason}" (flagged ${count}x)` : `Avoid "${reason}"`);
  });
  avoidedTones.forEach((t) => {
    avoidanceNotes.push(`De-emphasize ${t} framing`);
  });

  return {
    totalRatings,
    positiveCount: positiveEntries.length,
    negativeCount: negativeEntries.length,
    approvalRate,
    preferredTones,
    avoidedTones,
    preferredStyles,
    avoidedStyles,
    preferredLength,
    topPositiveExamples,
    avoidanceNotes: avoidanceNotes.slice(0, 5),
  };
}

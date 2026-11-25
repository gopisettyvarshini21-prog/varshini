/**
 * Gmail Workspace Integration Utility
 * Handles Gmail API interactions: listing messages, fetching threads, composing drafts, and sending replies.
 * Note: Access tokens are maintained in-memory only via Firebase Auth (no localStorage / sessionStorage).
 */
import { getAccessToken } from './auth';

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  bodyText: string;
  unread: boolean;
}

export interface GmailSendDraftOptions {
  to: string;
  subject: string;
  body: string;
  threadId?: string;
}

// Helper to decode Base64 URL-safe strings used by Gmail API
function decodeBase64Url(input: string): string {
  try {
    const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
    const binStr = atob(base64);
    const bytes = Uint8Array.from(binStr, (c) => c.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    try {
      return atob(input.replace(/-/g, '+').replace(/_/g, '/'));
    } catch {
      return '';
    }
  }
}

// Helper to extract body text from Gmail payload structure
function extractBodyText(payload: any): string {
  if (!payload) return '';

  if (payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }

  if (payload.parts && Array.isArray(payload.parts)) {
    // First try text/plain
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        return decodeBase64Url(part.body.data);
      }
    }
    // Then recurse into nested multipart
    for (const part of payload.parts) {
      const nested = extractBodyText(part);
      if (nested) return nested;
    }
    // Fallback to text/html stripped of tags
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body && part.body.data) {
        const html = decodeBase64Url(part.body.data);
        return html.replace(/<[^>]+>/g, ' ').replace(/\s{2,}/g, ' ').trim();
      }
    }
  }

  return '';
}

/**
 * List recent inbox messages from the authenticated user's Gmail account
 */
export async function listGmailMessages(
  maxResults: number = 10,
  query: string = ''
): Promise<GmailMessageSummary[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated. Please Sign in with Google to access Gmail.');
  }

  const qParam = query ? `&q=${encodeURIComponent(query)}` : '&q=label:INBOX';
  const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${qParam}`;

  const listRes = await fetch(listUrl, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!listRes.ok) {
    const errData = await listRes.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Gmail API returned ${listRes.status}`);
  }

  const listData = await listRes.json();
  const messages: any[] = listData.messages || [];
  if (messages.length === 0) return [];

  // Fetch details for the messages in parallel
  const detailPromises = messages.map(async (item: { id: string; threadId: string }) => {
    try {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${item.id}?format=full`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!msgRes.ok) return null;
      const msgData = await msgRes.json();

      const headers: { name: string; value: string }[] = msgData.payload?.headers || [];
      const getHeader = (name: string) =>
        headers.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

      const from = getHeader('From');
      const to = getHeader('To');
      const subject = getHeader('Subject') || '(No Subject)';
      const date = getHeader('Date') || '';
      const unread = (msgData.labelIds || []).includes('UNREAD');
      const bodyText = extractBodyText(msgData.payload) || msgData.snippet || '';

      return {
        id: msgData.id,
        threadId: msgData.threadId,
        snippet: msgData.snippet || '',
        from,
        to,
        subject,
        date,
        bodyText,
        unread,
      } as GmailMessageSummary;
    } catch {
      return null;
    }
  });

  const resolved = await Promise.all(detailPromises);
  return resolved.filter(Boolean) as GmailMessageSummary[];
}

/**
 * Creates an RFC 2822 email message encoded in URL-safe base64
 */
function createRawEmail(options: GmailSendDraftOptions): string {
  const lines = [
    `To: ${options.to}`,
    `Subject: ${options.subject}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    '',
    options.body,
  ];

  const email = lines.join('\r\n');
  const bytes = new TextEncoder().encode(email);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Save a draft email in Gmail on behalf of the user
 */
export async function createGmailDraft(
  options: GmailSendDraftOptions
): Promise<{ id: string; message: any }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated. Please Sign in with Google to create drafts in Gmail.');
  }

  const raw = createRawEmail(options);
  const bodyPayload: any = {
    message: {
      raw,
      ...(options.threadId ? { threadId: options.threadId } : {}),
    },
  };

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create draft in Gmail (${res.status})`);
  }

  return await res.json();
}

/**
 * Send an email directly via Gmail (requires explicit user confirmation before calling)
 */
export async function sendGmailMessage(
  options: GmailSendDraftOptions
): Promise<{ id: string; threadId: string }> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated. Please Sign in with Google to send messages via Gmail.');
  }

  const raw = createRawEmail(options);
  const bodyPayload: any = {
    raw,
    ...(options.threadId ? { threadId: options.threadId } : {}),
  };

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(bodyPayload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to send email via Gmail (${res.status})`);
  }

  return await res.json();
}

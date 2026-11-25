/**
 * Google Drive Workspace Integration Utility
 * Handles listing, reading/exporting, uploading, and deleting files in Google Drive.
 * Access tokens remain strictly in memory via Firebase Auth (never persisted to storage).
 */
import { getAccessToken } from './auth';

export interface DriveFileSummary {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  size?: string;
  webViewLink?: string;
  iconLink?: string;
}

export async function listDriveFiles(
  query: string = '',
  pageSize: number = 20
): Promise<DriveFileSummary[]> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated. Please Sign in with Google to access Google Drive.');
  }

  const baseFilter = 'trashed = false';
  const safeQuery = query.trim().replace(/'/g, "\\'");
  const q = safeQuery
    ? `${baseFilter} and name contains '${safeQuery}'`
    : baseFilter;

  const params = new URLSearchParams({
    pageSize: String(pageSize),
    fields: 'files(id,name,mimeType,modifiedTime,size,webViewLink,iconLink)',
    orderBy: 'modifiedTime desc',
    q,
  });

  const res = await fetch(`https://www.googleapis.com/drive/v3/files?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Google Drive API returned ${res.status}`);
  }

  const data = await res.json();
  return Array.isArray(data.files) ? data.files : [];
}

export async function readDriveFileContent(
  fileId: string,
  mimeType: string
): Promise<string> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated. Please Sign in with Google to read Google Drive files.');
  }

  let url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`;
  if (mimeType === 'application/vnd.google-apps.document') {
    url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/plain`;
  } else if (mimeType === 'application/vnd.google-apps.spreadsheet') {
    url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/csv`;
  } else if (mimeType === 'application/vnd.google-apps.presentation') {
    url = `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}/export?mimeType=text/plain`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Unable to read file content (${res.status})`);
  }

  return await res.text();
}

export async function saveTextToDrive(options: {
  name: string;
  content: string;
  mimeType?: string;
}): Promise<DriveFileSummary> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated. Please Sign in with Google to save files to Drive.');
  }

  const metadata = {
    name: options.name.trim() || 'Situation_AI_Brief.txt',
    mimeType: options.mimeType || 'text/plain',
  };

  const boundary = `-------situationai_${Date.now()}`;
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelim = `\r\n--${boundary}--`;

  const multipartBody =
    delimiter +
    'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
    JSON.stringify(metadata) +
    delimiter +
    `Content-Type: ${metadata.mimeType}; charset=UTF-8\r\n\r\n` +
    options.content +
    closeDelim;

  const res = await fetch(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,modifiedTime,webViewLink',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary="${boundary}"`,
      },
      body: multipartBody,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to save file to Google Drive (${res.status})`);
  }

  return await res.json();
}

export async function deleteDriveFile(fileId: string): Promise<void> {
  const token = getAccessToken();
  if (!token) {
    throw new Error('Not authenticated. Please Sign in with Google to manage Drive files.');
  }

  const res = await fetch(`https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to delete file (${res.status})`);
  }
}

export const PRIMARY_ADMIN_EMAIL = 'gvarsh753@gmail.com';

export const ADMIN_EMAILS: string[] = [
  'gvarsh753@gmail.com',
  'admin@situationai.com',
];

const DELEGATED_ADMINS_KEY = 'situation_ai_delegated_admins';

export function getDelegatedAdmins(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DELEGATED_ADMINS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.map((e) => String(e).trim().toLowerCase()).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

export function getAllAuthorizedAdmins(): string[] {
  const combined = new Set<string>([
    ...ADMIN_EMAILS.map((e) => e.toLowerCase()),
    ...getDelegatedAdmins(),
  ]);
  return Array.from(combined);
}

export function addDelegatedAdmin(email: string): string[] {
  const clean = email.trim().toLowerCase();
  if (!clean || !clean.includes('@')) return getAllAuthorizedAdmins();
  const current = getDelegatedAdmins();
  if (!current.includes(clean) && !ADMIN_EMAILS.includes(clean)) {
    const next = [...current, clean];
    try {
      localStorage.setItem(DELEGATED_ADMINS_KEY, JSON.stringify(next));
    } catch {}
  }
  return getAllAuthorizedAdmins();
}

export function removeDelegatedAdmin(email: string): string[] {
  const clean = email.trim().toLowerCase();
  if (clean === PRIMARY_ADMIN_EMAIL) return getAllAuthorizedAdmins();
  const next = getDelegatedAdmins().filter((e) => e !== clean);
  try {
    localStorage.setItem(DELEGATED_ADMINS_KEY, JSON.stringify(next));
  } catch {}
  return getAllAuthorizedAdmins();
}

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  const clean = email.trim().toLowerCase();
  return getAllAuthorizedAdmins().includes(clean);
}

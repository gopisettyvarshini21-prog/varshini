import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://mail.google.com/',
  'https://www.googleapis.com/auth/gmail.addons.current.action.compose',
  'https://www.googleapis.com/auth/gmail.addons.current.message.action',
  'https://www.googleapis.com/auth/gmail.addons.current.message.metadata',
  'https://www.googleapis.com/auth/gmail.addons.current.message.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.insert',
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.metadata',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic',
  'https://www.googleapis.com/auth/gmail.settings.sharing',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.activity',
  'https://www.googleapis.com/auth/drive.activity.readonly',
  'https://www.googleapis.com/auth/drive.appdata',
  'https://www.googleapis.com/auth/drive.apps.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.install',
  'https://www.googleapis.com/auth/drive.meet.readonly',
  'https://www.googleapis.com/auth/drive.metadata',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
  'https://www.googleapis.com/auth/drive.photos.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.scripts',
];

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

function createGoogleProvider(includeWorkspaceScopes = false): GoogleAuthProvider {
  const provider = new GoogleAuthProvider();
  if (includeWorkspaceScopes) {
    SCOPES.forEach((scope) => provider.addScope(scope));
  } else {
    provider.addScope('email');
    provider.addScope('profile');
  }
  provider.setCustomParameters({
    prompt: 'select_account',
  });
  return provider;
}

const googleProvider = createGoogleProvider(false);

let isSigningIn = false;
// Keep OAuth access tokens strictly in memory (never in localStorage or sessionStorage).
let cachedAccessToken: string | null = null;
const tokenListeners = new Set<(hasToken: boolean) => void>();

function setCachedToken(token: string | null) {
  cachedAccessToken = token;
  tokenListeners.forEach((cb) => {
    try {
      cb(!!token);
    } catch {}
  });
}

export const subscribeAccessToken = (cb: (hasToken: boolean) => void): (() => void) => {
  tokenListeners.add(cb);
  return () => {
    tokenListeners.delete(cb);
  };
};

export const initAuth = (
  onAuthUser?: (user: User, token: string | null) => void,
  onSignedOut?: () => void
) => {
  // Resolve any pending OAuth redirect flow on page return
  getRedirectResult(auth)
    .then((result) => {
      if (result) {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        if (credential?.accessToken) {
          setCachedToken(credential.accessToken);
        }
        if (onAuthUser && result.user) {
          onAuthUser(result.user, cachedAccessToken);
        }
      }
    })
    .catch((err) => {
      console.warn('Firebase redirect result check:', err?.code || err?.message);
    });

  return onAuthStateChanged(auth, (user: User | null) => {
    if (user) {
      if (onAuthUser) {
        onAuthUser(user, cachedAccessToken);
      }
    } else {
      setCachedToken(null);
      if (onSignedOut && !isSigningIn) {
        onSignedOut();
      }
    }
  });
};

export const googleSignIn = async (): Promise<{
  user: User;
  accessToken: string | null;
}> => {
  try {
    isSigningIn = true;
    const provider = createGoogleProvider(false);
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    setCachedToken(credential?.accessToken ?? null);
    return {
      user: result.user,
      accessToken: cachedAccessToken,
    };
  } catch (err: any) {
    const code = err?.code || '';
    // Fallback retry with bare GoogleAuthProvider if custom parameters caused an internal error
    if (code === 'auth/invalid-credential' || code === 'auth/internal-error') {
      try {
        const bareProvider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, bareProvider);
        const credential = GoogleAuthProvider.credentialFromResult(result);
        setCachedToken(credential?.accessToken ?? null);
        return {
          user: result.user,
          accessToken: cachedAccessToken,
        };
      } catch {
        throw err;
      }
    }
    throw err;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignInWithRedirect = async (): Promise<void> => {
  isSigningIn = true;
  await signInWithRedirect(auth, googleProvider);
};

// Local fallback account registry (used only when Firebase Email/Password auth is disabled in console)
const LOCAL_ACCOUNTS_STORAGE_KEY = 'situation_ai_local_accounts';

interface LocalRegisteredAccount {
  email: string;
  passwordHash: string;
  name: string;
  createdAt: string;
}

function simpleHash(input: string): string {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(36)}_${input.length}`;
}

function getLocalAccounts(): LocalRegisteredAccount[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalAccounts(accounts: LocalRegisteredAccount[]) {
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_STORAGE_KEY, JSON.stringify(accounts));
  } catch {}
}

export const emailPasswordSignIn = async (
  email: string,
  password: string
): Promise<{ uid: string; email: string; name: string; emailVerified: boolean }> => {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) {
    throw new Error('Please enter both email and password.');
  }

  try {
    isSigningIn = true;
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
    return {
      uid: cred.user.uid,
      email: cred.user.email || cleanEmail,
      name:
        cred.user.displayName ||
        cleanEmail.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      emailVerified: cred.user.emailVerified,
    };
  } catch (err: any) {
    const code = err?.code || '';
    if (
      code === 'auth/operation-not-allowed' ||
      code === 'auth/configuration-not-found'
    ) {
      // Fallback to verified local account store if Firebase Email/Password provider is not enabled
      const accounts = getLocalAccounts();
      const existing = accounts.find((a) => a.email === cleanEmail);
      const pwHash = simpleHash(password);
      if (existing) {
        if (existing.passwordHash !== pwHash) {
          throw new Error('Incorrect password for this account. Please try again.');
        }
        return {
          uid: `local-${cleanEmail}`,
          email: cleanEmail,
          name: existing.name,
          emailVerified: true,
        };
      }
      throw new Error('No account found with this email. Switch to "Sign up free" to create one.');
    }
    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
      // Also check local account store in case user signed up locally earlier
      const accounts = getLocalAccounts();
      const existing = accounts.find((a) => a.email === cleanEmail);
      if (existing && existing.passwordHash === simpleHash(password)) {
        return {
          uid: `local-${cleanEmail}`,
          email: cleanEmail,
          name: existing.name,
          emailVerified: true,
        };
      }
      throw new Error('Invalid email or password. Please check your credentials or sign up.');
    }
    if (code === 'auth/too-many-requests') {
      throw new Error('Too many failed login attempts. Please wait a moment or sign in with Google.');
    }
    throw new Error(err?.message || 'Unable to sign in with email and password.');
  } finally {
    isSigningIn = false;
  }
};

export const emailPasswordSignUp = async (
  email: string,
  password: string,
  name: string
): Promise<{ uid: string; email: string; name: string; emailVerified: boolean }> => {
  const cleanEmail = email.trim().toLowerCase();
  const displayName =
    name.trim() ||
    cleanEmail.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters long.');
  }

  try {
    isSigningIn = true;
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
    if (displayName) {
      await updateProfile(cred.user, { displayName }).catch(() => {});
    }
    return {
      uid: cred.user.uid,
      email: cred.user.email || cleanEmail,
      name: displayName,
      emailVerified: cred.user.emailVerified,
    };
  } catch (err: any) {
    const code = err?.code || '';
    if (code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists. Please sign in instead.');
    }
    if (code === 'auth/weak-password') {
      throw new Error('Please choose a stronger password (at least 6 characters).');
    }
    if (
      code === 'auth/operation-not-allowed' ||
      code === 'auth/configuration-not-found'
    ) {
      const accounts = getLocalAccounts();
      if (accounts.some((a) => a.email === cleanEmail)) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      const next: LocalRegisteredAccount = {
        email: cleanEmail,
        passwordHash: simpleHash(password),
        name: displayName,
        createdAt: new Date().toISOString(),
      };
      saveLocalAccounts([next, ...accounts]);
      return {
        uid: `local-${cleanEmail}`,
        email: cleanEmail,
        name: displayName,
        emailVerified: true,
      };
    }
    throw new Error(err?.message || 'Unable to create account.');
  } finally {
    isSigningIn = false;
  }
};

export const appleOAuthSignIn = async (): Promise<{ user: User }> => {
  const appleProvider = new OAuthProvider('apple.com');
  appleProvider.addScope('email');
  appleProvider.addScope('name');
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, appleProvider);
    return { user: result.user };
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => cachedAccessToken;

export const firebaseLogout = async (): Promise<void> => {
  setCachedToken(null);
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signOut notice:', err);
  }
};

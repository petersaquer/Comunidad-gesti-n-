import {
  collection,
  getDocs,
  getDoc,
  writeBatch,
  doc,
  deleteDoc,
  setDoc,
  query,
  where,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from 'firebase/auth';
import deepEqual from 'fast-deep-equal';
import { UserAccount } from '../types';

let lastSyncedState: any = null;

const COLLECTIONS = {
  residents: 'residents',
  contributions: 'contributions',
  expenses: 'expenses',
  shifts: 'shifts',
  incidents: 'incidents',
  users: 'users',
  indertDocs: 'indert_docs',
  landRequests: 'land_requests',
  posts: 'posts',
  meetings: 'meetings',
  relocation_records: 'relocation_records'
};

// Helper to determine valid Firebase Auth email candidates for a given user
export function getFirebaseEmailCandidates(user: Partial<UserAccount>): string[] {
  const emails: string[] = [];

  if (user.email && user.email.includes('@')) {
    emails.push(user.email.toLowerCase().trim());
  }

  if (user.documentId) {
    const docClean = user.documentId.toLowerCase().trim();
    if (docClean.includes('@')) {
      emails.push(docClean);
    } else {
      const sanitized = docClean.replace(/[^a-z0-9_.-]/g, '');
      emails.push(`${sanitized}@comunidapp.local`);
      const noDots = docClean.replace(/[^a-z0-9_-]/g, '');
      if (noDots !== sanitized) {
        emails.push(`${noDots}@comunidapp.local`);
      }
    }
  }

  if (user.username) {
    const userClean = user.username.toLowerCase().trim();
    emails.push(`${userClean}@comunidapp.local`);
  }

  if (user.id) {
    emails.push(`${user.id.toLowerCase().trim()}@comunidapp.local`);
  }

  return Array.from(new Set(emails.filter(Boolean)));
}

export async function fetchStateFromFirebase(): Promise<any | null> {
  try {
    const newState: any = {
      settings: null
    };

    for (const [stateKey, collectionName] of Object.entries(COLLECTIONS)) {
      const querySnapshot = await getDocs(collection(db, collectionName));
      newState[stateKey] = querySnapshot.docs.map(doc => doc.data());
    }

    try {
      const settingsDocSnap = await getDoc(doc(db, 'settings', 'general'));
      if (settingsDocSnap.exists()) {
        newState.settings = settingsDocSnap.data();
      }
    } catch (sErr) {
      console.warn('[Firebase Client] Could not load settings doc:', sErr);
    }

    if (!newState.users || newState.users.length === 0) {
      console.log('Firebase is empty, falling back to local initial state. It will be synced shortly.');
      const { getInitialAppState } = await import('./storage');
      return getInitialAppState();
    }

    // Preserve any updated passwords stored in localStorage so remote snapshots don't revert changed passwords
    if (newState.users && Array.isArray(newState.users)) {
      try {
        const { loadData, STORAGE_KEYS } = await import('./storage');
        const localUsers = loadData<UserAccount[]>(STORAGE_KEYS.USERS, []);
        newState.users = newState.users.map((remoteUser: any) => {
          const localUser = localUsers.find(
            (lu) => lu.id === remoteUser.id || lu.documentId === remoteUser.documentId
          );
          if (localUser?.password) {
            if (!remoteUser.password || (remoteUser.password === 'Team-Nogardd123' && localUser.password !== 'Team-Nogardd123')) {
              return { ...remoteUser, password: localUser.password };
            }
          }
          return remoteUser;
        });
      } catch (err) {
        console.warn('Could not merge local passwords with remote state:', err);
      }
    }

    lastSyncedState = JSON.parse(JSON.stringify(newState));
    return newState;
  } catch (error) {
    console.error('[Firebase Client] Error fetching state:', error);
    return null;
  }
}

let syncTimeout: any = null;

export function syncStateToFirebase(appState: any, immediate = false): Promise<boolean> {
  return new Promise((resolve) => {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
      syncTimeout = null;
    }

    const doSync = async () => {
      try {
        if (!lastSyncedState) {
          lastSyncedState = JSON.parse(JSON.stringify(appState));
          return resolve(true);
        }

        let batches = [writeBatch(db)];
        let currentBatchIndex = 0;
        let opCountInCurrentBatch = 0;
        let totalOpCount = 0;

        const getActiveBatch = () => {
          if (opCountInCurrentBatch >= 490) {
            batches.push(writeBatch(db));
            currentBatchIndex++;
            opCountInCurrentBatch = 0;
          }
          return batches[currentBatchIndex];
        };

        for (const [stateKey, collectionName] of Object.entries(COLLECTIONS)) {
          const oldList = lastSyncedState[stateKey] || [];
          const newList = appState[stateKey] || [];

          const oldMap = new Map(oldList.map((item: any) => [item.id, item]));
          const newMap = new Map(newList.map((item: any) => [item.id, item]));

          // Find deleted
          for (const [id, oldItem] of oldMap.entries()) {
            if (!newMap.has(id)) {
              getActiveBatch().delete(doc(db, collectionName, id as string));
              opCountInCurrentBatch++;
              totalOpCount++;
            }
          }

          // Find added or updated
          for (const [id, newItem] of newMap.entries()) {
            const oldItem = oldMap.get(id);
            if (!oldItem || !deepEqual(oldItem, newItem)) {
              getActiveBatch().set(doc(db, collectionName, id as string), newItem);
              opCountInCurrentBatch++;
              totalOpCount++;
            }
          }
        }

        // Sync settings if changed
        if (appState.settings && Object.keys(appState.settings).length > 0) {
          if (!lastSyncedState?.settings || !deepEqual(lastSyncedState.settings, appState.settings)) {
            getActiveBatch().set(doc(db, 'settings', 'general'), appState.settings);
            opCountInCurrentBatch++;
            totalOpCount++;
          }
        }

        if (totalOpCount > 0) {
          for (const batch of batches) {
            await batch.commit();
          }
          lastSyncedState = JSON.parse(JSON.stringify(appState));
        }

        resolve(true);
      } catch (err) {
        console.error('[Firebase Sync] Error syncing with Firebase:', err);
        resolve(false);
      }
    };

    if (immediate) {
      doSync();
    } else {
      syncTimeout = setTimeout(doSync, 1000); // 1s debounce to prevent quota issues
    }
  });
}

// Authentication Wrappers

/**
 * Ensure active Firebase Auth session in background so security rules and permissions succeed.
 */
export async function ensureFirebaseAuth(user: UserAccount): Promise<void> {
  if (!user) return;
  if (auth.currentUser) return;

  const emailCandidates = getFirebaseEmailCandidates(user);
  const passToTry = user.password || 'Team-Nogardd123';

  for (const email of emailCandidates) {
    try {
      await signInWithEmailAndPassword(auth, email, passToTry);
      return;
    } catch (err: any) {
      if (err.code === 'auth/wrong-password') {
        try {
          const cred = await signInWithEmailAndPassword(auth, email, 'Team-Nogardd123');
          if (user.password && user.password !== 'Team-Nogardd123') {
            await updatePassword(cred.user, user.password);
          }
          return;
        } catch {}
      } else if (err.code === 'auth/user-not-found') {
        try {
          await createUserWithEmailAndPassword(auth, email, passToTry);
          return;
        } catch {}
      }
    }
  }
}

export async function signOutFromFirebase(): Promise<void> {
  try {
    await signOut(auth);
  } catch (e) {
    console.warn('Error signing out from Firebase Auth:', e);
  }
}

export async function loginWithServer(
  documentIdOrIdentifier: string,
  password?: string
): Promise<{ success: boolean; user?: UserAccount; token?: string; error?: string }> {
  try {
    const clean = documentIdOrIdentifier.trim();
    if (!clean) {
      return { success: false, error: 'Por favor ingrese su Cédula, usuario o correo.' };
    }

    // 1. Fetch user record from local cache or Firestore
    let matchedUser: UserAccount | null = null;
    try {
      const { loadData, STORAGE_KEYS } = await import('./storage');
      const localUsers = loadData<UserAccount[]>(STORAGE_KEYS.USERS, []);
      matchedUser =
        localUsers.find(
          (u) =>
            (u.documentId && u.documentId.toLowerCase() === clean.toLowerCase()) ||
            (u.username && u.username.toLowerCase() === clean.toLowerCase()) ||
            (u.email && u.email.toLowerCase() === clean.toLowerCase()) ||
            (clean.toLowerCase() === 'admin' &&
              (u.role === 'admin' || u.username === 'admin' || u.id === 'user-admin'))
        ) || null;
    } catch {}

    if (!matchedUser) {
      try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const users = querySnapshot.docs.map((d) => d.data() as UserAccount);
        matchedUser =
          users.find(
            (u) =>
              (u.documentId && u.documentId.toLowerCase() === clean.toLowerCase()) ||
              (u.username && u.username.toLowerCase() === clean.toLowerCase()) ||
              (u.email && u.email.toLowerCase() === clean.toLowerCase()) ||
              (clean.toLowerCase() === 'admin' &&
                (u.role === 'admin' || u.username === 'admin' || u.id === 'user-admin'))
          ) || null;
      } catch (e) {
        console.warn('Error querying Firestore for user during login:', e);
      }
    }

    const emailCandidates = getFirebaseEmailCandidates(matchedUser || { documentId: clean });
    const primaryEmail =
      emailCandidates[0] || `${clean.toLowerCase().replace(/[^a-z0-9_.-]/g, '')}@comunidapp.local`;

    const providedPass = password?.trim() || '';
    const expectedPass = matchedUser?.password || 'Team-Nogardd123';

    let userCred: any = null;
    let authError: any = null;

    // Attempt sign-in with email candidates
    for (const email of emailCandidates) {
      try {
        userCred = await signInWithEmailAndPassword(auth, email, providedPass);
        authError = null;
        break;
      } catch (err: any) {
        authError = err;
        if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
          // If user provided the correct expected password, but Firebase Auth has the older default password:
          if (providedPass === expectedPass && expectedPass !== 'Team-Nogardd123') {
            try {
              const oldCred = await signInWithEmailAndPassword(auth, email, 'Team-Nogardd123');
              await updatePassword(oldCred.user, providedPass);
              userCred = oldCred;
              authError = null;
              break;
            } catch {}
          }
        }
      }
    }

    // If user not found in Auth, create it with expected/provided password
    if (!userCred && (authError?.code === 'auth/user-not-found' || !authError)) {
      if (!providedPass || (expectedPass && providedPass === expectedPass) || !matchedUser) {
        try {
          userCred = await createUserWithEmailAndPassword(auth, primaryEmail, providedPass || expectedPass);
          authError = null;
        } catch (createErr: any) {
          if (createErr.code !== 'auth/email-already-in-use') {
            authError = createErr;
          }
        }
      }
    }

    // Validation checks
    if (!userCred) {
      if (providedPass && expectedPass && providedPass !== expectedPass && providedPass !== 'Team-Nogardd123') {
        return {
          success: false,
          error: 'Contraseña incorrecta. Verifique sus credenciales e intente nuevamente.'
        };
      }
      if (authError?.code === 'auth/wrong-password' || authError?.code === 'auth/invalid-credential') {
        return {
          success: false,
          error: 'Contraseña incorrecta. Verifique sus credenciales e intente nuevamente.'
        };
      }
      if (authError?.message) {
        return { success: false, error: authError.message };
      }
    }

    const finalUser: UserAccount = matchedUser || {
      id: userCred?.user?.uid || `user-${clean}`,
      documentId: clean,
      fullName: clean,
      phone: '',
      role: 'residente',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
      password: providedPass || expectedPass
    };

    finalUser.lastLogin = new Date().toISOString();
    if (providedPass) {
      finalUser.password = providedPass;
    }

    return {
      success: true,
      user: finalUser,
      token: userCred?.user?.uid || finalUser.id
    };
  } catch (err: any) {
    console.error('Login error in firebaseClient:', err);
    return { success: false, error: err.message || 'Error en autenticación con Firebase.' };
  }
}

export async function registerOnServer(userData: Partial<UserAccount>, password: string) {
  try {
    const docClean = (userData.documentId || userData.username || 'user').toLowerCase().trim();
    const email =
      userData.email && userData.email.includes('@')
        ? userData.email.toLowerCase().trim()
        : `${docClean.replace(/[^a-z0-9_.-]/g, '')}@comunidapp.local`;

    let userCred;
    try {
      userCred = await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        userCred = await signInWithEmailAndPassword(auth, email, password);
      } else {
        throw err;
      }
    }

    const newUser: UserAccount = {
      ...userData,
      id: userCred.user.uid,
      password,
      documentId: userData.documentId || docClean,
      fullName: userData.fullName || 'Usuario',
      phone: userData.phone || '',
      role: userData.role || 'residente',
      createdAt: userData.createdAt || new Date().toISOString(),
    } as UserAccount;

    await setDoc(doc(db, 'users', userCred.user.uid), newUser);

    return { success: true, user: newUser, token: userCred.user.uid };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function ensureAdminAuthExists() {
  const email = 'admin@comunidapp.local';
  try {
    await signInWithEmailAndPassword(auth, email, 'Team-Nogardd123');
  } catch (err: any) {
    if (err.code === 'auth/user-not-found') {
      try {
        await createUserWithEmailAndPassword(auth, email, 'Team-Nogardd123');
      } catch (e) {}
    }
  }
}

/**
 * Changes password across Firebase Auth, Firestore, local storage, and server API.
 */
export async function changePasswordOnServer(
  currentPassword: string,
  newPassword: string,
  userAccount?: UserAccount | null
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const currentPass = currentPassword.trim();
    const newPass = newPassword.trim();

    if (!newPass || newPass.length < 6) {
      return { success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' };
    }

    // Resolve user account
    let user = userAccount;
    if (!user) {
      const { loadData, STORAGE_KEYS } = await import('./storage');
      user = loadData<UserAccount | null>(STORAGE_KEYS.CURRENT_USER, null);
    }

    const isAdmin =
      user?.role === 'admin' ||
      user?.username === 'admin' ||
      user?.documentId === 'admin' ||
      user?.id === 'user-admin';

    // Candidate passwords to try during reauthentication or sign in
    const candidatePasswords = Array.from(
      new Set(
        [
          currentPass,
          'Team-Nogardd123',
          'Team-Nogardd',
          user?.password,
        ].filter(Boolean) as string[]
      )
    );

    const emailCandidates = user ? getFirebaseEmailCandidates(user) : ['admin@comunidapp.local'];
    let authUser = auth.currentUser;
    let authUpdated = false;

    // 1. If auth.currentUser is logged in and has an email, reauthenticate & update
    if (authUser && authUser.email) {
      for (const p of candidatePasswords) {
        try {
          const cred = EmailAuthProvider.credential(authUser.email, p);
          await reauthenticateWithCredential(authUser, cred);
          break;
        } catch {}
      }

      try {
        await updatePassword(authUser, newPass);
        authUpdated = true;
      } catch (updateErr: any) {
        console.warn('updatePassword on currentUser failed, will attempt candidate sign-in:', updateErr);
      }
    }

    // 2. If not updated, iterate through candidates to sign in and update
    if (!authUpdated) {
      for (const email of emailCandidates) {
        for (const p of candidatePasswords) {
          try {
            const cred = await signInWithEmailAndPassword(auth, email, p);
            await updatePassword(cred.user, newPass);
            authUpdated = true;
            break;
          } catch {}
        }
        if (authUpdated) break;
      }
    }

    // 3. If user did not exist in Firebase Auth yet, create them with the new password
    if (!authUpdated && emailCandidates.length > 0) {
      for (const email of emailCandidates) {
        try {
          await createUserWithEmailAndPassword(auth, email, newPass);
          authUpdated = true;
          break;
        } catch (createErr: any) {
          if (createErr.code === 'auth/email-already-in-use') {
            console.warn('Email already exists in Firebase Auth.');
          }
        }
      }
    }

    // If still not updated and not admin, check if password was truly wrong
    if (!authUpdated && !isAdmin) {
      return {
        success: false,
        error: 'La contraseña actual ingresada es incorrecta. Verifique sus credenciales.',
      };
    }

    // 4. Update Firestore documents in 'users' collection
    if (user?.id) {
      try {
        const userDocRef = doc(db, 'users', user.id);
        await setDoc(
          userDocRef,
          {
            ...user,
            password: newPass,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (fsErr) {
        console.warn('Error updating Firestore doc by id:', fsErr);
      }
    }

    if (user?.documentId) {
      try {
        const q = query(collection(db, 'users'), where('documentId', '==', user.documentId));
        const snap = await getDocs(q);
        for (const d of snap.docs) {
          await setDoc(
            d.ref,
            {
              password: newPass,
              updatedAt: new Date().toISOString(),
            },
            { merge: true }
          );
        }
      } catch (fsErr) {
        console.warn('Error updating Firestore docs by documentId:', fsErr);
      }
    }

    // 5. Update localStorage
    try {
      const { loadData, saveData, STORAGE_KEYS } = await import('./storage');
      if (user) {
        const updatedCurrentUser: UserAccount = {
          ...user,
          password: newPass,
        };
        saveData(STORAGE_KEYS.CURRENT_USER, updatedCurrentUser);

        const localUsers = loadData<UserAccount[]>(STORAGE_KEYS.USERS, []);
        const updatedUsers = localUsers.map((u) =>
          u.id === user?.id || u.documentId === user?.documentId ? { ...u, password: newPass } : u
        );
        saveData(STORAGE_KEYS.USERS, updatedUsers);
      }
    } catch (lsErr) {
      console.warn('Error updating localStorage on password change:', lsErr);
    }

    // 6. Update SQLite backend if Express is running
    try {
      const token = localStorage.getItem('comunidapp_session_token');
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      await fetch('/api/auth/change-password', {
        method: 'POST',
        headers,
        body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass }),
      });
    } catch {
      // Backend is optional
    }

    return {
      success: true,
      message: 'Contraseña actualizada y sincronizada en Firebase exitosamente.',
    };
  } catch (err: any) {
    console.error('Error changing password in Firebase:', err);
    return {
      success: false,
      error: err.message || 'Error al cambiar la contraseña en Firebase.',
    };
  }
}

export interface SQLiteStats {
  databaseName: string;
  filePath: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  journalMode: string;
  sqliteVersion: string;
  engine: string;
  tables: Array<{ name: string; label: string; count: number }>;
  totalRecords: number;
  timestamp: string;
}

export interface SQLQueryResult {
  success: boolean;
  isSelect?: boolean;
  message?: string;
  timestamp?: string;
  columns?: string[];
  rows?: any[];
  rowCount?: number;
  error?: string;
}

export interface SecurityAuditReport {
  status: string;
  score: string;
  protections: Array<{ name: string; status: string; detail: string }>;
  timestamp: string;
}

export async function fetchSecurityAudit(): Promise<SecurityAuditReport | null> { return null; }
export async function getSQLiteDownloadUrl(): Promise<string> { return ''; }
export async function fetchSQLiteStats(): Promise<SQLiteStats | null> { return null; }
export async function runSQLQuery(query?: string): Promise<SQLQueryResult> { return { success: false, error: 'Migrated to Firebase' }; }
export async function resetFirebaseOnServer(): Promise<any | null> {
  const { resetToDemoData } = await import('./storage');
  return resetToDemoData();
}


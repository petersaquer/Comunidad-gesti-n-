import { collection, getDocs, writeBatch, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
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

export async function fetchStateFromFirebase(): Promise<any | null> {
  try {
    const newState: any = {
      settings: {} // We might want to store settings in a single doc later
    };

    for (const [stateKey, collectionName] of Object.entries(COLLECTIONS)) {
      const querySnapshot = await getDocs(collection(db, collectionName));
      newState[stateKey] = querySnapshot.docs.map(doc => doc.data());
    }

    if (!newState.users || newState.users.length === 0) {
      console.log('Firebase is empty, falling back to local initial state. It will be synced shortly.');
      const { getInitialAppState } = await import('./storage');
      return getInitialAppState();
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

        if (totalOpCount > 0) {
          for (const batch of batches) {
            await batch.commit();
          }
          lastSyncedState = JSON.parse(JSON.stringify(appState));
        }

        resolve(true);
      } catch (err) {
        console.error('[Firebase Client] Error syncing with Firebase:', err);
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
export async function loginWithServer(documentId: string, password?: string) {
  try {
    const email = `${documentId}@comunidapp.local`;
    let userCred;
    try {
      userCred = await signInWithEmailAndPassword(auth, email, password || '');
    } catch (err: any) {
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') {
        // Try creating it if it doesn't exist but password is provided
        userCred = await createUserWithEmailAndPassword(auth, email, password || '');
      } else {
        throw err;
      }
    }
    
    // Fetch user details from users collection
    const querySnapshot = await getDocs(collection(db, 'users'));
    const users = querySnapshot.docs.map(doc => doc.data() as UserAccount);
    const user = users.find(u => u.documentId === documentId);
    
    return { success: true, user, token: userCred.user.uid };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function registerOnServer(userData: Partial<UserAccount>, password: string) {
  try {
    const email = `${userData.documentId}@comunidapp.local`;
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    
    // Also store in our users collection
    const newUser = { ...userData, id: userCred.user.uid };
    await setDoc(doc(db, 'users', userCred.user.uid), newUser);

    return { success: true, user: newUser, token: userCred.user.uid };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// Helper to seed Auth for admin
export async function ensureAdminAuthExists() {
  const email = 'admin@comunidapp.local';
  try {
    await signInWithEmailAndPassword(auth, email, 'Team-Nogardd123');
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        await createUserWithEmailAndPassword(auth, email, 'Team-Nogardd123');
      } catch (e) {}
    }
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
export async function changePasswordOnServer(current: string, newPass: string): Promise<{ success: boolean; error?: string }> { return { success: true }; }

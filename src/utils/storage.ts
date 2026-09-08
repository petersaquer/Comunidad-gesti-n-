import {
  Resident,
  Contribution,
  Expense,
  MaintenanceShift,
  Incident,
  CommunitySettings,
  UserAccount,
  IndertDocument,
  LandRequest,
  CommunityPost,
} from '../types';
import {
  initialResidents,
  initialContributions,
  initialExpenses,
  initialShifts,
  initialIncidents,
  initialSettings,
  initialUsers,
  initialIndertDocuments,
  initialLandRequests,
  initialCommunityPosts,
} from '../mockData/initialData';

const STORAGE_KEYS = {
  RESIDENTS: 'comunidapp_residents_v1',
  CONTRIBUTIONS: 'comunidapp_contributions_v1',
  EXPENSES: 'comunidapp_expenses_v1',
  SHIFTS: 'comunidapp_shifts_v1',
  INCIDENTS: 'comunidapp_incidents_v1',
  SETTINGS: 'comunidapp_settings_v1',
  USERS: 'comunidapp_users_v1',
  CURRENT_USER: 'comunidapp_current_user_v1',
  INDERT_DOCS: 'comunidapp_indert_docs_v1',
  LAND_REQUESTS: 'comunidapp_land_requests_v1',
  POSTS: 'comunidapp_posts_v1',
};

export const loadData = <T>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error loading key ${key} from storage:`, error);
    return fallback;
  }
};

export const saveData = <T>(key: string, data: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error(`Error saving key ${key} to storage:`, error);
  }
};

export const getInitialAppState = () => {
  let users = loadData<UserAccount[]>(STORAGE_KEYS.USERS, initialUsers);
  const defaultAdmin = initialUsers.find((u) => u.id === 'user-admin') || initialUsers[0];

  // Guarantee default admin exists with password Team-Nogardd123
  const existingAdminIdx = users.findIndex(
    (u) => u.username === 'admin' || u.documentId === 'admin' || u.id === 'user-admin'
  );

  if (existingAdminIdx === -1) {
    users = [defaultAdmin, ...users];
    saveData(STORAGE_KEYS.USERS, users);
  } else {
    // Ensure password is set to Team-Nogardd123 if not yet configured
    if (!users[existingAdminIdx].password) {
      users[existingAdminIdx] = {
        ...users[existingAdminIdx],
        username: 'admin',
        password: 'Team-Nogardd123',
      };
      saveData(STORAGE_KEYS.USERS, users);
    }
  }

  let currentUser = loadData<UserAccount | null>(
    STORAGE_KEYS.CURRENT_USER,
    defaultAdmin
  );

  if (currentUser) {
    // If current user is admin, guarantee password is synchronized
    const matchingUser = users.find((u) => u.id === currentUser?.id || u.username === currentUser?.username);
    if (matchingUser) {
      currentUser = matchingUser;
    }
  } else {
    currentUser = defaultAdmin;
  }

  return {
    residents: loadData<Resident[]>(STORAGE_KEYS.RESIDENTS, initialResidents),
    contributions: loadData<Contribution[]>(STORAGE_KEYS.CONTRIBUTIONS, initialContributions),
    expenses: loadData<Expense[]>(STORAGE_KEYS.EXPENSES, initialExpenses),
    shifts: loadData<MaintenanceShift[]>(STORAGE_KEYS.SHIFTS, initialShifts),
    incidents: loadData<Incident[]>(STORAGE_KEYS.INCIDENTS, initialIncidents),
    settings: loadData<CommunitySettings>(STORAGE_KEYS.SETTINGS, initialSettings),
    users,
    currentUser,
    indertDocs: loadData<IndertDocument[]>(STORAGE_KEYS.INDERT_DOCS, initialIndertDocuments),
    landRequests: loadData<LandRequest[]>(STORAGE_KEYS.LAND_REQUESTS, initialLandRequests),
    posts: loadData<CommunityPost[]>(STORAGE_KEYS.POSTS, initialCommunityPosts),
  };
};

export const saveAllAppState = (state: {
  residents: Resident[];
  contributions: Contribution[];
  expenses: Expense[];
  shifts: MaintenanceShift[];
  incidents: Incident[];
  settings: CommunitySettings;
  users: UserAccount[];
  currentUser: UserAccount | null;
  indertDocs: IndertDocument[];
  landRequests: LandRequest[];
  posts?: CommunityPost[];
}) => {
  saveData(STORAGE_KEYS.RESIDENTS, state.residents);
  saveData(STORAGE_KEYS.CONTRIBUTIONS, state.contributions);
  saveData(STORAGE_KEYS.EXPENSES, state.expenses);
  saveData(STORAGE_KEYS.SHIFTS, state.shifts);
  saveData(STORAGE_KEYS.INCIDENTS, state.incidents);
  saveData(STORAGE_KEYS.SETTINGS, state.settings);
  saveData(STORAGE_KEYS.USERS, state.users);
  saveData(STORAGE_KEYS.CURRENT_USER, state.currentUser);
  saveData(STORAGE_KEYS.INDERT_DOCS, state.indertDocs);
  saveData(STORAGE_KEYS.LAND_REQUESTS, state.landRequests);
  if (state.posts) {
    saveData(STORAGE_KEYS.POSTS, state.posts);
  }
};

export const resetToDemoData = () => {
  localStorage.removeItem(STORAGE_KEYS.RESIDENTS);
  localStorage.removeItem(STORAGE_KEYS.CONTRIBUTIONS);
  localStorage.removeItem(STORAGE_KEYS.EXPENSES);
  localStorage.removeItem(STORAGE_KEYS.SHIFTS);
  localStorage.removeItem(STORAGE_KEYS.INCIDENTS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.USERS);
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  localStorage.removeItem(STORAGE_KEYS.INDERT_DOCS);
  localStorage.removeItem(STORAGE_KEYS.LAND_REQUESTS);
  localStorage.removeItem(STORAGE_KEYS.POSTS);
  return {
    residents: initialResidents,
    contributions: initialContributions,
    expenses: initialExpenses,
    shifts: initialShifts,
    incidents: initialIncidents,
    settings: initialSettings,
    users: initialUsers,
    currentUser: initialUsers[0],
    indertDocs: initialIndertDocuments,
    landRequests: initialLandRequests,
    posts: initialCommunityPosts,
  };
};


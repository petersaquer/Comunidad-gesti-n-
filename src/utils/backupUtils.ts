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

export interface FullBackupData {
  version: string;
  exportedAt: string;
  systemName: string;
  stats: {
    residentsCount: number;
    contributionsCount: number;
    expensesCount: number;
    shiftsCount: number;
    incidentsCount: number;
    indertDocsCount: number;
    usersCount: number;
    landRequestsCount: number;
    postsCount?: number;
  };
  data: {
    residents: Resident[];
    contributions: Contribution[];
    expenses: Expense[];
    shifts: MaintenanceShift[];
    incidents: Incident[];
    settings: CommunitySettings;
    users: UserAccount[];
    indertDocs: IndertDocument[];
    landRequests: LandRequest[];
    posts?: CommunityPost[];
  };
}

/**
 * Exports the entire database as a downloadable JSON file
 */
export const downloadCompleteJSONBackup = (state: {
  residents: Resident[];
  contributions: Contribution[];
  expenses: Expense[];
  shifts: MaintenanceShift[];
  incidents: Incident[];
  settings: CommunitySettings;
  users: UserAccount[];
  indertDocs: IndertDocument[];
  landRequests: LandRequest[];
  posts?: CommunityPost[];
}) => {
  const backup: FullBackupData = {
    version: '2.0-S16-INDERT',
    exportedAt: new Date().toISOString(),
    systemName: state.settings.appName || 'S16 - Gestión Comunitaria INDERT',
    stats: {
      residentsCount: state.residents.length,
      contributionsCount: state.contributions.length,
      expensesCount: state.expenses.length,
      shiftsCount: state.shifts.length,
      incidentsCount: state.incidents.length,
      indertDocsCount: state.indertDocs.length,
      usersCount: state.users.length,
      landRequestsCount: state.landRequests.length,
      postsCount: state.posts ? state.posts.length : 0,
    },
    data: {
      residents: state.residents,
      contributions: state.contributions,
      expenses: state.expenses,
      shifts: state.shifts,
      incidents: state.incidents,
      settings: state.settings,
      users: state.users,
      indertDocs: state.indertDocs,
      landRequests: state.landRequests,
      posts: state.posts,
    },
  };

  const jsonStr = JSON.stringify(backup, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const dateStr = new Date().toISOString().split('T')[0];

  const link = document.createElement('a');
  link.href = url;
  link.download = `Copia_Seguridad_S16_${dateStr}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Parses and validates a JSON backup file uploaded by the admin
 */
export const parseAndValidateJSONBackup = (
  fileContent: string
): { success: boolean; data?: FullBackupData['data']; error?: string } => {
  try {
    const parsed = JSON.parse(fileContent);

    // Support both direct state or structured backup format
    const dataCandidate = parsed.data || parsed;

    if (!Array.isArray(dataCandidate.residents)) {
      return { success: false, error: 'El archivo no contiene un padrón válido de residentes (array "residents").' };
    }

    if (!Array.isArray(dataCandidate.contributions)) {
      return { success: false, error: 'El archivo no contiene registros contables válidos (array "contributions").' };
    }

    if (!dataCandidate.settings || typeof dataCandidate.settings !== 'object') {
      return { success: false, error: 'El archivo no contiene la configuración comunitaria ("settings").' };
    }

    return {
      success: true,
      data: {
        residents: dataCandidate.residents,
        contributions: dataCandidate.contributions || [],
        expenses: Array.isArray(dataCandidate.expenses) ? dataCandidate.expenses : [],
        shifts: Array.isArray(dataCandidate.shifts) ? dataCandidate.shifts : [],
        incidents: Array.isArray(dataCandidate.incidents) ? dataCandidate.incidents : [],
        settings: dataCandidate.settings,
        users: Array.isArray(dataCandidate.users) ? dataCandidate.users : [],
        indertDocs: Array.isArray(dataCandidate.indertDocs) ? dataCandidate.indertDocs : [],
        landRequests: Array.isArray(dataCandidate.landRequests) ? dataCandidate.landRequests : [],
        posts: Array.isArray(dataCandidate.posts) ? dataCandidate.posts : [],
      },
    };
  } catch (err: any) {
    return { success: false, error: `Error de sintaxis JSON: ${err?.message || 'Archivo dañado o inválido'}` };
  }
};

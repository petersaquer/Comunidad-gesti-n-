import React, { useState, useEffect } from 'react';
import {
  Users,
  DollarSign,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  ShieldAlert,
  Landmark,
  Home,
  UserCheck,
  Crown,
  KeyRound,
  Sliders,
  BookOpen,
  Scale,
} from 'lucide-react';
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
  LandRequestStatus,
  RelocationRecord,
  CommunityPost,
  PostComment,
} from './types';
import {
  getInitialAppState,
  saveAllAppState,
  resetToDemoData,
} from './utils/storage';
import {
  fetchStateFromSQLite,
  syncStateToSQLite,
  resetSQLiteOnServer,
} from './utils/sqliteClient';
import { FacebookHeader } from './components/FacebookHeader';
import { FacebookStories } from './components/FacebookStories';
import { MobileBottomNav } from './components/MobileBottomNav';
import { CommunityFeedTab } from './components/CommunityFeedTab';
import { IndertDocsTab } from './components/IndertDocsTab';
import { ResidentsTab } from './components/ResidentsTab';
import { FinancesTab } from './components/FinancesTab';
import { BalanceTab } from './components/BalanceTab';
import { ShiftsTab } from './components/ShiftsTab';
import { IncidentsTab } from './components/IncidentsTab';
import { AntiFraudTab } from './components/AntiFraudTab';
import { ResidentPortalView } from './components/ResidentPortalView';
import { AdminSettingsTab } from './components/AdminSettingsTab';

// Modals
import { AuthModal } from './components/AuthModal';
import { GoogleSignInModal } from './components/GoogleSignInModal';
import { IndertDocModal } from './components/IndertDocModal';
import { ResidentModal } from './components/ResidentModal';
import { ContributionModal } from './components/ContributionModal';
import { ExpenseModal } from './components/ExpenseModal';
import { ShiftModal } from './components/ShiftModal';
import { IncidentModal } from './components/IncidentModal';
import { ResidentDetailModal } from './components/ResidentDetailModal';
import { LandRequestModal } from './components/LandRequestModal';
import { RelocateResidentModal } from './components/RelocateResidentModal';
import { UserManagementModal } from './components/UserManagementModal';
import { ChangePasswordModal } from './components/ChangePasswordModal';
import { CommunityGuideModal } from './components/CommunityGuideModal';
import { LegalTermsPrivacyModal } from './components/LegalTermsPrivacyModal';

export default function App() {
  // Application State initialized from localStorage or initial dataset
  const [appState, setAppState] = useState(getInitialAppState);

  const {
    residents,
    contributions,
    expenses,
    shifts,
    incidents,
    settings,
    users,
    currentUser,
    indertDocs,
    landRequests,
  } = appState;

  // Active Tab: default to 'feed' (Facebook Wall) or 'indert'
  const [activeTab, setActiveTab] = useState<
    | 'feed'
    | 'indert'
    | 'residents'
    | 'finances'
    | 'balance'
    | 'shifts'
    | 'incidents'
    | 'antifraud'
    | 'my_account'
    | 'admin_settings'
  >('feed');

  // Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isGoogleSignInOpen, setIsGoogleSignInOpen] = useState(false);

  const [isIndertDocModalOpen, setIsIndertDocModalOpen] = useState(false);
  const [editingIndertDoc, setEditingIndertDoc] = useState<IndertDocument | null>(null);

  const [isResidentModalOpen, setIsResidentModalOpen] = useState(false);
  const [editingResident, setEditingResident] = useState<Resident | null>(null);

  const [isLandRequestModalOpen, setIsLandRequestModalOpen] = useState(false);
  const [editingLandRequest, setEditingLandRequest] = useState<LandRequest | null>(null);

  const [isRelocateModalOpen, setIsRelocateModalOpen] = useState(false);
  const [residentForRelocation, setResidentForRelocation] = useState<Resident | null>(null);

  const [isContributionModalOpen, setIsContributionModalOpen] = useState(false);
  const [editingContribution, setEditingContribution] = useState<Contribution | null>(null);
  const [targetResidentForContribution, setTargetResidentForContribution] = useState<string | null>(
    null
  );

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<MaintenanceShift | null>(null);

  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<Incident | null>(null);

  const [selectedResidentForDetail, setSelectedResidentForDetail] = useState<Resident | null>(null);
  const [isUserManagementModalOpen, setIsUserManagementModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);
  const [isCommunityGuideModalOpen, setIsCommunityGuideModalOpen] = useState(false);
  const [isLegalTermsModalOpen, setIsLegalTermsModalOpen] = useState(false);
  const [legalTermsDefaultTab, setLegalTermsDefaultTab] = useState<
    'disclaimer' | 'terms' | 'privacy' | 'transparency'
  >('disclaimer');

  // Load initial state from native SQLite database on boot
  useEffect(() => {
    fetchStateFromSQLite().then((sqliteData) => {
      if (sqliteData) {
        setAppState((prev) => ({
          ...prev,
          ...sqliteData,
          currentUser: prev.currentUser, // preserve session
        }));
      }
    });
  }, []);

  // Synchronize with LocalStorage and SQLite on any change
  useEffect(() => {
    saveAllAppState(appState);
    syncStateToSQLite(appState);
  }, [appState]);

  // Auth Handlers
  const handleLogin = (user: UserAccount) => {
    setAppState((prev) => ({
      ...prev,
      currentUser: user,
    }));
    setIsAuthModalOpen(false);
  };

  const handleChangePassword = (newPassword: string) => {
    if (!currentUser) return;
    setAppState((prev) => {
      const updatedUsers = prev.users.map((u) =>
        u.id === currentUser.id ? { ...u, password: newPassword } : u
      );
      const updatedCurrentUser: UserAccount = {
        ...currentUser,
        password: newPassword,
      };
      return {
        ...prev,
        users: updatedUsers,
        currentUser: updatedCurrentUser,
      };
    });
  };

  const handleSaveUser = (userToSave: UserAccount) => {
    setAppState((prev) => {
      const idx = prev.users.findIndex((u) => u.id === userToSave.id);
      const updatedUsers =
        idx >= 0
          ? prev.users.map((u, i) => (i === idx ? userToSave : u))
          : [userToSave, ...prev.users];

      const updatedCurrentUser =
        prev.currentUser?.id === userToSave.id ? userToSave : prev.currentUser;

      return {
        ...prev,
        users: updatedUsers,
        currentUser: updatedCurrentUser,
      };
    });
  };

  const handleDeleteUser = (userId: string) => {
    setAppState((prev) => ({
      ...prev,
      users: prev.users.filter((u) => u.id !== userId),
      currentUser: prev.currentUser?.id === userId ? null : prev.currentUser,
    }));
  };

  const handleSwitchUser = (user: UserAccount) => {
    setAppState((prev) => ({
      ...prev,
      currentUser: user,
    }));
  };

  const handleRegister = (newUser: UserAccount, residentData?: Partial<Resident>) => {
    setAppState((prev) => {
      // Check if user already exists
      const existingUserIdx = prev.users.findIndex(
        (u) => u.id === newUser.id || u.documentId.toLowerCase() === newUser.documentId.toLowerCase()
      );
      const updatedUsers =
        existingUserIdx >= 0
          ? prev.users.map((u, i) => (i === existingUserIdx ? { ...u, ...newUser } : u))
          : [newUser, ...prev.users];

      let updatedResidents = prev.residents;
      // If the registered user has block and lot, ensure resident record exists or update it
      if (newUser.block && newUser.lot) {
        const existingRes = prev.residents.find(
          (r) =>
            (r.block === newUser.block && r.lot === newUser.lot) ||
            r.documentId.toLowerCase() === newUser.documentId.toLowerCase()
        );
        if (!existingRes) {
          const newRes: Resident = {
            id: `res-${Date.now()}`,
            fullName: newUser.fullName,
            documentId: newUser.documentId,
            phone: newUser.phone,
            barrio: newUser.barrio || residentData?.barrio || 'Sector 16',
            block: newUser.block,
            lot: newUser.lot,
            sector: residentData?.sector || `Sector 16 - Mz ${newUser.block}`,
            occupationDate: residentData?.occupationDate || new Date().toISOString().split('T')[0],
            familyMembersCount: residentData?.familyMembersCount || 4,
            status: 'active',
            maritalStatus: residentData?.maritalStatus || 'soltero',
            hasPartner: !!residentData?.hasPartner,
            partnerName: residentData?.partnerName,
            partnerDocumentId: residentData?.partnerDocumentId,
            childrenCount: residentData?.childrenCount ?? 0,
            hasChildrenWithDisability: !!residentData?.hasChildrenWithDisability,
            disabilityDetails: residentData?.disabilityDetails,
            documentFrontUrl: residentData?.documentFrontUrl,
            documentBackUrl: residentData?.documentBackUrl,
            previousSettlementHistory: 'Sin antecedentes previos',
            isFraudRisk: false,
            fraudNotes: '',
            notes: `Registrado vía portal usuario INDERT (${newUser.email || 'sin email'})`,
          };
          updatedResidents = [newRes, ...prev.residents];
        }
      }

      return {
        ...prev,
        users: updatedUsers,
        currentUser: newUser,
        residents: updatedResidents,
      };
    });
    setIsAuthModalOpen(false);
  };

  const handleGoogleLoginSuccess = (user: UserAccount, residentData?: Partial<Resident>) => {
    handleRegister(user, residentData);
    setIsGoogleSignInOpen(false);
  };

  const handleLogout = () => {
    setAppState((prev) => ({
      ...prev,
      currentUser: null,
    }));
  };

  // Administration Settings and Backup Handlers
  const handleUpdateSettings = (newSettings: CommunitySettings) => {
    setAppState((prev) => ({
      ...prev,
      settings: newSettings,
    }));
  };

  const handleRestoreBackup = (importedData: any) => {
    setAppState((prev) => ({
      ...prev,
      residents: importedData.residents || prev.residents,
      contributions: importedData.contributions || prev.contributions,
      expenses: importedData.expenses || prev.expenses,
      shifts: importedData.shifts || prev.shifts,
      incidents: importedData.incidents || prev.incidents,
      settings: importedData.settings || prev.settings,
      users: importedData.users || prev.users,
      indertDocs: importedData.indertDocs || prev.indertDocs,
      landRequests: importedData.landRequests || prev.landRequests,
      posts: importedData.posts || prev.posts,
    }));
  };

  // INDERT Documents Handlers
  const handleSaveIndertDoc = (doc: IndertDocument) => {
    setAppState((prev) => {
      const exists = prev.indertDocs.some((d) => d.id === doc.id);
      const updated = exists
        ? prev.indertDocs.map((d) => (d.id === doc.id ? doc : d))
        : [doc, ...prev.indertDocs];
      return { ...prev, indertDocs: updated };
    });
  };

  const handleDeleteIndertDoc = (id: string) => {
    const doc = appState.indertDocs.find((d) => d.id === id);
    if (settings.adminPolicies?.confirmDeletionIndertDocs !== false) {
      const ok = confirm(
        `[POLÍTICA DE SEGURIDAD DEL ADMINISTRADOR]\n\n¿Confirmas que deseas eliminar el documento oficial del INDERT:\n"${doc?.title || 'Documento'}"?\n\nEsta acción no se puede deshacer.`
      );
      if (!ok) return;
    }
    setAppState((prev) => ({
      ...prev,
      indertDocs: prev.indertDocs.filter((d) => d.id !== id),
    }));
  };

  // Handlers for Residents
  const handleSaveResident = (resident: Resident) => {
    setAppState((prev) => {
      const exists = prev.residents.some((r) => r.id === resident.id);
      const updated = exists
        ? prev.residents.map((r) => (r.id === resident.id ? resident : r))
        : [resident, ...prev.residents];
      return { ...prev, residents: updated };
    });
  };

  const handleDeleteResident = (id: string) => {
    const res = appState.residents.find((r) => r.id === id);
    if (settings.adminPolicies?.confirmDeletionResidents !== false) {
      const ok = confirm(
        `[POLÍTICA DE SEGURIDAD DEL ADMINISTRADOR]\n\n¿Confirmas que deseas eliminar del padrón al residente:\n"${res?.fullName || 'Residente'}" (Mz ${res?.block} Lote ${res?.lot})?\n\nSe eliminarán también sus recibos de aportes y registros asociados.`
      );
      if (!ok) return;
    }
    setAppState((prev) => ({
      ...prev,
      residents: prev.residents.filter((r) => r.id !== id),
      contributions: prev.contributions.filter((c) => c.residentId !== id),
      shifts: prev.shifts.filter((s) => s.assignedResidentId !== id),
    }));
  };

  // Handlers for Land Requests & Waiting List
  const handleSaveLandRequest = (request: LandRequest, autoPromoteToResident: boolean = false) => {
    setAppState((prev) => {
      const exists = prev.landRequests.some((r) => r.id === request.id);
      const updatedRequests = exists
        ? prev.landRequests.map((r) => (r.id === request.id ? request : r))
        : [request, ...prev.landRequests];

      let updatedResidents = prev.residents;

      // If approved and autoPromoteToResident, ensure resident exists or update
      if (autoPromoteToResident && request.status === 'aprobado' && request.assignedBlock && request.assignedLot) {
        // Overlap verification: check if another active resident occupies this slot
        const conflictingResident = prev.residents.find(
          (r) =>
            r.status === 'active' &&
            r.block.trim().toUpperCase() === request.assignedBlock!.trim().toUpperCase() &&
            r.lot.trim().toUpperCase() === request.assignedLot!.trim().toUpperCase() &&
            r.documentId.trim().toUpperCase() !== request.documentId.trim().toUpperCase()
        );

        const existingRes = prev.residents.find(
          (r) => r.documentId.trim().toLowerCase() === request.documentId.trim().toLowerCase()
        );

        const fraudRiskFlag = conflictingResident !== undefined;
        const conflictNotice = conflictingResident
          ? `[Alerta: Solapamiento con ${conflictingResident.fullName}, C.I. ${conflictingResident.documentId}] `
          : '';

        if (existingRes) {
          // Update location and link
          updatedResidents = prev.residents.map((r) =>
            r.id === existingRes.id
              ? {
                  ...r,
                  block: request.assignedBlock!,
                  lot: request.assignedLot!,
                  sector: request.targetSector || `Sector 16 - Mz ${request.assignedBlock}`,
                  phone: request.phone || r.phone,
                  isFraudRisk: fraudRiskFlag || r.isFraudRisk,
                  fraudNotes: conflictNotice + (r.fraudNotes || ''),
                  documentFrontUrl: request.documentFrontUrl || r.documentFrontUrl,
                  documentBackUrl: request.documentBackUrl || r.documentBackUrl,
                }
              : r
          );
        } else {
          // Create new active resident
          const newRes: Resident = {
            id: `res-${Date.now()}`,
            fullName: request.applicantName,
            documentId: request.documentId,
            phone: request.phone,
            barrio: request.barrio || 'Sector 16',
            block: request.assignedBlock!,
            lot: request.assignedLot!,
            sector: request.targetSector || `Sector 16 - Mz ${request.assignedBlock}`,
            occupationDate: new Date().toISOString().split('T')[0],
            familyMembersCount: request.familyMembersCount || 4,
            status: 'active',
            maritalStatus: request.maritalStatus || 'soltero',
            hasPartner: !!request.hasPartner,
            partnerName: request.partnerName,
            partnerDocumentId: request.partnerDocumentId,
            childrenCount: request.childrenCount ?? 0,
            hasChildrenWithDisability: !!request.hasChildrenWithDisability,
            disabilityDetails: request.disabilityDetails,
            documentFrontUrl: request.documentFrontUrl,
            documentBackUrl: request.documentBackUrl,
            previousSettlementHistory: 'Sin antecedentes conflictivos. Solicitud comunitaria aprobada.',
            isFraudRisk: fraudRiskFlag,
            fraudNotes: conflictNotice,
            notes: `Adjudicado formalmente por Comisión Vecinal (${request.decisionNotes || 'Aprobado'}).`,
          };
          updatedResidents = [newRes, ...prev.residents];
        }
      }

      return {
        ...prev,
        landRequests: updatedRequests,
        residents: updatedResidents,
      };
    });
  };

  const handleDeleteLandRequest = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      landRequests: prev.landRequests.filter((r) => r.id !== id),
    }));
  };

  const handleUpdateLandRequestStatus = (
    requestId: string,
    status: LandRequestStatus,
    notes?: string,
    missingDocs?: string
  ) => {
    setAppState((prev) => ({
      ...prev,
      landRequests: prev.landRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status,
              decisionNotes: notes !== undefined ? notes : r.decisionNotes,
              missingDocumentsNotes: missingDocs !== undefined ? missingDocs : r.missingDocumentsNotes,
              reviewedAt: new Date().toISOString().split('T')[0],
              reviewedBy: settings.presidentName,
            }
          : r
      ),
    }));
  };

  const handleApproveAndPromote = (
    request: LandRequest,
    assignedBlock: string,
    assignedLot: string
  ) => {
    const approvedRequest: LandRequest = {
      ...request,
      status: 'aprobado',
      assignedBlock,
      assignedLot,
      reviewedAt: new Date().toISOString().split('T')[0],
      reviewedBy: settings.presidentName,
      decisionNotes: `Aprobado y adjudicado en Manzana ${assignedBlock}, Lote ${assignedLot} en fecha ${new Date().toLocaleDateString('es-PY')}.`,
    };
    handleSaveLandRequest(approvedRequest, true);
  };

  // Handler for Resident Relocation (Cambio de Mz y Lote con historial)
  const handleConfirmRelocation = (
    residentId: string,
    relocationData: {
      newBlock: string;
      newLot: string;
      newSector: string;
      reason: string;
      actNumber: string;
      authorizedBy: string;
      notes?: string;
    }
  ) => {
    setAppState((prev) => {
      const resident = prev.residents.find((r) => r.id === residentId);
      if (!resident) return prev;

      const newRecord: RelocationRecord = {
        id: `reloc-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        fromBlock: resident.block,
        fromLot: resident.lot,
        fromSector: resident.sector,
        toBlock: relocationData.newBlock,
        toLot: relocationData.newLot,
        toSector: relocationData.newSector,
        reason: relocationData.reason,
        actNumber: relocationData.actNumber,
        authorizedBy: relocationData.authorizedBy,
        notes: relocationData.notes,
      };

      const existingHistory = resident.relocationHistory || [];
      const updatedResident: Resident = {
        ...resident,
        block: relocationData.newBlock,
        lot: relocationData.newLot,
        sector: relocationData.newSector,
        relocationHistory: [newRecord, ...existingHistory],
      };

      // Also update selectedResidentForDetail if it's currently open
      if (selectedResidentForDetail?.id === residentId) {
        setSelectedResidentForDetail(updatedResident);
      }

      // Sync linked user accounts with new block and lot
      const updatedUsers = prev.users.map((u) => {
        if (
          u.residentId === residentId ||
          (u.documentId && u.documentId.trim() === resident.documentId.trim())
        ) {
          return {
            ...u,
            block: relocationData.newBlock,
            lot: relocationData.newLot,
          };
        }
        return u;
      });

      const updatedCurrentUser =
        prev.currentUser &&
        (prev.currentUser.residentId === residentId ||
          (prev.currentUser.documentId && prev.currentUser.documentId.trim() === resident.documentId.trim()))
          ? {
              ...prev.currentUser,
              block: relocationData.newBlock,
              lot: relocationData.newLot,
            }
          : prev.currentUser;

      return {
        ...prev,
        residents: prev.residents.map((r) => (r.id === residentId ? updatedResident : r)),
        users: updatedUsers,
        currentUser: updatedCurrentUser,
      };
    });
  };

  // Handlers for Contributions
  const handleSaveContribution = (contribution: Contribution) => {
    setAppState((prev) => {
      const exists = prev.contributions.some((c) => c.id === contribution.id);
      const updated = exists
        ? prev.contributions.map((c) => (c.id === contribution.id ? contribution : c))
        : [contribution, ...prev.contributions];
      return { ...prev, contributions: updated };
    });
  };

  const handleDeleteContribution = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      contributions: prev.contributions.filter((c) => c.id !== id),
    }));
  };

  // Handlers for Expenses
  const handleSaveExpense = (expense: Expense) => {
    setAppState((prev) => {
      const exists = prev.expenses.some((e) => e.id === expense.id);
      const updated = exists
        ? prev.expenses.map((e) => (e.id === expense.id ? expense : e))
        : [expense, ...prev.expenses];
      return { ...prev, expenses: updated };
    });
  };

  const handleDeleteExpense = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((e) => e.id !== id),
    }));
  };

  // Handlers for Shifts (with automatic fine debt logging)
  const handleSaveShift = (shift: MaintenanceShift) => {
    setAppState((prev) => {
      const exists = prev.shifts.some((s) => s.id === shift.id);
      const updatedShifts = exists
        ? prev.shifts.map((s) => (s.id === shift.id ? shift : s))
        : [shift, ...prev.shifts];

      let updatedContributions = prev.contributions;

      // When marked absent with a fine, automatically create a fine contribution in the resident's account
      if (shift.status === 'absent' && shift.fineAmount && shift.fineAmount > 0) {
        const fineConcept = `Multa Faena: ${shift.taskTitle} (${shift.dateScheduled})`;
        const alreadyLogged = prev.contributions.some(
          (c) =>
            c.residentId === shift.assignedResidentId &&
            c.category === 'multa' &&
            c.concept === fineConcept
        );

        if (!alreadyLogged) {
          const fineContribution: Contribution = {
            id: `fine-${shift.id}-${Date.now()}`,
            residentId: shift.assignedResidentId,
            residentName: shift.assignedResidentName,
            documentId: prev.residents.find((r) => r.id === shift.assignedResidentId)?.documentId || '',
            block: shift.block,
            lot: shift.lot,
            category: 'multa',
            concept: fineConcept,
            amount: shift.fineAmount,
            amountPaid: 0,
            date: shift.dateScheduled,
            month: shift.dateScheduled.slice(0, 7) || new Date().toISOString().slice(0, 7),
            status: 'pending',
            receiptNumber: '',
            paymentMethod: 'efectivo',
            notes: shift.completionNotes || 'Multa generada automáticamente por inasistencia sin reemplazo.',
          };
          updatedContributions = [fineContribution, ...prev.contributions];
        }
      }

      return {
        ...prev,
        shifts: updatedShifts,
        contributions: updatedContributions,
      };
    });
  };

  const handleDeleteShift = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      shifts: prev.shifts.filter((s) => s.id !== id),
    }));
  };

  // Handlers for Incidents
  const handleSaveIncident = (incident: Incident) => {
    setAppState((prev) => {
      const exists = prev.incidents.some((i) => i.id === incident.id);
      const updated = exists
        ? prev.incidents.map((i) => (i.id === incident.id ? incident : i))
        : [incident, ...prev.incidents];
      return { ...prev, incidents: updated };
    });
  };

  const handleDeleteIncident = (id: string) => {
    setAppState((prev) => ({
      ...prev,
      incidents: prev.incidents.filter((i) => i.id !== id),
    }));
  };

  // Handlers for Community Posts (SQLite)
  const handleSavePost = (post: CommunityPost) => {
    setAppState((prev) => {
      const currentPosts = prev.posts || [];
      const exists = currentPosts.some((p) => p.id === post.id);
      const updated = exists
        ? currentPosts.map((p) => (p.id === post.id ? post : p))
        : [post, ...currentPosts];
      return { ...prev, posts: updated };
    });
  };

  const handleLikePost = (postId: string) => {
    setAppState((prev) => {
      const currentPosts = prev.posts || [];
      const updated = currentPosts.map((p) => {
        if (p.id === postId) {
          const hasLiked = !p.hasLiked;
          return {
            ...p,
            hasLiked,
            likes: hasLiked ? p.likes + 1 : Math.max(0, p.likes - 1),
          };
        }
        return p;
      });
      return { ...prev, posts: updated };
    });
  };

  const handleAddComment = (postId: string, comment: PostComment) => {
    setAppState((prev) => {
      const currentPosts = prev.posts || [];
      const updated = currentPosts.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            comments: [...(p.comments || []), comment],
          };
        }
        return p;
      });
      return { ...prev, posts: updated };
    });
  };

  const handleDeletePost = (postId: string) => {
    setAppState((prev) => ({
      ...prev,
      posts: (prev.posts || []).filter((p) => p.id !== postId),
    }));
  };

  // Reset Data to Demo
  const handleResetData = async () => {
    if (
      confirm(
        '¿Desea restaurar la base de datos SQLite y datos de demostración con los expedientes INDERT, residentes, lotes, aportes y faenas iniciales?'
      )
    ) {
      const serverData = await resetSQLiteOnServer();
      if (serverData) {
        setAppState((prev) => ({
          ...serverData,
          currentUser: prev.currentUser,
        }));
      } else {
        setAppState(resetToDemoData());
      }
    }
  };

  // Helper to open contribution modal pre-selecting a resident
  const handleOpenContributionForResident = (resident: Resident) => {
    setTargetResidentForContribution(resident.id);
    setEditingContribution(null);
    setIsContributionModalOpen(true);
  };

  // Match current user to resident if any
  const matchedResident = currentUser
    ? residents.find(
        (r) =>
          r.documentId === currentUser.documentId ||
          (r.block === currentUser.block && r.lot === currentUser.lot)
      ) || null
    : null;

  // -- Data Filtering by Barrio for Regular Users --
  // Admin and users with specific permissions see everything.
  // Regular users only see their own barrio's data.
  const isSuperUser = currentUser && (
    currentUser.role === 'admin' ||
    currentUser.permissions?.canManageResidents ||
    currentUser.permissions?.canManageFinances ||
    currentUser.permissions?.canManageIndertDocs
  );

  const displayResidents = isSuperUser
    ? residents
    : (currentUser?.barrio ? residents.filter(r => r.barrio === currentUser.barrio) : []);

  const displayIndertDocs = isSuperUser
    ? indertDocs
    : (currentUser?.barrio ? indertDocs.filter(d => {
        if (!d.residentId) return true; // Community-wide docs
        const res = residents.find(r => r.id === d.residentId);
        return res?.barrio === currentUser.barrio;
      }) : []);

  const displayContributions = isSuperUser
    ? contributions
    : (currentUser?.barrio ? contributions.filter(c => {
        const res = residents.find(r => r.id === c.residentId);
        return res?.barrio === currentUser.barrio;
      }) : []);

  const pendingDebtorsCount = new Set(
    displayContributions.filter((c) => c.amount > c.amountPaid).map((c) => c.residentId)
  ).size;

  const urgentIncidentsCount = incidents.filter(
    (i) => (i.priority === 'urgente' || i.priority === 'alta') && i.status !== 'resuelta'
  ).length;

  const fraudAlertsCount = displayResidents.filter((r) => r.isFraudRisk).length;

  return (
    <div className="min-h-screen bg-[#F0F2F5] text-slate-900 flex flex-col font-sans selection:bg-[#1877F2] selection:text-white pb-16 lg:pb-6 w-full overflow-x-hidden">
      {/* Facebook Themed Header */}
      <FacebookHeader
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as any)}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        residents={residents}
        contributions={contributions}
        expenses={expenses}
        shifts={shifts}
        incidents={incidents}
        indertDocs={indertDocs}
        settings={settings}
        onOpenNewResident={() => {
          setEditingResident(null);
          setIsResidentModalOpen(true);
        }}
        onOpenNewLandRequest={() => {
          setEditingLandRequest(null);
          setIsLandRequestModalOpen(true);
        }}
        onOpenNewContribution={() => {
          setTargetResidentForContribution(null);
          setEditingContribution(null);
          setIsContributionModalOpen(true);
        }}
        onOpenNewExpense={() => {
          setEditingExpense(null);
          setIsExpenseModalOpen(true);
        }}
        onOpenNewShift={() => {
          setEditingShift(null);
          setIsShiftModalOpen(true);
        }}
        onOpenNewIncident={() => {
          setEditingIncident(null);
          setIsIncidentModalOpen(true);
        }}
        onOpenNewIndertDoc={() => {
          setEditingIndertDoc(null);
          setIsIndertDocModalOpen(true);
        }}
        onOpenUserManagementModal={
          currentUser && (currentUser.role === 'admin' || currentUser.permissions?.canManageUsers)
            ? () => setIsUserManagementModalOpen(true)
            : undefined
        }
        onOpenChangePasswordModal={() => setIsChangePasswordModalOpen(true)}
        onOpenCommunityGuideModal={() => setIsCommunityGuideModalOpen(true)}
        onOpenLegalTermsModal={() => {
          setLegalTermsDefaultTab('disclaimer');
          setIsLegalTermsModalOpen(true);
        }}
        onResetData={handleResetData}
      />

      {/* Main Sub-Navigation Bar (Horizontal Pill Bar on tablet/desktop) */}
      <div className="bg-white border-b border-slate-200 shadow-2xs w-full overflow-hidden">
        <div className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8">
          <div className="flex items-center overflow-x-auto py-2 sm:py-2.5 gap-1.5 sm:gap-2 no-scrollbar text-xs sm:text-sm min-w-0">
            <div className="w-max flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-full justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setActiveTab('feed')}
                className={`py-1.5 px-3 sm:px-3.5 rounded-full font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'feed'
                    ? 'bg-[#1877F2] text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Muro & Noticias</span>
              </button>

              {currentUser && (currentUser.role === 'admin' || currentUser.permissions?.canManageIndertDocs) && (
                <button
                  id="subnav-indert-docs"
                  onClick={() => setActiveTab('indert')}
                  className={`py-1.5 px-3 sm:px-3.5 rounded-full font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'indert'
                      ? 'bg-[#1877F2] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Landmark className="w-4 h-4" />
                  <span>Documentos INDERT</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      activeTab === 'indert'
                        ? 'bg-blue-800 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {indertDocs.length}
                  </span>
                </button>
              )}

              {currentUser && (currentUser.role === 'admin' || currentUser.permissions?.canManageResidents) && (
                <button
                  id="subnav-residents"
                  onClick={() => setActiveTab('residents')}
                  className={`py-1.5 px-3 sm:px-3.5 rounded-full font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'residents'
                      ? 'bg-[#1877F2] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Padrón & Lotes</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      activeTab === 'residents'
                        ? 'bg-blue-800 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {residents.length}
                  </span>
                </button>
              )}

              {currentUser && (currentUser.role === 'admin' || currentUser.permissions?.canManageFinances) && (
                <>
                  <button
                    id="subnav-finances"
                    onClick={() => setActiveTab('finances')}
                    className={`py-1.5 px-3 sm:px-3.5 rounded-full font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                      activeTab === 'finances'
                        ? 'bg-[#1877F2] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>Aportes & Gastos</span>
                    {pendingDebtorsCount > 0 && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        {pendingDebtorsCount} pendientes
                      </span>
                    )}
                  </button>

                  <button
                    id="subnav-balance"
                    onClick={() => setActiveTab('balance')}
                    className={`py-1.5 px-3 sm:px-3.5 rounded-full font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                      activeTab === 'balance'
                        ? 'bg-[#1877F2] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Balance Mensual</span>
                  </button>
                </>
              )}

              {currentUser && (currentUser.role === 'admin' || currentUser.permissions?.canManageShifts) && (
                <button
                  id="subnav-shifts"
                  onClick={() => setActiveTab('shifts')}
                  className={`py-1.5 px-3 sm:px-3.5 rounded-full font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'shifts'
                      ? 'bg-[#1877F2] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Faenas & Turnos</span>
                </button>
              )}

              {currentUser && (currentUser.role === 'admin' || currentUser.permissions?.canManageIncidents) && (
                <button
                  id="subnav-incidents"
                  onClick={() => setActiveTab('incidents')}
                  className={`py-1.5 px-3 sm:px-3.5 rounded-full font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'incidents'
                      ? 'bg-[#1877F2] text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  <span>Incidencias</span>
                  {urgentIncidentsCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-amber-500 text-white">
                      {urgentIncidentsCount}
                    </span>
                  )}
                </button>
              )}

              {currentUser && (currentUser.role === 'admin' || currentUser.permissions?.canManageResidents) && (
                <button
                  id="subnav-antifraud"
                  onClick={() => setActiveTab('antifraud')}
                  className={`py-1.5 px-3 sm:px-3.5 rounded-full font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'antifraud'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Control Anti-Fraude</span>
                  {fraudAlertsCount > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-200 text-rose-800">
                      {fraudAlertsCount}
                    </span>
                  )}
                </button>
              )}

              {currentUser && currentUser.role === 'admin' && (
                <button
                  id="subnav-admin-settings"
                  onClick={() => setActiveTab('admin_settings')}
                  className={`py-1.5 px-3 sm:px-3.5 rounded-full font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'admin_settings'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Panel de Configuración de la Administración"
                >
                  <Sliders className="w-4 h-4 text-blue-500" />
                  <span>Configuración Admin</span>
                </button>
              )}
            </div>

            {/* Right side actions: Community Guide + Legal/Privacy + Roles Hub + Occupant Portal */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                id="subnav-community-guide"
                onClick={() => setIsCommunityGuideModalOpen(true)}
                className="py-1.5 px-3 rounded-full font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-300 shadow-2xs"
                title="Guía Comunitaria y Manifiesto de Transparencia (Descarga en PDF)"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-950" />
                <span>Guía Comunitaria (PDF)</span>
              </button>

              <button
                id="subnav-legal-terms"
                onClick={() => {
                  setLegalTermsDefaultTab('disclaimer');
                  setIsLegalTermsModalOpen(true);
                }}
                className="py-1.5 px-3 rounded-full font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 shadow-2xs"
                title="Marco Legal, Descargo no oficial, Términos y Privacidad"
              >
                <Scale className="w-3.5 h-3.5 text-indigo-700" />
                <span className="hidden xs:inline">Legal &amp; Privacidad</span>
              </button>

              {currentUser && (currentUser.role === 'admin' || currentUser.permissions?.canManageUsers) && (
                <button
                  id="subnav-manage-roles"
                  onClick={() => setIsUserManagementModalOpen(true)}
                  className="py-1.5 px-3 rounded-full font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer text-xs bg-linear-to-r from-amber-50 to-yellow-100 hover:from-amber-100 hover:to-amber-200 text-amber-950 border border-amber-300 shadow-2xs"
                  title="Gestión de Administradores, Tesorera e Insignias Comunitarias"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">Roles & Permisos</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-white font-black">
                    Admin
                  </span>
                </button>
              )}

              <button
                id="subnav-my-account"
                onClick={() => {
                  if (!currentUser) {
                    setIsAuthModalOpen(true);
                  } else {
                    setActiveTab('my_account');
                  }
                }}
                className={`py-1.5 px-3 sm:px-4 rounded-full font-bold flex items-center gap-1.5 whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  activeTab === 'my_account'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>
                  {currentUser ? `Mi Lote (${currentUser.fullName.split(' ')[0]})` : 'Acceso Ocupantes'}
                </span>
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Facebook Stories Carousel shown on Feed */}
        {activeTab === 'feed' && (
          <div className="mb-4">
            <FacebookStories
              currentUser={currentUser}
              settings={settings}
              onOpenNewDoc={() => {
                setEditingIndertDoc(null);
                setIsIndertDocModalOpen(true);
              }}
              onSelectTab={(tab) => setActiveTab(tab as any)}
            />
          </div>
        )}

        {/* Tab 1: Community Feed (Facebook Wall) */}
        {activeTab === 'feed' && (
          <CommunityFeedTab
            currentUser={currentUser}
            settings={settings}
            indertDocs={displayIndertDocs}
            contributions={displayContributions}
            expenses={expenses}
            residents={displayResidents}
            posts={appState.posts}
            onSavePost={handleSavePost}
            onToggleLike={handleLikePost}
            onAddComment={handleAddComment}
            onDeletePost={handleDeletePost}
            onOpenNewDoc={() => {
              setEditingIndertDoc(null);
              setIsIndertDocModalOpen(true);
            }}
            onOpenNewContribution={() => {
              setTargetResidentForContribution(null);
              setEditingContribution(null);
              setIsContributionModalOpen(true);
            }}
            onSelectTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {/* Tab 2: INDERT Documentation & Expense Invoices */}
        {activeTab === 'indert' && !currentUser && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <ShieldAlert className="w-12 h-12 text-rose-300 mb-3" />
            <p className="font-bold text-lg">Acceso Restringido</p>
            <p className="text-sm">Inicia sesión para ver los documentos INDERT.</p>
          </div>
        )}
        {activeTab === 'indert' && currentUser && (
          <IndertDocsTab
            documents={displayIndertDocs}
            settings={settings}
            currentUser={currentUser}
            onOpenNewDoc={() => {
              setEditingIndertDoc(null);
              setIsIndertDocModalOpen(true);
            }}
            onEditDoc={(doc) => {
              setEditingIndertDoc(doc);
              setIsIndertDocModalOpen(true);
            }}
            onDeleteDoc={handleDeleteIndertDoc}
          />
        )}

        {/* Tab 3: Residents Census & Plots */}
        {activeTab === 'residents' && !currentUser && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <ShieldAlert className="w-12 h-12 text-rose-300 mb-3" />
            <p className="font-bold text-lg">Acceso Restringido</p>
            <p className="text-sm">Inicia sesión para ver el padrón de residentes.</p>
          </div>
        )}
        {activeTab === 'residents' && currentUser && (
          <ResidentsTab
            residents={displayResidents}
            contributions={displayContributions}
            shifts={shifts}
            settings={settings}
            landRequests={landRequests}
            users={users}
            currentUser={currentUser}
            onOpenNewResident={() => {
              setEditingResident(null);
              setIsResidentModalOpen(true);
            }}
            onEditResident={(res) => {
              setEditingResident(res);
              setIsResidentModalOpen(true);
            }}
            onDeleteResident={handleDeleteResident}
            onSelectResident={(res) => setSelectedResidentForDetail(res)}
            onOpenContributionForResident={handleOpenContributionForResident}
            onOpenRelocateModal={(res) => {
              setResidentForRelocation(res);
              setIsRelocateModalOpen(true);
            }}
            onOpenNewRequest={() => {
              setEditingLandRequest(null);
              setIsLandRequestModalOpen(true);
            }}
            onEditRequest={(req) => {
              setEditingLandRequest(req);
              setIsLandRequestModalOpen(true);
            }}
            onDeleteRequest={handleDeleteLandRequest}
            onApproveAndPromote={handleApproveAndPromote}
            onUpdateLandRequestStatus={handleUpdateLandRequestStatus}
          />
        )}

        {/* Tab 4: Finances & Contributions */}
        {activeTab === 'finances' && !currentUser && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <ShieldAlert className="w-12 h-12 text-rose-300 mb-3" />
            <p className="font-bold text-lg">Acceso Restringido</p>
            <p className="text-sm">Inicia sesión para ver las finanzas.</p>
          </div>
        )}
        {activeTab === 'finances' && currentUser && (
          <FinancesTab
            contributions={displayContributions}
            allContributions={contributions}
            expenses={expenses}
            residents={displayResidents}
            settings={settings}
            currentUser={currentUser}
            onOpenNewContribution={() => {
              setTargetResidentForContribution(null);
              setEditingContribution(null);
              setIsContributionModalOpen(true);
            }}
            onOpenNewExpense={() => {
              setEditingExpense(null);
              setIsExpenseModalOpen(true);
            }}
            onUpdateContribution={handleSaveContribution}
            onDeleteContribution={handleDeleteContribution}
            onDeleteExpense={handleDeleteExpense}
          />
        )}

        {/* Tab 5: Monthly Balance */}
        {activeTab === 'balance' && (!currentUser || (!currentUser.permissions?.canManageFinances && currentUser.role !== 'admin')) && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <ShieldAlert className="w-12 h-12 text-rose-300 mb-3" />
            <p className="font-bold text-lg">Acceso Restringido</p>
            <p className="text-sm">No tienes permisos para ver el balance mensual.</p>
          </div>
        )}
        {activeTab === 'balance' && currentUser && (currentUser.role === 'admin' || currentUser.permissions?.canManageFinances) && (
          <BalanceTab
            contributions={contributions}
            expenses={expenses}
            residents={residents}
            settings={settings}
          />
        )}

        {/* Tab 6: Shifts & Community Maintenance */}
        {activeTab === 'shifts' && (!currentUser || (!currentUser.permissions?.canManageShifts && currentUser.role !== 'admin')) && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <ShieldAlert className="w-12 h-12 text-rose-300 mb-3" />
            <p className="font-bold text-lg">Acceso Restringido</p>
            <p className="text-sm">No tienes permisos para ver faenas y turnos.</p>
          </div>
        )}
        {activeTab === 'shifts' && currentUser && (currentUser.role === 'admin' || currentUser.permissions?.canManageShifts) && (
          <ShiftsTab
            shifts={shifts}
            residents={residents}
            settings={settings}
            onOpenNewShift={() => {
              setEditingShift(null);
              setIsShiftModalOpen(true);
            }}
            onUpdateShift={handleSaveShift}
            onDeleteShift={handleDeleteShift}
          />
        )}

        {/* Tab 7: Incidents Panel */}
        {activeTab === 'incidents' && (!currentUser || (!currentUser.permissions?.canManageIncidents && currentUser.role !== 'admin')) && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <ShieldAlert className="w-12 h-12 text-rose-300 mb-3" />
            <p className="font-bold text-lg">Acceso Restringido</p>
            <p className="text-sm">No tienes permisos para ver las incidencias.</p>
          </div>
        )}
        {activeTab === 'incidents' && currentUser && (currentUser.role === 'admin' || currentUser.permissions?.canManageIncidents) && (
          <IncidentsTab
            incidents={incidents}
            residents={residents}
            onOpenNewIncident={() => {
              setEditingIncident(null);
              setIsIncidentModalOpen(true);
            }}
            onUpdateIncident={handleSaveIncident}
            onDeleteIncident={handleDeleteIncident}
          />
        )}

        {/* Tab 8: Anti-Fraud & Double Occupation */}
        {activeTab === 'antifraud' && (!currentUser || (!currentUser.permissions?.canManageResidents && currentUser.role !== 'admin')) && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <ShieldAlert className="w-12 h-12 text-rose-300 mb-3" />
            <p className="font-bold text-lg">Acceso Restringido</p>
            <p className="text-sm">No tienes permisos para acceder al control antifraude.</p>
          </div>
        )}
        {activeTab === 'antifraud' && currentUser && (currentUser.role === 'admin' || currentUser.permissions?.canManageResidents) && (
          <AntiFraudTab
            residents={residents}
            settings={settings}
            onSelectResident={(res) => setSelectedResidentForDetail(res)}
            onEditResident={(res) => {
              setEditingResident(res);
              setIsResidentModalOpen(true);
            }}
          />
        )}

        {/* Tab 9: My Account / Resident Portal */}
        {activeTab === 'my_account' && currentUser && (
          <ResidentPortalView
            currentUser={currentUser}
            resident={matchedResident}
            contributions={contributions}
            shifts={shifts}
            documents={indertDocs}
            settings={settings}
            onOpenNewContribution={(resId) => {
              setTargetResidentForContribution(resId);
              setEditingContribution(null);
              setIsContributionModalOpen(true);
            }}
            onOpenNewDoc={() => {
              setEditingIndertDoc(null);
              setIsIndertDocModalOpen(true);
            }}
            onOpenNewIncident={() => {
              setEditingIncident(null);
              setIsIncidentModalOpen(true);
            }}
            onSwitchUser={() => setIsAuthModalOpen(true)}
            onOpenChangePassword={() => setIsChangePasswordModalOpen(true)}
            onOpenCommunityGuideModal={() => setIsCommunityGuideModalOpen(true)}
            onOpenLegalTermsModal={() => {
              setLegalTermsDefaultTab('disclaimer');
              setIsLegalTermsModalOpen(true);
            }}
          />
        )}

        {/* Tab 10: Admin Settings & Configuration Dashboard */}
        {activeTab === 'admin_settings' && (
          <AdminSettingsTab
            settings={settings}
            currentUser={
              currentUser || {
                id: 'temp-admin',
                fullName: 'Administrador General',
                email: 'admin@sector16.com',
                documentId: '1.234.567',
                phone: '+595981234567',
                role: 'admin',
                status: 'active',
                createdAt: '2024-01-01',
                permissions: {
                  canManageResidents: true,
                  canManageFinances: true,
                  canManageShifts: true,
                  canManageIncidents: true,
                  canManageIndertDocs: true,
                  canManageUsers: true,
                },
              }
            }
            residents={residents}
            contributions={contributions}
            expenses={expenses}
            shifts={shifts}
            incidents={incidents}
            indertDocs={indertDocs}
            users={users}
            landRequests={landRequests}
            posts={appState.posts}
            onUpdateSettings={handleUpdateSettings}
            onRestoreBackup={handleRestoreBackup}
            onResetToDemoData={handleResetData}
            onOpenGoogleLoginModal={() => setIsGoogleSignInOpen(true)}
            onOpenUserManagementModal={() => setIsUserManagementModalOpen(true)}
          />
        )}

        {/* Global Community Disclaimer & Transparency Footer */}
        <footer className="mt-8 pt-6 pb-20 lg:pb-8 border-t border-slate-200 text-slate-500 text-xs">
          <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-2xs space-y-3 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-6">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-800 border border-rose-200">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  Uso Interno Comunitario • No Oficial del Estado
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Transparencia &amp; Caja Abierta
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Herramienta vecinal de autogestión para censo, registro de mejoras y control de aportes comunales en {settings.communityName}. Los documentos emitidos tienen carácter probatorio de ocupación pacífica gremial y no reemplazan títulos públicos emitidos por el INDERT o MUVH.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <button
                onClick={() => {
                  setLegalTermsDefaultTab('disclaimer');
                  setIsLegalTermsModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Scale className="w-3.5 h-3.5 text-indigo-600" />
                <span>Términos &amp; Privacidad</span>
              </button>
              <button
                onClick={() => setIsCommunityGuideModalOpen(true)}
                className="px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-400 hover:bg-amber-300 text-slate-950 border border-amber-300 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <BookOpen className="w-3.5 h-3.5 text-slate-950" />
                <span>Guía en PDF</span>
              </button>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 text-center mt-3">
            © {new Date().getFullYear()} {settings.communityName} • {settings.settlementLocation}, Paraguay • Expediente Matriz INDERT {settings.indertExpedienteNumber || '4821/2024'}
          </p>
        </footer>
      </main>

      {/* Mobile Bottom Navigation Bar (like Facebook app) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab as any)}
        currentUser={currentUser}
        pendingDebtsCount={pendingDebtorsCount}
      />

      {/* Modals */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onOpenGoogleSignIn={() => setIsGoogleSignInOpen(true)}
        existingUsers={users}
        existingResidents={residents}
      />

      <GoogleSignInModal
        isOpen={isGoogleSignInOpen}
        onClose={() => setIsGoogleSignInOpen(false)}
        onGoogleLoginSuccess={handleGoogleLoginSuccess}
        existingUsers={users}
        existingResidents={residents}
        settings={settings}
      />

      <IndertDocModal
        isOpen={isIndertDocModalOpen}
        onClose={() => {
          setIsIndertDocModalOpen(false);
          setEditingIndertDoc(null);
        }}
        onSave={handleSaveIndertDoc}
        currentUser={currentUser}
        residents={residents}
        settings={settings}
        initialDoc={editingIndertDoc}
      />

      <ResidentModal
        isOpen={isResidentModalOpen}
        onClose={() => {
          setIsResidentModalOpen(false);
          setEditingResident(null);
        }}
        onSave={handleSaveResident}
        initialResident={editingResident}
        existingResidents={residents}
      />

      <ContributionModal currentUser={currentUser}
        isOpen={isContributionModalOpen}
        onClose={() => {
          setIsContributionModalOpen(false);
          setEditingContribution(null);
          setTargetResidentForContribution(null);
        }}
        onSave={handleSaveContribution}
        residents={residents}
        initialContribution={editingContribution}
        selectedResidentId={targetResidentForContribution}
        settings={settings}
      />

      <ExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={() => {
          setIsExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        initialExpense={editingExpense}
        settings={settings}
      />

      <ShiftModal
        isOpen={isShiftModalOpen}
        onClose={() => {
          setIsShiftModalOpen(false);
          setEditingShift(null);
        }}
        onSave={handleSaveShift}
        residents={residents}
        initialShift={editingShift}
        settings={settings}
      />

      <IncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => {
          setIsIncidentModalOpen(false);
          setEditingIncident(null);
        }}
        onSave={handleSaveIncident}
        residents={residents}
        initialIncident={editingIncident}
      />

      <ResidentDetailModal
        resident={selectedResidentForDetail}
        contributions={contributions}
        shifts={shifts}
        settings={settings}
        currentUser={currentUser}
        onClose={() => setSelectedResidentForDetail(null)}
        onOpenContributionForResident={(res) => {
          setSelectedResidentForDetail(null);
          handleOpenContributionForResident(res);
        }}
        onOpenRelocateModal={(res) => {
          setResidentForRelocation(res);
          setIsRelocateModalOpen(true);
        }}
      />

      <LandRequestModal
        isOpen={isLandRequestModalOpen}
        onClose={() => {
          setIsLandRequestModalOpen(false);
          setEditingLandRequest(null);
        }}
        onSave={handleSaveLandRequest}
        initialRequest={editingLandRequest}
        existingResidents={residents}
        settings={settings}
      />

      <RelocateResidentModal
        isOpen={isRelocateModalOpen}
        onClose={() => {
          setIsRelocateModalOpen(false);
          setResidentForRelocation(null);
        }}
        resident={residentForRelocation}
        existingResidents={residents}
        settings={settings}
        onConfirmRelocation={handleConfirmRelocation}
      />

      <UserManagementModal
        isOpen={isUserManagementModalOpen}
        onClose={() => setIsUserManagementModalOpen(false)}
        users={users}
        currentUser={currentUser}
        onSaveUser={handleSaveUser}
        onDeleteUser={handleDeleteUser}
        onSwitchUser={handleSwitchUser}
      />

      {currentUser && (
        <ChangePasswordModal
          isOpen={isChangePasswordModalOpen}
          onClose={() => setIsChangePasswordModalOpen(false)}
          currentUser={currentUser}
          onSavePassword={handleChangePassword}
        />
      )}

      <CommunityGuideModal
        isOpen={isCommunityGuideModalOpen}
        onClose={() => setIsCommunityGuideModalOpen(false)}
        settings={settings}
      />

      <LegalTermsPrivacyModal
        isOpen={isLegalTermsModalOpen}
        onClose={() => setIsLegalTermsModalOpen(false)}
        settings={settings}
        initialTab={legalTermsDefaultTab}
        onOpenCommunityGuideModal={() => {
          setIsLegalTermsModalOpen(false);
          setIsCommunityGuideModalOpen(true);
        }}
      />
    </div>
  );
}

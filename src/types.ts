export type ResidentStatus = 'active' | 'transferred' | 'evicted' | 'flagged' | 'inactive';

export type MaritalStatus = 'soltero' | 'casado' | 'concubinato' | 'viudo' | 'divorciado';

export interface RelocationRecord {
  id: string;
  date: string; // YYYY-MM-DD
  fromBlock: string;
  fromLot: string;
  fromSector?: string;
  toBlock: string;
  toLot: string;
  toSector?: string;
  reason: string; // Ej: "Apertura de calle comunal", "Zona inundable / zanja", "Acuerdo vecinal INDERT"
  authorizedBy: string;
  actNumber?: string; // N° de Acta de asamblea o resolución
  notes?: string;
}

export interface Resident {
  id: string;
  fullName: string;
  documentId: string; // C.I. / Cédula / D.N.I.
  phone: string;
  barrio?: string; // Barrio o Asentamiento (ej: Sector 16, Asentamiento San Francisco)
  block: string; // Manzana (Mz)
  lot: string; // Lote
  sector: string; // Sector / Pasaje / Zona
  occupationDate: string; // Fecha de inicio de ocupación (YYYY-MM-DD)
  status: ResidentStatus;
  familyMembersCount: number;
  maritalStatus?: MaritalStatus; // Estado civil (soltero, casado, concubinato, viudo, divorciado)
  hasPartner?: boolean; // Si tiene pareja / cónyuge
  partnerName?: string; // Nombre y apellido de la pareja
  partnerDocumentId?: string; // C.I. de la pareja
  childrenCount?: number; // Cantidad de hijos
  hasChildrenWithDisability?: boolean; // Si tiene hijos con discapacidad
  disabilityDetails?: string; // Descripción de la discapacidad / necesidades especiales
  documentFrontUrl?: string; // Foto Cédula Frente / Anverso
  documentBackUrl?: string; // Foto Cédula Dorso / Reverso
  previousSettlementHistory: string; // Historial en otros asentamientos/terrenos
  isFraudRisk: boolean; // Alerta de doble ocupación o intento fraudulento
  fraudNotes: string; // Motivo de la alerta de fraude
  notes?: string;
  emergencyContact?: string;
  relocationHistory?: RelocationRecord[]; // Historial de reubicaciones de lote
}

export type LandRequestType = 'nuevo_lote' | 'reubicacion';

export type LandRequestStatus = 'pendiente' | 'aprobado' | 'falta_documentos' | 'denegado';

export interface LandRequest {
  id: string;
  applicantName: string;
  documentId: string; // C.I.
  phone: string;
  requestType: LandRequestType; // 'nuevo_lote' (persona recién llegada que quiere lote) | 'reubicacion'
  residentId?: string; // Si es reubicación, ID del residente actual
  barrio?: string;
  currentBlock?: string; // Mz actual si solicita reubicación
  currentLot?: string;   // Lote actual si solicita reubicación
  requestedBlock?: string; // Mz deseada o sugerida
  requestedLot?: string;   // Lote deseado o sugerido
  targetSector?: string;
  requestDate: string; // YYYY-MM-DD
  status: LandRequestStatus; // 'pendiente' | 'aprobado' | 'falta_documentos' | 'denegado'
  familyMembersCount: number;
  maritalStatus?: MaritalStatus;
  hasPartner?: boolean;
  partnerName?: string;
  partnerDocumentId?: string;
  childrenCount?: number;
  hasChildrenWithDisability?: boolean;
  disabilityDetails?: string;
  documentFrontUrl?: string;
  documentBackUrl?: string;
  missingDocumentsNotes?: string; // Qué documentos faltan (ej. falta dorso de C.I., certificado de vida y residencia)
  decisionNotes?: string; // Motivo de resolución, antecedentes, o condicionamientos
  assignedBlock?: string; // Mz asignada formalmente
  assignedLot?: string;   // Lote asignado formalmente
  reviewedBy?: string;    // Nombre del dirigente que revisó
  reviewedAt?: string;    // Fecha de resolución
}

export type ContributionCategory =
  | 'luz'
  | 'agua'
  | 'mantenimiento'
  | 'administrativo'
  | 'seguridad'
  | 'extraordinario'
  | 'multa';

export type PaymentStatus = 'paid' | 'pending' | 'partial';

export interface Contribution {
  id: string;
  residentId: string;
  residentName: string;
  documentId: string;
  block: string;
  lot: string;
  category: ContributionCategory;
  concept: string; // Ej: "Cuota Luz Comunitaria - Septiembre", "Pago Cisterna Agua Lote 12"
  amount: number;
  amountPaid: number;
  month: string; // Formato YYYY-MM
  date: string; // YYYY-MM-DD
  receiptNumber: string;
  paymentMethod: 'efectivo' | 'transferencia' | 'movil';
  status: PaymentStatus;
  notes?: string;
}

export type ExpenseCategory =
  | 'luz'
  | 'agua'
  | 'mantenimiento'
  | 'administrativo'
  | 'seguridad'
  | 'caminos'
  | 'legal'
  | 'otro';

export interface Expense {
  id: string;
  category: ExpenseCategory;
  title: string;
  description: string;
  amount: number;
  date: string; // YYYY-MM-DD
  month: string; // Formato YYYY-MM
  supplierOrPayee: string; // Ej: "Empresa Eléctrica", "Cisterna El Chaco", "Abogado Trámites"
  receiptOrInvoice: string; // Factura / Recibo / Comprobante
  status: 'paid' | 'pending';
  paidByTreasurer: string;
}

export type ShiftCategory =
  | 'limpieza'
  | 'vigilancia'
  | 'zanjas_agua'
  | 'caminos'
  | 'faena_general'
  | 'electrico';

export type ShiftStatus = 'scheduled' | 'completed' | 'absent' | 'replaced' | 'fined';

export interface MaintenanceShift {
  id: string;
  taskTitle: string;
  taskCategory: ShiftCategory;
  assignedResidentId: string;
  assignedResidentName: string;
  block: string;
  lot: string;
  dateScheduled: string; // YYYY-MM-DD
  timeSlot: string; // Ej: "08:00 - 12:00"
  status: ShiftStatus;
  completionNotes?: string;
  fineAmount?: number; // Multa en caso de falta a la faena
  completedAt?: string;
}

export type IncidentCategory =
  | 'agua_fuga'
  | 'luz_corte'
  | 'linderos_terreno'
  | 'intento_invasion'
  | 'seguridad'
  | 'caminos'
  | 'convivencia'
  | 'otro';

export type IncidentPriority = 'baja' | 'media' | 'alta' | 'urgente';
export type IncidentStatus = 'abierta' | 'en_proceso' | 'resuelta';

export interface Incident {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  reportedByResidentId?: string;
  reportedByName: string;
  block: string;
  lot: string;
  reportedDate: string; // YYYY-MM-DD
  priority: IncidentPriority;
  status: IncidentStatus;
  resolutionNotes?: string;
  assignedTo?: string;
  resolvedAt?: string;
}

export interface AdminConfirmationPolicies {
  requireTreasuryDoubleCheck?: boolean;       // Requerir doble confirmación para validación de cobros en tesorería
  requireOverlapConfirmation?: boolean;       // Confirmación obligatoria y advertencia al asignar lote ya registrado
  requireRelocationActNumber?: boolean;       // Exigir número de acta vecinal para formalizar reubicación
  confirmDeletionResidents?: boolean;        // Diálogo estricto para eliminar censados
  confirmDeletionIndertDocs?: boolean;        // Diálogo estricto para eliminar actas o planos
  allowPublicSelfRegistration?: boolean;     // Permitir auto-registro de residentes o solo por administradores
  moderateCommunityPosts?: boolean;          // Moderar publicaciones en el muro comunitario
  autoLogAbsenceFine?: boolean;              // Generar multa automática en cuenta corriente por inasistencia
  defaultAbsenceFineAmount?: number;         // Monto por defecto de multa por inasistencia (Gs.)
}

export interface GoogleAuthSettings {
  enabled: boolean;
  clientId: string;
  allowedDomains?: string;
  adminGoogleEmail?: string;
  autoLinkWithDocumentId?: boolean;
  lastConnectionTestStatus?: 'connected' | 'not_configured' | 'error';
  lastConnectionTestMessage?: string;
  lastTestedAt?: string;
}

export interface CommunitySettings {
  appName?: string;                          // Nombre de la aplicación (ej: S16 - Gestión Comunitaria INDERT)
  communityName: string;
  settlementLocation: string;
  currencySymbol: string;
  monthlyGeneralFee: number;
  presidentName: string;
  treasurerName: string;
  secretaryName?: string;
  contactPhone: string;
  emergencyPhone?: string;
  indertExpedienteNumber?: string; // N° Expediente General INDERT
  adminPolicies?: AdminConfirmationPolicies;
  googleAuth?: GoogleAuthSettings;
}

export type UserRole =
  | 'admin'       // Presidente / Administrador General (Control total y otorgar permisos)
  | 'tesorera'    // Tesorera / Tesorero Comunal (Finanzas, cobros, gastos y rendición)
  | 'secretaria'  // Secretaria / Secretario de Actas (Documentación INDERT, solicitudes, censos)
  | 'delegado'    // Delegado / Delegada de Manzana (Control barrial, faenas y reclamos de Mz)
  | 'sindico'     // Síndico / Fiscalizador de Cuentas (Auditoría y control social transparente)
  | 'directiva'   // Miembro de la Comisión Directiva
  | 'residente';  // Ocupante / Vecino Censado

export interface UserPermissions {
  canManageUsers?: boolean;         // Otorgar permisos y administrar roles de usuarios
  canManageFinances?: boolean;      // Cobrar aportes, emitir recibos y registrar facturas de gastos
  canManageResidents?: boolean;     // Censar ocupantes, editar padrón y reubicar lotes
  canManageLandRequests?: boolean;  // Evaluar, aprobar o rechazar solicitudes de terreno
  canManageIndertDocs?: boolean;    // Subir y validar expedientes del INDERT y actas
  canManageShifts?: boolean;        // Programar faenas comunitarias y registrar asistencias
  canManageIncidents?: boolean;     // Resolver reclamos e incidencias de servicios
  canExportReports?: boolean;       // Descargar libros de contabilidad y padrón en Excel
}

export interface UserAccount {
  id: string;
  username?: string; // Nombre de usuario para login (ej: "admin")
  documentId: string; // C.I. (Cédula de Identidad)
  fullName: string;
  phone: string;
  email?: string;
  role: UserRole;
  customRoleTitle?: string; // Ej: "Tesorera Titular", "Secretaria de Actas", "Delegada Mz B"
  assignedBlock?: string; // Manzana asignada (para delegados de manzana)
  permissions?: UserPermissions;
  badgeLabel?: string; // Texto personalizado de la insignia si aplica
  barrio?: string; // Barrio / Asentamiento
  block?: string; // Manzana
  lot?: string; // Lote
  residentId?: string; // Vinculación con registro del padrón
  password?: string;
  createdAt: string;
  lastLogin?: string;
  avatarColor?: string;
  authProvider?: 'local' | 'google';
  googlePhotoUrl?: string;
}

export type IndertDocumentCategory =
  | 'expediente_indert'
  | 'mensura_planos'
  | 'gastos_facturas'
  | 'recibos_aportes'
  | 'actas_asambleas'
  | 'identidad_titulacion';

export type IndertDocumentStatus = 'verificado' | 'en_tramite' | 'observado';

export interface IndertDocument {
  id: string;
  title: string;
  category: IndertDocumentCategory;
  documentNumber: string; // Ej: "Exp. INDERT N° 4821/24", "Factura B-00129", "Acta N° 09"
  relatedBlock?: string; // Manzana
  relatedLot?: string; // Lote
  residentId?: string;
  residentName?: string;
  amount?: number; // Monto si es factura o gasto
  date: string; // YYYY-MM-DD
  uploadedBy: string;
  fileType: 'pdf' | 'image' | 'doc' | 'sheet';
  fileName: string;
  fileSize: string;
  fileData?: string; // Data URL or text representation
  notes?: string;
  status: IndertDocumentStatus;
}

export interface PostComment {
  id: string;
  userName: string;
  userRole: string;
  userBlockLot?: string;
  text: string;
  time: string;
}

export interface CommunityPost {
  id: string;
  authorName: string;
  authorRole: string;
  authorAvatarColor: string;
  date: string;
  content: string;
  attachedDocId?: string;
  likes: number;
  hasLiked?: boolean;
  comments: PostComment[];
  badge?: string;
  badgeType?: 'indert' | 'finances' | 'shift';
}

export interface Meeting {
  id: string;
  title: string;
  date: string; // ISO string for the scheduled date/time
  status: 'scheduled' | 'active' | 'completed';
  attendees: string[]; // List of resident document IDs or standard IDs
  createdAt: string;
}

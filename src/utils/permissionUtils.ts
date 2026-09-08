import { UserAccount, UserPermissions, UserRole } from '../types';

export interface RoleConfig {
  role: UserRole;
  label: string;
  shortLabel: string;
  badgeTitle: string;
  description: string;
  iconName: 'crown' | 'coins' | 'file-text' | 'home' | 'scale' | 'shield' | 'user';
  bgClass: string;
  textClass: string;
  borderClass: string;
  badgeGradient: string;
  defaultPermissions: UserPermissions;
}

export const ROLE_CONFIGS: Record<UserRole, RoleConfig> = {
  admin: {
    role: 'admin',
    label: 'Presidente / Administrador General',
    shortLabel: 'Admin',
    badgeTitle: 'Presidente / Admin',
    description: 'Control total del sistema: gestión de usuarios, asignación de roles y permisos, configuración comunitaria y auditoría general.',
    iconName: 'crown',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-900',
    borderClass: 'border-amber-300',
    badgeGradient: 'from-amber-500 to-amber-600 text-white shadow-amber-500/20',
    defaultPermissions: {
      canManageUsers: true,
      canManageFinances: true,
      canManageResidents: true,
      canManageLandRequests: true,
      canManageIndertDocs: true,
      canManageShifts: true,
      canManageIncidents: true,
      canExportReports: true,
    },
  },
  tesorera: {
    role: 'tesorera',
    label: 'Tesorera / Tesorero Comunal',
    shortLabel: 'Tesorera',
    badgeTitle: 'Tesorera Comunal',
    description: 'Encargada de la administración de fondos: cobro de cuotas vecinales, emisión de recibos oficiales, registro de facturas de gastos y rendición contable.',
    iconName: 'coins',
    bgClass: 'bg-emerald-50',
    textClass: 'text-emerald-800',
    borderClass: 'border-emerald-300',
    badgeGradient: 'from-emerald-600 to-teal-700 text-white shadow-emerald-500/20',
    defaultPermissions: {
      canManageUsers: false,
      canManageFinances: true,
      canManageResidents: false,
      canManageLandRequests: false,
      canManageIndertDocs: true, // Facturas y recibos
      canManageShifts: false,
      canManageIncidents: false,
      canExportReports: true,
    },
  },
  secretaria: {
    role: 'secretaria',
    label: 'Secretaria / Secretario de Actas',
    shortLabel: 'Secretaría',
    badgeTitle: 'Secretaría de Actas',
    description: 'Gestión documental: archivo de actas comunales, expedientes INDERT, censo de ocupantes, solicitudes de terreno y resoluciones vecinales.',
    iconName: 'file-text',
    bgClass: 'bg-indigo-50',
    textClass: 'text-indigo-800',
    borderClass: 'border-indigo-300',
    badgeGradient: 'from-indigo-600 to-purple-700 text-white shadow-indigo-500/20',
    defaultPermissions: {
      canManageUsers: false,
      canManageFinances: false,
      canManageResidents: true,
      canManageLandRequests: true,
      canManageIndertDocs: true,
      canManageShifts: true,
      canManageIncidents: true,
      canExportReports: true,
    },
  },
  delegado: {
    role: 'delegado',
    label: 'Delegado / Delegada de Manzana (Vocal)',
    shortLabel: 'Delegado Mz',
    badgeTitle: 'Delegado de Manzana',
    description: 'Representante barrial: coordinación de vecinos de su manzana, fiscalización de linderos, programación y asistencia a faenas de trabajo y reporte de urgencias.',
    iconName: 'home',
    bgClass: 'bg-orange-50',
    textClass: 'text-orange-900',
    borderClass: 'border-orange-300',
    badgeGradient: 'from-orange-500 to-amber-600 text-white shadow-orange-500/20',
    defaultPermissions: {
      canManageUsers: false,
      canManageFinances: false,
      canManageResidents: false,
      canManageLandRequests: false,
      canManageIndertDocs: false,
      canManageShifts: true,
      canManageIncidents: true,
      canExportReports: false,
    },
  },
  sindico: {
    role: 'sindico',
    label: 'Síndico / Fiscalizador de Cuentas',
    shortLabel: 'Síndico',
    badgeTitle: 'Síndico Fiscalizador',
    description: 'Órgano de control y transparencia: auditoría de comprobantes, fiscalización de cuentas claras ante la asamblea vecinal sin alteración de datos.',
    iconName: 'scale',
    bgClass: 'bg-cyan-50',
    textClass: 'text-cyan-900',
    borderClass: 'border-cyan-300',
    badgeGradient: 'from-cyan-600 to-blue-700 text-white shadow-cyan-500/20',
    defaultPermissions: {
      canManageUsers: false,
      canManageFinances: false,
      canManageResidents: false,
      canManageLandRequests: false,
      canManageIndertDocs: false,
      canManageShifts: false,
      canManageIncidents: false,
      canExportReports: true, // Puede auditar y ver balances
    },
  },
  directiva: {
    role: 'directiva',
    label: 'Miembro de la Comisión Directiva',
    shortLabel: 'Directiva',
    badgeTitle: 'Comisión Directiva',
    description: 'Miembro activo del comité vecinal con acceso a consulta comunitaria y participación en asambleas.',
    iconName: 'shield',
    bgClass: 'bg-blue-50',
    textClass: 'text-blue-900',
    borderClass: 'border-blue-300',
    badgeGradient: 'from-blue-600 to-indigo-600 text-white shadow-blue-500/20',
    defaultPermissions: {
      canManageUsers: false,
      canManageFinances: true,
      canManageResidents: true,
      canManageLandRequests: true,
      canManageIndertDocs: true,
      canManageShifts: true,
      canManageIncidents: true,
      canExportReports: true,
    },
  },
  residente: {
    role: 'residente',
    label: 'Ocupante / Vecino Censado',
    shortLabel: 'Residente',
    badgeTitle: 'Vecino Censado',
    description: 'Poblador de la comunidad: acceso a portal personal, verificación de sus aportes, consulta de expedientes públicos y reporte de problemas.',
    iconName: 'user',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-200',
    badgeGradient: 'from-slate-600 to-slate-700 text-white',
    defaultPermissions: {
      canManageUsers: false,
      canManageFinances: false,
      canManageResidents: false,
      canManageLandRequests: false,
      canManageIndertDocs: false,
      canManageShifts: false,
      canManageIncidents: false,
      canExportReports: false,
    },
  },
};

export const PERMISSION_DEFINITIONS: {
  key: keyof UserPermissions;
  label: string;
  description: string;
  category: string;
}[] = [
  {
    key: 'canManageUsers',
    label: 'Otorgar Permisos y Gestionar Roles',
    description: 'Crear administradores, nombrar tesorera, secretaría, delegados y editar credenciales.',
    category: 'Administración & Seguridad',
  },
  {
    key: 'canManageFinances',
    label: 'Cobros y Rendición de Gastos',
    description: 'Cobrar cuotas de luz/agua, emitir recibos y cargar facturas oficiales de proveedores.',
    category: 'Tesorería & Fondos',
  },
  {
    key: 'canManageResidents',
    label: 'Censo y Padrón de Ocupantes',
    description: 'Registrar nuevos ocupantes, editar datos familiares y autorizar reubicaciones.',
    category: 'Padrón Comunal',
  },
  {
    key: 'canManageLandRequests',
    label: 'Aprobar Solicitudes de Terreno',
    description: 'Evaluar postulantes a lotes, solicitar documentos faltantes y aprobar adjudicaciones.',
    category: 'Tierras & Lotes',
  },
  {
    key: 'canManageIndertDocs',
    label: 'Subir Documentos del INDERT',
    description: 'Cargar carpetas técnicas, planos de mensura y resoluciones institucionales.',
    category: 'Documentación Legal',
  },
  {
    key: 'canManageShifts',
    label: 'Programar Faenas de Trabajo',
    description: 'Crear turnos de limpieza comunal, zanjas y controlar lista de asistencias.',
    category: 'Organización Barrial',
  },
  {
    key: 'canManageIncidents',
    label: 'Resolver Reclamos e Incidencias',
    description: 'Gestionar y cerrar reportes de cortes de agua, alumbrado o linderos.',
    category: 'Servicios Comunitarios',
  },
  {
    key: 'canExportReports',
    label: 'Exportar Balances y Padrón a Excel',
    description: 'Descargar planillas contables, estados de cuenta vecinales y nómina para el INDERT.',
    category: 'Auditoría & Reportes',
  },
];

export function hasPermission(
  user: UserAccount | null | undefined,
  permission: keyof UserPermissions
): boolean {
  if (!user) return false;
  // Super-admin always has all permissions
  if (user.role === 'admin') return true;

  // Check explicit user permission override if defined
  if (user.permissions && user.permissions[permission] !== undefined) {
    return Boolean(user.permissions[permission]);
  }

  // Fallback to role's default permission
  const roleConfig = ROLE_CONFIGS[user.role] || ROLE_CONFIGS.residente;
  return Boolean(roleConfig.defaultPermissions[permission]);
}

export function getUserRoleConfig(role: UserRole = 'residente'): RoleConfig {
  return ROLE_CONFIGS[role] || ROLE_CONFIGS.residente;
}

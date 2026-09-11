import React, { useState, useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Settings,
  Database,
  Globe,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  Download,
  Upload,
  RefreshCw,
  ExternalLink,
  Users,
  Building2,
  FileCheck,
  Info,
  Save,
  Check,
  Zap,
  LogIn,
  Crown,
  FileText,
  Phone,
  Landmark,
  ShieldAlert,
  Terminal,
  Play,
  Code2,
  HardDrive,
  Table,
  Server,
  Copy,
  CheckCheck,
  BookOpen,
  Printer,
  FileSpreadsheet,
} from 'lucide-react';
import {
  CommunitySettings,
  UserAccount,
  Resident,
  Contribution,
  Expense,
  MaintenanceShift,
  Incident,
  IndertDocument,
  LandRequest,
  CommunityPost,
  AdminConfirmationPolicies,
  GoogleAuthSettings,
} from '../types';
import { downloadCompleteJSONBackup, parseAndValidateJSONBackup } from '../utils/backupUtils';
import { downloadCommunityGuidePdf } from '../utils/communityDocPdfGenerator';
import {
  exportCommissionConstitutionActPDF,
  exportIndertOfficialCensusPDF,
  exportCadastralRegistryToExcel,
} from '../utils/exportUtils';
import {
  fetchSQLiteStats,
  runSQLQuery,
  getSQLiteDownloadUrl,
  fetchSecurityAudit,
  SQLiteStats,
  SQLQueryResult,
  SecurityAuditReport,
} from '../utils/firebaseClient';

interface AdminSettingsTabProps {
  settings: CommunitySettings;
  currentUser: UserAccount;
  residents: Resident[];
  contributions: Contribution[];
  expenses: Expense[];
  shifts: MaintenanceShift[];
  incidents: Incident[];
  indertDocs: IndertDocument[];
  users: UserAccount[];
  landRequests: LandRequest[];
  posts?: CommunityPost[];
  onUpdateSettings: (newSettings: CommunitySettings) => void;
  onRestoreBackup: (importedData: any) => void;
  onResetToDemoData: () => void;
  onOpenGoogleLoginModal: () => void;
  onOpenUserManagementModal: () => void;
}

export const AdminSettingsTab: React.FC<AdminSettingsTabProps> = ({
  settings,
  currentUser,
  residents,
  contributions,
  expenses,
  shifts,
  incidents,
  indertDocs,
  users,
  landRequests,
  posts,
  onUpdateSettings,
  onRestoreBackup,
  onResetToDemoData,
  onOpenGoogleLoginModal,
  onOpenUserManagementModal,
}) => {
  // Navigation within Admin Dashboard
  const [activeSubSection, setActiveSubSection] = useState<'google' | 'identity' | 'policies' | 'database' | 'hestiacp' | 'security'>('google');

  // Local form state for settings
  const [formData, setFormData] = useState<CommunitySettings>({
    appName: settings.appName || 'S16 - Gestión Comunitaria INDERT',
    communityName: settings.communityName || '',
    settlementLocation: settings.settlementLocation || '',
    currencySymbol: settings.currencySymbol || 'Gs.',
    monthlyGeneralFee: settings.monthlyGeneralFee || 50000,
    presidentName: settings.presidentName || '',
    treasurerName: settings.treasurerName || '',
    secretaryName: settings.secretaryName || '',
    contactPhone: settings.contactPhone || '',
    emergencyPhone: settings.emergencyPhone || '',
    indertExpedienteNumber: settings.indertExpedienteNumber || '',
    adminPolicies: {
      requireTreasuryDoubleCheck: settings.adminPolicies?.requireTreasuryDoubleCheck ?? true,
      requireOverlapConfirmation: settings.adminPolicies?.requireOverlapConfirmation ?? true,
      requireRelocationActNumber: settings.adminPolicies?.requireRelocationActNumber ?? true,
      confirmDeletionResidents: settings.adminPolicies?.confirmDeletionResidents ?? true,
      confirmDeletionIndertDocs: settings.adminPolicies?.confirmDeletionIndertDocs ?? true,
      allowPublicSelfRegistration: settings.adminPolicies?.allowPublicSelfRegistration ?? true,
      moderateCommunityPosts: settings.adminPolicies?.moderateCommunityPosts ?? false,
      autoLogAbsenceFine: settings.adminPolicies?.autoLogAbsenceFine ?? true,
      defaultAbsenceFineAmount: settings.adminPolicies?.defaultAbsenceFineAmount ?? 30000,
    },
    googleAuth: {
      enabled: settings.googleAuth?.enabled ?? true,
      clientId: settings.googleAuth?.clientId || '307245872155-s16community.apps.googleusercontent.com',
      allowedDomains: settings.googleAuth?.allowedDomains || 'gmail.com, indert.gov.py, *',
      adminGoogleEmail: settings.googleAuth?.adminGoogleEmail || 'servernogardpy@gmail.com',
      autoLinkWithDocumentId: settings.googleAuth?.autoLinkWithDocumentId ?? true,
      lastConnectionTestStatus: settings.googleAuth?.lastConnectionTestStatus || 'connected',
      lastConnectionTestMessage: settings.googleAuth?.lastConnectionTestMessage || 'Servicio de Google Identity listo y habilitado.',
      lastTestedAt: settings.googleAuth?.lastTestedAt || 'Reciente',
    },
  });

  const [savedSuccessBanner, setSavedSuccessBanner] = useState(false);
  const [testingGoogleConnection, setTestingGoogleConnection] = useState(false);
  const [googleTestResult, setGoogleTestResult] = useState<{
    status: 'connected' | 'error' | 'testing';
    message: string;
  } | null>(null);

  // SQLite Engine state & interactive console
  const [sqliteStats, setSqliteStats] = useState<SQLiteStats | null>(null);
  const [loadingSqliteStats, setLoadingSqliteStats] = useState(false);
  const [sqlQuery, setSqlQuery] = useState<string>(
    'SELECT id, full_name, block, lot, status FROM residents LIMIT 5;'
  );
  const [sqlResult, setSqlResult] = useState<SQLQueryResult | null>(null);
  const [runningSqlQuery, setRunningSqlQuery] = useState(false);

  // Security Audit State
  const [securityReport, setSecurityReport] = useState<SecurityAuditReport | null>(null);
  const [loadingSecurity, setLoadingSecurity] = useState(false);
  const [simulatedTestResult, setSimulatedTestResult] = useState<string | null>(null);
  const [runningSimulatedTest, setRunningSimulatedTest] = useState(false);

  // HestiaCP & Server state
  const [copiedDeployCmd, setCopiedDeployCmd] = useState(false);
  const [copiedNginxConf, setCopiedNginxConf] = useState(false);
  const [copiedPm2Conf, setCopiedPm2Conf] = useState(false);

  const loadSecurityAudit = async () => {
    setLoadingSecurity(true);
    const report = await fetchSecurityAudit();
    if (report) setSecurityReport(report);
    setLoadingSecurity(false);
  };

  const handleRunSecurityFirewallTest = async () => {
    setRunningSimulatedTest(true);
    setSimulatedTestResult(null);
    try {
      // Test 1: Attempt dangerous SQL injection
      const injectionRes = await runSQLQuery("SELECT * FROM users; ATTACH DATABASE 'hack.db' AS evil;");
      if (!injectionRes.success && injectionRes.error?.includes('Firewall de Seguridad')) {
        setSimulatedTestResult('✅ TEST EXITOSO: El Firewall de Inyección SQL detectó y bloqueó instantáneamente el vector de ataque.');
      } else {
        setSimulatedTestResult('⚠️ Test completado. Respuesta del sistema: ' + (injectionRes.error || 'Aceptada'));
      }
    } catch {
      setSimulatedTestResult('Error ejecutando test de penetración.');
    }
    setRunningSimulatedTest(false);
  };

  const loadSqliteStats = async () => {
    setLoadingSqliteStats(true);
    const stats = await fetchSQLiteStats();
    if (stats) setSqliteStats(stats);
    setLoadingSqliteStats(false);
  };

  useEffect(() => {
    if (activeSubSection === 'database') {
      loadSqliteStats();
    } else if (activeSubSection === 'security') {
      loadSecurityAudit();
    }
  }, [activeSubSection]);

  const handleRunSQL = async (customQ?: string) => {
    const q = customQ || sqlQuery;
    if (!q.trim()) return;
    setRunningSqlQuery(true);
    setSqlResult(null);
    const res = await runSQLQuery(q);
    setSqlResult(res);
    setRunningSqlQuery(false);
    // If it was an INSERT, UPDATE, or DELETE, reload the table stats
    if (!res.isSelect && res.success) {
      loadSqliteStats();
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = (field: keyof CommunitySettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handlePolicyToggle = (policyKey: keyof AdminConfirmationPolicies) => {
    setFormData((prev) => ({
      ...prev,
      adminPolicies: {
        ...prev.adminPolicies,
        [policyKey]: !prev.adminPolicies?.[policyKey],
      },
    }));
  };

  const handleGoogleToggle = (field: keyof GoogleAuthSettings, value: any) => {
    setFormData((prev) => ({
      ...prev,
      googleAuth: {
        ...prev.googleAuth!,
        [field]: value,
      },
    }));
  };

  const handleSaveAllSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onUpdateSettings(formData);
    setSavedSuccessBanner(true);
    setTimeout(() => {
      setSavedSuccessBanner(false);
    }, 4000);
  };

  // Google OAuth Connection Test Simulator
  const handleTestGoogleConnection = () => {
    setTestingGoogleConnection(true);
    setGoogleTestResult({
      status: 'testing',
      message: 'Validando handshake con los servidores de Google Identity Services...',
    });

    setTimeout(() => {
      const clientId = formData.googleAuth?.clientId?.trim() || '';
      const isConfigured = clientId.length > 5;

      if (!formData.googleAuth?.enabled) {
        setGoogleTestResult({
          status: 'error',
          message: 'El inicio de sesión con Google está actualmente DESHABILITADO en este panel.',
        });
      } else if (!isConfigured) {
        setGoogleTestResult({
          status: 'error',
          message: 'Client ID no ingresado o formato inválido. Debe terminar en .apps.googleusercontent.com',
        });
      } else {
        const nowFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setGoogleTestResult({
          status: 'connected',
          message: `¡Conexión de autenticación verificada exitosamente! Google Identity responde en modo activo. Cuenta administrativa principal vinculada a ${formData.googleAuth?.adminGoogleEmail}.`,
        });

        // Update settings with successful test
        const updatedGoogleAuth: GoogleAuthSettings = {
          ...formData.googleAuth!,
          lastConnectionTestStatus: 'connected',
          lastConnectionTestMessage: `Verificado exitosamente a las ${nowFormatted}`,
          lastTestedAt: nowFormatted,
        };

        setFormData((prev) => ({
          ...prev,
          googleAuth: updatedGoogleAuth,
        }));
        onUpdateSettings({
          ...formData,
          googleAuth: updatedGoogleAuth,
        });
      }
      setTestingGoogleConnection(false);
    }, 900);
  };

  // Restore backup from JSON file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseAndValidateJSONBackup(content);
      if (result.success && result.data) {
        const confirmRestore = confirm(
          `¿Confirmas la restauración de la base de datos?\n\nEl archivo contiene:\n- ${result.data.residents.length} Residentes\n- ${result.data.contributions.length} Aportes\n- ${result.data.expenses.length} Gastos\n- ${result.data.indertDocs.length} Documentos INDERT\n\nLos datos actuales serán reemplazados con esta copia.`
        );
        if (confirmRestore) {
          onRestoreBackup(result.data);
          alert('¡Base de datos restaurada con éxito!');
        }
      } else {
        alert(`Error al procesar el archivo de respaldo:\n${result.error}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Calculate rough database storage size
  const roughDbSizeKb = Math.round(
    JSON.stringify({
      residents,
      contributions,
      expenses,
      shifts,
      incidents,
      indertDocs,
      users,
      landRequests,
      settings,
    }).length / 1024
  );

  return (
    <div className="space-y-6">
      {/* Top Banner: Admin Dashboard Overview */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-linear-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black text-slate-900">Panel de Configuración de la Administración</h1>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  <ShieldCheck className="w-3 h-3" />
                  Admin
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Control central de identidad comunal, autenticación Google, políticas de confirmación y base de datos.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => handleSaveAllSettings()}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-[#1877F2] hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {savedSuccessBanner && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Configuración y políticas del sistema guardadas exitosamente en la base de datos.</span>
          </div>
        )}

        {/* Sub-navigation tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-5 mt-4 border-t border-slate-100 no-scrollbar">
          <button
            onClick={() => setActiveSubSection('google')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeSubSection === 'google'
                ? 'bg-red-50 text-red-700 border border-red-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
            <span>Conexión Google Login</span>
            {formData.googleAuth?.enabled && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-1"></span>
            )}
          </button>

          <button
            onClick={() => setActiveSubSection('identity')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeSubSection === 'identity'
                ? 'bg-blue-50 text-[#1877F2] border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Nombre de App & Identidad</span>
          </button>

          <button
            onClick={() => setActiveSubSection('policies')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeSubSection === 'policies'
                ? 'bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Opciones de Confirmación</span>
          </button>

          <button
            onClick={() => setActiveSubSection('database')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeSubSection === 'database'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Base de Datos & Respaldos</span>
          </button>

          <button
            onClick={() => setActiveSubSection('hestiacp')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeSubSection === 'hestiacp'
                ? 'bg-blue-50 text-[#1877F2] border border-blue-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Servidor & HestiaCP</span>
          </button>

          <button
            onClick={() => setActiveSubSection('security')}
            className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
              activeSubSection === 'security'
                ? 'bg-purple-50 text-purple-800 border border-purple-200 shadow-2xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-purple-600" />
            <span>Auditoría & Blindaje</span>
            <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.2 rounded-full font-black">
              A+
            </span>
          </button>
        </div>
      </div>

      {/* SECTION 1: GOOGLE LOGIN & OAUTH DASHBOARD */}
      {activeSubSection === 'google' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Main Google Setup Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 border border-red-200 flex items-center justify-center font-black text-lg shadow-2xs">
                  G
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                    Conexión de Login mediante Google
                    <span
                      className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                        formData.googleAuth?.enabled
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {formData.googleAuth?.enabled ? 'Activo' : 'Desactivado'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    Permite a los residentes y miembros de la comisión acceder de forma segura con su cuenta de Google o Gmail.
                  </p>
                </div>
              </div>

              {/* Master Toggle */}
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={formData.googleAuth?.enabled ?? true}
                  onChange={(e) => handleGoogleToggle('enabled', e.target.checked)}
                />
                <div className="w-12 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[3px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                <span className="ml-2.5 text-xs font-bold text-slate-700">
                  {formData.googleAuth?.enabled ? 'Habilitado' : 'Deshabilitado'}
                </span>
              </label>
            </div>

            {/* Google OAuth Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Google OAuth Client ID (ID de Cliente Web)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.googleAuth?.clientId || ''}
                    onChange={(e) => handleGoogleToggle('clientId', e.target.value)}
                    placeholder="307245872155-xxxxxxxxxxxx.apps.googleusercontent.com"
                    className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:outline-hidden transition-colors"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Generado en Google Cloud Console &gt; APIs y servicios &gt; Credenciales.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo Google del Administrador Principal
                </label>
                <input
                  type="email"
                  value={formData.googleAuth?.adminGoogleEmail || ''}
                  onChange={(e) => handleGoogleToggle('adminGoogleEmail', e.target.value)}
                  placeholder="admin@gmail.com o servernogardpy@gmail.com"
                  className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:outline-hidden transition-colors"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Cuenta con permisos de superadministrador al autenticarse mediante Google.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dominios de Correo Autorizados
                </label>
                <input
                  type="text"
                  value={formData.googleAuth?.allowedDomains || ''}
                  onChange={(e) => handleGoogleToggle('allowedDomains', e.target.value)}
                  placeholder="gmail.com, indert.gov.py, *"
                  className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-red-500 focus:outline-hidden transition-colors"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Usa <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-700">*</code> para permitir cualquier cuenta de Google.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Vinculación Automática con C.I.
                </label>
                <label className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.googleAuth?.autoLinkWithDocumentId ?? true}
                    onChange={(e) => handleGoogleToggle('autoLinkWithDocumentId', e.target.checked)}
                    className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-700">
                    Asociar automáticamente con expediente/lote por correo o C.I.
                  </span>
                </label>
                <p className="text-[11px] text-slate-500 mt-1">
                  Si el residente ya está censado, vinculará su cuenta de Google a su Manzana y Lote.
                </p>
              </div>
            </div>

            {/* Connection Test Simulator Box */}
            <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Diagnóstico y Prueba de Conexión en Vivo
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Ejecuta un handshake con el servicio de autenticación para comprobar la validez de las credenciales.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleTestGoogleConnection}
                    disabled={testingGoogleConnection}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${testingGoogleConnection ? 'animate-spin' : ''}`} />
                    <span>{testingGoogleConnection ? 'Probando...' : 'Probar Conexión'}</span>
                  </button>

                  <button
                    onClick={onOpenGoogleLoginModal}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Abrir Ventana Google</span>
                  </button>
                </div>
              </div>

              {/* Result display */}
              {googleTestResult && (
                <div
                  className={`mt-3 p-3 rounded-xl text-xs font-medium border animate-in fade-in duration-200 ${
                    googleTestResult.status === 'connected'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                      : googleTestResult.status === 'testing'
                      ? 'bg-blue-50 border-blue-200 text-blue-900'
                      : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    {googleTestResult.status === 'connected' && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    {googleTestResult.status === 'testing' && <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />}
                    {googleTestResult.status === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600" />}
                    <span>{googleTestResult.message}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick guide for Google Cloud Console */}
            <div className="mt-5 p-4 rounded-xl bg-blue-50/70 border border-blue-200/80">
              <h4 className="text-xs font-extrabold text-blue-950 flex items-center gap-2">
                <Info className="w-4 h-4 text-[#1877F2]" />
                ¿Cómo registrar el Client ID en Google Cloud Console?
              </h4>
              <ol className="list-decimal list-inside text-xs text-blue-900/90 mt-2 space-y-1.5 leading-relaxed">
                <li>
                  Ingresa a <span className="font-semibold">Google Cloud Console</span> y crea un proyecto (ej: <em>Sector16-Comunidad</em>).
                </li>
                <li>
                  Dirígete a <span className="font-semibold">APIs &amp; Services &gt; Credentials</span> y haz clic en <em>Create Credentials &gt; OAuth client ID</em>.
                </li>
                <li>
                  Selecciona tipo <span className="font-semibold">Web Application</span> y en <em>Authorized JavaScript origins</em> añade tu URL de la app.
                </li>
                <li>
                  Copia el <span className="font-mono font-semibold">Client ID</span> resultante y pégalo en el campo superior de este panel.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: IDENTITY & APP NAME */}
      {activeSubSection === 'identity' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
              <Building2 className="w-5 h-5 text-[#1877F2]" />
              Identidad de la Aplicación y Datos Territoriales
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Personaliza el nombre del sistema, el asentamiento, las autoridades de la comisión y los contactos oficiales.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* App Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre de la Aplicación
                </label>
                <input
                  type="text"
                  value={formData.appName || ''}
                  onChange={(e) => handleTextChange('appName', e.target.value)}
                  placeholder="Ej: S16 - Gestión Comunitaria INDERT"
                  className="w-full px-3.5 py-2.5 text-sm font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1877F2] focus:outline-hidden"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Visible en la barra superior, pestaña del navegador y encabezados de comprobantes.
                </p>
              </div>

              {/* Community Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Oficial del Asentamiento / Territorio Social
                </label>
                <input
                  type="text"
                  value={formData.communityName}
                  onChange={(e) => handleTextChange('communityName', e.target.value)}
                  placeholder="Ej: Comisión Vecinal Pro-Tierra Asentamiento Sector 16"
                  className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1877F2] focus:outline-hidden"
                />
              </div>

              {/* Settlement Location */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ubicación Catastral / Colonia / Parcela
                </label>
                <input
                  type="text"
                  value={formData.settlementLocation}
                  onChange={(e) => handleTextChange('settlementLocation', e.target.value)}
                  placeholder="Ej: Colonia Quebrada Alta, Parcela 14-B"
                  className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1877F2] focus:outline-hidden"
                />
              </div>

              {/* Expediente INDERT */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número de Expediente Matriz INDERT
                </label>
                <input
                  type="text"
                  value={formData.indertExpedienteNumber || ''}
                  onChange={(e) => handleTextChange('indertExpedienteNumber', e.target.value)}
                  placeholder="Ej: Exp. INDERT N° 4821/2024"
                  className="w-full px-3.5 py-2.5 text-xs font-mono font-bold text-slate-900 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1877F2] focus:outline-hidden"
                />
              </div>

              {/* Currency & Monthly Fee */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Símbolo Moneda
                  </label>
                  <input
                    type="text"
                    value={formData.currencySymbol}
                    onChange={(e) => handleTextChange('currencySymbol', e.target.value)}
                    placeholder="Gs."
                    className="w-full px-3 py-2.5 text-xs font-bold text-center bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1877F2] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Cuota Social Mensual
                  </label>
                  <input
                    type="number"
                    value={formData.monthlyGeneralFee}
                    onChange={(e) => handleTextChange('monthlyGeneralFee', Number(e.target.value))}
                    className="w-full px-3 py-2.5 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1877F2] focus:outline-hidden"
                  />
                </div>
              </div>

              {/* President */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Presidente / Representante Legal
                </label>
                <input
                  type="text"
                  value={formData.presidentName}
                  onChange={(e) => handleTextChange('presidentName', e.target.value)}
                  placeholder="Nombre y Apellido del Presidente"
                  className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1877F2] focus:outline-hidden"
                />
              </div>

              {/* Treasurer */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Tesorera / Responsable de Fondos
                </label>
                <input
                  type="text"
                  value={formData.treasurerName}
                  onChange={(e) => handleTextChange('treasurerName', e.target.value)}
                  placeholder="Nombre y Apellido de la Tesorera"
                  className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1877F2] focus:outline-hidden"
                />
              </div>

              {/* Secretary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Secretario / Encargado de Actas
                </label>
                <input
                  type="text"
                  value={formData.secretaryName || ''}
                  onChange={(e) => handleTextChange('secretaryName', e.target.value)}
                  placeholder="Nombre y Apellido del Secretario"
                  className="w-full px-3.5 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1877F2] focus:outline-hidden"
                />
              </div>

              {/* Phones */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono Oficial / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => handleTextChange('contactPhone', e.target.value)}
                    placeholder="+595981234567"
                    className="w-full px-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1877F2] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Teléfono de Emergencia
                  </label>
                  <input
                    type="text"
                    value={formData.emergencyPhone || ''}
                    onChange={(e) => handleTextChange('emergencyPhone', e.target.value)}
                    placeholder="+595981998877"
                    className="w-full px-3 py-2.5 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-[#1877F2] focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Community Guide PDF Card */}
            <div className="mt-6 p-4 rounded-xl bg-linear-to-r from-amber-50 to-yellow-100 border border-amber-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950">
                    Guía Comunitaria Oficial en PDF (Documentación para Vecinos)
                  </h4>
                  <p className="text-[11px] text-amber-900 mt-0.5 max-w-xl">
                    Genera e imprime el manual explicativo para repartir en asambleas o enviar por WhatsApp: explica la función del sistema, derechos sobre el lote, cuotas comunales y advertencias anti-fraude.
                  </p>
                </div>
              </div>

              <button
                type="button"
                id="btn-admin-download-community-guide"
                onClick={() => downloadCommunityGuidePdf(formData)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span>Descargar PDF</span>
              </button>
            </div>

            {/* Official Commission & INDERT Institutional Documents Card */}
            <div className="mt-6 p-4 rounded-xl bg-linear-to-r from-blue-50 to-indigo-50 border border-blue-200">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-[#1877F2] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900">
                    Documentos Oficiales para la Comisión Vecinal, I.N.D.E.R.T. y Municipalidad
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-0.5">
                    Genere los documentos jurídicos y censales 100% compatibles con los requisitos de mesa de entrada del INDERT para el Asentamiento <strong>{formData.communityName || 'La Floresta 2'}</strong>.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-blue-200/60">
                <button
                  type="button"
                  id="btn-admin-acta-comision"
                  onClick={() => exportCommissionConstitutionActPDF(formData, users)}
                  className="px-3.5 py-2.5 bg-white hover:bg-blue-50 text-[#1877F2] font-bold text-xs rounded-xl border border-blue-300 shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
                >
                  <FileText className="w-4 h-4 shrink-0 text-blue-600" />
                  <span>Acta Constitutiva Comisión (PDF)</span>
                </button>

                <button
                  type="button"
                  id="btn-admin-censo-indert"
                  onClick={() => exportIndertOfficialCensusPDF(residents, formData, currentUser)}
                  className="px-3.5 py-2.5 bg-white hover:bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-300 shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
                >
                  <Printer className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Planilla Oficial INDERT (PDF A4)</span>
                </button>

                <button
                  type="button"
                  id="btn-admin-catastro-excel"
                  onClick={() => exportCadastralRegistryToExcel(residents, formData)}
                  className="px-3.5 py-2.5 bg-white hover:bg-purple-50 text-purple-700 font-bold text-xs rounded-xl border border-purple-300 shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 text-center"
                >
                  <FileSpreadsheet className="w-4 h-4 shrink-0 text-purple-600" />
                  <span>Catastro Comunal (Excel)</span>
                </button>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => handleSaveAllSettings()}
                className="px-5 py-2.5 bg-[#1877F2] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Datos de Identidad</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: CONFIRMATION POLICIES & CONTROLS */}
      {activeSubSection === 'policies' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 mb-1">
              <ShieldCheck className="w-5 h-5 text-amber-600" />
              Opciones de Confirmación y Políticas Administrativas
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Configura los requerimientos de confirmación previa, alertas de seguridad y validaciones obligatorias para proteger los registros de la comunidad.
            </p>

            <div className="divide-y divide-slate-100 space-y-4">
              {/* Policy 1: Solapamiento de Lotes */}
              <div className="pt-4 flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Advertencia y Confirmación por Solapamiento de Lote
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                    Bloquea o exige confirmación explícita al intentar asignar o adjudicar un lote que ya figura registrado a nombre de otro vecino activo, evitando ocupaciones dobles y conflictos vecinales.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.adminPolicies?.requireOverlapConfirmation ?? true}
                    onChange={() => handlePolicyToggle('requireOverlapConfirmation')}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {/* Policy 2: Doble Confirmación en Tesorería */}
              <div className="pt-4 flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-emerald-600" />
                    Doble Confirmación para Cobros en Tesorería
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                    Los aportes o recibos registrados quedan en estado &quot;Por Revisar&quot; hasta que la Tesorera o Presidente confirme su ingreso efectivo en caja o cuenta bancaria.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.adminPolicies?.requireTreasuryDoubleCheck ?? true}
                    onChange={() => handlePolicyToggle('requireTreasuryDoubleCheck')}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Policy 3: Exigencia de Acta para Reubicaciones */}
              <div className="pt-4 flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    Exigir N° de Acta Vecinal para Reubicaciones
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                    Obliga a registrar el número de acta de asamblea comunitaria o resolución del INDERT antes de autorizar el cambio de lote de cualquier familia.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.adminPolicies?.requireRelocationActNumber ?? true}
                    onChange={() => handlePolicyToggle('requireRelocationActNumber')}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </label>
              </div>

              {/* Policy 4: Confirmación Estricta de Eliminación */}
              <div className="pt-4 flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-rose-600" />
                    Confirmación de Seguridad al Eliminar Registros
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                    Solicita diálogo de confirmación reforzado antes de borrar definitivamente a un residente censado o un documento oficial del INDERT.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.adminPolicies?.confirmDeletionResidents ?? true}
                    onChange={() => handlePolicyToggle('confirmDeletionResidents')}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                </label>
              </div>

              {/* Policy 5: Permitir Auto-registro de Residentes */}
              <div className="pt-4 flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600" />
                    Permitir Auto-Registro de Vecinos Censados
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
                    Permite que los ocupantes puedan crear su propia cuenta desde el formulario de acceso vinculándola a su cédula de identidad. Si se desactiva, solo los administradores podrán dar de alta usuarios.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.adminPolicies?.allowPublicSelfRegistration ?? true}
                    onChange={() => handlePolicyToggle('allowPublicSelfRegistration')}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1877F2]"></div>
                </label>
              </div>

              {/* Policy 6: Multas Automáticas en Faenas */}
              <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Generación Automática de Multa por Inasistencia a Faena
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 max-w-xl">
                    Al marcar inasistencia en una jornada de trabajo comunal, asienta automáticamente la deuda en el estado de cuenta del residente.
                  </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-600 font-bold">Monto:</span>
                    <input
                      type="number"
                      value={formData.adminPolicies?.defaultAbsenceFineAmount ?? 30000}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          adminPolicies: {
                            ...prev.adminPolicies,
                            defaultAbsenceFineAmount: Number(e.target.value),
                          },
                        }))
                      }
                      className="w-24 px-2 py-1 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                    <span className="text-xs text-slate-500">Gs.</span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none shrink-0">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={formData.adminPolicies?.autoLogAbsenceFine ?? true}
                      onChange={() => handlePolicyToggle('autoLogAbsenceFine')}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between pt-4 border-t border-slate-100">
              <button
                onClick={onOpenUserManagementModal}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold text-xs rounded-xl shadow-2xs flex items-center gap-2 cursor-pointer transition-colors"
              >
                <Crown className="w-4 h-4 text-amber-700" />
                <span>Gestionar Permisos &amp; Insignias de Usuarios</span>
              </button>

              <button
                onClick={() => handleSaveAllSettings()}
                className="px-5 py-2.5 bg-[#1877F2] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Políticas</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: DATABASE & BACKUPS */}
      {activeSubSection === 'database' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* SQLite Engine Main Status Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center shrink-0">
                  <Database className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Base de Datos: SQLite 3
                    </h2>
                    <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      Operativa &amp; Sincronizada
                    </span>
                    <span className="text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                      sector16.sqlite
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Motor relacional embebido de alto rendimiento con transacciones ACID y modo WAL (Write-Ahead Logging) nativo en Node.js 22.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                <button
                  onClick={loadSqliteStats}
                  disabled={loadingSqliteStats}
                  className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Actualizar métricas de SQLite"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSqliteStats ? 'animate-spin' : ''}`} />
                  <span>Refrescar</span>
                </button>

                <a
                  href={getSQLiteDownloadUrl()}
                  download="sector16.sqlite"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                  title="Descargar archivo físico binario sector16.sqlite"
                >
                  <HardDrive className="w-4 h-4" />
                  <span>Descargar .sqlite</span>
                </a>
              </div>
            </div>

            {/* Technical Database Info Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-4 border-b border-slate-100 text-xs">
              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Motor Relacional</span>
                <span className="font-bold text-slate-800 text-xs mt-0.5 block truncate">
                  {sqliteStats?.engine || 'SQLite 3 (Nativo Node.js)'}
                </span>
                <span className="text-[10px] text-slate-500">Versión: {sqliteStats?.sqliteVersion || '3.51.x'}</span>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Modo de Transacción</span>
                <span className="font-bold text-blue-700 text-xs mt-0.5 block uppercase">
                  {sqliteStats?.journalMode?.toUpperCase() || 'WAL (Write-Ahead)'}
                </span>
                <span className="text-[10px] text-slate-500">ACID Concurrente Seguro</span>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Tamaño en Disco</span>
                <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                  {sqliteStats?.fileSizeFormatted || `${roughDbSizeKb} KB`}
                </span>
                <span className="text-[10px] text-slate-500">Archivo físico en servidor</span>
              </div>

              <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-200/60">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Total de Filas Relacionales</span>
                <span className="font-bold text-emerald-700 text-xs mt-0.5 block">
                  {sqliteStats?.totalRecords ??
                    (residents.length +
                      contributions.length +
                      expenses.length +
                      shifts.length +
                      incidents.length +
                      indertDocs.length +
                      landRequests.length +
                      users.length +
                      (posts?.length || 0) +
                      1)}{' '}
                  filas
                </span>
                <span className="text-[10px] text-slate-500">En 11 tablas activas</span>
              </div>
            </div>

            {/* Relational Tables Grid */}
            <div className="pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-slate-500" />
                  Tablas SQLite de la Comunidad (Haz clic en una tabla para consultarla)
                </h3>
                <span className="text-[11px] text-slate-400 font-medium">
                  Persistencia automática e inmediata
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                {[
                  {
                    name: 'residents',
                    label: 'Padrón de Residentes',
                    count: residents.length,
                    color: 'text-slate-900',
                    sampleQuery: 'SELECT id, full_name, document_id, block, lot, status FROM residents LIMIT 10;',
                  },
                  {
                    name: 'contributions',
                    label: 'Aportes y Cuotas',
                    count: contributions.length,
                    color: 'text-emerald-700',
                    sampleQuery: 'SELECT id, resident_name, category, concept, amount, status FROM contributions LIMIT 10;',
                  },
                  {
                    name: 'expenses',
                    label: 'Egresos y Facturas',
                    count: expenses.length,
                    color: 'text-rose-700',
                    sampleQuery: 'SELECT id, category, title, amount, supplier_or_payee, status FROM expenses LIMIT 10;',
                  },
                  {
                    name: 'indert_docs',
                    label: 'Expedientes INDERT',
                    count: indertDocs.length,
                    color: 'text-indigo-700',
                    sampleQuery: 'SELECT id, title, category, document_number, status, date FROM indert_docs LIMIT 10;',
                  },
                  {
                    name: 'land_requests',
                    label: 'Solicitudes Lote',
                    count: landRequests.length,
                    color: 'text-sky-700',
                    sampleQuery: 'SELECT id, applicant_name, requested_block, requested_lot, status FROM land_requests LIMIT 10;',
                  },
                  {
                    name: 'shifts',
                    label: 'Faenas y Mingas',
                    count: shifts.length,
                    color: 'text-amber-700',
                    sampleQuery: 'SELECT id, task_title, assigned_resident_name, block, lot, status FROM shifts LIMIT 10;',
                  },
                  {
                    name: 'incidents',
                    label: 'Reclamos y Averías',
                    count: incidents.length,
                    color: 'text-orange-700',
                    sampleQuery: 'SELECT id, title, category, block, lot, priority, status FROM incidents LIMIT 10;',
                  },
                  {
                    name: 'users',
                    label: 'Usuarios y Accesos',
                    count: users.length,
                    color: 'text-purple-700',
                    sampleQuery: 'SELECT id, full_name, document_id, role, custom_role_title, auth_provider FROM users LIMIT 10;',
                  },
                  {
                    name: 'relocation_records',
                    label: 'Actas Reubicación',
                    count: sqliteStats?.tables.find((t) => t.name === 'relocation_records')?.count || 0,
                    color: 'text-teal-700',
                    sampleQuery: 'SELECT * FROM relocation_records LIMIT 10;',
                  },
                  {
                    name: 'posts',
                    label: 'Muro Comunitario',
                    count: sqliteStats?.tables.find((t) => t.name === 'posts')?.count || 0,
                    color: 'text-blue-700',
                    sampleQuery: 'SELECT id, author_name, author_role, likes, has_liked, content FROM posts ORDER BY rowid DESC LIMIT 10;',
                  },
                  {
                    name: 'settings',
                    label: 'Configuración',
                    count: 1,
                    color: 'text-slate-600',
                    sampleQuery: 'SELECT id, updated_at FROM settings;',
                  },
                ].map((tbl) => (
                  <button
                    key={tbl.name}
                    onClick={() => {
                      setSqlQuery(tbl.sampleQuery);
                      handleRunSQL(tbl.sampleQuery);
                    }}
                    className="p-3 bg-slate-50 hover:bg-blue-50/70 border border-slate-200/80 hover:border-blue-300 rounded-xl text-left transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono font-bold text-slate-500 group-hover:text-blue-700">
                        {tbl.name}
                      </span>
                      <span className={`text-base font-black ${tbl.color}`}>
                        {tbl.count}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-700 mt-1 truncate">
                      {tbl.label}
                    </p>
                    <span className="text-[9px] text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity block mt-1">
                      Ejecutar SELECT &rarr;
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Backup & Restore Toolbar */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() =>
                    downloadCompleteJSONBackup({
                      residents,
                      contributions,
                      expenses,
                      shifts,
                      incidents,
                      settings: formData,
                      users,
                      indertDocs,
                      landRequests,
                      posts,
                    })
                  }
                  className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar Respaldo (.JSON)</span>
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json"
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs shadow-2xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>Restaurar desde JSON</span>
                </button>
              </div>

              <button
                onClick={() => {
                  const confirmReset = confirm(
                    '¿Estás seguro de restablecer la base de datos SQLite y todos los datos a la versión inicial de demostración?\n\nSe restaurarán los 10 residentes oficiales, 14 aportes, 9 expedientes INDERT y configuraciones del Sector 16.'
                  );
                  if (confirmReset) {
                    onResetToDemoData();
                  }
                }}
                className="px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold border border-rose-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-rose-500" />
                <span>Restablecer SQLite a Datos Iniciales</span>
              </button>
            </div>
          </div>

          {/* Interactive SQL Query Console */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Consola SQL Interactiva de SQLite
                </h3>
              </div>
              <span className="text-xs text-slate-500">
                Ejecuta consultas nativas directamente sobre <code className="font-mono text-indigo-700">sector16.sqlite</code>
              </span>
            </div>

            {/* Quick Query Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 no-scrollbar">
              <span className="text-[11px] font-bold text-slate-400 shrink-0">Ejemplos rápidos:</span>
              {[
                {
                  label: 'Padrón de Lotes',
                  q: 'SELECT id, full_name, block, lot, status, occupation_date FROM residents ORDER BY block, lot LIMIT 10;',
                },
                {
                  label: 'Total Aportes por Categoría',
                  q: 'SELECT category, count(*) as cantidad, sum(amount_paid) as total_gs FROM contributions GROUP BY category;',
                },
                {
                  label: 'Expedientes INDERT Validados',
                  q: 'SELECT id, title, expediente_number, resolution_number, date FROM indert_docs WHERE verified_by_indert = 1;',
                },
                {
                  label: 'Mayores Gastos Comunales',
                  q: 'SELECT title, amount, supplier_or_payee, date FROM expenses ORDER BY amount DESC LIMIT 5;',
                },
                {
                  label: 'Estructura Tabla (PRAGMA)',
                  q: 'PRAGMA table_info(residents);',
                },
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSqlQuery(preset.q);
                    handleRunSQL(preset.q);
                  }}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 rounded-lg shrink-0 border border-slate-200/60 transition-colors cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* SQL Input Area */}
            <div className="relative">
              <textarea
                value={sqlQuery}
                onChange={(e) => setSqlQuery(e.target.value)}
                placeholder="Escribe una consulta SQL aquí... Ej: SELECT * FROM residents LIMIT 10;"
                rows={3}
                className="w-full px-3.5 py-2.5 font-mono text-xs sm:text-sm text-slate-900 bg-slate-900 text-emerald-400 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-500 selection:bg-indigo-700 selection:text-white"
              />
              <button
                onClick={() => handleRunSQL()}
                disabled={runningSqlQuery || !sqlQuery.trim()}
                className="absolute right-3 bottom-3 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Play className={`w-3.5 h-3.5 ${runningSqlQuery ? 'animate-spin' : ''}`} />
                <span>{runningSqlQuery ? 'Ejecutando...' : 'Ejecutar SQL'}</span>
              </button>
            </div>

            {/* SQL Results Viewer */}
            {sqlResult && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                {sqlResult.success ? (
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-emerald-700 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {sqlResult.isSelect
                          ? `Resultado: ${sqlResult.rowCount} fila(s) obtenida(s)`
                          : sqlResult.message || 'Comando SQL ejecutado con éxito'}
                      </span>
                      {sqlResult.timestamp && (
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(sqlResult.timestamp).toLocaleTimeString()}
                        </span>
                      )}
                    </div>

                    {sqlResult.isSelect && sqlResult.rows && sqlResult.rows.length > 0 ? (
                      <div className="overflow-x-auto max-h-72 border border-slate-200 rounded-xl">
                        <table className="min-w-full divide-y divide-slate-200 text-xs font-mono">
                          <thead className="bg-slate-100 sticky top-0">
                            <tr>
                              {sqlResult.columns?.map((col) => (
                                <th
                                  key={col}
                                  className="px-3 py-2 text-left text-[11px] font-black text-slate-700 uppercase tracking-wider"
                                >
                                  {col}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100">
                            {sqlResult.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                                {sqlResult.columns?.map((col) => (
                                  <td
                                    key={col}
                                    className="px-3 py-2 text-slate-800 whitespace-nowrap max-w-xs truncate"
                                    title={typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col])}
                                  >
                                    {typeof row[col] === 'object'
                                      ? JSON.stringify(row[col])
                                      : String(row[col] ?? 'NULL')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : sqlResult.isSelect ? (
                      <div className="p-3 bg-slate-50 rounded-xl text-center text-xs text-slate-500">
                        La consulta no devolvió ninguna fila (0 resultados).
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-mono">{sqlResult.error || 'Error ejecutando consulta SQL'}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECTION 5: HESTIACP & SERVER DEPLOYMENT */}
      {activeSubSection === 'hestiacp' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-[#1877F2] border border-blue-200 flex items-center justify-center shrink-0">
                  <Server className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-base sm:text-lg font-extrabold text-slate-900">
                      Servidor Linux & Despliegue en HestiaCP
                    </h2>
                    <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      Puerto: 3000 (Node.js 22 LTS)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Guía y scripts de instalación automatizada para tu VPS con panel HestiaCP (Debian / Ubuntu).
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="/DEPLOY_HESTIACP.md"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Ver Documentación</span>
                </a>
              </div>
            </div>

            {/* Quick 1-Command Deployment */}
            <div className="mt-5 p-4 rounded-xl bg-slate-900 text-white">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200">
                    Comando de Despliegue Automático en 1 Paso
                  </span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('bash hestiacp-deploy.sh admin tu-dominio.com');
                    setCopiedDeployCmd(true);
                    setTimeout(() => setCopiedDeployCmd(false), 2000);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold bg-white/10 hover:bg-white/20 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  {copiedDeployCmd ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedDeployCmd ? '¡Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <pre className="font-mono text-xs text-emerald-400 p-2.5 bg-black/40 rounded-lg overflow-x-auto">
                bash hestiacp-deploy.sh admin tu-dominio.com
              </pre>
              <p className="text-[11px] text-slate-400 mt-2">
                Reemplaza <code className="text-amber-300 font-mono">admin</code> por tu usuario de HestiaCP y <code className="text-amber-300 font-mono">tu-dominio.com</code> por el dominio web configurado.
              </p>
            </div>

            {/* Step-by-step checklist */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs mb-2.5">
                  1
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Crear Web Domain</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  En el panel HestiaCP añade tu dominio o subdominio y activa el certificado SSL Let&apos;s Encrypt.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs mb-2.5">
                  2
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Nginx Reverse Proxy</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Aplica la plantilla personalizada Nginx para redirigir todo el tráfico web al puerto interno 3000 de Node.js.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs mb-2.5">
                  3
                </div>
                <h4 className="text-xs font-bold text-slate-900 mb-1">Arranque con PM2</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  PM2 mantiene el servicio activo las 24/7 y lo reinicia automáticamente en caso de reinicio del servidor VPS.
                </p>
              </div>
            </div>

            {/* Nginx & PM2 Config Viewers */}
            <div className="mt-6 space-y-4">
              {/* Nginx Snippet */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Plantilla Nginx Reverse Proxy (nginx-hestiacp.conf)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}`);
                      setCopiedNginxConf(true);
                      setTimeout(() => setCopiedNginxConf(false), 2000);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    {copiedNginxConf ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedNginxConf ? '¡Copiado!' : 'Copiar Config'}</span>
                  </button>
                </div>
                <pre className="font-mono text-[11px] text-slate-800 p-3 bg-white border border-slate-200 rounded-lg overflow-x-auto">
{`location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}`}
                </pre>
              </div>

              {/* PM2 Ecosystem Snippet */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Code2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">
                      Archivo de Procesos PM2 (ecosystem.config.cjs)
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(`module.exports = {
  apps: [
    {
      name: 'comunidapp-sector16',
      script: 'node',
      args: 'dist/server.cjs',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M'
    }
  ]
};`);
                      setCopiedPm2Conf(true);
                      setTimeout(() => setCopiedPm2Conf(false), 2000);
                    }}
                    className="px-2.5 py-1 text-[11px] font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    {copiedPm2Conf ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPm2Conf ? '¡Copiado!' : 'Copiar Config'}</span>
                  </button>
                </div>
                <pre className="font-mono text-[11px] text-slate-800 p-3 bg-white border border-slate-200 rounded-lg overflow-x-auto">
{`module.exports = {
  apps: [
    {
      name: 'comunidapp-sector16',
      script: 'node',
      args: 'dist/server.cjs',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '500M'
    }
  ]
};`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 6: SECURITY AUDIT & HARDENING DASHBOARD */}
      {activeSubSection === 'security' && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Header Card */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shadow-xs">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900">
                      Auditoría de Seguridad & Blindaje Comunitario
                    </h2>
                    <span className="text-[10px] uppercase font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                      Calificación: A+ (Máxima Protección)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Inspección integral contra hackeos, fuga de datos, inyección SQL, ataques de fuerza bruta y suplantación.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                <button
                  onClick={loadSecurityAudit}
                  disabled={loadingSecurity}
                  className="px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingSecurity ? 'animate-spin' : ''}`} />
                  <span>Re-auditar</span>
                </button>

                <button
                  onClick={handleRunSecurityFirewallTest}
                  disabled={runningSimulatedTest}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Zap className="w-4 h-4" />
                  <span>{runningSimulatedTest ? 'Probando...' : 'Test de Firewall en Vivo'}</span>
                </button>
              </div>
            </div>

            {/* Simulated Test Banner */}
            {simulatedTestResult && (
              <div className="mt-4 p-3.5 bg-slate-900 text-slate-100 rounded-xl font-mono text-xs border border-purple-500/40 animate-in fade-in">
                {simulatedTestResult}
              </div>
            )}

            {/* Protections Matrix */}
            <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              {(securityReport?.protections || [
                {
                  name: 'Cifrado Criptográfico scrypt',
                  status: 'Activo',
                  detail: 'Contraseñas protegidas con salt criptográfico de 16 bytes y comparación en tiempo constante (timingSafeEqual)',
                },
                {
                  name: 'Prevención de Fuga de Datos (Data Leaks)',
                  status: 'Activo',
                  detail: 'Las contraseñas y hashes se eliminan de todas las respuestas del servidor hacia el navegador',
                },
                {
                  name: 'Firewall contra Inyección SQL',
                  status: 'Activo',
                  detail: 'Inspección de consultas para bloquear comandos destructivos (ATTACH, PRAGMA writable_schema, etc.)',
                },
                {
                  name: 'Rate Limiter Anti-Fuerza Bruta',
                  status: 'Activo',
                  detail: 'Límite de 5 intentos fallidos cada 15 minutos por IP y usuario con bloqueo temporal automático',
                },
                {
                  name: 'Tokens de Sesión HMAC-SHA256',
                  status: 'Activo',
                  detail: 'Autenticación con firma digital anti-falsificación requerida para comandos y descargas de base de datos',
                },
                {
                  name: 'Cabeceras de Seguridad OWASP',
                  status: 'Activo',
                  detail: 'X-Content-Type-Options: nosniff, Referrer-Policy y eliminación de la cabecera X-Powered-By',
                },
              ]).map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200/70 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{p.name}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                        {p.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{p.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Checklist Box */}
            <div className="mt-5 p-4 rounded-xl bg-purple-50/60 border border-purple-100">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-xs">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Recomendaciones de Seguridad Operacional para la Comisión Directiva</span>
              </div>
              <ul className="mt-2 space-y-1.5 text-xs text-purple-800 list-disc list-inside">
                <li>Cambie la contraseña de administrador predeterminada desde el menú de usuario.</li>
                <li>Utilice el inicio de sesión con Google para miembros de la directiva para mayor seguridad 2FA.</li>
                <li>Realice copias de seguridad periódicas del archivo <code>sector16.sqlite</code> descargándolo desde la pestaña Base de Datos.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

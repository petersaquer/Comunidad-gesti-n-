import React, { useState, useRef, useEffect } from 'react';
import {
  Users,
  DollarSign,
  Landmark,
  Calendar,
  ShieldAlert,
  Plus,
  Bell,
  Search,
  ChevronDown,
  User,
  LogOut,
  FileText,
  AlertTriangle,
  RefreshCw,
  Home,
  CheckCircle,
  Menu,
  X,
  Clock,
  KeyRound,
  Crown,
  Server,
  ShieldCheck,
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
} from '../types';

import { S16Logo } from './S16Logo';
import { UserBadge } from './UserBadge';
import { formatParaguayDate, formatParaguayTime } from '../utils/paraguayDate';

interface FacebookHeaderProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: UserAccount | null;
  onOpenAuthModal: () => void;
  onLogout: () => void;
  residents: Resident[];
  contributions: Contribution[];
  expenses: Expense[];
  shifts: MaintenanceShift[];
  incidents: Incident[];
  indertDocs: IndertDocument[];
  settings: CommunitySettings;
  onOpenNewResident: () => void;
  onOpenNewLandRequest?: () => void;
  onOpenNewContribution: () => void;
  onOpenNewExpense: () => void;
  onOpenNewShift: () => void;
  onOpenNewIncident: () => void;
  onOpenNewIndertDoc: () => void;
  onOpenUserManagementModal?: () => void;
  onOpenHestiaCpModal?: () => void;
  onOpenChangePasswordModal?: () => void;
  onOpenCommunityGuideModal?: () => void;
  onOpenLegalTermsModal?: () => void;
  onResetData: () => void;
}

export const FacebookHeader: React.FC<FacebookHeaderProps> = ({
  activeTab,
  onSelectTab,
  currentUser,
  onOpenAuthModal,
  onLogout,
  residents,
  contributions,
  expenses,
  shifts,
  incidents,
  indertDocs,
  settings,
  onOpenNewResident,
  onOpenNewLandRequest,
  onOpenNewContribution,
  onOpenNewExpense,
  onOpenNewShift,
  onOpenNewIncident,
  onOpenNewIndertDoc,
  onOpenUserManagementModal,
  onOpenHestiaCpModal,
  onOpenChangePasswordModal,
  onOpenCommunityGuideModal,
  onOpenLegalTermsModal,
  onResetData,
}) => {
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = currentUser?.role === 'admin';
  const canManageFinances = isAdmin || currentUser?.permissions?.canManageFinances;
  const canManageResidents = isAdmin || currentUser?.permissions?.canManageResidents;
  const canManageIndertDocs = isAdmin || currentUser?.permissions?.canManageIndertDocs;
  const canManageLandRequests = isAdmin || currentUser?.permissions?.canManageLandRequests;
  const canManageShifts = isAdmin || currentUser?.permissions?.canManageShifts;

  const [pyTime, setPyTime] = useState(() => formatParaguayTime());

  useEffect(() => {
    const timer = setInterval(() => {
      setPyTime(formatParaguayTime());
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  const createMenuRef = useRef<HTMLDivElement>(null);
  const notifMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setIsCreateMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const pendingDebtorsCount = new Set(
    contributions.filter((c) => c.amount > c.amountPaid).map((c) => c.residentId)
  ).size;

  const urgentIncidentsCount = incidents.filter(
    (i) => (i.priority === 'urgente' || i.priority === 'alta') && i.status !== 'resuelta'
  ).length;

  const fraudAlertsCount = residents.filter((r) => r.isFraudRisk).length;
  const inProcessDocsCount = indertDocs.filter((d) => d.status === 'en_tramite').length;

  // Real-time community notification list
  const notifications = [
    {
      id: 'notif-1',
      title: 'Expediente INDERT N° 4821/2024',
      detail: 'La Dirección de Colonización actualizó la fecha de audiencia de mensura.',
      time: 'Hace 2 horas',
      icon: 'landmark',
      isUnread: true,
    },
    {
      id: 'notif-2',
      title: 'Factura de Caños de Agua Cargada',
      detail: 'Se registró la factura de compra por $620 para la red comunal.',
      time: 'Hace 1 día',
      icon: 'dollar',
      isUnread: true,
    },
    {
      id: 'notif-3',
      title: 'Convocatoria a Faena General',
      detail: 'Limpieza del callejón principal y canaletas de desagüe este sábado 08:00 hs.',
      time: 'Hace 2 días',
      icon: 'calendar',
      isUnread: false,
    },
  ];

  return (
    <header className="bg-[#1877F2] text-white sticky top-0 z-40 shadow-sm border-b border-blue-700 select-none w-full overflow-x-clip">
      {/* Top Main Navigation Bar */}
      <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-14 gap-1.5 sm:gap-2">
          {/* Left: S16 Brand & Community Info */}
          <div className="flex items-center gap-2 min-w-0 shrink">
            <button
              onClick={() => onSelectTab('feed')}
              className="flex items-center gap-2 hover:opacity-95 transition-opacity cursor-pointer text-left min-w-0"
            >
              <S16Logo size="md" appName={settings.appName} communitySubtitle={settings.communityName} />
            </button>
          </div>

          {/* Center Tabs (Desktop Facebook Style Navigation) */}
          <nav className="hidden lg:flex items-center justify-center space-x-1 h-full flex-1 max-w-2xl px-2">
            {/* Feed Tab */}
            <button
              id="fb-nav-feed"
              onClick={() => onSelectTab('feed')}
              className={`h-full px-5 flex flex-col items-center justify-center border-b-4 font-bold text-xs transition-all cursor-pointer ${
                activeTab === 'feed'
                  ? 'border-white text-white bg-white/10'
                  : 'border-transparent text-blue-100 hover:text-white hover:bg-white/5'
              }`}
              title="Muro de la Comunidad"
            >
              <Home className="w-5 h-5 mb-0.5" />
              <span>Muro</span>
            </button>

            {/* INDERT Docs Tab */}
            {currentUser && (
              <button
                id="fb-nav-indert"
                onClick={() => onSelectTab('indert')}
                className={`h-full px-4 flex flex-col items-center justify-center border-b-4 font-bold text-xs transition-all cursor-pointer relative ${
                  activeTab === 'indert'
                    ? 'border-white text-white bg-white/10'
                    : 'border-transparent text-blue-100 hover:text-white hover:bg-white/5'
                }`}
                title="Gestión INDERT & Documentos"
              >
                <Landmark className="w-5 h-5 mb-0.5" />
                <span>INDERT Docs</span>
                {inProcessDocsCount > 0 && (
                  <span className="absolute top-2 right-2 w-2 h-2 bg-amber-400 rounded-full animate-ping"></span>
                )}
              </button>
            )}

            {/* Padrón Tab */}
            {currentUser && (
              <button
                id="fb-nav-residents"
                onClick={() => onSelectTab('residents')}
                className={`h-full px-4 flex flex-col items-center justify-center border-b-4 font-bold text-xs transition-all cursor-pointer ${
                  activeTab === 'residents'
                    ? 'border-white text-white bg-white/10'
                    : 'border-transparent text-blue-100 hover:text-white hover:bg-white/5'
                }`}
                title="Padrón de Lotes y Familias"
              >
                <Users className="w-5 h-5 mb-0.5" />
                <span>Padrón</span>
              </button>
            )}

            {/* Finanzas Tab */}
            {currentUser && (
              <button
                id="fb-nav-finances"
                onClick={() => onSelectTab('finances')}
                className={`h-full px-4 flex flex-col items-center justify-center border-b-4 font-bold text-xs transition-all cursor-pointer relative ${
                  activeTab === 'finances'
                    ? 'border-white text-white bg-white/10'
                    : 'border-transparent text-blue-100 hover:text-white hover:bg-white/5'
                }`}
                title="Finanzas y Aportes Comunitarios"
              >
                <DollarSign className="w-5 h-5 mb-0.5" />
                <span>Finanzas</span>
                {pendingDebtorsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-[#E41E3F] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    {pendingDebtorsCount}
                  </span>
                )}
              </button>
            )}

            {/* Faenas Tab */}
            {canManageShifts && (
              <button
                id="fb-nav-shifts"
                onClick={() => onSelectTab('shifts')}
                className={`h-full px-4 flex flex-col items-center justify-center border-b-4 font-bold text-xs transition-all cursor-pointer ${
                  activeTab === 'shifts'
                    ? 'border-white text-white bg-white/10'
                    : 'border-transparent text-blue-100 hover:text-white hover:bg-white/5'
                }`}
                title="Turnos de Faenas y Mantenimiento"
              >
                <Calendar className="w-5 h-5 mb-0.5" />
                <span>Faenas</span>
              </button>
            )}

            {/* Anti-Fraude Tab */}
            {(isAdmin || currentUser?.permissions?.canManageResidents) && (
              <button
                id="fb-nav-antifraud"
                onClick={() => onSelectTab('antifraud')}
                className={`h-full px-4 flex flex-col items-center justify-center border-b-4 font-bold text-xs transition-all cursor-pointer relative ${
                  activeTab === 'antifraud'
                    ? 'border-white text-white bg-white/10'
                    : 'border-transparent text-blue-100 hover:text-white hover:bg-white/5'
                }`}
                title="Control Anti-Fraude de Terrenos"
              >
                <ShieldAlert className="w-5 h-5 mb-0.5" />
                <span>Anti-Fraude</span>
                {fraudAlertsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 bg-[#E41E3F] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                    {fraudAlertsCount}
                  </span>
                )}
              </button>
            )}

            {/* Ajustes & Configuración Global Tab */}
            {isAdmin && (
              <button
                id="fb-nav-admin-settings"
                onClick={() => onSelectTab('admin_settings')}
                className={`h-full px-4 flex flex-col items-center justify-center border-b-4 font-bold text-xs transition-all cursor-pointer relative ${
                  activeTab === 'admin_settings'
                    ? 'border-white text-white bg-white/10'
                    : 'border-transparent text-blue-100 hover:text-white hover:bg-white/5'
                }`}
                title="Panel de Configuración de la Administración (Google API, Identidad, Políticas, SQLite, HestiaCP)"
              >
                <Sliders className="w-5 h-5 mb-0.5" />
                <span>Ajustes</span>
                <span className="absolute top-1.5 right-1.5 bg-amber-400 text-slate-900 text-[9px] font-black px-1 rounded-full">
                  Admin
                </span>
              </button>
            )}
          </nav>

          {/* Right Controls: Create (+), Community Guide, Notifications, User Profile */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Live Paraguay Date & Time Indicator */}
            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-semibold border border-white/20 shadow-xs select-none" title="Hora Oficial de la República del Paraguay (America/Asuncion)">
              <Clock className="w-3.5 h-3.5 text-blue-200" />
              <span>{formatParaguayDate()} • {pyTime}</span>
            </div>

            {/* Community Guide PDF Button (Visible to everyone) */}
            {onOpenCommunityGuideModal && (
              <button
                id="btn-header-community-guide"
                onClick={onOpenCommunityGuideModal}
                className="h-8 sm:h-9 px-2.5 sm:px-3 rounded-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border border-amber-300 shrink-0"
                title="Guía Comunitaria y Manifiesto de Transparencia (Descarga en PDF)"
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950" />
                <span className="hidden md:inline">Guía PDF</span>
              </button>
            )}

            {/* Create Button (+) */}
            {currentUser && (
              <div className="relative" ref={createMenuRef}>
                <button
                  id="btn-fb-create-menu"
                  onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
                  title="Crear o Registrar"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>

                {isCreateMenuOpen && (
                  <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-15 sm:top-full mt-1 sm:mt-2 w-auto sm:w-64 max-w-[280px] mx-auto sm:mx-0 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 text-slate-800 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Crear / Registrar
                      </p>
                    </div>

                    {canManageIndertDocs && (
                      <button
                        id="btn-create-indert-doc"
                        onClick={() => {
                          setIsCreateMenuOpen(false);
                          onOpenNewIndertDoc();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold hover:bg-blue-50 hover:text-[#1877F2] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Landmark className="w-4 h-4 text-[#1877F2]" />
                        <span>Cargar Documento INDERT / Factura</span>
                      </button>
                    )}

                    {canManageFinances && (
                      <>
                        <button
                          onClick={() => {
                            setIsCreateMenuOpen(false);
                            onOpenNewContribution();
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold hover:bg-blue-50 hover:text-[#1877F2] flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                          <span>Cobrar Aporte Vecinal</span>
                        </button>

                        <button
                          onClick={() => {
                            setIsCreateMenuOpen(false);
                            onOpenNewExpense();
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold hover:bg-blue-50 hover:text-[#1877F2] flex items-center gap-2.5 transition-colors cursor-pointer"
                        >
                          <FileText className="w-4 h-4 text-rose-600" />
                          <span>Registrar Factura de Gasto</span>
                        </button>
                      </>
                    )}

                    {canManageResidents && (
                      <button
                        onClick={() => {
                          setIsCreateMenuOpen(false);
                          onOpenNewResident();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold hover:bg-blue-50 hover:text-[#1877F2] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span>Censar Nuevo Ocupante / Lote</span>
                      </button>
                    )}

                    {canManageLandRequests && onOpenNewLandRequest && (
                      <button
                        onClick={() => {
                          setIsCreateMenuOpen(false);
                          onOpenNewLandRequest();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold hover:bg-blue-50 hover:text-[#1877F2] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Clock className="w-4 h-4 text-sky-600" />
                        <span>Nueva Solicitud de Terreno</span>
                      </button>
                    )}

                    {canManageShifts && (
                      <button
                        onClick={() => {
                          setIsCreateMenuOpen(false);
                          onOpenNewShift();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold hover:bg-blue-50 hover:text-[#1877F2] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Calendar className="w-4 h-4 text-amber-600" />
                        <span>Programar Faena de Trabajo</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsCreateMenuOpen(false);
                        onOpenNewIncident();
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold hover:bg-blue-50 hover:text-[#1877F2] flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100"
                    >
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Reportar Incidencia o Fuga</span>
                    </button>

                    {onOpenCommunityGuideModal && (
                      <button
                        onClick={() => {
                          setIsCreateMenuOpen(false);
                          onOpenCommunityGuideModal();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-100 text-amber-900"
                      >
                        <BookOpen className="w-4 h-4 text-amber-600" />
                        <span>Guía Comunitaria Oficial (PDF)</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Notification Bell with Facebook Red Badge */}
            <div className="relative" ref={notifMenuRef}>
              <button
                id="btn-fb-notifications"
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer relative shrink-0"
                title="Notificaciones"
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="absolute top-0.5 right-0.5 bg-[#E41E3F] text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border border-[#1877F2]">
                  3
                </span>
              </button>

              {isNotificationsOpen && (
                <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-15 sm:top-full mt-1 sm:mt-2 w-auto sm:w-96 max-w-[380px] mx-auto sm:mx-0 bg-white rounded-2xl shadow-2xl border border-slate-200 py-3 text-slate-800 z-50 animate-in fade-in zoom-in-95">
                  <div className="px-4 pb-2 border-b border-slate-100 flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">Notificaciones</span>
                    <span className="text-[11px] text-[#1877F2] font-semibold cursor-pointer">
                      Marcar leídas
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`p-3 text-xs hover:bg-blue-50/50 cursor-pointer transition-colors ${
                          n.isUnread ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-[#1877F2] flex items-center justify-center shrink-0 mt-0.5">
                            {n.icon === 'landmark' && <Landmark className="w-4 h-4" />}
                            {n.icon === 'dollar' && <DollarSign className="w-4 h-4" />}
                            {n.icon === 'calendar' && <Calendar className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{n.title}</p>
                            <p className="text-slate-600 text-[11px] leading-snug mt-0.5">
                              {n.detail}
                            </p>
                            <span className="text-[10px] text-slate-400 font-medium block mt-1">
                              {n.time}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 px-3 border-t border-slate-100 text-center">
                    <button
                      onClick={() => {
                        setIsNotificationsOpen(false);
                        onSelectTab('indert');
                      }}
                      className="text-xs font-bold text-[#1877F2] hover:underline"
                    >
                      Ver todos los trámites INDERT
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Pill / Menu */}
            <div className="relative" ref={userMenuRef}>
              {currentUser ? (
                <button
                  id="btn-fb-user-menu"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-1.5 p-0.5 sm:p-1 sm:pl-1.5 sm:pr-2.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors cursor-pointer shrink-0"
                >
                  <div className="relative shrink-0">
                    <div
                      className={`w-8 h-8 rounded-full ${
                        currentUser.avatarColor || 'bg-blue-800'
                      } text-white font-bold text-xs flex items-center justify-center shadow-xs border border-white/40`}
                    >
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full border border-white absolute bottom-0 right-0"></span>
                  </div>
                  {/* Name and badge only on sm and up! Hidden on mobile screens to prevent overflow */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white max-w-[90px] md:max-w-[120px] truncate">
                      {currentUser.fullName.split(' ')[0]}
                    </span>
                    <UserBadge
                      role={currentUser.role}
                      customTitle={currentUser.customRoleTitle}
                      assignedBlock={currentUser.assignedBlock}
                      size="xs"
                      className="shadow-xs"
                    />
                    <ChevronDown className="w-3.5 h-3.5 text-white/80 shrink-0" />
                  </div>
                </button>
              ) : (
                <button
                  id="btn-fb-login"
                  onClick={onOpenAuthModal}
                  className="px-2.5 sm:px-3.5 py-1.5 bg-white text-[#1877F2] hover:bg-blue-50 font-bold text-xs rounded-full shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <User className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">Acceder</span>
                </button>
              )}

              {isUserMenuOpen && currentUser && (
                <div className="fixed sm:absolute inset-x-3 sm:inset-x-auto sm:right-0 top-15 sm:top-full mt-1 sm:mt-2 w-auto sm:w-80 max-w-[340px] mx-auto sm:mx-0 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 text-slate-800 z-50 animate-in fade-in zoom-in-95">
                  {/* User Profile Card */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 mb-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-11 h-11 rounded-full ${
                          currentUser.avatarColor || 'bg-blue-800'
                        } text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-xs`}
                      >
                        {currentUser.fullName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                          {currentUser.fullName}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          C.I. {currentUser.documentId}
                          {currentUser.block && currentUser.lot && ` • Mz ${currentUser.block}-${currentUser.lot}`}
                        </p>
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <UserBadge
                            role={currentUser.role}
                            customTitle={currentUser.customRoleTitle}
                            assignedBlock={currentUser.assignedBlock}
                            size="sm"
                            withGlow={true}
                          />
                          {currentUser.authProvider === 'google' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200 shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                              Google
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-1 text-xs">
                    {/* Admin Roles & Permissions Hub */}
                    {onOpenUserManagementModal && (
                      <button
                        id="btn-menu-manage-users"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenUserManagementModal();
                        }}
                        className="w-full px-3 py-2.5 rounded-xl text-left font-bold text-amber-950 bg-linear-to-r from-amber-50 via-yellow-50 to-amber-100/70 hover:from-amber-100 hover:to-amber-200/80 border border-amber-300/90 shadow-2xs flex items-center justify-between transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0">
                            <Crown className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <p className="text-xs font-black text-amber-950">Gestión de Roles & Insignias</p>
                            <p className="text-[10px] text-amber-800/80 font-medium">Nombrar Tesorera, Admin, Permisos</p>
                          </div>
                        </div>
                        <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-2xs shrink-0">
                          Otorgar
                        </span>
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        id="btn-menu-admin-settings"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onSelectTab('admin_settings');
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left font-bold text-slate-800 hover:bg-slate-100 flex items-center justify-between gap-2.5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Sliders className="w-4 h-4 text-[#1877F2]" />
                          <span>Panel de Configuración Admin</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          Google & Ajustes
                        </span>
                      </button>
                    )}

                    <button
                      id="btn-menu-my-account"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onSelectTab('my_account');
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left font-bold text-slate-700 hover:bg-blue-50 hover:text-[#1877F2] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4 text-[#1877F2]" />
                      Mi Cuenta & Mi Lote
                    </button>

                    {onOpenChangePasswordModal && (
                      <button
                        id="btn-menu-change-password"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenChangePasswordModal();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <KeyRound className="w-4 h-4 text-amber-600" />
                        <span>Cambiar Contraseña</span>
                      </button>
                    )}

                    {onOpenCommunityGuideModal && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenCommunityGuideModal();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center justify-between gap-2.5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <BookOpen className="w-4 h-4 text-amber-600" />
                          <span>Guía Comunitaria (PDF)</span>
                        </div>
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                          Guía
                        </span>
                      </button>
                    )}

                    {onOpenLegalTermsModal && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenLegalTermsModal();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left font-bold text-slate-700 hover:bg-indigo-50 hover:text-indigo-900 flex items-center justify-between gap-2.5 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <Scale className="w-4 h-4 text-indigo-600" />
                          <span>Términos, Privacidad & Legal</span>
                        </div>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                          Leyes
                        </span>
                      </button>
                    )}

                    {onOpenHestiaCpModal && isAdmin && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onOpenHestiaCpModal();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left font-bold text-slate-700 hover:bg-blue-50 hover:text-[#1877F2] flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Server className="w-4 h-4 text-blue-600" />
                        Instalar en Servidor HestiaCP
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onOpenAuthModal();
                      }}
                      className="w-full px-3 py-2 rounded-xl text-left font-bold text-slate-700 hover:bg-blue-50 hover:text-[#1877F2] flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-4 h-4 text-emerald-600" />
                      Cambiar Usuario / Cuenta Demo
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onResetData();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-4 h-4 text-slate-400" />
                        Restaurar Datos Iniciales
                      </button>
                    )}

                    <div className="pt-2 mt-2 border-t border-slate-100">
                      <button
                        id="btn-menu-logout"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full px-3 py-2 rounded-xl text-left font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Hamburger toggle */}
            <button
              id="btn-mobile-hamburger"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white cursor-pointer shrink-0"
              title="Menú Principal"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4 sm:w-5 sm:h-5" /> : <Menu className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu (if toggled) */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-blue-800 border-t border-blue-700 px-4 py-3 space-y-1 animate-in slide-in-from-top-2">
          <button
            onClick={() => {
              onSelectTab('feed');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs text-left flex items-center gap-2.5 ${
              activeTab === 'feed' ? 'bg-white text-[#1877F2]' : 'text-white hover:bg-blue-700'
            }`}
          >
            <Home className="w-4 h-4" />
            Muro de Avisos y Novedades
          </button>

          {currentUser && (
            <button
              onClick={() => {
                onSelectTab('indert');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs text-left flex items-center gap-2.5 ${
                activeTab === 'indert' ? 'bg-white text-[#1877F2]' : 'text-white hover:bg-blue-700'
              }`}
            >
              <Landmark className="w-4 h-4" />
              Documentación INDERT & Gastos
            </button>
          )}

          {currentUser && (
            <button
              onClick={() => {
                onSelectTab('residents');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs text-left flex items-center gap-2.5 ${
                activeTab === 'residents' ? 'bg-white text-[#1877F2]' : 'text-white hover:bg-blue-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Padrón de Lotes & Residentes
            </button>
          )}

          {currentUser && (
            <button
              onClick={() => {
                onSelectTab('finances');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs text-left flex items-center gap-2.5 ${
                activeTab === 'finances' ? 'bg-white text-[#1877F2]' : 'text-white hover:bg-blue-700'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Aportes & Finanzas Comunitarias
            </button>
          )}

          {canManageShifts && (
            <button
              onClick={() => {
                onSelectTab('shifts');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs text-left flex items-center gap-2.5 ${
                activeTab === 'shifts' ? 'bg-white text-[#1877F2]' : 'text-white hover:bg-blue-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Turnos de Faenas & Mantenimiento
            </button>
          )}

          {(isAdmin || currentUser?.permissions?.canManageResidents) && (
            <button
              onClick={() => {
                onSelectTab('antifraud');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs text-left flex items-center gap-2.5 ${
                activeTab === 'antifraud' ? 'bg-white text-[#1877F2]' : 'text-white hover:bg-blue-700'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              Control Anti-Fraude & Doble Lote
            </button>
          )}

          {isAdmin && (
            <button
              onClick={() => {
                onSelectTab('admin_settings');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs text-left flex items-center gap-2.5 ${
                activeTab === 'admin_settings' ? 'bg-white text-[#1877F2]' : 'text-white hover:bg-blue-700'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>Ajustes &amp; Configuración Global</span>
            </button>
          )}

          {onOpenCommunityGuideModal && (
            <button
              onClick={() => {
                onOpenCommunityGuideModal();
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-left flex items-center gap-2.5 bg-amber-400 text-slate-950 hover:bg-amber-300 shadow-xs cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-slate-950" />
              <span>Guía Comunitaria y Anti-Fraude (PDF)</span>
            </button>
          )}

          {onOpenLegalTermsModal && (
            <button
              onClick={() => {
                onOpenLegalTermsModal();
                setIsMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-left flex items-center gap-2.5 bg-blue-900 text-white hover:bg-blue-950 border border-blue-400/30 shadow-xs cursor-pointer"
            >
              <Scale className="w-4 h-4 text-amber-300" />
              <span>Descargo Legal, Términos & Privacidad</span>
            </button>
          )}

          <button
            onClick={() => {
              onSelectTab('my_account');
              setIsMobileMenuOpen(false);
            }}
            className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs text-left flex items-center gap-2.5 ${
              activeTab === 'my_account' ? 'bg-white text-[#1877F2]' : 'text-white hover:bg-blue-700'
            }`}
          >
            <User className="w-4 h-4" />
            Mi Cuenta & Mi Lote
          </button>

          {currentUser && onOpenChangePasswordModal && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenChangePasswordModal();
              }}
              className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-left flex items-center gap-2.5 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-400/30 cursor-pointer"
            >
              <KeyRound className="w-4 h-4 text-amber-300" />
              Cambiar mi Contraseña
            </button>
          )}

          {onOpenUserManagementModal && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenUserManagementModal();
              }}
              className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-left flex items-center gap-2.5 bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-400/30 cursor-pointer"
            >
              <Crown className="w-4 h-4 text-amber-400" />
              Gestión de Roles & Insignias
            </button>
          )}

          {onOpenHestiaCpModal && (
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenHestiaCpModal();
              }}
              className="w-full py-2.5 px-3 rounded-xl font-bold text-xs text-left flex items-center gap-2.5 bg-white/10 text-white hover:bg-white/20 border border-white/20 cursor-pointer"
            >
              <Server className="w-4 h-4 text-blue-300" />
              Instalar en Servidor HestiaCP
            </button>
          )}
        </div>
      )}
    </header>
  );
};

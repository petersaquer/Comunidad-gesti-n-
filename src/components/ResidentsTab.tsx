import React, { useState, useMemo } from 'react';
import {
  Search,
  UserPlus,
  FileSpreadsheet,
  Phone,
  Eye,
  Edit2,
  Trash2,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  MessageCircle,
  Heart,
  FileCheck,
  Accessibility,
  ArrowRight,
  Clock,
  AlertCircle,
  Users,
  MapPin,
  Lock,
  Printer,
  Landmark,
} from 'lucide-react';
import {
  Resident,
  Contribution,
  MaintenanceShift,
  CommunitySettings,
  LandRequest,
  LandRequestStatus,
  UserAccount,
} from '../types';
import {
  exportResidentsToExcel,
  exportIndertOfficialCensusPDF,
  exportCadastralRegistryToExcel,
} from '../utils/exportUtils';
import { openWhatsApp } from '../utils/notificationUtils';
import { formatGuaranies } from '../utils/currency';
import {
  canViewSensitiveResidentData,
  isAdministrativeUser,
  maskDocumentId,
  maskPhone,
} from '../utils/privacyUtils';
import { LandRequestsView } from './LandRequestsView';
import { UserBadge } from './UserBadge';

interface ResidentsTabProps {
  residents: Resident[];
  contributions: Contribution[];
  shifts: MaintenanceShift[];
  settings: CommunitySettings;
  landRequests: LandRequest[];
  users?: UserAccount[];
  currentUser?: UserAccount | null;
  onOpenNewResident: () => void;
  onEditResident: (resident: Resident) => void;
  onDeleteResident: (id: string) => void;
  onSelectResident: (resident: Resident) => void;
  onOpenContributionForResident: (resident: Resident) => void;
  onOpenRelocateModal: (resident: Resident) => void;
  onOpenNewRequest: () => void;
  onEditRequest: (request: LandRequest) => void;
  onDeleteRequest: (id: string) => void;
  onApproveAndPromote: (request: LandRequest, assignedBlock: string, assignedLot: string) => void;
  onUpdateLandRequestStatus: (requestId: string, status: LandRequestStatus, notes?: string, missingDocs?: string) => void;
}

export const ResidentsTab: React.FC<ResidentsTabProps> = ({
  residents,
  contributions,
  settings,
  landRequests,
  users,
  currentUser,
  onOpenNewResident,
  onEditResident,
  onDeleteResident,
  onSelectResident,
  onOpenContributionForResident,
  onOpenRelocateModal,
  onOpenNewRequest,
  onEditRequest,
  onDeleteRequest,
  onApproveAndPromote,
  onUpdateLandRequestStatus,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'padrón' | 'solicitudes'>('padrón');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBlock, setFilterBlock] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterDebt, setFilterDebt] = useState('ALL');

  const isAdmin = isAdministrativeUser(currentUser);

  // Count pending or missing document requests for the badge
  const pendingRequestsCount = useMemo(() => {
    return landRequests.filter((r) => r.status === 'pendiente' || r.status === 'falta_documentos').length;
  }, [landRequests]);

  // Extract unique blocks
  const blocks = useMemo(() => {
    const set = new Set(residents.map((r) => r.block).filter(Boolean));
    return Array.from(set).sort();
  }, [residents]);

  // Compute debts per resident
  const residentDebts = useMemo(() => {
    const map = new Map<string, { totalPaid: number; totalDebt: number; pendingCount: number }>();
    residents.forEach((r) => {
      const rContribs = contributions.filter((c) => c.residentId === r.id);
      const paid = rContribs.reduce((acc, c) => acc + c.amountPaid, 0);
      const debt = rContribs.reduce((acc, c) => acc + (c.amount - c.amountPaid), 0);
      const pending = rContribs.filter((c) => c.amount > c.amountPaid).length;
      map.set(r.id, { totalPaid: paid, totalDebt: debt, pendingCount: pending });
    });
    return map;
  }, [residents, contributions]);

  // Filtered residents
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      const debtInfo = residentDebts.get(r.id) || { totalPaid: 0, totalDebt: 0, pendingCount: 0 };
      const matchesSearch =
        r.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.documentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.block.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.lot.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.sector.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesBlock = filterBlock === 'ALL' || r.block === filterBlock;
      const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
      const matchesDebt =
        filterDebt === 'ALL' ||
        (filterDebt === 'WITH_DEBT' && debtInfo.totalDebt > 0) ||
        (filterDebt === 'NO_DEBT' && debtInfo.totalDebt === 0) ||
        (filterDebt === 'FRAUD_RISK' && r.isFraudRisk);

      return matchesSearch && matchesBlock && matchesStatus && matchesDebt;
    });
  }, [residents, searchTerm, filterBlock, filterStatus, filterDebt, residentDebts]);

  const handleExportExcel = () => {
    exportResidentsToExcel(residents, contributions, settings, currentUser);
  };

  return (
    <div className="space-y-4">
      {/* Top Sub-Navigation Tabs: Padrón Activo vs Solicitudes de Terreno */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 flex-wrap">
        <button
          onClick={() => setActiveSubTab('padrón')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
            activeSubTab === 'padrón'
              ? 'bg-[#1877F2] text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Padrón de Ocupantes Activos</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-black ${
              activeSubTab === 'padrón' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
            }`}
          >
            {residents.length}
          </span>
        </button>

        {(isAdmin || currentUser?.permissions?.canManageLandRequests) && (
          <button
            onClick={() => setActiveSubTab('solicitudes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer ${
              activeSubTab === 'solicitudes'
                ? 'bg-[#1877F2] text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Solicitudes de Terreno & Reubicaciones</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-black ${
                activeSubTab === 'solicitudes'
                  ? 'bg-white/20 text-white'
                  : pendingRequestsCount > 0
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 text-slate-700'
              }`}
            >
              {landRequests.length}
            </span>
            {pendingRequestsCount > 0 && (
              <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300">
                {pendingRequestsCount} por evaluar
              </span>
            )}
          </button>
        )}
      </div>

      {activeSubTab === 'solicitudes' && (isAdmin || currentUser?.permissions?.canManageLandRequests) ? (
        <LandRequestsView
          requests={landRequests}
          residents={residents}
          settings={settings}
          onOpenNewRequest={onOpenNewRequest}
          onEditRequest={onEditRequest}
          onDeleteRequest={onDeleteRequest}
          onApproveAndPromote={onApproveAndPromote}
          onUpdateStatus={onUpdateLandRequestStatus}
        />
      ) : (
        <>
          {/* Transparency & Personal Data Privacy Notice */}
          <div className="bg-slate-900 text-white rounded-xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/30 shrink-0 mt-0.5 sm:mt-0">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="text-xs">
                <p className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                  Transparencia Comunal & Protección de Datos Personales
                </p>
                <p className="text-slate-300 mt-0.5 leading-relaxed">
                  Los aportes económicos, ocupación de lotes y faenas son <strong>100% públicos y auditables</strong>.
                  Por privacidad, los números de cédula, fotos de documentos y teléfonos están reservados exclusivamente para la <strong>Comisión Directiva</strong> y el <strong>propio titular</strong>.
                </p>
              </div>
            </div>
          </div>

          {/* Controls Bar: Search, Filters & Export */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="search-residents-input"
                  type="text"
                  placeholder="Buscar por Nombre, Cédula (C.I.), Manzana, Lote, Celular..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    Limpiar
                  </button>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {(isAdmin || currentUser?.permissions?.canManageLandRequests) && (
                  <button
                    onClick={onOpenNewRequest}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-[#1877F2] text-xs font-bold rounded-lg border border-blue-200 transition-colors cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    + Solicitud de Terreno
                  </button>
                )}
                {(isAdmin || currentUser?.permissions?.canExportReports) && (
                  <>
                    <button
                      id="btn-print-indert-pdf"
                      onClick={() => exportIndertOfficialCensusPDF(residents, settings, currentUser)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 transition-colors cursor-pointer"
                      title="Imprimir Planilla Oficial INDERT en PDF (A4 Horizontal)"
                    >
                      <Printer className="w-4 h-4 text-emerald-600" />
                      Planilla INDERT (PDF)
                    </button>
                    <button
                      id="btn-export-catastro-excel"
                      onClick={() => exportCadastralRegistryToExcel(residents, settings)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold rounded-lg border border-purple-300 transition-colors cursor-pointer"
                      title="Exportar Catastro Comunal de Lotes y Manzanas"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-purple-600" />
                      Catastro (Excel)
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg border border-slate-300 transition-colors cursor-pointer"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Padrón Excel
                    </button>
                  </>
                )}
                {(isAdmin || currentUser?.permissions?.canManageResidents) && (
                  <button
                    id="btn-add-resident-tab"
                    onClick={onOpenNewResident}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Registrar Residente
                  </button>
                )}
              </div>
            </div>

        {/* Filters Ribbons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium whitespace-nowrap">Manzana:</span>
            <select
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white text-xs"
            >
              <option value="ALL">Todas las Manzanas ({residents.length})</option>
              {blocks.map((b) => (
                <option key={b} value={b}>
                  Manzana {b} ({residents.filter((r) => r.block === b).length})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium whitespace-nowrap">Estado Censo:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white text-xs"
            >
              <option value="ALL">Todos los Estados</option>
              <option value="active">Activos / Titulares</option>
              <option value="flagged">Observados por Sospecha</option>
              <option value="transferred">Traspasados</option>
              <option value="evicted">Desalojados</option>
              <option value="inactive">Inactivos</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium whitespace-nowrap">Cuotas y Deudas:</span>
            <select
              value={filterDebt}
              onChange={(e) => setFilterDebt(e.target.value)}
              className="w-full py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
            >
              <option value="ALL">Todos los Registros</option>
              <option value="WITH_DEBT">🚨 Con Pagos Pendientes (Deudores)</option>
              <option value="NO_DEBT">✅ Al Día en Cuotas</option>
              <option value="FRAUD_RISK">⚠️ En Alerta Anti-Fraude</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Mostrando <strong className="text-slate-800">{filteredResidents.length}</strong> de{' '}
          {residents.length} residentes censados
        </span>
      </div>

      {/* Residents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredResidents.length === 0 ? (
          <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300 p-8">
            <p className="text-slate-500 text-sm">No se encontraron residentes con los filtros aplicados.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterBlock('ALL');
                setFilterStatus('ALL');
                setFilterDebt('ALL');
              }}
              className="mt-2 text-xs text-emerald-600 font-semibold hover:underline"
            >
              Restablecer filtros de búsqueda
            </button>
          </div>
        ) : (
          filteredResidents.map((resident) => {
            const debtInfo = residentDebts.get(resident.id) || {
              totalPaid: 0,
              totalDebt: 0,
              pendingCount: 0,
            };
            const matchingUser = users?.find(
              (u) =>
                u.documentId.toLowerCase() === resident.documentId.toLowerCase() ||
                (u.block === resident.block && u.lot === resident.lot)
            );
            const canAccessSensitive = canViewSensitiveResidentData(currentUser, resident);

            return (
              <div
                key={resident.id}
                className={`bg-white rounded-xl border p-4 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between ${
                  resident.isFraudRisk
                    ? 'border-rose-300 ring-1 ring-rose-300/40 bg-rose-50/20'
                    : debtInfo.totalDebt > 0
                    ? 'border-amber-200'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  {/* Top Bar: Lote & Badges */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2.5 py-1 bg-slate-900 text-white rounded-md text-xs font-bold tracking-wide">
                        Mz. {resident.block} • Lote {resident.lot}
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {resident.barrio || 'Sector 16'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {resident.documentFrontUrl && (
                        <span
                          title={
                            canAccessSensitive
                              ? 'Cédula de Identidad Digitalizada (Ambos Lados)'
                              : 'Cédula Oficial Digitalizada (Acceso Reservado a Directiva y Titular)'
                          }
                          className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold border ${
                            canAccessSensitive
                              ? 'bg-blue-50 text-[#1877F2] border-blue-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {canAccessSensitive ? (
                            <FileCheck className="w-3 h-3" />
                          ) : (
                            <Lock className="w-2.5 h-2.5" />
                          )}
                          C.I.
                        </span>
                      )}
                      {resident.isFraudRisk ? (
                        canAccessSensitive ? (
                          <span
                            title={resident.fraudNotes || 'Riesgo de fraude de terreno'}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse"
                          >
                            <ShieldAlert className="w-3 h-3" />
                            Alerta
                          </span>
                        ) : (
                          <span
                            title="Lote en verificación por la Directiva"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200"
                          >
                            En Verificación
                          </span>
                        )
                      ) : resident.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-100 text-emerald-800">
                          <ShieldCheck className="w-3 h-3" />
                          Activo
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
                          {resident.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Resident Name & C.I. */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-900 text-base leading-snug">
                      {resident.fullName}
                    </h4>
                    {matchingUser && matchingUser.role !== 'residente' && (
                      <UserBadge
                        role={matchingUser.role}
                        customTitle={matchingUser.customRoleTitle}
                        assignedBlock={matchingUser.assignedBlock}
                        size="xs"
                        withGlow={true}
                      />
                    )}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span>C.I. / DNI:</span>
                    {canAccessSensitive ? (
                      <strong className="text-slate-800">{resident.documentId}</strong>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">
                        <Lock className="w-2.5 h-2.5 text-slate-400" />
                        {maskDocumentId(resident.documentId, false)}
                      </span>
                    )}
                  </div>

                  {/* Demographic Badges: Civil Status, Children, Disability */}
                  <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                      <Heart className="w-3 h-3 text-rose-500" />
                      {resident.maritalStatus === 'casado'
                        ? 'Casado/a'
                        : resident.maritalStatus === 'concubinato'
                        ? 'Concubinato'
                        : resident.hasPartner
                        ? 'Con Pareja'
                        : 'Soltero/a'}
                    </span>
                    {(resident.childrenCount !== undefined && resident.childrenCount > 0) && (
                      <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold">
                        {resident.childrenCount} {resident.childrenCount === 1 ? 'hijo' : 'hijos'}
                      </span>
                    )}
                    {resident.hasChildrenWithDisability && (
                      <span
                        title={canAccessSensitive ? (resident.disabilityDetails || 'Familiar con discapacidad') : 'Familiar con discapacidad (Datos reservados)'}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 font-bold border border-amber-200"
                      >
                        <Accessibility className="w-3 h-3 text-amber-700" />
                        Discapacidad
                      </span>
                    )}
                  </div>

                  {/* Phone & Family */}
                  <div className="flex items-center justify-between text-xs text-slate-600 mt-2.5 pt-2.5 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {canAccessSensitive ? (
                        resident.phone
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-slate-500 text-[11px]">
                          <Lock className="w-2.5 h-2.5 text-slate-400" />
                          {maskPhone(resident.phone, false)}
                        </span>
                      )}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {resident.familyMembersCount} pers. en lote
                    </span>
                  </div>

                  {/* Financial Status Summary */}
                  <div className="mt-2.5 p-2 bg-slate-50 rounded-lg text-xs flex items-center justify-between border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Total Aportes</span>
                      <span className="font-bold text-slate-900">
                        {formatGuaranies(debtInfo.totalPaid)}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">Deuda Pendiente</span>
                      {debtInfo.totalDebt > 0 ? (
                        <span className="font-bold text-rose-600">
                          {formatGuaranies(debtInfo.totalDebt)} ({debtInfo.pendingCount} cuotas)
                        </span>
                      ) : (
                        <span className="font-bold text-emerald-700">Al día ✓</span>
                      )}
                    </div>
                  </div>

                  {/* Anti-Fraud Snippet */}
                  {canAccessSensitive && resident.previousSettlementHistory && (
                    <div className="mt-2 text-[11px] text-slate-500 line-clamp-1 italic">
                      Antecedente: {resident.previousSettlementHistory}
                    </div>
                  )}
                </div>

                {/* Card Action Buttons */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onSelectResident(resident)}
                      title="Ver Ficha y Estado de Cuenta Público"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ficha
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => onOpenContributionForResident(resident)}
                        title="Registrar Cobro de Cuota"
                        className="p-1.5 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {canAccessSensitive && (
                      <button
                        onClick={() =>
                          openWhatsApp(
                            resident.phone,
                            `Hola ${resident.fullName} (Mz ${resident.block}-Lote ${resident.lot}), le saludamos de la directiva comunal.`
                          )
                        }
                        title="Abrir WhatsApp"
                        className="p-1.5 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 rounded-lg text-xs transition-colors cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {isAdmin && (
                      <button
                        onClick={() => onOpenRelocateModal(resident)}
                        title="Reubicar a otra Manzana / Lote"
                        className="p-1.5 text-blue-700 hover:bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditResident(resident)}
                        title="Editar datos del residente"
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `¿Está seguro de eliminar del censo a ${resident.fullName} (Mz ${resident.block} - Lote ${resident.lot})?`
                            )
                          ) {
                            onDeleteResident(resident.id);
                          }
                        }}
                        title="Eliminar del padrón"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  )}
</div>
  );
};

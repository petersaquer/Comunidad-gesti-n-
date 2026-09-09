import React, { useState } from 'react';
import {
  User,
  MapPin,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Phone,
  Home,
  Users,
  Landmark,
  Plus,
  KeyRound,
} from 'lucide-react';
import {
  UserAccount,
  Resident,
  Contribution,
  MaintenanceShift,
  IndertDocument,
  CommunitySettings,
  Meeting,
} from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { downloadResidentCertificate, downloadIndertDocument } from '../utils/fileDownloader';
import { ResidentCarnetModal } from "./ResidentCarnetModal";
import { downloadCommunityGuidePdf } from '../utils/communityDocPdfGenerator';
import { formatGuaranies } from '../utils/currency';
import { formatParaguayDate, formatParaguayTime } from '../utils/paraguayDate';
import { Heart, Accessibility, FileCheck, Eye, X, BookOpen, ShieldAlert } from 'lucide-react';

interface ResidentPortalViewProps {
  currentUser: UserAccount;
  resident: Resident | null;
  contributions: Contribution[];
  shifts: MaintenanceShift[];
  documents: IndertDocument[];
  meetings: Meeting[];
  settings: CommunitySettings;
  onOpenNewContribution: (residentId: string) => void;
  onOpenNewDoc: () => void;
  onOpenNewIncident: () => void;
  onSwitchUser: () => void;
  onOpenChangePassword?: () => void;
  onOpenCommunityGuideModal?: () => void;
  onOpenLegalTermsModal?: () => void;
}

export const ResidentPortalView: React.FC<ResidentPortalViewProps> = ({
  currentUser,
  resident,
  contributions,
  shifts,
  documents,
  meetings,
  settings,
  onOpenNewContribution,
  onOpenNewDoc,
  onOpenNewIncident,
  onSwitchUser,
  onOpenChangePassword,
  onOpenCommunityGuideModal,
  onOpenLegalTermsModal,
}) => {
  const [isCarnetOpen, setIsCarnetOpen] = useState(false);

  // Attendance Calculations
  const completedMeetings = meetings.filter(m => m.status === 'completed');
  
  const qrId = resident?.id || currentUser.documentId || currentUser.id;
  const qrDisplayId = resident?.documentId || currentUser.documentId || 'ADMIN';
  
  const attendedMeetingsCount = completedMeetings.filter(m => 
    m.attendees.includes(qrId) || m.attendees.includes(qrDisplayId)
  ).length;
  
  const missedMeetingsCount = completedMeetings.length - attendedMeetingsCount;

  // Filter resident contributions
  const residentContributions = resident
    ? contributions.filter((c) => c.residentId === resident.id)
    : [];

  const totalPaid = residentContributions
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.amountPaid, 0);

  const totalUnderReview = residentContributions
    .filter((c) => c.status === 'pending' && c.amountPaid > 0)
    .reduce((sum, c) => sum + c.amountPaid, 0);

  const totalRequired = residentContributions.reduce((sum, c) => sum + c.amount, 0);
  const totalDebt = Math.max(0, totalRequired - totalPaid);
  const isDebtFree = totalDebt <= 0;

  // Filter resident shifts
  const residentShifts = resident
    ? shifts.filter((s) => s.assignedResidentId === resident.id)
    : [];

  // Filter resident documents (or docs related to this lot)
  const residentDocs = resident
    ? documents.filter(
        (d) =>
          d.residentId === resident.id ||
          (d.relatedBlock === resident.block && d.relatedLot === resident.lot)
      )
    : [];

  const [viewingDocPhoto, setViewingDocPhoto] = useState<{ title: string; url: string } | null>(null);

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Facebook Profile Cover & Info Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Cover Photo Bar with Facebook Gradient */}
        <div className="h-32 sm:h-44 bg-gradient-to-r from-blue-700 via-[#1877F2] to-sky-500 relative">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold flex items-center gap-1.5 border border-white/30">
            <Landmark className="w-3.5 h-3.5" />
            {settings.indertExpedienteNumber || 'Exp. INDERT 4821/2024'}
          </div>
        </div>

        {/* Profile Details Header */}
        <div className="px-4 sm:px-6 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-12 sm:-mt-16 gap-4">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
              {/* Facebook Profile Avatar with Ring */}
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-md bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-extrabold text-3xl sm:text-4xl flex items-center justify-center shrink-0">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                    {currentUser.fullName}
                  </h1>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-[#1877F2] border border-blue-200">
                    {currentUser.role === 'admin'
                      ? 'Presidente Comisión INDERT'
                      : currentUser.role === 'directiva'
                      ? 'Miembro de Directiva'
                      : 'Ocupante Titular Censado'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <span>C.I. N°: <strong>{currentUser.documentId}</strong></span>
                  <span>•</span>
                  <span>Celular: <strong>{currentUser.phone}</strong></span>
                  <span>•</span>
                  <span>{settings.communityName}</span>
                </p>
              </div>
            </div>

            {/* Top Quick Actions */}
            <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
              {resident && (
                <>
                <button
                  id="btn-download-my-certificate"
                  onClick={() => downloadResidentCertificate(resident, contributions, settings)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Descargar Certificado Oficial de Ocupante"
                >
                  <Download className="w-4 h-4" />
                  Certificado de Ocupación
                </button>
                <button
                  onClick={() => setIsCarnetOpen(true)}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Ver Carnet Comunitario QR"
                >
                  <User className="w-4 h-4" />
                  Mi Carnet QR
                </button>
                </>
              )}
              {onOpenChangePassword && (
                <button
                  id="btn-portal-change-password"
                  onClick={onOpenChangePassword}
                  className="px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  title="Cambiar mi contraseña de acceso"
                >
                  <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                  Cambiar Contraseña
                </button>
              )}
              <button
                onClick={onSwitchUser}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cambiar de Cuenta
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code and Attendance Control (MOVED TO TOP) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              Carnet de Identidad QR & Asistencias
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Muestra este código al llegar a las asambleas para un registro rápido.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
          {/* Left: QR Code */}
          <div className="flex flex-col items-center justify-center p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <QRCodeSVG 
              value={resident ? resident.id : currentUser.documentId} 
              size={120} 
              level="H" 
              includeMargin={true}
            />
            <span className="text-[10px] text-slate-500 font-mono">
              ID: {resident ? resident.id.slice(-6) : currentUser.documentId}
            </span>
          </div>

          {/* Right: Metrics */}
          <div className="sm:col-span-2 grid grid-cols-2 gap-3">
            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 flex flex-col justify-center">
              <span className="text-xs text-indigo-600 font-bold mb-1">Reuniones Asistidas</span>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-black text-indigo-900">{attendedMeetingsCount}</span>
                <span className="text-xs text-indigo-700/70 mb-1">/ {completedMeetings.length} totales</span>
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex flex-col justify-center ${missedMeetingsCount > 0 ? 'bg-rose-50/50 border-rose-100' : 'bg-emerald-50/50 border-emerald-100'}`}>
              <span className={`text-xs font-bold mb-1 ${missedMeetingsCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                Faltas (Inasistencias)
              </span>
              <div className="flex items-end gap-2">
                <span className={`text-3xl font-black ${missedMeetingsCount > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{missedMeetingsCount}</span>
                {missedMeetingsCount > 0 && (
                  <span className="text-[10px] text-rose-500 mb-1.5 flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3" /> ¡Atención!
                  </span>
                )}
              </div>
            </div>
          </div>

          {completedMeetings.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Historial de Asistencia a Asambleas</p>
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {completedMeetings.map(m => {
                  const attended = m.attendees.includes(qrId) || m.attendees.includes(qrDisplayId);
                  return (
                    <div key={m.id} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="truncate pr-2">
                        <span className="font-semibold text-slate-800">{m.title}</span>
                        <span className="text-[10px] text-slate-500 block">{formatParaguayDate(m.date)}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${attended ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {attended ? 'Presente' : 'Ausente (Falta)'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Grid: Plot info + Financial status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Plot Details Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Home className="w-4 h-4 text-[#1877F2]" />
              Mi Lote & Terreno Asignado
            </h3>
            <span className="text-xs font-mono font-bold bg-blue-50 text-[#1877F2] px-2 py-0.5 rounded-md">
              Mz {resident ? resident.block : currentUser.block || 'A'} - Lote{' '}
              {resident ? resident.lot : currentUser.lot || '01'}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Barrio / Sector:</span>
              <span className="font-bold text-slate-800">
                {resident?.barrio || currentUser.barrio || 'Sector 16'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Sector / Zona:</span>
              <span className="font-bold text-slate-800">
                {resident ? resident.sector : 'Sector Principal'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Estado Civil:</span>
              <span className="font-bold text-slate-800 capitalize">
                {resident?.maritalStatus || 'No especificado'}
              </span>
            </div>

            {resident?.hasPartner && resident.partnerName && (
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Pareja / Cónyuge:</span>
                <span className="font-bold text-slate-800 text-right">
                  {resident.partnerName} {resident.partnerDocumentId ? `(C.I. ${resident.partnerDocumentId})` : ''}
                </span>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Hijos Registrados:</span>
              <span className="font-bold text-slate-800">
                {resident?.childrenCount ?? 0} {resident?.childrenCount === 1 ? 'hijo' : 'hijos'}
              </span>
            </div>

            {resident?.hasChildrenWithDisability && (
              <div className="py-1.5 px-2 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] flex items-start gap-1.5">
                <Accessibility className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">Atención de Discapacidad</strong>
                  <span>{resident.disabilityDetails || 'Prioridad de accesibilidad y asistencia comunal'}</span>
                </div>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Fecha de Posesión:</span>
              <span className="font-bold text-slate-800">
                {resident ? resident.occupationDate : '2023-03-15'}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Miembros en Lote:</span>
              <span className="font-bold text-slate-800">
                {resident ? `${resident.familyMembersCount} personas` : '4 personas'}
              </span>
            </div>

            {/* Documentos C.I. Frente y Dorso */}
            {(resident?.documentFrontUrl || resident?.documentBackUrl) && (
              <div className="py-2 border-t border-slate-100">
                <span className="text-slate-600 font-bold block mb-1.5 flex items-center gap-1">
                  <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                  Cédula Digitalizada:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {resident.documentFrontUrl && (
                    <button
                      type="button"
                      onClick={() => setViewingDocPhoto({ title: `C.I. Frente - ${resident.fullName}`, url: resident.documentFrontUrl! })}
                      className="group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-3/2 flex flex-col items-center justify-center cursor-pointer hover:border-[#1877F2] transition-colors"
                    >
                      <img src={resident.documentFrontUrl} alt="C.I. Frente" className="w-full h-full object-cover" />
                      <span className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                        <Eye className="w-3.5 h-3.5 mr-1" /> Ver Frente
                      </span>
                    </button>
                  )}
                  {resident.documentBackUrl && (
                    <button
                      type="button"
                      onClick={() => setViewingDocPhoto({ title: `C.I. Dorso - ${resident.fullName}`, url: resident.documentBackUrl! })}
                      className="group relative rounded-lg overflow-hidden border border-slate-200 bg-slate-100 aspect-3/2 flex flex-col items-center justify-center cursor-pointer hover:border-[#1877F2] transition-colors"
                    >
                      <img src={resident.documentBackUrl} alt="C.I. Dorso" className="w-full h-full object-cover" />
                      <span className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-opacity">
                        <Eye className="w-3.5 h-3.5 mr-1" /> Ver Dorso
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between py-1 border-b border-slate-50">
              <span className="text-slate-500">Expediente INDERT:</span>
              <span className="font-bold text-[#1877F2]">
                {settings.indertExpedienteNumber || '4821/2024'}
              </span>
            </div>

            <div className="flex justify-between py-1">
              <span className="text-slate-500">Situación de Linderos:</span>
              <span className="font-bold text-emerald-700 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                Amojonado y Delimitado
              </span>
            </div>
          </div>

          <button
            onClick={onOpenNewIncident}
            className="w-full mt-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            Reportar Problema en mi Lote
          </button>
        </div>

        {/* Financial Balance Card */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3 md:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Estado de Cuenta & Aportes Comunitarios
            </h3>

            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                isDebtFree
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {isDebtFree ? 'AL DÍA CON LAS CUOTAS' : 'SALDO PENDIENTE'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Total Aportado</span>
              <span className="text-lg font-bold text-emerald-700">
                {formatGuaranies(totalPaid)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {residentContributions.filter((c) => c.status === 'paid').length} cuotas pagadas
              </span>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-[11px] text-slate-500 block">Saldo Adeudado</span>
              <span
                className={`text-lg font-bold ${
                  totalDebt > 0 ? 'text-amber-600' : 'text-slate-800'
                }`}
              >
                {formatGuaranies(totalDebt)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {totalDebt > 0 ? 'Regularizar en tesorería' : 'Sin pendientes'}
              </span>
            </div>

            <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 flex flex-col justify-center">
              <span className="text-[11px] text-blue-800 font-semibold block">
                Cuota Mensual Comunal
              </span>
              <span className="text-lg font-bold text-[#1877F2]">
                {formatGuaranies(settings.monthlyGeneralFee)} / mes
              </span>
              <span className="text-[10px] text-blue-600 block mt-0.5">
                Incluye agua y gestiones
              </span>
            </div>
          </div>

          {/* Pending Approval Notice */}
          {totalUnderReview > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between gap-2 text-xs text-blue-950">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Tienes <strong>{formatGuaranies(totalUnderReview)}</strong> en pagos informados actualmente <strong>En Revisión</strong> por la Tesorería. Una vez aprobados por el/la tesorero/a, se descontarán de tu saldo deudor.
                </span>
              </div>
              <span className="text-[10px] font-bold bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full shrink-0">
                Pendiente de Aprobación
              </span>
            </div>
          )}

          {/* Contributions List */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                Historial de Mis Aportes y Recibos
              </span>
              {resident && (
                <button
                  onClick={() => onOpenNewContribution(resident.id)}
                  className="text-xs font-bold text-[#1877F2] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Registrar Pago de Cuota
                </button>
              )}
            </div>

            {residentContributions.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-2">
                No hay aportes registrados para este lote todavía.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {residentContributions.map((c) => (
                  <div
                    key={c.id}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between text-xs border border-slate-100 transition-colors"
                  >
                    <div>
                      <span className="font-bold text-slate-800 block">{c.concept}</span>
                      <span className="text-[11px] text-slate-500">
                        {formatParaguayDate(c.date)} • Recibo N° {c.receiptNumber} • {c.paymentMethod}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">
                        {formatGuaranies(c.amountPaid)}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          c.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'partial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {c.status === 'paid'
                          ? 'Pagado'
                          : c.status === 'partial'
                          ? 'Parcial'
                          : 'En Revisión'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Community Guide & Rights Banner */}
      <div className="bg-linear-to-r from-amber-500 via-amber-600 to-yellow-600 rounded-2xl p-4 sm:p-5 text-slate-950 shadow-md flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-black text-slate-950 text-base">
                Guía Comunitaria Oficial & Manual de Transparencia
              </h3>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-950 text-amber-300">
                USO INTERNO VECINAL
              </span>
            </div>
            <p className="text-xs text-slate-900 font-medium mt-1 max-w-xl">
              Conoce tus derechos como ocupante censado, obligaciones comunales, prohibición de ventas ilegales y la política de transparencia de caja abierta.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0">
          {onOpenCommunityGuideModal && (
            <button
              onClick={onOpenCommunityGuideModal}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-white/90 hover:bg-white text-slate-900 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <BookOpen className="w-4 h-4 text-slate-700" />
              <span>Ver Guía Interactiva</span>
            </button>
          )}

          {onOpenLegalTermsModal && (
            <button
              onClick={onOpenLegalTermsModal}
              className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-950/20 hover:bg-slate-950/30 text-slate-950 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-slate-950/20"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Marco Legal</span>
            </button>
          )}

          <button
            id="btn-portal-download-community-guide"
            onClick={() => downloadCommunityGuidePdf(settings)}
            className="flex-1 sm:flex-none px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white hover:text-amber-300 text-xs font-black rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-amber-400" />
            <span>Descargar PDF</span>
          </button>
        </div>
      </div>

      {/* Documents of this Plot (INDERT Carpeta Individual) */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1877F2]" />
              Documentación INDERT de Mi Lote
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Fotocopias de cédula, certificados de arraigo, comprobantes y planos individuales.
            </p>
          </div>

          <button
            onClick={onOpenNewDoc}
            className="px-3.5 py-2 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold rounded-xl shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Upload className="w-3.5 h-3.5" />
            Subir Documento / Foto
          </button>
        </div>

        {residentDocs.length === 0 ? (
          <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-1" />
            <p className="text-xs font-bold text-slate-600">
              Aún no tienes documentos cargados para este lote
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Puedes subir tu fotocopia de cédula o declaración jurada requerida por el INDERT.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {residentDocs.map((doc) => (
              <div
                key={doc.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 hover:border-blue-300 transition-colors"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 line-clamp-1">{doc.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {doc.documentNumber} • {formatParaguayDate(doc.date)}
                  </p>
                </div>
                <button
                  onClick={() => downloadIndertDocument(doc, settings)}
                  className="px-2.5 py-1.5 bg-[#1877F2] hover:bg-[#166fe5] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Shifts & Community Maintenance */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
            <Calendar className="w-4 h-4 text-amber-600" />
            Mis Turnos de Faena & Trabajo Comunitario
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Obligación comunal para titulación
          </span>
        </div>

        {residentShifts.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            No tienes turnos de faena asignados para este mes.
          </p>
        ) : (
          <div className="space-y-2">
            {residentShifts.map((s) => (
              <div
                key={s.id}
                className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <p className="text-xs font-bold text-slate-800">{s.taskTitle}</p>
                  <p className="text-[11px] text-slate-500">
                    Fecha: <strong>{formatParaguayDate(s.dateScheduled)}</strong> ({s.timeSlot})
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      s.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : s.status === 'scheduled'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {s.status === 'completed'
                      ? 'Cumplido'
                      : s.status === 'scheduled'
                      ? 'Programado'
                      : 'Ausente'}
                  </span>
                  {s.status === 'scheduled' && (
                    <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Asistencia Confirmada
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal for C.I. Photo */}
      {viewingDocPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setViewingDocPhoto(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="font-bold text-sm flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-400" />
                {viewingDocPhoto.title}
              </span>
              <button
                type="button"
                onClick={() => setViewingDocPhoto(null)}
                className="p-1 rounded-full hover:bg-white/20 text-white cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[75vh] overflow-auto">
              <img
                src={viewingDocPhoto.url}
                alt={viewingDocPhoto.title}
                className="max-w-full max-h-[70vh] rounded-lg shadow object-contain"
              />
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setViewingDocPhoto(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl cursor-pointer transition-colors"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

      {resident && (
        <ResidentCarnetModal
          isOpen={isCarnetOpen}
          onClose={() => setIsCarnetOpen(false)}
          resident={resident}
          settings={settings}
        />
      )}
    </div>
  );
};

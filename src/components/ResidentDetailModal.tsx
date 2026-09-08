import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Calendar,
  AlertTriangle,
  FileText,
  DollarSign,
  MessageCircle,
  Clock,
  CheckCircle2,
  XCircle,
  MapPin,
  ShieldCheck,
  ShieldAlert,
  Heart,
  Users,
  Eye,
  FileCheck,
  Accessibility,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { Resident, Contribution, MaintenanceShift, CommunitySettings, UserAccount } from '../types';
import { exportResidentAccountStatementToPDF } from '../utils/exportUtils';
import { generatePaymentReminderMessage, openWhatsApp } from '../utils/notificationUtils';
import { formatGuaranies } from '../utils/currency';
import {
  canViewSensitiveResidentData,
  isAdministrativeUser,
  maskDocumentId,
  maskPhone,
} from '../utils/privacyUtils';

interface ResidentDetailModalProps {
  resident: Resident | null;
  contributions: Contribution[];
  shifts: MaintenanceShift[];
  settings: CommunitySettings;
  currentUser?: UserAccount | null;
  onClose: () => void;
  onOpenContributionForResident: (resident: Resident) => void;
  onOpenRelocateModal?: (resident: Resident) => void;
}

export const ResidentDetailModal: React.FC<ResidentDetailModalProps> = ({
  resident,
  contributions,
  shifts,
  settings,
  currentUser,
  onClose,
  onOpenContributionForResident,
  onOpenRelocateModal,
}) => {
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);

  if (!resident) return null;

  const residentContributions = contributions.filter((c) => c.residentId === resident.id);
  const residentShifts = shifts.filter((s) => s.assignedResidentId === resident.id);

  const totalPaid = residentContributions.reduce((acc, c) => acc + c.amountPaid, 0);
  const pendingContributions = residentContributions.filter((c) => c.amount > c.amountPaid);
  const totalDebt = pendingContributions.reduce((acc, c) => acc + (c.amount - c.amountPaid), 0);

  const canAccessSensitive = canViewSensitiveResidentData(currentUser, resident);
  const isAdmin = isAdministrativeUser(currentUser);

  const handleExportPDF = () => {
    exportResidentAccountStatementToPDF(resident, contributions, shifts, settings);
  };

  const handleSendWhatsAppReminder = () => {
    if (!canAccessSensitive) return;
    if (pendingContributions.length === 0) {
      alert('Este residente no registra deudas pendientes en este momento.');
      return;
    }
    const message = generatePaymentReminderMessage(resident, pendingContributions, settings);
    openWhatsApp(resident.phone, message);
  };

  const getMaritalStatusLabel = (status?: string) => {
    switch (status) {
      case 'casado':
        return 'Casado/a';
      case 'concubinato':
        return 'Unión de Hecho / Concubinato';
      case 'viudo':
        return 'Viudo/a';
      case 'divorciado':
        return 'Divorciado/a';
      default:
        return 'Soltero/a';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        id="resident-detail-modal"
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Modal Header */}
        <div className="bg-[#1877F2] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-xl text-white">
              <User className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg font-bold">{resident.fullName}</h3>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    resident.status === 'active'
                      ? 'bg-emerald-500 text-white'
                      : resident.status === 'flagged'
                      ? 'bg-rose-500 text-white'
                      : 'bg-slate-700 text-slate-100'
                  }`}
                >
                  {resident.status === 'active'
                    ? 'Ocupante Activo'
                    : resident.status === 'flagged'
                    ? 'Bajo Observación'
                    : resident.status === 'transferred'
                    ? 'Traspasado'
                    : 'Desalojado'}
                </span>
                <span className="text-xs bg-blue-800/80 px-2 py-0.5 rounded-md font-medium text-blue-100">
                  Barrio: {resident.barrio || 'Sector 16'}
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                C.I. / Documento:{' '}
                {canAccessSensitive ? (
                  <span className="font-bold text-white">{resident.documentId}</span>
                ) : (
                  <span className="font-mono font-bold text-white/90">
                    {maskDocumentId(resident.documentId, false)}
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-[10px] bg-blue-900/80 text-blue-200 px-1.5 py-0.5 rounded font-sans">
                      <Lock className="w-2.5 h-2.5 text-amber-300" /> Protegido
                    </span>
                  </span>
                )}{' '}
                • Mz. <span className="font-bold text-white">{resident.block}</span> - Lote{' '}
                <span className="font-bold text-white">{resident.lot}</span> ({resident.sector})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-sm text-slate-700">
          {/* Anti-Fraud / Historical Settlement Alert Banner */}
          {resident.isFraudRisk ? (
            canAccessSensitive ? (
              <div className="bg-rose-50 border border-rose-300 rounded-xl p-4 flex gap-3 text-rose-900">
                <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-rose-950 text-sm">
                    ⚠️ ALERTA DE OCUPACIÓN / RIESGO DE FRAUDE DE TERRENO
                  </h4>
                  <p className="text-xs mt-1 text-rose-800">
                    {resident.previousSettlementHistory ||
                      'El residente cuenta con reportes o indicios de duplicidad o acaparamiento ilegal.'}
                  </p>
                  {resident.fraudNotes && (
                    <p className="text-xs mt-1.5 font-medium bg-rose-100/70 p-2 rounded-lg text-rose-950">
                      Dictamen Vecinal: {resident.fraudNotes}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 text-amber-900 text-xs">
                <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-semibold">Historial Comunitario:</span> Registro en proceso de verificación administrativa por la Comisión Directiva.
                </div>
              </div>
            )
          ) : (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3 text-emerald-900 text-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="font-semibold">Historial de Ocupación Verificado:</span>{' '}
                {resident.previousSettlementHistory || 'Sin antecedentes en otros asentamientos. Situación regular.'}
              </div>
            </div>
          )}

          {/* Core Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-xs text-slate-500 block">Ubicación del Lote</span>
              <span className="font-bold flex items-center gap-1 mt-0.5 text-slate-900">
                <MapPin className="w-3.5 h-3.5 text-[#1877F2]" />
                Mz. {resident.block} - Lote {resident.lot}
              </span>
              <span className="text-[11px] text-slate-500 block font-medium">
                {resident.barrio || 'Sector 16'} • {resident.sector}
              </span>
              {isAdmin && onOpenRelocateModal && (
                <button
                  onClick={() => onOpenRelocateModal(resident)}
                  className="text-[11px] text-[#1877F2] hover:text-blue-700 font-bold mt-1 inline-flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <ArrowRight className="w-3 h-3" /> Reubicar Lote
                </button>
              )}
            </div>

            <div>
              <span className="text-xs text-slate-500 block">Celular / WhatsApp</span>
              {canAccessSensitive ? (
                <>
                  <span className="font-bold flex items-center gap-1 mt-0.5 text-slate-900">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    {resident.phone}
                  </span>
                  <button
                    onClick={() => openWhatsApp(resident.phone, `Hola ${resident.fullName}, le contactamos de la directiva comunal del Sector 16.`)}
                    className="text-[11px] text-emerald-700 hover:underline font-medium mt-0.5 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <MessageCircle className="w-3 h-3" /> Contactar
                  </button>
                </>
              ) : (
                <>
                  <span className="font-bold flex items-center gap-1 mt-0.5 text-slate-700 font-mono text-xs">
                    <Lock className="w-3 h-3 text-slate-400" />
                    {maskPhone(resident.phone, false)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5 italic">
                    Reservado por privacidad
                  </span>
                </>
              )}
            </div>

            <div>
              <span className="text-xs text-slate-500 block">Fecha Ocupación</span>
              <span className="font-bold flex items-center gap-1 mt-0.5 text-slate-900">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {resident.occupationDate}
              </span>
              <span className="text-[11px] text-slate-500">
                {resident.familyMembersCount} personas en el lote
              </span>
            </div>

            <div>
              <span className="text-xs text-slate-500 block">Estado Financiero</span>
              <span
                className={`font-black mt-0.5 block ${
                  totalDebt > 0 ? 'text-rose-600' : 'text-emerald-700'
                }`}
              >
                {totalDebt > 0 ? `Debe ${formatGuaranies(totalDebt)}` : 'Al día en cuotas'}
              </span>
              <span className="text-[11px] text-slate-500">
                Aportado: {formatGuaranies(totalPaid)}
              </span>
            </div>
          </div>

          {/* Family & Demographic Details Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Datos Demográficos, Familiares y Conyugales</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Estado Civil</span>
                <span className="font-bold text-slate-800 text-sm">
                  {getMaritalStatusLabel(resident.maritalStatus)}
                </span>
                <span className="text-slate-400 block text-[10px] mt-0.5">
                  {resident.hasPartner ? 'Convive con pareja' : 'Sin cónyuge en lote'}
                </span>
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Pareja / Cónyuge</span>
                {resident.hasPartner ? (
                  canAccessSensitive && resident.partnerName ? (
                    <div>
                      <span className="font-bold text-slate-800 text-sm block truncate">
                        {resident.partnerName}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        C.I. {resident.partnerDocumentId || 'S/N'}
                      </span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-medium text-slate-700 text-xs block">
                        Concubinato registrado
                      </span>
                      <span className="text-slate-400 text-[10px] italic">
                        Identidad conyugal protegida
                      </span>
                    </div>
                  )
                ) : (
                  <span className="text-slate-400 italic">No especificado</span>
                )}
              </div>

              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-slate-500 block text-[11px]">Hijos & Familiares</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-base font-black text-slate-800">
                    {resident.childrenCount ?? 0}
                  </span>
                  <span className="text-slate-600 font-medium">hijos a cargo</span>
                </div>
                <span className="text-slate-400 text-[10px]">
                  Total {resident.familyMembersCount} habitantes
                </span>
              </div>
            </div>

            {/* Disability Alert if Applicable */}
            {resident.hasChildrenWithDisability && (
              <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex items-start gap-2.5 text-xs text-amber-950">
                <Accessibility className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">
                    Familia con Miembro / Hijos con Discapacidad Registrada
                  </span>
                  <p className="text-amber-900 mt-0.5">
                    {canAccessSensitive
                      ? resident.disabilityDetails || 'Requiere condiciones especiales de acceso y consideración prioritaria de servicios.'
                      : 'Familia con consideración prioritaria vecinal en asamblea (detalle médico confidencial).'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* C.I. Documents Photos (Both Sides: Front & Back) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5 flex-wrap gap-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-[#1877F2]" />
                Fotocopia de Cédula de Identidad (Ambos Lados)
              </h4>
              <span className="text-[10px] text-slate-500 font-normal">
                Archivo Digital INDERT
              </span>
            </div>

            {canAccessSensitive ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Frente / Anverso */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">1. Frente (Anverso)</span>
                    {resident.documentFrontUrl ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Digitalizado
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Sin foto</span>
                    )}
                  </div>

                  {resident.documentFrontUrl ? (
                    <div
                      onClick={() =>
                        setLightboxImage({
                          url: resident.documentFrontUrl!,
                          title: `Cédula Frente - ${resident.fullName}`,
                        })
                      }
                      className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 h-36 flex items-center justify-center cursor-pointer"
                    >
                      <img
                        src={resident.documentFrontUrl}
                        alt="C.I. Frente"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                        <Eye className="w-4 h-4" />
                        <span>Ampliar Documento</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-36 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <span>No se cargó foto del frente</span>
                    </div>
                  )}
                </div>

                {/* Dorso / Reverso */}
                <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700">2. Dorso (Reverso)</span>
                    {resident.documentBackUrl ? (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Digitalizado
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Sin foto</span>
                    )}
                  </div>

                  {resident.documentBackUrl ? (
                    <div
                      onClick={() =>
                        setLightboxImage({
                          url: resident.documentBackUrl!,
                          title: `Cédula Dorso - ${resident.fullName}`,
                        })
                      }
                      className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 h-36 flex items-center justify-center cursor-pointer"
                    >
                      <img
                        src={resident.documentBackUrl}
                        alt="C.I. Dorso"
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-bold">
                        <Eye className="w-4 h-4" />
                        <span>Ampliar Documento</span>
                      </div>
                    </div>
                  ) : (
                    <div className="h-36 rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 text-xs">
                      <span>No se cargó foto del dorso</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-center space-y-2.5">
                <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-slate-900 text-sm">
                    Fotocopias de Cédula Protegidas
                  </h5>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
                    Por normativa de privacidad y protección de datos personales de la comunidad, las imágenes de documentos civiles solo son accesibles por la <strong>Comisión Directiva</strong> y el <strong>propio titular</strong>.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-[11px] text-blue-700 bg-blue-50 px-3 py-1 rounded-full font-bold border border-blue-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                  Archivos oficiales validados en el Padrón INDERT
                </div>
              </div>
            )}
          </div>

          {/* Relocation History Section */}
          {resident.relocationHistory && resident.relocationHistory.length > 0 && (
            <div className="bg-amber-50/60 p-4 rounded-xl border border-amber-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                  <ArrowRight className="w-4 h-4 text-amber-600" />
                  Historial de Reubicaciones de Lote (Padrón Oficial)
                </h4>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                  {resident.relocationHistory.length} {resident.relocationHistory.length === 1 ? 'reubicación' : 'reubicaciones'}
                </span>
              </div>

              <div className="space-y-2">
                {resident.relocationHistory.map((rec) => (
                  <div
                    key={rec.id}
                    className="bg-white p-3 rounded-lg border border-amber-200 text-xs shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <div className="flex items-center gap-2 font-bold">
                        <span className="text-slate-600 line-through">
                          Mz {rec.fromBlock} - Lote {rec.fromLot}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          Mz {rec.toBlock} - Lote {rec.toLot}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {rec.date} • {rec.actNumber}
                      </span>
                    </div>

                    <div className="text-slate-700">
                      <strong>Motivo:</strong> {rec.reason}
                    </div>

                    <div className="text-[11px] text-slate-500 flex items-center justify-between">
                      <span>Autorizado por: {rec.authorizedBy}</span>
                      {rec.notes && <span className="italic">{rec.notes}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contributions / Cuotas de Servicios (Luz, Agua, etc.) */}
          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Historial de Aportes y Cuotas de Servicios
                </h4>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Transparencia Pública
                </span>
              </div>
              {isAdmin && (
                <button
                  onClick={() => onOpenContributionForResident(resident)}
                  className="text-xs bg-[#1877F2] text-white hover:bg-blue-600 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer shadow-xs"
                >
                  + Registrar Cobro
                </button>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Fecha / Recibo</th>
                    <th className="py-2 px-3">Categoría & Concepto</th>
                    <th className="py-2 px-3">Monto Cuota</th>
                    <th className="py-2 px-3">Abonado</th>
                    <th className="py-2 px-3">Saldo</th>
                    <th className="py-2 px-3">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {residentContributions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-slate-400">
                        No registra pagos ni cuotas registradas aún.
                      </td>
                    </tr>
                  ) : (
                    residentContributions.map((c) => {
                      const balance = c.amount - c.amountPaid;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-medium text-slate-800">
                            <div>{c.date}</div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {c.receiptNumber}
                            </span>
                          </td>
                          <td className="py-2 px-3">
                            <span className="inline-block px-1.5 py-0.5 text-[10px] rounded font-semibold bg-slate-200 text-slate-700 uppercase mr-1.5">
                              {c.category}
                            </span>
                            <span className="text-slate-800">{c.concept}</span>
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-900">
                            {formatGuaranies(c.amount)}
                          </td>
                          <td className="py-2 px-3 text-emerald-700 font-semibold">
                            {formatGuaranies(c.amountPaid)}
                          </td>
                          <td className="py-2 px-3 font-semibold">
                            {balance > 0 ? (
                              <span className="text-rose-600">
                                {formatGuaranies(balance)}
                              </span>
                            ) : (
                              <span className="text-slate-400">Gs. 0</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                c.status === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : c.status === 'partial'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {c.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                              {c.status === 'pending' && <XCircle className="w-3 h-3" />}
                              {c.status === 'paid'
                                ? 'Pagado'
                                : c.status === 'partial'
                                ? 'Parcial'
                                : 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Maintenance Shifts & Faenas */}
          <div>
            <h4 className="font-bold text-slate-900 flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-amber-600" />
              Turnos de Mantenimiento y Faenas Comunitarias
            </h4>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Fecha & Hora</th>
                    <th className="py-2 px-3">Labor / Tarea Asignada</th>
                    <th className="py-2 px-3">Estado</th>
                    <th className="py-2 px-3">Observaciones / Multa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {residentShifts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">
                        No tiene faenas asignadas en el período.
                      </td>
                    </tr>
                  ) : (
                    residentShifts.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-medium text-slate-800">
                          {s.dateScheduled}
                          <div className="text-[11px] text-slate-500">{s.timeSlot}</div>
                        </td>
                        <td className="py-2 px-3">
                          <span className="font-medium text-slate-800 block">{s.taskTitle}</span>
                          <span className="text-[10px] text-slate-500 uppercase">{s.taskCategory}</span>
                        </td>
                        <td className="py-2 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              s.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : s.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-800'
                                : s.status === 'absent'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {s.status === 'completed'
                              ? 'Cumplido'
                              : s.status === 'scheduled'
                              ? 'Programado'
                              : s.status === 'absent'
                              ? 'Ausente (Falta)'
                              : s.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-600">
                          {s.completionNotes || '-'}
                          {s.fineAmount ? (
                            <span className="block text-rose-600 font-bold text-[11px]">
                              Multa impuesta: {formatGuaranies(s.fineAmount)}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-400" />
              Descargar Estado de Cuenta PDF
            </button>
            {isAdmin && onOpenRelocateModal && (
              <button
                onClick={() => onOpenRelocateModal(resident)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-[#1877F2] hover:bg-blue-100 border border-blue-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                Reubicar Ocupante (Cambio Mz/Lote)
              </button>
            )}
            {totalDebt > 0 && canAccessSensitive && (
              <button
                onClick={handleSendWhatsAppReminder}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" />
                Notificar Deuda por WhatsApp
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* Lightbox Zoom for C.I. */}
      {lightboxImage && (
        <div className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <h3 className="font-bold text-slate-900 text-sm">{lightboxImage.title}</h3>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="py-3 flex items-center justify-center bg-slate-900 rounded-xl mt-3">
              <img
                src={lightboxImage.url}
                alt="Documento C.I."
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="mt-3 flex justify-end">
              <button
                onClick={() => setLightboxImage(null)}
                className="px-4 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

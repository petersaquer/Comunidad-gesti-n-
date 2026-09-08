import React, { useState, useMemo } from 'react';
import {
  Search,
  FilePlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MessageCircle,
  MapPin,
  Heart,
  Phone,
  Edit2,
  Trash2,
  Eye,
  UserCheck,
  FileText,
  Accessibility,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { LandRequest, LandRequestStatus, Resident, CommunitySettings } from '../types';
import { openWhatsApp } from '../utils/notificationUtils';

interface LandRequestsViewProps {
  requests: LandRequest[];
  residents: Resident[];
  settings: CommunitySettings;
  onOpenNewRequest: () => void;
  onEditRequest: (request: LandRequest) => void;
  onDeleteRequest: (id: string) => void;
  onApproveAndPromote: (request: LandRequest, assignedBlock: string, assignedLot: string) => void;
  onUpdateStatus: (requestId: string, status: LandRequestStatus, notes?: string, missingDocs?: string) => void;
}

export const LandRequestsView: React.FC<LandRequestsViewProps> = ({
  requests,
  residents,
  settings,
  onOpenNewRequest,
  onEditRequest,
  onDeleteRequest,
  onApproveAndPromote,
  onUpdateStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Quick action modal states
  const [approvingRequest, setApprovingRequest] = useState<LandRequest | null>(null);
  const [approveBlock, setApproveBlock] = useState('A');
  const [approveLot, setApproveLot] = useState('');
  const [approvePromoteResident, setApprovePromoteResident] = useState(true);

  const [missingDocsRequest, setMissingDocsRequest] = useState<LandRequest | null>(null);
  const [missingDocsText, setMissingDocsText] = useState('');

  const [denyingRequest, setDenyingRequest] = useState<LandRequest | null>(null);
  const [denyReasonText, setDenyReasonText] = useState('');

  // Metrics count
  const metrics = useMemo(() => {
    const pending = requests.filter((r) => r.status === 'pendiente').length;
    const missing = requests.filter((r) => r.status === 'falta_documentos').length;
    const approved = requests.filter((r) => r.status === 'aprobado').length;
    const denied = requests.filter((r) => r.status === 'denegado').length;
    return { total: requests.length, pending, missing, approved, denied };
  }, [requests]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchesSearch =
        r.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.documentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.requestedBlock && r.requestedBlock.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.requestedLot && r.requestedLot.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.assignedBlock && r.assignedBlock.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (r.assignedLot && r.assignedLot.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesStatus = filterStatus === 'ALL' || r.status === filterStatus;
      const matchesType = filterType === 'ALL' || r.requestType === filterType;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [requests, searchTerm, filterStatus, filterType]);

  const handleStartApprove = (req: LandRequest) => {
    setApprovingRequest(req);
    setApproveBlock(req.assignedBlock || req.requestedBlock || 'A');
    setApproveLot(req.assignedLot || req.requestedLot || '');
    setApprovePromoteResident(true);
  };

  const handleConfirmApprove = () => {
    if (!approvingRequest || !approveBlock || !approveLot) return;
    onApproveAndPromote(approvingRequest, approveBlock.trim().toUpperCase(), approveLot.trim());
    setApprovingRequest(null);
  };

  const handleStartMissingDocs = (req: LandRequest) => {
    setMissingDocsRequest(req);
    setMissingDocsText(
      req.missingDocumentsNotes ||
        'Falta fotocopia autenticada de C.I. (Dorso) y Certificado de Vida y Residencia expedido por la comisaría jurisdiccional.'
    );
  };

  const handleConfirmMissingDocs = () => {
    if (!missingDocsRequest) return;
    onUpdateStatus(
      missingDocsRequest.id,
      'falta_documentos',
      'Observado por falta de documentos INDERT',
      missingDocsText
    );
    // Notify via WhatsApp
    const msg = `Estimado/a ${missingDocsRequest.applicantName} (C.I. ${missingDocsRequest.documentId}):\nLe contactamos de la Comisión Vecinal del Sector 16. Su solicitud de terreno se encuentra en estado *FALTA DE DOCUMENTOS*:\n\n*Documentos pendientes:*\n${missingDocsText}\n\nFavor remitir a la directiva a la brevedad para regularizar su legajo.`;
    openWhatsApp(missingDocsRequest.phone, msg);
    setMissingDocsRequest(null);
  };

  const handleStartDeny = (req: LandRequest) => {
    setDenyingRequest(req);
    setDenyReasonText(
      req.decisionNotes || 'Denegado por antecedentes de doble adjudicación o comercialización de lotes comunales.'
    );
  };

  const handleConfirmDeny = () => {
    if (!denyingRequest) return;
    onUpdateStatus(denyingRequest.id, 'denegado', denyReasonText);
    setDenyingRequest(null);
  };

  const getStatusBadge = (status: LandRequestStatus) => {
    switch (status) {
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Pendiente de Evaluación
          </span>
        );
      case 'falta_documentos':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
            <AlertCircle className="w-3 h-3 text-blue-600" />
            Falta de Documentos
          </span>
        );
      case 'aprobado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Aprobado / Adjudicado
          </span>
        );
      case 'denegado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-300">
            <XCircle className="w-3 h-3 text-rose-600" />
            Denegado
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Status Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          onClick={() => setFilterStatus('ALL')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            filterStatus === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
              : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
            Total Solicitudes
          </span>
          <span className="text-xl font-black">{metrics.total}</span>
        </button>

        <button
          onClick={() => setFilterStatus('pendiente')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            filterStatus === 'pendiente'
              ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
              : 'bg-white text-amber-900 border-amber-200 hover:bg-amber-50/60'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-85">
            Pendientes
          </span>
          <span className="text-xl font-black">{metrics.pending}</span>
        </button>

        <button
          onClick={() => setFilterStatus('falta_documentos')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            filterStatus === 'falta_documentos'
              ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
              : 'bg-white text-blue-900 border-blue-200 hover:bg-blue-50/60'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-85">
            Falta Documentos
          </span>
          <span className="text-xl font-black">{metrics.missing}</span>
        </button>

        <button
          onClick={() => setFilterStatus('aprobado')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            filterStatus === 'aprobado'
              ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
              : 'bg-white text-emerald-900 border-emerald-200 hover:bg-emerald-50/60'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-85">
            Aprobados
          </span>
          <span className="text-xl font-black">{metrics.approved}</span>
        </button>

        <button
          onClick={() => setFilterStatus('denegado')}
          className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
            filterStatus === 'denegado'
              ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
              : 'bg-white text-rose-900 border-rose-200 hover:bg-rose-50/60'
          }`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-85">
            Denegados
          </span>
          <span className="text-xl font-black">{metrics.denied}</span>
        </button>
      </div>

      {/* Action Controls & Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar postulante por Nombre, Cédula (C.I.), Manzana, Teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs md:text-sm focus:ring-2 focus:ring-[#1877F2] focus:border-blue-500"
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

          {/* New Request Button */}
          <button
            onClick={onOpenNewRequest}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#1877F2] hover:bg-blue-600 text-white rounded-lg text-xs md:text-sm font-bold shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Registrar Nueva Solicitud de Terreno</span>
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 font-semibold shrink-0">Filtrar:</span>

          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1 rounded-full font-bold transition-colors cursor-pointer shrink-0 ${
              filterStatus === 'ALL'
                ? 'bg-slate-800 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Todos ({metrics.total})
          </button>

          <button
            onClick={() => setFilterStatus('pendiente')}
            className={`px-3 py-1 rounded-full font-bold transition-colors cursor-pointer shrink-0 ${
              filterStatus === 'pendiente'
                ? 'bg-amber-500 text-white'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            Pendientes ({metrics.pending})
          </button>

          <button
            onClick={() => setFilterStatus('falta_documentos')}
            className={`px-3 py-1 rounded-full font-bold transition-colors cursor-pointer shrink-0 ${
              filterStatus === 'falta_documentos'
                ? 'bg-blue-600 text-white'
                : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200'
            }`}
          >
            Falta Documentos ({metrics.missing})
          </button>

          <button
            onClick={() => setFilterStatus('aprobado')}
            className={`px-3 py-1 rounded-full font-bold transition-colors cursor-pointer shrink-0 ${
              filterStatus === 'aprobado'
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            Aprobados ({metrics.approved})
          </button>

          <button
            onClick={() => setFilterStatus('denegado')}
            className={`px-3 py-1 rounded-full font-bold transition-colors cursor-pointer shrink-0 ${
              filterStatus === 'denegado'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            Denegados ({metrics.denied})
          </button>

          <span className="text-slate-300">|</span>

          {/* Type Selector */}
          <button
            onClick={() => setFilterType(filterType === 'reubicacion' ? 'ALL' : 'reubicacion')}
            className={`px-3 py-1 rounded-full font-bold transition-colors cursor-pointer shrink-0 ${
              filterType === 'reubicacion'
                ? 'bg-indigo-600 text-white'
                : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            Solo Reubicaciones
          </button>
        </div>
      </div>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 mx-auto flex items-center justify-center text-slate-400">
            <FilePlus className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">No se encontraron solicitudes</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No hay solicitudes que coincidan con los filtros actuales. Puede registrar una nueva persona
            que llega solicitando un terreno en el Sector 16.
          </p>
          <button
            onClick={onOpenNewRequest}
            className="px-4 py-2 bg-[#1877F2] text-white rounded-lg text-xs font-bold hover:bg-blue-600 cursor-pointer"
          >
            + Registrar Nueva Solicitud
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs hover:shadow-sm transition-all space-y-3"
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-[#1877F2] font-black text-sm flex items-center justify-center shrink-0">
                    {req.applicantName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-slate-900 text-sm">{req.applicantName}</h4>
                      {getStatusBadge(req.status)}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {req.requestType === 'reubicacion' ? 'Reubicación de Lote' : 'Nuevo Terreno'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium mt-0.5 flex-wrap">
                      <span className="font-mono">C.I. {req.documentId}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {req.phone}
                      </span>
                      <span>•</span>
                      <span>Solicitado: {req.requestDate}</span>
                    </div>
                  </div>
                </div>

                {/* Top Quick Actions */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {req.phone && (
                    <button
                      onClick={() =>
                        openWhatsApp(
                          req.phone,
                          `Hola ${req.applicantName}, le contactamos de la directiva de tierras del Sector 16 respecto a su solicitud de terreno (C.I. ${req.documentId}).`
                        )
                      }
                      title="Contactar por WhatsApp"
                      className="p-1.5 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => onEditRequest(req)}
                    title="Editar Solicitud"
                    className="p-1.5 rounded-lg text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => onDeleteRequest(req.id)}
                    title="Eliminar Solicitud"
                    className="p-1.5 rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Middle Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-lg text-xs border border-slate-200">
                {/* Location requested/assigned */}
                <div>
                  <span className="text-slate-500 block text-[11px] font-semibold">Ubicación</span>
                  {req.status === 'aprobado' ? (
                    <div className="font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Adjudicado: Mz {req.assignedBlock} - Lote {req.assignedLot}</span>
                    </div>
                  ) : (
                    <div className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#1877F2]" />
                      <span>
                        Sugerido: Mz {req.requestedBlock || 'A'} - Lote {req.requestedLot || 'S/N'}
                      </span>
                    </div>
                  )}
                  {req.requestType === 'reubicacion' && (
                    <span className="text-[10px] text-slate-500 block">
                      Actual: Mz {req.currentBlock} - Lote {req.currentLot}
                    </span>
                  )}
                </div>

                {/* Family and Social Situation */}
                <div>
                  <span className="text-slate-500 block text-[11px] font-semibold">Familia</span>
                  <span className="font-bold text-slate-800 block mt-0.5">
                    {req.familyMembersCount} integrantes • {req.childrenCount ?? 0} hijos
                  </span>
                  {req.hasChildrenWithDisability && (
                    <span className="inline-flex items-center gap-1 text-amber-700 font-bold text-[10px]">
                      <Accessibility className="w-3 h-3" />
                      Prioridad por discapacidad
                    </span>
                  )}
                </div>

                {/* C.I. Photos Status */}
                <div>
                  <span className="text-slate-500 block text-[11px] font-semibold">Cédula Digital</span>
                  <div className="flex items-center gap-2 mt-0.5">
                    {req.documentFrontUrl ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Frente OK
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Sin frente</span>
                    )}

                    {req.documentBackUrl ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                        Dorso OK
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400">Sin dorso</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Specific Notes (Missing docs or decision reason) */}
              {req.status === 'falta_documentos' && req.missingDocumentsNotes && (
                <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-950 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <strong className="block font-bold">Documentos Faltantes para Legajo INDERT:</strong>
                    <span>{req.missingDocumentsNotes}</span>
                  </div>
                  {req.phone && (
                    <button
                      onClick={() => {
                        const msg = `Estimado/a ${req.applicantName} (C.I. ${req.documentId}):\nLe recordamos que para avanzar con la adjudicación de su lote en el Sector 16, aún faltan estos documentos:\n\n*${req.missingDocumentsNotes}*\n\nFavor acercar a la directiva lo antes posible.`;
                        openWhatsApp(req.phone, msg);
                      }}
                      className="px-2 py-1 rounded bg-blue-600 text-white font-bold text-[10px] hover:bg-blue-700 shrink-0 cursor-pointer"
                    >
                      Recordar por WhatsApp
                    </button>
                  )}
                </div>
              )}

              {req.status === 'denegado' && req.decisionNotes && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-950 flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Motivo del Rechazo:</strong>
                    <span>{req.decisionNotes}</span>
                  </div>
                </div>
              )}

              {req.status === 'aprobado' && (
                <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      <strong>Lote Adjudicado Formalmente:</strong> Manzana {req.assignedBlock}, Lote {req.assignedLot}.
                    </span>
                  </div>

                  {req.phone && (
                    <button
                      onClick={() => {
                        const msg = `¡Estimado/a ${req.applicantName}!\nLe confirmamos que su solicitud de terreno ha sido *APROBADA* en el Sector 16:\n- Manzana: ${req.assignedBlock}\n- Lote: ${req.assignedLot}\nFavor acudir a la directiva para la firma de acta y entrega de constancia de ocupación.`;
                        openWhatsApp(req.phone, msg);
                      }}
                      className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Enviar Felicitación & Datos del Lote
                    </button>
                  )}
                </div>
              )}

              {/* Status Action Buttons Bar */}
              <div className="pt-1 flex items-center justify-between border-t border-slate-100 gap-2 flex-wrap">
                <span className="text-[11px] text-slate-500 font-medium">
                  Cambiar estado rápidamente:
                </span>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Approve Button */}
                  {req.status !== 'aprobado' && (
                    <button
                      onClick={() => handleStartApprove(req)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Aprobar & Asignar Lote</span>
                    </button>
                  )}

                  {/* Missing Docs Button */}
                  {req.status !== 'falta_documentos' && (
                    <button
                      onClick={() => handleStartMissingDocs(req)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
                      <span>Falta Documentos</span>
                    </button>
                  )}

                  {/* Deny Button */}
                  {req.status !== 'denegado' && (
                    <button
                      onClick={() => handleStartDeny(req)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Denegar</span>
                    </button>
                  )}

                  {/* Move back to Pending if currently resolved */}
                  {req.status !== 'pendiente' && (
                    <button
                      onClick={() => onUpdateStatus(req.id, 'pendiente')}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Volver a Pendiente</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Approve & Assign Lot Modal */}
      {approvingRequest && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Aprobar y Asignar Lote a {approvingRequest.applicantName}
                </h3>
              </div>
              <button
                onClick={() => setApprovingRequest(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Ingrese la Manzana y Lote oficiales que se le adjudicarán al postulante (C.I.{' '}
              {approvingRequest.documentId}).
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Manzana (Mz) *
                </label>
                <input
                  type="text"
                  required
                  value={approveBlock}
                  onChange={(e) => setApproveBlock(e.target.value.toUpperCase())}
                  placeholder="Ej: A, B, C..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Lote *
                </label>
                <input
                  type="text"
                  required
                  value={approveLot}
                  onChange={(e) => setApproveLot(e.target.value)}
                  placeholder="Ej: 04, 12..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold text-sm"
                />
              </div>
            </div>

            <label className="flex items-start gap-2 bg-emerald-50 border border-emerald-200 p-3 rounded-xl cursor-pointer text-xs">
              <input
                type="checkbox"
                checked={approvePromoteResident}
                onChange={(e) => setApprovePromoteResident(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
              />
              <span className="text-emerald-950 font-medium">
                <strong>Incorporar automáticamente al Padrón de Residentes Activos</strong>
                <span className="block text-[11px] text-emerald-800">
                  Crea su ficha en el censo con sus datos demográficos, familiares y fotos de C.I.
                </span>
              </span>
            </label>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setApprovingRequest(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmApprove}
                disabled={!approveBlock || !approveLot}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirmar Aprobación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missing Docs Quick Modal */}
      {missingDocsRequest && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Documentación Faltante - {missingDocsRequest.applicantName}
                </h3>
              </div>
              <button
                onClick={() => setMissingDocsRequest(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Detalle los documentos que debe presentar el postulante para conformar su legajo. Al
              confirmar, se le enviará un mensaje automático a su WhatsApp ({missingDocsRequest.phone}).
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Documentos Requeridos *
              </label>
              <textarea
                rows={3}
                value={missingDocsText}
                onChange={(e) => setMissingDocsText(e.target.value)}
                placeholder="Ej: Fotocopia de C.I. dorso, certificado de vida y residencia..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setMissingDocsRequest(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmMissingDocs}
                disabled={!missingDocsText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Guardar y Notificar por WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deny Quick Modal */}
      {denyingRequest && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <XCircle className="w-5 h-5 text-rose-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Denegar Solicitud - {denyingRequest.applicantName}
                </h3>
              </div>
              <button
                onClick={() => setDenyingRequest(null)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Indique el motivo por el cual la comisión vecinal deniega el otorgamiento de la parcela a
              este postulante.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo del Rechazo / Dictamen *
              </label>
              <textarea
                rows={3}
                value={denyReasonText}
                onChange={(e) => setDenyReasonText(e.target.value)}
                placeholder="Especifique el motivo..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                onClick={() => setDenyingRequest(null)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeny}
                disabled={!denyReasonText.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-300 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                Confirmar Denegación
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

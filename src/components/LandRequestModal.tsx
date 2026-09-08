import React, { useState, useEffect } from 'react';
import {
  X,
  FilePlus,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MessageCircle,
  Heart,
  FileText,
  ShieldAlert,
  User,
  Phone,
  HelpCircle,
  Accessibility,
} from 'lucide-react';
import {
  LandRequest,
  LandRequestStatus,
  LandRequestType,
  MaritalStatus,
  Resident,
  CommunitySettings,
} from '../types';
import { DocumentPhotoUploader } from './DocumentPhotoUploader';
import { openWhatsApp } from '../utils/notificationUtils';

interface LandRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (request: LandRequest, autoPromoteToResident?: boolean) => void;
  initialRequest?: LandRequest | null;
  existingResidents: Resident[];
  settings: CommunitySettings;
}

export const LandRequestModal: React.FC<LandRequestModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialRequest,
  existingResidents,
  settings,
}) => {
  const [formData, setFormData] = useState<Partial<LandRequest>>({
    applicantName: '',
    documentId: '',
    phone: '',
    requestType: 'nuevo_lote',
    barrio: 'Sector 16',
    requestedBlock: 'A',
    requestedLot: '',
    targetSector: 'Sector Entrada',
    requestDate: new Date().toISOString().split('T')[0],
    status: 'pendiente' as LandRequestStatus,
    familyMembersCount: 3,
    maritalStatus: 'soltero' as MaritalStatus,
    hasPartner: false,
    partnerName: '',
    partnerDocumentId: '',
    childrenCount: 0,
    hasChildrenWithDisability: false,
    disabilityDetails: '',
    missingDocumentsNotes: '',
    decisionNotes: '',
    assignedBlock: '',
    assignedLot: '',
    documentFrontUrl: '',
    documentBackUrl: '',
    reviewedBy: settings.presidentName,
  });

  const [autoPromote, setAutoPromote] = useState(true);
  const [warningMsg, setWarningMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialRequest) {
      setFormData({
        ...initialRequest,
        barrio: initialRequest.barrio || 'Sector 16',
        maritalStatus: initialRequest.maritalStatus || 'soltero',
        hasPartner: Boolean(initialRequest.hasPartner),
        childrenCount: initialRequest.childrenCount ?? 0,
        hasChildrenWithDisability: Boolean(initialRequest.hasChildrenWithDisability),
        disabilityDetails: initialRequest.disabilityDetails || '',
        missingDocumentsNotes: initialRequest.missingDocumentsNotes || '',
        decisionNotes: initialRequest.decisionNotes || '',
      });
      setAutoPromote(false);
    } else {
      setFormData({
        applicantName: '',
        documentId: '',
        phone: '',
        requestType: 'nuevo_lote',
        barrio: 'Sector 16',
        requestedBlock: 'B',
        requestedLot: '',
        targetSector: 'Sector 16 - Mz B',
        requestDate: new Date().toISOString().split('T')[0],
        status: 'pendiente',
        familyMembersCount: 3,
        maritalStatus: 'soltero',
        hasPartner: false,
        partnerName: '',
        partnerDocumentId: '',
        childrenCount: 0,
        hasChildrenWithDisability: false,
        disabilityDetails: '',
        missingDocumentsNotes: '',
        decisionNotes: '',
        assignedBlock: '',
        assignedLot: '',
        documentFrontUrl: '',
        documentBackUrl: '',
        reviewedBy: settings.presidentName,
      });
      setAutoPromote(true);
    }
    setWarningMsg(null);
  }, [initialRequest, isOpen, settings.presidentName]);

  if (!isOpen) return null;

  // Check if documentId already belongs to an existing resident
  const handleDocumentChange = (doc: string) => {
    setFormData((prev) => ({ ...prev, documentId: doc }));
    const match = existingResidents.find(
      (r) => r.documentId.trim().toLowerCase() === doc.trim().toLowerCase()
    );
    if (match) {
      setWarningMsg(
        `Atención: Esta C.I. ya está registrada en el padrón a nombre de ${match.fullName} (Mz ${match.block}, Lote ${match.lot}). Si se trata de un cambio de lote, seleccione "Reubicación".`
      );
    } else {
      setWarningMsg(null);
    }
  };

  const handleStatusChange = (newStatus: LandRequestStatus) => {
    setFormData((prev) => {
      let defaultMissing = prev.missingDocumentsNotes;
      let defaultDecision = prev.decisionNotes;
      let assignedB = prev.assignedBlock;
      let assignedL = prev.assignedLot;

      if (newStatus === 'falta_documentos' && !defaultMissing) {
        defaultMissing = 'Falta fotocopia autenticada de Cédula de Identidad (Dorso) y Certificado de Vida y Residencia expedido por la comisaría.';
      } else if (newStatus === 'aprobado') {
        if (!assignedB) assignedB = prev.requestedBlock || 'A';
        if (!assignedL) assignedL = prev.requestedLot || '';
        if (!defaultDecision) {
          defaultDecision = `Aprobado por la Comisión Vecinal de Tierras en fecha ${new Date().toLocaleDateString('es-PY')}. Cumple con criterios del INDERT.`;
        }
      } else if (newStatus === 'denegado' && !defaultDecision) {
        defaultDecision = 'Solicitud denegada: no cumple con el requisito de no poseer otros inmuebles o por falta de disponibilidad de parcelas.';
      }

      return {
        ...prev,
        status: newStatus,
        missingDocumentsNotes: defaultMissing,
        decisionNotes: defaultDecision,
        assignedBlock: assignedB,
        assignedLot: assignedL,
        reviewedAt: new Date().toISOString().split('T')[0],
      };
    });
  };

  const handleSendWhatsAppNotification = () => {
    if (!formData.phone) return;
    let message = '';
    const status = formData.status;

    if (status === 'pendiente') {
      message = `Hola ${formData.applicantName}, le informamos desde la Comisión Vecinal del Sector 16 que su solicitud de terreno (C.I. ${formData.documentId}) ha sido recibida y se encuentra PENDIENTE DE EVALUACIÓN por la comisión. Le avisaremos oportunamente.`;
    } else if (status === 'falta_documentos') {
      message = `Estimado/a ${formData.applicantName} (C.I. ${formData.documentId}):\nLe contactamos de la Comisión Vecinal del Sector 16. Su solicitud de lote se encuentra OBSERVADA POR FALTA DE DOCUMENTOS para conformar su carpeta INDERT:\n\n*Documentos Faltantes:*\n${formData.missingDocumentsNotes || 'Fotocopia de C.I. y certificado de vida y residencia.'}\n\nFavor acercar dichos documentos a la brevedad a la secretaría comunal.`;
    } else if (status === 'aprobado') {
      message = `¡Buenas noticias ${formData.applicantName}!\nLe confirmamos que su solicitud de terreno en el Sector 16 ha sido *APROBADA*.\n\n- Manzana Asignada: ${formData.assignedBlock || formData.requestedBlock}\n- Lote Asignado: ${formData.assignedLot || formData.requestedLot}\n- Resolución: ${formData.decisionNotes || 'Aprobado por comisión'}\n\nFavor acérquese con la directiva para la firma de acta y entrega de mojón.`;
    } else if (status === 'denegado') {
      message = `Estimado/a ${formData.applicantName} (C.I. ${formData.documentId}):\nLe informamos que su solicitud de terreno ha sido denegada por la directiva comunal. Motivo: ${formData.decisionNotes || 'Disponibilidad agotada o antecedentes incompatibles.'}`;
    }

    openWhatsApp(formData.phone, message);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.status === 'aprobado' && formData.assignedBlock && formData.assignedLot) {
      const occupant = existingResidents.find(
        (r) =>
          r.status === 'active' &&
          r.block.trim().toUpperCase() === formData.assignedBlock!.trim().toUpperCase() &&
          r.lot.trim().toUpperCase() === formData.assignedLot!.trim().toUpperCase() &&
          r.documentId.trim().toUpperCase() !== (formData.documentId || '').trim().toUpperCase()
      );
      if (occupant) {
        const proceed = confirm(
          `¡ADVERTENCIA DE SOLAPAMIENTO DE TERRENO!\n\nEl Lote ${formData.assignedLot} de la Manzana ${formData.assignedBlock} ya figura registrado a nombre de:\n${occupant.fullName} (C.I. ${occupant.documentId}).\n\n¿Desea adjudicar de todas formas a pesar del solapamiento?`
        );
        if (!proceed) return;
      }
    }

    const fullRequest: LandRequest = {
      id: initialRequest?.id || `req-${Date.now()}`,
      applicantName: formData.applicantName || '',
      documentId: formData.documentId || '',
      phone: formData.phone || '',
      requestType: formData.requestType || 'nuevo_lote',
      barrio: formData.barrio || 'Sector 16',
      currentBlock: formData.currentBlock,
      currentLot: formData.currentLot,
      requestedBlock: formData.requestedBlock || 'A',
      requestedLot: formData.requestedLot || '',
      targetSector: formData.targetSector || `Sector 16 - Mz ${formData.requestedBlock || 'A'}`,
      requestDate: formData.requestDate || new Date().toISOString().split('T')[0],
      status: formData.status || 'pendiente',
      familyMembersCount: formData.familyMembersCount || 3,
      maritalStatus: formData.maritalStatus || 'soltero',
      hasPartner: formData.hasPartner,
      partnerName: formData.partnerName,
      partnerDocumentId: formData.partnerDocumentId,
      childrenCount: formData.childrenCount || 0,
      hasChildrenWithDisability: formData.hasChildrenWithDisability,
      disabilityDetails: formData.disabilityDetails,
      documentFrontUrl: formData.documentFrontUrl,
      documentBackUrl: formData.documentBackUrl,
      missingDocumentsNotes: formData.missingDocumentsNotes,
      decisionNotes: formData.decisionNotes,
      assignedBlock: formData.assignedBlock,
      assignedLot: formData.assignedLot,
      reviewedBy: formData.reviewedBy || settings.presidentName,
      reviewedAt: formData.reviewedAt || new Date().toISOString().split('T')[0],
    };

    onSave(fullRequest, autoPromote && fullRequest.status === 'aprobado');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="bg-[#1877F2] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <FilePlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight">
                {initialRequest ? 'Editar Solicitud de Terreno' : 'Nueva Solicitud de Terreno / Postulante'}
              </h2>
              <p className="text-xs text-blue-100">
                Padrón de postulantes, lista de espera y reubicaciones de lotes • Sector 16
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Status Bar Selector - Primary Feature Requested */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
              Estado de la Solicitud *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange('pendiente')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                  formData.status === 'pendiente'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-amber-50 hover:text-amber-800'
                }`}
              >
                <Clock className="w-4 h-4" />
                <span>Pendiente</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('falta_documentos')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                  formData.status === 'falta_documentos'
                    ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-blue-50 hover:text-blue-800'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>Falta Documentos</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('aprobado')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                  formData.status === 'aprobado'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprobado</span>
              </button>

              <button
                type="button"
                onClick={() => handleStatusChange('denegado')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all border cursor-pointer ${
                  formData.status === 'denegado'
                    ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-rose-50 hover:text-rose-800'
                }`}
              >
                <XCircle className="w-4 h-4" />
                <span>Denegado</span>
              </button>
            </div>

            {/* Dynamic Status Helper Banner */}
            <div className="mt-3">
              {formData.status === 'pendiente' && (
                <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>
                    <strong>En evaluación:</strong> El postulante está en lista de espera comunal. Su caso será analizado por la comisión vecinal.
                  </span>
                </div>
              )}

              {formData.status === 'falta_documentos' && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Detalle de Documentación Faltante para el INDERT:</span>
                  </div>
                  <textarea
                    rows={2}
                    value={formData.missingDocumentsNotes}
                    onChange={(e) => setFormData({ ...formData, missingDocumentsNotes: e.target.value })}
                    placeholder="Ej: Falta fotocopia autenticada de C.I. dorso, certificado de vida y residencia, certificado de no poseer bienes..."
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs font-medium"
                  />
                </div>
              )}

              {formData.status === 'aprobado' && (
                <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xs text-emerald-900">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Adjudicación Aprobada • Asignar Manzana y Lote Definitivos:</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-0.5">
                        Manzana Asignada *
                      </label>
                      <input
                        type="text"
                        required={formData.status === 'aprobado'}
                        value={formData.assignedBlock}
                        onChange={(e) => setFormData({ ...formData, assignedBlock: e.target.value.toUpperCase() })}
                        placeholder="Ej: A, B, C..."
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg font-bold text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 mb-0.5">
                        Lote Asignado *
                      </label>
                      <input
                        type="text"
                        required={formData.status === 'aprobado'}
                        value={formData.assignedLot}
                        onChange={(e) => setFormData({ ...formData, assignedLot: e.target.value })}
                        placeholder="Ej: 04, 12..."
                        className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg font-bold text-slate-800"
                      />
                    </div>
                    <div className="col-span-2 sm:col-span-1 flex items-end">
                      <label className="flex items-center gap-2 cursor-pointer bg-white p-2 rounded-lg border border-emerald-300 w-full text-[11px]">
                        <input
                          type="checkbox"
                          checked={autoPromote}
                          onChange={(e) => setAutoPromote(e.target.checked)}
                          className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                        />
                        <span className="font-bold text-slate-800">
                          Incorporar directo al Padrón Activo
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {formData.status === 'denegado' && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Motivo de la Denegación:</span>
                  </div>
                  <textarea
                    rows={2}
                    value={formData.decisionNotes}
                    onChange={(e) => setFormData({ ...formData, decisionNotes: e.target.value })}
                    placeholder="Especifique el motivo (ej. antecedentes de venta irregular de lotes, doble adjudicación, falta de cupo de tierra)..."
                    className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg text-xs font-medium"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Warning banner if duplicate CI */}
          {warningMsg && (
            <div className="bg-amber-50 border border-amber-300 p-3 rounded-xl text-amber-950 flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="font-medium text-xs">{warningMsg}</p>
            </div>
          )}

          {/* Type of Request & Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tipo de Solicitud *</label>
              <select
                value={formData.requestType}
                onChange={(e) =>
                  setFormData({ ...formData, requestType: e.target.value as LandRequestType })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-semibold"
              >
                <option value="nuevo_lote">Nuevo Lote (Persona que llega a pedir terreno)</option>
                <option value="reubicacion">Reubicación (Ocupante actual que solicita cambio)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha de Solicitud *</label>
              <input
                type="date"
                required
                value={formData.requestDate}
                onChange={(e) => setFormData({ ...formData, requestDate: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
              </input>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Barrio / Asentamiento</label>
              <input
                type="text"
                value={formData.barrio}
                onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* If Reallocation: current location */}
          {formData.requestType === 'reubicacion' && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Manzana Actual (Mz)</label>
                <input
                  type="text"
                  placeholder="Ej: A"
                  value={formData.currentBlock || ''}
                  onChange={(e) => setFormData({ ...formData, currentBlock: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Lote Actual</label>
                <input
                  type="text"
                  placeholder="Ej: 03"
                  value={formData.currentLot || ''}
                  onChange={(e) => setFormData({ ...formData, currentLot: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>
            </div>
          )}

          {/* Applicant Personal Data */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 text-xs">
              <User className="w-4 h-4 text-[#1877F2]" />
              <span>Datos del Postulante / Titular de la Solicitud</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1">
                  Nombres y Apellidos Completos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Ramón Estigarribia Gómez"
                  value={formData.applicantName}
                  onChange={(e) => setFormData({ ...formData, applicantName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Cédula de Identidad (C.I.) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 3.987.120"
                  value={formData.documentId}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Celular / WhatsApp de Contacto *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ej: +595981123456"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Manzana Deseada / Sugerida</label>
                <input
                  type="text"
                  placeholder="Ej: B, C..."
                  value={formData.requestedBlock}
                  onChange={(e) => setFormData({ ...formData, requestedBlock: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lote Deseado / Sugerido</label>
                <input
                  type="text"
                  placeholder="Ej: 05, 12..."
                  value={formData.requestedLot}
                  onChange={(e) => setFormData({ ...formData, requestedLot: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-bold"
                />
              </div>
            </div>
          </div>

          {/* Family & Social Details */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5 text-xs">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Situación Familiar y Prioridad Social</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Estado Civil</label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => {
                    const st = e.target.value as MaritalStatus;
                    setFormData({
                      ...formData,
                      maritalStatus: st,
                      hasPartner: st === 'casado' || st === 'concubinato',
                    });
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="soltero">Soltero / a</option>
                  <option value="casado">Casado / a</option>
                  <option value="concubinato">Concubinato / Unión de hecho</option>
                  <option value="viudo">Viudo / a</option>
                  <option value="divorciado">Divorciado / a</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Hijos a Cargo</label>
                <input
                  type="number"
                  min="0"
                  value={formData.childrenCount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      childrenCount: parseInt(e.target.value) || 0,
                      familyMembersCount: (parseInt(e.target.value) || 0) + (formData.hasPartner ? 2 : 1),
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Total Personas a Habitar</label>
                <input
                  type="number"
                  min="1"
                  value={formData.familyMembersCount}
                  onChange={(e) =>
                    setFormData({ ...formData, familyMembersCount: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            {/* Partner Details */}
            {formData.hasPartner && (
              <div className="p-3 bg-white rounded-lg border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre Pareja / Cónyuge</label>
                  <input
                    type="text"
                    placeholder="Ej: Lorenza Galeano"
                    value={formData.partnerName || ''}
                    onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">C.I. Pareja / Cónyuge</label>
                  <input
                    type="text"
                    placeholder="Ej: 4.112.560"
                    value={formData.partnerDocumentId || ''}
                    onChange={(e) => setFormData({ ...formData, partnerDocumentId: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg font-mono"
                  />
                </div>
              </div>
            )}

            {/* Disability Checkbox & Details */}
            <div className="pt-1">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={formData.hasChildrenWithDisability}
                  onChange={(e) =>
                    setFormData({ ...formData, hasChildrenWithDisability: e.target.checked })
                  }
                  className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                />
                <span className="flex items-center gap-1 text-xs">
                  <Accessibility className="w-4 h-4 text-amber-600" />
                  ¿La familia cuenta con hijos o integrantes con discapacidad? (Prioridad de Acceso)
                </span>
              </label>

              {formData.hasChildrenWithDisability && (
                <div className="mt-2 pl-6">
                  <textarea
                    rows={2}
                    placeholder="Describa la condición de discapacidad (movilidad reducida, visual, etc.) y necesidades de ubicación del terreno..."
                    value={formData.disabilityDetails || ''}
                    onChange={(e) => setFormData({ ...formData, disabilityDetails: e.target.value })}
                    className="w-full px-3 py-1.5 border border-amber-300 rounded-lg bg-amber-50/50 text-xs"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Photo Uploader for C.I. (Both sides) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <DocumentPhotoUploader
              frontPhotoUrl={formData.documentFrontUrl}
              backPhotoUrl={formData.documentBackUrl}
              onFrontPhotoChange={(url) => setFormData((prev) => ({ ...prev, documentFrontUrl: url }))}
              onBackPhotoChange={(url) => setFormData((prev) => ({ ...prev, documentBackUrl: url }))}
              residentName={formData.applicantName || 'Postulante'}
              documentId={formData.documentId || ''}
            />
          </div>

          {/* Resolution & Committee Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Revisado / Evaluado por</label>
              <input
                type="text"
                value={formData.reviewedBy || ''}
                onChange={(e) => setFormData({ ...formData, reviewedBy: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Dictamen General / Notas de Asamblea
              </label>
              <input
                type="text"
                placeholder="Ej: Caso analizado en asamblea del 25 de agosto. Aprobación unánime."
                value={formData.decisionNotes || ''}
                onChange={(e) => setFormData({ ...formData, decisionNotes: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between gap-2 shrink-0">
            {formData.phone ? (
              <button
                type="button"
                onClick={handleSendWhatsAppNotification}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-xl font-bold transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
                <span>Notificar Estado al Postulante por WhatsApp</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[#1877F2] hover:bg-blue-600 text-white rounded-xl font-bold shadow-xs transition-colors cursor-pointer text-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Guardar Solicitud</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

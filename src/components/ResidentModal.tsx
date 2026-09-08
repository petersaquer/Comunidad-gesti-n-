import React, { useState, useEffect } from 'react';
import { X, UserPlus, ShieldAlert, CheckCircle2, Heart, Users, FileCheck } from 'lucide-react';
import { Resident, ResidentStatus, MaritalStatus } from '../types';
import { DocumentPhotoUploader } from './DocumentPhotoUploader';

interface ResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (resident: Resident) => void;
  initialResident?: Resident | null;
  existingResidents: Resident[];
}

export const ResidentModal: React.FC<ResidentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialResident,
  existingResidents,
}) => {
  const [formData, setFormData] = useState<Partial<Resident>>({
    fullName: '',
    documentId: '',
    phone: '',
    barrio: 'Sector 16',
    block: 'A',
    lot: '',
    sector: 'Entrada Principal',
    occupationDate: new Date().toISOString().split('T')[0],
    status: 'active' as ResidentStatus,
    familyMembersCount: 3,
    maritalStatus: 'soltero' as MaritalStatus,
    hasPartner: false,
    partnerName: '',
    partnerDocumentId: '',
    childrenCount: 0,
    hasChildrenWithDisability: false,
    disabilityDetails: '',
    documentFrontUrl: '',
    documentBackUrl: '',
    previousSettlementHistory: 'Sin registros previos en otras comunidades.',
    isFraudRisk: false,
    fraudNotes: '',
    notes: '',
  });

  const [docWarning, setDocWarning] = useState<string | null>(null);
  const [lotWarning, setLotWarning] = useState<string | null>(null);

  useEffect(() => {
    if (initialResident) {
      setFormData({
        ...initialResident,
        barrio: initialResident.barrio || 'Sector 16',
        maritalStatus: initialResident.maritalStatus || 'soltero',
        hasPartner: initialResident.hasPartner ?? (initialResident.maritalStatus === 'casado' || initialResident.maritalStatus === 'concubinato'),
        childrenCount: initialResident.childrenCount ?? 0,
        hasChildrenWithDisability: Boolean(initialResident.hasChildrenWithDisability),
        disabilityDetails: initialResident.disabilityDetails || '',
        documentFrontUrl: initialResident.documentFrontUrl || '',
        documentBackUrl: initialResident.documentBackUrl || '',
      });
    } else {
      setFormData({
        fullName: '',
        documentId: '',
        phone: '',
        barrio: 'Sector 16',
        block: 'A',
        lot: '',
        sector: 'Entrada Principal',
        occupationDate: new Date().toISOString().split('T')[0],
        status: 'active',
        familyMembersCount: 3,
        maritalStatus: 'soltero',
        hasPartner: false,
        partnerName: '',
        partnerDocumentId: '',
        childrenCount: 0,
        hasChildrenWithDisability: false,
        disabilityDetails: '',
        documentFrontUrl: '',
        documentBackUrl: '',
        previousSettlementHistory: 'Sin registros previos en otras comunidades.',
        isFraudRisk: false,
        fraudNotes: '',
        notes: '',
      });
    }
    setDocWarning(null);
    setLotWarning(null);
  }, [initialResident, isOpen]);

  if (!isOpen) return null;

  // Real-time checks for duplicate documentId or already assigned Block/Lot
  const handleDocumentChange = (doc: string) => {
    setFormData((prev) => ({ ...prev, documentId: doc }));
    const duplicate = existingResidents.find(
      (r) =>
        r.documentId.trim().toLowerCase() === doc.trim().toLowerCase() &&
        r.id !== initialResident?.id
    );

    if (duplicate) {
      setDocWarning(
        `⚠️ ATENCIÓN: Esta C.I. ya está registrada a nombre de "${duplicate.fullName}" en Manzana ${duplicate.block} - Lote ${duplicate.lot}. ¡Verificar posible intento de duplicidad!`
      );
    } else {
      setDocWarning(null);
    }
  };

  const handleLotChange = (lot: string, block: string) => {
    setFormData((prev) => ({ ...prev, lot, block }));
    const duplicateLot = existingResidents.find(
      (r) =>
        r.block.trim().toUpperCase() === block.trim().toUpperCase() &&
        r.lot.trim() === lot.trim() &&
        r.id !== initialResident?.id
    );

    if (duplicateLot) {
      setLotWarning(
        `⚠️ ADVERTENCIA: La Manzana ${block} Lote ${lot} ya figura ocupada por "${duplicateLot.fullName}".`
      );
    } else {
      setLotWarning(null);
    }
  };

  const handleMaritalStatusChange = (status: MaritalStatus) => {
    const autoPartner = status === 'casado' || status === 'concubinato';
    setFormData((prev) => ({
      ...prev,
      maritalStatus: status,
      hasPartner: autoPartner ? true : prev.hasPartner,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName || !formData.documentId || !formData.block || !formData.lot) {
      alert('Por favor complete los campos obligatorios: Nombre, C.I., Manzana y Lote.');
      return;
    }

    const residentToSave: Resident = {
      id: initialResident ? initialResident.id : `res-${Date.now()}`,
      fullName: formData.fullName || '',
      documentId: formData.documentId || '',
      phone: formData.phone || '',
      barrio: formData.barrio?.trim() || 'Sector 16',
      block: (formData.block || '').toUpperCase(),
      lot: formData.lot || '',
      sector: formData.sector || 'Sector General',
      occupationDate: formData.occupationDate || new Date().toISOString().split('T')[0],
      status: formData.status || 'active',
      familyMembersCount: Number(formData.familyMembersCount) || 1,
      maritalStatus: formData.maritalStatus || 'soltero',
      hasPartner: Boolean(formData.hasPartner),
      partnerName: formData.hasPartner ? formData.partnerName || '' : '',
      partnerDocumentId: formData.hasPartner ? formData.partnerDocumentId || '' : '',
      childrenCount: Number(formData.childrenCount) || 0,
      hasChildrenWithDisability: Boolean(formData.hasChildrenWithDisability),
      disabilityDetails: formData.hasChildrenWithDisability ? formData.disabilityDetails || '' : '',
      documentFrontUrl: formData.documentFrontUrl || '',
      documentBackUrl: formData.documentBackUrl || '',
      previousSettlementHistory:
        formData.previousSettlementHistory || 'Sin antecedentes en otros asentamientos.',
      isFraudRisk: Boolean(formData.isFraudRisk),
      fraudNotes: formData.fraudNotes || '',
      notes: formData.notes || '',
    };

    onSave(residentToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-4">
        {/* Header */}
        <div className="bg-[#1877F2] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {initialResident ? 'Editar Ficha Censal de Ocupante' : 'Censar Nuevo Residente / Ocupante'}
              </h3>
              <p className="text-xs text-blue-100">
                Padrón oficial del censo comunitario INDERT - Barrio {formData.barrio || 'Sector 16'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs text-slate-700 max-h-[80vh] overflow-y-auto">
          {/* Warnings */}
          {docWarning && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs">{docWarning}</div>
            </div>
          )}

          {lotWarning && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 flex items-start gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="text-xs">{lotWarning}</div>
            </div>
          )}

          {/* Sección 1: Datos Personales Principales */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-[#1877F2]" />
              <span>1. Identificación del Titular del Lote</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Nombre Completo */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-900 mb-1">
                  Nombre y Apellidos Completos *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Juan Bautista Benítez"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1877F2] focus:border-[#1877F2] text-sm"
                />
              </div>

              {/* C.I. */}
              <div>
                <label className="block font-semibold text-slate-900 mb-1">
                  Cédula de Identidad (C.I.) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 4.892.110"
                  value={formData.documentId}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1877F2] focus:border-[#1877F2] text-sm font-mono"
                />
              </div>

              {/* Teléfono */}
              <div>
                <label className="block font-semibold text-slate-900 mb-1">
                  Número de Celular / WhatsApp *
                </label>
                <input
                  type="tel"
                  placeholder="Ej: +595981112233 o 0981112233"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1877F2] focus:border-[#1877F2] text-sm"
                />
              </div>
            </div>
          </div>

          {/* Sección 2: Ubicación del Terreno (Barrio, Manzana, Lote, Sector) */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1877F2]"></span>
              <span>2. Ubicación y Lote Asignado</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {/* Barrio */}
              <div className="sm:col-span-1">
                <label className="block font-semibold text-slate-900 mb-1">Barrio / Asentamiento *</label>
                <input
                  type="text"
                  required
                  placeholder="Sector 16"
                  value={formData.barrio}
                  onChange={(e) => setFormData({ ...formData, barrio: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1877F2] text-sm font-semibold"
                />
              </div>

              {/* Manzana */}
              <div className="sm:col-span-1">
                <label className="block font-semibold text-slate-900 mb-1">Manzana (Mz.) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: A, B, C, 1"
                  value={formData.block}
                  onChange={(e) => handleLotChange(formData.lot || '', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1877F2] text-sm uppercase font-bold text-center"
                />
              </div>

              {/* Lote */}
              <div className="sm:col-span-1">
                <label className="block font-semibold text-slate-900 mb-1">Número de Lote *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 01, 04, 15"
                  value={formData.lot}
                  onChange={(e) => handleLotChange(e.target.value, formData.block || '')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1877F2] text-sm font-bold text-center"
                />
              </div>

              {/* Sector / Pasaje */}
              <div className="sm:col-span-1">
                <label className="block font-semibold text-slate-900 mb-1">Sector / Pasaje</label>
                <input
                  type="text"
                  placeholder="Entrada Principal"
                  value={formData.sector}
                  onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              {/* Fecha Ocupación */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-900 mb-1">
                  Fecha de Inicio de Ocupación / Asignación
                </label>
                <input
                  type="date"
                  value={formData.occupationDate}
                  onChange={(e) => setFormData({ ...formData, occupationDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              {/* Estado de ocupación */}
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-900 mb-1">Estado de Ocupación</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as ResidentStatus })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="active">Activo / Titular Reconocido</option>
                  <option value="flagged">Observado / En Investigación</option>
                  <option value="transferred">Lote Traspasado / Cesión</option>
                  <option value="evicted">Desalojado / Expulsado</option>
                  <option value="inactive">Inactivo / Lote Desocupado</option>
                </select>
              </div>
            </div>
          </div>

          {/* Sección 3: Situación Conyugal y Familiar */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-200 pb-1 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-rose-600" />
              <span>3. Situación Familiar, Pareja e Hijos</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Estado Civil */}
              <div>
                <label className="block font-semibold text-slate-900 mb-1">
                  Estado Civil *
                </label>
                <select
                  value={formData.maritalStatus}
                  onChange={(e) => handleMaritalStatusChange(e.target.value as MaritalStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium"
                >
                  <option value="soltero">Soltero/a</option>
                  <option value="casado">Casado/a</option>
                  <option value="concubinato">Unión de Hecho / Concubinato</option>
                  <option value="viudo">Viudo/a</option>
                  <option value="divorciado">Divorciado/a</option>
                </select>
              </div>

              {/* Cantidad de Hijos */}
              <div>
                <label className="block font-semibold text-slate-900 mb-1">
                  Cantidad de Hijos
                </label>
                <input
                  type="number"
                  min="0"
                  max="15"
                  value={formData.childrenCount ?? 0}
                  onChange={(e) =>
                    setFormData({ ...formData, childrenCount: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>

              {/* Total Miembros en el Terreno */}
              <div>
                <label className="block font-semibold text-slate-900 mb-1">
                  Total Familiares en Lote
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={formData.familyMembersCount}
                  onChange={(e) =>
                    setFormData({ ...formData, familyMembersCount: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                />
              </div>
            </div>

            {/* Tiene Pareja Toggle & Campos */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasPartner"
                  checked={formData.hasPartner}
                  onChange={(e) => setFormData({ ...formData, hasPartner: e.target.checked })}
                  className="w-4 h-4 text-[#1877F2] rounded border-slate-300 focus:ring-[#1877F2]"
                />
                <label htmlFor="hasPartner" className="font-bold text-slate-800 cursor-pointer">
                  ¿Tiene Pareja / Cónyuge que convive en el lote?
                </label>
              </div>

              {formData.hasPartner && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-200/60">
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      Nombre Completo de la Pareja / Cónyuge
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Romina Soledad Candia"
                      value={formData.partnerName || ''}
                      onChange={(e) => setFormData({ ...formData, partnerName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-800 mb-1">
                      C.I. de la Pareja / Cónyuge
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 4.912.441"
                      value={formData.partnerDocumentId || ''}
                      onChange={(e) => setFormData({ ...formData, partnerDocumentId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Discapacidad Toggle & Detalle */}
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasDisability"
                  checked={formData.hasChildrenWithDisability}
                  onChange={(e) => setFormData({ ...formData, hasChildrenWithDisability: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500"
                />
                <label htmlFor="hasDisability" className="font-bold text-amber-950 cursor-pointer">
                  ¿Tiene hijos o miembros de la familia con alguna discapacidad?
                </label>
              </div>

              {formData.hasChildrenWithDisability && (
                <div className="pt-1">
                  <label className="block font-medium text-amber-900 mb-1 text-xs">
                    Detalle de la discapacidad / necesidades especiales de asistencia o accesibilidad
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej: Hijo menor con parálisis cerebral leve, requiere acceso nivelado sin zanja frente al lote..."
                    value={formData.disabilityDetails || ''}
                    onChange={(e) => setFormData({ ...formData, disabilityDetails: e.target.value })}
                    className="w-full px-3 py-1.5 border border-amber-300 rounded-lg text-xs bg-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sección 4: Subida de Fotos de Documentos Ambos Lados (C.I. Frente y Dorso) */}
          <div className="pt-2">
            <DocumentPhotoUploader
              fullName={formData.fullName || ''}
              documentId={formData.documentId || ''}
              maritalStatus={formData.maritalStatus || 'soltero'}
              frontUrl={formData.documentFrontUrl}
              backUrl={formData.documentBackUrl}
              onChangeFront={(url) => setFormData((prev) => ({ ...prev, documentFrontUrl: url }))}
              onChangeBack={(url) => setFormData((prev) => ({ ...prev, documentBackUrl: url }))}
            />
          </div>

          {/* Sección 5: Módulo Anti-Fraude & Historial */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <h4 className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Control de Ocupación Previa y Prevención de Doble Lote / Fraude
            </h4>

            <div>
              <label className="block font-medium text-slate-800 mb-1 text-xs">
                Historial de Antecedentes en otros asentamientos o terrenos
              </label>
              <textarea
                rows={2}
                placeholder="Indique si residió en otra toma de tierras, si vendió otro lote anteriormente, o si cuenta con acta comunal previa..."
                value={formData.previousSettlementHistory}
                onChange={(e) =>
                  setFormData({ ...formData, previousSettlementHistory: e.target.value })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="isFraudRisk"
                checked={formData.isFraudRisk}
                onChange={(e) => setFormData({ ...formData, isFraudRisk: e.target.checked })}
                className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
              />
              <label htmlFor="isFraudRisk" className="font-semibold text-rose-800 cursor-pointer">
                Marcar como Sospecha de Fraude / Doble Terreno / Intento de Acaparamiento Ilegal
              </label>
            </div>

            {formData.isFraudRisk && (
              <div>
                <label className="block font-medium text-rose-900 mb-1 text-xs">
                  Motivo o Dictamen de Alerta de Fraude
                </label>
                <input
                  type="text"
                  placeholder="Ej: Detectado con lote en Asentamiento San Blas; intentó traspaso no autorizado."
                  value={formData.fraudNotes}
                  onChange={(e) => setFormData({ ...formData, fraudNotes: e.target.value })}
                  className="w-full px-3 py-1.5 border border-rose-300 rounded-lg text-xs bg-rose-50/50"
                />
              </div>
            )}
          </div>

          {/* Notas Generales */}
          <div>
            <label className="block font-semibold text-slate-900 mb-1">
              Notas u Observaciones del Lote
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre la construcción, medidor compartido, delegado vecinal..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#1877F2] hover:bg-blue-600 text-white rounded-lg font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              {initialResident ? 'Guardar Cambios' : 'Registrar en Censo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

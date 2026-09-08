import React, { useState } from 'react';
import { X, ArrowRight, AlertTriangle, CheckCircle2, MapPin, FileText, MessageCircle, UserCheck } from 'lucide-react';
import { Resident, RelocationRecord, CommunitySettings } from '../types';
import { openWhatsApp } from '../utils/notificationUtils';

interface RelocateResidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  resident: Resident | null;
  existingResidents: Resident[];
  settings: CommunitySettings;
  onConfirmRelocation: (residentId: string, relocationData: {
    newBlock: string;
    newLot: string;
    newSector: string;
    reason: string;
    actNumber: string;
    authorizedBy: string;
    notes?: string;
  }) => void;
}

export const RelocateResidentModal: React.FC<RelocateResidentModalProps> = ({
  isOpen,
  onClose,
  resident,
  existingResidents,
  settings,
  onConfirmRelocation,
}) => {
  const [newBlock, setNewBlock] = useState('B');
  const [newLot, setNewLot] = useState('');
  const [newSector, setNewSector] = useState(`Sector 16 - Mz B`);
  const [reason, setReason] = useState('Apertura y ensanche de calle comunal');
  const [actNumber, setActNumber] = useState(`Acta N° 15/2026`);
  const [authorizedBy, setAuthorizedBy] = useState(`${settings.presidentName} (Presidente)`);
  const [notes, setNotes] = useState('');

  if (!isOpen || !resident) return null;

  // Check if target block & lot is already occupied by someone else
  const lotConflict = existingResidents.find(
    (r) =>
      r.id !== resident.id &&
      r.block.trim().toUpperCase() === newBlock.trim().toUpperCase() &&
      r.lot.trim().toLowerCase() === newLot.trim().toLowerCase()
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlock || !newLot) return;

    onConfirmRelocation(resident.id, {
      newBlock: newBlock.trim().toUpperCase(),
      newLot: newLot.trim(),
      newSector: newSector.trim() || `Sector 16 - Mz ${newBlock}`,
      reason: reason.trim(),
      actNumber: actNumber.trim(),
      authorizedBy: authorizedBy.trim(),
      notes: notes.trim(),
    });

    onClose();
  };

  const handleNotifyWhatsApp = () => {
    const text = `Estimado/a ${resident.fullName} (C.I. ${resident.documentId}):\nLe comunicamos que por resolución de la Comisión Vecinal del Sector 16 (${actNumber}), se ha formalizado su REUBICACIÓN de lote:\n\n- Ubicación Anterior: Manzana ${resident.block}, Lote ${resident.lot}\n- NUEVA Ubicación: Manzana ${newBlock}, Lote ${newLot} (${newSector})\n- Motivo: ${reason}\n- Autorizado por: ${authorizedBy}\n\nFavor acérquese a la secretaría comunal para la actualización de su legajo de ocupación para el INDERT.`;
    openWhatsApp(resident.phone, text);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Header */}
        <div className="bg-[#1877F2] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight">
                Reubicación de Ocupante (Cambio de Lote)
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">
                Padrón Oficial Sector 16 • Asignación de nueva Manzana y Lote
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

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4">
          {/* Current Occupant Details Card */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Ocupante a Reubicar
                </span>
                <span className="text-sm font-black text-slate-900 block">{resident.fullName}</span>
                <span className="text-xs text-slate-500 font-mono">
                  C.I. {resident.documentId} • Tel: {resident.phone}
                </span>
              </div>
              <div className="text-right bg-white p-2 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-semibold">Ubicación Actual</span>
                <span className="text-xs font-black text-rose-700 block">
                  Mz. {resident.block} - Lote {resident.lot}
                </span>
                <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                  {resident.sector}
                </span>
              </div>
            </div>
          </div>

          {/* New Location Inputs */}
          <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-200 space-y-3">
            <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#1877F2]" />
              <span>Nueva Ubicación Asignada</span>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nueva Manzana (Mz) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: B, C, D..."
                  value={newBlock}
                  onChange={(e) => {
                    const b = e.target.value.toUpperCase();
                    setNewBlock(b);
                    setNewSector(`Sector 16 - Mz ${b}`);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold bg-white focus:ring-2 focus:ring-[#1877F2] focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nuevo Lote *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: 04, 12, 15B..."
                  value={newLot}
                  onChange={(e) => setNewLot(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold bg-white focus:ring-2 focus:ring-[#1877F2] focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Sector / Pasaje / Referencia de Ubicación
              </label>
              <input
                type="text"
                placeholder="Ej: Sector Alto, Pasaje Norte, Cerca al Tanque Comunal..."
                value={newSector}
                onChange={(e) => setNewSector(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
              />
            </div>

            {/* Warning if lot is already occupied */}
            {lotConflict && (
              <div className="bg-rose-50 border border-rose-300 p-2.5 rounded-lg text-xs text-rose-900 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold">¡Lote Ocupado!</strong>
                  <span>
                    La Manzana {newBlock}, Lote {newLot} ya está registrada a nombre de{' '}
                    <strong>{lotConflict.fullName}</strong> (C.I. {lotConflict.documentId}). Verifique el
                    número antes de proceder para evitar superposiciones.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Reason & Resolution Documentation */}
          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Motivo / Justificación de la Reubicación *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-medium"
              >
                <option value="Apertura y ensanche de calle comunal">Apertura y ensanche de calle comunal</option>
                <option value="Zona inundable / afectación de zanja pluvial">Zona inundable / afectación de zanja pluvial</option>
                <option value="Resolución y Mensura Pericial INDERT">Resolución y Mensura Pericial INDERT</option>
                <option value="Acuerdo de convivencia / reordenamiento vecinal">Acuerdo de convivencia / reordenamiento vecinal</option>
                <option value="Unificación o cercanía con familiar mayor o con discapacidad">Unificación o cercanía con familiar mayor o con discapacidad</option>
                <option value="Otro motivo justificado en asamblea">Otro motivo justificado en asamblea</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  N° de Acta o Resolución *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Acta N° 15/2026"
                  value={actNumber}
                  onChange={(e) => setActNumber(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Autorizado por *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Carlos Mendoza (Presidente)"
                  value={authorizedBy}
                  onChange={(e) => setAuthorizedBy(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Observaciones Adicionales / Notas de Entrega
              </label>
              <textarea
                rows={2}
                placeholder="Detalle acuerdos sobre traslado de materiales, plazo de mudanza o estado del terreno..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="border-t border-slate-200 pt-3 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleNotifyWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              Notificar al Ocupante por WhatsApp
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={Boolean(lotConflict)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1877F2] hover:bg-blue-600 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar y Registrar Reubicación
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

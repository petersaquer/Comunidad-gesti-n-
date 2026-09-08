import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Incident, IncidentCategory, IncidentPriority, IncidentStatus, Resident } from '../types';
import { ResidentSearchSelect } from './ResidentSearchSelect';

interface IncidentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (incident: Incident) => void;
  residents: Resident[];
  initialIncident?: Incident | null;
}

export const IncidentModal: React.FC<IncidentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  residents,
  initialIncident,
}) => {
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<Incident>>({
    title: '',
    description: '',
    category: 'agua_fuga',
    reportedByName: '',
    block: 'A',
    lot: '',
    reportedDate: today,
    priority: 'media',
    status: 'abierta',
    assignedTo: 'Comisión Vecinal',
    resolutionNotes: '',
  });

  useEffect(() => {
    if (initialIncident) {
      setFormData(initialIncident);
    } else {
      setFormData({
        title: '',
        description: '',
        category: 'agua_fuga',
        reportedByName: residents[0]?.fullName || 'Vecino Anónimo',
        block: residents[0]?.block || 'A',
        lot: residents[0]?.lot || '01',
        reportedDate: today,
        priority: 'media',
        status: 'abierta',
        assignedTo: 'Comisión de Servicios',
        resolutionNotes: '',
      });
    }
  }, [initialIncident, isOpen, residents, today]);

  if (!isOpen) return null;

  const handleResidentSelect = (residentId: string) => {
    const res = residents.find((r) => r.id === residentId);
    if (res) {
      setFormData((prev) => ({
        ...prev,
        reportedByResidentId: res.id,
        reportedByName: res.fullName,
        block: res.block,
        lot: res.lot,
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      alert('Por favor ingrese el título y la descripción del reporte.');
      return;
    }

    const incident: Incident = {
      id: initialIncident ? initialIncident.id : `inc-${Date.now()}`,
      title: formData.title || '',
      description: formData.description || '',
      category: formData.category || 'otro',
      reportedByResidentId: formData.reportedByResidentId,
      reportedByName: formData.reportedByName || 'Vecino',
      block: formData.block || 'A',
      lot: formData.lot || '01',
      reportedDate: formData.reportedDate || today,
      priority: formData.priority || 'media',
      status: formData.status || 'abierta',
      assignedTo: formData.assignedTo || 'Comisión Vecinal',
      resolutionNotes: formData.resolutionNotes || '',
      resolvedAt:
        formData.status === 'resuelta'
          ? formData.resolvedAt || new Date().toLocaleString()
          : undefined,
    };

    onSave(incident);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-600 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {initialIncident ? 'Editar Incidencia' : 'Reportar Incidencia del Terreno'}
              </h3>
              <p className="text-xs text-slate-300">
                Fugas, cortes, invasiones, linderos o problemas comunales
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs text-slate-700">
          <div>
            <label className="block font-semibold text-slate-900 mb-1">
              Tipo / Categoría de la Incidencia *
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as IncidentCategory })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium"
            >
              <option value="agua_fuga">💧 Fuga o Rotura en Red de Agua</option>
              <option value="luz_corte">⚡ Corte de Luz / Problema en Transformador</option>
              <option value="intento_invasion">⚠️ Intento de Invasión o Venta Ilegal de Lote</option>
              <option value="linderos_terreno">📐 Disputa de Linderos / Medidas de Terreno</option>
              <option value="seguridad">🛡️ Seguridad / Transeúntes Sospechosos</option>
              <option value="caminos">🚜 Bloqueo o Daño en Camino de Acceso</option>
              <option value="convivencia">👥 Convivencia / Ruido / Desacuerdos Vecinales</option>
              <option value="otro">📦 Otra Novedad</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-900 mb-1">Título del Reporte *</label>
            <input
              type="text"
              required
              placeholder="Ej: Fuga de agua en manguera principal frente a Manzana B"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-900 mb-1">Descripción Detallada *</label>
            <textarea
              rows={3}
              required
              placeholder="Explique exactamente qué ocurrió, en qué punto del terreno y qué se necesita..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* Vecino que reporta con Buscador Modal */}
          <ResidentSearchSelect
            residents={residents}
            selectedResidentId={formData.reportedByResidentId}
            onSelect={(res) => handleResidentSelect(res.id)}
            label="Reportado por (Residente u Ocupante)"
            required={false}
            placeholder="Buscar vecino por nombre o Cédula..."
          />

          <div>
            <label className="block font-semibold text-slate-900 mb-1">Ubicación del Problema / Lote</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Mz (Ej: A)"
                value={formData.block}
                onChange={(e) => setFormData({ ...formData, block: e.target.value.toUpperCase() })}
                className="w-1/2 px-3 py-2 border border-slate-300 rounded-lg text-xs uppercase bg-white font-bold"
              />
              <input
                type="text"
                placeholder="Lote (Ej: 04)"
                value={formData.lot}
                onChange={(e) => setFormData({ ...formData, lot: e.target.value })}
                className="w-1/2 px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-900 mb-1">Nivel de Prioridad</label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as IncidentPriority })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
              >
                <option value="baja">Baja - Para resolver en semana</option>
                <option value="media">Media - Atención normal</option>
                <option value="alta">Alta - Requiere acción pronta</option>
                <option value="urgente">🚨 URGENTE - Atención Inmediata</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-900 mb-1">Estado de la Incidencia</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as IncidentStatus })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
              >
                <option value="abierta">Abierta / Pendiente</option>
                <option value="en_proceso">En Proceso de Atención</option>
                <option value="resuelta">Resuelta / Solucionada</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-900 mb-1">
              Responsable Asignado para Solucionar
            </label>
            <input
              type="text"
              placeholder="Ej: Carlos Mendoza (Presidente), Comisión de Agua"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-900 mb-1">
              Notas de Resolución o Dictamen
            </label>
            <textarea
              rows={2}
              placeholder="Acciones tomadas, acuerdos tomados o piezas compradas..."
              value={formData.resolutionNotes}
              onChange={(e) => setFormData({ ...formData, resolutionNotes: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

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
              className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Guardar Incidencia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

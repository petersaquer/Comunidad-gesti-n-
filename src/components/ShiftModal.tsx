import React, { useState, useEffect } from 'react';
import { X, Calendar, CheckCircle2 } from 'lucide-react';
import { MaintenanceShift, ShiftCategory, ShiftStatus, Resident, CommunitySettings } from '../types';
import { ResidentSearchSelect } from './ResidentSearchSelect';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shift: MaintenanceShift) => void;
  residents: Resident[];
  initialShift?: MaintenanceShift | null;
  settings: CommunitySettings;
}

export const ShiftModal: React.FC<ShiftModalProps> = ({
  isOpen,
  onClose,
  onSave,
  residents,
  initialShift,
  settings,
}) => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<MaintenanceShift>>({
    taskTitle: '',
    taskCategory: 'limpieza',
    assignedResidentId: '',
    dateScheduled: tomorrow,
    timeSlot: '08:00 - 12:00',
    status: 'scheduled' as ShiftStatus,
    completionNotes: '',
    fineAmount: 0,
  });

  useEffect(() => {
    if (initialShift) {
      setFormData(initialShift);
    } else {
      setFormData({
        taskTitle: 'Faena Comunitaria: Limpieza de Malezas y Caminos',
        taskCategory: 'limpieza',
        assignedResidentId: residents[0]?.id || '',
        dateScheduled: tomorrow,
        timeSlot: '08:00 - 12:00',
        status: 'scheduled',
        completionNotes: '',
        fineAmount: 0,
      });
    }
  }, [initialShift, isOpen, residents, tomorrow]);

  if (!isOpen) return null;

  const handleCategoryChange = (cat: ShiftCategory) => {
    let defaultTitle = '';
    if (cat === 'limpieza') defaultTitle = 'Faena Comunitaria: Desmalezado y Limpieza de Calles';
    else if (cat === 'vigilancia') defaultTitle = 'Ronda de Vigilancia Nocturna Comunal';
    else if (cat === 'zanjas_agua') defaultTitle = 'Apertura de Zanjas / Reparación de Tubería de Agua';
    else if (cat === 'caminos') defaultTitle = 'Mejoramiento y Bacheo con Ripio de Acceso Principal';
    else if (cat === 'electrico') defaultTitle = 'Revisión de Cableado y Postes de Iluminación';
    else defaultTitle = 'Faena General Dominical Obligatoria';

    setFormData((prev) => ({ ...prev, taskCategory: cat, taskTitle: defaultTitle }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resident = residents.find((r) => r.id === formData.assignedResidentId);
    if (!resident) {
      alert('Por favor seleccione el residente asignado.');
      return;
    }

    const shift: MaintenanceShift = {
      id: initialShift ? initialShift.id : `shift-${Date.now()}`,
      taskTitle: formData.taskTitle || 'Turno de Mantenimiento',
      taskCategory: formData.taskCategory || 'limpieza',
      assignedResidentId: resident.id,
      assignedResidentName: resident.fullName,
      block: resident.block,
      lot: resident.lot,
      dateScheduled: formData.dateScheduled || tomorrow,
      timeSlot: formData.timeSlot || '08:00 - 12:00',
      status: formData.status || 'scheduled',
      completionNotes: formData.completionNotes || '',
      fineAmount: Number(formData.fineAmount) || 0,
      completedAt:
        formData.status === 'completed'
          ? formData.completedAt || new Date().toLocaleString()
          : undefined,
    };

    onSave(shift);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-600 rounded-lg">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {initialShift ? 'Editar Turno de Mantenimiento' : 'Asignar Turno de Trabajo / Faena'}
              </h3>
              <p className="text-xs text-slate-300">
                Limpieza comunal, vigilancia, agua y caminos
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
            <label className="block font-semibold text-slate-900 mb-1">Tipo de Tarea *</label>
            <select
              value={formData.taskCategory}
              onChange={(e) => handleCategoryChange(e.target.value as ShiftCategory)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium"
            >
              <option value="limpieza">🌿 Limpieza y Desmalezado de Caminos</option>
              <option value="vigilancia">🛡️ Vigilancia Vecinal Nocturna / Acceso</option>
              <option value="zanjas_agua">💧 Mantenimiento de Tuberías / Tanque de Agua</option>
              <option value="caminos">🚜 Arreglo de Caminos y Desagües</option>
              <option value="electrico">⚡ Apoyo en Tendido Eléctrico</option>
              <option value="faena_general">👥 Faena Comunitaria General</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-900 mb-1">Título de la Labor *</label>
            <input
              type="text"
              required
              value={formData.taskTitle}
              onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          {/* Selector de Residente con Buscador */}
          <ResidentSearchSelect
            residents={residents}
            selectedResidentId={formData.assignedResidentId}
            onSelect={(res) => setFormData({ ...formData, assignedResidentId: res.id })}
            label="Residente Responsable (Por Manzana y Lote)"
            required={true}
            placeholder="Buscar por nombre o Cédula (C.I.)..."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-900 mb-1">Fecha Programada *</label>
              <input
                type="date"
                required
                value={formData.dateScheduled}
                onChange={(e) => setFormData({ ...formData, dateScheduled: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-900 mb-1">Horario del Turno</label>
              <input
                type="text"
                placeholder="Ej: 08:00 - 12:00 o 22:00 - 04:00"
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-900 mb-1">Estado del Turno</label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as ShiftStatus })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
              >
                <option value="scheduled">Programado (Pendiente)</option>
                <option value="completed">Cumplido Satisfactoriamente</option>
                <option value="absent">Ausente / No se presentó (Falta)</option>
                <option value="replaced">Cumplido por Reemplazante</option>
                <option value="fined">Multado por Inasistencia</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-900 mb-1">
                Multa en caso de Falta ({settings.currencySymbol})
              </label>
              <input
                type="number"
                min="0"
                value={formData.fineAmount}
                onChange={(e) =>
                  setFormData({ ...formData, fineAmount: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-900 mb-1">
              Instrucciones / Observaciones de Cumplimiento
            </label>
            <textarea
              rows={2}
              placeholder="Herramientas a llevar, reporte de asistencia o novedades..."
              value={formData.completionNotes}
              onChange={(e) => setFormData({ ...formData, completionNotes: e.target.value })}
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
              Guardar Turno
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

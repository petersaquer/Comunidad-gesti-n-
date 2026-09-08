import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  MessageCircle,
  Trash2,
  Edit2,
  Shield,
  Droplet,
  Sparkles,
  Truck,
  Zap,
  AlertTriangle,
  X,
} from 'lucide-react';
import { MaintenanceShift, Resident, ShiftCategory, ShiftStatus, CommunitySettings } from '../types';
import { generateShiftReminderMessage, openWhatsApp } from '../utils/notificationUtils';
import { formatGuaranies } from '../utils/currency';

interface ShiftsTabProps {
  shifts: MaintenanceShift[];
  residents: Resident[];
  settings: CommunitySettings;
  onOpenNewShift: () => void;
  onUpdateShift: (shift: MaintenanceShift) => void;
  onDeleteShift: (id: string) => void;
}

export const ShiftsTab: React.FC<ShiftsTabProps> = ({
  shifts,
  residents,
  settings,
  onOpenNewShift,
  onUpdateShift,
  onDeleteShift,
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const getCategoryIcon = (cat: ShiftCategory) => {
    switch (cat) {
      case 'vigilancia':
        return <Shield className="w-4 h-4 text-purple-600" />;
      case 'zanjas_agua':
        return <Droplet className="w-4 h-4 text-blue-600" />;
      case 'limpieza':
        return <Sparkles className="w-4 h-4 text-emerald-600" />;
      case 'caminos':
        return <Truck className="w-4 h-4 text-amber-600" />;
      case 'electrico':
        return <Zap className="w-4 h-4 text-amber-500" />;
      default:
        return <Calendar className="w-4 h-4 text-slate-600" />;
    }
  };

  const filteredShifts = useMemo(() => {
    return shifts.filter((s) => {
      const matchesSearch =
        s.taskTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.assignedResidentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.block.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.lot.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = filterStatus === 'ALL' || s.status === filterStatus;
      const matchesCategory = filterCategory === 'ALL' || s.taskCategory === filterCategory;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [shifts, searchTerm, filterStatus, filterCategory]);

  const handleMarkCompleted = (shift: MaintenanceShift) => {
    const updated: MaintenanceShift = {
      ...shift,
      status: 'completed',
      completedAt: new Date().toLocaleString(),
      completionNotes: (shift.completionNotes ? shift.completionNotes + ' ' : '') + `[Cumplido ✓]`,
    };
    onUpdateShift(updated);
  };

  const [absenceModalShift, setAbsenceModalShift] = useState<MaintenanceShift | null>(null);
  const [absenceFineAmount, setAbsenceFineAmount] = useState<number>(50000);
  const [absenceNotes, setAbsenceNotes] = useState<string>('No asistió a faena comunitaria sin reemplazo');

  const handleMarkAbsent = (shift: MaintenanceShift) => {
    setAbsenceModalShift(shift);
    setAbsenceFineAmount(50000);
    setAbsenceNotes('No asistió a faena comunitaria sin reemplazo');
  };

  const handleConfirmAbsence = () => {
    if (!absenceModalShift) return;
    const updated: MaintenanceShift = {
      ...absenceModalShift,
      status: 'absent',
      fineAmount: absenceFineAmount,
      completionNotes:
        (absenceModalShift.completionNotes ? absenceModalShift.completionNotes + ' ' : '') +
        `[No asistió a faena. Multa: ${formatGuaranies(absenceFineAmount)}. ${absenceNotes}]`,
    };
    onUpdateShift(updated);
    setAbsenceModalShift(null);
  };

  const handleSendReminder = (shift: MaintenanceShift) => {
    const resident = residents.find((r) => r.id === shift.assignedResidentId);
    if (!resident) {
      alert('Residente no encontrado');
      return;
    }
    const message = generateShiftReminderMessage(shift, resident, settings);
    openWhatsApp(resident.phone, message);
  };

  const scheduledCount = shifts.filter((s) => s.status === 'scheduled').length;
  const completedCount = shifts.filter((s) => s.status === 'completed').length;
  const absentCount = shifts.filter((s) => s.status === 'absent').length;

  return (
    <div className="space-y-4">
      {/* Header and Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-600" />
              Turnos de Mantenimiento & Faenas Vecinales
            </h3>
            <p className="text-xs text-slate-500">
              Asignación por manzana y lote, control de asistencia e historial de faenas cumplidas
            </p>
          </div>

          <button
            onClick={onOpenNewShift}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Asignar Turno / Faena
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <input
            type="text"
            placeholder="Buscar por labor, residente, manzana o lote..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
          >
            <option value="ALL">Todos los Estados ({shifts.length})</option>
            <option value="scheduled">Programados ({scheduledCount})</option>
            <option value="completed">Cumplidos ({completedCount})</option>
            <option value="absent">Faltas / Multados ({absentCount})</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs"
          >
            <option value="ALL">Todas las Labores</option>
            <option value="limpieza">Limpieza y Desmalezado</option>
            <option value="vigilancia">Vigilancia Vecinal</option>
            <option value="zanjas_agua">Tuberías / Tanque de Agua</option>
            <option value="caminos">Arreglo de Caminos</option>
            <option value="faena_general">Faena Dominical General</option>
          </select>
        </div>
      </div>

      {/* Shifts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-3.5">Fecha & Horario</th>
                <th className="py-3 px-3.5">Labor / Tarea</th>
                <th className="py-3 px-3.5">Residente Asignado</th>
                <th className="py-3 px-3.5">Estado Asistencia</th>
                <th className="py-3 px-3.5">Observaciones & Multas</th>
                <th className="py-3 px-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredShifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    No se encontraron turnos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredShifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3.5">
                      <div className="font-bold text-slate-900">{shift.dateScheduled}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {shift.timeSlot}
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-1.5">
                        {getCategoryIcon(shift.taskCategory)}
                        <span className="font-bold text-slate-900">{shift.taskTitle}</span>
                      </div>
                      <span className="text-[10px] uppercase text-slate-500 font-semibold tracking-wider">
                        {shift.taskCategory.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="font-bold text-slate-900">{shift.assignedResidentName}</div>
                      <div className="text-[11px] text-slate-500">
                        Manzana <strong className="text-slate-700">{shift.block}</strong> - Lote{' '}
                        <strong className="text-slate-700">{shift.lot}</strong>
                      </div>
                    </td>

                    <td className="py-2.5 px-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          shift.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : shift.status === 'scheduled'
                            ? 'bg-blue-100 text-blue-800'
                            : shift.status === 'absent'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-800'
                        }`}
                      >
                        {shift.status === 'completed' && <CheckCircle2 className="w-3 h-3" />}
                        {shift.status === 'absent' && <XCircle className="w-3 h-3" />}
                        {shift.status === 'scheduled' && <Clock className="w-3 h-3" />}
                        {shift.status === 'completed'
                          ? 'CUMPLIDO'
                          : shift.status === 'scheduled'
                          ? 'PROGRAMADO'
                          : shift.status === 'absent'
                          ? 'AUSENTE (FALTA)'
                          : shift.status.toUpperCase()}
                      </span>
                      {shift.completedAt && (
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {shift.completedAt}
                        </div>
                      )}
                    </td>

                    <td className="py-2.5 px-3.5">
                      <div className="text-slate-700">{shift.completionNotes || '-'}</div>
                      {shift.fineAmount ? (
                        <span className="inline-block mt-0.5 px-1.5 py-0.5 bg-rose-50 text-rose-700 rounded text-[10px] font-bold border border-rose-200">
                          Multa: {formatGuaranies(shift.fineAmount)}
                        </span>
                      ) : null}
                    </td>

                    <td className="py-2.5 px-3.5 text-right">
                      <div className="inline-flex items-center gap-1">
                        {shift.status === 'scheduled' && (
                          <>
                            <button
                              onClick={() => handleMarkCompleted(shift)}
                              title="Marcar faena cumplida"
                              className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md border border-emerald-200 transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleMarkAbsent(shift)}
                              title="Registrar falta / multa"
                              className="p-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-md border border-rose-200 transition-colors cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleSendReminder(shift)}
                              title="Enviar recordatorio de faena por WhatsApp"
                              className="p-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md border border-green-200 transition-colors cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar turno de "${shift.taskTitle}"?`)) {
                              onDeleteShift(shift.id);
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Inasistencia y Multa Comunal */}
      {absenceModalShift && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    Registrar Inasistencia a Faena
                  </h3>
                  <p className="text-xs text-slate-500">
                    Aplicar multa comunitaria según reglamento
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAbsenceModalShift(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                <div className="font-bold text-slate-800 text-xs">
                  {absenceModalShift.assignedResidentName}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Manzana <strong>{absenceModalShift.block}</strong> - Lote <strong>{absenceModalShift.lot}</strong>
                </div>
                <div className="text-slate-600 text-[11px] pt-1">
                  Faena: <strong>{absenceModalShift.taskTitle}</strong> ({absenceModalShift.dateScheduled})
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Monto de la Multa (en Guaraníes):
                </label>
                <input
                  type="number"
                  step="5000"
                  min="0"
                  value={absenceFineAmount}
                  onChange={(e) => setAbsenceFineAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-rose-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Monto sugerido para faena comunal: Gs. 50.000 (o 0 si cuenta con reposición aprobada).
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Motivo u Observaciones:
                </label>
                <textarea
                  rows={2}
                  value={absenceNotes}
                  onChange={(e) => setAbsenceNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-rose-500"
                  placeholder="Detallar causa o si fue avisado con anticipación..."
                />
              </div>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <span className="font-bold shrink-0">💡 Nota:</span>
                <span>
                  Al confirmar, la multa se registrará automáticamente como deuda exigible en el estado de cuenta y tesorería del residente.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setAbsenceModalShift(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAbsence}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Confirmar Inasistencia & Multa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

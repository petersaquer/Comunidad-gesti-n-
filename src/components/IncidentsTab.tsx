import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Plus,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Droplet,
  Zap,
  MapPin,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { Incident, Resident, IncidentCategory, IncidentPriority, IncidentStatus } from '../types';

interface IncidentsTabProps {
  incidents: Incident[];
  residents: Resident[];
  onOpenNewIncident: () => void;
  onUpdateIncident: (incident: Incident) => void;
  onDeleteIncident: (id: string) => void;
}

export const IncidentsTab: React.FC<IncidentsTabProps> = ({
  incidents,
  onOpenNewIncident,
  onUpdateIncident,
  onDeleteIncident,
}) => {
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const getPriorityBadge = (priority: IncidentPriority) => {
    switch (priority) {
      case 'urgente':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
            🚨 Urgente
          </span>
        );
      case 'alta':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
            ⚠️ Alta
          </span>
        );
      case 'media':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-800">
            Media
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700">
            Baja
          </span>
        );
    }
  };

  const getCategoryIcon = (category: IncidentCategory) => {
    switch (category) {
      case 'agua_fuga':
        return <Droplet className="w-4 h-4 text-blue-500" />;
      case 'luz_corte':
        return <Zap className="w-4 h-4 text-amber-500" />;
      case 'intento_invasion':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'linderos_terreno':
        return <MapPin className="w-4 h-4 text-purple-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-slate-500" />;
    }
  };

  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchesSearch =
        inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.reportedByName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.block.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inc.lot.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesPriority = filterPriority === 'ALL' || inc.priority === filterPriority;
      const matchesStatus = filterStatus === 'ALL' || inc.status === filterStatus;

      return matchesSearch && matchesPriority && matchesStatus;
    });
  }, [incidents, searchTerm, filterPriority, filterStatus]);

  const [resolvingIncident, setResolvingIncident] = useState<Incident | null>(null);
  const [resolutionText, setResolutionText] = useState<string>('');

  const handleResolve = (incident: Incident) => {
    setResolvingIncident(incident);
    setResolutionText('');
  };

  const handleConfirmResolve = () => {
    if (!resolvingIncident) return;
    const updated: Incident = {
      ...resolvingIncident,
      status: 'resuelta',
      resolutionNotes: resolutionText.trim() || 'Incidencia solucionada y verificada en terreno.',
      resolvedAt: new Date().toLocaleString(),
    };
    onUpdateIncident(updated);
    setResolvingIncident(null);
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Panel de Incidencias & Novedades del Terreno
            </h3>
            <p className="text-xs text-slate-500">
              Reporte de averías de agua, luz, problemas de linderos o sospecha de reventa ilegal de lotes
            </p>
          </div>

          <button
            onClick={onOpenNewIncident}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Reportar Incidencia
          </button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <input
            type="text"
            placeholder="Buscar por título, descripción, reportante..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
          />

          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
          >
            <option value="ALL">Todas las Prioridades</option>
            <option value="urgente">🚨 Solo Urgentes</option>
            <option value="alta">⚠️ Prioridad Alta</option>
            <option value="media">Prioridad Media</option>
            <option value="baja">Prioridad Baja</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
          >
            <option value="ALL">Todos los Estados ({incidents.length})</option>
            <option value="abierta">Abiertas / Pendientes</option>
            <option value="en_proceso">En Proceso</option>
            <option value="resuelta">Resueltas ✓</option>
          </select>
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-3">
        {filteredIncidents.length === 0 ? (
          <div className="py-10 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <p className="text-slate-400 text-xs">No hay incidencias que coincidan con los filtros.</p>
          </div>
        ) : (
          filteredIncidents.map((incident) => (
            <div
              key={incident.id}
              className={`bg-white p-4 rounded-xl border shadow-2xs transition-all ${
                incident.priority === 'urgente' && incident.status !== 'resuelta'
                  ? 'border-rose-300 ring-1 ring-rose-200 bg-rose-50/10'
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-slate-100 rounded-lg shrink-0 mt-0.5">
                    {getCategoryIcon(incident.category)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-bold text-slate-900 text-sm">{incident.title}</span>
                      {getPriorityBadge(incident.priority)}
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          incident.status === 'resuelta'
                            ? 'bg-emerald-100 text-emerald-800'
                            : incident.status === 'en_proceso'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {incident.status === 'resuelta'
                          ? 'RESUELTA'
                          : incident.status === 'en_proceso'
                          ? 'EN PROCESO'
                          : 'ABIERTA'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{incident.description}</p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-2.5">
                      <span>
                        Reportado por:{' '}
                        <strong className="text-slate-700">{incident.reportedByName}</strong> (Mz{' '}
                        {incident.block}-Lote {incident.lot})
                      </span>
                      <span>•</span>
                      <span>Fecha: {incident.reportedDate}</span>
                      {incident.assignedTo && (
                        <>
                          <span>•</span>
                          <span>
                            Asignado a: <strong className="text-slate-700">{incident.assignedTo}</strong>
                          </span>
                        </>
                      )}
                    </div>

                    {/* Resolution log */}
                    {incident.resolutionNotes && (
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                        <strong className="text-slate-900 block text-[11px] mb-0.5">
                          Solución / Dictamen Aplicado:
                        </strong>
                        {incident.resolutionNotes}
                        {incident.resolvedAt && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            Fecha de resolución: {incident.resolvedAt}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end md:self-start shrink-0">
                  {incident.status !== 'resuelta' && (
                    <button
                      onClick={() => handleResolve(incident)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Marcar Resuelta
                    </button>
                  )}
                  <button
                    onClick={() => {
                      if (confirm(`¿Eliminar reporte "${incident.title}"?`)) {
                        onDeleteIncident(incident.id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal: Resolver Incidencia */}
      {resolvingIncident && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-sm">
                    Cerrar y Marcar como Resuelta
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registro de solución comunitaria
                  </p>
                </div>
              </div>
              <button
                onClick={() => setResolvingIncident(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                <div className="font-bold text-slate-800 text-xs mb-1">
                  {resolvingIncident.title}
                </div>
                <div className="text-slate-500 text-[11px]">
                  Ubicación: Manzana <strong>{resolvingIncident.block}</strong> - Lote <strong>{resolvingIncident.lot}</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Notas de la Solución o Acuerdo Alcanzado:
                </label>
                <textarea
                  rows={3}
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  placeholder="Ej: Se reparó la cañería con el técnico del barrio; los vecinos firmaron acuerdo de linderos amistosamente..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResolvingIncident(null)}
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmResolve}
                className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs cursor-pointer"
              >
                Guardar Resolución
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

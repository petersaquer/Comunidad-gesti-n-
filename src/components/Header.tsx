import React from 'react';
import {
  Users,
  DollarSign,
  AlertTriangle,
  Calendar,
  ShieldAlert,
  Plus,
  RefreshCw,
  LandPlot,
} from 'lucide-react';
import { Resident, Contribution, Expense, MaintenanceShift, Incident, CommunitySettings } from '../types';
import { formatGuaranies } from '../utils/currency';

interface HeaderProps {
  residents: Resident[];
  contributions: Contribution[];
  expenses: Expense[];
  shifts: MaintenanceShift[];
  incidents: Incident[];
  settings: CommunitySettings;
  onOpenNewResident: () => void;
  onOpenNewContribution: () => void;
  onOpenNewExpense: () => void;
  onOpenNewShift: () => void;
  onOpenNewIncident: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  residents,
  contributions,
  expenses,
  shifts,
  incidents,
  settings,
  onOpenNewResident,
  onOpenNewContribution,
  onOpenNewExpense,
  onOpenNewShift,
  onOpenNewIncident,
  onResetData,
}) => {
  // Calculations
  const activeResidents = residents.filter((r) => r.status === 'active').length;
  const totalPaid = contributions.reduce((acc, c) => acc + c.amountPaid, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.amount, 0);
  const netBalance = totalPaid - totalExpenses;

  const pendingDebts = contributions.reduce((acc, c) => acc + (c.amount - c.amountPaid), 0);
  const pendingDebtorsCount = new Set(
    contributions.filter((c) => c.amount > c.amountPaid).map((c) => c.residentId)
  ).size;

  const urgentIncidents = incidents.filter(
    (i) => (i.priority === 'urgente' || i.priority === 'alta') && i.status !== 'resuelta'
  ).length;

  const upcomingShifts = shifts.filter((s) => s.status === 'scheduled').length;
  const fraudAlerts = residents.filter((r) => r.isFraudRisk).length;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-md flex items-center justify-center">
              <LandPlot className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">ComunidApp</h1>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700">
                  Control de Terrenos & Censo
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {settings.communityName} • {settings.settlementLocation}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-quick-new-resident"
              onClick={onOpenNewResident}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nuevo Residente
            </button>
            <button
              id="btn-quick-new-contribution"
              onClick={onOpenNewContribution}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Cobrar Aporte
            </button>
            <button
              id="btn-quick-new-expense"
              onClick={onOpenNewExpense}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Registrar Gasto
            </button>
            <button
              id="btn-quick-new-shift"
              onClick={onOpenNewShift}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              Asignar Faena
            </button>
            <button
              id="btn-quick-new-incident"
              onClick={onOpenNewIncident}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Incidencia
            </button>
            <button
              id="btn-reset-demo"
              onClick={onResetData}
              title="Restaurar datos iniciales de demostración"
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-time KPI Pill Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 mt-3 pt-3 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-700/60 flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-950 text-emerald-400 rounded-md">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Censo Activo</span>
              <span className="font-bold text-slate-100">{activeResidents} Lotes / Familias</span>
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-700/60 flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-950 text-blue-400 rounded-md">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Caja Comunal</span>
              <span
                className={`font-bold ${
                  netBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatGuaranies(netBalance)}
              </span>
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-700/60 flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-950 text-amber-400 rounded-md">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Deuda en Mora</span>
              <span className="font-bold text-amber-300">
                {formatGuaranies(pendingDebts)} ({pendingDebtorsCount} deudores)
              </span>
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-700/60 flex items-center gap-2.5">
            <div className="p-1.5 bg-purple-950 text-purple-400 rounded-md">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Faenas Pendientes</span>
              <span className="font-bold text-purple-300">{upcomingShifts} turnos por cumplir</span>
            </div>
          </div>

          <div className="bg-slate-800/80 rounded-lg px-3 py-2 border border-slate-700/60 flex items-center gap-2.5 col-span-2 sm:col-span-1">
            <div className="p-1.5 bg-rose-950 text-rose-400 rounded-md">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Alertas Anti-Fraude</span>
              <span
                className={`font-bold ${
                  fraudAlerts > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-300'
                }`}
              >
                {fraudAlerts} investigado{fraudAlerts !== 1 ? 's' : ''} ({urgentIncidents} urgentes)
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

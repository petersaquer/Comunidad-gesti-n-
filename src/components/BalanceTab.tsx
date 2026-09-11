import React, { useState, useMemo } from 'react';
import {
  FileText,
  FileSpreadsheet,
  Printer,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Receipt,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { Contribution, Expense, Resident, CommunitySettings } from '../types';
import { exportFinancialBalanceToExcel, exportFinancialBalanceToPDF } from '../utils/exportUtils';
import { generateMonthlyBalancePDF } from '../utils/monthlyBalancePdfGenerator';
import { formatGuaranies } from '../utils/currency';
import { getParaguayCurrentMonth } from '../utils/paraguayDate';

interface BalanceTabProps {
  contributions: Contribution[];
  expenses: Expense[];
  residents: Resident[];
  settings: CommunitySettings;
}

export const BalanceTab: React.FC<BalanceTabProps> = ({
  contributions,
  expenses,
  residents,
  settings,
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // Available months
  const months = useMemo(() => {
    const set = new Set<string>();
    contributions.forEach((c) => c.month && set.add(c.month));
    expenses.forEach((e) => e.month && set.add(e.month));
    // Default current month if empty
    const current = getParaguayCurrentMonth();
    set.add(current);
    return Array.from(set).sort().reverse();
  }, [contributions, expenses]);

  const [selectedMonth, setSelectedMonth] = useState<string>(months[0] || '2026-09');

  // Filtered by selected month
  const monthContributions = useMemo(
    () => contributions.filter((c) => c.month === selectedMonth),
    [contributions, selectedMonth]
  );
  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.month === selectedMonth),
    [expenses, selectedMonth]
  );

  // Financial Metrics
  const totalIncomes = monthContributions.reduce((acc, c) => acc + c.amountPaid, 0);
  const totalExpectedIncomes = monthContributions.reduce((acc, c) => acc + c.amount, 0);
  const totalDebts = totalExpectedIncomes - totalIncomes;

  const totalSpent = monthExpenses.reduce((acc, e) => acc + e.amount, 0);
  const netBalance = totalIncomes - totalSpent;

  // Breakdown by Category for Incomes
  const incomesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthContributions.forEach((c) => {
      map[c.category] = (map[c.category] || 0) + c.amountPaid;
    });
    return map;
  }, [monthContributions]);

  // Breakdown by Category for Expenses
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    monthExpenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return map;
  }, [monthExpenses]);

  const handleExportPDF = () => {
    try {
      setIsGeneratingPdf(true);
      generateMonthlyBalancePDF({
        month: selectedMonth,
        contributions,
        expenses,
        residents,
        settings,
      });
    } catch (err) {
      console.error('Error al generar balance en PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExportExcel = () => {
    exportFinancialBalanceToExcel(selectedMonth, contributions, expenses, settings);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Community Accountability & Transparency Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 shrink-0 mt-0.5 sm:mt-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
              Rendición de Cuentas & Balances Mensuales
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                100% Transparente
              </span>
            </h3>
            <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
              Consulte el estado financiero real del Sector 16: recaudación de cuotas, egresos detallados por categoría, saldo disponible en caja y exportación formal en PDF y Excel para asambleas comunitarias.
            </p>
          </div>
        </div>
      </div>

      {/* Month Selector and Export Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <span className="text-xs font-bold text-slate-700">Período Contable:</span>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="py-1.5 px-3 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                Mes {m}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportPDF}
            disabled={isGeneratingPdf}
            title="Descargar balance mensual oficial en PDF con desglose de ingresos y gastos"
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            <span>{isGeneratingPdf ? 'Generando PDF...' : 'Descargar Balance en PDF'}</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Descargar Excel (.xlsx)
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Imprimir
          </button>
        </div>
      </div>

      {/* 4 Core Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Recaudación Total */}
        <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">
              Total Aportes Recaudados
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {formatGuaranies(totalIncomes)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            De {formatGuaranies(totalExpectedIncomes)} programados ({monthContributions.length} cuotas emitidas)
          </p>
        </div>

        {/* Gastos Comunitarios */}
        <div className="bg-white p-5 rounded-2xl border border-rose-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-800 uppercase tracking-wider">
              Total Gastos Comunitarios
            </span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-700 mt-2">
            {formatGuaranies(totalSpent)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {monthExpenses.length} egresos documentados con comprobantes
          </p>
        </div>

        {/* Saldo Neto en Caja */}
        <div
          className={`p-5 rounded-2xl border shadow-2xs ${
            netBalance >= 0 ? 'bg-white border-blue-200' : 'bg-rose-50 border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                netBalance >= 0 ? 'text-blue-800' : 'text-rose-900 font-bold'
              }`}
            >
              Saldo Neto del Mes
            </span>
            <div
              className={`p-2 rounded-xl ${
                netBalance >= 0 ? 'bg-blue-50 text-blue-600' : 'bg-rose-100 text-rose-700'
              }`}
            >
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div
            className={`text-2xl font-black mt-2 ${
              netBalance >= 0 ? 'text-blue-900' : 'text-rose-800'
            }`}
          >
            {formatGuaranies(netBalance)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {netBalance >= 0 ? 'Superávit en caja vecinal' : 'Déficit - Requiere aportes de contingencia'}
          </p>
        </div>

        {/* Deuda Pendiente de Cobro */}
        <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
              Cuotas Pendientes
            </span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700 mt-2">
            {formatGuaranies(totalDebts)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Sujeto a cobro y notificación por WhatsApp
          </p>
        </div>
      </div>

      {/* Two Column Breakdown: Incomes vs Expenses by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recaudación por Categoría */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            Ingresos por Aporte Comunal ({selectedMonth})
          </h3>

          <div className="space-y-3 text-xs">
            {Object.keys(incomesByCategory).length === 0 ? (
              <p className="text-slate-400 py-4 text-center">No hay aportes cobrados en este mes.</p>
            ) : (
              (Object.entries(incomesByCategory) as [string, number][]).map(([cat, amount]) => {
                const percentage = totalIncomes > 0 ? (amount / totalIncomes) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between font-medium text-slate-700">
                      <span className="capitalize">{cat}</span>
                      <span className="font-bold text-slate-900">
                        {formatGuaranies(amount)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Gastos por Categoría */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            Egresos Comunitarios por Categoría ({selectedMonth})
          </h3>

          <div className="space-y-3 text-xs">
            {Object.keys(expensesByCategory).length === 0 ? (
              <p className="text-slate-400 py-4 text-center">No hay gastos registrados en este mes.</p>
            ) : (
              (Object.entries(expensesByCategory) as [string, number][]).map(([cat, amount]) => {
                const percentage = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between font-medium text-slate-700">
                      <span className="capitalize">
                        {cat === 'luz'
                          ? '💡 Luz General / Medidor'
                          : cat === 'agua'
                          ? '💧 Agua / Cisterna'
                          : cat === 'caminos'
                          ? '🚜 Caminos y Ripio'
                          : cat === 'administrativo'
                          ? '📑 Trámites Legales'
                          : cat}
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatGuaranies(amount)} ({percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Official Signatures Box for Printable Document */}
      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-xs">
        <h4 className="font-bold text-slate-800 text-center uppercase tracking-wide mb-6">
          Comisión Directiva del Asentamiento / Terreno
        </h4>
        <div className="grid grid-cols-2 gap-8 max-w-lg mx-auto text-center">
          <div>
            <div className="border-b border-slate-400 pb-1 mb-2 font-semibold text-slate-900">
              {settings.presidentName}
            </div>
            <span className="text-slate-500 text-[11px] block">Presidente de la Comunidad</span>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-1 mb-2 font-semibold text-slate-900">
              {settings.treasurerName}
            </div>
            <span className="text-slate-500 text-[11px] block">Tesorero/a Comunal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import {
  DollarSign,
  Receipt,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  MessageCircle,
  Trash2,
  Send,
  Zap,
  Droplet,
  Wrench,
  FileText,
  ShieldCheck,
  Lock, Landmark, Wallet, TrendingUp, Clock,
} from 'lucide-react';
import {
  Contribution,
  Expense,
  Resident,
  CommunitySettings,
  ContributionCategory,
  ExpenseCategory,
  UserAccount,
} from '../types';
import { generatePaymentReminderMessage, openWhatsApp } from '../utils/notificationUtils';
import { formatGuaranies } from '../utils/currency';
import { formatParaguayDate } from '../utils/paraguayDate';
import {
  isAdministrativeUser,
  canViewSensitiveResidentData,
  maskDocumentId,
} from '../utils/privacyUtils';
import { UserBadge } from './UserBadge';

interface FinancesTabProps {
  contributions: Contribution[];
  allContributions?: Contribution[];
  expenses: Expense[];
  residents: Resident[];
  settings: CommunitySettings;
  currentUser?: UserAccount | null;
  onOpenNewContribution: () => void;
  onOpenNewExpense: () => void;
  onUpdateContribution: (contribution: Contribution) => void;
  onDeleteContribution: (id: string) => void;
  onDeleteExpense: (id: string) => void;
}

export const FinancesTab: React.FC<FinancesTabProps> = ({
  contributions,
  allContributions,
  expenses,
  residents,
  settings,
  currentUser,
  onOpenNewContribution,
  onOpenNewExpense,
  onUpdateContribution,
  onDeleteContribution,
  onDeleteExpense,
}) => {
  const [subTab, setSubTab] = useState<'contributions' | 'expenses'>('contributions');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const isAdmin = isAdministrativeUser(currentUser);
  const canManageFinances = isAdmin || currentUser?.permissions?.canManageFinances;

  // Quick category icons helper
  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'luz':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-900 border border-amber-200">
            <Zap className="w-3 h-3 text-amber-600" /> Luz
          </span>
        );
      case 'agua':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-900 border border-blue-200">
            <Droplet className="w-3 h-3 text-blue-600" /> Agua
          </span>
        );
      case 'mantenimiento':
      case 'caminos':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-900 border border-emerald-200">
            <Wrench className="w-3 h-3 text-emerald-600" /> {cat === 'caminos' ? 'Caminos' : 'Mantenimiento'}
          </span>
        );
      case 'administrativo':
      case 'legal':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-900 border border-purple-200">
            <FileText className="w-3 h-3 text-purple-600" /> {cat === 'legal' ? 'Legal/Topógrafo' : 'Administrativo'}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
            {cat.toUpperCase()}
          </span>
        );
    }
  };

  // Filtered contributions
  const filteredContributions = useMemo(() => {
    return contributions.filter((c) => {
      const matchesSearch =
        c.residentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.block.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.lot.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.documentId.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
      const matchesStatus = selectedStatus === 'ALL' || c.status === selectedStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [contributions, searchTerm, selectedCategory, selectedStatus]);

  // Filtered expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.supplierOrPayee.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.receiptOrInvoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCat = selectedCategory === 'ALL' || e.category === selectedCategory;

      return matchesSearch && matchesCat;
    });
  }, [expenses, searchTerm, selectedCategory]);

  // Metrics (Only 'paid' counts towards liquid treasury)
  const validContributions = contributions.filter((c) => c.status === 'paid');
  const totalContributionsPaid = validContributions.reduce((acc, c) => acc + c.amountPaid, 0);
  const totalContributionsUnderReview = contributions
    .filter((c) => c.status === 'pending' && c.amountPaid > 0)
    .reduce((acc, c) => acc + c.amountPaid, 0);

  const globalValidContributions = (allContributions || contributions).filter((c) => c.status === 'paid');
  const globalContributionsPaid = globalValidContributions.reduce((acc, c) => acc + c.amountPaid, 0);
  const globalUnderReview = (allContributions || contributions)
    .filter((c) => c.status === 'pending' && c.amountPaid > 0)
    .reduce((acc, c) => acc + c.amountPaid, 0);

  const totalContributionsPending = contributions.reduce((acc, c) => {
    if (c.status === 'paid') return acc;
    return acc + Math.max(0, c.amount - (c.status === 'partial' ? c.amountPaid : 0));
  }, 0);

  const totalExpensesPaid = expenses.filter((e) => e.status === 'paid').reduce((acc, e) => acc + e.amount, 0);
  const totalExpensesPending = expenses.filter((e) => e.status === 'pending').reduce((acc, e) => acc + e.amount, 0);
  const totalExpensesAmount = expenses.reduce((acc, e) => acc + e.amount, 0);
  const tesoreriaDisponible = globalContributionsPaid - totalExpensesPaid;

  // Mark contribution as fully paid and verified by Treasury
  const handleMarkAsPaid = (contribution: Contribution) => {
    const generatedReceipt =
      contribution.receiptNumber && contribution.receiptNumber.trim() !== ''
        ? contribution.receiptNumber
        : `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const updated: Contribution = {
      ...contribution,
      amountPaid: contribution.amount,
      status: 'paid',
      receiptNumber: generatedReceipt,
      notes:
        (contribution.notes ? contribution.notes + ' ' : '') +
        `[Aprobado y conciliado por Tesorería el ${formatParaguayDate()}]`,
    };
    onUpdateContribution(updated);
  };

  // Notify individual debtor
  const handleNotifyDebtor = (contribution: Contribution) => {
    const resident = residents.find((r) => r.id === contribution.residentId);
    if (!resident) {
      alert('Residente no encontrado');
      return;
    }
    const pendingContribs = contributions.filter(
      (c) => c.residentId === resident.id && c.amount > c.amountPaid
    );
    const msg = generatePaymentReminderMessage(resident, pendingContribs, settings);
    openWhatsApp(resident.phone, msg);
  };

  // Notify all debtors mass modal
  const debtorsList = useMemo(() => {
    const map = new Map<string, { resident: Resident; debt: number; pendingContribs: Contribution[] }>();
    contributions
      .filter((c) => c.amount > c.amountPaid)
      .forEach((c) => {
        const res = residents.find((r) => r.id === c.residentId);
        if (res) {
          const current = map.get(res.id) || { resident: res, debt: 0, pendingContribs: [] };
          current.debt += c.amount - c.amountPaid;
          current.pendingContribs.push(c);
          map.set(res.id, current);
        }
      });
    return Array.from(map.values());
  }, [contributions, residents]);

  return (
    <div className="space-y-4">
      {/* Community Transparency Banner */}
      <div className="bg-slate-900 text-white rounded-xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30 shrink-0 mt-0.5 sm:mt-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-2">
              Libro de Cuentas Abiertas & Transparencia Total
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Público para la Comunidad
              </span>
            </h3>
            <p className="text-slate-300 text-xs mt-0.5 leading-relaxed">
              En el Sector 16 cada aporte (cuotas de luz, agua, caminos) y cada egreso (facturas, insumos, topógrafo) son transparentes. Los datos personales sensibles permanecen protegidos.
            </p>
          </div>
        </div>
      </div>

      {/* Global Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-emerald-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Ingresos Recaudados</span>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
              Efectivo Validado
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-800">{formatGuaranies(globalContributionsPaid)}</p>
          <p className="text-[10px] text-slate-500 mt-1">
            {globalUnderReview > 0 ? (
              <span className="text-blue-700 font-semibold">
                + {formatGuaranies(globalUnderReview)} en revisión por tesorería
              </span>
            ) : (
              'Aportes, cuotas y multas 100% conciliadas'
            )}
          </p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-2xs flex flex-col justify-center">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-rose-600">
              <Receipt className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">Egresos Pagados</span>
            </div>
            <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">
              Desembolsado
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-800">{formatGuaranies(totalExpensesPaid)}</p>
          <p className="text-[10px] text-slate-500 mt-1">
            {totalExpensesPending > 0 ? (
              <span className="text-amber-700 font-semibold">
                Comprometido por pagar: {formatGuaranies(totalExpensesPending)}
              </span>
            ) : (
              'Facturas y gastos liquidados al día'
            )}
          </p>
        </div>

        <div className="bg-linear-to-br from-[#1877F2] to-blue-700 rounded-xl p-4 border border-blue-600 shadow-2xs flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Landmark className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-blue-100">
                <Wallet className="w-4 h-4" />
                <span className="text-[11px] font-bold uppercase tracking-wider">Tesorería Disponible</span>
              </div>
              <span className="text-[10px] bg-white/20 text-white font-black px-1.5 py-0.5 rounded backdrop-blur-xs">
                Saldo Real
              </span>
            </div>
            <p className="text-xl sm:text-2xl font-black text-white">{formatGuaranies(tesoreriaDisponible)}</p>
            <p className="text-[10px] text-blue-100 mt-1 font-medium">
              Disponibilidad inmediata en caja comunal
            </p>
          </div>
        </div>
      </div>

      {/* Top Navigation & Financial Totals */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        {/* Official Treasurer & Fiscalization Insignia Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-linear-to-r from-emerald-50 via-teal-50/50 to-white rounded-xl border border-emerald-200/70 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-emerald-900 uppercase">Responsable de Caja:</span>
            <UserBadge
              role="tesorera"
              customTitle={`Tesorera Oficial: ${settings.treasurerName}`}
              size="sm"
              withGlow={true}
            />
          </div>
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <span className="font-semibold">Transparencia & Fiscalización:</span>
            <UserBadge role="sindico" customTitle="Síndico Comunal" size="xs" />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Sub Tab Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl max-w-md">
            <button
              onClick={() => {
                setSubTab('contributions');
                setSelectedCategory('ALL');
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                subTab === 'contributions'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <DollarSign className="w-4 h-4 text-indigo-600" />
              Aportes de Residentes ({contributions.length})
            </button>
            <button
              onClick={() => {
                setSubTab('expenses');
                setSelectedCategory('ALL');
              }}
              className={`flex-1 py-2 px-4 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                subTab === 'expenses'
                  ? 'bg-white text-rose-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Receipt className="w-4 h-4 text-rose-600" />
              Gastos Comunitarios ({expenses.length})
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {canManageFinances ? (
              subTab === 'contributions' ? (
                <button
                  onClick={onOpenNewContribution}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Cobrar Aporte / Cuota
                </button>
              ) : (
                <button
                  onClick={onOpenNewExpense}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Registrar Gasto del Terreno
                </button>
              )
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Acceso Transparente Comunal
              </span>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex-1">
            <input
              type="text"
              placeholder={
                subTab === 'contributions'
                  ? 'Buscar aporte por nombre, C.I., manzana, lote o recibo...'
                  : 'Buscar gasto por título, proveedor o comprobante...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white text-xs"
              >
                <option value="ALL">Todas las Categorías</option>
                <option value="luz">💡 Luz Eléctrica / Medidor</option>
                <option value="agua">💧 Agua / Cisterna</option>
                <option value="mantenimiento">🔨 Mantenimiento</option>
                <option value="administrativo">📑 Administrativo</option>
                {subTab === 'expenses' && <option value="caminos">🚜 Caminos y Ripio</option>}
                {subTab === 'expenses' && <option value="legal">⚖️ Legal y Topógrafo</option>}
                <option value="seguridad">🛡️ Seguridad</option>
              </select>
            </div>

            {subTab === 'contributions' && (
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="py-1.5 px-2.5 border border-slate-300 rounded-lg bg-white text-xs font-medium"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="paid">✅ Pagados</option>
                <option value="pending">🚨 Pendientes / Deudas</option>
                <option value="partial">⚠️ Abono Parcial</option>
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Mini Banner: Mass Debt Notification for Pending Contributions */}
      {subTab === 'contributions' && debtorsList.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-200/80 rounded-lg text-amber-900 font-bold">
              {debtorsList.length}
            </div>
            <div>
              <h4 className="font-bold text-amber-950 text-xs sm:text-sm">
                Residentes con Cuotas Pendientes de Luz / Agua / Terreno
              </h4>
              <p className="text-amber-800 text-xs">
                Total acumulado en mora:{' '}
                <strong>
                  {formatGuaranies(totalContributionsPending)}
                </strong>
                . Envíe recordatorios automáticos individualmente o por WhatsApp.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-amber-800 font-medium">
              Notificación rápida disponible en cada fila
            </span>
          </div>
        </div>
      )}

      {/* TABLE: Contributions or Expenses */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {subTab === 'contributions' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Recibo / Fecha</th>
                  <th className="py-3 px-3.5">Residente & Ubicación</th>
                  <th className="py-3 px-3.5">Categoría & Concepto</th>
                  <th className="py-3 px-3.5">Monto Cuota</th>
                  <th className="py-3 px-3.5">Abonado</th>
                  <th className="py-3 px-3.5">Saldo Deuda</th>
                  <th className="py-3 px-3.5">Estado</th>
                  <th className="py-3 px-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContributions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      No se encontraron aportes con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredContributions.map((c) => {
                    const balance = c.amount - c.amountPaid;
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3.5">
                          <div className="font-mono font-bold text-slate-800 text-[11px]">
                            {c.receiptNumber}
                          </div>
                          <div className="text-[10px] text-slate-500">{c.date}</div>
                        </td>

                        <td className="py-2.5 px-3.5">
                          <div className="font-bold text-slate-900">{c.residentName}</div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 flex-wrap">
                            <span>
                              Mz. <strong className="text-slate-700">{c.block}</strong> - Lote{' '}
                              <strong className="text-slate-700">{c.lot}</strong>
                            </span>
                            <span>•</span>
                            <span>C.I.</span>
                            {canViewSensitiveResidentData(currentUser, { documentId: c.documentId, block: c.block, lot: c.lot } as any) ? (
                              <strong className="text-slate-700 font-mono">{c.documentId}</strong>
                            ) : (
                              <span className="font-mono text-slate-500 inline-flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5 text-slate-400" />
                                {maskDocumentId(c.documentId, false)}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2.5 px-3.5">
                          <div className="mb-1">{getCategoryBadge(c.category)}</div>
                          <div className="text-slate-800 font-medium">{c.concept}</div>
                        </td>

                        <td className="py-2.5 px-3.5 font-bold text-slate-900">
                          {formatGuaranies(c.amount)}
                        </td>

                        <td className="py-2.5 px-3.5 font-bold text-emerald-700">
                          {formatGuaranies(c.amountPaid)}
                        </td>

                        <td className="py-2.5 px-3.5 font-bold">
                          {balance > 0 ? (
                            <span className="text-rose-600">
                              {formatGuaranies(balance)}
                            </span>
                          ) : (
                            <span className="text-slate-400">Gs. 0</span>
                          )}
                        </td>

                        <td className="py-2.5 px-3.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              c.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : c.status === 'partial'
                                ? 'bg-amber-100 text-amber-800'
                                : c.amountPaid > 0
                                ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {c.status === 'paid' && <CheckCircle2 className="w-3 h-3" />}
                            {c.status === 'pending' && c.amountPaid > 0 && <Clock className="w-3 h-3 text-blue-600" />}
                            {c.status === 'pending' && c.amountPaid === 0 && <XCircle className="w-3 h-3" />}
                            {c.status === 'paid'
                              ? 'PAGADO'
                              : c.status === 'partial'
                              ? 'PARCIAL'
                              : c.amountPaid > 0
                              ? 'EN REVISIÓN'
                              : 'PENDIENTE'}
                          </span>
                        </td>

                        <td className="py-2.5 px-3.5 text-right">
                          {canManageFinances ? (
                            <div className="inline-flex items-center gap-1">
                              {c.status !== 'paid' && (
                                <button
                                  onClick={() => handleMarkAsPaid(c)}
                                  title={
                                    c.amountPaid > 0
                                      ? 'Aprobar y conciliar pago verificado en Tesorería'
                                      : 'Registrar cobro completo de este aporte'
                                  }
                                  className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-md font-semibold text-[11px] flex items-center gap-1 border border-emerald-200 transition-colors cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  {c.amountPaid > 0 ? 'Aprobar' : 'Cobrar'}
                                </button>
                              )}
                              {balance > 0 && (
                                <button
                                  onClick={() => handleNotifyDebtor(c)}
                                  title="Enviar aviso de cobranza personalizado por WhatsApp"
                                  className="p-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-md border border-green-200 transition-colors cursor-pointer"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  if (confirm('¿Eliminar este registro de aporte?')) {
                                    onDeleteContribution(c.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              ✓ Transparente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5">Fecha / Comprobante</th>
                  <th className="py-3 px-3.5">Categoría & Concepto del Gasto</th>
                  <th className="py-3 px-3.5">Proveedor / Cobrador</th>
                  <th className="py-3 px-3.5">Monto Pagado</th>
                  <th className="py-3 px-3.5">Responsable</th>
                  <th className="py-3 px-3.5 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No se encontraron gastos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-2.5 px-3.5">
                        <div className="font-bold text-slate-800">{e.date}</div>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          {e.receiptOrInvoice}
                        </span>
                      </td>

                      <td className="py-2.5 px-3.5">
                        <div className="mb-1">{getCategoryBadge(e.category)}</div>
                        <div className="font-bold text-slate-900">{e.title}</div>
                        {e.description && (
                          <div className="text-[11px] text-slate-500 mt-0.5">{e.description}</div>
                        )}
                      </td>

                      <td className="py-2.5 px-3.5 font-medium text-slate-800">
                        {e.supplierOrPayee}
                      </td>

                      <td className="py-2.5 px-3.5 font-bold text-rose-700 text-sm">
                        {formatGuaranies(e.amount)}
                      </td>

                      <td className="py-2.5 px-3.5 text-slate-600 font-medium">
                        {e.paidByTreasurer}
                      </td>

                      <td className="py-2.5 px-3.5 text-right">
                        {canManageFinances ? (
                          <button
                            onClick={() => {
                              if (confirm(`¿Eliminar gasto "${e.title}"?`)) {
                                onDeleteExpense(e.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">
                            Auditado
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals Summary Footer */}
        <div className="bg-slate-100/70 px-4 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
          {subTab === 'contributions' ? (
            <>
              <div className="flex items-center gap-4">
                <span>
                  Total Aportes Recaudados:{' '}
                  <strong className="text-emerald-700 font-bold">
                    {formatGuaranies(totalContributionsPaid)}
                  </strong>
                </span>
                <span>
                  Deudas Pendientes por Cobrar:{' '}
                  <strong className="text-rose-600 font-bold">
                    {formatGuaranies(totalContributionsPending)}
                  </strong>
                </span>
              </div>
              <span className="text-slate-500">
                Mostrando {filteredContributions.length} aportes
              </span>
            </>
          ) : (
            <>
              <div>
                <span>
                  Total Gastos Comunitarios Pagados:{' '}
                  <strong className="text-rose-700 font-bold">
                    {formatGuaranies(totalExpensesAmount)}
                  </strong>
                </span>
              </div>
              <span className="text-slate-500">
                Mostrando {filteredExpenses.length} egresos
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

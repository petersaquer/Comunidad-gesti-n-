import React, { useState, useEffect } from 'react';
import { X, DollarSign, CheckCircle2 } from 'lucide-react';
import { Resident, Contribution, ContributionCategory, PaymentStatus, CommunitySettings, UserAccount } from '../types';
import { isAdministrativeUser } from '../utils/privacyUtils';
import { ResidentSearchSelect } from './ResidentSearchSelect';
import { formatGuaranies } from '../utils/currency';
import { getParaguayCurrentMonth, getParaguayTodayISO } from '../utils/paraguayDate';

interface ContributionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (contribution: Contribution) => void;
  residents: Resident[];
  initialContribution?: Contribution | null;
  selectedResidentId?: string | null;
  settings: CommunitySettings;
  currentUser: UserAccount | null;
}

export const ContributionModal: React.FC<ContributionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  residents,
  initialContribution,
  selectedResidentId,
  settings,
  currentUser,
}) => {
  const isAdmin = isAdministrativeUser(currentUser);
  const canManageFinances = isAdmin || currentUser?.permissions?.canManageFinances;

  const currentMonth = getParaguayCurrentMonth(); // YYYY-MM
  const today = getParaguayTodayISO();

  const [formData, setFormData] = useState<Partial<Contribution>>({
    residentId: '',
    category: 'luz',
    concept: 'Aporte Luz Comunitaria - ' + currentMonth,
    amount: 50000,
    amountPaid: canManageFinances ? 50000 : 0,
    month: currentMonth,
    date: today,
    receiptNumber: canManageFinances ? `REC-${Date.now().toString().slice(-6)}` : '',
    paymentMethod: 'efectivo',
    status: canManageFinances ? 'paid' : 'pending',
    notes: '',
  });

  useEffect(() => {
    if (initialContribution) {
      setFormData(initialContribution);
    } else {
      const defaultRes = selectedResidentId
        ? residents.find((r) => r.id === selectedResidentId)
        : residents[0];
      setFormData({
        residentId: defaultRes?.id || '',
        category: 'luz',
        concept: 'Aporte Luz Comunitaria - ' + currentMonth,
        amount: 50000,
        amountPaid: canManageFinances ? 50000 : 0,
        month: currentMonth,
        date: today,
        receiptNumber: canManageFinances ? `REC-${Date.now().toString().slice(-6)}` : '',
        paymentMethod: 'efectivo',
        status: canManageFinances ? 'paid' : 'pending',
        notes: '',
      });
    }
  }, [initialContribution, selectedResidentId, isOpen, residents, currentMonth, today, canManageFinances]);

  if (!isOpen) return null;

  const handleResidentSelect = (resId: string) => {
    setFormData((prev) => ({ ...prev, residentId: resId }));
  };

  const handleCategoryChange = (cat: ContributionCategory) => {
    let conceptSuggestion = '';
    let amountSuggestion = 50000;

    if (cat === 'luz') {
      conceptSuggestion = `Aporte Luz Comunitaria / Medidor General - ${formData.month || currentMonth}`;
      amountSuggestion = 50000;
    } else if (cat === 'agua') {
      conceptSuggestion = `Cuota Cisterna / Red de Agua - ${formData.month || currentMonth}`;
      amountSuggestion = 30000;
    } else if (cat === 'mantenimiento') {
      conceptSuggestion = `Aporte Mantenimiento de Caminos y Zanjas - ${formData.month || currentMonth}`;
      amountSuggestion = 25000;
    } else if (cat === 'administrativo') {
      conceptSuggestion = `Cuota Administrativa y Personería Jurídica INDERT`;
      amountSuggestion = 40000;
    } else if (cat === 'seguridad') {
      conceptSuggestion = `Aporte Vigilancia y Portón Comunal`;
      amountSuggestion = 20000;
    } else {
      conceptSuggestion = `Aporte Extraordinario Pro-Comunidad`;
      amountSuggestion = 100000;
    }

    setFormData((prev) => ({
      ...prev,
      category: cat,
      concept: conceptSuggestion,
      amount: amountSuggestion,
      amountPaid: prev?.status === 'pending' ? 0 : amountSuggestion,
    }));
  };

  const handleAmountChange = (amount: number, paid: number) => {
    let status: PaymentStatus = 'paid';
    if (!canManageFinances) {
      status = 'pending';
    } else {
      if (paid <= 0) {
        status = 'pending';
      } else if (paid < amount) {
        status = 'partial';
      } else {
        status = 'paid';
      }
    }
    setFormData((prev) => ({ ...prev, amount, amountPaid: paid, status }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resident = residents.find((r) => r.id === formData.residentId);
    if (!resident) {
      alert('Por favor seleccione el residente u ocupante del lote.');
      return;
    }

    const contribution: Contribution = {
      id: initialContribution ? initialContribution.id : `con-${Date.now()}`,
      residentId: resident.id,
      residentName: resident.fullName,
      documentId: resident.documentId,
      block: resident.block,
      lot: resident.lot,
      category: formData.category || 'luz',
      concept: formData.concept || 'Aporte de Servicios',
      amount: Number(formData.amount) || 0,
      amountPaid: Number(formData.amountPaid) || 0,
      month: formData.month || currentMonth,
      date: formData.date || today,
      receiptNumber: formData.receiptNumber || `REC-${Date.now().toString().slice(-6)}`,
      paymentMethod: formData.paymentMethod || 'efectivo',
      status: formData.status || 'paid',
      notes: formData.notes || '',
    };

    onSave(contribution);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl sm:rounded-3xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-indigo-600 rounded-xl shrink-0">
              <DollarSign className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold truncate">
                {initialContribution ? 'Editar Aporte / Cuota' : 'Registrar Cobro de Aporte'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-300 truncate">
                Luz, agua, mantenimiento y gastos compartidos
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content - Scrollable on mobile */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs text-slate-700 overflow-y-auto flex-1">
          {/* Seleccionar y Buscar Residente con Modal */}
          <ResidentSearchSelect
            residents={residents}
            selectedResidentId={formData.residentId}
            onSelect={(res) => handleResidentSelect(res.id)}
            disabled={!canManageFinances}
            label="Residente / Ocupante del Lote"
            required={true}
            placeholder="Buscar por Nombre, Cédula (C.I.), Manzana o Lote..."
          />

          {/* Categoría de Aporte */}
          <div className="space-y-1.5">
            <label className="block font-bold text-slate-900 text-xs">Categoría de Aporte</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
              {[
                { id: 'luz', label: '💡 Luz Eléctrica' },
                { id: 'agua', label: '💧 Agua / Cisterna' },
                { id: 'mantenimiento', label: '🔨 Mantenimiento' },
                { id: 'administrativo', label: '📑 Gastos Admin.' },
                { id: 'seguridad', label: '🛡️ Seguridad' },
                { id: 'extraordinario', label: '⭐ Extraordinario' },
              ].map((cat) => (
                <button
                  type="button"
                  key={cat.id}
                  onClick={() => handleCategoryChange(cat.id as ContributionCategory)}
                  className={`py-2 px-2.5 text-xs font-bold rounded-xl border transition-all text-center cursor-pointer ${
                    formData.category === cat.id
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-900 ring-2 ring-indigo-500/20 shadow-2xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Concepto del Aporte */}
          <div>
            <label className="block font-bold text-slate-900 mb-1">Concepto Detallado *</label>
            <input
              type="text"
              required
              value={formData.concept}
              onChange={(e) => setFormData({ ...formData, concept: e.target.value })}
              placeholder="Ej: Aporte Luz Comunitaria - 2026-09"
              className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none transition-all"
            />
          </div>

          {/* Montos y Estado de Pago */}
          <div className="bg-slate-50/80 p-3 sm:p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1 text-[11px] sm:text-xs">
                  Monto Cuota (Gs.) *
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  required
                  value={formData.amount}
                  onChange={(e) =>
                    handleAmountChange(Math.round(parseFloat(e.target.value) || 0), formData.amountPaid || 0)
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
                />
                <span className="text-[11px] font-bold text-slate-500 mt-1 block">
                  {formatGuaranies(formData.amount)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1 text-[11px] sm:text-xs">
                  Monto Pagado (Gs.) *
                </label>
                <input
                  type="number"
                  step="1000"
                  min="0"
                  required
                  value={formData.amountPaid}
                  onChange={(e) =>
                    handleAmountChange(formData.amount || 0, Math.round(parseFloat(e.target.value) || 0))
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-bold text-emerald-700 bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 outline-none"
                />
                <span className="text-[11px] font-bold text-emerald-700 mt-1 block">
                  {formatGuaranies(formData.amountPaid)}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1 text-[11px] sm:text-xs">
                  Estado de Pago
                </label>
                <div
                  className={`py-2 px-3 rounded-xl text-xs font-black text-center border flex items-center justify-center min-h-[38px] ${
                    !canManageFinances
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : formData.status === 'paid'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : formData.status === 'partial'
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}
                >
                  {!canManageFinances
                    ? 'EN REVISIÓN'
                    : formData.status === 'paid'
                    ? 'COMPLETO'
                    : formData.status === 'partial'
                    ? 'ABONO PARCIAL'
                    : 'PENDIENTE / DEUDA'}
                </div>
              </div>
            </div>
          </div>

          {/* Datos del Recibo y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-800 mb-1 text-[11px] sm:text-xs">
                N° Recibo / Comprobante
              </label>
              <input
                type="text"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono uppercase bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 text-[11px] sm:text-xs">
                Mes que Corresponde
              </label>
              <input
                type="month"
                value={formData.month}
                onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1 text-[11px] sm:text-xs">
                Método de Cobro
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    paymentMethod: e.target.value as 'efectivo' | 'transferencia' | 'movil',
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none cursor-pointer"
              >
                <option value="efectivo">Efectivo en Caja</option>
                <option value="transferencia">Transferencia Bancaria</option>
                <option value="movil">Giro / Billetera Móvil</option>
              </select>
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block font-bold text-slate-800 mb-1 text-[11px] sm:text-xs">
              Observaciones del Pago o Compromiso
            </label>
            <input
              type="text"
              placeholder="Ej: Saldo pendiente se cancela este viernes en tesorería."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 outline-none"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{canManageFinances ? 'Guardar Aporte' : 'Enviar Comprobante'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

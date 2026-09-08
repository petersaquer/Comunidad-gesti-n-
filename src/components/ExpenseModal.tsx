import React, { useState, useEffect } from 'react';
import { X, Receipt, CheckCircle2 } from 'lucide-react';
import { Expense, ExpenseCategory, CommunitySettings } from '../types';

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Expense) => void;
  initialExpense?: Expense | null;
  settings: CommunitySettings;
}

export const ExpenseModal: React.FC<ExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialExpense,
  settings,
}) => {
  const currentMonth = new Date().toISOString().substring(0, 7);
  const today = new Date().toISOString().split('T')[0];

  const [formData, setFormData] = useState<Partial<Expense>>({
    category: 'luz',
    title: '',
    description: '',
    amount: 150000,
    date: today,
    month: currentMonth,
    supplierOrPayee: '',
    receiptOrInvoice: `FAC-${Date.now().toString().slice(-5)}`,
    status: 'paid',
    paidByTreasurer: settings.treasurerName,
  });

  useEffect(() => {
    if (initialExpense) {
      setFormData(initialExpense);
    } else {
      setFormData({
        category: 'luz',
        title: '',
        description: '',
        amount: 150000,
        date: today,
        month: currentMonth,
        supplierOrPayee: '',
        receiptOrInvoice: `FAC-${Date.now().toString().slice(-5)}`,
        status: 'paid',
        paidByTreasurer: settings.treasurerName,
      });
    }
  }, [initialExpense, isOpen, today, currentMonth, settings.treasurerName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      alert('Por favor complete el título y monto del gasto.');
      return;
    }

    const expense: Expense = {
      id: initialExpense ? initialExpense.id : `exp-${Date.now()}`,
      category: formData.category || 'luz',
      title: formData.title || '',
      description: formData.description || '',
      amount: Number(formData.amount) || 0,
      date: formData.date || today,
      month: formData.month || currentMonth,
      supplierOrPayee: formData.supplierOrPayee || 'Comité Vecinal',
      receiptOrInvoice: formData.receiptOrInvoice || 'S/N',
      status: formData.status || 'paid',
      paidByTreasurer: formData.paidByTreasurer || settings.treasurerName,
    };

    onSave(expense);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-700 rounded-lg">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold">
                {initialExpense ? 'Editar Gasto Comunitario' : 'Registrar Gasto del Terreno / Servicios'}
              </h3>
              <p className="text-xs text-slate-300">
                Pago de luz matriz, agua, topógrafo, caminos o mejoras
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
            <label className="block font-semibold text-slate-900 mb-1">Categoría del Gasto *</label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value as ExpenseCategory })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white font-medium focus:ring-2 focus:ring-rose-500"
            >
              <option value="luz">💡 Factura Luz / ANDE / Medidor General</option>
              <option value="agua">💧 Agua Potable / Camión Cisterna / Mangueras</option>
              <option value="caminos">🚜 Caminos / Ripio / Maquinaria / Nivelación</option>
              <option value="administrativo">📑 Trámites Legales / Personería / Papelería</option>
              <option value="legal">⚖️ Honorarios Topógrafo / Agrimensor / Abogado</option>
              <option value="seguridad">🛡️ Seguridad / Candados / Cerco Perimetral</option>
              <option value="mantenimiento">🔨 Mantenimiento de Bomba y Tanques</option>
              <option value="otro">📦 Otro Gasto Comunal</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-900 mb-1">Título del Gasto *</label>
            <input
              type="text"
              required
              placeholder="Ej: Pago Factura Medidor Comunal ANDE Mes Septiembre"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-900 mb-1">
              Descripción o Detalle de la Compra / Servicio
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre el proveedor, trabajo realizado o cantidad adquirida..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-900 mb-1">
                Monto Pagado ({settings.currencySymbol}) *
              </label>
              <input
                type="number"
                step="1000"
                min="0"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: Math.round(parseFloat(e.target.value) || 0) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-bold text-rose-700"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-900 mb-1">
                Fecha del Gasto / Pago
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-900 mb-1">
                Proveedor / Persona que Cobró
              </label>
              <input
                type="text"
                placeholder="Ej: Empresa de Electricidad, Cisterna Don Pedro"
                value={formData.supplierOrPayee}
                onChange={(e) => setFormData({ ...formData, supplierOrPayee: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-900 mb-1">
                N° de Comprobante / Factura / Boleta
              </label>
              <input
                type="text"
                placeholder="Ej: FAC-00129"
                value={formData.receiptOrInvoice}
                onChange={(e) => setFormData({ ...formData, receiptOrInvoice: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-900 mb-1">
              Responsable que Autorizó o Pagó desde Caja
            </label>
            <input
              type="text"
              value={formData.paidByTreasurer}
              onChange={(e) => setFormData({ ...formData, paidByTreasurer: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
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
              className="px-5 py-2 bg-rose-700 hover:bg-rose-600 text-white rounded-lg font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Guardar Gasto
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

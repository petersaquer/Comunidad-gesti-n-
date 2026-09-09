import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import {
  Resident,
  Contribution,
  Expense,
  MaintenanceShift,
  CommunitySettings,
  UserAccount,
} from '../types';
import { formatGuaranies } from './currency';
import { maskDocumentId, maskPhoneNumber, canViewSensitiveResidentData } from './privacyUtils';
import { formatParaguayDate, formatParaguayDateTime } from './paraguayDate';

// Export to Excel: Balance Financiero Mensual
export const exportFinancialBalanceToExcel = (
  month: string,
  contributions: Contribution[],
  expenses: Expense[],
  settings: CommunitySettings
) => {
  const monthContributions = contributions.filter((c) => c.month === month);
  const monthExpenses = expenses.filter((e) => e.month === month);

  const totalIncomes = monthContributions.filter((c) => c.status === 'paid').reduce((acc, c) => acc + c.amountPaid, 0);
  const totalIncomesUnderReview = monthContributions.filter((c) => c.status === 'pending' && c.amountPaid > 0).reduce((acc, c) => acc + c.amountPaid, 0);
  const totalExpensesPaid = monthExpenses.filter((e) => e.status === 'paid').reduce((acc, e) => acc + e.amount, 0);
  const totalExpensesPending = monthExpenses.filter((e) => e.status === 'pending').reduce((acc, e) => acc + e.amount, 0);
  const balance = totalIncomes - totalExpensesPaid;

  // Sheet 1: Resumen
  const summaryData = [
    ['REPORTE FINANCIERO MENSUAL - COMITÉ DE TERRENO'],
    ['Comunidad:', settings.communityName],
    ['Ubicación:', settings.settlementLocation],
    ['Mes reportado:', month],
    ['Generado el:', formatParaguayDateTime()],
    ['Presidente:', settings.presidentName],
    ['Tesorero/a:', settings.treasurerName],
    [''],
    ['CONCEPTO', 'MONTO (' + settings.currencySymbol + ')'],
    ['Total Aportes Recaudados Efectivos (Conciliados)', totalIncomes],
    ['Total Pagos Informados en Revisión (Por Aprobar)', totalIncomesUnderReview],
    ['Total Gastos Pagados Efectivamente', totalExpensesPaid],
    ['Total Gastos Pendientes de Pago (Comprometidos)', totalExpensesPending],
    ['Balance Neto Líquido en Caja', balance],
  ];

  // Sheet 2: Detalle de Aportes
  const contributionsData = monthContributions.map((c) => ({
    'ID Recibo': c.receiptNumber,
    Fecha: c.date,
    Residente: c.residentName,
    'C.I. / DNI': c.documentId,
    Manzana: c.block,
    Lote: c.lot,
    Categoría: c.category.toUpperCase(),
    Concepto: c.concept,
    'Monto Cuota': c.amount,
    'Monto Pagado': c.amountPaid,
    Saldo: c.amount - c.amountPaid,
    Estado: c.status === 'paid' ? 'PAGADO' : c.status === 'partial' ? 'PARCIAL' : 'PENDIENTE',
    'Método Pago': c.paymentMethod,
  }));

  // Sheet 3: Detalle de Gastos
  const expensesData = monthExpenses.map((e) => ({
    'N° Comprobante': e.receiptOrInvoice,
    Fecha: e.date,
    Categoría: e.category.toUpperCase(),
    Título: e.title,
    Descripción: e.description,
    Proveedor: e.supplierOrPayee,
    'Monto Pagado': e.amount,
    'Responsable de Pago': e.paidByTreasurer,
  }));

  const wb = XLSX.utils.book_new();

  const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Resumen Contable');

  const wsContrib = XLSX.utils.json_to_sheet(contributionsData);
  XLSX.utils.book_append_sheet(wb, wsContrib, 'Aportes Recaudados');

  const wsExp = XLSX.utils.json_to_sheet(expensesData);
  XLSX.utils.book_append_sheet(wb, wsExp, 'Gastos Realizados');

  XLSX.writeFile(wb, `Balance_Financiero_${settings.communityName.replace(/\s+/g, '_')}_${month}.xlsx`);
};

// Export to Excel: Padrón General de Residentes y Registro de Ocupación
export const exportResidentsToExcel = (
  residents: Resident[],
  contributions: Contribution[],
  settings: CommunitySettings,
  currentUser?: UserAccount | null
) => {
  const allowSensitive =
    currentUser?.role === 'admin' ||
    currentUser?.role === 'directiva' ||
    currentUser?.permissions?.canManageResidents;

  const data = residents.map((r) => {
    const canViewResident = allowSensitive || canViewSensitiveResidentData(currentUser, r);
    const residentContribs = contributions.filter((c) => c.residentId === r.id);
    const totalPaid = residentContribs.filter((c) => c.status === 'paid').reduce((acc, c) => acc + c.amountPaid, 0);
    const totalDebt = residentContribs.reduce(
      (acc, c) => acc + Math.max(0, c.amount - (c.status === 'paid' ? c.amountPaid : 0)),
      0
    );

    const record: Record<string, any> = {
      'C.I. / Documento': canViewResident ? r.documentId : maskDocumentId(r.documentId, false),
      'Nombre y Apellido': r.fullName,
      'Teléfono / Celular': canViewResident ? r.phone : maskPhoneNumber(r.phone),
      Manzana: r.block,
      Lote: r.lot,
      Sector: r.sector,
      'Fecha Ingreso': r.occupationDate,
      'Miembros Familia': r.familyMembersCount,
      'Estado Ocupación':
        r.status === 'active'
          ? 'Activo'
          : r.status === 'flagged'
          ? 'Observado / Alerta'
          : r.status === 'transferred'
          ? 'Traspasado'
          : r.status === 'evicted'
          ? 'Desalojado'
          : 'Inactivo',
      'Total Aportado': totalPaid,
      'Deuda Pendiente': totalDebt,
    };

    if (canViewResident) {
      record['Riesgo Fraude / Doble Lote'] = r.isFraudRisk ? 'SÍ (ALERTA)' : 'No';
      record['Historial en Otros Asentamientos'] = r.previousSettlementHistory;
      record['Observaciones de Fraude'] = r.fraudNotes;
      record['Notas Generales'] = r.notes || '';
    }

    return record;
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, 'Padrón de Ocupación');
  XLSX.writeFile(wb, `Padron_Residentes_${settings.communityName.replace(/\s+/g, '_')}.xlsx`);
};

// Export to PDF: Balance Financiero y Estado de Cuentas
export const exportFinancialBalanceToPDF = (
  month: string,
  contributions: Contribution[],
  expenses: Expense[],
  settings: CommunitySettings
) => {
  const doc = new jsPDF();
  const monthContributions = contributions.filter((c) => c.month === month);
  const monthExpenses = expenses.filter((e) => e.month === month);

  const totalIncomes = monthContributions.filter((c) => c.status === 'paid').reduce((acc, c) => acc + c.amountPaid, 0);
  const totalUnderReview = monthContributions.filter((c) => c.status === 'pending' && c.amountPaid > 0).reduce((acc, c) => acc + c.amountPaid, 0);
  const totalExpensesPaid = monthExpenses.filter((e) => e.status === 'paid').reduce((acc, e) => acc + e.amount, 0);
  const totalExpensesPending = monthExpenses.filter((e) => e.status === 'pending').reduce((acc, e) => acc + e.amount, 0);
  const balance = totalIncomes - totalExpensesPaid;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings.communityName, 14, 20);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ubicación: ${settings.settlementLocation}`, 14, 26);
  doc.text(`Balance Financiero Oficial - Período: ${month}`, 14, 32);
  doc.text(`Fecha de Emisión: ${formatParaguayDate()}`, 14, 38);

  // Line divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 42, 196, 42);

  // Summary box
  doc.setFillColor(245, 247, 250);
  doc.rect(14, 46, 182, 36, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Total Recaudado Efectivo (Conciliado): ${formatGuaranies(totalIncomes)}`, 20, 53);
  doc.text(`Total Pagos en Revisión por Tesorería: ${formatGuaranies(totalUnderReview)}`, 20, 59);
  doc.text(`Total Gastos Pagados Efectivamente: ${formatGuaranies(totalExpensesPaid)} (Pendientes: ${formatGuaranies(totalExpensesPending)})`, 20, 65);

  doc.setTextColor(balance >= 0 ? 22 : 180, balance >= 0 ? 101 : 40, balance >= 0 ? 52 : 40);
  doc.text(`Saldo Líquido en Caja: ${formatGuaranies(balance)}`, 20, 73);
  doc.setTextColor(0, 0, 0);

  let currentY = 88;

  // Section 1: Desglose Gastos
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('1. Gastos Comunitarios del Mes (Luz, Agua, Obras, Admin)', 14, currentY);
  currentY += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Concepto / Proveedor', 14, currentY);
  doc.text('Categoría', 105, currentY);
  doc.text('Comprobante', 140, currentY);
  doc.text('Monto', 180, currentY);
  currentY += 4;
  doc.line(14, currentY, 196, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  monthExpenses.slice(0, 10).forEach((exp) => {
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }
    doc.text(exp.title.substring(0, 48), 14, currentY);
    doc.text(exp.category.toUpperCase(), 105, currentY);
    doc.text(exp.receiptOrInvoice.substring(0, 15), 140, currentY);
    doc.text(`${formatGuaranies(exp.amount)}`, 175, currentY);
    currentY += 6;
  });

  currentY += 6;

  // Section 2: Resumen de Aportes de Residentes
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('2. Aportes de Residentes (Luz, Agua, Cuotas)', 14, currentY);
  currentY += 6;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('Residente / Lote', 14, currentY);
  doc.text('Concepto', 90, currentY);
  doc.text('Estado', 150, currentY);
  doc.text('Pagado', 180, currentY);
  currentY += 4;
  doc.line(14, currentY, 196, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  monthContributions.slice(0, 12).forEach((c) => {
    if (currentY > 260) {
      doc.addPage();
      currentY = 20;
    }
    doc.text(`${c.residentName.substring(0, 30)} (Mz ${c.block}-L${c.lot})`, 14, currentY);
    doc.text(c.concept.substring(0, 28), 90, currentY);
    doc.text(c.status === 'paid' ? 'PAGADO' : c.status === 'partial' ? 'PARCIAL' : 'PENDIENTE', 150, currentY);
    doc.text(`${formatGuaranies(c.amountPaid)}`, 175, currentY);
    currentY += 6;
  });

  // Signatures
  if (currentY > 230) {
    doc.addPage();
    currentY = 40;
  } else {
    currentY = Math.max(currentY + 20, 240);
  }

  doc.setDrawColor(150, 150, 150);
  doc.line(30, currentY, 90, currentY);
  doc.line(120, currentY, 180, currentY);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.presidentName, 40, currentY + 5);
  doc.text('Presidente de la Comunidad', 35, currentY + 10);

  doc.text(settings.treasurerName, 130, currentY + 5);
  doc.text('Tesorero/a Comunal', 135, currentY + 10);

  doc.save(`Balance_Oficial_${month}_${settings.communityName.replace(/\s+/g, '_')}.pdf`);
};

// Export Individual Resident Account Statement to PDF
export const exportResidentAccountStatementToPDF = (
  resident: Resident,
  contributions: Contribution[],
  shifts: MaintenanceShift[],
  settings: CommunitySettings
) => {
  const doc = new jsPDF();
  const residentContribs = contributions.filter((c) => c.residentId === resident.id);
  const residentShifts = shifts.filter((s) => s.assignedResidentId === resident.id);

  const totalPaid = residentContribs.reduce((acc, c) => acc + c.amountPaid, 0);
  const totalDebt = residentContribs.reduce((acc, c) => acc + (c.amount - c.amountPaid), 0);

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(settings.communityName, 14, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ESTADO DE CUENTA Y CONSTANCIA DE OCUPACIÓN', 14, 25);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha de emisión: ${formatParaguayDate()}`, 14, 31);

  doc.line(14, 34, 196, 34);

  // Resident Info Box
  doc.setFillColor(248, 249, 250);
  doc.rect(14, 37, 182, 38, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Residente: ${resident.fullName}`, 18, 44);
  doc.text(`Documento (C.I. / DNI): ${resident.documentId}`, 18, 51);
  doc.text(`Ubicación de Lote: Manzana ${resident.block}, Lote ${resident.lot} (${resident.sector})`, 18, 58);
  doc.text(`Fecha de Ocupación Registrada: ${resident.occupationDate}`, 18, 65);

  doc.text(`Teléfono: ${resident.phone}`, 120, 44);
  doc.text(`Miembros Familiares: ${resident.familyMembersCount}`, 120, 51);
  doc.text(
    `Estado de Ocupación: ${
      resident.status === 'active'
        ? 'ACTIVO Y RECONOCIDO'
        : resident.status === 'flagged'
        ? 'OBSERVADO / ALERTA'
        : resident.status.toUpperCase()
    }`,
    120,
    58
  );

  let currentY = 82;

  // Financial summary
  doc.setFont('helvetica', 'bold');
  doc.text(`Resumen Financiero Individual:`, 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Aportado: ${formatGuaranies(totalPaid)}`, 80, currentY);

  doc.setTextColor(totalDebt > 0 ? 180 : 20, totalDebt > 0 ? 30 : 120, totalDebt > 0 ? 30 : 40);
  doc.text(`Deuda Pendiente: ${formatGuaranies(totalDebt)}`, 140, currentY);
  doc.setTextColor(0, 0, 0);

  currentY += 8;

  // Table of Contributions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Historial de Aportes y Cuotas Comunitarias (Luz / Agua / Mantenimiento)', 14, currentY);
  currentY += 6;

  doc.setFontSize(8.5);
  doc.text('Fecha', 14, currentY);
  doc.text('Concepto', 36, currentY);
  doc.text('Categoría', 105, currentY);
  doc.text('Recibo', 135, currentY);
  doc.text('Monto', 160, currentY);
  doc.text('Estado', 178, currentY);
  currentY += 3;
  doc.line(14, currentY, 196, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  if (residentContribs.length === 0) {
    doc.text('No registra aportes en el sistema.', 14, currentY);
    currentY += 6;
  } else {
    residentContribs.forEach((c) => {
      if (currentY > 260) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(c.date, 14, currentY);
      doc.text(c.concept.substring(0, 36), 36, currentY);
      doc.text(c.category.toUpperCase(), 105, currentY);
      doc.text(c.receiptNumber, 135, currentY);
      doc.text(`${formatGuaranies(c.amountPaid)}`, 160, currentY);
      doc.text(c.status === 'paid' ? 'PAGADO' : c.status === 'partial' ? 'PARCIAL' : 'PENDIENTE', 178, currentY);
      currentY += 6;
    });
  }

  currentY += 6;

  // Maintenance Shifts section
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Historial de Turnos de Mantenimiento y Faenas', 14, currentY);
  currentY += 6;

  doc.setFontSize(8.5);
  doc.text('Fecha', 14, currentY);
  doc.text('Tarea de Mantenimiento', 36, currentY);
  doc.text('Horario', 110, currentY);
  doc.text('Estado Asistencia', 150, currentY);
  currentY += 3;
  doc.line(14, currentY, 196, currentY);
  currentY += 5;

  doc.setFont('helvetica', 'normal');
  if (residentShifts.length === 0) {
    doc.text('No registra asignación de turnos aún.', 14, currentY);
    currentY += 6;
  } else {
    residentShifts.forEach((s) => {
      if (currentY > 260) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(s.dateScheduled, 14, currentY);
      doc.text(s.taskTitle.substring(0, 38), 36, currentY);
      doc.text(s.timeSlot, 110, currentY);
      doc.text(
        s.status === 'completed'
          ? 'CUMPLIDO'
          : s.status === 'scheduled'
          ? 'PROGRAMADO'
          : s.status === 'absent'
          ? 'AUSENTE / FALTA'
          : s.status.toUpperCase(),
        150,
        currentY
      );
      currentY += 6;
    });
  }

  // Anti-fraud notes
  if (resident.isFraudRisk || resident.previousSettlementHistory) {
    currentY += 6;
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.text('Antecedentes de Ocupación y Notas de Control:', 14, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(resident.previousSettlementHistory, 14, currentY, { maxWidth: 180 });
  }

  // Signature
  currentY = Math.max(currentY + 25, 250);
  if (currentY > 270) {
    doc.addPage();
    currentY = 50;
  }
  doc.line(70, currentY, 140, currentY);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Firma y Sello de la Comisión de Terreno`, 76, currentY + 5);

  doc.save(`Estado_Cuenta_${resident.fullName.replace(/\s+/g, '_')}_Mz${resident.block}_Lote${resident.lot}.pdf`);
};

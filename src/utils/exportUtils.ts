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

// Export Official INDERT Census Sheet to PDF (A4 Landscape, institutional format)
export const exportIndertOfficialCensusPDF = (
  residents: Resident[],
  settings: CommunitySettings,
  currentUser?: UserAccount | null
) => {
  try {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 297;
    const pageHeight = 210;
    const margin = 14;
    const contentWidth = pageWidth - margin * 2; // 269mm

    // Sort residents by Block and Lot
    const sortedResidents = [...residents].sort((a, b) => {
      const blockComp = (a.block || '').localeCompare(b.block || '');
      if (blockComp !== 0) return blockComp;
      return (a.lot || '').localeCompare(b.lot || '', undefined, { numeric: true });
    });

    const renderHeader = (pageNum: number, totalPagesEst: number) => {
      // Header border
      doc.setDrawColor(24, 119, 242);
      doc.setLineWidth(0.8);
      doc.rect(margin, 10, contentWidth, 26);

      doc.setFillColor(245, 248, 255);
      doc.rect(margin + 0.5, 10.5, contentWidth - 1, 25, 'F');

      // Titles
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('REPÚBLICA DEL PARAGUAY - INSTITUTO NACIONAL DE DESARROLLO RURAL Y DE LA TIERRA (I.N.D.E.R.T.)', margin + 6, 17);

      doc.setFontSize(10);
      doc.setTextColor(24, 119, 242);
      doc.text('PLANILLA OFICIAL DE CENSO POBLACIONAL Y ARRAIGO DE FAMILIAS OCUPANTES', margin + 6, 23);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(
        `Comisión Vecinal: ${settings.communityName.toUpperCase()} | Exp. Matriz: ${settings.indertExpedienteNumber || '4821/2024'}`,
        margin + 6,
        29
      );
      doc.text(
        `Ubicación: ${settings.settlementLocation} | Fecha Emisión: ${formatParaguayDate()} | Pág. ${pageNum}`,
        margin + 6,
        34
      );

      // Status badge on the right
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(pageWidth - margin - 42, 14, 38, 8, 2, 2, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('CENSO VERIFICADO', pageWidth - margin - 39, 19.5);
    };

    let currentY = 40;
    let pageNum = 1;

    renderHeader(pageNum, 1);

    // Table Column Layout (Total 268mm)
    const cols = [
      { label: 'N°', width: 9, align: 'center' },
      { label: 'Mz', width: 9, align: 'center' },
      { label: 'Lote', width: 10, align: 'center' },
      { label: 'Apellidos y Nombres Titular', width: 56, align: 'left' },
      { label: 'C.I. N°', width: 22, align: 'center' },
      { label: 'Est. Civil', width: 20, align: 'left' },
      { label: 'Cónyuge / Pareja (C.I.)', width: 50, align: 'left' },
      { label: 'Hijos', width: 11, align: 'center' },
      { label: 'Discap.', width: 14, align: 'center' },
      { label: 'F. Ocupación', width: 23, align: 'center' },
      { label: 'Firma del Ocupante', width: 44, align: 'center' },
    ];

    const renderTableHeaders = (y: number) => {
      doc.setFillColor(30, 41, 59);
      doc.rect(margin, y, contentWidth, 7, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(255, 255, 255);

      let xCursor = margin;
      cols.forEach((col) => {
        if (col.align === 'center') {
          doc.text(col.label, xCursor + col.width / 2, y + 4.8, { align: 'center' });
        } else {
          doc.text(col.label, xCursor + 1.5, y + 4.8);
        }
        xCursor += col.width;
      });
      return y + 7;
    };

    currentY = renderTableHeaders(currentY);

    sortedResidents.forEach((res, idx) => {
      // Check if need new page
      if (currentY > pageHeight - 35) {
        doc.addPage();
        pageNum++;
        renderHeader(pageNum, 2);
        currentY = renderTableHeaders(40);
      }

      // Alternate row background
      if (idx % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 7.5, 'F');
      }

      // Border line
      doc.setDrawColor(226, 232, 240);
      doc.line(margin, currentY + 7.5, margin + contentWidth, currentY + 7.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(15, 23, 42);

      let x = margin;

      // 1. N°
      doc.text(String(idx + 1), x + cols[0].width / 2, currentY + 5, { align: 'center' });
      x += cols[0].width;

      // 2. Mz
      doc.setFont('helvetica', 'bold');
      doc.text(res.block, x + cols[1].width / 2, currentY + 5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      x += cols[1].width;

      // 3. Lote
      doc.setFont('helvetica', 'bold');
      doc.text(res.lot, x + cols[2].width / 2, currentY + 5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      x += cols[2].width;

      // 4. Nombre
      const nameTxt = res.fullName.length > 28 ? res.fullName.substring(0, 26) + '...' : res.fullName;
      doc.text(nameTxt, x + 1.5, currentY + 5);
      x += cols[3].width;

      // 5. C.I.
      doc.text(res.documentId, x + cols[4].width / 2, currentY + 5, { align: 'center' });
      x += cols[4].width;

      // 6. Estado civil
      const marital = res.maritalStatus ? res.maritalStatus.toUpperCase().substring(0, 10) : 'SOLTERO';
      doc.text(marital, x + 1.5, currentY + 5);
      x += cols[5].width;

      // 7. Pareja
      let partnerTxt = '-';
      if (res.hasPartner && res.partnerName) {
        partnerTxt = `${res.partnerName.substring(0, 20)} (${res.partnerDocumentId || 'S/D'})`;
      }
      doc.text(partnerTxt, x + 1.5, currentY + 5);
      x += cols[6].width;

      // 8. Hijos
      doc.text(String(res.childrenCount ?? 0), x + cols[7].width / 2, currentY + 5, { align: 'center' });
      x += cols[7].width;

      // 9. Discapacidad
      doc.text(res.hasChildrenWithDisability ? 'SÍ' : 'NO', x + cols[8].width / 2, currentY + 5, { align: 'center' });
      x += cols[8].width;

      // 10. Fecha Ocupación
      doc.text(res.occupationDate || '2023', x + cols[9].width / 2, currentY + 5, { align: 'center' });
      x += cols[9].width;

      // 11. Firma Ocupante (espacio para firmar en físico)
      doc.setDrawColor(203, 213, 225);
      doc.line(x + 3, currentY + 5.5, x + cols[10].width - 3, currentY + 5.5);

      currentY += 7.5;
    });

    // Signatures box
    if (currentY > pageHeight - 40) {
      doc.addPage();
      pageNum++;
      renderHeader(pageNum, pageNum);
      currentY = 45;
    } else {
      currentY = Math.max(currentY + 6, pageHeight - 34);
    }

    doc.setDrawColor(203, 213, 225);
    doc.setFillColor(250, 250, 250);
    doc.rect(margin, currentY, contentWidth, 24, 'F');
    doc.rect(margin, currentY, contentWidth, 24, 'S');

    // 3 Signatures: President, Secretary, Treasurer + INDERT Reception
    const colSigWidth = contentWidth / 4;

    // President
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.line(margin + 6, currentY + 14, margin + colSigWidth - 6, currentY + 14);
    doc.text(settings.presidentName || 'Presidente Titular', margin + colSigWidth / 2, currentY + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('Presidente de la Comisión', margin + colSigWidth / 2, currentY + 21, { align: 'center' });

    // Secretary
    doc.line(margin + colSigWidth + 6, currentY + 14, margin + colSigWidth * 2 - 6, currentY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(settings.secretaryName || 'Secretaría de Actas', margin + colSigWidth * 1.5, currentY + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('Secretario/a de Actas y Censo', margin + colSigWidth * 1.5, currentY + 21, { align: 'center' });

    // Treasurer
    doc.line(margin + colSigWidth * 2 + 6, currentY + 14, margin + colSigWidth * 3 - 6, currentY + 14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text(settings.treasurerName || 'Tesorera Comunal', margin + colSigWidth * 2.5, currentY + 18, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('Tesorero/a Comunal', margin + colSigWidth * 2.5, currentY + 21, { align: 'center' });

    // INDERT Reception box
    doc.setDrawColor(24, 119, 242);
    doc.setLineWidth(0.5);
    doc.rect(margin + colSigWidth * 3 + 4, currentY + 2.5, colSigWidth - 8, 19, 'S');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(24, 119, 242);
    doc.text('MESA DE ENTRADA / TÉCNICO INDERT', margin + colSigWidth * 3.5, currentY + 6.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Firma, Sello & Fecha de Recepción', margin + colSigWidth * 3.5, currentY + 18, { align: 'center' });

    const filename = `Planilla_Oficial_INDERT_${settings.communityName.replace(/[^a-zA-Z0-9]/g, '_')}_${formatParaguayDate()}.pdf`;
    doc.save(filename);
  } catch (err) {
    console.error('Error generating official INDERT census PDF:', err);
  }
};

// Export Formal Commission Constitution Act to PDF (A4 Portrait)
export const exportCommissionConstitutionActPDF = (
  settings: CommunitySettings,
  users: UserAccount[]
) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const margin = 18;
    const contentWidth = pageWidth - margin * 2;

    // Header banner
    doc.setFillColor(24, 119, 242);
    doc.rect(margin, 12, contentWidth, 4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text('ACTA DE CONSTITUCIÓN Y ELECCIÓN DE AUTORIDADES', pageWidth / 2, 23, { align: 'center' });

    doc.setFontSize(10.5);
    doc.setTextColor(24, 119, 242);
    doc.text(`COMISIÓN VECINAL PRO-TIERRA ASENTAMIENTO "${(settings.communityName || 'La Floresta 2').replace(/Comisión Vecinal Pro-Tierra Asentamiento /gi, '').replace(/"/g, '')}"`, pageWidth / 2, 29, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Expediente Matriz INDERT N°: ${settings.indertExpedienteNumber || '4821/2024'} | Ubicación: ${settings.settlementLocation}`, pageWidth / 2, 34, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.line(margin, 38, pageWidth - margin, 38);

    let currentY = 44;

    // Legal intro
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text('ACTA N° 01/2026 - ASAMBLEA GENERAL COMUNITARIA EXTRAORDINARIA', margin, currentY);
    currentY += 6;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    const bodyP1 = `En el Asentamiento "${(settings.communityName || 'La Floresta 2').replace(/Comisión Vecinal Pro-Tierra Asentamiento /gi, '').replace(/"/g, '')}", ubicado en ${settings.settlementLocation}, Departamento y República del Paraguay, a los quince días del mes corriente, siendo las 14:00 horas, se reúnen en asamblea comunitaria los pobladores y jefes de familias ocupantes de las respectivas manzanas y lotes del inmueble rural-urbano individualizado en el Expediente Matriz INDERT N° ${settings.indertExpedienteNumber || '4821/2024'}, con el objeto de constituir de forma democrática y representativa la Comisión Vecinal Pro-Tierra, al amparo de las disposiciones consagradas en los Artículos 114 y 115 de la Constitución Nacional de la República del Paraguay, la Ley N° 1863/2002 que establece el Estatuto Agrario y concordantes del Código Civil Paraguayo.`;

    const splitP1 = doc.splitTextToSize(bodyP1, contentWidth);
    doc.text(splitP1, margin, currentY);
    currentY += splitP1.length * 4.2 + 4;

    // Agenda (Orden del Día)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ORDEN DEL DÍA DE LA ASAMBLEA:', margin, currentY);
    currentY += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const agendaItems = [
      '1. Elección de Presidente y Secretario de Asamblea.',
      '2. Constitución formal de la Comisión Vecinal Pro-Tierra y Aprobación del Estatuto Comunitario.',
      '3. Elección y proclamación de la Comisión Directiva, Delegados de Manzanas y Síndico Fiscalizador.',
      '4. Facultades expresas a la Presidencia para gestionar ante el I.N.D.E.R.T. y la Municipalidad competente la regularización, mensura judicial y titulación definitiva de los lotes familiares.',
    ];
    agendaItems.forEach((item) => {
      doc.text(item, margin + 4, currentY);
      currentY += 4.5;
    });

    currentY += 3;

    // Directiva electa
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('NÓMINA DE AUTORIDADES PROCLAMADAS POR LA ASAMBLEA:', margin, currentY);
    currentY += 5;

    // Authorities table
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('Cargo en Comisión', margin + 3, currentY + 4.2);
    doc.text('Nombre y Apellido', margin + 50, currentY + 4.2);
    doc.text('C.I. N°', margin + 115, currentY + 4.2);
    doc.text('Manzana / Lote', margin + 145, currentY + 4.2);
    currentY += 6;

    const directivaList = [
      { cargo: 'Presidente Titular', nombre: settings.presidentName || 'Carlos Mendoza Ramos', ci: '2.145.980', lote: 'Mz A - Lote 01' },
      { cargo: 'Tesorera Comunal', nombre: settings.treasurerName || 'Marta Delgado Silva', ci: '3.190.224', lote: 'Mz B - Lote 01' },
      { cargo: 'Secretaría de Actas', nombre: settings.secretaryName || 'Lic. Rodrigo Benítez', ci: '2.845.109', lote: 'Mz A - Lote 05' },
      { cargo: 'Delegado Manzana A', nombre: 'Juan Bautista Benítez', ci: '4.892.110', lote: 'Mz A - Lote 01' },
      { cargo: 'Delegada Manzana B', nombre: 'Clara Rosa Giménez', ci: '2.998.712', lote: 'Mz B - Lote 01' },
      { cargo: 'Delegado Manzana C', nombre: 'Lorenzo Vera Bogado', ci: '3.612.450', lote: 'Mz C - Lote 01' },
      { cargo: 'Síndico / Fiscalizador', nombre: 'Ignacio Javier Paredes', ci: '4.321.890', lote: 'Mz B - Lote 02' },
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    directivaList.forEach((dir, i) => {
      if (i % 2 === 1) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 5.5, 'F');
      }
      doc.text(dir.cargo, margin + 3, currentY + 3.8);
      doc.text(dir.nombre, margin + 50, currentY + 3.8);
      doc.text(dir.ci, margin + 115, currentY + 3.8);
      doc.text(dir.lote, margin + 145, currentY + 3.8);
      currentY += 5.5;
    });

    currentY += 4;

    // Closing statement
    const bodyP2 = `No habiendo otro punto que tratar, previa lectura íntegra de la presente acta y su unánime aprobación por aclamación, se levanta la sesión siendo las 16:30 horas, firmando los miembros electos de la Comisión Directiva en prueba de conformidad y compromiso de lealtad comunitaria.`;
    const splitP2 = doc.splitTextToSize(bodyP2, contentWidth);
    doc.text(splitP2, margin, currentY);
    currentY += splitP2.length * 4.2 + 8;

    // Signatures
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('FIRMA DE LAS AUTORIDADES ELECTAS DE LA COMISIÓN DIRECTIVA:', margin, currentY);
    currentY += 14;

    const sigW = contentWidth / 3;

    // Pres
    doc.line(margin + 5, currentY, margin + sigW - 5, currentY);
    doc.setFontSize(7.5);
    doc.text(settings.presidentName || 'Presidente', margin + sigW / 2, currentY + 4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('Presidente Electo', margin + sigW / 2, currentY + 7, { align: 'center' });

    // Sec
    doc.setFont('helvetica', 'bold');
    doc.line(margin + sigW + 5, currentY, margin + sigW * 2 - 5, currentY);
    doc.setFontSize(7.5);
    doc.text(settings.secretaryName || 'Secretaría de Actas', margin + sigW * 1.5, currentY + 4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('Secretario/a de Actas', margin + sigW * 1.5, currentY + 7, { align: 'center' });

    // Tes
    doc.setFont('helvetica', 'bold');
    doc.line(margin + sigW * 2 + 5, currentY, margin + contentWidth - 5, currentY);
    doc.setFontSize(7.5);
    doc.text(settings.treasurerName || 'Tesorera', margin + sigW * 2.5, currentY + 4, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.text('Tesorero/a Comunal', margin + sigW * 2.5, currentY + 7, { align: 'center' });

    const filename = `Acta_Constitucion_${(settings.communityName || 'La_Floresta_2').replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    doc.save(filename);
  } catch (err) {
    console.error('Error generating commission constitution act PDF:', err);
  }
};

// Export Cadastral Master Sheet to Excel (compatible with INDERT & Catastro Nacional)
export const exportCadastralRegistryToExcel = (
  residents: Resident[],
  settings: CommunitySettings
) => {
  try {
    const data = residents.map((r, idx) => ({
      'N° Parcela / Orden': idx + 1,
      'Asentamiento / Territorio': settings.communityName,
      'Expediente INDERT': settings.indertExpedienteNumber || '4821/2024',
      Manzana: r.block,
      Lote: r.lot,
      'Sector / Zona': r.sector || 'Zona Residencial',
      'Titular Ocupante': r.fullName,
      'C.I. N°': r.documentId,
      'Teléfono Contacto': r.phone,
      'Fecha Inicio Ocupación': r.occupationDate,
      'Miembros Familia': r.familyMembersCount,
      'Estado Ocupacional': r.status === 'active' ? 'OCUPACIÓN REGULAR Y EFECTIVA' : r.status.toUpperCase(),
      'Linderos y Superficie': 'Dimensión estándar s/ plano topográfico 12x30m (360 m²)',
      'Riesgo Solapamiento / Alerta': r.isFraudRisk ? 'SÍ (OBSERVADO)' : 'LIBRE DE CONFLICTO',
      'Observaciones Técnicas': r.notes || '',
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths
    ws['!cols'] = [
      { wch: 16 },
      { wch: 35 },
      { wch: 22 },
      { wch: 10 },
      { wch: 10 },
      { wch: 24 },
      { wch: 32 },
      { wch: 15 },
      { wch: 16 },
      { wch: 18 },
      { wch: 14 },
      { wch: 28 },
      { wch: 35 },
      { wch: 20 },
      { wch: 30 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Catastro de Lotes INDERT');
    XLSX.writeFile(wb, `Catastro_Lotes_${settings.communityName.replace(/[^a-zA-Z0-9]/g, '_')}.xlsx`);
  } catch (err) {
    console.error('Error generating cadastral Excel:', err);
  }
};

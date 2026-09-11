import { jsPDF } from 'jspdf';
import { Contribution, Expense, CommunitySettings, Resident } from '../types';
import { formatGuaranies } from './currency';
import { formatParaguayDate, formatParaguayDateTime } from './paraguayDate';

export interface MonthlyBalancePdfData {
  month: string;
  contributions: Contribution[];
  expenses: Expense[];
  residents?: Resident[];
  settings: CommunitySettings;
}

export const generateMonthlyBalancePDF = ({
  month,
  contributions,
  expenses,
  settings,
}: MonthlyBalancePdfData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Filter items for the target month
  const monthContributions = contributions.filter((c) => c.month === month);
  const monthExpenses = expenses.filter((e) => e.month === month);

  // Financial totals
  const totalIncomes = monthContributions
    .filter((c) => c.status === 'paid' || c.amountPaid > 0)
    .reduce((acc, c) => acc + (c.amountPaid || 0), 0);

  const totalExpected = monthContributions.reduce((acc, c) => acc + (c.amount || 0), 0);
  const totalDebts = Math.max(0, totalExpected - totalIncomes);
  const totalSpent = monthExpenses.reduce((acc, e) => acc + (e.amount || 0), 0);
  const netBalance = totalIncomes - totalSpent;

  // Breakdown of Incomes by Category
  const incomeCategoryStats: Record<string, { total: number; count: number }> = {};
  monthContributions.forEach((c) => {
    const cat = c.category || 'general';
    if (!incomeCategoryStats[cat]) {
      incomeCategoryStats[cat] = { total: 0, count: 0 };
    }
    if (c.amountPaid > 0) {
      incomeCategoryStats[cat].total += c.amountPaid;
      incomeCategoryStats[cat].count += 1;
    }
  });

  // Breakdown of Expenses by Category
  const expenseCategoryStats: Record<string, { total: number; count: number }> = {};
  monthExpenses.forEach((e) => {
    const cat = e.category || 'general';
    if (!expenseCategoryStats[cat]) {
      expenseCategoryStats[cat] = { total: 0, count: 0 };
    }
    expenseCategoryStats[cat].total += e.amount || 0;
    expenseCategoryStats[cat].count += 1;
  });

  let currentY = 16;

  // Helper for page break check
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 22) {
      doc.addPage();
      currentY = 18;
      return true;
    }
    return false;
  };

  // Helper for section headers
  const renderSectionHeader = (title: string, color: [number, number, number] = [24, 119, 242]) => {
    checkPageBreak(12);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(margin, currentY, 3.5, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin + 6, currentY + 4.8);
    currentY += 8.5;
  };

  // ==========================================
  // PAGE 1: HEADER & RESUMEN FINANCIERO EJECUTIVO
  // ==========================================

  // Accent bar
  doc.setFillColor(24, 119, 242);
  doc.rect(margin, currentY, contentWidth, 2.5, 'F');
  currentY += 4.5;

  // Header Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 32, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('BALANCE FINANCIERO MENSUAL & RENDICIÓN DE CUENTAS', margin + 6, currentY + 7);

  doc.setFontSize(10);
  doc.setTextColor(24, 119, 242);
  doc.text(`${settings.communityName.toUpperCase()}`, margin + 6, currentY + 13.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Ubicación: ${settings.settlementLocation} | Expediente Matriz INDERT: ${settings.indertExpedienteNumber || '4821/2024'}`,
    margin + 6,
    currentY + 19.5
  );
  doc.text(
    `Período Contable: Mes ${month} | Fecha de Emisión: ${formatParaguayDate()} (${formatParaguayDateTime()})`,
    margin + 6,
    currentY + 25
  );

  currentY += 36;

  // ==========================================
  // 4 METRIC CARDS
  // ==========================================
  const cardGap = 3.5;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  const cardHeight = 22;

  // 1. Total Recaudado (Green)
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(22, 101, 52);
  doc.text('TOTAL RECAUDADO', margin + 2.5, currentY + 4.5);
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatGuaranies(totalIncomes), margin + 2.5, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  const percentCollected = totalExpected > 0 ? ((totalIncomes / totalExpected) * 100).toFixed(0) : '100';
  doc.text(`${percentCollected}% del programado`, margin + 2.5, currentY + 17);

  // 2. Gastos Comunitarios (Red)
  const c2X = margin + cardWidth + cardGap;
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(c2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(c2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(185, 28, 28);
  doc.text('TOTAL GASTOS REALIZADOS', c2X + 2.5, currentY + 4.5);
  doc.setFontSize(9.5);
  doc.setTextColor(185, 28, 28);
  doc.text(formatGuaranies(totalSpent), c2X + 2.5, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`${monthExpenses.length} egresos con comprobante`, c2X + 2.5, currentY + 17);

  // 3. Saldo Líquido Neto (Blue or Red)
  const c3X = margin + (cardWidth + cardGap) * 2;
  const isSurplus = netBalance >= 0;
  doc.setFillColor(isSurplus ? 239 : 254, isSurplus ? 246 : 242, isSurplus ? 255 : 242);
  doc.roundedRect(c3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(isSurplus ? 191 : 254, isSurplus ? 219 : 202, isSurplus ? 254 : 202);
  doc.roundedRect(c3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(isSurplus ? 30 : 185, isSurplus ? 58 : 28, isSurplus ? 138 : 28);
  doc.text('SALDO NETO EN CAJA', c3X + 2.5, currentY + 4.5);
  doc.setFontSize(9.5);
  doc.text(formatGuaranies(netBalance), c3X + 2.5, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(isSurplus ? 22 : 185, isSurplus ? 101 : 28, isSurplus ? 52 : 28);
  doc.text(isSurplus ? 'Superávit disponible' : 'Déficit del período', c3X + 2.5, currentY + 17);

  // 4. Cuotas Pendientes / Morosidad (Amber)
  const c4X = margin + (cardWidth + cardGap) * 3;
  doc.setFillColor(254, 252, 232);
  doc.roundedRect(c4X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(254, 240, 138);
  doc.roundedRect(c4X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(161, 98, 7);
  doc.text('CUOTAS PENDIENTES', c4X + 2.5, currentY + 4.5);
  doc.setFontSize(9.5);
  doc.setTextColor(161, 98, 7);
  doc.text(formatGuaranies(totalDebts), c4X + 2.5, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text('Saldo por cobrar', c4X + 2.5, currentY + 17);

  currentY += cardHeight + 6;

  // ==========================================
  // SECTION 1: RESUMEN DE INGRESOS POR APORTES (DESGLOSE POR CATEGORÍA)
  // ==========================================
  renderSectionHeader('1. RESUMEN DE INGRESOS POR APORTES (DESGLOSE POR CATEGORÍA)', [22, 101, 52]);

  // Income Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 6, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, contentWidth, 6, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(30, 41, 59);
  doc.text('CATEGORÍA DE APORTE', margin + 3, currentY + 4.2);
  doc.text('APORTES PAGADOS', margin + 85, currentY + 4.2);
  doc.text('MONTO RECAUDADO (GS.)', margin + 128, currentY + 4.2);
  doc.text('PARTICIPACIÓN (%)', margin + 179, currentY + 4.2, { align: 'right' });

  currentY += 6;

  const incomeCategories = Object.entries(incomeCategoryStats);
  if (incomeCategories.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text('No se registraron cobros de aportes en el período seleccionado.', margin + 3, currentY + 5);
    currentY += 8;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);

    incomeCategories.forEach(([cat, stats], idx) => {
      checkPageBreak(6);
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 5.5, 'F');
      }

      const percent = totalIncomes > 0 ? ((stats.total / totalIncomes) * 100).toFixed(1) : '0.0';
      const label =
        cat === 'luz'
          ? 'Luz Comunitaria / Medidor ANDE'
          : cat === 'agua'
          ? 'Agua Potable / Bomba y Cisterna'
          : cat === 'mantenimiento'
          ? 'Mantenimiento y Desmalezado Comunal'
          : cat === 'administrativo'
          ? 'Gestión Administrativa / Escribanía'
          : cat === 'multa'
          ? 'Multas por Inasistencia a Asambleas / Faenas'
          : cat === 'extraordinario'
          ? 'Aporte Extraordinario Pro-Tierra / Mensura'
          : cat.toUpperCase();

      doc.text(label, margin + 3, currentY + 3.8);
      doc.text(`${stats.count} recibo(s)`, margin + 85, currentY + 3.8);
      doc.text(formatGuaranies(stats.total), margin + 128, currentY + 3.8);
      doc.text(`${percent}%`, margin + 179, currentY + 3.8, { align: 'right' });

      currentY += 5.5;
    });

    // Total Income Row
    doc.setFillColor(236, 253, 245);
    doc.rect(margin, currentY, contentWidth, 6, 'F');
    doc.setDrawColor(167, 243, 208);
    doc.rect(margin, currentY, contentWidth, 6, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(6, 78, 59);
    doc.text('TOTAL RECAUDACIÓN DE APORTES EFECTIVOS:', margin + 3, currentY + 4.2);
    doc.text(formatGuaranies(totalIncomes), margin + 128, currentY + 4.2);
    doc.text('100.0%', margin + 179, currentY + 4.2, { align: 'right' });
    currentY += 8.5;
  }

  // ==========================================
  // SECTION 2: RESUMEN DE GASTOS POR CATEGORÍA
  // ==========================================
  renderSectionHeader('2. RESUMEN DE GASTOS POR CATEGORÍA (EGRESOS DEL MES)', [185, 28, 28]);

  // Expense Category Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 6, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, contentWidth, 6, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(30, 41, 59);
  doc.text('RUBRO / CATEGORÍA DE GASTO', margin + 3, currentY + 4.2);
  doc.text('COMPROBANTES', margin + 85, currentY + 4.2);
  doc.text('TOTAL EGRESADO (GS.)', margin + 128, currentY + 4.2);
  doc.text('PARTICIPACIÓN (%)', margin + 179, currentY + 4.2, { align: 'right' });

  currentY += 6;

  const expenseCategories = Object.entries(expenseCategoryStats);
  if (expenseCategories.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text('No se registraron egresos o gastos comunitarios en este mes.', margin + 3, currentY + 5);
    currentY += 8;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);

    expenseCategories.forEach(([cat, stats], idx) => {
      checkPageBreak(6);
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 5.5, 'F');
      }

      const percent = totalSpent > 0 ? ((stats.total / totalSpent) * 100).toFixed(1) : '0.0';
      const label =
        cat === 'luz'
          ? 'Luz General / ANDE y Alumbrado'
          : cat === 'agua'
          ? 'Agua Corriente / Cañerías y Bombas'
          : cat === 'caminos'
          ? 'Caminos, Motoniveladora y Ripio'
          : cat === 'legal' || cat === 'administrativo'
          ? 'Trámites INDERT, Escribanía y Legal'
          : cat === 'mantenimiento'
          ? 'Mantenimiento General y Herramientas'
          : cat === 'seguridad'
          ? 'Seguridad y Prevención Comunal'
          : cat.toUpperCase();

      doc.text(label, margin + 3, currentY + 3.8);
      doc.text(`${stats.count} comprobante(s)`, margin + 85, currentY + 3.8);
      doc.text(formatGuaranies(stats.total), margin + 128, currentY + 3.8);
      doc.text(`${percent}%`, margin + 179, currentY + 3.8, { align: 'right' });

      currentY += 5.5;
    });

    // Total Expense Row
    doc.setFillColor(254, 242, 242);
    doc.rect(margin, currentY, contentWidth, 6, 'F');
    doc.setDrawColor(254, 202, 202);
    doc.rect(margin, currentY, contentWidth, 6, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(153, 27, 27);
    doc.text('TOTAL EGRESOS Y GASTOS RENDIDOS:', margin + 3, currentY + 4.2);
    doc.text(formatGuaranies(totalSpent), margin + 128, currentY + 4.2);
    doc.text('100.0%', margin + 179, currentY + 4.2, { align: 'right' });
    currentY += 8.5;
  }

  // ==========================================
  // SECTION 3: GASTOS COMUNITARIOS DESGLOSADOS (COMPROBANTES INDIVIDUALES)
  // ==========================================
  checkPageBreak(25);
  renderSectionHeader('3. DETALLE DE GASTOS DESGLOSADOS (COMPROBANTE POR COMPROBANTE)', [185, 28, 28]);

  // Expenses Detailed Table Header
  const renderExpensesTableHeader = () => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 6, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, currentY, contentWidth, 6, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);
    doc.text('FECHA', margin + 2.5, currentY + 4.2);
    doc.text('N° COMPROBANTE', margin + 22, currentY + 4.2);
    doc.text('CONCEPTO / PROVEEDOR', margin + 55, currentY + 4.2);
    doc.text('RUBRO', margin + 128, currentY + 4.2);
    doc.text('MONTO (GS.)', margin + 179, currentY + 4.2, { align: 'right' });
    currentY += 6;
  };

  renderExpensesTableHeader();

  if (monthExpenses.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text('No existen comprobantes de gastos registrados en este mes.', margin + 3, currentY + 5);
    currentY += 8;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.7);
    doc.setTextColor(15, 23, 42);

    monthExpenses.forEach((exp, idx) => {
      const needBreak = checkPageBreak(6);
      if (needBreak) {
        renderExpensesTableHeader();
      }

      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 5.5, 'F');
      }

      const dateStr = formatParaguayDate(exp.date);
      const receiptStr = (exp.receiptOrInvoice || 'S/N').substring(0, 16);
      const titleStr = `${exp.title} (${exp.supplierOrPayee || 'Varios'})`.substring(0, 44);
      const catStr = (exp.category || 'general').toUpperCase().substring(0, 14);

      doc.text(dateStr, margin + 2.5, currentY + 3.8);
      doc.text(receiptStr, margin + 22, currentY + 3.8);
      doc.text(titleStr, margin + 55, currentY + 3.8);
      doc.text(catStr, margin + 128, currentY + 3.8);
      doc.setFont('helvetica', 'bold');
      doc.text(formatGuaranies(exp.amount), margin + 179, currentY + 3.8, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      currentY += 5.5;
    });

    currentY += 3;
  }

  // ==========================================
  // SECTION 4: RESUMEN DE APORTES DE RESIDENTES (DETALLE DE COBRANZAS)
  // ==========================================
  checkPageBreak(25);
  renderSectionHeader('4. NÓMINA DE APORTES VECINALES COBRADOS EN EL PERÍODO', [22, 101, 52]);

  const renderContribTableHeader = () => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 6, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, currentY, contentWidth, 6, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);
    doc.text('RECIBO', margin + 2.5, currentY + 4.2);
    doc.text('FECHA', margin + 20, currentY + 4.2);
    doc.text('RESIDENTE (UBICACIÓN)', margin + 42, currentY + 4.2);
    doc.text('CONCEPTO / RUBRO', margin + 105, currentY + 4.2);
    doc.text('ESTADO', margin + 152, currentY + 4.2);
    doc.text('PAGADO (GS.)', margin + 179, currentY + 4.2, { align: 'right' });
    currentY += 6;
  };

  renderContribTableHeader();

  if (monthContributions.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text('No se emitieron cuotas o recibos de aportes en este mes.', margin + 3, currentY + 5);
    currentY += 8;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.6);
    doc.setTextColor(15, 23, 42);

    monthContributions.forEach((c, idx) => {
      const needBreak = checkPageBreak(6);
      if (needBreak) {
        renderContribTableHeader();
      }

      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 5.5, 'F');
      }

      const rcpt = (c.receiptNumber || 'REC-S/N').substring(0, 12);
      const dt = formatParaguayDate(c.date);
      const residentInfo = `${c.residentName.substring(0, 24)} (Mz ${c.block}-L${c.lot})`;
      const conceptStr = (c.concept || c.category).substring(0, 26);
      const statusLabel =
        c.status === 'paid' ? 'PAGADO' : c.status === 'partial' ? 'PARCIAL' : 'PENDIENTE';

      doc.text(rcpt, margin + 2.5, currentY + 3.8);
      doc.text(dt, margin + 20, currentY + 3.8);
      doc.text(residentInfo, margin + 42, currentY + 3.8);
      doc.text(conceptStr, margin + 105, currentY + 3.8);

      if (c.status === 'paid') {
        doc.setTextColor(22, 101, 52);
      } else {
        doc.setTextColor(180, 83, 9);
      }
      doc.text(statusLabel, margin + 152, currentY + 3.8);
      doc.setTextColor(15, 23, 42);

      doc.setFont('helvetica', 'bold');
      doc.text(formatGuaranies(c.amountPaid), margin + 179, currentY + 3.8, { align: 'right' });
      doc.setFont('helvetica', 'normal');

      currentY += 5.5;
    });

    currentY += 4;
  }

  // ==========================================
  // SECTION 5: LEGALIDAD & CONSTANCIA DE TRANSPARENCIA
  // ==========================================
  checkPageBreak(42);

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, currentY, contentWidth, 18, 1.8, 1.8, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, currentY, contentWidth, 18, 1.8, 1.8, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.3);
  doc.setTextColor(21, 128, 61);
  doc.text('✓ CONSTANCIA OFICIAL DE TRANSPARENCIA Y RESPALDO LEGAL (LEY 1863/02 & ART. 42 CN)', margin + 3.5, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  doc.setTextColor(20, 83, 45);
  const legalNotes =
    'El presente balance refleja fielmente los ingresos por cuotas comunitarias y las erogaciones ejecutadas para mejoras del asentamiento (luz, agua, mensura, caminos). Todo aporte cuenta con recibo numerado. La Comisión Vecinal actúa con personería y legitimidad asamblearia con prohibición estricta de intermediación lucrativa de tierras fiscales del INDERT.';
  const splitLegal = doc.splitTextToSize(legalNotes, contentWidth - 7);
  doc.text(splitLegal, margin + 3.5, currentY + 8);

  currentY += 22;

  // ==========================================
  // SECTION 6: FIRMAS OFICIALES DE LA COMISIÓN DIRECTIVA
  // ==========================================
  checkPageBreak(30);

  const sigBoxY = currentY;
  const sigWidth = 60;
  const gapBetweenSigs = contentWidth - sigWidth * 2;

  // Presidente
  const presX = margin + 12;
  doc.setDrawColor(100, 116, 139);
  doc.line(presX, sigBoxY + 12, presX + sigWidth, sigBoxY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.presidentName || 'Presidente de la Comisión', presX + sigWidth / 2, sigBoxY + 16, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Presidente de la Comisión Vecinal', presX + sigWidth / 2, sigBoxY + 20, {
    align: 'center',
  });

  // Tesorero/a
  const treasX = presX + sigWidth + gapBetweenSigs - 24;
  doc.line(treasX, sigBoxY + 12, treasX + sigWidth, sigBoxY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.treasurerName || 'Tesorero/a Comunal', treasX + sigWidth / 2, sigBoxY + 16, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Tesorero/a Comunal Responsable', treasX + sigWidth / 2, sigBoxY + 20, {
    align: 'center',
  });

  // ==========================================
  // FOOTER ACROSS ALL PAGES
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${settings.communityName} • Balance Mes ${month} • Rendición de Cuentas`,
      margin,
      pageHeight - 6.5
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
  }

  // Save the document
  const fileName = `Balance_Mensual_${month}_${settings.communityName.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

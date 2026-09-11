import { jsPDF } from 'jspdf';
import { Meeting, Resident, CommunitySettings } from '../types';
import { 
  formatParaguayDate, 
  formatParaguayTime, 
  formatParaguayLongDateTime, 
  formatParaguayDateTime 
} from './paraguayDate';

export interface MeetingAttendancePdfData {
  meeting: Meeting;
  residents: Resident[];
  settings: CommunitySettings;
}

export const generateMeetingAttendancePDF = ({
  meeting,
  residents,
  settings,
}: MeetingAttendancePdfData) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  // Attendance metrics
  const totalResidents = residents.length;
  const presentResidents = residents.filter(
    (r) => meeting.attendees.includes(r.id) || meeting.attendees.includes(r.documentId)
  );
  const absentResidents = residents.filter(
    (r) => !meeting.attendees.includes(r.id) && !meeting.attendees.includes(r.documentId)
  );

  const presentCount = presentResidents.length;
  const absentCount = absentResidents.length;
  const attendanceRate = totalResidents > 0 ? ((presentCount / totalResidents) * 100).toFixed(1) : '0';
  const hasQuorum = totalResidents > 0 && presentCount >= Math.ceil(totalResidents / 2);

  // Breakdown by Block
  const blockStats: Record<string, { total: number; present: number }> = {};
  residents.forEach((r) => {
    const blockKey = r.block || 'Sin Mz';
    if (!blockStats[blockKey]) {
      blockStats[blockKey] = { total: 0, present: 0 };
    }
    blockStats[blockKey].total += 1;
    const isPresent = meeting.attendees.includes(r.id) || meeting.attendees.includes(r.documentId);
    if (isPresent) {
      blockStats[blockKey].present += 1;
    }
  });

  // Prepare full sorted roster: Present first, then by Block and Lot
  const fullRoster = [...residents].map((r) => {
    const isPresent = meeting.attendees.includes(r.id) || meeting.attendees.includes(r.documentId);
    return {
      resident: r,
      isPresent,
    };
  }).sort((a, b) => {
    if (a.isPresent !== b.isPresent) {
      return a.isPresent ? -1 : 1; // Present first
    }
    const bComp = (a.resident.block || '').localeCompare(b.resident.block || '');
    if (bComp !== 0) return bComp;
    return (a.resident.lot || '').localeCompare(b.resident.lot || '', undefined, { numeric: true });
  });

  let currentY = 16;

  // Helper for page break
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - 22) {
      doc.addPage();
      currentY = 18;
      return true;
    }
    return false;
  };

  // Helper for section header
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
  // PAGE 1: HEADER & ACTA ASAMBLEARIA
  // ==========================================

  // Blue Accent Top Bar
  doc.setFillColor(24, 119, 242);
  doc.rect(margin, currentY, contentWidth, 2.5, 'F');
  currentY += 4.5;

  // Header Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, 34, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 34, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('ACTA OFICIAL DE ASISTENCIA Y CONTROL DE QUÓRUM ASAMBLEARIO', margin + 6, currentY + 6.5);

  doc.setFontSize(10);
  doc.setTextColor(24, 119, 242);
  doc.text(`${settings.communityName.toUpperCase()}`, margin + 6, currentY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Asentamiento: ${settings.settlementLocation} | Exp. Matriz INDERT: ${settings.indertExpedienteNumber || '4821/2024'}`,
    margin + 6,
    currentY + 19
  );
  doc.text(
    `Reunión / Motivo: ${meeting.title}`,
    margin + 6,
    currentY + 24.5
  );
  doc.text(
    `Fecha y Hora: ${formatParaguayLongDateTime(meeting.date)} | Estado: ${meeting.status === 'completed' ? 'FINALIZADA' : meeting.status === 'active' ? 'EN CURSO' : 'PROGRAMADA'}`,
    margin + 6,
    currentY + 30
  );

  currentY += 38;

  // ==========================================
  // 4 METRIC CARDS (QUÓRUM & ASISTENCIA)
  // ==========================================
  const cardGap = 3.5;
  const cardWidth = (contentWidth - cardGap * 3) / 4;
  const cardHeight = 22;

  // 1. Total Empadronados
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, cardWidth, cardHeight, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text('TOTAL EMPADRONADOS', margin + 2.5, currentY + 4.5);
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`${totalResidents} Familias`, margin + 2.5, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(100, 116, 139);
  doc.text('Censo de ocupación activo', margin + 2.5, currentY + 17);

  // 2. Presentes (Green)
  const c2X = margin + cardWidth + cardGap;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(c2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(c2X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(22, 101, 52);
  doc.text('PRESENTES (CON ASISTENCIA)', c2X + 2.5, currentY + 4.5);
  doc.setFontSize(10);
  doc.setTextColor(22, 101, 52);
  doc.text(`${presentCount} Titulares`, c2X + 2.5, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  doc.text(`${attendanceRate}% de participación`, c2X + 2.5, currentY + 17);

  // 3. Ausentes (Red/Amber)
  const c3X = margin + (cardWidth + cardGap) * 2;
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(c3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(c3X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(185, 28, 28);
  doc.text('AUSENTES (FALTAS)', c3X + 2.5, currentY + 4.5);
  doc.setFontSize(10);
  doc.setTextColor(185, 28, 28);
  doc.text(`${absentCount} Familias`, c3X + 2.5, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(71, 85, 105);
  const absentRate = totalResidents > 0 ? ((absentCount / totalResidents) * 100).toFixed(1) : '0';
  doc.text(`${absentRate}% de inasistencia`, c3X + 2.5, currentY + 17);

  // 4. Verificación de Quórum
  const c4X = margin + (cardWidth + cardGap) * 3;
  doc.setFillColor(hasQuorum ? 239 : 254, hasQuorum ? 246 : 252, hasQuorum ? 255 : 232);
  doc.roundedRect(c4X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'F');
  doc.setDrawColor(hasQuorum ? 191 : 254, hasQuorum ? 219 : 240, hasQuorum ? 254 : 138);
  doc.roundedRect(c4X, currentY, cardWidth, cardHeight, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.8);
  doc.setTextColor(hasQuorum ? 30 : 161, hasQuorum ? 58 : 98, hasQuorum ? 138 : 7);
  doc.text('ESTADO DEL QUÓRUM', c4X + 2.5, currentY + 4.5);
  doc.setFontSize(9.2);
  doc.text(hasQuorum ? 'QUÓRUM VÁLIDO' : '2DA CONVOCATORIA', c4X + 2.5, currentY + 11.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(hasQuorum ? 22 : 161, hasQuorum ? 101 : 98, hasQuorum ? 52 : 7);
  doc.text(hasQuorum ? 'Mayoría simple (+50%)' : 'Válido con los presentes', c4X + 2.5, currentY + 17);

  currentY += cardHeight + 6;

  // ==========================================
  // SECTION 1: RESUMEN DE ASISTENCIA POR MANZANA
  // ==========================================
  renderSectionHeader('1. RESUMEN DE ASISTENCIA Y PARTICIPACIÓN POR MANZANA', [24, 119, 242]);

  // Block Table Header
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, currentY, contentWidth, 6, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, contentWidth, 6, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(30, 41, 59);
  doc.text('MANZANA / SECTOR', margin + 3, currentY + 4.2);
  doc.text('TOTAL LOTES', margin + 65, currentY + 4.2);
  doc.text('PRESENTES', margin + 105, currentY + 4.2);
  doc.text('AUSENTES', margin + 140, currentY + 4.2);
  doc.text('PARTICIPACIÓN (%)', margin + 179, currentY + 4.2, { align: 'right' });

  currentY += 6;

  const blockEntries = Object.entries(blockStats).sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }));

  if (blockEntries.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text('No se encontraron manzanas registradas.', margin + 3, currentY + 5);
    currentY += 8;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(15, 23, 42);

    blockEntries.forEach(([blockName, stats], idx) => {
      checkPageBreak(6);
      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 5.5, 'F');
      }

      const blockRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
      const absentInBlock = stats.total - stats.present;

      doc.text(`Manzana ${blockName}`, margin + 3, currentY + 3.8);
      doc.text(`${stats.total} lotes`, margin + 65, currentY + 3.8);
      doc.setTextColor(22, 101, 52);
      doc.text(`${stats.present} presentes`, margin + 105, currentY + 3.8);
      doc.setTextColor(absentInBlock > 0 ? 185 : 71, absentInBlock > 0 ? 28 : 85, absentInBlock > 0 ? 28 : 105);
      doc.text(`${absentInBlock} ausentes`, margin + 140, currentY + 3.8);
      doc.setTextColor(15, 23, 42);
      doc.text(`${blockRate}%`, margin + 179, currentY + 3.8, { align: 'right' });

      currentY += 5.5;
    });

    // Total Row
    doc.setFillColor(239, 246, 255);
    doc.rect(margin, currentY, contentWidth, 6, 'F');
    doc.setDrawColor(191, 219, 254);
    doc.rect(margin, currentY, contentWidth, 6, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(30, 58, 138);
    doc.text('TOTAL GENERAL ASAMBLEA:', margin + 3, currentY + 4.2);
    doc.text(`${totalResidents} lotes`, margin + 65, currentY + 4.2);
    doc.text(`${presentCount} presentes`, margin + 105, currentY + 4.2);
    doc.text(`${absentCount} ausentes`, margin + 140, currentY + 4.2);
    doc.text(`${attendanceRate}%`, margin + 179, currentY + 4.2, { align: 'right' });
    currentY += 8.5;
  }

  // ==========================================
  // SECTION 2: NÓMINA DESGLOSADA DE ASISTENTES Y AUSENTES
  // ==========================================
  checkPageBreak(25);
  renderSectionHeader('2. NÓMINA COMPLETA DE RESIDENTES (CONTROL DE ASISTENCIA INDIVIDUAL)', [22, 101, 52]);

  const renderRosterTableHeader = () => {
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 6, 'F');
    doc.setDrawColor(203, 213, 225);
    doc.rect(margin, currentY, contentWidth, 6, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(30, 41, 59);
    doc.text('N°', margin + 2, currentY + 4.2);
    doc.text('ESTADO', margin + 10, currentY + 4.2);
    doc.text('NOMBRE Y APELLIDO DEL TITULAR', margin + 34, currentY + 4.2);
    doc.text('C.I. N°', margin + 98, currentY + 4.2);
    doc.text('MZ / LOTE', margin + 128, currentY + 4.2);
    doc.text('FIRMA / REGISTRO', margin + 179, currentY + 4.2, { align: 'right' });
    currentY += 6;
  };

  renderRosterTableHeader();

  if (fullRoster.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7.2);
    doc.setTextColor(100, 116, 139);
    doc.text('No hay residentes registrados en el padrón censal.', margin + 3, currentY + 5);
    currentY += 8;
  } else {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.7);

    fullRoster.forEach((item, idx) => {
      const needBreak = checkPageBreak(6);
      if (needBreak) {
        renderRosterTableHeader();
      }

      const isEven = idx % 2 === 0;
      if (isEven) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, currentY, contentWidth, 5.5, 'F');
      }

      const numStr = `${idx + 1}`;
      const statusStr = item.isPresent ? 'PRESENTE' : 'AUSENTE';
      const nameStr = item.resident.fullName.substring(0, 32);
      const docStr = item.resident.documentId || 'S/D';
      const locationStr = `Mz ${item.resident.block || '-'} • Lote ${item.resident.lot || '-'}`;
      const signatureOrQr = item.isPresent ? '✓ Carnet QR' : 'Falta';

      doc.setTextColor(71, 85, 105);
      doc.text(numStr, margin + 2, currentY + 3.8);

      if (item.isPresent) {
        doc.setTextColor(22, 101, 52);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(185, 28, 28);
        doc.setFont('helvetica', 'normal');
      }
      doc.text(statusStr, margin + 10, currentY + 3.8);

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', item.isPresent ? 'bold' : 'normal');
      doc.text(nameStr, margin + 34, currentY + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.text(docStr, margin + 98, currentY + 3.8);
      doc.text(locationStr, margin + 128, currentY + 3.8);

      if (item.isPresent) {
        doc.setTextColor(24, 119, 242);
      } else {
        doc.setTextColor(148, 163, 184);
      }
      doc.text(signatureOrQr, margin + 179, currentY + 3.8, { align: 'right' });
      doc.setTextColor(15, 23, 42);

      currentY += 5.5;
    });

    currentY += 4;
  }

  // ==========================================
  // SECTION 3: CONSTANCIA DE VALIDEZ JURÍDICA ASAMBLEARIA
  // ==========================================
  checkPageBreak(42);

  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin, currentY, contentWidth, 18, 1.8, 1.8, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin, currentY, contentWidth, 18, 1.8, 1.8, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.3);
  doc.setTextColor(21, 128, 61);
  doc.text(
    '✓ CONSTANCIA OFICIAL DE VALIDEZ JURÍDICA ASAMBLEARIA (ARTS. 42 Y 114 CN - LEY 1863/02)',
    margin + 3.5,
    currentY + 4.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.4);
  doc.setTextColor(20, 83, 45);
  const legalNotes =
    'El presente instrumento de control de asistencia constituye documento público interno y fehaciente ante el Instituto Nacional de Desarrollo Rural y de la Tierra (I.N.D.E.R.T.) y autoridades competentes, acreditando el arraigo pacífico y continuo de las familias ocupantes, la representatividad democrática de la Comisión Directiva y la validez soberana de las decisiones asamblearias.';
  const splitLegal = doc.splitTextToSize(legalNotes, contentWidth - 7);
  doc.text(splitLegal, margin + 3.5, currentY + 8);

  currentY += 22;

  // ==========================================
  // SECTION 4: FIRMAS OFICIALES DE LA COMISIÓN DIRECTIVA
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

  // Secretario / Tesorero
  const treasX = presX + sigWidth + gapBetweenSigs - 24;
  doc.line(treasX, sigBoxY + 12, treasX + sigWidth, sigBoxY + 12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.treasurerName || 'Secretario/a de Actas', treasX + sigWidth / 2, sigBoxY + 16, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text('Secretario/a / Responsable de Actas', treasX + sigWidth / 2, sigBoxY + 20, {
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
      `${settings.communityName} • Acta Asistencia: ${meeting.title} • Fecha: ${formatParaguayDate(meeting.date)}`,
      margin,
      pageHeight - 6.5
    );
    doc.text(`Página ${i} de ${totalPages}`, pageWidth - margin, pageHeight - 6.5, { align: 'right' });
  }

  // Save the document
  const fileName = `Acta_Asistencia_${meeting.title.replace(/\s+/g, '_')}_${formatParaguayDate(meeting.date).replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};

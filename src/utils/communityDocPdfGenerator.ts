import { jsPDF } from 'jspdf';
import { CommunitySettings } from '../types';

/**
 * Generates an official, highly-structured, comprehensive PDF master guide for community members.
 * Includes plot application guide, social priorities, approval timelines, legal framework (Ley 1863/02, Ley 2419/04 INDERT),
 * anti-fraud protocols, transfer/relocation rules, financial transparency regulations, and glossary.
 */
export const generateCommunityGuidePdf = (settings: CommunitySettings): jsPDF => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;
  let currentY = 18;

  // Helper for adding headers and footers to every page
  const addHeaderAndFooter = (pageNum: number, totalPages: number) => {
    // Top primary band
    doc.setFillColor(24, 119, 242); // #1877F2 (Official Community Blue)
    doc.rect(0, 0, pageWidth, 11, 'F');

    // Paraguay flag tri-color accent strip
    doc.setFillColor(213, 43, 30); // Red
    doc.rect(0, 11, pageWidth / 3, 1.2, 'F');
    doc.setFillColor(255, 255, 255); // White
    doc.rect(pageWidth / 3, 11, pageWidth / 3, 1.2, 'F');
    doc.setFillColor(0, 56, 168); // Blue
    doc.rect((pageWidth / 3) * 2, 11, pageWidth / 3, 1.2, 'F');

    // Header text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(255, 255, 255);
    doc.text('COMUNIDAD DE RESIDENTES • USO INTERNO VECINAL • COMISIÓN PRO-TIERRA', pageWidth / 2, 7, {
      align: 'center',
    });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${settings.communityName} • Herramienta de Autogestión Vecinal • No Oficial Gubernamental`,
      margin,
      pageHeight - 7
    );
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 10, pageWidth - margin, pageHeight - 10);
  };

  // Helper for checking page overflow
  const checkPageBreak = (neededHeight: number, pageNumRef: { current: number }) => {
    if (currentY + neededHeight > pageHeight - 16) {
      doc.addPage();
      pageNumRef.current += 1;
      currentY = 20;
      return true;
    }
    return false;
  };

  const pageNumRef = { current: 1 };

  // Helper to render section title with colored left bar
  const renderSectionHeader = (title: string, color: [number, number, number] = [24, 119, 242]) => {
    checkPageBreak(12, pageNumRef);
    doc.setFillColor(color[0], color[1], color[2]);
    doc.rect(margin, currentY, 3.5, 6.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(title, margin + 6, currentY + 5);
    currentY += 8.5;
  };

  // ==========================================
  // PAGE 1: PORTADA, DEFINICIÓN & CÓMO ACCEDER A UN LOTE
  // ==========================================
  currentY = 18;

  // Title Box
  doc.setFillColor(241, 245, 249); // light slate
  doc.roundedRect(margin, currentY, contentWidth, 34, 2.5, 2.5, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 34, 2.5, 2.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // slate 900
  doc.text('GUÍA COMUNITARIA: ACCESO A LOTE, MARCO LEGAL & TRANSPARENCIA', pageWidth / 2, currentY + 8, {
    align: 'center',
  });

  doc.setFontSize(9.5);
  doc.setTextColor(24, 119, 242);
  doc.text(`SISTEMA DIGITAL S16 • ${settings.communityName.toUpperCase()}`, pageWidth / 2, currentY + 14.5, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Ubicación: ${settings.settlementLocation} • Expediente Matriz INDERT: ${settings.indertExpedienteNumber || '4821/2024'}`,
    pageWidth / 2,
    currentY + 21,
    { align: 'center' }
  );
  doc.text(
    'Manual oficial: Requisitos de postulación, prioridades sociales, plazos de aprobación y derechos.',
    pageWidth / 2,
    currentY + 27,
    { align: 'center' }
  );

  currentY += 38;

  // SECCIÓN 1: ¿QUÉ ES EL SISTEMA S16?
  renderSectionHeader('1. ¿QUÉ ES EL SISTEMA DIGITAL COMUNITARIO (S16 INDERT)?');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(51, 65, 85);
  const introText =
    'El Sistema S16 es la plataforma comunitaria oficial para registrar de forma inalterable el padrón de ocupantes legítimos, la delimitación de lotes, los aportes económicos y los legajos presentados ante el I.N.D.E.R.T. Su objetivo es garantizar la transparencia y proteger a cada familia en su camino hacia el título de propiedad.';
  const splitIntro = doc.splitTextToSize(introText, contentWidth);
  doc.text(splitIntro, margin, currentY);
  currentY += splitIntro.length * 3.7 + 3;

  // SECCIÓN 2: ¿CÓMO ACCEDER A UN LOTE? ESCALA DE PRIORIDADES SOCIALES
  renderSectionHeader('2. ¿CÓMO ACCEDER A UN LOTE? ESCALA DE PRIORIDADES SOCIALES', [16, 185, 129]);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(51, 65, 85);
  const prioIntro =
    'Conforme al Estatuto Agrario (Ley 1863/02) y los principios de equidad de la Comisión Vecinal, la asignación de terrenos vacantes no adjudicados se rige por un estricto orden de prioridades sociales:';
  const splitPrioIntro = doc.splitTextToSize(prioIntro, contentWidth);
  doc.text(splitPrioIntro, margin, currentY);
  currentY += splitPrioIntro.length * 3.6 + 3;

  const prioritiesList = [
    {
      level: 'PRIORIDAD 1: ALTA VULNERABILIDAD SOCIAL (MÁXIMA PROTECCIÓN)',
      color: [220, 38, 38],
      items:
        '• Madres solteras o jefas de hogar con hijos menores dependientes.\n• Familias con integrantes con discapacidad física, intelectual o enfermedades crónicas (SENADIS).\n• Adultos mayores en desamparo habitacional y familias numerosas con 3 o más hijos sin vivienda.',
    },
    {
      level: 'PRIORIDAD 2: FAMILIAS CON ARRAIGO Y TRABAJO EN LA ZONA',
      color: [37, 99, 235],
      items:
        '• Parejas con hijos que vivan alquiladas o en hacinamiento demostrado en la comunidad.\n• Trabajadores de la zona con vocación de permanencia y participación en faenas comunitarias.',
    },
    {
      level: 'PRIORIDAD 3: JÓVENES TRABAJADORES Y NUEVOS HOGARES',
      color: [71, 85, 105],
      items:
        '• Parejas jóvenes recién constituidas y postulantes individuales que no posean ningún inmueble en el país.',
    },
  ];

  prioritiesList.forEach((p) => {
    checkPageBreak(17, pageNumRef);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, contentWidth, 16.5, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 16.5, 1.5, 1.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(p.color[0], p.color[1], p.color[2]);
    doc.text(p.level, margin + 3, currentY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(51, 65, 85);
    const splitItems = doc.splitTextToSize(p.items, contentWidth - 6);
    doc.text(splitItems, margin + 3, currentY + 8);

    currentY += 18.5;
  });

  // Inhabilitaciones
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, currentY, contentWidth, 12, 1.5, 1.5, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(153, 27, 27);
  doc.text('🚫 QUIÉNES QUEDAN INHABILITADOS O RECHAZADOS PARA ACCEDER A UN LOTE:', margin + 3, currentY + 4.2);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(185, 28, 28);
  doc.text(
    'Propietarios de otros inmuebles inscritos en la DGRP, personas con fines de lucro/reventa o antecedentes de usurpación.',
    margin + 3,
    currentY + 8.5
  );

  currentY += 15;

  // ==========================================
  // PAGE 2: PASO A PASO, REQUISITOS Y TIEMPOS DE APROBACIÓN
  // ==========================================
  doc.addPage();
  pageNumRef.current += 1;
  currentY = 20;

  // SECCIÓN 3: PROCESO DE POSTULACIÓN, REQUISITOS Y TIEMPOS OFICIALES
  renderSectionHeader('3. PROCESO DE POSTULACIÓN, REQUISITOS Y TIEMPOS DE APROBACIÓN');

  const processSteps = [
    {
      num: '1',
      title: 'Presentación de Carpeta de Postulación (Día 1):',
      desc: 'Entrega del formulario en Secretaría con fotocopias autenticadas de C.I. del grupo familiar, certificado de vida y residencia, y declaración jurada de no poseer inmueble.',
    },
    {
      num: '2',
      title: 'Evaluación Socio-Ambiental y Verificación en Sistema S16 (Días 2 al 10):',
      desc: 'La Comisión realiza la entrevista social y constata en el sistema la disponibilidad de un lote vacante libre de litigios y no reservado para calles o plazas públicas.',
    },
    {
      num: '3',
      title: 'Dictamen de Asignación y Aprobación Comunal (Días 11 al 20 - TIEMPO DE APROBACIÓN):',
      desc: 'La Comisión Vecinal evalúa la carpeta según la escala de prioridades y emite dictamen fundado en un plazo promedio de 15 a 30 días calendario.',
    },
    {
      num: '4',
      title: 'Firma de Acta de Posesión y Emisión de Certificado S16 (Días 21 al 25):',
      desc: 'Se asienta en el Libro de Actas formal, se da de alta en el padrón digital del Sistema S16 y se emite el Certificado Oficial de Ocupación para trámites de luz y agua.',
    },
    {
      num: '5',
      title: 'Plazo Perentorio de Ocupación y Mejoras (Plazo de 30 a 90 días):',
      desc: 'El postulante debe cercar y limpiar en 30 días y habitar el lote en un máximo de 90 días. Lotes en abandono u ociosos caducan automáticamente.',
    },
  ];

  processSteps.forEach((st) => {
    checkPageBreak(15, pageNumRef);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, contentWidth, 13.5, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 13.5, 1.5, 1.5, 'D');

    doc.setFillColor(24, 119, 242);
    doc.roundedRect(margin + 2, currentY + 2, 7, 7, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(st.num, margin + 5.5, currentY + 6.7, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(st.title, margin + 11, currentY + 4.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    const splitSt = doc.splitTextToSize(st.desc, contentWidth - 14);
    doc.text(splitSt, margin + 11, currentY + 8);

    currentY += 15.5;
  });

  currentY += 2;

  // SECCIÓN 4: MARCO LEGAL E INSTITUCIONAL (PARAGUAY)
  renderSectionHeader('4. MARCO LEGAL, CONSTITUCIONAL E INSTITUCIONAL (PARAGUAY)');

  const legalItems = [
    {
      law: 'Constitución Nacional del Paraguay (Arts. 114 y 115):',
      desc: 'Reforma Agraria, fomento a la pequeña propiedad y derecho a la vivienda digna para familias rurales y urbanas.',
    },
    {
      law: 'Ley N° 1863/02 "Estatuto Agrario" y Ley N° 2419/04 (INDERT):',
      desc: 'Define beneficiarios, acreditación de arraigo ininterrumpido y prohibición expresa de especulación o reventa de lotes estatales.',
    },
    {
      law: 'Código Civil Paraguayo (Art. 1909 y conc.):',
      desc: 'Protección jurídica de la posesión pacífica, pública y de buena fe de quienes habitan e introducen mejoras.',
    },
  ];

  legalItems.forEach((item) => {
    checkPageBreak(11, pageNumRef);
    doc.setFillColor(239, 246, 255);
    doc.roundedRect(margin, currentY, contentWidth, 9.5, 1.2, 1.2, 'F');
    doc.setDrawColor(219, 234, 254);
    doc.roundedRect(margin, currentY, contentWidth, 9.5, 1.2, 1.2, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 58, 138);
    doc.text(`⚖️ ${item.law}`, margin + 3, currentY + 3.8);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(51, 65, 85);
    const splitL = doc.splitTextToSize(item.desc, contentWidth - 6);
    doc.text(splitL, margin + 3, currentY + 7.2);
    currentY += 11.5;
  });

  // ==========================================
  // PAGE 3: BLINDAJE ANTI-FRAUDE, DERECHOS Y DEBERES
  // ==========================================
  doc.addPage();
  pageNumRef.current += 1;
  currentY = 20;

  // SECCIÓN 5: BLINDAJE ANTI-FRAUDE (LOS 5 CANDADOS DIGITALES)
  renderSectionHeader('5. BLINDAJE ANTI-FRAUDE: LOS 5 CANDADOS DIGITALES INALTERABLES', [220, 38, 38]);

  const antifraudItems = [
    {
      tag: '1. CANDADO DIGITAL',
      title: 'EVITA LA VENTA DOBLE Y SOLAPAMIENTO DE LOTES',
      sol: 'El sistema bloquea automáticamente cualquier intento de asignar una Manzana y Lote ya adjudicados.',
    },
    {
      tag: '2. RECIBO DIGITAL OBLIGATORIO',
      title: 'EVITA COBROS PARALELOS O INFORMALES',
      sol: 'Todo pago requiere comprobante oficial emitido por el sistema con código único y firma de Tesorería.',
    },
    {
      tag: '3. CAJA ABIERTA 24 HORAS',
      title: 'EVITA EL DESVÍO DE FONDOS COMUNALES',
      sol: 'Cada egreso (combustible, tubos, tractor, mensura) se registra con comprobante y descuenta en tiempo real.',
    },
    {
      tag: '4. HISTORIAL INALTERABLE',
      title: 'EVITA EL DESPOJO INJUSTO DE POSESIÓN',
      sol: 'El sistema custodia fecha de ingreso, mejoras construidas y actas de asamblea como prueba fehaciente.',
    },
    {
      tag: '5. RESPALDO DIGITAL PROTEGIDO',
      title: 'EVITA LA PÉRDIDA O EXTRAVÍO DE CUADERNOS',
      sol: 'Base de datos protegida con copias de seguridad descargables e inmutables.',
    },
  ];

  antifraudItems.forEach((item) => {
    checkPageBreak(14, pageNumRef);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, currentY, contentWidth, 11.5, 1.5, 1.5, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 11.5, 1.5, 1.5, 'D');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(185, 28, 28);
    doc.text(`[${item.tag}]`, margin + 3, currentY + 4);
    doc.setTextColor(15, 23, 42);
    doc.text(item.title, margin + 28, currentY + 4);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(22, 101, 52);
    doc.text(`Garantía S16: ${item.sol}`, margin + 3, currentY + 8);

    currentY += 13.5;
  });

  currentY += 2;

  // SECCIÓN 6: DERECHOS Y DEBERES COMUNITARIOS
  renderSectionHeader('6. DERECHOS Y DEBERES COMUNITARIOS DE CADA FAMILIA');

  const colWidth = (contentWidth - 4) / 2;

  // Box Derechos
  doc.setFillColor(239, 246, 255);
  doc.roundedRect(margin, currentY, colWidth, 38, 2, 2, 'F');
  doc.setDrawColor(191, 219, 254);
  doc.roundedRect(margin, currentY, colWidth, 38, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(30, 58, 138);
  doc.text('⚖️ DERECHOS DEL RESIDENTE:', margin + 3, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(30, 64, 175);
  const rights = [
    '• Recibo digital inmediato por todo aporte abonado.',
    '• Certificado de Ocupación para ANDE, ESSAP y trámites.',
    '• Acceso al balance general de caja las 24 horas.',
    '• Voz y voto en las Asambleas Comunitarias.',
    '• Respeto absoluto a su posesión pacífica y mejoras.',
  ];
  let ry = currentY + 9.5;
  rights.forEach((r) => {
    doc.text(r, margin + 3, ry);
    ry += 5.2;
  });

  // Box Deberes
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(margin + colWidth + 4, currentY, colWidth, 38, 2, 2, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(margin + colWidth + 4, currentY, colWidth, 38, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(20, 83, 45);
  doc.text('🤝 DEBERES DEL RESIDENTE:', margin + colWidth + 7, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(22, 101, 52);
  const duties = [
    '• Pago puntual de la cuota social comunal.',
    '• Asistencia a asambleas y reuniones vecinales.',
    '• Participación activa en faenas y limpieza de calles.',
    '• Respeto estricto a mojones y medidas del plano.',
    '• Convivencia pacífica y respeto mutuo vecinal.',
  ];
  let dy = currentY + 9.5;
  duties.forEach((d) => {
    doc.text(d, margin + colWidth + 7, dy);
    dy += 5.2;
  });

  currentY += 42;

  // ==========================================
  // PAGE 4: PROTOCOLO DE TRASPASO, TESORERÍA, GLOSARIO & FIRMAS
  // ==========================================
  doc.addPage();
  pageNumRef.current += 1;
  currentY = 20;

  // SECCIÓN 7: PROTOCOLO DE CESIÓN Y REUBICACIÓN
  renderSectionHeader('7. PROTOCOLO OBLIGATORIO DE CESIÓN DE MEJORAS Y REUBICACIÓN');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    'Queda prohibida la venta clandestina. Todo traspaso requiere comparecencia de ambas partes, inspección in situ, acta comunitaria en Libro de Actas, actualización en Sistema S16 y comunicación al INDERT.',
    margin,
    currentY,
    { maxWidth: contentWidth }
  );
  currentY += 10;

  // SECCIÓN 8: RÉGIMEN DE TESORERÍA Y DOBLE FIRMA
  renderSectionHeader('8. RÉGIMEN DE TESORERÍA, GASTOS Y RENDICIÓN DE CUENTAS');

  doc.setFillColor(254, 249, 195);
  doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'F');
  doc.setDrawColor(253, 224, 71);
  doc.roundedRect(margin, currentY, contentWidth, 20, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(113, 63, 18);
  doc.text('💰 DESTINO ESTRICTO DE LOS FONDOS COMUNALES:', margin + 3, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(133, 77, 14);
  const finPoints = [
    '• Gastos de gestoría técnica, agrimensura, mensura judicial y honorarios aprobados en asamblea.',
    '• Obras de infraestructura básica: cañerías de agua corriente, transformadores ANDE y motoniveladora.',
    '• Todo retiro o gasto mayor requiere firma conjunta obligatoria de Presidencia y Tesorería.',
  ];
  let fy = currentY + 8.5;
  finPoints.forEach((fp) => {
    doc.text(fp, margin + 3, fy);
    fy += 3.5;
  });

  currentY += 24;

  // SECCIÓN 9: GLOSARIO AGRARIO RÁPIDO
  renderSectionHeader('9. GLOSARIO DE TÉRMINOS AGRARIOS INDERT');

  const terms = [
    { t: 'Padrón Censal:', d: 'Lista jurada de familias ocupantes con acreditación de residencia efectiva y mejoras.' },
    { t: 'Expediente Matriz:', d: 'Legajo radicado ante el INDERT donde se tramita la compra o expropiación del inmueble.' },
    { t: 'Mensura Judicial:', d: 'Operación pericial y topográfica ordenada por un Juez para delimitar los linderos oficiales.' },
  ];

  terms.forEach((tm) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    doc.text(`• ${tm.t}`, margin + 2, currentY + 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    doc.text(tm.d, margin + 30, currentY + 3);
    currentY += 4.5;
  });

  currentY += 4;

  // ==========================================
  // PAGE 5: MARCO LEGAL, DESCARGO NO GUBERNAMENTAL, TÉRMINOS & PRIVACIDAD
  // ==========================================
  doc.addPage();
  pageNumRef.current += 1;
  currentY = 20;

  // SECCIÓN 10: DESCARGO NO GUBERNAMENTAL & USO INTERNO
  renderSectionHeader('10. DESCARGO LEGAL: HERRAMIENTA PRIVADA DE USO INTERNO VECINAL', [220, 38, 38]);

  doc.setFillColor(254, 242, 242);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(margin, currentY, contentWidth, 24, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(153, 27, 27);
  doc.text('⚠️ DECLARACIÓN EXPRESA DE NO FILIACIÓN GUBERNAMENTAL:', margin + 3, currentY + 4.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(127, 29, 29);
  const disclaimerPdfText =
    'El Sistema Digital S16 / ComunidApp es una herramienta tecnológica privada de autogestión vecinal desarrollada para uso interno de la Comisión Vecinal Pro-Tierra. NO constituye una plataforma oficial del INDERT, MUVH, Catastro ni del Estado Paraguayo. Las constancias emitidas tienen alcance gremial y probatorio de posesión pacífica, no sustituyendo títulos definitivos de propiedad pública.';
  const splitDisclaimer = doc.splitTextToSize(disclaimerPdfText, contentWidth - 6);
  doc.text(splitDisclaimer, margin + 3, currentY + 8.5);

  currentY += 28;

  // SECCIÓN 11: TÉRMINOS Y CONDICIONES & POLÍTICAS DE PRIVACIDAD
  renderSectionHeader('11. TÉRMINOS Y CONDICIONES DEL PADRÓN & PRIVACIDAD (LEY 1682/01 Y LEY 6534/20)');

  const legalClauses = [
    {
      t: '1. Veracidad Jurada de Datos:',
      d: 'Todo postulante y censado declara bajo fe de juramento la veracidad de su identidad y residencia efectiva.',
    },
    {
      t: '2. Prohibición de Especulación:',
      d: 'Queda estrictamente prohibida la venta, cesión o subarriendo informal de lotes con fines lucrativos.',
    },
    {
      t: '3. Transparencia & Caja Abierta:',
      d: 'Todo aporte cuenta con recibo digital numerado inalterable y el balance financiero está disponible públicamente.',
    },
    {
      t: '4. Protección de Datos (ARCO):',
      d: 'Los datos personales (C.I., teléfonos, grupo familiar) son de uso censal exclusivo y JAMÁS serán comercializados a terceros.',
    },
  ];

  legalClauses.forEach((c) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(15, 23, 42);
    doc.text(`• ${c.t}`, margin + 2, currentY + 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(71, 85, 105);
    const splitC = doc.splitTextToSize(c.d, contentWidth - 45);
    doc.text(splitC, margin + 42, currentY + 3);
    currentY += 6;
  });

  currentY += 4;

  // SECCIÓN 12: RATIFICACIÓN Y CUADRO DE FIRMAS
  checkPageBreak(38, pageNumRef);

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, currentY, contentWidth, 36, 2, 2, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(margin, currentY, contentWidth, 36, 2, 2, 'D');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(30, 41, 59);
  doc.text('RATIFICACIÓN Y COMPROMISO OFICIAL DE TRANSPARENCIA', pageWidth / 2, currentY + 5, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Emitido y refrendado en ${settings.settlementLocation}, Paraguay, en fecha ${new Date().toLocaleDateString('es-PY')}.`,
    pageWidth / 2,
    currentY + 9,
    { align: 'center' }
  );

  // Signatures
  const sigY = currentY + 22;
  const sigWidth = 45;

  // President
  doc.setDrawColor(100, 116, 139);
  doc.line(margin + 6, sigY, margin + 6 + sigWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.presidentName || 'Presidente de Comisión', margin + 6 + sigWidth / 2, sigY + 3.8, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('PRESIDENCIA', margin + 6 + sigWidth / 2, sigY + 7, { align: 'center' });

  // Treasurer
  doc.line(margin + 67, sigY, margin + 67 + sigWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.treasurerName || 'Tesorero/a de Comisión', margin + 67 + sigWidth / 2, sigY + 3.8, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TESORERÍA', margin + 67 + sigWidth / 2, sigY + 7, { align: 'center' });

  // Secretary
  doc.line(margin + 128, sigY, margin + 128 + sigWidth, sigY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.secretaryName || 'Secretario/a de Actas', margin + 128 + sigWidth / 2, sigY + 3.8, {
    align: 'center',
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('SECRETARÍA DE ACTAS', margin + 128 + sigWidth / 2, sigY + 7, { align: 'center' });

  // ==========================================
  // APPLY HEADERS & FOOTERS TO ALL PAGES
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addHeaderAndFooter(i, totalPages);
  }

  return doc;
};

/**
 * Downloads the community guide PDF directly to the user's browser.
 */
export const downloadCommunityGuidePdf = (settings: CommunitySettings) => {
  const doc = generateCommunityGuidePdf(settings);
  const cleanName = settings.communityName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Guia_Comunitaria_S16_INDERT_${cleanName}.pdf`);
};

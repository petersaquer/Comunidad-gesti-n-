import { IndertDocument, Resident, Contribution, CommunitySettings } from '../types';
import { formatGuaranies } from './currency';

/**
 * Downloads an IndertDocument. If fileData is present, downloads it directly.
 * Otherwise, generates an official community document file.
 */
export const downloadIndertDocument = (doc: IndertDocument, settings: CommunitySettings) => {
  if (doc.fileData) {
    const link = document.createElement('a');
    link.href = doc.fileData;
    link.download = doc.fileName || `${doc.documentNumber || 'documento'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Generate an official printable summary file (.txt or formatted certificate)
  const content = `
================================================================================
REPÚBLICA DEL PARAGUAY
INSTITUTO NACIONAL DE DESARROLLO RURAL Y DE LA TIERRA (I.N.D.E.R.T.)
${settings.communityName.toUpperCase()}
ASENTAMIENTO / COLONIA: ${settings.settlementLocation}
EXPEDIENTE INDERT: ${settings.indertExpedienteNumber || 'Exp. 4821/2024'}
================================================================================

DOCUMENTO OFICIAL DE GESTIÓN COMUNITARIA
--------------------------------------------------------------------------------
TÍTULO: ${doc.title}
CATEGORÍA: ${doc.category.toUpperCase().replace('_', ' ')}
N° IDENTIFICADOR / FACTURA / EXPEDIENTE: ${doc.documentNumber}
FECHA DE REGISTRO: ${doc.date}
RESPONSABLE / SUBIDO POR: ${doc.uploadedBy}
ESTADO DEL TRÁMITE: ${doc.status.toUpperCase()}
${doc.amount ? `MONTO / IMPORTE: ${formatGuaranies(doc.amount)}` : ''}
${doc.relatedBlock ? `MANZANA: ${doc.relatedBlock} | LOTE: ${doc.relatedLot || 'Todos'}` : ''}
${doc.residentName ? `TITULAR / OCUPANTE: ${doc.residentName}` : ''}

DESCRIPCIÓN / OBSERVACIONES TÉCNICAS:
${doc.notes || 'Documento debidamente acreditado en el libro de actas y archivo digital comunal.'}

--------------------------------------------------------------------------------
CERTIFICACIÓN DE AUTENTICIDAD:
El presente documento forma parte del legajo digital y físico custodiado por la
Comisión Vecinal reconocida por el INDERT para fines de titulación, colonización,
mensura judicial y rendición de cuentas de aportes y gastos comunes.

Firma del Presidente: ________________________ (${settings.presidentName})
Firma de la Tesorera: ________________________ (${settings.treasurerName})
Fecha de descarga y emisión: ${new Date().toLocaleString('es-PY')}
================================================================================
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${doc.documentNumber.replace(/[^a-zA-Z0-9]/g, '_')}_${doc.fileName || 'documento.txt'}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Generates and downloads an official Resident Occupancy & Clear Debt Certificate
 */
export const downloadResidentCertificate = (
  resident: Resident,
  contributions: Contribution[],
  settings: CommunitySettings
) => {
  const residentContributions = contributions.filter((c) => c.residentId === resident.id);
  const totalPaid = residentContributions.reduce((sum, c) => sum + c.amountPaid, 0);
  const totalDue = residentContributions.reduce((sum, c) => sum + c.amount, 0);
  const debt = Math.max(0, totalDue - totalPaid);
  const isUpToDate = debt <= 0;

  const content = `
================================================================================
COMISIÓN VECINAL PRO-TIERRA ASENTAMIENTO "ESPERANZA Y UNIÓN"
RECONOCIMIENTO INDERT RESOLUCIÓN D.G. N° 612/2024
EXPEDIENTE INDERT GENERAL N°: ${settings.indertExpedienteNumber || '4821/2024'}
LUGAR: ${settings.settlementLocation}
================================================================================

CERTIFICADO OFICIAL DE OCUPACIÓN Y REGULARIDAD DE APORTES
--------------------------------------------------------------------------------

A QUIEN CORRESPONDA Y A LAS AUTORIDADES DEL I.N.D.E.R.T.:

La Comisión Vecinal abajo firmante CERTIFICA que el/la ciudadano/a:

  NOMBRE Y APELLIDO:    ${resident.fullName}
  CÉDULA DE IDENTIDAD:  ${resident.documentId}
  TELÉFONO DE CONTACTO: ${resident.phone}
  BARRIO / SECTOR:      ${resident.barrio || 'Sector 16'}
  MANZANA ASIGNADA:     ${resident.block}
  LOTE NÚMERO:          ${resident.lot}
  SECTOR / ZONA:        ${resident.sector}
  FECHA DE INICIO:      ${resident.occupationDate}
  ESTADO CIVIL:         ${resident.maritalStatus ? resident.maritalStatus.toUpperCase() : 'NO ESPECIFICADO'}
  CÓNYUGE / PAREJA:     ${resident.hasPartner && resident.partnerName ? `${resident.partnerName} (C.I. ${resident.partnerDocumentId || 'S/N'})` : 'No registra cónyuge en lote'}
  CANTIDAD DE HIJOS:    ${resident.childrenCount ?? 0}
  MIEMBROS DE FAMILIA:  ${resident.familyMembersCount} personas en el lote
  ATENCIÓN DISCAPACIDAD:${resident.hasChildrenWithDisability ? `SÍ (${resident.disabilityDetails || 'Prioridad de accesibilidad'})` : 'No registra'}

ESTADO DE ARRAIGO Y RESIDENCIA:
El solicitante ejerce ocupación pacífica, continua y de buena fe sobre el lote
arriba individualizado, habiendo construido mejoras habitacionales y participando
activamente de las asambleas y faenas comunitarias.

ESTADO FINANCIERO ANTE LA COMISIÓN VECINAL:
- Total aportado para servicios (Agua/Luz/Caminos): ${formatGuaranies(totalPaid)}
- Saldo adeudado a la fecha: ${formatGuaranies(debt)}
- SITUACIÓN: ${isUpToDate ? 'AL DÍA (SIN DEUDA - HABILITADO PARA TITULACIÓN)' : 'CON SALDO PENDIENTE DE REGULARIZACIÓN'}

OBSERVACIONES ADICIONALES:
${resident.notes || 'Sin observaciones impeditivas.'}

Se expide el presente certificado a pedido del interesado para su presentación ante
el INDERT, ANDE, ESSAP u otras instituciones públicas o privadas pertinentes.

Dado en ${settings.settlementLocation}, a los ${new Date().toLocaleDateString('es-PY')}.


__________________________________          __________________________________
     ${settings.presidentName}                     ${settings.treasurerName}
            PRESIDENTE                                    TESORERA
       Comisión Vecinal INDERT                      Comisión Vecinal INDERT
================================================================================
`;

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Certificado_Ocupacion_Mz_${resident.block}_Lote_${resident.lot}_${resident.documentId}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

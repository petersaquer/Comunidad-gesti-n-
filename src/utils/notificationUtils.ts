import { Resident, Contribution, MaintenanceShift, CommunitySettings } from '../types';
import { formatGuaranies } from './currency';

export const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/[^0-9]/g, '');
};

export const generatePaymentReminderMessage = (
  resident: Resident,
  pendingContributions: Contribution[],
  settings: CommunitySettings
): string => {
  const totalDebt = pendingContributions.reduce((acc, c) => acc + (c.amount - c.amountPaid), 0);
  const itemsDetail = pendingContributions
    .map(
      (c) =>
        `• ${c.concept} [${c.category.toUpperCase()}]: Pendiente ${formatGuaranies(c.amount - c.amountPaid)}`
    )
    .join('\n');

  return `🏛️ *AVISO DE TESORERÍA - ${settings.communityName.toUpperCase()}*

Estimado/a *${resident.fullName}* (Barrio: ${resident.barrio || 'Sector 16'} • Mz. ${resident.block} - Lote ${resident.lot}):

Le saludamos cordialmente. A través de este medio le recordamos que mantiene aportes comunitarios pendientes para el sostenimiento de los servicios básicos (Luz/Agua/Administración/INDERT):

📋 *Detalle de Aportes Pendientes:*
${itemsDetail}

💰 *TOTAL PENDIENTE:* ${formatGuaranies(totalDebt)}

Por favor, acérquese a Tesorería con *${settings.treasurerName}* o reporte su comprobante para mantener los servicios colectivos al día y evitar cortes o recargos.

_Comité Vecinal S16 - Gestión de Terreno y Convivencia_`;
};

export const generateShiftReminderMessage = (
  shift: MaintenanceShift,
  resident: Resident,
  settings: CommunitySettings
): string => {
  return `📢 *RECORDATORIO DE TURNO / FAENA COMUNITARIA*

Estimado/a *${resident.fullName}* (Mz. ${resident.block} - Lote ${resident.lot}):

Le recordamos su compromiso asignado para el mantenimiento de nuestro terreno comunal:

🔨 *Tarea:* ${shift.taskTitle}
📅 *Fecha programada:* ${shift.dateScheduled}
⏰ *Horario:* ${shift.timeSlot}
${shift.completionNotes ? `📌 *Instrucciones:* ${shift.completionNotes}` : ''}

Recuerde que el trabajo mancomunado beneficia a todos los vecinos. En caso de fuerza mayor, gestione con tiempo su reemplazante para evitar multas de inasistencia fijadas por asamblea.

_${settings.communityName}_`;
};

export const openWhatsApp = (phone: string, message: string): void => {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) {
    alert('El residente no cuenta con un número de celular válido registrado.');
    return;
  }
  const url = `https://wa.me/${cleaned}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

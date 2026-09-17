import { UserAccount, Resident, LandRequest } from '../types';

/**
 * Checks if the user holds an administrative role with privileges to view
 * official identity documents and sensitive demographic data.
 */
export function isAdministrativeUser(user?: UserAccount | null): boolean {
  if (!user) return false;

  const adminRoles = [
    'admin',
    'vicepresidente',
    'tesorera',
    'subtesorera',
    'secretaria',
    'subsecretaria',
    'sindico',
    'sindico_suplente',
    'directiva',
    'vocal_suplente',
  ];
  if (adminRoles.includes(user.role)) {
    return true;
  }

  // Also check explicit granular permissions if present
  if (user.permissions?.canManageResidents || user.permissions?.canManageUsers) {
    return true;
  }

  return false;
}

/**
 * Checks if the current user has permission to see sensitive personal details
 * (unmasked C.I., front/back ID photos, spouse data, disability specifics, internal fraud notes).
 * Rule: ONLY administrative users AND the resident themselves are permitted.
 */
export function canViewSensitiveResidentData(
  currentUser: UserAccount | null | undefined,
  resident: Resident | { documentId?: string; id?: string; block?: string; lot?: string }
): boolean {
  if (!currentUser) return false;

  // 1. Directiva / Administrativos have official oversight rights
  if (isAdministrativeUser(currentUser)) {
    return true;
  }

  // 2. The resident themself: verify by C.I. (documentId), residentId, or Lot/Block
  const userDoc = currentUser.documentId?.trim().toLowerCase().replace(/[^0-9a-z]/g, '');
  const residentDoc = resident.documentId?.trim().toLowerCase().replace(/[^0-9a-z]/g, '');
  if (userDoc && residentDoc && userDoc === residentDoc) {
    return true;
  }

  if (currentUser.residentId && resident.id && currentUser.residentId === resident.id) {
    return true;
  }

  if (
    currentUser.block &&
    currentUser.lot &&
    resident.block &&
    resident.lot &&
    currentUser.block.trim().toUpperCase() === resident.block.trim().toUpperCase() &&
    currentUser.lot.trim().toUpperCase() === resident.lot.trim().toUpperCase()
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if the current user has permission to see sensitive land application data.
 * Rule: Administrative users OR the applicant themself.
 */
export function canViewSensitiveLandRequest(
  currentUser: UserAccount | null | undefined,
  request: LandRequest
): boolean {
  if (!currentUser) return false;
  if (isAdministrativeUser(currentUser)) return true;

  const userDoc = currentUser.documentId?.trim().toLowerCase().replace(/[^0-9a-z]/g, '');
  const reqDoc = request.documentId?.trim().toLowerCase().replace(/[^0-9a-z]/g, '');
  return Boolean(userDoc && reqDoc && userDoc === reqDoc);
}

/**
 * Masks a document number (C.I. / D.N.I.) for privacy protection (Habeas Data).
 * Rule: Exposes ONLY the last 3 digits, masking all preceding numbers.
 * Example: "4.892.110" -> "•••.•••.110" | "3450982" -> "•••.•••.982"
 */
export function maskDocumentId(docId?: string, forceUnmask = false): string {
  if (!docId) return 'S/D';
  if (forceUnmask) return docId;

  const clean = docId.trim();
  if (clean.toLowerCase() === 'admin' || clean.toLowerCase() === 's/n' || clean.toLowerCase() === 's/d') {
    return clean;
  }

  const digits = clean.replace(/\D/g, '');
  if (digits.length === 0) return '•••';
  if (digits.length <= 3) return `••• ${digits}`;

  const last3 = digits.slice(-3);
  return `•••.•••.${last3}`;
}

/**
 * Masks a personal contact phone number for privacy protection.
 * Rule: Exposes ONLY the last 3 digits, masking all preceding numbers.
 * Example: "+595981234567" -> "+595 ••• ••• 567" | "0981 234 900" -> "09•• ••• 900"
 */
export function maskPhone(phone?: string, forceUnmask = false): string {
  if (!phone) return 'S/Tel';
  if (forceUnmask) return phone;

  const clean = phone.trim();
  const digits = clean.replace(/\D/g, '');
  if (digits.length === 0) return '••••••';
  if (digits.length <= 3) return `••• ${digits}`;

  const last3 = digits.slice(-3);
  if (clean.startsWith('+595')) {
    return `+595 ••• ••• ${last3}`;
  }
  if (clean.startsWith('09')) {
    return `09•• ••• ${last3}`;
  }
  return `•••• ••• ${last3}`;
}

export const maskPhoneNumber = maskPhone;

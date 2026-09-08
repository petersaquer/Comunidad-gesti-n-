import { UserAccount, Resident, LandRequest } from '../types';

/**
 * Checks if the user holds an administrative role with privileges to view
 * official identity documents and sensitive demographic data.
 */
export function isAdministrativeUser(user?: UserAccount | null): boolean {
  if (!user) return false;

  const adminRoles = ['admin', 'tesorera', 'secretaria', 'sindico', 'directiva'];
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
 * Masks a document number (C.I. / D.N.I.) for unauthorized viewers while keeping transparency.
 * Example: "4.821.902" -> "4.•••.902" or "4821902" -> "48•••02"
 */
export function maskDocumentId(docId?: string, hasPermission = false): string {
  if (!docId) return 'S/N';
  if (hasPermission) return docId;

  const clean = docId.trim();
  if (clean.length <= 4) return '••••';

  // Format nicely preserving initial and trailing characters
  const start = clean.slice(0, 2);
  const end = clean.slice(-2);
  return `${start}••••${end}`;
}

/**
 * Masks a personal contact phone number for privacy.
 * Example: "0981-234-567" -> "0981-•••-567"
 */
export function maskPhone(phone?: string, hasPermission = false): string {
  if (!phone) return 'Reservado';
  if (hasPermission) return phone;

  const clean = phone.trim();
  if (clean.length <= 5) return '••••••••';

  const start = clean.slice(0, 4);
  const end = clean.slice(-3);
  return `${start}•••${end}`;
}

export const maskPhoneNumber = maskPhone;

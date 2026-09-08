import fs from 'node:fs';
import path from 'node:path';
// @ts-ignore
import { DatabaseSync } from 'node:sqlite';
import {
  Resident,
  Contribution,
  Expense,
  MaintenanceShift,
  Incident,
  CommunitySettings,
  UserAccount,
  IndertDocument,
  LandRequest,
  RelocationRecord,
  CommunityPost,
} from '../src/types';
import {
  initialResidents,
  initialContributions,
  initialExpenses,
  initialShifts,
  initialIncidents,
  initialSettings,
  initialUsers,
  initialIndertDocuments,
  initialLandRequests,
  initialCommunityPosts,
} from '../src/mockData/initialData';
import {
  hashPassword,
  sanitizeUser,
  validateSQLQuerySafety,
  redactSensitiveSQLRows,
} from './authSecurity';

const DATA_DIR = process.env.VERCEL ? '/tmp/data' : path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'sector16.sqlite');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function s(val: any, fallback: any = null): any {
  if (val === undefined) return fallback;
  return val;
}

let dbInstance: any = null;

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new DatabaseSync(DB_FILE);
    // Enable WAL mode for high concurrency & ACID safety
    dbInstance.exec('PRAGMA journal_mode = WAL;');
    dbInstance.exec('PRAGMA synchronous = NORMAL;');
    initSchema(dbInstance);
  }
  return dbInstance;
}

function migrateLegacySchemas(db: any) {
  try {
    // 1. Check indert_docs table schema
    const indertTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='indert_docs'").get();
    if (indertTableExists) {
      const indertCols = db.prepare("PRAGMA table_info(indert_docs)").all() as { name: string }[];
      const colNames = indertCols.map((c) => c.name);
      if (!colNames.includes('category')) {
        console.log('[SQLite Migration] Migrando tabla indert_docs al nuevo esquema...');
        const oldRows = db.prepare("SELECT data_json FROM indert_docs").all() as { data_json: string }[];
        db.exec("DROP TABLE indert_docs;");
        db.exec(`
          CREATE TABLE indert_docs (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            category TEXT NOT NULL,
            document_number TEXT,
            related_block TEXT,
            related_lot TEXT,
            resident_id TEXT,
            resident_name TEXT,
            amount NUMERIC DEFAULT 0,
            date TEXT NOT NULL,
            uploaded_by TEXT,
            file_type TEXT,
            file_name TEXT,
            file_size TEXT,
            status TEXT NOT NULL,
            notes TEXT,
            data_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        const insertDoc = db.prepare(`
          INSERT OR REPLACE INTO indert_docs (
            id, title, category, document_number, related_block, related_lot,
            resident_id, resident_name, amount, date, uploaded_by, file_type,
            file_name, file_size, status, notes, data_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const row of oldRows) {
          try {
            const d = JSON.parse(row.data_json);
            insertDoc.run(
              s(d.id),
              s(d.title, ''),
              s(d.category, 'expediente_indert'),
              s(d.documentNumber, ''),
              s(d.relatedBlock, ''),
              s(d.relatedLot, ''),
              s(d.residentId, ''),
              s(d.residentName, ''),
              s(d.amount, 0),
              s(d.date, ''),
              s(d.uploadedBy, ''),
              s(d.fileType, 'pdf'),
              s(d.fileName, ''),
              s(d.fileSize, ''),
              s(d.status, 'verificado'),
              s(d.notes, ''),
              JSON.stringify(d)
            );
          } catch (e) {
            console.error('[SQLite Migration] Error restaurando indert_doc:', e);
          }
        }
        console.log('[SQLite Migration] indert_docs migrado exitosamente con', oldRows.length, 'registros.');
      }
    }

    // 2. Check land_requests table schema
    const landReqTableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='land_requests'").get();
    if (landReqTableExists) {
      const landCols = db.prepare("PRAGMA table_info(land_requests)").all() as { name: string }[];
      const colNames = landCols.map((c) => c.name);
      if (!colNames.includes('applicant_name')) {
        console.log('[SQLite Migration] Migrando tabla land_requests al nuevo esquema...');
        const oldRows = db.prepare("SELECT data_json FROM land_requests").all() as { data_json: string }[];
        db.exec("DROP TABLE land_requests;");
        db.exec(`
          CREATE TABLE land_requests (
            id TEXT PRIMARY KEY,
            applicant_name TEXT NOT NULL,
            document_id TEXT NOT NULL,
            phone TEXT NOT NULL,
            request_type TEXT NOT NULL,
            barrio TEXT,
            current_block TEXT,
            current_lot TEXT,
            requested_block TEXT,
            requested_lot TEXT,
            target_sector TEXT,
            request_date TEXT NOT NULL,
            status TEXT NOT NULL,
            family_members_count INTEGER NOT NULL,
            decision_notes TEXT,
            reviewed_by TEXT,
            reviewed_at TEXT,
            data_json TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);
        const insertReq = db.prepare(`
          INSERT OR REPLACE INTO land_requests (
            id, applicant_name, document_id, phone, request_type,
            barrio, current_block, current_lot, requested_block, requested_lot,
            target_sector, request_date, status, family_members_count,
            decision_notes, reviewed_by, reviewed_at, data_json
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const row of oldRows) {
          try {
            const lr = JSON.parse(row.data_json);
            insertReq.run(
              s(lr.id),
              s(lr.applicantName, ''),
              s(lr.documentId, ''),
              s(lr.phone, ''),
              s(lr.requestType, 'nuevo_lote'),
              s(lr.barrio, 'Sector 16'),
              s(lr.currentBlock, ''),
              s(lr.currentLot, ''),
              s(lr.requestedBlock, ''),
              s(lr.requestedLot, ''),
              s(lr.targetSector, ''),
              s(lr.requestDate, ''),
              s(lr.status, 'pendiente'),
              s(lr.familyMembersCount, 1),
              s(lr.decisionNotes, ''),
              s(lr.reviewedBy, ''),
              s(lr.reviewedAt, ''),
              JSON.stringify(lr)
            );
          } catch (e) {
            console.error('[SQLite Migration] Error restaurando land_request:', e);
          }
        }
        console.log('[SQLite Migration] land_requests migrado exitosamente con', oldRows.length, 'registros.');
      }
    }
  } catch (migErr) {
    console.error('[SQLite Migration] Error en migración de esquemas:', migErr);
  }
}

function initSchema(db: any) {
  // Run migration on legacy tables if needed
  migrateLegacySchemas(db);

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS residents (
      id TEXT PRIMARY KEY,
      full_name TEXT NOT NULL,
      document_id TEXT NOT NULL,
      phone TEXT,
      barrio TEXT,
      block TEXT NOT NULL,
      lot TEXT NOT NULL,
      sector TEXT,
      occupation_date TEXT,
      status TEXT DEFAULT 'active',
      family_members_count INTEGER DEFAULT 1,
      marital_status TEXT,
      has_partner INTEGER DEFAULT 0,
      partner_name TEXT,
      partner_document_id TEXT,
      children_count INTEGER DEFAULT 0,
      has_children_with_disability INTEGER DEFAULT 0,
      disability_details TEXT,
      document_front_url TEXT,
      document_back_url TEXT,
      previous_settlement_history TEXT,
      is_fraud_risk INTEGER DEFAULT 0,
      fraud_notes TEXT,
      notes TEXT,
      data_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_residents_block_lot ON residents(block, lot);
    CREATE INDEX IF NOT EXISTS idx_residents_document_id ON residents(document_id);

    CREATE TABLE IF NOT EXISTS contributions (
      id TEXT PRIMARY KEY,
      resident_id TEXT NOT NULL,
      resident_name TEXT NOT NULL,
      document_id TEXT,
      block TEXT,
      lot TEXT,
      category TEXT NOT NULL,
      concept TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      amount_paid NUMERIC NOT NULL,
      date TEXT NOT NULL,
      month TEXT NOT NULL,
      status TEXT NOT NULL,
      receipt_number TEXT,
      payment_method TEXT,
      notes TEXT,
      data_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_contributions_resident_id ON contributions(resident_id);
    CREATE INDEX IF NOT EXISTS idx_contributions_month ON contributions(month);

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      date TEXT NOT NULL,
      month TEXT NOT NULL,
      supplier_or_payee TEXT,
      receipt_or_invoice TEXT,
      paid_by_treasurer TEXT,
      status TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS shifts (
      id TEXT PRIMARY KEY,
      task_title TEXT NOT NULL,
      task_category TEXT NOT NULL,
      assigned_resident_id TEXT NOT NULL,
      assigned_resident_name TEXT NOT NULL,
      block TEXT NOT NULL,
      lot TEXT NOT NULL,
      date_scheduled TEXT NOT NULL,
      time_slot TEXT NOT NULL,
      status TEXT NOT NULL,
      fine_amount NUMERIC DEFAULT 0,
      completion_notes TEXT,
      completed_at TEXT,
      data_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS incidents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      reported_by_name TEXT NOT NULL,
      reported_by_resident_id TEXT,
      block TEXT NOT NULL,
      lot TEXT NOT NULL,
      reported_date TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      resolution_notes TEXT,
      assigned_to TEXT,
      resolved_at TEXT,
      data_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS indert_docs (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      document_number TEXT,
      related_block TEXT,
      related_lot TEXT,
      resident_id TEXT,
      resident_name TEXT,
      amount NUMERIC DEFAULT 0,
      date TEXT NOT NULL,
      uploaded_by TEXT,
      file_type TEXT,
      file_name TEXT,
      file_size TEXT,
      status TEXT NOT NULL,
      notes TEXT,
      data_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS land_requests (
      id TEXT PRIMARY KEY,
      applicant_name TEXT NOT NULL,
      document_id TEXT NOT NULL,
      phone TEXT NOT NULL,
      request_type TEXT NOT NULL,
      barrio TEXT,
      current_block TEXT,
      current_lot TEXT,
      requested_block TEXT,
      requested_lot TEXT,
      target_sector TEXT,
      request_date TEXT NOT NULL,
      status TEXT NOT NULL,
      family_members_count INTEGER NOT NULL,
      decision_notes TEXT,
      reviewed_by TEXT,
      reviewed_at TEXT,
      data_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS relocation_records (
      id TEXT PRIMARY KEY,
      resident_id TEXT NOT NULL,
      resident_full_name TEXT NOT NULL,
      resident_document_id TEXT NOT NULL,
      original_block TEXT NOT NULL,
      original_lot TEXT NOT NULL,
      new_block TEXT NOT NULL,
      new_lot TEXT NOT NULL,
      reason TEXT NOT NULL,
      asamblea_acta_number TEXT NOT NULL,
      indert_resolution_number TEXT,
      date TEXT NOT NULL,
      authorized_by TEXT NOT NULL,
      data_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      full_name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      password TEXT,
      role TEXT NOT NULL,
      custom_role_title TEXT,
      assigned_block TEXT,
      barrio TEXT,
      block TEXT,
      lot TEXT,
      created_at_str TEXT,
      last_login TEXT,
      auth_provider TEXT,
      avatar_color TEXT,
      permissions_json TEXT,
      is_super_admin INTEGER DEFAULT 0,
      data_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      author_name TEXT NOT NULL,
      author_role TEXT NOT NULL,
      author_avatar_color TEXT,
      date TEXT NOT NULL,
      content TEXT NOT NULL,
      attached_doc_id TEXT,
      likes INTEGER DEFAULT 0,
      has_liked INTEGER DEFAULT 0,
      badge TEXT,
      badge_type TEXT,
      comments_json TEXT,
      data_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Check if initial seeding is needed
  try {
    const countStmt = db.prepare('SELECT count(*) as count FROM residents');
    const countRow = countStmt.get() as { count: number };
    if (!countRow || countRow.count === 0) {
      console.log('[SQLite] Base de datos vacía. Sembrando datos iniciales de Sector 16...');
      seedInitialData(db);
    } else {
      // Check if posts table specifically needs initial seeding
      const postCountStmt = db.prepare('SELECT count(*) as count FROM posts');
      const postCountRow = postCountStmt.get() as { count: number };
      if (!postCountRow || postCountRow.count === 0) {
        console.log('[SQLite] Sembrando publicaciones iniciales del muro comunitario...');
        seedPosts(db);
      }
    }
  } catch (e) {
    console.error('[SQLite] Error verificando conteo inicial:', e);
  }
}

function seedInitialData(db: any) {
  // Settings
  const insertSettings = db.prepare(
    'INSERT OR REPLACE INTO settings (id, data_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)'
  );
  insertSettings.run('current', JSON.stringify(initialSettings));

  // Residents
  const insertRes = db.prepare(`
    INSERT OR REPLACE INTO residents (
      id, full_name, document_id, phone, barrio, block, lot, sector,
      occupation_date, status, family_members_count, marital_status,
      has_partner, partner_name, partner_document_id, children_count,
      has_children_with_disability, disability_details, document_front_url,
      document_back_url, previous_settlement_history, is_fraud_risk,
      fraud_notes, notes, data_json
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  for (const r of initialResidents) {
    insertRes.run(
      s(r.id),
      s(r.fullName, 'Residente'),
      s(r.documentId, ''),
      s(r.phone, ''),
      s(r.barrio, 'Sector 16'),
      s(r.block, 'A'),
      s(r.lot, '01'),
      s(r.sector, ''),
      s(r.occupationDate, ''),
      s(r.status, 'active'),
      s(r.familyMembersCount, 1),
      s(r.maritalStatus, 'soltero'),
      r.hasPartner ? 1 : 0,
      s(r.partnerName, ''),
      s(r.partnerDocumentId, ''),
      s(r.childrenCount, 0),
      r.hasChildrenWithDisability ? 1 : 0,
      s(r.disabilityDetails, ''),
      s(r.documentFrontUrl, ''),
      s(r.documentBackUrl, ''),
      s(r.previousSettlementHistory, ''),
      r.isFraudRisk ? 1 : 0,
      s(r.fraudNotes, ''),
      s(r.notes, ''),
      JSON.stringify(r)
    );
  }

  // Contributions
  const insertContrib = db.prepare(`
    INSERT OR REPLACE INTO contributions (
      id, resident_id, resident_name, document_id, block, lot,
      category, concept, amount, amount_paid, date, month,
      status, receipt_number, payment_method, notes, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const c of initialContributions) {
    insertContrib.run(
      s(c.id),
      s(c.residentId),
      s(c.residentName, ''),
      s(c.documentId, ''),
      s(c.block, ''),
      s(c.lot, ''),
      s(c.category, 'cuota_social'),
      s(c.concept, ''),
      s(c.amount, 0),
      s(c.amountPaid, 0),
      s(c.date, ''),
      s(c.month, ''),
      s(c.status, 'pending'),
      s(c.receiptNumber, ''),
      s(c.paymentMethod, 'efectivo'),
      s(c.notes, ''),
      JSON.stringify(c)
    );
  }

  // Expenses
  const insertExp = db.prepare(`
    INSERT OR REPLACE INTO expenses (
      id, category, title, description, amount, date, month,
      supplier_or_payee, receipt_or_invoice, paid_by_treasurer,
      status, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const e of initialExpenses) {
    insertExp.run(
      s(e.id),
      s(e.category, 'otro'),
      s(e.title, ''),
      s(e.description, ''),
      s(e.amount, 0),
      s(e.date, ''),
      s(e.month, ''),
      s(e.supplierOrPayee, ''),
      s(e.receiptOrInvoice, ''),
      s(e.paidByTreasurer, ''),
      s(e.status, 'paid'),
      JSON.stringify(e)
    );
  }

  // Shifts
  const insertShift = db.prepare(`
    INSERT OR REPLACE INTO shifts (
      id, task_title, task_category, assigned_resident_id,
      assigned_resident_name, block, lot, date_scheduled, time_slot,
      status, fine_amount, completion_notes, completed_at, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const sh of initialShifts) {
    insertShift.run(
      s(sh.id),
      s(sh.taskTitle, ''),
      s(sh.taskCategory, 'faena_general'),
      s(sh.assignedResidentId, ''),
      s(sh.assignedResidentName, ''),
      s(sh.block, ''),
      s(sh.lot, ''),
      s(sh.dateScheduled, ''),
      s(sh.timeSlot, ''),
      s(sh.status, 'scheduled'),
      s(sh.fineAmount, 0),
      s(sh.completionNotes, ''),
      s(sh.completedAt, ''),
      JSON.stringify(sh)
    );
  }

  // Incidents
  const insertIncident = db.prepare(`
    INSERT OR REPLACE INTO incidents (
      id, title, description, category, reported_by_name,
      reported_by_resident_id, block, lot, reported_date,
      priority, status, resolution_notes, assigned_to, resolved_at, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const inc of initialIncidents) {
    insertIncident.run(
      s(inc.id),
      s(inc.title, ''),
      s(inc.description, ''),
      s(inc.category, 'otro'),
      s(inc.reportedByName, ''),
      s(inc.reportedByResidentId, ''),
      s(inc.block, ''),
      s(inc.lot, ''),
      s(inc.reportedDate, ''),
      s(inc.priority, 'media'),
      s(inc.status, 'abierta'),
      s(inc.resolutionNotes, ''),
      s(inc.assignedTo, ''),
      s(inc.resolvedAt, ''),
      JSON.stringify(inc)
    );
  }

  // INDERT Docs
  const insertDoc = db.prepare(`
    INSERT OR REPLACE INTO indert_docs (
      id, title, category, document_number, related_block, related_lot,
      resident_id, resident_name, amount, date, uploaded_by, file_type,
      file_name, file_size, status, notes, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const d of initialIndertDocuments) {
    insertDoc.run(
      s(d.id),
      s(d.title, ''),
      s(d.category, 'expediente_indert'),
      s(d.documentNumber, ''),
      s(d.relatedBlock, ''),
      s(d.relatedLot, ''),
      s(d.residentId, ''),
      s(d.residentName, ''),
      s(d.amount, 0),
      s(d.date, ''),
      s(d.uploadedBy, ''),
      s(d.fileType, 'pdf'),
      s(d.fileName, ''),
      s(d.fileSize, ''),
      s(d.status, 'verificado'),
      s(d.notes, ''),
      JSON.stringify(d)
    );
  }

  // Land Requests
  const insertReq = db.prepare(`
    INSERT OR REPLACE INTO land_requests (
      id, applicant_name, document_id, phone, request_type,
      barrio, current_block, current_lot, requested_block, requested_lot,
      target_sector, request_date, status, family_members_count,
      decision_notes, reviewed_by, reviewed_at, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const lr of initialLandRequests) {
    insertReq.run(
      s(lr.id),
      s(lr.applicantName, ''),
      s(lr.documentId, ''),
      s(lr.phone, ''),
      s(lr.requestType, 'nuevo_lote'),
      s(lr.barrio, 'Sector 16'),
      s(lr.currentBlock, ''),
      s(lr.currentLot, ''),
      s(lr.requestedBlock, ''),
      s(lr.requestedLot, ''),
      s(lr.targetSector, ''),
      s(lr.requestDate, ''),
      s(lr.status, 'pendiente'),
      s(lr.familyMembersCount, 1),
      s(lr.decisionNotes, ''),
      s(lr.reviewedBy, ''),
      s(lr.reviewedAt, ''),
      JSON.stringify(lr)
    );
  }

  // Users
  const insertUser = db.prepare(`
    INSERT OR REPLACE INTO users (
      id, document_id, full_name, phone, email, password,
      role, custom_role_title, assigned_block, barrio, block, lot,
      created_at_str, last_login, auth_provider, avatar_color,
      permissions_json, is_super_admin, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const u of initialUsers) {
    const rawPw = s(u.password, '');
    const securePw = rawPw ? hashPassword(rawPw) : '';
    const safeObj = { ...u };
    delete safeObj.password;

    insertUser.run(
      s(u.id),
      s(u.documentId, ''),
      s(u.fullName, ''),
      s(u.phone, ''),
      s(u.email, ''),
      securePw,
      s(u.role, 'residente'),
      s(u.customRoleTitle, ''),
      s(u.assignedBlock, ''),
      s(u.barrio, 'Sector 16'),
      s(u.block, ''),
      s(u.lot, ''),
      s(u.createdAt, ''),
      s(u.lastLogin, ''),
      s(u.authProvider, 'local'),
      s(u.avatarColor, ''),
      JSON.stringify(u.permissions || {}),
      u.role === 'admin' ? 1 : 0,
      JSON.stringify(safeObj)
    );
  }

  // 11. Posts
  seedPosts(db);

  console.log('[SQLite] Sembrado exitoso completado en sector16.sqlite');
}

function seedPosts(db: any) {
  const insertPost = db.prepare(`
    INSERT OR REPLACE INTO posts (
      id, author_name, author_role, author_avatar_color, date,
      content, attached_doc_id, likes, has_liked, badge, badge_type,
      comments_json, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const p of initialCommunityPosts) {
    insertPost.run(
      s(p.id),
      s(p.authorName, 'Comisión Vecinal'),
      s(p.authorRole, 'Residente'),
      s(p.authorAvatarColor, 'bg-blue-600'),
      s(p.date, ''),
      s(p.content, ''),
      s(p.attachedDocId, null),
      s(p.likes, 0),
      p.hasLiked ? 1 : 0,
      s(p.badge, null),
      s(p.badgeType, null),
      JSON.stringify(p.comments || []),
      JSON.stringify(p)
    );
  }
}

export function getAllAppStateFromSQLite() {
  const db = getDatabase();

  // Settings
  const settingsRow = db.prepare('SELECT data_json FROM settings WHERE id = ?').get('current') as { data_json: string } | undefined;
  const settings: CommunitySettings = settingsRow ? JSON.parse(settingsRow.data_json) : initialSettings;

  // Posts
  const postsRows = db.prepare('SELECT data_json FROM posts ORDER BY created_at DESC').all() as { data_json: string }[];
  const posts: CommunityPost[] = postsRows.map((p) => JSON.parse(p.data_json));

  // Residents
  const residentsRows = db.prepare('SELECT data_json FROM residents ORDER BY block ASC, lot ASC').all() as { data_json: string }[];
  const residents: Resident[] = residentsRows.map((r) => JSON.parse(r.data_json));

  // Contributions
  const contributionsRows = db.prepare('SELECT data_json FROM contributions ORDER BY date DESC').all() as { data_json: string }[];
  const contributions: Contribution[] = contributionsRows.map((c) => JSON.parse(c.data_json));

  // Expenses
  const expensesRows = db.prepare('SELECT data_json FROM expenses ORDER BY date DESC').all() as { data_json: string }[];
  const expenses: Expense[] = expensesRows.map((e) => JSON.parse(e.data_json));

  // Shifts
  const shiftsRows = db.prepare('SELECT data_json FROM shifts ORDER BY date_scheduled DESC').all() as { data_json: string }[];
  const shifts: MaintenanceShift[] = shiftsRows.map((sh) => JSON.parse(sh.data_json));

  // Incidents
  const incidentsRows = db.prepare('SELECT data_json FROM incidents ORDER BY reported_date DESC').all() as { data_json: string }[];
  const incidents: Incident[] = incidentsRows.map((i) => JSON.parse(i.data_json));

  // INDERT Docs
  const indertDocsRows = db.prepare('SELECT data_json FROM indert_docs ORDER BY date DESC').all() as { data_json: string }[];
  const indertDocs: IndertDocument[] = indertDocsRows.map((d) => JSON.parse(d.data_json));

  // Land Requests
  const landRequestsRows = db.prepare('SELECT data_json FROM land_requests ORDER BY request_date DESC').all() as { data_json: string }[];
  const landRequests: LandRequest[] = landRequestsRows.map((lr) => JSON.parse(lr.data_json));

  // Relocation Records
  const relocationRows = db.prepare('SELECT data_json FROM relocation_records ORDER BY date DESC').all() as { data_json: string }[];
  const relocationRecords: RelocationRecord[] = relocationRows.map((rr) => JSON.parse(rr.data_json));

  // Users (Sanitized: Passwords stripped to prevent exfiltration / data leaks)
  const usersRows = db.prepare('SELECT data_json, password FROM users ORDER BY created_at_str ASC').all() as { data_json: string; password: string }[];
  const users = usersRows.map((u) => {
    const parsed = JSON.parse(u.data_json);
    return sanitizeUser({
      ...parsed,
      password: u.password,
    });
  });

  return {
    residents,
    contributions,
    expenses,
    shifts,
    incidents,
    settings,
    users,
    indertDocs,
    landRequests,
    relocationRecords,
    posts,
  };
}

export function saveAllAppStateToSQLite(appState: any) {
  const db = getDatabase();

  // Begin transaction
  db.exec('BEGIN TRANSACTION;');

  try {
    // 1. Settings
    if (appState.settings) {
      db.prepare('INSERT OR REPLACE INTO settings (id, data_json, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)')
        .run('current', JSON.stringify(appState.settings));
    }

    // 2. Residents
    if (Array.isArray(appState.residents)) {
      db.prepare('DELETE FROM residents').run();
      const insertRes = db.prepare(`
        INSERT OR REPLACE INTO residents (
          id, full_name, document_id, phone, barrio, block, lot, sector,
          occupation_date, status, family_members_count, marital_status,
          has_partner, partner_name, partner_document_id, children_count,
          has_children_with_disability, disability_details, document_front_url,
          document_back_url, previous_settlement_history, is_fraud_risk,
          fraud_notes, notes, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const r of appState.residents) {
        insertRes.run(
          s(r.id),
          s(r.fullName, 'Residente'),
          s(r.documentId, ''),
          s(r.phone, ''),
          s(r.barrio, 'Sector 16'),
          s(r.block, 'A'),
          s(r.lot, '01'),
          s(r.sector, ''),
          s(r.occupationDate, ''),
          s(r.status, 'active'),
          s(r.familyMembersCount, 1),
          s(r.maritalStatus, 'soltero'),
          r.hasPartner ? 1 : 0,
          s(r.partnerName, ''),
          s(r.partnerDocumentId, ''),
          s(r.childrenCount, 0),
          r.hasChildrenWithDisability ? 1 : 0,
          s(r.disabilityDetails, ''),
          s(r.documentFrontUrl, ''),
          s(r.documentBackUrl, ''),
          s(r.previousSettlementHistory, ''),
          r.isFraudRisk ? 1 : 0,
          s(r.fraudNotes, ''),
          s(r.notes, ''),
          JSON.stringify(r)
        );
      }
    }

    // 3. Contributions
    if (Array.isArray(appState.contributions)) {
      db.prepare('DELETE FROM contributions').run();
      const insertContrib = db.prepare(`
        INSERT OR REPLACE INTO contributions (
          id, resident_id, resident_name, document_id, block, lot,
          category, concept, amount, amount_paid, date, month,
          status, receipt_number, payment_method, notes, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const c of appState.contributions) {
        insertContrib.run(
          s(c.id),
          s(c.residentId),
          s(c.residentName, ''),
          s(c.documentId, ''),
          s(c.block, ''),
          s(c.lot, ''),
          s(c.category, 'cuota_social'),
          s(c.concept, ''),
          s(c.amount, 0),
          s(c.amountPaid, 0),
          s(c.date, ''),
          s(c.month, ''),
          s(c.status, 'pending'),
          s(c.receiptNumber, ''),
          s(c.paymentMethod, 'efectivo'),
          s(c.notes, ''),
          JSON.stringify(c)
        );
      }
    }

    // 4. Expenses
    if (Array.isArray(appState.expenses)) {
      db.prepare('DELETE FROM expenses').run();
      const insertExp = db.prepare(`
        INSERT OR REPLACE INTO expenses (
          id, category, title, description, amount, date, month,
          supplier_or_payee, receipt_or_invoice, paid_by_treasurer,
          status, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const e of appState.expenses) {
        insertExp.run(
          s(e.id),
          s(e.category, 'otro'),
          s(e.title, ''),
          s(e.description, ''),
          s(e.amount, 0),
          s(e.date, ''),
          s(e.month, ''),
          s(e.supplierOrPayee, ''),
          s(e.receiptOrInvoice, ''),
          s(e.paidByTreasurer, ''),
          s(e.status, 'paid'),
          JSON.stringify(e)
        );
      }
    }

    // 5. Shifts
    if (Array.isArray(appState.shifts)) {
      db.prepare('DELETE FROM shifts').run();
      const insertShift = db.prepare(`
        INSERT OR REPLACE INTO shifts (
          id, task_title, task_category, assigned_resident_id,
          assigned_resident_name, block, lot, date_scheduled, time_slot,
          status, fine_amount, completion_notes, completed_at, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const sh of appState.shifts) {
        insertShift.run(
          s(sh.id),
          s(sh.taskTitle, ''),
          s(sh.taskCategory, 'faena_general'),
          s(sh.assignedResidentId, ''),
          s(sh.assignedResidentName, ''),
          s(sh.block, ''),
          s(sh.lot, ''),
          s(sh.dateScheduled, ''),
          s(sh.timeSlot, ''),
          s(sh.status, 'scheduled'),
          s(sh.fineAmount, 0),
          s(sh.completionNotes, ''),
          s(sh.completedAt, ''),
          JSON.stringify(sh)
        );
      }
    }

    // 6. Incidents
    if (Array.isArray(appState.incidents)) {
      db.prepare('DELETE FROM incidents').run();
      const insertInc = db.prepare(`
        INSERT OR REPLACE INTO incidents (
          id, title, description, category, reported_by_name,
          reported_by_resident_id, block, lot, reported_date,
          priority, status, resolution_notes, assigned_to, resolved_at, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const inc of appState.incidents) {
        insertInc.run(
          s(inc.id),
          s(inc.title, ''),
          s(inc.description, ''),
          s(inc.category, 'otro'),
          s(inc.reportedByName, ''),
          s(inc.reportedByResidentId, ''),
          s(inc.block, ''),
          s(inc.lot, ''),
          s(inc.reportedDate, ''),
          s(inc.priority, 'media'),
          s(inc.status, 'abierta'),
          s(inc.resolutionNotes, ''),
          s(inc.assignedTo, ''),
          s(inc.resolvedAt, ''),
          JSON.stringify(inc)
        );
      }
    }

    // 7. Indert Docs
    if (Array.isArray(appState.indertDocs)) {
      db.prepare('DELETE FROM indert_docs').run();
      const insertDoc = db.prepare(`
        INSERT OR REPLACE INTO indert_docs (
          id, title, category, document_number, related_block, related_lot,
          resident_id, resident_name, amount, date, uploaded_by, file_type,
          file_name, file_size, status, notes, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const d of appState.indertDocs) {
        insertDoc.run(
          s(d.id),
          s(d.title, ''),
          s(d.category, 'expediente_indert'),
          s(d.documentNumber, ''),
          s(d.relatedBlock, ''),
          s(d.relatedLot, ''),
          s(d.residentId, ''),
          s(d.residentName, ''),
          s(d.amount, 0),
          s(d.date, ''),
          s(d.uploadedBy, ''),
          s(d.fileType, 'pdf'),
          s(d.fileName, ''),
          s(d.fileSize, ''),
          s(d.status, 'verificado'),
          s(d.notes, ''),
          JSON.stringify(d)
        );
      }
    }

    // 8. Land Requests
    if (Array.isArray(appState.landRequests)) {
      db.prepare('DELETE FROM land_requests').run();
      const insertReq = db.prepare(`
        INSERT OR REPLACE INTO land_requests (
          id, applicant_name, document_id, phone, request_type,
          barrio, current_block, current_lot, requested_block, requested_lot,
          target_sector, request_date, status, family_members_count,
          decision_notes, reviewed_by, reviewed_at, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const lr of appState.landRequests) {
        insertReq.run(
          s(lr.id),
          s(lr.applicantName, ''),
          s(lr.documentId, ''),
          s(lr.phone, ''),
          s(lr.requestType, 'nuevo_lote'),
          s(lr.barrio, 'Sector 16'),
          s(lr.currentBlock, ''),
          s(lr.currentLot, ''),
          s(lr.requestedBlock, ''),
          s(lr.requestedLot, ''),
          s(lr.targetSector, ''),
          s(lr.requestDate, ''),
          s(lr.status, 'pendiente'),
          s(lr.familyMembersCount, 1),
          s(lr.decisionNotes, ''),
          s(lr.reviewedBy, ''),
          s(lr.reviewedAt, ''),
          JSON.stringify(lr)
        );
      }
    }

    // 9. Users (Preserves existing password hashes when not updated)
    if (Array.isArray(appState.users)) {
      // Map existing password hashes
      const existingPasswordsMap = new Map<string, string>();
      try {
        const existingRows = db.prepare('SELECT id, password FROM users').all() as { id: string; password: string }[];
        for (const row of existingRows) {
          if (row.password) {
            existingPasswordsMap.set(row.id, row.password);
          }
        }
      } catch {
        // ignore if empty
      }

      db.prepare('DELETE FROM users').run();
      const insertUser = db.prepare(`
        INSERT OR REPLACE INTO users (
          id, document_id, full_name, phone, email, password,
          role, custom_role_title, assigned_block, barrio, block, lot,
          created_at_str, last_login, auth_provider, avatar_color,
          permissions_json, is_super_admin, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const u of appState.users) {
        let securePw = existingPasswordsMap.get(u.id) || '';
        if (u.password && typeof u.password === 'string' && u.password.trim()) {
          securePw = u.password.startsWith('scrypt:') ? u.password : hashPassword(u.password.trim());
        }

        const safeObj = { ...u };
        delete safeObj.password;

        insertUser.run(
          s(u.id),
          s(u.documentId, ''),
          s(u.fullName, ''),
          s(u.phone, ''),
          s(u.email, ''),
          securePw,
          s(u.role, 'residente'),
          s(u.customRoleTitle, ''),
          s(u.assignedBlock, ''),
          s(u.barrio, 'Sector 16'),
          s(u.block, ''),
          s(u.lot, ''),
          s(u.createdAt, ''),
          s(u.lastLogin, ''),
          s(u.authProvider, 'local'),
          s(u.avatarColor, ''),
          JSON.stringify(u.permissions || {}),
          u.role === 'admin' ? 1 : 0,
          JSON.stringify(safeObj)
        );
      }
    }

    // 10. Relocations
    if (Array.isArray(appState.relocationRecords)) {
      db.prepare('DELETE FROM relocation_records').run();
      const insertReloc = db.prepare(`
        INSERT OR REPLACE INTO relocation_records (
          id, resident_id, resident_full_name, resident_document_id,
          original_block, original_lot, new_block, new_lot,
          reason, asamblea_acta_number, indert_resolution_number,
          date, authorized_by, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const rr of appState.relocationRecords) {
        insertReloc.run(
          s(rr.id),
          s(rr.residentId),
          s(rr.residentFullName, ''),
          s(rr.residentDocumentId, ''),
          s(rr.originalBlock, ''),
          s(rr.originalLot, ''),
          s(rr.newBlock, ''),
          s(rr.newLot, ''),
          s(rr.reason, ''),
          s(rr.asambleaActaNumber, ''),
          s(rr.indertResolutionNumber, ''),
          s(rr.date, ''),
          s(rr.authorizedBy, ''),
          JSON.stringify(rr)
        );
      }
    }

    // 11. Community Posts
    if (Array.isArray(appState.posts)) {
      db.prepare('DELETE FROM posts').run();
      const insertPost = db.prepare(`
        INSERT OR REPLACE INTO posts (
          id, author_name, author_role, author_avatar_color, date,
          content, attached_doc_id, likes, has_liked, badge, badge_type,
          comments_json, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const p of appState.posts) {
        insertPost.run(
          s(p.id),
          s(p.authorName, 'Comisión Vecinal'),
          s(p.authorRole, 'Residente'),
          s(p.authorAvatarColor, 'bg-blue-600'),
          s(p.date, ''),
          s(p.content, ''),
          s(p.attachedDocId, null),
          s(p.likes, 0),
          p.hasLiked ? 1 : 0,
          s(p.badge, null),
          s(p.badgeType, null),
          JSON.stringify(p.comments || []),
          JSON.stringify(p)
        );
      }
    }

    db.exec('COMMIT;');
    return true;
  } catch (err) {
    db.exec('ROLLBACK;');
    console.error('[SQLite] Error guardando estado:', err);
    throw err;
  }
}

export function executeCustomSQLQuery(query: string) {
  const db = getDatabase();
  const trimmed = query.trim();

  // Validate query against SQL injection firewall
  const safetyCheck = validateSQLQuerySafety(trimmed);
  if (!safetyCheck.isSafe) {
    return {
      success: false,
      error: `[Firewall de Seguridad] ${safetyCheck.reason}`,
      timestamp: new Date().toISOString(),
    };
  }

  // Check if it's a SELECT / PRAGMA query
  const isSelect = /^(SELECT|PRAGMA|EXPLAIN)/i.test(trimmed);

  if (isSelect) {
    const stmt = db.prepare(trimmed);
    const rawRows = stmt.all();
    const rows = redactSensitiveSQLRows(rawRows);
    const columns = rows.length > 0 ? Object.keys(rows[0] as object) : [];
    return {
      success: true,
      isSelect: true,
      columns,
      rows,
      rowCount: rows.length,
      timestamp: new Date().toISOString(),
    };
  } else {
    // Non-select: INSERT, UPDATE, DELETE, CREATE, etc.
    const stmt = db.prepare(trimmed);
    const info = stmt.run();
    return {
      success: true,
      isSelect: false,
      changes: info.changes,
      lastInsertRowid: info.lastInsertRowid ? String(info.lastInsertRowid) : null,
      message: `Comando SQL ejecutado con éxito. Filas afectadas: ${info.changes}`,
      timestamp: new Date().toISOString(),
    };
  }
}

export function getSQLiteStats() {
  const db = getDatabase();

  const getTableCount = (tbl: string) => {
    try {
      const row = db.prepare(`SELECT count(*) as c FROM ${tbl}`).get() as { c: number };
      return row ? row.c : 0;
    } catch {
      return 0;
    }
  };

  const tables = [
    { name: 'residents', label: 'Padrón de Residentes', count: getTableCount('residents') },
    { name: 'contributions', label: 'Aportes y Cuotas', count: getTableCount('contributions') },
    { name: 'expenses', label: 'Egresos Comunitarios', count: getTableCount('expenses') },
    { name: 'shifts', label: 'Faenas y Mingas', count: getTableCount('shifts') },
    { name: 'incidents', label: 'Reclamos e Incidencias', count: getTableCount('incidents') },
    { name: 'indert_docs', label: 'Expedientes INDERT', count: getTableCount('indert_docs') },
    { name: 'land_requests', label: 'Solicitudes de Terreno', count: getTableCount('land_requests') },
    { name: 'users', label: 'Cuentas y Accesos', count: getTableCount('users') },
    { name: 'relocation_records', label: 'Actas de Reubicación', count: getTableCount('relocation_records') },
    { name: 'posts', label: 'Muro Comunitario (Publicaciones)', count: getTableCount('posts') },
    { name: 'settings', label: 'Configuración Comunal', count: getTableCount('settings') },
  ];

  let fileSize = 0;
  if (fs.existsSync(DB_FILE)) {
    fileSize = fs.statSync(DB_FILE).size;
  }

  let journalMode = 'wal';
  try {
    const jm = db.prepare('PRAGMA journal_mode;').get() as any;
    journalMode = jm ? (Object.values(jm)[0] as string) : 'wal';
  } catch {
    // ignore
  }

  let sqliteVersion = '3.x';
  try {
    const ver = db.prepare('SELECT sqlite_version() as v;').get() as any;
    sqliteVersion = ver?.v || '3.x';
  } catch {
    // ignore
  }

  return {
    databaseName: 'sector16.sqlite',
    filePath: DB_FILE,
    fileSizeBytes: fileSize,
    fileSizeFormatted: `${(fileSize / 1024).toFixed(1)} KB`,
    journalMode,
    sqliteVersion,
    engine: 'SQLite 3 (Nativo Node.js 22 Sync)',
    tables,
    totalRecords: tables.reduce((acc, t) => acc + t.count, 0),
    timestamp: new Date().toISOString(),
  };
}

export function resetSQLiteDatabase() {
  const db = getDatabase();
  db.exec('DELETE FROM residents;');
  db.exec('DELETE FROM contributions;');
  db.exec('DELETE FROM expenses;');
  db.exec('DELETE FROM shifts;');
  db.exec('DELETE FROM incidents;');
  db.exec('DELETE FROM indert_docs;');
  db.exec('DELETE FROM land_requests;');
  db.exec('DELETE FROM relocation_records;');
  db.exec('DELETE FROM users;');
  db.exec('DELETE FROM posts;');
  db.exec('DELETE FROM settings;');
  seedInitialData(db);
  return getAllAppStateFromSQLite();
}

export function getDatabaseBuffer(): Buffer {
  if (!fs.existsSync(DB_FILE)) {
    getDatabase();
  }
  return fs.readFileSync(DB_FILE);
}

export function getDatabasePath(): string {
  return DB_FILE;
}

/**
 * Server-Side Authentication Database Helpers
 */
export function findUserForAuth(identifier: string): { user: UserAccount; storedPasswordHash: string } | null {
  const db = getDatabase();
  const clean = identifier.trim().toLowerCase();

  // Search by document_id, email, or id
  const row = db
    .prepare(
      `SELECT data_json, password FROM users 
       WHERE LOWER(document_id) = ? 
          OR LOWER(email) = ? 
          OR id = ? 
          OR (id = 'user-admin' AND ? = 'admin')
          OR (role = 'admin' AND ? = 'admin')
       LIMIT 1`
    )
    .get(clean, clean, clean, clean, clean) as { data_json: string; password: string } | undefined;

  if (!row) return null;

  try {
    const user: UserAccount = JSON.parse(row.data_json);
    return {
      user,
      storedPasswordHash: row.password || '',
    };
  } catch {
    return null;
  }
}

export function updateUserPasswordInDB(userId: string, hashedPassword: string): boolean {
  const db = getDatabase();
  const res = db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashedPassword, userId);
  return res.changes > 0;
}

export function registerNewUserInDB(user: UserAccount, hashedPassword: string): boolean {
  const db = getDatabase();
  const safeObj = { ...user };
  delete safeObj.password;

  const insertUser = db.prepare(`
    INSERT INTO users (
      id, document_id, full_name, phone, email, password,
      role, custom_role_title, assigned_block, barrio, block, lot,
      created_at_str, last_login, auth_provider, avatar_color,
      permissions_json, is_super_admin, data_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertUser.run(
    s(user.id),
    s(user.documentId, ''),
    s(user.fullName, ''),
    s(user.phone, ''),
    s(user.email, ''),
    hashedPassword,
    s(user.role, 'residente'),
    s(user.customRoleTitle, ''),
    s(user.assignedBlock, ''),
    s(user.barrio, 'Sector 16'),
    s(user.block, ''),
    s(user.lot, ''),
    s(user.createdAt, ''),
    s(user.lastLogin, ''),
    s(user.authProvider, 'local'),
    s(user.avatarColor, 'bg-blue-600'),
    JSON.stringify(user.permissions || {}),
    user.role === 'admin' ? 1 : 0,
    JSON.stringify(safeObj)
  );

  return true;
}

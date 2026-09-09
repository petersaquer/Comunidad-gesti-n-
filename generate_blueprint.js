import fs from 'fs';

const blueprint = {
  "entities": {
    "Resident": {
      "title": "Resident",
      "description": "A resident in the community",
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "fullName": { "type": "string" },
        "documentId": { "type": "string" },
        "phone": { "type": "string" },
        "barrio": { "type": "string" },
        "block": { "type": "string" },
        "lot": { "type": "string" },
        "sector": { "type": "string" },
        "occupationDate": { "type": "string" },
        "status": { "type": "string", "enum": ["titular_provisorio", "titular_definitivo", "ocupante_censado", "inactivo"] },
        "familyMembersCount": { "type": "number" },
        "maritalStatus": { "type": "string", "enum": ["soltero", "casado", "unido", "divorciado", "viudo"] },
        "hasPartner": { "type": "boolean" },
        "partnerName": { "type": "string" },
        "partnerDocumentId": { "type": "string" },
        "childrenCount": { "type": "number" },
        "hasChildrenWithDisability": { "type": "boolean" },
        "disabilityDetails": { "type": "string" },
        "documentFrontUrl": { "type": "string" },
        "documentBackUrl": { "type": "string" },
        "previousSettlementHistory": { "type": "string" },
        "isFraudRisk": { "type": "boolean" },
        "fraudNotes": { "type": "string" },
        "notes": { "type": "string" }
      },
      "required": ["id", "fullName", "documentId", "block", "lot", "status"]
    },
    "Meeting": {
      "title": "Meeting",
      "description": "Community meeting or assembly",
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "title": { "type": "string" },
        "date": { "type": "string" },
        "status": { "type": "string", "enum": ["scheduled", "active", "completed"] },
        "attendees": { "type": "array", "items": { "type": "string" } },
        "createdAt": { "type": "string" }
      },
      "required": ["id", "title", "date", "status", "attendees", "createdAt"]
    },
    "UserAccount": {
      "title": "UserAccount",
      "description": "System user account",
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "username": { "type": "string" },
        "documentId": { "type": "string" },
        "fullName": { "type": "string" },
        "phone": { "type": "string" },
        "email": { "type": "string" },
        "role": { "type": "string", "enum": ["admin", "tesorera", "secretaria", "delegado", "sindico", "directiva", "residente"] },
        "customRoleTitle": { "type": "string" },
        "assignedBlock": { "type": "string" },
        "permissions": { "type": "object" },
        "badgeLabel": { "type": "string" },
        "barrio": { "type": "string" },
        "block": { "type": "string" },
        "lot": { "type": "string" },
        "residentId": { "type": "string" },
        "password": { "type": "string" },
        "createdAt": { "type": "string" },
        "lastLogin": { "type": "string" },
        "avatarColor": { "type": "string" },
        "authProvider": { "type": "string" },
        "googlePhotoUrl": { "type": "string" }
      },
      "required": ["id", "documentId", "fullName", "phone", "role", "createdAt"]
    },
    "CommunityPost": {
      "title": "CommunityPost",
      "description": "Post on the community feed",
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "authorName": { "type": "string" },
        "authorRole": { "type": "string" },
        "authorAvatarColor": { "type": "string" },
        "date": { "type": "string" },
        "content": { "type": "string" },
        "attachedDocId": { "type": "string" },
        "likes": { "type": "number" },
        "hasLiked": { "type": "boolean" },
        "comments": { "type": "array" },
        "badge": { "type": "string" },
        "badgeType": { "type": "string" }
      },
      "required": ["id", "authorName", "authorRole", "authorAvatarColor", "date", "content", "likes", "comments"]
    },
    "Contribution": {
      "title": "Contribution",
      "description": "Financial contribution from a resident",
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "residentId": { "type": "string" },
        "residentName": { "type": "string" },
        "documentId": { "type": "string" },
        "block": { "type": "string" },
        "lot": { "type": "string" },
        "category": { "type": "string" },
        "concept": { "type": "string" },
        "amount": { "type": "number" },
        "amountPaid": { "type": "number" },
        "month": { "type": "string" },
        "date": { "type": "string" },
        "receiptNumber": { "type": "string" },
        "paymentMethod": { "type": "string" },
        "status": { "type": "string", "enum": ["paid", "pending", "partial"] },
        "notes": { "type": "string" }
      },
      "required": ["id", "residentId", "amount", "status"]
    },
    "Expense": {
      "title": "Expense",
      "description": "Community expense",
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "category": { "type": "string" },
        "title": { "type": "string" },
        "description": { "type": "string" },
        "amount": { "type": "number" },
        "date": { "type": "string" },
        "month": { "type": "string" },
        "supplierOrPayee": { "type": "string" },
        "receiptOrInvoice": { "type": "string" },
        "status": { "type": "string", "enum": ["paid", "pending"] },
        "paidByTreasurer": { "type": "string" }
      },
      "required": ["id", "amount", "status", "title"]
    },
    "IndertDocument": {
      "title": "IndertDocument",
      "description": "Document related to INDERT",
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "title": { "type": "string" },
        "category": { "type": "string" },
        "documentNumber": { "type": "string" },
        "relatedBlock": { "type": "string" },
        "relatedLot": { "type": "string" },
        "residentId": { "type": "string" },
        "residentName": { "type": "string" },
        "amount": { "type": "number" },
        "date": { "type": "string" },
        "uploadedBy": { "type": "string" },
        "fileType": { "type": "string" },
        "fileName": { "type": "string" },
        "fileSize": { "type": "string" },
        "fileData": { "type": "string" },
        "notes": { "type": "string" },
        "status": { "type": "string" },
        "fileUrl": { "type": "string", "description": "Download URL for file in Cloud Storage" }
      },
      "required": ["id", "title", "category", "documentNumber"]
    },
    "LandRequest": {
      "title": "LandRequest",
      "description": "Request for land allocation",
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "applicantName": { "type": "string" },
        "documentId": { "type": "string" },
        "phone": { "type": "string" },
        "familyMembersCount": { "type": "number" },
        "previousLocation": { "type": "string" },
        "reasonForRequest": { "type": "string" },
        "requestDate": { "type": "string" },
        "status": { "type": "string", "enum": ["pending", "approved", "rejected", "waitlist"] },
        "notes": { "type": "string" },
        "assignedBlock": { "type": "string" },
        "assignedLot": { "type": "string" },
        "reviewedBy": { "type": "string" },
        "reviewedAt": { "type": "string" }
      },
      "required": ["id", "applicantName", "status"]
    },
    "MaintenanceShift": {
      "title": "MaintenanceShift",
      "description": "Assigned maintenance shift",
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "taskTitle": { "type": "string" },
        "taskCategory": { "type": "string" },
        "assignedResidentId": { "type": "string" },
        "assignedResidentName": { "type": "string" },
        "block": { "type": "string" },
        "lot": { "type": "string" },
        "dateScheduled": { "type": "string" },
        "timeSlot": { "type": "string" },
        "status": { "type": "string", "enum": ["scheduled", "completed", "absent", "replaced", "fined"] },
        "completionNotes": { "type": "string" },
        "fineAmount": { "type": "number" },
        "completedAt": { "type": "string" }
      },
      "required": ["id", "taskTitle", "assignedResidentId", "status"]
    },
    "Incident": {
      "title": "Incident",
      "description": "Reported incident",
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "title": { "type": "string" },
        "description": { "type": "string" },
        "category": { "type": "string" },
        "reportedByResidentId": { "type": "string" },
        "reportedByName": { "type": "string" },
        "block": { "type": "string" },
        "lot": { "type": "string" },
        "reportedDate": { "type": "string" },
        "priority": { "type": "string", "enum": ["baja", "media", "alta", "urgente"] },
        "status": { "type": "string", "enum": ["abierta", "en_proceso", "resuelta"] },
        "resolutionNotes": { "type": "string" },
        "assignedTo": { "type": "string" },
        "resolvedAt": { "type": "string" }
      },
      "required": ["id", "title", "priority", "status"]
    },
    "RelocationRecord": {
      "title": "RelocationRecord",
      "description": "Record of a resident relocation",
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "residentId": { "type": "string" },
        "residentName": { "type": "string" },
        "oldBlock": { "type": "string" },
        "oldLot": { "type": "string" },
        "newBlock": { "type": "string" },
        "newLot": { "type": "string" },
        "date": { "type": "string" },
        "reason": { "type": "string" },
        "actNumber": { "type": "string" },
        "approvedBy": { "type": "string" }
      },
      "required": ["id", "residentId", "date"]
    }
  },
  "firestore": {
    "/residents/{residentId}": {
      "schema": { "$ref": "#/entities/Resident" },
      "description": "Stores resident records"
    },
    "/meetings/{meetingId}": {
      "schema": { "$ref": "#/entities/Meeting" },
      "description": "Stores community meetings"
    },
    "/users/{userId}": {
      "schema": { "$ref": "#/entities/UserAccount" },
      "description": "Stores user accounts"
    },
    "/posts/{postId}": {
      "schema": { "$ref": "#/entities/CommunityPost" },
      "description": "Stores community feed posts"
    },
    "/contributions/{contributionId}": {
      "schema": { "$ref": "#/entities/Contribution" },
      "description": "Stores resident financial contributions"
    },
    "/expenses/{expenseId}": {
      "schema": { "$ref": "#/entities/Expense" },
      "description": "Stores community expenses"
    },
    "/indert_docs/{docId}": {
      "schema": { "$ref": "#/entities/IndertDocument" },
      "description": "Stores INDERT related documents"
    },
    "/land_requests/{requestId}": {
      "schema": { "$ref": "#/entities/LandRequest" },
      "description": "Stores land allocation requests"
    },
    "/shifts/{shiftId}": {
      "schema": { "$ref": "#/entities/MaintenanceShift" },
      "description": "Stores maintenance shifts and tasks"
    },
    "/incidents/{incidentId}": {
      "schema": { "$ref": "#/entities/Incident" },
      "description": "Stores reported incidents"
    },
    "/relocation_records/{recordId}": {
      "schema": { "$ref": "#/entities/RelocationRecord" },
      "description": "Stores resident relocation records"
    }
  }
};

fs.writeFileSync('firebase-blueprint.json', JSON.stringify(blueprint, null, 2));

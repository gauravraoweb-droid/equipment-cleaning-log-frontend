export interface Equipment {
  id: string;
  name: string;
  code: string;
  status: 'ACTIVE' | 'RETIRED';
}

export interface CleaningRecord {
  id: string;
  equipmentId: string;
  equipment?: Equipment;
  cleanedBy: string;
  cleanedAt: string;
  method: string;
  notes?: string;
  status: 'PENDING' | 'VERIFIED';
}

export interface AuditEntry {
  id: string;
  recordId: string;
  changedBy: string;
  changedAt: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
}
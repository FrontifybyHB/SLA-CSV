export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface StatsSummary {
  datasetIds: string[];
  totalSlots: number;
  uptimeSeconds: number;
  downtimeSeconds: number;
  unknownSeconds: number;
  availabilityPct: number;
  averageLatencyMs: number | null;
  counts: {
    up: number;
    down: number;
    unknown: number;
    mixed: number;
  };
}

export interface ObservationLog {
  row: number;
  datasetId: string;
  service: string;
  agentId: string;
  timestamp: Date;
  latencyMs: number | null;
  status: string;
  region: string | null;
}

export interface IssueRecord {
  id: number;
  datasetId: string;
  rowNumber: number;
  field: string;
  message: string;
}

export interface IssuesResult {
  issues: IssueRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface LogsResult {
  observations: ObservationLog[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SlotRecordRow {
  datasetId: string;
  service: string;
  slotKey: string;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  uptimeSeconds: number;
  downtimeSeconds: number;
  unknownSeconds: number;
  averageLatencyMs: number | null;
  status: string;
}

export interface SlotsResult {
  slots: SlotRecordRow[];
  total: number;
  page: number;
  pageSize: number;
  from: Date;
  to: Date;
}
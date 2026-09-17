export type AgentId = "agent1" | "agent2" | "agent3";

export type AvailabilityStatus = "up" | "down" | "unknown";

export type RawStatus = string;

export interface RawObservation {
  agentId: AgentId;
  timestamp: string;
  latency: string;
  status: RawStatus;
}

export interface ParsedObservation {
  agentId: AgentId;
  timestamp: Date;
  latencyMs: number | null;
  status: AvailabilityStatus;
}

export type SlotKey = string;

export interface SlotObservation {
  agentId: AgentId;
  timestamp: string;
  latencyMs: number | null;
  status: AvailabilityStatus | null;
}

export interface ResolvedSlot {
  slotKey: SlotKey;
  startTime: Date;
  endTime: Date;
  durationSeconds: number;
  uptimeSeconds: number;
  downtimeSeconds: number;
  unknownSeconds: number;
  averageLatencyMs: number | null;
}

export interface DataQualityIssue {
  row: number;
  field: string;
  message: string;
}

export interface CsvParseResult {
  observations: RawObservation[];
  issues: DataQualityIssue[];
}

export interface ChecklistUsage {
  format: string;
  version: string;
  startDate: Date;
  endDate: Date;
  agentCount: number;
}

export interface PreparedImport {
  userId: string;
  filename: string;
  fileHash: string;
  policyVersion: string;
  checklist: ChecklistUsage;
  observations: ParsedObservation[];
  slots: ResolvedSlot[];
  issues: DataQualityIssue[];
}

export type SlotStatus = "up" | "down" | "unknown" | "mixed";

export interface AgentSlotData {
  agentId: AgentId;
  observations: SlotObservation[];
}

export interface SlotAnalysis {
  slotKey: SlotKey;
  agents: AgentSlotData[];
  resolved: SlotStatus;
  uptimeSeconds: number;
  downtimeSeconds: number;
  unknownSeconds: number;
  averageLatencyMs: number | null;
}

export interface PreparedSlot {
  slotKey: SlotKey;
  durationSeconds: number;
  startTime: Date;
  endTime: Date;
}

export interface ImportInput {
  bytes: Buffer;
  filename: string;
}

export type ImportResult =
  | {
      duplicate: true;
      datasetId: string;
      uploadedAt: Date;
    }
  | {
      duplicate: false;
      datasetId: string;
      observationCount: number;
      slotCount: number;
      issueCount: number;
      fileHash: string;
      policyVersion: string;
      startDate: Date;
      endDate: Date;
    };
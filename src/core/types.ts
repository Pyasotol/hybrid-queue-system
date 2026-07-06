// ============================================================
//  core/types.ts — Shared types and interfaces for the entire
//  Hybrid Queue System. Every module imports from here.
// ============================================================

export type QueueSource = 'PHYSICAL_HARDWARE' | 'DIGITAL_APP';
export type Priority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'LOW';

export interface QueueEvent {
  id: string;
  source: QueueSource;
  type: string;
  payload: Record<string, unknown>;
  priority: Priority;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
}

export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  match: { source?: QueueSource; type: string | string[]; priority?: Priority; };
  actions: WorkflowAction[];
  enabled: boolean;
}

export interface WorkflowAction {
  type: 'EMIT_EVENT' | 'TRIGGER_GATE' | 'ROTATE_PLATE' | 'LOG_AUDIT' | 'NOTIFY' | 'RETRY';
  target?: string;
  params?: Record<string, unknown>;
  delayMs?: number;
}

export type GateStage = 'IDLE' | 'APPROACH' | 'VERIFY' | 'OPEN' | 'OCCUPIED' | 'CLOSING' | 'LOCKED';

export interface GateState {
  stage: GateStage;
  lastTransition: Date;
  ceremonyMode: boolean;
  unlockSource?: QueueSource;
  transitionCount: number;
}

export type Season = 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER';

export interface PlateState {
  current: Season;
  previous: Season | null;
  lastRotation: Date;
  rotationCount: number;
  manualOverride: boolean;
  nextScheduled: Date;
}

export type AuditCategory = 'QUEUE' | 'GATE' | 'PLATE' | 'WORKFLOW' | 'SYSTEM';

export interface AuditEntry {
  id: string;
  category: AuditCategory;
  event: string;
  source: QueueSource | 'SYSTEM';
  data: Record<string, unknown>;
  timestamp: Date;
  severity: 'INFO' | 'WARN' | 'ERROR';
}

export interface SystemState {
  gate: GateState;
  plate: PlateState;
  physicalQueueDepth: number;
  digitalQueueDepth: number;
  workflowEngineRunning: boolean;
  uptimeSince: Date;
}

export interface SystemConfig {
  queue: { maxDepth: number; processingIntervalMs: number; retryBackoffMs: number; };
  gate: { verifyTimeoutMs: number; openDurationMs: number; ceremonyDelayMs: number; };
  plate: { autoRotate: boolean; rotationSchedule: Record<Season, string>; };
  mqtt: { brokerUrl: string; topicPrefix: string; };
  api: { port: number; host: string; };
  }

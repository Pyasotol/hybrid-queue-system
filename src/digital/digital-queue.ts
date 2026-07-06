// ============================================================
//  digital/digital-queue.ts — DIGITAL_APP queue.
//  Wraps the shared QueueProcessor and provides typed helpers
//  for app-layer events: user actions, remote commands, etc.
// ============================================================

import { QueueProcessor } from '../core/queue-processor';
import { SystemConfig, Priority } from '../core/types';

export const APP_EVENTS = {
  USER_ACTION:      'USER_ACTION',
  REMOTE_COMMAND:   'REMOTE_COMMAND',
  GATE_UNLOCK_REQ:  'GATE_UNLOCK_REQ',
  PLATE_ROTATE_REQ: 'PLATE_ROTATE_REQ',
  STATE_QUERY:      'STATE_QUERY',
  CEREMONY_TOGGLE:  'CEREMONY_TOGGLE',
  ADMIN_OVERRIDE:   'ADMIN_OVERRIDE',
  WEBHOOK_INBOUND:  'WEBHOOK_INBOUND',
} as const;

export type AppEventType = typeof APP_EVENTS[keyof typeof APP_EVENTS];

export class DigitalAppQueue {
  readonly processor: QueueProcessor;
  private readonly config: SystemConfig;

  constructor(config: SystemConfig) {
    this.config = config;
    this.processor = new QueueProcessor('DIGITAL_APP', config.queue);
  }

  // ─── Typed Emission Helpers ──────────────────────────────

  emit(
    type: string,
    payload: Record<string, unknown> = {},
    priority: Priority = 'NORMAL'
  ) {
    return this.processor.enqueue(type, { ...payload, _app: true }, priority);
  }

  /** User presses a button or takes an action in the app. */
  userAction(userId: string, action: string, meta: Record<string, unknown> = {}) {
    return this.emit(APP_EVENTS.USER_ACTION, { userId, action, ...meta }, 'NORMAL');
  }

  /** Request gate unlock from the app. */
  requestGateUnlock(userId: string, reason: string) {
    return this.emit(
      APP_EVENTS.GATE_UNLOCK_REQ,
      { userId, reason },
      'HIGH'
    );
  }

  /** Request a plate rotation from the app. */
  requestPlateRotate(userId: string, targetSeason?: string) {
    return this.emit(
      APP_EVENTS.PLATE_ROTATE_REQ,
      { userId, targetSeason },
      'NORMAL'
    );
  }

  /** Toggle ceremony mode from the app. */
  toggleCeremony(userId: string, enabled: boolean) {
    return this.emit(
      APP_EVENTS.CEREMONY_TOGGLE,
      { userId, enabled },
      'HIGH'
    );
  }

  /** Admin override — highest priority, bypasses normal rules. */
  adminOverride(adminId: string, command: string, params: Record<string, unknown> = {}) {
    return this.emit(
      APP_EVENTS.ADMIN_OVERRIDE,
      { adminId, command, ...params },
      'CRITICAL'
    );
  }

  /** Inbound webhook (e.g. from external integrations). */
  webhookInbound(source: string, data: Record<string, unknown>) {
    return this.emit(APP_EVENTS.WEBHOOK_INBOUND, { source, data }, 'NORMAL');
  }

  // ─── Lifecycle ────────────────────────────────────────────

  start(): void { this.processor.start(); }
  stop():  void { this.processor.stop();  }

  get depth() { return this.processor.depth; }
}

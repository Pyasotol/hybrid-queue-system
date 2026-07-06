import { EventEmitter } from 'events';
import { QueueEvent, AuditEntry } from './types';

export type SystemEventMap = {
  'queue:enqueue':     [event: QueueEvent];
  'queue:dequeue':     [event: QueueEvent];
  'queue:retry':       [event: QueueEvent];
  'queue:dead-letter': [event: QueueEvent];
  'gate:approach':     [source: string];
  'gate:verify':       [source: string];
  'gate:open':         [source: string];
  'gate:close':        [source: string];
  'gate:lock':         [source: string];
  'gate:unlock':       [source: string];
  'gate:occupy':       [source: string];
  'gate:ceremony':     [source: string];
  'plate:rotate':      [from: string, to: string, reason: string];
  'plate:scheduled':   [nextSeason: string, fireAt: Date];
  'workflow:rule-matched': [ruleId: string, event: QueueEvent];
  'workflow:action-done':  [ruleId: string, actionType: string];
  'workflow:conflict':     [event1: QueueEvent, event2: QueueEvent];
  'audit:entry': [entry: AuditEntry];
  'system:ready':    [];
  'system:shutdown': [];
  'system:error':    [error: Error, context: string];
};

class HybridEventBus extends EventEmitter {
  private static instance: HybridEventBus;
  private constructor() { super(); this.setMaxListeners(50); }

  static getInstance(): HybridEventBus {
    if (!HybridEventBus.instance) HybridEventBus.instance = new HybridEventBus();
    return HybridEventBus.instance;
  }

  publish<K extends keyof SystemEventMap>(event: K, ...args: SystemEventMap[K]): boolean {
    return this.emit(event, ...args);
  }

  subscribe<K extends keyof SystemEventMap>(event: K, listener: (...args: SystemEventMap[K]) => void): this {
    return this.on(event, listener as (...args: unknown[]) => void);
  }

  subscribeOnce<K extends keyof SystemEventMap>(event: K, listener: (...args: SystemEventMap[K]) => void): this {
    return this.once(event, listener as (...args: unknown[]) => void);
  }

  unsubscribe<K extends keyof SystemEventMap>(event: K, listener: (...args: SystemEventMap[K]) => void): this {
    return this.off(event, listener as (...args: unknown[]) => void);
  }
}

export const eventBus = HybridEventBus.getInstance();

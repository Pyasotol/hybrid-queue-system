// ============================================================
//  core/queue-processor.ts — Shared priority queue processor.
//  Both PHYSICAL_HARDWARE and DIGITAL_APP queues run through
//  this processor. Items are dequeued, processed by the
//  Workflow Engine, and retried or dead-lettered on failure.
// ============================================================

import { randomUUID } from 'crypto';
import { QueueEvent, QueueSource, Priority, SystemConfig } from './types';
import { eventBus } from './event-bus';

const PRIORITY_WEIGHT: Record<Priority, number> = {
  CRITICAL: 0,
  HIGH:     1,
  NORMAL:   2,
  LOW:      3,
};

export type EventHandler = (event: QueueEvent) => Promise<void>;

export class QueueProcessor {
  private readonly source: QueueSource;
  private readonly config: SystemConfig['queue'];
  private queue: QueueEvent[] = [];
  private deadLetterQueue: QueueEvent[] = [];
  private handler: EventHandler | null = null;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private running = false;

  constructor(source: QueueSource, config: SystemConfig['queue']) {
    this.source = source;
    this.config = config;
  }

  /** Register the single workflow handler for this queue. */
  setHandler(handler: EventHandler): void {
    this.handler = handler;
  }

  enqueue(
    type: string,
    payload: Record<string, unknown>,
    priority: Priority = 'NORMAL',
    maxRetries = 3
  ): QueueEvent {
    if (this.queue.length >= this.config.maxDepth) {
      throw new Error(`[${this.source}] Queue depth limit reached (${this.config.maxDepth})`);
    }
    const event: QueueEvent = {
      id:         randomUUID(),
      source:     this.source,
      type,
      payload,
      priority,
      timestamp:  new Date(),
      retryCount: 0,
      maxRetries,
    };
    this.queue.push(event);
    this.sortQueue();
    eventBus.publish('queue:enqueue', event);
    return event;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.tickInterval = setInterval(
      () => this.tick(),
      this.config.processingIntervalMs
    );
    console.info(`[${this.source}] Queue processor started`);
  }

  stop(): void {
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    this.running = false;
    console.info(`[${this.source}] Queue processor stopped (${this.queue.length} items remaining)`);
  }

  private async tick(): Promise<void> {
    if (this.queue.length === 0 || !this.handler) return;
    const event = this.queue.shift()!;
    eventBus.publish('queue:dequeue', event);
    try {
      await this.handler(event);
    } catch (err) {
      await this.handleFailure(event, err as Error);
    }
  }

  private async handleFailure(event: QueueEvent, error: Error): Promise<void> {
    if (event.retryCount < event.maxRetries) {
      event.retryCount += 1;
      const backoff = this.config.retryBackoffMs * Math.pow(2, event.retryCount - 1);
      console.warn(`[${this.source}] Retry ${event.retryCount}/${event.maxRetries} for "${event.type}" in ${backoff}ms — ${error.message}`);
      await new Promise(r => setTimeout(r, backoff));
      this.queue.unshift(event);
      eventBus.publish('queue:retry', event);
    } else {
      console.error(`[${this.source}] Dead-lettering "${event.type}" after ${event.maxRetries} retries — ${error.message}`);
      this.deadLetterQueue.push(event);
      eventBus.publish('queue:dead-letter', event);
    }
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority]);
  }

  get depth(): number { return this.queue.length; }
  get deadLetterDepth(): number { return this.deadLetterQueue.length; }

  drainDeadLetters(): QueueEvent[] {
    const items = [...this.deadLetterQueue];
    this.deadLetterQueue = [];
    return items;
  }

  inject(event: QueueEvent): void {
    this.queue.push(event);
    this.sortQueue();
    eventBus.publish('queue:enqueue', event);
  }
  }

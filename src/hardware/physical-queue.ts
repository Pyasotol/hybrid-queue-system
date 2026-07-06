// ============================================================
//  hardware/physical-queue.ts — PHYSICAL_HARDWARE queue.
//  Wraps the shared QueueProcessor and adds MQTT-backed
//  ingestion so real sensors can push events over the wire.
// ============================================================

import { QueueProcessor } from '../core/queue-processor';
import { eventBus } from '../core/event-bus';
import { SystemConfig, Priority } from '../core/types';

export const HW_EVENTS = {
  SENSOR_TRIGGER:  'SENSOR_TRIGGER',
  GATE_APPROACH:   'GATE_APPROACH',
  GATE_MANUAL:     'GATE_MANUAL',
  PLATE_BUTTON:    'PLATE_BUTTON',
  WEIGHT_DETECTED: 'WEIGHT_DETECTED',
  MOTION_DETECTED: 'MOTION_DETECTED',
  HEARTBEAT:       'HEARTBEAT',
} as const;

export type HardwareEventType = typeof HW_EVENTS[keyof typeof HW_EVENTS];

export class PhysicalHardwareQueue {
  readonly processor: QueueProcessor;
  private mqttClient: unknown = null;
  private config: SystemConfig;

  constructor(config: SystemConfig) {
    this.config = config;
    this.processor = new QueueProcessor('PHYSICAL_HARDWARE', config.queue);
  }

  bindMqtt(client: {
    subscribe: (topic: string, cb: (err: unknown) => void) => void;
    on: (event: string, cb: (...args: unknown[]) => void) => void;
  }): void {
    this.mqttClient = client;
    const prefix = this.config.mqtt.topicPrefix;
    client.subscribe(`${prefix}/hardware/#`, (err) => {
      if (err) {
        console.error('[PhysicalQueue] MQTT subscribe error:', err);
        eventBus.publish('system:error', err as Error, 'mqtt-subscribe');
        return;
      }
      console.info(`[PhysicalQueue] Subscribed to ${prefix}/hardware/#`);
    });
    client.on('message', (topic: unknown, message: unknown) => {
      this.handleMqttMessage(topic as string, message as Buffer);
    });
  }

  private handleMqttMessage(topic: string, message: Buffer): void {
    try {
      const payload = JSON.parse(message.toString()) as Record<string, unknown>;
      const parts   = topic.split('/');
      const type    = (parts[parts.length - 1] ?? 'UNKNOWN').toUpperCase();
      const priority = this.resolvePriority(type);
      this.emit(type, payload, priority);
    } catch (err) {
      console.error('[PhysicalQueue] Malformed MQTT message:', err);
    }
  }

  emit(
    type: string,
    payload: Record<string, unknown> = {},
    priority: Priority = 'NORMAL'
  ) {
    return this.processor.enqueue(type, { ...payload, _hw: true }, priority);
  }

  triggerSensor(sensorId: string, value: unknown) {
    return this.emit(HW_EVENTS.SENSOR_TRIGGER, { sensorId, value }, 'HIGH');
  }

  signalGateApproach(sensorId: string) {
    return this.emit(HW_EVENTS.GATE_APPROACH, { sensorId }, 'HIGH');
  }

  signalPlateButton(buttonId: string) {
    return this.emit(HW_EVENTS.PLATE_BUTTON, { buttonId }, 'NORMAL');
  }

  sendHeartbeat(deviceId: string) {
    return this.emit(HW_EVENTS.HEARTBEAT, { deviceId }, 'LOW');
  }

  private resolvePriority(type: string): Priority {
    if (['GATE_APPROACH', 'GATE_MANUAL', 'SENSOR_TRIGGER'].includes(type)) return 'HIGH';
    if (['HEARTBEAT'].includes(type)) return 'LOW';
    return 'NORMAL';
  }

  start(): void { this.processor.start(); }
  stop():  void { this.processor.stop();  }

  get depth() { return this.processor.depth; }
    }

// ============================================================
//  digital/state-manager.ts — System State Manager
//  Single source of truth for the live system state. All
//  subsystems write here; the API server reads from here.
// ============================================================

import { SystemState, GateState, PlateState } from '../core/types';
import { eventBus } from '../core/event-bus';

export class StateManager {
  private static instance: StateManager;
  private state: SystemState;
  private listeners: Set<(state: SystemState) => void> = new Set();

  private constructor() {
    this.state = {
      gate: {
        stage:           'IDLE',
        lastTransition:  new Date(),
        ceremonyMode:    false,
        transitionCount: 0,
      },
      plate: {
        current:        'SPRING',
        previous:       null,
        lastRotation:   new Date(),
        rotationCount:  0,
        manualOverride: false,
        nextScheduled:  new Date(),
      },
      physicalQueueDepth:    0,
      digitalQueueDepth:     0,
      workflowEngineRunning: false,
      uptimeSince:           new Date(),
    };
    this.bindEventBus();
  }

  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  // ─── Reads ───────────────────────────────────────────────

  getState(): Readonly<SystemState> { return { ...this.state }; }
  getGateState():  Readonly<GateState>  { return { ...this.state.gate };  }
  getPlateState(): Readonly<PlateState> { return { ...this.state.plate }; }

  // ─── Writes ──────────────────────────────────────────────

  updateGate(patch: Partial<GateState>): void {
    this.state = { ...this.state, gate: { ...this.state.gate, ...patch } };
    this.notify();
  }

  updatePlate(patch: Partial<PlateState>): void {
    this.state = { ...this.state, plate: { ...this.state.plate, ...patch } };
    this.notify();
  }

  setQueueDepths(physical: number, digital: number): void {
    this.state = { ...this.state, physicalQueueDepth: physical, digitalQueueDepth: digital };
    this.notify();
  }

  setWorkflowRunning(running: boolean): void {
    this.state = { ...this.state, workflowEngineRunning: running };
    this.notify();
  }

  // ─── Subscriptions ───────────────────────────────────────

  subscribe(listener: (state: SystemState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const snapshot = this.getState();
    this.listeners.forEach(fn => fn(snapshot as SystemState));
  }

  // ─── Event Bus Binding ──────────────────────────────────

  private bindEventBus(): void {
    eventBus.subscribe('gate:approach', () => this.updateGate({ stage: 'APPROACH', lastTransition: new Date() }));
    eventBus.subscribe('gate:verify',   () => this.updateGate({ stage: 'VERIFY',   lastTransition: new Date() }));
    eventBus.subscribe('gate:open',     () => this.updateGate({ stage: 'OPEN',     lastTransition: new Date() }));
    eventBus.subscribe('gate:close',    () => this.updateGate({ stage: 'CLOSING',  lastTransition: new Date() }));
    eventBus.subscribe('gate:lock',     () => this.updateGate({ stage: 'LOCKED',   lastTransition: new Date() }));
    eventBus.subscribe('gate:ceremony', () => this.updateGate({ ceremonyMode: true }));

    eventBus.subscribe('plate:rotate', (_from, to) => {
      this.updatePlate({
        current:       to as PlateState['current'],
        lastRotation:  new Date(),// ============================================================
//  digital/state-manager.ts — System State Manager
//  Single source of truth for the live system state. All
//  subsystems write here; the API server reads from here.
// ============================================================

import { SystemState, GateState, PlateState } from '../core/types';
import { eventBus } from '../core/event-bus';

export class StateManager {
  private static instance: StateManager;
  private state: SystemState;
  private listeners: Set<(state: SystemState) => void> = new Set();

  private constructor() {
    this.state = {
      gate: {
        stage:           'IDLE',
        lastTransition:  new Date(),
        ceremonyMode:    false,
        transitionCount: 0,
      },
      plate: {
        current:        'SPRING',
        previous:       null,
        lastRotation:   new Date(),
        rotationCount:  0,
        manualOverride: false,
        nextScheduled:  new Date(),
      },
      physicalQueueDepth:    0,
      digitalQueueDepth:     0,
      workflowEngineRunning: false,
      uptimeSince:           new Date(),
    };
    this.bindEventBus();
  }

  static getInstance(): StateManager {
    if (!StateManager.instance) {
      StateManager.instance = new StateManager();
    }
    return StateManager.instance;
  }

  getState(): Readonly<SystemState> { return { ...this.state }; }
  getGateState():  Readonly<GateState>  { return { ...this.state.gate };  }
  getPlateState(): Readonly<PlateState> { return { ...this.state.plate }; }

  updateGate(patch: Partial<GateState>): void {
    this.state = { ...this.state, gate: { ...this.state.gate, ...patch } };
    this.notify();
  }

  updatePlate(patch: Partial<PlateState>): void {
    this.state = { ...this.state, plate: { ...this.state.plate, ...patch } };
    this.notify();
  }

  setQueueDepths(physical: number, digital: number): void {
    this.state = { ...this.state, physicalQueueDepth: physical, digitalQueueDepth: digital };
    this.notify();
  }

  setWorkflowRunning(running: boolean): void {
    this.state = { ...this.state, workflowEngineRunning: running };
    this.notify();
  }

  subscribe(listener: (state: SystemState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    const snapshot = this.getState();
    this.listeners.forEach(fn => fn(snapshot as SystemState));
  }

  private bindEventBus(): void {
    eventBus.subscribe('gate:approach', () => this.updateGate({ stage: 'APPROACH', lastTransition: new Date() }));
    eventBus.subscribe('gate:verify',   () => this.updateGate({ stage: 'VERIFY',   lastTransition: new Date() }));
    eventBus.subscribe('gate:open',     () => this.updateGate({ stage: 'OPEN',     lastTransition: new Date() }));
    eventBus.subscribe('gate:close',    () => this.updateGate({ stage: 'CLOSING',  lastTransition: new Date() }));
    eventBus.subscribe('gate:lock',     () => this.updateGate({ stage: 'LOCKED',   lastTransition: new Date() }));
    eventBus.subscribe('gate:ceremony', () => this.updateGate({ ceremonyMode: true }));
    eventBus.subscribe('plate:rotate', (_from, to) => {
      this.updatePlate({
        current:       to as PlateState['current'],
        lastRotation:  new Date(),
        rotationCount: this.state.plate.rotationCount + 1,
      });
    });
    eventBus.subscribe('system:ready',    () => this.setWorkflowRunning(true));
    eventBus.subscribe('system:shutdown', () => this.setWorkflowRunning(false));
  }
}

export const stateManager = StateManager.getInstance();

        rotationCount: this.state.plate.rotationCount + 1,
      });
    });

    eventBus.subscribe('system:ready',    () => this.setWorkflowRunning(true));
    eventBus.subscribe('system:shutdown', () => this.setWorkflowRunning(false));
  }
}

export const stateManager = StateManager.getInstance();

// ============================================================
//  hardware/ritual-gate.ts — Ritual Entry Gate
//  Multi-stage state machine: IDLE → APPROACH → VERIFY →
//  OPEN → OCCUPIED → CLOSING → IDLE  (or LOCKED on failure)
// ============================================================

import { GateStage, GateState, QueueSource, SystemConfig } from '../core/types';
import { eventBus } from '../core/event-bus';

interface StageTransition {
  from: GateStage[];
  to: GateStage;
  action: string;
  minDwellMs?: number;
}

const TRANSITIONS: StageTransition[] = [
  { from: ['IDLE'],             to: 'APPROACH', action: 'approach'  },
  { from: ['APPROACH'],         to: 'VERIFY',   action: 'verify'    },
  { from: ['VERIFY'],           to: 'OPEN',     action: 'open'      },
  { from: ['OPEN'],             to: 'OCCUPIED', action: 'occupy',   minDwellMs: 500 },
  { from: ['OCCUPIED'],         to: 'CLOSING',  action: 'close'     },
  { from: ['CLOSING'],          to: 'IDLE',     action: 'reset'     },
  { from: ['APPROACH','VERIFY','OPEN','OCCUPIED','CLOSING'], to: 'LOCKED', action: 'lock' },
  { from: ['LOCKED'],           to: 'IDLE',     action: 'unlock'    },
];

export class RitualEntryGate {
  private state: GateState;
  private readonly config: SystemConfig;
  private verifyTimer:  ReturnType<typeof setTimeout> | null = null;
  private closeTimer:   ReturnType<typeof setTimeout> | null = null;
  private stageEnteredAt: Date = new Date();

  constructor(config: SystemConfig) {
    this.config = config;
    this.state = {
      stage:           'IDLE',
      lastTransition:  new Date(),
      ceremonyMode:    false,
      transitionCount: 0,
    };
  }

  getState(): Readonly<GateState> {
    return { ...this.state };
  }

  approach(source: QueueSource = 'PHYSICAL_HARDWARE'): boolean {
    return this.transition('approach', source);
  }

  verify(source: QueueSource = 'PHYSICAL_HARDWARE'): boolean {
    const ok = this.transition('verify', source);
    if (!ok) return false;
    this.verifyTimer = setTimeout(() => {
      console.warn('[RitualGate] Verification timed out — locking gate');
      this.lock(source);
    }, this.config.gate.verifyTimeoutMs);
    return true;
  }

  open(source: QueueSource = 'PHYSICAL_HARDWARE'): boolean {
    if (this.verifyTimer) { clearTimeout(this.verifyTimer); this.verifyTimer = null; }
    const delay = this.state.ceremonyMode ? this.config.gate.ceremonyDelayMs : 0;
    if (delay > 0) {
      console.info(`[RitualGate] Ceremony mode — opening in ${delay}ms`);
      setTimeout(() => this._doOpen(source), delay);
      return true;
    }
    return this._doOpen(source);
  }

  private _doOpen(source: QueueSource): boolean {
    const ok = this.transition('open', source);
    if (!ok) return false;
    this.closeTimer = setTimeout(() => {
      console.info('[RitualGate] Auto-closing after open duration');
      this.close(source);
    }, this.config.gate.openDurationMs);
    return true;
  }

  occupy(source: QueueSource = 'PHYSICAL_HARDWARE'): boolean {
    if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
    return this.transition('occupy', source);
  }

  close(source: QueueSource = 'PHYSICAL_HARDWARE'): boolean {
    const ok = this.transition('close', source);
    if (!ok) return false;
    setTimeout(() => this.transition('reset', source), 1500);
    return true;
  }

  lock(source: QueueSource = 'PHYSICAL_HARDWARE'): boolean {
    this.clearTimers();
    return this.transition('lock', source);
  }

  unlock(source: QueueSource = 'PHYSICAL_HARDWARE'): boolean {
    return this.transition('unlock', source);
  }

  setCeremonyMode(enabled: boolean): void {
    this.state = { ...this.state, ceremonyMode: enabled };
    console.info(`[RitualGate] Ceremony mode ${enabled ? 'ON' : 'OFF'}`);
  }

  private transition(action: string, source: QueueSource): boolean {
    const rule = TRANSITIONS.find(
      t => t.action === action && t.from.includes(this.state.stage)
    );
    if (!rule) {
      console.warn(
        `[RitualGate] Invalid transition: "${action}" from stage "${this.state.stage}"`
      );
      return false;
    }
    const prevStage = this.state.stage;
    this.state = {
      ...this.state,
      stage:           rule.to,
      lastTransition:  new Date(),
      unlockSource:    source,
      transitionCount: this.state.transitionCount + 1,
    };
    this.stageEnteredAt = new Date();
    console.info(`[RitualGate] ${prevStage} → ${rule.to} (source: ${source})`);
    eventBus.publish(`gate:${action}` as Parameters<typeof eventBus.publish>[0], source);
    return true;
  }

  private clearTimers(): void {
    if (this.verifyTimer)  { clearTimeout(this.verifyTimer);  this.verifyTimer  = null; }
    if (this.closeTimer)   { clearTimeout(this.closeTimer);   this.closeTimer   = null; }
  }
}

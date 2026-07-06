// ============================================================
//  hardware/rotating-plate.ts — Rotating Plate System
//  Tracks the current seasonal plate, handles scheduled and
//  manual rotations, and emits plate lifecycle events.
// ============================================================

import { Season, PlateState, SystemConfig } from '../core/types';
import { eventBus } from '../core/event-bus';

const SEASON_ORDER: Season[] = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];

// Month → Season mapping (Northern Hemisphere defaults)
const MONTH_TO_SEASON: Record<number, Season> = {
  2: 'SPRING', 3: 'SPRING', 4: 'SPRING',   // Mar-May
  5: 'SUMMER', 6: 'SUMMER', 7: 'SUMMER',   // Jun-Aug
  8: 'AUTUMN', 9: 'AUTUMN', 10: 'AUTUMN',  // Sep-Nov
  11: 'WINTER', 0: 'WINTER', 1: 'WINTER',  // Dec-Feb
};

export class RotatingPlateSystem {
  private state: PlateState;
  private scheduleTimer: ReturnType<typeof setInterval> | null = null;
  private readonly config: SystemConfig;

  constructor(config: SystemConfig) {
    this.config = config;
    const current = this.resolveCurrentSeason();
    this.state = {
      current,
      previous:       null,
      lastRotation:   new Date(),
      rotationCount:  0,
      manualOverride: false,
      nextScheduled:  this.computeNextRotation(current),
    };
  }

  // --- State ---

  getState(): Readonly<PlateState> {
    return { ...this.state };
  }

  // --- Rotation ---

  rotate(reason = 'scheduled', manual = false): PlateState {
    const from   = this.state.current;
    const idx    = SEASON_ORDER.indexOf(from);
    const to     = SEASON_ORDER[(idx + 1) % SEASON_ORDER.length];

    this.state = {
      ...this.state,
      previous:       from,
      current:        to,
      lastRotation:   new Date(),
      rotationCount:  this.state.rotationCount + 1,
      manualOverride: manual,
      nextScheduled:  manual ? this.state.nextScheduled : this.computeNextRotation(to),
    };

    console.info(`[RotatingPlate] Rotated ${from} to ${to} (reason: ${reason})`);
    eventBus.publish('plate:rotate', from, to, reason);

    return this.getState() as PlateState;
  }

  jumpTo(season: Season, reason = 'manual-jump'): PlateState {
    const from = this.state.current;
    if (from === season) return this.getState() as PlateState;

    this.state = {
      ...this.state,
      previous:       from,
      current:        season,
      lastRotation:   new Date(),
      rotationCount:  this.state.rotationCount + 1,
      manualOverride: true,
      nextScheduled:  this.state.nextScheduled,
    };

    console.info(`[RotatingPlate] Jumped ${from} to ${season} (reason: ${reason})`);
    eventBus.publish('plate:rotate', from, season, reason);

    return this.getState() as PlateState;
  }

  clearOverride(): void {
    const synced = this.resolveCurrentSeason();
    const from   = this.state.current;

    this.state = {
      ...this.state,
      current:        synced,
      previous:       from,
      manualOverride: false,
      nextScheduled:  this.computeNextRotation(synced),
    };

    console.info(`[RotatingPlate] Manual override cleared; synced to ${synced}`);
    if (from !== synced) {
      eventBus.publish('plate:rotate', from, synced, 'override-cleared');
    }
  }

  // --- Scheduled Auto-Rotation ---

  startAutoRotation(): void {
    if (!this.config.plate.autoRotate) {
      console.info('[RotatingPlate] Auto-rotation disabled by config');
      return;
    }

    this.scheduleTimer = setInterval(() => {
      if (this.state.manualOverride) return;
      const expected = this.resolveCurrentSeason();
      if (expected !== this.state.current) {
        this.rotate(`auto-seasonal-transition-to-${expected}`);
      }
    }, 10 * 60 * 1000);

    const next = this.state.nextScheduled;
    console.info(`[RotatingPlate] Auto-rotation started. Next check at ${next.toISOString()}`);
    eventBus.publish('plate:scheduled', this.state.current, next);
  }

  stopAutoRotation(): void {
    if (this.scheduleTimer) {
      clearInterval(this.scheduleTimer);
      this.scheduleTimer = null;
      console.info('[RotatingPlate] Auto-rotation stopped');
    }
  }

  // --- Helpers ---

  private resolveCurrentSeason(): Season {
    const month = new Date().getMonth();
    return MONTH_TO_SEASON[month] ?? 'SPRING';
  }

  private computeNextRotation(current: Season): Date {
    const SEASON_START_MONTHS: Record<Season, number> = {
      SPRING: 2,
      SUMMER: 5,
      AUTUMN: 8,
      WINTER: 11,
    };
    const idx       = SEASON_ORDER.indexOf(current);
    const next      = SEASON_ORDER[(idx + 1) % SEASON_ORDER.length];
    const nextMonth = SEASON_START_MONTHS[next];
    const now       = new Date();
    const nextDate  = new Date(now.getFullYear(), nextMonth, 20, 0, 0, 0, 0);
    if (nextDate <= now) nextDate.setFullYear(nextDate.getFullYear() + 1);
    return nextDate;
  }
}


// ============================================================
//  workflow/engine.ts — Workflow Engine
//  Receives events from both queues, matches rules, dispatches
//  actions to gate, plate, audit, and notification subsystems.
// ============================================================

import { QueueEvent, WorkflowRule, WorkflowAction, SystemConfig } from '../core/types';
import { eventBus } from '../core/event-bus';
import { ConflictResolver } from './conflict-resolver';
import { BUILT_IN_RULES } from './rules';
import { RitualEntryGate } from '../hardware/ritual-gate';
import { RotatingPlateSystem } from '../hardware/rotating-plate';
import { AuditLog } from '../audit/audit-log';

export class WorkflowEngine {
  private rules: WorkflowRule[]       = [];
  private resolver: ConflictResolver;
  private pendingEvents: QueueEvent[] = [];
  private running = false;

  constructor(
    private readonly gate:   RitualEntryGate,
    private readonly plate:  RotatingPlateSystem,
    private readonly audit:  AuditLog,
    private readonly config: SystemConfig
  ) {
    this.resolver = new ConflictResolver();
    this.loadRules(BUILT_IN_RULES);
  }

  // ─ Rule Management ──────────────────────────────────────────

  loadRules(rules: WorkflowRule[]): void {
    this.rules = [
      ...this.rules.filter(r => !rules.some(nr => nr.id === r.id)),
      ...rules.filter(r => r.enabled),
    ];
    console.info(`[WorkflowEngine] Loaded ${this.rules.length} active rules`);
  }

  addRule(rule: WorkflowRule): void {
    if (rule.enabled) {
      this.rules = [...this.rules.filter(r => r.id !== rule.id), rule];
    }
  }

  removeRule(ruleId: string): void {
    this.rules = this.rules.filter(r => r.id !== ruleId);
  }

  // ─ Main Handler ────────────────────────────────────────────

  async handleEvent(event: QueueEvent): Promise<void> {
    const conflict = this.resolver.findConflict(event, this.pendingEvents);
    if (conflict) {
      console.warn(`[WorkflowEngine] Conflict: "${event.type}" vs "${conflict.type}" — resolving`);
      eventBus.publish('workflow:conflict', event, conflict);
      const winner = this.resolver.resolve(event, conflict);
      if (winner.id !== event.id) return;
    }

    this.pendingEvents.push(event);
    setTimeout(() => {
      this.pendingEvents = this.pendingEvents.filter(e => e.id !== event.id);
    }, 100);

    const matched = this.matchRules(event);
    if (matched.length === 0) {
      this.audit.log('QUEUE', 'NO_RULE_MATCHED', event.source, { eventType: event.type }, 'INFO');
      return;
    }

    for (const rule of matched) {
      eventBus.publish('workflow:rule-matched', rule.id, event);
      this.audit.log('WORKFLOW', 'RULE_MATCHED', event.source,
        { ruleId: rule.id, eventType: event.type }, 'INFO');
      for (const action of rule.actions) {
        await this.executeAction(action, event, rule.id);
      }
    }
  }

  // ─ Rule Matching ────────────────────────────────────────────

  private matchRules(event: QueueEvent): WorkflowRule[] {
    return this.rules.filter(rule => {
      const { match } = rule;
      if (match.source && match.source !== event.source) return false;
      if (match.priority && match.priority !== event.priority) return false;
      const types = Array.isArray(match.type) ? match.type : [match.type];
      return types.includes(event.type);
    });
  }

  // ─ Action Execution ────────────────────────────────────────

  private async executeAction(
    action: WorkflowAction, event: QueueEvent, ruleId: string
  ): Promise<void> {
    if (action.delayMs && action.delayMs > 0) {
      await new Promise(r => setTimeout(r, action.delayMs));
    }
    switch (action.type) {
      case 'TRIGGER_GATE':  await this.executeGateAction(action, event);  break;
      case 'ROTATE_PLATE':  await this.executePlateAction(action, event); break;
      case 'EMIT_EVENT':
        eventBus.publish(
          (action.target ?? 'system:error') as Parameters<typeof eventBus.publish>[0], ...[] as []
        );
        break;
      case 'LOG_AUDIT':
        this.audit.log('WORKFLOW',
          action.params?.message as string ?? 'ACTION_LOG', event.source,
          { ruleId, eventId: event.id },
          (action.params?.severity as 'INFO' | 'WARN' | 'ERROR') ?? 'INFO'
        );
        break;
      case 'NOTIFY':
        console.info(`[WorkflowEngine] NOTIFY: ${JSON.stringify(action.params)}`);
        break;
      case 'RETRY':
        throw new Error('RETRY action — force retry via queue processor');
      default:
        console.warn(`[WorkflowEngine] Unknown action type: ${action.type}`);
    }
    eventBus.publish('workflow:action-done', ruleId, action.type);
  }

  private async executeGateAction(action: WorkflowAction, event: QueueEvent): Promise<void> {
    const cmd = action.params?.command as string ?? '';
    switch (cmd) {
      case 'approach': this.gate.approach(event.source); break;
      case 'verify':   this.gate.verify(event.source);   break;
      case 'open':     this.gate.open(event.source);     break;
      case 'occupy':   this.gate.occupy(event.source);   break;
      case 'close':    this.gate.close(event.source);    break;
      case 'lock':     this.gate.lock(event.source);     break;
      case 'unlock':   this.gate.unlock(event.source);   break;
      case 'ceremony': this.gate.setCeremonyMode(true);  break;
      default: console.warn(`[WorkflowEngine] Unknown gate command: ${cmd}`);
    }
  }

  private async executePlateAction(action: WorkflowAction, event: QueueEvent): Promise<void> {
    const cmd = action.params?.command as string ?? 'rotate';
    if (cmd === 'jump' && action.params?.season) {
      this.plate.jumpTo(
        action.params.season as 'SPRING' | 'SUMMER' | 'AUTUMN' | 'WINTER',
        `workflow-rule:${event.id}`
      );
    } else {
      this.plate.rotate(`workflow-rule:${event.id}`);
    }
  }

  // ─ Lifecycle ──────────────────────────────────────────────

  start(): void {
    this.running = true;
    eventBus.publish('system:ready');
    console.info('[WorkflowEngine] Started');
  }

  stop(): void {
    this.running = false;
    eventBus.publish('system:shutdown');
    console.info('[WorkflowEngine] Stopped');
  }

  get isRunning() { return this.running; }
}

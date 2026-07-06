// ============================================================
//  workflow/rules.ts — Built-in Rule Definitions
//  These rules wire hardware events → gate/plate actions and
//  app events → gate/plate actions.
// ============================================================

import { WorkflowRule } from '../core/types';

export const BUILT_IN_RULES: WorkflowRule[] = [

  // ── PHYSICAL: Approach → start verification ─────────────
  {
    id:          'hw-gate-approach',
    name:        'HW Gate Approach',
    description: 'When a sensor detects approach, begin gate verification sequence.',
    match:       { source: 'PHYSICAL_HARDWARE', type: ['GATE_APPROACH', 'MOTION_DETECTED'] },
    actions: [
      { type: 'TRIGGER_GATE', params: { command: 'approach' } },
      { type: 'LOG_AUDIT',    params: { message: 'GATE_APPROACH_RECEIVED' } },
    ],
    enabled: true,
  },

  // ── PHYSICAL: Weight/motion after approach → open ─────────
  {
    id:          'hw-gate-verify-open',
    name:        'HW Gate Verify & Open',
    description: 'Weight sensor after approach confirms identity — open gate.',
    match:       { source: 'PHYSICAL_HARDWARE', type: 'WEIGHT_DETECTED', priority: 'HIGH' },
    actions: [
      { type: 'TRIGGER_GATE', params: { command: 'verify' } },
      { type: 'TRIGGER_GATE', params: { command: 'open' }, delayMs: 300 },
    ],
    enabled: true,
  },

  // ── PHYSICAL: Plate button pressed ──────────────────────
  {
    id:          'hw-plate-button',
    name:        'HW Plate Button',
    description: 'Physical plate button triggers a seasonal rotation.',
    match:       { source: 'PHYSICAL_HARDWARE', type: 'PLATE_BUTTON' },
    actions: [
      { type: 'ROTATE_PLATE', params: { command: 'rotate' } },
      { type: 'LOG_AUDIT',    params: { message: 'PLATE_ROTATE_HW' } },
    ],
    enabled: true,
  },

  // ── PHYSICAL: Manual gate override ─────────────────────
  {
    id:          'hw-gate-manual',
    name:        'HW Gate Manual Override',
    description: 'Manual gate trigger bypasses verify — direct open with CRITICAL priority.',
    match:       { source: 'PHYSICAL_HARDWARE', type: 'GATE_MANUAL', priority: 'CRITICAL' },
    actions: [
      { type: 'TRIGGER_GATE', params: { command: 'open' } },
      { type: 'LOG_AUDIT',    params: { message: 'GATE_MANUAL_OVERRIDE', severity: 'WARN' } },
    ],
    enabled: true,
  },

  // ── DIGITAL: App requests gate unlock ──────────────────
  {
    id:          'app-gate-unlock',
    name:        'App Gate Unlock Request',
    description: 'App-initiated gate unlock runs full verify → open sequence.',
    match:       { source: 'DIGITAL_APP', type: 'GATE_UNLOCK_REQ' },
    actions: [
      { type: 'TRIGGER_GATE', params: { command: 'verify' } },
      { type: 'TRIGGER_GATE', params: { command: 'open' }, delayMs: 500 },
      { type: 'LOG_AUDIT',    params: { message: 'GATE_UNLOCK_APP' } },
    ],
    enabled: true,
  },

  // ── DIGITAL: App requests plate rotation ────────────────
  {
    id:          'app-plate-rotate',
    name:        'App Plate Rotation Request',
    description: 'App-initiated plate rotation — respect targetSeason if provided.',
    match:       { source: 'DIGITAL_APP', type: 'PLATE_ROTATE_REQ' },
    actions: [
      { type: 'ROTATE_PLATE', params: { command: 'rotate' } },
      { type: 'LOG_AUDIT',    params: { message: 'PLATE_ROTATE_APP' } },
    ],
    enabled: true,
  },

  // ── DIGITAL: Ceremony mode toggle ─────────────────────
  {
    id:          'app-ceremony-toggle',
    name:        'App Ceremony Mode Toggle',
    description: 'Enables ceremony mode — gate opens with a ritual delay.',
    match:       { source: 'DIGITAL_APP', type: 'CEREMONY_TOGGLE' },
    actions: [
      { type: 'TRIGGER_GATE', params: { command: 'ceremony' } },
      { type: 'LOG_AUDIT',    params: { message: 'CEREMONY_MODE_TOGGLED' } },
    ],
    enabled: true,
  },

  // ── DIGITAL: Admin override ──────────────────────────
  {
    id:          'app-admin-override',
    name:        'Admin Override',
    description: 'Highest-priority override from admin — executes command directly.',
    match:       { source: 'DIGITAL_APP', type: 'ADMIN_OVERRIDE', priority: 'CRITICAL' },
    actions: [
      { type: 'TRIGGER_GATE', params: { command: 'unlock' } },
      { type: 'LOG_AUDIT',    params: { message: 'ADMIN_OVERRIDE_EXECUTED', severity: 'WARN' } },
    ],
    enabled: true,
  },

  // ── BOTH: Audit all common events ──────────────────────
  {
    id:          'sys-audit-all-events',
    name:        'System Audit All',
    description: 'Log every event from either queue for full traceability.',
    match:       { type: ['SENSOR_TRIGGER', 'USER_ACTION', 'WEBHOOK_INBOUND', 'HEARTBEAT'] },
    actions: [
      { type: 'LOG_AUDIT', params: { message: 'EVENT_RECEIVED', severity: 'INFO' } },
    ],
    enabled: true,
  },
];

// ============================================================
//  digital/api-server.ts — Express REST API
//  Exposes system state and control endpoints so any HTTP
//  client can read state or inject events into the queues.
// ============================================================

import express, { Request, Response, NextFunction } from 'express';
import { DigitalAppQueue } from './digital-queue';
import { stateManager } from './state-manager';
import { SystemConfig } from '../core/types';

export function createApiServer(
  appQueue: DigitalAppQueue,
  config: SystemConfig
) {
  const app = express();
  app.use(express.json());

  // ─── Health ─────────────────────────────────────────────

  app.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', ts: new Date().toISOString() });
  });

  // ─── System State ─────────────────────────────────────

  app.get('/state', (_req: Request, res: Response) => {
    res.json(stateManager.getState());
  });

  app.get('/state/gate', (_req: Request, res: Response) => {
    res.json(stateManager.getGateState());
  });

  app.get('/state/plate', (_req: Request, res: Response) => {
    res.json(stateManager.getPlateState());
  });

  // ─── Gate Control ─────────────────────────────────────

  app.post('/gate/unlock', (req: Request, res: Response) => {
    const { userId = 'api', reason = 'api-request' } = req.body as Record<string, string>;
    const event = appQueue.requestGateUnlock(userId, reason);
    res.status(202).json({ queued: true, eventId: event.id });
  });

  app.post('/gate/ceremony', (req: Request, res: Response) => {
    const { userId = 'api', enabled = true } = req.body as { userId: string; enabled: boolean };
    const event = appQueue.toggleCeremony(userId, enabled);
    res.status(202).json({ queued: true, eventId: event.id });
  });

  // ─── Plate Control ────────────────────────────────────

  app.post('/plate/rotate', (req: Request, res: Response) => {
    const { userId = 'api', targetSeason } = req.body as { userId: string; targetSeason?: string };
    const event = appQueue.requestPlateRotate(userId, targetSeason);
    res.status(202).json({ queued: true, eventId: event.id });
  });

  // ─── Admin ──────────────────────────────────────────────

  app.post('/admin/override', (req: Request, res: Response) => {
    const { adminId, command, params = {} } = req.body as {
      adminId: string;
      command: string;
      params?: Record<string, unknown>;
    };
    if (!adminId || !command) {
      res.status(400).json({ error: 'adminId and command are required' });
      return;
    }
    const event = appQueue.adminOverride(adminId, command, params);
    res.status(202).json({ queued: true, eventId: event.id });
  });

  // ─── Webhook Inbound ──────────────────────────────────

  app.post('/webhook/:source', (req: Request, res: Response) => {
    const event = appQueue.webhookInbound(req.params.source, req.body as Record<string, unknown>);
    res.status(202).json({ queued: true, eventId: event.id });
  });

  // ─── Error Handler ────────────────────────────────────

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error('[API] Unhandled error:', err.message);
    res.status(500).json({ error: err.message });
  });

  return {
    listen(): void {
      app.listen(config.api.port, config.api.host, () => {
        console.info(
          `[API] Server running on http://${config.api.host}:${config.api.port}`
        );
      });
    },
    app,
  };
}

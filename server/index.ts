import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { orbitalProviderManager } from './orbitalProviderManager';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(cors());
app.use(express.json());

// -----------------------------------------------------------------------------
// Health Check
// -----------------------------------------------------------------------------
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ORBITIQ Orbital Data Gateway',
    version: '2.1.0',
  });
});

// -----------------------------------------------------------------------------
// Unified Provider Status
// -----------------------------------------------------------------------------
app.get('/api/status', (_req: Request, res: Response) => {
  const status = orbitalProviderManager.getUnifiedStatus();
  res.json(status);
});

// -----------------------------------------------------------------------------
// CelesTrak Endpoints
// -----------------------------------------------------------------------------
app.get('/api/providers/celestrak/status', (_req: Request, res: Response) => {
  res.json(orbitalProviderManager.getCelesTrakClient().getStatus());
});

app.get('/api/providers/celestrak/gp', async (req: Request, res: Response) => {
  try {
    const group = (req.query.group as string) || undefined;
    const catnr = (req.query.catnr as string) || undefined;
    const name = (req.query.name as string) || undefined;
    const forceRefresh = req.query.refresh === 'true';

    const objects = await orbitalProviderManager.getCelesTrakClient().fetchGpData({
      group,
      catnr,
      name,
      bypassCache: forceRefresh,
    });

    res.json({
      success: true,
      count: objects.length,
      group: group || 'stations',
      data: objects,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to query CelesTrak GP endpoint.',
    });
  }
});

// -----------------------------------------------------------------------------
// Space-Track Endpoints
// -----------------------------------------------------------------------------
app.get('/api/providers/spacetrack/status', (_req: Request, res: Response) => {
  res.json(orbitalProviderManager.getSpaceTrackClient().getStatus());
});

// Backward-compatibility route
app.get('/api/spacetrack/status', (_req: Request, res: Response) => {
  res.json(orbitalProviderManager.getSpaceTrackClient().getStatus());
});

app.post('/api/providers/spacetrack/connect', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Both username (email) and password are required.',
    });
  }

  const client = orbitalProviderManager.getSpaceTrackClient();
  client.setCredentials(username, password);

  try {
    const success = await client.authenticate(true);
    const status = client.getStatus();
    if (success) {
      // Ingest initial GP objects
      try {
        await client.getGpData({ limit: 40 });
      } catch (ingestErr) {
        console.warn('Initial GP ingest failed, but login succeeded:', ingestErr);
      }
      return res.json({
        success: true,
        message: 'Successfully authenticated with Space-Track.org',
        status: client.getStatus(),
      });
    } else {
      return res.status(401).json({
        success: false,
        message: status.message,
        status,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Space-Track connection exception.',
      status: client.getStatus(),
    });
  }
});

// Backward-compatibility route
app.post('/api/spacetrack/connect', async (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Both username (email) and password are required.',
    });
  }

  const client = orbitalProviderManager.getSpaceTrackClient();
  client.setCredentials(username, password);

  try {
    const success = await client.authenticate(true);
    const status = client.getStatus();
    if (success) {
      try {
        await client.getGpData({ limit: 40 });
      } catch (ingestErr) {
        console.warn('Initial GP ingest failed:', ingestErr);
      }
      return res.json({
        success: true,
        message: 'Successfully authenticated with Space-Track.org',
        status: client.getStatus(),
      });
    } else {
      return res.status(401).json({
        success: false,
        message: status.message,
        status,
      });
    }
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Space-Track connection exception.',
      status: client.getStatus(),
    });
  }
});

app.post('/api/providers/spacetrack/disconnect', (_req: Request, res: Response) => {
  const client = orbitalProviderManager.getSpaceTrackClient();
  client.setCredentials('', '');
  res.json({
    success: true,
    message: 'Disconnected Space-Track session.',
  });
});

app.post('/api/spacetrack/disconnect', (_req: Request, res: Response) => {
  const client = orbitalProviderManager.getSpaceTrackClient();
  client.setCredentials('', '');
  res.json({
    success: true,
    message: 'Disconnected Space-Track session.',
  });
});

app.get('/api/providers/spacetrack/gp', async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 40;
  const nameQuery = req.query.query ? String(req.query.query) : undefined;
  const noradIds = req.query.noradIds 
    ? String(req.query.noradIds).split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
    : undefined;

  try {
    const client = orbitalProviderManager.getSpaceTrackClient();
    const data = await client.getGpData({ limit, nameQuery, noradIds });
    res.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to fetch Space-Track GP data.',
      data: [],
    });
  }
});

app.get('/api/spacetrack/gp', async (req: Request, res: Response) => {
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 40;
  try {
    const client = orbitalProviderManager.getSpaceTrackClient();
    const data = await client.getGpData({ limit });
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message, data: [] });
  }
});

// -----------------------------------------------------------------------------
// Unified Orbital Dataset Endpoints
// -----------------------------------------------------------------------------
app.get('/api/orbital/catalog', async (req: Request, res: Response) => {
  try {
    const provider = req.query.provider as any;
    const group = req.query.group ? String(req.query.group) : undefined;
    const search = req.query.search ? String(req.query.search) : undefined;
    const regime = req.query.regime as any;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 60;
    const forceRefresh = req.query.refresh === 'true';

    const objects = await orbitalProviderManager.getUnifiedCatalog({
      provider,
      group,
      search,
      regime,
      limit,
      forceRefresh,
    });

    res.json({
      success: true,
      count: objects.length,
      data: objects,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to retrieve orbital catalog.',
      data: [],
    });
  }
});

app.get('/api/orbital/object/:noradId', async (req: Request, res: Response) => {
  const noradId = parseInt(req.params.noradId, 10);
  if (isNaN(noradId)) {
    return res.status(400).json({ success: false, message: 'Invalid NORAD ID.' });
  }

  try {
    const obj = await orbitalProviderManager.getObjectByNoradId(noradId);
    if (!obj) {
      return res.status(404).json({ success: false, message: `Object with NORAD ID ${noradId} not found in providers.` });
    }
    res.json({ success: true, data: obj });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/orbital/sync', async (_req: Request, res: Response) => {
  try {
    const objects = await orbitalProviderManager.getUnifiedCatalog({ forceRefresh: true });
    res.json({
      success: true,
      message: `Synchronized ${objects.length} orbital objects across active providers.`,
      count: objects.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/spacetrack/sync', async (_req: Request, res: Response) => {
  try {
    const objects = await orbitalProviderManager.getUnifiedCatalog({ forceRefresh: true });
    res.json({
      success: true,
      message: `Synchronized ${objects.length} objects.`,
      count: objects.length,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// -----------------------------------------------------------------------------
// Conjunction Screening
// -----------------------------------------------------------------------------
app.get('/api/orbital/conjunctions', async (req: Request, res: Response) => {
  try {
    const forceRescreen = req.query.rescreen === 'true';
    // Ensure catalog is populated if empty
    const status = orbitalProviderManager.getUnifiedStatus();
    if (status.totalCachedObjects === 0) {
      await orbitalProviderManager.getUnifiedCatalog({ group: 'stations' });
    }

    const conjunctions = orbitalProviderManager.screenConjunctions(forceRescreen);
    res.json({
      success: true,
      count: conjunctions.length,
      data: conjunctions,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: err.message || 'Error screening conjunctions.',
      data: [],
    });
  }
});

app.get('/api/spacetrack/conjunctions', async (_req: Request, res: Response) => {
  try {
    const status = orbitalProviderManager.getUnifiedStatus();
    if (status.totalCachedObjects === 0) {
      await orbitalProviderManager.getUnifiedCatalog({ group: 'stations' });
    }
    const conjunctions = orbitalProviderManager.screenConjunctions();
    res.json(conjunctions);
  } catch (err: any) {
    res.status(500).json({ error: err.message, data: [] });
  }
});

// Auto-seed CelesTrak stations on server startup so the application is ready
orbitalProviderManager.getUnifiedCatalog({ group: 'stations' })
  .then((objs) => {
    console.log(`[ORBITIQ Gateway] Initialized CelesTrak public feed (${objs.length} space station objects cached).`);
  })
  .catch((err) => {
    console.warn('[ORBITIQ Gateway] Background initialization notice:', err.message);
  });

app.listen(PORT, () => {
  console.log(`ORBITIQ Dual Orbital Gateway (Space-Track & CelesTrak) listening on port ${PORT}`);
  console.log(`Frontend API ready at http://localhost:${PORT}/api`);
});

export default app;

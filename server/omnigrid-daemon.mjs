/**
 * Omni-Grid Host — Phase 1 Daemon
 * WebSocket Cross-Talk bus + process supervisor.
 *
 * Spawns and manages:
 * - Python sidecar (Master-Agentic-AI / Face-Recon / HoverMind / Ai_shell)
 * - Optional C++ collectors
 *
 * Run: node server/omnigrid-daemon.mjs
 * Bus: ws://localhost:8765
 */

import { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import { createServer } from 'http';
import { randomUUID } from 'crypto';

const PORT = Number(process.env.OMNI_PORT) || 8765;
const HOST = process.env.OMNI_HOST || '127.0.0.1';

/** @type {Map<string, import('child_process').ChildProcess>} */
const processes = new Map();

/** @type {Set<import('ws').WebSocket>} */
const clients = new Set();

function broadcast(payload) {
  const msg = JSON.stringify({
    ...payload,
    timestamp: payload.timestamp ?? Date.now(),
    id: payload.id ?? randomUUID(),
  });
  for (const ws of clients) {
    if (ws.readyState === 1) ws.send(msg);
  }
}

function spawnSidecar(id, command, args = [], options = {}) {
  if (processes.has(id)) {
    console.log(`[daemon] ${id} already running`);
    return processes.get(id);
  }

  console.log(`[daemon] spawning ${id}: ${command} ${args.join(' ')}`);
  const child = spawn(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    ...options,
  });

  child.stdout.on('data', (buf) => {
    const line = buf.toString().trim();
    if (line) {
      console.log(`[${id}] ${line}`);
      broadcast({
        type: 'system/sidecar-log',
        source: id,
        data: { line, stream: 'stdout' },
      });
    }
  });

  child.stderr.on('data', (buf) => {
    const line = buf.toString().trim();
    if (line) console.error(`[${id}:err] ${line}`);
  });

  child.on('exit', (code, signal) => {
    console.log(`[daemon] ${id} exited (code=${code}, signal=${signal})`);
    processes.delete(id);
    broadcast({
      type: 'system/sidecar-exit',
      source: id,
      data: { code, signal },
    });
  });

  processes.set(id, child);
  broadcast({
    type: 'system/sidecar-started',
    source: id,
    data: { pid: child.pid, command, args },
  });

  return child;
}

function stopSidecar(id) {
  const child = processes.get(id);
  if (!child) return false;
  child.kill('SIGTERM');
  return true;
}

// --- HTTP + WebSocket server ---
const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      uptime: process.uptime(),
      processes: Array.from(processes.keys()),
      clients: clients.size,
    }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[daemon] client connected (${clients.size} total)`);

  ws.send(JSON.stringify({
    type: 'system/hello',
    source: 'daemon',
    data: { version: '3.0.0-phase1', processes: Array.from(processes.keys()) },
    timestamp: Date.now(),
    id: randomUUID(),
  }));

  ws.on('message', (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    // Control plane
    if (msg.type === 'system/spawn') {
      const { id, command, args } = msg.data || {};
      if (id && command) spawnSidecar(id, command, args || []);
      return;
    }
    if (msg.type === 'system/stop') {
      const { id } = msg.data || {};
      if (id) stopSidecar(id);
      return;
    }

    // Relay everything else as Cross-Talk
    broadcast({
      ...msg,
      source: msg.source || 'client',
    });
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[daemon] client disconnected (${clients.size} left)`);
  });
});

// Default sidecars (optional — only if scripts exist)
function startDefaultSidecars() {
  // Example: spawn a simple Python echo worker if present
  // spawnSidecar('python-sidecar', 'python3', ['workers/unified_sidecar.py']);
  console.log('[daemon] default sidecars skipped (configure via system/spawn)');
}

httpServer.listen(PORT, HOST, () => {
  console.log(`[OMNI-GRID DAEMON] Phase 1 online`);
  console.log(`[OMNI-GRID DAEMON] WebSocket bus  ws://${HOST}:${PORT}`);
  console.log(`[OMNI-GRID DAEMON] Health         http://${HOST}:${PORT}/health`);
  startDefaultSidecars();
});

process.on('SIGINT', () => {
  console.log('\n[daemon] shutting down...');
  for (const [id] of processes) stopSidecar(id);
  process.exit(0);
});

#!/usr/bin/env npx tsx
// scripts/omni-plugin-cli.ts
// Usage:
//   npm run plugin:bundle -- --repo https://github.com/GizzZmo/TABFRET --category AUDIO
//   npm run plugin:bundle -- --repo ../AutoSec --isolation sandboxed-iframe
//   npm run plugin:bundle -- --batch-profile

import { parseArgs, styleText } from 'node:util';
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import { build as viteBuild } from 'vite';
import type {
  OmniPluginManifest,
  WidgetCategory,
  CrossTalkMimeType,
  RuntimeSidecarType,
  WidgetPermission,
} from '../src/types/plugin-sdk';

interface CliOptions {
  repo?: string;
  category?: WidgetCategory;
  isolation?: 'native-esm' | 'sandboxed-iframe';
  batchProfile?: boolean;
}

const ROOT_DIR = process.cwd();
const PLUGINS_OUT_DIR = path.join(ROOT_DIR, 'public', 'plugins');
const REGISTRY_FILE = path.join(PLUGINS_OUT_DIR, 'registry.json');

const REPO_PRESETS: Record<
  string,
  Partial<OmniPluginManifest> & { category: WidgetCategory }
> = {
  dsp4guitar: {
    category: 'AUDIO',
    isolation: 'native-esm',
    sidecar: {
      type: 'cpp-wasm',
      endpoint: '/wasm/dsp4guitar_core.js',
      permissions: ['usb-audio', 'web-midi'],
    },
    crossTalk: {
      accepts: ['audio/midi', 'audio/pcm-stream', 'ai/prompt'],
      emits: ['audio/pcm-stream'],
    },
  },
  tabfret: {
    category: 'AUDIO',
    isolation: 'native-esm',
    crossTalk: {
      accepts: ['audio/midi'],
      emits: ['audio/midi'],
    },
  },
  naw: {
    category: 'AUDIO',
    isolation: 'native-esm',
    sidecar: {
      type: 'python-sidecar',
      endpoint: 'ws://localhost:8001/ws/sidecar',
      permissions: ['usb-audio', 'web-midi', 'gemini-api'],
    },
    crossTalk: {
      accepts: ['audio/midi', 'audio/pcm-stream', 'ai/prompt'],
      emits: ['audio/midi', 'audio/pcm-stream'],
    },
  },
  autosec: {
    category: 'SECOPS',
    isolation: 'sandboxed-iframe',
    sidecar: {
      type: 'cpp-daemon',
      endpoint: 'ws://localhost:1234/ipc/pcap-stream',
      permissions: ['pcap-net'],
    },
    crossTalk: {
      accepts: ['sec/pcap-packet', 'sec/biometric-auth'],
      emits: ['ai/agent-task', 'text/plain'],
    },
  },
  'face-recon': {
    category: 'SECOPS',
    isolation: 'native-esm',
    sidecar: {
      type: 'python-sidecar',
      endpoint: 'ws://localhost:8001/ws/sidecar',
      permissions: ['webcam'],
    },
    crossTalk: {
      accepts: ['sec/biometric-auth'],
      emits: ['sec/biometric-auth'],
    },
  },
  'master-agentic-ai': {
    category: 'NEURAL',
    isolation: 'native-esm',
    sidecar: {
      type: 'python-sidecar',
      endpoint: 'ws://localhost:8001/ws/sidecar',
      permissions: ['gemini-api', 'shell-exec'],
    },
    crossTalk: {
      accepts: ['ai/prompt', 'ai/agent-task', 'sec/pcap-packet'],
      emits: ['ai/agent-task', 'code/patch'],
    },
  },
  'master-prompt-editor': {
    category: 'NEURAL',
    isolation: 'native-esm',
    crossTalk: {
      accepts: ['ai/prompt', 'text/plain'],
      emits: ['ai/prompt', 'ai/agent-task'],
    },
  },
  hovermind: {
    category: 'NEURAL',
    isolation: 'native-esm',
    sidecar: {
      type: 'python-sidecar',
      endpoint: 'ws://localhost:8001/ws/sidecar',
      permissions: ['gemini-api'],
    },
    crossTalk: {
      accepts: ['text/plain'],
      emits: ['ai/prompt', 'text/plain'],
    },
  },
  'autofix-engine': {
    category: 'DEV',
    isolation: 'native-esm',
    sidecar: {
      type: 'node-worker',
      endpoint: 'ws://localhost:8001/ws/sidecar',
      permissions: ['fs-local'],
    },
    crossTalk: {
      accepts: ['code/patch', 'text/plain'],
      emits: ['code/patch'],
    },
  },
};

function logInfo(msg: string) {
  console.log(`${styleText('cyan', '[OMNI-BUNDLER]')} ${msg}`);
}

function logSuccess(msg: string) {
  console.log(`${styleText('green', '✔ [SUCCESS]')} ${msg}`);
}

function acquireRepoSource(repoInput: string): { sourceDir: string; slug: string; repoUrl: string; isTemp: boolean } {
  const isRemote = repoInput.startsWith('http://') || repoInput.startsWith('https://') || repoInput.startsWith('git@');
  if (isRemote) {
    const cleanName = path.basename(repoInput.replace(/\.git$/, '')).toLowerCase();
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `omnigrid-${cleanName}-`));
    logInfo(`Cloning ${styleText('bold', repoInput)} into temporary workspace...`);
    execFileSync('git', ['clone', '--depth', '1', repoInput, tempDir], { stdio: 'inherit' });
    return { sourceDir: tempDir, slug: cleanName, repoUrl: repoInput, isTemp: true };
  } else {
    const resolved = path.resolve(ROOT_DIR, repoInput);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Local repository path does not exist: ${resolved}`);
    }
    const slug = path.basename(resolved).toLowerCase();
    return {
      sourceDir: resolved,
      slug,
      repoUrl: `https://github.com/GizzZmo/${path.basename(resolved)}`,
      isTemp: false,
    };
  }
}

function analyzeRepoAndGenerateManifest(
  sourceDir: string,
  slug: string,
  repoUrl: string,
  overrides: CliOptions
): OmniPluginManifest {
  const files = fs.readdirSync(sourceDir);
  const preset = REPO_PRESETS[slug];

  const hasPy = files.some((f) => f.endsWith('.py') || f === 'requirements.txt' || f === 'pyproject.toml');
  const hasCpp = files.some((f) => f.endsWith('.cpp') || f.endsWith('.h') || f === 'CMakeLists.txt');
  const hasTsx =
    fs.existsSync(path.join(sourceDir, 'src')) ||
    files.some((f) => f.endsWith('.tsx') || f === 'tsconfig.json');

  const category: WidgetCategory =
    overrides.category ||
    preset?.category ||
    (hasCpp ? 'AUDIO' : hasPy ? 'NEURAL' : 'DEV');

  const isolation: 'native-esm' | 'sandboxed-iframe' =
    overrides.isolation ||
    preset?.isolation ||
    (hasTsx ? 'native-esm' : 'sandboxed-iframe');

  let sidecar: OmniPluginManifest['sidecar'] = preset?.sidecar;
  if (!sidecar) {
    if (hasPy) {
      sidecar = {
        type: 'python-sidecar' as RuntimeSidecarType,
        endpoint: 'ws://localhost:8001/ws/sidecar',
        permissions: ['gemini-api'] as WidgetPermission[],
      };
    } else if (hasCpp) {
      sidecar = {
        type: 'cpp-daemon' as RuntimeSidecarType,
        endpoint: 'ws://localhost:1234/ipc/pcap-stream',
        permissions: [] as WidgetPermission[],
      };
    }
  }

  const accepts: CrossTalkMimeType[] = preset?.crossTalk?.accepts || ['text/plain', 'application/json', 'ai/prompt'];
  const emits: CrossTalkMimeType[] = preset?.crossTalk?.emits || ['text/plain', 'application/json'];

  const entryFileName = isolation === 'native-esm' ? 'index.js' : 'index.html';

  return {
    id: `gizzzmo.${category.toLowerCase()}.${slug}`,
    name: slug.toUpperCase().replace(/-/g, ' '),
    version: '1.0.0',
    repository: repoUrl,
    category,
    isolation,
    entryPoint: `/plugins/${slug}/${entryFileName}`,
    defaultLayout: { w: 6, h: 4, minW: 3, minH: 3 },
    ...(sidecar ? { sidecar } : {}),
    crossTalk: { accepts, emits },
  };
}

function ensureWidgetEntry(sourceDir: string, manifest: OmniPluginManifest): string {
  const candidates = [
    path.join(sourceDir, 'omni-widget.tsx'),
    path.join(sourceDir, 'src', 'omni-widget.tsx'),
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }

  const wrapperPath = path.join(sourceDir, '.omni-autogenerated-entry.tsx');
  const readmeSnippet = fs.existsSync(path.join(sourceDir, 'README.md'))
    ? fs.readFileSync(path.join(sourceDir, 'README.md'), 'utf-8').slice(0, 280).replace(/`/g, "'")
    : `${manifest.name} integrated module.`;

  const code = `
import React, { useState, useEffect } from 'react';

export default function AutoScaffoldedOmniWidget({ instanceId, manifest, bus }: any) {
  const [logs, setLogs] = useState<string[]>([
    '[INIT] Mounted ' + manifest.name + ' (' + instanceId + ')',
    '[REPO] ' + manifest.repository,
  ]);
  const [inputPayload, setInputPayload] = useState('');

  useEffect(() => {
    const unsubs = (manifest.crossTalk?.accepts || []).map((mime: string) =>
      bus.subscribe(mime, (env: any) => {
        setLogs((prev) => [
          '[' + new Date(env.timestamp).toLocaleTimeString() + '] RX (' + mime + '): ' + JSON.stringify(env.payload).slice(0, 90),
          ...prev.slice(0, 24),
        ]);
      })
    );
    return () => unsubs.forEach((u: any) => u());
  }, [bus, manifest]);

  const broadcastSignal = () => {
    const outMime = manifest.crossTalk?.emits?.[0] || 'text/plain';
    bus.emit(outMime, {
      source: manifest.id,
      message: inputPayload || 'Ping from ' + manifest.name,
      timestamp: Date.now(),
    });
    setInputPayload('');
  };

  return (
    <div className="flex flex-col h-full p-3 bg-slate-950 text-slate-200 font-mono text-xs gap-2">
      <div className="p-2 rounded bg-slate-900/90 border border-slate-800 text-[11px] text-slate-400">
        ${JSON.stringify(readmeSnippet)}
      </div>
      <div className="flex gap-1.5">
        <input
          value={inputPayload}
          onChange={(e) => setInputPayload(e.target.value)}
          placeholder={"Emit " + (manifest.crossTalk?.emits?.[0] || 'payload') + " to Cross-Talk Bus..."}
          className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-300"
        />
        <button
          onClick={broadcastSignal}
          className="px-3 py-1 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/30"
        >
          Emit
        </button>
      </div>
      <div className="flex-1 overflow-auto bg-black/60 p-2 rounded border border-slate-900 space-y-1">
        {logs.map((line, idx) => (
          <div key={idx} className="text-[10px] text-emerald-400/90 truncate">{line}</div>
        ))}
      </div>
    </div>
  );
}
`;
  fs.writeFileSync(wrapperPath, code, 'utf-8');
  return wrapperPath;
}

async function bundlePlugin(sourceDir: string, slug: string, manifest: OmniPluginManifest) {
  const outDir = path.join(PLUGINS_OUT_DIR, slug);
  fs.mkdirSync(outDir, { recursive: true });

  const manifestPath = path.join(outDir, 'omni-extension.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  if (manifest.isolation === 'native-esm') {
    const entryFile = ensureWidgetEntry(sourceDir, manifest);
    logInfo(`Bundling ${styleText('magenta', manifest.id)} as Native ESM via Vite...`);

    await viteBuild({
      configFile: false,
      root: sourceDir,
      build: {
        outDir,
        emptyOutDir: false,
        lib: {
          entry: entryFile,
          formats: ['es'],
          fileName: () => 'index.js',
        },
        rollupOptions: {
          external: ['react', 'react-dom', 'react/jsx-runtime'],
        },
      },
    });

    if (entryFile.endsWith('.omni-autogenerated-entry.tsx')) {
      fs.rmSync(entryFile, { force: true });
    }
  } else {
    logInfo(`Packaging ${styleText('yellow', manifest.id)} as Sandboxed Iframe...`);
    const htmlPath = path.join(outDir, 'index.html');
    const iframeHtml = `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8" />
  <title>${manifest.name}</title>
  <style>
    body { margin: 0; background: #020617; color: #e2e8f0; font-family: monospace; padding: 12px; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; background: #0f172a; color: #22d3ee; border: 1px solid #1e293b; font-size: 11px; }
    pre { background: #090d16; padding: 8px; border-radius: 6px; border: 1px solid #1e293b; overflow: auto; max-height: 180px; font-size: 11px; color: #34d399; }
  </style>
</head>
<body>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
    <strong>${manifest.name} [SANDBOXED]</strong>
    <span class="badge">${manifest.id}</span>
  </div>
  <pre id="telemetry">Waiting for Omni-Grid MessageChannel port...</pre>
  <script>
    let gridPort = null;
    const logEl = document.getElementById('telemetry');
    window.addEventListener('message', (event) => {
      if (event.data?.type === 'OMNIGRID_INIT_PORT' && event.ports?.[0]) {
        gridPort = event.ports[0];
        logEl.textContent = '[CONNECTED] Cross-Talk MessagePort bound to ' + event.data.instanceId + '\\n';
        gridPort.onmessage = (msg) => {
          logEl.textContent = '[' + msg.data.mimeType + '] ' + JSON.stringify(msg.data.payload) + '\\n' + logEl.textContent;
        };
      }
    });
  </script>
</body>
</html>`;
    fs.writeFileSync(htmlPath, iframeHtml, 'utf-8');
  }

  let registry: Record<string, OmniPluginManifest> = {};
  if (fs.existsSync(REGISTRY_FILE)) {
    registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
  }
  registry[manifest.id] = manifest;
  fs.writeFileSync(REGISTRY_FILE, JSON.stringify(registry, null, 2), 'utf-8');

  logSuccess(`Installed ${manifest.name} -> /public/plugins/${slug}/`);
}

async function main() {
  const { values } = parseArgs({
    options: {
      repo: { type: 'string', short: 'r' },
      category: { type: 'string', short: 'c' },
      isolation: { type: 'string', short: 'i' },
      'batch-profile': { type: 'boolean', short: 'b' },
    },
  });

  fs.mkdirSync(PLUGINS_OUT_DIR, { recursive: true });

  if (values['batch-profile']) {
    logInfo('Batch-scaffolding flagship GizzZmo repositories into /public/plugins...');
    for (const slug of Object.keys(REPO_PRESETS)) {
      const tempWorkspace = fs.mkdtempSync(path.join(os.tmpdir(), `omni-batch-${slug}-`));
      try {
        const manifest = analyzeRepoAndGenerateManifest(
          tempWorkspace,
          slug,
          `https://github.com/GizzZmo/${slug}`,
          {}
        );
        await bundlePlugin(tempWorkspace, slug, manifest);
      } finally {
        fs.rmSync(tempWorkspace, { recursive: true, force: true });
      }
    }
    return;
  }

  if (!values.repo) {
    console.error('Usage: npm run plugin:bundle -- --repo <github-url-or-local-path> [--category AUDIO|NEURAL|SECOPS|DEV]');
    process.exit(1);
  }

  const { sourceDir, slug, repoUrl, isTemp } = acquireRepoSource(values.repo);
  try {
    const manifest = analyzeRepoAndGenerateManifest(sourceDir, slug, repoUrl, {
      category: values.category as WidgetCategory | undefined,
      isolation: values.isolation as 'native-esm' | 'sandboxed-iframe' | undefined,
    });
    await bundlePlugin(sourceDir, slug, manifest);
  } finally {
    if (isTemp) {
      fs.rmSync(sourceDir, { recursive: true, force: true });
    }
  }
}

main().catch((err) => {
  console.error(styleText('red', `[FATAL] ${err.message}`));
  process.exit(1);
});

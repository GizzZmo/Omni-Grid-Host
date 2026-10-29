// src/services/phase9.ts
// Phase 9: Self-Healing Network
// Topology-aware mesh with redundant paths, automatic rerouting,
// and network-level health probes.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePhase5 } from './phase5';
import { usePhase7 } from './phase7';

export interface NetworkNode {
  id: string;
  name: string;
  type: 'core' | 'edge' | 'sidecar';
  status: 'up' | 'degraded' | 'down';
  latencyMs: number;
  load: number;
}

export interface NetworkLink {
  id: string;
  from: string;
  to: string;
  status: 'active' | 'degraded' | 'failed';
  latencyMs: number;
  bandwidthMbps: number;
  isPrimary: boolean;
}

export interface RouteDecision {
  id: string;
  timestamp: number;
  source: string;
  destination: string;
  path: string[];
  reason: string;
  success: boolean;
}

interface Phase9State {
  nodes: NetworkNode[];
  links: NetworkLink[];
  routes: RouteDecision[];
  selfHealNetwork: boolean;
  setSelfHealNetwork: (enabled: boolean) => void;
  probeNetwork: () => void;
  failLink: (linkId: string) => void;
  healLink: (linkId: string) => void;
  findPath: (source: string, dest: string) => string[] | null;
  reroute: (source: string, dest: string) => RouteDecision | null;
}

const DEFAULT_NODES: NetworkNode[] = [
  { id: 'core', name: 'Omni-Grid Core', type: 'core', status: 'up', latencyMs: 2, load: 0.15 },
  { id: 'edge-1', name: 'Edge Node 1', type: 'edge', status: 'up', latencyMs: 8, load: 0.22 },
  { id: 'edge-2', name: 'Edge Node 2', type: 'edge', status: 'up', latencyMs: 11, load: 0.18 },
  { id: 'sidecar-py', name: 'Python Sidecar', type: 'sidecar', status: 'up', latencyMs: 5, load: 0.1 },
  { id: 'sidecar-cpp', name: 'C++ Daemon', type: 'sidecar', status: 'up', latencyMs: 3, load: 0.08 },
];

const DEFAULT_LINKS: NetworkLink[] = [
  { id: 'l1', from: 'core', to: 'edge-1', status: 'active', latencyMs: 4, bandwidthMbps: 1000, isPrimary: true },
  { id: 'l2', from: 'core', to: 'edge-2', status: 'active', latencyMs: 6, bandwidthMbps: 1000, isPrimary: false },
  { id: 'l3', from: 'edge-1', to: 'sidecar-py', status: 'active', latencyMs: 3, bandwidthMbps: 500, isPrimary: true },
  { id: 'l4', from: 'edge-2', to: 'sidecar-py', status: 'active', latencyMs: 5, bandwidthMbps: 500, isPrimary: false },
  { id: 'l5', from: 'core', to: 'sidecar-cpp', status: 'active', latencyMs: 2, bandwidthMbps: 1000, isPrimary: true },
  { id: 'l6', from: 'edge-1', to: 'edge-2', status: 'active', latencyMs: 7, bandwidthMbps: 250, isPrimary: false },
];

function bfsPath(links: NetworkLink[], source: string, dest: string): string[] | null {
  if (source === dest) return [source];
  const adj = new Map<string, string[]>();
  for (const l of links) {
    if (l.status === 'failed') continue;
    if (!adj.has(l.from)) adj.set(l.from, []);
    if (!adj.has(l.to)) adj.set(l.to, []);
    adj.get(l.from)!.push(l.to);
    adj.get(l.to)!.push(l.from);
  }
  const queue: string[][] = [[source]];
  const seen = new Set<string>([source]);
  while (queue.length) {
    const path = queue.shift()!;
    const node = path[path.length - 1];
    for (const next of adj.get(node) || []) {
      if (seen.has(next)) continue;
      const newPath = [...path, next];
      if (next === dest) return newPath;
      seen.add(next);
      queue.push(newPath);
    }
  }
  return null;
}

export const usePhase9 = create<Phase9State>()(
  persist(
    (set, get) => ({
      nodes: DEFAULT_NODES,
      links: DEFAULT_LINKS,
      routes: [],
      selfHealNetwork: true,

      setSelfHealNetwork: (enabled) => {
        set({ selfHealNetwork: enabled });
        usePhase5.getState().appendAudit({
          actor: 'phase9',
          action: enabled ? 'netheal.enable' : 'netheal.disable',
          target: 'mesh',
          severity: 'info',
        });
      },

      probeNetwork: () => {
        const now = Date.now();
        set(s => {
          const nodes = s.nodes.map(n => {
            const fail = Math.random() < (n.status === 'down' ? 0.4 : 0.03);
            return {
              ...n,
              status: fail ? (Math.random() > 0.5 ? 'degraded' : 'down') : 'up',
              latencyMs: fail ? 80 + Math.random() * 120 : 2 + Math.random() * 12,
              load: Math.min(1, n.load + (Math.random() - 0.5) * 0.05),
            };
          });
          const links = s.links.map(l => {
            const from = nodes.find(n => n.id === l.from);
            const to = nodes.find(n => n.id === l.to);
            if (from?.status === 'down' || to?.status === 'down') {
              return { ...l, status: 'failed' as const };
            }
            if (from?.status === 'degraded' || to?.status === 'degraded') {
              return { ...l, status: 'degraded' as const, latencyMs: l.latencyMs * 1.5 };
            }
            return { ...l, status: 'active' as const };
          });
          return { nodes, links };
        });

        if (get().selfHealNetwork) {
          // Attempt to heal failed links if endpoints recovered
          get().links.forEach(l => {
            if (l.status === 'failed') {
              const from = get().nodes.find(n => n.id === l.from);
              const to = get().nodes.find(n => n.id === l.to);
              if (from?.status === 'up' && to?.status === 'up') {
                get().healLink(l.id);
              }
            }
          });
        }
      },

      failLink: (linkId) => {
        set(s => ({
          links: s.links.map(l => l.id === linkId ? { ...l, status: 'failed' as const } : l),
        }));
        usePhase5.getState().appendAudit({ actor: 'operator', action: 'link.fail', target: linkId, severity: 'warn' });
        usePhase7.getState().injectFault('pcap'); // cascade example
      },

      healLink: (linkId) => {
        set(s => ({
          links: s.links.map(l => l.id === linkId ? { ...l, status: 'active' as const, latencyMs: 5 } : l),
        }));
        usePhase5.getState().appendAudit({ actor: 'phase9', action: 'link.heal', target: linkId, severity: 'info' });
      },

      findPath: (source, dest) => bfsPath(get().links, source, dest),

      reroute: (source, dest) => {
        const path = get().findPath(source, dest);
        const decision: RouteDecision = {
          id: `rt-${Date.now().toString(36)}`,
          timestamp: Date.now(),
          source,
          destination: dest,
          path: path || [],
          reason: path ? 'BFS shortest active path' : 'No path available',
          success: !!path,
        };
        set(s => ({ routes: [decision, ...s.routes].slice(0, 50) }));
        usePhase5.getState().appendAudit({
          actor: 'phase9',
          action: 'route.compute',
          target: `${source}->${dest}`,
          severity: path ? 'info' : 'warn',
          payload: { path },
        });
        return decision;
      },
    }),
    { name: 'omnigrid-phase9-v1' }
  )
);

if (typeof window !== 'undefined') {
  window.setInterval(() => usePhase9.getState().probeNetwork(), 6000);
}

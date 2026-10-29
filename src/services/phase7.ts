// src/services/phase7.ts
// Phase 7: Self-Healing and Fault Tolerance
// Health probes, circuit breakers, automatic recovery, and fault injection.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePhase5 } from './phase5';
import { usePhase6 } from './phase6';

export type HealthStatus = 'healthy' | 'degraded' | 'down';

export interface ServiceHealth {
  id: string;
  name: string;
  status: HealthStatus;
  lastCheck: number;
  consecutiveFailures: number;
  recoveryAttempts: number;
  latencyMs: number;
}

export interface CircuitBreaker {
  serviceId: string;
  state: 'closed' | 'open' | 'half-open';
  failureThreshold: number;
  resetTimeoutMs: number;
  openedAt?: number;
}

export interface FaultEvent {
  id: string;
  timestamp: number;
  serviceId: string;
  type: 'probe-fail' | 'circuit-open' | 'recovery' | 'fault-injected';
  detail: string;
}

interface Phase7State {
  services: ServiceHealth[];
  breakers: CircuitBreaker[];
  faults: FaultEvent[];
  selfHealingEnabled: boolean;
  probeIntervalMs: number;
  setSelfHealing: (enabled: boolean) => void;
  probeAll: () => void;
  injectFault: (serviceId: string) => void;
  forceRecover: (serviceId: string) => void;
  getBreaker: (serviceId: string) => CircuitBreaker | undefined;
}

const DEFAULT_SERVICES = [
  { id: 'daemon', name: 'WebSocket Daemon' },
  { id: 'python-sidecar', name: 'Python Sidecar' },
  { id: 'wasm-dsp', name: 'WASM DSP' },
  { id: 'pcap', name: 'Network Analyzer' },
  { id: 'agent-mesh', name: 'Agent Mesh' },
];

function initialServices(): ServiceHealth[] {
  return DEFAULT_SERVICES.map(s => ({
    ...s,
    status: 'healthy' as HealthStatus,
    lastCheck: Date.now(),
    consecutiveFailures: 0,
    recoveryAttempts: 0,
    latencyMs: 12 + Math.random() * 20,
  }));
}

function initialBreakers(): CircuitBreaker[] {
  return DEFAULT_SERVICES.map(s => ({
    serviceId: s.id,
    state: 'closed' as const,
    failureThreshold: 3,
    resetTimeoutMs: 15000,
  }));
}

export const usePhase7 = create<Phase7State>()(
  persist(
    (set, get) => ({
      services: initialServices(),
      breakers: initialBreakers(),
      faults: [],
      selfHealingEnabled: true,
      probeIntervalMs: 5000,

      setSelfHealing: (enabled) => {
        set({ selfHealingEnabled: enabled });
        usePhase5.getState().appendAudit({
          actor: 'phase7',
          action: enabled ? 'selfheal.enable' : 'selfheal.disable',
          target: 'health',
          severity: 'info',
        });
      },

      probeAll: () => {
        const now = Date.now();
        const faults: FaultEvent[] = [];
        set(s => {
          const services = s.services.map(svc => {
            const breaker = s.breakers.find(b => b.serviceId === svc.id);
            // Skip if circuit is open and reset timeout not elapsed
            if (breaker?.state === 'open' && breaker.openedAt && now - breaker.openedAt < breaker.resetTimeoutMs) {
              return svc;
            }
            // Simulated probe: occasional failure, higher if previously degraded
            const failChance = svc.status === 'down' ? 0.6 : svc.status === 'degraded' ? 0.25 : 0.05;
            const failed = Math.random() < failChance;
            const latency = failed ? 800 + Math.random() * 400 : 8 + Math.random() * 30;

            if (failed) {
              const consecutive = svc.consecutiveFailures + 1;
              const status: HealthStatus = consecutive >= 3 ? 'down' : 'degraded';
              faults.push({
                id: `flt-${now}-${svc.id}`,
                timestamp: now,
                serviceId: svc.id,
                type: 'probe-fail',
                detail: `Probe failed (${consecutive} consecutive)`,
              });
              return { ...svc, status, lastCheck: now, consecutiveFailures: consecutive, latencyMs: latency };
            }
            return {
              ...svc,
              status: 'healthy' as HealthStatus,
              lastCheck: now,
              consecutiveFailures: 0,
              latencyMs: latency,
            };
          });

          // Update circuit breakers
          const breakers = s.breakers.map(b => {
            const svc = services.find(x => x.id === b.serviceId);
            if (!svc) return b;
            if (svc.consecutiveFailures >= b.failureThreshold && b.state === 'closed') {
              faults.push({
                id: `flt-${now}-cb-${svc.id}`,
                timestamp: now,
                serviceId: svc.id,
                type: 'circuit-open',
                detail: 'Circuit opened after threshold',
              });
              return { ...b, state: 'open' as const, openedAt: now };
            }
            if (b.state === 'open' && b.openedAt && now - b.openedAt >= b.resetTimeoutMs) {
              return { ...b, state: 'half-open' as const };
            }
            if (b.state === 'half-open' && svc.status === 'healthy') {
              return { ...b, state: 'closed' as const, openedAt: undefined };
            }
            return b;
          });

          return { services, breakers, faults: [...faults, ...s.faults].slice(0, 200) };
        });

        // Self-healing: attempt recovery for down services
        if (get().selfHealingEnabled) {
          get().services.forEach(svc => {
            if (svc.status === 'down') {
              get().forceRecover(svc.id);
            }
          });
        }
      },

      injectFault: (serviceId) => {
        const now = Date.now();
        set(s => ({
          services: s.services.map(svc =>
            svc.id === serviceId
              ? { ...svc, status: 'down' as HealthStatus, consecutiveFailures: 5, lastCheck: now }
              : svc
          ),
          breakers: s.breakers.map(b =>
            b.serviceId === serviceId ? { ...b, state: 'open' as const, openedAt: now } : b
          ),
          faults: [
            { id: `flt-${now}-inj-${serviceId}`, timestamp: now, serviceId, type: 'fault-injected', detail: 'Operator injected fault' },
            ...s.faults,
          ].slice(0, 200),
        }));
        usePhase5.getState().appendAudit({
          actor: 'operator',
          action: 'fault.inject',
          target: serviceId,
          severity: 'critical',
        });
      },

      forceRecover: (serviceId) => {
        const now = Date.now();
        set(s => ({
          services: s.services.map(svc =>
            svc.id === serviceId
              ? { ...svc, status: 'healthy' as HealthStatus, consecutiveFailures: 0, recoveryAttempts: svc.recoveryAttempts + 1, lastCheck: now, latencyMs: 15 }
              : svc
          ),
          breakers: s.breakers.map(b =>
            b.serviceId === serviceId ? { ...b, state: 'closed' as const, openedAt: undefined } : b
          ),
          faults: [
            { id: `flt-${now}-rec-${serviceId}`, timestamp: now, serviceId, type: 'recovery', detail: 'Self-heal recovery applied' },
            ...s.faults,
          ].slice(0, 200),
        }));
        usePhase5.getState().appendAudit({
          actor: 'phase7',
          action: 'selfheal.recover',
          target: serviceId,
          severity: 'info',
        });
        // Notify learning system
        usePhase6.getState().recordSignal({
          agentRole: 'CODE_FORGE',
          action: 'self-heal',
          outcome: 'success',
          reward: 0.4,
          context: serviceId,
        });
      },

      getBreaker: (serviceId) => get().breakers.find(b => b.serviceId === serviceId),
    }),
    { name: 'omnigrid-phase7-v1' }
  )
);

// Probe ticker
if (typeof window !== 'undefined') {
  window.setInterval(() => {
    usePhase7.getState().probeAll();
  }, 5000);
}

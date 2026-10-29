// src/services/phase6.ts
// Phase 6: Agent Autonomy + Adaptive Learning
// Agents can initiate tasks, observe outcomes, and adjust weights.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { crossTalkBus } from './crossTalkBus';
import { usePhase5 } from './phase5';

export interface LearningSignal {
  id: string;
  timestamp: number;
  agentRole: string;
  action: string;
  outcome: 'success' | 'fail' | 'neutral';
  reward: number; // -1 to +1
  context: string;
}

export interface AdaptiveWeight {
  agentRole: string;
  action: string;
  weight: number; // 0..1, higher = more likely to choose autonomously
  trials: number;
  successRate: number;
}

interface Phase6State {
  autonomyEnabled: boolean;
  learningEnabled: boolean;
  signals: LearningSignal[];
  weights: AdaptiveWeight[];
  autonomyIntervalMs: number;
  lastAutonomousAction: string | null;
  setAutonomy: (enabled: boolean) => void;
  setLearning: (enabled: boolean) => void;
  recordSignal: (signal: Omit<LearningSignal, 'id' | 'timestamp'>) => void;
  suggestAction: (agentRole: string, context: string) => string | null;
  tickAutonomy: () => void;
  resetLearning: () => void;
}

const DEFAULT_ACTIONS: Record<string, string[]> = {
  AUTOSEC_RESPONDER: ['scan-anomaly', 'draft-iptables', 'quarantine-suggest', 'status-report'],
  RESEARCH_ANALYST: ['summarize-capture', 'trend-scan', 'source-verify'],
  CODE_FORGE: ['lint-suggest', 'patch-draft', 'dependency-audit'],
  HOVERMIND: ['region-watch', 'ocr-propose', 'context-beam'],
};

function seededWeights(): AdaptiveWeight[] {
  const out: AdaptiveWeight[] = [];
  for (const [role, actions] of Object.entries(DEFAULT_ACTIONS)) {
    for (const action of actions) {
      out.push({ agentRole: role, action, weight: 0.5, trials: 0, successRate: 0.5 });
    }
  }
  return out;
}

export const usePhase6 = create<Phase6State>()(
  persist(
    (set, get) => ({
      autonomyEnabled: false,
      learningEnabled: true,
      signals: [],
      weights: seededWeights(),
      autonomyIntervalMs: 8000,
      lastAutonomousAction: null,

      setAutonomy: (enabled) => {
        set({ autonomyEnabled: enabled });
        usePhase5.getState().appendAudit({
          actor: 'phase6',
          action: enabled ? 'autonomy.enable' : 'autonomy.disable',
          target: 'agent-mesh',
          severity: 'info',
        });
      },

      setLearning: (enabled) => set({ learningEnabled: enabled }),

      recordSignal: (signal) => {
        const full: LearningSignal = {
          ...signal,
          id: `sig-${Date.now().toString(36)}`,
          timestamp: Date.now(),
        };
        set(s => ({ signals: [full, ...s.signals].slice(0, 300) }));

        if (!get().learningEnabled) return;

        // Update weights: success raises weight, fail lowers it
        set(s => ({
          weights: s.weights.map(w => {
            if (w.agentRole !== signal.agentRole || w.action !== signal.action) return w;
            const trials = w.trials + 1;
            const success = signal.outcome === 'success' ? 1 : signal.outcome === 'fail' ? 0 : 0.5;
            const successRate = (w.successRate * w.trials + success) / trials;
            // Exponential moving average toward reward
            const lr = 0.15;
            const target = Math.max(0.05, Math.min(0.95, w.weight + signal.reward * lr));
            return { ...w, trials, successRate, weight: target };
          }),
        }));

        usePhase5.getState().appendAudit({
          actor: signal.agentRole,
          action: `learn.${signal.outcome}`,
          target: signal.action,
          severity: signal.outcome === 'fail' ? 'warn' : 'info',
          payload: { reward: signal.reward },
        });
      },

      suggestAction: (agentRole, context) => {
        const candidates = get().weights.filter(w => w.agentRole === agentRole);
        if (!candidates.length) return null;
        // Softmax-like selection weighted by learned weight
        const total = candidates.reduce((sum, c) => sum + c.weight, 0);
        let r = Math.random() * total;
        for (const c of candidates) {
          r -= c.weight;
          if (r <= 0) return c.action;
        }
        return candidates[0].action;
      },

      tickAutonomy: () => {
        if (!get().autonomyEnabled) return;
        const mesh = usePhase5.getState().agentMesh;
        const idle = mesh.filter(n => n.status === 'idle');
        if (!idle.length) return;
        const node = idle[Math.floor(Math.random() * idle.length)];
        const action = get().suggestAction(node.role, 'autonomous-tick');
        if (!action) return;

        const task = `[AUTO] ${action}`;
        const taskId = usePhase5.getState().routeAgentTask(node.role, task);
        set({ lastAutonomousAction: `${node.role}:${action}` });

        // Simulate outcome after route completes (~1.4s)
        setTimeout(() => {
          const success = Math.random() > 0.25;
          get().recordSignal({
            agentRole: node.role,
            action,
            outcome: success ? 'success' : 'fail',
            reward: success ? 0.6 : -0.4,
            context: `task:${taskId}`,
          });
        }, 1400);
      },

      resetLearning: () => {
        set({ weights: seededWeights(), signals: [] });
        usePhase5.getState().appendAudit({
          actor: 'phase6',
          action: 'learning.reset',
          target: 'weights',
          severity: 'warn',
        });
      },
    }),
    { name: 'omnigrid-phase6-v1' }
  )
);

// Autonomy ticker
let ticker: number | null = null;
if (typeof window !== 'undefined') {
  const start = () => {
    if (ticker) return;
    ticker = window.setInterval(() => {
      usePhase6.getState().tickAutonomy();
    }, 8000);
  };
  start();
}

// Subscribe to Cross-Talk to learn from operator actions
if (typeof window !== 'undefined') {
  crossTalkBus.subscribe('ai/agent-task', (env: any) => {
    const p = env?.payload;
    if (p?.status === 'COMPLETED' && p?.agentRole && !String(p?.task || '').startsWith('[AUTO]')) {
      // Operator-initiated completion is a positive signal
      usePhase6.getState().recordSignal({
        agentRole: p.agentRole,
        action: 'operator-task',
        outcome: 'success',
        reward: 0.3,
        context: p.taskId || 'operator',
      });
    }
  });
}

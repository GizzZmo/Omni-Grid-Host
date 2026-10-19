// src/services/phase5.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { crossTalkBus } from './crossTalkBus';

export interface WorkspaceProfile { id: string; name: string; description: string; theme: 'cyber' | 'matrix' | 'void'; createdAt: number; }
export interface AuditEntry { id: string; timestamp: number; actor: string; action: string; target: string; severity: 'info' | 'warn' | 'critical'; payload?: unknown; }
export interface AgentMeshNode { id: string; role: string; status: 'idle' | 'busy' | 'error'; lastTask?: string; load: number; }

interface Phase5State {
  workspaces: WorkspaceProfile[];
  activeWorkspaceId: string;
  auditLog: AuditEntry[];
  agentMesh: AgentMeshNode[];
  hoverMindArmed: boolean;
  lastCapture: { region: string; text: string; timestamp: number } | null;
  createWorkspace: (name: string, description?: string) => string;
  switchWorkspace: (id: string) => void;
  appendAudit: (entry: Omit<AuditEntry, 'id' | 'timestamp'>) => void;
  armHoverMind: (armed: boolean) => void;
  simulateHoverCapture: (region: string, text: string) => void;
  routeAgentTask: (role: string, task: string) => string;
}

const DEFAULT_WORKSPACES: WorkspaceProfile[] = [
  { id: 'ws-default', name: 'Command Center', description: 'Primary operator workspace', theme: 'cyber', createdAt: Date.now() },
  { id: 'ws-secops', name: 'SecOps Watch', description: 'Isolated threat monitoring', theme: 'matrix', createdAt: Date.now() },
  { id: 'ws-studio', name: 'Sonic Studio', description: 'Audio / DSP production', theme: 'void', createdAt: Date.now() },
];

const DEFAULT_MESH: AgentMeshNode[] = [
  { id: 'agent-autosec', role: 'AUTOSEC_RESPONDER', status: 'idle', load: 0.12 },
  { id: 'agent-research', role: 'RESEARCH_ANALYST', status: 'idle', load: 0.05 },
  { id: 'agent-code', role: 'CODE_FORGE', status: 'idle', load: 0.08 },
  { id: 'agent-hover', role: 'HOVERMIND', status: 'idle', load: 0.02 },
];

export const usePhase5 = create<Phase5State>()(
  persist(
    (set, get) => ({
      workspaces: DEFAULT_WORKSPACES,
      activeWorkspaceId: 'ws-default',
      auditLog: [],
      agentMesh: DEFAULT_MESH,
      hoverMindArmed: false,
      lastCapture: null,
      createWorkspace: (name, description = '') => {
        const id = `ws-${Date.now().toString(36)}`;
        const ws: WorkspaceProfile = { id, name, description, theme: 'cyber', createdAt: Date.now() };
        set(s => ({ workspaces: [...s.workspaces, ws] }));
        get().appendAudit({ actor: 'system', action: 'workspace.create', target: id, severity: 'info', payload: { name } });
        return id;
      },
      switchWorkspace: (id) => {
        set({ activeWorkspaceId: id });
        get().appendAudit({ actor: 'operator', action: 'workspace.switch', target: id, severity: 'info' });
        crossTalkBus.emit('system/workspace', { workspaceId: id });
      },
      appendAudit: (entry) => {
        const full: AuditEntry = { ...entry, id: `aud-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, timestamp: Date.now() };
        set(s => ({ auditLog: [full, ...s.auditLog].slice(0, 500) }));
      },
      armHoverMind: (armed) => {
        set({ hoverMindArmed: armed });
        get().appendAudit({ actor: 'operator', action: armed ? 'hovermind.arm' : 'hovermind.disarm', target: 'os-capture', severity: 'info' });
      },
      simulateHoverCapture: (region, text) => {
        if (!get().hoverMindArmed) return;
        const capture = { region, text, timestamp: Date.now() };
        set({ lastCapture: capture });
        get().appendAudit({ actor: 'hovermind', action: 'os.capture', target: region, severity: 'info', payload: { text: text.slice(0, 120) } });
        crossTalkBus.emit('ai/prompt', { source: 'hovermind', region, text, instruction: 'Analyze the captured OS region and propose an action.' });
      },
      routeAgentTask: (role, task) => {
        const mesh = get().agentMesh;
        const node = mesh.find(n => n.role === role) || mesh[0];
        const taskId = `task-${Date.now().toString(36)}`;
        set(s => ({ agentMesh: s.agentMesh.map(n => n.id === node.id ? { ...n, status: 'busy' as const, lastTask: task, load: Math.min(1, n.load + 0.15) } : n) }));
        get().appendAudit({ actor: 'mesh', action: 'agent.route', target: node.id, severity: 'info', payload: { role, task } });
        crossTalkBus.emit('ai/agent-task', { agentRole: role, taskId, task, status: 'PENDING' });
        setTimeout(() => {
          set(s => ({ agentMesh: s.agentMesh.map(n => n.id === node.id ? { ...n, status: 'idle' as const, load: Math.max(0, n.load - 0.1) } : n) }));
          crossTalkBus.emit('ai/agent-task', { agentRole: role, taskId, status: 'COMPLETED', output: `[${role}] Completed: ${task.slice(0, 80)}` });
        }, 1200);
        return taskId;
      },
    }),
    { name: 'omnigrid-phase5-v1' }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && e.key === 'H') {
      const s = usePhase5.getState();
      s.armHoverMind(!s.hoverMindArmed);
    }
  });
}

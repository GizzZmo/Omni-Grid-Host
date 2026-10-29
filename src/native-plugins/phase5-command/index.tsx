// public/plugins/phase5-command/index.tsx
// Phase 5 Command Widget — Workspaces, Agent Mesh, HoverMind, Audit
import React, { useState } from 'react';
import { OmniWidgetHostProps } from '../../../src/types/plugin-sdk';
import { usePhase5 } from '../../../src/services/phase5';

export default function Phase5CommandWidget({ bus }: OmniWidgetHostProps) {
  const {
    workspaces,
    activeWorkspaceId,
    auditLog,
    agentMesh,
    hoverMindArmed,
    lastCapture,
    createWorkspace,
    switchWorkspace,
    armHoverMind,
    simulateHoverCapture,
    routeAgentTask,
  } = usePhase5();

  const [newWsName, setNewWsName] = useState('');
  const [taskRole, setTaskRole] = useState('AUTOSEC_RESPONDER');
  const [taskText, setTaskText] = useState('');

  return (
    <div className="flex flex-col h-full p-3 bg-slate-950 text-slate-100 font-mono text-xs gap-3 select-none overflow-auto">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <span className="text-cyan-400 font-bold tracking-widest">PHASE 5 // ENTERPRISE MESH</span>
        <span className={`px-2 py-0.5 rounded text-[10px] border ${hoverMindArmed ? 'bg-rose-950 text-rose-300 border-rose-500/50' : 'bg-slate-900 text-slate-400 border-slate-700'}`}>
          HOVERMIND {hoverMindArmed ? 'ARMED' : 'STANDBY'}
        </span>
      </div>

      {/* Workspaces */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Workspaces</div>
        <div className="flex flex-wrap gap-1.5">
          {workspaces.map(ws => (
            <button
              key={ws.id}
              onClick={() => switchWorkspace(ws.id)}
              className={`px-2 py-1 rounded border text-[10px] ${
                ws.id === activeWorkspaceId
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200'
                  : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              {ws.name}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          <input
            value={newWsName}
            onChange={e => setNewWsName(e.target.value)}
            placeholder="New workspace name"
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-300"
          />
          <button
            onClick={() => { if (newWsName.trim()) { createWorkspace(newWsName.trim()); setNewWsName(''); } }}
            className="px-2 py-1 rounded bg-cyan-500/20 border border-cyan-400/50 text-cyan-300"
          >
            Create
          </button>
        </div>
      </div>

      {/* Agent Mesh */}
      <div className="space-y-1.5">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Agent Mesh</div>
        <div className="grid grid-cols-2 gap-1.5">
          {agentMesh.map(node => (
            <div key={node.id} className="bg-slate-900/70 border border-slate-800 rounded p-1.5">
              <div className="flex justify-between">
                <span className="text-emerald-400">{node.role}</span>
                <span className={node.status === 'busy' ? 'text-amber-400' : 'text-slate-500'}>{node.status}</span>
              </div>
              <div className="h-1 bg-slate-800 rounded mt-1">
                <div className="h-1 bg-cyan-400 rounded" style={{ width: `${node.load * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-1.5">
          <select
            value={taskRole}
            onChange={e => setTaskRole(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-300"
          >
            {agentMesh.map(n => <option key={n.id} value={n.role}>{n.role}</option>)}
          </select>
          <input
            value={taskText}
            onChange={e => setTaskText(e.target.value)}
            placeholder="Route task to mesh..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-cyan-300"
          />
          <button
            onClick={() => { if (taskText.trim()) { routeAgentTask(taskRole, taskText.trim()); setTaskText(''); } }}
            className="px-2 py-1 rounded bg-purple-500/20 border border-purple-400/50 text-purple-300"
          >
            Route
          </button>
        </div>
      </div>

      {/* HoverMind */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">HoverMind OS Capture</div>
          <button
            onClick={() => armHoverMind(!hoverMindArmed)}
            className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px]"
          >
            {hoverMindArmed ? 'Disarm' : 'Arm (Alt+Shift+H)'}
          </button>
        </div>
        {hoverMindArmed && (
          <button
            onClick={() => simulateHoverCapture('external-window', 'Sample OS region: terminal output with anomalous process.')}
            className="w-full px-2 py-1 rounded bg-rose-500/10 border border-rose-500/40 text-rose-300 text-[10px]"
          >
            Simulate Capture → Neural Scratchpad
          </button>
        )}
        {lastCapture && (
          <div className="bg-black/50 border border-slate-800 rounded p-1.5 text-[10px] text-slate-300">
            <span className="text-cyan-400">[{lastCapture.region}]</span> {lastCapture.text}
          </div>
        )}
      </div>

      {/* Audit Log */}
      <div className="flex-1 min-h-0 space-y-1">
        <div className="text-[10px] text-slate-400 uppercase tracking-wider">Enterprise Audit Log</div>
        <div className="h-28 overflow-auto bg-black/60 border border-slate-800 rounded p-1.5 space-y-0.5">
          {auditLog.length === 0 && <div className="text-slate-600">No entries yet.</div>}
          {auditLog.slice(0, 12).map(e => (
            <div key={e.id} className="text-[10px] truncate">
              <span className={e.severity === 'critical' ? 'text-rose-400' : e.severity === 'warn' ? 'text-amber-400' : 'text-slate-500'}>
                {new Date(e.timestamp).toLocaleTimeString()}
              </span>{' '}
              <span className="text-cyan-400">{e.action}</span>{' '}
              <span className="text-slate-400">{e.target}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

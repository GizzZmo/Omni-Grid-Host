const MAP: Record<string, string> = {
  THEME_ENGINE: 'gizzzmo.system.aesthetic',
  ASSET: 'gizzzmo.system.assets',
  BROWSER_WIDGET: 'gizzzmo.dev.browser',
  CHAIN_PULSE: 'gizzzmo.finance.chain',
  CHROMA_LAB: 'gizzzmo.creative.chroma',
  CIPHER_PAD: 'gizzzmo.secops.cipherpad',
  CLIPBOARD: 'gizzzmo.system.clipboard',
  COMMUNITY_PORTAL: 'gizzzmo.system.community',
  CYBER_EDITOR: 'gizzzmo.dev.editor',
  DEV_OPTIC: 'gizzzmo.dev.optic',
  DOCU_HUB: 'gizzzmo.dev.docs',
  FOCUS_HUD: 'gizzzmo.system.focus',
  GHOST: 'gizzzmo.system.ghost',
  GIT_PULSE: 'gizzzmo.dev.git',
  HELP: 'gizzzmo.system.help',
  MACRO_NET: 'gizzzmo.system.macro',
  MARKET: 'gizzzmo.finance.market',
  NEURAL_CHAT: 'gizzzmo.neural.chat',
  SCRATCHPAD: 'gizzzmo.neural.scratch',
  NEWS_FEED: 'gizzzmo.system.news',
  PDF_VIEWER: 'gizzzmo.dev.pdf',
  POLYGLOT: 'gizzzmo.system.polyglot',
  PROJECT_TRACKER: 'gizzzmo.dev.tracker',
  PROMPT_LAB: 'gizzzmo.neural.prompt',
  CALC: 'gizzzmo.dev.calc',
  REG_RADAR: 'gizzzmo.system.radar',
  RESEARCH_BROWSER: 'gizzzmo.neural.research',
  SECURE_CALENDAR: 'gizzzmo.system.calendar',
  RADIO: 'gizzzmo.system.radio',
  STRATEGIC: 'gizzzmo.system.blueprint',
  SUDOKU: 'gizzzmo.creative.sudoku',
  SUNO_PLAYER: 'gizzzmo.audio.suno',
  SYSTEM: 'gizzzmo.system.core',
  TEMPORAL: 'gizzzmo.system.temporal',
  TRANSFORMER: 'gizzzmo.dev.transform',
  VALUTA: 'gizzzmo.finance.valuta',
  WEATHER: 'gizzzmo.system.weather',
  WEB_TERMINAL: 'gizzzmo.dev.terminal',
  ARCHITECT: 'gizzzmo.system.architect',
  MARKETPLACE: 'gizzzmo.system.marketplace',
  WRITEPAD: 'gizzzmo.creative.write',
  SONIC: 'gizzzmo.audio.sonic-architecture',
  MULTI_AGENT_HUB: 'gizzzmo.neural.multi-agent',
  CIPHER_VAULT: 'gizzzmo.secops.cipher-vault',
};

function reveal(instanceId: string) {
  requestAnimationFrame(() => {
    document.querySelector(`[data-instance="${CSS.escape(instanceId)}"]`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  });
}

async function registry() {
  const { usePluginRegistry } = await import('../store/pluginRegistryStore');
  return usePluginRegistry.getState();
}

export async function openOnDesk(widgetType: string) {
  const pluginId = MAP[widgetType];
  if (!pluginId) return false;
  const reg = await registry();
  const existing = reg.activeInstances.find((item) => item.pluginId === pluginId);
  const instanceId = existing?.instanceId ?? reg.spawnWidget(pluginId);
  if (!instanceId) return false;
  reveal(instanceId);
  return true;
}

export async function closeOnDesk(widgetType: string) {
  const pluginId = MAP[widgetType];
  if (!pluginId) return;
  const reg = await registry();
  reg.activeInstances
    .filter((item) => item.pluginId === pluginId)
    .forEach((item) => reg.closeWidget(item.instanceId));
}

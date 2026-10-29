# Operator manual

> "Same chair, different packet. Sit. The status bar will tell you who is actually linked."  
> — Jon-Arve Constantine

This is the daily use of Omni-Grid Host 3.0: what is on screen, what persists, and the order of operations that keeps the desk honest.

Related: [TIPS-AND-TRICKS.md](TIPS-AND-TRICKS.md), [AUDIO-DESK.md](AUDIO-DESK.md), [SIDECARS.md](SIDECARS.md), [GREETINGS.md](GREETINGS.md).

---

## What you are looking at

The shell is a full-window bento.

| Region | What it is |
|--------|------------|
| Header | Mark, title, horizontal plugin launcher, Settings gear |
| Main | Draggable grid. Core tiles plus every plugin you have spawned |
| Footer | Bus motto, AI provider, **C++** link, **PY** link |
| Rain | Background. Not a control |

Core tiles:

- **NEURAL** — prompt the Phase 1 bus, spawn a worker, see BUS LIVE when the daemon is connected.
- **SONIC** — chassis audio tile and the older worklet path.
- **SECOPS** — lock, unlock, and a short alert path. The full radar is a separate plugin.
- **DEV** — forge / patch posture for the self-healing editor path.

Plugins are everything in the **+** list. The audio chain that matters for music is **NAW**, **TABFRET**, and **DSP4Guitar**.

## A session, in order

1. Open the desk.
2. Glance at the footer.
   - Provider line: who will answer prose, and whether a key is stored.
   - C++ / PY: whether the native sidecars are up.
3. If you came to write music, ignore the other tiles until PLAY STEMS has made a sound. See [AUDIO-DESK.md](AUDIO-DESK.md).
4. If you came to watch the wire, spawn SecOps Sentinel and leave C++ linked.
5. If you came to change models, open Settings, pick a card, save, close it.
6. Before you leave, look once at the layout. What you see is what the next session will try to restore.

## Launcher

Each button spawns one instance of that manifest at the default size.

- The label is the first word of the plugin name.
- Hover for the full title.
- The row scrolls. On a small screen it is the right-hand side of the header, not a missing menu.
- Spawning twice gives you two instances. They share the bus. Two NAWs means two clocks. Don't, unless you are testing the bus.

Closing an instance does not unregister the manifest. The button remains.

## Settings

Open the gear.

1. Choose a provider card. The logo and name are the choice. You do not have to remember an enum.
2. Paste the key, or for Ollama and custom endpoints, the base URL.
3. Override the model only if the default is wrong for that account.
4. Save. The footer checkmark is the confirmation.
5. Clear the key when you are on a machine you do not trust. The rest of the desk keeps working locally.

Keys live in browser storage for this origin. They are not written into the repository.

## Layout and persistence

The grid library saves positions. Plugin instances save separately from the four core tiles.

- Drag handle: the widget title strip.
- A layout that overflows the window is scrolled, not clipped forever. Scroll the main area.
- Very small tiles hide their own controls. Give NAW at least half the row.
- A biometric lock blurs and blocks the grid on purpose. Unlock from the SecOps control. Do not refresh in a panic unless the blur is stuck, and even then look at the lock state first.

## The footer, decoded

| Text | Meaning |
|------|---------|
| C++ LINKED | WebSocket to the network analyzer is open |
| C++ OFF | No analyzer socket. Radar will be empty |
| PY LINKED | WebSocket to the Python sidecar is open |
| PY OFF | Prompts stay in the browser |
| AI: gemini ✓ | That provider has a stored key |
| AI: ollama (no key) | No key stored. Local or anonymous behavior |
| BUS LIVE (inside Neural) | Phase 1 daemon accepted the widget socket |
| local (inside Neural) | Daemon not connected. The tile still edits |

LINKED can lag a second after boot while the sockets retry. OFF that never flips means the process is not there. [SIDECARS.md](SIDECARS.md).

## Identity

When the Python sidecar has clients, it periodically emits `sec/biometric-auth`. Without a webcam forced on, it reports the operator present:

- identity: **Jon-Arve Constantine**
- vault locked: false

SecOps Sentinel is what displays that line. The chassis lock is a separate control you throw yourself.

The greetings in [GREETINGS.md](GREETINGS.md) are written in that operator's voice. They are documentation, not a chatbot. Use them when you need a line that sounds like the person the lock is named for.

## Work you can do without extra plugins

- Dispatch a neural prompt from the Neural tile.
- Start the chassis DSP from Sonic.
- Throw the biometric lock and watch the grid blur.
- Stage a forge action from Dev.
- Change provider.

## Work that needs a spawned plugin

- Multi-stem timeline, chord ribbon, sixteenth grid: **NAW**.
- Fret numbers: **TABFRET**.
- Guitar input, phones, Karplus-Strong: **DSP4Guitar**.
- Polar radar and quarantine playbook: **SecOps Sentinel**.
- Workspaces, mesh, HoverMind, audit: **Phase 5**.
- Learning weights: **Phase 6**.
- Breakers and heals: **Phase 7**.
- Hybrid PQC demo: **Phase 8**.
- Link failures and reroute: **Phase 9**.

## Leaving the desk

Nothing here asks you to export. The layout, the plugin instances, the provider, and the phase stores are already in the browser.

If you need a clean chair for someone else:

1. Clear the API key.
2. Close plugin instances you do not want them to inherit.
3. Unlock the biometric overlay so they are not staring at a blur and filing a bug.

The rain will still be there. That part is not personal.

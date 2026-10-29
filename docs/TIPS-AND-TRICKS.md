# Tips and tricks

> "Read the tips. Then break one rule on purpose, so you know which rule was holding the mix together."  
> — Jon-Arve Constantine

Practical moves for the Omni-Grid Host desk. For the long walkthrough see [OPERATOR-MANUAL.md](OPERATOR-MANUAL.md). For the audio chain see [AUDIO-DESK.md](AUDIO-DESK.md). For the wires see [SIDECARS.md](SIDECARS.md).

---

## The first five minutes

1. Let the shell finish loading. The header is the launcher. The footer is the truth.
2. Read the footer before you read a widget. **C++ LINKED** and **PY LINKED** mean the sidecars answered. **OFF** means you are local-only.
3. Scroll the **+** buttons in the header. Names are the first word of the manifest (`NAW`, `TABFRET`, `DSP4Guitar`, `Phase`, `AutoSec`). The tooltip is the full name.
4. The audio row is already on the desk: NAW across the wider tile, TABFRET and DSP4Guitar stacked beside it. Press **PLAY STEMS**.
5. Click the gear. If you have a key, put it in. If you do not, leave it. Local synthesis still talks.

## Arranging the bento

- Drag a tile by its **title bar**, never by a knob or a step. The body is the instrument.
- Resize from the corner. NAW wants width. A sixteen-step row in a narrow tile becomes a suspicion, not a sequencer.
- The grid scrolls. Tiles you cannot see are below the fold, not deleted.
- Close with **✕**. Spawning again from the launcher creates a new instance. The old layout of that instance is gone.
- Core tiles (Neural, Sonic, SecOps, Dev) are the chassis. Plugin tiles are guests. Both persist.
- If the desk comes back as a single crushed column, the saved layout is stale. Close the guests, refresh once, and place NAW again. Do not keep nudging a broken persist and calling it design.
- Four live tiles beat twelve idle ones. Park the rest in the launcher.

## NAW, the timeline

- **PLAY STEMS** starts a frame-synced sixteenth-note clock. **STOP TRANSPORT** parks the playhead where it is.
- BPM is a number box. You can also write `126 BPM` inside the Neural Compose sentence and let the sidecar pick it up.
- Guitar steps emit `audio/midi`: chord name, six frets, note numbers, BPM. TABFRET and DSP4Guitar are already listening.
- Empty steps are rest. A lit step is a hit. Click to flip.
- **M** is mute. **S** is solo. If any solo is on, only soloed stems speak. This is the usual reason a "broken" mix is actually fine.
- Drums, bass, and the pad are local oscillators. They do not need the Python sidecar. The guitar part is the one that leaves the tile.
- The ribbon under the prompt is one chord per bar (steps 1, 5, 9, 13). Click to audition. Drag onto TABFRET or anywhere that accepts `audio/midi`.
- **Neural Compose** rewrites the pattern locally and sends `ai/prompt` to Python. When Python is linked, the reply can replace BPM and the guitar ribbon. Read the status line under the transport. It changes when a reply lands.
- Words that pull darker voicings: `phrygian`, `noir`, `dark`, `minor`. "Cinematic" does not. Constantine has opinions about this. He is right.

## TABFRET

- It shows the current chord name, BPM, and six fret numbers. `X` is a muted string.
- It updates when NAW plays or when you click a ribbon chord.
- The whole card is draggable as MIDI. The button broadcasts the chord again if you want to poke the DSP without dragging.
- If the frets look stale, you are looking at the last chord, not a frozen widget. Play a step or click the ribbon.

## DSP4Guitar

- **ARM WASM DSP** brings up the worklet. The browser may stay silent until you click the page once. That is autoplay policy, not a dead rack.
- **Enable Guitar Input** asks for the microphone. Use a direct input if you have one. Turn **INPUT** down before you arm it. Turn **PHONES** down before you arm anything.
- INPUT runs about 0–4×. PHONES runs about 0–150%. Set phones first, then drive.
- Preset menu is the quick tone. Tube drive, cabinet, and delay are the slow tone.
- Incoming MIDI from NAW or TABFRET is drawn on the spectrum strip and, when the worklet is up, played as Karplus-Strong.
- The canvas is a meter, not a button. Click the arm and input controls, not the waveform.

## Cross-Talk, the only trick that matters

Widgets do not import each other. They post envelopes.

| You want | Do this |
|----------|---------|
| Hear a NAW chord on the fretboard | Press play, or click the ribbon |
| Hand one chord to another tile | Drag the ribbon chip |
| Send a prose task to Python | Neural Compose, or any tile that emits `ai/prompt` |
| See packets | Spawn **SecOps Sentinel** while C++ is LINKED |
| Lock the glass | SecOps tile, biometric lock. The grid blurs on purpose |

A widget may only emit MIME types it declared. If a send "does nothing," the manifest probably does not list that type. That is the security check, not a bug.

## Sidecars without superstition

- Footer **C++ LINKED**: the network analyzer socket is open. Packets arrive as `sec/pcap-packet`. Every 7th frame in the unprivileged build is a deliberate spike (high byte count, high anomaly).
- Footer **PY LINKED**: the FastAPI sidecar is open. Prompts go out, agent replies and biometric heartbeats come back.
- NAW's own badge should read **SIDECAR LINKED** when its Python socket is up. The footer can be linked even if you have not spawned NAW.
- Neural tiles flip to **BUS LIVE** when the Phase 1 daemon accepts them. That bus is the process supervisor. It is not the same socket as Python.
- Anomaly above 0.85 is forwarded from C++ to Python by the bridge. You do not have to wire that by hand.
- If a badge stays OFF, the process is down or the proxy cannot see it. Start the C++ server (it spawns Python) and `npm run daemon`, then reload the desk. Details in [SIDECARS.md](SIDECARS.md).

## Settings that actually matter

- The gear opens providers: OpenAI, Anthropic, Gemini, Groq, Ollama, or a custom OpenAI-compatible base URL.
- The key stays in this browser. It is not a project secret and it is not sent to the grid's own host.
- Ollama wants a base URL, usually `http://localhost:11434`, and a model name you have already pulled.
- Empty key: widgets should say they are local. If a tile pretends otherwise, do not trust it.
- The footer shows the provider name and a check when a key is stored.

## SecOps, briefly

- Spawn **SecOps Sentinel** from the launcher when you want the radar, not just the small SecOps chassis tile.
- Blips are polar: address hashes to an angle, anomaly pulls the dot inward. Rose means above 0.80.
- The lock overlay blurs the whole desk. Unlock before you decide the app has frozen.
- Drag a packet or a playbook into another tile that accepts `sec/pcap-packet` or `text/plain`.
- BLOCK emits a quarantine prompt. Read it before you treat it as already applied to a real firewall.

## Phases, without opening all of them

| Launcher name | Use it when |
|---------------|-------------|
| Phase 5 | Workspaces, agent mesh, HoverMind arm, audit |
| Phase 6 | Let idle agents pick work and show what they learned |
| Phase 7 | Probes, circuit breakers, fault injection |
| Phase 8 | Hybrid post-quantum demo: keys, envelopes, signatures |
| Phase 9 | Topology, failed links, reroute |

Alt+Shift+H arms HoverMind in the Phase 5 tile. Do not arm it to see what happens. Arm it when you mean to capture.

Phase 8 is a teaching model of hybrid encryption, not a production HSM. Do not put a real secret in it and call the job done.

## Keyboard, mouse, and browser quirks

- One click on the desk resumes `AudioContext` after a reload. Silence before that click is normal.
- Number inputs eat scroll-wheel changes. Click the BPM field, type, then click away.
- Drag-and-drop of chords uses `application/x-omnigrid-crosstalk`. A normal text drop will not carry the frets.
- Two solos do not blend with the muted world. Solo is a filter, not a boost.
- The launcher row scrolls horizontally. Shift-scroll or drag the row if your trackpad only scrolls vertically.
- Devtools console warnings about a refused socket mean that sidecar was not running at connect time. The bridge retries. A later LINKED state is the one that counts.

## Habits worth stealing

- Name the prompt with a number and a mode: `Minimal techno 126 BPM in E Phrygian with syncopated guitar stabs`. That sentence already matches what the composer knows how to read.
- Audition a ribbon chord before you let the transport play it for eight bars.
- Solo the guitar stem, confirm TABFRET, then bring drums back. Debugging polyphony by ear is slower than this.
- Watch the footer while you hit Neural Compose. If PY is OFF, you still get a local pattern. If PY is LINKED, wait one breath for the ribbon to be replaced by the reply.
- Spawn Sentinel only when you are looking at the wire. A radar you are not watching is just a canvas.
- Keep the API key in Settings and the musical idea in the prompt. Do not paste keys into Neural Compose. Constantine will not forgive you, and neither will your git history.

## What not to do

- Do not stack a second NAW "to hear it louder." You will emit two MIDI streams and call the fretboard haunted.
- Do not resize a sequencer to a sliver and then file a bug about steps you cannot click.
- Do not treat Phase 8 ciphertext as safe to email.
- Do not confuse the chassis **SecOps** tile with **SecOps Sentinel**. The sentinel is the radar.
- Do not kill the C++ process and expect Python to keep being spawned. Python is a child of that server unless you started Uvicorn yourself.

More words from the operator: [GREETINGS.md](GREETINGS.md).

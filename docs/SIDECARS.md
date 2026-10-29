# Sidecars

> "C++ is counting packets. Python is counting chords. I am counting on you to read both."  
> — Jon-Arve Constantine

Three processes sit behind the desk. The browser does not talk to their raw ports during normal use. The dev server proxies them so the page, the preview, and a local checkout all use the same paths.

| Badge | Process | Proxied path | Direct port |
|-------|---------|--------------|-------------|
| C++ LINKED | `omnigrid_server` | `/ipc/pcap-stream` | 1234 |
| PY LINKED | FastAPI `server/sidecar/main.py` | `/ws/sidecar` | 8001 |
| BUS LIVE | `server/omnigrid-daemon.mjs` | `/ws/bus` | 8765 |

The C++ binary is what spawns Uvicorn. Start that, and Python comes with it, as long as `uvicorn` is on your PATH.

---

## Start them

From the repo root, after `npm install` and a working `g++` and Python 3.10+:

```bash
# Python deps once
pip install fastapi 'uvicorn[standard]'

# C++ analyzer. Spawns the Python sidecar as a child.
g++ -std=c++17 -O2 -pthread server/omnigrid_server.cpp -o omnigrid_server
./omnigrid_server 1234

# In another shell: Phase 1 bus
npm run daemon
```

Optional live capture instead of the built-in spike pattern:

```bash
g++ -std=c++17 -O2 -pthread -DHAVE_PCAP server/omnigrid_server.cpp -lpcap -o omnigrid_server
```

Without libpcap the analyzer still runs. It emits a telemetry frame about every 1.5 seconds. Every 7th frame is a spike: a loud source address, a large byte count, anomaly 0.94. The others are a quiet LAN address at 0.08. That rhythm is deliberate so the radar and the forward-to-Python rule can be tested with no privileges.

Health:

```bash
curl http://127.0.0.1:1234/api/sidecar/health
curl http://127.0.0.1:8765/health
```

Python is healthy when Uvicorn answers on 8001.

Then:

```bash
npm run dev
```

Reload the desk. The footer should move from OFF to LINKED. Neural tiles should move from `local` to **BUS LIVE**.

`npm run dev:full` starts the Node daemon and Vite together. It does not compile the C++ server. You still want `omnigrid_server` if you want packets and the Python child.

## What crosses the bridge

`src/services/sidecarBridge.ts` holds the two sockets.

On C++ message:

- Parse the JSON envelope.
- `dispatch` it onto the Cross-Talk bus.
- If it is `sec/pcap-packet` and `anomalyScore > 0.85`, and Python is open, forward the same frame to Python.

On Python message:

- `dispatch` onto the bus. Typical types: `ai/agent-task`, `sec/biometric-auth`.

On `ai/prompt` from any widget (NAW's Neural Compose included):

- If Python is open, the envelope is sent as text.

Widgets do not need their own socket for this. NAW also opens the Python path so its badge can say **SIDECAR LINKED**. The bridge is the one that actually forwards prompts.

## Packet shape

```json
{
  "id": "pcap-7",
  "timestamp": 0,
  "sourceWidgetId": "cpp.sidecar.network-analyzer",
  "targetWidgetId": "*",
  "mimeType": "sec/pcap-packet",
  "payload": {
    "srcIp": "185.220.101.42",
    "dstIp": "10.0.0.1",
    "protocol": "TCP",
    "bytes": 4096,
    "anomalyScore": 0.94
  }
}
```

SecOps Sentinel hashes the source address to an angle and pulls the radius in as the score rises. Scores above 0.80 are drawn as anomalies.

With libpcap, the score is 0.87 when the captured length is over 1400 bytes, otherwise 0.12, and the addresses are the real IP header.

## What Python answers

WebSocket route: `/ws/sidecar`.

- `ai/prompt` and `ai/agent-task` become a completion.
- If the role is `NEURAL_AUDIO_COMPOSER`, or the text mentions guitar or stems, the reply includes `bpm` and a four-bar `chords` map the timeline can merge.
- A BPM written as `126 BPM` in the prompt wins. Otherwise 124.
- Dark wording (`phrygian`, `noir`, `dark`, `minor`) selects the Phrygian voicings. Otherwise the Nordic / cyber set.
- `sec/pcap-packet` with anomaly above 0.85 asks the AutoSec role for a short containment note.
- About every three seconds, if at least one client is connected, a biometric envelope names **Jon-Arve Constantine** as present, unless `ENABLE_WEBCAM=1` and OpenCV actually fails to see a face.

If `GEMINI_API_KEY` is set and the Gemini client imports, the prose of the reply comes from the model. The chord table is still local, so the fretboard never depends on the model remembering how a guitar is strung.

`GEMINI_API_KEY` is for the sidecar process. The key in the desk Settings panel is for widgets that call a provider from the browser. They are not the same slot.

## The Phase 1 daemon

Port 8765. Not a DSP and not a packet capture.

- `GET /health` returns uptime, supervised process names, and client count.
- `system/spawn` with `{ id, command, args }` starts a child.
- `system/stop` with `{ id }` signals it.
- Every other JSON message is broadcast to connected clients.

Neural's spawn button uses this bus. If the badge says `local`, the daemon is not connected. The rest of the desk can still be LINKED to C++ and Python.

## When a badge stays OFF

1. `curl` the health URLs above. If they fail, the process is down. The desk cannot link to a wish.
2. If health works but the badge is OFF, the dev server was started before the proxy existed, or it is not the Vite config in this repo. Restart `npm run dev`.
3. A refused-socket line in the console at the moment of boot is the retry racing a slow Uvicorn. LINKED a second later means you won.
4. Tauri does not use the Vite proxy. The desktop shell dials the direct ports. The processes must be running on that machine.

## What not to run twice

- Two `omnigrid_server` processes both want port 1234. The second exits.
- The C++ parent always tries to spawn Uvicorn. If you already started Uvicorn yourself, the child logs "address already in use" and exits. The parent stays up. That is fine.
- Killing the C++ parent does not always kill a Uvicorn you started yourself. It does kill the child it spawned, depending on how the process was launched. If PY flips to OFF, start the server again.

## Files

| File | Role |
|------|------|
| `server/omnigrid_server.cpp` | Analyzer, WebSocket, health, Python spawn |
| `server/sidecar/main.py` | FastAPI agent, biometrics, chord replies |
| `server/omnigrid-daemon.mjs` | Phase 1 bus and process supervisor |
| `src/services/sidecarBridge.ts` | Browser side of C++ and Python |
| `src/lib/sidecars.ts` | Maps direct URLs onto the proxied paths |
| `src/hooks/useOmniBus.ts` | Browser side of the Phase 1 bus |

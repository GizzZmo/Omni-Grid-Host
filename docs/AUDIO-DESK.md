# The audio desk

> "There. The fret lit on the beat and the string answered. That is the whole machine, doing the only trick that matters."  
> — Jon-Arve Constantine

NAW, TABFRET, and DSP4Guitar are one instrument split across three tiles. None of them imports the others. They meet on `audio/midi`.

---

## Place them

A usable floor plan on a 12-column grid:

| Tile | Columns | Rows | Why |
|------|---------|------|-----|
| NAW | 8 | 4 or 5 | Sixteen steps plus the stem names |
| TABFRET | 4 | 2 | Six fret numbers, nothing else |
| DSP4Guitar | 4 | 2 or 3 | Knobs and the meter |

NAW on the left, the other two stacked on the right, is the layout the desk seeds. If you spawn your own, do not put the sequencer in a 3-column crack.

Drag by the title bar.

## What a chord packet is

```json
{
  "chordName": "Em9 (Nordic Noir)",
  "frets": [0, 2, 4, 0, 3, 2],
  "midiNotes": [40, 47, 54, 55, 62, 66],
  "bpm": 124
}
```

Frets are low string to high string. `null` is a muted string and shows as **X** on TABFRET. MIDI note numbers are what DSP4Guitar turns into Karplus-Strong pulses.

Default ribbon, one chord per bar:

| Step | Chord |
|------|--------|
| 0 | Em9 (Nordic Noir) |
| 4 | Cmaj7#11 (Cyber) |
| 8 | Amadd9 |
| 12 | B7alt (Tension) |

The transport holds the last chord across the steps inside the bar unless a step has its own entry.

## Transport

NAW's clock is a `requestAnimationFrame` accumulator locked to sixteenth notes:

`stepMs = 60000 / BPM / 4`

Press **PLAY STEMS**. The current step fires immediately, then the playhead walks. **STOP TRANSPORT** cancels the frame and leaves the playhead where it stopped. Press play again and it restarts at step 1.

While it runs:

- Guitar stem, if the step is lit and the stem is audible: emit `audio/midi`.
- Drums: short sine drop, local.
- Bass: sawtooth, one pitch per bar (E, C, D, B as a simple cycle).
- Pad: quiet triangle. Local.

Audible means: if any stem is soloed, only solos; otherwise everyone who is not muted.

## Click and drag

- Click a ribbon chip. That chord emits once, at the current BPM. TABFRET should rename itself before the next downbeat.
- Drag a chip. The payload is the same object, carried as `application/x-omnigrid-crosstalk`.
- TABFRET can drag its current chord back out, and its button rebroadcasts it.

If the fretboard does not move, the tile is not mounted, or something else emitted a different chord on top of yours a moment later. Stop the transport and click once.

## Neural Compose

The text field is a score direction, not a chat.

Good:

`Minimal techno 126 BPM in E Phrygian with syncopated guitar stabs`

What happens locally, even with Python offline:

- A BPM in the sentence (two or three digits plus `bpm`) becomes the transport tempo.
- Steps are rewritten from a small hash of the sentence so the four stems do not stay identical.
- Dark words (`phrygian`, `noir`, `dark`, `minor`) select the Phrygian ribbon: Em, F major as bII, Am(b6), B7alt.
- Anything else keeps the Nordic / cyber ribbon at the new tempo.
- An `ai/prompt` envelope goes to the bus with role `NEURAL_AUDIO_COMPOSER`.

What happens when **PY LINKED**:

The bridge forwards that prompt to the Python sidecar. The sidecar answers `ai/agent-task` with `bpm` and `chords`. NAW merges those chords into the guitar stem and sets the tempo again. The status line says the stems were updated.

If you have a cloud key in Settings, the sidecar can use Gemini for the prose. The chord object is still produced by the sidecar's own voicing table so the fretboard receives frets, not adjectives.

## DSP4Guitar signal

```
USB / mic  →  INPUT gain  →  worklet (drive, cabinet, delay)  →  PHONES  →  output
MIDI notes →  Karplus-Strong voices inside the same worklet
```

Order of operations:

1. Click the page once so the browser will start audio.
2. Set PHONES low.
3. ARM WASM DSP.
4. Optionally Enable Guitar Input. Set INPUT low, then raise it.
5. Let NAW play, or click one ribbon chord, and watch the meter.

Presets jump the drive, cabinet, and delay together. The spectrum is a view of the level, not a control.

Live input uses the browser's audio input with echo cancellation off so a guitar DI is not "improved" into mush. Pick the device when more than one input exists.

## Troubleshooting the desk

| Symptom | Likely cause |
|---------|----------------|
| Playhead moves, no sound at all | Audio context suspended. Click the tile. Or every stem is muted, or a solo is on an empty stem |
| Fretboard static while NAW plays | Guitar stem muted, or those steps are off, or TABFRET was closed |
| Sound in NAW, dead rack | DSP not armed, or PHONES at 0 |
| Howl when input arms | INPUT or PHONES too hot, or the mic is hearing the speakers. Use headphones |
| Ribbon changed but not the way you asked | Python offline: you only got the local rewrite. Or the sentence had no BPM and no dark-mode word |
| Two chords fighting | Two NAW instances, or you left the transport running while clicking the ribbon |
| Steps impossible to click | Tile narrower than the sequencer's minimum. Widen it |

## A small practice

1. Stop the transport.
2. Solo the guitar stem.
3. Click **Cmaj7#11**. Confirm TABFRET.
4. Arm DSP. Confirm the meter moves.
5. Unsolo, press play, and do not touch the ribbon for four bars.
6. Then change one word in the prompt and hit Neural Compose. Watch whether the ribbon and the footer agree.

That is the whole chain. Everything else on the desk is a different job.

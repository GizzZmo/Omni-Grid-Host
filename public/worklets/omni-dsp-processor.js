/**
 * Phase 2 — AudioWorklet DSP Processor
 * Pure JS stand-in for the future Emscripten-compiled DSP4Guitar / Frequalizer core.
 * Runs on the audio thread. Receives gain and cutoff via AudioWorkletNode.port.
 */

class OmniDspProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.gain = 0.8;
    this.cutoff = 0.5; // 0–1, mapped to simple one-pole
    this.lp = 0;
    this.port.onmessage = (e) => {
      const { type, value } = e.data || {};
      if (type === 'gain') this.gain = Math.max(0, Math.min(2, value));
      if (type === 'cutoff') this.cutoff = Math.max(0.01, Math.min(1, value));
    };
  }

  process(inputs, outputs) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || !input[0] || !output || !output[0]) return true;

    const inCh = input[0];
    const outCh = output[0];
    const alpha = this.cutoff;

    for (let i = 0; i < inCh.length; i++) {
      // one-pole low-pass
      this.lp += alpha * (inCh[i] - this.lp);
      outCh[i] = this.lp * this.gain;
    }

    // simple peak meter (post to main thread occasionally)
    if (Math.random() < 0.05) {
      let peak = 0;
      for (let i = 0; i < outCh.length; i++) peak = Math.max(peak, Math.abs(outCh[i]));
      this.port.postMessage({ type: 'meter', peak });
    }

    return true;
  }
}

registerProcessor('omni-dsp', OmniDspProcessor);

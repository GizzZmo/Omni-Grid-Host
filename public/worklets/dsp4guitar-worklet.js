// public/worklets/dsp4guitar-worklet.js

class DSP4GuitarWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.dsp = null;
    this.inPtrL = 0;
    this.outPtrL = 0;
    this.outPtrR = 0;
    this.frameCounter = 0;

    this.jsParams = { drive: 4.5, tone: 0.35, delayTime: 0.375, delayMix: 0.28, master: 0.85 };
    this.jsVoices = [];
    this.jsCabState = 0;

    this.port.onmessage = (event) => this.handleMessage(event.data);
  }

  handleMessage(msg) {
    switch (msg.type) {
      case 'SET_PARAMS': {
        const { drive, tone, delayTime, delayMix, master } = msg.payload;
        this.jsParams = { drive, tone, delayTime, delayMix, master };
        if (this.dsp) this.dsp.setParameters(drive, tone, delayTime, delayMix, master);
        break;
      }
      case 'MIDI_CHORD': {
        const notes = msg.payload.midiNotes || [];
        notes.forEach((midiNote, idx) => {
          if (this.dsp) {
            this.dsp.triggerMidiNote(idx, midiNote);
          } else {
            const freq = 440 * Math.pow(2, (midiNote - 69) / 12);
            this.jsVoices.push({ phase: 0, inc: (2 * Math.PI * freq) / sampleRate, env: 1.0 });
          }
        });
        break;
      }
    }
  }

  process(inputs, outputs) {
    const inputChannel = inputs[0]?.[0];
    const outL = outputs[0]?.[0];
    const outR = outputs[0]?.[1] || outL;
    if (!outL) return true;

    const numSamples = outL.length;

    if (this.dsp && globalThis.Module) {
      if (inputChannel) {
        globalThis.Module.HEAPF32.set(inputChannel, this.inPtrL >> 2);
      } else {
        globalThis.Module.HEAPF32.fill(0, this.inPtrL >> 2, (this.inPtrL >> 2) + numSamples);
      }
      this.dsp.processBlock(this.inPtrL, this.outPtrL, this.outPtrR, numSamples);
      outL.set(globalThis.Module.HEAPF32.subarray(this.outPtrL >> 2, (this.outPtrL >> 2) + numSamples));
      outR.set(globalThis.Module.HEAPF32.subarray(this.outPtrR >> 2, (this.outPtrR >> 2) + numSamples));
    } else {
      let sumSq = 0;
      for (let i = 0; i < numSamples; i++) {
        let synth = 0;
        for (let v = this.jsVoices.length - 1; v >= 0; v--) {
          const voice = this.jsVoices[v];
          synth += Math.sin(voice.phase) * voice.env * 0.2;
          voice.phase += voice.inc;
          voice.env *= 0.9997;
          if (voice.env < 0.001) this.jsVoices.splice(v, 1);
        }
        const dry = (inputChannel ? inputChannel[i] : 0) + synth;
        const driven = Math.tanh(dry * this.jsParams.drive);
        this.jsCabState += this.jsParams.tone * (driven - this.jsCabState);
        const sample = this.jsCabState * this.jsParams.master;
        outL[i] = sample;
        outR[i] = sample;
        sumSq += sample * sample;
      }
      if (++this.frameCounter % 12 === 0) {
        this.port.postMessage({ type: 'TELEMETRY', rms: Math.sqrt(sumSq / numSamples) });
      }
    }
    return true;
  }
}

registerProcessor('dsp4guitar-worklet', DSP4GuitarWorkletProcessor);

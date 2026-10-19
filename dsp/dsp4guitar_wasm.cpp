// dsp/dsp4guitar_wasm.cpp
// Compile with Emscripten (see Makefile wasm-dsp target)

#include <cmath>
#include <cstring>
#include <algorithm>
#include <array>
#include <emscripten/bind.h>

constexpr int MAX_DELAY_SAMPLES = 96000;
constexpr int NUM_STRINGS = 6;

struct KarplusVoice {
    std::array<float, 2048> delayLine{};
    int writeIdx = 0;
    int period = 100;
    float damping = 0.994f;
    bool active = false;
    float prevSample = 0.0f;

    void trigger(int midiNote, float sampleRate) {
        float freq = 440.0f * std::pow(2.0f, (midiNote - 69) / 12.0f);
        period = std::clamp(static_cast<int>(sampleRate / freq), 10, 2040);
        uint32_t seed = static_cast<uint32_t>(midiNote * 1664525u + 1013904223u);
        for (int i = 0; i < period; ++i) {
            seed = seed * 1664525u + 1013904223u;
            delayLine[i] = (static_cast<float>(seed & 0xFFFF) / 32768.0f) - 1.0f;
        }
        writeIdx = 0;
        prevSample = 0.0f;
        active = true;
    }

    inline float processSample() {
        if (!active) return 0.0f;
        int readIdx = (writeIdx + 1) % period;
        float current = delayLine[readIdx];
        float next = (current + prevSample) * 0.5f * damping;
        prevSample = current;
        delayLine[writeIdx] = next;
        writeIdx = readIdx;
        if (std::abs(next) < 1e-5f) active = false;
        return next;
    }
};

class DSP4GuitarProcessor {
private:
    float sampleRate = 48000.0f;
    float driveGain = 4.5f;
    float toneCutoff = 0.35f;
    float delayMix = 0.28f;
    float delayFeedback = 0.42f;
    int delaySamples = 18000;
    float masterOutput = 0.85f;

    float cabStateL = 0.0f;
    float cabStateR = 0.0f;
    int delayWritePos = 0;
    std::array<float, MAX_DELAY_SAMPLES> delayBufferL{};
    std::array<float, MAX_DELAY_SAMPLES> delayBufferR{};
    std::array<KarplusVoice, NUM_STRINGS> stringVoices{};
    float latestRms = 0.0f;

public:
    DSP4GuitarProcessor(float sr) : sampleRate(sr) {
        delaySamples = static_cast<int>(sr * 0.375f);
    }

    void setParameters(float drive, float tone, float dlyTimeSec, float dlyMix, float master) {
        driveGain = std::clamp(drive, 1.0f, 25.0f);
        toneCutoff = std::clamp(tone, 0.05f, 0.95f);
        delaySamples = std::clamp(static_cast<int>(dlyTimeSec * sampleRate), 128, MAX_DELAY_SAMPLES - 1);
        delayMix = std::clamp(dlyMix, 0.0f, 1.0f);
        masterOutput = std::clamp(master, 0.0f, 1.5f);
    }

    void triggerMidiNote(int stringIdx, int midiNote) {
        int idx = std::clamp(stringIdx, 0, NUM_STRINGS - 1);
        stringVoices[idx].trigger(midiNote, sampleRate);
    }

    float getRmsLevel() const { return latestRms; }

    void processBlock(uintptr_t inPtrL, uintptr_t outPtrL, uintptr_t outPtrR, int numSamples) {
        const float* inL = reinterpret_cast<const float*>(inPtrL);
        float* outL = reinterpret_cast<float*>(outPtrL);
        float* outR = reinterpret_cast<float*>(outPtrR);

        float sumSquares = 0.0f;

        for (int i = 0; i < numSamples; ++i) {
            float synthSum = 0.0f;
            for (auto& voice : stringVoices) synthSum += voice.processSample();
            float dry = (inL ? inL[i] : 0.0f) + (synthSum * 0.35f);
            float driven = std::tanh(dry * driveGain + 0.08f * dry * dry);

            cabStateL += toneCutoff * (driven - cabStateL);
            cabStateR += toneCutoff * (driven - cabStateR);

            int readPos = (delayWritePos - delaySamples + MAX_DELAY_SAMPLES) % MAX_DELAY_SAMPLES;
            float delayedL = delayBufferL[readPos];
            float delayedR = delayBufferR[readPos];

            delayBufferL[delayWritePos] = cabStateL + (delayedR * delayFeedback);
            delayBufferR[delayWritePos] = cabStateR + (delayedL * delayFeedback * 0.92f);
            delayWritePos = (delayWritePos + 1) % MAX_DELAY_SAMPLES;

            float finalL = (cabStateL * (1.0f - delayMix) + delayedL * delayMix) * masterOutput;
            float finalR = (cabStateR * (1.0f - delayMix) + delayedR * delayMix) * masterOutput;

            outL[i] = finalL;
            outR[i] = finalR;
            sumSquares += 0.5f * (finalL * finalL + finalR * finalR);
        }

        latestRms = std::sqrt(sumSquares / static_cast<float>(numSamples));
    }
};

EMSCRIPTEN_BINDINGS(dsp4guitar_module) {
    emscripten::class_<DSP4GuitarProcessor>("DSP4GuitarProcessor")
        .constructor<float>()
        .function("setParameters", &DSP4GuitarProcessor::setParameters)
        .function("triggerMidiNote", &DSP4GuitarProcessor::triggerMidiNote)
        .function("getRmsLevel", &DSP4GuitarProcessor::getRmsLevel)
        .function("processBlock", &DSP4GuitarProcessor::processBlock);
}

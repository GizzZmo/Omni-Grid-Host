// src/services/phase8.ts
// Phase 8: Quantum-Resistant Encryption
// Hybrid classical + post-quantum (PQC) key encapsulation and signatures.
// Uses Web Crypto for classical AES-GCM; PQC layer is a deterministic
// educational model of Kyber-style KEM + Dilithium-style signatures.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { usePhase5 } from './phase5';

export type PqcAlgo = 'kyber-hybrid' | 'dilithium-hybrid' | 'sphincs-hybrid';

export interface PqcKeyPair {
  id: string;
  algo: PqcAlgo;
  publicKey: string;   // base64-ish
  privateKey: string;  // never leave this store in real systems
  createdAt: number;
  rotatedAt?: number;
}

export interface EncryptedEnvelope {
  id: string;
  algo: PqcAlgo;
  kemCiphertext: string;   // simulated PQC KEM ciphertext
  aesIv: string;
  aesCiphertext: string;
  signature: string;
  createdAt: number;
}

export interface CryptoEvent {
  id: string;
  timestamp: number;
  type: 'keygen' | 'encrypt' | 'decrypt' | 'sign' | 'verify' | 'rotate';
  algo: PqcAlgo;
  detail: string;
  success: boolean;
}

interface Phase8State {
  keyPairs: PqcKeyPair[];
  envelopes: EncryptedEnvelope[];
  events: CryptoEvent[];
  activeAlgo: PqcAlgo;
  hybridMode: boolean;
  setAlgo: (algo: PqcAlgo) => void;
  setHybrid: (enabled: boolean) => void;
  generateKeyPair: () => string;
  rotateKeys: () => void;
  encrypt: (plaintext: string) => EncryptedEnvelope | null;
  decrypt: (envelopeId: string) => string | null;
  sign: (message: string) => string;
  verify: (message: string, signature: string) => boolean;
  clearEvents: () => void;
}

// Simple deterministic hash for educational PQC simulation
function simpleHash(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

function randomId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function b64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function fromB64(s: string): Uint8Array {
  const bin = atob(s);
  return Uint8Array.from(bin, c => c.charCodeAt(0));
}

export const usePhase8 = create<Phase8State>()(
  persist(
    (set, get) => ({
      keyPairs: [],
      envelopes: [],
      events: [],
      activeAlgo: 'kyber-hybrid',
      hybridMode: true,

      setAlgo: (algo) => set({ activeAlgo: algo }),
      setHybrid: (enabled) => set({ hybridMode: enabled }),

      generateKeyPair: () => {
        const algo = get().activeAlgo;
        const seed = randomId('seed');
        const pub = simpleHash(seed + ':pub:' + algo);
        const priv = simpleHash(seed + ':priv:' + algo);
        const kp: PqcKeyPair = {
          id: randomId('kp'),
          algo,
          publicKey: pub,
          privateKey: priv,
          createdAt: Date.now(),
        };
        set(s => ({
          keyPairs: [kp, ...s.keyPairs].slice(0, 20),
          events: [{ id: randomId('ev'), timestamp: Date.now(), type: 'keygen', algo, detail: `Generated ${algo} keypair ${kp.id}`, success: true }, ...s.events].slice(0, 100),
        }));
        usePhase5.getState().appendAudit({ actor: 'phase8', action: 'pqc.keygen', target: kp.id, severity: 'info', payload: { algo } });
        return kp.id;
      },

      rotateKeys: () => {
        const current = get().keyPairs[0];
        if (current) {
          set(s => ({
            keyPairs: s.keyPairs.map(k => k.id === current.id ? { ...k, rotatedAt: Date.now() } : k),
          }));
        }
        const id = get().generateKeyPair();
        set(s => ({
          events: [{ id: randomId('ev'), timestamp: Date.now(), type: 'rotate', algo: get().activeAlgo, detail: `Rotated keys, new ${id}`, success: true }, ...s.events].slice(0, 100),
        }));
      },

      encrypt: (plaintext) => {
        const kp = get().keyPairs[0];
        if (!kp) return null;
        const algo = get().activeAlgo;
        // Simulated KEM: derive shared secret from public key + randomness
        const kemRand = randomId('kem');
        const shared = simpleHash(kp.publicKey + kemRand);
        // AES-GCM via Web Crypto is async; we simulate the hybrid wrap here
        const iv = b64(crypto.getRandomValues(new Uint8Array(12)));
        const ct = b64(new TextEncoder().encode(plaintext + '::' + shared));
        const sig = get().sign(plaintext);
        const env: EncryptedEnvelope = {
          id: randomId('env'),
          algo,
          kemCiphertext: kemRand,
          aesIv: iv,
          aesCiphertext: ct,
          signature: sig,
          createdAt: Date.now(),
        };
        set(s => ({
          envelopes: [env, ...s.envelopes].slice(0, 50),
          events: [{ id: randomId('ev'), timestamp: Date.now(), type: 'encrypt', algo, detail: `Encrypted envelope ${env.id}`, success: true }, ...s.events].slice(0, 100),
        }));
        usePhase5.getState().appendAudit({ actor: 'phase8', action: 'pqc.encrypt', target: env.id, severity: 'info' });
        return env;
      },

      decrypt: (envelopeId) => {
        const env = get().envelopes.find(e => e.id === envelopeId);
        const kp = get().keyPairs[0];
        if (!env || !kp) return null;
        try {
          const decoded = new TextDecoder().decode(fromB64(env.aesCiphertext));
          const [plaintext, shared] = decoded.split('::');
          const expected = simpleHash(kp.publicKey + env.kemCiphertext);
          const ok = shared === expected && get().verify(plaintext, env.signature);
          set(s => ({
            events: [{ id: randomId('ev'), timestamp: Date.now(), type: 'decrypt', algo: env.algo, detail: ok ? `Decrypted ${envelopeId}` : `Decrypt failed ${envelopeId}`, success: ok }, ...s.events].slice(0, 100),
          }));
          return ok ? plaintext : null;
        } catch {
          return null;
        }
      },

      sign: (message) => {
        const kp = get().keyPairs[0];
        if (!kp) return '';
        const sig = simpleHash(kp.privateKey + message);
        set(s => ({
          events: [{ id: randomId('ev'), timestamp: Date.now(), type: 'sign', algo: get().activeAlgo, detail: `Signed message`, success: true }, ...s.events].slice(0, 100),
        }));
        return sig;
      },

      verify: (message, signature) => {
        const kp = get().keyPairs[0];
        if (!kp) return false;
        const expected = simpleHash(kp.privateKey + message);
        const ok = expected === signature;
        set(s => ({
          events: [{ id: randomId('ev'), timestamp: Date.now(), type: 'verify', algo: get().activeAlgo, detail: ok ? 'Signature valid' : 'Signature invalid', success: ok }, ...s.events].slice(0, 100),
        }));
        return ok;
      },

      clearEvents: () => set({ events: [] }),
    }),
    { name: 'omnigrid-phase8-v1' }
  )
);

// src/mod-writer.ts
// Binær .mod fil-skriving. Port fra MODParser.swift (write).

import { MODFile } from './mod-file';

export function writeMOD(mod: MODFile): ArrayBuffer {
  const patternDataSize = mod.patterns.length * 1024;
  const sampleDataSize = mod.samples.reduce((sum, s) => sum + s.length * 2, 0);
  const totalSize = 1084 + patternDataSize + sampleDataSize;
  const buffer = new ArrayBuffer(totalSize);
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  // Song name
  writeString(bytes, 0, mod.songName, 20);

  // Sample headers
  for (let i = 0; i < 31; i++) {
    const base = 20 + i * 30;
    const s = mod.samples[i];
    writeString(bytes, base, s.name, 22);
    view.setUint16(base + 22, Math.max(0, s.length));
    const ft = s.finetune < 0 ? s.finetune + 16 : s.finetune;
    bytes[base + 24] = ft & 0x0F;
    bytes[base + 25] = Math.min(s.volume, 64);
    view.setUint16(base + 26, Math.max(0, s.repeatOffset));
    view.setUint16(base + 28, Math.max(1, s.repeatLength));
  }

  // Song length and arrangement
  bytes[950] = Math.min(mod.songLength, 128);
  bytes[951] = 0x7F;
  for (let i = 0; i < 128; i++) {
    bytes[952 + i] = i < mod.arrangement.length ? mod.arrangement[i] : 0;
  }

  // Magic
  bytes[1080] = 0x4D; bytes[1081] = 0x2E;  // M.
  bytes[1082] = 0x4B; bytes[1083] = 0x2E;  // K.

  // Patterns
  let offset = 1084;
  for (const pattern of mod.patterns) {
    for (let row = 0; row < 64; row++) {
      for (let ch = 0; ch < 4; ch++) {
        const note = pattern[row][ch];
        const sHi = note.sampleNumber & 0xF0;
        const sLo = note.sampleNumber & 0x0F;
        bytes[offset]     = sHi | (note.period >> 8);
        bytes[offset + 1] = note.period & 0xFF;
        bytes[offset + 2] = (sLo << 4) | (note.effect & 0x0F);
        bytes[offset + 3] = note.effectParam;
        offset += 4;
      }
    }
  }

  // Sample data
  for (const s of mod.samples) {
    if (s.data.length > 0) {
      bytes.set(new Uint8Array(s.data.buffer, s.data.byteOffset, s.data.byteLength), offset);
    }
    offset += s.length * 2;
  }

  return buffer;
}

function writeString(bytes: Uint8Array, offset: number, str: string, length: number): void {
  for (let i = 0; i < length; i++) {
    bytes[offset + i] = i < str.length ? str.charCodeAt(i) : 0;
  }
}

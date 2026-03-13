// src/mod-parser.ts
// Binær .mod fil-lesing. Port fra MODParser.swift.

import { MODFile, Sample, Pattern, Note, emptySample, emptyMODFile } from './mod-file';

const VALID_MAGIC = new Set(['M.K.', 'M!K!', 'FLT4', '4CHN']);

export function parseMOD(buffer: ArrayBuffer): MODFile {
  const data = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  if (buffer.byteLength < 1084) {
    throw new Error('File too short — not a valid MOD file');
  }

  const magic = readString(bytes, 1080, 4);
  if (!VALID_MAGIC.has(magic)) {
    throw new Error(`Invalid magic '${magic}' — not a supported 4-channel MOD`);
  }

  const mod = emptyMODFile();
  mod.songName = readString(bytes, 0, 20);

  // Sample headers
  mod.samples = [];
  for (let i = 0; i < 31; i++) {
    mod.samples.push(readSampleHeader(bytes, data, i));
  }

  mod.songLength = bytes[950];
  mod.arrangement = Array.from({ length: 128 }, (_, i) => bytes[952 + i]);

  const patternCount = Math.max(...mod.arrangement.slice(0, mod.songLength)) + 1;
  let offset = 1084;
  mod.patterns = [];
  for (let p = 0; p < patternCount; p++) {
    const pattern = readPattern(bytes, offset);
    mod.patterns.push(pattern);
    offset += 1024;  // 64 rows × 4 channels × 4 bytes
  }

  // Sample data
  for (let i = 0; i < 31; i++) {
    const byteLen = mod.samples[i].length * 2;
    if (byteLen > 0 && offset + byteLen <= buffer.byteLength) {
      mod.samples[i].data = new Int8Array(buffer.slice(offset, offset + byteLen));
    }
    offset += byteLen;
  }

  return mod;
}

function readSampleHeader(bytes: Uint8Array, data: DataView, index: number): Sample {
  const base = 20 + index * 30;
  const s = emptySample();
  s.name = readString(bytes, base, 22);
  s.length = data.getUint16(base + 22);  // Big-endian er default for DataView
  const ft = bytes[base + 24] & 0x0F;
  s.finetune = ft < 8 ? ft : ft - 16;
  s.volume = bytes[base + 25];
  s.repeatOffset = data.getUint16(base + 26);
  s.repeatLength = data.getUint16(base + 28);
  return s;
}

function readPattern(bytes: Uint8Array, offset: number): Pattern {
  const pattern: Pattern = [];
  let o = offset;
  for (let row = 0; row < 64; row++) {
    const rowData: Note[] = [];
    for (let ch = 0; ch < 4; ch++) {
      const b0 = bytes[o], b1 = bytes[o + 1], b2 = bytes[o + 2], b3 = bytes[o + 3];
      rowData.push({
        period: ((b0 & 0x0F) << 8) | b1,
        sampleNumber: (b0 & 0xF0) | ((b2 & 0xF0) >> 4),
        effect: b2 & 0x0F,
        effectParam: b3,
      });
      o += 4;
    }
    pattern.push(rowData);
  }
  return pattern;
}

function readString(bytes: Uint8Array, offset: number, length: number): string {
  let str = '';
  for (let i = 0; i < length; i++) {
    const b = bytes[offset + i];
    if (b === 0) break;
    str += String.fromCharCode(b);
  }
  return str.trim();
}

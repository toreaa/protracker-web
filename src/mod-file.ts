// src/mod-file.ts
// Datatyper for MOD-filformatet. Port fra MODFile.swift.

export interface Note {
  period: number;        // Amiga period-verdi (0 = ingen)
  sampleNumber: number;  // 0 = ingen, 1–31
  effect: number;        // 0x0–0xF
  effectParam: number;   // 0x00–0xFF
}

export function emptyNote(): Note {
  return { period: 0, sampleNumber: 0, effect: 0, effectParam: 0 };
}

export function isNoteEmpty(n: Note): boolean {
  return n.period === 0 && n.sampleNumber === 0 && n.effect === 0 && n.effectParam === 0;
}

export interface Sample {
  name: string;
  data: Int8Array;       // 8-bit signed PCM
  length: number;        // I words (bytes / 2)
  finetune: number;      // -8..+7
  volume: number;        // 0–64
  repeatOffset: number;
  repeatLength: number;  // Minimum 2 (ingen loop)
}

export function emptySample(): Sample {
  return {
    name: '', data: new Int8Array(0), length: 0,
    finetune: 0, volume: 64, repeatOffset: 0, repeatLength: 2,
  };
}

export type Pattern = Note[][];  // 64 rader × 4 kanaler

export function emptyPattern(): Pattern {
  return Array.from({ length: 64 }, () =>
    Array.from({ length: 4 }, () => emptyNote())
  );
}

export interface MODFile {
  songName: string;
  samples: Sample[];       // 31 entries
  songLength: number;      // 1–128
  arrangement: number[];   // Opptil 128 pattern-indekser
  patterns: Pattern[];
}

export function emptyMODFile(): MODFile {
  return {
    songName: '',
    samples: Array.from({ length: 31 }, () => emptySample()),
    songLength: 1,
    arrangement: [0],
    patterns: [emptyPattern()],
  };
}

// src/effects.ts
// Amiga effekt-prosessering. Port fra EffectProcessor.swift.

export interface ChannelState {
  period: number;
  targetPeriod: number;
  volume: number;
  finetune: number;
  portaSpeed: number;
  vibratoSpeed: number;
  vibratoDepth: number;
  vibratoPhase: number;
  tremoloSpeed: number;
  tremoloDepth: number;
  tremoloPhase: number;
  sampleOffset: number;
}

export function emptyChannelState(): ChannelState {
  return {
    period: 0, targetPeriod: 0, volume: 0, finetune: 0,
    portaSpeed: 0, vibratoSpeed: 0, vibratoDepth: 0, vibratoPhase: 0,
    tremoloSpeed: 0, tremoloDepth: 0, tremoloPhase: 0, sampleOffset: 0,
  };
}

const SINE_TABLE = [
  0,24,49,74,97,120,141,161,180,197,212,224,235,244,250,253,
  255,253,250,244,235,224,212,197,180,161,141,120,97,74,49,24,
  0,24,49,74,97,120,141,161,180,197,212,224,235,244,250,253,
  255,253,250,244,235,224,212,197,180,161,141,120,97,74,49,24,
];

export function processEffect(effect: number, param: number, ch: ChannelState, tick: number): void {
  switch (effect) {
    case 0x0: break;  // Arpeggio — håndteres av engine
    case 0x1: if (tick > 0) ch.period = Math.max(113, ch.period - param); break;
    case 0x2: if (tick > 0) ch.period = Math.min(856, ch.period + param); break;
    case 0x3: tonePortamento(param, ch, tick); break;
    case 0x4: vibrato(param, ch, tick); break;
    case 0x5: tonePortamento(0, ch, tick); volumeSlide(param, ch, tick); break;
    case 0x6: vibrato(0, ch, tick); volumeSlide(param, ch, tick); break;
    case 0x7: tremolo(param, ch, tick); break;
    case 0x9: if (tick === 0 && param !== 0) ch.sampleOffset = param * 256; break;
    case 0xA: volumeSlide(param, ch, tick); break;
    case 0xB: break;  // Position jump — engine
    case 0xC: ch.volume = Math.max(0, Math.min(64, param)); break;
    case 0xD: break;  // Pattern break — engine
    case 0xE: processExtended(param, ch, tick); break;
    case 0xF: break;  // Set speed/BPM — engine
  }
}

function tonePortamento(param: number, ch: ChannelState, tick: number): void {
  if (param !== 0) ch.portaSpeed = param;
  if (tick === 0) return;
  if (ch.period < ch.targetPeriod) {
    ch.period = Math.min(ch.targetPeriod, ch.period + ch.portaSpeed);
  } else if (ch.period > ch.targetPeriod) {
    ch.period = Math.max(ch.targetPeriod, ch.period - ch.portaSpeed);
  }
}

function vibrato(param: number, ch: ChannelState, tick: number): void {
  if (param !== 0) {
    if ((param >> 4) !== 0) ch.vibratoSpeed = param >> 4;
    if ((param & 0xF) !== 0) ch.vibratoDepth = param & 0xF;
  }
  if (tick === 0) return;
  const sinVal = SINE_TABLE[ch.vibratoPhase & 0x1F];
  const delta = (sinVal * ch.vibratoDepth) >> 7;
  ch.period += (ch.vibratoPhase & 0x20) !== 0 ? -delta : delta;
  ch.vibratoPhase = (ch.vibratoPhase + ch.vibratoSpeed) & 0x3F;
}

function tremolo(param: number, ch: ChannelState, tick: number): void {
  if (param !== 0) {
    if ((param >> 4) !== 0) ch.tremoloSpeed = param >> 4;
    if ((param & 0xF) !== 0) ch.tremoloDepth = param & 0xF;
  }
  if (tick === 0) return;
  const sinVal = SINE_TABLE[ch.tremoloPhase & 0x1F];
  const delta = (sinVal * ch.tremoloDepth) >> 6;
  const volDelta = (ch.tremoloPhase & 0x20) !== 0 ? -delta : delta;
  ch.volume = Math.max(0, Math.min(64, ch.volume + volDelta));
  ch.tremoloPhase = (ch.tremoloPhase + ch.tremoloSpeed) & 0x3F;
}

function volumeSlide(param: number, ch: ChannelState, tick: number): void {
  if (tick === 0) return;
  ch.volume = Math.max(0, Math.min(64, ch.volume + (param >> 4) - (param & 0xF)));
}

function processExtended(param: number, ch: ChannelState, tick: number): void {
  const cmd = param >> 4, val = param & 0xF;
  switch (cmd) {
    case 0x1: ch.period = Math.max(113, ch.period - val); break;
    case 0x2: ch.period = Math.min(856, ch.period + val); break;
    case 0xA: ch.volume = Math.min(64, ch.volume + val); break;
    case 0xB: ch.volume = Math.max(0, ch.volume - val); break;
    case 0xC: if (tick === val) ch.volume = 0; break;
  }
}

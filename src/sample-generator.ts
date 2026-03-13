// src/sample-generator.ts
// Genererer 8 basis-samples. Port fra SampleGenerator.swift.

import { Sample } from './mod-file';

export function defaultSamples(): Sample[] {
  const samples: Sample[] = Array.from({ length: 31 }, () => ({
    name: '', data: new Int8Array(0), length: 0,
    finetune: 0, volume: 64, repeatOffset: 0, repeatLength: 2,
  }));
  samples[0] = makeKick();
  samples[1] = makeSnare();
  samples[2] = makeClosedHiHat();
  samples[3] = makeOpenHiHat();
  samples[4] = makeClap();
  samples[5] = makeBass();
  samples[6] = makeLead();
  samples[7] = makePad();
  return samples;
}

function makeSample(name: string, buf: Int8Array, volume: number,
                    repeatOffset = 0, repeatLength = 2): Sample {
  return {
    name, data: buf, length: buf.length / 2 | 0,
    finetune: 0, volume, repeatOffset, repeatLength,
  };
}

function makeKick(): Sample {
  const len = 4000;
  const buf = new Int8Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / 8287;
    const env = Math.max(0, 1 - t * 5);
    const freq = 150 * Math.exp(-t * 30) + 40;
    buf[i] = Math.max(-128, Math.min(127, Math.sin(2 * Math.PI * freq * t) * 127 * env | 0));
  }
  return makeSample('Kick', buf, 64);
}

function makeSnare(): Sample {
  const len = 4000;
  const buf = new Int8Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / 8287;
    const env = Math.max(0, 1 - t * 6);
    const noise = Math.random() * 2 - 1;
    const tone = Math.sin(2 * Math.PI * 200 * t) * Math.max(0, 1 - t * 20);
    buf[i] = Math.max(-128, Math.min(127, (noise * 0.7 + tone * 0.3) * env * 127 | 0));
  }
  return makeSample('Snare', buf, 64);
}

function makeClosedHiHat(): Sample {
  const len = 1500;
  const buf = new Int8Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / 8287;
    const env = Math.max(0, 1 - t * 15);
    buf[i] = Math.max(-128, Math.min(127, (Math.random() * 2 - 1) * 127 * env | 0));
  }
  return makeSample('Closed HH', buf, 50);
}

function makeOpenHiHat(): Sample {
  const len = 6000;
  const buf = new Int8Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / 8287;
    const env = Math.max(0, 1 - t * 2.5);
    buf[i] = Math.max(-128, Math.min(127, (Math.random() * 2 - 1) * 127 * env | 0));
  }
  return makeSample('Open HH', buf, 50);
}

function makeClap(): Sample {
  const len = 4000;
  const buf = new Int8Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / 8287;
    const env = Math.max(0, 1 - t * 5);
    let burstEnv = 0.1;
    if (i < 200 || (i > 400 && i < 600) || (i > 800 && i < 1200)) burstEnv = 1;
    else if (i >= 1200) burstEnv = Math.max(0, 1 - (i - 1200) / 2000);
    buf[i] = Math.max(-128, Math.min(127, (Math.random() * 2 - 1) * 127 * env * burstEnv | 0));
  }
  return makeSample('Clap', buf, 60);
}

function makeBass(): Sample {
  const cycleLen = 32, totalLen = cycleLen * 8;
  const buf = new Int8Array(totalLen);
  for (let i = 0; i < totalLen; i++) {
    const phase = (i % cycleLen) / cycleLen;
    const saw = 1 - 2 * phase;
    const sine = Math.sin(2 * Math.PI * phase);
    buf[i] = Math.max(-128, Math.min(127, (sine * 0.6 + saw * 0.4) * 100 | 0));
  }
  return makeSample('Bass', buf, 64, 0, totalLen / 2);
}

function makeLead(): Sample {
  const cycleLen = 32, totalLen = cycleLen * 8;
  const buf = new Int8Array(totalLen);
  for (let i = 0; i < totalLen; i++) {
    const phase = (i % cycleLen) / cycleLen;
    buf[i] = Math.max(-128, Math.min(127, (phase < 0.25 ? 80 : -80)));
  }
  return makeSample('Lead', buf, 50, 0, totalLen / 2);
}

function makePad(): Sample {
  const cycleLen = 64, totalLen = cycleLen * 4;
  const buf = new Int8Array(totalLen);
  for (let i = 0; i < totalLen; i++) {
    const p1 = (i % cycleLen) / cycleLen;
    const p2 = (i % (cycleLen + 1)) / (cycleLen + 1);
    const mix = (Math.sin(2 * Math.PI * p1) + Math.sin(2 * Math.PI * p2) * 0.5) / 1.5;
    buf[i] = Math.max(-128, Math.min(127, mix * 90 | 0));
  }
  return makeSample('Pad', buf, 45, 0, totalLen / 2);
}

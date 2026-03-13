// src/sample-generator.ts
// Genererer 13 basis-samples for musikkproduksjon.

import { Sample } from './mod-file';

export function defaultSamples(): Sample[] {
  const samples: Sample[] = Array.from({ length: 31 }, () => ({
    name: '', data: new Int8Array(0), length: 0,
    finetune: 0, volume: 64, repeatOffset: 0, repeatLength: 2,
  }));
  // Drums
  samples[0]  = makeKick();
  samples[1]  = makeSnare();
  samples[2]  = makeClosedHiHat();
  samples[3]  = makeOpenHiHat();
  samples[4]  = makeClap();
  samples[5]  = makeTom();
  samples[6]  = makeCowbell();
  // Melodic
  samples[7]  = makeBass();
  samples[8]  = makeLead();
  samples[9]  = makePad();
  samples[10] = makeOrgan();
  samples[11] = makeStrings();
  samples[12] = makePluck();
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

function makeTom(): Sample {
  // Tom: sine med pitch-decay, dypere og lengre enn kick
  const len = 5000;
  const buf = new Int8Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / 8287;
    const env = Math.max(0, 1 - t * 3);
    const freq = 120 * Math.exp(-t * 10) + 60;
    buf[i] = Math.max(-128, Math.min(127, Math.sin(2 * Math.PI * freq * t) * 127 * env | 0));
  }
  return makeSample('Tom', buf, 64);
}

function makeCowbell(): Sample {
  // Cowbell: to faste frekvenser (540 + 800 Hz), kort decay
  const len = 3000;
  const buf = new Int8Array(len);
  for (let i = 0; i < len; i++) {
    const t = i / 8287;
    const env = Math.max(0, 1 - t * 8);
    const s1 = Math.sin(2 * Math.PI * 540 * t);
    const s2 = Math.sin(2 * Math.PI * 800 * t);
    buf[i] = Math.max(-128, Math.min(127, (s1 * 0.6 + s2 * 0.4) * 100 * env | 0));
  }
  return makeSample('Cowbell', buf, 50);
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

function makeOrgan(): Sample {
  // Organ: grunntone + 2. + 3. harmonisk, drawbar-stil
  const cycleLen = 32, totalLen = cycleLen * 8;
  const buf = new Int8Array(totalLen);
  for (let i = 0; i < totalLen; i++) {
    const phase = (i % cycleLen) / cycleLen;
    const h1 = Math.sin(2 * Math.PI * phase);
    const h2 = Math.sin(2 * Math.PI * phase * 2) * 0.5;
    const h3 = Math.sin(2 * Math.PI * phase * 3) * 0.25;
    buf[i] = Math.max(-128, Math.min(127, (h1 + h2 + h3) / 1.75 * 90 | 0));
  }
  return makeSample('Organ', buf, 50, 0, totalLen / 2);
}

function makeStrings(): Sample {
  // Strings: sagtann (rike harmoniske), looped
  const cycleLen = 64, totalLen = cycleLen * 4;
  const buf = new Int8Array(totalLen);
  for (let i = 0; i < totalLen; i++) {
    const phase = (i % cycleLen) / cycleLen;
    // Bandlimited sagtann via additive syntese (6 harmoniske)
    let val = 0;
    for (let h = 1; h <= 6; h++) {
      val += Math.sin(2 * Math.PI * phase * h) / h;
    }
    buf[i] = Math.max(-128, Math.min(127, val * 50 | 0));
  }
  return makeSample('Strings', buf, 45, 0, totalLen / 2);
}

function makePluck(): Sample {
  // Pluck: Karplus-Strong-inspirert, decay fra noise-burst
  const len = 6000;
  const buf = new Int8Array(len);
  const cycleLen = 32;
  // Fyll første syklus med tilfeldig noise
  for (let i = 0; i < cycleLen; i++) {
    buf[i] = Math.max(-128, Math.min(127, (Math.random() * 2 - 1) * 100 | 0));
  }
  // Karplus-Strong: gjenta med glatting
  for (let i = cycleLen; i < len; i++) {
    buf[i] = Math.max(-128, Math.min(127,
      (buf[i - cycleLen] + buf[i - cycleLen + 1]) / 2 * 0.996 | 0));
  }
  return makeSample('Pluck', buf, 55);
}

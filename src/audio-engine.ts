// src/audio-engine.ts
// Web Audio API mikser for 4 Amiga-kanaler. Port fra ChannelMixer.swift.

import { AMIGA_CLOCK } from './period-table';

const OUTPUT_RATE = 44100;

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private gains: GainNode[] = [];
  private panners: StereoPannerNode[] = [];
  private sources: (AudioBufferSourceNode | null)[] = [null, null, null, null];
  private channelVolumes: number[] = [1, 1, 1, 1];

  get isRunning(): boolean {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  async start(): Promise<void> {
    if (!this.ctx) {
      this.ctx = new AudioContext({ sampleRate: OUTPUT_RATE });
      const panning = [-1, 1, 1, -1];  // Amiga: CH0/CH3 left, CH1/CH2 right
      for (let i = 0; i < 4; i++) {
        const gain = this.ctx.createGain();
        const panner = this.ctx.createStereoPanner();
        panner.pan.value = panning[i];
        gain.connect(panner);
        panner.connect(this.ctx.destination);
        this.gains.push(gain);
        this.panners.push(panner);
      }
    }
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  stop(): void {
    for (let i = 0; i < 4; i++) {
      this.sources[i]?.stop();
      this.sources[i] = null;
    }
    this.ctx?.suspend();
  }

  trigger(ch: number, sampleData: Int8Array, period: number, volume: number,
          offset: number = 0, when?: number): void {
    if (!this.ctx || ch >= 4 || sampleData.length === 0) return;

    const clampedPeriod = Math.max(113, period);
    const amigaRate = AMIGA_CLOCK / (clampedPeriod * 2);
    const ratio = amigaRate / OUTPUT_RATE;

    const startIndex = Math.min(offset, sampleData.length - 1);
    const srcCount = sampleData.length - startIndex;
    if (srcCount <= 0) return;

    const outFrames = Math.floor(srcCount / ratio);
    if (outFrames <= 0) return;

    const buffer = this.ctx.createBuffer(1, outFrames, OUTPUT_RATE);
    const dst = buffer.getChannelData(0);

    for (let i = 0; i < outFrames; i++) {
      const srcPos = i * ratio;
      const idx = Math.floor(srcPos) + startIndex;
      const frac = srcPos - Math.floor(srcPos);
      const s0 = (idx < sampleData.length ? sampleData[idx] : 0) / 128;
      const s1 = (idx + 1 < sampleData.length ? sampleData[idx + 1] : 0) / 128;
      dst[i] = s0 + (s1 - s0) * frac;
    }

    // Stop previous source on this channel
    this.sources[ch]?.stop();

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.gains[ch]);
    source.start(when ?? 0);
    this.sources[ch] = source;

    this.gains[ch].gain.value = volume / 64;
    this.channelVolumes[ch] = volume / 64;
  }

  setVolume(ch: number, volume: number): void {
    if (ch >= 4 || !this.ctx) return;
    const v = volume / 64;
    this.channelVolumes[ch] = v;
    this.gains[ch].gain.value = v;
  }

  muteChannel(ch: number, muted: boolean): void {
    if (ch >= 4 || !this.ctx) return;
    this.gains[ch].gain.value = muted ? 0 : this.channelVolumes[ch];
  }

  get currentTime(): number {
    return this.ctx?.currentTime ?? 0;
  }
}

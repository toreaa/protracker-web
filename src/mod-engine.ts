// src/mod-engine.ts
// Tick-basert playback. Port fra MODEngine.swift.

import { MODFile } from './mod-file';
import { AudioEngine } from './audio-engine';
import { ChannelState, emptyChannelState, processEffect } from './effects';

export type EngineState = 'stopped' | 'playing' | 'paused';

export class MODEngine {
  mod: MODFile | null = null;
  state: EngineState = 'stopped';
  currentRow = 0;
  currentPosition = 0;
  currentPattern = 0;
  bpm = 125;
  speed = 6;
  channelMuted = [false, false, false, false];

  private tickCount = 0;
  private channels: ChannelState[] = Array.from({ length: 4 }, () => emptyChannelState());
  private audio: AudioEngine;
  private intervalId: number | null = null;
  private nextTickTime = 0;

  constructor(audio: AudioEngine) {
    this.audio = audio;
  }

  static tickInterval(bpm: number): number {
    return 2.5 / bpm;
  }

  async play(): Promise<void> {
    if (this.state === 'playing' || !this.mod) return;
    await this.audio.start();
    this.state = 'playing';
    this.nextTickTime = this.audio.currentTime;
    this.startScheduler();
  }

  async playPattern(): Promise<void> {
    this.currentRow = 0;
    this.currentPosition = 0;
    this.currentPattern = 0;
    this.tickCount = 0;
    await this.play();
  }

  stop(): void {
    this.stopScheduler();
    this.state = 'stopped';
    this.currentRow = 0;
    this.currentPosition = 0;
    this.tickCount = 0;
    this.audio.stop();
  }

  // Look-ahead scheduler: hvert 25ms, schedules 50ms fremover
  private startScheduler(): void {
    this.stopScheduler();
    const LOOK_AHEAD = 0.05;  // 50ms
    const INTERVAL = 25;      // 25ms

    this.intervalId = window.setInterval(() => {
      if (this.state !== 'playing' || !this.mod) return;
      const deadline = this.audio.currentTime + LOOK_AHEAD;
      while (this.nextTickTime < deadline) {
        this.tick(this.nextTickTime);
        this.nextTickTime += MODEngine.tickInterval(this.bpm);
      }
    }, INTERVAL);
  }

  private stopScheduler(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(when: number): void {
    if (!this.mod) return;
    if (this.tickCount === 0) {
      this.processRow(when);
    }
    this.processEffectTicks();
    this.tickCount++;
    if (this.tickCount >= this.speed) {
      this.tickCount = 0;
      this.advanceRow();
    }
  }

  private processRow(when: number): void {
    const mod = this.mod!;
    if (this.currentPattern >= mod.patterns.length) return;
    const pattern = mod.patterns[this.currentPattern];
    if (this.currentRow >= pattern.length) return;
    const row = pattern[this.currentRow];

    for (let ch = 0; ch < 4; ch++) {
      const note = row[ch];
      if (note.sampleNumber > 0) {
        const si = note.sampleNumber - 1;
        if (si < mod.samples.length) {
          this.channels[ch].volume = mod.samples[si].volume;
          this.channels[ch].finetune = mod.samples[si].finetune;
        }
      }
      if (note.period > 0) {
        this.channels[ch].period = note.period;
        if (note.effect !== 0x3) {
          this.channels[ch].targetPeriod = note.period;
          this.triggerNote(ch, note.sampleNumber, when);
        }
      }
      if (note.effect !== 0 || note.effectParam !== 0) {
        processEffect(note.effect, note.effectParam, this.channels[ch], 0);
        this.handleEngineEffects(note.effect, note.effectParam);
      }
    }
  }

  private processEffectTicks(): void {
    const mod = this.mod!;
    if (this.currentPattern >= mod.patterns.length) return;
    const pattern = mod.patterns[this.currentPattern];
    if (this.currentRow >= pattern.length) return;
    const row = pattern[this.currentRow];

    for (let ch = 0; ch < 4; ch++) {
      const note = row[ch];
      if (note.effect !== 0 || note.effectParam !== 0) {
        processEffect(note.effect, note.effectParam, this.channels[ch], this.tickCount);
        this.audio.setVolume(ch, this.channels[ch].volume);
      }
    }
  }

  private handleEngineEffects(effect: number, param: number): void {
    const mod = this.mod!;
    switch (effect) {
      case 0xB:
        this.currentPosition = Math.min(param, mod.songLength - 1);
        this.currentPattern = mod.arrangement[this.currentPosition];
        this.currentRow = -1;
        break;
      case 0xD:
        this.advancePosition();
        this.currentRow = ((param >> 4) * 10 + (param & 0xF)) - 1;
        break;
      case 0xF:
        if (param < 0x20) this.speed = param;
        else this.bpm = param;
        break;
    }
  }

  private advanceRow(): void {
    this.currentRow++;
    if (this.currentRow >= 64) {
      this.currentRow = 0;
      this.advancePosition();
    }
  }

  private advancePosition(): void {
    const mod = this.mod!;
    this.currentPosition++;
    if (this.currentPosition >= mod.songLength) {
      this.currentPosition = 0;
      this.currentPattern = mod.arrangement[0];
      this.state = 'stopped';
      this.stopScheduler();
    } else {
      this.currentPattern = mod.arrangement[Math.min(this.currentPosition, mod.arrangement.length - 1)];
    }
  }

  private triggerNote(ch: number, sampleNumber: number, when: number): void {
    if (!this.mod || sampleNumber <= 0) return;
    const si = sampleNumber - 1;
    if (si >= this.mod.samples.length) return;
    const sample = this.mod.samples[si];
    if (sample.data.length === 0 || this.channelMuted[ch]) return;
    this.audio.trigger(ch, sample.data, this.channels[ch].period,
                       this.channels[ch].volume, this.channels[ch].sampleOffset, when);
    this.channels[ch].sampleOffset = 0;
  }

  setMute(ch: number, muted: boolean): void {
    if (ch >= 4) return;
    this.channelMuted[ch] = muted;
    this.audio.muteChannel(ch, muted);
  }
}

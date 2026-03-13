// src/main.ts
// Entry point — kobler canvas, events, engine og renderer.

import { emptyMODFile, emptyNote, emptyPattern } from './mod-file';
import { parseMOD } from './mod-parser';
import { writeMOD } from './mod-writer';
import { defaultSamples } from './sample-generator';
import { AudioEngine } from './audio-engine';
import { MODEngine } from './mod-engine';
import { UIState } from './ui-state';
import { HitTester } from './hit-test';
import { Renderer, RendererCallbacks } from './renderer';
import { KEY_TO_NOTE_INDEX, PERIODS } from './period-table';

// ---- Setup ----
const canvas = document.getElementById('screen') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const fileInput = document.getElementById('file-input') as HTMLInputElement;

const audio = new AudioEngine();
const engine = new MODEngine(audio);
const ui = new UIState();
const hits = new HitTester();
const renderer = new Renderer(ctx, hits);

// Start med ny sang + default samples
let mod = emptyMODFile();
mod.samples = defaultSamples();
mod.songName = 'New Song';
engine.mod = mod;

// ---- Callbacks ----
const callbacks: RendererCallbacks = {
  onPlay: () => engine.play(),
  onStop: () => engine.stop(),
  onPlayPattern: () => engine.playPattern(),
  onClear: () => {
    const idx = Math.min(engine.currentPattern, Math.max(0, mod.patterns.length - 1));
    mod.patterns[idx] = emptyPattern();
  },
  onLoad: () => fileInput.click(),
  onSave: () => {
    const data = writeMOD(mod);
    const blob = new Blob([data], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (mod.songName || 'untitled') + '.mod';
    a.click();
    URL.revokeObjectURL(url);
  },
};

// ---- File loading ----
function loadMODFile(buffer: ArrayBuffer): void {
  try {
    mod = parseMOD(buffer);
    engine.mod = mod;
    engine.stop();
    console.log(`Loaded: '${mod.songName}', ${mod.patterns.length} patterns, ` +
      `${mod.samples.filter(s => s.data.length > 0).length} samples`);
  } catch (e) {
    console.error('Failed to load MOD:', e);
  }
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => loadMODFile(reader.result as ArrayBuffer);
  reader.readAsArrayBuffer(file);
  fileInput.value = '';
});

// Drag & drop
canvas.addEventListener('dragover', (e) => { e.preventDefault(); });
canvas.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer?.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => loadMODFile(reader.result as ArrayBuffer);
  reader.readAsArrayBuffer(file);
});

// ---- Mouse ----
canvas.addEventListener('mousedown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top) * scaleY;
  hits.test(mx, my);
});

// ---- Keyboard ----
canvas.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowDown':  ui.moveCursor(1, 0); e.preventDefault(); break;
    case 'ArrowUp':    ui.moveCursor(-1, 0); e.preventDefault(); break;
    case 'ArrowRight': ui.moveCursor(0, 1); e.preventDefault(); break;
    case 'ArrowLeft':  ui.moveCursor(0, -1); e.preventDefault(); break;
    case 'Backspace':
    case 'Delete': {
      const patIdx = Math.min(engine.currentPattern, Math.max(0, mod.patterns.length - 1));
      mod.patterns[patIdx][ui.cursorRow][ui.cursorChannel] = emptyNote();
      ui.moveCursor(1, 0);
      e.preventDefault();
      break;
    }
    default: {
      const noteIdx = KEY_TO_NOTE_INDEX[e.key.toLowerCase()];
      if (noteIdx !== undefined && noteIdx < PERIODS.length) {
        const patIdx = Math.min(engine.currentPattern, Math.max(0, mod.patterns.length - 1));
        mod.patterns[patIdx][ui.cursorRow][ui.cursorChannel] = {
          period: PERIODS[noteIdx],
          sampleNumber: ui.selectedSample,
          effect: 0,
          effectParam: 0,
        };
        ui.moveCursor(1, 0);
        e.preventDefault();
      }
    }
  }
});

// Focus canvas
canvas.focus();

// ---- Render loop ----
function frame(): void {
  renderer.render(mod, engine, ui, callbacks);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

console.log('ProTracker Web initialized');

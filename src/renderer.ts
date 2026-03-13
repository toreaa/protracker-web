// src/renderer.ts
// Canvas 2D renderer for hele ProTracker UI.

import { MODFile, isNoteEmpty, Note } from './mod-file';
import { MODEngine } from './mod-engine';
import { UIState } from './ui-state';
import { HitTester } from './hit-test';
import { periodToNoteName } from './period-table';

// ProTracker fargepalett
const C = {
  bg:        '#000000',
  panel:     '#888888',
  panelLight:'#BBBBBB',
  panelDark: '#555555',
  text:      '#000000',
  patText:   '#3344FF',
  patEmpty:  'rgba(33,44,166,0.7)',
  cursor:    '#DD0044',
  rowNum:    '#888888',
  beatBg:    '#0A0A14',
  currentBg: '#262650',
  yellow:    '#FFDD00',
};

const W = 640, H = 480;
const TOP_H = 160;      // TopPanel total høyde
const STATUS_H = 16;    // StatusBar
const PAT_HEADER_H = 14;
const ROW_H = 10;
const ROW_NUM_W = 20;
const CH_W = 155;
const FONT = '9px monospace';
const FONT_SM = '8px monospace';

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private hits: HitTester;

  constructor(ctx: CanvasRenderingContext2D, hits: HitTester) {
    this.ctx = ctx;
    this.hits = hits;
  }

  render(mod: MODFile, engine: MODEngine, ui: UIState,
         callbacks: RendererCallbacks): void {
    const ctx = this.ctx;
    this.hits.clear();

    // Bakgrunn
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, 0, W, H);

    this.drawTopPanel(ctx, mod, engine, ui, callbacks);
    this.drawStatusBar(ctx, engine, mod);
    this.drawPatternEditor(ctx, mod, engine, ui);
  }

  private drawTopPanel(ctx: CanvasRenderingContext2D, mod: MODFile,
                       engine: MODEngine, ui: UIState,
                       cb: RendererCallbacks): void {
    // Panel bakgrunn
    ctx.fillStyle = C.panel;
    ctx.fillRect(0, 0, W, TOP_H);

    // Bevel
    ctx.fillStyle = C.panelLight;
    ctx.fillRect(0, 0, W, 1);
    ctx.fillRect(0, 0, 1, TOP_H);
    ctx.fillStyle = C.panelDark;
    ctx.fillRect(0, TOP_H - 1, W, 1);
    ctx.fillRect(W - 1, 0, 1, TOP_H);

    ctx.font = FONT;
    ctx.fillStyle = C.text;

    // ---- Seksjon A: Posisjon + Transport ----
    let y = 6;
    this.drawLabel(ctx, 4, y, 'POS');
    this.drawField(ctx, 40, y, 40, String(engine.currentPosition).padStart(4, '0'));
    this.drawStepper(ctx, 84, y,
      () => { engine.currentPosition = Math.min(engine.currentPosition + 1, mod.songLength - 1); },
      () => { engine.currentPosition = Math.max(engine.currentPosition - 1, 0); });

    y += 14;
    this.drawLabel(ctx, 4, y, 'PATTERN');
    this.drawField(ctx, 56, y, 40, String(engine.currentPattern).padStart(4, '0'));

    y += 14;
    this.drawLabel(ctx, 4, y, 'LENGTH');
    this.drawField(ctx, 52, y, 40, String(mod.songLength).padStart(4, '0'));
    this.drawStepper(ctx, 96, y,
      () => { mod.songLength = Math.min(mod.songLength + 1, 128); },
      () => { mod.songLength = Math.max(mod.songLength - 1, 1); });

    // Transport buttons
    const bx = 400;
    this.drawButton(ctx, bx, 6, 50, 12, 'PLAY', () => cb.onPlay());
    this.drawButton(ctx, bx + 54, 6, 50, 12, 'STOP', () => cb.onStop());
    this.drawButton(ctx, bx, 22, 50, 12, 'PATTERN', () => cb.onPlayPattern());
    this.drawButton(ctx, bx + 54, 22, 50, 12, 'CLEAR', () => cb.onClear());

    // ---- Seksjon B: Sample params ----
    y = 56;
    const si = Math.max(0, Math.min(ui.selectedSample - 1, mod.samples.length - 1));
    this.drawLabel(ctx, 4, y, 'SAMPLE');
    this.drawField(ctx, 52, y, 40, String(ui.selectedSample).padStart(4, '0'));
    this.drawStepper(ctx, 96, y,
      () => { ui.selectedSample = Math.min(ui.selectedSample + 1, 31); },
      () => { ui.selectedSample = Math.max(ui.selectedSample - 1, 1); });

    y += 14;
    this.drawLabel(ctx, 4, y, 'VOLUME');
    this.drawField(ctx, 52, y, 40, String(mod.samples[si].volume).padStart(4, '0'));
    this.drawStepper(ctx, 96, y,
      () => { mod.samples[si].volume = Math.min(mod.samples[si].volume + 1, 64); },
      () => { mod.samples[si].volume = Math.max(mod.samples[si].volume - 1, 0); });

    y += 14;
    this.drawLabel(ctx, 4, y, 'LENGTH');
    this.drawField(ctx, 52, y, 50, String(mod.samples[si].length).padStart(5, '0'));

    y += 14;
    this.drawLabel(ctx, 4, y, 'REPEAT');
    this.drawField(ctx, 52, y, 50, String(mod.samples[si].repeatOffset).padStart(5, '0'));

    y += 14;
    this.drawLabel(ctx, 4, y, 'REPLEN');
    this.drawField(ctx, 52, y, 50, String(mod.samples[si].repeatLength).padStart(5, '0'));

    // Tittel
    ctx.fillStyle = C.panelDark;
    ctx.fillRect(200, 56, 240, 70);
    ctx.fillStyle = C.panelLight;
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PROTRACKER 2.3F', 320, 80);
    ctx.font = FONT;
    ctx.fillText('— A new version by: —', 320, 95);
    ctx.fillText('audioHarald', 320, 110);
    ctx.textAlign = 'left';

    // ---- Seksjon C: Songname / Samplename ----
    y = 134;
    this.drawLabel(ctx, 4, y, 'SONGNAME:');
    this.drawField(ctx, 72, y, 200, mod.songName);

    y += 14;
    this.drawLabel(ctx, 4, y, 'SAMPLENAME:');
    this.drawField(ctx, 84, y, 200, mod.samples[si].name);

    // Load/Save buttons
    this.drawButton(ctx, 500, 134, 50, 12, 'LOAD', () => cb.onLoad());
    this.drawButton(ctx, 554, 134, 50, 12, 'SAVE', () => cb.onSave());
  }

  private drawStatusBar(ctx: CanvasRenderingContext2D,
                        engine: MODEngine, _mod: MODFile): void {
    const y = TOP_H;
    ctx.fillStyle = C.panel;
    ctx.fillRect(0, y, W, STATUS_H);
    // Bevel
    ctx.fillStyle = C.panelLight;
    ctx.fillRect(0, y, W, 1);
    ctx.fillStyle = C.panelDark;
    ctx.fillRect(0, y + STATUS_H - 1, W, 1);

    ctx.font = FONT_SM;
    ctx.fillStyle = C.text;
    ctx.fillText(`POS:${String(engine.currentPosition).padStart(3, '0')}`, 8, y + 11);
    ctx.fillText(`PAT:${String(engine.currentPattern).padStart(3, '0')}`, 80, y + 11);
    ctx.fillText(`ROW:${String(engine.currentRow).padStart(2, '0')}`, 150, y + 11);
    ctx.fillText(`BPM:${engine.bpm}`, 210, y + 11);
    ctx.fillText(`SPD:${engine.speed}`, 270, y + 11);
    ctx.fillText(engine.state.toUpperCase(), 340, y + 11);
  }

  private drawPatternEditor(ctx: CanvasRenderingContext2D,
                            mod: MODFile, engine: MODEngine, ui: UIState): void {
    const baseY = TOP_H + STATUS_H;
    const patIdx = Math.min(engine.currentPattern, Math.max(0, mod.patterns.length - 1));
    const pattern = mod.patterns[patIdx];

    // Header
    ctx.fillStyle = C.rowNum;
    ctx.fillRect(0, baseY, W, PAT_HEADER_H);
    ctx.fillStyle = C.panelLight;
    ctx.fillRect(0, baseY, W, 1);
    ctx.fillStyle = C.panelDark;
    ctx.fillRect(0, baseY + PAT_HEADER_H - 1, W, 1);

    ctx.font = FONT_SM;
    ctx.fillStyle = C.text;
    ctx.fillText('POS', 2, baseY + 10);
    for (let ch = 0; ch < 4; ch++) {
      ctx.fillText(`TRACK #${ch + 1}`, ROW_NUM_W + ch * CH_W + 4, baseY + 10);
    }

    // Rows
    const rowStartY = baseY + PAT_HEADER_H;
    ctx.font = FONT;

    for (let row = 0; row < 64; row++) {
      const y = rowStartY + row * ROW_H;
      if (y > H) break;

      // Row bakgrunn
      if (row === engine.currentRow && engine.state === 'playing') {
        ctx.fillStyle = C.currentBg;
        ctx.fillRect(0, y, W, ROW_H);
      } else if (row % 4 === 0) {
        ctx.fillStyle = C.beatBg;
        ctx.fillRect(0, y, W, ROW_H);
      }

      // Rad-nummer
      ctx.fillStyle = C.rowNum;
      ctx.fillText(row.toString(16).toUpperCase().padStart(2, '0'), 2, y + 8);

      // Kanaler
      for (let ch = 0; ch < 4; ch++) {
        const x = ROW_NUM_W + ch * CH_W;

        // Cursor
        if (row === ui.cursorRow && ch === ui.cursorChannel) {
          ctx.fillStyle = C.cursor;
          ctx.fillRect(x, y, CH_W, ROW_H);
        }

        const note = pattern[row][ch];
        ctx.fillStyle = isNoteEmpty(note) ? C.patEmpty : C.patText;
        ctx.fillText(formatNote(note), x + 4, y + 8);
      }
    }
  }

  // ---- UI-hjelpere ----

  private drawLabel(ctx: CanvasRenderingContext2D, x: number, y: number, text: string): void {
    ctx.fillStyle = C.text;
    ctx.fillText(text, x, y + 9);
  }

  private drawField(ctx: CanvasRenderingContext2D, x: number, y: number,
                    w: number, text: string): void {
    ctx.fillStyle = C.bg;
    ctx.fillRect(x, y, w, 12);
    ctx.fillStyle = C.patText;
    ctx.fillText(text, x + 2, y + 9);
  }

  private drawButton(ctx: CanvasRenderingContext2D, x: number, y: number,
                     w: number, h: number, label: string, action: () => void): void {
    // Bakgrunn
    ctx.fillStyle = C.panel;
    ctx.fillRect(x, y, w, h);
    // Bevel raised
    ctx.fillStyle = C.panelLight;
    ctx.fillRect(x, y, w, 1);
    ctx.fillRect(x, y, 1, h);
    ctx.fillStyle = C.panelDark;
    ctx.fillRect(x, y + h - 1, w, 1);
    ctx.fillRect(x + w - 1, y, 1, h);
    // Tekst
    ctx.fillStyle = C.text;
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w / 2, y + h - 3);
    ctx.textAlign = 'left';
    // Hit region
    this.hits.add(x, y, w, h, action);
  }

  private drawStepper(ctx: CanvasRenderingContext2D, x: number, y: number,
                      onUp: () => void, onDown: () => void): void {
    this.drawButton(ctx, x, y, 12, 12, '\u25B2', onUp);
    this.drawButton(ctx, x + 14, y, 12, 12, '\u25BC', onDown);
  }
}

export interface RendererCallbacks {
  onPlay: () => void;
  onStop: () => void;
  onPlayPattern: () => void;
  onClear: () => void;
  onLoad: () => void;
  onSave: () => void;
}

function formatNote(note: Note): string {
  if (isNoteEmpty(note)) return '--- --00000';
  const name = periodToNoteName(note.period);
  const inst = note.sampleNumber > 0
    ? note.sampleNumber.toString(16).toUpperCase().padStart(2, '0')
    : '--';
  const fx = note.effect.toString(16).toUpperCase()
    + note.effectParam.toString(16).toUpperCase().padStart(2, '0');
  return `${name} ${inst}${fx}`;
}

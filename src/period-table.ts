// src/period-table.ts
// Amiga period-tabeller og note-navn.

export const PERIODS = [
  856, 808, 762, 720, 678, 640, 604, 570, 538, 508, 480, 453,  // Oktav 1
  428, 404, 381, 360, 339, 320, 302, 285, 269, 254, 240, 226,  // Oktav 2
  214, 202, 190, 180, 170, 160, 151, 143, 135, 127, 120, 113,  // Oktav 3
];

export const NOTE_NAMES = [
  'C-1','C#1','D-1','D#1','E-1','F-1','F#1','G-1','G#1','A-1','A#1','B-1',
  'C-2','C#2','D-2','D#2','E-2','F-2','F#2','G-2','G#2','A-2','A#2','B-2',
  'C-3','C#3','D-3','D#3','E-3','F-3','F#3','G-3','G#3','A-3','A#3','B-3',
];

export function periodToNoteName(period: number): string {
  if (period === 0) return '---';
  const idx = PERIODS.indexOf(period);
  if (idx >= 0) return NOTE_NAMES[idx];
  // Finn nærmeste match for finetune-justerte perioder
  let best = 0, bestDist = Math.abs(PERIODS[0] - period);
  for (let i = 1; i < PERIODS.length; i++) {
    const dist = Math.abs(PERIODS[i] - period);
    if (dist < bestDist) { best = i; bestDist = dist; }
  }
  return NOTE_NAMES[best];
}

// ProTracker keyboard layout
export const KEY_TO_NOTE_INDEX: Record<string, number> = {
  // Nedre oktav (C-1 → B-1)
  'z': 0, 's': 1, 'x': 2, 'd': 3, 'c': 4, 'v': 5,
  'g': 6, 'b': 7, 'h': 8, 'n': 9, 'j': 10, 'm': 11,
  // Øvre oktav (C-2 → B-2)
  'q': 12, '2': 13, 'w': 14, '3': 15, 'e': 16, 'r': 17,
  '5': 18, 't': 19, '6': 20, 'y': 21, '7': 22, 'u': 23,
};

export const AMIGA_CLOCK = 7_093_789.2;  // PAL

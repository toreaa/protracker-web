// src/ui-state.ts
// App-state for UI. Port fra AppState.swift.

export class UIState {
  cursorRow = 0;
  cursorChannel = 0;
  selectedSample = 1;    // 1–31

  moveCursor(dRow: number = 0, dCh: number = 0): void {
    this.cursorRow = Math.max(0, Math.min(63, this.cursorRow + dRow));
    this.cursorChannel = Math.max(0, Math.min(3, this.cursorChannel + dCh));
  }
}

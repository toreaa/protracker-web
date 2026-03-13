// src/hit-test.ts
// Klikk-regioner for canvas UI.

export interface HitRegion {
  x: number; y: number; w: number; h: number;
  action: () => void;
}

export class HitTester {
  private regions: HitRegion[] = [];

  clear(): void {
    this.regions = [];
  }

  add(x: number, y: number, w: number, h: number, action: () => void): void {
    this.regions.push({ x, y, w, h, action });
  }

  test(mx: number, my: number): boolean {
    // Itererer bakfra slik at sist-registrerte (øverste) treffes først
    for (let i = this.regions.length - 1; i >= 0; i--) {
      const r = this.regions[i];
      if (mx >= r.x && mx < r.x + r.w && my >= r.y && my < r.y + r.h) {
        r.action();
        return true;
      }
    }
    return false;
  }
}

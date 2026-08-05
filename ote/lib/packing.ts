import { rng } from "./rng";

export type Cell = { c: number; r: number; w: number; h: number };

// Fully tile a cols×rows grid with mixed-format panels — no gaps, no overlaps.
// Walk the grid row-major; at the first free cell, drop the largest panel that
// still fits, biased toward variety with the occasional feature block.
export function pack(cols: number, rows: number, seed: number): Cell[] {
  const occ: boolean[][] = Array.from({ length: rows }, () =>
    new Array(cols).fill(false)
  );
  const out: Cell[] = [];
  const r = rng(seed);
  const sizes: [number, number][] = [
    [1, 1],
    [1, 1],
    [2, 1],
    [1, 2],
    [2, 2],
    [3, 2],
    [2, 3],
    [3, 1],
    [1, 3],
    [2, 2],
  ];
  const free = (c: number, rw: number, w: number, h: number) => {
    if (c + w > cols || rw + h > rows) return false;
    for (let y = rw; y < rw + h; y++)
      for (let x = c; x < c + w; x++) if (occ[y][x]) return false;
    return true;
  };
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (occ[y][x]) continue;
      const fit = sizes.filter((s) => free(x, y, s[0], s[1]));
      let pick: [number, number] = fit[(r() * fit.length) | 0] || [1, 1];
      if (r() > 0.78) {
        const big = fit.filter((s) => s[0] * s[1] >= 4);
        if (big.length) pick = big[(r() * big.length) | 0];
      }
      for (let yy = y; yy < y + pick[1]; yy++)
        for (let xx = x; xx < x + pick[0]; xx++) occ[yy][xx] = true;
      out.push({ c: x, r: y, w: pick[0], h: pick[1] });
    }
  }
  return out;
}

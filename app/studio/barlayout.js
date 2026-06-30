// Pure placement math for the floating format bar (kept out of the .jsx so it is
// unit-testable). Float the bar ABOVE the selection; if there isn't room (a line
// within ~H+12px of the viewport top) drop it BELOW so it never covers the words
// being edited. Result is clamped to the viewport.
export function barTop(rect, H, vh) {
  const above = rect.top - H - 12;
  const below = above < 8;
  const top = Math.max(8, Math.min(below ? rect.bottom + 12 : above, vh - H - 8));
  return { top, below };
}

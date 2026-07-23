"use client";
import React from "react";
import { styledRuns, isUniformText, applyCase } from "./model";
import { hlCss } from "./hlstyles";

// Render a text element's content as styled RUNS — each contiguous span carries
// its own colour / weight / italic / strike / background / outline (see
// model.styledRuns, which also folds in the back-compat `highlight` marker).
// Shared by the live canvas (Element) and the static/preview renderer
// (StaticSlide) so styling is identical in both, and mirrored by the PNG export's
// drawRichText. When the element is uniform (no runs, no marker, no element-wide
// background/outline) we return the raw string so the container's own CSS covers
// it — keeping the common case byte-for-byte as before.
export default function RichText({ el }) {
  if (isUniformText(el)) return applyCase(el.content, el.textCase);
  const spans = styledRuns(el);
  return spans.map((s, i) => <span key={i} style={spanStyle(s)}>{s.text}</span>);
}

// One run's effective style → inline CSS. Background and outline are the
// inline-only decorations (a span, not the container): background clones across
// wrapped lines like a marker; outline paints the stroke under the fill.
export function spanStyle(s) {
  const st = {
    color: s.color,
    fontWeight: s.fontWeight,
    fontStyle: s.italic ? "italic" : "normal",
  };
  // Per-span size (B3): inline fontSize overrides the container when a run set it.
  if (s.fontSize) st.fontSize = s.fontSize;
  if (s.strike || s.underline) {
    st.textDecorationLine = [s.underline ? "underline" : "", s.strike ? "line-through" : ""].filter(Boolean).join(" ");
    st.textDecorationColor = s.strikeColor || s.color;
    // Tight underline: thin + snug to the baseline (no thick, detached overshoot).
    st.textDecorationThickness = (s.underline && !s.strike) ? "0.055em" : "0.09em";
    if (s.underline) { st.textUnderlineOffset = "0.14em"; st.textDecorationSkipInk = "none"; }
  }
  // Highlight: style-driven (pill/block/marker/band/outline), hugging the text.
  if (s.bg) Object.assign(st, hlCss(s.bg, s.bgStyle, s.color));
  if (s.stroke && s.strokeWidth) {
    st.WebkitTextStrokeWidth = s.strokeWidth + "px";
    st.WebkitTextStrokeColor = s.stroke;
    st.paintOrder = "stroke fill";
  }
  return st;
}

"use client";
import React from "react";
import { highlightRuns } from "./model";

// Render a text element's content, wrapping an optional `highlight` phrase in a
// knockout "marker" span (accent background, bg-colored text). Used by the live
// canvas (Element) and the static/preview renderer (StaticSlide) so emphasis is
// identical in both — and matches the PNG export's manual draw. `boxDecoration-
// Break: clone` keeps the marker tidy when the phrase wraps across lines.
export default function RichText({ el }) {
  if (!el.highlight || !el.highlightColor) return el.content;
  const runs = highlightRuns(el.content, el.highlight);
  if (runs.length === 1) return el.content;
  return runs.map((r, i) =>
    r.hl ? (
      <span
        key={i}
        style={{
          background: el.highlightColor,
          color: el.highlightText || "inherit",
          padding: "0 0.1em",
          borderRadius: 3,
          WebkitBoxDecorationBreak: "clone",
          boxDecorationBreak: "clone",
        }}
      >
        {r.text}
      </span>
    ) : (
      <React.Fragment key={i}>{r.text}</React.Fragment>
    )
  );
}

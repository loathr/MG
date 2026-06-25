"use client";
import React from "react";
import { previewCover } from "./templates";
import StaticSlide from "./StaticSlide";

// A real rendered cover slide in the given style, through that family's OWN cover
// layout — so the gallery card is exactly what you get: "what you pick is what
// you get". (Editorial left-aligned, Enterprise a B&W brief, News Desk a nameplate.)
const SAMPLE = {
  kicker: "The Turning Point",
  heading: "How one moment changed the game",
  subhead: "A premium editorial preview.",
};

function StylePreview({ style, width }) {
  const slide = React.useMemo(() => previewCover(SAMPLE, style.key), [style.key]);
  return <StaticSlide slide={slide} width={width} />;
}

export default React.memo(StylePreview);

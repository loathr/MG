"use client";
import React from "react";
import { coverTemplate } from "./templates";
import StaticSlide from "./StaticSlide";

// A real rendered cover slide in the given style — the gallery card's preview is
// the same template code the editor uses, so "what you pick is what you get".
const SAMPLE = {
  kicker: "The Turning Point",
  heading: "How one moment changed the game",
  subhead: "A premium editorial preview.",
};

function StylePreview({ style, width }) {
  const slide = React.useMemo(() => coverTemplate(SAMPLE, style.key), [style.key]);
  return <StaticSlide slide={slide} width={width} />;
}

export default React.memo(StylePreview);

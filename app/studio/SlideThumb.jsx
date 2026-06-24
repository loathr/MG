"use client";
import React from "react";
import StaticSlide from "./StaticSlide";

// A clickable thumbnail of a slide for the bottom strip. The actual rendering
// (and the FLAT-LAYERS §3 thumb-only image rule) lives in StaticSlide; this just
// adds the selection chrome + slide number.

const THUMB_W = 60; // strip thumbnail width, px

function SlideThumb({ slide, index, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-role="slide-thumb"
      title={"Slide " + (index + 1)}
      style={{
        position: "relative",
        flexShrink: 0,
        padding: 0,
        lineHeight: 0,
        border: "1.5px solid " + (active ? "#2d8cff" : "#36363c"),
        borderRadius: 5,
        overflow: "hidden",
        cursor: "pointer",
        background: "#0c0c0c",
        boxShadow: active ? "0 0 0 1px #2d8cff" : "none",
      }}
    >
      <StaticSlide slide={slide} width={THUMB_W} />
      <span style={{
        position: "absolute", bottom: 1, right: 3,
        fontSize: 9, lineHeight: 1.4, color: "#fff",
        textShadow: "0 1px 2px rgba(0,0,0,0.9)",
        fontFamily: "Helvetica, Arial, sans-serif",
      }}>{index + 1}</span>
    </button>
  );
}

// memo: a thumbnail only re-renders when its own slide object changes. Editing
// slide 3 never re-renders slides 1,2,4… (same isolation principle as Element).
export default React.memo(SlideThumb);

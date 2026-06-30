"use client";
import React from "react";
import RichText from "./RichText";
import RichEditable from "./RichEditable";
import ShapeBacking from "./ShapeBacking";
import { shapePad, shapeVAlign } from "./shapes";
import { imageTransform } from "./model";

// One element. Wrapped in React.memo so it re-renders only when its own object
// (or its editing flag) changes — the key to Canva-like drag performance.
function ElementView({ element: el, isEditing, isCropping, onPointerDownBody, onStartEdit, onStartCrop, onCommitText, onEndEdit, onTextSelect, onEditApi, onStyleApply }) {
  // Editing is delegated to RichEditable (B1) — a contentEditable seeded from the
  // element's runs so styling previews live. It commits content+runs on exit.

  const frame = {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.w,
    height: el.h,
    transform: "rotate(" + (el.rotation || 0) + "deg)",
    transformOrigin: "center center",
    opacity: el.opacity == null ? 1 : el.opacity,
    cursor: isEditing ? "text" : "move",
    userSelect: isEditing ? "text" : "none",
    touchAction: "none",
  };
  // Locked elements (e.g. the deck frame bars) are pure chrome: non-interactive,
  // so a full-bleed-edge frame never intercepts a click meant for the content
  // beneath it. Removed/changed via its own control (Brand → Look), not the canvas.
  if (el.locked) { frame.pointerEvents = "none"; frame.cursor = "default"; }
  // Images clip to their box so a crop zoom/pan never bleeds past the frame.
  // In free-form crop mode the whole photo drags, so show a grab cursor.
  if (el.type === "image") { frame.overflow = "hidden"; if (isCropping) frame.cursor = "grab"; }

  let inner = null;
  if (el.type === "text") {
    // A text element may wear a SHAPE backing (shapes.js): the shape renders
    // behind the copy and the text sits in a padded, centered layer on top —
    // staying a fully-editable text box. Plain text keeps the top-aligned fill.
    const shaped = !!el.shape;
    const textStyle = {
      width: "100%",
      height: shaped ? "auto" : "100%",
      fontFamily: el.fontFamily,
      fontSize: el.fontSize,
      fontWeight: el.fontWeight,
      fontStyle: el.italic ? "italic" : "normal",
      color: el.color,
      textAlign: el.align,
      lineHeight: el.lineHeight,
      letterSpacing: (el.letterSpacing || 0) + "px",
      textDecorationLine: (el.underline || el.strike) ? [el.underline ? "underline" : "", el.strike ? "line-through" : ""].filter(Boolean).join(" ") : "none",
      textDecorationColor: el.strikeColor || el.color,
      textDecorationThickness: (el.underline || el.strike) ? "0.11em" : undefined,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      outline: "none",
      overflow: shaped ? "visible" : "hidden",
    };
    const textNode = isEditing ? (
      <RichEditable
        el={el}
        textStyle={textStyle}
        onCommitText={onCommitText}
        onEndEdit={onEndEdit}
        onTextSelect={onTextSelect}
        onEditApi={onEditApi}
        onStyleApply={onStyleApply}
      />
    ) : (
      <div style={textStyle}><RichText el={el} /></div>
    );
    if (shaped) {
      const pad = shapePad(el);
      inner = (
        <>
          <ShapeBacking el={el} />
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: shapeVAlign(el), boxSizing: "border-box",
            justifyContent: el.align === "center" ? "center" : el.align === "right" ? "flex-end" : "flex-start",
            paddingTop: pad.top, paddingRight: pad.right, paddingBottom: pad.bottom, paddingLeft: pad.left,
          }}>
            {textNode}
          </div>
        </>
      );
    } else {
      inner = textNode;
    }
  } else if (el.type === "image") {
    inner = (
      <>
        {el.src ? (
          <img
            src={el.src}
            alt=""
            draggable={false}
            style={Object.assign({ width: "100%", height: "100%", objectFit: el.fit || "cover", borderRadius: el.radius || 0, display: "block" }, imageTransform(el))}
            onError={(e) => { e.currentTarget.style.opacity = "0"; }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: "#222", borderRadius: el.radius || 0 }} />
        )}
        {/* Darkening overlay (photo-owned scrim) — non-clicking, so it never
            blocks selecting the photo. Tuned via the toolbar's Overlay control. */}
        {el.scrim ? <div style={{ position: "absolute", inset: 0, background: "#000", opacity: el.scrim, borderRadius: el.radius || 0, pointerEvents: "none" }} /> : null}
      </>
    );
  } else if (el.type === "rect") {
    inner = (
      <div style={{
        width: "100%", height: "100%",
        background: el.fill,
        borderRadius: el.radius || 0,
        border: el.stroke && el.stroke !== "none" ? (el.strokeWidth || 1) + "px " + (el.dash || "solid") + " " + el.stroke : "none",
      }} />
    );
  } else if (el.type === "line") {
    inner = (el.dash && el.dash !== "solid")
      ? <div style={{ width: "100%", height: "100%", boxSizing: "border-box", borderTop: el.h + "px " + el.dash + " " + el.fill, background: "transparent" }} />
      : <div style={{ width: "100%", height: "100%", background: el.fill }} />;
  }

  return (
    <div
      style={frame}
      onPointerDown={(e) => { if (!isEditing && !el.locked) onPointerDownBody(e, el.id); }}
      onDoubleClick={(e) => {
        if (el.type === "text") { e.stopPropagation(); onStartEdit(el.id); }
        else if (el.type === "image" && onStartCrop) { e.stopPropagation(); onStartCrop(el.id); }
      }}
    >
      {inner}
      {isCropping && el.type === "image" && <CropOverlay />}
    </div>
  );
}

// The free-form crop affordance: a rule-of-thirds guide + hint, drawn over the
// photo while in crop mode. pointerEvents:none so drags fall through to the
// frame (which pans the focal point) and the wheel still zooms.
function CropOverlay() {
  const line = { position: "absolute", background: "rgba(255,255,255,0.45)" };
  const badge = { position: "absolute", background: "rgba(0,0,0,0.6)", color: "#fff", fontSize: 12, fontFamily: "Helvetica, Arial, sans-serif", padding: "3px 9px", borderRadius: 13, whiteSpace: "nowrap" };
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", boxShadow: "inset 0 0 0 2px rgba(255,255,255,0.9)" }}>
      <div style={{ ...line, left: "33.33%", top: 0, bottom: 0, width: 1 }} />
      <div style={{ ...line, left: "66.66%", top: 0, bottom: 0, width: 1 }} />
      <div style={{ ...line, top: "33.33%", left: 0, right: 0, height: 1 }} />
      <div style={{ ...line, top: "66.66%", left: 0, right: 0, height: 1 }} />
      <div style={{ ...badge, left: "50%", top: "50%", transform: "translate(-50%,-50%)" }}>✛ drag to reposition</div>
      <div style={{ ...badge, right: 8, bottom: 8 }}>scroll = zoom</div>
    </div>
  );
}

export default React.memo(ElementView);

"use client";
import React, { useEffect, useRef } from "react";
import RichText from "./RichText";
import Sticker from "./Sticker";

// One element. Wrapped in React.memo so it re-renders only when its own object
// (or its editing flag) changes — the key to Canva-like drag performance.
function ElementView({ element: el, isEditing, onPointerDownBody, onStartEdit, onCommitText, onEndEdit }) {
  const editRef = useRef(null);
  const pendingRef = useRef(null); // latest typed text, tracked without re-rendering
  const cancelledRef = useRef(false); // Escape reverts the edit instead of committing

  useEffect(() => {
    if (!isEditing || !editRef.current) return;
    const node = editRef.current;
    pendingRef.current = el.content; // baseline at edit start
    cancelledRef.current = false;
    node.focus();
    // place caret at the end
    const sel = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(node);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    // Commit when editing ends by ANY path — blur, clicking the canvas
    // (deselect), selecting another element, a slide change, or unmount. The old
    // code committed only in the contentEditable's onBlur, but clicking outside
    // unmounts this node before its blur fires, so the typed text was dropped and
    // the element snapped back to its original — the "edit reverts" bug. The
    // effect cleanup always runs on isEditing -> false, so we commit here instead.
    return () => {
      if (cancelledRef.current) return; // Escape — discard, keep the original
      const text = pendingRef.current;
      if (text != null && text !== el.content) onCommitText(el.id, text);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

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

  let inner = null;
  if (el.type === "text") {
    const textStyle = {
      width: "100%",
      height: "100%",
      fontFamily: el.fontFamily,
      fontSize: el.fontSize,
      fontWeight: el.fontWeight,
      fontStyle: el.italic ? "italic" : "normal",
      color: el.color,
      textAlign: el.align,
      lineHeight: el.lineHeight,
      letterSpacing: (el.letterSpacing || 0) + "px",
      textDecorationLine: el.strike ? "line-through" : "none",
      textDecorationColor: el.strikeColor || el.color,
      textDecorationThickness: el.strike ? "0.11em" : undefined,
      whiteSpace: "pre-wrap",
      wordBreak: "break-word",
      outline: "none",
      overflow: "hidden",
    };
    if (isEditing) {
      inner = (
        <div
          ref={editRef}
          contentEditable
          suppressContentEditableWarning
          style={textStyle}
          onInput={(e) => { pendingRef.current = e.currentTarget.innerText; }}
          onBlur={() => onEndEdit()}
          onKeyDown={(e) => {
            // Enter commits; Shift+Enter inserts a line break; Escape cancels.
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              e.preventDefault();
              cancelledRef.current = true;
              e.currentTarget.blur();
            }
            e.stopPropagation();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {el.content}
        </div>
      );
    } else {
      inner = <div style={textStyle}><RichText el={el} /></div>;
    }
  } else if (el.type === "image") {
    inner = el.src ? (
      <img
        src={el.src}
        alt=""
        draggable={false}
        style={{ width: "100%", height: "100%", objectFit: el.fit || "cover", borderRadius: el.radius || 0, display: "block" }}
        onError={(e) => { e.currentTarget.style.opacity = "0"; }}
      />
    ) : (
      <div style={{ width: "100%", height: "100%", background: "#222", borderRadius: el.radius || 0 }} />
    );
  } else if (el.type === "rect") {
    inner = (
      <div style={{
        width: "100%", height: "100%",
        background: el.fill,
        borderRadius: el.radius || 0,
        border: el.stroke && el.stroke !== "none" ? (el.strokeWidth || 1) + "px solid " + el.stroke : "none",
      }} />
    );
  } else if (el.type === "line") {
    inner = <div style={{ width: "100%", height: "100%", background: el.fill }} />;
  } else if (el.type === "sticker") {
    inner = <Sticker el={el} />;
  }

  return (
    <div
      style={frame}
      onPointerDown={(e) => { if (!isEditing && !el.locked) onPointerDownBody(e, el.id); }}
      onDoubleClick={(e) => { if (el.type === "text") { e.stopPropagation(); onStartEdit(el.id); } }}
    >
      {inner}
    </div>
  );
}

export default React.memo(ElementView);

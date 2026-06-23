"use client";
import React, { useEffect, useRef } from "react";

// One element. Wrapped in React.memo so it re-renders only when its own object
// (or its editing flag) changes — the key to Canva-like drag performance.
function ElementView({ element: el, isEditing, onPointerDownBody, onStartEdit, onCommitText }) {
  const editRef = useRef(null);

  useEffect(() => {
    if (isEditing && editRef.current) {
      const node = editRef.current;
      node.focus();
      // place caret at the end
      const sel = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(node);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
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
          onBlur={(e) => onCommitText(el.id, e.currentTarget.innerText)}
          onKeyDown={(e) => {
            if (e.key === "Escape") { e.preventDefault(); e.currentTarget.blur(); }
            e.stopPropagation();
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {el.content}
        </div>
      );
    } else {
      inner = <div style={textStyle}>{el.content}</div>;
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
  }

  return (
    <div
      style={frame}
      onPointerDown={(e) => { if (!isEditing) onPointerDownBody(e, el.id); }}
      onDoubleClick={(e) => { if (el.type === "text") { e.stopPropagation(); onStartEdit(el.id); } }}
    >
      {inner}
    </div>
  );
}

export default React.memo(ElementView);

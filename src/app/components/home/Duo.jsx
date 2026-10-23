"use client";

import Slides from "./Slides";

export default function Duo({ labels, side, onSide, tools, children }) {
  return (
    <div className="duo">
      <div className="duo-bar">
        <div className="f-seg2 duo-tabs" role="group" aria-label="Görünen ekran">
          {labels.map((label, i) => (
            <button key={label} type="button" aria-pressed={side === i} onClick={() => onSide(i)}>
              {label}
            </button>
          ))}
        </div>
        {tools && <div className="duo-tools">{tools}</div>}
      </div>
      <Slides index={side} onIndex={onSide} link={<i key={side} className="duo-link" data-to={side} aria-hidden="true" />} className="duo-track">
        {children}
      </Slides>
    </div>
  );
}

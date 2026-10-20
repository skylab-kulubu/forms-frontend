"use client";

import { useRef } from "react";
import { useInView } from "./useInView";

export default function Deferred({ children, className = "", margin = "1200px 0px", placeholder = null }) {
  const ref = useRef(null);
  const near = useInView(ref, { margin, once: true });

  return (
    <div ref={ref} className={className}>
      {near ? children : placeholder}
    </div>
  );
}

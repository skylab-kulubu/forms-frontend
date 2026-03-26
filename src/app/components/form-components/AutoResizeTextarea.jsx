"use client";

import { useRef, useEffect } from "react";

export function AutoResizeTextarea({ className = "", onKeyDown, ...props }) {
    const ref = useRef(null);

    const resize = () => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    };

    useEffect(() => { resize(); }, [props.value]);

    const handleKeyDown = (e) => {
        if (e.key === "Enter") e.preventDefault();
        onKeyDown?.(e);
    };

    return (
        <textarea ref={ref} rows={1} onInput={resize} onKeyDown={handleKeyDown}
            {...props}
            className={`resize-none overflow-hidden ${className}`}
        />
    );
}

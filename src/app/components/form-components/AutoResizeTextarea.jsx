"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import { Link2 } from "lucide-react";
import { Floating } from "@/app/components/utils/Floating";
import { measureCaretOffset } from "@/app/components/utils/caretOffset";
import { findLinkableToken, applyLinkSuggestion } from "@/app/components/rich-text/linkSuggestion";

export function AutoResizeTextarea({ className = "", onKeyDown, onKeyUp, onChange, onBlur, onFocus, onClick, value, linkSuggestion = true, ...props }) {
    const ref = useRef(null);
    const [token, setToken] = useState(null);

    const caretOffsetRef = useRef(null);
    const dismissedStartRef = useRef(-1);
    const pendingSelectionRef = useRef(null);

    const enabled = linkSuggestion && typeof onChange === "function" && !props.readOnly && !props.disabled;

    const caretAnchor = useMemo(() => ({
        getBoundingClientRect: () => {
            const el = ref.current;
            const offset = caretOffsetRef.current;
            if (!el || !offset) return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
            const rect = el.getBoundingClientRect();
            const top = rect.top + offset.top - el.scrollTop;
            const left = rect.left + offset.left - el.scrollLeft;
            return { top, left, right: left, bottom: top + offset.height, width: 0, height: offset.height };
        },
    }), []);

    const resize = () => {
        const el = ref.current;
        if (!el) return;
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    };

    useEffect(() => {
        resize();

        const el = ref.current;
        const pending = pendingSelectionRef.current;
        if (el && pending && el.value === pending.value) {
            el.focus();
            el.setSelectionRange(pending.start, pending.end);
            pendingSelectionRef.current = null;
        }
    }, [value]);

    const refreshSuggestion = () => {
        const el = ref.current;
        if (!enabled || !el) return;

        const found = findLinkableToken(el.value, el.selectionStart);
        if (!found) {
            dismissedStartRef.current = -1;
            setToken(null);
            return;
        }

        if (found.start === dismissedStartRef.current) {
            setToken(null);
            return;
        }

        const offset = measureCaretOffset(el, found.end);
        if (!offset) {
            setToken(null);
            return;
        }

        dismissedStartRef.current = -1;
        caretOffsetRef.current = offset;
        setToken(found);
    };

    const applySuggestion = () => {
        const el = ref.current;
        if (!el || !token) return;

        const next = applyLinkSuggestion(el.value, token);
        pendingSelectionRef.current = { value: next.value, start: next.selectionStart, end: next.selectionEnd };
        setToken(null);
        onChange({ target: { value: next.value } });
    };

    const handleChange = (event) => {
        onChange?.(event);
        refreshSuggestion();
    };

    const handleKeyDown = (e) => {
        if (token) {
            if (e.key === "Enter") { e.preventDefault(); applySuggestion(); return; }
            if (e.key === "Escape") {
                e.preventDefault();
                dismissedStartRef.current = token.start;
                setToken(null);
                return;
            }
        }
        if (e.key === "Enter") e.preventDefault();
        onKeyDown?.(e);
    };

    const handleKeyUp = (e) => {
        if (e.key !== "Escape") refreshSuggestion();
        onKeyUp?.(e);
    };

    return (
        <>
            <textarea ref={ref} rows={1} value={value}
                onInput={resize} onChange={handleChange} onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}
                onClick={(e) => { refreshSuggestion(); onClick?.(e); }}
                onFocus={(e) => { refreshSuggestion(); onFocus?.(e); }}
                onBlur={(e) => { setToken(null); onBlur?.(e); }}
                {...props}
                className={`resize-none overflow-hidden ${className}`}
            />

            {token && (
                <Floating anchor={caretAnchor} offset={6}>
                    <div onMouseDown={(e) => e.preventDefault()}
                        className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-neutral-900 px-2 py-1 shadow-xl shadow-black/40"
                    >
                        <Link2 size={12} className="shrink-0 text-skylab-300" />
                        <button type="button" onClick={applySuggestion}
                            className="text-2xs font-medium text-neutral-200 transition-colors hover:text-skylab-300"
                        >
                            Bağlantıyı adlandır
                        </button>
                        <kbd className="rounded border border-white/10 bg-white/5 px-1 text-3xs text-neutral-500">Enter</kbd>
                    </div>
                </Floating>
            )}
        </>
    );
}

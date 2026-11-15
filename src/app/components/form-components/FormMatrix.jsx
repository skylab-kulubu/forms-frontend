"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ChoiceMatrix } from "@skylab-kulubu/skylcn-ui";
import { QuestionField, questionLabel } from "./QuestionParts";

// ChoiceMatrix lays out the respondent's matrix; the Studio lays out its editable copy with these, by the same rules
const TABLE_MIN_WIDTH = 448;
const CHIP_GAP = 4;
const CHIP_PADDING = 18;
const CHIP_MIN_WIDTH = 28;
const CHIP_MIN_TAP = 40;

let measureContext;

function textMeasurer(font) {
    if (!font) return () => 0;
    measureContext ??= document.createElement("canvas").getContext("2d");
    if (!measureContext) return () => 0;
    return (text) => {
        measureContext.font = font;
        return measureContext.measureText(text).width;
    };
}

function linesNeeded(text, width, measure) {
    let lines = 1;
    let line = "";
    for (const word of text.split(/\s+/).filter(Boolean)) {
        if (measure(word) > width) return Infinity;
        const next = line ? `${line} ${word}` : word;
        if (measure(next) <= width) {
            line = next;
        } else {
            lines += 1;
            line = word;
        }
    }
    return lines;
}

function rowLayout(columns, width, measure) {
    const labels = columns.map((column) => String(column ?? ""));
    const inline = labels.reduce((sum, label) => sum + Math.max(measure(label) + CHIP_PADDING, CHIP_MIN_WIDTH), 0) + (labels.length - 1) * CHIP_GAP;
    if (inline <= width) return { mode: "inline" };

    const fits = (perRow) => {
        const cell = (width - (perRow - 1) * CHIP_GAP) / perRow;
        return cell >= CHIP_MIN_TAP && labels.every((label) => linesNeeded(label, cell - CHIP_PADDING, measure) <= 2);
    };
    if (fits(labels.length)) return { mode: "grid", perRow: labels.length };
    const half = Math.ceil(labels.length / 2);
    if (labels.length >= 6 && fits(half)) return { mode: "grid", perRow: half };
    return { mode: "list" };
}

export function useMatrixLayout(rows, columns, { hold = false } = {}) {
    const rootRef = useRef(null);
    const scrollerRef = useRef(null);
    const [width, setWidth] = useState(0);
    const [font, setFont] = useState("");
    const [fontLoads, setFontLoads] = useState(0);
    const [overflow, setOverflow] = useState(null);
    const content = JSON.stringify([rows, columns, fontLoads]);
    const known = overflow && (hold || overflow.content === content) ? overflow.need : 0;
    const table = width >= TABLE_MIN_WIDTH && width >= known;

    useLayoutEffect(() => {
        const element = rootRef.current;
        if (!element) return undefined;
        const update = () => setWidth(element.clientWidth);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const fonts = document.fonts;
        if (!fonts) return undefined;
        let active = true;
        const refresh = () => {
            if (active) setFontLoads((count) => count + 1);
        };
        fonts.ready.then(refresh);
        fonts.addEventListener("loadingdone", refresh);
        return () => {
            active = false;
            fonts.removeEventListener("loadingdone", refresh);
        };
    }, []);

    useLayoutEffect(() => {
        const element = rootRef.current;
        if (!element) return;
        const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
        setFont(`500 ${rem * 0.75}px ${getComputedStyle(element).fontFamily}`);
    }, [fontLoads]);

    useLayoutEffect(() => {
        const root = rootRef.current;
        const scroller = scrollerRef.current;
        if (hold || !table || !root || !scroller || scroller.scrollWidth <= scroller.clientWidth + 1) return;
        const need = scroller.scrollWidth + root.clientWidth - scroller.clientWidth + 1;
        setOverflow((current) => (current?.content === content && current.need === need ? current : { content, need }));
    }, [hold, table, content, width]);

    const measure = useMemo(() => textMeasurer(font), [font]);
    const layout = table ? { mode: "table" } : rowLayout(columns, width, measure);
    return { rootRef, scrollerRef, layout };
}

export function matrixGroupProps(layout) {
    if (layout.mode === "inline") return { className: "flex gap-1" };
    if (layout.mode === "grid") return { className: "grid gap-1", style: { gridTemplateColumns: `repeat(${layout.perRow}, minmax(0, 1fr))` } };
    return { className: "flex flex-col gap-1.5" };
}

export function matrixChoiceClass(layout) {
    if (layout.mode === "list") return "flex items-center gap-3 rounded-md border border-border bg-input-background px-3 py-2";
    // ChoiceMatrix's chips, drawn static
    const chip = "flex items-center justify-center rounded-md border border-border bg-input-background px-2 text-xs font-medium text-secondary-foreground";
    return layout.mode === "inline" ? `${chip} h-10 min-w-8 flex-auto` : `${chip} min-h-10 py-1.5 text-center`;
}

export function matrixLabelClass(layout) {
    if (layout.mode === "inline") return "whitespace-nowrap";
    if (layout.mode === "grid") return "leading-tight text-balance";
    return "text-sm text-foreground";
}

const ALL_ROWS = "Tüm satırların doldurulması zorunludur";

// Answers are keyed by the row's label and hold the column's label, the shape forms stores
const byLabel = (labels) => labels.map((label) => ({ value: label, label }));

export function DisplayFormMatrix({ question, questionNumber, description, required = false, rows = [], columns = [], value, onChange, missing = false }) {
    const [internalValue, setInternalValue] = useState(value || {});
    const currentValue = value !== undefined ? (value || {}) : internalValue;

    const commit = (next) => {
        if (onChange) {
            onChange({ target: { value: next } });
        } else { setInternalValue(next); }
    };

    return (
        <QuestionField question={question} questionNumber={questionNumber} description={description} required={required} missing={missing}
            requiredText={ALL_ROWS} missingText={ALL_ROWS}
        >
            <ChoiceMatrix variant="control" rows={byLabel(rows)} columns={byLabel(columns)} value={currentValue} onValueChange={commit}
                required={required} invalid={missing} aria-label={questionLabel(question)}
            />
        </QuestionField>
    );
}

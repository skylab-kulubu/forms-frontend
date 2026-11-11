"use client";

import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { X } from "lucide-react";
import { RichText } from "@/app/components/rich-text/RichText";
import { QuestionNumber, QuestionHint } from "./QuestionParts";

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

export function matrixChoiceClass(layout, missing = false) {
    const border = missing ? "border-red-400/60" : "border-white/10";
    if (layout.mode === "list") {
        return `flex items-center gap-3 rounded-md border ${border} bg-neutral-900/60 p-2 transition hover:bg-white/10 has-checked:border-skylab-400/10 has-checked:bg-skylab-400/20`;
    }
    const chip = `flex items-center justify-center rounded-md border ${border} bg-neutral-900/60 px-2 text-xs font-medium text-neutral-300 transition hover:bg-white/10 has-checked:border-skylab-600/50 has-checked:bg-skylab-800/50 has-checked:text-white has-focus-visible:ring-2 has-focus-visible:ring-skylab-400/40`;
    return layout.mode === "inline" ? `${chip} h-10 min-w-8 flex-auto` : `${chip} min-h-10 py-1.5 text-center`;
}

export function matrixLabelClass(layout) {
    if (layout.mode === "inline") return "whitespace-nowrap";
    if (layout.mode === "grid") return "leading-tight text-balance";
    return "text-sm text-neutral-200";
}

function MatrixRows({ name, rows, columns, value, missing, layout, onPick }) {
    const group = matrixGroupProps(layout);

    return (
        <div className="flex flex-col gap-5">
            {rows.map((row, rIdx) => {
                const isRowMissing = missing && value[row] === undefined;
                const labelId = `${name}-row-${rIdx}`;

                return (
                    <div key={`row-${rIdx}`} role="radiogroup" aria-labelledby={labelId}>
                        <p id={labelId} className={`mb-2 text-sm font-medium ${isRowMissing ? "text-red-200/90" : "text-neutral-200"}`}>{row}</p>
                        <div {...group}>
                            {columns.map((col, cIdx) => (
                                <label key={`col-${cIdx}`} className={`cursor-pointer select-none ${matrixChoiceClass(layout, isRowMissing)}`}>
                                    <input type="radio" name={`${name}-${rIdx}`} checked={value[row] === col} onChange={() => {}} onClick={() => onPick(rIdx, cIdx)}
                                        onKeyDown={(event) => {
                                            if (event.key !== " " || value[row] !== col) return;
                                            event.preventDefault();
                                            onPick(rIdx, cIdx);
                                        }}
                                        className={layout.mode === "list" ? "checkbox shrink-0" : "sr-only"}
                                    />
                                    <span className={matrixLabelClass(layout)}>{col}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function DisplayFormMatrix({ question, questionNumber, description, required = false, rows = [], columns = [], value, onChange, missing = false }) {
    const [internalValue, setInternalValue] = useState(value || {});
    const currentValue = value !== undefined ? (value || {}) : internalValue;
    const optionBorderClass = missing ? "border-red-400/60" : "border-white/10";
    const { rootRef, scrollerRef, layout } = useMatrixLayout(rows, columns);
    const name = useId();

    const toggle = (rowIdx, colIdx) => {
        const rowLabel = rows[rowIdx];
        const colLabel = columns[colIdx];
        const next = { ...currentValue };

        if (next[rowLabel] === colLabel) {
            delete next[rowLabel];
        } else { next[rowLabel] = colLabel; }

        if (onChange) {
            onChange({ target: { value: next } });
        } else { setInternalValue(next); }
    };

    const clearRow = (rowIdx) => {
        const rowLabel = rows[rowIdx];
        const next = { ...currentValue };
        delete next[rowLabel];
        if (onChange) {
            onChange({ target: { value: next } });
        } else { setInternalValue(next); }
    };

    return (
        <div className="mx-auto w-full max-w-2xl rounded-xl">
            <div className="flex flex-col p-2 md:p-4">

                <div className="flex gap-3">
                    <QuestionNumber number={questionNumber} missing={missing} />
                    <div className="flex flex-col w-full overflow-hidden">
                        <p className="text-sm font-medium text-neutral-100">
                            {question ? <RichText text={question} /> : <span className="font-normal italic text-neutral-500">Bu soru için metin yok</span>} {required && <span className="ml-1 text-red-200/70">*</span>}
                        </p>
                        {description && (<RichText as="p" text={description} className="my-1 text-xs text-neutral-400" />)}
                    </div>
                </div>

                <div ref={rootRef} className="mt-4 w-full">
                    {layout.mode === "table" ? (
                        <div ref={scrollerRef} className={`overflow-x-auto rounded-lg border ${optionBorderClass} bg-neutral-900/60`}>
                            <table className="w-full text-left min-w-[500px]">
                                <thead className="border-b border-white/10 bg-white/5">
                                    <tr>
                                        <th className="p-3 font-medium w-1/3"></th>
                                        {columns.map((col, cIdx) => (
                                            <th key={`head-${cIdx}`} className="p-3 text-center text-2xs font-semibold uppercase tracking-wider text-neutral-400">
                                                {col}
                                            </th>
                                        ))}
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {rows.map((row, rIdx) => {
                                        const rowLabel = rows[rIdx];
                                        const isRowMissing = missing && currentValue[rowLabel] === undefined;
                                        const hasSelection = currentValue[rowLabel] !== undefined;

                                        return (
                                            <tr key={`row-${rIdx}`} className={`group transition-colors hover:bg-white/3 ${isRowMissing ? 'bg-red-500/5' : ''}`}>
                                                <td className="p-3 text-sm font-medium text-neutral-200">
                                                    {row}
                                                </td>
                                                {columns.map((_, cIdx) => {
                                                    const colLabel = columns[cIdx];
                                                    const id = `matrix_${questionNumber}_${rIdx}_${cIdx}`;
                                                    const isChecked = currentValue[rowLabel] === colLabel;
                                                    return (
                                                        <td key={id} className="p-2 text-center align-middle">
                                                            <label htmlFor={id} className="flex justify-center items-center w-full h-full cursor-pointer opacity-80 transition-opacity hover:opacity-100">
                                                                <input type="radio" id={id} name={`matrix_${questionNumber}_row_${rIdx}`} checked={isChecked} onChange={() => toggle(rIdx, cIdx)}
                                                                    className="w-[18px] h-[18px] cursor-pointer appearance-none rounded-full border border-white/20 bg-neutral-900/80 transition-all checked:border-[5px] checked:border-pink-300/80 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-skylab-400/20 focus:ring-offset-1 focus:ring-offset-neutral-900"
                                                                />
                                                            </label>
                                                        </td>
                                                    );
                                                })}

                                                <td className="p-2 text-center align-middle w-10 pr-4">
                                                    <button type="button" onClick={() => clearRow(rIdx)} disabled={!hasSelection} title="Seçimi Temizle"
                                                        className={`flex items-center justify-center p-1.5 rounded-md transition-all ${hasSelection ? "text-neutral-500 hover:text-red-400 hover:bg-red-400/10 cursor-pointer" : "text-transparent pointer-events-none"}`}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <MatrixRows name={name} rows={rows} columns={columns} value={currentValue} missing={missing} layout={layout} onPick={toggle} />
                    )}
                </div>

                <QuestionHint required={required} missing={missing} text="Tüm satırların doldurulması zorunludur" missingText="Tüm satırların doldurulması zorunludur" className="mt-2" />
            </div>
        </div>
    );
}

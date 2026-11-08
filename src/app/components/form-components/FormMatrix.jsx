"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { RichText } from "@/app/components/rich-text/RichText";
import { QuestionNumber, QuestionHint } from "./QuestionParts";

export function DisplayFormMatrix({ question, questionNumber, description, required = false, rows = [], columns = [], value, onChange, missing = false }) {
    const [internalValue, setInternalValue] = useState(value || {});
    const currentValue = value !== undefined ? (value || {}) : internalValue;
    const optionBorderClass = missing ? "border-red-400/60" : "border-white/10";

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

                <div className="mt-4 w-full">
                    <div className={`overflow-x-auto rounded-lg border ${optionBorderClass} bg-neutral-900/60`}>
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
                </div>

                <QuestionHint required={required} missing={missing} text="Tüm satırların doldurulması zorunludur" missingText="Tüm satırların doldurulması zorunludur" className="mt-2" />
            </div>
        </div>
    );
}
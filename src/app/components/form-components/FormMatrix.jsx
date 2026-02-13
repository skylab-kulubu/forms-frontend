"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { FieldShell } from "./FieldShell";
import { useProp } from "@/app/admin/components/form-editor/hooks/useProp";

export function CreateFormMatrix({ questionNumber, props, onPropsChange, readOnly, ...rest }) {
    const { prop, bind, toggle, patch } = useProp(props, onPropsChange, readOnly);

    const manageList = (key, action, index, value) => {
        const list = prop[key] ?? [];
        let next = [...list];
        if (action === "add") next.push(`${key === 'rows' ? 'Satır' : 'Sütun'} ${list.length + 1}`);
        if (action === "update") next[index] = value;
        if (action === "remove") next = list.length > 1 ? list.filter((_, i) => i !== index) : list;
        patch({ [key]: next });
    };

    const rows = prop.rows ?? ["Satır 1", "Satır 2"];
    const cols = prop.columns ?? ["Sütun 1", "Sütun 2"];

    return (
        <FieldShell number={questionNumber} title="Matris / Tablo" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)} {...rest}>
            <div className="flex flex-col gap-1.5">
                <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">Soru Metni</label>
                <input type="text" {...bind("question")} className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30" placeholder="Sorunuzu buraya yazın." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                <div className="flex flex-col gap-2">
                    <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400 border-b border-white/5 pb-1">Satırlar (Sorular)</label>
                    {rows.map((row, idx) => (
                        <div key={`row-${idx}`} className="flex items-center gap-2">
                            <input type="text" className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-white/30" value={row} onChange={(e) => manageList('rows', 'update', idx, e.target.value)} />
                            <button type="button" className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-neutral-400 hover:text-neutral-100 disabled:opacity-50" disabled={rows.length <= 1} onClick={() => manageList('rows', 'remove', idx)}><X size={14} /></button>
                        </div>
                    ))}
                    <button type="button" onClick={() => manageList('rows', 'add')} className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-neutral-300 hover:bg-white/10 mt-1"><Plus size={12} /> Satır Ekle</button>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400 border-b border-white/5 pb-1">Sütunlar (Seçenekler)</label>
                    {cols.map((col, idx) => (
                        <div key={`col-${idx}`} className="flex items-center gap-2">
                            <input type="text" className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-1.5 text-sm text-neutral-100 outline-none focus:border-white/30" value={col} onChange={(e) => manageList('columns', 'update', idx, e.target.value)} />
                            <button type="button" className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-neutral-400 hover:text-neutral-100 disabled:opacity-50" disabled={cols.length <= 1} onClick={() => manageList('columns', 'remove', idx)}><X size={14} /></button>
                        </div>
                    ))}
                    <button type="button" onClick={() => manageList('columns', 'add')} className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-[11px] text-neutral-300 hover:bg-white/10 mt-1"><Plus size={12} /> Sütun Ekle</button>
                </div>
            </div>
        </FieldShell>
    );
}

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
                    {questionNumber != null && (
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-xs font-semibold text-neutral-300">
                            {questionNumber}
                        </div>
                    )}
                    <div className="flex flex-col w-full overflow-hidden">
                        <p className="text-sm font-medium text-neutral-100">
                            {question} {required && <span className="ml-1 text-red-200/70">*</span>}
                        </p>
                        {description && (<p className="my-1 text-xs text-neutral-400">{description}</p>)}
                    </div>
                </div>

                <div className="mt-4 w-full">
                    <div className={`overflow-x-auto rounded-lg border ${optionBorderClass} bg-neutral-900/60`}>
                        <table className="w-full text-left min-w-[500px]">
                            <thead className="border-b border-white/10 bg-white/5">
                                <tr>
                                    <th className="p-3 font-medium w-1/3"></th>
                                    {columns.map((col, cIdx) => (
                                        <th key={`head-${cIdx}`} className="p-3 text-center text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
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
                                            <td className="p-3 text-[13px] font-medium text-neutral-200">
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
                                                                className="w-[18px] h-[18px] cursor-pointer appearance-none rounded-full border border-white/20 bg-neutral-900/80 transition-all checked:border-[5px] checked:border-pink-300/80 hover:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/10 focus:ring-offset-1 focus:ring-offset-neutral-900"
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

                {(required || missing) && <span className={`px-0.5 text-[11px] mt-2 ${missing ? 'text-red-400' : 'text-neutral-500'}`}>Tüm satırların doldurulması zorunludur</span>}
            </div>
        </div>
    );
}
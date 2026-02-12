import { Trash2, AlertCircle } from "lucide-react";
import { Dropdown } from "@/app/components/utils/Dropdown";

export function ConditionSelector({ condition, onUpdate, availableFields }) {
    if (!availableFields || availableFields.length === 0) {
        return (
            <div className="flex items-center gap-2 rounded-lg p-3 text-xs text-neutral-400/70">
                <AlertCircle size={14} />
                <span>Bu formun ilk sorusu olduğu için herhangi bir koşula bağlanamaz.</span>
            </div>
        );
    }

    const current = condition || { fieldId: "", operator: "", value: "" };

    const selectedTarget = availableFields.find((f) => f.id === current.fieldId);

    const isDate = selectedTarget?.type === "date";
    const isTime = selectedTarget?.type === "time";
    const hasChoices = ["multi_choice", "combobox"].includes(selectedTarget?.type);

    const getOperators = () => {
        if (!selectedTarget) return [];

        if (isDate || isTime) {
            return [
                { label: "Eşitse", value: "equals" },
                { label: "Eşit Değilse", value: "not_equals" },
                { label: "Önce", value: "before" },
                { label: "Sonra", value: "after" },
                { label: "Cevaplanmışsa", value: "is_set" },
            ];
        }

        if (hasChoices) {
            return [
                { label: "Şunu seçerse", value: "equals" },
                { label: "Şunu seçmezse", value: "not_equals" },
                { label: "Cevaplanmamışsa", value: "is_set" },
            ];
        }

        return [
            { label: "Eşittir", value: "equals" },
            { label: "Eşit Değildir", value: "not_equals" },
            { label: "Cevaplanmışsa", value: "is_set" },
        ];
    };

    const operators = getOperators();

    const showValueInput = current.operator && !["is_set", ""].includes(current.operator);

    const handleChange = (key, val) => {
        if (key === "fieldId") {
            onUpdate({ fieldId: val, operator: "", value: "" });
        } else if (key === "operator") {
            onUpdate({ ...current, operator: val });
        } else {
            onUpdate({ ...current, value: val });
        }
    };

    return (
        <div className="rounded-b-xl border-t border-white/5 bg-neutral-900/40 p-3 animate-in fade-in slide-in-from-top-1">
            <div className="grid grid-cols-12 gap-3 items-end">

                <div className="col-span-12 sm:col-span-4 flex flex-col gap-1.5">
                    <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Buna Bağlı:</label>
                    <Dropdown
                        value={current.fieldId}
                        onChange={(val) => handleChange("fieldId", val)}
                        options={availableFields.map(q => ({
                            value: q.id,
                            label: `${availableFields.indexOf(q) + 1}. ${q.title ? (q.title.length > 25 ? q.title.substring(0, 25) + "..." : q.title) : "İsimsiz Soru"}`
                        }))}
                        placeholder="Soru seçiniz..."
                    />
                </div>

                <div className="col-span-12 sm:col-span-3 flex flex-col gap-1.5">
                    <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Koşul:</label>
                    <Dropdown value={current.operator} onChange={(val) => handleChange("operator", val)}
                        options={operators} placeholder="Seçiniz..." className={!current.fieldId ? "opacity-50 pointer-events-none" : ""}
                    />
                </div>

                <div className="col-span-12 sm:col-span-5 flex flex-col gap-1.5">
                    {showValueInput && (
                        <>
                            <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-neutral-500">Değer:</label>

                            {hasChoices && selectedTarget?.choices?.length > 0 ? (
                                <Dropdown value={current.value} onChange={(val) => handleChange("value", val)} placeholder="Seçenek seçin"
                                    options={selectedTarget.choices.map(c => ({ label: c, value: c }))}
                                />
                            ) : isDate ? (
                                <input type="date" value={current.value} onChange={(e) => handleChange("value", e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-neutral-800/50 px-3 py-2.5 text-xs text-neutral-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                                />
                            ) : isTime ? (
                                <input type="time" value={current.value} onChange={(e) => handleChange("value", e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-neutral-800/50 px-3 py-2.5 text-xs text-neutral-200 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                                />
                            ) : (
                                <input type="text" placeholder="Cevap..." value={current.value} onChange={(e) => handleChange("value", e.target.value)}
                                    className="w-full rounded-lg border border-white/10 bg-neutral-800/50 px-3 py-2.5 text-xs text-neutral-200 placeholder-neutral-600 outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
                                />
                            )}
                        </>
                    )}
                </div>
            </div>

            {current.fieldId && current.operator && (
                <div className="mt-2 flex justify-between items-center gap-1.5 px-1 text-[10px] text-indigo-300/60">
                    <span>
                        Eğer <b>{selectedTarget?.title?.substring(0, 15) || "Soru"}</b> cevabı
                        <b> {operators.find(o => o.value === current.operator)?.label.toLowerCase()} </b>
                        {showValueInput && <b>{current.value}</b>} ise gösterilecek.
                    </span>

                    <div className="flex justify-end">
                        <button onClick={() => onUpdate(null)} title="Kuralı Kaldır"
                            className="group flex size-8 items-center justify-center rounded-lg border border-transparent text-neutral-500 transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-400"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
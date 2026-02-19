import { useState, useRef, useEffect, useMemo } from "react";
import { Trash2, AlertCircle, Calendar, Clock } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Dropdown } from "@/app/components/utils/Dropdown";
import DatePicker from "@/app/components/utils/DatePicker";
import TimePicker from "@/app/components/utils/TimePicker";

function pad2(n) { return String(n).padStart(2, "0"); }
function toYMD(d) {
    if (!(d instanceof Date) || isNaN(d)) return "";
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function parseYMD(s) {
    if (!s || typeof s !== "string") return null;
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return null;
    const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
    const dt = new Date(y, mo - 1, d);
    if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
    return dt;
}
function parseTime(str) {
    if (!str || typeof str !== "string") return null;
    const m = str.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return null;
    const h = Number(m[1]), min = Number(m[2]);
    if (h < 0 || h > 23 || min < 0 || min > 59) return null;
    return { h, m: min };
}
function formatTime24({ h, m }) { return `${pad2(h)}:${pad2(m)}`; }

const months = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export const FIELD_OPERATORS = {
    text: [
        { label: "Eşittir", value: "equals" },
        { label: "Eşit Değildir", value: "not_equals" },
        { label: "İçeriyorsa", value: "contains" },
        { label: "Cevaplanmışsa", value: "is_set" }
    ],
    long_text: [
        { label: "İçeriyorsa", value: "contains" },
        { label: "Cevaplanmışsa", value: "is_set" }
    ],
    link: [
        { label: "İçeriyorsa", value: "contains" }
    ],
    phone: [
        { label: "Cevaplanmışsa", value: "is_set" }
    ],
    email: [
        { label: "İçeriyorsa", value: "contains" },
        { label: "Cevaplanmışsa", value: "is_set" }
    ],
    number: [
        { label: "Eşittir", value: "equals" },
        { label: "Büyüktür", value: "greater_than" },
        { label: "Küçüktür", value: "less_than" },
        { label: "Cevaplanmışsa", value: "is_set" }
    ],
    link: [
        { label: "İçeriyorsa", value: "contains" },
        { label: "Cevaplanmışsa", value: "is_set" }
    ],
    date: [
        { label: "Şu tarihte", value: "equals" },
        { label: "Önce", value: "before" },
        { label: "Sonra", value: "after" },
        { label: "Cevaplanmışsa", value: "is_set" }
    ],
    time: [
        { label: "Şu zamanda", value: "equals" },
        { label: "Önce", value: "before" },
        { label: "Sonra", value: "after" },
        { label: "Cevaplanmışsa", value: "is_set" }
    ],
    choice: [
        { label: "Şunu seçerse", value: "equals" },
        { label: "Şunu seçmezse", value: "not_equals" },
        { label: "Cevaplanmışsa", value: "is_set" }
    ],
    boolean: [
        { label: "Açıksa (Evet)", value: "is_true" },
        { label: "Kapalıysa (Hayır)", value: "is_false" }
    ],
    file: [
        { label: "Dosya yüklendiyse", value: "is_set" },
        { label: "Dosya yüklenmediyse", value: "is_empty" }
    ],
    matrix: [
        { label: "En az 1 satır cevaplandıysa", value: "is_set" },
        { label: "Hiçbir satır cevaplanmadıysa", value: "is_empty" }
    ]
};

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

        switch (selectedTarget.type) {
            case "file": return FIELD_OPERATORS.file;
            case "matrix": return FIELD_OPERATORS.matrix;
            case "link": return FIELD_OPERATORS.link
            case "long_text": return FIELD_OPERATORS.long_text;
            case "toggle": return FIELD_OPERATORS.boolean;
            case "multi_choice":
            case "combobox": return FIELD_OPERATORS.choice;
            case "date": return FIELD_OPERATORS.date;
            case "time": return FIELD_OPERATORS.time;
            case "short_text":
                if (selectedTarget.inputType === "number") return FIELD_OPERATORS.number;
                if (selectedTarget.inputType === "phone") return FIELD_OPERATORS.phone;
                if (selectedTarget.inputType === "email") return FIELD_OPERATORS.email;
                return FIELD_OPERATORS.text;
            case "slider": return FIELD_OPERATORS.number;
            default: return FIELD_OPERATORS.text;
        }
    };

    const operators = getOperators();

    const showValueInput = current.operator && !["is_set", "is_empty", "is_true", "is_false"].includes(current.operator);

    const [dateOpen, setDateOpen] = useState(false);
    const [timeOpen, setTimeOpen] = useState(false);
    const dateRef = useRef(null);
    const timeRef = useRef(null);

    const now = useMemo(() => new Date(), []);
    const [tempHour, setTempHour] = useState(now.getHours());
    const [tempMinute, setTempMinute] = useState(Math.round(now.getMinutes() / 5) * 5);

    useEffect(() => {
        if (timeOpen) {
            const p = parseTime(current.value);
            setTempHour(p?.h ?? now.getHours());
            setTempMinute(p?.m ?? Math.round(now.getMinutes() / 5) * 5);
        }
    }, [timeOpen]);

    useEffect(() => {
        const onDoc = (e) => {
            if (dateOpen && dateRef.current && !dateRef.current.contains(e.target)) setDateOpen(false);
            if (timeOpen && timeRef.current && !timeRef.current.contains(e.target)) setTimeOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, [dateOpen, timeOpen]);

    const selectedDate = useMemo(() => parseYMD(current.value), [current.value]);
    const parsedTime = useMemo(() => parseTime(current.value), [current.value]);
    const dateDisplay = selectedDate ? `${pad2(selectedDate.getDate())} ${months[selectedDate.getMonth()]} ${selectedDate.getFullYear()}` : "Tarih seçin";
    const timeDisplay = parsedTime ? formatTime24(parsedTime) : "Saat seçin";

    const handleChange = (key, val) => {
        if (key === "fieldId") {
            const newTarget = availableFields.find((f) => f.id === val);
            let defaultOp = "";
            if (newTarget?.type === "link" || newTarget?.type === "long_text") {
                defaultOp = "contains";
            } else if (newTarget?.type === "short_text") {
                if (newTarget.props?.inputType === "phone") defaultOp = "is_set";
                else if (newTarget.props?.inputType === "email") defaultOp = "contains";
            }

            onUpdate({ fieldId: val, operator: defaultOp, value: "" });
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
                    <Dropdown value={current.fieldId} onChange={(val) => handleChange("fieldId", val)}
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
                                <div className="relative" ref={dateRef}>
                                    <button type="button" onClick={() => setDateOpen((s) => !s)}
                                        className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-neutral-800/50 px-3 py-2.5 text-xs text-left outline-none transition hover:bg-white/5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                                    >
                                        <Calendar size={13} className="text-neutral-400 shrink-0" />
                                        <span className={selectedDate ? "text-neutral-200" : "text-neutral-500"}>{dateDisplay}</span>
                                    </button>
                                    <AnimatePresence>
                                        {dateOpen && (
                                            <DatePicker value={selectedDate}
                                                onChange={(date) => handleChange("value", toYMD(date))}
                                                onClose={() => setDateOpen(false)}
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : isTime ? (
                                <div className="relative" ref={timeRef}>
                                    <button type="button" onClick={() => setTimeOpen((s) => !s)}
                                        className="flex w-full items-center gap-2 rounded-lg border border-white/10 bg-neutral-800/50 px-3 py-2.5 text-xs text-left outline-none transition hover:bg-white/5 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                                    >
                                        <Clock size={13} className="text-neutral-400 shrink-0" />
                                        <span className={parsedTime ? "text-neutral-200" : "text-neutral-500"}>{timeDisplay}</span>
                                    </button>
                                    <AnimatePresence>
                                        {timeOpen && (
                                            <TimePicker hour={tempHour} minute={tempMinute}
                                                onChange={(h, m) => { setTempHour(h); setTempMinute(m); }}
                                                onCancel={() => setTimeOpen(false)}
                                                onConfirm={() => { handleChange("value", formatTime24({ h: tempHour, m: tempMinute })); setTimeOpen(false); }}
                                                onClear={() => { handleChange("value", ""); setTimeOpen(false); }}
                                            />
                                        )}
                                    </AnimatePresence>
                                </div>
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
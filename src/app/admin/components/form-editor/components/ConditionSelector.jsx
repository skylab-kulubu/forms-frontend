import { Trash2, AlertCircle } from "lucide-react";
import { DatePicker, IconButton, Input, TimePicker } from "@skylab-kulubu/skylcn-ui";
import { Dropdown } from "@/app/components/utils/Dropdown";

const LABEL = "ml-1 text-3xs font-semibold uppercase tracking-[0.18em] text-subtle-foreground";

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
            <div className="flex items-center gap-2 rounded-lg p-3 text-xs text-muted-foreground">
                <AlertCircle size={14} />
                <span>Bu formun ilk sorusu olduğu için herhangi bir koşula bağlanamaz.</span>
            </div>
        );
    }

    return <ConditionEditor condition={condition} onUpdate={onUpdate} availableFields={availableFields} />;
}

function ConditionEditor({ condition, onUpdate, availableFields }) {
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

    const parsedTime = parseTime(current.value);

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
        <div className="rounded-b-xl border-t border-border-subtle bg-background/40 p-3">
            <div className="grid grid-cols-12 gap-3 items-end">

                <div className="col-span-12 sm:col-span-4 flex flex-col gap-1.5">
                    <label className={LABEL}>Buna Bağlı:</label>
                    <Dropdown value={current.fieldId} onChange={(val) => handleChange("fieldId", val)}
                        options={availableFields.map(q => ({
                            value: q.id,
                            label: `${availableFields.indexOf(q) + 1}. ${q.title ? (q.title.length > 25 ? q.title.substring(0, 25) + "..." : q.title) : "İsimsiz Soru"}`
                        }))}
                        placeholder="Soru seçiniz..."
                    />
                </div>

                <div className="col-span-12 sm:col-span-3 flex flex-col gap-1.5">
                    <label className={LABEL}>Koşul:</label>
                    <Dropdown value={current.operator} onChange={(val) => handleChange("operator", val)}
                        options={operators} placeholder="Seçiniz..." className={!current.fieldId ? "opacity-50 pointer-events-none" : ""}
                    />
                </div>

                <div className="col-span-12 sm:col-span-5 flex flex-col gap-1.5">
                    {showValueInput && (
                        <>
                            <label className={LABEL}>Değer:</label>

                            {hasChoices && selectedTarget?.choices?.length > 0 ? (
                                <Dropdown value={current.value} onChange={(val) => handleChange("value", val)} placeholder="Seçenek seçin"
                                    options={selectedTarget.choices.map(c => ({ label: c, value: c }))}
                                />
                            ) : isDate ? (
                                <DatePicker value={parseYMD(current.value)} onValueChange={(date) => handleChange("value", date ? toYMD(date) : "")}
                                    placeholder="Tarih seçin" aria-label="Değer"
                                />
                            ) : isTime ? (
                                <TimePicker value={parsedTime ? formatTime24(parsedTime) : null} onValueChange={(time) => handleChange("value", time ?? "")}
                                    placeholder="Saat seçin" aria-label="Değer"
                                />
                            ) : (
                                <Input placeholder="Cevap..." value={current.value} onChange={(e) => handleChange("value", e.target.value)} aria-label="Değer" />
                            )}
                        </>
                    )}
                </div>
            </div>

            {current.fieldId && current.operator && (
                <div className="mt-2 flex justify-between items-center gap-1.5 px-1 text-3xs text-skylab-300/60">
                    <span>
                        Eğer <b>{selectedTarget?.title?.substring(0, 15) || "Soru"}</b> cevabı
                        <b> {operators.find(o => o.value === current.operator)?.label.toLowerCase()} </b>
                        {showValueInput && <b>{current.value}</b>} ise gösterilecek.
                    </span>

                    <div className="flex justify-end">
                        <IconButton icon={Trash2} label="Kuralı Kaldır" variant="ghost" onClick={() => onUpdate(null)} />
                    </div>
                </div>
            )}
        </div>
    );
}
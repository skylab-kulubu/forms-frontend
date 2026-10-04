"use client";

import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import DatePicker from "@/app/components/utils/DatePicker";
import TimePicker from "@/app/components/utils/TimePicker";
import { PANEL_SECTION, SectionHeader, Switch } from "@/app/admin/components/utils/SidePanel";
import { defaultClosesAt, isPastDate } from "@/lib/form-timing";

const DEFAULT_HOURS = 48;
const MAX_HOURS = 720;

const INLINE_TRIGGER = "border-b border-dotted border-white/25 px-0.5 py-0.5 tabular-nums text-neutral-100 transition-colors hover:border-white/50 focus-visible:border-skylab-400/60 focus-visible:outline-none";
const INLINE_INPUT = "min-w-0 border-b border-dotted border-white/25 bg-transparent px-0.5 py-0.5 text-2xs text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-skylab-400/60";

const pad = (value) => String(value).padStart(2, "0");

export function TimingRow({ title, description, checked, onChange, disabled = false, dimmed = false, children }) {
    return (
        <div className={`rounded-lg border border-white/10 px-3 py-2.5 transition-opacity duration-300 ${dimmed ? "opacity-40" : ""}`}>
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-100">{title}</p>
                    <p className="text-2xs text-neutral-500">{description}</p>
                </div>
                <Switch checked={checked} onChange={onChange} disabled={disabled} label={title} className={dimmed ? "" : "disabled:opacity-50"} />
            </div>
            {checked && children ? (
                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-2xs text-neutral-400">{children}</div>
            ) : null}
        </div>
    );
}

function HoursInput({ minutes, onChange }) {
    const hours = Math.max(1, Math.round((minutes ?? DEFAULT_HOURS * 60) / 60));
    const [draft, setDraft] = useState(String(hours));
    const [prevHours, setPrevHours] = useState(hours);

    if (prevHours !== hours) {
        setPrevHours(hours);
        setDraft(String(hours));
    }

    const commit = (text) => {
        const value = Math.round(Number(text));
        if (!Number.isFinite(value) || value < 1 || value > MAX_HOURS) return;
        onChange(value * 60);
    };

    return (
        <>
            <span>Süre</span>
            <input type="number" min={1} max={MAX_HOURS} value={draft} aria-label="Süre, saat"
                onChange={(event) => { setDraft(event.target.value); commit(event.target.value); }}
                onBlur={() => setDraft(String(hours))}
                className={`${INLINE_INPUT} w-10 text-center tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
            />
            <span>saat</span>
        </>
    );
}

export function InlineDateTime({ value, onChange, label }) {
    const date = value ? new Date(value) : null;
    const [dateOpen, setDateOpen] = useState(false);
    const [timeOpen, setTimeOpen] = useState(false);
    const [temp, setTemp] = useState({ hour: 23, minute: 59 });
    const dateRef = useRef(null);
    const timeRef = useRef(null);

    if (!date || Number.isNaN(date.getTime())) return null;

    const isPast = isPastDate(date);

    const changeDay = (day) => {
        if (!day) return;
        const next = new Date(day);
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        onChange(next.toISOString());
        setDateOpen(false);
    };

    const openTime = () => {
        setTemp({ hour: date.getHours(), minute: date.getMinutes() - (date.getMinutes() % 5) });
        setTimeOpen((open) => !open);
    };

    const confirmTime = () => {
        const next = new Date(date);
        next.setHours(temp.hour, temp.minute, 0, 0);
        onChange(next.toISOString());
        setTimeOpen(false);
    };

    return (
        <>
            <span ref={dateRef} className="relative inline-flex">
                <button type="button" onClick={() => setDateOpen((open) => !open)} aria-label={`${label}, tarih`} className={INLINE_TRIGGER}>
                    {date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" })}
                </button>
                <AnimatePresence>
                    {dateOpen && <DatePicker value={date} anchor={dateRef} onChange={changeDay} onClose={() => setDateOpen(false)} />}
                </AnimatePresence>
            </span>
            <span ref={timeRef} className="relative inline-flex">
                <button type="button" onClick={openTime} aria-label={`${label}, saat`} className={INLINE_TRIGGER}>
                    {pad(date.getHours())}:{pad(date.getMinutes())}
                </button>
                <AnimatePresence>
                    {timeOpen && (
                        <TimePicker hour={temp.hour} minute={temp.minute} anchor={timeRef}
                            onChange={(hour, minute) => setTemp({ hour, minute })}
                            onCancel={() => setTimeOpen(false)}
                            onConfirm={confirmTime}
                            onClear={() => setTimeOpen(false)}
                        />
                    )}
                </AnimatePresence>
            </span>
            {isPast && <span className="text-amber-300/90">geçti</span>}
        </>
    );
}

export function TimingSection({ timeLimitMinutes, closesAt, personalBlocker, isWorkflowStep, onTimeLimitChange, onClosesAtChange }) {
    const personal = Boolean(timeLimitMinutes);
    const closeOn = Boolean(closesAt);
    const personalOk = !personalBlocker;

    const personalDescription = !personalOk
        ? personalBlocker
        : personal ? "Aday görevi başlatınca işler, durdurulamaz." : "Aday görevi başlattığında kişiye özel süre işlesin.";

    return (
        <section className={PANEL_SECTION} data-anchor="timing">
            <SectionHeader title="Zamanlama"
                description={isWorkflowStep
                    ? "Formu bir saatte kendiliğinden kapat ya da adaya kişisel süre tanı. Akış adımında süreyi bu form belirler."
                    : "Formu bir saatte kendiliğinden kapat ya da adaya kişisel süre tanı."}
            />

            <div className="space-y-3">
                <TimingRow title="Kişisel süre" description={personalDescription} checked={personal}
                    disabled={!personalOk && !personal} dimmed={!personalOk && !personal}
                    onChange={() => onTimeLimitChange(personal ? null : DEFAULT_HOURS * 60)}
                >
                    <HoursInput minutes={timeLimitMinutes} onChange={onTimeLimitChange} />
                </TimingRow>

                <TimingRow title={personal ? "Son başlama" : "Kapanış saati"} checked={closeOn}
                    description={personal
                        ? "Bu saatten sonra kimse başlatamaz; başlayanlar süresini tamamlar."
                        : "Form bu saatte kendiliğinden kapanır, yeni cevap alınmaz."}
                    onChange={() => onClosesAtChange(closeOn ? null : defaultClosesAt())}
                >
                    <InlineDateTime value={closesAt} onChange={onClosesAtChange} label={personal ? "Son başlama" : "Kapanış saati"} />
                </TimingRow>
            </div>

            {personal && (
                <p className="text-2xs leading-relaxed text-neutral-500">
                    Süre dolunca taslak Cevaplar&apos;a geçici cevap olarak düşer; ekip kabul eder, süre verir ya da teslim yok diye kapatır.
                </p>
            )}
        </section>
    );
}

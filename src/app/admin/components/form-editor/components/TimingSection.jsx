"use client";

import { useRef, useState } from "react";
import { AnimatePresence } from "framer-motion";
import DatePicker from "@/app/components/utils/DatePicker";
import { PANEL_SECTION, SectionHeader, Switch } from "@/app/admin/components/utils/SidePanel";
import { defaultClosesAt, untilText } from "@/lib/form-timing";

const DEFAULT_MINUTES = 48 * 60;
const MAX_MINUTES = 720 * 60;

const GHOST = "rounded-md bg-white/5 px-1.5 py-0.5 tabular-nums text-neutral-100 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-skylab-400/50";
const GHOST_INPUT = `${GHOST} w-9 text-center outline-none focus:bg-white/10 focus:ring-1 focus:ring-skylab-400/50`;

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
                <div className="mt-2.5 divide-y divide-white/5 border-t border-white/5 text-2xs">{children}</div>
            ) : null}
        </div>
    );
}

function KeyRow({ label, children }) {
    return (
        <div className="flex items-center justify-between gap-4 py-1.5">
            <span className="shrink-0 text-neutral-500">{label}</span>
            <span className="flex min-w-0 items-center gap-1.5 text-neutral-400">{children}</span>
        </div>
    );
}

function NumberField({ value, max, onChange, label }) {
    const [draft, setDraft] = useState(String(value));
    const [prevValue, setPrevValue] = useState(value);

    if (prevValue !== value) {
        setPrevValue(value);
        setDraft(String(value));
    }

    const set = (next) => {
        if (next >= 0 && next <= max) onChange(next);
    };

    return (
        <input type="text" inputMode="numeric" value={draft} aria-label={label}
            onFocus={(event) => event.target.select()}
            onChange={(event) => {
                const text = event.target.value.replace(/\D/g, "").slice(0, 3);
                setDraft(text);
                if (text !== "") set(Number(text));
            }}
            onKeyDown={(event) => {
                if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                event.preventDefault();
                set(value + (event.key === "ArrowUp" ? 1 : -1));
            }}
            onBlur={() => setDraft(String(value))}
            className={GHOST_INPUT}
        />
    );
}

function DurationInput({ minutes, onChange }) {
    const total = minutes ?? DEFAULT_MINUTES;
    const hours = Math.floor(total / 60);
    const rest = total % 60;

    const apply = (next) => {
        if (next >= 1 && next <= MAX_MINUTES) onChange(next);
    };

    return (
        <>
            <NumberField value={hours} max={720} label="Süre, saat" onChange={(value) => apply(value * 60 + rest)} />
            <span>saat</span>
            <NumberField value={rest} max={59} label="Süre, dakika" onChange={(value) => apply(hours * 60 + value)} />
            <span>dakika</span>
        </>
    );
}

function TimeField({ value, onChange, label }) {
    const minuteRef = useRef(null);
    const [draft, setDraft] = useState(null);
    const shown = draft ?? { hour: pad(value.getHours()), minute: pad(value.getMinutes()) };

    const commit = () => {
        if (!draft) return;
        setDraft(null);
        const hour = Number(draft.hour);
        const minute = Number(draft.minute);
        if (draft.hour === "" || draft.minute === "" || hour > 23 || minute > 59) return;
        if (hour === value.getHours() && minute === value.getMinutes()) return;
        const next = new Date(value);
        next.setHours(hour, minute, 0, 0);
        onChange(next.toISOString());
    };

    const segment = (key, max) => (
        <input ref={key === "minute" ? minuteRef : undefined} type="text" inputMode="numeric" maxLength={2} value={shown[key]}
            aria-label={`${label}, ${key === "hour" ? "saat" : "dakika"}`}
            onFocus={(event) => event.target.select()}
            onChange={(event) => {
                const text = event.target.value.replace(/\D/g, "").slice(0, 2);
                setDraft({ ...shown, [key]: text });
                if (key === "hour" && text.length === 2) minuteRef.current?.focus();
            }}
            onKeyDown={(event) => {
                if (event.key === "Enter") {
                    event.currentTarget.blur();
                    return;
                }
                if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
                event.preventDefault();
                const current = Number(shown[key]) || 0;
                setDraft({ ...shown, [key]: pad((current + (event.key === "ArrowUp" ? 1 : -1) + max + 1) % (max + 1)) });
            }}
            className="w-4 bg-transparent text-center tabular-nums outline-none"
        />
    );

    return (
        <span onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) commit(); }}
            className="inline-flex items-center rounded-md bg-white/5 px-1 py-0.5 text-neutral-100 transition-colors hover:bg-white/10 focus-within:bg-white/10 focus-within:ring-1 focus-within:ring-skylab-400/50"
        >
            {segment("hour", 23)}
            <span className="text-neutral-500">:</span>
            {segment("minute", 59)}
        </span>
    );
}

export function InlineDateTime({ value, onChange, label }) {
    const date = value ? new Date(value) : null;
    const [dateOpen, setDateOpen] = useState(false);
    const dateRef = useRef(null);

    if (!date || Number.isNaN(date.getTime())) return null;

    const until = untilText(date);

    const changeDay = (day) => {
        if (!day) return;
        const next = new Date(day);
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        onChange(next.toISOString());
        setDateOpen(false);
    };

    return (
        <>
            <KeyRow label="Tarih">
                <span ref={dateRef} className="relative inline-flex">
                    <button type="button" onClick={() => setDateOpen((open) => !open)} aria-label={`${label}, tarih`} aria-expanded={dateOpen}
                        className={`${GHOST} ${dateOpen ? "bg-white/10" : ""}`}
                    >
                        {date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" })}
                    </button>
                    <AnimatePresence>
                        {dateOpen && <DatePicker value={date} anchor={dateRef} onChange={changeDay} onClose={() => setDateOpen(false)} />}
                    </AnimatePresence>
                </span>
            </KeyRow>
            <KeyRow label="Saat">
                <TimeField value={date} onChange={onChange} label={label} />
            </KeyRow>
            <KeyRow label="Kalan">
                {until ? <span className="text-neutral-500">{until}</span> : <span className="text-amber-300/90">geçti</span>}
            </KeyRow>
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
                    onChange={() => onTimeLimitChange(personal ? null : DEFAULT_MINUTES)}
                >
                    <KeyRow label="Süre">
                        <DurationInput minutes={timeLimitMinutes} onChange={onTimeLimitChange} />
                    </KeyRow>
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

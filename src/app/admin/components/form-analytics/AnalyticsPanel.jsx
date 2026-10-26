"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";
import Avatar from "@/app/components/utils/Avatar";
import { RichText } from "@/app/components/rich-text/RichText";
import { PANEL_SECTION, PANEL_STACK, PanelButton, SectionHeader } from "@/app/admin/components/utils/SidePanel";
import { durationText, shortDuration } from "@/lib/form-timing";
import { QuestionBadge } from "../form-studio/StudioField";
import { conditionLabel, questionNumbers } from "../form-studio/studio-schema";
import { askedCount, formatNumber, formatPercent, percentOf } from "../form-overview/overview-stats";
import { Bars, KIND_LABEL, dayName, monthName } from "./analytics-charts";
import { PARTICIPATION } from "./AnalyticsCard";
import { KV } from "../form-room/RoomParts";

const FADE = { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } };
const TABLE_GRID = "grid grid-cols-[minmax(0,1fr)_3rem_3.5rem] items-center gap-x-2";

const personName = (name) =>
  name?.trim().toLocaleLowerCase("tr-TR").split(/\s+/).map((word) => word.replace(/^\p{L}/u, (letter) => letter.toLocaleUpperCase("tr-TR"))).join(" ") || "";

export function ViewToggle({ value, onChange }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-white/10 bg-white/5 p-0.5">
      {[["bar", "Bar"], ["pie", "Pasta"]].map(([key, label]) => (
        <button key={key} type="button" onClick={() => onChange(key)} aria-pressed={value === key}
          className={`rounded px-2.5 py-2 text-3xs transition sm:py-1 ${value === key ? "bg-white/10 text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function ParticipationPanel({ data }) {
  const extendedBy = Array.isArray(data.extendedBy) ? data.extendedBy : [];
  const stalled = data.stalledQuestion;

  return (
    <motion.div key="participation" {...FADE} className={PANEL_STACK}>
      <section className={PANEL_SECTION}>
        <SectionHeader title="Katılım ve süre" description={`Kişisel süre ${durationText(data.timeLimitMinutes)}. Süre, kişi görevi başlatınca işlemeye başlar.`} />
        <div className="divide-y divide-white/5">
          {[["Formu açtı", data.opened], ["Görevi başlattı", data.started], ["Teslim etti", data.submitted], ["Geçici cevap", data.provisional], ["Devam ediyor", data.running], ["Teslim yok", data.noSubmission]]
            .map(([label, value]) => <KV key={label} label={label}><span className="tabular-nums">{value ?? 0}</span></KV>)}
        </div>
      </section>
      <section className={PANEL_SECTION}>
        <SectionHeader title="Süre verilenler"
          description={data.extendedPeople > 0 ? `${data.extendedPeople} kişiye toplam ${durationText(data.extendedMinutes)} verildi.` : "Henüz kimseye ek süre verilmedi."}
        />
        {extendedBy.length > 0 ? (
          <div className="divide-y divide-white/5">
            {extendedBy.map((item, index) => {
              const name = personName(item.actor?.fullName) || "Ekipten biri";
              return (
                <div key={item.actor?.id ?? index} className="flex items-center gap-3 py-2">
                  <Avatar name={item.actor?.fullName ? name : ""} photoUrl={item.actor?.profilePictureUrl} size="sm" />
                  <span className="min-w-0 flex-1 truncate text-2xs text-neutral-300">{name}</span>
                  <span className="shrink-0 text-2xs tabular-nums text-neutral-500">{item.count} kez · <span className="text-neutral-300">{shortDuration(item.minutes * 60_000)}</span></span>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
      {stalled ? (
        <section className={PANEL_SECTION}>
          <SectionHeader title="Bırakılan soru" />
          <p className="text-2xs leading-relaxed text-neutral-400">
            Süresi dolan taslakların <span className="tabular-nums text-neutral-200">{stalled.count}</span> tanesinde ilk boş soru{" "}
            <span className="text-neutral-200">{stalled.number}. soru ({stalled.question || "metni yok"})</span>. {stalled.isRequired ? "Zorunlu soru." : "Opsiyonel soru."}
          </p>
        </section>
      ) : null}
    </motion.div>
  );
}

function bucketLabel(kind, value) {
  if (kind === 8) return monthName(value);
  return value === "" || value == null ? "—" : String(value);
}

export default function AnalyticsPanel({ form, analytics, participation = null, focus, view, onView, onClear }) {
  const schema = form?.schema;
  const fields = useMemo(() => (Array.isArray(schema) ? schema : []), [schema]);
  const numbers = useMemo(() => questionNumbers(fields), [fields]);
  const byId = useMemo(() => new Map((analytics?.questions ?? []).map((q) => [q.questionId, q])), [analytics]);
  const total = analytics?.totalResponses ?? 0;
  const questions = (analytics?.questions ?? []).filter((q) => Number(q.kind) !== 0);

  if (focus === PARTICIPATION && participation) return <ParticipationPanel data={participation} />;

  const field = fields.find((item) => item.id === focus);
  const q = field ? byId.get(focus) : null;

  if (!field || !q) {
    return (
      <div className={PANEL_STACK}>
        <section className={PANEL_SECTION}>
          <SectionHeader title="Analitik" description="Karttaki bir soruya ya da soldaki listeden bir satıra tıklayın; ayrıntısı burada açılır." />
        </section>
      </div>
    );
  }

  const kind = Number(q.kind);
  const answered = q.answeredCount ?? 0;
  const skipped = q.skippedCount ?? 0;
  const canPie = kind === 3 || kind === 5;
  const condition = field.condition?.fieldId ? conditionLabel(field, fields, numbers) : null;
  const asked = condition ? askedCount(field, fields, byId, total) : null;
  const knownAsked = asked != null && asked >= answered;
  const distribution = Array.isArray(q.distribution) ? q.distribution : [];
  const rows = kind === 6
    ? [...distribution].sort((a, b) => Number(a.value) - Number(b.value))
    : kind === 8 || kind === 9 ? [...distribution].sort((a, b) => String(a.value).localeCompare(String(b.value))) : distribution;
  const firstColumn = kind === 8 ? "Ay" : kind === 9 ? "Saat" : kind === 6 ? "Değer" : "Seçenek";

  return (
    <motion.div key={focus} {...FADE} className={PANEL_STACK}>
      <section className={PANEL_SECTION}>
        <div className="flex items-start gap-3">
          <QuestionBadge number={numbers.get(field.id)} conditional={Boolean(field.condition?.fieldId)} />
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-snug text-neutral-100">
              {field.props?.question ? <RichText text={field.props.question} /> : <span className="font-normal text-neutral-500">Bu soru için metin yok</span>}
            </p>
            <p className="mt-1 text-2xs text-neutral-500">
              {KIND_LABEL[kind] ?? "Soru"}{field.type === "slider" ? " · kaydırıcı" : ""} · {answered} cevap{skipped ? ` · ${skipped} boş` : ""}
            </p>
          </div>
        </div>

        {canPie ? (
          <div className="flex items-center justify-between">
            <span className="text-2xs text-neutral-500">Gösterim</span>
            <ViewToggle value={view} onChange={onView} />
          </div>
        ) : null}

        {q.aggregatable && kind !== 7 && rows.length > 0 ? (
          <div>
            <div className={`${TABLE_GRID} border-b border-white/5 pb-1.5 text-3xs text-neutral-600`}>
              <span>{firstColumn}</span>
              <span className="text-right">Kişi</span>
              <span className="text-right">Oran</span>
            </div>
            <div className="divide-y divide-white/5">
              {rows.map((bucket, index) => (
                <div key={`${bucket.value}-${index}`} className={`${TABLE_GRID} py-1.5 text-2xs`}>
                  <span className="truncate text-neutral-300" title={bucketLabel(kind, bucket.value)}>{bucketLabel(kind, bucket.value)}</span>
                  <span className="text-right tabular-nums text-neutral-200">{bucket.count}</span>
                  <span className="text-right tabular-nums text-neutral-500">{formatPercent(bucket.percentage)}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {kind === 7 && Array.isArray(q.rows) ? (
          <div className="space-y-4">
            {q.rows.map((row) => (
              <div key={row.row}>
                <p className="mb-1.5 flex justify-between gap-3 text-2xs">
                  <span className="min-w-0 truncate font-medium text-neutral-200">{row.row}</span>
                  <span className="shrink-0 tabular-nums text-neutral-500">{row.answeredCount} yanıt</span>
                </p>
                <Bars className="mt-1" buckets={row.distribution} />
              </div>
            ))}
          </div>
        ) : null}

        {q.numeric ? (
          <div className="divide-y divide-white/5">
            <KV label="Ortalama"><span className="font-semibold tabular-nums">{formatNumber(q.numeric.average)}</span></KV>
            <KV label="Medyan"><span className="tabular-nums">{formatNumber(q.numeric.median)}</span></KV>
            <KV label="En düşük · en yüksek"><span className="tabular-nums">{formatNumber(q.numeric.min)} · {formatNumber(q.numeric.max)}</span></KV>
          </div>
        ) : null}

        {kind === 8 && q.dateRange?.earliest && q.dateRange?.latest ? (
          <p className="text-3xs leading-relaxed text-neutral-500">Tarihler ay ay sayılır. En erken {dayName(q.dateRange.earliest)}, en geç {dayName(q.dateRange.latest)}.</p>
        ) : null}
        {kind === 9 ? <p className="text-3xs leading-relaxed text-neutral-500">Saatler saat başına toplanır; 14:00 satırı 14.00 ile 14.59 arasını sayar.</p> : null}
        {kind === 4 ? <p className="text-3xs leading-relaxed text-neutral-500">Çoklu seçim: bir kişi birden çok seçenek işaretleyebildiği için yüzdelerin toplamı %100&apos;ü aşabilir.</p> : null}

        {condition ? (
          <div className="relative pl-3">
            <span className="absolute inset-y-0 left-0 w-0.5 rounded-full bg-skylab-400/40" />
            <p className="text-2xs leading-relaxed text-neutral-400">
              {knownAsked
                ? `Bu soru yalnız ${condition} görünüyor. ${asked} kişi gördü, ${answered} kişi cevapladı (${formatPercent(percentOf(answered, asked))}).`
                : `Bu soru yalnız ${condition} görünüyor. Kaç kişinin gördüğü hesaplanamıyor; oran bütün cevaplara (${total}) göre ${formatPercent(percentOf(answered, total))}.`}
            </p>
          </div>
        ) : null}

        {!q.aggregatable && !condition ? (
          <p className="text-2xs leading-relaxed text-neutral-500">
            {kind === 2 ? "Dosya soruları analiz edilmez; dosyalar cevaplarda açılır."
              : kind === 10 ? "Tekrarlanan gruplar analiz edilmez; kayıtlar cevaplarda okunur."
                : "Metin soruları analiz edilmez; cevaplar Cevaplar modunda okunur."}
          </p>
        ) : null}
      </section>

      <section className={PANEL_SECTION}>
        <SectionHeader title="Bu form" />
        <div className="divide-y divide-white/5">
          <KV label="Cevap"><span className="tabular-nums">{total}</span></KV>
          <KV label="Analiz edilen soru"><span className="tabular-nums">{questions.filter((item) => item.aggregatable).length} / {questions.length}</span></KV>
        </div>
        <PanelButton touch icon={X} className="w-full" onClick={onClear}>Seçimi kaldır</PanelButton>
      </section>
    </motion.div>
  );
}

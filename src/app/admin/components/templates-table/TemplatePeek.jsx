"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, Hash, PencilLine, Share2, Trash2 } from "lucide-react";
import { possessive } from "../workflow-page/journey-data";
import Highlight from "./Highlight";
import { labelOf, typeOf } from "./template-data";

const ACTION = "inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md px-1.5 text-2xs font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100 disabled:pointer-events-none disabled:opacity-50";

function Count({ value }) {
  return <span className="font-medium tabular-nums text-neutral-100">{value}</span>;
}

function QuestionList({ row, matched, query }) {
  if (!row.schema.length) return <p className="text-2xs text-neutral-600 @2xl:w-80">Bu şablonda henüz soru yok.</p>;

  const numbers = new Map(row.questions.map((field, index) => [field.id, index + 1]));
  const items = row.schema.map((field) => ({ field, number: numbers.get(field.id) ?? null }));
  const long = items.length > 6;

  return (
    <ol className={`min-w-0 @2xl:w-80 ${long ? "@6xl:w-168 @6xl:columns-2 @6xl:gap-8" : ""}`}>
      {items.map(({ field, number: index }) => {
        if (!index) {
          return (
            <li key={field.id} className="flex h-6 break-inside-avoid items-center gap-2 pl-6">
              <span className="truncate text-2xs font-medium text-neutral-400">{field.props?.title?.trim() || "Bölüm"}</span>
              <span className="h-px flex-1 bg-white/5" />
            </li>
          );
        }
        const type = typeOf(field);
        const Icon = type?.icon ?? Hash;
        const hit = matched.has(field.id);
        return (
          <li key={field.id} className="flex h-6 break-inside-avoid items-center gap-2 text-2xs">
            <span className="w-4 shrink-0 text-right tabular-nums text-neutral-600">{index}</span>
            <span title={type?.label} className="shrink-0"><Icon size={12} strokeWidth={1.75} className="text-neutral-500" /></span>
            <span className={`min-w-0 truncate ${hit ? "text-neutral-100" : "text-neutral-300"}`}>{hit ? <Highlight text={labelOf(field)} query={query} /> : labelOf(field)}</span>
            {field.props?.required ? <span title="Zorunlu" className="shrink-0 text-neutral-600">*</span> : null}
          </li>
        );
      })}
    </ol>
  );
}

function Sentence({ row }) {
  if (!row.count) return <>Henüz soru yok.</>;
  if (!row.required) return <><Count value={row.count} /> soru, hiçbiri zorunlu değil.</>;
  if (row.required === row.count) return <><Count value={row.count} /> soru, hepsi zorunlu.</>;
  return <><Count value={row.count} /> soru, <Count value={row.required} />{possessive(row.required)} zorunlu.</>;
}

export default function TemplatePeek({ row, matched, query, onShare, onCopy, onDelete, copying }) {
  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden bg-white/2.5">
      <div className="flex flex-col gap-4 px-3 pb-3.5 pt-1 @2xl:flex-row @2xl:flex-wrap @2xl:items-start @2xl:gap-x-8 @2xl:pl-15">
        <QuestionList row={row} matched={matched} query={query} />
        <div className="flex min-w-0 flex-col gap-x-8 gap-y-4 @2xl:grow @2xl:basis-88 @2xl:flex-row @2xl:flex-wrap @2xl:items-start @[90rem]:justify-end">
          <div className="flex min-w-0 flex-col gap-2.5 @2xl:w-88 @2xl:max-w-full">
            <p className="text-xs leading-5 text-neutral-400"><Sentence row={row} /></p>
            {row.description ? <p className="text-2xs leading-5 text-neutral-500">{row.description}</p> : null}
            <div className="-ml-1.5 flex flex-wrap items-center gap-0.5">
              <Link href={row.href} className={ACTION}><PencilLine size={12} className="shrink-0 opacity-70" />Düzenle</Link>
              <button type="button" onClick={onShare} className={ACTION}><Share2 size={12} className="shrink-0 opacity-70" />Paylaş</button>
              <button type="button" onClick={onCopy} disabled={copying} className={ACTION}><Copy size={12} className="shrink-0 opacity-70" />{copying ? "Kopyalanıyor" : "Kopyasını oluştur"}</button>
              <button type="button" onClick={onDelete} className={`${ACTION} hover:text-red-300`}><Trash2 size={12} className="shrink-0 opacity-70" />Sil</button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Copy, Hash, PencilLine, Share2, Trash2 } from "lucide-react";
import { Button } from "@skylab-kulubu/skylcn-ui";
import { possessive } from "../workflow-page/journey-data";
import Highlight from "./Highlight";
import { labelOf, typeOf } from "./template-data";

function Count({ value }) {
  return <span className="font-medium tabular-nums text-foreground">{value}</span>;
}

function QuestionList({ row, matched, query }) {
  if (!row.schema.length) return <p className="text-2xs text-faint-foreground @2xl:w-80">Bu şablonda henüz soru yok.</p>;

  const numbers = new Map(row.questions.map((field, index) => [field.id, index + 1]));
  const items = row.schema.map((field) => ({ field, number: numbers.get(field.id) ?? null }));
  const long = items.length > 6;

  return (
    <ol className={`min-w-0 @2xl:w-80 ${long ? "@6xl:w-168 @6xl:columns-2 @6xl:gap-8" : ""}`}>
      {items.map(({ field, number: index }) => {
        if (!index) {
          return (
            <li key={field.id} className="flex h-6 break-inside-avoid items-center gap-2 pl-6">
              <span className="truncate text-2xs font-medium text-muted-foreground">{field.props?.title?.trim() || "Bölüm"}</span>
              <span className="h-px flex-1 bg-border-subtle" />
            </li>
          );
        }
        const type = typeOf(field);
        const Icon = type?.icon ?? Hash;
        const hit = matched.has(field.id);
        return (
          <li key={field.id} className="flex h-6 break-inside-avoid items-center gap-2 text-2xs">
            <span className="w-4 shrink-0 text-right tabular-nums text-faint-foreground">{index}</span>
            <span title={type?.label} className="shrink-0"><Icon size={12} strokeWidth={1.75} className="text-subtle-foreground" /></span>
            <span className={`min-w-0 truncate ${hit ? "text-foreground" : "text-secondary-foreground"}`}>{hit ? <Highlight text={labelOf(field)} query={query} /> : labelOf(field)}</span>
            {field.props?.required ? <span title="Zorunlu" className="shrink-0 text-faint-foreground">*</span> : null}
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
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden bg-row-highlight">
      <div className="flex flex-col gap-4 px-3 pb-3.5 pt-1 @2xl:flex-row @2xl:flex-wrap @2xl:items-start @2xl:gap-x-8 @2xl:pl-15">
        <QuestionList row={row} matched={matched} query={query} />
        <div className="flex min-w-0 flex-col gap-x-8 gap-y-4 @2xl:grow @2xl:basis-88 @2xl:flex-row @2xl:flex-wrap @2xl:items-start @[90rem]:justify-end">
          <div className="flex min-w-0 flex-col gap-2.5 @2xl:w-88 @2xl:max-w-full">
            <p className="text-xs leading-5 text-muted-foreground"><Sentence row={row} /></p>
            {row.description ? <p className="text-2xs leading-5 text-subtle-foreground">{row.description}</p> : null}
            <div className="-ml-2.5 flex flex-wrap items-center gap-0.5">
              <Button variant="ghost" size="sm" render={<Link href={row.href} />}><PencilLine aria-hidden="true" />Düzenle</Button>
              <Button variant="ghost" size="sm" onClick={onShare}><Share2 aria-hidden="true" />Paylaş</Button>
              <Button variant="ghost" size="sm" onClick={onCopy} disabled={copying}><Copy aria-hidden="true" />{copying ? "Kopyalanıyor" : "Kopyasını oluştur"}</Button>
              <Button variant="ghost" size="sm" onClick={onDelete} className="hover:text-destructive"><Trash2 aria-hidden="true" />Sil</Button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

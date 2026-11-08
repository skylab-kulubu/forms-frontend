"use client";

import Link from "next/link";
import { LayoutTemplate, Plus } from "lucide-react";
import StateCard from "@/app/components/StateCard";
import { STARTER_TEMPLATES } from "../form-studio/studio-presets";
import { labelOf } from "./template-data";

export default function EmptyTemplates({ onAdopt, adopting }) {
  return (
    <StateCard title="Henüz şablonun yok" Icon={LayoutTemplate}
      description="Şablon, birçok formda sorduğun soruları bir arada tutar. Formda Şablon ekle menüsünden hepsini tek seferde eklersin."
    >
      <Link href="/admin/templates/new-template" className="inline-flex h-9 items-center rounded-md border border-skylab-400/30 bg-skylab-500/10 px-3 text-xs font-medium text-skylab-300 transition-colors hover:bg-skylab-400/20">
        İlk şablonunu oluştur
      </Link>
      <section className="mt-10 text-left">
        <div className="mb-1 flex h-4 items-center gap-2">
          <span className="shrink-0 text-2xs font-medium text-neutral-500">Formlarda hazır duranlar</span>
          <span className="h-px flex-1 bg-white/5" />
        </div>
        <div className="divide-y divide-white/5">
          {STARTER_TEMPLATES.map((starter) => (
            <div key={starter.id} className="flex items-center gap-3 py-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-neutral-200">{starter.title}</p>
                <p className="truncate text-3xs text-neutral-500">{starter.schema.map(labelOf).join(" · ")}</p>
              </div>
              <button type="button" onClick={() => onAdopt(starter)} disabled={adopting}
                className="inline-flex h-6 shrink-0 items-center gap-1.5 rounded-md px-1.5 text-2xs font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100 disabled:opacity-50"
              >
                <Plus size={12} className="shrink-0 opacity-70" />
                Şablonlarıma ekle
              </button>
            </div>
          ))}
        </div>
      </section>
    </StateCard>
  );
}

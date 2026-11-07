"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, CornerDownRight, FileText, Search } from "lucide-react";
import { PanelButton } from "@/app/admin/components/utils/SidePanel";
import { formQuery, useUserFormsQuery } from "@/lib/hooks/useFormAdmin";
import { templateFieldsOf } from "@/lib/studio/template-doc";
import { EmptyStart, StartList, StartRow } from "../form-studio/StudioStart";
import { fieldLabel, fieldTypeOf, questionNumbers } from "../form-studio/studio-schema";

const SHOWN = 3;

function listOf(payload) {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

function FormList({ phone, onPick }) {
  const [search, setSearch] = useState("");
  const { data } = useUserFormsQuery({ pageSize: 50 });
  const forms = useMemo(() => listOf(data), [data]);
  const matches = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    return query ? forms.filter((form) => (form.title ?? "").toLocaleLowerCase("tr-TR").includes(query)) : forms;
  }, [forms, search]);

  if (forms.length === 0) return null;
  const searchable = forms.length > SHOWN;

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && matches[0]) onPick(matches[0]);
  };

  return (
    <StartList heading="Formdan başlayın" phone={phone}
      action={searchable ? (
        <div className="relative w-36 shrink-0">
          <Search size={12} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={handleKeyDown} placeholder="Form ara..." aria-label="Form ara"
            className="h-7 w-full rounded-md border border-white/10 bg-neutral-900/60 pl-7 pr-2 text-2xs text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-skylab-400/50"
          />
        </div>
      ) : null}
    >
      <div className={`divide-y divide-white/5 ${searchable ? "min-h-40" : ""}`}>
        {matches.length === 0 ? <p className="py-6 text-center text-2xs text-neutral-500">Eşleşen form yok.</p> : null}
        {matches.slice(0, SHOWN).map((form) => (
          <StartRow key={form.id} Icon={FileText} phone={phone} title={form.title || "Adsız form"} onClick={() => onPick(form)} />
        ))}
      </div>
    </StartList>
  );
}

function QuestionStep({ form, phone, onBack, onImport }) {
  const { data, isLoading } = useQuery(formQuery(form.id));
  const [picked, setPicked] = useState([]);

  const schema = useMemo(() => {
    const payload = data?.data ?? data;
    return Array.isArray(payload?.schema) ? payload.schema : [];
  }, [data]);
  const numbers = useMemo(() => questionNumbers(schema), [schema]);
  const allPicked = schema.length > 0 && picked.length === schema.length;
  const pad = phone ? "px-1" : "px-2 md:px-4";

  const toggle = (id) => setPicked((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

  const loses = (field) => Boolean(field.condition?.fieldId) && !picked.includes(field.condition.fieldId);

  const submit = () => {
    const chosen = schema.filter((field) => picked.includes(field.id)).map((field) => {
      if (!loses(field)) return field;
      const { condition, ...rest } = field;
      return rest;
    });
    onImport(templateFieldsOf(chosen), form.title);
  };

  return (
    <div>
      <div className={`flex items-center gap-2 ${pad}`}>
        <button type="button" aria-label="Formlara dön" onClick={onBack}
          className="-ml-1.5 grid size-7 shrink-0 place-items-center rounded-md text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100"
        >
          <ChevronLeft size={15} />
        </button>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-100">{form.title || "Adsız form"}</span>
        {schema.length > 0 ? (
          <button type="button" onClick={() => setPicked(allPicked ? [] : schema.map((field) => field.id))}
            className="shrink-0 text-2xs text-neutral-400 underline decoration-white/20 underline-offset-2 transition-colors hover:text-neutral-100"
          >
            {allPicked ? "Seçimi kaldır" : "Hepsini seç"}
          </button>
        ) : null}
      </div>

      <div className="mt-3 max-h-[min(56vh,30rem)] overflow-y-auto scrollbar">
        {isLoading ? <p className="py-6 text-center text-2xs text-neutral-500">Sorular yükleniyor...</p> : null}
        {!isLoading && schema.length === 0 ? <p className="py-6 text-center text-2xs text-neutral-500">Bu formda soru yok.</p> : null}
        {schema.map((field) => {
          const type = fieldTypeOf(field);
          const on = picked.includes(field.id);
          return (
            <label key={field.id} className={`flex cursor-pointer items-start gap-2.5 rounded-lg py-2 text-left transition-colors ${pad} ${on ? "bg-skylab-500/8" : "hover:bg-white/3"}`}>
              <input type="checkbox" checked={on} onChange={() => toggle(field.id)} className="checkbox mt-0.5 shrink-0" />
              <span className="mt-0.5 w-4 shrink-0 text-right text-2xs tabular-nums text-neutral-500">{numbers.get(field.id) ?? ""}</span>
              <type.Icon size={14} className="mt-0.5 shrink-0 text-neutral-500" />
              <span className="min-w-0 flex-1">
                <span className={`block truncate text-sm ${on ? "text-skylab-300" : "text-neutral-200"}`}>{fieldLabel(field)}</span>
                {on && loses(field) ? (
                  <span className="mt-0.5 flex items-center gap-1 text-2xs text-amber-200/80">
                    <CornerDownRight size={11} className="shrink-0" />
                    Koşulun sorusu seçili değil, koşul kalkar
                  </span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>

      <div className={`mt-3 ${pad}`}>
        <PanelButton className="w-full" disabled={picked.length === 0} onClick={submit}>
          {picked.length ? `${picked.length} bileşeni ekle` : "Soru seçin"}
        </PanelButton>
      </div>
    </div>
  );
}

export default function FormStart({ phone = false, onImport }) {
  const [form, setForm] = useState(null);

  if (form) return <QuestionStep key={form.id} form={form} phone={phone} onBack={() => setForm(null)} onImport={onImport} />;

  return (
    <>
      <EmptyStart phone={phone} />
      <FormList phone={phone} onPick={setForm} />
    </>
  );
}

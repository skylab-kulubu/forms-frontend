"use client";

import { useMemo, useState } from "react";
import { Link as LinkIcon, Github, Linkedin, Instagram, X } from "lucide-react";
import { FieldShell } from "./FieldShell";
import { useProp } from "@/app/admin/components/form-editor/components/useProp";

function getProviderIcon(input) {
  if (!input || typeof input !== "string") return LinkIcon;
  let hostname = "";
  try {
    hostname = new URL(input).hostname;
  } catch (_) {
    try {
      hostname = new URL(`http://${input}`).hostname;
    } catch (_) {
      hostname = "";
    }
  }
  const h = hostname.toLowerCase();
  if (h.includes("github.com")) return Github;
  if (h.includes("linkedin.com")) return Linkedin;
  if (h.includes("instagram.com")) return Instagram;
  return LinkIcon;
}

export function CreateFormLink({ questionNumber, props, onPropsChange, readOnly }) {
  const {prop, bind, toggle} = useProp(props, onPropsChange, readOnly);

  return (
    <FieldShell number={questionNumber} title="Bağlantı" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="link-question" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Soru Metni
        </label>
        <input id="link-question" type="text" {...bind("question")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
          placeholder="Sorunuzu buraya yazın."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="link-description" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Açıklama
        </label>
        <input id="link-description" type="text" {...bind("description")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
          placeholder="Açıklamanızı buraya yazın."
        />
      </div>

      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-2 py-1">
        <span className="text-[12px] text-neutral-300">Birden fazla linke izin ver</span>
        <div className="inline-flex rounded-lg border border-white/15 bg-white/5 p-0.5">
          <button type="button" aria-pressed={!prop.allowMultiple} onClick={() => toggle("allowMultiple", false)}
            className={`px-2 py-1 text-[11px] rounded-lg transition focus:outline-none ${!prop.allowMultiple ? "bg-white/10 text-neutral-100" : "text-neutral-300 hover:text-neutral-200"}`}
          >
            Hayır
          </button>
          <button type="button" aria-pressed={prop.allowMultiple} onClick={() => toggle("allowMultiple", true)}
            className={`px-2 py-1 text-[11px] rounded-lg transition focus:outline-none ${prop.allowMultiple ? "bg-emerald-500/20 text-emerald-200" : "text-neutral-300 hover:text-neutral-200"}`}
          >
            Evet
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="link-answer" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Cevap
        </label>
        <div className="flex flex-col gap-2">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              <LinkIcon size={16} />
            </span>
            <input id="link-answer" type="url" disabled
              className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 pl-9 pr-3 py-2 text-center text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-70 disabled:border-white/5 disabled:bg-neutral-900/40"
              placeholder="https://ornek.com/profil"
            />
          </div>
          {prop.allowMultiple && (
            <input type="url" disabled
              className="block w-full rounded-lg border border-white/10 bg-neutral-900/40 px-3 py-2 text-center text-sm text-neutral-100 placeholder-neutral-500 opacity-70"
              placeholder="Yeni bağlantı eklenebilir"
            />
          )}
        </div>
        <span className="px-0.5 text-[11px] text-neutral-500">Profil ya da web sitesi bağlantısı bekleniyor</span>
      </div>
    </FieldShell>
  );
}

export function DisplayFormLink({ question, questionNumber, description, required = false, allowMultiple = false, value, onChange, missing = false }) {
  const isValidUrl = (input) => {
    if (!input || typeof input !== "string") return false;
    let u;
    try {
      u = new URL(input);
    } catch (_) {
      try {
        u = new URL(`http://${input}`);
      } catch (_) {
        return false;
      }
    }
    return typeof u.hostname === "string" && u.hostname.includes(".");
  };

  if (!allowMultiple) {
    const [internalValue, setInternalValue] = useState(value ?? "");
    const currentValue = value !== undefined ? value : internalValue;
    const handleChange = (e) => {
      if (onChange) {
        onChange({ target: { value: e.target.value } });
      } else {
        setInternalValue(e.target.value);
      }
    };
    const Icon = useMemo(() => getProviderIcon(currentValue), [currentValue]);

    return (
      <div className="mx-auto w-full max-w-2xl rounded-xl">
        <div className="flex flex-col p-2 md:p-4">
          <div className="flex gap-3">
          {questionNumber != null && (
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-xs font-semibold text-neutral-300">
              {questionNumber}
            </div>
          )}

          <div className="flex flex-col">
            <p className="text-sm font-medium text-neutral-100">
              {question}{" "} {required && <span className="ml-1 text-red-200/70">*</span>}
            </p>
            {description && ( <p className="my-1 text-xs text-neutral-400">{description}</p>)}
          </div>
        </div>

          <div className="relative mt-3">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              <Icon size={16} />
            </span>
            <input name="link" type="url" aria-required={required}
              value={currentValue} onChange={handleChange}
              placeholder="https://ornek.com"
              className={`block w-full rounded-lg border bg-neutral-900/60 pl-9 pr-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:ring-2 focus:ring-white/20 ${missing ? "border-red-400/60 focus:border-red-400/80" : "border-white/10 focus:border-white/30"}`}
            />
          </div>

          {required && <span className="px-0.5 text-[11px] text-neutral-500 mt-1">Zorunlu alan</span>}
        </div>
      </div>
    );
  }

  const normalizeIncoming = (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === "string" && v.length > 0) return [v];
    return [];
  };

  const [links, setLinks] = useState(normalizeIncoming(value));
  const currentLinks = value !== undefined ? normalizeIncoming(value) : links;

  const commit = (nextArray) => {
    if (onChange) {
      onChange({ target: { value: nextArray } });
    } else {
      setLinks(nextArray);
    }
  };

  const updateAt = (index, newVal) => {
    const base = [...currentLinks];
    base[index] = newVal;
    let next = base.filter((v, i) => (i === base.length - 1 ? true : v !== ""));
    const last = next[next.length - 1];
    if (isValidUrl(last)) {
      if (last !== "" && (next.length === 0 || next[next.length - 1] !== "")) {
        next = [...next, ""];
      }
    }
    while (next.length > 1 && next[next.length - 1] === "" && next[next.length - 2] === "") {
      next.pop();
    }
    commit(next);
  };

  const removeAt = (index) => {
    let next = currentLinks.filter((_, i) => i !== index);
    if (next.length === 0 || isValidUrl(next[next.length - 1])) {
      next = [...next, ""];
    }
    commit(next);
  };

  const fields = currentLinks.length === 0 ? [""] : currentLinks;

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl border border-white/10 bg-neutral-900/40 shadow-lg backdrop-blur-sm">
      <div className="flex flex-col p-2 md:p-4">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-neutral-100">
            {question} {required && <span className="ml-1 text-red-600">*</span>}
          </p>
        </div>

        {description && <p className="text-xs text-neutral-400">{description}</p>}

        <div className="mt-3 flex flex-col gap-2">
          {fields.map((v, index) => {
            const Icon = getProviderIcon(v);
            const placeholder = index === fields.length - 1 && v === "" ? "Yeni bağlantı ekleyin" : "https://ornek.com/profil";
            const isTrailingEmpty = index === fields.length - 1 && v === "";
            const isMissingField = missing && index === 0 && v === "";
            return (
              <div key={`link_${index}`} className="relative flex items-center gap-2">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
                  <Icon size={16} />
                </span>
                <input name="link[]" type="url" aria-required={required && index === 0}
                  value={v} onChange={(e) => updateAt(index, e.target.value)} placeholder={placeholder}
                  className={`block w-full rounded-lg border bg-neutral-900/60 pl-9 pr-9 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:ring-2 focus:ring-white/20 ${isMissingField ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-white/30"}`}
                />
                {!isTrailingEmpty && (
                  <button type="button" onClick={() => removeAt(index)} aria-label="Linki kaldır"
                    className="absolute right-2 inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 p-1 text-neutral-300 hover:text-neutral-100"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            );
          })}
          <span className="px-0.5 text-[11px] text-neutral-500">Geçerli bir bağlantı girildiğinde yeni alan açılır</span>
        </div>

        {required && <span className="px-0.5 text-[11px] text-neutral-500 mt-1">Zorunlu alan</span>}
      </div>
    </div>
  );
}

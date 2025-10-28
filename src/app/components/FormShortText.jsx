"use client";

import { useState } from "react";

export function CreateFormShortText({ questionNumber }) {
  const [question, setQuestion] = useState("");
  const [description, setDescription] = useState("");
  const [required, setRequired] = useState(false);

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl border border-white/10 bg-neutral-900/40 shadow-lg backdrop-blur-sm">
      <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
        <div className="grid size-6 place-items-center rounded-md border border-white/15 bg-white/5 text-[13px] font-semibold text-neutral-200">
          {questionNumber}
        </div>
        <span className="text-sm font-medium text-neutral-100">Kısa Yanıt</span>
        <div className="ml-auto">
          <div className="inline-flex rounded-lg border border-white/15 bg-white/5 p-0.5">
            <button type="button" aria-pressed={!required}
              onClick={() => setRequired(false)}
              className={`px-2 py-1 text-[11px] rounded-lg transition focus:outline-none ${!required ? "bg-white/10 text-neutral-100" : "text-neutral-300 hover:text-neutral-200"}`}
            >
              Opsiyonel
            </button>
            <button type="button" aria-pressed={required}
              onClick={() => setRequired(true)}
              className={`px-2 py-1 text-[11px] rounded-lg transition focus:outline-none ${required ? "bg-emerald-500/20 text-emerald-200" : "text-neutral-300 hover:text-neutral-200"}`}
            >
              Zorunlu
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 p-3 md:p-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="short-question" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            Soru Metni
          </label>
          <input id="short-question" type="text"
            className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
            placeholder="Sorunuzu buraya yazın."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="short-description" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            Açıklama
          </label>
          <input id="short-description" type="text"
            className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
            placeholder="Açıklamanızı buraya yazın."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="short-answer" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            Cevap
          </label>
          <textarea id="short-answer" rows={1}
            className="block w-full resize-none rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-center text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20 disabled:cursor-not-allowed disabled:opacity-70 disabled:border-white/5 disabled:bg-neutral-900/40"
            placeholder="Cevap buraya yazılacak"
            disabled
          />
          <span className="px-0.5 text-[11px] text-neutral-500">Kısa yanıt bekleniyor</span>
        </div>
      </div>
    </div>
  );
}

export function DisplayFormShortText({ question, description, required = false, value, onChange }) {
  const [internalValue, setInternalValue] = useState(value ?? "");
  const currentValue = value !== undefined ? value : internalValue;
  const handleChange = onChange !== undefined ? onChange : (e) => setInternalValue(e.target.value);

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl border border-white/10 bg-neutral-900/40 shadow-lg backdrop-blur-sm">
      <div className="flex flex-col p-2 md:p-4">
        <div className="flex items-start justify-between">
          <p className="text-sm font-medium text-neutral-100">
            {question} {required && <span className="ml-1 text-red-600">*</span>}
          </p>
        </div>

        {description && (
          <p className="text-xs text-neutral-400">{description}</p>
        )}

        <input name="short_text" type="text" aria-required={required}
          value={currentValue} onChange={handleChange}
          placeholder="Cevabınızı buraya yazın."
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 mt-3 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
        />

        {required && (
          <span className="px-0.5 text-[11px] text-neutral-500 mt-1">Zorunlu alan</span>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRespondent } from "@/lib/hooks/useRespondent";
import { FieldShell } from "./FieldShell";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import { useProp } from "@/app/admin/components/form-editor/hooks/useProp";
import { Input } from "@skylab-kulubu/skylcn-ui";
import { Type, Mail, Phone, Hash, UserRound, Link as LinkIcon, Lock } from "lucide-react";
import { LinkAnswerInput } from "./FormLink";
import { CompactField } from "./CompactField";
import { QuestionField } from "./QuestionParts";

const AUTOFILL_NOTE = "Oturumunuzdan otomatik dolduruldu";

export const INPUT_TYPES = [
  { id: "text", label: "Düz Metin", icon: Type, placeholder: "Yanıtınızı yazın." },
  { id: "name", label: "İsim", icon: UserRound, placeholder: "Adınızı yazın." },
  { id: "email", label: "E-Posta", icon: Mail, placeholder: "ornek@mail.com" },
  { id: "phone", label: "Telefon", icon: Phone, placeholder: "+90 512 345 67 89" },
  { id: "number", label: "Sayı", icon: Hash, placeholder: "Sayı girin." },
  { id: "link", label: "Bağlantı", icon: LinkIcon, placeholder: "https://ornek.com" }
];

function normalizeName(name) {
  if (!name) return "";
  return name.trim().split(/\s+/).map(w => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1).toLocaleLowerCase("tr-TR")).join(" ");
}

export function CreateFormShortText({ questionNumber, props, onPropsChange, readOnly, compact = false, canMarkCopy = false, ...rest }) {
  const { prop, bind, toggle, patch } = useProp(props, onPropsChange, readOnly);
  const currentType = prop.inputType || "text";
  // Etkinlik formu dışında "email" işareti soruyu kilitlemez; misafirin cevap kopyasının gideceği soruyu seçer.
  const locked = Boolean(prop.identity) && !canMarkCopy;
  const marksCopy = prop.identity === "email";

  return (
    <FieldShell number={questionNumber} title="Kısa Yanıt" required={!!prop.required} onRequiredChange={(v) => { if (!locked) toggle("required", v); }} hideRequired={locked} compact={compact} {...rest}>
      <div className="flex flex-col gap-1.5">
        <label className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">Soru Metni</label>
        <AutoResizeTextarea {...bind("question")} className="block w-full rounded-lg border border-ink/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50" placeholder="Sorunuzu buraya yazın." />
      </div>

      {!compact && (
        <div className="flex flex-col gap-1.5">
          <label className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">Açıklama</label>
          <AutoResizeTextarea {...bind("description")} className="block w-full rounded-lg border border-ink/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50" placeholder="Açıklamanızı buraya yazın." />
        </div>
      )}

      <div className="flex flex-col gap-1.5 pt-2">
        <label className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">Geçerli Veri Tipi</label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {INPUT_TYPES.map((type) => {
            const Icon = type.icon;
            const isActive = currentType === type.id;
            return (
              <button key={type.id} type="button" disabled={locked} onClick={() => { if (!locked) patch({ inputType: type.id, identity: type.id === "email" ? prop.identity : undefined }); }}
                className={`flex items-center justify-center gap-2 py-2 px-1 rounded-lg border text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${locked ? "opacity-60 cursor-not-allowed" : ""} ${isActive ? "border-ink/20 bg-ink/10 text-skylab-300" : "border-ink/8 bg-ink/2 text-neutral-500 hover:text-neutral-300 hover:bg-ink/8"}`}
              >
                <Icon size={14} />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {canMarkCopy && currentType === "email" && (
        <div className="flex items-center justify-between rounded-lg border border-ink/10 bg-ink/5 px-2 py-1">
          <span className="text-xs text-neutral-300">Cevap kopyası bu adrese gider</span>
          <div className="inline-flex rounded-lg border border-ink/15 bg-ink/5 p-0.5">
            <button type="button" aria-pressed={!marksCopy} onClick={() => toggle("identity", undefined)}
              className={`px-2 py-1 text-2xs rounded-lg transition focus:outline-none ${!marksCopy ? "bg-ink/10 text-neutral-100" : "text-neutral-300 hover:text-neutral-200"}`}
            >
              Hayır
            </button>
            <button type="button" aria-pressed={marksCopy} onClick={() => toggle("identity", "email")}
              className={`px-2 py-1 text-2xs rounded-lg transition focus:outline-none ${marksCopy ? "bg-emerald-500/20 text-emerald-200" : "text-neutral-300 hover:text-neutral-200"}`}
            >
              Evet
            </button>
          </div>
        </div>
      )}

      {currentType === "link" && (
        <div className="flex items-center justify-between rounded-lg border border-ink/10 bg-ink/5 px-2 py-1">
          <span className="text-xs text-neutral-300">Birden fazla bağlantıya izin ver</span>
          <div className="inline-flex rounded-lg border border-ink/15 bg-ink/5 p-0.5">
            <button type="button" aria-pressed={!prop.allowMultiple} onClick={() => toggle("allowMultiple", false)}
              className={`px-2 py-1 text-2xs rounded-lg transition focus:outline-none ${!prop.allowMultiple ? "bg-ink/10 text-neutral-100" : "text-neutral-300 hover:text-neutral-200"}`}
            >
              Hayır
            </button>
            <button type="button" aria-pressed={prop.allowMultiple} onClick={() => toggle("allowMultiple", true)}
              className={`px-2 py-1 text-2xs rounded-lg transition focus:outline-none ${prop.allowMultiple ? "bg-emerald-500/20 text-emerald-200" : "text-neutral-300 hover:text-neutral-200"}`}
            >
              Evet
            </button>
          </div>
        </div>
      )}
    </FieldShell>
  );
}

export function DisplayFormShortText({ question, questionNumber, description, required = false, inputType = "text", allowMultiple = false, disableAutoFill = false, identity, compact = false, value, onChange, missing = false }) {
  const { kind, user } = useRespondent();
  const isAuthed = kind === "user";
  // Etkinlik formunda doldurmayı FormDisplayer kapatır; tek başına "email" işareti girişli kişinin adresinin dolmasını engellemez.
  const skipFill = disableAutoFill || (Boolean(identity) && identity !== "email");

  const autoFilled = !skipFill && isAuthed && inputType === "name" && user?.fullName ? normalizeName(user.fullName) : null;

  const autoDefault = !skipFill && isAuthed && inputType === "email" && user?.email ? user.email : null;

  const [internalValue, setInternalValue] = useState(value || "");
  const [wasAutoFilled, setWasAutoFilled] = useState(false);
  const currentValue = value !== undefined ? value : internalValue;
  const isReadOnly = !!autoFilled;

  useEffect(() => {
    const initial = autoFilled || autoDefault;
    if (initial && onChange && value !== initial) {
      onChange({ target: { value: initial }, isDefault: true });
      if (autoDefault) setWasAutoFilled(true);
    }
  }, [autoFilled, autoDefault]);

  const currentTypeObj = INPUT_TYPES.find(t => t.id === inputType) || INPUT_TYPES[0];
  const htmlInputType = inputType === "name" ? "text" : inputType;

  const commit = (e) => {
    if (isReadOnly) return;
    const next = e.target.value;
    if (wasAutoFilled) setWasAutoFilled(false);
    if (onChange) onChange({ target: { value: next } });
    else setInternalValue(next);
  };

  const control = inputType === "link"
    ? <LinkAnswerInput allowMultiple={!!allowMultiple} required={required} value={value} onChange={onChange} />
    : (
      <Input icon={isReadOnly ? Lock : currentTypeObj.icon} type={htmlInputType} value={autoFilled || (currentValue ?? "")} onChange={commit} readOnly={isReadOnly}
        placeholder={currentTypeObj.placeholder} aria-required={required || undefined}
      />
    );

  if (compact) {
    return <CompactField question={question} required={required} missing={missing}>{control}</CompactField>;
  }

  // A locked name says where it came from instead of "Zorunlu alan"; a prefilled e-mail stays editable and says both
  return (
    <QuestionField question={question} questionNumber={questionNumber} description={description} required={required} missing={missing}
      hint={isReadOnly ? AUTOFILL_NOTE : undefined}
    >
      {control}
      {wasAutoFilled && !isReadOnly && <span className="text-2xs leading-relaxed text-subtle-foreground">{AUTOFILL_NOTE}</span>}
    </QuestionField>
  );
}
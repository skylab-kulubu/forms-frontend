"use client";

import { Fragment, useState } from "react";
import { Activity, ChevronRight, Copy, EyeOff, LayoutTemplate, Lock, PencilLine, RotateCcw, Send, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  MenuPill, PANEL_SECTION, PANEL_STACK, PanelButton, PanelNotice, PanelTextarea, SectionHeader, Switch, ToggleRow,
} from "@/app/admin/components/utils/SidePanel";
import { INPUT_TYPES } from "@/app/components/form-components/FormShortText";
import { AccountUploadHint, GuestUploadHint } from "@/app/components/form-components/FormFileUpload";
import { RepeaterFieldsEditor } from "@/app/components/form-components/FormRepeater";
import { LOCKED_OPTION_HINT } from "@/app/components/form-components/FieldShell";
import { isIdentityField } from "@/lib/event-handoff";
import { durationText, formatLongDate } from "@/lib/form-timing";
import { useGroupMutation } from "@/lib/hooks/useGroupAdmin";
import { useFormEditor } from "../form-editor/FormEditorContext";
import { LibrarySettings } from "../form-editor/components/LibrarySettings";
import { FlowPanel, StepPanel, useRouteFocus } from "../workflow-editor/components/WorkflowInspector";
import { isTimedNode } from "../workflow-editor/workflow-graph";
import { useFormActions } from "./useFormActions";
import { NONE, useStudio } from "./StudioContext";
import { CHOICE_PRESETS } from "./studio-presets";
import {
  NO_VALUE_OPERATORS, RETYPE_OPTIONS, conditionPhrase, defaultCondition, fieldLabel, fieldTypeOf, operatorsFor, questionNumbers, visibleFieldsOf,
} from "./studio-schema";

const SMALL_INPUT = "h-8 rounded-lg border border-white/10 bg-neutral-900/60 px-2.5 text-xs text-neutral-200 outline-none transition-[border-color,box-shadow] placeholder:text-neutral-600 focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20 [color-scheme:dark]";

export function Crumbs({ items }) {
  return (
    <div className="flex min-w-0 items-center gap-1">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <ChevronRight size={13} className="shrink-0 text-neutral-600" /> : null}
            {last || !item.onClick ? (
              <span className={`min-w-0 truncate ${last && !item.placeholder ? "text-neutral-200" : "text-neutral-500"} ${items.length > 1 && last ? "max-w-[62%] shrink-0" : ""}`}>
                {item.label}
              </span>
            ) : (
              <button type="button" onClick={item.onClick} title={item.label}
                className="min-w-10 max-w-32 shrink truncate rounded px-0.5 text-neutral-500 transition-colors hover:text-neutral-300"
              >
                {item.label}
              </button>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function KV({ label, hint, children }) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3 py-1.5">
      <div className="min-w-0">
        <p className="text-xs text-neutral-300">{label}</p>
        {hint ? <p className="text-3xs leading-snug text-neutral-500">{hint}</p> : null}
      </div>
      <div className="flex shrink-0 items-center gap-1.5">{children}</div>
    </div>
  );
}

function ShortTextSection({ field, actions, locked }) {
  const props = field.props ?? {};
  const current = props.inputType || "text";
  const canMarkCopy = !actions.eventLinked;

  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Cevap tipi" description="Giriş alanı ve ikon buna göre değişir. İsim ve e-posta, giriş yapan kişinin bilgileriyle dolar." />
      <div className="grid grid-cols-2 gap-1.5">
        {INPUT_TYPES.map((type) => (
          <button key={type.id} type="button" disabled={locked}
            onClick={() => actions.updateProps(field.id, { inputType: type.id, identity: type.id === "email" ? props.identity : undefined })}
            className={`flex h-8 items-center gap-2 rounded-lg border px-2.5 text-2xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              current === type.id ? "border-white/20 bg-white/10 text-skylab-300" : "border-white/8 bg-white/2 text-neutral-500 hover:bg-white/8 hover:text-neutral-300"
            }`}
          >
            <type.icon size={13} />
            {type.label}
          </button>
        ))}
      </div>
      {current === "email" && canMarkCopy ? (
        <div className="divide-y divide-white/5">
          <KV label="Cevap kopyası bu adrese gider" hint="Giriş yapmadan gönderenler cevabın kopyasını bu adrese alır.">
            <Switch checked={props.identity === "email"} label="Cevap kopyası"
              onChange={() => actions.updateProps(field.id, { identity: props.identity === "email" ? undefined : "email" })}
            />
          </KV>
        </div>
      ) : null}
      {current === "link" ? (
        <div className="divide-y divide-white/5">
          <KV label="Birden fazla bağlantı">
            <Switch checked={Boolean(props.allowMultiple)} label="Birden fazla bağlantı" onChange={() => actions.updateProps(field.id, { allowMultiple: !props.allowMultiple })} />
          </KV>
        </div>
      ) : null}
    </section>
  );
}

function ComboboxSection({ field, actions, lockedValues }) {
  const props = field.props ?? {};
  const choices = props.choices ?? [];
  const preset = CHOICE_PRESETS.find((item) => item.id === props.preset) ?? null;
  const options = [
    { value: "none", label: "Yok" },
    ...CHOICE_PRESETS.map((item) => ({
      value: item.id,
      label: item.label,
      disabled: !lockedValues.every((value) => item.data.includes(value)),
      hint: lockedValues.every((value) => item.data.includes(value)) ? null : "kilitli seçenek yok",
    })),
  ];

  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Seçenekler"
        description={preset ? `Hazır liste: ${preset.label}, ${choices.length} seçenek.` : `${choices.length} seçenek. Tuvalde sorunun altında düzenlenir; birden çok satır yapıştırınca her satır bir seçenek olur.`}
      />
      <div className="divide-y divide-white/5">
        <KV label="Hazır liste">
          <MenuPill value={preset?.id ?? "none"} options={options}
            onSelect={(value) => {
              if (value === "none") actions.updateProps(field.id, { preset: null, choices: lockedValues.length ? lockedValues : ["Seçenek 1", "Seçenek 2"] });
              else actions.updateProps(field.id, { preset: value, choices: CHOICE_PRESETS.find((item) => item.id === value).data });
            }}
          />
        </KV>
        <KV label="Serbest giriş" hint="Listede olmayan bir cevabı yazabilsin">
          <Switch checked={Boolean(props.allowCustom)} label="Serbest giriş" onChange={() => actions.updateProps(field.id, { allowCustom: !props.allowCustom })} />
        </KV>
      </div>
      {lockedValues.length > 0 ? (
        <p className="flex items-start gap-1.5 text-2xs leading-relaxed text-neutral-500"><Lock size={11} className="mt-0.5 shrink-0" />{lockedValues.length} seçenek akış koşulunda kullanılıyor; adı değiştirilemez ve silinemez.</p>
      ) : null}
    </section>
  );
}

function ToggleSection({ field, actions, lockedValues }) {
  const props = field.props ?? {};
  const trueLocked = lockedValues.includes(props.trueLabel || "Evet");
  const falseLocked = lockedValues.includes(props.falseLabel || "Hayır");

  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Etiketler" description="Başvuran anahtarı açıp kapatınca bu metinleri görür." />
      <div className="divide-y divide-white/5">
        <KV label="Açıkken" hint={trueLocked ? LOCKED_OPTION_HINT : null}>
          <input value={props.trueLabel ?? ""} readOnly={trueLocked} onChange={(event) => actions.updateProps(field.id, { trueLabel: event.target.value })} placeholder="Evet" className={`${SMALL_INPUT} w-28`} />
        </KV>
        <KV label="Kapalıyken" hint={falseLocked ? LOCKED_OPTION_HINT : null}>
          <input value={props.falseLabel ?? ""} readOnly={falseLocked} onChange={(event) => actions.updateProps(field.id, { falseLabel: event.target.value })} placeholder="Hayır" className={`${SMALL_INPUT} w-28`} />
        </KV>
      </div>
    </section>
  );
}

function SliderSection({ field, actions }) {
  const props = field.props ?? {};
  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Aralık" />
      <div className="divide-y divide-white/5">
        {[["En az", "min"], ["En çok", "max"], ["Artış", "step"]].map(([label, key]) => (
          <KV key={key} label={label}>
            <input type="number" value={props[key] ?? ""} onChange={(event) => actions.updateProps(field.id, { [key]: event.target.value === "" ? "" : Number(event.target.value) })}
              className={`${SMALL_INPUT} w-20 text-right`}
            />
          </KV>
        ))}
      </div>
    </section>
  );
}

function FileSection({ field, actions, anonymous }) {
  const props = field.props ?? {};
  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Dosya" description="Boş bırakılırsa PDF, JPG, PNG ve DOCX kabul edilir." />
      <div className="divide-y divide-white/5">
        <KV label="Türler">
          <input value={props.acceptedFiles ?? ""} onChange={(event) => actions.updateProps(field.id, { acceptedFiles: event.target.value })} placeholder=".pdf,.jpg" className={`${SMALL_INPUT} w-32`} />
        </KV>
        <KV label="En büyük boyut" hint="0 en büyük sınırı kullanır">
          <input type="number" min="0" value={props.maxSize ?? 0} onChange={(event) => actions.updateProps(field.id, { maxSize: Number(event.target.value) || 0 })} className={`${SMALL_INPUT} w-16 text-right`} />
          <span className="text-2xs text-neutral-500">MB</span>
        </KV>
      </div>
      <AccountUploadHint acceptedFiles={props.acceptedFiles} />
      {anonymous ? <GuestUploadHint acceptedFiles={props.acceptedFiles} maxSize={props.maxSize} /> : null}
    </section>
  );
}

function VisibilitySection({ field, fields, actions, disabledReason }) {
  const index = fields.findIndex((item) => item.id === field.id);
  const previous = fields.slice(0, index).filter((item) => item.type !== "separator");
  const condition = field.condition?.fieldId ? field.condition : null;
  const source = condition ? fields.find((item) => item.id === condition.fieldId) : null;
  const numbers = questionNumbers(fields);
  const operators = operatorsFor(source);
  const needsValue = condition && !NO_VALUE_OPERATORS.includes(condition.operator);
  const update = (patch) => actions.setCondition(field.id, { ...condition, ...patch });

  let valueControl = null;
  if (needsValue && source) {
    if (source.type === "combobox" || source.type === "multi_choice") {
      valueControl = (
        <MenuPill wide value={condition.value} placeholder="Seçenek seç" options={(source.props?.choices ?? []).map((choice) => ({ value: choice, label: choice }))}
          onSelect={(value) => update({ value })}
        />
      );
    } else if (source.type === "date" || source.type === "time") {
      valueControl = <input type={source.type} value={condition.value ?? ""} onChange={(event) => update({ value: event.target.value })} className={`${SMALL_INPUT} w-36`} />;
    } else {
      valueControl = (
        <input type={source.type === "slider" || source.props?.inputType === "number" ? "number" : "text"} value={condition.value ?? ""}
          onChange={(event) => update({ value: event.target.value })} placeholder="Değer" className={`${SMALL_INPUT} w-32 border-dashed`}
        />
      );
    }
  }

  const description = disabledReason
    ?? (!previous.length ? "Formun ilk sorusu bir koşula bağlanamaz."
      : condition ? `Soru yalnız ${numbers.get(condition.fieldId)}. soruda ${conditionPhrase(condition, fields) ?? "koşul sağlanınca"} görünür; öbür başvuranlar hiç görmez.`
        : "Soru herkese görünür.");

  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Görünürlük" description={description} />
      {previous.length && !disabledReason ? (
        <div className="divide-y divide-white/5">
          <KV label="Sadece belirli cevaplarda">
            <Switch checked={Boolean(condition)} label="Sadece belirli cevaplarda"
              onChange={() => actions.setCondition(field.id, condition ? null : defaultCondition([...previous].reverse().find((item) => item.type === "combobox" || item.type === "multi_choice") ?? previous[previous.length - 1]))}
            />
          </KV>
          {condition ? (
            <>
              <KV label="Soru">
                <MenuPill wide value={condition.fieldId} options={previous.map((item) => ({ value: item.id, label: `${numbers.get(item.id)} · ${fieldLabel(item)}` }))}
                  onSelect={(id) => actions.setCondition(field.id, defaultCondition(fields.find((item) => item.id === id)))}
                />
              </KV>
              <KV label="Koşul">
                <MenuPill wide value={condition.operator} options={operators.map((operator) => ({ value: operator.value, label: operator.label }))}
                  onSelect={(operator) => update({ operator, value: NO_VALUE_OPERATORS.includes(operator) ? "" : condition.value })}
                />
              </KV>
              {needsValue ? <KV label="Değer">{valueControl}</KV> : null}
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

function QuestionInspector({ field, fields, actions, anonymous, onDuplicate, onRemove, onToast }) {
  const isSeparator = field.type === "separator";
  const locked = actions.lockedById.get(field.id) ?? null;
  const identity = actions.eventLinked && isIdentityField(field);
  const lockedValues = locked?.values ?? [];
  const protectedReason = locked ? "Akış koşulu bu soruyu okuyor; tipi değişmez ve silinemez." : identity ? "Etkinlik kimlik alanı; tipi ve zorunluluğu değişmez." : null;

  let typeSection = null;
  if (field.type === "short_text") typeSection = <ShortTextSection field={field} actions={actions} locked={identity} />;
  else if (field.type === "combobox") typeSection = <ComboboxSection field={field} actions={actions} lockedValues={lockedValues} />;
  else if (field.type === "multi_choice") {
    typeSection = (
      <section className={PANEL_SECTION}>
        <SectionHeader title="Seçenekler"
          description={`${(field.props?.choices ?? []).length} seçenek. Tuvalde düzenlenir: Enter yeni seçenek açar, boş seçenekte Backspace siler, birden çok satır yapıştırınca her satır bir seçenek olur.`}
        />
        {lockedValues.length > 0 ? (
          <p className="flex items-start gap-1.5 text-2xs leading-relaxed text-neutral-500"><Lock size={11} className="mt-0.5 shrink-0" />{lockedValues.length} seçenek akış koşulunda kullanılıyor; adı değiştirilemez ve silinemez.</p>
        ) : null}
      </section>
    );
  } else if (field.type === "toggle") typeSection = <ToggleSection field={field} actions={actions} lockedValues={lockedValues} />;
  else if (field.type === "slider") typeSection = <SliderSection field={field} actions={actions} />;
  else if (field.type === "file") typeSection = <FileSection field={field} actions={actions} anonymous={anonymous} />;
  else if (field.type === "matrix") {
    typeSection = (
      <section className={PANEL_SECTION}>
        <SectionHeader title="Tablo" description={`${(field.props?.rows ?? []).length} satır, ${(field.props?.columns ?? []).length} sütun. Soru seçiliyken satır ve sütun adlarını tuvalde yazarsın; her satıra bir cevap verilir.`} />
      </section>
    );
  } else if (field.type === "repeater") {
    typeSection = (
      <section className={PANEL_SECTION}>
        <SectionHeader title="Her kayıtta tekrar eden alanlar" description="Başvuran bu alanların bir kopyasını istediği kadar ekler." />
        <RepeaterFieldsEditor heading={false} fields={field.props?.fields} onChange={(next) => actions.updateProps(field.id, { fields: next })} />
      </section>
    );
  }

  return (
    <div className={PANEL_STACK}>
      <section className={PANEL_SECTION}>
        <SectionHeader title={isSeparator ? "Ayıraç" : "Soru ayarları"}
          description={isSeparator ? "Başlığı ve açıklamayı tuvalde yazarsın. Ayıraç numara almaz, cevap toplamaz." : protectedReason}
        />
        <div className="divide-y divide-white/5">
          <KV label="Tip">
            {locked || identity ? (
              <span className="inline-flex items-center gap-1 text-2xs text-neutral-400"><Lock size={11} />{fieldTypeOf(field).label}</span>
            ) : (
              <MenuPill wide value={field.type} options={RETYPE_OPTIONS}
                onSelect={(type) => {
                  const removed = actions.retype(field.id, type);
                  if (removed > 0) onToast(`${removed} sorunun koşulu kaldırıldı`);
                }}
              />
            )}
          </KV>
          {isSeparator ? null : (
            <KV label="Zorunlu" hint={field.props?.required ? "Boş bırakılırsa gönderilemez" : "Boş bırakılabilir"}>
              <Switch checked={Boolean(field.props?.required)} disabled={identity} label="Zorunlu" onChange={() => actions.setRequired([field.id], !field.props?.required)} />
            </KV>
          )}
        </div>
      </section>

      {typeSection}

      {isSeparator ? null : (
        <VisibilitySection field={field} fields={fields} actions={actions} disabledReason={identity ? "Etkinlik kimlik alanı her zaman görünür." : null} />
      )}

      <section className={PANEL_SECTION}>
        <div className="flex flex-wrap gap-2">
          <PanelButton icon={Copy} onClick={() => onDuplicate([field.id])} disabled={identity} className="min-w-fit flex-1">Çoğalt</PanelButton>
          <PanelButton icon={Trash2} danger onClick={() => onRemove([field.id])} disabled={Boolean(locked || identity)} className="min-w-fit flex-1">Sil</PanelButton>
        </div>
        <p className="text-3xs text-neutral-600">Ctrl+D çoğaltır, Delete siler, Alt+↑↓ taşır, Enter soru metnine geçer.</p>
      </section>
    </div>
  );
}

function MultiInspector({ ids, fields, actions, onDuplicate, onRemove }) {
  const [templateTitle, setTemplateTitle] = useState("");
  const [savingOpen, setSavingOpen] = useState(false);
  const { mutate: saveGroup, isPending } = useGroupMutation();
  const queryClient = useQueryClient();
  const { actions: studio } = useStudio();
  const selected = fields.filter((field) => ids.includes(field.id));
  const numbers = questionNumbers(fields);
  const questions = selected.filter((field) => field.type !== "separator");
  const allRequired = questions.length > 0 && questions.every((field) => field.props?.required);
  const someRequired = questions.some((field) => field.props?.required);

  const saveTemplate = () => {
    const title = templateTitle.trim() || `${selected.length} bileşenlik şablon`;
    const schema = selected.map((field) => {
      const { condition, ...rest } = field;
      const keep = condition && ids.includes(condition.fieldId);
      return keep ? field : rest;
    });
    saveGroup({ id: null, isUpdate: false, payload: { Id: null, Title: title, Description: "", Schema: schema } }, {
      onSuccess: () => {
        studio.toast(`${title} şablonu kaydedildi; Ekle menüsünden eklersin`);
        setSavingOpen(false);
        setTemplateTitle("");
        queryClient.invalidateQueries({ queryKey: ["groups"] });
      },
      onError: () => studio.toast("Şablon kaydedilemedi", "red"),
    });
  };

  return (
    <div className={PANEL_STACK}>
      <section className={PANEL_SECTION}>
        <SectionHeader title={`${selected.length} bileşen seçili`} description="Shift ile tıklayarak ekleyip çıkarırsın; Esc seçimi bırakır." />
        <div className="space-y-0.5">
          {selected.map((field) => {
            const type = fieldTypeOf(field);
            return (
              <div key={field.id} className="flex items-center gap-2 rounded-md px-1 py-1 text-xs text-neutral-300">
                <span className="w-4 text-right text-3xs tabular-nums text-neutral-600">{numbers.get(field.id) ?? ""}</span>
                <type.Icon size={13} className="text-neutral-500" />
                <span className="truncate">{fieldLabel(field)}</span>
              </div>
            );
          })}
        </div>
        {questions.length > 0 ? (
          <div className="divide-y divide-white/5">
            <KV label="Hepsi zorunlu" hint={someRequired && !allRequired ? "Şu an karışık" : null}>
              <Switch checked={allRequired} label="Hepsi zorunlu" onChange={() => actions.setRequired(ids, !allRequired)} />
            </KV>
          </div>
        ) : null}
      </section>
      <section className={PANEL_SECTION}>
        <div className="flex flex-col gap-2">
          {savingOpen ? (
            <div className="flex gap-2">
              <input autoFocus value={templateTitle} onChange={(event) => setTemplateTitle(event.target.value)} placeholder="Şablon adı"
                onKeyDown={(event) => { if (event.key === "Enter") saveTemplate(); if (event.key === "Escape") setSavingOpen(false); }}
                className={`${SMALL_INPUT} min-w-0 flex-1`}
              />
              <PanelButton onClick={saveTemplate} disabled={isPending}>{isPending ? "Kaydediliyor" : "Kaydet"}</PanelButton>
            </div>
          ) : (
            <PanelButton icon={LayoutTemplate} onClick={() => setSavingOpen(true)}>Şablon olarak kaydet</PanelButton>
          )}
          <div className="flex gap-2">
            <PanelButton icon={Copy} onClick={() => onDuplicate(ids)} className="flex-1">Çoğalt</PanelButton>
            <PanelButton icon={Trash2} danger onClick={() => onRemove(ids)} className="flex-1">Sil</PanelButton>
          </div>
        </div>
        <p className="text-3xs leading-relaxed text-neutral-600">Şablon, Şablonlar sayfasına düşer; başka bir formda Ekle menüsünden eklenir.</p>
      </section>
    </div>
  );
}

function TaskInspector({ task, timeLimitMinutes, closesAt, actions, onOpenTiming }) {
  const [confirming, setConfirming] = useState(false);
  const { actions: studio } = useStudio();

  return (
    <div className={PANEL_STACK}>
      <section className={PANEL_SECTION}>
        <SectionHeader title="Görev"
          description={timeLimitMinutes
            ? "Görev metni tuvalde Markdown ile yazılır. Kişisel süre açık: aday görevi başlatınca metin ve sorular açılır."
            : "Görev metni tuvalde Markdown ile yazılır ve formun başında görünür."}
        />
        <div className="divide-y divide-white/5">
          <KV label="Uzun metni katla">
            <Switch checked={task.collapsible !== false} label="Uzun metni katla" onChange={() => actions.setTask({ ...task, collapsible: task.collapsible === false })} />
          </KV>
          <KV label="Aday metni .md olarak indirebilsin">
            <Switch checked={task.downloadable !== false} label="İndirilebilir" onChange={() => actions.setTask({ ...task, downloadable: task.downloadable === false })} />
          </KV>
        </div>
        <div className="flex items-center justify-between gap-3 text-2xs text-neutral-500">
          <span>
            {timeLimitMinutes
              ? `Kişisel süre: başlatınca ${durationText(timeLimitMinutes)}${closesAt ? ` · son başlama ${formatLongDate(closesAt)}` : ""}`
              : closesAt ? `Kapanış: ${formatLongDate(closesAt)}` : "Süre yok; form sen kapatana kadar açık kalır."}
          </span>
          <button type="button" onClick={onOpenTiming} className="shrink-0 text-neutral-300 underline decoration-white/20 underline-offset-3 transition-colors hover:text-neutral-100">
            Zamanlama
          </button>
        </div>
      </section>
      <section className={PANEL_SECTION}>
        {confirming ? (
          <div className="flex flex-wrap items-center gap-2 text-2xs">
            <span className="text-neutral-300">Görev metni silinecek.</span>
            <PanelButton danger onClick={() => { actions.setTask(null); studio.select(NONE); studio.toast("Görev kaldırıldı. Ctrl+Z ile geri getirebilirsin."); }}>Kaldır</PanelButton>
            <PanelButton onClick={() => setConfirming(false)}>Vazgeç</PanelButton>
          </div>
        ) : (
          <PanelButton icon={Trash2} danger onClick={() => (task.content?.trim() ? setConfirming(true) : (actions.setTask(null), studio.select(NONE)))}>Görevi kaldır</PanelButton>
        )}
      </section>
    </div>
  );
}

function FillInspector({ fields, values }) {
  const { actions: studio } = useStudio();
  const numbers = questionNumbers(fields);
  const visible = visibleFieldsOf(fields, values);
  const hidden = fields.filter((field) => !visible.includes(field));
  const visibleQuestions = visible.filter((field) => field.type !== "separator").length;

  return (
    <div className={PANEL_STACK}>
      <section className={PANEL_SECTION}>
        <SectionHeader title="Doldurma" description="Form başvuran gibi doldurulur. Cevaplar hiçbir yere kaydedilmez, dosya yüklenmez." />
        <div className="divide-y divide-white/5">
          <KV label="Görünen soru"><span className="text-xs tabular-nums text-neutral-300">{visibleQuestions}</span></KV>
          <KV label="Koşul yüzünden gizli"><span className="text-xs tabular-nums text-neutral-300">{hidden.length}</span></KV>
        </div>
        {hidden.length > 0 ? (
          <div className="space-y-1.5">
            {hidden.map((field) => (
              <p key={field.id} className="flex items-start gap-1.5 text-2xs leading-relaxed text-neutral-500">
                <EyeOff size={11} className="mt-0.5 shrink-0" />
                <span>
                  <span className="text-neutral-300">{numbers.get(field.id) ? `${numbers.get(field.id)}. ` : ""}{fieldLabel(field)}</span>
                  {field.condition ? `: ${numbers.get(field.condition.fieldId)}. soruda ${conditionPhrase(field.condition, fields) ?? "koşul sağlanınca"}` : ""}
                </span>
              </p>
            ))}
          </div>
        ) : null}
      </section>
      <section className={PANEL_SECTION}>
        <div className="flex flex-col gap-2">
          <PanelButton icon={RotateCcw} onClick={studio.clearFill}>Cevapları temizle</PanelButton>
          <PanelButton icon={PencilLine} onClick={studio.toggleFill}>Düzenlemeye dön</PanelButton>
        </div>
      </section>
    </div>
  );
}

function FlowStepSection({ flow }) {
  const { wf, node, onOpenRoutes } = flow;
  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Akış adımı" pill={wf.isLive ? "Canlı" : "Taslak"} pillTone={wf.isLive ? "emerald" : "neutral"}
        description={`${wf.state.name || "Bu akış"} akışının ${node.isStart ? "başlangıç adımı" : "bir adımı"}. Yönlendirmeleri kartın altından ya da buradan değiştirirsin.`}
      />
      <ToggleRow title="Manuel onay" checked={node.requiresManualReview}
        description={node.requiresManualReview ? "Cevap yetkili onayını bekler; onaylanınca ve reddedilince ayrı yönlendirilir." : "Cevap gönderilince onay beklemeden sonraki adıma geçer."}
        onChange={() => wf.dispatch({ type: "SET_NODE_REVIEW", nodeKey: node.nodeKey, value: !node.requiresManualReview })}
      />
      <PanelButton icon={ChevronRight} onClick={onOpenRoutes} className="w-full">Yönlendirmeler</PanelButton>
    </section>
  );
}

function RulesSection({ wf }) {
  const { state, dispatch } = wf;
  const hasTimedStep = state.nodes.some(isTimedNode);
  const locked = hasTimedStep && !state.allowMultipleRuns;

  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Kurallar" pill={wf.isLive ? "Canlı" : "Taslak"} pillTone={wf.isLive ? "emerald" : "neutral"}
        description="Başvuru kabulü, yeni başvurular ve otomatik kapanış akış sayfasında; burada akışın kuralları var."
      />
      <input value={state.name ?? ""} onChange={(event) => dispatch({ type: "SET_META", key: "name", value: event.target.value })}
        placeholder="Akış adı" aria-label="Akış adı" className={`${SMALL_INPUT} w-full text-sm font-semibold`}
      />
      <ToggleRow title="Tekrar başlatma" checked={state.allowMultipleRuns} disabled={locked} dimmed={locked}
        description={locked ? "Kişisel süreli adım varken kullanılamaz." : state.allowMultipleRuns ? "Aynı kişi akışı tekrar başlatabilir; adımlarda kişisel süre kullanılamaz." : "Aynı kişi akışı birden fazla kez başlatabilsin."}
        onChange={() => dispatch({ type: "SET_META", key: "allowMultipleRuns", value: !state.allowMultipleRuns })}
      />
      <PanelTextarea rows={3} value={state.description ?? ""} aria-label="Akış açıklaması" placeholder="Akış ne için kullanılıyor? Ekip arkadaşların görür."
        onChange={(event) => dispatch({ type: "SET_META", key: "description", value: event.target.value })}
      />
    </section>
  );
}

function PublishSection({ flow }) {
  const { wf, onRequestPublish, onOpenFlowPage } = flow;
  const canPublish = Boolean(wf.state.id) && wf.state.nodes.length > 0 && wf.hasDraft;

  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Yayın"
        description={wf.hasDraft
          ? wf.isLive ? "Yayınlanmamış değişiklik var. Başvuranlar yayınlanana kadar önceki sürümü görür." : "Yayınlanana kadar başvuranlar akışı görmez."
          : "Yayındaki sürüm güncel."}
      />
      <div className="flex flex-col gap-2">
        <PanelButton icon={Send} onClick={onRequestPublish} disabled={!canPublish}>Akışı yayınla</PanelButton>
        {wf.state.id ? <PanelButton icon={Activity} onClick={onOpenFlowPage}>Akış sayfasına git</PanelButton> : null}
      </div>
      {wf.issues.length > 0 ? <PanelNotice tone="red">Yayınlamayı engelleyen {wf.issues.length} sorun var. Başlıktaki sorun düğmesi listeyi açar.</PanelNotice> : null}
    </section>
  );
}

export function FlowRootBody({ flow, picker, ownershipControl }) {
  const { wf, onOpenForm } = flow;
  return (
    <FlowPanel state={wf.state} dispatch={wf.dispatch} schemasByFormId={wf.schemasByFormId} versions={wf.versions} picker={picker}
      rules={<RulesSection wf={wf} />} footer={<PublishSection flow={flow} />} ownershipControl={ownershipControl}
      onOpenStep={(node) => onOpenForm(node.formId)}
      stepsDescription="Başlangıçtan itibaren akıştaki sırasıyla. Birine tıklayınca formu tuvalde açılır."
    />
  );
}

export function RoutesBody({ flow, node }) {
  const { wf, onOpenForm } = flow;
  const focus = useRouteFocus(wf.state, wf.dispatch);
  return (
    <StepPanel selectedNode={node} state={wf.state} dispatch={wf.dispatch} schemasByFormId={wf.schemasByFormId} issuesByNode={wf.issuesByNode}
      openKey={focus.openKey} setOpenKey={focus.setOpenKey} flashKey={focus.flashKey} onOpenForm={onOpenForm}
    />
  );
}

export function FormInspectorBody({ eventLinked = false, flow = null, focusTiming = 0, managedActions = {} }) {
  const { state } = useFormEditor();
  const actions = useFormActions({ eventLinked });
  const { ui, actions: studio } = useStudio();
  const fields = state.schema;
  const formKey = ui.activeFormId ?? "new";
  const selection = ui.selection;

  const duplicate = (ids) => {
    const copies = actions.duplicate(ids);
    if (copies.length) studio.select({ kind: "fields", ids: copies });
  };

  const remove = (ids) => {
    const result = actions.remove(ids);
    if (result.removed === 0) {
      if (result.blocked) studio.toast("Bu soru silinemez", "red");
      return;
    }
    studio.select(NONE);
    studio.toast(result.cleared ? `${result.removed} bileşen silindi; ${result.cleared} sorunun koşulu kaldırıldı` : `${result.removed} bileşen silindi. Ctrl+Z geri alır.`);
  };

  if (ui.fill) return <FillInspector fields={fields} values={ui.fillValues[formKey] ?? {}} />;

  if (selection.kind === "task" && state.task) {
    return <TaskInspector task={state.task} timeLimitMinutes={state.timeLimitMinutes} closesAt={state.closesAt} actions={actions} onOpenTiming={() => studio.select({ kind: "none", focusTiming: Date.now() })} />;
  }

  const ids = selection.kind === "fields" ? selection.ids.filter((id) => fields.some((field) => field.id === id)) : [];
  if (ids.length > 1) return <MultiInspector ids={ids} fields={fields} actions={actions} onDuplicate={duplicate} onRemove={remove} />;
  if (ids.length === 1) {
    const field = fields.find((item) => item.id === ids[0]);
    return (
      <QuestionInspector key={field.id} field={field} fields={fields} actions={actions} anonymous={state.allowAnonymousResponses}
        onDuplicate={duplicate} onRemove={remove} onToast={studio.toast}
      />
    );
  }

  return (
    <>
      {flow?.node ? (
        <div className="px-4 pt-4"><FlowStepSection flow={flow} /></div>
      ) : null}
      <LibrarySettings focusTiming={selection.focusTiming ?? focusTiming} eventLinked={eventLinked} hideMembership={Boolean(flow)} managedActions={managedActions} />
    </>
  );
}

export function formCrumb(state) {
  return state.title?.trim() || "Adsız form";
}

export function selectionCrumb(selection, fields) {
  if (selection.kind === "task") return "Görev";
  if (selection.kind === "routes") return "Yönlendirme";
  if (selection.kind !== "fields") return null;
  const ids = selection.ids.filter((id) => fields.some((field) => field.id === id));
  if (ids.length > 1) return `${ids.length} bileşen`;
  if (ids.length === 1) {
    const field = fields.find((item) => item.id === ids[0]);
    return field.type === "separator" ? "Ayıraç" : `${questionNumbers(fields).get(field.id)}. soru`;
  }
  return null;
}

"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown, ArrowRight, ArrowUp, Check, ChevronDown, ChevronRight, CornerDownRight, ExternalLink, Flag, LayoutGrid,
  Plus, Trash2, X,
} from "lucide-react";
import { Dropdown } from "@/app/components/utils/Dropdown";
import { Floating } from "@/app/components/utils/Floating";
import AddStepPicker from "./AddStepPicker";
import { WORKFLOW_INTAKE } from "@/lib/form-settings";
import { EMPTY_RULE } from "../WorkflowEditorContext";
import { TRIGGER, connectionError, depthMap, flowOrder, groupTransitions, guaranteedAncestors, triggersForNode } from "../workflow-graph";
import {
  COMPARISON_LABEL, CONDITIONABLE_TYPES, CONNECTION_COPY, MULTI_VALUE_COMPARISONS, VALUELESS_COMPARISONS,
  comparisonsForField, fieldQuestionLabel, optionsForField, validationAction, validationMessage,
} from "../workflow-copy";

const END_VALUE = "__end";
const FLASH_MS = 1200;

const TRIGGER_SECTION = {
  [TRIGGER.SUBMITTED]: { label: "Gönderildiğinde", description: "Cevap gönderilince başvuru nereye gider?", dot: "bg-neutral-500" },
  [TRIGGER.APPROVED]: { label: "Onaylandığında", description: "Cevap onaylanınca başvuru nereye gider?", dot: "bg-emerald-400" },
  [TRIGGER.DECLINED]: { label: "Reddedildiğinde", description: "Cevap reddedilince başvuru nereye gider?", dot: "bg-red-400" },
};

const PILL_TONE = {
  skylab: "border-skylab-400/30 text-skylab-300/80",
  neutral: "border-white/10 text-neutral-400",
  amber: "border-amber-400/35 text-amber-300",
  red: "border-red-400/35 text-red-300",
};

const INTAKE_STATE = {
  [WORKFLOW_INTAKE.OPEN]: { pill: "Açık", tone: "skylab" },
  [WORKFLOW_INTAKE.NEW_RUNS_CLOSED]: { pill: "Yeni başvuru kapalı", tone: "amber" },
  [WORKFLOW_INTAKE.CLOSED]: { pill: "Kapalı", tone: "red" },
};

const BULK = "group flex items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-2xs font-medium text-neutral-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 disabled:pointer-events-none disabled:opacity-40";
const BULK_TONE = "hover:border-skylab-400/30 hover:bg-skylab-500/10 hover:text-skylab-300";
const BULK_DANGER = "hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-300";
const BULK_ICON = "shrink-0 text-neutral-400 transition-colors group-hover:text-current";
const ROW = "rounded-xl border bg-neutral-900/40 shadow-sm transition-[border-color,box-shadow] duration-200";
const TILE = "grid size-9 shrink-0 place-items-center rounded-lg border bg-neutral-900/60 text-xs font-semibold";
const INLINE_INPUT = "w-24 min-w-0 border-b border-dotted border-white/25 bg-transparent px-0.5 py-0.5 text-2xs text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-skylab-400/60";

function linkClass(active = false) {
  return `rounded text-3xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 disabled:cursor-not-allowed disabled:opacity-35 ${
    active ? "text-skylab-300" : "text-neutral-500 hover:text-neutral-200 disabled:hover:text-neutral-500"
  }`;
}

function questionsOf(schema) {
  return (Array.isArray(schema) ? schema : []).filter((field) => CONDITIONABLE_TYPES.includes(field?.type));
}

function targetOptions(sourceNode, nodes, transitions) {
  return [
    ...nodes
      .filter((node) => node.nodeKey !== sourceNode.nodeKey)
      .map((node) => {
        const error = connectionError(sourceNode.nodeKey, node.nodeKey, nodes, transitions);
        return { value: node.nodeKey, label: node.formTitle, disabled: Boolean(error), hint: error ? CONNECTION_COPY[error].hint : null };
      }),
    { value: END_VALUE, label: "Akış biter" },
  ];
}

function useScrollIntoView(active) {
  const ref = useRef(null);
  useEffect(() => {
    if (active) ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [active]);
  return ref;
}

function SectionHeader({ title, description, pill, pillTone = "skylab", dot }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="flex items-center gap-2 font-semibold text-neutral-100">
          {dot ? <span className={`size-1.5 shrink-0 rounded-full ${dot}`} /> : null}
          <span className="min-w-0 truncate">{title}</span>
        </p>
        {description ? <p className="mt-1 text-2xs leading-relaxed text-neutral-500">{description}</p> : null}
      </div>
      {pill ? (
        <span className={`shrink-0 rounded-full border px-3 py-0.5 text-3xs font-semibold uppercase tracking-[0.18em] ${PILL_TONE[pillTone]}`}>{pill}</span>
      ) : null}
    </div>
  );
}

function Switch({ checked, onChange, label, disabled = false }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={onChange} disabled={disabled}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border px-1 transition disabled:cursor-not-allowed ${checked ? "border-skylab-400/50 bg-skylab-400/20" : "border-white/10 bg-white/5"}`}
    >
      <span className={`h-5 w-5 rounded-full bg-white/90 shadow transition-transform duration-200 ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );
}

function ToggleRow({ title, description, checked, onChange, disabled = false, dimmed = false }) {
  return (
    <div className={`flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5 transition-opacity duration-300 ${dimmed ? "opacity-40" : ""}`}>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-neutral-100">{title}</p>
        <p className="text-3xs text-neutral-500">{description}</p>
      </div>
      <Switch checked={checked} onChange={onChange} disabled={disabled} label={title} />
    </div>
  );
}

function IntakeSection({ intakeControl, allowMultipleRuns, onToggleMultipleRuns }) {
  const intake = intakeControl?.intake ?? WORKFLOW_INTAKE.OPEN;
  const info = intakeControl ? INTAKE_STATE[intake] ?? INTAKE_STATE[WORKFLOW_INTAKE.OPEN] : { pill: "Taslak", tone: "neutral" };
  const isOpen = intake !== WORKFLOW_INTAKE.CLOSED;
  const acceptsNewRuns = intake === WORKFLOW_INTAKE.OPEN;

  return (
    <section className="space-y-4 py-6 first:pt-0">
      <SectionHeader title="Başvuru durumu" pill={info.pill} pillTone={info.tone}
        description={intakeControl
          ? "Akışı tamamen ya da yalnız yeni başvurulara kapatabilirsin."
          : "Akış yayınlanınca başvuru kabulünü de buradan yönetirsin."}
      />

      <div className="space-y-3">
        {intakeControl && (
          <>
            <ToggleRow title="Başvuru kabulü" checked={isOpen} disabled={intakeControl.isPending}
              description="Kapatınca bütün adımlar durur; devam eden başvurular da bekler."
              onChange={() => (isOpen ? intakeControl.onRequestClose() : intakeControl.onChange(WORKFLOW_INTAKE.OPEN))}
            />
            <ToggleRow title="Yeni başvurular" checked={acceptsNewRuns} disabled={intakeControl.isPending || !isOpen} dimmed={!isOpen}
              description="Kapatınca kimse yeni başvuru başlatamaz; devam edenler sürer."
              onChange={() => intakeControl.onChange(acceptsNewRuns ? WORKFLOW_INTAKE.NEW_RUNS_CLOSED : WORKFLOW_INTAKE.OPEN)}
            />
          </>
        )}
        <ToggleRow title="Tekrar başlatma" checked={allowMultipleRuns}
          description="Aynı kişi akışı birden fazla kez başlatabilsin."
          onChange={onToggleMultipleRuns}
        />
      </div>

      {intakeControl && intake !== WORKFLOW_INTAKE.OPEN && (
        <div className="rounded-lg border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-xs text-amber-100 shadow-sm">
          {intake === WORKFLOW_INTAKE.CLOSED
            ? "Akış kapalı. Başvuranlar kapalı ekranını görür; devam eden başvurular akış açılınca kaldığı yerden sürer."
            : "Yeni başvuru alınmıyor. Başlamış başvurular normal şekilde devam ediyor."}
        </div>
      )}

      {intakeControl?.isError && <p className="text-2xs text-red-300">Başvuru durumu değiştirilemedi. Lütfen tekrar deneyin.</p>}
    </section>
  );
}

function TargetMenu({ value, options, onSelect, onDelete, deleteHint, open: controlledOpen, onOpenChange }) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = onOpenChange ?? setUncontrolledOpen;
  const anchorRef = useRef(null);

  const current = options.find((option) => option.value === value);
  const isEnd = value === END_VALUE;
  const stop = (event) => event.stopPropagation();

  const choose = (option) => {
    if (option.disabled) return;
    setOpen(false);
    if (option.value !== value) onSelect(option.value);
  };

  return (
    <>
      <button ref={anchorRef} type="button" aria-haspopup="menu" aria-expanded={open}
        onClick={(event) => { event.stopPropagation(); setOpen(!open); }} onKeyDown={stop}
        className={`flex max-w-36 shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1 text-2xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${isEnd ? "italic" : ""} ${
          open ? "border-white/20 bg-[#1e1e1e] text-neutral-50"
            : `border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10 hover:text-neutral-50 ${isEnd ? "text-neutral-400" : "text-neutral-300"}`
        }`}
      >
        <span className="truncate">{current?.label ?? "Akış biter"}</span>
        <ChevronDown size={11} className={`shrink-0 opacity-70 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <Floating anchor={anchorRef} onDismiss={() => setOpen(false)} placement="bottom-end" offset={6}>
            <motion.div role="menu" onClick={stop} onKeyDown={stop}
              initial={{ opacity: 0, y: 4, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98 }}
              transition={{ duration: 0.1 }}
              className="max-h-72 min-w-44 max-w-64 overflow-y-auto rounded-[10px] border border-white/20 bg-[#1e1e1e] p-1.5 shadow-xl scrollbar"
            >
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button key={option.value} type="button" role="menuitem" disabled={option.disabled} onClick={() => choose(option)}
                    className={`flex w-full items-center justify-between gap-2.5 rounded-md px-2 py-1.5 text-left text-2xs transition-colors ${
                      option.disabled ? "cursor-not-allowed text-neutral-600"
                        : isSelected ? "bg-skylab-500/10 text-skylab-300"
                        : "text-neutral-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected ? <Check size={12} className="shrink-0" /> : option.hint ? <span className="shrink-0 text-3xs text-neutral-600">{option.hint}</span> : null}
                  </button>
                );
              })}

              {onDelete !== undefined && (
                <>
                  <div className="mx-1 my-1 h-px bg-white/10" />
                  <button type="button" role="menuitem" disabled={!onDelete} onClick={() => { setOpen(false); onDelete?.(); }}
                    className="flex w-full flex-col items-start rounded-md px-2 py-1.5 text-left text-2xs text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 disabled:cursor-not-allowed disabled:text-neutral-600 disabled:hover:bg-transparent"
                  >
                    Yönlendirmeyi sil
                    {!onDelete && deleteHint ? <span className="text-3xs text-neutral-600">{deleteHint}</span> : null}
                  </button>
                </>
              )}
            </motion.div>
          </Floating>
        )}
      </AnimatePresence>
    </>
  );
}

function RuleLine({ rule, index, ruleCount, operatorWord, sourceNode, nodes, transitions, schemasByFormId, onChange, onRemove }) {
  const ancestors = guaranteedAncestors(sourceNode.nodeKey, nodes, transitions);
  const ruleNode = rule.nodeKey ? nodes.find((node) => node.nodeKey === rule.nodeKey) : sourceNode;
  const questions = questionsOf(schemasByFormId[ruleNode?.formId]?.schema);
  const field = questions.find((item) => item.id === rule.questionId) ?? null;
  const comparisons = comparisonsForField(field);
  const options = optionsForField(field);

  const comparison = Number(rule.comparison);
  const isValueless = VALUELESS_COMPARISONS.includes(comparison);
  const isMultiValue = MULTI_VALUE_COMPARISONS.includes(comparison);
  const selectedValues = Array.isArray(rule.values) ? rule.values : [];

  const handleQuestionChange = (questionId) => {
    const nextField = questions.find((item) => item.id === questionId) ?? null;
    const nextComparisons = comparisonsForField(nextField);
    onChange({ questionId, comparison: nextComparisons.includes(comparison) ? comparison : nextComparisons[0], value: "", values: null });
  };

  const toggleValue = (option) => {
    const next = selectedValues.includes(option) ? selectedValues.filter((item) => item !== option) : [...selectedValues, option];
    onChange({ values: next, value: "" });
  };

  return (
    <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5 text-2xs leading-6.5 text-neutral-400">
      <span className="w-8 shrink-0 text-neutral-500">{index === 0 ? "Eğer" : operatorWord}</span>

      {ancestors.length > 0 && (
        <Dropdown variant="inline" tone="text-neutral-300" value={rule.nodeKey ?? ""}
          options={[{ value: "", label: "bu adımda" }, ...ancestors.map((node) => ({ value: node.nodeKey, label: `${node.formTitle} adımında` }))]}
          onChange={(value) => onChange({ nodeKey: value || null, questionId: "", value: "", values: null })}
        />
      )}

      <Dropdown variant="inline" tone="text-skylab-300" value={rule.questionId} placeholder="soru seç"
        options={questions.map((item) => ({ value: item.id, label: fieldQuestionLabel(item) }))}
        onChange={handleQuestionChange}
      />

      {field && (
        <Dropdown variant="inline" tone="text-neutral-300" value={comparison}
          options={comparisons.map((item) => ({ value: item, label: COMPARISON_LABEL[item] }))}
          onChange={(value) => onChange({ comparison: Number(value), value: "", values: null })}
        />
      )}

      {!field || isValueless ? null : isMultiValue && options.length > 0 ? (
        <span className="flex w-full flex-wrap gap-1 pb-0.5 pl-9">
          {options.map((option) => {
            const active = selectedValues.includes(option);
            return (
              <button key={option} type="button" onClick={() => toggleValue(option)}
                className={`max-w-full truncate rounded-full border px-2 py-px text-3xs leading-4 transition-colors ${
                  active ? "border-skylab-400/40 bg-skylab-500/15 text-skylab-300" : "border-white/10 text-neutral-500 hover:text-neutral-200"
                }`}
              >
                {option}
              </button>
            );
          })}
        </span>
      ) : options.length > 0 ? (
        <Dropdown variant="inline" value={rule.value ?? ""} placeholder="değer seç"
          options={options.map((option) => ({ value: option, label: option }))}
          onChange={(value) => onChange({ value })}
        />
      ) : (
        <input type={field.type === "slider" ? "number" : "text"} value={rule.value ?? ""} onChange={(event) => onChange({ value: event.target.value })}
          placeholder={field.type === "date" ? "2026-09-21" : field.type === "time" ? "14:30" : "değer"} aria-label="Değer" className={INLINE_INPUT}
        />
      )}

      {ruleCount > 1 && (
        <button type="button" onClick={onRemove} title="Kuralı kaldır" aria-label="Kuralı kaldır"
          className="ml-auto rounded p-0.5 text-neutral-600 transition-colors hover:bg-white/5 hover:text-neutral-300"
        >
          <X size={11} />
        </button>
      )}
    </div>
  );
}

function ConditionTitle({ condition, sourceNode, nodes, schemasByFormId }) {
  const rules = condition?.rules ?? [];
  const joiner = Number(condition?.operator ?? 0) === 1 ? "veya" : "ve";

  return (
    <p className="truncate text-sm font-semibold text-neutral-50">
      {rules.map((rule, index) => {
        const ruleNode = rule.nodeKey ? nodes.find((node) => node.nodeKey === rule.nodeKey) : sourceNode;
        const field = schemasByFormId[ruleNode?.formId]?.schema?.find((item) => item.id === rule.questionId);
        const question = rule.questionId ? (field ? fieldQuestionLabel(field) : rule.questionId) : null;
        const comparison = Number(rule.comparison);
        const value = Array.isArray(rule.values) && rule.values.length > 0 ? rule.values.join(", ") : rule.value;

        return (
          <Fragment key={index}>
            {index > 0 && <span className="font-medium text-neutral-400"> {joiner} </span>}
            {question ? (
              <>
                <span className="text-skylab-300">{question}</span>
                <span className="font-medium text-neutral-400"> {COMPARISON_LABEL[comparison]}</span>
                {VALUELESS_COMPARISONS.includes(comparison) ? null : <span> {value || "?"}</span>}
              </>
            ) : (
              <span className="font-normal italic text-neutral-500">koşul seçilmedi</span>
            )}
          </Fragment>
        );
      })}
    </p>
  );
}

function RouteEditor({ transition, kind, order, conditionalCount, group, sourceNode, nodes, transitions, schemasByFormId, dispatch, onClose }) {
  const update = (patch) => dispatch({ type: "UPDATE_TRANSITION", localId: transition.localId, patch });

  if (kind === "fallback") {
    return (
      <p className="text-2xs leading-relaxed text-neutral-400">
        Koşullu yönlendirmelerden hiçbiri uymadığında bu yol çalışır. Koşullar kaldırılırsa &quot;Her zaman&quot;a döner.
      </p>
    );
  }

  if (kind === "always") {
    return (
      <div className="space-y-2">
        <p className="text-2xs leading-relaxed text-neutral-400">Bu yol her cevapta çalışır. Sadece belirli cevaplarda gitmesini istiyorsan koşul ekle.</p>
        <button type="button" className={linkClass(true)} onClick={() => update({ condition: { operator: 0, rules: [{ ...EMPTY_RULE }] } })}>
          + Koşul ekle
        </button>
      </div>
    );
  }

  const { condition } = transition;
  const operator = Number(condition.operator ?? 0);
  const operatorWord = operator === 1 ? "veya" : "ve";
  const otherDefault = group.find((item) => !item.condition && item.localId !== transition.localId) ?? null;
  const canRemoveCondition = !otherDefault || !otherDefault.targetNodeKey;

  const updateRule = (ruleIndex, patch) => {
    update({ condition: { ...condition, rules: condition.rules.map((rule, index) => (index === ruleIndex ? { ...rule, ...patch } : rule)) } });
  };

  const removeCondition = () => {
    if (!canRemoveCondition) return;
    if (otherDefault) dispatch({ type: "REMOVE_TRANSITION", localId: otherDefault.localId });
    update({ condition: null });
    onClose();
  };

  return (
    <>
      <div className="space-y-0.5">
        {condition.rules.map((rule, index) => (
          <RuleLine key={index} rule={rule} index={index} ruleCount={condition.rules.length} operatorWord={operatorWord}
            sourceNode={sourceNode} nodes={nodes} transitions={transitions} schemasByFormId={schemasByFormId}
            onChange={(patch) => updateRule(index, patch)}
            onRemove={() => update({ condition: { ...condition, rules: condition.rules.filter((_, i) => i !== index) } })}
          />
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 pl-9">
        <button type="button" className={linkClass()} onClick={() => update({ condition: { ...condition, rules: [...condition.rules, { ...EMPTY_RULE }] } })}>
          + kural
        </button>

        {condition.rules.length > 1 && (
          <span className="flex items-center gap-1 text-3xs text-neutral-600">
            <button type="button" className={linkClass(operator === 0)} onClick={() => update({ condition: { ...condition, operator: 0 } })}>tümü</button>
            ·
            <button type="button" className={linkClass(operator === 1)} onClick={() => update({ condition: { ...condition, operator: 1 } })}>herhangi biri</button>
          </span>
        )}

        <span className="flex-1" />

        <button type="button" className={linkClass()} disabled={order <= 1} title="Önce kontrol et" aria-label="Önce kontrol et"
          onClick={() => dispatch({ type: "MOVE_TRANSITION", localId: transition.localId, direction: -1 })}
        >
          <ArrowUp size={11} />
        </button>
        <button type="button" className={linkClass()} disabled={order >= conditionalCount} title="Sonra kontrol et" aria-label="Sonra kontrol et"
          onClick={() => dispatch({ type: "MOVE_TRANSITION", localId: transition.localId, direction: 1 })}
        >
          <ArrowDown size={11} />
        </button>
        <button type="button" className={linkClass()} disabled={!canRemoveCondition} onClick={removeCondition}
          title={canRemoveCondition ? undefined : "Aksi halde yolu zaten bir adıma gidiyor"}
        >
          Koşulu kaldır
        </button>
      </div>
    </>
  );
}

function RouteRow({ transition, kind, order, conditionalCount, group, sourceNode, nodes, transitions, schemasByFormId, dispatch, isOpen, isFlashing, onToggle }) {
  const rowRef = useScrollIntoView(isFlashing);

  const subtitle = kind === "cond"
    ? (conditionalCount > 1 ? `${order}. sırada kontrol edilir` : "Koşul uyarsa bu yola gider")
    : kind === "fallback" ? "Koşullardan hiçbiri uymazsa" : "Her cevapta bu yola gider";

  return (
    <div ref={rowRef} data-route-row={transition.localId}
      className={`${ROW} ${isOpen ? "border-skylab-400/30" : "border-white/10"} ${isFlashing ? "ring-3 ring-skylab-500/25" : ""}`}
    >
      <div role="button" tabIndex={0} aria-expanded={isOpen} onClick={onToggle}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onToggle(); }
        }}
        className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
      >
        <span className={`${TILE} border-white/10 ${kind === "cond" ? "text-neutral-300" : "text-neutral-500"}`}>
          {kind === "cond" ? order : kind === "fallback" ? <CornerDownRight size={14} /> : <ArrowRight size={14} />}
        </span>

        <div className="min-w-0 flex-1">
          {kind === "cond"
            ? <ConditionTitle condition={transition.condition} sourceNode={sourceNode} nodes={nodes} schemasByFormId={schemasByFormId} />
            : <p className="truncate text-sm font-medium italic text-neutral-300">{kind === "fallback" ? "Aksi halde" : "Her zaman"}</p>}
          <p className="truncate text-3xs text-neutral-500">{subtitle}</p>
        </div>

        <TargetMenu value={transition.targetNodeKey ?? END_VALUE} options={targetOptions(sourceNode, nodes, transitions)}
          onSelect={(value) => dispatch({ type: "UPDATE_TRANSITION", localId: transition.localId, patch: { targetNodeKey: value === END_VALUE ? null : value } })}
          onDelete={kind === "fallback" ? null : () => dispatch({ type: "REMOVE_TRANSITION", localId: transition.localId })}
          deleteHint="Önce koşullu yolları kaldır"
        />
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div key="editor" className="overflow-hidden"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="mx-3 border-t border-white/5 pb-3 pt-2.5">
              <RouteEditor transition={transition} kind={kind} order={order} conditionalCount={conditionalCount} group={group}
                sourceNode={sourceNode} nodes={nodes} transitions={transitions} schemasByFormId={schemasByFormId} dispatch={dispatch}
                onClose={onToggle}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ImplicitRow({ trigger, sourceNode, nodes, transitions, dispatch, isFlashing, menuOpen, onMenuOpenChange }) {
  const rowRef = useScrollIntoView(isFlashing);

  return (
    <div ref={rowRef} data-route-row={`implicit-${trigger}`} className={`${ROW} border-white/10 ${isFlashing ? "ring-3 ring-skylab-500/25" : ""}`}>
      <div className="flex items-center gap-3 px-3 py-2.5">
        <span className={`${TILE} border-white/10 text-neutral-500`}><ArrowRight size={14} /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium italic text-neutral-300">Her zaman</p>
          <p className="truncate text-3xs text-neutral-500">Yönlendirme yok; akış burada biter</p>
        </div>
        <TargetMenu value={END_VALUE} options={targetOptions(sourceNode, nodes, transitions)} open={menuOpen} onOpenChange={onMenuOpenChange}
          onSelect={(value) => {
            if (value === END_VALUE) return;
            dispatch({ type: "ADD_TRANSITION", sourceNodeKey: sourceNode.nodeKey, trigger, targetNodeKey: value, condition: null, focus: true });
          }}
        />
      </div>
    </div>
  );
}

function TriggerSection({ trigger, sourceNode, nodes, transitions, schemasByFormId, dispatch, openKey, setOpenKey, flashKey }) {
  const [implicitMenuOpen, setImplicitMenuOpen] = useState(false);
  const section = TRIGGER_SECTION[trigger];
  const group = groupTransitions(transitions, sourceNode.nodeKey, trigger);
  const conditionals = group.filter((transition) => transition.condition);

  const addRoute = () => {
    if (group.length === 0) {
      setImplicitMenuOpen(true);
      return;
    }
    dispatch({
      type: "ADD_TRANSITION", sourceNodeKey: sourceNode.nodeKey, trigger, targetNodeKey: null,
      condition: { operator: 0, rules: [{ ...EMPTY_RULE }] }, focus: true,
    });
  };

  return (
    <section className="space-y-4 py-6">
      <SectionHeader title={section.label} description={section.description} dot={section.dot} />

      <div className="space-y-3">
        {group.length === 0 ? (
          <ImplicitRow trigger={trigger} sourceNode={sourceNode} nodes={nodes} transitions={transitions} dispatch={dispatch}
            isFlashing={flashKey === `implicit-${trigger}`} menuOpen={implicitMenuOpen} onMenuOpenChange={setImplicitMenuOpen}
          />
        ) : group.map((transition) => {
          const kind = transition.condition ? "cond" : conditionals.length > 0 ? "fallback" : "always";
          return (
            <RouteRow key={transition.localId} transition={transition} kind={kind} group={group}
              order={transition.condition ? conditionals.indexOf(transition) + 1 : null} conditionalCount={conditionals.length}
              sourceNode={sourceNode} nodes={nodes} transitions={transitions} schemasByFormId={schemasByFormId} dispatch={dispatch}
              isOpen={openKey === transition.localId} isFlashing={flashKey === transition.localId}
              onToggle={() => setOpenKey(openKey === transition.localId ? null : transition.localId)}
            />
          );
        })}
      </div>

      <button type="button" onClick={addRoute} className={`${BULK} ${BULK_TONE} w-full`}>
        <Plus size={14} className={BULK_ICON} />
        Yönlendirme ekle
      </button>
    </section>
  );
}

function StepPanel({ selectedNode, state, dispatch, schemasByFormId, issuesByNode, openKey, setOpenKey, flashKey }) {
  const { nodes, transitions } = state;
  const schema = schemasByFormId[selectedNode.formId]?.schema;
  const questionCount = (schema ?? []).filter((field) => field?.type !== "separator").length;
  const nodeIssues = issuesByNode[selectedNode.nodeKey] ?? [];
  const formHref = `/admin/forms/${selectedNode.formId}/edit`;

  return (
    <div className="flex flex-col divide-y divide-neutral-800/60 p-4 text-sm text-neutral-200">
      <section className="space-y-4 pb-6">
        <SectionHeader title="Adım ayarları" description={schema ? `${questionCount} soru` : "Sorular yükleniyor"} />

        {nodeIssues.map((issue, index) => (
          <div key={`${issue.code}-${index}`} className="rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-xs text-red-100 shadow-sm">
            {validationMessage(issue)}
            {validationAction(issue) === "openForm" && (
              <Link href={formHref} target="_blank" className="ml-1.5 underline decoration-red-200/40 underline-offset-2 transition-colors hover:text-white">
                Formu düzenle
              </Link>
            )}
          </div>
        ))}

        <ToggleRow title="Manuel onay" checked={selectedNode.requiresManualReview}
          description={selectedNode.requiresManualReview
            ? "Cevap yetkili onayını bekler; onaylanınca ve reddedilince ayrı yönlendirilir."
            : "Cevap gönderilince onay beklemeden sonraki adıma geçer."}
          onChange={() => dispatch({ type: "SET_NODE_REVIEW", nodeKey: selectedNode.nodeKey, value: !selectedNode.requiresManualReview })}
        />

        <div className="flex flex-wrap gap-2">
          <Link href={formHref} target="_blank" className={`${BULK} ${BULK_TONE} min-w-fit flex-1`}>
            <ExternalLink size={13} className={BULK_ICON} />
            Formu aç
          </Link>
          <button type="button" disabled={selectedNode.isStart} onClick={() => dispatch({ type: "SET_START", nodeKey: selectedNode.nodeKey })}
            className={`${BULK} ${BULK_TONE} min-w-fit flex-1`}
          >
            <Flag size={13} className={BULK_ICON} />
            Başlangıç yap
          </button>
          <button type="button" onClick={() => dispatch({ type: "REMOVE_NODE", nodeKey: selectedNode.nodeKey })} className={`${BULK} ${BULK_DANGER} min-w-fit flex-1`}>
            <Trash2 size={13} className={BULK_ICON} />
            Adımı çıkar
          </button>
        </div>
      </section>

      {triggersForNode(selectedNode).map((trigger) => (
        <TriggerSection key={`${selectedNode.nodeKey}-${trigger}`} trigger={trigger} sourceNode={selectedNode} nodes={nodes} transitions={transitions}
          schemasByFormId={schemasByFormId} dispatch={dispatch} openKey={openKey} setOpenKey={setOpenKey} flashKey={flashKey}
        />
      ))}
    </div>
  );
}

function FlowPanel({ state, dispatch, schemasByFormId, picker, onRelayout, versions, intakeControl }) {
  const depths = depthMap(state.nodes, state.transitions);
  const orderedNodes = flowOrder(state.nodes, state.transitions);

  return (
    <div className="flex flex-col divide-y divide-neutral-800/60 p-4 text-sm text-neutral-200">
      <IntakeSection intakeControl={intakeControl} allowMultipleRuns={state.allowMultipleRuns}
        onToggleMultipleRuns={() => dispatch({ type: "SET_META", key: "allowMultipleRuns", value: !state.allowMultipleRuns })}
      />

      <section className="space-y-4 py-6">
        <SectionHeader title="Adımlar" description="Başlangıçtan itibaren akıştaki sırasıyla. Birine tıklayınca ayarları açılır." />

        {orderedNodes.length === 0 ? (
          <p className="text-2xs leading-relaxed text-neutral-500">Henüz adım yok. İlk eklediğin form akışın başlangıcı olur.</p>
        ) : (
          <div className="space-y-3">
            {orderedNodes.map((node) => {
              const schema = schemasByFormId[node.formId]?.schema;
              const depth = depths.get(node.nodeKey);
              const meta = [
                node.isStart ? "Başlangıç" : depth ? null : "Başlangıçtan ulaşılamıyor",
                node.requiresManualReview ? "Manuel onay" : null,
                schema ? `${schema.filter((field) => field?.type !== "separator").length} soru` : null,
              ].filter(Boolean).join(" · ");

              return (
                <button key={node.nodeKey} type="button" onClick={() => dispatch({ type: "SELECT", nodeKey: node.nodeKey })}
                  className={`${ROW} flex w-full items-center gap-3 border-white/10 px-3 py-2.5 text-left hover:border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40`}
                >
                  <span className={`${TILE} ${node.isStart ? "border-skylab-400/40 text-skylab-300" : "border-white/10 text-neutral-300"}`}>
                    {node.isStart ? 1 : depth ?? "?"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-neutral-50">{node.formTitle}</span>
                    {meta ? <span className="block truncate text-3xs text-neutral-500">{meta}</span> : null}
                  </span>
                  <ChevronRight size={14} className="shrink-0 text-neutral-600" />
                </button>
              );
            })}
          </div>
        )}

        <div className="relative flex flex-wrap gap-2">
          <button type="button" onClick={picker.onOpen} className={`${BULK} ${BULK_TONE} min-w-fit flex-1`}>
            <Plus size={14} className={BULK_ICON} />
            Adım ekle
          </button>
          <button type="button" onClick={onRelayout} disabled={state.nodes.length < 2} title="Adımları başlangıçtan itibaren akış sırasına göre dizer"
            className={`${BULK} ${BULK_TONE} min-w-fit flex-1`}
          >
            <LayoutGrid size={14} className={BULK_ICON} />
            Otomatik yerleştir
          </button>

          <AddStepPicker open={picker.open} forms={picker.forms} usedFormIds={picker.usedFormIds} isLoading={picker.isLoading}
            onClose={picker.onClose} onSelect={picker.onSelect}
          />
        </div>
      </section>

      <section className="space-y-4 py-6">
        <SectionHeader title="Açıklama" description="Akışın ne için kullanıldığını ekip arkadaşların için yaz." />
        <textarea rows={3} value={state.description ?? ""} aria-label="Akış açıklaması"
          onChange={(event) => dispatch({ type: "SET_META", key: "description", value: event.target.value })}
          placeholder="Bu akış ne için kullanılıyor?"
          className="w-full resize-y rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 outline-none transition placeholder:text-neutral-600 focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/40"
        />
      </section>

      <section className="space-y-4 py-6">
        <SectionHeader title="Sürümler" description="Devam eden başvurular başladıkları sürümde kalır." />
        {versions.length === 0 ? (
          <p className="text-2xs text-neutral-600">Henüz yayınlanmış sürüm yok.</p>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => (
              <div key={version.id ?? version.version} className="flex items-center gap-2 text-2xs">
                <span className={`size-1.5 shrink-0 rounded-full ${version.status === 1 ? "bg-emerald-400" : version.status === 0 ? "bg-amber-400" : "bg-neutral-600"}`} />
                <span className="text-neutral-300">v{version.version}</span>
                <span className="text-neutral-600">{version.status === 1 ? "Canlı" : version.status === 0 ? "Taslak" : "Arşiv"}</span>
                <span className="ml-auto text-3xs text-neutral-600">
                  {version.publishedAt ? new Date(version.publishedAt).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }) : "--"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function WorkflowInspector({ state, dispatch, schemasByFormId, issuesByNode, versions, picker, onRelayout, intakeControl = null, layout = "grid" }) {
  const { nodes, transitions, selectedKey, focus } = state;
  const selectedNode = nodes.find((node) => node.nodeKey === selectedKey) ?? null;

  const [openKey, setOpenKey] = useState(() => {
    const target = focus?.localId ? transitions.find((transition) => transition.localId === focus.localId) : null;
    return target?.condition ? target.localId : null;
  });
  const [flash, setFlash] = useState(() => (focus?.localId ? { key: focus.localId, nonce: focus.nonce } : null));
  const [seenNonce, setSeenNonce] = useState(focus?.nonce ?? 0);

  const [prevSelectedKey, setPrevSelectedKey] = useState(selectedKey);
  if (prevSelectedKey !== selectedKey) {
    setPrevSelectedKey(selectedKey);
    setOpenKey(null);
  }

  if (focus && focus.nonce !== seenNonce) {
    setSeenNonce(focus.nonce);
    if (focus.localId) {
      const target = transitions.find((transition) => transition.localId === focus.localId);
      setOpenKey(target?.condition ? target.localId : null);
      setFlash({ key: focus.localId, nonce: focus.nonce });
    }
  }

  useEffect(() => {
    if (!flash) return undefined;
    const timer = setTimeout(() => {
      setFlash(null);
      dispatch({ type: "CLEAR_FOCUS" });
    }, FLASH_MS);
    return () => clearTimeout(timer);
  }, [flash, dispatch]);

  useEffect(() => () => dispatch({ type: "CLEAR_FOCUS" }), [dispatch]);

  const layoutClass = layout === "drawer" ? "h-full w-full pt-8" : "col-span-4 h-[calc(100dvh-5.5rem)]";

  return (
    <motion.div className={`relative flex min-w-0 max-w-xl overflow-hidden rounded-xl p-2 ${layoutClass}`}
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
    >
      <div className="flex h-full min-w-0 flex-1 flex-col rounded-xl">
        <nav aria-label="Panel konumu" className="flex h-10 min-w-0 items-center gap-1.5 border-b border-neutral-800 px-4 text-sm font-semibold tracking-wide">
          {selectedNode ? (
            <>
              <button type="button" onClick={() => dispatch({ type: "SELECT", nodeKey: null })}
                className="shrink-0 rounded text-neutral-500 transition-colors hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
              >
                Akış
              </button>
              <ChevronRight size={13} className="shrink-0 text-neutral-600" />
              <span className="min-w-0 truncate text-neutral-200" aria-current="page">{selectedNode.formTitle}</span>
            </>
          ) : (
            <span className="text-neutral-200" aria-current="page">Akış</span>
          )}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden p-1 scrollbar">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={selectedNode ? `step-${selectedNode.nodeKey}` : "flow"}
              initial={{ opacity: 0, x: selectedNode ? 10 : -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="h-full"
            >
              {selectedNode ? (
                <StepPanel selectedNode={selectedNode} state={state} dispatch={dispatch} schemasByFormId={schemasByFormId}
                  issuesByNode={issuesByNode} openKey={openKey} setOpenKey={setOpenKey} flashKey={flash?.key ?? null}
                />
              ) : (
                <FlowPanel state={state} dispatch={dispatch} schemasByFormId={schemasByFormId} picker={picker} onRelayout={onRelayout}
                  versions={versions} intakeControl={intakeControl}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

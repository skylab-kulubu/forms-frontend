"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, ArrowUp, ChevronRight, CornerDownRight, ExternalLink, FileText, Flag, LayoutGrid, MoreHorizontal, MousePointerClick, Plus, Trash2, X } from "lucide-react";
import { Dropdown } from "@/app/components/utils/Dropdown";
import AddStepPicker from "./AddStepPicker";
import { EMPTY_RULE, nextTransitionId } from "../WorkflowEditorContext";
import { TRIGGER, depthMap, descendantsOf, groupTransitions, guaranteedAncestors, triggersForNode, wouldExceedDepth } from "../workflow-graph";
import {
  COMPARISON_LABEL, CONDITIONABLE_TYPES, MULTI_VALUE_COMPARISONS, VALUELESS_COMPARISONS,
  comparisonsForField, fieldQuestionLabel, optionsForField, validationAction, validationMessage,
} from "../workflow-copy";

const END_VALUE = "__end";

const TABS = [
  { key: "step", label: "Seçili Adım" },
  { key: "flow", label: "Akış" },
];

const TRIGGER_SECTION = {
  [TRIGGER.SUBMITTED]: { label: "Gönderildiğinde", pip: "bg-neutral-500" },
  [TRIGGER.APPROVED]: { label: "Onaylandığında", pip: "bg-emerald-400" },
  [TRIGGER.DECLINED]: { label: "Reddedildiğinde", pip: "bg-red-400" },
};

const SMALL_BUTTON = "inline-flex h-6 items-center gap-1 rounded-md border border-white/10 px-2 text-3xs text-neutral-300 transition-colors hover:bg-white/5 hover:text-neutral-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 disabled:cursor-not-allowed disabled:opacity-40";
const DANGER_BUTTON = `${SMALL_BUTTON} hover:border-red-400/40 hover:bg-red-500/8 hover:text-red-300`;
const PRIMARY_BUTTON = "inline-flex h-6 items-center gap-1 rounded-md border border-skylab-400/40 bg-skylab-500/10 px-2.5 text-3xs font-medium text-skylab-300 transition-colors hover:bg-skylab-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40";
const TEXT_BUTTON = "inline-flex items-center gap-1 py-0.5 text-2xs text-neutral-500 transition-colors hover:text-neutral-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 rounded";
const INLINE_INPUT = "w-24 min-w-0 border-b border-dotted border-white/25 bg-transparent px-0.5 py-0.5 text-2xs text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-skylab-400/60";

function questionsOf(schema) {
  return (Array.isArray(schema) ? schema : []).filter((field) => CONDITIONABLE_TYPES.includes(field?.type));
}

function targetOptions(selectedNode, nodes, transitions, { includeEnd = true } = {}) {
  const options = includeEnd ? [{ value: END_VALUE, label: "Akış biter" }] : [];

  nodes.forEach((node) => {
    if (node.nodeKey === selectedNode.nodeKey) return;
    let hint = null;
    if (descendantsOf(node.nodeKey, transitions).has(selectedNode.nodeKey)) hint = "döngü oluşturur";
    else if (wouldExceedDepth(selectedNode.nodeKey, node.nodeKey, nodes, transitions)) hint = "rota üç formu aşar";
    options.push({ value: node.nodeKey, label: node.formTitle, disabled: Boolean(hint), hint });
  });

  return options;
}

function SectionTitle({ pip, label, hint }) {
  return (
    <div className="flex items-center gap-2">
      {pip ? <span className={`size-1.5 shrink-0 rounded-full ${pip}`} /> : null}
      <span className="text-xs font-semibold text-neutral-200">{label}</span>
      {hint ? <span className="text-3xs text-neutral-600">{hint}</span> : null}
      <span className="h-px flex-1 bg-white/5" />
    </div>
  );
}

function Switch({ checked, disabled, onChange, label }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} disabled={disabled} onClick={onChange}
      className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full border px-0.5 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "border-skylab-400/50 bg-skylab-400/20" : "border-white/10 bg-white/5"
      }`}
    >
      <span className={`size-2.5 rounded-full bg-white/85 transition-transform duration-150 ${checked ? "translate-x-3" : "translate-x-0"}`} />
    </button>
  );
}

function RouteMenu({ items }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handle = (event) => { if (!ref.current?.contains(event.target)) setOpen(false); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button type="button" aria-label="Yönlendirme seçenekleri" onClick={(event) => { event.stopPropagation(); setOpen((value) => !value); }}
        className={`rounded p-0.5 text-neutral-600 transition-opacity hover:bg-white/5 hover:text-neutral-200 ${open ? "opacity-100" : "opacity-0 group-hover/route:opacity-100 focus-visible:opacity-100"}`}
      >
        <MoreHorizontal size={14} />
      </button>
      {open && (
        <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-lg border border-white/10 bg-[#1a1a1a] p-1 shadow-xl">
          {items.map((item) => (
            <button key={item.label} type="button" disabled={item.disabled} title={item.title}
              onClick={(event) => { event.stopPropagation(); setOpen(false); item.onSelect(); }}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-2xs transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                item.danger ? "text-red-300 hover:bg-red-500/10" : "text-neutral-300 hover:bg-white/5 hover:text-neutral-50"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function RuleEditor({ rule, index, ruleCount, operatorWord, selectedNode, nodes, transitions, schemasByFormId, onChange, onRemove }) {
  const ancestors = guaranteedAncestors(selectedNode.nodeKey, nodes, transitions);
  const sourceNode = rule.nodeKey ? nodes.find((node) => node.nodeKey === rule.nodeKey) : selectedNode;
  const questions = questionsOf(schemasByFormId[sourceNode?.formId]?.schema);
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
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1">
      <span className="w-8 shrink-0 text-2xs text-neutral-500">{index === 0 ? "Eğer" : operatorWord}</span>

      {ancestors.length > 0 && (
        <Dropdown variant="inline" tone="text-neutral-300" value={rule.nodeKey ?? ""}
          options={[{ value: "", label: "bu adımda" }, ...ancestors.map((node) => ({ value: node.nodeKey, label: `${node.formTitle} adımında` }))]}
          onChange={(value) => onChange({ nodeKey: value || null, questionId: "", value: "", values: null })}
        />
      )}

      <Dropdown variant="inline" tone="text-skylab-300" value={rule.questionId} placeholder="soru seçin"
        options={questions.map((item) => ({ value: item.id, label: fieldQuestionLabel(item) }))}
        onChange={handleQuestionChange}
      />

      <Dropdown variant="inline" tone="text-neutral-300" value={comparison}
        options={comparisons.map((item) => ({ value: item, label: COMPARISON_LABEL[item] }))}
        onChange={(value) => onChange({ comparison: Number(value), value: "", values: null })}
      />

      {isValueless ? null : isMultiValue && options.length > 0 ? (
        <span className="flex w-full flex-wrap gap-1 pl-8 pt-0.5">
          {options.map((option) => {
            const active = selectedValues.includes(option);
            return (
              <button key={option} type="button" onClick={() => toggleValue(option)}
                className={`max-w-full truncate rounded-full border px-2 py-px text-3xs transition-colors ${
                  active ? "border-skylab-400/40 bg-skylab-500/15 text-skylab-300" : "border-white/10 text-neutral-500 hover:text-neutral-200"
                }`}
              >
                {option}
              </button>
            );
          })}
        </span>
      ) : options.length > 0 ? (
        <Dropdown variant="inline" value={rule.value ?? ""} placeholder="değer seçin"
          options={options.map((option) => ({ value: option, label: option }))}
          onChange={(value) => onChange({ value })}
        />
      ) : (
        <input type={field?.type === "slider" ? "number" : "text"} value={rule.value ?? ""} onChange={(event) => onChange({ value: event.target.value })}
          placeholder={field?.type === "date" ? "2026-09-21" : field?.type === "time" ? "14:30" : "değer"} aria-label="Değer" className={INLINE_INPUT}
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

function ConditionSummary({ condition, sourceNode, nodes, schemasByFormId }) {
  const rules = condition?.rules ?? [];
  const operatorWord = Number(condition?.operator ?? 0) === 1 ? "veya" : "ve";

  return (
    <p className="text-2xs leading-relaxed text-neutral-400">
      {rules.map((rule, index) => {
        const ruleNode = rule.nodeKey ? nodes.find((node) => node.nodeKey === rule.nodeKey) : sourceNode;
        const field = schemasByFormId[ruleNode?.formId]?.schema?.find((item) => item.id === rule.questionId);
        const question = rule.questionId ? (field ? fieldQuestionLabel(field) : rule.questionId) : null;
        const value = Array.isArray(rule.values) && rule.values.length > 0 ? rule.values.join(", ") : rule.value;
        const isValueless = VALUELESS_COMPARISONS.includes(Number(rule.comparison));

        return (
          <Fragment key={index}>
            {index > 0 && <span className="text-neutral-600"> {operatorWord} </span>}
            {question ? (
              <>
                <span className="text-skylab-300">{question}</span>
                <span> {COMPARISON_LABEL[Number(rule.comparison)]}</span>
                {!isValueless && (value ? <span className="text-neutral-100"> {value}</span> : <span className="italic text-neutral-600"> değer seçilmedi</span>)}
              </>
            ) : (
              <span className="italic text-neutral-600">koşul seçilmedi</span>
            )}
          </Fragment>
        );
      })}
    </p>
  );
}

function RouteCard({ transition, orderIndex, group, selectedNode, nodes, transitions, schemasByFormId, dispatch, isOpen, onToggle }) {
  const hasCondition = Boolean(transition.condition);
  const conditionalSiblings = group.filter((item) => item.condition && item.localId !== transition.localId);
  const otherDefault = group.find((item) => !item.condition && item.localId !== transition.localId) ?? null;
  const isFallback = !hasCondition && conditionalSiblings.length > 0;
  const targetNode = transition.targetNodeKey ? nodes.find((node) => node.nodeKey === transition.targetNodeKey) : null;
  const targetLabel = transition.targetNodeKey ? (targetNode?.formTitle ?? transition.targetNodeKey) : "Akış biter";

  const conditionalOrder = group.filter((item) => item.condition);
  const positionInOrder = conditionalOrder.findIndex((item) => item.localId === transition.localId);
  const operatorWord = Number(transition.condition?.operator ?? 0) === 1 ? "veya" : "ve";

  const update = (patch) => dispatch({ type: "UPDATE_TRANSITION", localId: transition.localId, patch });
  const updateRule = (ruleIndex, patch) => {
    const rules = transition.condition.rules.map((rule, index) => (index === ruleIndex ? { ...rule, ...patch } : rule));
    update({ condition: { ...transition.condition, rules } });
  };

  const canDisableCondition = !otherDefault || !otherDefault.targetNodeKey;

  const toggleCondition = () => {
    if (!hasCondition) {
      update({ condition: { operator: 0, rules: [{ ...EMPTY_RULE }] } });
      return;
    }
    if (!canDisableCondition) return;
    if (otherDefault) dispatch({ type: "REMOVE_TRANSITION", localId: otherDefault.localId });
    update({ condition: null });
  };

  const canDelete = !isFallback;
  const deleteTitle = canDelete ? undefined : "Önce koşullu yönlendirmeleri kaldırın";

  const menuItems = [
    ...(hasCondition ? [
      { label: "Yukarı taşı", icon: <ArrowUp size={12} />, disabled: positionInOrder <= 0, onSelect: () => dispatch({ type: "MOVE_TRANSITION", localId: transition.localId, direction: -1 }) },
      { label: "Aşağı taşı", icon: <ArrowDown size={12} />, disabled: positionInOrder >= conditionalOrder.length - 1, onSelect: () => dispatch({ type: "MOVE_TRANSITION", localId: transition.localId, direction: 1 }) },
    ] : []),
    { label: "Sil", icon: <Trash2 size={12} />, danger: true, disabled: !canDelete, title: deleteTitle, onSelect: () => dispatch({ type: "REMOVE_TRANSITION", localId: transition.localId }) },
  ];

  return (
    <div className={`group/route rounded-lg border transition-colors ${isOpen ? "border-skylab-400/35 bg-white/4" : "border-white/5 bg-white/3 hover:border-white/10"}`}>
      <div role="button" tabIndex={0} aria-expanded={isOpen} onClick={onToggle}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onToggle(); } }}
        className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-2.5 px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
      >
        {isFallback ? (
          <span className="mt-px text-4xs italic leading-4 text-neutral-500">aksi halde</span>
        ) : hasCondition ? (
          <span className="mt-px grid size-4.5 place-items-center rounded-full border border-white/15 text-4xs tabular-nums text-neutral-400">{orderIndex}</span>
        ) : (
          <span className="mt-px grid size-4.5 place-items-center rounded-full border border-dashed border-white/15 text-3xs text-neutral-500">→</span>
        )}

        <div className="min-w-0 space-y-0.5">
          {hasCondition && !isOpen && <ConditionSummary condition={transition.condition} sourceNode={selectedNode} nodes={nodes} schemasByFormId={schemasByFormId} />}
          {!isOpen && (
            <div className="flex items-center gap-1.5 text-2xs">
              <CornerDownRight size={11} className="shrink-0 text-neutral-600" />
              <span className={transition.targetNodeKey ? "font-medium text-neutral-100" : "italic text-neutral-400"}>{targetLabel}</span>
            </div>
          )}
          {isOpen && (
            <span className="text-3xs text-neutral-500">{isFallback ? "Diğer yönlendirmelerden hiçbiri uymazsa" : hasCondition ? "Koşullu yönlendirme" : "Yönlendirme"}</span>
          )}
        </div>

        <RouteMenu items={menuItems} />
      </div>

      {isOpen && (
        <div className="space-y-2.5 border-t border-white/5 px-3 py-2.5">
          {hasCondition && (
            <div className="space-y-1.5">
              {transition.condition.rules.map((rule, index) => (
                <RuleEditor key={index} rule={rule} index={index} ruleCount={transition.condition.rules.length} operatorWord={operatorWord}
                  selectedNode={selectedNode} nodes={nodes} transitions={transitions} schemasByFormId={schemasByFormId}
                  onChange={(patch) => updateRule(index, patch)}
                  onRemove={() => update({ condition: { ...transition.condition, rules: transition.condition.rules.filter((_, i) => i !== index) } })}
                />
              ))}
              <div className="flex items-center gap-3 pl-8">
                <button type="button" className={`${TEXT_BUTTON} text-3xs`}
                  onClick={() => update({ condition: { ...transition.condition, rules: [...transition.condition.rules, { ...EMPTY_RULE }] } })}
                >
                  <Plus size={10} />
                  kural
                </button>
                {transition.condition.rules.length > 1 && (
                  <span className="flex items-center gap-1 text-3xs text-neutral-600">
                    {[{ value: 0, label: "tümü" }, { value: 1, label: "herhangi biri" }].map((option, index) => {
                      const active = Number(transition.condition.operator ?? 0) === option.value;
                      return (
                        <Fragment key={option.value}>
                          {index > 0 && <span>·</span>}
                          <button type="button" onClick={() => update({ condition: { ...transition.condition, operator: option.value } })}
                            className={`rounded px-0.5 transition-colors ${active ? "text-skylab-300" : "hover:text-neutral-300"}`}
                          >
                            {option.label}
                          </button>
                        </Fragment>
                      );
                    })}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-1.5 text-2xs">
            <CornerDownRight size={11} className="shrink-0 text-neutral-600" />
            <Dropdown variant="inline" value={transition.targetNodeKey ?? END_VALUE}
              options={targetOptions(selectedNode, nodes, transitions)}
              onChange={(value) => update({ targetNodeKey: value === END_VALUE ? null : value })}
            />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-2.5">
            {isFallback ? <span /> : (
              <label className="flex min-w-0 items-center gap-2 text-3xs text-neutral-500" title={hasCondition && !canDisableCondition ? "Koşulsuz yol zaten var: aksi halde" : undefined}>
                <Switch checked={hasCondition} disabled={hasCondition && !canDisableCondition} onChange={toggleCondition} label="Sadece belirli cevaplarda" />
                <span className="truncate">Sadece belirli cevaplarda</span>
              </label>
            )}
            <div className="flex shrink-0 items-center gap-1.5">
              <button type="button" disabled={!canDelete} title={deleteTitle} onClick={() => dispatch({ type: "REMOVE_TRANSITION", localId: transition.localId })} className={DANGER_BUTTON}>Sil</button>
              <button type="button" onClick={onToggle} className={PRIMARY_BUTTON}>Tamam</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TriggerSection({ trigger, selectedNode, nodes, transitions, schemasByFormId, dispatch, openKey, setOpenKey }) {
  const section = TRIGGER_SECTION[trigger];
  const group = groupTransitions(transitions, selectedNode.nodeKey, trigger);

  const addRoute = () => {
    const localId = nextTransitionId();
    dispatch({
      type: "ADD_TRANSITION", localId, sourceNodeKey: selectedNode.nodeKey, trigger, targetNodeKey: null,
      condition: { operator: 0, rules: [{ ...EMPTY_RULE }] },
    });
    setOpenKey(localId);
  };

  let conditionalCounter = 0;

  return (
    <div className="space-y-2">
      <SectionTitle pip={section.pip} label={section.label} />

      {group.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/10 px-3.5 py-3">
          <p className="flex items-center gap-2 text-xs font-medium text-neutral-200">
            <span className="size-2 rounded-full border-[1.5px] border-neutral-600" />
            Akış burada biter
          </p>
          <p className="mt-1 text-2xs leading-relaxed text-neutral-500">Bu adımdan sonra başka form açılmaz. Devam etmesini istiyorsan sonraki adımı seç.</p>
          <Dropdown size="sm" className="mt-2.5 w-52" value={null} placeholder="Sonraki adımı seç"
            options={targetOptions(selectedNode, nodes, transitions, { includeEnd: false })}
            onChange={(value) => dispatch({ type: "ADD_TRANSITION", sourceNodeKey: selectedNode.nodeKey, trigger, targetNodeKey: value, condition: null })}
          />
        </div>
      ) : (
        <>
          {group.map((transition) => {
            const orderIndex = transition.condition ? ++conditionalCounter : null;
            return (
              <RouteCard key={transition.localId} transition={transition} orderIndex={orderIndex} group={group}
                selectedNode={selectedNode} nodes={nodes} transitions={transitions} schemasByFormId={schemasByFormId} dispatch={dispatch}
                isOpen={openKey === transition.localId} onToggle={() => setOpenKey(openKey === transition.localId ? null : transition.localId)}
              />
            );
          })}
          <button type="button" onClick={addRoute} className={TEXT_BUTTON}>
            <Plus size={11} />
            Yönlendirme ekle
          </button>
        </>
      )}
    </div>
  );
}

function StepPanel({ selectedNode, state, dispatch, schemasByFormId, issuesByNode, openKey, setOpenKey, onGoToSteps }) {
  if (!selectedNode) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <span className="grid size-10 place-items-center rounded-xl border border-white/10 bg-white/3 text-neutral-500">
          <MousePointerClick size={18} strokeWidth={1.5} />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-neutral-200">Bir adım seç</p>
          <p className="text-2xs leading-relaxed text-neutral-500">Tuvaldeki bir karta tıkla ya da Akış sekmesindeki listeden seç. Bu sekme o adımın nereye yönlendirdiğini gösterir.</p>
        </div>
        <button type="button" onClick={onGoToSteps} className={SMALL_BUTTON}>Adım listesine git</button>
      </div>
    );
  }

  const { nodes, transitions } = state;
  const schema = schemasByFormId[selectedNode.formId]?.schema;
  const questionCount = (schema ?? []).filter((field) => field?.type !== "separator").length;
  const nodeIssues = issuesByNode[selectedNode.nodeKey] ?? [];

  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/3 text-neutral-400">
            <FileText size={14} strokeWidth={1.75} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-neutral-100">{selectedNode.formTitle}</p>
            <p className="text-3xs text-neutral-500">
              {schema ? `${questionCount} soru` : "yükleniyor"} · {selectedNode.requiresManualReview ? "onay gerekiyor" : "onay gerekmiyor"}
            </p>
          </div>
          {selectedNode.isStart && (
            <span className="shrink-0 rounded border border-skylab-400/40 bg-skylab-500/10 px-1.5 py-0.5 text-4xs uppercase tracking-[0.06em] text-skylab-400">Başlangıç</span>
          )}
          {selectedNode.requiresManualReview && (
            <span className="shrink-0 rounded border border-amber-400/35 bg-amber-500/10 px-1.5 py-0.5 text-4xs uppercase tracking-[0.06em] text-amber-300">Manuel onay</span>
          )}
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          <Link href={`/admin/forms/${selectedNode.formId}/edit`} target="_blank" className={SMALL_BUTTON}>
            Formu aç
            <ExternalLink size={10} />
          </Link>
          {!selectedNode.isStart && (
            <button type="button" onClick={() => dispatch({ type: "SET_START", nodeKey: selectedNode.nodeKey })} className={SMALL_BUTTON}>
              <Flag size={10} />
              Başlangıç yap
            </button>
          )}
          <button type="button" onClick={() => dispatch({ type: "REMOVE_NODE", nodeKey: selectedNode.nodeKey })} className={DANGER_BUTTON}>
            <Trash2 size={10} />
            Adımı çıkar
          </button>
        </div>
      </div>

      {nodeIssues.length > 0 && (
        <div className="space-y-1.5">
          {nodeIssues.map((issue, index) => (
            <div key={`${issue.code}-${index}`} className="flex items-start gap-2 rounded-lg border border-red-400/25 bg-red-500/6 px-2.5 py-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-red-400" />
              <p className="min-w-0 flex-1 text-2xs text-red-200">{validationMessage(issue)}</p>
              {validationAction(issue) === "openForm" && (
                <Link href={`/admin/forms/${selectedNode.formId}/edit`} target="_blank" className={`${SMALL_BUTTON} shrink-0`}>Formu düzenle</Link>
              )}
            </div>
          ))}
        </div>
      )}

      {triggersForNode(selectedNode).map((trigger) => (
        <TriggerSection key={trigger} trigger={trigger} selectedNode={selectedNode} nodes={nodes} transitions={transitions}
          schemasByFormId={schemasByFormId} dispatch={dispatch} openKey={openKey} setOpenKey={setOpenKey}
        />
      ))}
    </div>
  );
}

function FlowPanel({ state, dispatch, picker, onRelayout, versions }) {
  const depths = depthMap(state.nodes, state.transitions);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <SectionTitle label="Adımlar" hint={state.nodes.length > 0 ? String(state.nodes.length) : null} />

        {state.nodes.length === 0 ? (
          <p className="text-2xs leading-relaxed text-neutral-500">Henüz adım yok. İlk eklediğin form akışın başlangıcı olur.</p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-white/5">
            {state.nodes.map((node) => {
              const depth = depths.get(node.nodeKey);
              const isSelected = node.nodeKey === state.selectedKey;
              const meta = node.isStart ? "başlangıç" : node.requiresManualReview ? "manuel onay" : null;
              return (
                <button key={node.nodeKey} type="button" onClick={() => dispatch({ type: "SELECT", nodeKey: node.nodeKey })}
                  className={`flex w-full items-center gap-2.5 border-b border-white/5 px-2.5 py-2 text-left transition-colors last:border-b-0 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${isSelected ? "bg-white/4" : ""}`}
                >
                  <span className={`grid size-4.5 shrink-0 place-items-center rounded border text-4xs tabular-nums ${node.isStart ? "border-skylab-400/40 text-skylab-400" : "border-white/10 text-neutral-500"}`}>
                    {node.isStart ? "●" : depth ?? "?"}
                  </span>
                  <span className={`min-w-0 flex-1 truncate text-xs ${isSelected ? "text-neutral-50" : "text-neutral-200"}`}>{node.formTitle}</span>
                  {meta ? <span className="text-3xs text-neutral-600">{meta}</span> : null}
                  <ChevronRight size={12} className="shrink-0 text-neutral-600" />
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="relative">
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={picker.onOpen} className={PRIMARY_BUTTON}>
            <Plus size={11} />
            Adım ekle
          </button>
          {state.nodes.length > 1 && (
            <button type="button" onClick={onRelayout} className={SMALL_BUTTON} title="Adımları başlangıçtan uzaklığına göre dizer">
              <LayoutGrid size={11} />
              Otomatik yerleştir
            </button>
          )}
        </div>

        <AddStepPicker open={picker.open} forms={picker.forms} usedFormIds={picker.usedFormIds} isLoading={picker.isLoading}
          onClose={picker.onClose} onSelect={picker.onSelect}
        />
      </div>

      <SectionTitle label="Ayarlar" />

      <div className="space-y-1.5">
        <label htmlFor="wf-description" className="block text-3xs text-neutral-500">Açıklama</label>
        <textarea id="wf-description" rows={3} value={state.description ?? ""}
          onChange={(event) => dispatch({ type: "SET_META", key: "description", value: event.target.value })}
          placeholder="Bu akışın ne için kullanıldığını yazın."
          className="w-full rounded-md border border-white/10 bg-neutral-800/50 px-2.5 py-1.5 text-xs text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-neutral-100">Tekrar başlatma</p>
          <p className="text-3xs text-neutral-500">Aynı kişi akışı birden fazla kez doldurabilsin.</p>
        </div>
        <Switch checked={state.allowMultipleRuns} label="Tekrar başlatma"
          onChange={() => dispatch({ type: "SET_META", key: "allowMultipleRuns", value: !state.allowMultipleRuns })}
        />
      </div>

      <div className="space-y-2">
        <SectionTitle label="Sürümler" />
        {versions.length === 0 ? (
          <p className="text-2xs text-neutral-600">Henüz yayınlanmış sürüm yok.</p>
        ) : versions.map((version) => (
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
    </div>
  );
}

export default function WorkflowInspector({ state, dispatch, schemasByFormId, issuesByNode, versions, picker, onRelayout, layout = "grid" }) {
  const { nodes, selectedKey } = state;
  const selectedNode = nodes.find((node) => node.nodeKey === selectedKey) ?? null;

  const [tab, setTab] = useState(() => (selectedKey ? "step" : "flow"));
  const [openKey, setOpenKey] = useState(null);

  const [prevSelectedKey, setPrevSelectedKey] = useState(selectedKey);
  if (prevSelectedKey !== selectedKey) {
    setPrevSelectedKey(selectedKey);
    setOpenKey(null);
    if (selectedKey) setTab("step");
  }

  const [prevPickerOpen, setPrevPickerOpen] = useState(picker.open);
  if (prevPickerOpen !== picker.open) {
    setPrevPickerOpen(picker.open);
    if (picker.open) setTab("flow");
  }

  const layoutClass = layout === "drawer"
    ? "h-full w-full pt-8"
    : "col-span-4 h-[calc(100dvh-5.5rem)] max-w-xl rounded-xl p-2";

  return (
    <motion.div className={`flex min-w-0 flex-col ${layoutClass}`}
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
    >
      <div className="flex h-10 items-center border-b border-neutral-800 px-4 text-sm tracking-wide">
        <div className="flex grow items-center">
          {TABS.map((item, index) => (
            <Fragment key={item.key}>
              {index > 0 && <span className="mx-2 h-3 w-px bg-neutral-800" />}
              <button type="button" onClick={() => setTab(item.key)} aria-pressed={tab === item.key}
                className={`w-full font-semibold transition-colors ${tab === item.key ? "text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                {item.label}
              </button>
            </Fragment>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={tab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="h-full overflow-y-auto px-4 py-4 scrollbar"
          >
            {tab === "step" ? (
              <StepPanel selectedNode={selectedNode} state={state} dispatch={dispatch} schemasByFormId={schemasByFormId}
                issuesByNode={issuesByNode} openKey={openKey} setOpenKey={setOpenKey} onGoToSteps={() => setTab("flow")}
              />
            ) : (
              <FlowPanel state={state} dispatch={dispatch} picker={picker} onRelayout={onRelayout} versions={versions} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

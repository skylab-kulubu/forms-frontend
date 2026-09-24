"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown, ArrowRight, ArrowUp, ChevronRight, CornerDownRight, ExternalLink, Flag, LayoutGrid, Plus, Trash2, X,
} from "lucide-react";
import { Dropdown } from "@/app/components/utils/Dropdown";
import {
  ACTION_ICON, FOCUS_RING, MenuPill, PANEL_SECTION, PANEL_STACK, PanelButton, PanelNotice, PanelTabs, PanelTextarea,
  ROW, ROW_HOVER, SectionHeader, TILE, ToggleRow, actionClass, panelShellClass,
} from "@/app/admin/components/utils/SidePanel";
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

const FLOW_TAB = { id: "flow", label: "Akış" };
const DESCRIPTION_TAB = { id: "description", label: "Açıklama" };

const TRIGGER_SECTION = {
  [TRIGGER.SUBMITTED]: { label: "Gönderildiğinde", description: "Cevap gönderilince başvuru nereye gider?", dot: "bg-neutral-500" },
  [TRIGGER.APPROVED]: { label: "Onaylandığında", description: "Cevap onaylanınca başvuru nereye gider?", dot: "bg-emerald-400" },
  [TRIGGER.DECLINED]: { label: "Reddedildiğinde", description: "Cevap reddedilince başvuru nereye gider?", dot: "bg-red-400" },
};

const INTAKE_STATE = {
  [WORKFLOW_INTAKE.OPEN]: { pill: "Açık", tone: "skylab" },
  [WORKFLOW_INTAKE.NEW_RUNS_CLOSED]: { pill: "Yeni başvuru kapalı", tone: "amber" },
  [WORKFLOW_INTAKE.CLOSED]: { pill: "Kapalı", tone: "red" },
};

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

function IntakeSection({ intakeControl, allowMultipleRuns, onToggleMultipleRuns }) {
  const intake = intakeControl?.intake ?? WORKFLOW_INTAKE.OPEN;
  const info = intakeControl ? INTAKE_STATE[intake] ?? INTAKE_STATE[WORKFLOW_INTAKE.OPEN] : { pill: "Taslak", tone: "neutral" };
  const isOpen = intake !== WORKFLOW_INTAKE.CLOSED;
  const acceptsNewRuns = intake === WORKFLOW_INTAKE.OPEN;

  return (
    <section className={PANEL_SECTION}>
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
        <PanelNotice>
          {intake === WORKFLOW_INTAKE.CLOSED
            ? "Akış kapalı. Başvuranlar kapalı ekranını görür; devam eden başvurular akış açılınca kaldığı yerden sürer."
            : "Yeni başvuru alınmıyor. Başlamış başvurular normal şekilde devam ediyor."}
        </PanelNotice>
      )}

      {intakeControl?.isError && <p className="text-2xs text-red-300">Başvuru durumu değiştirilemedi. Lütfen tekrar deneyin.</p>}
    </section>
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
    <p className="truncate text-sm font-semibold text-neutral-100">
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
  const target = transition.targetNodeKey ?? END_VALUE;

  const subtitle = kind === "cond"
    ? (conditionalCount > 1 ? `${order}. sırada kontrol edilir` : "Koşul uyarsa bu yola gider")
    : kind === "fallback" ? "Koşullardan hiçbiri uymazsa" : "Her cevapta bu yola gider";

  return (
    <div ref={rowRef} data-route-row={transition.localId}
      className={`${ROW} ${isOpen ? "border-skylab-400/30" : `border-white/10 ${ROW_HOVER}`} ${isFlashing ? "ring-3 ring-skylab-500/25" : ""}`}
    >
      <div role="button" tabIndex={0} aria-expanded={isOpen} onClick={onToggle}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); onToggle(); }
        }}
        className={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 ${FOCUS_RING}`}
      >
        <span className={`${TILE} border-white/10 ${kind === "cond" ? "text-neutral-300" : "text-neutral-500"}`}>
          {kind === "cond" ? order : kind === "fallback" ? <CornerDownRight size={14} /> : <ArrowRight size={14} />}
        </span>

        <div className="min-w-0 flex-1">
          {kind === "cond"
            ? <ConditionTitle condition={transition.condition} sourceNode={sourceNode} nodes={nodes} schemasByFormId={schemasByFormId} />
            : <p className="truncate text-sm font-medium italic text-neutral-300">{kind === "fallback" ? "Aksi halde" : "Her zaman"}</p>}
          <p className="truncate text-2xs text-neutral-500">{subtitle}</p>
        </div>

        <MenuPill value={target} options={targetOptions(sourceNode, nodes, transitions)} placeholder="Akış biter" italic={target === END_VALUE}
          onSelect={(value) => dispatch({ type: "UPDATE_TRANSITION", localId: transition.localId, patch: { targetNodeKey: value === END_VALUE ? null : value } })}
          onDelete={kind === "fallback" ? null : () => dispatch({ type: "REMOVE_TRANSITION", localId: transition.localId })}
          deleteLabel="Yönlendirmeyi sil" deleteHint="Önce koşullu yolları kaldır"
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
          <p className="truncate text-2xs text-neutral-500">Yönlendirme yok; akış burada biter</p>
        </div>
        <MenuPill value={END_VALUE} options={targetOptions(sourceNode, nodes, transitions)} placeholder="Akış biter" italic
          open={menuOpen} onOpenChange={onMenuOpenChange}
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
    <section className={PANEL_SECTION}>
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

      <PanelButton icon={Plus} onClick={addRoute} className="w-full">Yönlendirme ekle</PanelButton>
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
    <div className={PANEL_STACK}>
      <section className={PANEL_SECTION}>
        <SectionHeader title="Adım ayarları" description={schema ? `${questionCount} soru` : "Sorular yükleniyor"} />

        {nodeIssues.map((issue, index) => (
          <PanelNotice key={`${issue.code}-${index}`} tone="red">
            {validationMessage(issue)}
            {validationAction(issue) === "openForm" && (
              <Link href={formHref} target="_blank" className="ml-1.5 underline decoration-red-200/40 underline-offset-2 transition-colors hover:text-white">
                Formu düzenle
              </Link>
            )}
          </PanelNotice>
        ))}

        <ToggleRow title="Manuel onay" checked={selectedNode.requiresManualReview}
          description={selectedNode.requiresManualReview
            ? "Cevap yetkili onayını bekler; onaylanınca ve reddedilince ayrı yönlendirilir."
            : "Cevap gönderilince onay beklemeden sonraki adıma geçer."}
          onChange={() => dispatch({ type: "SET_NODE_REVIEW", nodeKey: selectedNode.nodeKey, value: !selectedNode.requiresManualReview })}
        />

        <div className="flex flex-wrap gap-2">
          <Link href={formHref} target="_blank" className={`${actionClass()} min-w-fit flex-1`}>
            <ExternalLink size={13} className={ACTION_ICON} />
            Formu aç
          </Link>
          <PanelButton icon={Flag} disabled={selectedNode.isStart} onClick={() => dispatch({ type: "SET_START", nodeKey: selectedNode.nodeKey })}
            className="min-w-fit flex-1"
          >
            Başlangıç yap
          </PanelButton>
          <PanelButton icon={Trash2} danger onClick={() => dispatch({ type: "REMOVE_NODE", nodeKey: selectedNode.nodeKey })} className="min-w-fit flex-1">
            Adımı çıkar
          </PanelButton>
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
    <div className={PANEL_STACK}>
      <IntakeSection intakeControl={intakeControl} allowMultipleRuns={state.allowMultipleRuns}
        onToggleMultipleRuns={() => dispatch({ type: "SET_META", key: "allowMultipleRuns", value: !state.allowMultipleRuns })}
      />

      <section className={PANEL_SECTION}>
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
                  className={`${ROW} ${ROW_HOVER} ${FOCUS_RING} flex w-full items-center gap-3 border-white/10 px-3 py-2.5 text-left`}
                >
                  <span className={`${TILE} ${node.isStart ? "border-skylab-400/40 text-skylab-300" : "border-white/10 text-neutral-300"}`}>
                    {node.isStart ? 1 : depth ?? "?"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-neutral-100">{node.formTitle}</span>
                    {meta ? <span className="block truncate text-2xs text-neutral-500">{meta}</span> : null}
                  </span>
                  <ChevronRight size={14} className="shrink-0 text-neutral-600" />
                </button>
              );
            })}
          </div>
        )}

        <div className="relative flex flex-wrap gap-2">
          <PanelButton icon={Plus} chevron active={picker.open} onClick={picker.onOpen} className="min-w-fit flex-1">
            Adım ekle
          </PanelButton>
          <PanelButton icon={LayoutGrid} onClick={onRelayout} disabled={state.nodes.length < 2} title="Adımları başlangıçtan itibaren akış sırasına göre dizer"
            className="min-w-fit flex-1"
          >
            Otomatik yerleştir
          </PanelButton>

          <AddStepPicker open={picker.open} forms={picker.forms} usedFormIds={picker.usedFormIds} isLoading={picker.isLoading}
            onClose={picker.onClose} onSelect={picker.onSelect}
          />
        </div>
      </section>

      <section className={PANEL_SECTION}>
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

function DescriptionPanel({ description, dispatch }) {
  return (
    <div className="flex flex-col gap-4 p-4 text-sm text-neutral-200">
      <SectionHeader title="Akış açıklaması" description="Akışın ne için kullanıldığını ekip arkadaşların için yaz." />
      <PanelTextarea rows={6} value={description ?? ""} aria-label="Akış açıklaması" placeholder="Bu akış ne için kullanılıyor?"
        onChange={(event) => dispatch({ type: "SET_META", key: "description", value: event.target.value })}
      />
    </div>
  );
}

export default function WorkflowInspector({ state, dispatch, schemasByFormId, issuesByNode, versions, picker, onRelayout, intakeControl = null, layout = "grid" }) {
  const { nodes, transitions, selectedKey, focus, panelTab } = state;
  const selectedNode = nodes.find((node) => node.nodeKey === selectedKey) ?? null;
  const view = selectedNode && panelTab === "step" ? "step" : panelTab === "description" ? "description" : "flow";
  const tabs = selectedNode
    ? [FLOW_TAB, { id: "step", label: selectedNode.formTitle, title: selectedNode.formTitle }, DESCRIPTION_TAB]
    : [FLOW_TAB, DESCRIPTION_TAB];

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

  return (
    <motion.div className={panelShellClass(layout)}
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.6 }}
    >
      <div className="flex h-full min-w-0 flex-1 flex-col rounded-xl">
        <PanelTabs tabs={tabs} active={view} onChange={(tab) => dispatch({ type: "SET_PANEL_TAB", tab })} />

        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={view === "step" ? `step-${selectedNode.nodeKey}` : view}
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="h-full"
            >
              {view === "step" ? (
                <StepPanel selectedNode={selectedNode} state={state} dispatch={dispatch} schemasByFormId={schemasByFormId}
                  issuesByNode={issuesByNode} openKey={openKey} setOpenKey={setOpenKey} flashKey={flash?.key ?? null}
                />
              ) : view === "description" ? (
                <DescriptionPanel description={state.description} dispatch={dispatch} />
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

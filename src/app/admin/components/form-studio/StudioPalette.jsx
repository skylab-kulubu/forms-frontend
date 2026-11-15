"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FileText, Search, Workflow } from "lucide-react";
import { Input, Kbd } from "@skylab-kulubu/skylcn-ui";
import { useWorkflowsQuery } from "@/lib/hooks/useWorkflowAdmin";
import { useUserFormsQuery } from "@/lib/hooks/useFormAdmin";
import { workflowEditHref } from "@/lib/workflow-links";
import { Floating } from "@/app/components/utils/Floating";
import { POPOVER_MOTION } from "./studio-motion";

const STUDIO_LINKS = {
  form: (form) => `/admin/forms/${form.id}/edit`,
  workflow: (workflow) => workflowEditHref(workflow),
};

function paletteAnchor(root) {
  const row = document.querySelector(`${root} [data-palette-anchor]`)?.parentElement;
  if (row && row.getClientRects().length > 0) return row;
  const rect = document.querySelector(root)?.getBoundingClientRect();
  return { top: (rect?.top ?? 56) + 10, left: rect ? rect.left + rect.width / 2 : window.innerWidth / 2, width: 0, height: 0 };
}

export function PaletteKeys() {
  return (
    <p className="mt-1 flex items-center gap-1 border-t border-ink/5 px-2 pt-1.5 text-3xs text-neutral-600 pointer-coarse:hidden">
      <Kbd>↑↓</Kbd> seç · <Kbd>Enter</Kbd> aç · <Kbd>Esc</Kbd> kapat
    </p>
  );
}

function listOf(payload) {
  const data = payload?.data ?? payload;
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.items) ? data.items : [];
}

export default function StudioPalette({ current, onPickStep, onNavigate, onClose, root = "[data-studio-root]", links = STUDIO_LINKS }) {
  const [anchor] = useState(() => paletteAnchor(root));
  const docked = anchor?.nodeType === 1;
  const inputRef = useRef(null);
  const [search, setSearch] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const { data: workflowsData } = useWorkflowsQuery({ pageSize: 50 });
  const { data: formsData } = useUserFormsQuery({ pageSize: 50 });

  const query = search.trim().toLocaleLowerCase("tr-TR");

  const items = useMemo(() => {
    const matches = (text) => !query || (text ?? "").toLocaleLowerCase("tr-TR").includes(query);
    const own = (current.steps ?? []).map((step) => ({
      key: `step-${step.formId}`,
      kind: "step",
      formId: step.formId,
      label: step.title || "Adsız form",
      meta: step.formId === current.activeFormId ? "açık" : step.meta,
      Icon: FileText,
      group: current.workflowId ? `Bu akış · ${current.workflowName || "Adsız akış"}` : "Açık form",
    }));

    const workflows = listOf(workflowsData)
      .filter((workflow) => workflow.id !== current.workflowId)
      .map((workflow) => ({
        key: `workflow-${workflow.id}`,
        kind: "workflow",
        href: links.workflow(workflow),
        label: workflow.name || "Adsız akış",
        meta: `${workflow.nodeCount ?? 0} adım`,
        Icon: Workflow,
        group: "Akışlar",
      }));

    const forms = listOf(formsData).filter((form) => form.id !== current.activeFormId);
    const solos = forms.filter((form) => !form.workflow).map((form) => ({
      key: `form-${form.id}`,
      kind: "form",
      href: links.form(form),
      label: form.title || "Adsız form",
      meta: "tek başına",
      Icon: FileText,
      group: "Tek başına formlar",
    }));
    const inner = query
      ? forms.filter((form) => form.workflow && form.workflow.id !== current.workflowId).map((form) => ({
        key: `inner-${form.id}`,
        kind: "form",
        href: links.form(form),
        label: form.title || "Adsız form",
        meta: form.workflow.name || "akışta",
        Icon: FileText,
        group: "Akışlardaki formlar",
      }))
      : [];

    return [...own, ...workflows, ...solos, ...inner].filter((item) => matches(item.label));
  }, [current, workflowsData, formsData, query, links]);

  const choose = (item) => {
    if (!item) return;
    if (item.kind === "step") onPickStep(item.formId);
    else onNavigate(item.href);
  };

  useEffect(() => {
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(items.length - 1, index + 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(0, index - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      choose(items[activeIndex]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      onClose();
    }
  };

  return (
    <Floating anchor={anchor} onDismiss={onClose} placement={docked ? "bottom-start" : "bottom"} matchWidth={docked} offset={docked ? 4 : 6}>
      <motion.div role="dialog" aria-label="Akış ya da form aç" {...POPOVER_MOTION}
        className={`${docked ? "w-full" : "w-[min(24rem,calc(100vw-1rem))]"} rounded-[10px] border border-ink/20 bg-panel p-1.5 shadow-2xl shadow-black/50`}
      >
        <Input ref={inputRef} inputSize="sm" icon={Search} className="mb-1" value={search} onChange={(event) => { setSearch(event.target.value); setActiveIndex(0); }} onKeyDown={handleKeyDown}
          placeholder="Akış ya da form ara..." aria-label="Akış ya da form ara"
        />
        <div className="max-h-72 overflow-y-auto scrollbar">
          {items.length === 0 ? <p className="px-2 py-3 text-center text-2xs text-neutral-600">Eşleşen akış ya da form yok.</p> : null}
          {items.map((item, index) => {
            const head = index === 0 || items[index - 1].group !== item.group ? <p className="px-2 pb-1 pt-2 text-3xs text-neutral-500">{item.group}</p> : null;
            return (
              <Fragment key={item.key}>
                {head}
                <button type="button" onMouseEnter={() => setActiveIndex(index)} onClick={() => choose(item)}
                  className={`flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left text-2xs transition-colors ${index === activeIndex ? "bg-ink/6 text-ink" : "text-neutral-300"}`}
                >
                  <item.Icon size={14} className="shrink-0 text-neutral-500" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <span className="max-w-24 shrink-0 truncate text-3xs text-neutral-600">{item.meta}</span>
                </button>
              </Fragment>
            );
          })}
        </div>
        <PaletteKeys />
      </motion.div>
    </Floating>
  );
}

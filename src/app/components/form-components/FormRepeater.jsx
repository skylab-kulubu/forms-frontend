"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, X } from "lucide-react";
import { Button, IconButton } from "@skylab-kulubu/skylcn-ui";
import { REGISTRY } from "../form-registry";
import { formatFieldAnswer } from "../form-answer-format";
import { QuestionField } from "./QuestionParts";

const ONE_RECORD = "En az bir kayıt girin";
const FILL_RECORDS = "Kayıtlardaki zorunlu alanları doldurun";

function emptyCellFor(type) {
  if (type === "multi_choice") return [];
  if (type === "toggle") return false;
  return "";
}

function emptyRow(fields) {
  const row = {};
  fields.forEach((f) => { row[f.id] = emptyCellFor(f.type); });
  return row;
}

export function repeaterColumnLabels(fields) {
  const cols = Array.isArray(fields) ? fields : [];
  const seen = {};
  return cols.map((child) => {
    const base = (child.props?.question || "").trim() || (REGISTRY[child.type]?.label ?? child.type);
    if (seen[base] === undefined) {
      seen[base] = 1;
      return base;
    }
    seen[base] += 1;
    return `${base} (${seen[base]})`;
  });
}

export function serializeRepeater(fields, value) {
  const cols = Array.isArray(fields) ? fields : [];
  const rows = Array.isArray(value) ? value : [];
  const labels = repeaterColumnLabels(cols);
  const out = rows
    .map((row) => {
      const o = {};
      cols.forEach((child, i) => { o[labels[i]] = formatFieldAnswer(child, row?.[child.id]); });
      return o;
    })
    .filter((o) => Object.values(o).some((v) => String(v).trim() !== ""));
  return out.length ? JSON.stringify(out) : "";
}

export const RECORD_RULES = ["marked", "all", "any"];

export function recordRuleOf(props) {
  return RECORD_RULES.includes(props?.recordRule) ? props.recordRule : "all";
}

export function isChildRequired(props, child) {
  const rule = recordRuleOf(props);
  return rule === "all" || (rule === "marked" && Boolean(child?.props?.required));
}

function isAnswered(child, value) {
  if (child.type === "toggle") return value === true;
  if (Array.isArray(value)) return value.length > 0;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return value != null && String(value).trim() !== "";
}

function missingInRecord(props, row) {
  const cols = Array.isArray(props?.fields) ? props.fields : [];
  const rule = recordRuleOf(props);
  if (rule === "any") return [];
  return cols.filter((child) => {
    if (!isChildRequired(props, child)) return false;
    const value = row?.[child.id];
    if (rule === "all" && child.type === "toggle") return typeof value !== "boolean";
    return !isAnswered(child, value);
  }).map((child) => child.id);
}

export function repeaterMissing(props, value, required = false) {
  const cols = Array.isArray(props?.fields) ? props.fields : [];
  const rows = Array.isArray(value) && value.length ? value : [{}];
  const missing = new Map();
  if (!cols.length) return missing;
  const started = rows.map((row) => cols.some((child) => isAnswered(child, row?.[child.id])));
  rows.forEach((row, index) => {
    if (!started[index]) return;
    const ids = missingInRecord(props, row);
    if (ids.length) missing.set(index, ids);
  });
  if (required && !started.some(Boolean)) {
    const marked = recordRuleOf(props) === "marked" ? cols.filter((child) => isChildRequired(props, child)) : [];
    const fillable = cols.filter((child) => child.type !== "toggle");
    missing.set(0, (marked.length ? marked : fillable.length ? fillable : cols).map((child) => child.id));
  }
  return missing;
}

export function isRepeaterMissing(props, value, required = false) {
  return repeaterMissing(props, value, required).size > 0;
}

export function DisplayFormRepeater({ question, questionNumber, description, required = false, fields = [], recordRule, value, onChange, missing = false }) {
  const cols = Array.isArray(fields) ? fields : [];
  const rules = { fields: cols, recordRule };
  const normalize = (v) => (Array.isArray(v) ? v : []);
  const [internal, setInternal] = useState(normalize(value));
  const committed = value !== undefined ? normalize(value) : internal;
  const rows = committed.length ? committed : [emptyRow(cols)];

  const commit = (next) => {
    if (onChange) onChange({ target: { value: next } });
    else setInternal(next);
  };

  const updateCell = (rowIdx, childId, cellVal) => {
    commit(rows.map((r, i) => (i === rowIdx ? { ...r, [childId]: cellVal } : r)));
  };
  const addRow = () => commit([...rows, emptyRow(cols)]);
  const removeRow = (rowIdx) => commit(rows.filter((_, i) => i !== rowIdx));

  const hasFields = cols.length > 0;
  const missingCells = missing ? repeaterMissing(rules, rows, required) : new Map();
  const started = rows.some((row) => cols.some((child) => isAnswered(child, row?.[child.id])));

  return (
    <QuestionField question={question} questionNumber={questionNumber} description={description} required={required} missing={missing}
      requiredText={ONE_RECORD} missingText={started ? FILL_RECORDS : ONE_RECORD}
    >
      {!hasFields ? (
        <p className="text-xs italic text-subtle-foreground">Bu grup için henüz alan tanımlanmadı.</p>
      ) : (
        <div className={`flex flex-col gap-3 rounded-xl ${missing ? "ring-1 ring-destructive/40" : ""}`}>
          <AnimatePresence initial={false}>
            {rows.map((row, rowIdx) => (
              <motion.div key={rowIdx} layout
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, scale: 0.97 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="rounded-lg border border-border bg-card"
              >
                <div className="flex min-h-9 items-center justify-between border-b border-border-subtle py-1 pr-1 pl-3">
                  <span className="text-3xs font-medium text-subtle-foreground">{rowIdx + 1}. kayıt</span>
                  {rows.length > 1 && (
                    <IconButton icon={X} label="Kaydı kaldır" variant="ghost" size="icon-sm" onClick={() => removeRow(rowIdx)} />
                  )}
                </div>
                <div className="flex flex-col gap-3 p-3">
                  {cols.map((child) => {
                    const entry = REGISTRY[child.type];
                    const ChildDisplay = entry?.Display;
                    if (!ChildDisplay) return null;
                    return (
                      <ChildDisplay key={child.id} {...child.props} required={isChildRequired(rules, child)} disableAutoFill compact questionNumber={null}
                        value={row[child.id]} onChange={(e) => updateCell(rowIdx, child.id, e.target.value)}
                        missing={Boolean(missingCells.get(rowIdx)?.includes(child.id))}
                      />
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <Button variant="outline" size="lg" onClick={addRow} className="w-full border-dashed">
            <Plus /> Kayıt Ekle
          </Button>
        </div>
      )}
    </QuestionField>
  );
}

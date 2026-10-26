"use client";

import { Calendar, ChevronsUpDown, Clock, Link as LinkIcon } from "lucide-react";
import { INPUT_TYPES } from "@/app/components/form-components/FormShortText";
import { FilePreview } from "../response-displayer/components/FilePreview";
import { answerKey, choiceItems, formatAnswerDate, isEmptyAnswer, matrixOf, recordsOf } from "./response-data";

const BOX = "rounded-lg border border-white/10 bg-neutral-900/60";
const EMPTY = "Cevap yok";

function linkOf(text) {
  return /^https?:\/\/\S+$/i.test(text) ? text : null;
}

function TextValue({ text }) {
  const href = linkOf(text);
  if (!href) return text;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}
      className="pointer-events-auto text-skylab-300 underline decoration-skylab-300/30 underline-offset-2 transition-colors hover:decoration-skylab-300/70"
    >
      {text}
    </a>
  );
}

function ShortAnswer({ field, answer }) {
  const props = field.props ?? {};
  const input = INPUT_TYPES.find((type) => type.id === (props.inputType || "text")) ?? INPUT_TYPES[0];
  const Icon = field.type === "link" ? LinkIcon : input.icon;
  const empty = isEmptyAnswer(answer);
  const lines = empty ? [] : answerKey(answer).split(/\r?\n/).filter(Boolean);

  return (
    <div className="relative mt-3 flex w-full items-start">
      <div className="pointer-events-none absolute left-3.5 top-2.5 flex items-center text-neutral-500"><Icon size={16} strokeWidth={2} /></div>
      <div className={`block w-full py-2 pl-10 pr-4 text-sm wrap-anywhere ${BOX} ${empty ? "text-neutral-600" : "text-neutral-100"}`}>
        {empty ? EMPTY : lines.map((line, index) => <p key={index}><TextValue text={line} /></p>)}
      </div>
    </div>
  );
}

function LongAnswer({ answer }) {
  const empty = isEmptyAnswer(answer);
  return (
    <div className={`mt-3 block min-h-19.5 w-full whitespace-pre-wrap px-3 py-2 text-sm wrap-anywhere ${BOX} ${empty ? "text-neutral-600" : "text-neutral-100"}`}>
      {empty ? EMPTY : answerKey(answer)}
    </div>
  );
}

function IconAnswer({ Icon, text, empty }) {
  return (
    <div className="relative mt-3">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"><Icon size={16} /></span>
      <div className={`flex w-full items-center py-2 pl-9 pr-3 text-sm ${BOX} ${empty ? "text-neutral-600" : "text-neutral-100"}`}>{empty ? EMPTY : text}</div>
    </div>
  );
}

function ChoiceAnswer({ field, answer }) {
  const choices = Array.isArray(field.props?.choices) ? field.props.choices.map(String) : [];
  const { selected, extra } = choiceItems(field, answer);
  const rows = [...choices.map((label) => ({ label, on: selected.includes(label) })), ...extra.map((label) => ({ label, on: true }))];

  if (rows.length === 0) return <IconAnswer Icon={ChevronsUpDown} text={answerKey(answer)} empty={isEmptyAnswer(answer)} />;

  return (
    <div className="mt-3 flex flex-col gap-2">
      {rows.map((row, index) => (
        <div key={`${row.label}-${index}`} className={`flex items-center gap-3 rounded-md border p-2 ${row.on ? "border-skylab-400/10 bg-skylab-400/20" : "border-white/10 bg-neutral-900/60"}`}>
          <input type="checkbox" className="checkbox shrink-0" checked={row.on} readOnly tabIndex={-1} aria-label={row.label} />
          <span className="text-sm text-neutral-200">{row.label}</span>
        </div>
      ))}
    </div>
  );
}

function ToggleAnswer({ field, answer }) {
  const props = field.props ?? {};
  const trueLabel = props.trueLabel || "Evet";
  const falseLabel = props.falseLabel || "Hayır";
  const empty = isEmptyAnswer(answer);
  const text = answerKey(answer);
  const on = text === trueLabel || text === "true";

  return (
    <div className={`mt-3 flex w-full items-center justify-between gap-4 px-4 py-1.5 ${BOX}`}>
      <span className={`text-sm font-medium ${empty ? "text-neutral-600" : on ? "text-skylab-300" : "text-neutral-400"}`}>
        {empty ? EMPTY : on ? trueLabel : text === "false" ? falseLabel : text}
      </span>
      <span className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-lg border-2 border-transparent ${on ? "bg-skylab-400" : "bg-neutral-700"}`}>
        <span className={`inline-block h-4 w-4 rounded-md bg-white shadow ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
      </span>
    </div>
  );
}

function SliderAnswer({ field, answer }) {
  const props = field.props ?? {};
  const min = Number(props.min ?? 0);
  const max = Number(props.max ?? 100);
  const empty = isEmptyAnswer(answer);
  const value = Number(answerKey(answer));
  const position = !empty && Number.isFinite(value) && max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : null;

  return (
    <div className={`mt-3 flex w-full items-center gap-4 px-4 py-2.5 ${BOX}`}>
      <span className="w-6 shrink-0 text-right text-xs font-medium text-neutral-500">{min}</span>
      <span className="relative h-1 flex-1 rounded-lg bg-neutral-800">
        {position != null ? (
          <>
            <span className="absolute inset-y-0 left-0 rounded-lg bg-pink-400/40" style={{ width: `${position}%` }} />
            <span className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-neutral-200" style={{ left: `${position}%` }} />
          </>
        ) : null}
      </span>
      <span className="w-6 shrink-0 text-xs font-medium text-neutral-500">{max}</span>
      <span className="mx-1 h-5 w-px shrink-0 bg-white/10" />
      <span className={`min-w-10 text-center text-sm ${empty ? "text-neutral-600" : "text-neutral-200"}`}>{empty ? "—" : answerKey(answer)}</span>
    </div>
  );
}

function MatrixAnswer({ field, answer }) {
  const props = field.props ?? {};
  const picked = matrixOf(answer);
  const rows = Array.isArray(props.rows) && props.rows.length ? props.rows : Object.keys(picked);
  const columns = Array.isArray(props.columns) && props.columns.length ? props.columns : [...new Set(Object.values(picked))];

  if (rows.length === 0) return <LongAnswer answer={answer} />;

  return (
    <div className="mt-3 w-full overflow-x-auto rounded-lg border border-white/10">
      <table className="w-full text-left text-xs">
        <thead className="bg-white/3 text-neutral-400">
          <tr>
            <th className="px-3 py-2 font-medium" />
            {columns.map((column) => <th key={column} className="px-2 py-2 text-center font-medium">{column}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((row) => (
            <tr key={row}>
              <td className="px-3 py-2 text-neutral-200">{row}</td>
              {columns.map((column) => (
                <td key={column} className="px-2 py-2 text-center">
                  <span className={`inline-block size-3.5 rounded-full border ${picked[row] === column ? "border-skylab-300 bg-skylab-400 shadow-[inset_0_0_0_3px_#1a1a1a]" : "border-white/20"}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecordsAnswer({ answer }) {
  const records = recordsOf(answer);
  if (records.length === 0) return <LongAnswer answer={null} />;
  const columns = Object.keys(records[0] ?? {});

  return (
    <div className="mt-3 flex flex-col gap-2">
      {records.map((record, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-white/10 bg-white/3">
          <div className="border-b border-white/5 px-3 py-1.5 text-3xs font-medium text-neutral-500">{index + 1}. kayıt</div>
          <div className="divide-y divide-white/5">
            {columns.map((column) => {
              const cell = record?.[column];
              const text = cell == null ? "" : String(cell).trim();
              return (
                <div key={column} className="flex gap-3 px-3 py-2">
                  <span className="w-28 shrink-0 text-xs font-medium text-neutral-400 wrap-anywhere">{column}</span>
                  <span className={`min-w-0 flex-1 whitespace-pre-wrap text-sm wrap-anywhere ${text ? "text-neutral-100" : "text-neutral-600"}`}>{text || "—"}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function FileAnswer({ answer, responseId }) {
  if (isEmptyAnswer(answer)) {
    return <div className="mt-3 flex h-16 w-full items-center rounded-lg border border-dashed border-white/10 bg-neutral-900/40 px-4 text-sm text-neutral-600">Dosya yüklenmedi</div>;
  }
  return (
    <div className="pointer-events-auto mt-3" onClick={(event) => event.stopPropagation()}>
      <FilePreview mediaId={answerKey(answer)} responseId={responseId} />
    </div>
  );
}

export default function AnswerControl({ field, answer, responseId }) {
  switch (field.type) {
    case "short_text":
    case "link":
      return <ShortAnswer field={field} answer={answer} />;
    case "long_text":
      return <LongAnswer answer={answer} />;
    case "combobox":
      return <IconAnswer Icon={ChevronsUpDown} text={answerKey(answer)} empty={isEmptyAnswer(answer)} />;
    case "multi_choice":
      return <ChoiceAnswer field={field} answer={answer} />;
    case "toggle":
      return <ToggleAnswer field={field} answer={answer} />;
    case "slider":
      return <SliderAnswer field={field} answer={answer} />;
    case "file":
      return <FileAnswer answer={answer} responseId={responseId} />;
    case "date":
      return <IconAnswer Icon={Calendar} text={formatAnswerDate(answer)} empty={isEmptyAnswer(answer)} />;
    case "time":
      return <IconAnswer Icon={Clock} text={answerKey(answer)} empty={isEmptyAnswer(answer)} />;
    case "matrix":
      return <MatrixAnswer field={field} answer={answer} />;
    case "repeater":
      return <RecordsAnswer answer={answer} />;
    default:
      return <LongAnswer answer={answer} />;
  }
}

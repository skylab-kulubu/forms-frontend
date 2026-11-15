"use client";

import { Calendar, ChevronsUpDown, Clock, Link as LinkIcon } from "lucide-react";
import { CheckboxCard, ChoiceMatrix, ToggleRow } from "@skylab-kulubu/skylcn-ui";
import { INPUT_TYPES } from "@/app/components/form-components/FormShortText";
import { FilePreview } from "../response-displayer/components/FilePreview";
import { answerKey, choiceItems, formatAnswerDate, isEmptyAnswer, matrixOf, recordsOf } from "./response-data";

// The room shows an answer the way the applicant saw the question: skylcn's lg control box, drawn
// static since an answer is read, not edited
const BOX = "rounded-lg border border-input bg-background/60";
const EMPTY = "Cevap yok";
const tone = (empty) => (empty ? "text-subtle-foreground" : "text-foreground");

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
      <div className="pointer-events-none absolute left-3 top-2.75 flex items-center text-subtle-foreground"><Icon className="size-4" /></div>
      <div className={`block min-h-9.5 w-full py-2 pl-9 pr-3 text-sm wrap-anywhere ${BOX} ${tone(empty)}`}>
        {empty ? EMPTY : lines.map((line, index) => <p key={index}><TextValue text={line} /></p>)}
      </div>
    </div>
  );
}

function LongAnswer({ answer }) {
  const empty = isEmptyAnswer(answer);
  return (
    <div className={`mt-3 block min-h-19.5 w-full whitespace-pre-wrap px-3 py-2 text-sm wrap-anywhere ${BOX} ${tone(empty)}`}>
      {empty ? EMPTY : answerKey(answer)}
    </div>
  );
}

function IconAnswer({ Icon, text, empty }) {
  return (
    <div className="relative mt-3">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle-foreground"><Icon className="size-4" /></span>
      <div className={`flex min-h-9.5 w-full items-center py-2 pl-9 pr-3 text-sm ${BOX} ${tone(empty)}`}>{empty ? EMPTY : text}</div>
    </div>
  );
}

function ChoiceAnswer({ field, answer }) {
  const choices = Array.isArray(field.props?.choices) ? field.props.choices.map(String) : [];
  const { selected, extra } = choiceItems(field, answer);
  const rows = [...choices.map((label) => ({ label, on: selected.includes(label) })), ...extra.map((label) => ({ label, on: true }))];

  if (rows.length === 0) return <IconAnswer Icon={ChevronsUpDown} text={answerKey(answer)} empty={isEmptyAnswer(answer)} />;

  // skylcn's checkbox cards as the respondent's ChoiceList draws them; read-only keeps them announced but fixed
  return (
    <div className="mt-3 flex flex-col gap-2">
      {rows.map((row, index) => (
        <CheckboxCard key={`${row.label}-${index}`} size="lg" label={row.label} checked={row.on} readOnly tabIndex={-1} />
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
  const title = empty ? <span className="font-normal text-subtle-foreground">{EMPTY}</span> : on ? trueLabel : text === "false" ? falseLabel : text;

  return <ToggleRow className="mt-3" title={title} checked={on} readOnly tabIndex={-1} />;
}

// skylcn's Slider has no read-only state, so its track, thumb, value and ends are drawn here in its classes
function SliderAnswer({ field, answer }) {
  const props = field.props ?? {};
  const min = Number(props.min ?? 0);
  const max = Number(props.max ?? 100);
  const empty = isEmptyAnswer(answer);
  const value = Number(answerKey(answer));
  const position = !empty && Number.isFinite(value) && max > min ? Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)) : null;

  return (
    <div className="mt-3 flex w-full flex-col gap-2">
      <span className={`self-end text-xs tabular-nums ${empty ? "text-subtle-foreground" : "text-foreground"}`}>{empty ? EMPTY : answerKey(answer)}</span>
      <span className="flex h-5 w-full items-center">
        <span className="relative h-1.5 w-full rounded-full bg-muted">
          {position != null ? (
            <>
              <span className="absolute inset-y-0 left-0 rounded-full bg-skylab-500" style={{ width: `${position}%` }} />
              <span className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-skylab-400 bg-background shadow-sm" style={{ left: `${position}%` }} />
            </>
          ) : null}
        </span>
      </span>
      <span className="-mt-1 flex justify-between gap-3 text-2xs tabular-nums text-subtle-foreground">
        <span>{min}</span>
        <span className="text-right">{max}</span>
      </span>
    </div>
  );
}

function MatrixAnswer({ field, answer }) {
  const props = field.props ?? {};
  const picked = matrixOf(answer);
  const rows = Array.isArray(props.rows) && props.rows.length ? props.rows : Object.keys(picked);
  const columns = Array.isArray(props.columns) && props.columns.length ? props.columns : [...new Set(Object.values(picked))];

  if (rows.length === 0) return <LongAnswer answer={answer} />;

  // The applicant's matrix, read-only: the table where it fits, else each row beside its answer
  return (
    <ChoiceMatrix readOnly className="mt-3 w-full" value={picked}
      rows={rows.map((row) => ({ value: row, label: row }))}
      columns={columns.map((column) => ({ value: column, label: column }))}
    />
  );
}

function RecordsAnswer({ answer }) {
  const records = recordsOf(answer);
  if (records.length === 0) return <LongAnswer answer={null} />;
  const columns = Object.keys(records[0] ?? {});

  return (
    <div className="mt-3 flex flex-col gap-2">
      {records.map((record, index) => (
        <div key={index} className="overflow-hidden rounded-lg border border-ink/10 bg-ink/3">
          <div className="border-b border-ink/5 px-3 py-1.5 text-3xs font-medium text-neutral-500">{index + 1}. kayıt</div>
          <div className="divide-y divide-ink/5">
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
    return <div className="mt-3 flex h-16 w-full items-center rounded-lg border border-dashed border-border px-4 text-sm text-subtle-foreground">Dosya yüklenmedi</div>;
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

import {
  AlignLeft, Calendar, ChevronsUpDown, Clock, Grid3X3, ListChecks, Paperclip, Rows3, SeparatorHorizontal, SlidersHorizontal, ToggleRight, Type,
} from "lucide-react";
import { REGISTRY } from "@/app/components/form-registry";
import { FIELD_OPERATORS } from "../form-editor/components/ConditionSelector";
import { isFieldMissing } from "@/app/components/form-displayer/hooks/useFormDisplayer";
import { getVisibleFields } from "@/app/components/form-displayer/components/conditionChecker";

export const FIELD_TYPES = {
  short_text: { label: "Kısa Yanıt", Icon: Type },
  long_text: { label: "Uzun Yanıt", Icon: AlignLeft },
  toggle: { label: "Aç / Kapat", Icon: ToggleRight },
  combobox: { label: "Açılır Liste", Icon: ChevronsUpDown },
  multi_choice: { label: "Çoklu Seçim", Icon: ListChecks },
  slider: { label: "Aralık", Icon: SlidersHorizontal },
  matrix: { label: "Matris Tablo", Icon: Grid3X3 },
  date: { label: "Tarih", Icon: Calendar },
  time: { label: "Saat", Icon: Clock },
  file: { label: "Dosya", Icon: Paperclip },
  separator: { label: "Ayıraç", Icon: SeparatorHorizontal },
  repeater: { label: "Tekrarlanan Grup", Icon: Rows3 },
};

export const INSERT_CATEGORIES = [
  { label: "Metin", types: ["short_text", "long_text"] },
  { label: "Seçim", types: ["toggle", "combobox", "multi_choice", "slider", "matrix"] },
  { label: "Tarih & Saat", types: ["date", "time"] },
  { label: "Diğer", types: ["file", "separator"] },
];

export const REPEATER_CHILD_TYPES = ["short_text", "long_text", "toggle", "combobox", "multi_choice", "date", "time"];

export const RETYPE_OPTIONS =[...INSERT_CATEGORIES.flatMap((category) => category.types), "repeater"]
  .map((type) => ({ value: type, label: FIELD_TYPES[type].label }));

export const NO_VALUE_OPERATORS = ["is_set", "is_empty", "is_true", "is_false"];

const CHOICE_TYPES = ["combobox", "multi_choice"];

export function fieldTypeOf(field) {
  return FIELD_TYPES[field?.type] ?? FIELD_TYPES.short_text;
}

export function questionNumbers(fields) {
  const numbers = new Map();
  let counter = 0;
  (fields ?? []).forEach((field) => {
    if (field.type !== "separator") numbers.set(field.id, ++counter);
  });
  return numbers;
}

export function insertIndexOf(fields, selection) {
  const positions = (selection?.kind === "fields" ? selection.ids : [])
    .map((id) => fields.findIndex((field) => field.id === id))
    .filter((position) => position >= 0);
  return positions.length ? Math.max(...positions) + 1 : fields.length;
}

export function fieldLabel(field) {
  if (!field) return "";
  if (field.type === "separator") return field.props?.title || "Ayıraç";
  return field.props?.question || fieldTypeOf(field).label;
}

export function newFieldOf(type, id) {
  return { id, type, props: structuredClone(REGISTRY[type]?.defaults ?? {}) };
}

export function operatorsFor(field) {
  if (!field) return [];
  switch (field.type) {
    case "file": return FIELD_OPERATORS.file;
    case "matrix":
    case "repeater": return FIELD_OPERATORS.matrix;
    case "long_text": return FIELD_OPERATORS.long_text;
    case "toggle": return FIELD_OPERATORS.boolean;
    case "multi_choice":
    case "combobox": return FIELD_OPERATORS.choice;
    case "date": return FIELD_OPERATORS.date;
    case "time": return FIELD_OPERATORS.time;
    case "slider": return FIELD_OPERATORS.number;
    case "short_text": {
      const input = field.props?.inputType;
      if (input === "number") return FIELD_OPERATORS.number;
      if (input === "phone") return FIELD_OPERATORS.phone;
      if (input === "email") return FIELD_OPERATORS.email;
      if (input === "link") return FIELD_OPERATORS.link;
      return FIELD_OPERATORS.text;
    }
    default: return FIELD_OPERATORS.text;
  }
}

export function defaultCondition(source) {
  if (!source) return null;
  const operator = operatorsFor(source)[0]?.value ?? "is_set";
  const value = NO_VALUE_OPERATORS.includes(operator) || !CHOICE_TYPES.includes(source.type) ? "" : source.props?.choices?.[0] ?? "";
  return { fieldId: source.id, operator, value };
}

export function conditionPhrase(condition, fields) {
  const source = (fields ?? []).find((field) => field.id === condition?.fieldId);
  if (!source) return null;
  const value = condition.value || "?";
  const choice = CHOICE_TYPES.includes(source.type);

  switch (condition.operator) {
    case "equals": return choice ? `${value} seçilirse` : `“${value}” ise`;
    case "not_equals": return choice ? `${value} seçilmezse` : `“${value}” değilse`;
    case "contains": return `“${value}” içerirse`;
    case "is_set": return source.type === "file" ? "dosya yüklenirse" : "cevaplanırsa";
    case "is_empty": return source.type === "file" ? "dosya yüklenmezse" : "boş kalırsa";
    case "is_true": return `${source.props?.trueLabel || "Evet"} ise`;
    case "is_false": return `${source.props?.falseLabel || "Hayır"} ise`;
    case "greater_than": return `${value} değerinden büyükse`;
    case "less_than": return `${value} değerinden küçükse`;
    case "before": return `${value} öncesiyse`;
    case "after": return `${value} sonrasıysa`;
    default: return null;
  }
}

export function conditionLabel(field, fields, numbers) {
  if (!field?.condition?.fieldId) return null;
  const phrase = conditionPhrase(field.condition, fields);
  const number = numbers.get(field.condition.fieldId);
  return phrase && number ? `${number}. soruda ${phrase}` : null;
}

export function pruneConditions(fields) {
  const index = new Map(fields.map((field, position) => [field.id, position]));
  let removed = 0;
  const next = fields.map((field, position) => {
    const sourceIndex = field.condition?.fieldId ? index.get(field.condition.fieldId) : undefined;
    if (!field.condition || (sourceIndex !== undefined && sourceIndex < position && fields[sourceIndex].type !== "separator")) return field;
    const { condition, ...rest } = field;
    removed += 1;
    return rest;
  });
  return { fields: removed ? next : fields, removed };
}

export function retypeField(field, type) {
  const old = field.props ?? {};
  const base = structuredClone(REGISTRY[type]?.defaults ?? {});

  if (type === "separator") {
    const { condition, ...rest } = field;
    return { ...rest, type, props: { title: old.question ?? old.title ?? "", description: old.description ?? "" } };
  }

  const props = { ...base, question: old.question ?? old.title ?? "", description: old.description ?? "", required: Boolean(old.required) };
  if (Array.isArray(base.choices) && Array.isArray(old.choices) && old.choices.length > 0) {
    props.choices = old.choices;
    if (type === "combobox" && old.preset) props.preset = old.preset;
  }
  return { ...field, type, props };
}

export function dropInvalidDependents(fields, sourceId) {
  const source = fields.find((field) => field.id === sourceId);
  const allowed = new Set(operatorsFor(source).map((operator) => operator.value));
  let removed = 0;
  const next = fields.map((field) => {
    if (field.condition?.fieldId !== sourceId) return field;
    if (source && source.type !== "separator" && allowed.has(field.condition.operator)) return field;
    const { condition, ...rest } = field;
    removed += 1;
    return rest;
  });
  return { fields: removed ? next : fields, removed };
}

export function visibleFieldsOf(fields, values) {
  return getVisibleFields(fields ?? [], values ?? {});
}

export function missingFieldIds(fields, values) {
  return visibleFieldsOf(fields, values).filter((field) => isFieldMissing(field, values?.[field.id])).map((field) => field.id);
}

export function requiredFill(fields, values) {
  const questions = visibleFieldsOf(fields, values).filter((field) => field.type !== "separator");
  const required = questions.filter((field) => field.props?.required);
  if (required.length === 0) return 0;
  const done = required.filter((field) => !isFieldMissing(field, values?.[field.id])).length;
  return Math.round((done / required.length) * 100);
}

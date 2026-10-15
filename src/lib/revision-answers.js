import { repeaterColumnLabels } from "@/app/components/form-components/FormRepeater";

// formatFieldAnswer'ın tersi: düzeltme istenen gönderimin metin cevaplarını formun alan değerlerine
// çevirir. Seçenekler görünen adlarıyla saklandığı için adı sonradan değişen seçenek eşleşmez, boş kalır.

function normalizeChoices(choices) {
  return (Array.isArray(choices) ? choices : []).map((choice, index) => (typeof choice === "string"
    ? { id: String(index), label: choice }
    : { id: String(choice?.id ?? choice?.value ?? index), label: String(choice?.label ?? choice?.value ?? "") }));
}

// "Yazılım, Tasarım" seçeneklere ayrılır; adında virgül geçen seçenek de en uzun eşleşmeyle tanınır.
function splitChoices(text, labels) {
  const parts = text.split(", ");
  const picked = [];
  let start = 0;

  while (start < parts.length) {
    let end = parts.length;
    while (end > start && !labels.includes(parts.slice(start, end).join(", "))) end -= 1;

    if (end > start) {
      picked.push(parts.slice(start, end).join(", "));
      start = end;
    } else {
      start += 1;
    }
  }

  return picked;
}

function emptyCellFor(type) {
  if (type === "multi_choice") return [];
  if (type === "toggle") return false;
  return "";
}

export function fieldValueOf(field, answer) {
  const text = answer == null ? "" : String(answer);
  if (text.trim() === "") return undefined;
  const props = field.props ?? {};

  switch (field.type) {
    case "multi_choice": {
      const choices = normalizeChoices(props.choices);
      const labels = choices.map((choice) => choice.label);
      return splitChoices(text, labels).map((label) => choices.find((choice) => choice.label === label).id);
    }
    case "combobox": {
      const choice = normalizeChoices(props.choices).find((item) => item.label === text);
      if (choice) return choice.id;
      return props.allowCustom ? text : undefined;
    }
    case "toggle":
      return text === (props.trueLabel || "Evet");
    case "slider": {
      const number = Number(text);
      return Number.isFinite(number) ? number : undefined;
    }
    case "link":
      return props.allowMultiple ? text.split(", ").filter(Boolean) : text;
    case "matrix":
      try { return JSON.parse(text); } catch { return undefined; }
    case "repeater": {
      const columns = Array.isArray(props.fields) ? props.fields : [];
      const labels = repeaterColumnLabels(columns);
      try {
        const rows = JSON.parse(text);
        if (!Array.isArray(rows)) return undefined;
        return rows.map((row) => Object.fromEntries(columns.map((child, index) => [
          child.id,
          fieldValueOf(child, row?.[labels[index]]) ?? emptyCellFor(child.type),
        ])));
      } catch {
        return undefined;
      }
    }
    default:
      return text;
  }
}

export function valuesFromAnswers(schema, answers) {
  const byId = new Map((answers ?? []).map((item) => [item.id, item.answer]));
  const values = {};

  schema.forEach((field) => {
    if (field.type === "separator" || !byId.has(field.id)) return;
    const value = fieldValueOf(field, byId.get(field.id));
    if (value !== undefined) values[field.id] = value;
  });

  return values;
}

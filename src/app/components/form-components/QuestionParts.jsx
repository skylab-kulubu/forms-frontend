import { Field } from "@skylab-kulubu/skylcn-ui";
import { RichText } from "@/app/components/rich-text/RichText";
import { parseInline } from "@/app/components/rich-text/parseInline";

export function QuestionNumber({ number, missing = false }) {
  if (number == null) return null;

  return (
    <div data-slot="question-number" data-missing={missing || undefined} className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border text-xs font-semibold transition-colors
      ${missing ? "border-red-400/50 bg-red-900/30 text-red-200" : "border-neutral-700 bg-neutral-900 text-neutral-300"}`}
    >
      {number}
    </div>
  );
}

export function QuestionHint({ required = false, missing = false, text = "Zorunlu alan", missingText = "Bu soru zorunlu", className = "mt-1" }) {
  if (missing) return <span className={`px-0.5 text-2xs text-red-200/90 ${className}`}>{missingText}</span>;
  if (!required) return null;

  return <span className={`px-0.5 text-2xs text-neutral-500 ${className}`}>{text}</span>;
}

// Controls the Field label cannot point at (pickers, groups, the file input) take the question as their name
export function questionLabel(question) {
  const text = parseInline(question).map((node) => node.text).join("").trim();
  return text || undefined;
}

// A picker's name replaces the text on its button, so the chosen value is said after the question
export function pickerLabel(question, chosen) {
  const label = questionLabel(question);
  return label && chosen ? `${label}, ${chosen}` : label;
}

function QuestionTitle({ question }) {
  return question ? <RichText text={question} /> : <span className="font-normal italic text-subtle-foreground">Bu soru için metin yok</span>;
}

export function QuestionField({ question, questionNumber, description, required = false, missing = false, error, hint, requiredText = "Zorunlu alan", missingText = "Bu soru zorunlu", children }) {
  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl">
      <Field variant="question" number={questionNumber} label={<QuestionTitle question={question} />}
        description={description ? <RichText text={description} /> : undefined}
        required={required} hint={hint !== undefined ? hint : required ? requiredText : undefined} error={error ?? (missing ? missingText : undefined)}
        className="p-2 md:p-4"
      >
        {children}
      </Field>
    </div>
  );
}

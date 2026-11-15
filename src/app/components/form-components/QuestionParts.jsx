import { Field } from "@skylab-kulubu/skylcn-ui";
import { RichText } from "@/app/components/rich-text/RichText";
import { parseInline } from "@/app/components/rich-text/parseInline";

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

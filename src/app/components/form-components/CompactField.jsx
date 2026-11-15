import { Field } from "@skylab-kulubu/skylcn-ui";
import { RichText } from "@/app/components/rich-text/RichText";

// A repeater row's field; `invalid` marks its control red without a message, as forms' rows did
export function CompactField({ question, required = false, missing = false, children }) {
  return (
    <Field label={question ? <RichText text={question} /> : undefined} required={required} invalid={missing || undefined} className="min-w-0">
      {children}
    </Field>
  );
}

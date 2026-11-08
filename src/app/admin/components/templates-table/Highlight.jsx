import { fold } from "./template-data";

export default function Highlight({ text, query }) {
  const needle = fold(query.trim());
  const index = needle ? fold(text).indexOf(needle) : -1;
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded-[2px] bg-skylab-500/25 text-neutral-50">{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  );
}

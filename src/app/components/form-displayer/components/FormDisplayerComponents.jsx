"use client";

export function FormDisplayerHeader({ title, description }) {
  const hasTitle = typeof title === "string" && title.trim().length > 0;
  const hasDescription = typeof description === "string" && description.trim().length > 0;

  if (!hasTitle && !hasDescription) return null;

  return (
    <div className="rounded-xl px-4 pb-5 max-w-2xl">
      {hasTitle && (
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">
          {title}
        </h1>
      )}

      {hasDescription && (
        <div
          className="mt-3 text-[11px] leading-relaxed text-neutral-200 space-y-2 opacity-90
            [&_p]:m-0 [&_p+p]:mt-2 [&_strong]:text-neutral-100 [&_em]:text-neutral-300
            [&_blockquote]:border-l-2 [&_blockquote]:border-white/10 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-100 [&_blockquote]:italic
            [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
            [&_h1]:text-[14px] [&_h1]:font-semibold
            [&_h2]:text-[13px] [&_h2]:font-semibold
            [&_h3]:text-[12px] [&_h3]:font-semibold"
          dangerouslySetInnerHTML={{ __html: description }}
        />
      )}
    </div>
  );
}

import { useMemo } from "react";
import { motion } from "framer-motion";
import { FileQuestion } from "lucide-react";
import { REGISTRY } from "@/app/components/form-registry";
import StateCard from "@/app/components/StateCard";
import DOMPurify from "dompurify";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] } },
};

export default function FormPreview({ form }) {
  const schema = form?.data?.schema ?? [];
  const title = form?.data?.title ?? form?.title ?? "";
  const description = form?.data?.description ?? "";
  const sanitizedDescription = description ? DOMPurify.sanitize(description) : "";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl">
      <div className="flex-1 overflow-y-auto p-4 scrollbar">
        {schema.length === 0 ? (
          <StateCard title="Bu formda soru bulunmuyor" description="Form düzenleyicisinden soru ekleyebilirsiniz." Icon={FileQuestion} />
        ) : (
          <div className="pointer-events-none select-none">
            {(title || description) && (
              <div className="mb-5 px-8 pt-3">
                {title && (
                  <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">{title}</h1>
                )}
                {description && (
                  <div
                    className={`${title ? "mt-3 " : ""}text-2xs leading-relaxed text-neutral-200 space-y-2 opacity-90
                    [&_p]:m-0 [&_p+p]:mt-2 [&_strong]:text-neutral-100 [&_em]:text-neutral-300
                    [&_blockquote]:border-l-2 [&_blockquote]:border-white/10 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-100 [&_blockquote]:italic
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                    [&_h1]:text-sm [&_h1]:font-semibold
                    [&_h2]:text-sm [&_h2]:font-semibold
                    [&_h3]:text-xs [&_h3]:font-semibold`}
                    dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
                  />
                )}
              </div>
            )}

            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
              {schema.map((field, index) => {
                const entry = REGISTRY[field.type];
                const DisplayComponent = entry?.Display;
                if (!DisplayComponent) return null;

                const hasCondition = Boolean(field.condition?.fieldId);

                return (
                  <motion.div key={field.id} variants={itemVariants} className={hasCondition ? "opacity-40!" : ""}>
                    <DisplayComponent {...field.props} questionNumber={index + 1} />
                  </motion.div>
                );
              })}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
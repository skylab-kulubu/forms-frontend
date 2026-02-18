import { useMemo } from "react";
import { motion } from "framer-motion";
import { FileQuestion } from "lucide-react";
import { REGISTRY } from "@/app/components/form-registry";
import { getVisibleFields } from "@/app/components/form-displayer/components/conditionChecker";
import StateCard from "@/app/components/StateCard";
import DOMPurify from "isomorphic-dompurify";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.04, delayChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] } },
};

export default function FormPreview({ form }) {
  const schema = form?.data?.schema ?? [];
  const description = form?.data?.description ?? "";
  const sanitizedDescription = description ? DOMPurify.sanitize(description) : "";

  const visibleFields = useMemo(() => getVisibleFields(schema, {}), [schema]);

  return (
    <div className="flex h-full flex-col rounded-xl p-2 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-2 scrollbar">
        {visibleFields.length === 0 ? (
          <StateCard title="Bu formda soru bulunmuyor" description="Form düzenleyicisinden soru ekleyebilirsiniz." Icon={FileQuestion} />
        ) : (
          <div className="pointer-events-none select-none">
            {description &&
              <div
                className="mt-3 mb-5 px-8 text-[11px] leading-relaxed text-neutral-200 space-y-2 opacity-90
                [&_p]:m-0 [&_p+p]:mt-2 [&_strong]:text-neutral-100 [&_em]:text-neutral-300
                [&_blockquote]:border-l-2 [&_blockquote]:border-white/10 [&_blockquote]:pl-3 [&_blockquote]:text-neutral-100 [&_blockquote]:italic
                [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5
                [&_h1]:text-[14px] [&_h1]:font-semibold
                [&_h2]:text-[13px] [&_h2]:font-semibold
                [&_h3]:text-[12px] [&_h3]:font-semibold"
                dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
              />
            }

            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
              {visibleFields.map((field, index) => {
                const entry = REGISTRY[field.type];
                const DisplayComponent = entry?.Display;
                if (!DisplayComponent) return null;

                return (
                  <motion.div key={field.id} variants={itemVariants}>
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
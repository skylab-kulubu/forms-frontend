"use client";

import { REGISTRY } from "@/app/components/form-registry";
import { FormDisplayerHeader } from "./components/FormDisplayerComponents";
import { FormResponseStatus } from "./components/FormResponseStatus";
import { motion } from "framer-motion";

function mapPropsForDisplay(type, props = {}) {
  if (type === "combobox" || type === "multi_choice") {
    return { ...props, options: props.options ?? props.choices ?? [] };
  }

  if (type === "file") {
    return { ...props, accept: props.accept ?? props.acceptedFiles ?? "", maxSizeMB: props.maxSizeMB ?? props.maxSize ?? 0 };
  }

  return props;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.2, 0.65, 0.3, 0.9] } },
};

export default function FormDisplayer({ form }) {
  const schema = Array.isArray(form?.schema) ? form.schema : [];
  const title = form?.title ?? "";
  const description = form?.description ?? "";
  const relationshipStatusValue = Number(form?.relationshipStatus);
  const relationshipStatus = Number.isFinite(relationshipStatusValue) ? relationshipStatusValue : 0;

  const hasSchema = schema.length > 0;

  return (
    <div className="flex w-full max-w-2xl flex-col gap-6 py-8 px-3 sm:px-0 mx-auto">
      <FormResponseStatus relationshipStatus={relationshipStatus} />
      <FormDisplayerHeader title={title} description={description} />

      {hasSchema ? (
        <motion.div className="relative flex flex-col gap-4 overflow-visible"
          variants={containerVariants} initial="hidden" animate="show"
        >
          {schema.map((field, index) => {
            const entry = REGISTRY[field.type];
            const DisplayComponent = entry?.Display;
            if (!DisplayComponent) return null;

            const displayProps = { ...mapPropsForDisplay(field.type, field.props ?? {}), questionNumber: index + 1 };

            return (
              <motion.div
                key={field.id ?? `${field.type}-${index}`}
                variants={itemVariants}
                className="relative border-b border-neutral-800 pb-4 last:border-b-0 last:pb-0"
                style={{ zIndex: schema.length - index }}
              >
                <DisplayComponent {...displayProps} />
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="flex min-h-[40vh] items-center justify-center rounded-xl border border-white/5 bg-neutral-900/40 text-sm text-neutral-400">
          Bu formda gosterilecek soru yok.
        </div>
      )}
    </div>
  );
}

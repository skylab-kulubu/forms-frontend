"use client";

import { REGISTRY } from "@/app/components/form-registry";
import { FormDisplayerHeader } from "./components/FormDisplayerComponents";
import { FormResponseStatus } from "./components/FormResponseStatus";
import Background from "../Background";
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
    <div className="relative h-screen w-full font-sans text-neutral-200 overflow-y-auto scrollbar">
      
      <Background />

      <div className="relative z-10 flex min-h-full w-full flex-col items-center justify-center py-12 px-4 sm:px-6">
        
        <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-black/20 shadow-2xl">
            
            <div className="flex flex-col gap-6 p-6 sm:p-10">
              <FormResponseStatus relationshipStatus={relationshipStatus} />
              <FormDisplayerHeader title={title} description={description} />

              {hasSchema ? (
                <motion.div 
                  className="relative flex flex-col gap-4 overflow-visible"
                  variants={containerVariants} initial="hidden" animate="show"
                >
                  {schema.map((field, index) => {
                    const entry = REGISTRY[field.type];
                    const DisplayComponent = entry?.Display;
                    if (!DisplayComponent) return null;

                    const displayProps = { ...mapPropsForDisplay(field.type, field.props ?? {}), questionNumber: index + 1 };

                    return (
                      <motion.div key={field.id ?? `${field.type}-${index}`} variants={itemVariants}
                        className="relative border-b border-white/5 pb-6 last:border-b-0 last:pb-0"
                        style={{ zIndex: schema.length - index }}
                      >
                        <DisplayComponent {...displayProps} />
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <div className="flex min-h-[30vh] items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/5 text-sm text-neutral-400">
                  Bu formda gösterilecek soru yok.
                </div>
              )}
            </div>
        </div>

        <div className="mt-8 text-xs text-neutral-500 font-medium">
          footer gelcek
        </div>

      </div>
    </div>
  );
}
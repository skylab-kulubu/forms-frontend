"use client";

import dynamic from "next/dynamic";
import FormSkeleton from "@/app/components/form-displayer/components/FormSkeleton";
import Deferred from "./Deferred";

function Waiting() {
  return (
    <div className="hm-embed">
      <FormSkeleton />
    </div>
  );
}

const FormClient = dynamic(() => import("@/app/[id]/FormClient"), { ssr: false, loading: Waiting });

export default function HomeForm({ formId, eager = false, className = "" }) {
  if (!formId) {
    return <div className={`hm-embed-off ${className}`.trim()}>Form henüz bağlanmadı.</div>;
  }

  const form = (
    <div className="hm-embed">
      <FormClient formId={formId} embedded />
    </div>
  );

  if (eager) return <div className={className}>{form}</div>;

  return (
    <Deferred className={className} margin="900px 0px" placeholder={<Waiting />}>
      {form}
    </Deferred>
  );
}

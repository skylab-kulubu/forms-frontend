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

export default function HomeForm({ formId, className = "" }) {
  if (!formId) {
    return <div className={`hm-embed-off ${className}`.trim()}>Form henüz bağlanmadı.</div>;
  }

  return (
    <Deferred className={className} margin="900px 0px" placeholder={<Waiting />}>
      <div className="hm-embed">
        <FormClient formId={formId} embedded />
      </div>
    </Deferred>
  );
}

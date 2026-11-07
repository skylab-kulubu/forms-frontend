"use client";

import dynamic from "next/dynamic";
import StudioSkeleton from "../../components/form-studio/StudioSkeleton";

const TemplateStudio = dynamic(() => import("../../components/template-studio/TemplateStudio"), { ssr: false, loading: () => <StudioSkeleton /> });

export default function NewGroupPage() {
  return <TemplateStudio />;
}

"use client";

import { Suspense, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Link2Off, ShieldX } from "lucide-react";
import { useGroupDraftQuery } from "@/lib/hooks/useGroupAdmin";
import { useGroupPreviewQuery } from "@/lib/hooks/useGroupShare";
import StateCard from "@/app/components/StateCard";
import { useTemplateContext } from "../../providers";
import StudioSkeleton from "../../components/form-studio/StudioSkeleton";

const TemplateStudio = dynamic(() => import("../../components/template-studio/TemplateStudio"), { ssr: false });
const SharedTemplate = dynamic(() => import("../../components/template-studio/SharedTemplate"), { ssr: false });

function TemplatePage() {
  const { groupId } = useParams();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token") || null;

  const { data: groupData, isLoading, error } = useGroupPreviewQuery(groupId, token, { gcTime: 0, staleTime: 0, refetchOnWindowFocus: false });
  const group = groupData?.data;
  const isSharedView = Boolean(token) && Boolean(group?.sharedBy);

  const { data: draftData, isLoading: isDraftLoading } = useGroupDraftQuery(groupId, { enabled: Boolean(group) && !isSharedView });

  const { setTitle } = useTemplateContext();
  const crumb = group?.title ?? (error ? "Şablon" : "");

  useEffect(() => {
    if (!crumb) return undefined;
    setTitle(crumb);
    return () => setTitle("");
  }, [crumb, setTitle]);

  if (isLoading || isDraftLoading) return <StudioSkeleton />;

  if (error || !group) {
    return (
      <div className="flex h-[calc(100dvh-3.5rem)] flex-col p-4 lg:p-6">
        <StateCard Icon={token ? Link2Off : ShieldX}
          title={token ? "Bu paylaşım bağlantısı geçersiz" : "Bu şablonu açamazsınız"}
          description={token ? "Bağlantılar 48 saat geçerlidir. Paylaşan kişiden yeni bir bağlantı isteyin." : "Şablon silinmiş olabilir ya da başka birine ait."}
        />
      </div>
    );
  }

  if (isSharedView) return <SharedTemplate group={group} token={token} />;

  return <TemplateStudio key={group.id} initialGroup={group} initialDraft={draftData?.data ?? null} />;
}

export default function EditGroupPage() {
  return (
    <Suspense fallback={<StudioSkeleton />}>
      <TemplatePage />
    </Suspense>
  );
}

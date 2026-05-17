"use client";

import { useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";
import { useGroupPreviewQuery } from "@/lib/hooks/useGroupShare";

const GroupEditor = dynamic(() => import("../../components/component-group-editor/GroupEditor"), { ssr: false });
const SharedGroupPreview = dynamic(() => import("../../components/component-group-editor/SharedGroupPreview"), { ssr: false });

export default function EditGroupPage() {
    const { groupId } = useParams();
    const searchParams = useSearchParams();
    const token = searchParams?.get("token") || null;

    const { data: groupData, isLoading, refetch } = useGroupPreviewQuery(groupId, token);

    if (isLoading) {
        return (
            <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
            </div>
        );
    }

    const group = groupData?.data;
    const isSharedView = Boolean(token) && Boolean(group?.sharedBy);

    if (isSharedView) {
        return <SharedGroupPreview group={group} token={token} />;
    }

    return <GroupEditor initialGroup={group} onRefresh={refetch} />;
}

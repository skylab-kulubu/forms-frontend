"use client";

import { useParams, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useGroupPreviewQuery } from "@/lib/hooks/useGroupShare";
import SkylabLoader from "@/app/components/SkylabLoader";

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
                <SkylabLoader size={64} color="#525252" />
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

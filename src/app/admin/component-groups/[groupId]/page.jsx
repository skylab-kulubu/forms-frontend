"use client";

import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useGroupQuery } from "@/lib/hooks/useGroupAdmin";
import { Loader2 } from "lucide-react";

const GroupEditor = dynamic(() => import("../../../components/component-group-editor/GroupEditor"), { ssr: false });

export default function EditGroupPage() {
    const { groupId } = useParams();
    const { data: groupData, isLoading, refetch } = useGroupQuery(groupId);

    if (isLoading) {
        return (
            <div className="flex h-[calc(100dvh-3.5rem)] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-neutral-500" />
            </div>
        );
    }

    const group = groupData?.data;

    return <GroupEditor initialGroup={group} onRefresh={refetch} />;
}

"use client";

import dynamic from "next/dynamic";

const GroupEditor = dynamic(() => import("../../components/component-group-editor/GroupEditor"), { ssr: false });

export default function NewGroupPage() {
    return <GroupEditor />;
}

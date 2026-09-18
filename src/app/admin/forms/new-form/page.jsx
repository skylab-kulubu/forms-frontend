"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { eventHandoffFromSearch } from "@/lib/event-handoff";

const FormEditor = dynamic(() => import("../../components/form-editor/FormEditor"), {
    ssr: false,
});

function NewFormEditor() {
    const search = useSearchParams();
    return <FormEditor handoff={eventHandoffFromSearch(search)} />;
}

export default function NewForm() {
    return (
        <Suspense fallback={null}>
            <NewFormEditor />
        </Suspense>
    );
}

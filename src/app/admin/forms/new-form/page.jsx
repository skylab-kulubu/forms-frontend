"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { eventHandoffFromSearch } from "@/lib/event-handoff";

const SingleFormStudio = dynamic(() => import("../../components/form-studio/SingleFormStudio"), {
    ssr: false,
});

function NewFormStudio() {
    const search = useSearchParams();
    return <SingleFormStudio handoff={eventHandoffFromSearch(search)} />;
}

export default function NewForm() {
    return (
        <Suspense fallback={null}>
            <NewFormStudio />
        </Suspense>
    );
}

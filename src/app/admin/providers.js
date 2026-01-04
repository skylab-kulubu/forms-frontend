"use client";

import { createContext, useContext, useMemo } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useFormInfoQuery } from "@/lib/hooks/useFormContext";

const FormContext = createContext(null);

export function FormProvider({ children }) {
    const params = useParams();
    const formId = params?.id;
    const { status } = useSession();

    const { data: form, isLoading, error } = useFormInfoQuery(formId, status === "authenticated");

    const value = useMemo(
        () => ({ formId, form: form ?? null, loading: isLoading, error: error ?? null }),
        [formId, form, isLoading, error]
    );

    return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export function useFormContext() {
    const ctx = useContext(FormContext);
    if (!ctx) throw new Error("useFormContext must be used within <FormProvider>");
    return ctx;
}
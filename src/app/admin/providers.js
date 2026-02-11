"use client";

import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useFormInfoQuery } from "@/lib/hooks/useFormContext";

const FormContext = createContext(null);

export function FormProvider({ children }) {
    const params = useParams();
    const formId = params?.formId;
    const { status } = useSession();

    const { data: initialForm, isLoading, error } = useFormInfoQuery(formId, status === "authenticated");

    const [title, setTitle] = useState("");
    const [formStatus, setFormStatus] = useState(1);

    useEffect(() => {
        if (initialForm) {
            setTitle(initialForm.title || "");
            setFormStatus(initialForm.status || 1);
        }
    }, [initialForm]);

    const form = useMemo(() => {
        if (!initialForm) return null;
        return {
            ...initialForm,
            title: title,
            status: formStatus,
        }
    }, [initialForm, title, formStatus]);

    const value = useMemo(
        () => ({
            formId,
            form: form,
            loading: isLoading,
            error: error ?? null,
            setTitle,
            setStatus: setFormStatus
        }), [formId, initialForm, isLoading, error, title, formStatus]);

    return <FormContext.Provider value={value}>{children}</FormContext.Provider>;
}

export function useFormContext() {
    const ctx = useContext(FormContext);
    if (!ctx) throw new Error("useFormContext must be used within <FormProvider>");
    return ctx;
}
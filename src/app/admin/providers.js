"use client";

import { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useParams, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useFormInfoQuery } from "@/lib/hooks/useFormContext";
import { useWorkflowQuery } from "@/lib/hooks/useWorkflowAdmin";

const FormContext = createContext(null);
const WorkflowContext = createContext(null);

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

export function WorkflowProvider({ children }) {
    const pathname = usePathname();
    const { status } = useSession();

    const segments = (pathname ?? "").split("/");
    const candidate = segments[1] === "admin" && segments[2] === "workflows" ? segments[3] : undefined;
    const workflowId = candidate && candidate !== "new-workflow" ? candidate : undefined;

    const { data, isLoading } = useWorkflowQuery(workflowId, { enabled: Boolean(workflowId) && status === "authenticated" });
    const loaded = data?.data ?? data ?? null;

    const [liveName, setLiveName] = useState(null);

    const [prevWorkflowId, setPrevWorkflowId] = useState(workflowId);
    if (prevWorkflowId !== workflowId) {
        setPrevWorkflowId(workflowId);
        setLiveName(null);
    }

    const workflow = useMemo(() => {
        if (!loaded) return null;
        return liveName === null ? loaded : { ...loaded, name: liveName };
    }, [loaded, liveName]);

    const value = useMemo(
        () => ({ workflowId, workflow, loading: isLoading, setName: setLiveName }),
        [workflowId, workflow, isLoading]
    );

    return <WorkflowContext.Provider value={value}>{children}</WorkflowContext.Provider>;
}

export function useWorkflowContext() {
    const ctx = useContext(WorkflowContext);
    if (!ctx) throw new Error("useWorkflowContext must be used within <WorkflowProvider>");
    return ctx;
}
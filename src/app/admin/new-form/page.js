"use client";

import dynamic from "next/dynamic";

const FormEditor = dynamic(() => import("../components/form-editor/components/FormEditor"), {
  ssr: false,
});

export default function NewForm() {
    return (
        <FormEditor />
    );
}
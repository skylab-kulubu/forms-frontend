"use client";

import dynamic from "next/dynamic";

const FormEditor = dynamic(() => import("../../components/form-editor/FormEditor"), {
  ssr: false,
});

export default function NewForm() {
    return (
        <div className="px-6 pb-6">
            <FormEditor />
        </div>
    );
}

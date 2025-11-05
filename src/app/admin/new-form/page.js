"use client";

import dynamic from "next/dynamic";

const FormBuilder = dynamic(() => import(".//components/FormBuilder"), {
  ssr: false,
});

export default function NewForm() {
    return (
        <FormBuilder />
    );
}
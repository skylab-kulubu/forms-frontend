import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE_URL = "http://localhost:5000";

const fetchFormById = async (id) => {
    const response = await fetch(`${BASE_URL}/api/forms/${id}`);

    if (!response.ok) {
        throw new Error("Form verileri alınamadı.");
    }
    return response.json();
};

const upsertFormData = async (payload) => {
    const response = await fetch(`${BASE_URL}/api/forms`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Kaydetme işlemi başarısız.");
    }
    return response.json();
}

export const useFormQuery = (formId) => {
    return useQuery({
        queryKey: ["form", formId],
        queryFn: () => fetchFormById(formId),
        enabled: !!formId,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        retry: 1,
    });
}

export const useFormMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: upsertFormData,
        onSuccess: (data) => {
            if (data.id) {
                queryClient.setQueryData(["form", data.id], data);
            }
        },
        onError: (error) => {
            console.error("Kayıt hatası:", error.message);
        },
    });
}
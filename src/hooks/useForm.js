import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BASE_URL = "http://localhost:5000";

const parseError = async (response, fallbackMessage) => {
    const errorData = await response.json().catch(() => null);
    const error = new Error(errorData?.detail || fallbackMessage);
    error.status = response.status;
    error.body = errorData;
    return error;
};

const fetchFormById = async (formId) => {
    const response = await fetch(`${BASE_URL}/api/forms/${formId}`);

    if (!response.ok) {
        throw await parseError(response, "Form verileri alınamadı.");
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
        throw await parseError(response, "Kaydetme işlemi başarısız.");
    }

    return response.json();
};

export const useFormQuery = (formId) => {
    return useQuery({
        queryKey: ["form", formId],
        queryFn: () => fetchFormById(formId),
        enabled: !!formId,
        staleTime: Infinity,
        refetchOnWindowFocus: false,
        retry: 1,
    });
};

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
};

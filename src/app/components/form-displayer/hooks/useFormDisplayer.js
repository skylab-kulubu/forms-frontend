import { useReducer, useRef, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSubmitFormMutation, useDisplayFormQuery } from "@/lib/hooks/useForm";
import { useDeleteResponseDraftMutation } from "@/lib/hooks/useDraft";
import { useResponseDraftAutoSave } from "./useResponseDraftAutoSave";
import { FORM_ACCESS_STATUS } from "../../FormStatusHandler";
import { getVisibleFields } from "../components/conditionChecker";

function getSubmissionState(status) {
  switch (status) {
    case FORM_ACCESS_STATUS.COMPLETED:        return "completed";
    case FORM_ACCESS_STATUS.PENDING_APPROVAL: return "pending";
    case FORM_ACCESS_STATUS.APPROVED:         return "approved";
    case FORM_ACCESS_STATUS.DECLINED:         return "declined";
    case FORM_ACCESS_STATUS.FULLY_COMPLETED:  return "fullyCompleted";
    default:                                  return "completed";
  }
}

const initialState = {
  form: null,
  step: 0,
  linkedFormId: null,
  values: {},
  submissionState: null,
  submissionStatus: null,
  errorMessage: null,
  missingFieldIds: [],
  uploadingFields: {},
  draftPromptVisible: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_VALUE":
      return { ...state, values: { ...state.values, [action.fieldId]: action.value }, errorMessage: null, draftPromptVisible: false };

    case "SET_UPLOAD_STATE":
      return { ...state, uploadingFields: { ...state.uploadingFields, [action.fieldId]: action.isUploading } };

    case "SET_ERROR":
      return { ...state, errorMessage: action.message };

    case "CLEAR_ERROR":
      return { ...state, errorMessage: null };

    case "SET_MISSING_FIELDS":
      return { ...state, missingFieldIds: action.fieldIds };

    case "CLEAR_MISSING_FIELDS":
      return { ...state, missingFieldIds: [] };

    case "SUBMIT_SUCCESS": {
      const { linkedFormId, status, step } = action;
      if (linkedFormId && status !== FORM_ACCESS_STATUS.PENDING_APPROVAL) {
        return { ...state, step: step ?? state.step, linkedFormId };
      }
      return { ...state, step: step ?? state.step, submissionState: getSubmissionState(status), submissionStatus: status ?? null };
    }

    case "LOAD_LINKED_FORM":
      return { ...initialState, form: action.form, step: action.step };

    case "DISCARD_DRAFT":
      return { ...state, values: {}, draftPromptVisible: false };

    case "APPLY_DRAFT":
      return { ...state, values: action.values, draftPromptVisible: true };

    case "HIDE_DRAFT_PROMPT":
      return { ...state, draftPromptVisible: false };

    default:
      return state;
  }
}

export function useFormDisplayer(form, step, draft) {
  const [state, dispatch] = useReducer(reducer, { ...initialState, form, step });

  const { status } = useSession();
  const isAuthed = status === "authenticated";

  const submitMutation = useSubmitFormMutation();
  const { mutate: deleteDraft, isPending: isDiscarding } = useDeleteResponseDraftMutation();
  const { data: linkedFormData } = useDisplayFormQuery(state.linkedFormId);

  const draftAppliedRef = useRef(false);
  const missingTimeoutRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => { startTimeRef.current = Date.now(); }, []);

  useEffect(() => {
    if (!linkedFormData?.data) return;
    if (linkedFormData?.status === FORM_ACCESS_STATUS.FULLY_COMPLETED) {
      dispatch({
        type: "SUBMIT_SUCCESS",
        status: linkedFormData.status,
        step: linkedFormData.data?.step,
      });
      return;
    }
    dispatch({ type: "LOAD_LINKED_FORM", form: linkedFormData.data.form, step: linkedFormData.data.step });
    draftAppliedRef.current = false;
    startTimeRef.current = Date.now();
  }, [linkedFormData]);

  useEffect(() => {
    if (draftAppliedRef.current || !draft?.responses) return;
    draftAppliedRef.current = true;
    const restored = {};
    draft.responses.forEach((r) => {
      try { restored[r.id] = JSON.parse(r.answer); }
      catch { restored[r.id] = r.answer; }
    });
    dispatch({ type: "APPLY_DRAFT", values: restored });
    if (draft.timeSpent && startTimeRef.current) {
      startTimeRef.current = Date.now() - draft.timeSpent * 1000;
    }
  }, [draft]);

  const schema = Array.isArray(state.form?.schema) ? state.form.schema : [];

  const { lastSavedAt } = useResponseDraftAutoSave(
    state.form?.id, state.values, schema, startTimeRef,
    isAuthed && !state.draftPromptVisible && !state.submissionState
  );

  const visibleFields = useMemo(() => getVisibleFields(schema, state.values), [schema, state.values]);

  const isAnyFileUploading = Object.values(state.uploadingFields).some(Boolean);

  const handleValueChange = (fieldId, value) => {
    dispatch({ type: "SET_VALUE", fieldId, value });
  };

  const handleUploadStateChange = (fieldId, isUploading) => {
    dispatch({ type: "SET_UPLOAD_STATE", fieldId, isUploading });
  };

  const handleDiscardDraft = useCallback(() => {
    dispatch({ type: "DISCARD_DRAFT" });
    startTimeRef.current = Date.now();
    deleteDraft(state.form?.id, {
      onSuccess: () => dispatch({ type: "HIDE_DRAFT_PROMPT" }),
      onError: () => dispatch({ type: "HIDE_DRAFT_PROMPT" }),
    });
  }, [state.form?.id, deleteDraft]);

  const handleSubmit = (formattedResponses) => {
    const timeSpentInSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const payload = { formId: state.form?.id, responses: formattedResponses, timeSpent: timeSpentInSeconds };

    submitMutation.mutate(payload, {
      onSuccess: (response) => {
        dispatch({
          type: "SUBMIT_SUCCESS",
          linkedFormId: response?.data?.linkedFormId,
          status: response?.status,
          step: response?.data?.step,
        });
      },
      onError: () => {
        dispatch({ type: "SET_ERROR", message: "Bir hata oluştu." });
        setTimeout(() => dispatch({ type: "CLEAR_ERROR" }), 2000);
      },
    });
  };

  const showMissingFields = (fieldIds) => {
    if (missingTimeoutRef.current) clearTimeout(missingTimeoutRef.current);
    dispatch({ type: "SET_MISSING_FIELDS", fieldIds });
    dispatch({ type: "SET_ERROR", message: "Eksik alanları doldurunuz!" });
    missingTimeoutRef.current = setTimeout(() => {
      dispatch({ type: "CLEAR_MISSING_FIELDS" });
      missingTimeoutRef.current = null;
    }, 2000);
    setTimeout(() => dispatch({ type: "CLEAR_ERROR" }), 2000);
  };

  return { state, dispatch, schema, visibleFields, isAuthed, isDiscarding, isAnyFileUploading, isSubmitting: submitMutation.isPending,
    lastSavedAt, handleValueChange, handleUploadStateChange, handleDiscardDraft, handleSubmit, showMissingFields
  };
}
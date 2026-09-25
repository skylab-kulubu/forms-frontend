import { useReducer, useRef, useEffect, useMemo, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSubmitFormMutation, useDisplayFormQuery } from "@/lib/hooks/useForm";
import { useResponseDraftAutoSave } from "./useResponseDraftAutoSave";
import { FORM_ACCESS_STATUS, WORKFLOW_STATE, getSubmitErrorState } from "../../FormStatusHandler";
import { getVisibleFields } from "../components/conditionChecker";
import { migrateSchema } from "@/app/components/form-migrate";

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

function isBlankAnswer(value) {
  if (value == null || value === false) return true;
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.every(isBlankAnswer);
  if (typeof value === "object") return Object.values(value).every(isBlankAnswer);
  return false;
}

function draftAnswers(values, defaults, schema) {
  return schema
    .filter((field) => {
      const value = values[field.id];
      return !isBlankAnswer(value) && JSON.stringify(value) !== JSON.stringify(defaults[field.id]);
    })
    .map((field) => ({
      id: field.id,
      type: field.type,
      question: field.props?.question || "",
      answer: JSON.stringify(values[field.id]),
    }));
}

const initialState = {
  form: null,
  stage: 0,
  isWorkflow: false,
  startFormId: null,
  nextFormId: null,
  nextStage: null,
  values: {},
  defaults: {},
  savedDraft: "[]",
  submissionState: null,
  submissionStatus: null,
  submissionMessage: null,
  errorMessage: null,
  missingFieldIds: [],
  uploadingFields: {},
  draftPromptVisible: false,
};

function reducer(state, action) {
  switch (action.type) {
    case "SET_VALUE":
      return { ...state, values: { ...state.values, [action.fieldId]: action.value }, errorMessage: null, draftPromptVisible: false };

    case "SET_DEFAULT":
      return {
        ...state,
        values: { ...state.values, [action.fieldId]: action.value },
        defaults: { ...state.defaults, [action.fieldId]: action.value },
      };

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
      const { status, data } = action;
      const stage = data?.stage ?? state.stage;
      const startFormId = data?.startFormId ?? state.startFormId;
      const isWorkflow = state.isWorkflow || data?.state != null;
      if (data?.state === WORKFLOW_STATE.SHOW_FORM && data?.nextFormId) {
        return { ...state, startFormId, isWorkflow, nextFormId: data.nextFormId, nextStage: data.stage ?? null };
      }
      return { ...state, stage, startFormId, isWorkflow, submissionState: getSubmissionState(status), submissionStatus: status ?? null };
    }

    case "SUBMIT_FAILURE":
      return {
        ...state,
        stage: action.stage ?? state.stage,
        startFormId: action.startFormId ?? state.startFormId,
        submissionState: action.submissionState,
        submissionStatus: action.status ?? null,
        submissionMessage: action.message ?? null,
      };

    case "LOAD_NEXT_FORM":
      return { ...initialState, form: action.form, stage: action.stage ?? state.nextStage ?? state.stage + 1, isWorkflow: true, startFormId: state.startFormId };

    case "DISCARD_DRAFT":
      return { ...state, values: { ...state.defaults }, draftPromptVisible: false };

    case "APPLY_DRAFT": {
      const values = { ...state.values, ...action.values };
      const answers = draftAnswers(values, state.defaults, migrateSchema(state.form?.schema));
      return {
        ...state,
        values,
        savedDraft: answers.length ? JSON.stringify(answers) : null,
        draftPromptVisible: answers.length > 0,
      };
    }

    case "DRAFT_SYNCED":
      return { ...state, savedDraft: action.draft };

    default:
      return state;
  }
}

function submitFailureAction(error) {
  const status = error?.body?.status ?? error?.status;
  const submissionState = getSubmitErrorState(status, error?.body?.data);
  if (!submissionState) return null;
  return {
    type: "SUBMIT_FAILURE",
    submissionState,
    status,
    message: submissionState === "rejected" ? (error?.body?.message ?? null) : null,
    startFormId: error?.body?.data?.startFormId ?? null,
    stage: error?.body?.data?.stage || null,
  };
}

export function useFormDisplayer(form, draft, workflow = {}) {
  const [state, dispatch] = useReducer(reducer, {
    ...initialState,
    form,
    stage: workflow.stage ?? 0,
    isWorkflow: Boolean(workflow.isWorkflow),
    startFormId: workflow.startFormId ?? null,
  });

  const { status } = useSession();
  const isAuthed = status === "authenticated";

  const submitMutation = useSubmitFormMutation();
  const { data: nextFormData, error: nextFormError } = useDisplayFormQuery(state.nextFormId);

  const draftAppliedRef = useRef(false);
  const missingTimeoutRef = useRef(null);
  const startTimeRef = useRef(null);

  useEffect(() => { startTimeRef.current = Date.now(); }, []);

  useEffect(() => {
    if (!nextFormData) return;
    const payload = nextFormData.data;
    if (nextFormData.status === FORM_ACCESS_STATUS.AVAILABLE && payload?.form) {
      dispatch({ type: "LOAD_NEXT_FORM", form: payload.form, stage: payload.stage });
      draftAppliedRef.current = false;
      startTimeRef.current = Date.now();
      return;
    }
    dispatch({ type: "SUBMIT_SUCCESS", status: nextFormData.status, data: payload });
  }, [nextFormData]);

  useEffect(() => {
    if (!nextFormError) return;
    dispatch(submitFailureAction(nextFormError) ?? { type: "SUBMIT_FAILURE", submissionState: "genericError" });
  }, [nextFormError]);

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

  const schema = useMemo(() => migrateSchema(state.form?.schema), [state.form?.schema]);
  const answers = useMemo(() => draftAnswers(state.values, state.defaults, schema), [state.values, state.defaults, schema]);
  const handleDraftSynced = useCallback((savedDraft) => dispatch({ type: "DRAFT_SYNCED", draft: savedDraft }), []);

  const { lastSavedAt, cancel: cancelDraftSave } = useResponseDraftAutoSave(
    state.form?.id, answers, state.savedDraft, startTimeRef,
    isAuthed && !state.submissionState && !state.nextFormId && !submitMutation.isPending,
    handleDraftSynced
  );

  const visibleFields = useMemo(() => getVisibleFields(schema, state.values), [schema, state.values]);

  const isAnyFileUploading = Object.values(state.uploadingFields).some(Boolean);

  const handleValueChange = (fieldId, value, isDefault = false) => {
    dispatch({ type: isDefault ? "SET_DEFAULT" : "SET_VALUE", fieldId, value });
  };

  const handleUploadStateChange = (fieldId, isUploading) => {
    dispatch({ type: "SET_UPLOAD_STATE", fieldId, isUploading });
  };

  const handleDiscardDraft = useCallback(() => {
    dispatch({ type: "DISCARD_DRAFT" });
    startTimeRef.current = Date.now();
  }, []);

  const handleSubmit = (formattedResponses) => {
    cancelDraftSave();
    const timeSpentInSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const payload = { formId: state.form?.id, responses: formattedResponses, timeSpent: timeSpentInSeconds };

    submitMutation.mutate(payload, {
      onSuccess: (response) => {
        dispatch({ type: "SUBMIT_SUCCESS", status: response?.status, data: response?.data });
      },
      onError: (error) => {
        const failure = submitFailureAction(error);
        if (failure) {
          dispatch(failure);
          return;
        }
        // On 401 the SessionExpiredHandler banner supplies the re-login button; the button
        // label only needs to say why the submit failed.
        const message = error?.status === 401 ? "Oturum süresi doldu" : "Bir hata oluştu.";
        dispatch({ type: "SET_ERROR", message });
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

  return { state, dispatch, schema, visibleFields, isAuthed, isAnyFileUploading, isSubmitting: submitMutation.isPending || Boolean(state.nextFormId),
    lastSavedAt, handleValueChange, handleUploadStateChange, handleDiscardDraft, handleSubmit, showMissingFields
  };
}

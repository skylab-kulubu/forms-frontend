import { useReducer, useRef, useEffect, useMemo, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { useSubmitFormMutation, useDisplayFormQuery, useStartAttemptMutation, fetchDisplayFormById } from "@/lib/hooks/useForm";
import { useResponseDraftAutoSave } from "./useResponseDraftAutoSave";
import { FORM_ACCESS_STATUS, WORKFLOW_STATE, getSubmitErrorState } from "../../FormStatusHandler";
import { getVisibleFields } from "../components/conditionChecker";
import { useDeadline } from "../components/TimedParts";
import { migrateSchema } from "@/app/components/form-migrate";
import { isRepeaterComplete, serializeRepeater } from "@/app/components/form-components/FormRepeater";
import { formatFieldAnswer } from "@/app/components/form-answer-format";
import { readAttribution } from "@/lib/attribution";
import { hasJourney, hasSeenIntro } from "@/lib/workflow-journey";
import { useServerNow } from "@/lib/form-timing";
import { useTurnstile } from "@/lib/hooks/useTurnstile";
import { useTurnstileStatusQuery } from "@/lib/hooks/useTurnstileStatus";
import { useGuestUploads } from "./useGuestUploads";

const RETRY_REASONS = new Set(["timeUp", "notStarted"]);
const GUEST_FILE_REASONS = new Set(["fileScanning", "fileRejected", "fileExpired", "fileTypeNotAllowed", "fileTooLarge"]);
const BUSY_REASONS = new Set(["tooManySubmissions", "submitUnavailable"]);
const BUSY_RETRY_LIMIT = 3;
const BUSY_WAIT_LIMIT_SECONDS = 60;
const BUSY_JITTER_MS = 3000;

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

export function isFieldMissing(field, value) {
  if (field.type === "separator" || !field.props?.required) return false;
  if (value === undefined || value === null) return true;
  if (field.type === "toggle") return value !== true;
  if (field.type === "repeater") return !isRepeaterComplete(field.props?.fields, value);
  if (typeof value === "string") return value.trim() === "";
  if (Array.isArray(value)) return value.length === 0;
  if (field.type === "matrix" && typeof value === "object") return Object.keys(value).length < (field.props.rows?.length || 0);
  return false;
}

const initialState = {
  form: null,
  stage: 0,
  isWorkflow: false,
  startFormId: null,
  workflow: null,
  instanceId: null,
  attempt: null,
  serverNow: null,
  closesAt: null,
  intro: null,
  nextFormId: null,
  nextStage: null,
  arrivedFrom: null,
  values: {},
  defaults: {},
  savedDraft: "[]",
  submissionState: null,
  submissionStatus: null,
  submissionMessage: null,
  submittedAt: null,
  errorMessage: null,
  missingFieldIds: [],
  fileProblems: {},
  uploadingFields: {},
  draftPromptVisible: false,
};

function withoutResolved(state, action) {
  return action.resolved ? state.missingFieldIds.filter((id) => id !== action.fieldId) : state.missingFieldIds;
}

function withoutFileProblem(state, fieldId) {
  if (!state.fileProblems[fieldId]) return state.fileProblems;
  return Object.fromEntries(Object.entries(state.fileProblems).filter(([id]) => id !== fieldId));
}

function reducer(state, action) {
  switch (action.type) {
    case "SET_VALUE":
      return {
        ...state,
        values: { ...state.values, [action.fieldId]: action.value },
        errorMessage: null,
        missingFieldIds: withoutResolved(state, action),
        fileProblems: withoutFileProblem(state, action.fieldId),
      };

    case "CLEAR_VALUE":
      return { ...state, values: { ...state.values, [action.fieldId]: null } };

    case "SET_DEFAULT":
      return {
        ...state,
        values: { ...state.values, [action.fieldId]: action.value },
        defaults: { ...state.defaults, [action.fieldId]: action.value },
        missingFieldIds: withoutResolved(state, action),
      };

    case "SET_UPLOAD_STATE":
      return { ...state, uploadingFields: { ...state.uploadingFields, [action.fieldId]: action.isUploading } };

    case "SET_ERROR":
      return { ...state, errorMessage: action.message };

    case "CLEAR_ERROR":
      return { ...state, errorMessage: null };

    case "SET_MISSING_FIELDS":
      return { ...state, missingFieldIds: action.fieldIds };

    case "SET_FILE_PROBLEM":
      return { ...state, fileProblems: { ...state.fileProblems, [action.fieldId]: action.problem } };

    case "SUBMIT_SUCCESS": {
      const { status, data } = action;
      const stage = data?.stage ?? state.stage;
      const startFormId = data?.startFormId ?? state.startFormId;
      const isWorkflow = state.isWorkflow || data?.state != null;
      const workflow = data?.workflow ?? state.workflow;
      const instanceId = data?.instanceId ?? state.instanceId;
      if (data?.state === WORKFLOW_STATE.SHOW_FORM && data?.nextFormId) {
        return {
          ...state, startFormId, isWorkflow, workflow, instanceId,
          nextFormId: data.nextFormId, nextStage: data.stage ?? null, arrivedFrom: state.form?.title ?? null,
        };
      }
      return {
        ...state, stage, startFormId, isWorkflow, workflow, instanceId,
        submittedAt: new Date().toISOString(), submissionState: getSubmissionState(status), submissionStatus: status ?? null,
      };
    }

    case "SUBMIT_FAILURE":
      return {
        ...state,
        stage: action.stage ?? state.stage,
        startFormId: action.startFormId ?? state.startFormId,
        workflow: action.workflow ?? state.workflow,
        submissionState: action.submissionState,
        submissionStatus: action.status ?? null,
        submissionMessage: action.message ?? null,
      };

    case "LOAD_NEXT_FORM":
      return {
        ...initialState,
        form: action.form,
        stage: action.stage ?? state.nextStage ?? state.stage + 1,
        isWorkflow: true,
        startFormId: state.startFormId,
        workflow: action.workflow ?? null,
        instanceId: action.instanceId ?? state.instanceId,
        attempt: action.attempt ?? null,
        serverNow: action.serverNow ?? null,
        closesAt: action.closesAt ?? null,
        intro: hasJourney(action.workflow) ? { arrivedTitle: state.arrivedFrom } : null,
      };

    case "RELOAD_FORM":
      return {
        ...state,
        form: action.form ?? state.form,
        attempt: action.attempt ?? null,
        serverNow: action.serverNow ?? state.serverNow,
        closesAt: action.closesAt ?? null,
        workflow: action.workflow ?? state.workflow,
        stage: action.stage || state.stage,
        instanceId: action.instanceId ?? state.instanceId,
        isWorkflow: state.isWorkflow || action.isWorkflow,
      };

    case "END_INTRO":
      return { ...state, intro: null };

    case "DISCARD_DRAFT":
      return { ...state, values: { ...state.defaults }, draftPromptVisible: false, missingFieldIds: [], fileProblems: {} };

    case "HIDE_DRAFT_PROMPT":
      return { ...state, draftPromptVisible: false };

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
    workflow: error?.body?.data?.workflow ?? null,
  };
}

function initState({ form, options }) {
  const journey = options.journey ?? null;
  const instanceId = options.instanceId ?? null;
  const showIntro = Boolean(options.isWorkflow) && hasJourney(journey) && Boolean(form?.id) && !hasSeenIntro(form.id, instanceId);

  return {
    ...initialState,
    form,
    stage: options.stage ?? 0,
    isWorkflow: Boolean(options.isWorkflow),
    startFormId: options.startFormId ?? null,
    workflow: journey,
    instanceId,
    attempt: options.attempt ?? null,
    serverNow: options.serverNow ?? null,
    closesAt: options.closesAt ?? null,
    intro: showIntro ? { arrivedTitle: null } : null,
  };
}

export function useFormDisplayer(form, draft, options = {}) {
  const [state, dispatch] = useReducer(reducer, { form, options }, initState);

  const { status } = useSession();
  const isAuthed = status === "authenticated";
  const isGuest = status === "unauthenticated";
  const queryClient = useQueryClient();

  const submitMutation = useSubmitFormMutation();
  const startMutation = useStartAttemptMutation();
  const [startError, setStartError] = useState(null);
  const { data: nextFormData, error: nextFormError } = useDisplayFormQuery(state.nextFormId);
  const now = useServerNow(state.serverNow);

  const draftAppliedRef = useRef(false);
  const startTimeRef = useRef(null);
  const reloadingRef = useRef(false);

  useEffect(() => { startTimeRef.current = Date.now(); }, []);

  useEffect(() => {
    if (!nextFormData) return;
    const payload = nextFormData.data;
    if (nextFormData.status === FORM_ACCESS_STATUS.AVAILABLE && payload?.form) {
      dispatch({
        type: "LOAD_NEXT_FORM", form: payload.form, stage: payload.stage, workflow: payload.workflow ?? null, instanceId: payload.instanceId ?? null,
        attempt: payload.attempt ?? null, serverNow: payload.serverNow ?? null, closesAt: payload.closesAt ?? null,
      });
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
  const hasFileQuestion = schema.some((field) => field.type === "file");

  const { status: submitTurnstileStatus, getToken: getSubmitToken } = useTurnstile({ action: "guest-submit", enabled: isGuest });
  const scriptBlocked = isGuest && submitTurnstileStatus === "blocked";
  const { data: turnstileHealth } = useTurnstileStatusQuery({ enabled: scriptBlocked });
  const verificationOutage = scriptBlocked && turnstileHealth?.data?.enabled === true && turnstileHealth?.data?.reachable === false;
  const invalidateFile = useCallback((fieldId) => dispatch({ type: "CLEAR_VALUE", fieldId }), []);
  const guest = useGuestUploads({ formId: state.form?.id, capability: options.guestUploads ?? null, isGuest, hasFileQuestion, onInvalidate: invalidateFile });
  const [guestNotice, setGuestNotice] = useState(null);
  const [isPreparing, setPreparing] = useState(false);
  const [scanWait, setScanWait] = useState(null);
  const [busyRetry, setBusyRetry] = useState(null);
  const busyAttemptsRef = useRef(0);
  const answers = useMemo(() => draftAnswers(state.values, state.defaults, schema), [state.values, state.defaults, schema]);
  const handleDraftSynced = useCallback((savedDraft) => dispatch({ type: "DRAFT_SYNCED", draft: savedDraft }), []);
  const visibleFields = useMemo(() => getVisibleFields(schema, state.values), [schema, state.values]);

  const isTimed = Boolean(state.attempt);
  const isRunning = state.attempt?.state === "running";

  const submission = useMemo(() => {
    if (!isTimed) return null;
    return visibleFields
      .filter((field) => field.type !== "separator")
      .map((field) => ({
        id: field.id,
        type: field.type,
        question: field.props?.question || "",
        answer: field.type === "repeater" ? serializeRepeater(field.props?.fields, state.values[field.id]) : formatFieldAnswer(field, state.values[field.id]),
      }))
      .filter((item) => String(item.answer ?? "").trim() !== "");
  }, [isTimed, visibleFields, state.values]);

  const { lastSavedAt, cancel: cancelDraftSave, settle: settleDraft } = useResponseDraftAutoSave(
    state.form?.id, answers, state.savedDraft, startTimeRef,
    isAuthed && !state.submissionState && !state.nextFormId && !submitMutation.isPending && (!isTimed || isRunning),
    handleDraftSynced,
    submission
  );

  const activeFormId = state.form?.id ?? null;
  const hideDraftPrompt = useCallback(() => dispatch({ type: "HIDE_DRAFT_PROMPT" }), []);

  const reloadForm = useCallback(async () => {
    if (!activeFormId || reloadingRef.current) return null;
    reloadingRef.current = true;

    try {
      const response = await queryClient.fetchQuery({
        queryKey: ["display-form", activeFormId],
        queryFn: () => fetchDisplayFormById(activeFormId),
        staleTime: 0,
      });
      const payload = response?.data;

      if (response?.status === FORM_ACCESS_STATUS.AVAILABLE && payload?.form) {
        dispatch({
          type: "RELOAD_FORM", form: payload.form, attempt: payload.attempt ?? null, serverNow: payload.serverNow ?? null, closesAt: payload.closesAt ?? null,
          workflow: payload.workflow ?? null, stage: payload.stage ?? 0, instanceId: payload.instanceId ?? null, isWorkflow: payload.state != null,
        });
      } else {
        dispatch({ type: "SUBMIT_SUCCESS", status: response?.status, data: payload });
      }

      return payload ?? null;
    } catch (error) {
      dispatch(submitFailureAction(error) ?? { type: "SUBMIT_FAILURE", submissionState: "genericError" });
      return null;
    } finally {
      reloadingRef.current = false;
    }
  }, [activeFormId, queryClient]);

  const handleTimeUp = useCallback(async () => {
    await settleDraft();
    const payload = await reloadForm();
    const deadline = payload?.attempt?.state === "running" && payload.attempt.deadlineAt ? new Date(payload.attempt.deadlineAt).getTime() : null;
    if (deadline && deadline <= Date.now()) setTimeout(() => { reloadForm(); }, 5000);
  }, [settleDraft, reloadForm]);

  useDeadline(isRunning ? state.attempt.deadlineAt : null, now, handleTimeUp);

  useDeadline(state.attempt?.state === "notStarted" ? state.attempt.startClosesAt : null, now, reloadForm);

  useDeadline(!isTimed && !state.submissionState ? state.closesAt : null, now, () => {
    dispatch({ type: "SUBMIT_FAILURE", submissionState: "formClosed" });
  });

  const startAttempt = useCallback(() => {
    if (!activeFormId || startMutation.isPending) return;
    setStartError(null);
    startMutation.mutate(activeFormId, {
      onSuccess: () => { reloadForm(); },
      onError: (error) => {
        setStartError(error?.body?.message ?? "Görev başlatılamadı. Lütfen tekrar deneyin.");
        if (error?.status === FORM_ACCESS_STATUS.NOT_AVAILABLE) reloadForm();
      },
    });
  }, [activeFormId, startMutation, reloadForm]);

  // A signed-in file field reports "scanning" after its upload; only true means a file is still uploading.
  const isAnyFileUploading = Object.values(state.uploadingFields).some((value) => value === true);

  const handleValueChange = (fieldId, value, isDefault = false) => {
    const field = state.missingFieldIds.includes(fieldId) ? schema.find((item) => item.id === fieldId) : null;
    const resolved = Boolean(field) && !isFieldMissing(field, value);
    dispatch({ type: isDefault ? "SET_DEFAULT" : "SET_VALUE", fieldId, value, resolved });
  };

  const handleUploadStateChange = (fieldId, isUploading) => {
    dispatch({ type: "SET_UPLOAD_STATE", fieldId, isUploading });
  };

  const handleDiscardDraft = useCallback(() => {
    dispatch({ type: "DISCARD_DRAFT" });
    startTimeRef.current = Date.now();
  }, []);

  const endIntro = useCallback(() => dispatch({ type: "END_INTRO" }), []);

  const requestSubmitToken = async () => {
    try {
      return await getSubmitToken();
    } catch (error) {
      if (error?.code === "cancelled") throw error;
      if (error?.code !== "failed") return null;
    }
    try {
      return await getSubmitToken();
    } catch (error) {
      if (error?.code === "cancelled") throw error;
      return null;
    }
  };

  const handleGuestFailure = (error, payload, verifyRetried) => {
    const data = error?.body?.data;
    const reason = data?.reason;

    if (BUSY_REASONS.has(reason)) {
      const seconds = Number(data?.retryAfterSeconds) || 5;
      busyAttemptsRef.current += 1;
      if (seconds <= BUSY_WAIT_LIMIT_SECONDS && busyAttemptsRef.current <= BUSY_RETRY_LIMIT) {
        setBusyRetry({ at: Date.now() + seconds * 1000 + Math.round(Math.random() * BUSY_JITTER_MS) });
        return true;
      }
      busyAttemptsRef.current = 0;
      setGuestNotice({ kind: reason === "submitUnavailable" ? "submitUnavailable" : "busy", seconds });
      return true;
    }

    if (reason === "verificationFailed") {
      if (verifyRetried || !payload.turnstileToken) {
        setGuestNotice({ kind: "verify" });
        return true;
      }
      setPreparing(true);
      requestSubmitToken()
        .then((turnstileToken) => sendResponse({ ...payload, turnstileToken }, true))
        .catch(() => { })
        .finally(() => setPreparing(false));
      return true;
    }

    if (GUEST_FILE_REASONS.has(reason) && data?.questionId) {
      const flagged = guest.flag(data.questionId, reason, data.scanResult ?? null);
      if (reason === "fileScanning") {
        if (flagged) setScanWait(Date.now());
        else setGuestNotice({ kind: "scanning" });
        return true;
      }
      setGuestNotice({ kind: "file", status: reason, questionId: data.questionId, scanResult: data.scanResult ?? null, flagged });
      return true;
    }

    if (reason === "guestUploadsDisabled") {
      setGuestNotice({ kind: "login" });
      return true;
    }

    if (reason === "guestUploadsUnavailable") {
      setGuestNotice({ kind: "unavailable" });
      return true;
    }

    return false;
  };

  const sendResponse = (payload, verifyRetried = false) => {
    submitMutation.mutate(payload, {
      onSuccess: (response) => {
        busyAttemptsRef.current = 0;
        dispatch({ type: "SUBMIT_SUCCESS", status: response?.status, data: response?.data });
      },
      onError: (error) => {
        if (isTimed && RETRY_REASONS.has(error?.body?.data?.reason)) {
          handleTimeUp();
          return;
        }
        if (isGuest && handleGuestFailure(error, payload, verifyRetried)) return;
        const data = error?.body?.data;
        if (isAuthed && (GUEST_FILE_REASONS.has(data?.reason) || data?.reason === "guestUploadsUnavailable")) {
          if (data.questionId && data.reason !== "fileScanning") {
            dispatch({ type: "SET_FILE_PROBLEM", fieldId: data.questionId, problem: { reason: data.reason, scanResult: data.scanResult ?? null } });
          }
          dispatch({ type: "SET_ERROR", message: error.body.message });
          return;
        }
        const failure = submitFailureAction(error);
        if (failure) {
          dispatch(failure);
          return;
        }
        const message = error?.status === 401
          ? "Oturumunuzun süresi doldu. Yeniden giriş yapıp tekrar gönderin."
          : "Cevabınız gönderilemedi. Bağlantınızı kontrol edip tekrar deneyin.";
        dispatch({ type: "SET_ERROR", message });
      },
    });
  };

  const handleSubmit = async (formattedResponses, { auto = false } = {}) => {
    if (!auto) busyAttemptsRef.current = 0;
    dispatch({ type: "CLEAR_ERROR" });
    setGuestNotice(null);
    cancelDraftSave();
    const timeSpentInSeconds = Math.floor((Date.now() - startTimeRef.current) / 1000);
    const payload = {
      formId: state.form?.id,
      responses: formattedResponses,
      timeSpent: timeSpentInSeconds,
      attribution: readAttribution(state.form?.id, state.startFormId),
    };

    if (!isGuest) {
      sendResponse(payload);
      return;
    }

    setPreparing(true);
    setBusyRetry(null);
    try {
      const turnstileToken = await requestSubmitToken();
      sendResponse({ ...payload, turnstileToken, guestUploadSession: guest.sessionId() });
    } catch {
      return;
    } finally {
      setPreparing(false);
    }
  };

  const showMissingFields = (fieldIds) => {
    dispatch({ type: "SET_MISSING_FIELDS", fieldIds });
  };

  const clearError = useCallback(() => dispatch({ type: "CLEAR_ERROR" }), []);
  const clearGuestNotice = useCallback(() => setGuestNotice(null), []);
  const startScanWait = useCallback(() => setScanWait(Date.now()), []);
  const stopScanWait = useCallback(() => setScanWait(null), []);
  const clearBusyRetry = useCallback(() => setBusyRetry(null), []);

  return { state, dispatch, schema, visibleFields, isAuthed, isAnyFileUploading, isSubmitting: submitMutation.isPending || isPreparing || Boolean(state.nextFormId) || Boolean(busyRetry),
    lastSavedAt, handleValueChange, handleUploadStateChange, handleDiscardDraft, handleSubmit, showMissingFields, endIntro, clearError,
    now, isTimed, isRunning, startAttempt, isStarting: startMutation.isPending, startError,
    isGuest, guest, guestNotice, showGuestNotice: setGuestNotice, clearGuestNotice, turnstileBlocked: scriptBlocked && !verificationOutage, verificationOutage,
    scanWait, startScanWait, stopScanWait, busyRetry, clearBusyRetry,
    hideDraftPrompt,
  };
}

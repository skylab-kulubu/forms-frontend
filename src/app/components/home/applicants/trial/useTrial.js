"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDisplayFormQuery } from "@/lib/hooks/useForm";
import { isFieldMissing, useFormDisplayer } from "@/app/components/form-displayer/hooks/useFormDisplayer";
import { formatFieldAnswer } from "@/app/components/form-answer-format";
import { serializeRepeater } from "@/app/components/form-components/FormRepeater";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function jumpTo(fieldId) {
  document.getElementById(fieldId)?.scrollIntoView({ behavior: "smooth", block: "center" });
}

export function useTrialForm(formId) {
  const { data, isLoading, error } = useDisplayFormQuery(formId);
  const ok = data?.status === 200 && Boolean(data?.data?.form);
  return {
    form: ok ? data.data.form : null,
    payload: data?.data ?? null,
    loading: Boolean(formId) && isLoading,
    failed: Boolean(error) || (Boolean(data) && !ok),
  };
}

export function useTrial(form, payload) {
  const d = useFormDisplayer(form, null, {
    closesAt: payload?.closesAt ?? null,
    serverNow: payload?.serverNow ?? null,
    guestUploads: payload?.guestUploads ?? null,
  });
  const { state, visibleFields, busyRetry } = d;
  const values = state.values;
  const lockedOut = d.respondent === "expired" && !d.allowsAnonymous;

  const numbers = useMemo(() => {
    const map = new Map();
    let n = 0;
    visibleFields.forEach((field) => {
      if (field.type !== "separator") map.set(field.id, ++n);
    });
    return map;
  }, [visibleFields]);

  const [missingTick, setMissingTick] = useState(0);
  const [dismissedTick, setDismissedTick] = useState(-1);

  const submit = (auto = false) => {
    if (lockedOut) {
      d.login();
      return;
    }
    d.clearGuestNotice();
    setTimeout(() => {
      const missing = visibleFields.filter((field) => isFieldMissing(field, values[field.id])).map((field) => field.id);
      if (missing.length) {
        d.clearBusyRetry();
        d.showMissingFields(missing);
        setMissingTick((n) => n + 1);
        setTimeout(() => jumpTo(missing[0]), 150);
        return;
      }
      const responses = visibleFields.filter((field) => field.type !== "separator").map((field) => ({
        id: field.id,
        type: field.type,
        question: field.props?.question || "",
        answer: field.type === "repeater" ? serializeRepeater(field.props?.fields, values[field.id]) : formatFieldAnswer(field, values[field.id]),
      }));
      d.handleSubmit(responses, { auto });
    }, 100);
  };

  const submitRef = useRef(submit);
  useEffect(() => {
    submitRef.current = submit;
  });

  useEffect(() => {
    if (!busyRetry) return undefined;
    const timer = setTimeout(() => submitRef.current(true), Math.max(0, busyRetry.at - Date.now()));
    return () => clearTimeout(timer);
  }, [busyRetry]);

  const missingFields = state.missingFieldIds
    .filter((id) => numbers.has(id))
    .map((id) => ({ id, number: numbers.get(id) }))
    .sort((a, b) => a.number - b.number);

  const identityField = lockedOut ? null : visibleFields.find((field) => field.props?.identity === "email");
  const typed = identityField ? String(values[identityField.id] ?? "").trim() : "";
  const copyEmail = typed.length <= 254 && EMAIL_PATTERN.test(typed) ? typed : null;

  const authValue = useMemo(() => ({
    respondent: d.respondent, user: d.user, allowsAnonymous: d.allowsAnonymous, hasGuestFiles: d.hasGuestFiles, login: d.login,
    logoutConfirming: d.logoutConfirming, requestLogout: d.requestLogout, confirmLogout: d.confirmLogout, cancelLogout: d.cancelLogout,
  }), [d.respondent, d.user, d.allowsAnonymous, d.hasGuestFiles, d.login, d.logoutConfirming, d.requestLogout, d.confirmLogout, d.cancelLogout]);

  return {
    ...d,
    values,
    numbers,
    submit,
    missingFields,
    missingOpen: missingFields.length > 0 && dismissedTick !== missingTick,
    dismissMissing: () => setDismissedTick(missingTick),
    copyEmail,
    authValue,
    finished: state.submissionState !== null,
  };
}

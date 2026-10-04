import { useCallback, useEffect, useRef, useState } from "react";

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;

const pad = (value) => String(value).padStart(2, "0");

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function durationText(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (!hours) return `${rest} dakika`;
  return rest ? `${hours} saat ${rest} dakika` : `${hours} saat`;
}

export function durationAdjective(minutes) {
  const text = durationText(minutes);
  return `${text}${text.endsWith("saat") ? "lik" : "lık"}`;
}

export function shortDuration(ms) {
  const minutes = Math.max(1, Math.round(ms / MINUTE));
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} dk`;
  return rest ? `${hours} sa ${rest} dk` : `${hours} sa`;
}

export function leftText(ms) {
  if (ms <= 0) return "süre doldu";
  if (ms < HOUR) return `${Math.max(1, Math.ceil(ms / MINUTE))} dk kaldı`;
  return `${Math.floor(ms / HOUR)} sa kaldı`;
}

export function clock(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
}

export function hourMinute(value) {
  const date = toDate(value);
  return date ? date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : "";
}

export function currentTime() {
  return Date.now();
}

export function isPastDate(value) {
  const date = toDate(value);
  return Boolean(date) && date.getTime() <= Date.now();
}

export function formatLongDate(value) {
  const date = toDate(value);
  if (!date) return "";
  return `${date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" })}, ${hourMinute(date)}`;
}

export function formatShortDate(value) {
  const date = toDate(value);
  if (!date) return "";
  return `${date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} ${hourMinute(date)}`;
}

export function formatDay(value) {
  const date = toDate(value);
  return date ? date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }) : "";
}

export function toLocalInput(value) {
  const date = toDate(value);
  if (!date) return "";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function fromLocalInput(text) {
  const date = toDate(text);
  return date ? date.toISOString() : null;
}

export function defaultClosesAt() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  date.setHours(23, 59, 0, 0);
  return date.toISOString();
}

export function settledScreenOf(attempt) {
  if (attempt?.state === "provisional") return "timeUp";
  if (attempt?.state === "noSubmission") return attempt.closedByTeam ? "timeUpClosed" : "timeUpEmpty";
  return null;
}

export function useServerNow(serverNow) {
  const offsetRef = useRef(0);

  useEffect(() => {
    const date = toDate(serverNow);
    offsetRef.current = date ? date.getTime() - Date.now() : 0;
  }, [serverNow]);

  return useCallback(() => Date.now() + offsetRef.current, []);
}

export function useTicker(active, intervalMs = 1000) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    const timer = setInterval(() => setTick((value) => value + 1), intervalMs);
    return () => clearInterval(timer);
  }, [active, intervalMs]);
}

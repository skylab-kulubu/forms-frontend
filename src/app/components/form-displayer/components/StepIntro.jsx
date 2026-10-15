"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { FilePenLine, Route } from "lucide-react";
import { journeyTimeline } from "@/lib/workflow-journey";
import LoginButton from "../../utils/LoginButton";
import JourneyTimeline from "./JourneyTimeline";
import { FooterMark } from "./StatusScreen";

export const INTRO_MS = 3500;

// Düzeltme isteğinde ekip notu okunacağı için giriş kendiliğinden geçmez; aday butonla forma geçer.
export default function StepIntro({ workflow, stage, formTitle, arrivedTitle = null, revision = null, onDone }) {
  const doneRef = useRef(false);
  const arrived = Boolean(arrivedTitle);
  const items = journeyTimeline(workflow, { phase: "intro", arrived });
  const autoAdvance = !revision;

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onDone();
  };

  const finishRef = useRef(finish);
  useEffect(() => { finishRef.current = finish; });

  useEffect(() => {
    if (!autoAdvance) return undefined;
    const timer = setTimeout(() => finishRef.current(), INTRO_MS);
    const onKey = (event) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      finishRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [autoAdvance]);

  return (
    <motion.div className={`relative z-10 flex min-h-full w-full flex-col items-center px-5 pb-7 pt-14 ${autoAdvance ? "cursor-pointer" : ""}`} onClick={autoAdvance ? finish : undefined}
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12, transition: { duration: 0.22, ease: "easeIn" } }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex w-full flex-1 items-center justify-center">
        <div className="flex w-full max-w-104 flex-col items-center text-center">
          {revision
            ? <FilePenLine className="size-7.5 text-sky-300" strokeWidth={1.6} />
            : <Route className="size-7.5 text-skylab-300" strokeWidth={1.6} />}
          <p className="mt-4.5 text-xs text-neutral-500">
            {workflow?.title}
            {!arrived && stage > 0 && <> · <span className="text-skylab-300">{stage}. adım</span></>}
          </p>
          <h1 className="mt-1.5 text-balance text-xl font-semibold tracking-tight text-neutral-50">
            {revision ? `${formTitle} için düzeltme istendi` : arrived ? `${arrivedTitle} kaydedildi` : formTitle}
          </h1>
          {revision && (
            <p className="mt-2 max-w-96 text-balance text-sm leading-relaxed text-neutral-400">
              Ekip cevaplarınızı inceledi ve bir düzeltme istedi. Önceki cevaplarınız formda hazır; gerekenleri değiştirip yeniden gönderin.
            </p>
          )}
          <JourneyTimeline items={items} className="mt-7" />
          <div className="mt-7.5 flex flex-col items-center gap-3.5">
            {autoAdvance && (
              <span className="h-0.5 w-40 overflow-hidden rounded-full bg-white/8">
                <motion.span className="block h-full w-full origin-left rounded-full bg-skylab-500"
                  initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: INTRO_MS / 1000, ease: "linear" }}
                />
              </span>
            )}
            <LoginButton label={revision ? "Düzeltmeye başla" : "Forma geç"} hoverIcon="arrow" onClick={(event) => { event.stopPropagation(); finish(); }} />
          </div>
        </div>
      </div>
      <FooterMark />
    </motion.div>
  );
}

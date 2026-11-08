"use client";

import { Fragment } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CircleCheck } from "lucide-react";
import { columnsOf } from "./table-data";

const LINE = "bg-white/15";
const STEP_CARD = "flex h-12 min-w-0 items-center gap-2 rounded-lg border border-white/8 bg-white/2 px-2.5 outline-none transition-colors hover:border-white/15 hover:bg-white/4 focus-visible:ring-2 focus-visible:ring-skylab-400/40";

function Reveal({ index, className = "", children }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.04, duration: 0.2, ease: [0.22, 1, 0.36, 1] }}>
      {children}
    </motion.div>
  );
}

function Connector({ index }) {
  return (
    <Reveal index={index} className="hidden w-4 shrink-0 items-center self-center @2xl:flex">
      <span aria-hidden="true" className={`h-px flex-1 ${LINE}`} />
    </Reveal>
  );
}

function StepCard({ step }) {
  return (
    <Link href={step.href} title={step.title} className={STEP_CARD}>
      <span className="w-3 shrink-0 text-center text-3xs tabular-nums text-neutral-500">{step.number}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-2xs font-medium text-neutral-200">{step.title}</span>
        <span className="mt-px flex min-w-0 items-center gap-1.5 text-3xs text-neutral-500">
          {step.people != null ? <span className="shrink-0 tabular-nums">{step.people} kişi</span> : null}
          {step.waiting ? <span className="truncate tabular-nums text-amber-200/80">{step.waiting} bekliyor</span> : null}
        </span>
      </span>
    </Link>
  );
}

function Column({ steps, index, hasNext }) {
  const forked = steps.length > 1;
  const tickIn = "@2xl:before:absolute @2xl:before:-left-2.5 @2xl:before:top-1/2 @2xl:before:h-px @2xl:before:w-2.5 @2xl:before:bg-white/15";
  const tickOut = hasNext ? "@2xl:mr-2.5 @2xl:after:absolute @2xl:after:-right-2.5 @2xl:after:top-1/2 @2xl:after:h-px @2xl:after:w-2.5 @2xl:after:bg-white/15" : "";

  return (
    <Reveal index={index} className="relative flex min-w-0 flex-col justify-center gap-1.5 @2xl:w-48 @2xl:flex-none">
      {forked ? <span aria-hidden="true" className={`absolute inset-y-6 left-0 hidden w-px @2xl:block ${LINE}`} /> : null}
      {forked && hasNext ? <span aria-hidden="true" className={`absolute inset-y-6 right-0 hidden w-px @2xl:block ${LINE}`} /> : null}
      {steps.map((step) => (
        <div key={step.key} className={forked ? `relative min-w-0 @2xl:ml-2.5 ${tickIn} ${tickOut}` : "min-w-0"}>
          <StepCard step={step} />
        </div>
      ))}
    </Reveal>
  );
}

export default function FlowStrip({ row }) {
  const { columns, done } = columnsOf(row);

  return (
    <div className="flex min-w-0 flex-col gap-1.5 overflow-x-auto scrollbar-hidden @2xl:flex-row @2xl:items-stretch @2xl:gap-0">
      {columns.map((steps, index) => (
        <Fragment key={steps[0].key}>
          {index ? <Connector index={index} /> : null}
          <Column steps={steps} index={index} hasNext={index < columns.length - 1 || done > 0} />
        </Fragment>
      ))}
      {done > 0 ? (
        <>
          <Connector index={columns.length} />
          <Reveal index={columns.length} className="flex shrink-0 flex-col justify-center @2xl:w-24">
            <Link href={row.href} className={`${STEP_CARD.replace("px-2.5", "px-2")} whitespace-nowrap`}>
              <CircleCheck size={13} className="shrink-0 text-neutral-500" />
              <span className="min-w-0">
                <span className="block text-2xs font-medium text-neutral-300">Bitenler</span>
                <span className="mt-px block text-3xs tabular-nums text-neutral-500">{done} başvuru</span>
              </span>
            </Link>
          </Reveal>
        </>
      ) : null}
    </div>
  );
}

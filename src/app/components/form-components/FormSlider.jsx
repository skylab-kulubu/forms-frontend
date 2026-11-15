"use client";

import { useState } from "react";
import { Slider } from "@skylab-kulubu/skylcn-ui";
import { QuestionField, questionLabel } from "./QuestionParts";

export function sliderRange({ min = 0, max = 100, step = 1 } = {}) {
  const low = Number.isFinite(Number(min)) ? Number(min) : 0;
  const high = Number.isFinite(Number(max)) && Number(max) > low ? Number(max) : low + 1;
  const size = Number(step) > 0 ? Number(step) : 1;
  const decimals = (String(size).split(".")[1] ?? "").length;
  const snap = (value) => {
    const steps = Math.round((Math.min(high, Math.max(low, Number(value))) - low) / size);
    return Math.min(high, Number((low + steps * size).toFixed(decimals)));
  };
  return { min: low, max: high, step: size, snap, middle: snap(low + (high - low) / 2) };
}

export function DisplayFormSlider({ question, questionNumber, description, required = false, min: rawMin = 0, max: rawMax = 100, step: rawStep = 1, value, onChange, missing = false }) {
  const { min, max, step, snap, middle } = sliderRange({ min: rawMin, max: rawMax, step: rawStep });
  const [internalValue, setInternalValue] = useState(value !== undefined ? value : middle);
  const currentValue = value !== undefined ? value : internalValue;
  // Base UI's slider needs a number; an empty answer shows the thumb in the middle, as the native range did
  const shown = currentValue === null || currentValue === "" || !Number.isFinite(Number(currentValue)) ? middle : snap(currentValue);

  const commit = (next) => {
    if (onChange) {
      onChange({ target: { value: next } });
    } else {
      setInternalValue(next);
    }
  };

  return (
    <QuestionField question={question} questionNumber={questionNumber} description={description} required={required} missing={missing}>
      <Slider min={min} max={max} step={step} value={shown}
        onValueChange={(next) => commit(snap(Array.isArray(next) ? next[0] : next))}
        thumbLabels={[questionLabel(question)]} ends={[String(min), String(max)]}
      />
    </QuestionField>
  );
}

"use client";

import { useState } from "react";
import { Link as LinkIcon, Github, Linkedin, Instagram, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { IconButton, Input } from "@skylab-kulubu/skylcn-ui";
import { QuestionField } from "./QuestionParts";

// Links are often typed without a scheme, which type="url" calls invalid on Enter; text with the URL keyboard keeps them
const LINK_INPUT = { type: "text", inputMode: "url", autoCapitalize: "none", autoCorrect: "off", spellCheck: false };

function getProviderIcon(input) {
  if (!input || typeof input !== "string") return LinkIcon;
  let hostname = "";
  try {
    hostname = new URL(input).hostname;
  } catch (_) {
    try {
      hostname = new URL(`http://${input}`).hostname;
    } catch (_) {
      hostname = "";
    }
  }
  const h = hostname.toLowerCase();
  if (h.includes("github.com")) return Github;
  if (h.includes("linkedin.com")) return Linkedin;
  if (h.includes("instagram.com")) return Instagram;
  return LinkIcon;
}

function isValidUrl(input) {
  if (!input || typeof input !== "string") return false;
  let u;
  try {
    u = new URL(input);
  } catch (_) {
    try {
      u = new URL(`http://${input}`);
    } catch (_) {
      return false;
    }
  }
  return typeof u.hostname === "string" && u.hostname.includes(".");
}

function SingleLinkInput({ required = false, value, onChange }) {
  const [internalValue, setInternalValue] = useState(value ?? "");
  const currentValue = value !== undefined ? value : internalValue;
  const handleChange = (e) => {
    if (onChange) onChange({ target: { value: e.target.value } });
    else setInternalValue(e.target.value);
  };
  return (
    <Input {...LINK_INPUT} icon={getProviderIcon(currentValue)} name="link" aria-required={required || undefined}
      value={currentValue ?? ""} onChange={handleChange} placeholder="https://ornek.com"
    />
  );
}

function MultiLinkInput({ required = false, value, onChange }) {
  const normalizeIncoming = (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v === "string" && v.length > 0) return [v];
    return [];
  };

  const [links, setLinks] = useState(normalizeIncoming(value));
  const currentLinks = value !== undefined ? normalizeIncoming(value) : links;

  const commit = (nextArray) => {
    if (onChange) onChange({ target: { value: nextArray } });
    else setLinks(nextArray);
  };

  const updateAt = (index, newVal) => {
    const base = [...currentLinks];
    base[index] = newVal;
    let next = base.filter((v, i) => (i === base.length - 1 ? true : v !== ""));
    const last = next[next.length - 1];
    if (isValidUrl(last)) {
      if (last !== "" && (next.length === 0 || next[next.length - 1] !== "")) {
        next = [...next, ""];
      }
    }
    while (next.length > 1 && next[next.length - 1] === "" && next[next.length - 2] === "") {
      next.pop();
    }
    commit(next);
  };

  const removeAt = (index) => {
    let next = currentLinks.filter((_, i) => i !== index);
    if (next.length === 0 || isValidUrl(next[next.length - 1])) {
      next = [...next, ""];
    }
    commit(next);
  };

  const fields = currentLinks.length === 0 ? [""] : currentLinks;

  return (
    <div className="flex flex-col gap-2">
      <AnimatePresence initial={false}>
        {fields.map((v, index) => {
          const placeholder = index === fields.length - 1 && v === "" ? "Yeni bağlantı ekleyin..." : "https://ornek.com/profil";
          const isTrailingEmpty = index === fields.length - 1 && v === "";

          return (
            <motion.div key={index} layout className="relative"
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <Input {...LINK_INPUT} icon={getProviderIcon(v)} name="link[]" aria-required={(required && index === 0) || undefined}
                value={v} onChange={(e) => updateAt(index, e.target.value)} placeholder={placeholder}
                className={isTrailingEmpty ? undefined : "[&_input]:pr-10"}
              />

              {!isTrailingEmpty && (
                <IconButton icon={X} label="Linki kaldır" variant="ghost" size="icon-sm" onClick={() => removeAt(index)}
                  className="absolute inset-y-0 right-1.5 my-auto"
                />
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
      <span className="text-2xs leading-relaxed text-subtle-foreground">Geçerli bir bağlantı girildiğinde yeni alan açılır</span>
    </div>
  );
}

// The surrounding Field marks the boxes red while the question is missing
export function LinkAnswerInput({ allowMultiple = false, required = false, value, onChange }) {
  return allowMultiple
    ? <MultiLinkInput required={required} value={value} onChange={onChange} />
    : <SingleLinkInput required={required} value={value} onChange={onChange} />;
}

export function DisplayFormLink({ question, questionNumber, description, required = false, allowMultiple = false, value, onChange, missing = false }) {
  return (
    <QuestionField question={question} questionNumber={questionNumber} description={description} required={required} missing={missing}>
      <LinkAnswerInput allowMultiple={allowMultiple} required={required} value={value} onChange={onChange} />
    </QuestionField>
  );
}

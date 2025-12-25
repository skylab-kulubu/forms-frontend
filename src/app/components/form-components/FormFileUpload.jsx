"use client";

import { useMemo, useRef, useState } from "react";
import { Upload, X, File as FileIcon } from "lucide-react";
import { FieldShell } from "./FieldShell";
import { useProp } from "@/app/admin/components/form-editor/components/useProp";

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${sizes[i]}`;
}

function parseAccept(accept) {
  if (!accept || typeof accept !== "string") return [];
  return accept
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.toLowerCase());
}

function fileMatchesAccept(file, acceptList) {
  if (!acceptList || acceptList.length === 0) return true;
  const name = (file?.name || "").toLowerCase();
  const type = (file?.type || "").toLowerCase();
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  return acceptList.some((rule) => {
    if (!rule) return false;
    if (rule.startsWith(".")) {
      return ext === rule;
    }
    if (rule.endsWith("/*")) {
      const base = rule.slice(0, -2);
      return type.startsWith(`${base}/`);
    }
    // Exact mime type
    return type === rule;
  });
} 

export function CreateFormFileUpload({ questionNumber, props, onPropsChange, readOnly }) {
  const { prop, bind, toggle} = useProp(props, onPropsChange, readOnly);

  return (
    <FieldShell number={questionNumber} title="Dosya Yükleme" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="file-question" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Soru Metni
        </label>
        <input id="file-question" type="text" {...bind("question")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
          placeholder="Sorunuzu buraya yazın."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="file-description" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Açıklama
        </label>
        <input id="file-description" type="text" {...bind("description")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
          placeholder="Açıklamanızı buraya yazın."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="file-accept" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            İzin verilen dosya türleri
          </label>
          <input id="file-accept" type="text" {...bind("acceptedFiles")}
            className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
            placeholder="Örn: .pdf,.jpg,.png veya image/*"
          />
          <span className="px-0.5 text-[11px] text-neutral-500">Virgülle ayırın. Boş bırakılırsa tüm türlere izin verilir.</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="file-maxsize" className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
            Maksimum dosya boyutu (MB)
          </label>
          <input id="file-maxsize" type="number" min={0} {...bind("maxSize")}
            className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-white/30 focus:ring-2 focus:ring-white/20"
            placeholder="0 = sınırsız"
          />
          <span className="px-0.5 text-[11px] text-neutral-500">0 ise sınır yok</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="px-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
          Örnek Cevap
        </label>
        <div className="rounded-lg border border-dashed border-white/10 bg-neutral-900/60 p-6 text-center text-sm text-neutral-400">
          <div className="mx-auto grid size-10 place-items-center rounded-md bg-white/10 text-neutral-300">
            <Upload size={18} />
          </div>
          <p className="mt-2 text-sm font-medium text-neutral-100">Dosya yükle</p>
          <p className="text-xs text-neutral-400">Sürükleyip bırakın veya tıklayın</p>
          <p className="mt-1 text-[11px] text-neutral-500">İzin verilen: {prop.acceptedFiles || "Tüm türler"} • {prop.maxSize > 0 ? `${prop.maxSize}MB sınır` : "Sınırsız boyut"}</p>
        </div>
      </div>
    </FieldShell>
  );
}

export function DisplayFormFileUpload({ question, questionNumber, description, required = false, accept = "", maxSize = 0, value, onChange, missing = false }) {
  const acceptList = useMemo(() => parseAccept(accept), [accept]);
  const maxBytes = Number(maxSize) > 0 ? Number(maxSize) * 1024 * 1024 : Infinity;
  const [internalFile, setInternalFile] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const currentFile = value !== undefined ? value ?? null : internalFile;

  const commit = (file) => {
    if (onChange) {
      onChange({ target: { value: file } });
    } else {
      setInternalFile(file);
    }
  };

  const validateAndSet = (f) => {
    setError("");
    if (!f) {
      commit(null);
      return;
    }
    if (!fileMatchesAccept(f, acceptList)) {
      setError("Bu dosya türüne izin verilmiyor.");
      return;
    }
    if (f.size > maxBytes) {
      setError("Dosya boyutu sınırı aşıldı.");
      return;
    }
    commit(f);
  };

  const handleInputChange = (e) => {
    const f = e.target.files && e.target.files[0] ? e.target.files[0] : null;
    validateAndSet(f);
    if (inputRef.current) inputRef.current.value = ""; // allow same file reselect
  };

  const onDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
    const f = e.dataTransfer?.files && e.dataTransfer.files[0] ? e.dataTransfer.files[0] : null;
    validateAndSet(f);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  };

  const clear = () => {
    if (inputRef.current) inputRef.current.value = "";
    setError("");
    commit(null);
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl">
      <div className="flex flex-col p-2 md:p-4">
        <div className="flex gap-3">
          {questionNumber != null && (
            <div className="flex h-6 w-6 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-xs font-semibold text-neutral-300">
              {questionNumber}
            </div>
          )}

          <div className="flex flex-col">
            <p className="text-sm font-medium text-neutral-100">
              {question}{" "} {required && <span className="ml-1 text-red-200/70">*</span>}
            </p>
            {description && ( <p className="my-1 text-xs text-neutral-400">{description}</p>)}
          </div>
        </div>

        <input
          ref={inputRef}
          type="file"
          name="file"
          accept={accept || undefined}
          aria-required={required}
          onChange={handleInputChange}
          className="sr-only"
        />

        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") inputRef.current?.click(); }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          className={`mt-3 rounded-lg border ${dragging ? "border-emerald-300/40 bg-emerald-500/10" : missing ? "border-dashed border-red-400/60 bg-red-900/60" : "border-dashed border-white/10 bg-neutral-900/60"} px-4 py-8 text-center transition-colors`}
        >
          <div className="mx-auto grid size-10 place-items-center rounded-md bg-white/10 text-neutral-300">
            <Upload size={18} />
          </div>
          <p className="mt-2 text-sm font-medium text-neutral-100">Dosya yükle</p>
          <p className="text-xs text-neutral-400">Sürükleyip bırakın veya tıklayın</p>
          <p className="mt-1 text-[11px] text-neutral-500">İzin verilen: {accept || "Tüm türler"}{maxBytes !== Infinity ? ` • ${Math.round(maxBytes / 1024 / 1024)}MB sınır` : ""}</p>
        </div>

        {currentFile && (
          <div className="mt-3 flex items-center justify-between rounded-md border border-white/10 bg-white/5 px-3 py-2">
            <div className="flex items-center gap-2 text-sm text-neutral-200">
              <FileIcon size={16} />
              <span className="truncate max-w-56" title={currentFile.name}>{currentFile.name}</span>
              <span className="text-neutral-400">• {formatBytes(currentFile.size)}</span>
            </div>
            <button type="button" onClick={clear}
              className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/5 p-1 text-neutral-300 hover:text-neutral-100"
              aria-label="Dosyayı kaldır"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && <span className="mt-2 px-0.5 text-[12px] text-red-400">{error}</span>}
        {required && <span className="px-0.5 text-[11px] text-neutral-500 mt-1">Zorunlu alan</span>}
      </div>
    </div>
  );
}

"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Upload, X, File as FileIcon, Loader2 } from "lucide-react";
import { FieldShell } from "./FieldShell";
import { useProp } from "@/app/admin/components/form-editor/hooks/useProp";
import { uploadWithProgress } from "@/lib/apiClient";

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${sizes[i]}`;
}

function parseAccept(acceptedFiles) {
  if (!acceptedFiles || typeof acceptedFiles !== "string") return [];
  return acceptedFiles
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

export function CreateFormFileUpload({ questionNumber, props, onPropsChange, readOnly, ...rest }) {
  const { prop, bind, toggle } = useProp(props, onPropsChange, readOnly);

  return (
    <FieldShell number={questionNumber} title="Dosya Yükleme" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)} {...rest}>
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
    </FieldShell>
  );
}

export function DisplayFormFileUpload({ question, questionNumber, description, required = false, acceptedFiles = "", maxSize = 0, value, onChange, missing = false, onUploadStateChange }) {
  const acceptList = useMemo(() => parseAccept(acceptedFiles), [acceptedFiles]);
  const maxBytes = Number(maxSize) > 0 ? Number(maxSize) * 1024 * 1024 : Infinity;

  const [internalFile, setInternalFile] = useState(null);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const inputRef = useRef(null);

  const currentFile = internalFile;

  const handleUpload = async (file) => {
    setIsUploading(true);
    if (onUploadStateChange) onUploadStateChange(true);
    setUploadProgress(0);
    setError("");
    setInternalFile(file);

    try {
      const response = await uploadWithProgress("/api/images/", file, (percent) => {
        setUploadProgress(percent);
      });

      const uploadedId = response?.data?.id;

      if (onChange) {
        onChange({ target: { value: uploadedId.toString() } });
      }
    } catch (err) {
      setError("Dosya yüklenirken hata oluştu.");
      setInternalFile(null);
      if (onChange) onChange({ target: { value: null } });
    } finally {
      setIsUploading(false);
      if (onUploadStateChange) onUploadStateChange(false);
    }
  };

  const validateAndSet = (f) => {
    setError("");
    if (!f) {
      clear();
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

    handleUpload(f);
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
    if (isUploading) return;
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
    setInternalFile(null);
    setUploadProgress(0);
    if (onChange) onChange({ target: { value: null } });
    if (isUploading && onUploadStateChange) onUploadStateChange(false);
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl">
      <div className="flex flex-col p-2 md:p-4">

        <div className="flex gap-3">
          {questionNumber != null && (
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-neutral-700 bg-neutral-900 text-xs font-semibold text-neutral-300">
              {questionNumber}
            </div>
          )}
          <div className="flex flex-col">
            <p className="text-sm font-medium text-neutral-100">
              {question} {required && <span className="ml-1 text-red-400/80">*</span>}
            </p>
            {description && (<p className="my-1 text-xs text-neutral-400">{description}</p>)}
          </div>
        </div>

        <input ref={inputRef} type="file" name="file" accept={acceptedFiles || undefined} aria-required={required} onChange={handleInputChange} className="sr-only" />

        <div role="button" tabIndex={0} onClick={() => !isUploading && inputRef.current?.click()}
          onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !isUploading) inputRef.current?.click(); }}
          onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          className={`relative mt-3 flex w-full items-center overflow-hidden rounded-lg border h-16 px-4 py-3 transition-all duration-300 ${dragging ? "border-indigo-500/50 bg-indigo-500/10"
              : missing && !currentFile && !error ? "border-dashed border-red-400/60 bg-red-900/20"
                : currentFile || isUploading ? "border-solid border-white/10 bg-neutral-900/60 shadow-sm cursor-pointer hover:bg-neutral-900/80"
                  : "border-dashed border-white/10 bg-neutral-900/40 hover:bg-neutral-900/60 cursor-pointer"
            }`}
        >
          {!currentFile && !isUploading && (
            <div className="flex items-center gap-4 w-full animate-in fade-in duration-300">
              <div className={`flex shrink-0 items-center justify-center size-10 rounded-sm ${dragging ? "bg-indigo-500/20 text-indigo-400" : error ? "bg-red-500/20 text-red-400" : "bg-white/5 text-neutral-400"} transition-colors`}>
                <Upload size={18} />
              </div>
              <div className="flex flex-col text-left">
                <span className={`text-sm font-medium transition-colors duration-300 ${error ? "text-red-400" : "text-neutral-200"}`}>
                  {error ? error : "Dosya yükle veya sürükle"}
                </span>
                <span className="mt-0.5 text-[11px] font-medium tracking-wide text-neutral-500 uppercase">
                  {acceptedFiles ? acceptedFiles.replace(/,/g, ', ') : "TÜM TÜRLER"}
                  {maxBytes !== Infinity ? ` • MAKS ${Math.round(maxBytes / 1024 / 1024)}MB` : ""}
                </span>
              </div>
            </div>
          )}

          {(currentFile || isUploading) && (
            <div className="flex items-center justify-between w-full animate-in fade-in duration-300">

              <div className="flex items-center gap-4 overflow-hidden">
                <div className={`flex shrink-0 items-center justify-center size-10 rounded-sm ${isUploading ? 'bg-indigo-500/10 text-indigo-400' : 'bg-white/10 text-neutral-300'}`}>
                  {isUploading ? <Loader2 size={18} className="animate-spin" /> : <FileIcon size={18} />}
                </div>

                <div className="flex flex-col truncate text-left">
                  <span className="truncate text-sm font-medium text-neutral-200" title={currentFile?.name}>
                    {currentFile?.name}
                  </span>
                  <div className="mt-0.5 flex items-center gap-2 text-[11px] font-medium text-neutral-500">
                    <span>{formatBytes(currentFile?.size)}</span>
                    {isUploading ? (
                      <>
                        <span className="w-1 h-1 rounded-sm bg-neutral-600"></span>
                        <span className="text-indigo-400/80">Yükleniyor... {uploadProgress}%</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1 h-1 rounded-sm bg-neutral-600"></span>
                        <span className="text-neutral-400">Değiştirmek için tıkla</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {!isUploading && (
                <button type="button" onClick={(e) => { e.stopPropagation(); clear(); }} aria-label="Dosyayı kaldır"
                  className="ml-4 shrink-0 inline-flex items-center justify-center rounded-sm p-2 text-neutral-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              )}

              {isUploading && (
                <div className="absolute bottom-0 left-0 h-0.5 w-full bg-neutral-800/50">
                  <div
                    className="h-full bg-indigo-400 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {missing && !error && <span className="mt-2 px-1 text-[12px] font-medium text-red-400 animate-in fade-in">Bu alan zorunludur.</span>}
      </div>
    </div>
  );
}
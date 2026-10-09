"use client";

import { useContext, useMemo, useRef, useState, useEffect } from "react";
import { CircleAlert, CloudOff, Hourglass, Upload, X, File as FileIcon, Loader2, LockKeyhole, ShieldAlert } from "lucide-react";
import { FieldShell } from "./FieldShell";
import { AutoResizeTextarea } from "./AutoResizeTextarea";
import { useProp } from "@/app/admin/components/form-editor/hooks/useProp";
import { useOptionalFormEditor } from "@/app/admin/components/form-editor/FormEditorContext";
import { RichText } from "@/app/components/rich-text/RichText";
import { GuestUploadContext } from "@/app/components/form-displayer/GuestUploadContext";
import { LoginConfirm, useLoginPrompt } from "@/app/components/form-displayer/components/FormDisplayerComponents";
import { uploadWithProgress } from "@/lib/apiClient";
import { fileMatchesGuestTypes, guestFileRules, guestReasonOf, scanResultCopy, waitCopy } from "@/lib/guest-uploads";
import { useGuestUploadCapabilityQuery } from "@/lib/hooks/useGuestUploadCapability";
import { QuestionNumber, QuestionHint } from "./QuestionParts";

const LINK_BUTTON = "underline underline-offset-3 transition-colors text-neutral-300 decoration-white/20 hover:text-neutral-100 hover:decoration-white/50";

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${sizes[i]}`;
}

function formatMegabytes(bytes) {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
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

function GuestUploadHint({ acceptedFiles, maxSize }) {
  const { data, isSuccess } = useGuestUploadCapabilityQuery();
  if (!isSuccess) return null;

  const capability = data?.data ?? null;
  if (!capability) return null;

  const rules = guestFileRules(acceptedFiles, maxSize, capability);
  if (!rules.types.length) {
    return <span className="px-0.5 text-2xs text-amber-300/80">Giriş yapmadan yanıtlayanlar bu türleri yükleyemez. Listeye PDF, JPG ya da PNG ekleyin.</span>;
  }

  return (
    <span className="px-0.5 text-2xs text-neutral-500">
      Giriş yapmadan yanıtlayanlar yalnız {rules.label} yükleyebilir, dosya başına en çok {formatMegabytes(rules.maxBytes)}. Dosyalar virüs taramasından geçer.
    </span>
  );
}

export function CreateFormFileUpload({ questionNumber, props, onPropsChange, readOnly, ...rest }) {
  const { prop, bind, toggle } = useProp(props, onPropsChange, readOnly);
  const editor = useOptionalFormEditor();
  const anonymous = Boolean(editor?.state?.allowAnonymousResponses);

  return (
    <FieldShell number={questionNumber} title="Dosya Yükleme" required={!!prop.required} onRequiredChange={(v) => toggle("required", v)} {...rest}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="file-question" className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">
          Soru Metni
        </label>
        <AutoResizeTextarea id="file-question" {...bind("question")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20"
          placeholder="Sorunuzu buraya yazın."
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="file-description" className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">
          Açıklama
        </label>
        <AutoResizeTextarea id="file-description" {...bind("description")}
          className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20"
          placeholder="Açıklamanızı buraya yazın."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="file-accept" className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">
            İzin verilen dosya türleri
          </label>
          <input id="file-accept" type="text" {...bind("acceptedFiles")}
            className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20"
            placeholder="Örn: .pdf,.jpg,.png veya image/*"
          />
          <span className="px-0.5 text-2xs text-neutral-500">Virgülle ayırın. Boş bırakılırsa tüm türlere izin verilir.</span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="file-maxsize" className="px-0.5 text-2xs font-medium uppercase tracking-wide text-neutral-400">
            Maksimum dosya boyutu (MB)
          </label>
          <input id="file-maxsize" type="number" min={0} {...bind("maxSize")}
            className="block w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-100 placeholder-neutral-500 outline-none transition focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20"
            placeholder="0 = sınırsız"
          />
          <span className="px-0.5 text-2xs text-neutral-500">0 ise sınır yok</span>
        </div>
      </div>

      {anonymous && <GuestUploadHint acceptedFiles={prop.acceptedFiles} maxSize={prop.maxSize} />}
    </FieldShell>
  );
}

function FileQuestionHeader({ question, questionNumber, description, required, missing }) {
  return (
    <div className="flex gap-3">
      <QuestionNumber number={questionNumber} missing={missing} />
      <div className="flex flex-col">
        <p className="text-sm font-medium text-neutral-100">
          {question ? <RichText text={question} /> : <span className="font-normal italic text-neutral-500">Bu soru için metin yok</span>} {required && <span className="ml-1 text-red-400/80">*</span>}
        </p>
        {description && (<RichText as="p" text={description} className="my-1 text-xs text-neutral-400" />)}
      </div>
    </div>
  );
}

function AccountFileUpload({ question, questionNumber, description, required = false, acceptedFiles = "", maxSize = 0, onChange, missing = false, onUploadStateChange }) {
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
      const response = await uploadWithProgress("/v1/media", file, (percent) => {
        setUploadProgress(percent);
      }, "answer_file");

      // Core returns the created media object itself, not wrapped in `data`.
      const uploadedId = response?.id;
      if (!uploadedId) throw new Error("Yükleme yanıtında medya kimliği yok");

      if (onChange) {
        onChange({ target: { value: String(uploadedId) } });
      }
    } catch (err) {
      setError(err?.status === 413 ? "Dosya boyutu sınırı aşıldı." : err?.status === 415 ? "Bu dosya türüne izin verilmiyor." : "Dosya yüklenirken hata oluştu.");
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

        <FileQuestionHeader question={question} questionNumber={questionNumber} description={description} required={required} missing={missing} />

        <input ref={inputRef} type="file" name="file" accept={acceptedFiles || undefined} aria-required={required} onChange={handleInputChange} className="sr-only" />

        <div role="button" tabIndex={0} onClick={() => !isUploading && inputRef.current?.click()}
          onKeyDown={(e) => { if ((e.key === "Enter" || e.key === " ") && !isUploading) inputRef.current?.click(); }}
          onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          className={`relative mt-3 flex w-full items-center overflow-hidden rounded-lg border h-16 px-4 py-3 transition-all duration-300 ${dragging ? "border-skylab-400/50 bg-skylab-500/10"
              : missing && !currentFile && !error ? "border-dashed border-red-400/60 bg-red-900/20"
                : currentFile || isUploading ? "border-solid border-white/10 bg-neutral-900/60 shadow-sm cursor-pointer hover:bg-neutral-900/80"
                  : "border-dashed border-white/10 bg-neutral-900/40 hover:bg-neutral-900/60 cursor-pointer"
            }`}
        >
          {!currentFile && !isUploading && (
            <div className="flex items-center gap-4 w-full animate-in fade-in duration-300">
              <div className={`flex shrink-0 items-center justify-center size-10 rounded-sm ${dragging ? "bg-skylab-500/20 text-skylab-400" : error ? "bg-red-500/20 text-red-400" : "bg-white/5 text-neutral-400"} transition-colors`}>
                <Upload size={18} />
              </div>
              <div className="flex flex-col text-left">
                <span className={`text-sm font-medium transition-colors duration-300 ${error ? "text-red-400" : "text-neutral-200"}`}>
                  {error ? error : "Dosya yükle veya sürükle"}
                </span>
                <span className="mt-0.5 text-2xs font-medium tracking-wide text-neutral-500 uppercase">
                  {acceptedFiles ? acceptedFiles.replace(/,/g, ', ') : "TÜM TÜRLER"}
                  {maxBytes !== Infinity ? ` • MAKS ${Math.round(maxBytes / 1024 / 1024)}MB` : ""}
                </span>
              </div>
            </div>
          )}

          {(currentFile || isUploading) && (
            <div className="flex items-center justify-between w-full animate-in fade-in duration-300">

              <div className="flex items-center gap-4 overflow-hidden">
                <div className={`flex shrink-0 items-center justify-center size-10 rounded-sm ${isUploading ? 'bg-skylab-500/10 text-skylab-400' : 'bg-white/10 text-neutral-300'}`}>
                  {isUploading ? <Loader2 size={18} className="animate-spin" /> : <FileIcon size={18} />}
                </div>

                <div className="flex flex-col truncate text-left">
                  <span className="truncate text-sm font-medium text-neutral-200" title={currentFile?.name}>
                    {currentFile?.name}
                  </span>
                  <div className="mt-0.5 flex items-center gap-2 text-2xs font-medium text-neutral-500">
                    <span>{formatBytes(currentFile?.size)}</span>
                    {isUploading ? (
                      <>
                        <span className="w-1 h-1 rounded-sm bg-neutral-600"></span>
                        <span className="text-skylab-400/80">Yükleniyor... {uploadProgress}%</span>
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
                    className="h-full bg-skylab-500 transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {!error && <QuestionHint required={required} missing={missing} className="mt-2" />}
      </div>
    </div>
  );
}

function typeProblem(rules) {
  return { title: "Bu dosya türü kabul edilmiyor", detail: `Yalnız ${rules.label} yükleyebilirsiniz.` };
}

function sizeProblem(rules) {
  return { title: "Dosya çok büyük", detail: `En çok ${formatMegabytes(rules.maxBytes)} yükleyebilirsiniz.` };
}

const VERIFICATION_LOCKS = {
  blocked: { icon: ShieldAlert, title: "Güvenlik doğrulaması yüklenemedi", detail: "Dosya yüklemek için bu sayfada reklam engelleyiciyi kapatın." },
  outage: { icon: CloudOff, title: "Dosya yükleme şu an kullanılamıyor", detail: "Güvenlik doğrulama hizmetine ulaşılamıyor. Biraz sonra tekrar deneyin." },
};

const QUEUE_REASONS = new Set(["tooManyUploads", "tooManySessions"]);
const QUEUE_WAIT_LIMIT_SECONDS = 60;
const QUEUE_RETRY_LIMIT = 3;
const QUEUE_JITTER_MS = 2000;

function lockFor(seconds, lock) {
  return { ...lock, lock: true, until: Date.now() + Math.max(1, Number(seconds) || 30) * 1000 };
}

function guestProblem(error, rules) {
  const reason = error?.reason ?? guestReasonOf(error);
  const retryAfter = error?.body?.data?.retryAfterSeconds;
  switch (reason) {
    case "blocked":
      return null;
    case "verificationFailed":
      return { security: true, retry: true, title: "Güvenlik doğrulaması geçmedi", detail: "Birkaç saniye sonra tekrar deneyin." };
    case "tooManyUploads":
    case "tooManySessions":
      return lockFor(retryAfter, { icon: Hourglass, title: "Kısa sürede çok fazla dosya yüklendi", detail: `${waitCopy(retryAfter)} sonra tekrar deneyin.` });
    case "sessionFileLimit":
      return { lock: true, icon: CircleAlert, title: "Dosya sınırına ulaşıldı", detail: error?.body?.message ?? "Bu formda bir seferde yüklenebilecek dosya sayısı doldu." };
    case "guestUploadsUnavailable":
      return lockFor(retryAfter, { icon: CloudOff, title: "Dosya yükleme şu an kullanılamıyor", detail: "Bir sunucu sorunu var. Biraz sonra tekrar deneyin." });
    case "guestUploadsDisabled":
      return { lock: true, icon: LockKeyhole, title: "Dosya yükleme kapalı", detail: "Bu forma şu an giriş yapmadan dosya yüklenemiyor." };
    case "closed":
      return { lock: true, icon: LockKeyhole, title: "Form kapandı", detail: "Bu form artık yanıt kabul etmiyor." };
    case "fileTooLarge":
      return sizeProblem(rules);
    case "fileTypeNotAllowed":
      return typeProblem(rules);
    case "fileNameInvalid":
      return { title: "Dosya adı geçersiz", detail: "Dosyanın adını değiştirip tekrar yükleyin." };
    case "fileEmpty":
      return { title: "Dosya boş", detail: "Başka bir dosya seçin." };
    default:
      if (error?.status === 413) return sizeProblem(rules);
      if (error?.status >= 500) return lockFor(retryAfter, { icon: CloudOff, title: "Dosya yükleme şu an kullanılamıyor", detail: "Bir sunucu sorunu var. Biraz sonra tekrar deneyin." });
      return { retry: true, title: "Dosya yüklenemedi", detail: "Bağlantınızı kontrol edip tekrar deneyin." };
  }
}

function LockedBox({ lock }) {
  const Icon = lock.icon ?? CircleAlert;

  return (
    <div className="relative mt-3 flex w-full min-h-16 items-center gap-4 overflow-hidden rounded-lg border border-dashed border-white/10 bg-neutral-900/40 px-4 py-3 opacity-60 cursor-not-allowed select-none">
      <div className="flex shrink-0 items-center justify-center size-10 rounded-sm bg-white/5 text-neutral-500">
        <Icon size={18} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col text-left">
        <span className="text-sm font-medium text-neutral-300">{lock.title}</span>
        <span className="mt-0.5 text-2xs text-neutral-500">{lock.detail}</span>
      </div>
    </div>
  );
}

function entryProblem(entry, rules) {
  if (entry?.status === "rejected") return { security: true, title: entry.name, detail: scanResultCopy(entry.scanResult) };
  if (entry?.status === "expired") return { title: entry.name, detail: "Dosyanın süresi doldu. Dosyayı yeniden yükleyin." };
  if (entry?.status === "invalid") return { title: entry.name, detail: `Bu dosya soruya uymuyor. Yalnız ${rules.label}, en çok ${formatMegabytes(rules.maxBytes)}.` };
  return null;
}

function LoginLink({ prompt, label = "Giriş yap" }) {
  return (
    <button type="button" onClick={(event) => { event.stopPropagation(); prompt.request(); }} className={LINK_BUTTON}>
      {label}
    </button>
  );
}

function GuestLoginRequired({ question, questionNumber, description, required, missing, reason, hasAnswers }) {
  const prompt = useLoginPrompt(hasAnswers);

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl">
      <div className="flex flex-col p-2 md:p-4">
        <FileQuestionHeader question={question} questionNumber={questionNumber} description={description} required={required} missing={missing} />

        <div className={`relative mt-3 flex w-full items-center gap-4 overflow-hidden rounded-lg border border-dashed h-16 px-4 py-3 ${missing ? "border-red-400/60 bg-red-900/20" : "border-white/10 bg-neutral-900/40"}`}>
          <div className="flex shrink-0 items-center justify-center size-10 rounded-sm bg-white/5 text-neutral-500">
            <LockKeyhole size={18} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col text-left">
            <span className="text-sm font-medium text-neutral-200">Dosya yüklemek için giriş yapın</span>
            <span className="mt-0.5 truncate text-2xs text-neutral-500">{reason}</span>
          </div>
          {!prompt.confirming && <span className="shrink-0 text-xs"><LoginLink prompt={prompt} /></span>}
        </div>

        {prompt.confirming ? (
          <p className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-2xs text-neutral-500">
            <LoginConfirm prompt={prompt} />
          </p>
        ) : (
          <QuestionHint required={required} missing={missing} className="mt-2" />
        )}
      </div>
    </div>
  );
}

function IssueContent({ issue, onRetry, onClear }) {
  const Icon = issue.security ? ShieldAlert : CircleAlert;

  return (
    <div className="flex w-full items-center gap-4 animate-in fade-in duration-300">
      <div className="flex shrink-0 items-center justify-center size-10 rounded-sm bg-red-500/15 text-red-400">
        <Icon size={18} />
      </div>
      <div className="flex min-w-0 flex-1 flex-col text-left">
        <span className="truncate text-sm font-medium text-red-100" title={issue.title}>{issue.title}</span>
        <span className="mt-0.5 text-2xs text-red-300/80">{issue.detail}</span>
      </div>
      {onRetry && (
        <button type="button" onClick={(event) => { event.stopPropagation(); onRetry(); }}
          className="shrink-0 rounded-md border border-white/10 bg-white/5 px-2.5 py-1.5 text-2xs font-semibold text-neutral-100 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
        >
          Tekrar dene
        </button>
      )}
      {onClear && (
        <button type="button" onClick={(event) => { event.stopPropagation(); onClear(); }} aria-label="Dosyayı kaldır"
          className="shrink-0 inline-flex items-center justify-center rounded-sm p-2 text-red-300/70 hover:bg-red-500/20 hover:text-red-300 transition-colors"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

function GuestFileUpload({ fieldId, question, questionNumber, description, required = false, acceptedFiles = "", maxSize = 0, onChange, missing = false, onUploadStateChange, guest }) {
  const rules = useMemo(() => guestFileRules(acceptedFiles, maxSize, guest.capability), [acceptedFiles, maxSize, guest.capability]);
  const entry = guest.files[fieldId] ?? null;

  const [pending, setPending] = useState(null);
  const [queued, setQueued] = useState(null);
  const [progress, setProgress] = useState(0);
  const [problem, setProblem] = useState(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);
  const startRef = useRef(null);
  const reportUploadingRef = useRef(onUploadStateChange);

  const uploading = Boolean(pending);
  const busy = uploading || Boolean(queued);
  const scanning = entry?.status === "scanning";
  const entryIssue = busy ? null : entryProblem(entry, rules);
  const lock = busy || entry ? null : VERIFICATION_LOCKS[guest.verification] ?? (problem?.lock ? problem : null);
  const issue = busy || lock ? null : entryIssue ?? (problem?.lock ? null : problem);
  const shown = uploading ? { name: pending.name, size: pending.size }
    : queued ? { name: queued.file.name, size: queued.file.size }
      : entryIssue ? null : entry;

  useEffect(() => {
    if (!problem?.until) return undefined;
    const timer = setTimeout(() => setProblem((current) => (current === problem ? null : current)), Math.max(0, problem.until - Date.now()));
    return () => clearTimeout(timer);
  }, [problem]);

  const start = async (file, attempt = 0) => {
    setProblem(null);
    setQueued(null);
    setPending(file);
    setProgress(0);
    onUploadStateChange?.(true);
    onChange?.({ target: { value: null } });

    let requeued = false;
    try {
      const media = await guest.upload(fieldId, file, setProgress);
      if (media.status !== "rejected") onChange?.({ target: { value: String(media.id) } });
    } catch (error) {
      const seconds = Number(error?.body?.data?.retryAfterSeconds) || 0;
      requeued = QUEUE_REASONS.has(error?.reason ?? guestReasonOf(error)) && seconds > 0 && seconds <= QUEUE_WAIT_LIMIT_SECONDS && attempt < QUEUE_RETRY_LIMIT;
      if (requeued) {
        setQueued({ file, attempt: attempt + 1, at: Date.now() + seconds * 1000 + Math.round(Math.random() * QUEUE_JITTER_MS) });
      } else {
        const next = guestProblem(error, rules);
        setProblem(next ? { ...next, file } : null);
      }
    } finally {
      setPending(null);
      if (!requeued) onUploadStateChange?.(false);
    }
  };

  useEffect(() => {
    startRef.current = start;
    reportUploadingRef.current = onUploadStateChange;
  });

  useEffect(() => () => reportUploadingRef.current?.(false), []);

  useEffect(() => {
    if (!queued) return undefined;
    const timer = setTimeout(() => startRef.current?.(queued.file, queued.attempt), Math.max(0, queued.at - Date.now()));
    return () => clearTimeout(timer);
  }, [queued]);

  const cancelQueued = () => {
    setQueued(null);
    onUploadStateChange?.(false);
  };

  const reject = (nextProblem) => {
    if (entry) {
      guest.remove(fieldId);
      onChange?.({ target: { value: null } });
    }
    setProblem(nextProblem);
  };

  const choose = (file) => {
    if (!file) return;
    setProblem(null);
    if (!fileMatchesGuestTypes(file, rules.types)) {
      reject(typeProblem(rules));
      return;
    }
    if (file.size > rules.maxBytes) {
      reject(sizeProblem(rules));
      return;
    }
    start(file);
  };

  const remove = () => {
    if (inputRef.current) inputRef.current.value = "";
    setProblem(null);
    guest.remove(fieldId);
    onChange?.({ target: { value: null } });
  };

  const handleInputChange = (event) => {
    choose(event.target.files?.[0] ?? null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const onDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
    if (uploading || lock) return;
    choose(event.dataTransfer?.files?.[0] ?? null);
  };

  const onDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(!lock);
  };

  const onDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragging(false);
  };

  const openPicker = () => {
    if (!uploading && !lock) inputRef.current?.click();
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-xl">
      <div className="flex flex-col p-2 md:p-4">

        <FileQuestionHeader question={question} questionNumber={questionNumber} description={description} required={required} missing={missing} />

        <input ref={inputRef} type="file" name="file" accept={rules.accept || undefined} aria-required={required} disabled={Boolean(lock)} onChange={handleInputChange} className="sr-only" />

        {lock ? <LockedBox lock={lock} /> : (
          <div role="button" tabIndex={0} onClick={openPicker}
            onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") openPicker(); }}
            onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
            className={`relative mt-3 flex w-full items-center overflow-hidden rounded-lg border px-4 py-3 transition-all duration-300 ${issue && !dragging ? "min-h-16" : "h-16"} ${dragging ? "border-skylab-400/50 bg-skylab-500/10"
                : issue ? "border-solid border-red-400/30 bg-red-900/15 cursor-pointer hover:bg-red-900/25"
                  : missing && !shown ? "border-dashed border-red-400/60 bg-red-900/20"
                    : shown ? "border-solid border-white/10 bg-neutral-900/60 shadow-sm cursor-pointer hover:bg-neutral-900/80"
                      : "border-dashed border-white/10 bg-neutral-900/40 hover:bg-neutral-900/60 cursor-pointer"
              }`}
          >
            {issue && !dragging && (
              <IssueContent issue={issue} onRetry={!entryIssue && problem?.retry && problem.file ? () => start(problem.file) : null}
                onClear={entryIssue ? remove : null}
              />
            )}

            {(!issue || dragging) && !shown && (
              <div className="flex items-center gap-4 w-full animate-in fade-in duration-300">
                <div className={`flex shrink-0 items-center justify-center size-10 rounded-sm ${dragging ? "bg-skylab-500/20 text-skylab-400" : "bg-white/5 text-neutral-400"} transition-colors`}>
                  <Upload size={18} />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-medium text-neutral-200">Dosya yükle veya sürükle</span>
                  <span className="mt-0.5 text-2xs font-medium tracking-wide text-neutral-500 uppercase">
                    {rules.label} • MAKS {Math.round(rules.maxBytes / 1024 / 1024)}MB
                  </span>
                </div>
              </div>
            )}

            {!issue && shown && (
              <div className="flex items-center justify-between w-full animate-in fade-in duration-300">
                <div className="flex items-center gap-4 overflow-hidden">
                  <div className={`flex shrink-0 items-center justify-center size-10 rounded-sm ${busy || scanning ? "bg-skylab-500/10 text-skylab-400" : "bg-white/10 text-neutral-300"}`}>
                    {busy || scanning ? <Loader2 size={18} className="animate-spin" /> : <FileIcon size={18} />}
                  </div>

                  <div className="flex flex-col truncate text-left">
                    <span className="truncate text-sm font-medium text-neutral-200" title={shown.name}>
                      {shown.name}
                    </span>
                    <div className="mt-0.5 flex items-center gap-2 text-2xs font-medium text-neutral-500">
                      <span>{formatBytes(shown.size)}</span>
                      <span className="w-1 h-1 rounded-sm bg-neutral-600"></span>
                      {uploading ? (
                        <span className="text-skylab-400/80">Yükleniyor... {progress}%</span>
                      ) : queued ? (
                        <span className="text-skylab-400/80">Sırada, birkaç saniye içinde yüklenecek</span>
                      ) : scanning ? (
                        <span className="text-skylab-400/80">Virüs taraması yapılıyor</span>
                      ) : (
                        <>
                          <span className="text-emerald-300/80">Tarandı</span>
                          <span className="w-1 h-1 rounded-sm bg-neutral-600"></span>
                          <span className="text-neutral-400">Değiştirmek için tıkla</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!uploading && (
                  <button type="button" onClick={(event) => { event.stopPropagation(); if (queued) cancelQueued(); else remove(); }} aria-label="Dosyayı kaldır"
                    className="ml-4 shrink-0 inline-flex items-center justify-center rounded-sm p-2 text-neutral-400 hover:bg-red-500/20 hover:text-red-400 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}

                {uploading && (
                  <div className="absolute bottom-0 left-0 h-0.5 w-full bg-neutral-800/50">
                    <div className="h-full bg-skylab-500 transition-all duration-300 ease-out" style={{ width: `${progress}%` }} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <QuestionHint required={required} missing={missing} className="mt-2" />
      </div>
    </div>
  );
}

export function DisplayFormFileUpload({ fieldId, ...props }) {
  const guest = useContext(GuestUploadContext);

  if (!guest || !fieldId) return <AccountFileUpload {...props} />;

  if (guest.mode === "upload") {
    const rules = guestFileRules(props.acceptedFiles, props.maxSize, guest.capability);
    if (rules.types.length) return <GuestFileUpload fieldId={fieldId} guest={guest} {...props} />;
    return <GuestLoginRequired {...props} hasAnswers={guest.hasAnswers} reason="Bu sorunun istediği dosya türü giriş yapmadan yüklenemiyor." />;
  }

  return <GuestLoginRequired {...props} hasAnswers={guest.hasAnswers} reason="Bu forma giriş yapmadan dosya yüklenemiyor." />;
}

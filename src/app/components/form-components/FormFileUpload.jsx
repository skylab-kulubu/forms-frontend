"use client";

import { useContext, useMemo, useRef, useState, useEffect } from "react";
import { CircleAlert, CloudOff, Hourglass, LockKeyhole, ShieldAlert } from "lucide-react";
import { FileUpload } from "@skylab-kulubu/skylcn-ui";
import { GuestUploadContext } from "@/app/components/form-displayer/GuestUploadContext";
import { LoginConfirm, useLoginPrompt } from "@/app/components/form-displayer/components/FormDisplayerComponents";
import { request, uploadWithProgress } from "@/lib/apiClient";
import { accountFileRules, fileMatchesGuestTypes, fileStatusOfReason, guestFileRules, guestReasonOf, scanResultCopy, waitCopy } from "@/lib/guest-uploads";
import { useGuestUploadCapabilityQuery } from "@/lib/hooks/useGuestUploadCapability";
import { POLL_LIMIT, pollDelay } from "@/app/components/form-displayer/hooks/useGuestUploads";
import { QuestionField, questionLabel } from "./QuestionParts";

const LINK_BUTTON = "underline underline-offset-3 transition-colors text-secondary-foreground decoration-border-strong hover:text-foreground hover:decoration-foreground/50";

function formatMegabytes(bytes) {
  return `${Math.round(bytes / 1024 / 1024)} MB`;
}

export function AccountUploadHint({ acceptedFiles }) {
  const rules = accountFileRules(acceptedFiles, 0);

  if (!rules.types.length) {
    return <span className="px-0.5 text-2xs text-amber-300/80">Bu türlerden hiçbiri yüklenemiyor. Yanıtlayanlar yalnız PDF, JPG, PNG ya da DOCX yükleyebilir.</span>;
  }

  if (!rules.ignored.length) return null;

  return (
    <span className="px-0.5 text-2xs text-amber-300/80">
      {rules.ignored.join(", ")} yüklenemez; yanıtlayanlar yalnız {rules.label} yükleyebilir.
    </span>
  );
}

export function GuestUploadHint({ acceptedFiles, maxSize }) {
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

function rulesText(rules) {
  return `${rules.label} • MAKS ${Math.round(rules.maxBytes / 1024 / 1024)}MB`;
}

// One file as skylcn's FileUpload draws it; the question takes one file, so its id never changes
function fileItem(file, status, extra = {}) {
  return { id: "answer", name: file?.name ?? "", size: Number(file?.size) || 0, status, ...extra };
}

function AccountFileUpload({ question, questionNumber, description, required = false, acceptedFiles = "", maxSize = 0, onChange, missing = false, onUploadStateChange, fileProblem = null }) {
  const rules = useMemo(() => accountFileRules(acceptedFiles, maxSize), [acceptedFiles, maxSize]);

  const [internalFile, setInternalFile] = useState(null);
  const [error, setError] = useState("");

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [scan, setScan] = useState(null);

  const pollRef = useRef({ mediaId: null, timer: null });
  const reportUploadingRef = useRef(onUploadStateChange);

  const currentFile = internalFile;
  const scanning = scan?.status === "scanning";
  const issue = isUploading ? null
    : currentFile && scan?.status === "rejected" ? { security: true, title: currentFile.name, detail: scanResultCopy(scan.scanResult) }
      : fileProblem ? entryProblem({ status: fileStatusOfReason(fileProblem.reason), name: currentFile?.name ?? "Taslaktaki dosya", scanResult: fileProblem.scanResult }, rules)
        : null;

  useEffect(() => {
    reportUploadingRef.current = onUploadStateChange;
  });

  useEffect(() => {
    const poll = pollRef.current;
    poll.unmounted = false;
    return () => {
      clearTimeout(poll.timer);
      poll.mediaId = null;
      poll.unmounted = true;
      reportUploadingRef.current?.(false);
    };
  }, []);

  const stopScan = () => {
    clearTimeout(pollRef.current.timer);
    pollRef.current.mediaId = null;
    setScan(null);
  };

  const settleScan = (mediaId, status, scanResult = null) => {
    if (pollRef.current.mediaId !== mediaId) return;
    setScan(status ? { status, scanResult } : null);
    reportUploadingRef.current?.(false);
  };

  const followScan = (mediaId, attempt = 0) => {
    if (attempt >= POLL_LIMIT) {
      settleScan(mediaId, null);
      return;
    }

    pollRef.current.timer = setTimeout(async () => {
      if (pollRef.current.mediaId !== mediaId) return;

      try {
        const media = await request(`/v1/media/${mediaId}`);
        if (pollRef.current.mediaId !== mediaId) return;
        if (media?.status === "scanning") {
          followScan(mediaId, attempt + 1);
          return;
        }
        settleScan(mediaId, media?.status === "rejected" ? "rejected" : "ready", media?.scanResult ?? null);
      } catch (err) {
        if (pollRef.current.mediaId !== mediaId) return;
        // Core hides an answer file from its uploader once the draft links it and the scan ends clean;
        // a rejected one stays visible, so a 404 here means the file passed.
        if (err?.status === 404) {
          settleScan(mediaId, "ready");
          return;
        }
        followScan(mediaId, attempt + 1);
      }
    }, pollDelay(attempt));
  };

  const handleUpload = async (file) => {
    stopScan();
    setIsUploading(true);
    if (onUploadStateChange) onUploadStateChange(true);
    setUploadProgress(0);
    setError("");
    setInternalFile(file);

    let status = null;
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

      if (pollRef.current.unmounted) return;
      status = response.status === "scanning" ? "scanning" : response.status === "rejected" ? "rejected" : "ready";
      pollRef.current.mediaId = uploadedId;
      setScan({ status, scanResult: response.scanResult ?? null });
      if (status === "scanning") followScan(uploadedId);
    } catch (err) {
      setError(err?.status === 413 ? "Dosya boyutu sınırı aşıldı." : err?.status === 415 ? "Bu dosya türüne izin verilmiyor." : "Dosya yüklenirken hata oluştu.");
      setInternalFile(null);
      if (onChange) onChange({ target: { value: null } });
    } finally {
      setIsUploading(false);
      if (onUploadStateChange) onUploadStateChange(status === "scanning" ? "scanning" : false);
    }
  };

  const validateAndSet = (f) => {
    setError("");
    if (!f) {
      clear();
      return;
    }
    if (!fileMatchesGuestTypes(f, rules.types)) {
      setError("Bu dosya türüne izin verilmiyor.");
      return;
    }
    if (f.size > rules.maxBytes) {
      setError("Dosya boyutu sınırı aşıldı.");
      return;
    }

    handleUpload(f);
  };

  const clear = () => {
    setError("");
    setInternalFile(null);
    setUploadProgress(0);
    stopScan();
    if (onChange) onChange({ target: { value: null } });
    if ((isUploading || scanning) && onUploadStateChange) onUploadStateChange(false);
  };

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError("");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  if (!rules.types.length) {
    return (
      <QuestionField question={question} questionNumber={questionNumber} description={description} required={required} missing={missing} hint={null}>
        <LockedBox lock={{ icon: LockKeyhole, title: "Bu soruya dosya yüklenemiyor", detail: "Sorunun istediği dosya türü desteklenmiyor. Form sahibine haber verin." }} />
      </QuestionField>
    );
  }

  const shown = isUploading ? fileItem(currentFile, "uploading", { progress: uploadProgress })
    : issue ? fileItem(currentFile, "error", { name: issue.title, error: issue.detail, rejected: Boolean(issue.security) })
      : currentFile ? fileItem(currentFile, scanning ? "scanning" : "ready")
        : null;

  // A refused pick or a failed upload says why under the drop area until the two-second timer above clears it
  return (
    <QuestionField question={question} questionNumber={questionNumber} description={description} required={required} missing={missing} error={error || undefined}>
      <FileUpload files={shown ? [shown] : []} onFiles={(files) => validateAndSet(files[0] ?? null)} onRemove={isUploading ? undefined : clear}
        accept={rules.accept || undefined} rules={rulesText(rules)} invalid={Boolean(error) || (missing && !shown)}
        variant="compact" aria-label={questionLabel(question)}
      />
    </QuestionField>
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

// Where the drop area would be, saying why it is closed; skylcn's FileUpload has no closed state with a reason
function LockedBox({ lock }) {
  const Icon = lock.icon ?? CircleAlert;

  return (
    <div className="flex min-h-16 w-full cursor-not-allowed items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2.5 select-none">
      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-subtle-foreground">
        <Icon className="size-4.5" aria-hidden />
      </span>
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="text-sm font-medium text-muted-foreground">{lock.title}</span>
        <span className="mt-0.5 text-2xs text-subtle-foreground">{lock.detail}</span>
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

function GuestLoginRequired({ question, questionNumber, description, required, missing, reason }) {
  const prompt = useLoginPrompt();

  return (
    <QuestionField question={question} questionNumber={questionNumber} description={description} required={required} missing={missing}
      hint={prompt.confirming ? null : undefined}
    >
      <div className={`flex h-16 w-full items-center gap-3 rounded-lg border border-dashed px-3 ${missing ? "border-destructive/50 bg-destructive/5" : "border-border"}`}>
        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-muted text-subtle-foreground">
          <LockKeyhole className="size-4.5" aria-hidden />
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-sm font-medium text-foreground">Dosya yüklemek için giriş yapın</span>
          <span className="mt-0.5 truncate text-2xs text-subtle-foreground">{reason}</span>
        </div>
        {!prompt.confirming && <span className="shrink-0 text-xs"><LoginLink prompt={prompt} /></span>}
      </div>
      {prompt.confirming && (
        <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-2xs leading-relaxed text-subtle-foreground">
          <LoginConfirm prompt={prompt} />
        </p>
      )}
    </QuestionField>
  );
}

function GuestFileUpload({ fieldId, question, questionNumber, description, required = false, acceptedFiles = "", maxSize = 0, onChange, missing = false, onUploadStateChange, guest }) {
  const rules = useMemo(() => guestFileRules(acceptedFiles, maxSize, guest.capability), [acceptedFiles, maxSize, guest.capability]);
  const entry = guest.files[fieldId] ?? null;

  const [pending, setPending] = useState(null);
  const [queued, setQueued] = useState(null);
  const [progress, setProgress] = useState(0);
  const [problem, setProblem] = useState(null);
  const startRef = useRef(null);
  const reportUploadingRef = useRef(onUploadStateChange);

  const uploading = Boolean(pending);
  const busy = uploading || Boolean(queued);
  const scanning = entry?.status === "scanning";
  const entryIssue = busy ? null : entryProblem(entry, rules);
  const lock = busy || entry ? null : VERIFICATION_LOCKS[guest.verification] ?? (problem?.lock ? problem : null);
  const issue = busy || lock ? null : entryIssue ?? (problem?.lock ? null : problem);

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
    setProblem(null);
    guest.remove(fieldId);
    onChange?.({ target: { value: null } });
  };

  // A pick refused before upload (type, size) is said under the drop area; what went wrong with a sent file stays on its row
  const pickError = issue && !entryIssue && !issue.file ? `${issue.title}. ${issue.detail}` : undefined;
  const failed = issue && !pickError ? issue : null;

  const shown = uploading ? fileItem(pending, "uploading", { progress })
    : queued ? fileItem(queued.file, "uploading")
      : entryIssue ? fileItem(entry, "error", { error: entryIssue.detail, rejected: Boolean(entryIssue.security) })
        : failed ? fileItem(failed.file, "error", { error: `${failed.title}. ${failed.detail}`, rejected: Boolean(failed.security) })
          : entry ? fileItem(entry, scanning ? "scanning" : "ready")
            : null;

  const removeShown = uploading ? undefined : queued ? cancelQueued : failed ? () => setProblem(null) : remove;

  return (
    <QuestionField question={question} questionNumber={questionNumber} description={description} required={required} missing={missing}
      error={pickError} hint={queued ? "Sırada, birkaç saniye içinde yüklenecek" : undefined}
    >
      {lock ? <LockedBox lock={lock} /> : (
        <FileUpload files={shown ? [shown] : []} onFiles={(files) => choose(files[0] ?? null)} onRemove={removeShown}
          onRetry={failed?.retry ? () => start(failed.file) : undefined}
          accept={rules.accept || undefined} rules={rulesText(rules)} invalid={Boolean(pickError) || (missing && !shown)}
          variant="compact" aria-label={questionLabel(question)}
        />
      )}
    </QuestionField>
  );
}

export function DisplayFormFileUpload({ fieldId, fileProblem, ...props }) {
  const guest = useContext(GuestUploadContext);

  if (!guest || !fieldId) return <AccountFileUpload {...props} fileProblem={fileProblem} />;

  if (guest.mode === "upload") {
    const rules = guestFileRules(props.acceptedFiles, props.maxSize, guest.capability);
    if (rules.types.length) return <GuestFileUpload fieldId={fieldId} guest={guest} {...props} />;
    return <GuestLoginRequired {...props} reason="Bu sorunun istediği dosya türü giriş yapmadan yüklenemiyor." />;
  }

  return <GuestLoginRequired {...props} reason="Bu forma giriş yapmadan dosya yüklenemiyor." />;
}

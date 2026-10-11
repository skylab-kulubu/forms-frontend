"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileIcon, FileX, Image as ImageIcon, FileText, Loader2, AlertCircle, ChevronDown, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/lib/hooks/useMedia";
import { requestResponseFileLink, useResponseFileQuery } from "@/lib/hooks/useResponseFiles";
import { scanResultLabel } from "@/lib/guest-uploads";

const LINK_ERRORS = {
  scanning: "Dosya hâlâ taranıyor. Tarama bitince açılabilir.",
  rejected: "Dosya taramadan geçmediği için açılamıyor.",
  deleted: "Dosya silinmiş.",
  subjectInactive: "Bu hesapla dosya açılamıyor.",
};

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) return "-";
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);
  return `${value.toFixed(value >= 100 ? 0 : value >= 10 ? 1 : 2)} ${sizes[i]}`;
}

function isImageType(fileType) {
  return typeof fileType === "string" && fileType.startsWith("image/");
}

function isPdfType(fileType) {
  return typeof fileType === "string" && fileType === "application/pdf";
}

function FileTypeIcon({ fileType, size = 18 }) {
  if (isImageType(fileType)) return <ImageIcon size={size} />;
  if (isPdfType(fileType)) return <FileText size={size} />;
  return <FileIcon size={size} />;
}

function FileMeta({ fileType, fileSize, children }) {
  if (!fileType && fileSize == null && !children) return null;
  return (
    <div className="flex items-center gap-2 mt-0.5 text-2xs text-neutral-500">
      {fileType && <span>{fileType}</span>}
      {fileSize != null && (
        <>
          {fileType && <span className="w-1 h-1 rounded-full bg-neutral-600" />}
          <span>{formatBytes(fileSize)}</span>
        </>
      )}
      {children}
    </div>
  );
}

function StatusRow({ icon, tone = "text-neutral-500", title, detail }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-neutral-900/50 px-4 py-3">
      <span className={`shrink-0 ${tone}`}>{icon}</span>
      <div className="flex-1 min-w-0">
        <span className="block truncate text-sm text-neutral-300" title={title}>{title}</span>
        {detail && <p className="text-2xs text-neutral-500 break-all mt-0.5">{detail}</p>}
      </div>
    </div>
  );
}

function LoadingRow() {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-neutral-900/50 px-4 py-3">
      <Loader2 size={18} className="animate-spin text-neutral-500" />
      <span className="text-sm text-neutral-500">Dosya bilgileri yükleniyor...</span>
    </div>
  );
}

function UnavailableRow({ mediaId }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-neutral-900/50 px-4 py-3">
      <AlertCircle size={18} className="shrink-0 text-neutral-500" />
      <div className="flex-1 min-w-0">
        <span className="text-sm text-neutral-400">Dosya bilgilerine ulaşılamadı</span>
        <p className="text-2xs text-neutral-600 break-all mt-0.5">{mediaId}</p>
      </div>
    </div>
  );
}

function PublicFile({ media }) {
  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const { name: fileName, type: fileType, url: fileUrl, size: fileSize } = media;
  const isImage = isImageType(fileType);
  const isPdf = isPdfType(fileType);
  const canPreview = (isImage && !imageError) || isPdf;

  return (
    <div className="flex flex-col gap-0">
      {fileUrl && (
        <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-neutral-900/50 px-4 py-3">
          <div className="flex shrink-0 items-center justify-center size-10 rounded-md bg-white/5 text-neutral-400">
            <FileTypeIcon fileType={fileType} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-neutral-200" title={fileName}>
              {fileName || "Dosya"}
            </p>
            <FileMeta fileType={fileType} fileSize={fileSize} />
          </div>

          <div className="flex items-center gap-1.5">
            {canPreview && fileUrl && (
              <button type="button" onClick={() => setExpanded((v) => !v)} title={expanded ? "Önizlemeyi kapat" : "Önizle"}
                className="inline-flex items-center justify-center rounded-md p-2 text-neutral-400 hover:bg-white/5 hover:text-neutral-200 transition-colors"
              >
                <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="inline-flex">
                  <ChevronDown size={16} />
                </motion.span>
              </button>
            )}
            <a href={fileUrl} download={fileName || true} title="İndir"
              className="inline-flex items-center justify-center rounded-md p-2 text-neutral-400 hover:bg-skylab-500/10 hover:text-skylab-400 transition-colors"
            >
              <Download size={16} />
            </a>
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {expanded && canPreview && fileUrl && (
          <motion.div key="preview"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden"
          >
            <div className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-neutral-950/50">
              {isImage && !imageError && (
                <img src={fileUrl} alt={fileName || "Yüklenen dosya"} className="max-h-72 w-full object-contain" onError={() => setImageError(true)}/>
              )}
              {isPdf && (
                <iframe src={fileUrl} title={fileName || "PDF dosyası"} className="h-80 w-full border-0"/>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function startDownload(url) {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function PrivateFile({ file, mediaId, responseId, token }) {
  const [opening, setOpening] = useState(null);
  const [linkError, setLinkError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const objectUrlRef = useRef(null);

  const { name: fileName, type: fileType, size: fileSize } = file;
  const isImage = isImageType(fileType);
  const isPdf = isPdfType(fileType);

  const releasePreview = () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setPreviewUrl(null);
  };

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  const openLink = async (purpose) => {
    setOpening(purpose);
    setLinkError(null);
    try {
      const response = await requestResponseFileLink(responseId, mediaId, token);
      const url = response?.data?.url;
      if (!url) throw new Error("link");
      return url;
    } catch (error) {
      const reason = error?.body?.data?.reason;
      setLinkError(LINK_ERRORS[reason] ?? "Dosya şu an açılamıyor. Biraz sonra tekrar deneyin.");
      return null;
    } finally {
      setOpening(null);
    }
  };

  const download = async () => {
    const url = await openLink("download");
    if (url) startDownload(url);
  };

  const showPreviewError = () => {
    setExpanded(false);
    releasePreview();
    setLinkError("Önizleme açılamadı. Dosyayı indirerek açabilirsiniz.");
  };

  const loadPdf = async (url) => {
    setOpening("preview");
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) throw new Error("preview");
      const blob = await response.blob();
      objectUrlRef.current = URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
      return objectUrlRef.current;
    } catch {
      return null;
    } finally {
      setOpening(null);
    }
  };

  const togglePreview = async () => {
    if (expanded) {
      setExpanded(false);
      releasePreview();
      return;
    }
    const url = await openLink("preview");
    if (!url) return;
    const source = isPdf ? await loadPdf(url) : url;
    if (!source) {
      showPreviewError();
      return;
    }
    setPreviewUrl(source);
    setExpanded(true);
  };

  return (
    <div className="flex flex-col gap-0">
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-neutral-900/50 px-4 py-3">
        <div className="flex shrink-0 items-center justify-center size-10 rounded-md bg-white/5 text-neutral-400">
          <FileTypeIcon fileType={fileType} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="truncate text-sm font-medium text-neutral-200" title={fileName}>
            {fileName || "Dosya"}
          </p>
          <FileMeta fileType={fileType} fileSize={fileSize}>
            <span className="w-1 h-1 rounded-full bg-neutral-600" />
            <span>Tarandı</span>
          </FileMeta>
        </div>

        <div className="flex items-center gap-1.5">
          {(isImage || isPdf) && (
            <button type="button" onClick={togglePreview} disabled={Boolean(opening)} title={expanded ? "Önizlemeyi kapat" : "Önizle"}
              className="inline-flex items-center justify-center rounded-md p-2 text-neutral-400 hover:bg-white/5 hover:text-neutral-200 transition-colors disabled:opacity-50"
            >
              {opening === "preview" ? <Loader2 size={16} className="animate-spin" /> : (
                <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }} className="inline-flex">
                  <ChevronDown size={16} />
                </motion.span>
              )}
            </button>
          )}
          <button type="button" onClick={download} disabled={Boolean(opening)} title="İndir"
            className="inline-flex items-center justify-center rounded-md p-2 text-neutral-400 hover:bg-skylab-500/10 hover:text-skylab-400 transition-colors disabled:opacity-50"
          >
            {opening === "download" ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          </button>
        </div>
      </div>

      {linkError && <p role="alert" className="mt-1.5 px-1 text-2xs text-red-300">{linkError}</p>}

      <AnimatePresence initial={false}>
        {expanded && previewUrl && (
          <motion.div key="preview"
            initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden"
          >
            <div className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-neutral-950/50">
              {isPdf ? (
                <iframe src={previewUrl} title={fileName || "PDF dosyası"} className="h-80 w-full border-0"/>
              ) : (
                <img src={previewUrl} alt={fileName || "Yüklenen dosya"} className="max-h-72 w-full object-contain" onError={showPreviewError}/>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ResponseFilePreview({ mediaId, responseId, token }) {
  const { data, isLoading, error } = useResponseFileQuery(responseId, mediaId, token);
  const file = data?.data ?? null;

  if (isLoading) return <LoadingRow />;
  if (error || !file) return <UnavailableRow mediaId={mediaId} />;

  if (file.status === "deleted") {
    return <StatusRow icon={<FileX size={18} />} title="Dosya silinmiş" detail={mediaId} />;
  }

  if (file.status === "scanning") {
    return <StatusRow icon={<Loader2 size={18} className="animate-spin" />} tone="text-skylab-400" title={file.name || "Dosya"} detail="Virüs taraması sürüyor. Tarama bitince açılabilir." />;
  }

  if (file.status === "rejected") {
    return <StatusRow icon={<ShieldAlert size={18} />} tone="text-red-400" title={file.name || "Dosya"} detail={`Taramadan geçmedi: ${scanResultLabel(file.scanResult)}. Dosya silindi.`} />;
  }

  if (!file.isPrivate) {
    return file.url ? <PublicFile media={file} /> : <UnavailableRow mediaId={mediaId} />;
  }

  return <PrivateFile file={file} mediaId={mediaId} responseId={responseId} token={token} />;
}

function MediaFilePreview({ mediaId }) {
  const { data, isLoading, error } = useMediaQuery(mediaId);
  const media = data ?? null;

  if (isLoading) return <LoadingRow />;
  if (error || !media) return <UnavailableRow mediaId={mediaId} />;

  return <PublicFile media={media} />;
}

export function FilePreview({ mediaId, responseId = null, token = null }) {
  if (responseId) return <ResponseFilePreview mediaId={mediaId} responseId={responseId} token={token} />;
  return <MediaFilePreview mediaId={mediaId} />;
}

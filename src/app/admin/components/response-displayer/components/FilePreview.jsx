"use client";

import { useState } from "react";
import { Download, FileIcon, Image as ImageIcon, FileText, Loader2, AlertCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "@/lib/hooks/useMedia";

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

export function FilePreview({ mediaId }) {
  const { data, isLoading, error } = useMediaQuery(mediaId);
  const media = data?.data ?? null;

  const [imageError, setImageError] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-neutral-900/50 px-4 py-3">
        <Loader2 size={18} className="animate-spin text-neutral-500" />
        <span className="text-sm text-neutral-500">Dosya bilgileri yükleniyor...</span>
      </div>
    );
  }

  if (error || !media) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-neutral-900/50 px-4 py-3">
        <AlertCircle size={18} className="shrink-0 text-neutral-500" />
        <div className="flex-1 min-w-0">
          <span className="text-sm text-neutral-400">Dosya bilgilerine ulaşılamadı</span>
          <p className="text-[11px] text-neutral-600 break-all mt-0.5">{mediaId}</p>
        </div>
      </div>
    );
  }

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
            {(fileType || fileSize != null) && (
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                {fileType && <span>{fileType}</span>}
                {fileSize != null && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-neutral-600" />
                    <span>{formatBytes(fileSize)}</span>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {canPreview && fileUrl && (
              <button type="button" onClick={() => setExpanded((v) => !v)} title={expanded ? "Önizlemeyi kapat" : "Önizle"}
                className="inline-flex items-center justify-center rounded-md p-2 text-neutral-400 hover:bg-white/5 hover:text-neutral-200 transition-colors"
              >
                <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }} className="inline-flex">
                  <ChevronDown size={16} />
                </motion.span>
              </button>
            )}
            <a href={fileUrl} download={fileName || true} title="İndir"
              className="inline-flex items-center justify-center rounded-md p-2 text-neutral-400 hover:bg-indigo-500/10 hover:text-indigo-400 transition-colors"
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
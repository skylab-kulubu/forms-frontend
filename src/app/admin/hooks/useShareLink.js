import { useCallback, useEffect, useRef, useState } from "react";

const BASE_URL = "https://forms.yildizskylab.com/";

const buildShareUrl = (value) => {
  if (!value) return "";
  const trimmed = String(value).trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `${BASE_URL}${trimmed.replace(/^\/+/, "")}`;
};

export const useShareLink = (pathOrId) => {
  const [shareStatus, setShareStatus] = useState("idle");
  const shareTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (shareTimerRef.current) {
        clearTimeout(shareTimerRef.current);
      }
    };
  }, []);

  const handleShare = useCallback(async () => {
    const shareUrl = buildShareUrl(pathOrId);
    if (!shareUrl) return;
    let nextStatus = "error";

    if (navigator?.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        nextStatus = "success";
      } catch {
      }
    }

    if (shareTimerRef.current) {
      clearTimeout(shareTimerRef.current);
    }
    setShareStatus(nextStatus);
    shareTimerRef.current = setTimeout(() => {
      setShareStatus("idle");
      shareTimerRef.current = null;
    }, 2000);
  }, [pathOrId]);

  return { shareStatus, handleShare };
};

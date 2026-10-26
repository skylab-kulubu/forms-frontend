"use client";

import { useEffect, useRef, useState } from "react";
import { getSession, useSession } from "next-auth/react";
import { request, SESSION_EXPIRED_EVENT } from "@/lib/apiClient";
import { clubSwitcherLinks } from "@/lib/club-switcher";

const SOURCE_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export default function useMailTransfer(formId) {
  const { data: session } = useSession();
  const transfer = useRef(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const cancel = () => transfer.current?.();
    window.addEventListener("pagehide", cancel);
    window.addEventListener(SESSION_EXPIRED_EVENT, cancel);
    return () => {
      cancel();
      window.removeEventListener("pagehide", cancel);
      window.removeEventListener(SESSION_EXPIRED_EVENT, cancel);
    };
  }, [formId, session?.user?.id, session?.error]);

  const start = () => {
    transfer.current?.();
    const subject = session?.user?.id;
    if (!formId || !subject || session.error) {
      setMessage("Alıcıları hazırlamak için yeniden giriş yap.");
      return;
    }

    let target;
    try {
      target = new URL("/mail-tasks/create", clubSwitcherLinks("forms").find((app) => app.id === "mail").href);
      if (!["https:", "http:"].includes(target.protocol)) throw new Error("Invalid mail URL");
    } catch {
      setMessage("SkyMail adresi geçersiz. Yöneticine haber ver.");
      return;
    }
    const nonce = crypto.randomUUID();
    const expires = Date.now() + 5 * 60 * 1000;
    const sourceFormId = String(formId).toLowerCase();
    target.search = new URLSearchParams({ source: "forms", form_id: sourceFormId, forms_handoff: nonce, expires: String(expires) }).toString();
    const binding = { nonce, formId: sourceFormId, expires };
    const controller = new AbortController();
    let popup = null;
    let active = true;
    let ready = false;
    let sent = false;
    let payload = null;
    let timer;
    let closed;

    const stop = (code = "cancelled") => {
      if (!active) return;
      active = false;
      if (code && popup && !popup.closed) popup.postMessage({ type: "skyforms:mail:error", ...binding, code }, target.origin);
      if (!sent && (code === "failed" || code === "empty")) popup?.close();
      controller.abort();
      window.removeEventListener("message", receive);
      clearTimeout(timer);
      clearInterval(closed);
      payload = null;
      transfer.current = null;
      setLoading(false);
    };
    const fail = (text, code) => {
      stop(code);
      setMessage(text);
    };
    const deliver = async () => {
      if (!active || !ready || !payload || sent) return;
      sent = true;
      const current = await getSession().catch(() => null);
      if (!active) return;
      if (Date.now() >= expires || current?.error || current?.user?.id !== subject || payload.preparedByUserId !== subject) {
        fail("Oturum değişti veya aktarımın süresi doldu. Yeniden başlat.", "session");
        return;
      }
      popup.postMessage(payload.sourceId
        ? { type: "skyforms:mail:source", ...binding, sourceId: payload.sourceId, preparedByUserId: payload.preparedByUserId }
        : {
          type: "skyforms:mail:recipients", ...binding,
          preparedByUserId: payload.preparedByUserId, formTitle: payload.formTitle, recipients: payload.recipients,
          responseCount: payload.responseCount, skippedCount: payload.skippedCount, duplicateCount: payload.duplicateCount,
        }, target.origin);
    };
    const receive = (event) => {
      if (!active || event.origin !== target.origin || event.source !== popup || Date.now() >= expires) return;
      const data = event.data;
      if (!data || data.nonce !== nonce || data.formId !== sourceFormId || data.expires !== expires) return;
      if (data.type === "skyforms:mail:ready") {
        if (data.subject !== subject) {
          fail("Forms ve SkyMail'de aynı hesapla giriş yap, sonra yeniden dene.", "session");
          return;
        }
        ready = true;
        void deliver();
      } else if (data.type === "skyforms:mail:accepted" && data.subject === subject && sent) {
        const linked = Boolean(payload?.sourceId);
        stop(null);
        setMessage(linked
          ? "Formun sabit alıcı kaynağı SkyMail'e bağlandı. Mailini orada hazırlayıp onaya sunabilir veya yetkin varsa gönderebilirsin."
          : "Eski aktarım: kişiler SkyMail'e eklendi; bu gönderimde kalıcı Forms bağlantısı tutulmaz.");
      }
    };

    transfer.current = stop;
    window.addEventListener("message", receive);
    popup = window.open(target.href, "_blank");
    if (!popup) {
      fail("SkyMail penceresi açılamadı. Açılır pencerelere izin verip yeniden dene.", "blocked");
      return;
    }
    setLoading(true);
    setMessage("SkyMail'de girişini tamamla; formun uygun yanıtlayanları sabit bir alıcı kaynağı olarak hazırlanıyor. Bu sayfayı açık tut.");
    timer = setTimeout(() => fail("Aktarımın süresi doldu. Forms'tan yeniden başlat.", "timeout"), expires - Date.now());
    closed = setInterval(() => {
      if (popup.closed) fail("SkyMail penceresi kapandı. Yeniden başlatabilirsin.", "closed");
    }, 1000);
    request(`/api/admin/forms/${sourceFormId}/mail-source`, { method: "POST", signal: controller.signal })
      .catch((error) => {
        if (!active || ![404, 503].includes(error.status)) throw error;
        setMessage("Kalıcı Forms bağlantısı şu an kullanılamıyor. Eski aktarım ile kişiler ekleniyor; form bağlantısı tutulmayacak.");
        return request(`/api/admin/forms/${sourceFormId}/mail-recipients`, { signal: controller.signal });
      })
      .then((result) => {
        if (!active) return;
        payload = result?.data;
        if (payload?.formId !== sourceFormId || payload.preparedByUserId !== subject || typeof payload.formTitle !== "string"
          || (payload.sourceId
            ? !SOURCE_ID.test(payload.sourceId)
              || !Number.isSafeInteger(payload.recipientCount) || payload.recipientCount < 1
              || !Number.isFinite(Date.parse(payload.preparedAt)) || Date.parse(payload.expiresAt) <= Date.now()
              || !Number.isFinite(Date.parse(payload.expiresAt)) || Date.parse(payload.preparedAt) >= Date.parse(payload.expiresAt)
            : !Array.isArray(payload.recipients)
              || payload.recipients.some((row) => typeof row?.name !== "string" || typeof row?.email !== "string"))
          || [payload.responseCount, payload.skippedCount, payload.duplicateCount].some((count) => !Number.isSafeInteger(count) || count < 0)
          || payload.responseCount !== (payload.sourceId ? payload.recipientCount : payload.recipients.length) + payload.skippedCount + payload.duplicateCount) {
          fail("Alıcılar hazırlanamadı. Yeniden dene.", "failed");
          return;
        }
        if (!payload.sourceId && payload.recipients.length === 0) {
          fail("Bu formda e-posta adresi kullanılabilen yanıtlayan yok.", "empty");
          return;
        }
        void deliver();
      })
      .catch(() => {
        if (active) fail("Alıcılar hazırlanamadı. Yanıtları görüntüleme yetkini ve bağlantını kontrol edip yeniden dene.", "failed");
      });
  };

  return { start, loading, message, dismiss: () => setMessage("") };
}

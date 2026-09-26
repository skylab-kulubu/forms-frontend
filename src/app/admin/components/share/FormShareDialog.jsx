"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowUpRight, Check, ChevronDown, CircleAlert, Copy, CornerDownRight, Download, Loader2, Lock, PencilLine, RotateCcw, Share, Share2, Users, WandSparkles, X } from "lucide-react";
import { publicFormUrl } from "@/lib/return-to";
import {
  MAX_ALIAS_LENGTH, RESERVED_ALIASES, SHARE_CHANNELS, SHARE_FORMAT_KEY,
  channelByKey, channelTag, defaultAliasFromTitle, slugifyAlias, suggestAliases, taggedShortUrl,
} from "@/lib/share-channels";
import { fetchShortLinkQr, useAliasAvailabilityQuery, useEnsureShortLinkQuery, useRenameShortLinkMutation, useShortLinkQrPreviewQuery } from "@/lib/hooks/useShortLink";
import { StatePill } from "../utils/SidePanel";
import ChannelIcon from "./ChannelIcon";

const EASE = [0.22, 1, 0.36, 1];
const CHIP = "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-2xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40";
const CHIP_ON = "border-skylab-400/30 bg-skylab-500/10 text-skylab-300";
const CHIP_OFF = "border-white/10 bg-white/5 text-neutral-300 hover:border-skylab-400/30 hover:bg-skylab-500/10 hover:text-skylab-300";
const ICON_BUTTON = "grid size-7 shrink-0 place-items-center rounded-md text-neutral-500 transition-colors hover:bg-white/5 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40";
const INPUT = "h-8 w-full rounded-lg border border-white/10 bg-neutral-900/60 px-3 text-xs text-neutral-200 outline-none transition-[border-color,box-shadow] placeholder:text-neutral-600 focus:border-skylab-400/50 focus:ring-2 focus:ring-skylab-400/20";
const COPY_TONE = {
  ok: "border-skylab-400/30 bg-skylab-400/10 text-skylab-300",
  err: "border-red-500/30 bg-red-500/10 text-red-300",
  idle: "border-white/10 bg-white/5 text-neutral-200 hover:bg-white/10",
};

async function copyText(value) {
  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = value;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function readFormat() {
  try {
    return localStorage.getItem(SHARE_FORMAT_KEY) === "utm" ? "utm" : "suffix";
  } catch {
    return "suffix";
  }
}

function looksRandom(alias) {
  return /^[A-Za-z0-9]{8}$/.test(alias || "") && /[A-Z]/.test(alias);
}

function formatDay(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function SectionLabel({ children, aside }) {
  return (
    <div className="mb-2 flex h-5 items-center gap-2">
      <span className="text-2xs font-medium text-neutral-500">{children}</span>
      <span className="h-px flex-1 bg-white/5" />
      {aside}
    </div>
  );
}

function CopyButton({ state, onClick, label = "Kopyala", className = "" }) {
  const tone = COPY_TONE[state] ?? COPY_TONE.idle;
  return (
    <button type="button" onClick={onClick}
      className={`inline-flex h-7 shrink-0 items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40 ${tone} ${className}`}
    >
      {state === "ok" ? <Check size={13} /> : state === "err" ? <CircleAlert size={13} /> : <Copy size={13} />}
      <span>{state === "ok" ? "Kopyalandı" : state === "err" ? "Hata" : label}</span>
    </button>
  );
}

function AliasEditor({ formId, formTitle, link, onDone }) {
  const current = link.alias;
  const fromTitle = defaultAliasFromTitle(formTitle);
  const [draft, setDraft] = useState(() => (looksRandom(current) ? "" : current));
  const [checkedAlias, setCheckedAlias] = useState("");
  const [saveError, setSaveError] = useState(null);
  const checkTimer = useRef(null);
  const rename = useRenameShortLinkMutation(formId);

  useEffect(() => {
    const timer = checkTimer;
    return () => clearTimeout(timer.current);
  }, []);

  const slug = slugifyAlias(draft);
  let local = null;
  if (!slug) local = new RegExp(`^${fromTitle}(-[2-9])?$`).test(current.toLowerCase()) ? "same" : "empty";
  else if (slug === current.toLowerCase()) local = "same";
  else if (slug.length > MAX_ALIAS_LENGTH) local = "long";
  else if (RESERVED_ALIASES.includes(slug)) local = "reserved";

  const availability = useAliasAvailabilityQuery(formId, checkedAlias, !local && checkedAlias === slug);
  let state = local;
  if (!state) {
    if (checkedAlias !== slug || availability.isFetching) state = "checking";
    else if (availability.isError || !availability.data) state = "unknown";
    else if (availability.data.available) state = "ok";
    else state = availability.data.reason === "reserved" ? "reserved" : availability.data.reason === "invalid" ? "invalid" : "taken";
  }

  const canSave = (state === "ok" || state === "empty" || state === "unknown") && !rename.isPending;
  const bad = state === "taken" || state === "reserved" || state === "invalid" || state === "long";
  const keepsOld = state !== "same" && !bad;

  const handleDraft = (value) => {
    setDraft(value);
    setSaveError(null);
    clearTimeout(checkTimer.current);
    const next = slugifyAlias(value);
    checkTimer.current = setTimeout(() => setCheckedAlias(next), 350);
  };

  const save = () => {
    if (!canSave) return;
    rename.mutate(state === "empty" ? "" : slug, {
      onSuccess: () => onDone(true),
      onError: (err) => setSaveError(err?.message || "Kısa ad kaydedilemedi."),
    });
  };

  const status = {
    checking: { tone: "text-neutral-500", icon: <Loader2 size={12} className="animate-spin" />, text: "Bakılıyor" },
    ok: { tone: "text-emerald-300", icon: <Check size={12} />, text: "Uygun" },
    taken: { tone: "text-red-300", icon: <X size={12} />, text: "Dolu" },
    reserved: { tone: "text-red-300", icon: <X size={12} />, text: "Ayrılmış" },
    invalid: { tone: "text-red-300", icon: <X size={12} />, text: "Geçersiz" },
    long: { tone: "text-red-300", icon: <X size={12} />, text: "Çok uzun" },
  }[state];

  let hint = null;
  if (saveError) hint = <span className="text-red-300">{saveError}</span>;
  else if (state === "empty") hint = "Boş bırakırsan ad form başlığından üretilir; doluysa sonuna sayı eklenir.";
  else if (state === "same") hint = "Şu anki ad.";
  else if (state === "taken") hint = "Bu ad başka bir linkte kullanılıyor. Şunları deneyebilirsin:";
  else if (state === "reserved") hint = "Bu ad sisteme ayrılmış (v1, api, go, c gibi).";
  else if (state === "long") hint = `Kısa ad en fazla ${MAX_ALIAS_LENGTH} karakter olabilir.`;
  else if (state === "invalid") hint = "Kısa ad harf ya da rakamla başlamalı.";
  else if (state === "unknown") hint = "Uygunluğa bakılamadı; kaydederken yeniden denenir.";
  else if (slug !== draft.trim()) hint = <><code className="font-mono text-3xs text-neutral-300">skyl.app/{slug}</code> olarak kaydedilir; Türkçe harfler ve boşluklar dönüştürüldü.</>;

  const suggestions = state === "taken" ? suggestAliases(slug, current) : [];

  return (
    <div className="flex flex-col gap-2">
      <div className={`flex h-10 items-center gap-2 rounded-lg border bg-neutral-900/60 pl-3 pr-2.5 ring-2 transition-[border-color,box-shadow] ${bad ? "border-red-400/50 ring-red-400/15" : "border-skylab-400/50 ring-skylab-400/20"}`}>
        <span className="text-sm text-neutral-500">skyl.app/</span>
        <input type="text" value={draft} autoFocus spellCheck={false} autoComplete="off" aria-label="Kısa ad" placeholder={fromTitle}
          onChange={(e) => handleDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); save(); }
            if (e.key === "Escape") { e.preventDefault(); onDone(false); }
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-neutral-100 outline-none placeholder:font-normal placeholder:text-neutral-600"
        />
        {status && <span className={`inline-flex shrink-0 items-center gap-1 text-2xs ${status.tone}`}>{status.icon}{status.text}</span>}
      </div>
      {hint && <p className="text-2xs leading-relaxed text-neutral-500">{hint}</p>}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((item) => (
            <button key={item} type="button" onClick={() => handleDraft(item)}
              className="inline-flex h-6 items-center rounded-md border border-white/10 bg-white/5 px-2 font-mono text-2xs text-neutral-300 transition-colors hover:border-skylab-400/30 hover:bg-skylab-500/10 hover:text-skylab-300"
            >
              {item}
            </button>
          ))}
        </div>
      )}
      {keepsOld && (
        <p className="flex gap-1.5 text-2xs leading-relaxed text-neutral-500">
          <CornerDownRight size={12} className="mt-0.5 shrink-0 text-neutral-600" />
          <span>
            Eski adres <code className="font-mono text-3xs text-neutral-300">skyl.app/{current}</code> bu forma yönlenmeye devam eder;
            basılı QR&apos;lar ve paylaşılmış linkler bozulmaz.
          </span>
        </p>
      )}
      <div className="flex items-center justify-end gap-1.5">
        <button type="button" onClick={() => onDone(false)}
          className="h-7 rounded-lg px-2.5 text-2xs font-medium text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100"
        >
          Vazgeç
        </button>
        <button type="button" onClick={save} disabled={!canSave}
          className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-skylab-400/40 bg-skylab-500/15 px-3 text-2xs font-semibold text-skylab-300 transition-colors hover:bg-skylab-500/25 disabled:pointer-events-none disabled:opacity-40"
        >
          {rename.isPending ? <Loader2 size={12} className="animate-spin" /> : state === "empty" ? <WandSparkles size={12} /> : null}
          {rename.isPending ? "Kaydediliyor" : state === "empty" ? "Başlıktan üret" : "Kaydet"}
        </button>
      </div>
    </div>
  );
}

function ShareDialogBody({ formId, formTitle, formStatus, allowAnonymous, canEdit, onClose }) {
  const { data: link, isLoading, isError, error, refetch, isFetching } = useEnsureShortLinkQuery(formId, true);
  const [channel, setChannel] = useState("general");
  const [format, setFormat] = useState(readFormat);
  const [customSource, setCustomSource] = useState("");
  const [campaign, setCampaign] = useState("");
  const [content, setContent] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [flash, setFlash] = useState(false);
  const [copied, setCopied] = useState({});
  const [qrBusy, setQrBusy] = useState(null);
  const timers = useRef({});

  useEffect(() => {
    const pending = timers.current;
    return () => Object.values(pending).forEach(clearTimeout);
  }, []);

  const later = (key, fn, ms) => {
    clearTimeout(timers.current[key]);
    timers.current[key] = setTimeout(fn, ms);
  };

  const flag = (id, state) => {
    setCopied((prev) => ({ ...prev, [id]: state }));
    later(`copy-${id}`, () => setCopied((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    }), 1800);
  };

  const alias = link?.alias ?? "";
  const selected = channelByKey(channel);
  const tag = channelTag(channel, { format, customSource, campaign, content });
  const fullUrl = alias ? taggedShortUrl(alias, tag) : "";
  const longUrl = publicFormUrl(formId);
  const managedByEvent = Boolean(link?.managedByEvent);
  const canRename = canEdit && !managedByEvent;
  const qrPreview = useShortLinkQrPreviewQuery(formId, alias);
  const qrSrc = qrPreview.data ?? null;
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  const copy = async (id, value) => {
    if (!value) return;
    flag(id, (await copyText(value)) ? "ok" : "err");
  };

  const chooseFormat = (next) => {
    setFormat(next);
    try {
      localStorage.setItem(SHARE_FORMAT_KEY, next);
    } catch {}
  };

  const finishEdit = (saved) => {
    setEditing(false);
    if (!saved) return;
    setFlash(true);
    later("flash", () => setFlash(false), 2400);
  };

  const downloadQr = async (kind) => {
    if (qrBusy) return;
    setQrBusy(kind);
    try {
      const blob = await fetchShortLinkQr(formId, kind);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${alias}-qr.${kind}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch {
      flag("qr", "err");
    } finally {
      setQrBusy(null);
    }
  };

  const copyQr = async () => {
    try {
      const blob = await fetchShortLinkQr(formId, "png");
      await navigator.clipboard.write([new ClipboardItem({ [blob.type || "image/png"]: blob })]);
      flag("qr", "ok");
    } catch {
      flag("qr", "err");
    }
  };

  const shareNative = async () => {
    try {
      await navigator.share({ title: formTitle, url: fullUrl });
    } catch {}
  };

  let hint;
  if (selected.key === "general") hint = <>Etiketsiz link. Bununla gelenler genel bakışta <b className="font-medium text-neutral-300">Etiketsiz</b> satırına düşer.</>;
  else if (selected.key === "other") {
    const source = slugifyAlias(customSource);
    hint = source
      ? <>Gelenler genel bakışta <b className="font-medium text-neutral-300">{source}</b> adıyla kendi satırında görünür.</>
      : "Kaynak adını yaz; boşken link etiketsiz kalır.";
  } else hint = <>Bununla gelenler genel bakışta <b className="font-medium text-neutral-300">{selected.label}</b> satırına yazılır.</>;

  const metaParts = [];
  if (flash) metaParts.push(<span key="saved" className="text-emerald-300">Kısa ad güncellendi</span>);
  if (link) {
    if (managedByEvent) {
      metaParts.push(<span key="clicks"><b className="font-medium text-neutral-300">{link.clickCount.toLocaleString("tr-TR")}</b> açılış</span>);
      metaParts.push(<span key="event">{link.eventName || "Etkinlik"} etkinliğinden</span>);
    } else {
      metaParts.push(link.clickCount > 0
        ? <span key="clicks"><b className="font-medium text-neutral-300">{link.clickCount.toLocaleString("tr-TR")}</b> açılış</span>
        : <span key="clicks">Henüz açılmadı</span>);
      const creator = link.createdBy?.fullName;
      const day = formatDay(link.createdAt);
      if (creator || day) metaParts.push(<span key="creator">{creator ? `${creator} oluşturdu${day ? `, ${day}` : ""}` : `${day} tarihinde oluşturuldu`}</span>);
      if (link.clickCount === 0 && canRename) {
        metaParts.push(
          <button key="rename" type="button" onClick={() => setEditing(true)} className="font-medium text-skylab-300 underline-offset-2 hover:underline">
            Kısa adı değiştir
          </button>
        );
      }
    }
  }

  const linkField = isLoading ? (
    <div className="flex h-10 items-center gap-2 rounded-lg border border-white/5 bg-black/20 px-3 text-sm text-neutral-500">
      <Loader2 size={14} className="animate-spin" />
      <span>Kısa link hazırlanıyor…</span>
    </div>
  ) : isError || !link ? (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-200">
      <div className="flex min-w-0 items-center gap-2">
        <CircleAlert size={14} className="shrink-0" />
        <span className="truncate">{error?.message || "Kısa link alınamadı."}</span>
      </div>
      <button type="button" onClick={() => refetch()} disabled={isFetching}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2 py-1 text-2xs font-medium text-neutral-200 hover:bg-white/10 disabled:opacity-50"
      >
        {isFetching ? <Loader2 size={12} className="animate-spin" /> : <RotateCcw size={12} />} Tekrar dene
      </button>
    </div>
  ) : editing ? (
    <AliasEditor formId={formId} formTitle={formTitle} link={link} onDone={finishEdit} />
  ) : (
    <>
      <div title={fullUrl} className={`flex h-10 min-w-0 items-center gap-1 rounded-lg border border-white/10 bg-black/20 pl-3 pr-1.5 transition-shadow ${flash ? "ring-2 ring-skylab-400/40" : ""}`}>
        <span className="min-w-0 flex-1 truncate text-sm text-neutral-500">
          skyl.app/<span className="font-medium text-neutral-100">{alias}</span>
          {tag && <span className="text-skylab-300/70">{tag}</span>}
        </span>
        {canRename ? (
          <button type="button" onClick={() => setEditing(true)} aria-label="Kısa adı değiştir" title="Kısa adı değiştir" className={ICON_BUTTON}>
            <PencilLine size={14} />
          </button>
        ) : (
          <span title={managedByEvent ? "Kısa ad etkinlik panelinden değiştiriliyor" : "Kısa adı yalnız sahip ve editörler değiştirebilir"}
            className="grid size-7 shrink-0 cursor-help place-items-center text-neutral-600"
          >
            <Lock size={14} />
          </span>
        )}
        <CopyButton state={copied.link} onClick={() => copy("link", fullUrl)} className="hidden sm:inline-flex" />
      </div>
      <div className="mt-2 flex gap-1.5 sm:hidden">
        <CopyButton state={copied.link} onClick={() => copy("link", fullUrl)} className="h-8 flex-1" />
        {canNativeShare && (
          <button type="button" onClick={shareNative}
            className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-white/10 bg-white/5 text-xs font-medium text-neutral-200 hover:bg-white/10"
          >
            <Share size={13} /> Paylaş…
          </button>
        )}
      </div>
      {metaParts.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-2xs text-neutral-500">
          {metaParts.flatMap((part, index) => (index === 0 ? [part] : [<span key={`sep-${index}`} className="text-neutral-700">·</span>, part]))}
        </p>
      )}
    </>
  );

  const formatToggle = selected.code && link ? (
    <div role="group" aria-label="Link biçimi" className="flex items-center gap-0.5 rounded-md border border-white/10 bg-white/5 p-0.5">
      {[["suffix", "Kısa", `skyl.app/${alias}/${selected.code}`], ["utm", "UTM", `skyl.app/${alias}?utm_source=${selected.source}`]].map(([value, label, example]) => (
        <button key={value} type="button" title={example} onClick={() => chooseFormat(value)}
          className={`rounded px-2 py-0.5 text-3xs transition-colors ${format === value ? "bg-white/10 text-neutral-200" : "text-neutral-500 hover:text-neutral-300"}`}
        >
          {label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
      <div className="flex items-center gap-3 border-b border-white/5 px-4 py-2 sm:px-5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-skylab-400/20 bg-skylab-400/10 text-skylab-400">
          <Share2 size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-medium leading-snug text-neutral-100">Formu paylaş</h2>
          {formTitle && <p className="truncate text-2xs text-neutral-500">{formTitle}</p>}
        </div>
        <button type="button" onClick={onClose} aria-label="Kapat"
          className="rounded-md p-1.5 text-neutral-400 transition-colors hover:bg-white/5 hover:text-neutral-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-skylab-400/40"
        >
          <X size={16} />
        </button>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto p-4 scrollbar sm:grid-cols-[minmax(0,1fr)_12.5rem] sm:gap-6 sm:p-5">
        <div className="flex min-w-0 flex-col">
          {formStatus === 1 && (
            <div className="mb-4 flex gap-2.5 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2.5 text-xs leading-relaxed text-amber-100">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-300" />
              <span>Form şu an kapalı. Link açılıyor ama yeni yanıt alınmıyor; form yeniden açılınca aynı link çalışır.</span>
            </div>
          )}

          <SectionLabel aside={managedByEvent ? <StatePill>Etkinlik linki</StatePill> : null}>Kısa link</SectionLabel>
          {linkField}

          <div className="h-5 shrink-0" />

          <SectionLabel aside={formatToggle}>Kanal</SectionLabel>
          <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 scrollbar-hidden sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {SHARE_CHANNELS.map((item) => (
              <button key={item.key} type="button" disabled={!link} onClick={() => setChannel(item.key)}
                className={`${CHIP} disabled:pointer-events-none disabled:opacity-40 ${channel === item.key ? CHIP_ON : CHIP_OFF}`}
              >
                <ChannelIcon source={item.key} size={13} className={channel === item.key ? "" : "opacity-70"} />
                {item.label}
              </button>
            ))}
          </div>
          {selected.key === "other" && (
            <input value={customSource} onChange={(e) => setCustomSource(e.target.value)} placeholder="Kaynak adı, ör. yildiz-duyuru"
              spellCheck={false} autoComplete="off" className={`mt-2 ${INPUT}`}
            />
          )}
          <p className="mt-2 text-2xs leading-relaxed text-neutral-500">{link ? hint : "Link hazır olunca kanal seçebilirsin."}</p>
          {selected.openUrl && fullUrl && (
            <div className="mt-2.5">
              <a href={selected.openUrl(fullUrl, formTitle)} target="_blank" rel="noopener noreferrer" className={`${CHIP} ${CHIP_OFF}`}>
                <ArrowUpRight size={13} className="opacity-70" /> {selected.openLabel}
              </a>
            </div>
          )}
          {selected.key !== "general" && link && (
            <>
              <button type="button" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen}
                className="mt-3 inline-flex items-center gap-1.5 self-start text-2xs font-medium text-neutral-500 transition-colors hover:text-neutral-300"
              >
                <ChevronDown size={12} className={`transition-transform duration-200 ${detailsOpen ? "rotate-180" : ""}`} />
                Kampanya ve içerik etiketi
              </button>
              {detailsOpen && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="flex min-w-0 flex-col gap-1 text-3xs text-neutral-500">
                    Kampanya (utm_campaign)
                    <input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="ör. son-gun" spellCheck={false} autoComplete="off" className={INPUT} />
                  </label>
                  <label className="flex min-w-0 flex-col gap-1 text-3xs text-neutral-500">
                    İçerik (utm_content)
                    <input value={content} onChange={(e) => setContent(e.target.value)} placeholder="ör. hikaye" spellCheck={false} autoComplete="off" className={INPUT} />
                  </label>
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-start gap-3 sm:flex sm:flex-col sm:items-stretch sm:gap-2.5">
          <div className={`grid aspect-square w-full place-items-center overflow-hidden rounded-lg p-2 ${qrSrc ? "bg-white" : qrPreview.isError ? "bg-white/5 text-neutral-500" : "animate-pulse bg-white/5"}`}>
            {qrSrc ? (
              <div role="img" aria-label={`skyl.app/${alias} QR kodu`}
                className="size-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url("${qrSrc}")` }}
              />
            ) : qrPreview.isError ? (
              <button type="button" onClick={() => qrPreview.refetch()} aria-label="QR önizlemesini yeniden dene" title="QR önizlemesi alınamadı, yeniden dene"
                className="grid size-8 place-items-center rounded-md transition-colors hover:bg-white/10 hover:text-neutral-200"
              >
                <RotateCcw size={14} />
              </button>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-col gap-2.5">
            <p className="truncate font-mono text-3xs text-neutral-500 sm:text-center">{alias ? `skyl.app/${alias}` : "QR hazırlanıyor…"}</p>
            <div className="grid grid-cols-[1fr_1fr_1.75rem] gap-1.5">
              {["png", "svg"].map((kind) => (
                <button key={kind} type="button" disabled={!alias || Boolean(qrBusy)} onClick={() => downloadQr(kind)}
                  title={kind === "png" ? "1024 px PNG" : "Baskı için vektör"}
                  className={`${CHIP} justify-center px-2 disabled:pointer-events-none disabled:opacity-40 ${CHIP_OFF}`}
                >
                  {qrBusy === kind ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} className="opacity-70" />}
                  {kind.toUpperCase()}
                </button>
              ))}
              <button type="button" disabled={!alias} onClick={copyQr} aria-label="QR görselini kopyala" title="Görseli kopyala"
                className={`${CHIP} justify-center px-0 disabled:pointer-events-none disabled:opacity-40 ${copied.qr === "ok" ? CHIP_ON : copied.qr === "err" ? "border-red-500/30 bg-red-500/10 text-red-300" : CHIP_OFF}`}
              >
                {copied.qr === "ok" ? <Check size={13} /> : copied.qr === "err" ? <CircleAlert size={13} /> : <Copy size={13} className="opacity-70" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-2 border-t border-white/5 py-2 pl-4 pr-2.5 sm:pl-5">
        <span className="shrink-0 text-2xs font-medium text-neutral-500">Form adresi</span>
        <span title={longUrl} className="min-w-0 flex-1 truncate font-mono text-2xs text-neutral-400">{longUrl.replace(/^https?:\/\//, "")}</span>
        <button type="button" onClick={() => copy("long", longUrl)} aria-label="Form adresini kopyala" title="Form adresini kopyala"
          className={`${ICON_BUTTON} ${copied.long === "ok" ? "text-skylab-300" : ""}`}
        >
          {copied.long === "ok" ? <Check size={13} /> : <Copy size={13} />}
        </button>
        <span className="hidden shrink-0 items-center gap-1.5 text-2xs text-neutral-500 sm:inline-flex">
          {allowAnonymous ? <Users size={12} className="text-neutral-600" /> : <Lock size={12} className="text-neutral-600" />}
          {allowAnonymous ? "Anonim yanıt açık" : "Giriş gerekli"}
        </span>
      </div>
    </>
  );
}

export default function FormShareDialog({ open, onClose, formId, formTitle, formStatus, allowAnonymous = false, canEdit = false }) {
  return (
    <AnimatePresence>
      {open && formId && (
        <motion.div key="form-share" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex h-dvh w-dvw items-center justify-center bg-neutral-950/20 px-3 backdrop-blur-sm sm:px-4"
        >
          <motion.div role="dialog" aria-label="Formu paylaş"
            initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: EASE }}
            className="relative flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-white/10 bg-[#121212] shadow-2xl"
          >
            <ShareDialogBody formId={formId} formTitle={formTitle} formStatus={formStatus} allowAnonymous={allowAnonymous} canEdit={canEdit} onClose={onClose} />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

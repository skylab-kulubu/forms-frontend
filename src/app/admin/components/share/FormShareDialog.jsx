"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, ChevronDown, CircleAlert, Copy, CornerDownRight, Download, Lock, PencilLine, RotateCcw, Share, Share2, Users, WandSparkles, X } from "lucide-react";
import {
  Button, Dialog, DialogClose, DialogContent, DialogTitle, Field, IconButton, IconSwap, Input, Notice, SegmentedControl, Skeleton, SkylabLoader,
} from "@skylab-kulubu/skylcn-ui";
import { publicFormUrl } from "@/lib/return-to";
import {
  MAX_ALIAS_LENGTH, RESERVED_ALIASES, SHARE_CHANNELS, SHARE_FORMAT_KEY,
  channelByKey, channelTag, defaultAliasFromTitle, qrFileName, qrTags, slugifyAlias, sourceLabel, suggestAliases, taggedShortUrl,
} from "@/lib/share-channels";
import {
  fetchShortLinkQr, useAliasAvailabilityQuery, useEnsureShortLinkQuery, useRenameShortLinkMutation,
  useShortLinkQrPngQuery, useShortLinkQrPreviewQuery,
} from "@/lib/hooks/useShortLink";
import { StatePill } from "../utils/SidePanel";
import ChannelIcon from "./ChannelIcon";

const COPY_TONE = { ok: "primary", err: "destructive", idle: "outline" };
const COPY_ICON = { ok: Check, err: CircleAlert, idle: Copy };

const CHANNEL_OPTIONS = SHARE_CHANNELS.map((item) => ({
  value: item.key,
  label: item.label,
  icon: function ChannelGlyph({ className }) {
    return <ChannelIcon source={item.key} className={className} />;
  },
}));

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

function useDebounced(value, ms) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(timer);
  }, [value, ms]);
  return debounced;
}

function isTouchScreen() {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(pointer: coarse)").matches);
}

function formatDay(value) {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}

function SectionLabel({ children, aside }) {
  return (
    <div className="mb-2 flex h-5 items-center gap-2">
      <span className="text-2xs font-medium text-subtle-foreground">{children}</span>
      <span className="h-px flex-1 bg-border-subtle" />
      {aside}
    </div>
  );
}

// Labelled, with forms' execCommand fallback and an error state; skylcn's CopyButton is icon only and has neither
function CopyButton({ state, onClick, label = "Kopyala", size = "sm", className = "" }) {
  const Icon = COPY_ICON[state] ?? COPY_ICON.idle;
  return (
    <Button type="button" variant={COPY_TONE[state] ?? COPY_TONE.idle} size={size} onClick={onClick} className={className}>
      <Icon className="size-3.5" />
      <span>{state === "ok" ? "Kopyalandı" : state === "err" ? "Hata" : label}</span>
    </Button>
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
    checking: { tone: "text-subtle-foreground", icon: <SkylabLoader size={12} />, text: "Bakılıyor" },
    ok: { tone: "text-success", icon: <Check size={12} />, text: "Uygun" },
    taken: { tone: "text-destructive", icon: <X size={12} />, text: "Dolu" },
    reserved: { tone: "text-destructive", icon: <X size={12} />, text: "Ayrılmış" },
    invalid: { tone: "text-destructive", icon: <X size={12} />, text: "Geçersiz" },
    long: { tone: "text-destructive", icon: <X size={12} />, text: "Çok uzun" },
  }[state];

  let hint = null;
  if (saveError) hint = <span className="text-destructive">{saveError}</span>;
  else if (state === "empty") hint = "Boş bırakırsan ad form başlığından üretilir; doluysa sonuna sayı eklenir.";
  else if (state === "same") hint = "Şu anki ad.";
  else if (state === "taken") hint = "Bu ad başka bir linkte kullanılıyor. Şunları deneyebilirsin:";
  else if (state === "reserved") hint = "Bu ad sisteme ayrılmış (v1, api, go, c gibi).";
  else if (state === "long") hint = `Kısa ad en fazla ${MAX_ALIAS_LENGTH} karakter olabilir.`;
  else if (state === "invalid") hint = "Kısa ad harf ya da rakamla başlamalı.";
  else if (state === "unknown") hint = "Uygunluğa bakılamadı; kaydederken yeniden denenir.";
  else if (slug !== draft.trim()) hint = <><code className="font-mono text-3xs text-secondary-foreground">skyl.app/{slug}</code> olarak kaydedilir; Türkçe harfler ve boşluklar dönüştürüldü.</>;

  const suggestions = state === "taken" ? suggestAliases(slug, current) : [];

  return (
    <div className="flex flex-col gap-2">
      <div className={`flex h-10 items-center gap-2 rounded-lg border bg-background/60 pl-3 pr-2.5 ring-2 transition-[border-color,box-shadow] ${bad ? "border-destructive/50 ring-destructive/20" : "border-skylab-600/60 ring-skylab-600/25"}`}>
        <span className="text-sm text-subtle-foreground">skyl.app/</span>
        <input type="text" value={draft} autoFocus spellCheck={false} autoComplete="off" aria-label="Kısa ad" placeholder={fromTitle}
          onChange={(e) => handleDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); save(); }
            // Stopped here so Esc leaves the editor without closing the dialog around it
            if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); onDone(false); }
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-faint-foreground"
        />
        {status && <span className={`inline-flex shrink-0 items-center gap-1 text-2xs ${status.tone}`}>{status.icon}{status.text}</span>}
      </div>
      {hint && <p className="text-2xs leading-relaxed text-subtle-foreground">{hint}</p>}
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((item) => (
            <button key={item} type="button" onClick={() => handleDraft(item)}
              className="inline-flex h-6 items-center rounded-md border border-border bg-muted px-2 font-mono text-2xs text-secondary-foreground outline-hidden transition-colors hover:border-skylab-400/30 hover:bg-skylab-500/10 hover:text-skylab-300 focus-visible:ring-2 focus-visible:ring-ring"
            >
              {item}
            </button>
          ))}
        </div>
      )}
      {keepsOld && (
        <p className="flex gap-1.5 text-2xs leading-relaxed text-subtle-foreground">
          <CornerDownRight size={12} className="mt-0.5 shrink-0 text-faint-foreground" />
          <span>
            Eski adres <code className="font-mono text-3xs text-secondary-foreground">skyl.app/{current}</code> bu forma yönlenmeye devam eder;
            basılı QR&apos;lar ve paylaşılmış linkler bozulmaz.
          </span>
        </p>
      )}
      <div className="flex items-center justify-end gap-1.5">
        <Button type="button" variant="ghost" size="sm" onClick={() => onDone(false)}>Vazgeç</Button>
        <Button type="button" variant="primary" size="sm" onClick={save} disabled={!canSave} pending={rename.isPending} className="font-semibold">
          {state === "empty" && !rename.isPending ? <WandSparkles className="size-3" /> : null}
          {rename.isPending ? "Kaydediliyor" : state === "empty" ? "Başlıktan üret" : "Kaydet"}
        </Button>
      </div>
    </div>
  );
}

function ShareDialogBody({ formId, formTitle, formStatus, allowAnonymous, canEdit }) {
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
  const typed = useDebounced([slugifyAlias(customSource), slugifyAlias(campaign), slugifyAlias(content)].join("|"), 400);
  const [typedSource, typedCampaign, typedContent] = typed.split("|");
  const tags = qrTags(channel, { customSource: typedSource, campaign: typedCampaign, content: typedContent });
  const qrPreview = useShortLinkQrPreviewQuery(formId, alias, tags);
  const qrSrc = qrPreview.data ?? null;
  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const touch = isTouchScreen();
  const qrPng = useShortLinkQrPngQuery(formId, alias, tags, touch && canNativeShare);

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

  const shareQrImage = () => {
    const file = new File([qrPng.data], qrFileName(alias, tags, "png"), { type: "image/png" });
    if (!navigator.canShare?.({ files: [file] })) return false;
    navigator.share({ files: [file], title: formTitle }).catch(() => {});
    return true;
  };

  const downloadQr = async (kind) => {
    if (qrBusy) return;
    if (kind === "png" && touch && qrPng.data && shareQrImage()) return;
    setQrBusy(kind);
    try {
      const blob = await fetchShortLinkQr(formId, kind, tags);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = qrFileName(alias, tags, kind);
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
      const blob = await fetchShortLinkQr(formId, "png", tags);
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
  if (selected.key === "general") hint = <>Etiketsiz link. Instagram, LinkedIn ya da YouTube&apos;dan açılırsa kaynak kendiliğinden tanınır; öbürleri <b className="font-medium text-secondary-foreground">Etiketsiz</b> satırına düşer.</>;
  else if (selected.key === "other") {
    const source = slugifyAlias(customSource);
    hint = source
      ? <>Gelenler genel bakışta <b className="font-medium text-secondary-foreground">{source}</b> adıyla kendi satırında görünür.</>
      : "Kaynak adını yaz; boşken link etiketsiz kalır.";
  } else hint = <><b className="font-medium text-secondary-foreground">{selected.label}</b> · Bununla gelenler genel bakışta <b className="font-medium text-secondary-foreground">{selected.label}</b> satırına yazılır.</>;

  const metaParts = [];
  if (flash) metaParts.push(<span key="saved" className="text-success">Kısa ad güncellendi</span>);
  if (link) {
    if (managedByEvent) {
      metaParts.push(<span key="clicks"><b className="font-medium text-secondary-foreground">{link.clickCount.toLocaleString("tr-TR")}</b> açılış</span>);
      metaParts.push(<span key="event">{link.eventName || "Etkinlik"} etkinliğinden</span>);
    } else {
      metaParts.push(link.clickCount > 0
        ? <span key="clicks"><b className="font-medium text-secondary-foreground">{link.clickCount.toLocaleString("tr-TR")}</b> açılış</span>
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
    <div role="status" className="flex h-10 items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 text-sm text-muted-foreground">
      <SkylabLoader size={14} />
      <span>Kısa link hazırlanıyor…</span>
    </div>
  ) : isError || !link ? (
    <Notice tone="danger"
      action={(
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()} pending={isFetching}>
          <RotateCcw className="size-3" /> Tekrar dene
        </Button>
      )}
    >
      {error?.message || "Kısa link alınamadı."}
    </Notice>
  ) : editing ? (
    <AliasEditor formId={formId} formTitle={formTitle} link={link} onDone={finishEdit} />
  ) : (
    <>
      <div title={fullUrl} className={`flex h-10 min-w-0 items-center gap-1 rounded-lg border border-input bg-background/60 pl-3 pr-1.5 transition-shadow ${flash ? "ring-2 ring-skylab-600/25" : ""}`}>
        <span className="min-w-0 flex-1 truncate text-sm text-subtle-foreground">
          skyl.app/<span className="font-medium text-foreground">{alias}</span>
          {tag && <span className="text-skylab-300/70">{tag}</span>}
        </span>
        {canRename ? (
          <IconButton icon={PencilLine} label="Kısa adı değiştir" variant="ghost" size="icon-sm" onClick={() => setEditing(true)} />
        ) : (
          <span title={managedByEvent ? "Kısa ad etkinlik panelinden değiştiriliyor" : "Kısa adı yalnız sahip ve editörler değiştirebilir"}
            className="grid size-7 shrink-0 cursor-help place-items-center text-faint-foreground"
          >
            <Lock size={14} />
          </span>
        )}
        <CopyButton state={copied.link} onClick={() => copy("link", fullUrl)} className="hidden sm:inline-flex" />
      </div>
      <div className="mt-2 flex gap-1.5 sm:hidden">
        <CopyButton state={copied.link} onClick={() => copy("link", fullUrl)} size="md" className="flex-1" />
        {canNativeShare && (
          <Button type="button" variant="outline" size="md" onClick={shareNative} className="flex-1">
            <Share className="size-3.5" /> Paylaş…
          </Button>
        )}
      </div>
      {metaParts.length > 0 && (
        <p className="mt-2 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-2xs text-subtle-foreground">
          {metaParts.flatMap((part, index) => (index === 0 ? [part] : [<span key={`sep-${index}`} className="text-faint-foreground">·</span>, part]))}
        </p>
      )}
    </>
  );

  // Not a SegmentedControl: that is 38px tall in a 20px label row, and titles each choice with its label instead of an example link
  const formatToggle = selected.code && link ? (
    <div role="group" aria-label="Link biçimi" className="flex items-center gap-0.5 rounded-md border border-border bg-muted p-0.5">
      {[["suffix", "Kısa", `skyl.app/${alias}/${selected.code}`], ["utm", "UTM", `skyl.app/${alias}?utm_source=${selected.source}`]].map(([value, label, example]) => (
        <button key={value} type="button" title={example} aria-pressed={format === value} onClick={() => chooseFormat(value)}
          className={`rounded px-2 py-0.5 text-3xs outline-hidden transition-colors focus-visible:ring-2 focus-visible:ring-ring ${format === value ? "bg-accent-strong text-foreground" : "text-subtle-foreground hover:text-secondary-foreground"}`}
        >
          {label}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
      <div className="flex shrink-0 items-center gap-3 border-b border-border-subtle px-4 py-2.5 sm:px-5">
        <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-lg border border-skylab-400/30 bg-skylab-500/10 text-skylab-300">
          <Share2 className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <DialogTitle className="leading-snug font-medium">Formu paylaş</DialogTitle>
          {formTitle && <p className="truncate text-2xs text-subtle-foreground">{formTitle}</p>}
        </div>
        <DialogClose aria-label="Kapat"
          className="-mr-1.5 grid size-8 shrink-0 place-items-center rounded-md text-subtle-foreground outline-hidden transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-4" />
        </DialogClose>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto p-4 scrollbar sm:grid-cols-[minmax(0,1fr)_12.5rem] sm:gap-6 sm:p-5">
        <div className="flex min-w-0 flex-col">
          {formStatus === 1 && (
            <Notice tone="warning" className="mb-4">
              Form şu an kapalı. Link açılıyor ama yeni yanıt alınmıyor; form yeniden açılınca aynı link çalışır.
            </Notice>
          )}

          <SectionLabel aside={<>{managedByEvent && <StatePill>Etkinlik linki</StatePill>}{!editing && formatToggle}</>}>Kısa link</SectionLabel>
          {linkField}

          <div className="h-5 shrink-0" />

          <SectionLabel>Kanal</SectionLabel>
          {/* Native disabled reaches the toggles through the fieldset; SegmentedControl takes no disabled of its own */}
          <fieldset disabled={!link} className={`min-w-0 transition-opacity ${link ? "" : "opacity-40"}`}>
            <SegmentedControl aria-label="Kanal" options={CHANNEL_OPTIONS} value={channel} onValueChange={setChannel} />
          </fieldset>
          {selected.key === "other" && (
            <Input value={customSource} onChange={(e) => setCustomSource(e.target.value)} placeholder="Kaynak adı, ör. yildiz-duyuru"
              spellCheck={false} autoComplete="off" inputSize="sm" className="mt-2"
            />
          )}
          <p className="mt-2 text-2xs leading-relaxed text-subtle-foreground">{link ? hint : "Link hazır olunca kanal seçebilirsin."}</p>
          {selected.openUrl && fullUrl && (
            <div className="mt-2.5">
              <Button render={<a href={selected.openUrl(fullUrl, formTitle)} target="_blank" rel="noopener noreferrer" />} variant="outline" size="sm">
                <ArrowUpRight className="size-3.5 opacity-70" /> {selected.openLabel}
              </Button>
            </div>
          )}
          {selected.key !== "general" && link && (
            <>
              <button type="button" onClick={() => setDetailsOpen((open) => !open)} aria-expanded={detailsOpen}
                className="mt-3 inline-flex items-center gap-1.5 self-start rounded text-2xs font-medium text-subtle-foreground outline-hidden transition-colors hover:text-secondary-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ChevronDown size={12} className={`transition-transform duration-200 ${detailsOpen ? "rotate-180" : ""}`} />
                Kampanya ve içerik etiketi
              </button>
              {detailsOpen && (
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Field label="Kampanya (utm_campaign)" className="min-w-0">
                    <Input value={campaign} onChange={(e) => setCampaign(e.target.value)} placeholder="ör. son-gun" spellCheck={false} autoComplete="off" inputSize="sm" />
                  </Field>
                  <Field label="İçerik (utm_content)" className="min-w-0">
                    <Input value={content} onChange={(e) => setContent(e.target.value)} placeholder="ör. hikaye" spellCheck={false} autoComplete="off" inputSize="sm" />
                  </Field>
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-[8rem_minmax(0,1fr)] items-start gap-3 sm:flex sm:flex-col sm:items-stretch sm:gap-2.5">
          {/* The code stays on white in both themes so every scanner reads it */}
          <div className={`grid aspect-square w-full place-items-center overflow-hidden rounded-lg ${qrSrc ? "border border-border bg-white" : qrPreview.isError ? "bg-muted text-subtle-foreground" : ""}`}>
            {qrSrc ? (
              <div role="img" aria-label={`skyl.app/${alias} QR kodu`}
                className="size-full bg-contain bg-center bg-no-repeat" style={{ backgroundImage: `url("${qrSrc}")` }}
              />
            ) : qrPreview.isError ? (
              <IconButton icon={RotateCcw} label="QR önizlemesini yeniden dene" title="QR önizlemesi alınamadı, yeniden dene" variant="ghost" onClick={() => qrPreview.refetch()} />
            ) : (
              <Skeleton className="size-full rounded-lg" />
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-2.5">
            <p className="flex min-w-0 items-center gap-1 font-mono text-3xs text-subtle-foreground sm:justify-center">
              {alias ? (
                <>
                  <span className="truncate">skyl.app/{alias}</span>
                  <span className="shrink-0 text-faint-foreground">·</span>
                  {tags.source && <ChannelIcon source={tags.source} size={11} className="shrink-0" />}
                  <span className="shrink-0">{tags.source ? sourceLabel(tags.source) : "QR"}</span>
                </>
              ) : "QR hazırlanıyor…"}
            </p>
            <div className="grid grid-cols-[1fr_1fr_1.75rem] gap-1.5">
              {["png", "svg"].map((kind) => (
                <Button key={kind} type="button" variant="outline" size="sm" disabled={!alias || Boolean(qrBusy)} pending={qrBusy === kind} onClick={() => downloadQr(kind)}
                  title={kind === "png" ? "1024 px PNG" : "Baskı için vektör"} className="px-2"
                >
                  <Download className="size-3.5 opacity-70" />
                  {kind.toUpperCase()}
                </Button>
              ))}
              <Button type="button" variant={COPY_TONE[copied.qr] ?? COPY_TONE.idle} size="icon-sm" disabled={!alias} onClick={copyQr} aria-label="QR görselini kopyala" title="Görseli kopyala">
                {copied.qr === "ok" ? <Check className="size-3.5" /> : copied.qr === "err" ? <CircleAlert className="size-3.5" /> : <Copy className="size-3.5 opacity-70" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 shrink-0 items-center gap-2 border-t border-border-subtle bg-muted/40 py-2 pl-4 pr-2.5 sm:pl-5">
        <span className="shrink-0 text-2xs font-medium text-subtle-foreground">Form adresi</span>
        <span title={longUrl} className="min-w-0 flex-1 truncate font-mono text-2xs text-muted-foreground">{longUrl.replace(/^https?:\/\//, "")}</span>
        <Button type="button" variant="ghost" size="icon-sm" onClick={() => copy("long", longUrl)} aria-label="Form adresini kopyala" title="Form adresini kopyala"
          className={copied.long === "ok" ? "text-skylab-300 hover:text-skylab-300" : ""}
        >
          <IconSwap swapped={copied.long === "ok"} icon={Copy} swappedIcon={Check} className="size-3.5" />
        </Button>
        <span className="hidden shrink-0 items-center gap-1.5 text-2xs text-subtle-foreground sm:inline-flex">
          {allowAnonymous ? <Users size={12} className="text-faint-foreground" /> : <Lock size={12} className="text-faint-foreground" />}
          {allowAnonymous ? "Anonim yanıt açık" : "Giriş gerekli"}
        </span>
      </div>
    </>
  );
}

export default function FormShareDialog({ open, onClose, formId, formTitle, formStatus, allowAnonymous = false, canEdit = false }) {
  return (
    <Dialog open={Boolean(open && formId)} onOpenChange={(next) => { if (!next) onClose?.(); }}>
      <DialogContent hideClose className="sm:max-w-3xl">
        <ShareDialogBody formId={formId} formTitle={formTitle} formStatus={formStatus} allowAnonymous={allowAnonymous} canEdit={canEdit} />
      </DialogContent>
    </Dialog>
  );
}

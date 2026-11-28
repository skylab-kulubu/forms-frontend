import { clamp, ease, seg } from "../film/engine.js";
import { PERSON, TEXT } from "./script.js";

const C = {
  bg: "#0a0a0a", primary: "#fafafa", body: "#a3a3a3", muted: "#737373", faint: "#525252", link: "#ebd5ee", hair: "#262626", note: "#404040", card: "#141414",
  tone: { ok: "#34d399", wait: "#fbbf24", bad: "#fca5a5", neutral: "#525252", brand: "#ebd5ee" },
};
const FONT = "var(--font-sans), 'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

const esc = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const dateOf = (iso) => {
  const date = iso ? new Date(iso) : new Date();
  const day = date.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
  const time = date.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
  return `${day}, ${time}`;
};

const brand = () => `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse"><tbody><tr>
  <td style="padding:0 8px 0 0;line-height:0"><img src="/mail/skylab-lilac.png" width="20" height="19" alt="" style="display:inline-block;border:0;width:20px;height:19px"></td>
  <td><span style="font-size:13px;line-height:19px;font-weight:600;color:${C.primary}">SKY LAB Forms</span></td>
</tr></tbody></table>`;

const context = (tone, text) => `<p style="margin:0;font-size:13px;line-height:20px;color:${C.muted}"><span style="color:${C.tone[tone]};font-size:10px;line-height:20px;padding-right:6px">●</span>${esc(text)}</p>`;
const title = (text) => `<h1 style="margin:6px 0 0;font-size:22px;line-height:30px;font-weight:600;letter-spacing:-0.01em;color:${C.primary}">${esc(text)}</h1>`;
const paragraph = (text) => `<p style="margin:12px 0 0;font-size:15px;line-height:24px;color:${C.body}">${esc(text)}</p>`;
const rows = (items) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:24px;border-collapse:collapse"><tbody>
  ${items.map(([label, value]) => `<tr><td style="border-top:1px solid ${C.hair};padding:10px 0;font-size:13px;line-height:20px;color:${C.muted};vertical-align:top">${esc(label)}</td><td align="right" style="border-top:1px solid ${C.hair};padding:10px 0 10px 16px;font-size:13px;line-height:20px;color:${C.primary};font-weight:500;text-align:right;vertical-align:top">${esc(value)}</td></tr>`).join("")}
  <tr><td colspan="2" style="border-top:1px solid ${C.hair};font-size:0;line-height:0;height:1px">&nbsp;</td></tr>
</tbody></table>`;
const note = (label, text) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:24px"><tbody><tr><td style="border-left:2px solid ${C.note};padding-left:12px">
  <p style="margin:0;font-size:12px;line-height:18px;color:${C.muted}">${esc(label)}</p>
  <p style="margin:2px 0 0;font-size:14px;line-height:22px;color:${C.primary};white-space:pre-wrap">${esc(text)}</p>
</td></tr></tbody></table>`;
const cta = (label) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:28px;border-collapse:separate"><tbody><tr>
  <td data-mail-cta="" style="border:1px solid ${C.hair};border-radius:8px;background-color:${C.card};padding:0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%"><tbody><tr>
    <td><span style="display:block;padding:13px 16px;font-size:14px;line-height:20px;font-weight:500;color:${C.primary}">${esc(label)}</span></td>
    <td align="right" width="48" style="width:48px;text-align:right"><span style="display:block;padding:13px 16px;font-size:14px;line-height:20px;color:${C.link}">→</span></td>
  </tr></tbody></table></td>
</tr></tbody></table>`;
const listHeader = (label, count) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:32px"><tbody><tr>
  <td style="padding-bottom:8px;font-size:13px;line-height:20px;font-weight:500;color:${C.primary}">${esc(label)}</td>
  <td align="right" style="padding-bottom:8px;font-size:12px;line-height:20px;color:${C.muted};text-align:right">${esc(count)}</td>
</tr></tbody></table>`;
const answers = (list) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;border-collapse:collapse"><tbody>
  ${list.map(([question, answer], index) => `<tr><td style="border-top:1px solid ${C.hair};padding:14px 0">
    <p style="margin:0;font-size:13px;line-height:20px;color:${C.muted}"><span style="color:${C.link};font-weight:500;padding-right:8px;font-variant-numeric:tabular-nums">${String(index + 1).padStart(2, "0")}</span>${esc(question)}</p>
    <p style="margin:4px 0 0;font-size:15px;line-height:24px;color:${C.primary};white-space:pre-wrap">${answer ? esc(answer) : `<span style="color:${C.faint};font-style:italic">Boş bırakıldı</span>`}</p>
  </td></tr>`).join("")}
</tbody></table>`;
const footer = (reason) => `<div style="margin-top:48px">
  <p style="margin:0;font-size:12px;line-height:18px;color:${C.faint}">${esc(reason)}</p>
  <p style="margin:8px 0 0;font-size:12px;line-height:18px;color:${C.faint}"><span style="color:${C.muted}">Sorun bildir</span>&nbsp;&nbsp;·&nbsp;&nbsp;<span style="color:${C.muted}">KVKK metni</span></p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin-top:24px"><tbody><tr>
    <td style="font-size:11px;line-height:16px;color:${C.faint}"><span style="color:${C.muted};font-weight:600">SKY LAB Forms</span> by WEBLAB</td>
    <td align="right" style="padding-left:12px;font-size:11px;line-height:16px;text-align:right;white-space:nowrap;color:${C.faint}">Developed by Fatih Naz</td>
  </tr></tbody></table>
</div>`;
const layout = (inner, reason) => `<div style="background-color:${C.bg};font-family:${FONT};text-align:left;padding:28px 20px 24px">${brand()}<div style="padding-top:32px">${inner}</div>${footer(reason)}</div>`;

const greeting = `Merhaba ${PERSON.first},`;

export const APPLICATION = "Seçme başvurusu";

function received(sentAt) {
  const list = [
    ["Adınız ve soyadınız", PERSON.name],
    ["E-posta adresiniz", PERSON.email],
    ["Hangi takıma başvuruyorsunuz?", "Frontend"],
    ["Web geliştirme deneyiminiz var mı?", "Evet"],
    ["Hangi projelerde yer aldınız?", TEXT.projects],
    ["GitHub profiliniz", TEXT.githubWrong],
    ["Hangilerini kullandınız?", "React, Next.js, Tailwind CSS"],
  ];
  return layout(
    context("ok", APPLICATION) + title("Cevabınızı aldık") + paragraph(`${greeting} cevabınız bize ulaştı. Gönderdiklerinizin bir kopyasını aşağıya ekledik.`)
      + rows([["Gönderim tarihi", dateOf(sentAt)]]) + listHeader("Cevaplarınız", `${list.length} soru`) + answers(list),
    `Bu e-postayı ${APPLICATION} formunu doldurduğunuz için aldınız.`,
  );
}

function returned(reviewedAt, text) {
  return layout(
    context("brand", APPLICATION) + title("Cevabınızda düzeltme istendi")
      + paragraph(`${greeting} cevabınızı inceledik ve küçük bir düzeltme istiyoruz. Önceki cevaplarınız formda hazır; ekibin notuna göre düzenleyip yeniden gönderebilirsiniz.`)
      + rows([["İnceleme tarihi", dateOf(reviewedAt)], ["Düzeltilecek", "1 soru"]]) + note("Ekibin notu", text) + cta("Düzeltmeye git"),
    `Bu e-postayı ${APPLICATION} formunu doldurduğunuz için aldınız.`,
  );
}

function approved(formTitle, reviewedAt, text) {
  return layout(
    context("ok", formTitle) + title("Sonraki adıma geçtiniz")
      + paragraph(`${greeting} cevabınızı inceledik ve onayladık. Başvurunuzun sonraki adımı açıldı, aşağıdan devam edebilirsiniz.`)
      + rows([["İnceleme tarihi", dateOf(reviewedAt)]]) + note("Ekibin notu", text) + cta("Sonraki adıma geç"),
    `Bu e-postayı ${formTitle} formunu doldurduğunuz için aldınız.`,
  );
}

export function mailOf(key, info) {
  switch (key) {
    case "received":
      return { subject: `Cevabınızı aldık · ${APPLICATION}`, preview: "Gönderdiğiniz cevapların bir kopyası bu e-postada.", at: info.at, html: received(info.at) };
    case "returned":
      return { subject: `Cevabınızda düzeltme istendi · ${APPLICATION}`, preview: `${APPLICATION} cevabınızda düzeltme istedik.`, at: info.at, html: returned(info.at, info.note) };
    case "approved1":
      return { subject: `Sonraki adıma geçtiniz · ${APPLICATION}`, preview: `${APPLICATION} cevabınızı onayladık.`, at: info.at, html: approved(APPLICATION, info.at, info.note) };
    default:
      return null;
  }
}

const LOGO = '<img src="/skylab.svg" alt="" width="15" height="14">';
const BACK = '<svg width="10" height="16" viewBox="0 0 10 16" aria-hidden="true"><path d="M8.5 1.5 2 8l6.5 6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

const timeOf = (iso) => new Date(iso ?? Date.now()).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

export function createMailSheet(actor) {
  const root = document.createElement("div");
  root.className = "film-mail hm-embed";
  root.style.top = "0px";
  root.style.setProperty("--film-mail-safe", `${actor.head}px`);
  root.innerHTML = `
    <div class="film-mail-banner"><span class="film-mail-icon">${LOGO}</span><div class="film-mail-banner-t"><p><b>SKY LAB Forms</b><time></time></p><p class="film-mail-banner-s"></p><p class="film-mail-banner-p"></p></div></div>
    <div class="film-mail-view">
      <div class="film-mail-bar">${BACK}<span>Gelen kutusu</span></div>
      <div class="film-mail-scroll">
        <div class="film-mail-head"><div class="film-mail-head-r"><span class="film-mail-from">${LOGO}</span><div class="film-mail-head-m"><p>SKY LAB Forms</p><small>${PERSON.email}</small></div><time></time></div><p class="film-mail-subj"></p></div>
        <div class="film-mail-body"></div>
      </div>
    </div>`;
  actor.inner.after(root);
  const banner = root.querySelector(".film-mail-banner");
  banner.style.top = `${actor.head + 6}px`;
  const view = root.querySelector(".film-mail-view");
  const scroller = root.querySelector(".film-mail-scroll");
  const body = root.querySelector(".film-mail-body");
  const shown = { key: null, banner: -1, open: -1, scroll: -1 };

  const fill = (mail) => {
    banner.querySelector("time").textContent = "şimdi";
    banner.querySelector(".film-mail-banner-s").textContent = mail.subject;
    banner.querySelector(".film-mail-banner-p").textContent = mail.preview;
    view.querySelector(".film-mail-head time").textContent = timeOf(mail.at);
    view.querySelector(".film-mail-subj").textContent = mail.subject;
    body.innerHTML = mail.html;
    scroller.scrollTop = 0;
  };

  const offsetIn = (element) => {
    let x = 0;
    let y = 0;
    let node = element;
    while (node && node !== actor.body) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent;
    }
    return { x, y };
  };

  const pointOf = (element, fx = 0.5, fy = 0.5) => {
    if (!element || !root.isConnected) return null;
    const { x, y } = offsetIn(element);
    const inside = element.closest(".film-mail-scroll") ? scroller.scrollTop : 0;
    const base = actor.phone ? actor.inset : 0;
    return [base + x + element.offsetWidth * fx, base + y - inside + element.offsetHeight * fy];
  };

  return {
    root,
    update({ key, mail, banner: bannerAmount, open, scroll }) {
      if (key !== shown.key) {
        shown.key = key;
        if (mail) fill(mail);
      }
      const b = key ? clamp(bannerAmount) : 0;
      if (Math.abs(b - shown.banner) > 0.001) {
        shown.banner = b;
        const k = ease(b);
        banner.style.opacity = k.toFixed(3);
        banner.style.transform = `translateY(${((1 - k) * -26).toFixed(1)}px) scale(${(0.96 + 0.04 * k).toFixed(4)})`;
        banner.style.visibility = b > 0.001 ? "visible" : "hidden";
      }
      const o = key ? clamp(open) : 0;
      if (Math.abs(o - shown.open) > 0.001) {
        shown.open = o;
        const k = ease(o);
        view.style.transform = `translateY(${((1 - k) * 102).toFixed(2)}%)`;
        view.style.visibility = o > 0.001 ? "visible" : "hidden";
      }
      if (key && scroll != null) {
        const max = Math.max(0, scroller.scrollHeight - scroller.clientHeight);
        const want = Math.round(clamp(scroll) * max);
        if (Math.abs(want - scroller.scrollTop) > 0.5 && Math.abs(want - shown.scroll) > 0.5) {
          shown.scroll = want;
          scroller.scrollTop = want;
        }
      }
    },
    bannerPoint: () => pointOf(banner, 0.5, 0.5),
    ctaPoint: () => pointOf(root.querySelector("[data-mail-cta]"), 0.4, 0.5),
    ctaScroll() {
      const target = root.querySelector("[data-mail-cta]");
      if (!target) return 1;
      const max = Math.max(1, scroller.scrollHeight - scroller.clientHeight);
      const { y } = offsetIn(target);
      const top = offsetIn(scroller).y;
      return clamp((y - top - scroller.clientHeight * 0.45) / max);
    },
    destroy: () => root.remove(),
  };
}

export const mailWindow = (u, beat) => ({
  banner: seg(u, beat.banner, beat.banner + 0.06) * (1 - seg(u, beat.open, beat.open + 0.05)),
  open: seg(u, beat.open, beat.open + 0.08) * (beat.close ? 1 - seg(u, beat.close, beat.close + 0.08) : beat.cta ? 1 - seg(u, beat.cta + 0.02, beat.cta + 0.1) : 1),
});

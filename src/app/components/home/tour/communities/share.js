import { R, bleed, crop, handAt, part, shot, slot, stint } from "../film/engine.js";
import { SHARE_TOKEN } from "@/lib/demo/server/communities/templates";
import { T } from "./script.js";

const SH = T.share;
const NAME = "Ekip başvurusu";

const PEEK_AT = SH + 0.14;
const DIALOG_AT = SH + 0.36;
const CLONE_AT = SH + 1.0;

export function createShare(owner, guest, IDS, mode = {}, resetGuest = () => {}) {
  const compact = Boolean(mode.compact);
  let applied = {};
  let guestState = "idle";

  const allOf = (actor) => R(0, 0, actor.pw, actor.ph);
  const panel = (actor) => R(272, 8, actor.pw - 280, actor.ph - 16);
  const table = () => R(272, 8, owner.pw - 280, Math.min(560, owner.ph - 16));
  const fanGuest = () => {
    if (!mode.fill) return shot(guest, allOf(guest), { max: 0.5, rx: 4, ry: -26, z: -120, shade: 0.1, area: part(0.44, 0.2, 0.56, 0.62) });
    const r = crop(guest, 272 + (guest.pw - 280) / 2);
    return shot(guest, r, { max: 0.5, rx: 4, ry: -26, z: -120, shade: 0.1, clip: r, veil: 1, hole: r, rad: 44, area: part(0.44, 0.2, 0.56, 0.62) });
  };
  const dialogCard = () => owner.all("h2").find((entry) => entry.textContent.trim() === "Şablonu Paylaş")?.closest(".rounded-xl") ?? null;
  const dialog = () => {
    const box = owner.rect(dialogCard()) ?? R(owner.pw / 2 - 288, owner.ph / 2 - 95, 576, 190);
    return R(box.x - 150, box.y - 130, box.w + 300, box.h + 260);
  };

  const before = (actor, dx = 0.55, ry = -30) => () => shot(actor, allOf(actor), { pad: 6, max: 0.7, rx: 5, ry, dx, z: -420, o: 0 });
  const cut = (actor) => (mode.fill && !mode.whole ? R(272, 0, actor.pw - 272, actor.ph) : null);
  const framed = (actor, region, options) => {
    const c = cut(actor);
    return c ? shot(actor, region, { ...options, clip: c, rad: 16, veil: 1, hole: c }) : shot(actor, region, options);
  };
  const wide = (actor, ry = -6) => () => shot(actor, allOf(actor), { pad: 6, max: mode.whole ? 0.88 : 1, rx: 3, ry });
  const list = () => (mode.fill ? framed(owner, cut(owner) ?? allOf(owner), { max: 1, ry: -1 }) : shot(owner, table(), { mode: "width", max: 1, ry: -1, valign: "top" }));
  const close = () => framed(owner, dialog(), { pad: 10, max: 1, ry: -2, rx: 1 });
  const work = (actor, ry = -1) => () => (mode.fill ? framed(actor, cut(actor) ?? allOf(actor), { max: 1, ry }) : shot(actor, panel(actor), { max: 1, ry }));
  const aside = (actor) => () => shot(actor, allOf(actor), { pad: 6, max: 0.6, rx: 4, ry: 26, dx: -0.36, shade: 0.5, z: -280 });
  const hidden = (actor) => () => shot(actor, allOf(actor), { pad: 6, max: 0.5, rx: 4, ry: 30, dx: -0.6, shade: 0.7, z: -500, o: 0 });

  const gone = (actor) => () => slot(actor, { dx: -0.5, o: 0, ry: 16, z: -120 });
  const ownerCompact = [...stint(owner, SH, SH + 0.72), { u: T.end + 0.3, f: gone(owner) }];
  const guestCompact = [...stint(guest, SH + 0.72, T.end - 0.14), { u: T.end + 0.3, f: gone(guest) }];

  const whole = (actor, options) => () => slot(actor, options);
  const ownerFit = [
    { u: SH - 0.28, f: whole(owner, { o: 0, z: -220 }) },
    { u: SH - 0.02, f: whole(owner) },
    { u: SH + 0.64, f: whole(owner) },
    { u: SH + 0.84, f: whole(owner, { o: 0, z: -220, shade: 0.6 }) },
    { u: T.end + 0.3, f: whole(owner, { o: 0, z: -220, shade: 0.6 }) },
  ];
  const guestFit = [
    { u: SH + 0.6, f: whole(guest, { o: 0, z: -220 }) },
    { u: SH + 0.84, f: whole(guest) },
    { u: T.end - 0.12, f: whole(guest) },
    { u: T.end + 0.22, f: fanGuest },
  ];

  const pan = (actor, ry = 0, rx = 0, extra = {}) => () => bleed(actor, { ry, rx, ...extra });
  const ownerBleed = [
    { u: SH - 0.28, f: pan(owner, -8, 2, { o: 0 }) },
    { u: SH - 0.02, f: pan(owner, -2, 0.6) },
    { u: DIALOG_AT + 0.02, f: pan(owner, -1) },
    { u: DIALOG_AT + 0.16, f: pan(owner, 1.5) },
    { u: SH + 0.62, f: pan(owner, 1) },
    { u: SH + 0.84, f: pan(owner, 6, 0, { o: 0, shade: 0.6 }) },
  ];
  const guestBleed = [
    { u: SH + 0.6, f: pan(guest, -8, 2, { o: 0 }) },
    { u: SH + 0.84, f: pan(guest, -2, 0.6) },
    { u: T.end - 0.34, f: pan(guest, -1) },
    { u: T.end - 0.04, f: pan(guest, 3, 0, { o: 0 }) },
  ];

  const trackOwner = compact ? ownerCompact : mode.fit ? ownerFit : mode.fill ? ownerBleed : [
    { u: SH - 0.28, f: before(owner) },
    { u: SH - 0.02, f: wide(owner) },
    { u: SH + 0.06, f: wide(owner) },
    { u: SH + 0.2, f: list },
    { u: DIALOG_AT + 0.02, f: list },
    { u: DIALOG_AT + 0.16, f: close },
    { u: SH + 0.64, f: close },
    { u: SH + 0.82, f: aside(owner) },
    { u: T.end - (mode.fill ? 0.4 : 0.12), f: aside(owner) },
    { u: T.end + (mode.fill ? -0.14 : 0.14), f: hidden(owner) },
  ];

  const guestCine = [
    { u: SH + 0.58, f: before(guest, 0.6, -34) },
    { u: SH + 0.84, f: work(guest, -2) },
    { u: T.end - 0.34, f: work(guest, -1) },
    { u: T.end - 0.04, f: () => framed(guest, cut(guest) ?? allOf(guest), { max: 1, ry: -1, o: 0, z: -260 }) },
  ];

  const trackGuest = compact ? guestCompact : mode.fit ? guestFit : mode.fill ? guestBleed : [
    { u: SH + 0.58, f: before(guest, 0.6, -34) },
    { u: SH + 0.84, f: work(guest, -2) },
    { u: T.end - 0.12, f: work(guest, -1) },
    { u: T.end + 0.22, f: fanGuest },
  ];

  const keep = (find) => {
    let last = null;
    return () => {
      const spot = find();
      if (spot) last = spot;
      return last;
    };
  };
  const row = keep(() => owner.point(`button[aria-label^="${NAME}: "][aria-expanded]`));
  const shareButton = keep(() => owner.point(`button[aria-label="${NAME}: paylaş"]`));
  const ownerPark = keep(() => [owner.pw * 0.62, owner.ph * 0.72]);
  const cloneButton = keep(() => guest.point(guest.all("button").find((entry) => entry.textContent.trim() === "Kendime ekle") ?? null));
  const guestPark = keep(() => [guest.pw * 0.56, guest.ph * 0.62]);

  const OWNER_HAND = [
    { u: SH + 0.06, at: ownerPark },
    { u: PEEK_AT - 0.02, at: row }, { u: PEEK_AT, at: row, click: true },
    { u: DIALOG_AT - 0.02, at: shareButton }, { u: DIALOG_AT, at: shareButton, click: true },
    { u: DIALOG_AT + 0.14, at: ownerPark }, { u: SH + 0.6, at: ownerPark },
  ];
  const GUEST_HAND = [
    { u: SH + 0.86, at: guestPark },
    { u: CLONE_AT - 0.02, at: cloneButton }, { u: CLONE_AT, at: cloneButton, click: true },
    { u: CLONE_AT + 0.1, at: guestPark }, { u: CLONE_AT + 0.2, at: guestPark },
  ];

  const guestUrl = `/admin/templates/${IDS.TEAM}?token=${SHARE_TOKEN}`;

  const guestReady = (self) => Boolean(self.all("button").some((entry) => entry.textContent.includes("Kendime ekle")) || self.q("[data-studio-page]"));

  function load() {
    applied = {};
    guestState = "idle";
    owner.load("/admin/templates", (self) => Boolean(self.q(`a[aria-label="${NAME}"]`)));
    guest.load(guestUrl, guestReady);
  }

  function update(u) {
    if (owner.ready && u > SH - 0.4) {
      const peek = owner.q(`button[aria-label^="${NAME}: "][aria-expanded]`);
      const open = peek?.getAttribute("aria-expanded") === "true";
      const wantPeek = u >= PEEK_AT;
      if (peek && open !== wantPeek && applied.peek !== wantPeek) {
        applied.peek = wantPeek;
        peek.click();
      } else if (peek && open === wantPeek) {
        applied.peek = undefined;
      }

      const card = dialogCard();
      const shown = Boolean(card);
      const wantDialog = u >= DIALOG_AT && u < T.end + 0.1;
      if (wantDialog && !shown && applied.dialog !== true) {
        applied.dialog = true;
        owner.q(`button[aria-label="${NAME}: paylaş"]`)?.click();
      } else if (!wantDialog && shown && applied.dialog !== false) {
        applied.dialog = false;
        card.querySelector('button[aria-label="Kapat"]')?.click();
      } else if (wantDialog === shown) {
        applied.dialog = undefined;
      }
    }
    owner.setHand(owner.ready ? handAt(u, OWNER_HAND) : null);

    guest.setHand(guest.ready ? handAt(u, GUEST_HAND) : null);
    if (guest.ready && guestState !== "busy") {
      const cloned = Boolean(guest.q("[data-studio-page]"));
      const wantClone = u >= CLONE_AT;
      if (wantClone && !cloned) {
        const button = guest.all("button").find((entry) => entry.textContent.trim() === "Kendime ekle");
        if (button && !button.disabled) {
          guestState = "busy";
          button.click();
          setTimeout(() => { guestState = "idle"; }, 2500);
        }
      } else if (!wantClone && cloned) {
        guestState = "busy";
        resetGuest();
        guest.load(guestUrl, guestReady);
        guestState = "idle";
      }
    }
  }

  return { trackOwner, trackGuest, load, update, resync: () => { applied = {}; } };
}

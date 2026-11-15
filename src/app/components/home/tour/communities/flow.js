import { bleed, handAt, throttle } from "../film/engine.js";
import { T } from "./script.js";

const FL = T.flow;
export const STEP_AT = FL + 0.4;
export const BACK_AT = FL + 0.84;

export function createFlow(actor, IDS) {
  const stepTick = throttle(3200);
  const backTick = throttle(3200);
  const pan = (ry = 0, rx = 0, extra = {}) => () => bleed(actor, { ry, rx, ...extra });

  const track = [
    { u: FL - 0.3, f: pan(-8, 2, { o: 0 }) },
    { u: FL - 0.04, f: pan(-2.4, 0.8) },
    { u: STEP_AT - 0.04, f: pan(-1.2) },
    { u: STEP_AT + 0.16, f: pan(1.2) },
    { u: BACK_AT - 0.04, f: pan(0.6) },
    { u: BACK_AT + 0.16, f: pan(-1.6, 0.6) },
    { u: T.share - 0.26, f: pan(-0.8) },
    { u: T.share - 0.04, f: pan(5, 0, { o: 0, shade: 0.6 }) },
  ];

  const keep = (find) => {
    let last = null;
    return () => {
      const spot = find();
      if (spot) last = spot;
      return last;
    };
  };
  const stepButton = () => actor.all("[data-map-frame]")[1]?.querySelector('button[aria-label$="formunu düzenle"]') ?? null;
  const mapButton = () => actor.q('[data-studio-toolbar] button[aria-label^="Akış haritası"]');
  const step = keep(() => actor.point(stepButton(), 0.5, 0.34));
  const back = keep(() => actor.point(mapButton()));
  const park = keep(() => [actor.pw - Math.min(actor.pw * 0.5, 620), actor.ph * 0.72]);

  const HAND = [
    { u: FL + 0.08, at: park },
    { u: STEP_AT - 0.02, at: step }, { u: STEP_AT, at: step, click: true },
    { u: STEP_AT + 0.12, at: park }, { u: BACK_AT - 0.14, at: park },
    { u: BACK_AT - 0.02, at: back }, { u: BACK_AT, at: back, click: true },
    { u: BACK_AT + 0.12, at: park }, { u: T.share - 0.3, at: park },
  ];

  function load() {
    actor.load(`/admin/forms/${IDS.F1}/edit?view=map`, (self) => self.all("[data-map-frame]").length >= 2 && self.all("[data-map-frame] .shimmer").length === 0);
  }

  function update(u, dt, now) {
    if (!actor.ready) return;
    const wantPage = u >= STEP_AT && u < BACK_AT;
    const onMap = Boolean(actor.q("[data-map-surface]"));
    const button = wantPage === onMap ? (wantPage ? stepButton() : mapButton()) : null;
    if (button && (wantPage ? stepTick : backTick)(now)) button.click();
    actor.setHand(u < FL - 0.6 || u > T.share + 0.1 ? null : handAt(u, HAND));
  }

  return { actor, track, load, update };
}

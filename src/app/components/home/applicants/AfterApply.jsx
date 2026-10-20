"use client";

import { useEffect, useReducer, useRef } from "react";
import Image from "next/image";
import { ChevronsUpDown, Clock, FileClock, Lock, Mail } from "lucide-react";
import { useInView, useReducedMotion } from "../useInView";
import { formatDay } from "../dates";
import "./after-apply.css";

const LAST_STEP = 3;
const FIRST_DELAY = 700;
const STEP_DELAY = 2300;
const HOLD_DELAY = 3600;

const INITIAL = { step: -1, out: "ok" };
const MAIL_DATE = { day: "2-digit", month: "long", year: "numeric" };

const OUTCOME = {
  ok: {
    subject: "Sonraki adıma geçtiniz · Seçme başvurusu",
    title: "Sonraki adıma geçtiniz",
    body: "Merhaba Ayşe, cevabınızı inceledik ve onayladık. Başvurunuzun sonraki adımı açıldı, aşağıdan devam edebilirsiniz.",
    note: "Geçmiş projelerini beğendik. Teknik görüşmede frontend tarafını konuşalım.",
  },
  no: {
    subject: "Cevabınız incelendi · Seçme başvurusu",
    title: "Cevabınız kabul edilmedi",
    body: "Merhaba Ayşe, cevabınızı inceledik ama bu sefer olumlu dönemiyoruz. İlginiz için teşekkür ederiz.",
    note: "Bu dönem Frontend takımı doldu. Bahar seçmelerinde yeniden bekleriz.",
  },
};

function reducer(state, action) {
  switch (action.type) {
    case "step":
      return { ...state, step: action.step };
    case "restart":
      return { step: -1, out: state.out === "ok" ? "no" : "ok" };
    default:
      return state;
  }
}

const stepClass = (step, i) => (step === i ? "aa-step is-on" : "aa-step");
const linkClass = (step, i) => (step === i ? "aa-cx is-go" : "aa-cx");

function Logo({ width, height }) {
  return <Image src="/skylab.svg" alt="" width={width} height={height} />;
}

function StepHead({ n, title, caption }) {
  return (
    <div className="aa-sh">
      <span className="aa-n">{n}</span>
      <div>
        <p className="aa-st">{title}</p>
        <p className="aa-sc">{caption}</p>
      </div>
    </div>
  );
}

function Connector({ className, children }) {
  return (
    <div className={className} aria-hidden="true">
      <span>{children}</span>
    </div>
  );
}

function MailHead({ time, subject }) {
  return (
    <div className="aa-mh">
      <div className="aa-mh-r">
        <span className="aa-from">
          <Logo width={15} height={14} />
        </span>
        <div className="aa-mh-m">
          <p>SKY LAB Forms</p>
          <small>ayse.yilmaz@std.yildiz.edu.tr</small>
        </div>
        <time>{time}</time>
      </div>
      <p className="aa-subj">{subject}</p>
    </div>
  );
}

function MailBrand() {
  return (
    <p className="aa-brand">
      <Logo width={14} height={13} />
      SKY LAB Forms
    </p>
  );
}

function Context({ tone }) {
  return (
    <p className="aa-ctx">
      <i className={`is-${tone}`}>●</i>
      Seçme başvurusu
    </p>
  );
}

export default function AfterApply() {
  const rootRef = useRef(null);
  const inView = useInView(rootRef, { threshold: 0.25 });
  const reduce = useReducedMotion();
  const [{ step, out }, dispatch] = useReducer(reducer, INITIAL);
  const running = inView && !reduce;
  const ok = out === "ok";
  const mail = OUTCOME[out];

  useEffect(() => {
    if (!running) return;
    const next = step + 1;
    const finished = next > LAST_STEP;
    const delay = finished ? HOLD_DELAY : next === 0 ? FIRST_DELAY : STEP_DELAY;
    const id = setTimeout(() => dispatch(finished ? { type: "restart" } : { type: "step", step: next }), delay);
    return () => clearTimeout(id);
  }, [running, step]);

  return (
    <div className="aa" ref={rootRef}>
      <div className="aa-flow">
        <div className={stepClass(step, 0)}>
          <StepHead n={1} title="Form gönderilir" caption="Formun sonunda gönderince ne olacağı yazar." />
          <div className="aa-card is-tight">
            <div className="aa-form">
              <div className="f-wp">
                <div className="f-wp-top">
                  <span className="f-wp-title">Takım seçmeleri</span>
                  <span className="f-wp-step">Adım 1<span> / 2</span></span>
                </div>
                <div className="f-wp-segs">
                  <span className="f-seg"><span className="f-seg-fill" style={{ width: "100%" }} /></span>
                  <span className="f-seg is-next" />
                </div>
              </div>
              <h3 className="f-ftitle">Seçme başvurusu</h3>
              <div style={{ marginTop: 12 }}>
                <div className="f-q f-qsep">
                  <div className="f-q-in">
                    <div className="f-qhead">
                      <div className="f-qnum">2</div>
                      <p className="f-qtext">
                        Hangi takıma başvuruyorsunuz?
                        <span className="f-req">*</span>
                      </p>
                    </div>
                    <div className="f-qctl">
                      <span className="f-dd-btn">
                        <span>Frontend</span>
                        <ChevronsUpDown size={14} aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="f-ffoot">
                <div className="f-next">
                  <p className="f-next-k">Gönderdikten sonra</p>
                  <p className="f-next-v">
                    Ekip cevaplarınızı inceleyecek. Onaylanırsa sıradaki adımın bağlantısı e-postanıza gelir.
                  </p>
                </div>
                <span className="f-submit aa-send">Gönder</span>
                <p className="aa-who">
                  <b>Ayşe Yılmaz</b> olarak yanıtlıyorsunuz
                </p>
              </div>
            </div>
          </div>
        </div>

        <Connector className={linkClass(step, 1)}>
          <Mail size={15} aria-hidden="true" />
        </Connector>

        <div className={stepClass(step, 1)}>
          <StepHead n={2} title="Geri bildirim" caption="Cevaplarınızın bir kopyasıyla birlikte e-posta gelir." />
          <div className="aa-card">
            <MailHead time="14:32" subject="Cevabınızı aldık · Seçme başvurusu" />
            <div className="aa-mb">
              <MailBrand />
              <Context tone="ok" />
              <h4 className="aa-t">Cevabınızı aldık</h4>
              <p className="aa-p">
                Merhaba Ayşe, cevabınız bize ulaştı. Gönderdiklerinizin bir kopyasını aşağıya ekledik.
              </p>
              <p className="aa-row">
                <span>Gönderim tarihi</span>
                <b>{formatDay(0, MAIL_DATE)}, 14:32</b>
              </p>
              <p className="aa-lh">
                <b>Cevaplarınız</b>
                <span>3 soru</span>
              </p>
              <div className="aa-ans">
                <p><em>01</em>Adınız ve soyadınız</p>
                <div>Ayşe Yılmaz</div>
                <p><em>02</em>Hangi takıma başvuruyorsunuz?</p>
                <div>Frontend</div>
                <p><em>03</em>Web geliştirme deneyiminiz var mı?</p>
                <div>Evet</div>
              </div>
            </div>
          </div>
        </div>

        <Connector className={linkClass(step, 2)}>
          <Clock size={15} aria-hidden="true" />
        </Connector>

        <div className={stepClass(step, 2)}>
          <StepHead n={3} title="Ekip inceler" caption="Cevabınızın durumunu aynı bağlantıda görürsünüz." />
          <div className="aa-card is-tight">
            <p className="aa-url">
              <Lock size={10} aria-hidden="true" />
              forms.yildizskylab.com
            </p>
            <div className="aa-stc">
              <div className="f-st">
                <span className="f-st-ic is-wait">
                  <FileClock size={28} strokeWidth={1.5} aria-hidden="true" />
                </span>
                <p className="f-st-ctx">
                  Takım seçmeleri · <em>1. adım</em>
                </p>
                <h3 className="f-st-title">Başvurunuz inceleniyor</h3>
                <div className="f-st-body">
                  <ol className="f-jr">
                    <li className="f-jr-li">
                      <span className="f-jr-line" />
                      <span className="f-mark is-review">
                        <Clock size={12} strokeWidth={2.2} aria-hidden="true" />
                      </span>
                      <div>
                        <div className="f-jr-row">
                          <span className="f-jr-title">Seçme başvurusu</span>
                          <span className="f-jr-date">Bugün</span>
                        </div>
                        <p className="f-jr-detail">Gönderildi · inceleniyor</p>
                      </div>
                    </li>
                    <li className="f-jr-li">
                      <span className="f-mark is-future" />
                      <div>
                        <div className="f-jr-row">
                          <span className="f-jr-title is-future">Teknik görüşme</span>
                        </div>
                        <p className="f-jr-detail">Onaylanırsa bağlantısı e-postanıza gelir</p>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Connector className={linkClass(step, 3)}>
          <Mail size={15} aria-hidden="true" />
        </Connector>

        <div className={stepClass(step, 3)}>
          <StepHead n={4} title="Sonuç gelir" caption="Ekibin notunu hem e-postada hem de formun sayfasında görürsünüz." />
          <div className="aa-card">
            <MailHead time="16:05" subject={mail.subject} />
            <div className="aa-mb" key={out}>
              <MailBrand />
              <Context tone={ok ? "ok" : "neutral"} />
              <h4 className="aa-t">{mail.title}</h4>
              <p className="aa-p">{mail.body}</p>
              <p className="aa-row">
                <span>İnceleme tarihi</span>
                <b>{formatDay(0, MAIL_DATE)}, 16:05</b>
              </p>
              <div className="aa-note">
                <small>Ekibin notu</small>
                <p>{mail.note}</p>
              </div>
              {ok && (
                <p className="aa-cta">
                  <b>Sonraki adıma geç</b>
                  <span>→</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

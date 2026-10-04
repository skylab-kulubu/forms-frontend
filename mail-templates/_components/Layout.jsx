import { Html, Head, Body, Img } from '@react-email/components';
import React from 'react';

export const SITE = 'https://forms.yildizskylab.com';
const REPORT = 'mailto:info@yildizskylab.com?subject=Skylab%20Forms%20-%20Sorun%20Bildirimi';
const KVKK = 'https://skyl.app/kvkk-metni';
const DEVELOPER = 'https://github.com/fatiihnaz';

export const greeting = '{{if .firstName}}Merhaba {{.firstName}},{{else if .recipientName}}Merhaba {{.recipientName}},{{else}}Merhaba,{{end}}';
export const when = (cond, node) => <>{`{{if ${cond}}}`}{node}{'{{end}}'}</>;
export const whenKind = (kind, node) => when('eq .kind `' + kind + '`', node);

const PREVIEW_FILL = ' ‌'.repeat(90);

const FONT = "'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif";

export const colors = {
  primary: '#171717',
  body: '#525252',
  muted: '#737373',
  faint: '#a3a3a3',
  hair: '#ebebeb',
  link: '#8f5e98',
};

export const tones = {
  ok: '#059669',
  wait: '#d97706',
  bad: '#dc2626',
  neutral: '#a3a3a3',
  brand: '#ae7eb6',
};

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600&display=swap');
  @media (prefers-color-scheme: dark) {
    .bg { background-color: #0a0a0a !important; }
    .t-primary { color: #fafafa !important; }
    .t-body { color: #a3a3a3 !important; }
    .t-muted { color: #737373 !important; }
    .t-faint { color: #525252 !important; }
    .t-link { color: #ebd5ee !important; }
    .hair { border-color: #262626 !important; }
    .note { border-left-color: #404040 !important; }
    .card { background-color: #141414 !important; border-color: #262626 !important; }
    .tone-ok { color: #34d399 !important; }
    .tone-wait { color: #fbbf24 !important; }
    .tone-bad { color: #fca5a5 !important; }
    .tone-neutral { color: #525252 !important; }
    .tone-brand { color: #ebd5ee !important; }
    .logo-light { display: none !important; }
    .logo-dark { display: inline-block !important; max-height: none !important; }
  }
  @media (max-width: 480px) {
    .shell { padding: 28px 20px 24px !important; }
  }
`;

function Brand() {
  return (
    <table role="presentation" cellPadding="0" cellSpacing="0" border={0}>
      <tbody>
        <tr>
          <td style={{ paddingRight: '8px', lineHeight: 0 }}>
            <a href={SITE} style={{ display: 'inline-block', lineHeight: 0, textDecoration: 'none' }}>
              <Img className="logo-light" src={SITE + '/mail/skylab-ink.png'} width="20" height="19" alt="SKY LAB" style={{ display: 'inline-block', border: 0 }} />
              <Img className="logo-dark" src={SITE + '/mail/skylab-lilac.png'} width="20" height="19" alt="" style={{ display: 'none', maxHeight: 0, overflow: 'hidden', border: 0, msoHide: 'all' }} />
            </a>
          </td>
          <td>
            <a href={SITE} className="t-primary" style={{ fontSize: '13px', lineHeight: '19px', fontWeight: 600, color: colors.primary, textDecoration: 'none' }}>SKY LAB Forms</a>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

function Footer({ reason }) {
  return (
    <div style={{ marginTop: '48px' }}>
      <p className="t-faint" style={{ margin: 0, fontSize: '12px', lineHeight: '18px', color: colors.faint }}>{reason}</p>
      <p className="t-faint" style={{ margin: '8px 0 0', fontSize: '12px', lineHeight: '18px', color: colors.faint }}>
        <a href={REPORT} className="t-muted" style={{ color: colors.muted, textDecoration: 'none' }}>Sorun bildir</a>
        {'  ·  '}
        <a href={KVKK} className="t-muted" style={{ color: colors.muted, textDecoration: 'none' }}>KVKK metni</a>
      </p>
      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ width: '100%', marginTop: '24px' }}>
        <tbody>
          <tr>
            <td className="t-faint" style={{ fontSize: '11px', lineHeight: '16px', color: colors.faint }}>
              <a href={SITE} className="t-muted" style={{ color: colors.muted, fontWeight: 600, textDecoration: 'none' }}>SKY LAB Forms</a> by WEBLAB
            </td>
            <td align="right" style={{ paddingLeft: '12px', fontSize: '11px', lineHeight: '16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
              <a href={DEVELOPER} className="t-faint" style={{ color: colors.faint, textDecoration: 'none' }}>Developed by Fatih Naz</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export function Layout({ preview, reason, children }) {
  return (
    <Html lang="tr" dir="ltr">
      <Head>
        <meta name="color-scheme" content="light dark" />
        <meta name="supported-color-schemes" content="light dark" />
        <style>{CSS}</style>
      </Head>
      <Body className="bg" style={{ margin: 0, padding: 0, backgroundColor: '#ffffff', fontFamily: FONT }}>
        <div style={{ display: 'none', overflow: 'hidden', lineHeight: '1px', opacity: 0, maxHeight: 0, maxWidth: 0, msoHide: 'all' }}>
          {preview}
          {PREVIEW_FILL}
        </div>
        <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} className="bg" style={{ width: '100%', backgroundColor: '#ffffff' }}>
          <tbody>
            <tr>
              <td align="center">
                <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ maxWidth: '520px', width: '100%' }}>
                  <tbody>
                    <tr>
                      <td className="shell" style={{ padding: '40px 24px 32px', fontFamily: FONT, textAlign: 'left' }}>
                        <Brand />
                        <div style={{ paddingTop: '32px' }}>{children}</div>
                        <Footer reason={reason} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table>
      </Body>
    </Html>
  );
}

export function Context({ tone, children }) {
  return (
    <p className="t-muted" style={{ margin: 0, fontSize: '13px', lineHeight: '20px', color: colors.muted }}>
      <span className={'tone-' + tone} style={{ color: tones[tone], fontSize: '10px', lineHeight: '20px', paddingRight: '6px' }}>●</span>
      {children}
    </p>
  );
}

export function Title({ children }) {
  return (
    <h1 className="t-primary" style={{ margin: '6px 0 0', fontSize: '22px', lineHeight: '30px', fontWeight: 600, letterSpacing: '-0.01em', color: colors.primary }}>
      {children}
    </h1>
  );
}

export function Paragraph({ children }) {
  return <p className="t-body" style={{ margin: '12px 0 0', fontSize: '15px', lineHeight: '24px', color: colors.body }}>{children}</p>;
}

export function Strong({ children }) {
  return <span className="t-primary" style={{ color: colors.primary, fontWeight: 500 }}>{children}</span>;
}

export function Rows({ children }) {
  return (
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ width: '100%', marginTop: '24px', borderCollapse: 'collapse' }}>
      <tbody>{children}</tbody>
    </table>
  );
}

export function RowItem({ label, children }) {
  return (
    <tr>
      <td className="hair t-muted" style={{ borderTop: `1px solid ${colors.hair}`, padding: '10px 0', fontSize: '13px', lineHeight: '20px', color: colors.muted, verticalAlign: 'top' }}>{label}</td>
      <td className="hair t-primary" align="right" style={{ borderTop: `1px solid ${colors.hair}`, padding: '10px 0 10px 16px', fontSize: '13px', lineHeight: '20px', color: colors.primary, fontWeight: 500, textAlign: 'right', verticalAlign: 'top' }}>{children}</td>
    </tr>
  );
}

export function RowsEnd() {
  return (
    <tr>
      <td colSpan={2} className="hair" style={{ borderTop: `1px solid ${colors.hair}`, fontSize: 0, lineHeight: 0, height: '1px' }}>&nbsp;</td>
    </tr>
  );
}

export function Note({ label, empty = false, children }) {
  const text = empty
    ? { className: 't-faint', color: colors.faint }
    : { className: 't-primary', color: colors.primary };
  return (
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ width: '100%', marginTop: '24px' }}>
      <tbody>
        <tr>
          <td className="note" style={{ borderLeft: '2px solid #e5e5e5', paddingLeft: '12px' }}>
            <p className="t-muted" style={{ margin: 0, fontSize: '12px', lineHeight: '18px', color: colors.muted }}>{label}</p>
            <p className={text.className} style={{ margin: '2px 0 0', fontSize: '14px', lineHeight: '22px', color: text.color, whiteSpace: 'pre-wrap' }}>{children}</p>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function Cta({ href, children }) {
  const link = { display: 'block', padding: '13px 16px', fontSize: '14px', lineHeight: '20px', textDecoration: 'none' };
  return (
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ width: '100%', marginTop: '28px', borderCollapse: 'separate' }}>
      <tbody>
        <tr>
          <td className="card" style={{ border: '1px solid #e5e5e5', borderRadius: '8px', backgroundColor: '#fafafa', padding: 0 }}>
            <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td><a href={href} className="t-primary" style={{ ...link, fontWeight: 500, color: colors.primary }}>{children}</a></td>
                  <td align="right" width="48" style={{ width: '48px', textAlign: 'right' }}><a href={href} className="t-link" style={{ ...link, color: colors.link }}>→</a></td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

export function ListHeader({ title, count }) {
  return (
    <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ width: '100%', marginTop: '32px' }}>
      <tbody>
        <tr>
          <td className="t-primary" style={{ paddingBottom: '8px', fontSize: '13px', lineHeight: '20px', fontWeight: 500, color: colors.primary }}>{title}</td>
          <td className="t-muted" align="right" style={{ paddingBottom: '8px', fontSize: '12px', lineHeight: '20px', color: colors.muted, textAlign: 'right' }}>{count}</td>
        </tr>
      </tbody>
    </table>
  );
}

import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Img,
  Link,
  Tailwind,
  Preview,
  Row,
  Column,
} from '@react-email/components';
import React from 'react';

export default function FormSubmissionEmail() {
  const darkBg = [
    'radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,0.35), transparent 50%)',
    'radial-gradient(1px 1px at 28% 62%, rgba(255,255,255,0.28), transparent 50%)',
    'radial-gradient(1.4px 1.4px at 62% 8%, rgba(224,200,229,0.45), transparent 50%)',
    'radial-gradient(1px 1px at 80% 46%, rgba(255,255,255,0.30), transparent 50%)',
    'radial-gradient(1px 1px at 92% 78%, rgba(255,255,255,0.22), transparent 50%)',
    'radial-gradient(1.2px 1.2px at 44% 88%, rgba(224,200,229,0.32), transparent 50%)',
    'radial-gradient(1px 1px at 18% 92%, rgba(255,255,255,0.22), transparent 50%)',
    'radial-gradient(ellipse 620px 380px at 50% -4%, rgba(224,200,229,0.16), transparent 62%)',
    'radial-gradient(1200px 760px at 80% 0%, rgba(224,200,229,0.10), transparent 60%)',
    'radial-gradient(900px 700px at 6% 100%, rgba(170,140,200,0.06), transparent 60%)',
  ].join(', ');

  return (
    <Html lang="tr">
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                skylab: {
                  300: '#f3e8f5',
                  400: '#ebd5ee',
                  500: '#e0c8e5',
                  600: '#c8a4ce',
                  700: '#ae7eb6',
                  800: '#8f5e98',
                  900: '#6e4576',
                },
                ink: '#08070b',
              },
              fontFamily: {
                sans: ['Space Grotesk', 'Helvetica', 'Arial', 'sans-serif'],
              },
            },
          },
        }}
      >
        <Head>
          <meta name="color-scheme" content="light dark" />
          <meta name="supported-color-schemes" content="light dark" />
          <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap');
            
            /* SADECE KARANLIK MOD ICIN OVERRIDE'LAR */
            @media (prefers-color-scheme: dark) {
              .email-bg    { background-color: #08070b !important; background-image: ${darkBg} !important; }
              .card        { background-color: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.1) !important; }
              .t-primary   { color: #ffffff !important; }
              .t-body      { color: #d4d4d4 !important; } /* text-neutral-300 karşılığı */
              .t-muted     { color: #737373 !important; } /* text-neutral-500 karşılığı */
              .t-faint     { color: #525252 !important; } /* text-neutral-600 karşılığı */
              .t-num       { color: #c8a4ce !important; } /* text-skylab-600 */
              .t-brand     { color: #efe3fe !important; }
              .dev-link    { color: rgba(212,212,212,0.5) !important; }
              .divider     { border-top-color: rgba(255,255,255,0.10) !important; border-bottom-color: rgba(255,255,255,0.10) !important; }
              .badge-outer { border-color: rgba(224,200,229,0.20) !important; background-image: radial-gradient(circle at 50% 38%, rgba(224,200,229,0.10), transparent 72%) !important; }
              .badge-inner { border-color: rgba(235,213,238,0.25) !important; background-color: rgba(224,200,229,0.16) !important; background-image: linear-gradient(180deg, rgba(235,213,238,0.22), rgba(174,126,182,0.14)) !important; color: #f3e8f5 !important; }
            }
            
            .brand-link:hover { opacity:0.85; }
            .dev-link:hover   { color:#e0c8e5 !important; }
            .legal-link:hover { opacity:0.8; }
          `}</style>
        </Head>
        <Preview>Yanıtınız "{'{{.formTitle}}'}" formuna başarıyla iletildi.</Preview>

        <Body
          className="email-bg font-sans"
          // Varsayılan stiller (Light Mode) olarak güncellendi
          style={{ margin: 0, padding: 0, backgroundColor: '#f4f1f7', backgroundImage: 'none' }}
        >
          <table
            role="presentation"
            width="100%"
            cellPadding="0"
            cellSpacing="0"
            border={0}
            className="email-bg"
            style={{ width: '100%', backgroundColor: '#f4f1f7', backgroundImage: 'none' }}
          >
            <tbody>
              <tr>
                <td align="center" className="py-12" style={{ padding: '48px 0' }}>
                  <Container className="mx-auto max-w-[600px] px-6">
                    <Section className="mt-2 mb-8 text-center">
                      <Img
                        src="https://forms.yildizskylab.com/skylab.svg"
                        width="56"
                        height="53"
                        alt="SKY LAB"
                        className="mx-auto"
                      />
                    </Section>

                    <Section
                      className="card rounded-3xl border border-solid px-8 py-10"
                      // Varsayılan (Light Mode) kart stilleri
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.62)',
                        borderColor: 'rgba(143,94,152,0.18)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                      }}
                    >
                      <Row>
                        <Column className="align-middle">
                          {/* Yazılar default olarak Light Mode renklerinde (t-primary vs sınıflarıyla destekleniyor) */}
                          <Heading className="t-primary m-0 text-left text-2xl font-bold tracking-tight" style={{ color: '#1b1620' }}>
                            Yanıtınız Alındı
                          </Heading>
                        </Column>
                        <Column className="w-[66px] align-middle" style={{ width: '66px' }}>
                          <table role="presentation" align="right" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto' }}>
                            <tbody>
                              <tr>
                                <td
                                  className="badge-outer"
                                  align="center"
                                  valign="middle"
                                  style={{
                                    width: '66px',
                                    height: '66px',
                                    borderRadius: '9999px',
                                    border: '1px solid rgba(143,94,152,0.25)',
                                    backgroundImage: 'radial-gradient(circle at 50% 38%, rgba(143,94,152,0.12), transparent 72%)',
                                  }}
                                >
                                  <table role="presentation" align="center" cellPadding="0" cellSpacing="0" style={{ margin: '0 auto' }}>
                                    <tbody>
                                      <tr>
                                        <td
                                          className="badge-inner"
                                          align="center"
                                          valign="middle"
                                          style={{
                                            width: '46px',
                                            height: '46px',
                                            borderRadius: '9999px',
                                            border: '1px solid rgba(143,94,152,0.30)',
                                            backgroundColor: '#ece3ef',
                                            backgroundImage: 'linear-gradient(180deg,#f0e6f2,#dcc6e0)',
                                            color: '#6e4576',
                                            fontSize: '22px',
                                            lineHeight: '46px',
                                            fontWeight: 600,
                                          }}
                                        >
                                          ✓
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </Column>
                      </Row>

                      <Text className="t-body mt-3.5 mb-0 text-left text-[15px] leading-7" style={{ color: '#4a4253' }}>
                        Merhaba {'{{.recipientName}}'}, <strong className="t-primary" style={{ color: '#1b1620' }}>{'{{.formTitle}}'}</strong> formuna
                        gönderdiğiniz yanıt bize ulaştı. Katılımınız için teşekkür ederiz.
                      </Text>

                      <Section className="mt-7">
                        <Row
                          className="divider border-0 border-t border-solid"
                          style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}
                        >
                          <Column className="py-3 align-baseline">
                            <Text className="t-muted m-0 text-[11px] uppercase tracking-[0.12em]" style={{ color: '#8a8194' }}>
                              Form
                            </Text>
                          </Column>
                          <Column className="py-3 text-right align-baseline">
                            <Text className="t-primary m-0 text-right text-sm font-medium" style={{ color: '#1b1620' }}>
                              {'{{.formTitle}}'}
                            </Text>
                          </Column>
                        </Row>
                        <Row
                          className="divider border-0 border-t border-b border-solid"
                          style={{
                            borderTop: '1px solid rgba(0,0,0,0.08)',
                            borderBottom: '1px solid rgba(0,0,0,0.08)',
                          }}
                        >
                          <Column className="py-3 align-baseline">
                            <Text className="t-muted m-0 text-[11px] uppercase tracking-[0.12em]" style={{ color: '#8a8194' }}>
                              Gönderim Tarihi
                            </Text>
                          </Column>
                          <Column className="py-3 text-right align-baseline">
                            <Text className="t-primary m-0 text-right text-sm font-medium" style={{ color: '#1b1620' }}>
                              {'{{.submittedAt}}'}
                            </Text>
                          </Column>
                        </Row>
                      </Section>

                      <Section className="mt-7">
                        <Row className="mb-1">
                          <Column>
                            <Heading className="t-muted m-0 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: '#8a8194' }}>
                              Yanıtlarınız
                            </Heading>
                          </Column>
                          <Column className="text-right">
                            <Text className="t-muted m-0 text-[11px] font-medium" style={{ color: '#8a8194' }}>
                              {'{{len .answers}}'} soru
                            </Text>
                          </Column>
                        </Row>

                        {'{{range $index, $answer := .answers}}'}
                        <table
                          role="presentation"
                          width="100%"
                          align="left"
                          cellPadding="0"
                          cellSpacing="0"
                          border={0}
                          className="divider"
                          style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            borderTop: '1px solid rgba(0,0,0,0.08)',
                          }}
                        >
                          <tbody>
                            <tr>
                              <td align="left" style={{ textAlign: 'left', paddingTop: '16px', paddingBottom: '16px' }}>
                                <Text
                                  className="t-muted m-0 text-[13px] font-medium leading-5"
                                  style={{ textAlign: 'left', color: '#8a8194' }}
                                >
                                  <span
                                    className="t-num font-semibold"
                                    style={{ marginRight: '12px', fontVariantNumeric: 'tabular-nums', color: '#8f5e98' }}
                                  >
                                    {'{{printf `%02d` (add1 $index)}}'}
                                  </span>
                                  {'{{.question}}'}
                                </Text>
                                <Text
                                  className="t-primary m-0 mt-2 text-[15px] font-medium leading-6"
                                  style={{ textAlign: 'left', color: '#1b1620' }}
                                >
                                  {'{{if .answer}}{{.answer}}{{else}}'}
                                  <span className="t-faint font-normal italic" style={{ color: '#a59cae' }}>Boş bırakıldı</span>
                                  {'{{end}}'}
                                </Text>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                        {'{{end}}'}
                      </Section>
                    </Section>

                    <Section className="mt-8 text-center">
                      <table role="presentation" align="center" cellPadding="0" cellSpacing="0" style={{ margin: '0 auto' }}>
                        <tbody>
                          <tr>
                            <td valign="middle" style={{ paddingRight: '7px', lineHeight: '0' }}>
                              <Link href="https://forms.yildizskylab.com" className="brand-link" style={{ textDecoration: 'none' }}>
                                <Img
                                  src="https://forms.yildizskylab.com/skylab.svg"
                                  width="20"
                                  height="20"
                                  alt="SKY LAB"
                                  style={{ display: 'inline-block', verticalAlign: 'middle' }}
                                />
                              </Link>
                            </td>
                            <td valign="middle" style={{ paddingRight: '8px' }}>
                              <Link href="https://forms.yildizskylab.com" className="brand-link" style={{ textDecoration: 'none' }}>
                                <span
                                  className="t-brand"
                                  style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#8f5e98' }}
                                >
                                  SKY LAB Forms
                                </span>
                              </Link>
                            </td>
                            <td valign="middle">
                              <span className="t-faint" style={{ fontSize: '13px', color: '#a59cae' }}>by WEBLAB</span>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <Text className="m-0 mt-1" style={{ textAlign: 'center' }}>
                        <Link
                          href="https://github.com/fatiihnaz"
                          className="dev-link"
                          style={{ fontSize: '10px', color: '#6e6577', textDecoration: 'none' }}
                        >
                          Developed by Fatih Naz
                        </Link>
                      </Text>

                      <table role="presentation" align="center" cellPadding="0" cellSpacing="0" style={{ margin: '14px auto 0' }}>
                        <tbody>
                          <tr>
                            <td valign="middle" style={{ padding: '0 10px' }}>
                              <Link href="https://skyl.app/kvkk-metni" className="t-muted legal-link" style={{ fontSize: '11px', color: '#8a8194', textDecoration: 'none' }}>
                                Kullanım Koşulları
                              </Link>
                            </td>
                            <td valign="middle" style={{ lineHeight: '0' }}>
                              <span className="t-faint" style={{ display: 'inline-block', width: '3px', height: '3px', borderRadius: '9999px', backgroundColor: '#a59cae', verticalAlign: 'middle' }}></span>
                            </td>
                            <td valign="middle" style={{ padding: '0 10px' }}>
                              <Link href="https://skyl.app/kvkk-metni" className="t-muted legal-link" style={{ fontSize: '11px', color: '#8a8194', textDecoration: 'none' }}>
                                Gizlilik Politikası
                              </Link>
                            </td>
                            <td valign="middle" style={{ lineHeight: '0' }}>
                              <span className="t-faint" style={{ display: 'inline-block', width: '3px', height: '3px', borderRadius: '9999px', backgroundColor: '#a59cae', verticalAlign: 'middle' }}></span>
                            </td>
                            <td valign="middle" style={{ padding: '0 10px' }}>
                              <Link
                                href="mailto:info@yildizskylab.com?subject=Skylab%20Forms%20-%20Sorun%20Bildirimi"
                                className="t-muted legal-link"
                                style={{ fontSize: '11px', color: '#8a8194', textDecoration: 'none' }}
                              >
                                Sorun Bildir
                              </Link>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </Section>
                  </Container>
                </td>
              </tr>
            </tbody>
          </table>
        </Body>
      </Tailwind>
    </Html>
  );
}
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
  Button,
  Tailwind,
  Preview,
  Row,
  Column,
} from '@react-email/components';
import React from 'react';

export default function PendingReminderEmail() {
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
                  300: '#f3e8f5', 400: '#ebd5ee', 500: '#e0c8e5', 600: '#c8a4ce',
                  700: '#ae7eb6', 800: '#8f5e98', 900: '#6e4576',
                },
                ink: '#08070b',
              },
              fontFamily: { sans: ['Space Grotesk', 'Helvetica', 'Arial', 'sans-serif'] },
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
              .t-body      { color: #d4d4d4 !important; }
              .t-muted     { color: #737373 !important; }
              .t-faint     { color: #525252 !important; }
              .t-brand     { color: #efe3fe !important; }
              .dev-link    { color: rgba(212,212,212,0.5) !important; }
              .divider     { border-top-color: rgba(255,255,255,0.07) !important; }
              
              .badge-ring  { border-color: rgba(224,200,229,0.20) !important; background-image: radial-gradient(circle at 50% 38%, rgba(224,200,229,0.10), transparent 72%) !important; }
              .badge-core  { border-color: rgba(235,213,238,0.25) !important; background-color: rgba(224,200,229,0.16) !important; background-image: linear-gradient(180deg, rgba(235,213,238,0.22), rgba(174,126,182,0.14)) !important; color: #f3e8f5 !important; }
              
              .count-chip  { background-color: rgba(224,200,229,0.12) !important; border-color: rgba(224,200,229,0.28) !important; color: #f3e8f5 !important; }
              .cta         { background-color: rgba(235,213,238,0.40) !important; border-color: rgba(243,232,245,0.50) !important; color: #f3e8f5 !important; }
            }
            
            .brand-link:hover { opacity:0.85; }
            .dev-link:hover   { color:#e0c8e5 !important; }
            .legal-link:hover { opacity:0.8; }
            .cta:hover        { background-color:rgba(251,207,232,0.55) !important; }
          `}</style>
        </Head>
        <Preview>İncelemeni bekleyen {'{{.totalPending}}'} yanıt var.</Preview>

        <Body
          className="email-bg font-sans"
          // Light Mode Varsayılan Arka Plan Stilleri
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
                <td align="center" style={{ padding: '48px 0' }}>
                  <Container className="mx-auto max-w-[600px] px-6">
                    <Section className="mt-2 mb-8 text-center">
                      <Img src="https://forms.yildizskylab.com/skylab.svg" width="56" height="53" alt="SKY LAB" className="mx-auto" />
                    </Section>

                    <Section
                      className="card rounded-3xl border border-solid px-8 py-10"
                      // Light Mode Varsayılan Kart Stilleri
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.62)',
                        borderColor: 'rgba(143,94,152,0.18)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                      }}
                    >
                      <Row>
                        <Column className="align-middle">
                          <Heading className="t-primary m-0 text-left text-2xl font-bold tracking-tight" style={{ color: '#1b1620' }}>
                            İnceleme Bekliyor
                          </Heading>
                        </Column>
                        <Column className="align-middle" style={{ width: '66px' }}>
                          <table role="presentation" align="right" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto' }}>
                            <tbody>
                              <tr>
                                <td
                                  className="badge-ring"
                                  align="center"
                                  valign="middle"
                                  style={{
                                    width: '66px', height: '66px', borderRadius: '9999px',
                                    // Light Mode Varsayılan Dış Çember Stili
                                    border: '1px solid rgba(143,94,152,0.30)',
                                    backgroundImage: 'radial-gradient(circle at 50% 38%, rgba(143,94,152,0.12), transparent 72%)',
                                  }}
                                >
                                  <table role="presentation" align="center" cellPadding="0" cellSpacing="0" style={{ margin: '0 auto' }}>
                                    <tbody>
                                      <tr>
                                        <td
                                          className="badge-core"
                                          align="center"
                                          valign="middle"
                                          style={{
                                            width: '46px', height: '46px', borderRadius: '9999px',
                                            // Light Mode Varsayılan İç Çember Stili
                                            border: '1px solid rgba(143,94,152,0.30)',
                                            backgroundColor: '#ece3ef',
                                            backgroundImage: 'linear-gradient(180deg,#f0e6f2,#dcc6e0)',
                                            color: '#6e4576', 
                                            fontSize: '22px', lineHeight: '46px', fontWeight: 700,
                                          }}
                                        >
                                          {'{{.totalPending}}'}
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
                        Merhaba {'{{.recipientName}}'}, incelemeni bekleyen{' '}
                        <strong className="t-primary" style={{ color: '#1b1620' }}>{'{{.totalPending}}'} yanıt</strong> var. Aşağıdaki formları
                        gözden geçirebilirsin.
                      </Text>

                      <Section className="mt-7">
                        <Row className="mb-1">
                          <Column>
                            <Heading className="t-muted m-0 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: '#8a8194' }}>
                              Bekleyen Formlar
                            </Heading>
                          </Column>
                          <Column className="text-right">
                            <Text className="t-muted m-0 text-[11px] font-medium" style={{ color: '#8a8194' }}>
                              {'{{len .forms}}'} form
                            </Text>
                          </Column>
                        </Row>

                        {'{{range .forms}}'}
                        <Row className="divider" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                          <Column className="py-3.5 align-middle">
                            <Text className="m-0 text-left text-[15px] font-medium leading-6">
                              <Link
                                href={'https://forms.yildizskylab.com/forms/' + '{{.formId}}' + '/responses'}
                                className="t-primary no-underline"
                                style={{ color: '#1b1620' }}
                              >
                                {'{{.formTitle}}'}
                              </Link>
                            </Text>
                          </Column>
                          <Column className="py-3.5 text-right align-middle" style={{ width: '110px' }}>
                            <table role="presentation" align="right" cellPadding="0" cellSpacing="0" style={{ marginLeft: 'auto' }}>
                              <tbody>
                                <tr>
                                  <td
                                    className="count-chip"
                                    style={{
                                      padding: '4px 11px', borderRadius: '9999px',
                                      // Light Mode Varsayılan Sayaç Çipi
                                      backgroundColor: '#ece3ef',
                                      border: '1px solid rgba(143,94,152,0.30)',
                                      color: '#6e4576', 
                                      fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap',
                                    }}
                                  >
                                    {'{{.pendingCount}}'} bekliyor
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </Column>
                        </Row>
                        {'{{end}}'}
                      </Section>

                      <Section className="mt-7 text-center">
                        <Button
                          href="https://forms.yildizskylab.com/admin/pending"
                          className="cta"
                          // Light Mode Varsayılan Buton Stili
                          style={{
                            display: 'inline-block',
                            borderRadius: '12px',
                            padding: '12px 32px',
                            fontSize: '14px',
                            fontWeight: 600,
                            color: '#6e4576',
                            backgroundColor: 'rgba(143,94,152,0.14)',
                            border: '1.5px solid rgba(143,94,152,0.45)',
                            textDecoration: 'none',
                          }}
                        >
                          Tümünü İncele
                        </Button>
                      </Section>
                    </Section>

                    <Section className="mt-8 text-center">
                      <table role="presentation" align="center" cellPadding="0" cellSpacing="0" style={{ margin: '0 auto' }}>
                        <tbody>
                          <tr>
                            <td valign="middle" style={{ paddingRight: '7px', lineHeight: '0' }}>
                              <Link href="https://forms.yildizskylab.com" className="brand-link" style={{ textDecoration: 'none' }}>
                                <Img src="https://forms.yildizskylab.com/skylab.svg" width="20" height="20" alt="SKY LAB" style={{ display: 'inline-block', verticalAlign: 'middle' }} />
                              </Link>
                            </td>
                            <td valign="middle" style={{ paddingRight: '8px' }}>
                              <Link href="https://forms.yildizskylab.com" className="brand-link" style={{ textDecoration: 'none' }}>
                                <span className="t-brand" style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#8f5e98' }}>
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
                        <Link href="https://github.com/fatiihnaz" className="dev-link" style={{ fontSize: '10px', color: '#6e6577', textDecoration: 'none' }}>
                          Developed by Fatih Naz
                        </Link>
                      </Text>

                      <table role="presentation" align="center" cellPadding="0" cellSpacing="0" style={{ margin: '14px auto 0' }}>
                        <tbody>
                          <tr>
                            <td valign="middle" style={{ padding: '0 10px' }}>
                              <Link href="https://skyl.app/kvkk-metni" className="t-muted legal-link" style={{ fontSize: '11px', color: '#8a8194', textDecoration: 'none' }}>Kullanım Koşulları</Link>
                            </td>
                            <td valign="middle" style={{ lineHeight: '0' }}>
                              <span style={{ display: 'inline-block', width: '3px', height: '3px', borderRadius: '9999px', backgroundColor: '#a59cae', verticalAlign: 'middle' }}></span>
                            </td>
                            <td valign="middle" style={{ padding: '0 10px' }}>
                              <Link href="https://skyl.app/kvkk-metni" className="t-muted legal-link" style={{ fontSize: '11px', color: '#8a8194', textDecoration: 'none' }}>Gizlilik Politikası</Link>
                            </td>
                            <td valign="middle" style={{ lineHeight: '0' }}>
                              <span style={{ display: 'inline-block', width: '3px', height: '3px', borderRadius: '9999px', backgroundColor: '#a59cae', verticalAlign: 'middle' }}></span>
                            </td>
                            <td valign="middle" style={{ padding: '0 10px' }}>
                              <Link href="mailto:info@yildizskylab.com?subject=Skylab%20Forms%20-%20Sorun%20Bildirimi" className="t-muted legal-link" style={{ fontSize: '11px', color: '#8a8194', textDecoration: 'none' }}>Sorun Bildir</Link>
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
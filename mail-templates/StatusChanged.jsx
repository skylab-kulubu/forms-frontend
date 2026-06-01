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

export default function StatusChangedEmail() {
  const A = '{{if eq .status `approved`}}';
  const E = '{{else}}';
  const Z = '{{end}}';
  const cond = (a, d) => A + a + E + d + Z;
  const statusClass = A + 'status-approved' + E + 'status-declined' + Z;

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
            
            /* SADECE KARANLIK MOD (DARK MODE) ICIN OVERRIDE'LAR */
            @media (prefers-color-scheme: dark) {
              .email-bg    { background-color: #08070b !important; background-image: ${darkBg} !important; }
              .card        { background-color: rgba(255,255,255,0.04) !important; border-color: rgba(255,255,255,0.1) !important; }
              .t-primary   { color: #ffffff !important; }
              .t-body      { color: #d4d4d4 !important; }
              .t-muted     { color: #737373 !important; }
              .t-faint     { color: #525252 !important; }
              .t-brand     { color: #efe3fe !important; }
              .dev-link    { color: rgba(212,212,212,0.5) !important; }
              .divider     { border-top-color: rgba(255,255,255,0.10) !important; border-bottom-color: rgba(255,255,255,0.10) !important; }
              .note-box    { background-color: rgba(255,255,255,0.03) !important; }
              .cta         { background-color: rgba(235,213,238,0.40) !important; border-color: rgba(243,232,245,0.50) !important; color: #f3e8f5 !important; }

              /* Status Specific Overrides for Dark Mode */
              .status-approved .badge-ring  { border-color: rgba(224,200,229,0.20) !important; background-image: radial-gradient(circle at 50% 38%, rgba(224,200,229,0.10), transparent 72%) !important; }
              .status-approved .badge-core  { border-color: rgba(235,213,238,0.25) !important; background-color: rgba(224,200,229,0.16) !important; background-image: linear-gradient(180deg, rgba(235,213,238,0.22), rgba(174,126,182,0.14)) !important; color: #f3e8f5 !important; }
              .status-approved .status-chip { background-color: rgba(224,200,229,0.12) !important; border-color: rgba(224,200,229,0.30) !important; color: #f3e8f5 !important; }
              .status-approved .note-accent { border-left-color: #ae7eb6 !important; }

              .status-declined .badge-ring  { border-color: rgba(229,200,205,0.22) !important; background-image: radial-gradient(circle at 50% 38%, rgba(229,200,205,0.12), transparent 72%) !important; }
              .status-declined .badge-core  { border-color: rgba(238,213,217,0.28) !important; background-color: rgba(229,200,205,0.16) !important; background-image: linear-gradient(180deg, rgba(238,213,217,0.20), rgba(182,126,140,0.16)) !important; color: #f3e8ea !important; }
              .status-declined .status-chip { background-color: rgba(229,200,205,0.12) !important; border-color: rgba(229,200,205,0.30) !important; color: #f3e8ea !important; }
              .status-declined .note-accent { border-left-color: #c0848f !important; }
            }
            .brand-link:hover { opacity:0.85; }
            .dev-link:hover   { color:#e0c8e5 !important; }
            .legal-link:hover { opacity:0.8; }
            .cta:hover        { background-color:rgba(251,207,232,0.55) !important; }
          `}</style>
        </Head>
        <Preview>
          {'"'}{'{{.formTitle}}'}{'" başvurunuz '}{cond('onaylandı.', 'hakkında bir güncelleme var.')}
        </Preview>

        <Body
          className="email-bg font-sans"
          // Varsayılan Light Mode Arka Planı
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
                      className={'card rounded-3xl border border-solid px-8 py-10 ' + statusClass}
                      // Varsayılan Light Mode Kart Stili
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
                            {cond('Başvurunuz Onaylandı', 'Başvurunuz Sonuçlandı')}
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
                                    // Light Mode Koşullu Stiller
                                    border: '1px solid ' + cond('rgba(143,94,152,0.30)', 'rgba(176,107,120,0.30)'),
                                    backgroundImage:
                                      'radial-gradient(circle at 50% 38%, ' +
                                      cond('rgba(143,94,152,0.12)', 'rgba(176,107,120,0.12)') +
                                      ', transparent 72%)',
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
                                            // Light Mode Koşullu Stiller
                                            border: '1px solid ' + cond('rgba(143,94,152,0.30)', 'rgba(176,107,120,0.32)'),
                                            backgroundColor: cond('#ece3ef', '#f3e3e5'),
                                            backgroundImage: cond(
                                              'linear-gradient(180deg,#f0e6f2,#dcc6e0)',
                                              'linear-gradient(180deg,#f6e7e9,#e3c4c9)'
                                            ),
                                            color: cond('#6e4576', '#9e5560'),
                                            fontSize: '22px', lineHeight: '46px', fontWeight: 600,
                                          }}
                                        >
                                          {cond('✓', '✕')}
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
                        Merhaba {'{{.recipientName}}'}, <strong className="t-primary" style={{ color: '#1b1620' }}>{'{{.formTitle}}'}</strong> başvurunuzun
                        durumu güncellendi.
                      </Text>

                      <Section className="mt-4">
                        <table role="presentation" cellPadding="0" cellSpacing="0">
                          <tbody>
                            <tr>
                              <td
                                className="status-chip"
                                style={{
                                  padding: '5px 13px', borderRadius: '9999px',
                                  // Light Mode Koşullu Stiller
                                  backgroundColor: cond('#ece3ef', '#f3e3e5'),
                                  border: '1px solid ' + cond('rgba(143,94,152,0.30)', 'rgba(176,107,120,0.30)'),
                                  color: cond('#6e4576', '#9e5560'),
                                  fontSize: '12px', fontWeight: 600, letterSpacing: '0.02em',
                                }}
                              >
                                {cond('Onaylandı', 'Reddedildi')}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </Section>

                      {'{{if .reviewNote}}'}
                      <Section className="mt-6">
                        <Heading className="t-muted m-0 mb-2 text-[11px] font-bold uppercase tracking-[0.14em]" style={{ color: '#8a8194' }}>
                          İnceleme Notu
                        </Heading>
                        <Section
                          className="note-box note-accent rounded-xl px-5 py-4"
                          // Light Mode Varsayılan Stili
                          style={{
                            backgroundColor: 'rgba(143,94,152,0.06)',
                            borderLeft: '3px solid ' + cond('#8f5e98', '#b06b78'),
                          }}
                        >
                          <Text className="t-primary m-0 text-left text-[15px] leading-6" style={{ textAlign: 'left', color: '#1b1620' }}>
                            {'{{.reviewNote}}'}
                          </Text>
                        </Section>
                      </Section>
                      {'{{end}}'}

                      <Section className="mt-6">
                        <Row className="divider" style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                          <Column className="py-3">
                            <Text className="t-muted m-0 text-[11px] uppercase tracking-[0.12em]" style={{ color: '#8a8194' }}>Form</Text>
                          </Column>
                          <Column className="py-3 text-right">
                            <Text className="t-primary m-0 text-right text-sm font-medium" style={{ color: '#1b1620' }}>{'{{.formTitle}}'}</Text>
                          </Column>
                        </Row>
                        {'{{if .reviewedAt}}'}
                        <Row
                          className="divider"
                          style={{
                            borderTop: '1px solid rgba(0,0,0,0.08)',
                            borderBottom: '1px solid rgba(0,0,0,0.08)',
                          }}
                        >
                          <Column className="py-3">
                            <Text className="t-muted m-0 text-[11px] uppercase tracking-[0.12em]" style={{ color: '#8a8194' }}>İnceleme Tarihi</Text>
                          </Column>
                          <Column className="py-3 text-right">
                            <Text className="t-primary m-0 text-right text-sm font-medium" style={{ color: '#1b1620' }}>{'{{.reviewedAt}}'}</Text>
                          </Column>
                        </Row>
                        {'{{end}}'}
                      </Section>

                      {'{{if .linkedFormId}}'}
                      <Section className="mt-7 text-center">
                        <Button
                          href={'https://forms.yildizskylab.com/' + '{{.linkedFormId}}'}
                          className="cta"
                          // Light Mode Varsayılan Stili
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
                          Başvuruyu Görüntüle
                        </Button>
                      </Section>
                      {'{{end}}'}
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
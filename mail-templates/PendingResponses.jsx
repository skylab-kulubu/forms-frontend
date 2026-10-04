import React from 'react';
import { Layout, Context, Title, Paragraph, ListHeader, Cta, SITE, greeting, colors, tones } from './_components/Layout';

export default function PendingResponsesEmail() {
  return (
    <Layout
      preview="İnceleyici olduğun formlarda bekleyen cevaplar var."
      reason="Bu e-postayı, inceleyici olduğun formlarda bekleyen cevaplar olduğu için aldın."
    >
      <Context tone="wait">Bekleyen cevaplar</Context>
      <Title>İncelemeni bekleyen {'{{.totalPending}}'} cevap var</Title>
      <Paragraph>{greeting} inceleyici olduğun formlarda bir süredir bekleyen cevaplar var. Formun adına tıklarsan doğrudan cevaplar sayfası açılır.</Paragraph>

      <ListHeader title="Formlar" count="{{len .forms}} form" />
      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {'{{range .forms}}'}
          <tr>
            <td className="hair" style={{ borderTop: `1px solid ${colors.hair}`, padding: '12px 0' }}>
              <a href={SITE + '/admin/forms/{{.formId}}/responses'} className="t-primary" style={{ fontSize: '14px', lineHeight: '20px', fontWeight: 500, color: colors.primary, textDecoration: 'none' }}>
                {'{{.formTitle}}'}
              </a>
            </td>
            <td className="hair tone-wait" align="right" style={{ borderTop: `1px solid ${colors.hair}`, padding: '12px 0 12px 16px', fontSize: '13px', lineHeight: '20px', color: tones.wait, textAlign: 'right', whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
              {'{{.pendingCount}}'} bekliyor
            </td>
          </tr>
          {'{{end}}'}
          <tr>
            <td colSpan={2} className="hair" style={{ borderTop: `1px solid ${colors.hair}`, fontSize: 0, lineHeight: 0, height: '1px' }}>&nbsp;</td>
          </tr>
        </tbody>
      </table>

      <Cta href={SITE + '/admin/forms'}>Panele git</Cta>
    </Layout>
  );
}

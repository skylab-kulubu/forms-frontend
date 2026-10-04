import React from 'react';
import { Layout, Context, Title, Paragraph, Rows, RowItem, RowsEnd, ListHeader, greeting, colors } from './_components/Layout';

export default function FormSubmissionEmail() {
  return (
    <Layout
      preview="Gönderdiğiniz cevapların bir kopyası bu e-postada."
      reason="Bu e-postayı {{.formTitle}} formunu doldurduğunuz için aldınız."
    >
      <Context tone="ok">{'{{.formTitle}}'}</Context>
      <Title>Cevabınızı aldık</Title>
      <Paragraph>{greeting} cevabınız bize ulaştı. Gönderdiklerinizin bir kopyasını aşağıya ekledik.</Paragraph>

      <Rows>
        <RowItem label="Gönderim tarihi">{'{{.submittedAt}}'}</RowItem>
        <RowsEnd />
      </Rows>

      <ListHeader title="Cevaplarınız" count="{{len .answers}} soru" />
      <table role="presentation" width="100%" cellPadding="0" cellSpacing="0" border={0} style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {'{{range $index, $answer := .answers}}'}
          <tr>
            <td className="hair" style={{ borderTop: `1px solid ${colors.hair}`, padding: '14px 0' }}>
              <p className="t-muted" style={{ margin: 0, fontSize: '13px', lineHeight: '20px', color: colors.muted }}>
                <span className="t-link" style={{ color: colors.link, fontWeight: 500, paddingRight: '8px', fontVariantNumeric: 'tabular-nums' }}>{'{{printf `%02d` (add1 $index)}}'}</span>
                {'{{.question}}'}
              </p>
              <p className="t-primary" style={{ margin: '4px 0 0', fontSize: '15px', lineHeight: '24px', color: colors.primary, whiteSpace: 'pre-wrap' }}>
                {'{{if .answer}}{{.answer}}{{else}}'}
                <span className="t-faint" style={{ color: colors.faint, fontStyle: 'italic' }}>Boş bırakıldı</span>
                {'{{end}}'}
              </p>
            </td>
          </tr>
          {'{{end}}'}
        </tbody>
      </table>
    </Layout>
  );
}

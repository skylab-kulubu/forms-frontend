import React from 'react';
import { Layout, Context, Title, Paragraph, Rows, RowItem, RowsEnd, Note, Cta, SITE, greeting, when } from './_components/Layout';

const approved = (node) => when('eq .status `approved`', node);
const declined = (node) => when('eq .status `declined`', node);
const returned = (node) => when('eq .status `returned`', node);

export default function StatusChangedEmail() {
  return (
    <Layout
      preview="{{.formTitle}} {{if eq .status `approved`}}cevabınızı onayladık{{else if eq .status `returned`}}cevabınızda düzeltme istedik{{else}}cevabınızı inceledik{{end}}."
      reason="Bu e-postayı {{.formTitle}} formunu doldurduğunuz için aldınız."
    >
      {'{{$next := or .nextFormId .linkedFormId}}'}
      {approved(
        <>
          <Context tone="ok">{'{{.formTitle}}'}</Context>
          <Title>{'{{if $next}}'}Sonraki adıma geçtiniz{'{{else}}'}Cevabınız onaylandı{'{{end}}'}</Title>
          <Paragraph>
            {greeting} cevabınızı inceledik ve onayladık.
            {'{{if $next}}'} Başvurunuzun sonraki adımı açıldı, aşağıdan devam edebilirsiniz.{'{{end}}'}
          </Paragraph>
        </>
      )}
      {declined(
        <>
          <Context tone="neutral">{'{{.formTitle}}'}</Context>
          <Title>Cevabınız kabul edilmedi</Title>
          <Paragraph>{greeting} cevabınızı inceledik ama bu sefer olumlu dönemiyoruz. İlginiz için teşekkür ederiz.</Paragraph>
        </>
      )}
      {returned(
        <>
          <Context tone="brand">{'{{.formTitle}}'}</Context>
          <Title>Cevabınızda düzeltme istendi</Title>
          <Paragraph>
            {greeting} cevabınızı inceledik ve küçük bir düzeltme istiyoruz. Önceki cevaplarınız formda hazır; ekibin notuna göre düzenleyip yeniden gönderebilirsiniz.
          </Paragraph>
        </>
      )}

      {when('.reviewedAt', (
        <Rows>
          <RowItem label="İnceleme tarihi">{'{{.reviewedAt}}'}</RowItem>
          {when('.questionCount', <RowItem label="Düzeltilecek">{'{{.questionCount}} soru'}</RowItem>)}
          <RowsEnd />
        </Rows>
      ))}

      {'{{if .reviewNote}}'}
      <Note label="Ekibin notu">{'{{.reviewNote}}'}</Note>
      {'{{else}}'}
      <Note label="Ekibin notu" empty>Not bırakılmadı.</Note>
      {'{{end}}'}

      {approved(when('$next', <Cta href={SITE + '/{{$next}}'}>Sonraki adıma geç</Cta>))}
      {returned(when('$next', <Cta href={SITE + '/{{$next}}'}>Düzeltmeye git</Cta>))}
    </Layout>
  );
}

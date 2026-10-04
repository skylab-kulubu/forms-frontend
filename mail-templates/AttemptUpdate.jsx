import React from 'react';
import { Layout, Context, Title, Paragraph, Strong, Rows, RowItem, RowsEnd, Cta, SITE, greeting, when, whenKind } from './_components/Layout';

const form = SITE + '/{{.formId}}';
const status = <Cta href={form}>Durumu gör</Cta>;
const nextOrStatus = (
  <>
    {'{{if .nextFormId}}'}
    <Cta href={SITE + '/{{.nextFormId}}'}>Sonraki adıma geç</Cta>
    {'{{else}}'}
    {status}
    {'{{end}}'}
  </>
);
const duration = '{{if .duration}}{{.duration}}{{else}}{{.minutes}} dakika{{end}}';

const PREVIEW = [
  '{{if eq .kind `reminder`}}Süre, görevi başlattığınız anda işlemeye başlıyor.',
  '{{else if eq .kind `extended`}}{{.formTitle}} formundaki görev için size ' + duration + ' daha verdik.',
  '{{else if eq .kind `expired`}}O ana kadar girdiğiniz cevaplar bize ulaştı.',
  '{{else if eq .kind `expiredEmpty`}}Süre bittiğinde hiç cevap girilmemişti.',
  '{{else if eq .kind `accepted`}}Süre dolduğunda kaydedilen cevaplarınızı teslim olarak kabul ettik.',
  '{{else if eq .kind `closed`}}Süre dolduğunda kaydedilen cevaplarınızı teslim olarak kabul edemiyoruz.',
  '{{end}}',
].join('');

export default function AttemptUpdateEmail() {
  return (
    <Layout preview={PREVIEW} reason="Bu e-postayı {{.formTitle}} formundaki göreve katıldığınız için aldınız.">
      {whenKind('reminder', (
        <>
          <Context tone="wait">{'{{.formTitle}}'}</Context>
          <Title>Görevi henüz başlatmadınız</Title>
          <Paragraph>
            {greeting} <Strong>{'{{.formTitle}}'}</Strong> formundaki görevi henüz başlatmadığınızı hatırlatmak istedik. Süre, görevi başlattığınız anda işlemeye başlıyor; müsait olduğunuz bir zamanda başlatabilirsiniz.
          </Paragraph>
          <Rows>
            {when('.duration', <RowItem label="Görev süresi">{'{{.duration}}'}</RowItem>)}
            {when('.deadlineAt', <RowItem label="Son başlama">{'{{.deadlineAt}}'}</RowItem>)}
            <RowsEnd />
          </Rows>
          <Cta href={form}>Göreve git</Cta>
        </>
      ))}

      {whenKind('extended', (
        <>
          <Context tone="brand">{'{{.formTitle}}'}</Context>
          <Title>Sürenizi uzattık</Title>
          <Paragraph>{greeting} <Strong>{'{{.formTitle}}'}</Strong> formundaki görev için size {duration} daha verdik. Kaldığınız yerden devam edebilirsiniz.</Paragraph>
          {when('.deadlineAt', (
            <Rows>
              <RowItem label="Yeni bitiş">{'{{.deadlineAt}}'}</RowItem>
              <RowsEnd />
            </Rows>
          ))}
          <Cta href={form}>Göreve dön</Cta>
        </>
      ))}

      {whenKind('expired', (
        <>
          <Context tone="wait">{'{{.formTitle}}'}</Context>
          <Title>Süreniz doldu</Title>
          <Paragraph>{greeting} <Strong>{'{{.formTitle}}'}</Strong> formundaki görevin süresi doldu. O ana kadar girdiğiniz cevaplar bize ulaştı; inceledikten sonra size e-postayla döneceğiz.</Paragraph>
          {when('.deadlineAt', (
            <Rows>
              <RowItem label="Bitiş">{'{{.deadlineAt}}'}</RowItem>
              <RowsEnd />
            </Rows>
          ))}
          {status}
        </>
      ))}

      {whenKind('expiredEmpty', (
        <>
          <Context tone="neutral">{'{{.formTitle}}'}</Context>
          <Title>Süreniz doldu</Title>
          <Paragraph>
            {greeting} <Strong>{'{{.formTitle}}'}</Strong> formundaki görevin süresi doldu. Süre bittiğinde hiç cevap girilmemişti, bu yüzden bir teslim kaydedemedik.
            {'{{if .nextFormId}}'} Başvurunuz sonraki adımla devam ediyor.{'{{else}}'} Gerekirse size ek süre verebiliriz; öyle olursa e-postayla haber veririz.{'{{end}}'}
          </Paragraph>
          {when('.deadlineAt', (
            <Rows>
              <RowItem label="Bitiş">{'{{.deadlineAt}}'}</RowItem>
              <RowsEnd />
            </Rows>
          ))}
          {nextOrStatus}
        </>
      ))}

      {whenKind('accepted', (
        <>
          <Context tone="ok">{'{{.formTitle}}'}</Context>
          <Title>Tesliminiz kabul edildi</Title>
          <Paragraph>
            {greeting} süre dolduğunda kaydedilen cevaplarınızı inceledik ve teslim olarak kabul ettik.
            {'{{if .nextFormId}}'} Başvurunuzun sonraki adımı açıldı, aşağıdan devam edebilirsiniz.{'{{end}}'}
          </Paragraph>
          {nextOrStatus}
        </>
      ))}

      {whenKind('closed', (
        <>
          <Context tone="bad">{'{{.formTitle}}'}</Context>
          <Title>Tesliminiz kabul edilmedi</Title>
          <Paragraph>
            {greeting} süre dolduğunda kaydedilen cevaplarınızı inceledik ama maalesef teslim olarak kabul edemiyoruz.
            {'{{if .nextFormId}}'} Başvurunuz sonraki adımla devam ediyor.{'{{end}}'}
          </Paragraph>
          {nextOrStatus}
        </>
      ))}
    </Layout>
  );
}

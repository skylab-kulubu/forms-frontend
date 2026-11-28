import Image from "next/image";

const ROWS = [
  {
    k: "Onay ve ret",
    g: "Onay adımı yok. Kararı cevap tablosuna kendiniz yazarsınız.",
    f: "Ekipten biri onaylar ya da reddeder, başvuran e-postayla haber alır.",
  },
  {
    k: "Sıradaki adım",
    g: "İkinci formun linkini onayladıklarınıza tek tek gönderirsiniz.",
    f: "Onaylanan başvuranın önüne sıradaki form açılır, bağlantısı e-postasına gider.",
  },
  {
    k: "Başvuranın gördüğü",
    g: "Sonucu siz yazana kadar öğrenemez.",
    f: "Hangi adımda olduğunu ve ekibin notunu görür.",
  },
  {
    k: "Koşullu sorular",
    g: "Bölüm düzeyinde, yalnız seçmeli cevaplara göre çalışır.",
    f: "Tek bir soru önceki bir cevaba göre açılır. Metin, sayı, tarih ve dosya cevapları da koşul olabilir.",
  },
  {
    k: "Süre",
    g: "Süre sınırı koyamazsınız.",
    f: "Süre aday “Görevi başlat”a basınca işler, dolunca o ana kadarki cevaplar size gelir.",
  },
  {
    k: "Analitik",
    g: "Cevapları süzmek için tabloya geçersiniz.",
    f: "Bir cevaba tıklayınca diğer sorular yalnız o cevabı verenlere göre hesaplanır.",
  },
];

export default function Compare() {
  return (
    <div className="at-vs" data-rv="" style={{ "--rvd": ".12s" }}>
      <div className="at-vs-h" aria-hidden="true">
        <span />
        <span>Google Forms&apos;ta</span>
        <span className="is-f">
          <Image src="/skylab.svg" alt="" width={16} height={16} unoptimized />
          Forms&apos;ta
        </span>
      </div>
      {ROWS.map((row) => (
        <div key={row.k} className="at-vs-r">
          <p className="at-vs-k">{row.k}</p>
          <div className="at-vs-c">
            <span className="at-vs-l">Google Forms&apos;ta</span>
            <p>{row.g}</p>
          </div>
          <div className="at-vs-c is-f">
            <span className="at-vs-l">Forms&apos;ta</span>
            <p>{row.f}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

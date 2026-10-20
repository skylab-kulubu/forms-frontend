import Image from "next/image";

const ROWS = [
  {
    k: "Onay ve ret",
    g: "Yerleşik bir onay adımı yok. Kararı cevap tablosuna kendiniz yazarsınız ya da bir eklenti kurarsınız.",
    f: "Ekipten biri cevabı onaylar ya da reddeder. Karara göre başvuranla iletişimi Forms kurar.",
  },
  {
    k: "Sıradaki adım",
    g: "İkinci formun linkini onayladığınız kişilere tek tek gönderirsiniz.",
    f: "Onaylanan başvuranın önüne sıradaki form açılır, bağlantısı e-postasına gider.",
  },
  {
    k: "Başvuranın gördüğü",
    g: "Cevabının bir kopyasını alabilir fakat sonucu siz yazana kadar öğrenemez.",
    f: "Hangi adımda olduğunu ve ekibin notunu görebilir, böylece süreç daha net ilerler.",
  },
  {
    k: "E-postalar",
    g: "Yeni cevap gelince sadece size bildirim gider. Başvuranın durumu değiştiğinde ona giden bir e-posta olmaz.",
    f: "Başvuran gönderince ve karar verilince e-posta alır, size ise unutulmuş cevapların hatırlatması gelir.",
  },
  {
    k: "Koşullu sorular",
    g: "Bölüm düzeyinde çalışır, çoktan seçmeli ya da açılır liste cevabına göre başka bölüme geçilir.",
    f: "Tek bir soru, önceki bir cevaba göre görünür. Hatta farklı bir forma iletilmesi bile sağlanabilir. Metin, sayı, tarih ve dosya cevapları da koşul olabilir.",
  },
  {
    k: "Kimlik",
    g: "Google hesabıyla giriş istenebilir, ayrıca dosya sorusu varsa giriş zorunludur.",
    f: "Başvuranlar E-Skylab hesabıyla girer, ad ve e-posta hesaptan gelir. İsterseniz formu anonim cevaba da açarsınız.",
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

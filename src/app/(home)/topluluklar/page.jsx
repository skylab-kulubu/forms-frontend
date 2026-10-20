import HomeShell from "@/app/components/home/HomeShell";
import CommunitiesHero from "@/app/components/home/communities/CommunitiesHero";
import Compare from "@/app/components/home/communities/Compare";
import LazyDemo from "@/app/components/home/LazyDemo";
import HomeForm from "@/app/components/home/HomeForm";
import { HOME_FORMS, SECTIONS } from "@/app/components/home/config";
import "@/app/components/home/sections.css";

const ids = SECTIONS.topluluklar;

const DESCRIPTION = "Bütün başvurularınızı Forms'ta toplayın. Başvuruları adımlara bölebilir, detaylı analitikler çıkarabilir ve her adımı birbirinden bağımsız yönetebilirsiniz.";
const IMAGE = { url: "/home/og-topluluklar.jpg", width: 1200, height: 630, alt: "Topluluklar için Forms" };

export const metadata = {
  title: "Topluluklar için",
  description: DESCRIPTION,
  openGraph: { title: "Topluluklar için | SKY LAB Forms", description: DESCRIPTION, type: "website", locale: "tr_TR", siteName: "SKY LAB Forms", images: [IMAGE] },
  twitter: { card: "summary_large_image", title: "Topluluklar için | SKY LAB Forms", description: DESCRIPTION, images: [IMAGE.url] },
};

function Head({ kick, title, children }) {
  return (
    <div className="at-head" data-rv="">
      <div>
        {kick && <p className="at-kick">{kick}</p>}
        <h2 className="at-h2">{title}</h2>
      </div>
      <p className="at-txt">{children}</p>
    </div>
  );
}

export default function CommunitiesPage() {
  return (
    <HomeShell page="topluluklar">
      <CommunitiesHero />
      <div className="at-wrap">
        <section className="at-sec" id={ids.review} data-page="">
          <Head kick="Değerlendirme" title="Başvuruyu değerlendirin">
            Başvurular ekibin listesine düşer. Ekipten birinin incelemesinin ardından Forms otomatik olarak sıradaki adımı hazırlar ve başvuranı bilgilendirir. Sizin yönetmenize gerek kalmaz.
          </Head>
          <div className="at-demo" data-rv="" style={{ "--rvd": ".12s" }}>
            <LazyDemo name="review" />
          </div>
        </section>

        <section className="at-sec" id={ids.flow} data-page="">
          <Head kick="Akışlar" title="Başvuruyu adımlara bölün">
            Her adım ayrı bir form. Onay veya red durumuna göre sıradaki adımı belirlersiniz. Ayrıca akışı cevaba göre de yönetebilirsiniz.
          </Head>
          <div className="at-demo" data-rv="" style={{ "--rvd": ".12s" }}>
            <LazyDemo name="flow" />
          </div>
        </section>

        <section className="at-sec" id={ids.editor} data-page="">
          <Head kick="Form editörü" title="Formu hazırlayın">
            İhtiyacınıza göre soru türleri ekleyin, bir soruyu önceki bir sorunun cevabına bağlayın, sık kullandığınız soru gruplarını şablon olarak saklayın.
          </Head>
          <div className="at-demo" data-rv="" style={{ "--rvd": ".12s" }}>
            <LazyDemo name="editor" />
          </div>
        </section>

        <section className="at-sec" id={ids.compare} data-page="">
          <Head title="Google Forms'tan farkı">
            Google Forms tek seferlik bir formu toplamak için yeterli. Başvurular ise birkaç adım sürüyor, ekipler karar veriyor ve başvurana haber verilmesi gerekiyorsa bu işlemleri elle yapmanız gerekiyor.
          </Head>
          <Compare />
        </section>

        <section className="at-sec at-acc" id={ids.access} data-page="">
          <div className="at-acc-l" data-rv="">
            <h2 className="at-h2">Erişim isteyin</h2>
            <p className="at-txt">
              Forms&apos;u bugün SKY LAB&apos;in ekipleri kullanıyor. Başka bir topluluk ya da kulüpseniz alan açmamız için bu formu doldurun.
            </p>
            <p className="at-fine">
              Bu form da Forms&apos;ta hazırlandı. Gönderdiğinizde isteğiniz WEBLAB&apos;e iletilmiş olacak.
            </p>
          </div>
          <div data-rv="" style={{ "--rvd": ".12s" }}>
            <HomeForm formId={HOME_FORMS.access} />
          </div>
        </section>
      </div>
    </HomeShell>
  );
}

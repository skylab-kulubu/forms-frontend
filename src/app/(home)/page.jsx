import HomeShell from "@/app/components/home/HomeShell";
import HeroWall from "@/app/components/home/applicants/HeroWall";
import LazyDemo from "@/app/components/home/LazyDemo";
import HomeForm from "@/app/components/home/HomeForm";
import { HOME_FORMS, SECTIONS } from "@/app/components/home/config";
import "@/app/components/home/sections.css";

const ids = SECTIONS.kisiler;

const DESCRIPTION = "Yıldız Teknik Üniversitesi SKY LAB Web Arge Ekibi tarafından geliştirilen form ve başvuru altyapısı. Kulübün bütün başvuruları buradan yönetiliyor.";
const IMAGE = { url: "/home/og-basvuranlar.jpg", width: 1200, height: 630, alt: "SKY LAB Forms afiş panosu" };

export const metadata = {
  description: DESCRIPTION,
  openGraph: { title: "SKY LAB Forms", description: DESCRIPTION, type: "website", locale: "tr_TR", siteName: "SKY LAB Forms", images: [IMAGE] },
  twitter: { card: "summary_large_image", title: "SKY LAB Forms", description: DESCRIPTION, images: [IMAGE.url] },
};

export default function NewHomePage() {
  return (
    <HomeShell page="kisiler" block=".a2-try.is-open">
      <HeroWall />
      <div className="a2-wrap">
        <section className="a2-sec" id={ids.after} data-page="">
          <div className="a2-head" data-rv="">
            <h2 className="a2-h2">Başvurduktan sonra</h2>
            <p className="a2-txt">
              E-Skylab hesabınızla başvurduğunuzda cevaplarınızın bir kopyası hemen e-postanıza gelir. Eğer Ar-Ge ekiplerine başvurduysanız ekip karar verince e-postanıza bilgilendirme gelecek. Onaylanırsa bu bilgilendirme ile sıradaki adıma ilerleyebilirsiniz.
            </p>
          </div>
          <div className="a2-aa" data-rv="" style={{ "--rvd": ".12s" }}>
            <LazyDemo name="after" />
          </div>
        </section>

        <section className="a2-sec a2-int" id={ids.interest} data-page="">
          <div className="a2-int-l" data-rv="">
            <h2 className="a2-h2">Neyle ilgileniyorsunuz?</h2>
            <p className="a2-txt">
              Sizi daha iyi tanıyabilmemiz ve açılan pozisyonlardan haberdar edebilmemiz için formu doldurabilirsiniz. İlginize göre başvuru açan ekip size e-postayla haber verecektir.
            </p>
          </div>
          <div data-rv="" style={{ "--rvd": ".12s" }}>
            <HomeForm formId={HOME_FORMS.interest} />
          </div>
        </section>
      </div>
    </HomeShell>
  );
}

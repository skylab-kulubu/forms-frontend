import { brandOptions } from "@/brands/catalog";
import { MenuPill, PANEL_SECTION, SectionHeader } from "@/app/admin/components/utils/SidePanel";

const PLATFORM = "skylab";

const OPTIONS = [
  { value: PLATFORM, label: "SKY LAB" },
  ...brandOptions.map((brand) => ({ value: brand.key, label: brand.name, hint: brand.siteLabel })),
];

export function BrandSection({ value, onChange }) {
  const brand = brandOptions.find((option) => option.key === value) ?? null;

  return (
    <section className={PANEL_SECTION}>
      <SectionHeader title="Görünüm" description="Form sayfası, gönderildi ve kapandı ekranları seçilen temayla açılır." />

      <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2.5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-neutral-100">Tema</p>
          <p className="text-2xs text-neutral-500">{brand ? `${brand.name} sitesinin renkleri ve yazı tipleri` : "SKY LAB Forms'un kendi görünümü"}</p>
        </div>
        <MenuPill value={brand?.key ?? PLATFORM} options={OPTIONS} onSelect={(next) => onChange(next === PLATFORM ? null : next)} />
      </div>
    </section>
  );
}

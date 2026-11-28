import BrandRoot from "./BrandRoot";
import { BrandProvider, FixedTheme } from "./BrandContext";
import { brandSlots } from "./slots";

export default function BrandScope({ brand, children }) {
  if (!brand) return <FixedTheme theme="dark">{children}</FixedTheme>;

  const slots = {};
  for (const [name, Slot] of Object.entries(brandSlots(brand.key))) slots[name] = <Slot brand={brand} />;

  return (
    <BrandRoot brand={brand} data-theme={brand.theme}>
      <BrandProvider attributes={brand.attributes} theme={brand.theme} slots={slots}>
        {children}
      </BrandProvider>
    </BrandRoot>
  );
}

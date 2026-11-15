import { BrandProvider } from "./BrandContext";

export default function BrandScope({ brand, children }) {
  if (!brand) return children;

  const slots = {};
  for (const [name, Slot] of Object.entries(brand.slots)) slots[name] = <Slot brand={brand} />;

  return (
    <div data-brand={brand.key} data-theme={brand.theme} className={brand.scopeClass}>
      <BrandProvider brandKey={brand.key} theme={brand.theme} scopeClass={brand.scopeClass} slots={slots}>
        {children}
      </BrandProvider>
    </div>
  );
}

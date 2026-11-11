import { BrandProvider } from "./BrandContext";

export default function BrandScope({ brand, children }) {
  if (!brand) return children;

  const slots = {};
  for (const [name, Slot] of Object.entries(brand.slots)) slots[name] = <Slot brand={brand} />;

  return (
    <div data-brand={brand.key} className={brand.scopeClass}>
      <BrandProvider brandKey={brand.key} scopeClass={brand.scopeClass} slots={slots}>
        {children}
      </BrandProvider>
    </div>
  );
}

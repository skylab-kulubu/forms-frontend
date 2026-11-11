import FormClient from "./FormClient";
import BrandScope from "@/brands/BrandScope";
import { findBrand } from "@/brands/registry";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function fetchFormMeta(id) {
  const res = await fetch(`${BASE_URL}/api/forms/${id}/meta`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) return null;
  const json = await res.json();
  return json?.data ?? null;
}

function stripHtml(html) {
  return html?.replace(/<[^>]*>/g, "").trim() || "";
}

export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const meta = await fetchFormMeta(id);
    if (!meta) return { title: "Form" };

    const { title, description: rawDesc } = meta;
    const brand = findBrand(meta.brand);
    const description = stripHtml(rawDesc) || "Skylab Forms ile oluşturulmuş form.";
    const formTitle = title || "Form";

    return {
      title: formTitle,
      description,
      openGraph: {
        title: `${formTitle} | Skylab Forms`,
        description,
        type: "website",
        locale: "tr_TR",
        siteName: brand ? `${brand.name} · Skylab Forms` : "Skylab Forms",
      },
      twitter: {
        card: "summary",
        title: `${formTitle} | Skylab Forms`,
        description,
      },
      robots: { index: false, follow: false },
      ...(brand ? { icons: { icon: brand.icon } } : {}),
    };
  } catch {
    return {
      title: "Form",
      robots: { index: false, follow: false },
    };
  }
}

export async function generateViewport({ params }) {
  const { id } = await params;
  const brand = findBrand((await fetchFormMeta(id).catch(() => null))?.brand);
  return brand ? { themeColor: brand.themeColor } : {};
}

export default async function FormDisplayerPage({ params }) {
  const { id } = await params;
  const meta = await fetchFormMeta(id).catch(() => null);

  return (
    <BrandScope brand={findBrand(meta?.brand)}>
      <FormClient />
    </BrandScope>
  );
}

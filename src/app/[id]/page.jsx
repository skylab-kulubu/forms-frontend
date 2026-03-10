import FormClient from "./FormClient";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

function stripHtml(html) {
  return html?.replace(/<[^>]*>/g, "").trim() || "";
}

export async function generateMetadata({ params }) {
  const { id } = await params;

  try {
    const res = await fetch(`${BASE_URL}/api/forms/${id}/meta`, {
      next: { revalidate: 60 },
    });

    if (!res.ok) return { title: "Form" };

    const json = await res.json();
    const { title, description: rawDesc } = json?.data ?? {};
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
        siteName: "Skylab Forms",
      },
      twitter: {
        card: "summary",
        title: `${formTitle} | Skylab Forms`,
        description,
      },
      robots: { index: false, follow: false },
    };
  } catch {
    return {
      title: "Form",
      robots: { index: false, follow: false },
    };
  }
}

export default function FormDisplayerPage() {
  return <FormClient />;
}

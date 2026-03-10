export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forms.yildizskylab.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/auth"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

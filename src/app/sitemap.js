export default function sitemap() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://forms.yildizskylab.com";

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}

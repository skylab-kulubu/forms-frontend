import localFont from "next/font/local";
import "../components/home/home.css";

const anton = localFont({
  src: "../fonts/anton.woff2",
  weight: "400",
  variable: "--font-anton",
  display: "swap",
  declarations: [{ prop: "font-family", value: "Anton" }],
});

const instrumentSerif = localFont({
  src: [
    { path: "../fonts/instrument-serif.woff2", style: "normal" },
    { path: "../fonts/instrument-serif-italic.woff2", style: "italic" },
  ],
  weight: "400",
  variable: "--font-serif",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  declarations: [{ prop: "font-family", value: "Instrument Serif" }],
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://forms.yildizskylab.com"),
  robots: { index: true, follow: true },
};

export default function HomeLayout({ children }) {
  // The landing is drawn for a dark page, so it stays dark whatever the visitor chose elsewhere
  return <div data-theme="dark" className={`hm ${anton.variable} ${instrumentSerif.variable}`}>{children}</div>;
}

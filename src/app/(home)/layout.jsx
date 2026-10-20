import { Anton, Instrument_Serif } from "next/font/google";
import "../components/home/home.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin", "latin-ext"],
  variable: "--font-anton",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://forms.yildizskylab.com"),
  robots: { index: true, follow: true },
};

export default function HomeLayout({ children }) {
  return <div className={`hm ${anton.variable} ${instrumentSerif.variable}`}>{children}</div>;
}

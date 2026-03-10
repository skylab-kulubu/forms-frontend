import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata = {
  title: {
    default: "SKY LAB Forms",
    template: "%s | SKY LAB Forms",
  },
  description:
    "Yıldız Teknik Üniversitesi Bilgisayar Bilimleri Kulübü. 8 AR-GE ekibiyle yazılım, yapay zeka, siber güvenlik ve daha fazlasında projeler geliştir.",
  keywords: ["skylab", "arge", "form", "anket", "form oluşturucu", "skylab forms", "skylab arge"],
  authors: [{ name: "Fatih Naz" }],
  openGraph: {
    title: "SKY LAB Forms",
    description:
      "Yıldız Teknik Üniversitesi Bilgisayar Bilimleri Kulübü. 8 AR-GE ekibiyle projeler geliştir.",
    type: "website",
    locale: "tr_TR",
    siteName: "SKY LAB Forms",
  },
  twitter: {
    card: "summary",
    title: "SKY LAB Forms",
    description:
      "Yıldız Teknik Üniversitesi Bilgisayar Bilimleri Kulübü. 8 AR-GE ekibiyle projeler geliştir.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="overflow-hidden bg-neutral-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
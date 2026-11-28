import localFont from "next/font/local";
import "./globals.css";
import Providers from "./providers";
import ThemeScript from "./components/ThemeScript";

const spaceGrotesk = localFont({
  src: "./fonts/space-grotesk.woff2",
  weight: "300 700",
  variable: "--font-sans",
  declarations: [{ prop: "font-family", value: "Space Grotesk" }],
});

const jetbrainsMono = localFont({
  src: "./fonts/jetbrains-mono.woff2",
  weight: "100 800",
  variable: "--font-mono",
  declarations: [{ prop: "font-family", value: "JetBrains Mono" }],
});

export const viewport = { viewportFit: "cover" };

export const metadata = {
  title: {
    default: "SKY LAB Forms",
    template: "%s | SKY LAB Forms",
  },
  description:
    "SKY LAB iş akışları için modern ve esnek form altyapısı. Dinamik formlar oluşturun, süreçleri tasarlayın ve tüm başvuruları tek merkezden yönetin.",
  keywords: [
    "skylab", "arge", "form", "anket", "form oluşturucu", "skylab forms", "süreç yönetimi", "dinamik form", "veri yönetimi"
  ],
  authors: [{ name: "Fatih Naz" }],
  openGraph: {
    title: "SKY LAB Forms",
    description:
      "SKY LAB iş akışları için modern ve esnek form altyapısı. Dinamik formlar oluşturun, süreçleri tasarlayın ve tüm başvuruları tek merkezden yönetin.",
    type: "website",
    locale: "tr_TR",
    siteName: "SKY LAB Forms",
  },
  twitter: {
    card: "summary",
    title: "SKY LAB Forms",
    description:
      "SKY LAB iş akışları için modern ve esnek form altyapısı. Dinamik formlar oluşturun, süreçleri tasarlayın ve tüm başvuruları tek merkezden yönetin.",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="tr" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body className="overflow-hidden bg-neutral-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
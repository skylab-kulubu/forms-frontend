import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "Forms",
  description: "WIP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="overflow-hidden bg-neutral-900">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

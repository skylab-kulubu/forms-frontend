import "./globals.css";

export const metadata = {
  title: "Forms",
  description: "WIP",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="overflow-hidden">
        {children}
      </body>
    </html>
  );
}

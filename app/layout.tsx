import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IMEISnap · Device image API",
  description: "Find, cache, and manage device images by model number.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

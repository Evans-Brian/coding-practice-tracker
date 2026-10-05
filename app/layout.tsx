import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Upstart Practice Notebook",
  description: "LeetCode questions by relevance, with notes, completion counts, and repeat tracking.",
  other: {
    "codex-preview": "development",
  },
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

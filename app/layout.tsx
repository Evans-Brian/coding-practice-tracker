import type { Metadata } from "next";
import "./globals.css";
import "./practice-theme.css";

export const metadata: Metadata = {
  title: "NeetCode 150 | Practice Notebook",
  description: "NeetCode 150 by topic and difficulty, with shared notes, completion counts, repeat tracking, and Upstart preparation.",
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
      <head>
        {/* Keep the app's dark theme intact, including on streamed exercise pages. */}
        <meta name="darkreader-lock" content="true" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}

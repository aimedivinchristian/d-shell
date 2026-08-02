import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "@/components/theme-provider";
import { getSiteUrl } from "@/lib/site";
import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import "@fontsource/jetbrains-mono/700.css";
import "./globals.css";

const description =
  "An interactive, real, in-browser shell for learning Linux commands. No install, no server, no account required.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: "D>shell — learn Linux by using it",
  description,
  openGraph: {
    title: "D>shell — learn Linux by using it",
    description,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "D>shell — learn Linux by using it",
    description,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}

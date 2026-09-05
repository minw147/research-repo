import type { Metadata } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Newsreader } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";

const ResearchAssistantBot = dynamic(
  () =>
    import("@/components/assistant/ResearchAssistantBot").then(
      (m) => m.ResearchAssistantBot
    ),
  { ssr: false }
);

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
});

export const metadata: Metadata = {
  title: "Research Hub",
  description: "Research Hub - Local-first UX research analysis and reporting",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${plexSans.variable} ${plexMono.variable} ${newsreader.variable} ${plexSans.className} font-sans`}>
        {children}
        <div id="ra-portal" />
        <ResearchAssistantBot />
      </body>
    </html>
  );
}

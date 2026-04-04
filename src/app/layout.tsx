import type { Metadata } from "next";
import { Inter, DM_Sans } from "next/font/google";
import dynamic from "next/dynamic";
import "./globals.css";

const ResearchAssistantBot = dynamic(
  () =>
    import("@/components/assistant/ResearchAssistantBot").then(
      (m) => m.ResearchAssistantBot
    ),
  { ssr: false }
);

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  weight: ["400", "500", "600", "700"],
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
      <body className={`${inter.variable} ${dmSans.variable} ${inter.className} font-sans`}>
        {children}
        <div id="ra-portal" />
        <ResearchAssistantBot />
      </body>
    </html>
  );
}

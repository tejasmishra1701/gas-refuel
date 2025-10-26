import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "arial"],
  variable: "--font-inter",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  fallback: ["monospace"],
  variable: "--font-jetbrains-mono",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "arial"],
  variable: "--font-space-grotesk",
});

export const metadata: Metadata = {
  title: "FuelFlow - Cross-Chain Gas Station",
  description:
    "Seamless cross-chain gas refueling powered by Avail Nexus SDK. Never run out of gas again.",
  keywords: ["cross-chain", "gas", "refuel", "blockchain", "avail", "nexus"],
  authors: [{ name: "FuelFlow Team" }],
  openGraph: {
    title: "FuelFlow - Cross-Chain Gas Station",
    description:
      "Seamless cross-chain gas refueling powered by Avail Nexus SDK",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable} font-sans`}
        suppressHydrationWarning={true}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

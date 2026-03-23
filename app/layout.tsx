import type { Metadata } from "next";
import { IBM_Plex_Mono, Montserrat, Source_Sans_3 } from "next/font/google";
import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import "./globals.css";

const displayFont = Montserrat({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const bodyFont = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const monoFont = IBM_Plex_Mono({
  variable: "--font-code",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Enterprise Data Governance",
  description: "Frontend control plane for graph metadata onboarding and exploration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${displayFont.variable} ${bodyFont.variable} ${monoFont.variable} antialiased`}>
        <Navbar />
        <div className="md:flex">
          <Sidebar />
          <main className="flex-1 bg-grid px-4 py-5 md:px-8 md:py-8">{children}</main>
        </div>
      </body>
    </html>
  );
}

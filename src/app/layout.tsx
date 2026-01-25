import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AIProviderProvider } from "@/components/providers/AIProviderContext";
import { AdminProvider } from "@/components/providers/AdminContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Praxis AI",
  description: "Clinical documentation platform for NDIS practitioners",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 antialiased`}>
        <ThemeProvider>
          <AdminProvider>
            <AIProviderProvider>
              {children}
            </AIProviderProvider>
          </AdminProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

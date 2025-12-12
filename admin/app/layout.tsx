import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { GlobalSearchProvider } from "@/hooks/useGlobalSearch";
import { HelpModalProvider } from "@/hooks/useHelpModal";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OnWApp Admin",
  description: "WhatsApp API Session Manager",
};

function GlobalSearchWrapper({ children }: { children: React.ReactNode }) {
  return (
    <GlobalSearchProvider>
      <HelpModalProvider>
        {children}
      </HelpModalProvider>
    </GlobalSearchProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="theme-color" content="#000000" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <GlobalSearchWrapper>
            {children}
            <Toaster richColors position="top-right" />
          </GlobalSearchWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}

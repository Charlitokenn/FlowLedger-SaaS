import type { Metadata } from "next";
import { Poppins, Lato } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "next-themes";
import { ToastContextProvider } from "@/components/reusable components/toast-context";
import config from "@/lib/app-config";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    template: "%s | FlowLedger",
    default: "FlowLedger",
  },
  description: config.appDetails.description,
  keywords: [
    "realestate system",
  ],
  metadataBase: new URL('https://flowledger.com'),
  alternates: {
    canonical: '/',
    languages: {
      'en-US': '/en-US',
    },
  },
  authors: [
    {
      name: config.appDetails.authorName,
      url: config.appDetails.authorUrl,
    },
  ],
  creator: config.appDetails.creatorName,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: config.appDetails.openGraph.url,
    title: config.appDetails.openGraph.title,
    description: config.appDetails.openGraph.description,
    siteName: config.appDetails.openGraph.siteName,
  },
  twitter: {
    card: "summary_large_image",
    title: config.appDetails.twitter.title,
    description: config.appDetails.twitter.description,
    images: config.appDetails.twitter.images,
    creator: config.appDetails.twitter.creator,
  },
  icons: {
    icon: config.appDetails.icon.icon
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        elements: {
          formButtonPrimary: "bg-primary hover:bg-primary-dark text-sm normal-case",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${poppins.variable} ${lato.variable} font-sans antialiased`}>
          <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
            <NuqsAdapter>
              <ToastContextProvider>
                {children}
              </ToastContextProvider>
            </NuqsAdapter>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}

import type { Metadata } from "next";
import { Poppins, Lato } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { ThemeProvider } from "next-themes";
import { ToastContextProvider } from "@/components/reusable components/toast-context";
import config from "@/lib/app-config";
import appConfig from "@/lib/app-config";

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
    template: `%s | ${appConfig.appDetails.brand}`,
    default: `${appConfig.appDetails.brand}`,
  },
  description: config.appDetails.description,
  keywords: [
    "realestate system",
  ],
  metadataBase: new URL('https://landflow.com'),
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
  // @ts-ignore
  return (
    <ClerkProvider
      appearance={{
        cssLayerName: 'clerk',
        elements: {
          //Organization Switcher Customization
          organizationPreviewAvatarBox: "size-11 -ml-2",
          organizationPreviewAvatarImage: "w-full h-full object-contain",
          organizationPreview__organizationSwitcherTrigger: "bg-transparent",
          organizationPreviewTextContainer__organizationSwitcherTrigger: "text-bold text-red-500 hidden",
          organizationSwitcherTrigger__organization: "hover:bg-transparent",
          organizationSwitcherTrigger: 'dark:text-primary-foreground',
          organizationSwitcherTriggerIcon: "hidden",
          organizationSwitcherPopoverFooter: "hidden",
          organizationSwitcherPopoverCard: "rounded-xl dark:border-1 dark:border-primary-foreground",
          organizationSwitcherPopoverActions: "dark:bg-secondary dark:text-primary-foreground",
          organizationSwitcherPopoverActionButton: "dark:text-primary-foreground dark:border-primary-foreground",
          organizationSwitcherPopoverActionButton__manageOrganization: "dark:text-primary-foreground dark:bg-background",
          organizationPreview__organizationSwitcherListedOrganization: "dark:text-primary-foreground",
          organizationSwitcherPreviewButton: "dark:hover:bg-muted-foreground dark:border dark:border-primary-foreground",

          //UserButton Customization
          userButtonAvatarBox: "dark:border-primary-foreground",
          userButtonPopoverCard: "rounded-xl dark:border-1 dark:border-primary-foreground",
          userButtonPopoverActionButton: "dark:bg-secondary dark:text-primary-foreground dark:hover:bg-muted-foreground dark:border dark:border-primary-foreground",
          userPreviewSecondaryIdentifier: "dark:text-primary-foreground",
          userButtonPopoverMain: "dark:bg-secondary dark:text-primary-foreground",
          userButtonPopoverFooter: "hidden",

          //Global Customizations
          headerTitle: "dark:text-accent-foreground!",
          footer: "hidden",
          profileSectionTitleText: "dark:text-muted-foreground",
          organizationPreviewMainIdentifier: "dark:text-primary-foreground",
          profileSectionPrimaryButton: "dark:border dark:rounded-lg  dark:text-primary-foreground",

          formButtonPrimary: "btn-primary!",
          formFieldInput: "input-field",
          formFieldLabel: "input-label",

          scrollBox: "dark:bg-background",

          tabButton: "dark:text-muted-foreground",
          notificationBadge: "dark:text-muted-foreground",
          organizationProfileMembersSearchInput: "dark:bg-muted-foreground dark:text-muted",
          tableBodyCell: "dark:text-muted-foreground",
          tableHeaderCell: "dark:text-muted-foreground",

          selectOptionsContainer: "dark:bg-muted-foreground",
          selectButton: "dark:bg-muted-foreground",
          selectOption: "dark:text-primary-foreground dark:bg-muted",
          menuButtonEllipsis: "dark:text-primary-foreground",
          menuList: "dark:bg-muted",

          modalCloseButton: "dark:text-primary-foreground",
          cardBox: "dark:bg-secondary",
          createOrganization: "dark:bg-secondary",

          badge: "dark:text-muted-foreground",
          activeDeviceListItem: "dark:text-muted-foreground",

          userPreviewMainIdentifierText: "dark:text-primary-foreground",
          profileSectionItemList: "dark:text-primary-foreground",
        }
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

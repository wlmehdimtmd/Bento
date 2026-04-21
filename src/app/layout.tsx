import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Inter, Onest } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { RecoveryHashHandler } from "@/components/auth/RecoveryHashHandler";
import { LocaleClientProvider } from "@/components/i18n/LocaleClientProvider";
import { resolveLocale, LOCALE_COOKIE_NAME } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const onest = Onest({
  variable: "--font-onest",
  subsets: ["latin"],
});

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://bentorest.app";

export const metadata: Metadata = {
  title: {
    default: "Bento Resto",
    template: "%s — Bento Resto",
  },
  description:
    "Digital ordering platform for independent restaurants and merchants.",
  metadataBase: new URL(APP_URL),
  openGraph: {
    siteName: "Bento Resto",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const locale = resolveLocale(cookieStore.get(LOCALE_COOKIE_NAME)?.value);

  return (
    <html
      lang={locale}
      className={`${inter.variable} ${onest.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        {/* Skip to main content — keyboard accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:ring-2"
          style={{ "--tw-ring-color": "var(--primary)" } as React.CSSProperties}
        >
          {locale === "en" ? "Skip to content" : "Aller au contenu"}
        </a>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LocaleClientProvider initialLocale={locale}>
            {/* Avant le contenu : session recovery (hash / PKCE) avant les useEffect des pages. */}
            <RecoveryHashHandler />
            {children}
            <Toaster richColors closeButton />
          </LocaleClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

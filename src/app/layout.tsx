import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/site/header";
import { HeaderAuth } from "@/components/site/header-auth";
import { Footer } from "@/components/site/footer";
import { getSettings } from "@/server/queries/settings";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const { name, description } = await getSettings();
  return { title: { default: name, template: `%s | ${name}` }, description };
}

export default async function RootLayout({ children, modal }: LayoutProps<"/">) {
  await connection();
  const settings = await getSettings();
  return (
    <html lang="en" className={`${montserrat.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:ring-3 focus:ring-ring/50"
        >
          Skip to content
        </a>
        <Header
          siteName={settings.name}
          auth={
            // Reserves the links' space so the header does not jump when they stream in.
            <Suspense fallback={<span className="h-9 w-48" aria-hidden="true" />}>
              <HeaderAuth />
            </Suspense>
          }
        />
        <main id="main" className="flex-1">
          {children}
        </main>
        <Footer settings={settings} />
        {modal}
      </body>
    </html>
  );
}

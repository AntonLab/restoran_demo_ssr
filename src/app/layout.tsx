import type { Metadata } from "next";
import { connection } from "next/server";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/site/header";
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
        <Header siteName={settings.name} />
        <main className="flex-1">{children}</main>
        <Footer settings={settings} />
        {modal}
      </body>
    </html>
  );
}

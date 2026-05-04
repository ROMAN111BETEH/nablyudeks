import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";
import { defaultSiteData } from "@/lib/default-data";
import { getSiteData } from "@/lib/repository";

export async function generateMetadata(): Promise<Metadata> {
  const data = await getSiteData();
  const content = data.content || defaultSiteData.content;

  return {
    title: content.seoTitle,
    description: content.seoDescription,
    icons: {
      icon: "/logo.jpg",
      shortcut: "/logo.jpg",
      apple: "/logo.jpg",
    },
    openGraph: {
      title: content.seoTitle,
      description: content.seoDescription,
      images: ["/logo.jpg"],
    },
  };
}

export default async function HomePage() {
  const data = await getSiteData();
  return <LandingPage initialData={data} />;
}

import { getPublicSettings } from "@/lib/data";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { FloatingContact } from "@/components/site/FloatingContact";
import { ChatWidget } from "@/components/chat/ChatWidget";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettings();
  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-white focus:p-2">
        Skip to content
      </a>
      <SiteHeader settings={settings} />
      <main id="main">{children}</main>
      <SiteFooter settings={settings} />
      <FloatingContact settings={settings} />
      {process.env.NEXT_PUBLIC_CHAT_ENABLED !== "false" && <ChatWidget />}
    </>
  );
}

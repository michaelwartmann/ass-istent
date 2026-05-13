import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";
import { DemoBanner } from "@/components/demo-banner";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <DemoBanner />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

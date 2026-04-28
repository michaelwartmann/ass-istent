import { SiteHeader } from "@/components/site-header";
import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

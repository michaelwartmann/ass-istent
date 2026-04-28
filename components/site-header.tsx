import Image from "next/image";
import Link from "next/link";
import { existsSync } from "node:fs";
import { join } from "node:path";

function publicExists(file: string) {
  try {
    return existsSync(join(process.cwd(), "public", file));
  } catch {
    return false;
  }
}

function LogoSlot({
  file,
  alt,
  fallback,
}: {
  file: string;
  alt: string;
  fallback: string;
}) {
  if (publicExists(file)) {
    return (
      <Image
        src={`/${file}`}
        alt={alt}
        width={48}
        height={48}
        className="h-9 w-9 object-contain"
      />
    );
  }
  return (
    <div
      aria-label={alt}
      className="flex h-9 w-9 items-center justify-center rounded-md bg-clay-soft text-[10px] font-bold text-foreground/70"
    >
      {fallback}
    </div>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
        <LogoSlot
          file="tub-bocholt-sportverein.png"
          alt="TuB Bocholt"
          fallback="TuB"
        />
        <Link href="/" className="flex select-none items-center gap-2">
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-semibold tracking-tight">
              <span className="text-[var(--clay)]">ass</span>
              <span className="text-foreground">-istent</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Coach&apos;s Notebook
            </span>
          </span>
        </Link>
        <LogoSlot file="kalisch.png" alt="Kalisch Tennis" fallback="K" />
      </div>
    </header>
  );
}

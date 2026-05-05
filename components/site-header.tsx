import Image from "next/image";
import Link from "next/link";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { getCurrentCoachName } from "@/lib/currentCoach";

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
  size = "default",
}: {
  file: string;
  alt: string;
  fallback: string;
  size?: "default" | "lg";
}) {
  const dim = size === "lg" ? "h-32 w-32" : "h-[72px] w-[72px]";
  const px = size === "lg" ? 256 : 144;
  if (publicExists(file)) {
    return (
      <Image
        src={`/${file}`}
        alt={alt}
        width={px}
        height={px}
        className={`${dim} object-contain`}
      />
    );
  }
  return (
    <div
      aria-label={alt}
      className={`flex ${dim} items-center justify-center rounded-md bg-clay-soft text-[10px] font-bold text-foreground/70`}
    >
      {fallback}
    </div>
  );
}

// German possessive: "Michaels ass-istent" but "Klaus' ass-istent" (names
// ending in s/ß/x/z take a trailing apostrophe instead of an extra s).
function possessive(name: string): string {
  return /[sßxz]$/i.test(name) ? `${name}'` : `${name}s`;
}

export async function SiteHeader() {
  const coachName = await getCurrentCoachName();

  return (
    <header className="sticky top-0 z-30 border-b border-border/70 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex shrink-0 items-center gap-2">
          <LogoSlot
            file="tub-bocholt-sportverein.png"
            alt="TuB Bocholt"
            fallback="TuB"
          />
          <LogoSlot file="tci.png" alt="TC Isselburg" fallback="TCI" />
        </div>
        <Link href="/" className="flex select-none items-center gap-2">
          <span className="flex flex-col leading-tight">
            <span className="text-lg font-semibold tracking-tight">
              {coachName ? (
                <span className="block text-foreground">
                  {possessive(coachName)}
                </span>
              ) : null}
              <span className="text-[var(--clay)]">ass</span>
              <span className="text-foreground">-istent</span>
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Coach&apos;s Notebook
            </span>
          </span>
        </Link>
        <LogoSlot
          file="kalisch.png"
          alt="Kalisch Tennis"
          fallback="K"
          size="lg"
        />
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ballBadgeClass, ballLabel, categoryLabel } from "@/lib/format";
import type { Exercise } from "@/lib/types";

export function ExerciseInfoSheet({
  exercise,
  open,
  onOpenChange,
  onSwapRequested,
}: {
  exercise: Exercise;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSwapRequested: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[85dvh] overflow-y-auto rounded-t-2xl"
      >
        <SheetHeader>
          <SheetTitle className="pr-8 text-lg leading-tight">
            {exercise.name}
          </SheetTitle>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant="secondary" className="text-[10px]">
              {categoryLabel(exercise.category)}
            </Badge>
            {exercise.ball_type ? (
              <Badge className={`${ballBadgeClass(exercise.ball_type)} border-0 text-[10px]`}>
                {ballLabel(exercise.ball_type)}
              </Badge>
            ) : null}
            {exercise.duration_minutes ? (
              <Badge variant="outline" className="text-[10px]">
                ⏱ {exercise.duration_minutes} min
              </Badge>
            ) : null}
            {exercise.level ? (
              <Badge variant="outline" className="text-[10px]">
                Level: {exercise.level}
              </Badge>
            ) : null}
            {exercise.group_size_min || exercise.group_size_max ? (
              <Badge variant="outline" className="text-[10px]">
                Gruppe {exercise.group_size_min ?? "?"}–{exercise.group_size_max ?? "?"}
              </Badge>
            ) : null}
          </div>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-2">
          {exercise.description ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {exercise.description}
            </p>
          ) : (
            <p className="text-sm italic text-muted-foreground">
              Keine Beschreibung hinterlegt.
            </p>
          )}

          {exercise.video_url ? (
            <a
              href={exercise.video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-primary underline-offset-4 hover:underline"
            >
              Video ansehen ↗
            </a>
          ) : null}

          {exercise.equipment ? (
            <section>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Material
              </p>
              <p className="text-sm">{exercise.equipment}</p>
            </section>
          ) : null}

          {exercise.tags && exercise.tags.length > 0 ? (
            <section className="flex flex-wrap gap-1">
              {exercise.tags.map((t) => (
                <Badge key={t} variant="outline" className="text-[10px]">
                  #{t}
                </Badge>
              ))}
            </section>
          ) : null}

          <Link
            href={`/exercises/${exercise.id}`}
            className="inline-flex items-center text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            Im Katalog öffnen ↗
          </Link>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 border-t bg-muted/30 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Schließen
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onSwapRequested();
            }}
          >
            Andere Übung wählen
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useTransition } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  addBlockAction,
  deleteBlockAction,
  moveBlockAction,
} from "@/lib/actions";
import { blockBadgeClass, categoryLabel } from "@/lib/format";
import type { BlockType, Exercise, PlanBlock } from "@/lib/types";
import { ExercisePicker } from "./exercise-picker";

const BLOCK_TYPES: BlockType[] = [
  "warm_up",
  "technical",
  "physical",
  "tactical",
  "points",
  "cool_down",
];

type EnrichedBlock = PlanBlock & { exercise: Exercise | null };

export function PlanEditor({
  groupId,
  weekOf,
  blocks,
  exercises,
}: {
  groupId: string;
  weekOf: string;
  blocks: EnrichedBlock[];
  exercises: Exercise[];
}) {
  const [pending, startTransition] = useTransition();

  function addBlock(type: BlockType) {
    startTransition(async () => {
      await addBlockAction({ groupId, weekOf, blockType: type });
    });
  }

  function move(blockId: string, direction: "up" | "down") {
    startTransition(async () => {
      await moveBlockAction({ groupId, blockId, direction });
    });
  }

  function remove(blockId: string) {
    startTransition(async () => {
      await deleteBlockAction({ groupId, blockId });
    });
  }

  return (
    <div className="space-y-2">
      {blocks.length === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
          Noch kein Plan für diese Woche. Block hinzufügen ↓
        </p>
      ) : (
        <ul className="space-y-2">
          {blocks.map((b, i) => (
            <li key={b.id}>
              <div className="flex items-center gap-2 rounded-md border bg-card p-2">
                <span
                  className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wider border ${blockBadgeClass(
                    b.block_type,
                  )}`}
                >
                  {categoryLabel(b.block_type)}
                </span>
                <ExercisePicker
                  groupId={groupId}
                  blockId={b.id}
                  blockType={b.block_type}
                  exercises={exercises}
                  triggerClassName={`min-w-0 flex-1 truncate rounded border px-2 py-1 text-left text-sm transition-colors ${
                    b.exercise
                      ? "border-transparent font-medium hover:bg-muted"
                      : "border-dashed border-muted-foreground/40 italic text-muted-foreground hover:border-[var(--clay)] hover:text-foreground"
                  }`}
                  triggerLabel={b.exercise?.name ?? "Übung wählen…"}
                />
                {b.duration_minutes ? (
                  <Badge variant="secondary" className="shrink-0 text-[10px]">
                    {b.duration_minutes} min
                  </Badge>
                ) : null}
                <div className="flex shrink-0 items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="nach oben"
                    disabled={pending || i === 0}
                    onClick={() => move(b.id, "up")}
                    className="h-7 w-7"
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="nach unten"
                    disabled={pending || i === blocks.length - 1}
                    onClick={() => move(b.id, "down")}
                    className="h-7 w-7"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="löschen"
                    disabled={pending}
                    onClick={() => remove(b.id)}
                    className="h-7 w-7 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger
          disabled={pending}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full")}
        >
          <Plus className="mr-1 h-4 w-4" />
          Block hinzufügen
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          {BLOCK_TYPES.map((t) => (
            <DropdownMenuItem key={t} onSelect={() => addBlock(t)}>
              <span
                className={`mr-2 inline-block h-2 w-2 rounded-full border ${blockBadgeClass(
                  t,
                )}`}
              />
              {categoryLabel(t)}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";
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
  scalePlanBlocksAction,
} from "@/lib/actions";
import { blockBadgeClass, categoryLabel } from "@/lib/format";
import type { BlockType, Exercise, PlanBlock } from "@/lib/types";
import { ExercisePicker } from "./exercise-picker";
import { ExerciseInfoSheet } from "./exercise-info-sheet";
import { BlockDurationSheet } from "./block-duration-sheet";

const BLOCK_TYPES: BlockType[] = [
  "warm_up",
  "technical",
  "physical",
  "tactical",
  "points",
  "cool_down",
];

const CLOSING_MINUTES = 5;

type EnrichedBlock = PlanBlock & { exercise: Exercise | null };

export function PlanEditor({
  groupId,
  weekOf,
  blocks,
  exercises,
  lessonMinutes,
}: {
  groupId: string;
  weekOf: string;
  blocks: EnrichedBlock[];
  exercises: Exercise[];
  lessonMinutes: number;
}) {
  const [pending, startTransition] = useTransition();

  function showError(err: unknown, fallback: string) {
    toast.error(err instanceof Error ? err.message : fallback);
  }

  function addBlock(type: BlockType) {
    startTransition(async () => {
      try {
        await addBlockAction({ groupId, weekOf, blockType: type });
      } catch (err) {
        showError(err, "Block konnte nicht angelegt werden.");
      }
    });
  }

  function move(blockId: string, direction: "up" | "down") {
    startTransition(async () => {
      try {
        await moveBlockAction({ groupId, blockId, direction });
      } catch (err) {
        showError(err, "Block konnte nicht verschoben werden.");
      }
    });
  }

  function remove(blockId: string) {
    startTransition(async () => {
      try {
        await deleteBlockAction({ groupId, blockId });
      } catch (err) {
        showError(err, "Block konnte nicht gelöscht werden.");
      }
    });
  }

  function scale() {
    if (blocks.length === 0) {
      toast.error("Erst Übungen hinzufügen.");
      return;
    }
    startTransition(async () => {
      try {
        await scalePlanBlocksAction({ groupId, weekOf });
        toast.success(`Auf ${target} min skaliert.`);
      } catch (err) {
        showError(err, "Skalieren fehlgeschlagen.");
      }
    });
  }

  const variableSum = blocks.reduce((s, b) => s + (b.duration_minutes ?? 0), 0);
  const total = variableSum + CLOSING_MINUTES;
  const target = lessonMinutes - CLOSING_MINUTES;
  const delta = total - lessonMinutes;
  const totalToneClass =
    delta === 0
      ? "text-emerald-600"
      : Math.abs(delta) <= 2
        ? "text-muted-foreground"
        : "text-amber-600";

  return (
    <div className="space-y-2">
      {blocks.length === 0 ? (
        <p className="rounded-md border border-dashed bg-muted/30 px-3 py-6 text-center text-sm text-muted-foreground">
          Noch kein Plan für diese Woche. Block hinzufügen ↓
        </p>
      ) : (
        <ul className="space-y-2">
          {blocks.map((b, i) => (
            <BlockRow
              key={b.id}
              block={b}
              index={i}
              isLast={i === blocks.length - 1}
              groupId={groupId}
              exercises={exercises}
              pending={pending}
              onMove={move}
              onRemove={remove}
            />
          ))}
        </ul>
      )}

      <ClosingRow />

      <div className="flex items-center justify-between gap-2 px-1 pt-1 text-[11px]">
        <span className={cn("tabular-nums", totalToneClass)}>
          Gesamt {total} / {lessonMinutes} min
          {delta === 0 ? " ✓" : delta > 0 ? ` (+${delta})` : ` (${delta})`}
        </span>
        <button
          type="button"
          onClick={scale}
          disabled={pending || blocks.length === 0}
          className="inline-flex items-center gap-1 rounded px-1 py-0.5 text-[var(--clay)] underline-offset-4 hover:underline disabled:opacity-50"
        >
          <Sparkles className="h-3 w-3" />
          auf {target} min skalieren
        </button>
      </div>

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
            <DropdownMenuItem key={t} onClick={() => addBlock(t)}>
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

function ClosingRow() {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/40 p-2">
      <span className="shrink-0 rounded border border-muted-foreground/30 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        Abschluss
      </span>
      <span className="min-w-0 flex-1 truncate text-sm italic text-muted-foreground">
        Platz fegen, Bälle sammeln
      </span>
      <Badge variant="outline" className="shrink-0 text-[10px]">
        {CLOSING_MINUTES} min · fix
      </Badge>
    </div>
  );
}

function BlockRow({
  block,
  index,
  isLast,
  groupId,
  exercises,
  pending,
  onMove,
  onRemove,
}: {
  block: EnrichedBlock;
  index: number;
  isLast: boolean;
  groupId: string;
  exercises: Exercise[];
  pending: boolean;
  onMove: (blockId: string, direction: "up" | "down") => void;
  onRemove: (blockId: string) => void;
}) {
  const [infoOpen, setInfoOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [durationOpen, setDurationOpen] = useState(false);
  const handleTitleClick = block.exercise
    ? () => setInfoOpen(true)
    : () => setPickerOpen(true);
  const blockTitle = block.exercise?.name ?? categoryLabel(block.block_type);

  return (
    <li>
      <div className="flex items-center gap-2 rounded-md border bg-card p-2">
        <span
          className={`shrink-0 rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wider border ${blockBadgeClass(
            block.block_type,
          )}`}
        >
          {categoryLabel(block.block_type)}
        </span>
        <button
          type="button"
          onClick={handleTitleClick}
          className={`min-w-0 flex-1 truncate rounded border px-2 py-1 text-left text-sm transition-colors ${
            block.exercise
              ? "border-transparent font-medium hover:bg-muted"
              : "border-dashed border-muted-foreground/40 italic text-muted-foreground hover:border-[var(--clay)] hover:text-foreground"
          }`}
        >
          {block.exercise?.name ?? "Übung wählen…"}
        </button>
        <button
          type="button"
          onClick={() => setDurationOpen(true)}
          className="shrink-0 rounded border border-muted-foreground/30 bg-background px-2 py-0.5 text-[10px] font-medium tabular-nums hover:border-[var(--clay)] hover:text-[var(--clay)]"
          aria-label="Dauer anpassen"
        >
          {block.duration_minutes ?? "?"} min
        </button>
        <div className="flex shrink-0 items-center">
          <Button
            variant="ghost"
            size="icon"
            aria-label="nach oben"
            disabled={pending || index === 0}
            onClick={() => onMove(block.id, "up")}
            className="h-7 w-7"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="nach unten"
            disabled={pending || isLast}
            onClick={() => onMove(block.id, "down")}
            className="h-7 w-7"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="löschen"
            disabled={pending}
            onClick={() => onRemove(block.id)}
            className="h-7 w-7 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <ExercisePicker
        groupId={groupId}
        blockId={block.id}
        blockType={block.block_type}
        exercises={exercises}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
      />

      {block.exercise ? (
        <ExerciseInfoSheet
          exercise={block.exercise}
          open={infoOpen}
          onOpenChange={setInfoOpen}
          onSwapRequested={() => setPickerOpen(true)}
        />
      ) : null}

      <BlockDurationSheet
        groupId={groupId}
        blockId={block.id}
        blockTitle={blockTitle}
        initialMinutes={block.duration_minutes}
        open={durationOpen}
        onOpenChange={setDurationOpen}
      />
    </li>
  );
}

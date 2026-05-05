"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
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
} from "@/lib/actions";
import { blockBadgeClass, categoryLabel } from "@/lib/format";
import type { BlockType, Exercise, PlanBlock } from "@/lib/types";
import { ExercisePicker } from "./exercise-picker";
import { ExerciseInfoSheet } from "./exercise-info-sheet";

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
  const handleTitleClick = block.exercise
    ? () => setInfoOpen(true)
    : () => setPickerOpen(true);

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
        {block.duration_minutes ? (
          <Badge variant="secondary" className="shrink-0 text-[10px]">
            {block.duration_minutes} min
          </Badge>
        ) : null}
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
    </li>
  );
}

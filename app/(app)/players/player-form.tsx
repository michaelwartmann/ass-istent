"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createPlayerAction,
  updatePlayerAction,
  type PlayerInput,
} from "@/lib/actions";
import type { Backhand, Group, Hand, Player } from "@/lib/types";

type GroupOption = Pick<Group, "id" | "name">;

type Mode =
  | { kind: "create"; initialGroupId?: string }
  | { kind: "edit"; player: Player };

const HAND_OPTIONS: { value: Hand | "none"; label: string }[] = [
  { value: "none", label: "Unbekannt" },
  { value: "right", label: "Rechts" },
  { value: "left", label: "Links" },
];

const BACKHAND_OPTIONS: { value: Backhand | "none"; label: string }[] = [
  { value: "none", label: "Unbekannt" },
  { value: "einhaendig", label: "Einhändig" },
  { value: "beidhaendig", label: "Beidhändig" },
];

export function PlayerForm({
  mode,
  groups,
}: {
  mode: Mode;
  groups: GroupOption[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const init = mode.kind === "edit" ? mode.player : null;
  const [first, setFirst] = useState(init?.first_name ?? "");
  const [last, setLast] = useState(init?.last_name ?? "");
  const [yob, setYob] = useState(
    init?.year_of_birth != null ? String(init.year_of_birth) : "",
  );
  const [groupId, setGroupId] = useState<string>(
    mode.kind === "edit"
      ? (init?.primary_group_id ?? "none")
      : (mode.initialGroupId ?? "none"),
  );
  const [hand, setHand] = useState<string>(init?.dominant_hand ?? "none");
  const [backhand, setBackhand] = useState<string>(init?.backhand ?? "none");
  const [level, setLevel] = useState(init?.level ?? "");
  const [parent, setParent] = useState(init?.parent_contact ?? "");
  const [description, setDescription] = useState(init?.description ?? "");
  const [goalsOpen, setGoalsOpen] = useState(
    !!(init?.goal_technical || init?.goal_tactical || init?.goal_physical || init?.goal_mental),
  );
  const [goalTech, setGoalTech] = useState(init?.goal_technical ?? "");
  const [goalTact, setGoalTact] = useState(init?.goal_tactical ?? "");
  const [goalPhys, setGoalPhys] = useState(init?.goal_physical ?? "");
  const [goalMent, setGoalMent] = useState(init?.goal_mental ?? "");

  function buildInput(): PlayerInput | null {
    if (!first.trim()) {
      toast.error("Vorname fehlt");
      return null;
    }
    return {
      firstName: first,
      lastName: last,
      yearOfBirth: yob ? Number(yob) : null,
      primaryGroupId: groupId === "none" ? null : groupId,
      dominantHand:
        hand === "right" || hand === "left" ? (hand as Hand) : null,
      backhand:
        backhand === "einhaendig" || backhand === "beidhaendig"
          ? (backhand as Backhand)
          : null,
      level,
      parentContact: parent,
      description,
      goalTechnical: goalTech,
      goalTactical: goalTact,
      goalPhysical: goalPhys,
      goalMental: goalMent,
    };
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const fields = buildInput();
    if (!fields) return;
    startTransition(async () => {
      try {
        if (mode.kind === "create") {
          const id = await createPlayerAction(fields);
          toast.success("Spieler angelegt");
          if (id) router.push(`/players/${id}`);
          else router.push("/players");
        } else {
          await updatePlayerAction({
            playerId: mode.player.id,
            fields,
          });
          toast.success("Spieler gespeichert");
          router.push(`/players/${mode.player.id}`);
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err));
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="first">Vorname *</Label>
          <Input
            id="first"
            value={first}
            onChange={(e) => setFirst(e.target.value)}
            autoFocus
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="last" className="text-muted-foreground">
            Nachname (optional)
          </Label>
          <Input
            id="last"
            value={last}
            onChange={(e) => setLast(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="yob">Jahrgang</Label>
          <Input
            id="yob"
            inputMode="numeric"
            placeholder="z.B. 2014"
            value={yob}
            onChange={(e) => setYob(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Gruppe</Label>
          <Select
            value={groupId}
            onValueChange={(v) => setGroupId(v ?? "none")}
          >
            <SelectTrigger>
              <SelectValue placeholder="Gruppe wählen">
                {(v: string) =>
                  v === "none"
                    ? "— keine —"
                    : (groups.find((g) => g.id === v)?.name ?? "")
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— keine —</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  {g.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>Hand</Label>
          <Select value={hand} onValueChange={(v) => setHand(v ?? "none")}>
            <SelectTrigger>
              <SelectValue>
                {(v: string) =>
                  HAND_OPTIONS.find((o) => o.value === v)?.label ?? ""
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {HAND_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Rückhand</Label>
          <Select
            value={backhand}
            onValueChange={(v) => setBackhand(v ?? "none")}
          >
            <SelectTrigger>
              <SelectValue>
                {(v: string) =>
                  BACKHAND_OPTIONS.find((o) => o.value === v)?.label ?? ""
                }
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {BACKHAND_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="level">Niveau</Label>
          <Input
            id="level"
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="LK 23 / Anfänger / …"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="parent" className="text-muted-foreground">
            Eltern-Kontakt (privat)
          </Label>
          <Input
            id="parent"
            value={parent}
            onChange={(e) => setParent(e.target.value)}
            placeholder="0151 …"
          />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="desc">Beschreibung</Label>
        <Textarea
          id="desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Charakter, Spielstil, Stärken (optional)"
          className="min-h-20"
        />
      </div>

      <div className="rounded-md border bg-muted/20">
        <button
          type="button"
          onClick={() => setGoalsOpen((v) => !v)}
          className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium"
          aria-expanded={goalsOpen}
        >
          <span>Lernziele setzen</span>
          {goalsOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
        {goalsOpen ? (
          <div className="space-y-3 border-t p-3">
            <GoalRow
              dim="Technik"
              color="bg-sky-100 text-sky-900 border-sky-200"
              value={goalTech}
              onChange={setGoalTech}
            />
            <GoalRow
              dim="Taktik"
              color="bg-violet-100 text-violet-900 border-violet-200"
              value={goalTact}
              onChange={setGoalTact}
            />
            <GoalRow
              dim="Athletik"
              color="bg-rose-100 text-rose-900 border-rose-200"
              value={goalPhys}
              onChange={setGoalPhys}
            />
            <GoalRow
              dim="Mental"
              color="bg-emerald-100 text-emerald-900 border-emerald-200"
              value={goalMent}
              onChange={setGoalMent}
            />
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={pending}
        >
          Abbrechen
        </Button>
        <Button
          type="submit"
          disabled={pending}
          className="bg-[var(--clay)] hover:bg-[var(--clay)]/90"
        >
          {mode.kind === "edit" ? "Speichern" : "Anlegen"}
        </Button>
      </div>
    </form>
  );
}

function GoalRow({
  dim,
  color,
  value,
  onChange,
}: {
  dim: string;
  color: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <span
        className={`inline-block rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${color}`}
      >
        {dim}
      </span>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`Aktuelles Lernziel · ${dim}`}
      />
    </div>
  );
}

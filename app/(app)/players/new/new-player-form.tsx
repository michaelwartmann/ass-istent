"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createPlayerAction } from "@/lib/actions";
import type { Group } from "@/lib/types";

type GroupOption = Pick<Group, "id" | "name">;

export function NewPlayerForm({
  groups,
  initialGroupId,
}: {
  groups: GroupOption[];
  initialGroupId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [yob, setYob] = useState("");
  const [groupId, setGroupId] = useState<string>(initialGroupId ?? "none");
  const [hand, setHand] = useState<string>("none");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!first.trim()) {
      toast.error("Vorname fehlt");
      return;
    }
    startTransition(async () => {
      try {
        const id = await createPlayerAction({
          firstName: first.trim(),
          lastName: last.trim() || undefined,
          yearOfBirth: yob ? Number(yob) : undefined,
          primaryGroupId: groupId === "none" ? undefined : groupId,
          dominantHand:
            hand === "right" || hand === "left" ? hand : undefined,
        });
        toast.success("Spieler angelegt");
        if (id) router.push(`/players/${id}`);
        else router.push("/players");
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
          <Label htmlFor="last">Nachname</Label>
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
          <Label>Hand</Label>
          <Select value={hand} onValueChange={(v) => setHand(v ?? "none")}>
            <SelectTrigger>
              <SelectValue placeholder="—" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">—</SelectItem>
              <SelectItem value="right">Rechts</SelectItem>
              <SelectItem value="left">Links</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label>Gruppe</Label>
        <Select value={groupId} onValueChange={(v) => setGroupId(v ?? "none")}>
          <SelectTrigger>
            <SelectValue placeholder="Gruppe wählen" />
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
          Anlegen
        </Button>
      </div>
    </form>
  );
}

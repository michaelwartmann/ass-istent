import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getCurrentCoachId(): Promise<string | null> {
  return (await cookies()).get("coach_id")?.value ?? null;
}

export async function getCurrentCoachName(): Promise<string | null> {
  const raw = (await cookies()).get("coach_name")?.value;
  if (!raw) return null;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export async function requireCoachId(): Promise<string> {
  const id = await getCurrentCoachId();
  if (!id) redirect("/login");
  return id;
}

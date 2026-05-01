import { NextResponse } from "next/server";
import { requireCoachId } from "@/lib/currentCoach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/audio/transcriptions";

export async function POST(request: Request) {
  await requireCoachId();

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is not configured" },
      { status: 500 },
    );
  }

  let inForm: FormData;
  try {
    inForm = await request.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }
  const file = inForm.get("file");
  if (!(file instanceof Blob) || file.size === 0) {
    return NextResponse.json(
      { error: "No audio file in request" },
      { status: 400 },
    );
  }

  const out = new FormData();
  out.append(
    "file",
    file,
    file instanceof File && file.name ? file.name : "chunk.webm",
  );
  out.append("model", "openai/whisper-1");
  out.append("language", "de");
  out.append(
    "prompt",
    "Tennistraining: Vorhand, Rückhand, Aufschlag, Slice, Topspin, Treffpunkt, Ausholbewegung, Beinarbeit, Cross, Long-Line.",
  );

  const upstream = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://ass-istent.vercel.app",
      "X-Title": "ass-istent",
    },
    body: out,
  });

  const raw = await upstream.text();
  if (!upstream.ok) {
    return NextResponse.json(
      {
        error: `OpenRouter returned ${upstream.status}`,
        detail: raw.slice(0, 500),
      },
      { status: 502 },
    );
  }

  let parsed: { text?: string } = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    return NextResponse.json(
      { error: "OpenRouter returned non-JSON", detail: raw.slice(0, 500) },
      { status: 502 },
    );
  }

  return NextResponse.json({ text: (parsed.text ?? "").trim() });
}

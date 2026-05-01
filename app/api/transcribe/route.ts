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
  // Be explicit: ask OpenRouter for a JSON envelope. Without this some
  // backends fall back to "text" mode and return the bare transcript.
  out.append("response_format", "json");
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
    console.error("[/api/transcribe] upstream error", upstream.status, raw.slice(0, 500));
    return NextResponse.json(
      {
        error: `OpenRouter returned ${upstream.status}`,
        detail: raw.slice(0, 500),
      },
      { status: 502 },
    );
  }

  // Whisper's `response_format=json` returns `{"text":"..."}`. But
  // OpenRouter sometimes proxies the response as plain text (the bare
  // transcript) — in that case JSON.parse blows up on the first
  // non-JSON character (e.g. "No number after minus sign in JSON at
  // position 1" when the transcript starts with a dash). Fall back to
  // treating the body as the transcript text.
  const trimmed = raw.trim();
  let text = "";
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed) as { text?: string };
      text = (parsed.text ?? "").toString();
    } catch {
      console.error(
        "[/api/transcribe] JSON-shaped body failed to parse",
        trimmed.slice(0, 200),
      );
      text = trimmed;
    }
  } else {
    text = trimmed;
  }

  return NextResponse.json({ text: text.trim() });
}

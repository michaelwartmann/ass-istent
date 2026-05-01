import { NextResponse } from "next/server";
import { requireCoachId } from "@/lib/currentCoach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// OpenRouter's /audio/transcriptions returns 404 "No successful provider
// responses." for both openai/whisper-1 and openai/whisper-large-v3 — the
// route exists in their docs but no provider is actually wired up. So we
// transcribe via /chat/completions with an audio-input multimodal model
// instead. Gemini 2.0 Flash is fast, cheap (~$0.10/M tokens), excellent
// German, and definitely live in OpenRouter's models registry.
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const TRANSCRIPTION_MODEL = "google/gemini-2.0-flash-001";

// Map a MIME type or filename to the audio `format` field accepted by
// OpenRouter's input_audio content block.
function detectFormat(mime: string, name: string): string {
  const m = mime.toLowerCase();
  if (m.includes("webm")) return "webm";
  if (m.includes("mp4") || m.includes("m4a") || m.includes("aac")) return "mp4";
  if (m.includes("wav") || m.includes("wave")) return "wav";
  if (m.includes("mpeg") || m.includes("mp3")) return "mp3";
  if (m.includes("ogg")) return "ogg";
  if (m.includes("flac")) return "flac";
  const ext = name.toLowerCase().split(".").pop();
  if (
    ext === "webm" ||
    ext === "wav" ||
    ext === "mp3" ||
    ext === "mp4" ||
    ext === "m4a" ||
    ext === "ogg" ||
    ext === "flac"
  ) {
    return ext === "m4a" ? "mp4" : ext;
  }
  return "webm";
}

const TRANSCRIPTION_PROMPT =
  "Transkribiere das deutsche Audio wörtlich. Gib NUR den gesprochenen " +
  "Text zurück, ohne Anführungszeichen, ohne Kommentare, ohne Zeitstempel. " +
  "Wenn das Audio leer ist, gib einen leeren String zurück. " +
  "Kontext: Tennistraining (Vorhand, Rückhand, Aufschlag, Slice, Topspin, " +
  "Treffpunkt, Cross, Long-Line).";

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

  const name = file instanceof File ? file.name : "";
  const format = detectFormat(file.type || "", name);
  const buf = Buffer.from(await file.arrayBuffer());
  const b64 = buf.toString("base64");

  const upstream = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ass-istent.vercel.app",
      "X-Title": "ass-istent",
    },
    body: JSON.stringify({
      model: TRANSCRIPTION_MODEL,
      messages: [
        {
          role: "user",
          content: [
            { type: "input_audio", input_audio: { data: b64, format } },
            { type: "text", text: TRANSCRIPTION_PROMPT },
          ],
        },
      ],
      // Keep responses short and deterministic.
      temperature: 0,
    }),
  });

  const raw = await upstream.text();
  if (!upstream.ok) {
    console.error(
      "[/api/transcribe] upstream error",
      upstream.status,
      raw.slice(0, 500),
    );
    return NextResponse.json(
      {
        error: `OpenRouter returned ${upstream.status}`,
        detail: raw.slice(0, 500),
      },
      { status: 502 },
    );
  }

  let text = "";
  try {
    const parsed = JSON.parse(raw) as {
      choices?: Array<{
        message?: { content?: string | Array<{ text?: string }> };
      }>;
    };
    const content = parsed.choices?.[0]?.message?.content;
    if (typeof content === "string") {
      text = content;
    } else if (Array.isArray(content)) {
      text = content.map((c) => c.text ?? "").join("");
    }
  } catch {
    console.error(
      "[/api/transcribe] body did not parse as JSON",
      raw.slice(0, 200),
    );
  }

  // The model occasionally wraps its reply in quotes; strip them.
  text = text.trim().replace(/^["„»]+|["“«]+$/g, "").trim();
  return NextResponse.json({ text });
}

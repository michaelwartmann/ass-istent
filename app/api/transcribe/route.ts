import { NextResponse } from "next/server";
import { requireCoachId } from "@/lib/currentCoach";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OPENROUTER_URL =
  "https://openrouter.ai/api/v1/audio/transcriptions";

// Map a MIME type or filename to OpenRouter's `format` field.
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

  // OpenRouter's /audio/transcriptions takes a JSON body with the audio
  // base64-encoded under input_audio.data. NOT multipart/form-data —
  // sending multipart caused OpenRouter's parser to choke on the boundary
  // delimiter ("No number after minus sign in JSON at position 1").
  const upstream = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ass-istent.vercel.app",
      "X-Title": "ass-istent",
    },
    body: JSON.stringify({
      model: "openai/whisper-1",
      input_audio: { data: b64, format },
      language: "de",
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
    const parsed = JSON.parse(raw) as { text?: string };
    text = (parsed.text ?? "").toString();
  } catch {
    console.error(
      "[/api/transcribe] body did not parse as JSON",
      raw.slice(0, 200),
    );
    text = raw.trim();
  }

  return NextResponse.json({ text: text.trim() });
}

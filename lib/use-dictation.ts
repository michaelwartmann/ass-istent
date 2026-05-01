"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// Pick a MIME type the current browser can record. Whisper accepts
// webm + mp4, so this list covers Chrome, Firefox, and Safari.
function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/mp4;codecs=mp4a.40.2",
  ];
  for (const m of candidates) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return "";
}

function extensionFor(mime: string): string {
  if (mime.startsWith("audio/webm")) return "webm";
  if (mime.startsWith("audio/mp4")) return "m4a";
  return "webm";
}

type UseDictationArgs = {
  onText: (text: string) => void;
  // How long each chunk is before it's cut + sent. Smaller = words appear
  // sooner; larger = better recognition context, fewer requests.
  chunkSeconds?: number;
};

export type UseDictation = {
  supported: boolean;
  listening: boolean;
  pendingChunks: number;
  start: () => Promise<void>;
  stop: () => void;
};

export function useDictation({
  onText,
  chunkSeconds = 5,
}: UseDictationArgs): UseDictation {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [pendingChunks, setPendingChunks] = useState(0);

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const cycleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Serialize transcribe POSTs so chunks land in order even if requests
  // overlap.
  const sendQueueRef = useRef<Promise<void>>(Promise.resolve());
  const aliveRef = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setSupported(
      typeof MediaRecorder !== "undefined" &&
        !!navigator.mediaDevices?.getUserMedia &&
        !!pickMimeType(),
    );
  }, []);

  // Always tear down on unmount, even mid-recording.
  useEffect(() => {
    return () => {
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const teardown = useCallback(() => {
    aliveRef.current = false;
    if (cycleTimerRef.current) {
      clearTimeout(cycleTimerRef.current);
      cycleTimerRef.current = null;
    }
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      try {
        recorderRef.current.stop();
      } catch {
        // ignore
      }
    }
    recorderRef.current = null;
    if (streamRef.current) {
      for (const t of streamRef.current.getTracks()) t.stop();
      streamRef.current = null;
    }
    setListening(false);
  }, []);

  const sendChunk = useCallback(
    async (blob: Blob, mime: string) => {
      if (blob.size < 1024) return; // ignore stub chunks
      const ext = extensionFor(mime);
      const file = new File([blob], `chunk.${ext}`, { type: mime });
      const fd = new FormData();
      fd.append("file", file);

      setPendingChunks((n) => n + 1);
      try {
        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) {
          let detail = "";
          try {
            const j = (await res.json()) as { error?: string; detail?: string };
            detail = j.detail || j.error || "";
          } catch {
            // ignore
          }
          throw new Error(detail || `HTTP ${res.status}`);
        }
        const data = (await res.json()) as { text?: string };
        const text = (data.text ?? "").trim();
        if (text) onText(text);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(`Transkription fehlgeschlagen: ${msg}`);
      } finally {
        setPendingChunks((n) => Math.max(0, n - 1));
      }
    },
    [onText],
  );

  // Start one short recording cycle. When it ends, send the chunk and —
  // if we're still alive — kick off the next one. We use stop+restart
  // (not timeslice) so each chunk is a complete, parseable file.
  const startCycle = useCallback(() => {
    const stream = streamRef.current;
    if (!stream || !aliveRef.current) return;
    const mime = pickMimeType();
    if (!mime) return;
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    recorderRef.current = recorder;

    const parts: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) parts.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(parts, { type: mime });
      // Queue the send so chunks transcribe in order.
      sendQueueRef.current = sendQueueRef.current.then(() =>
        sendChunk(blob, mime),
      );
      if (aliveRef.current) {
        startCycle();
      }
    };
    recorder.start();
    cycleTimerRef.current = setTimeout(() => {
      try {
        if (recorder.state !== "inactive") recorder.stop();
      } catch {
        // ignore
      }
    }, chunkSeconds * 1000);
  }, [chunkSeconds, sendChunk]);

  const start = useCallback(async () => {
    if (!supported) {
      toast.error("Aufnahme wird in diesem Browser nicht unterstützt.");
      return;
    }
    if (listening) return;
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/permission|denied|notallowed/i.test(msg)) {
        toast.error("Mikrofon-Zugriff abgelehnt.");
      } else {
        toast.error(`Mikrofon-Fehler: ${msg}`);
      }
      return;
    }
    streamRef.current = stream;
    aliveRef.current = true;
    setListening(true);
    startCycle();
  }, [supported, listening, startCycle]);

  const stop = useCallback(() => {
    teardown();
  }, [teardown]);

  return { supported, listening, pendingChunks, start, stop };
}

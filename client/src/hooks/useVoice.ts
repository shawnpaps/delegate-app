import { useState, useRef, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export type VoiceState = "idle" | "recording" | "processing" | "done" | "error";

export function useVoice() {
  const [state, setState] = useState<VoiceState>("idle");
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript(null);
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.start(250);
      mediaRecorderRef.current = mediaRecorder;
      setState("recording");
    } catch {
      setError("Microphone access denied");
      setState("error");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (!mediaRecorder || mediaRecorder.state !== "recording") return;

    return new Promise<string>((resolve, reject) => {
      mediaRecorder.onstop = async () => {
        setState("processing");

        // Stop all tracks
        mediaRecorder.stream.getTracks().forEach((t) => t.stop());

        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const formData = new FormData();
          formData.append("file", blob, "recording.webm");

          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (!session) throw new Error("Not authenticated");

          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transcribe`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${session.access_token}`,
              },
              body: formData,
            }
          );

          if (!res.ok) {
            throw new Error(`Transcription failed: ${res.status}`);
          }

          const { transcript: text } = await res.json();
          setTranscript(text);
          setState("done");
          resolve(text);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Transcription failed";
          setError(msg);
          setState("error");
          reject(err);
        }
      };

      mediaRecorder.stop();
    });
  }, []);

  const speak = useCallback(async (text: string): Promise<Blob> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/speak`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      }
    );

    if (!res.ok) {
      throw new Error(`TTS failed: ${res.status}`);
    }

    return res.blob();
  }, []);

  const reset = useCallback(() => {
    setState("idle");
    setTranscript(null);
    setError(null);
    chunksRef.current = [];
  }, []);

  return {
    state,
    transcript,
    error,
    startRecording,
    stopRecording,
    speak,
    reset,
  };
}

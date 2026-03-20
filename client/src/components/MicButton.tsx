import { useVoice, type VoiceState } from "@/hooks/useVoice";

interface MicButtonProps {
  onTranscript: (transcript: string) => void;
}

const stateLabels: Record<VoiceState, string> = {
  idle: "Tap to speak",
  recording: "Listening... (tap to stop)",
  processing: "Transcribing...",
  done: "Done!",
  error: "Error — tap to retry",
};

export function MicButton({ onTranscript }: MicButtonProps) {
  const { state, transcript, error, startRecording, stopRecording, reset } =
    useVoice();

  const handleClick = async () => {
    if (state === "idle" || state === "error" || state === "done") {
      reset();
      await startRecording();
    } else if (state === "recording") {
      const text = await stopRecording();
      if (text) {
        onTranscript(text);
      }
    }
  };

  const isRecording = state === "recording";

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleClick}
        className={`relative flex h-20 w-20 items-center justify-center rounded-full transition-all ${
          isRecording
            ? "bg-red-500 animate-pulse scale-110"
            : state === "error"
              ? "bg-red-100 text-red-600"
              : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
      >
        {/* Microphone icon */}
        <svg
          className="h-8 w-8"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
          />
        </svg>

        {isRecording && (
          <span className="absolute inset-0 rounded-full border-4 border-red-300 animate-ping" />
        )}
      </button>

      <p className="text-sm text-gray-500">{stateLabels[state]}</p>

      {transcript && state === "done" && (
        <p className="max-w-xs text-center text-sm text-gray-700">
          &ldquo;{transcript}&rdquo;
        </p>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

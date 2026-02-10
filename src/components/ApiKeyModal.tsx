import { useState } from "react";
import { useApiKey } from "./ApiKeyContext";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function ApiKeyModal({ open, onClose }: Props) {
  const { setApiKey } = useApiKey();
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const save = () => {
    if (!input || input.length < 20) {
      setError("Invalid API key");
      return;
    }

    setApiKey(input.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="relative bg-white w-full max-w-sm rounded-xl shadow-md p-4 flex flex-col gap-3">

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-2 text-gray-400 hover:text-black text-lg"
        >
          ✕
        </button>

        <h2 className="text-base font-semibold text-center">
          Enter Groq API Key
        </h2>

        <input
          type="password"
          placeholder="Paste your Groq API key"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
        />

        {error && (
          <p className="text-red-500 text-xs text-center">{error}</p>
        )}

        <button
          onClick={save}
          className="bg-slate-900 text-white py-2 rounded-lg text-sm"
        >
          Save Key
        </button>
      </div>
    </div>
  );
}

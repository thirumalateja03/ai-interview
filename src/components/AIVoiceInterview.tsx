import { useEffect, useRef, useState } from "react";
import { useApiKey } from "./ApiKeyContext";
import { sendInterviewMessage, type Message } from "../services/groqInterviewService";
import { useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";

export default function AIVoiceInterview() {
  const { apiKey } = useApiKey();
  const { topicId } = useParams<{ topicId: string }>();

  const [running, setRunning] = useState(false);
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [topic, setTopic] = useState("");
  const [userPrompt, setUserPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [topicLoading, setTopicLoading] = useState(false);


  const silenceTimerRef = useRef<any>(null);
  const recognitionRef = useRef<any>(null);
  const messagesRef = useRef<Message[]>([]);
  const systemPromptRef = useRef<Message | null>(null);

  /* ---------------- fetch topic ---------------- */
  useEffect(() => {
    if (!topicId) return;

    async function fetchTopic() {
      setTopicLoading(true);
      const { data, error } = await supabase
        .from("topics")
        .select("name")
        .eq("id", topicId)
        .single();

      if (error) setError("Failed to load topic");
      else setTopic(data?.name || "");

      setTopicLoading(false);
    }

    fetchTopic();
  }, [topicId]);

  /* ---------------- speak ---------------- */
  const speak = (text: string, cb?: () => void) => {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.onend = () => cb?.();
    speechSynthesis.speak(u);
  };

  /* ---------------- build system prompt ---------------- */
  const createSystemPrompt = (): Message => ({
    role: "system",
    content: `
You are a STRICT professional interviewer.

Topic: ${topic}
Candidate instructions: ${userPrompt}

Rules:
- Ask ONE question only
- Keep replies under 2 sentences unless code required
- No explanations unless candidate asks
- Ask probing follow-ups for weak answers
- Validate behavioral answers using STAR framework
- Prefer real-world scenario questions
- After 10 questions provide short evaluation (3 lines)
`
  });

  /* ---------------- start interview ---------------- */
  const startInterview = async () => {
    if (!apiKey) return setError("API key missing");
    if (!topic) return setError("Topic not ready");

    setError(null);
    setRunning(true);
    setStatus("Generating first question...");

    const systemPrompt = createSystemPrompt();
    systemPromptRef.current = systemPrompt;

    try {
      const firstReply = await sendInterviewMessage(apiKey, [systemPrompt]);

      const assistantFirst: Message = {
        role: "assistant",
        content: firstReply
      };

      const msgs: Message[] = [systemPrompt, assistantFirst];
      messagesRef.current = msgs;

      speak(firstReply, startListening);
    } catch {
      setError("Failed generating question");
    }
  };

  /* ---------------- listening ---------------- */
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("Speech recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setListening(true);
      setStatus("Listening...");

      silenceTimerRef.current = setTimeout(() => {
        recognition.stop();

        speak(
          "No response detected for several seconds. Ending the interview now.",
          () => stopInterview()
        );
      }, 6000);
    };


    recognition.onresult = async (e: any) => {
      clearTimeout(silenceTimerRef.current);
      setStatus("Processing...");
      const text = e.results[0][0].transcript;

      const userMsg: Message = { role: "user", content: text };
      messagesRef.current = [...messagesRef.current, userMsg];

      /* keep system prompt + last 10 messages */
      const context: Message[] = [
        systemPromptRef.current!,
        ...messagesRef.current.slice(-10),
      ];


      try {
        const aiReply = await sendInterviewMessage(apiKey!, context);

        const assistantMsg: Message = {
          role: "assistant",
          content: aiReply
        };

        messagesRef.current = [...messagesRef.current, assistantMsg];


        speak(aiReply, startListening);
      } catch {
        setError("AI request failed");
      }
    };

    recognition.onend = () => {
      clearTimeout(silenceTimerRef.current);
      setListening(false);
    };

    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
  };

  /* ---------------- stop ---------------- */
  const stopInterview = () => {
    clearTimeout(silenceTimerRef.current);
    setRunning(false);
    recognitionRef.current?.stop();
    speechSynthesis.cancel();
    setStatus("Interview ended");
  };


  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-sm border p-6 flex flex-col gap-5">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl font-semibold">AI Voice Interview</h1>
          <p className="text-sm text-gray-500 truncate">{topic}</p>
        </div>

        {/* Setup inputs */}
        {!running && (
          <div className="flex flex-col gap-3">
            <input
              value={topic}
              disabled={!!topicId || topicLoading}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Topic"
              className="border rounded-lg px-3 py-2 text-sm"
            />

            <textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Optional candidate instructions"
              className="border rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}

        {/* Status indicator */}
        {running && (
          <div className="flex flex-col items-center gap-2">
            <div className="relative flex items-center justify-center">
              <div className="absolute h-16 w-16 rounded-full bg-green-200 animate-ping"></div>
              <div className="h-14 w-14 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
                Mic
              </div>
            </div>

            <p className="text-sm text-gray-600">{status}</p>
          </div>
        )}

        {/* Buttons */}
        {!running ? (
          <button
            disabled={topicLoading}
            onClick={startInterview}
            className="w-full py-3 bg-black text-white rounded-xl font-medium hover:opacity-90 transition"
          >
            Start Interview
          </button>
        ) : (
          <button
            onClick={stopInterview}
            className="w-full py-3 bg-red-500 text-white rounded-xl font-medium hover:opacity-90 transition"
          >
            Stop Interview
          </button>
        )}

        {/* Errors */}
        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}

        {/* Mic State */}
        {running && (
          <div className="text-center text-xs text-gray-400">
            {listening ? "Listening..." : "Waiting for next response"}
          </div>
        )}
      </div>
    </div>
  );
}

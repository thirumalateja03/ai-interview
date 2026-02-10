import { useEffect, useRef, useState } from "react";
import { 
  Mic, 
  MicOff, 
  Play,
  Volume2, 
  MessageCircle,
  Loader2,
  AlertCircle,
  Info
} from "lucide-react";

export type Question = {
    id: string;
    question: string;
    answer: string;
};

type Props = {
    questions: Question[];
};

const SILENCE_TIMEOUT = 5000;
const MATCH_THRESHOLD = 0.4;

export default function VoicePractice({ questions }: Props) {
    const [sessionRunning, setSessionRunning] = useState(false);
    const [currentIndex, setCurrentIndex] = useState<number | null>(null);
    const [listening, setListening] = useState(false);
    const [transcript, setTranscript] = useState("");
    const [, setAttempt] = useState(1);
    const [error, setError] = useState<string | null>(null);

    const recognitionRef = useRef<any>(null);
    const silenceTimer = useRef<any>(null);
    const activeSessionRef = useRef(false);
    const lastTranscriptRef = useRef("");
    const retryUsedRef = useRef(false);

    const DONT_KNOW_PHRASES = [
        "i dont know",
        "i don't know",
        "not sure",
        "no idea",
        "skip",
        "dont know",
    ];

    const FRIENDLY_REVEAL_LINES = [
        "No problem. Let me explain.",
        "That's okay. Here's the answer.",
        "No worries, the correct answer is this.",
    ];

    const STOP_SESSION_PHRASES = [
        "stop session",
        "stop the session",
        "end session",
        "end practice",
        "stop practice",
        "quit session",
    ];

    const normalize = (text: string) =>
        text.toLowerCase().replace(/[^\w\s]/g, "").trim();

    const userDoesNotKnow = (text: string) => {
        return DONT_KNOW_PHRASES.some(p => text.includes(p));
    };

    const userWantsStop = (text: string) => {
        const cleaned = normalize(text);
        return STOP_SESSION_PHRASES.some(
            phrase => cleaned === phrase
        );
    };

    const randomFriendlyLine = () =>
        FRIENDLY_REVEAL_LINES[Math.floor(Math.random() * FRIENDLY_REVEAL_LINES.length)];

    const nextRandomIndex = (current: number | null) => {
        if (questions.length <= 1) return 0;

        let idx = Math.floor(Math.random() * questions.length);
        while (idx === current) {
            idx = Math.floor(Math.random() * questions.length);
        }
        return idx;
    };

    const speak = (text: string, cb?: () => void) => {
        speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => cb?.();
        speechSynthesis.speak(utterance);
    };

    const startSession = () => {
        if (!questions.length) return;
        activeSessionRef.current = true;
        setSessionRunning(true);
        setAttempt(1);
        setTranscript("");
        setCurrentIndex(nextRandomIndex(null));
    };

    const stopSession = () => {
        activeSessionRef.current = false;
        setSessionRunning(false);
        setListening(false);
        setCurrentIndex(null);
        setTranscript("");
        speechSynthesis.cancel();
        recognitionRef.current?.stop();
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
    };

    const resetSilenceTimer = () => {
        if (silenceTimer.current) clearTimeout(silenceTimer.current);
        silenceTimer.current = setTimeout(() => {
            recognitionRef.current?.stop();
        }, SILENCE_TIMEOUT);
    };

    const startListening = () => {
        if (!activeSessionRef.current) return;

        const SpeechRecognition =
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError("Speech recognition not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onstart = () => {
            setListening(true);
            setTranscript("");
            lastTranscriptRef.current = "";
            resetSilenceTimer();
        };

        recognition.onresult = (event: any) => {
            const text = Array.from(event.results)
                .map((r: any) => r[0].transcript)
                .join(" ")
                .toLowerCase();

            lastTranscriptRef.current = text;
            setTranscript(text);
            resetSilenceTimer();
        };

        recognition.onend = () => {
            setListening(false);
            if (!activeSessionRef.current) return;
            evaluateAnswer();
        };

        recognition.onerror = () => {
            setListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const keywordMatch = (user: string, correct: string) => {
        const correctWords = correct
            .toLowerCase()
            .split(/\W+/)
            .filter((w) => w.length > 2);

        if (!user || correctWords.length === 0) return 0;

        const matched = correctWords.filter((w) => user.includes(w));
        return matched.length / correctWords.length;
    };

    const evaluateAnswer = () => {
        if (currentIndex === null || !activeSessionRef.current) return;

        const spokenText = lastTranscriptRef.current.trim();
        const correctAnswer = questions[currentIndex].answer;

        if (userWantsStop(spokenText)) {
            speak("Okay, stopping the session.", () => stopSession());
            return;
        }

        if (userDoesNotKnow(spokenText)) {
            const intro = randomFriendlyLine();
            speak(`${intro} ${correctAnswer}`, () => moveNext());
            return;
        }

        const score = keywordMatch(spokenText, correctAnswer);

        if (!spokenText) {
            speak("I did not hear anything. Please answer again.", () => {
                startListening();
            });
            return;
        }

        if (score >= MATCH_THRESHOLD) {
            speak(`Correct. ${correctAnswer}`, () => moveNext());
            return;
        }

        if (!retryUsedRef.current) {
            retryUsedRef.current = true;
            speak("Not completely correct. Tell me once again.", () => startListening());
            return;
        }

        speak(`The correct answer is ${correctAnswer}`, () => moveNext());
    };

    const moveNext = () => {
        if (!activeSessionRef.current) return;
        retryUsedRef.current = false;
        setAttempt(1);
        setTranscript("");
        lastTranscriptRef.current = "";
        setTimeout(() => {
            setCurrentIndex(prev => nextRandomIndex(prev));
        }, 1200);
    };

    useEffect(() => {
        if (sessionRunning && currentIndex !== null) {
            const q = questions[currentIndex];
            speak(q.question, () => {
                startListening();
            });
        }
    }, [currentIndex, sessionRunning]);

    return (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6">
            <div className="w-full max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-2 mb-1">
                        <Volume2 className="w-5 h-5 text-slate-600" />
                        <h2 className="text-xl font-semibold text-slate-800">Voice Practice</h2>
                    </div>
                    <p className="text-slate-500 text-sm">
                        Practice your responses with voice recognition
                    </p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="mb-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                )}

                {/* Control Button */}
                <div className="mb-4">
                    {!sessionRunning ? (
                        <button
                            className="w-full py-3 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={startSession}
                            disabled={questions.length === 0}
                        >
                            <Play className="w-4 h-4" />
                            Start Practice Session
                        </button>
                    ) : (
                        <button
                            className="w-full py-3 rounded-lg bg-white border border-rose-300 text-rose-600 font-medium hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
                            onClick={stopSession}
                        >
                            {/* <Square className="w-4 h-4" /> */}
                            Stop Session
                        </button>
                    )}
                </div>

                {/* Active Session Card */}
                {sessionRunning && currentIndex !== null && (
                    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                        {/* Question Section */}
                        <div className="bg-slate-100 p-4 border-b border-slate-200">
                            <div className="flex items-start gap-2">
                                <MessageCircle className="w-4 h-4 text-slate-600 flex-shrink-0 mt-1" />
                                <div className="flex-1">
                                    <p className="text-xs font-medium text-slate-500 mb-1">
                                        Question
                                    </p>
                                    <p className="text-slate-800 font-medium leading-relaxed">
                                        {questions[currentIndex].question}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Status & Transcript Section */}
                        <div className="p-4 space-y-4">
                            {/* Listening Status */}
                            <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-full ${
                                    listening 
                                        ? 'bg-red-100' 
                                        : 'bg-slate-100'
                                }`}>
                                    {listening ? (
                                        <Mic className="w-4 h-4 text-red-600" />
                                    ) : (
                                        <MicOff className="w-4 h-4 text-slate-400" />
                                    )}
                                </div>
                                <div>
                                    <p className={`text-sm font-medium ${
                                        listening ? 'text-red-600' : 'text-slate-500'
                                    }`}>
                                        {listening ? 'Listening for your answer' : 'Processing'}
                                    </p>
                                </div>
                            </div>

                            {/* Transcript Display */}
                            <div className="space-y-1.5">
                                <p className="text-xs font-medium text-slate-500">
                                    Your Response
                                </p>
                                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 min-h-[60px]">
                                    {transcript ? (
                                        <p className="text-slate-800 text-sm leading-relaxed">
                                            {transcript}
                                        </p>
                                    ) : (
                                        <p className="text-slate-400 text-sm italic flex items-center gap-2">
                                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                            Waiting for your answer...
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Helper Text */}
                            <div className="pt-3 border-t border-slate-100">
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Say <span className="font-medium text-slate-700">"I don't know"</span> to reveal the answer, or{' '}
                                    <span className="font-medium text-slate-700">"stop session"</span> to end
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Welcome/Empty State */}
                {!sessionRunning && (
                    <div className="bg-white rounded-lg border border-slate-200 p-6">
                        {questions.length === 0 ? (
                            <div className="text-center">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <MessageCircle className="w-6 h-6 text-slate-400" />
                                </div>
                                <h3 className="text-slate-800 font-medium mb-1">No Questions Available</h3>
                                <p className="text-slate-500 text-sm">
                                    Add some questions to start practicing
                                </p>
                            </div>
                        ) : (
                            <div>
                                <div className="flex items-start gap-2 mb-3">
                                    <Info className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <h3 className="text-slate-800 font-medium mb-1">Ready to practice</h3>
                                        <p className="text-slate-600 text-sm mb-3">
                                            You have {questions.length} question{questions.length !== 1 ? 's' : ''} ready. Click the button above to begin your voice practice session.
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                                    <p className="text-xs font-medium text-slate-700 mb-2">How it works:</p>
                                    <ul className="text-xs text-slate-600 space-y-1">
                                        <li>• I'll ask you a question and listen for your answer</li>
                                        <li>• Speak clearly when you see the microphone active</li>
                                        <li>• Say "I don't know" if you need to see the answer</li>
                                        <li>• Say "stop session" anytime to end practice</li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export type Message = {
    role: "system" | "user" | "assistant";
    content: string;
};

export async function sendInterviewMessage(
    apiKey: string,
    messages: Message[]
): Promise<string> {
    const res = await fetch(GROQ_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: messages,
            temperature: 0.7,
            max_tokens: 800,
        }),
    });

    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Groq request failed");
    }

    const data = await res.json();

    return data.choices?.[0]?.message?.content || "";
}

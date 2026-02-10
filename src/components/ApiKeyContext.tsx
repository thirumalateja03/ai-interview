import { createContext, useContext, useEffect, useState } from "react";

type ApiKeyContextType = {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
};

const ApiKeyContext = createContext<ApiKeyContextType>({
  apiKey: null,
  setApiKey: () => {},
  clearApiKey: () => {},
});

export function ApiKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKeyState] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("groq_api_key");
    if (stored) setApiKeyState(stored);
  }, []);

  const setApiKey = (key: string) => {
    localStorage.setItem("groq_api_key", key);
    setApiKeyState(key);
  };

  const clearApiKey = () => {
    localStorage.removeItem("groq_api_key");
    setApiKeyState(null);
  };

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, clearApiKey }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export const useApiKey = () => useContext(ApiKeyContext);

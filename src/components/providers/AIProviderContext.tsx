"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type AIProvider = "gemini" | "ollama";

interface AIProviderContextType {
  provider: AIProvider;
  setProvider: (provider: AIProvider) => void;
  enableFallback: boolean;
  setEnableFallback: (enable: boolean) => void;
  ollamaStatus: "checking" | "online" | "offline" | "unconfigured";
  checkOllamaStatus: () => Promise<void>;
}

const AIProviderContext = createContext<AIProviderContextType | undefined>(undefined);

const STORAGE_KEY_PROVIDER = "praxis-ai-provider";
const STORAGE_KEY_FALLBACK = "praxis-ai-fallback";

export function AIProviderProvider({ children }: { children: ReactNode }) {
  const [provider, setProviderState] = useState<AIProvider>("gemini");
  const [enableFallback, setEnableFallbackState] = useState(true);
  const [ollamaStatus, setOllamaStatus] = useState<"checking" | "online" | "offline" | "unconfigured">("unconfigured");
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedProvider = localStorage.getItem(STORAGE_KEY_PROVIDER) as AIProvider | null;
    const savedFallback = localStorage.getItem(STORAGE_KEY_FALLBACK);

    if (savedProvider && (savedProvider === "gemini" || savedProvider === "ollama")) {
      setProviderState(savedProvider);
    }

    if (savedFallback !== null) {
      setEnableFallbackState(savedFallback === "true");
    }

    setMounted(true);
  }, []);

  // Check Ollama status on mount
  useEffect(() => {
    if (mounted) {
      checkOllamaStatus();
    }
  }, [mounted]);

  const setProvider = (newProvider: AIProvider) => {
    setProviderState(newProvider);
    localStorage.setItem(STORAGE_KEY_PROVIDER, newProvider);
  };

  const setEnableFallback = (enable: boolean) => {
    setEnableFallbackState(enable);
    localStorage.setItem(STORAGE_KEY_FALLBACK, String(enable));
  };

  const checkOllamaStatus = async () => {
    setOllamaStatus("checking");

    try {
      // Check if Ollama is configured by calling our API route
      const response = await fetch("/api/ai/status");
      const data = await response.json();

      if (data.ollama?.configured) {
        setOllamaStatus(data.ollama.online ? "online" : "offline");
      } else {
        setOllamaStatus("unconfigured");
      }
    } catch {
      setOllamaStatus("unconfigured");
    }
  };

  // Prevent hydration mismatch
  if (!mounted) {
    return (
      <AIProviderContext.Provider
        value={{
          provider: "gemini",
          setProvider: () => {},
          enableFallback: true,
          setEnableFallback: () => {},
          ollamaStatus: "unconfigured",
          checkOllamaStatus: async () => {},
        }}
      >
        {children}
      </AIProviderContext.Provider>
    );
  }

  return (
    <AIProviderContext.Provider
      value={{
        provider,
        setProvider,
        enableFallback,
        setEnableFallback,
        ollamaStatus,
        checkOllamaStatus,
      }}
    >
      {children}
    </AIProviderContext.Provider>
  );
}

export function useAIProvider() {
  const context = useContext(AIProviderContext);
  if (context === undefined) {
    throw new Error("useAIProvider must be used within an AIProviderProvider");
  }
  return context;
}

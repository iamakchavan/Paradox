"use client";

import { useState, useEffect } from "react";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger, DrawerClose } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { initGemini } from "@/lib/gemini";
import { initPerplexity } from "@/lib/perplexity";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Key, Volume2, Palette, X, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface SettingsDialogProps {
  onApiKeySet: (apiKey: string) => void;
  onPerplexityApiKeySet: (apiKey: string) => void;
  onMistralApiKeySet: (apiKey: string) => void;
  onInceptionApiKeySet: (apiKey: string) => void;
}

export function SettingsDialog({ 
  onApiKeySet, 
  onPerplexityApiKeySet, 
  onMistralApiKeySet, 
  onInceptionApiKeySet 
}: SettingsDialogProps) {
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [perplexityApiKey, setPerplexityApiKey] = useState("");
  const [mistralApiKey, setMistralApiKey] = useState("");
  const [inceptionApiKey, setInceptionApiKey] = useState("");
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState("");
  const [elevenLabsAgentId, setElevenLabsAgentId] = useState("");
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const handleSave = () => {
    if (geminiApiKey.trim()) {
      initGemini(geminiApiKey.trim());
      onApiKeySet(geminiApiKey.trim());
      localStorage.setItem("gemini-api-key", geminiApiKey.trim());
    } else {
      localStorage.removeItem("gemini-api-key");
      onApiKeySet("");
    }

    if (perplexityApiKey.trim()) {
      initPerplexity(perplexityApiKey.trim());
      onPerplexityApiKeySet(perplexityApiKey.trim());
      localStorage.setItem("perplexity-api-key", perplexityApiKey.trim());
    } else {
      localStorage.removeItem("perplexity-api-key");
      onPerplexityApiKeySet("");
    }

    if (mistralApiKey.trim()) {
      onMistralApiKeySet(mistralApiKey.trim());
      localStorage.setItem("mistral-api-key", mistralApiKey.trim());
    } else {
      localStorage.removeItem("mistral-api-key");
      onMistralApiKeySet("");
    }

    if (inceptionApiKey.trim()) {
      onInceptionApiKeySet(inceptionApiKey.trim());
      localStorage.setItem("inception-api-key", inceptionApiKey.trim());
    } else {
      localStorage.removeItem("inception-api-key");
      onInceptionApiKeySet("");
    }

    if (elevenLabsApiKey.trim()) {
      localStorage.setItem("elevenlabs-api-key", elevenLabsApiKey.trim());
    } else {
      localStorage.removeItem("elevenlabs-api-key");
    }

    if (elevenLabsAgentId.trim()) {
      localStorage.setItem("elevenlabs-agent-id", elevenLabsAgentId.trim());
    } else {
      localStorage.removeItem("elevenlabs-agent-id");
    }

    setOpen(false);
  };

  useEffect(() => {
    if (open) {
      const storedGeminiKey = localStorage.getItem("gemini-api-key") || "";
      const storedPerplexityKey = localStorage.getItem("perplexity-api-key") || "";
      const storedMistralKey = localStorage.getItem("mistral-api-key") || "";
      const storedInceptionKey = localStorage.getItem("inception-api-key") || "";
      const storedElevenLabsKey = localStorage.getItem("elevenlabs-api-key") || "";
      const storedElevenLabsAgentId = localStorage.getItem("elevenlabs-agent-id") || "";

      setGeminiApiKey(storedGeminiKey);
      setPerplexityApiKey(storedPerplexityKey);
      setMistralApiKey(storedMistralKey);
      setInceptionApiKey(storedInceptionKey);
      setElevenLabsApiKey(storedElevenLabsKey);
      setElevenLabsAgentId(storedElevenLabsAgentId);
    }
  }, [open]);

  // Initial load to register keys with app on mount
  useEffect(() => {
    const storedGeminiKey = localStorage.getItem("gemini-api-key") || "";
    const storedPerplexityKey = localStorage.getItem("perplexity-api-key") || "";
    const storedMistralKey = localStorage.getItem("mistral-api-key") || "";
    const storedInceptionKey = localStorage.getItem("inception-api-key") || "";
    const storedElevenLabsKey = localStorage.getItem("elevenlabs-api-key") || "";
    const storedElevenLabsAgentId = localStorage.getItem("elevenlabs-agent-id") || "";

    if (storedGeminiKey) {
      initGemini(storedGeminiKey);
      onApiKeySet(storedGeminiKey);
    }
    if (storedPerplexityKey) {
      initPerplexity(storedPerplexityKey);
      onPerplexityApiKeySet(storedPerplexityKey);
    }
    if (storedMistralKey) {
      onMistralApiKeySet(storedMistralKey);
    }
    if (storedInceptionKey) {
      onInceptionApiKeySet(storedInceptionKey);
    }
    setGeminiApiKey(storedGeminiKey);
    setPerplexityApiKey(storedPerplexityKey);
    setMistralApiKey(storedMistralKey);
    setInceptionApiKey(storedInceptionKey);
    setElevenLabsApiKey(storedElevenLabsKey);
    setElevenLabsAgentId(storedElevenLabsAgentId);
  }, []);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <button 
          id="settings-trigger" 
          className="hidden"
          onClick={() => setOpen(true)}
        >
          Settings
        </button>
      </DrawerTrigger>
      <DrawerContent className="max-w-md mx-auto w-full sm:bottom-6 sm:rounded-2xl border-border/80 shadow-[0_15px_50px_rgba(0,0,0,0.18)] pb-1 overflow-hidden">
        <DrawerHeader className="relative border-b border-border/40 pb-4 px-6 flex items-center justify-between">
          <DrawerTitle className="text-base font-semibold">Settings</DrawerTitle>
          <DrawerClose asChild>
            <button className="h-6 w-6 rounded-full hover:bg-secondary flex items-center justify-center transition-colors text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="overflow-y-auto max-h-[65vh] px-6 py-4 space-y-6 scrollbar-none">
          {/* Section 1: AI API Keys */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase px-0.5">
              <Key className="w-3 h-3 text-muted-foreground/80" />
              <span>AI Provider Keys</span>
            </div>
            <div className="bg-secondary/25 dark:bg-secondary/10 border border-border/40 rounded-2xl p-4 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="geminiApiKey" className="text-xs font-semibold text-foreground/80">
                  Google Gemini API Key
                </label>
                <Input
                  id="geminiApiKey"
                  type="password"
                  value={geminiApiKey}
                  onChange={(e) => setGeminiApiKey(e.target.value)}
                  placeholder="Enter Gemini API key"
                  className="h-9 rounded-xl border-border/70 text-xs bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="perplexityApiKey" className="text-xs font-semibold text-foreground/80">
                  Perplexity Sonar API Key
                </label>
                <Input
                  id="perplexityApiKey"
                  type="password"
                  value={perplexityApiKey}
                  onChange={(e) => setPerplexityApiKey(e.target.value)}
                  placeholder="Enter Perplexity API key"
                  className="h-9 rounded-xl border-border/70 text-xs bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="mistralApiKey" className="text-xs font-semibold text-foreground/80">
                  Mistral API Key
                </label>
                <Input
                  id="mistralApiKey"
                  type="password"
                  value={mistralApiKey}
                  onChange={(e) => setMistralApiKey(e.target.value)}
                  placeholder="Enter Mistral API key"
                  className="h-9 rounded-xl border-border/70 text-xs bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="inceptionApiKey" className="text-xs font-semibold text-foreground/80">
                  Inception Labs API Key
                </label>
                <Input
                  id="inceptionApiKey"
                  type="password"
                  value={inceptionApiKey}
                  onChange={(e) => setInceptionApiKey(e.target.value)}
                  placeholder="Enter Inception Labs API key"
                  className="h-9 rounded-xl border-border/70 text-xs bg-background/50"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Voice Configuration */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase px-0.5">
              <Volume2 className="w-3 h-3 text-muted-foreground/80" />
              <span>Voice Configuration</span>
            </div>
            <div className="bg-secondary/25 dark:bg-secondary/10 border border-border/40 rounded-2xl p-4 space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="elevenLabsApiKey" className="text-xs font-semibold text-foreground/80">
                  ElevenLabs API Key
                </label>
                <Input
                  id="elevenLabsApiKey"
                  type="password"
                  value={elevenLabsApiKey}
                  onChange={(e) => setElevenLabsApiKey(e.target.value)}
                  placeholder="Enter ElevenLabs API key"
                  className="h-9 rounded-xl border-border/70 text-xs bg-background/50"
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="elevenLabsAgentId" className="text-xs font-semibold text-foreground/80 flex items-center justify-between">
                  <span>Voice Agent ID</span>
                  <a 
                    href="https://elevenlabs.io/voice-lab" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                  >
                    <span>Create Agent</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </label>
                <Input
                  id="elevenLabsAgentId"
                  type="text"
                  value={elevenLabsAgentId}
                  onChange={(e) => setElevenLabsAgentId(e.target.value)}
                  placeholder="Enter Voice Agent ID"
                  className="h-9 rounded-xl border-border/70 text-xs bg-background/50"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Appearance */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground/60 tracking-wider uppercase px-0.5">
              <Palette className="w-3 h-3 text-muted-foreground/80" />
              <span>Appearance</span>
            </div>
            <div className="bg-secondary/25 dark:bg-secondary/10 border border-border/40 rounded-2xl p-2.5 flex gap-2">
              <button
                type="button"
                onClick={() => setTheme('light')}
                className={cn(
                  "flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all",
                  theme === 'light' 
                    ? "bg-background border border-border/60 shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Sun className="h-3.5 w-3.5" />
                <span>Light</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('dark')}
                className={cn(
                  "flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all",
                  theme === 'dark' 
                    ? "bg-background border border-border/60 shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Moon className="h-3.5 w-3.5" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme('system')}
                className={cn(
                  "flex-1 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold transition-all",
                  theme === 'system' 
                    ? "bg-background border border-border/60 shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>System</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="border-t border-border/40 p-4 px-6 bg-secondary/10 dark:bg-secondary/5">
          <Button 
            onClick={handleSave} 
            className="w-full h-11 rounded-xl text-sm font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:opacity-95 transition-opacity"
          >
            Save Settings
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
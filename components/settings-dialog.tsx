"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initGemini } from "@/lib/gemini";
import { initPerplexity } from "@/lib/perplexity";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";

interface SettingsDialogProps {
  onApiKeySet: (apiKey: string) => void;
  onPerplexityApiKeySet: (apiKey: string) => void;
  onMistralApiKeySet: (apiKey: string) => void;
  onInceptionApiKeySet: (apiKey: string) => void;
}

export function SettingsDialog({ onApiKeySet, onPerplexityApiKeySet, onMistralApiKeySet, onInceptionApiKeySet }: SettingsDialogProps) {
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [perplexityApiKey, setPerplexityApiKey] = useState("");
  const [mistralApiKey, setMistralApiKey] = useState("");
  const [inceptionApiKey, setInceptionApiKey] = useState("");
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState("");
  const [elevenLabsAgentId, setElevenLabsAgentId] = useState("");
  const { theme, setTheme } = useTheme();

  const handleSave = () => {
    if (geminiApiKey.trim()) {
      initGemini(geminiApiKey.trim());
      onApiKeySet(geminiApiKey.trim());
      localStorage.setItem("gemini-api-key", geminiApiKey.trim());
    }
    if (perplexityApiKey.trim()) {
      initPerplexity(perplexityApiKey.trim());
      onPerplexityApiKeySet(perplexityApiKey.trim());
      localStorage.setItem("perplexity-api-key", perplexityApiKey.trim());
    }
    if (mistralApiKey.trim()) {
      onMistralApiKeySet(mistralApiKey.trim());
      localStorage.setItem("mistral-api-key", mistralApiKey.trim());
    }
    if (inceptionApiKey.trim()) {
      onInceptionApiKeySet(inceptionApiKey.trim());
      localStorage.setItem("inception-api-key", inceptionApiKey.trim());
    }
    if (elevenLabsApiKey.trim()) {
      localStorage.setItem("elevenlabs-api-key", elevenLabsApiKey.trim());
    }
    if (elevenLabsAgentId.trim()) {
      localStorage.setItem("elevenlabs-agent-id", elevenLabsAgentId.trim());
    }
  };

  useEffect(() => {
    const storedElevenLabsKey = localStorage.getItem("elevenlabs-api-key");
    const storedElevenLabsAgentId = localStorage.getItem("elevenlabs-agent-id");
    const storedMistralKey = localStorage.getItem("mistral-api-key");
    const storedInceptionKey = localStorage.getItem("inception-api-key");
    if (storedElevenLabsKey) {
      setElevenLabsApiKey(storedElevenLabsKey);
    }
    if (storedElevenLabsAgentId) {
      setElevenLabsAgentId(storedElevenLabsAgentId);
    }
    if (storedMistralKey) {
      setMistralApiKey(storedMistralKey);
    }
    if (storedInceptionKey) {
      setInceptionApiKey(storedInceptionKey);
    }
  }, []);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button id="settings-trigger" className="hidden">Settings</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="gemini" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="gemini">Gemini</TabsTrigger>
            <TabsTrigger value="perplexity">Perplexity</TabsTrigger>
            <TabsTrigger value="mistral">Mistral</TabsTrigger>
            <TabsTrigger value="inception">Inception</TabsTrigger>
            <TabsTrigger value="elevenlabs">ElevenLabs</TabsTrigger>
            <TabsTrigger value="appearance">Theme</TabsTrigger>
          </TabsList>
          <TabsContent value="gemini" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="geminiApiKey" className="text-sm font-medium leading-none">
                Google Gemini API Key
              </label>
              <Input
                id="geminiApiKey"
                type="password"
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                placeholder="Enter your Gemini API key"
              />
            </div>
          </TabsContent>
          <TabsContent value="perplexity" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="perplexityApiKey" className="text-sm font-medium leading-none">
                Perplexity Sonar API Key
              </label>
              <Input
                id="perplexityApiKey"
                type="password"
                value={perplexityApiKey}
                onChange={(e) => setPerplexityApiKey(e.target.value)}
                placeholder="Enter your Perplexity API key"
              />
            </div>
          </TabsContent>
          <TabsContent value="mistral" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="mistralApiKey" className="text-sm font-medium leading-none">
                Mistral API Key
              </label>
              <Input
                id="mistralApiKey"
                type="password"
                value={mistralApiKey}
                onChange={(e) => setMistralApiKey(e.target.value)}
                placeholder="Enter your Mistral API key"
              />
            </div>
          </TabsContent>
          <TabsContent value="inception" className="space-y-4 mt-4">
            <div className="space-y-2">
              <label htmlFor="inceptionApiKey" className="text-sm font-medium leading-none">
                Inception Labs API Key
              </label>
              <Input
                id="inceptionApiKey"
                type="password"
                value={inceptionApiKey}
                onChange={(e) => setInceptionApiKey(e.target.value)}
                placeholder="Enter your Inception Labs API key"
              />
            </div>
          </TabsContent>
          <TabsContent value="elevenlabs" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="elevenLabsApiKey" className="text-sm font-medium leading-none">
                  ElevenLabs API Key
                </label>
                <Input
                  id="elevenLabsApiKey"
                  type="password"
                  value={elevenLabsApiKey}
                  onChange={(e) => setElevenLabsApiKey(e.target.value)}
                  placeholder="Enter your ElevenLabs API key"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="elevenLabsAgentId" className="text-sm font-medium leading-none flex items-center justify-between">
                  Voice Agent ID
                  <a 
                    href="https://elevenlabs.io/voice-lab" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs text-primary hover:underline"
                  >
                    Create Voice Agent
                  </a>
                </label>
                <Input
                  id="elevenLabsAgentId"
                  type="text"
                  value={elevenLabsAgentId}
                  onChange={(e) => setElevenLabsAgentId(e.target.value)}
                  placeholder="Enter your Voice Agent ID"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  You can find your Voice Agent ID in the ElevenLabs Voice Lab after creating a voice.
                </p>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="appearance" className="mt-4">
            <div className="space-y-4">
              <div className="flex flex-col gap-3">
                <label className="text-sm font-medium leading-none">
                  Theme Preference
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setTheme('light')}
                  >
                    <Sun className="h-4 w-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setTheme('dark')}
                  >
                    <Moon className="h-4 w-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === 'system' ? 'default' : 'outline'}
                    className="w-full"
                    onClick={() => setTheme('system')}
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    System
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <Button onClick={handleSave} className="w-full mt-6">
          Save Settings
        </Button>
      </DialogContent>
    </Dialog>
  );
}
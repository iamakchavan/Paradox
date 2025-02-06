"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initGemini } from "@/lib/gemini";
import { initPerplexity } from "@/lib/perplexity";

interface SettingsDialogProps {
  onApiKeySet: (apiKey: string) => void;
  onPerplexityApiKeySet: (apiKey: string) => void;
}

export function SettingsDialog({ onApiKeySet, onPerplexityApiKeySet }: SettingsDialogProps) {
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [perplexityApiKey, setPerplexityApiKey] = useState("");

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
  };

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gemini">Gemini API</TabsTrigger>
            <TabsTrigger value="perplexity">Perplexity API</TabsTrigger>
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
        </Tabs>
        <Button onClick={handleSave} className="w-full mt-6">
          Save Settings
        </Button>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import Image from "next/image";
import { Settings, ArrowLeft } from "lucide-react";
import { SettingsDialog } from "@/components/settings-dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { VoiceAgent } from "@/components/voice-agent";

export default function AgentPage() {
  return (
    <main className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full",
                "bg-primary/10 group-hover:bg-primary/20 transition-colors"
              )}>
                <ArrowLeft className="w-4 h-4 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors hidden sm:inline">
                Return to Chat
              </span>
            </Link>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <Image 
                src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/extension_icon%20(4)-6Wye0wySEvOe9CE7mSoAVG5mEWUqc7.png"
                alt="Paradox Logo" 
                width={28} 
                height={28}
                className="hidden sm:block"
              />
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold">
                  <span className="hidden sm:inline">Paradox </span>Live
                </h1>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => document.getElementById('settings-trigger')?.click()}
            >
              <Settings className="h-[1.2rem] w-[1.2rem]" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full pt-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <VoiceAgent />
          </div>
        </div>
      </div>

      <SettingsDialog 
        onApiKeySet={() => {}} 
        onPerplexityApiKeySet={() => {}}
      />
    </main>
  );
} 
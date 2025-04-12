"use client";

import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Settings, ArrowLeft } from "lucide-react";
import { SettingsDialog } from "@/components/settings-dialog";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { VoiceAgent } from "@/components/voice-agent";
import { motion } from "framer-motion";

export default function AgentPage() {
  return (
    <main className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <motion.header 
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b"
      >
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 group">
              <div className={cn(
                "flex items-center justify-center w-8 h-8 rounded-full",
                "bg-primary/10 group-hover:bg-primary/20 transition-all duration-300"
              )}>
                <ArrowLeft className="w-4 h-4 text-primary group-hover:scale-90 transition-transform duration-300" />
              </div>
              <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors hidden sm:inline">
                Return to Chat
              </span>
            </Link>
            <div className="h-6 w-px bg-border hidden sm:block" />
            <div className="flex items-center gap-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
              >
                <Image 
                  src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/extension_icon%20(4)-6Wye0wySEvOe9CE7mSoAVG5mEWUqc7.png"
                  alt="Paradox Logo" 
                  width={32} 
                  height={32}
                  className="hidden sm:block"
                />
              </motion.div>
              <div className="flex items-center gap-2">
                <motion.h1 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.3 }}
                  className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent"
                >
                  <span className="hidden sm:inline">Paradox </span>Live
                </motion.h1>
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </div>
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 hover:scale-105 transition-transform"
              onClick={() => document.getElementById('settings-trigger')?.click()}
            >
              <Settings className="h-[1.2rem] w-[1.2rem]" />
            </Button>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 w-full pt-20 pb-10">
        <div className="max-w-5xl mx-auto px-4">
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
            className="flex flex-col items-center justify-center min-h-[70vh]"
          >
            <VoiceAgent />
          </motion.div>
        </div>
      </div>

      <SettingsDialog 
        onApiKeySet={() => {}} 
        onPerplexityApiKeySet={() => {}}
        onMistralApiKeySet={() => {}}
        onInceptionApiKeySet={() => {}}
      />
    </main>
  );
} 
'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Volume2, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export function VoiceAgent() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const key = localStorage.getItem('elevenlabs-api-key');
    const id = localStorage.getItem('elevenlabs-agent-id');
    setApiKey(key);
    setAgentId(id);
  }, []);

  const conversation = useConversation({
    apiKey: apiKey || '',
    onConnect: () => {
      console.log('Connected');
      setError(null);
    },
    onDisconnect: () => {
      console.log('Disconnected');
      setError(null);
    },
    onMessage: (message: { text: string }) => {
      console.log('Message:', message);
      setError(null);
    },
    onError: (error: { message?: string }) => {
      console.error('Error:', error);
      setError(error.message || 'Connection error occurred');
    },
    wsUrl: 'wss://api.elevenlabs.io/v1/conversation',
  });

  const startConversation = useCallback(async () => {
    if (!agentId) {
      setError('Please set your Voice Agent ID in settings');
      return;
    }

    try {
      setError(null);
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      await conversation.startSession({
        agentId: agentId,
        enableDebugLogs: true,
        connectionConfig: {
          reconnect: true,
          reconnectLimit: 3,
          reconnectInterval: 2000,
        },
        voiceSettings: {
          stability: 0.5,
          similarity_boost: 0.75,
        }
      });
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      setError(error.message || 'Failed to start conversation');
    }
  }, [conversation, agentId]);

  const stopConversation = useCallback(async () => {
    try {
      await conversation.endSession();
      setError(null);
    } catch (error: any) {
      console.error('Failed to stop conversation:', error);
      setError(error.message || 'Failed to stop conversation');
    }
  }, [conversation]);

  if (!apiKey || !agentId) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-4 p-8 text-center"
      >
        <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-2">
          <AlertCircle className="w-8 h-8 text-primary/50" />
        </div>
        <p className="text-muted-foreground max-w-[300px]">
          {!apiKey 
            ? "Please set your ElevenLabs API key in settings to use the voice agent."
            : "Please set your Voice Agent ID in settings to use the voice agent."
          }
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center gap-8 w-full max-w-md mx-auto"
    >
      <div className="flex flex-col items-center gap-6 w-full">
        <motion.div 
          className={cn(
            "relative w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center",
            "bg-gradient-to-b from-primary/5 to-primary/10",
            "before:absolute before:inset-0 before:rounded-full before:bg-primary/5",
            conversation.status === 'connected' && conversation.isSpeaking ? "before:animate-wave" : "before:animate-pulse before:duration-2000"
          )}
        >
          <div className={cn(
            "absolute inset-2 rounded-full",
            "bg-background/80 backdrop-blur-sm",
            "flex items-center justify-center",
            "border border-primary/10",
            conversation.status === 'connected' && !conversation.isSpeaking && "animate-glow",
            conversation.status === 'connected' && conversation.isSpeaking && "animate-speaking"
          )}>
            <AnimatePresence mode="wait">
              <motion.div
                key={conversation.status + (error ? '-error' : '') + (conversation.isSpeaking ? '-speaking' : '')}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                {error ? (
                  <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-destructive" />
                ) : conversation.status === 'connected' ? (
                  conversation.isSpeaking ? (
                    <motion.div
                      className="relative"
                      animate={{ opacity: [0.7, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Volume2 className="w-10 h-10 sm:w-12 sm:h-12 text-primary" />
                      <motion.div
                        className="absolute inset-0 text-primary"
                        animate={{ opacity: [0.3, 0.7] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                      >
                        <Volume2 className="w-10 h-10 sm:w-12 sm:h-12" />
                      </motion.div>
                    </motion.div>
                  ) : (
                    <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-primary animate-pulse" />
                  )
                ) : (
                  <MicOff className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground" />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="text-center space-y-2 w-full">
          <motion.p 
            className="text-sm font-medium capitalize bg-primary/5 text-primary rounded-full px-4 py-1.5 inline-block"
            animate={{
              scale: conversation.status === 'connected' ? [1, 1.05, 1] : 1
            }}
            transition={{ duration: 0.3 }}
          >
            Status: {conversation.status}
          </motion.p>
          <AnimatePresence mode="wait">
            {error ? (
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm text-destructive max-w-[300px] mx-auto"
              >
                {error}
              </motion.p>
            ) : (
              <motion.p 
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="text-sm text-muted-foreground"
              >
                {conversation.status === 'connected' 
                  ? `Agent is ${conversation.isSpeaking ? 'speaking' : 'listening'}`
                  : 'Click start to begin conversation'
                }
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex gap-4 w-full max-w-xs mx-auto">
        <Button
          onClick={startConversation}
          disabled={conversation.status === 'connected'}
          variant={conversation.status === 'connected' ? "secondary" : "default"}
          size="lg"
          className={cn(
            "flex-1 h-12 relative overflow-hidden transition-all duration-300",
            conversation.status === 'connected' && "opacity-50"
          )}
        >
          <motion.div
            animate={{
              scale: conversation.status === 'connecting' ? [1, 1.05, 1] : 1
            }}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            {conversation.status === 'connecting' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Start"
            )}
          </motion.div>
        </Button>
        <Button
          onClick={stopConversation}
          disabled={conversation.status !== 'connected'}
          variant="destructive"
          size="lg"
          className={cn(
            "flex-1 h-12 relative overflow-hidden transition-all duration-300",
            conversation.status !== 'connected' && "opacity-50"
          )}
        >
          Stop
        </Button>
      </div>
    </motion.div>
  );
} 
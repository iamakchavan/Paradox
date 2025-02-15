'use client';

import { useConversation } from '@11labs/react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Mic, MicOff, Volume2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Start the conversation with your agent
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
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <p className="text-muted-foreground">
          {!apiKey 
            ? "Please set your ElevenLabs API key in settings to use the voice agent."
            : "Please set your Voice Agent ID in settings to use the voice agent."
          }
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <div className="flex flex-col items-center gap-4 p-8">
        <div className={cn(
          "w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500",
          conversation.status === 'connected' ? "bg-primary/10" : "bg-secondary",
          error ? "bg-destructive/10" : ""
        )}>
          {error ? (
            <AlertCircle className="w-12 h-12 text-destructive animate-pulse" />
          ) : conversation.status === 'connected' ? (
            conversation.isSpeaking ? (
              <Volume2 className="w-12 h-12 text-primary animate-pulse" />
            ) : (
              <Mic className="w-12 h-12 text-primary animate-pulse" />
            )
          ) : (
            <MicOff className="w-12 h-12 text-muted-foreground" />
          )}
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium capitalize">Status: {conversation.status}</p>
          {error ? (
            <p className="text-sm text-destructive max-w-[300px]">{error}</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              {conversation.status === 'connected' 
                ? `Agent is ${conversation.isSpeaking ? 'speaking' : 'listening'}`
                : 'Click start to begin conversation'
              }
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          onClick={startConversation}
          disabled={conversation.status === 'connected'}
          variant={conversation.status === 'connected' ? "secondary" : "default"}
          size="lg"
          className="w-32"
        >
          Start
        </Button>
        <Button
          onClick={stopConversation}
          disabled={conversation.status !== 'connected'}
          variant="destructive"
          size="lg"
          className="w-32"
        >
          Stop
        </Button>
      </div>
    </div>
  );
} 
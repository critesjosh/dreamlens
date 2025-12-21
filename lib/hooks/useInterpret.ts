'use client';

import { useState, useCallback } from 'react';
import { createLLMClient } from '@/lib/llm';
import {
  createInterpretation,
  getInterpretationsForDream,
  createConversation,
  getConversationForInterpretation,
  addMessageToConversation,
} from '@/lib/db/local';
import { useSettingsStore } from '@/stores/settingsStore';
import { useLiveQuery } from 'dexie-react-hooks';
import type {
  FrameworkId,
  InterpretationRequest,
  InterpretationResponse,
  Tag,
} from '@/types';

// Subscriber model is forced to GPT-4o Mini
const SUBSCRIBER_MODEL = 'gpt-4o-mini';

// Helper to clean content from special tags
function cleanContent(content: string): string {
  return content
    .replace(/\[FOLLOW_UP\].*?\[\/FOLLOW_UP\]/gs, '')
    .replace(/\[SYMBOL\](.*?)\[\/SYMBOL\]/gs, '$1')
    .trim();
}

function extractSuggestedFollowUps(content: string): string[] {
  const regex = /\[FOLLOW_UP\](.*?)\[\/FOLLOW_UP\]/gs;
  const matches = [...content.matchAll(regex)];
  return matches.map((m) => m[1].trim()).slice(0, 3);
}

function extractSymbols(content: string): string[] {
  const regex = /\[SYMBOL\](.*?)\[\/SYMBOL\]/gs;
  const matches = [...content.matchAll(regex)];
  return [...new Set(matches.map((m) => m[1].trim().toLowerCase()))];
}

// Helper function to interpret via the subscription proxy
interface ProxyInterpretOptions {
  dreamContent: string;
  dreamTitle?: string;
  tags: Tag[];
  framework: FrameworkId;
  sessionToken: string;
  conversationHistory?: ConversationMessage[];
  onChunk: (chunk: string) => void;
}

async function interpretViaProxy(
  options: ProxyInterpretOptions
): Promise<InterpretationResponse> {
  const response = await fetch('/api/interpret', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${options.sessionToken}`,
    },
    body: JSON.stringify({
      dreamContent: options.dreamContent,
      dreamTitle: options.dreamTitle,
      tags: options.tags,
      framework: options.framework,
      conversationHistory: options.conversationHistory,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to interpret dream');
  }

  // Handle SSE stream
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        try {
          const data = JSON.parse(line.slice(6));
          if (data.content) {
            fullContent += data.content;
            options.onChunk(data.content);
          }
          if (data.error) {
            throw new Error(data.error);
          }
        } catch {
          // Ignore parse errors for incomplete chunks
        }
      }
    }
  }

  const cleanedContent = cleanContent(fullContent);

  return {
    content: cleanedContent,
    tokenCount: { input: 0, output: 0 }, // Proxy doesn't return token counts
    costUsd: 0, // Subscription covers cost
    suggestedFollowUps: extractSuggestedFollowUps(fullContent),
    identifiedSymbols: extractSymbols(fullContent),
  };
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface UseInterpretOptions {
  dreamLocalId: string;
  dreamContent: string;
  dreamTitle?: string;
  tags: Tag[];
}

export function useInterpret({
  dreamLocalId,
  dreamContent,
  dreamTitle,
  tags,
}: UseInterpretOptions) {
  const {
    openaiApiKey,
    defaultModel,
    defaultFramework,
    subscriptionSessionToken,
    isSubscribed,
  } = useSettingsStore();

  const hasActiveSubscription = isSubscribed();

  const [isInterpreting, setIsInterpreting] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [conversationLocalId, setConversationLocalId] = useState<string | null>(null);
  const [followUpResponse, setFollowUpResponse] = useState<string | null>(null);
  const [suggestedFollowUps, setSuggestedFollowUps] = useState<string[]>([]);

  // Get existing interpretations for this dream
  const interpretations = useLiveQuery(
    () => getInterpretationsForDream(dreamLocalId),
    [dreamLocalId]
  );

  const interpret = useCallback(
    async (
      framework: FrameworkId = defaultFramework,
      model: string = defaultModel
    ): Promise<InterpretationResponse | null> => {
      // Check if user has subscription or API key
      if (!hasActiveSubscription && !openaiApiKey) {
        setError('Please set your OpenAI API key in Settings or subscribe to DreamLens Pro');
        return null;
      }

      setIsInterpreting(true);
      setStreamingContent('');
      setError(null);

      // Force model to GPT-4o Mini for subscribers
      const effectiveModel = hasActiveSubscription ? SUBSCRIBER_MODEL : model;

      try {
        let result: InterpretationResponse | undefined;

        if (hasActiveSubscription && subscriptionSessionToken) {
          // Use the subscription proxy endpoint
          result = await interpretViaProxy({
            dreamContent,
            dreamTitle,
            tags,
            framework,
            sessionToken: subscriptionSessionToken,
            onChunk: (chunk) => setStreamingContent((prev) => prev + chunk),
          });
        } else {
          // Use direct API call with user's key
          const client = createLLMClient('openai', openaiApiKey!);

          const request: InterpretationRequest = {
            dreamContent,
            dreamTitle,
            tags,
            framework,
            provider: 'openai',
            model: effectiveModel,
          };

          // Use streaming
          const generator = client.interpretStream(request);

          // Collect streamed content
          while (true) {
            const { value, done } = await generator.next();
            if (done) {
              result = value as InterpretationResponse;
              break;
            }
            setStreamingContent((prev) => prev + value);
          }
        }

        if (result) {
          // Save to local database
          const interpretation = await createInterpretation({
            dreamLocalId,
            framework,
            provider: 'openai',
            model: effectiveModel,
            content: result.content,
            tokenCount: result.tokenCount.input + result.tokenCount.output,
            costUsd: result.costUsd,
          });

          // Create a conversation for this interpretation
          const conversation = await createConversation(interpretation.localId);
          setConversationLocalId(conversation.localId);

          // Initialize conversation history with the interpretation
          setConversationHistory([
            { role: 'assistant', content: result.content },
          ]);
          setSuggestedFollowUps(result.suggestedFollowUps ?? []);
          setFollowUpResponse(null);
          setStreamingContent('');
          return result;
        }

        return null;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to interpret dream';
        setError(message);
        return null;
      } finally {
        setIsInterpreting(false);
      }
    },
    [
      openaiApiKey,
      dreamContent,
      dreamTitle,
      tags,
      dreamLocalId,
      defaultFramework,
      defaultModel,
      hasActiveSubscription,
      subscriptionSessionToken,
    ]
  );

  const followUp = useCallback(
    async (
      message: string,
      framework: FrameworkId = defaultFramework,
      model: string = defaultModel,
      currentInterpretationContent?: string,
      interpretationLocalId?: string
    ): Promise<string | null> => {
      // Check if user has subscription or API key
      if (!hasActiveSubscription && !openaiApiKey) {
        setError('Please set your OpenAI API key in Settings or subscribe to DreamLens Pro');
        return null;
      }

      setIsInterpreting(true);
      setStreamingContent('');
      setError(null);

      try {
        // Use existing conversation history, or initialize from current interpretation
        let baseHistory = conversationHistory;
        let activeConversationId = conversationLocalId;

        // Ensure we have a conversation record - create one if missing
        if (interpretationLocalId && !activeConversationId) {
          let conversation = await getConversationForInterpretation(interpretationLocalId);
          if (!conversation) {
            conversation = await createConversation(interpretationLocalId);
          }
          activeConversationId = conversation.localId;
          setConversationLocalId(activeConversationId);
        }

        // Initialize history from current interpretation if empty
        if (baseHistory.length === 0 && currentInterpretationContent) {
          baseHistory = [{ role: 'assistant', content: currentInterpretationContent }];
          setConversationHistory(baseHistory);
        }

        // Add user message to history
        const updatedHistory: ConversationMessage[] = [
          ...baseHistory,
          { role: 'user', content: message },
        ];

        let result: InterpretationResponse | undefined;

        if (hasActiveSubscription && subscriptionSessionToken) {
          // Use the subscription proxy endpoint
          result = await interpretViaProxy({
            dreamContent,
            dreamTitle,
            tags,
            framework,
            sessionToken: subscriptionSessionToken,
            conversationHistory: updatedHistory,
            onChunk: (chunk) => setStreamingContent((prev) => prev + chunk),
          });
        } else {
          // Use direct API call with user's key
          const client = createLLMClient('openai', openaiApiKey!);

          const request: InterpretationRequest = {
            dreamContent,
            dreamTitle,
            tags,
            framework,
            provider: 'openai',
            model,
            conversationHistory: updatedHistory,
          };

          // Use streaming
          const generator = client.interpretStream(request);

          while (true) {
            const { value, done } = await generator.next();
            if (done) {
              result = value as InterpretationResponse;
              break;
            }
            setStreamingContent((prev) => prev + value);
          }
        }

        if (result) {
          // Update conversation history with the response
          const newHistory: ConversationMessage[] = [
            ...updatedHistory,
            { role: 'assistant', content: result.content },
          ];
          setConversationHistory(newHistory);

          // Save messages to database
          if (activeConversationId) {
            await addMessageToConversation(activeConversationId, { role: 'user', content: message });
            await addMessageToConversation(activeConversationId, { role: 'assistant', content: result.content });
          }

          setSuggestedFollowUps(result.suggestedFollowUps ?? []);
          setFollowUpResponse(result.content);
          setStreamingContent('');
          return result.content;
        }

        return null;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to get follow-up response';
        setError(errorMsg);
        return null;
      } finally {
        setIsInterpreting(false);
      }
    },
    [
      openaiApiKey,
      dreamContent,
      dreamTitle,
      tags,
      conversationHistory,
      conversationLocalId,
      defaultFramework,
      defaultModel,
      hasActiveSubscription,
      subscriptionSessionToken,
    ]
  );

  const loadConversation = useCallback(
    async (interpretationLocalId: string, interpretationContent: string) => {
      // Load existing conversation for this interpretation
      const conversation = await getConversationForInterpretation(interpretationLocalId);

      if (conversation) {
        // Conversation exists - restore history if there are messages
        const history: ConversationMessage[] = [
          { role: 'assistant', content: interpretationContent },
          ...conversation.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        ];
        setConversationHistory(history);
        setConversationLocalId(conversation.localId);
      } else {
        // No existing conversation - will be created on first follow-up
        setConversationHistory([
          { role: 'assistant', content: interpretationContent },
        ]);
        setConversationLocalId(null);
      }

      setFollowUpResponse(null);
      setStreamingContent('');
    },
    []
  );

  const clearConversation = useCallback(() => {
    setConversationHistory([]);
    setConversationLocalId(null);
    setFollowUpResponse(null);
    setStreamingContent('');
  }, []);

  return {
    interpret,
    followUp,
    loadConversation,
    clearConversation,
    interpretations: interpretations ?? [],
    isInterpreting,
    streamingContent,
    error,
    hasApiKey: !!openaiApiKey,
    hasActiveSubscription,
    effectiveModel: hasActiveSubscription ? SUBSCRIBER_MODEL : defaultModel,
    conversationHistory,
    followUpResponse,
    suggestedFollowUps,
  };
}

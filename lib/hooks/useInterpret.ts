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
  const { openaiApiKey, defaultModel, defaultFramework } = useSettingsStore();

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
      if (!openaiApiKey) {
        setError('Please set your OpenAI API key in Settings');
        return null;
      }

      setIsInterpreting(true);
      setStreamingContent('');
      setError(null);

      try {
        const client = createLLMClient('openai', openaiApiKey);

        const request: InterpretationRequest = {
          dreamContent,
          dreamTitle,
          tags,
          framework,
          provider: 'openai',
          model,
        };

        // Use streaming
        const generator = client.interpretStream(request);
        let result: InterpretationResponse | undefined;

        // Collect streamed content
        while (true) {
          const { value, done } = await generator.next();
          if (done) {
            result = value as InterpretationResponse;
            break;
          }
          setStreamingContent((prev) => prev + value);
        }

        if (result) {
          // Save to local database
          const interpretation = await createInterpretation({
            dreamLocalId,
            framework,
            provider: 'openai',
            model,
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
      if (!openaiApiKey) {
        setError('Please set your OpenAI API key in Settings');
        return null;
      }

      setIsInterpreting(true);
      setStreamingContent('');
      setError(null);

      try {
        const client = createLLMClient('openai', openaiApiKey);

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
        let result: InterpretationResponse | undefined;

        while (true) {
          const { value, done } = await generator.next();
          if (done) {
            result = value as InterpretationResponse;
            break;
          }
          setStreamingContent((prev) => prev + value);
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
    conversationHistory,
    followUpResponse,
    suggestedFollowUps,
  };
}

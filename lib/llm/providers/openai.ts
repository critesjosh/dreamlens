import OpenAI from 'openai';
import type { InterpretationRequest, InterpretationResponse } from '@/types';
import { buildSystemPrompt } from '../frameworks';
import { countTokens } from '@/lib/utils/tokens';
import { calculateCost } from '@/lib/utils/cost';

export interface LLMClient {
  interpret(request: InterpretationRequest): Promise<InterpretationResponse>;
  interpretStream(
    request: InterpretationRequest
  ): AsyncGenerator<string, InterpretationResponse, unknown>;
}

function formatUserMessage(request: InterpretationRequest): string {
  let message = `## Dream\n\n${request.dreamContent}`;

  if (request.dreamTitle) {
    message = `## Title: ${request.dreamTitle}\n\n${message}`;
  }

  if (request.tags.length > 0) {
    const tagsByCategory = request.tags.reduce(
      (acc, tag) => {
        acc[tag.category] = acc[tag.category] || [];
        acc[tag.category].push(tag.value);
        return acc;
      },
      {} as Record<string, string[]>
    );

    message += '\n\n## Tags\n';
    for (const [category, values] of Object.entries(tagsByCategory)) {
      message += `- ${category}: ${values.join(', ')}\n`;
    }
  }

  return message;
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

function cleanContent(content: string): string {
  // Remove the special tags from the displayed content
  return content
    .replace(/\[FOLLOW_UP\].*?\[\/FOLLOW_UP\]/gs, '')
    .replace(/\[SYMBOL\](.*?)\[\/SYMBOL\]/gs, '$1')
    .trim();
}

export function createOpenAIClient(apiKey: string): LLMClient {
  const client = new OpenAI({ apiKey, dangerouslyAllowBrowser: true });

  return {
    async interpret(
      request: InterpretationRequest
    ): Promise<InterpretationResponse> {
      const systemPrompt = buildSystemPrompt(
        request.framework,
        request.personalSymbols
      );
      const userMessage = formatUserMessage(request);

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...(request.conversationHistory?.map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })) ?? []),
        { role: 'user', content: userMessage },
      ];

      const response = await client.chat.completions.create({
        model: request.model,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
      });

      const rawContent = response.choices[0]?.message?.content ?? '';
      const inputTokens =
        response.usage?.prompt_tokens ?? countTokens(systemPrompt + userMessage);
      const outputTokens =
        response.usage?.completion_tokens ?? countTokens(rawContent);

      return {
        content: cleanContent(rawContent),
        tokenCount: { input: inputTokens, output: outputTokens },
        costUsd: calculateCost(request.model, inputTokens, outputTokens),
        suggestedFollowUps: extractSuggestedFollowUps(rawContent),
        identifiedSymbols: extractSymbols(rawContent),
      };
    },

    async *interpretStream(
      request: InterpretationRequest
    ): AsyncGenerator<string, InterpretationResponse, unknown> {
      const isFollowUp = request.conversationHistory && request.conversationHistory.length > 0;

      const systemPrompt = buildSystemPrompt(
        request.framework,
        request.personalSymbols,
        isFollowUp
      );

      // For initial interpretation, use the full dream message; for follow-ups, just the question
      const userMessage = isFollowUp
        ? request.conversationHistory![request.conversationHistory!.length - 1].content
        : formatUserMessage(request);

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...(isFollowUp ? request.conversationHistory!.slice(0, -1).map((m) => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })) : []),
        { role: 'user', content: userMessage },
      ];

      const stream = await client.chat.completions.create({
        model: request.model,
        messages,
        max_tokens: 2000,
        temperature: 0.7,
        stream: true,
      });

      let fullContent = '';
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta?.content ?? '';
        fullContent += delta;
        yield delta;
      }

      const inputTokens = countTokens(systemPrompt + userMessage);
      const outputTokens = countTokens(fullContent);

      return {
        content: cleanContent(fullContent),
        tokenCount: { input: inputTokens, output: outputTokens },
        costUsd: calculateCost(request.model, inputTokens, outputTokens),
        suggestedFollowUps: extractSuggestedFollowUps(fullContent),
        identifiedSymbols: extractSymbols(fullContent),
      };
    },
  };
}

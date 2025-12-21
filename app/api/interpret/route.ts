import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import {
  verifySessionToken,
  getSubscriberByEmail,
} from '@/lib/subscription';
import { buildSystemPrompt } from '@/lib/llm/frameworks';
import type { InterpretationRequest, Tag } from '@/types';

// Force GPT-4o Mini for subscribers
const SUBSCRIBER_MODEL = 'gpt-4o-mini';

interface ProxyRequest {
  dreamContent: string;
  dreamTitle?: string;
  tags: Tag[];
  framework: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  personalSymbols?: Array<{ name: string; meaning: string }>;
}

function formatUserMessage(request: ProxyRequest): string {
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

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'Authorization required' },
      { status: 401 }
    );
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json(
      { error: 'Invalid or expired session' },
      { status: 401 }
    );
  }

  const subscriber = getSubscriberByEmail(session.email);

  if (!subscriber || subscriber.status !== 'active') {
    return NextResponse.json(
      { error: 'Active subscription required' },
      { status: 403 }
    );
  }

  if (!subscriber.openaiApiKey) {
    return NextResponse.json(
      { error: 'API key not configured. Please contact support.' },
      { status: 500 }
    );
  }

  try {
    const body: ProxyRequest = await request.json();

    const isFollowUp = body.conversationHistory && body.conversationHistory.length > 0;

    const systemPrompt = buildSystemPrompt(
      body.framework as InterpretationRequest['framework'],
      body.personalSymbols,
      isFollowUp
    );

    const userMessage = isFollowUp
      ? body.conversationHistory![body.conversationHistory!.length - 1].content
      : formatUserMessage(body);

    const messages: OpenAI.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...(isFollowUp ? body.conversationHistory!.slice(0, -1).map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })) : []),
      { role: 'user', content: userMessage },
    ];

    const client = new OpenAI({
      apiKey: subscriber.openaiApiKey,
    });

    // Create streaming response
    const stream = await client.chat.completions.create({
      model: SUBSCRIBER_MODEL,
      messages,
      max_tokens: 2000,
      temperature: 0.7,
      stream: true,
    });

    // Create a readable stream for SSE
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        let fullContent = '';

        try {
          for await (const chunk of stream) {
            const delta = chunk.choices[0]?.delta?.content ?? '';
            if (delta) {
              fullContent += delta;
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`)
              );
            }
          }

          // Send completion message with usage info
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ done: true, model: SUBSCRIBER_MODEL })}\n\n`)
          );
          controller.close();
        } catch (error) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Stream error' })}\n\n`)
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Interpret proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process interpretation request' },
      { status: 500 }
    );
  }
}

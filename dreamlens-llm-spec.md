# DreamLens - LLM Implementation Specification

## Project Overview

**Name:** DreamLens  
**Type:** Progressive Web Application (PWA)  
**Purpose:** Dream journaling with AI-powered interpretation through multiple psychological frameworks  
**Stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, IndexedDB, PostgreSQL  

---

## Tech Stack (Exact Versions)

```json
{
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "dexie": "^4.0.0",
    "dexie-react-hooks": "^1.1.0",
    "@tanstack/react-query": "^5.28.0",
    "openai": "^4.28.0",
    "@anthropic-ai/sdk": "^0.20.0",
    "@google/generative-ai": "^0.3.0",
    "next-auth": "^5.0.0-beta.15",
    "@auth/drizzle-adapter": "^0.8.0",
    "drizzle-orm": "^0.30.0",
    "zod": "^3.22.0",
    "zustand": "^4.5.0",
    "next-pwa": "^5.6.0",
    "idb-keyval": "^6.2.0"
  }
}
```

---

## Directory Structure

```
dreamlens/
├── app/
│   ├── layout.tsx                 # Root layout with providers
│   ├── page.tsx                   # Landing/dashboard
│   ├── manifest.ts                # PWA manifest
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx             # App shell with nav
│   │   ├── capture/page.tsx       # Voice recording page
│   │   ├── dreams/
│   │   │   ├── page.tsx           # Dream list
│   │   │   └── [id]/
│   │   │       ├── page.tsx       # Single dream view
│   │   │       ├── interpret/page.tsx
│   │   │       └── compare/page.tsx
│   │   ├── dictionary/page.tsx    # Personal symbol dictionary
│   │   ├── patterns/page.tsx      # Recurring themes
│   │   └── settings/page.tsx
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── interpret/route.ts     # LLM proxy
│       ├── transcribe/route.ts    # Speech-to-text
│       └── sync/route.ts          # Offline sync
├── components/
│   ├── ui/                        # Primitives (Button, Input, etc.)
│   ├── capture/
│   │   ├── VoiceRecorder.tsx
│   │   ├── TranscriptEditor.tsx
│   │   └── QuickTagSelector.tsx
│   ├── interpret/
│   │   ├── FrameworkSelector.tsx
│   │   ├── ModelSelector.tsx
│   │   ├── InterpretationPanel.tsx
│   │   ├── ComparisonView.tsx
│   │   └── FollowUpChat.tsx
│   ├── dictionary/
│   │   ├── SymbolEntry.tsx
│   │   └── SymbolList.tsx
│   └── patterns/
│       ├── ThemeChart.tsx
│       └── RecurringSymbols.tsx
├── lib/
│   ├── db/
│   │   ├── schema.ts              # Drizzle schema
│   │   ├── local.ts               # Dexie (IndexedDB) schema
│   │   └── sync.ts                # Sync logic
│   ├── llm/
│   │   ├── providers/
│   │   │   ├── openai.ts
│   │   │   ├── anthropic.ts
│   │   │   └── google.ts
│   │   ├── frameworks/
│   │   │   ├── jung.ts
│   │   │   ├── freud.ts
│   │   │   ├── gestalt.ts
│   │   │   ├── islamic.ts
│   │   │   ├── indigenous.ts
│   │   │   ├── cognitive.ts
│   │   │   └── existential.ts
│   │   └── index.ts               # Unified interface
│   ├── speech/
│   │   └── recorder.ts
│   ├── hooks/
│   │   ├── useDreams.ts
│   │   ├── useInterpret.ts
│   │   ├── useVoiceRecorder.ts
│   │   └── useOfflineStatus.ts
│   └── utils/
│       ├── tokens.ts              # Token counting
│       └── cost.ts                # Cost estimation
├── stores/
│   ├── settingsStore.ts
│   └── captureStore.ts
├── types/
│   └── index.ts                   # All TypeScript types
└── public/
    ├── sw.js                      # Service worker
    └── icons/
```

---

## Database Schema

### PostgreSQL (Remote - Drizzle ORM)

```typescript
// lib/db/schema.ts
import { pgTable, text, timestamp, uuid, jsonb, integer, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const dreams = pgTable('dreams', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title'),
  content: text('content').notNull(),
  audioUrl: text('audio_url'),
  recordedAt: timestamp('recorded_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  syncedAt: timestamp('synced_at'),
  localId: text('local_id'), // For offline sync matching
});

export const dreamTags = pgTable('dream_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  dreamId: uuid('dream_id').references(() => dreams.id).notNull(),
  category: text('category').notNull(), // 'emotion' | 'theme' | 'person' | 'place' | 'object' | 'custom'
  value: text('value').notNull(),
  color: text('color'), // Hex color for custom tags
});

export const interpretations = pgTable('interpretations', {
  id: uuid('id').primaryKey().defaultRandom(),
  dreamId: uuid('dream_id').references(() => dreams.id).notNull(),
  framework: text('framework').notNull(), // See FrameworkId type
  provider: text('provider').notNull(),   // 'openai' | 'anthropic' | 'google'
  model: text('model').notNull(),
  content: text('content').notNull(),
  tokenCount: integer('token_count'),
  costUsd: integer('cost_usd'),           // In cents
  createdAt: timestamp('created_at').defaultNow(),
});

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  interpretationId: uuid('interpretation_id').references(() => interpretations.id).notNull(),
  messages: jsonb('messages').notNull(),  // Array of {role, content, timestamp}
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const symbols = pgTable('symbols', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  name: text('name').notNull(),
  meaning: text('meaning').notNull(),
  context: text('context'),               // Why this symbol matters to user
  valence: text('valence'),               // 'positive' | 'negative' | 'neutral' | 'ambivalent'
  relatedSymbols: jsonb('related_symbols'), // Array of symbol IDs
  frequency: integer('frequency').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  provider: text('provider').notNull(),   // 'openai' | 'anthropic' | 'google'
  encryptedKey: text('encrypted_key').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
```

### IndexedDB (Local - Dexie)

```typescript
// lib/db/local.ts
import Dexie, { Table } from 'dexie';

interface LocalDream {
  localId: string;          // UUID generated client-side
  remoteId?: string;        // UUID from server after sync
  title?: string;
  content: string;
  audioBlob?: Blob;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
  tags: Array<{
    category: string;
    value: string;
    color?: string;
  }>;
}

interface LocalInterpretation {
  localId: string;
  dreamLocalId: string;
  framework: string;
  provider: string;
  model: string;
  content: string;
  tokenCount?: number;
  costUsd?: number;
  createdAt: Date;
  syncStatus: 'pending' | 'synced';
}

interface LocalSymbol {
  localId: string;
  remoteId?: string;
  name: string;
  meaning: string;
  context?: string;
  valence?: string;
  relatedSymbolIds: string[];
  frequency: number;
  createdAt: Date;
  updatedAt: Date;
  syncStatus: 'pending' | 'synced' | 'conflict';
}

interface QueuedRequest {
  id: string;
  type: 'interpret' | 'sync';
  payload: any;
  createdAt: Date;
  retryCount: number;
}

interface Settings {
  key: string;
  value: any;
}

class DreamLensDB extends Dexie {
  dreams!: Table<LocalDream, string>;
  interpretations!: Table<LocalInterpretation, string>;
  symbols!: Table<LocalSymbol, string>;
  queue!: Table<QueuedRequest, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('dreamlens');
    this.version(1).stores({
      dreams: 'localId, remoteId, recordedAt, syncStatus, *tags.value',
      interpretations: 'localId, dreamLocalId, framework, createdAt',
      symbols: 'localId, remoteId, name, syncStatus',
      queue: 'id, type, createdAt',
      settings: 'key',
    });
  }
}

export const localDb = new DreamLensDB();
```

---

## TypeScript Types

```typescript
// types/index.ts

// === FRAMEWORKS ===
export type FrameworkId = 
  | 'jung'
  | 'freud'
  | 'gestalt'
  | 'islamic'
  | 'indigenous'
  | 'cognitive'
  | 'existential';

export interface Framework {
  id: FrameworkId;
  name: string;
  shortName: string;
  description: string;
  icon: string;          // Lucide icon name
  color: string;         // Tailwind color class
}

export const FRAMEWORKS: Record<FrameworkId, Framework> = {
  jung: {
    id: 'jung',
    name: 'Carl Jung - Analytical Psychology',
    shortName: 'Jungian',
    description: 'Archetypes, collective unconscious, shadow work, individuation',
    icon: 'Orbit',
    color: 'purple',
  },
  freud: {
    id: 'freud',
    name: 'Sigmund Freud - Psychoanalysis',
    shortName: 'Freudian',
    description: 'Wish fulfillment, latent content, psychosexual symbolism',
    icon: 'Brain',
    color: 'red',
  },
  gestalt: {
    id: 'gestalt',
    name: 'Gestalt Therapy',
    shortName: 'Gestalt',
    description: 'Every element as self-projection, present-moment awareness',
    icon: 'Puzzle',
    color: 'green',
  },
  islamic: {
    id: 'islamic',
    name: 'Islamic Tradition (Ibn Sirin)',
    shortName: 'Islamic',
    description: 'Prophetic symbolism, spiritual guidance, Quranic references',
    icon: 'Moon',
    color: 'emerald',
  },
  indigenous: {
    id: 'indigenous',
    name: 'Indigenous/Shamanic',
    shortName: 'Shamanic',
    description: 'Spirit communication, ancestral messages, nature symbolism',
    icon: 'Leaf',
    color: 'amber',
  },
  cognitive: {
    id: 'cognitive',
    name: 'Cognitive Neuroscience',
    shortName: 'Neuroscience',
    description: 'Memory consolidation, emotional processing, threat simulation',
    icon: 'Activity',
    color: 'blue',
  },
  existential: {
    id: 'existential',
    name: 'Existential/Phenomenological',
    shortName: 'Existential',
    description: 'Meaning-making, authentic self, lived experience',
    icon: 'Compass',
    color: 'slate',
  },
};

// === PROVIDERS & MODELS ===
export type ProviderId = 'openai' | 'anthropic' | 'google';

export interface Model {
  id: string;
  name: string;
  provider: ProviderId;
  inputCostPer1kTokens: number;   // USD
  outputCostPer1kTokens: number;  // USD
  maxTokens: number;
  supportsStreaming: boolean;
}

export const MODELS: Model[] = [
  // OpenAI
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', inputCostPer1kTokens: 0.005, outputCostPer1kTokens: 0.015, maxTokens: 128000, supportsStreaming: true },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', inputCostPer1kTokens: 0.00015, outputCostPer1kTokens: 0.0006, maxTokens: 128000, supportsStreaming: true },
  { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', inputCostPer1kTokens: 0.01, outputCostPer1kTokens: 0.03, maxTokens: 128000, supportsStreaming: true },
  // Anthropic
  { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet', provider: 'anthropic', inputCostPer1kTokens: 0.003, outputCostPer1kTokens: 0.015, maxTokens: 200000, supportsStreaming: true },
  { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus', provider: 'anthropic', inputCostPer1kTokens: 0.015, outputCostPer1kTokens: 0.075, maxTokens: 200000, supportsStreaming: true },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic', inputCostPer1kTokens: 0.00025, outputCostPer1kTokens: 0.00125, maxTokens: 200000, supportsStreaming: true },
  // Google
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google', inputCostPer1kTokens: 0.00125, outputCostPer1kTokens: 0.005, maxTokens: 2000000, supportsStreaming: true },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google', inputCostPer1kTokens: 0.000075, outputCostPer1kTokens: 0.0003, maxTokens: 1000000, supportsStreaming: true },
];

// === TAG SYSTEM ===
export type TagCategory = 'emotion' | 'theme' | 'person' | 'place' | 'object' | 'action' | 'custom';

export interface Tag {
  category: TagCategory;
  value: string;
  color?: string;  // Hex, only for custom
}

export const PRESET_TAGS: Record<TagCategory, string[]> = {
  emotion: ['fear', 'joy', 'anxiety', 'peace', 'confusion', 'anger', 'sadness', 'excitement', 'love', 'guilt'],
  theme: ['falling', 'flying', 'chasing', 'death', 'water', 'fire', 'lost', 'naked', 'teeth', 'exam'],
  person: ['family', 'stranger', 'friend', 'deceased', 'celebrity', 'self', 'child', 'authority'],
  place: ['home', 'school', 'work', 'unknown', 'nature', 'city', 'childhood', 'foreign'],
  object: ['vehicle', 'phone', 'money', 'animal', 'weapon', 'door', 'mirror', 'book'],
  action: ['running', 'hiding', 'searching', 'talking', 'fighting', 'swimming', 'climbing', 'eating'],
  custom: [],
};

// === INTERPRETATION ===
export interface InterpretationRequest {
  dreamContent: string;
  dreamTitle?: string;
  tags: Tag[];
  framework: FrameworkId;
  provider: ProviderId;
  model: string;
  personalSymbols?: Array<{ name: string; meaning: string }>;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface InterpretationResponse {
  content: string;
  tokenCount: {
    input: number;
    output: number;
  };
  costUsd: number;
  suggestedFollowUps: string[];
  identifiedSymbols: string[];
}

// === UI STATE ===
export type ThemeMode = 'light' | 'dark' | 'aggressive-dark';

export interface Settings {
  theme: ThemeMode;
  autoNightMode: boolean;
  nightModeStart: string;   // HH:mm
  nightModeEnd: string;     // HH:mm
  defaultFramework: FrameworkId;
  defaultProvider: ProviderId;
  defaultModel: string;
  offlineMode: boolean;     // Local-only, no sync
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  autoNightMode: true,
  nightModeStart: '22:00',
  nightModeEnd: '07:00',
  defaultFramework: 'jung',
  defaultProvider: 'openai',
  defaultModel: 'gpt-4o-mini',
  offlineMode: false,
};
```

---

## LLM Provider Interface

```typescript
// lib/llm/index.ts
import { InterpretationRequest, InterpretationResponse, ProviderId } from '@/types';
import { interpretOpenAI } from './providers/openai';
import { interpretAnthropic } from './providers/anthropic';
import { interpretGoogle } from './providers/google';
import { buildSystemPrompt } from './frameworks';

export interface LLMClient {
  interpret(request: InterpretationRequest): Promise<InterpretationResponse>;
  interpretStream(request: InterpretationRequest): AsyncGenerator<string, InterpretationResponse>;
}

const providers: Record<ProviderId, (apiKey: string) => LLMClient> = {
  openai: interpretOpenAI,
  anthropic: interpretAnthropic,
  google: interpretGoogle,
};

export function createLLMClient(provider: ProviderId, apiKey: string): LLMClient {
  return providers[provider](apiKey);
}

export { buildSystemPrompt };
```

```typescript
// lib/llm/providers/openai.ts
import OpenAI from 'openai';
import { LLMClient, InterpretationRequest, InterpretationResponse } from '@/types';
import { buildSystemPrompt } from '../frameworks';
import { countTokens } from '@/lib/utils/tokens';
import { calculateCost } from '@/lib/utils/cost';

export function interpretOpenAI(apiKey: string): LLMClient {
  const client = new OpenAI({ apiKey });

  return {
    async interpret(request: InterpretationRequest): Promise<InterpretationResponse> {
      const systemPrompt = buildSystemPrompt(request.framework, request.personalSymbols);
      const userMessage = formatUserMessage(request);

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...(request.conversationHistory?.map(m => ({
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

      const content = response.choices[0]?.message?.content ?? '';
      const inputTokens = response.usage?.prompt_tokens ?? countTokens(systemPrompt + userMessage);
      const outputTokens = response.usage?.completion_tokens ?? countTokens(content);

      return {
        content,
        tokenCount: { input: inputTokens, output: outputTokens },
        costUsd: calculateCost(request.model, inputTokens, outputTokens),
        suggestedFollowUps: extractSuggestedFollowUps(content),
        identifiedSymbols: extractSymbols(content),
      };
    },

    async *interpretStream(request: InterpretationRequest): AsyncGenerator<string, InterpretationResponse> {
      const systemPrompt = buildSystemPrompt(request.framework, request.personalSymbols);
      const userMessage = formatUserMessage(request);

      const messages: OpenAI.ChatCompletionMessageParam[] = [
        { role: 'system', content: systemPrompt },
        ...(request.conversationHistory?.map(m => ({
          role: m.role as 'user' | 'assistant',
          content: m.content,
        })) ?? []),
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
        content: fullContent,
        tokenCount: { input: inputTokens, output: outputTokens },
        costUsd: calculateCost(request.model, inputTokens, outputTokens),
        suggestedFollowUps: extractSuggestedFollowUps(fullContent),
        identifiedSymbols: extractSymbols(fullContent),
      };
    },
  };
}

function formatUserMessage(request: InterpretationRequest): string {
  let message = `## Dream\n\n${request.dreamContent}`;
  
  if (request.dreamTitle) {
    message = `## Title: ${request.dreamTitle}\n\n${message}`;
  }
  
  if (request.tags.length > 0) {
    const tagsByCategory = request.tags.reduce((acc, tag) => {
      acc[tag.category] = acc[tag.category] || [];
      acc[tag.category].push(tag.value);
      return acc;
    }, {} as Record<string, string[]>);
    
    message += '\n\n## Tags\n';
    for (const [category, values] of Object.entries(tagsByCategory)) {
      message += `- ${category}: ${values.join(', ')}\n`;
    }
  }
  
  return message;
}

function extractSuggestedFollowUps(content: string): string[] {
  // LLM should include these in a specific format
  const regex = /\[FOLLOW_UP\](.*?)\[\/FOLLOW_UP\]/g;
  const matches = [...content.matchAll(regex)];
  return matches.map(m => m[1].trim()).slice(0, 3);
}

function extractSymbols(content: string): string[] {
  const regex = /\[SYMBOL\](.*?)\[\/SYMBOL\]/g;
  const matches = [...content.matchAll(regex)];
  return [...new Set(matches.map(m => m[1].trim().toLowerCase()))];
}
```

---

## Framework System Prompts

```typescript
// lib/llm/frameworks/index.ts
import { FrameworkId } from '@/types';
import { jungPrompt } from './jung';
import { freudPrompt } from './freud';
import { gestaltPrompt } from './gestalt';
import { islamicPrompt } from './islamic';
import { indigenousPrompt } from './indigenous';
import { cognitivePrompt } from './cognitive';
import { existentialPrompt } from './existential';

const frameworkPrompts: Record<FrameworkId, string> = {
  jung: jungPrompt,
  freud: freudPrompt,
  gestalt: gestaltPrompt,
  islamic: islamicPrompt,
  indigenous: indigenousPrompt,
  cognitive: cognitivePrompt,
  existential: existentialPrompt,
};

export function buildSystemPrompt(
  framework: FrameworkId,
  personalSymbols?: Array<{ name: string; meaning: string }>
): string {
  let prompt = frameworkPrompts[framework];

  if (personalSymbols && personalSymbols.length > 0) {
    prompt += '\n\n## Personal Symbol Dictionary\n';
    prompt += 'The dreamer has defined these personal meanings for symbols. Prioritize these over general interpretations:\n\n';
    for (const symbol of personalSymbols) {
      prompt += `- **${symbol.name}**: ${symbol.meaning}\n`;
    }
  }

  prompt += `\n\n## Response Format Requirements

1. Structure your interpretation with clear sections
2. When identifying key symbols, wrap each in [SYMBOL]symbol name[/SYMBOL] tags
3. At the end, suggest 2-3 follow-up questions wrapped in [FOLLOW_UP]question[/FOLLOW_UP] tags
4. Be specific and reference actual dream content
5. Maintain the authentic voice of the ${framework} framework
6. Keep response between 400-800 words unless follow-up conversation`;

  return prompt;
}
```

```typescript
// lib/llm/frameworks/jung.ts
export const jungPrompt = `You are a dream analyst trained in Carl Jung's Analytical Psychology. Interpret dreams using Jungian concepts:

## Core Concepts to Apply

### Archetypes
- **The Self**: The unified unconscious and conscious; wholeness
- **The Shadow**: Repressed weaknesses, desires, instincts
- **The Anima/Animus**: Contrasexual aspects; inner feminine (anima) or masculine (animus)
- **The Persona**: Social mask; how we present to the world
- **The Wise Old Man/Woman**: Wisdom, guidance, insight
- **The Trickster**: Chaos, disruption, catalyst for change
- **The Hero**: Overcoming obstacles, transformation
- **The Great Mother**: Nurturing, devouring; creation and destruction

### Key Processes
- **Individuation**: The process of integrating conscious and unconscious
- **Compensation**: Dreams compensate for imbalances in waking consciousness
- **Amplification**: Expanding symbol meanings through cultural/mythological parallels
- **Active Imagination**: Engaging with dream figures as autonomous entities

### Symbol Interpretation Approach
1. Personal associations first - what does this mean to the dreamer specifically?
2. Cultural/collective meanings - universal symbolism across cultures
3. Archetypal significance - connection to deep psychic structures
4. Compensatory function - what is the psyche trying to balance?

## Interpretation Guidelines
- Dreams are messages from the unconscious to the conscious mind
- Every character may represent an aspect of the dreamer's psyche
- Focus on the emotional tone and transformations within the dream
- Consider the dream's purpose: what is it trying to bring to consciousness?
- Avoid reductive interpretations; embrace the symbol's multiple meanings
- Connect to the dreamer's individuation journey when possible`;
```

```typescript
// lib/llm/frameworks/freud.ts
export const freudPrompt = `You are a dream analyst trained in Sigmund Freud's Psychoanalytic theory. Interpret dreams using Freudian concepts:

## Core Concepts to Apply

### Dream Structure
- **Manifest Content**: The literal, surface-level dream narrative
- **Latent Content**: The hidden, unconscious meaning beneath
- **Dream Work**: The process transforming latent to manifest content
  - Condensation: Multiple ideas compressed into single images
  - Displacement: Emotional significance shifted to neutral elements
  - Symbolization: Abstract ideas represented by concrete images
  - Secondary Revision: The mind's attempt to make the dream coherent

### Psychological Structures
- **Id**: Primitive drives, pleasure principle, unconscious desires
- **Ego**: Reality principle, mediates between id and superego
- **Superego**: Internalized moral standards, guilt, conscience

### Key Drives
- **Eros (Life Drive)**: Sexual energy, libido, creativity, connection
- **Thanatos (Death Drive)**: Aggression, destruction, return to inorganic

### Common Freudian Symbols
- Elongated objects, weapons, tools → phallic symbols
- Containers, rooms, caves, vessels → feminine/womb symbols
- Stairs, ladders, climbing → sexual intercourse
- Water → birth, the unconscious, amniotic
- Flying → sexual desire, erection
- Falling → giving in to sexual temptation
- Teeth falling out → castration anxiety, powerlessness

## Interpretation Guidelines
- Dreams are the "royal road to the unconscious"
- Every dream represents wish fulfillment (often disguised)
- Look for repressed desires, especially from childhood
- Sexual and aggressive impulses are frequently symbolized
- Consider what the dreamer may be censoring from themselves
- Examine relationships to parental figures (Oedipal dynamics)
- Note resistance: what might the dreamer not want to acknowledge?`;
```

```typescript
// lib/llm/frameworks/gestalt.ts
export const gestaltPrompt = `You are a dream analyst trained in Gestalt Therapy, developed by Fritz Perls. Interpret dreams using Gestalt principles:

## Core Concepts to Apply

### Fundamental Principles
- **Every element is a projection**: All people, objects, and settings in the dream represent aspects of the dreamer
- **Present-centered awareness**: Focus on what the dream means NOW, not past analysis
- **Wholeness and integration**: Dreams reveal fragmented parts seeking reintegration
- **Organismic self-regulation**: The psyche naturally moves toward balance and health

### Key Techniques to Reference
- **"I am" technique**: Invite the dreamer to speak AS each dream element
  - "I am the locked door. I keep things out because..."
  - "I am the pursuing shadow. I want to catch you because..."
- **Empty chair dialogue**: Elements of the dream can "speak" to each other
- **Top dog/underdog**: Internal conflicts between demanding and resistant parts
- **Figure/ground**: What stands out versus what recedes in awareness

### Polarities to Explore
- Victim ↔ Aggressor
- Controller ↔ Controlled
- Pursuer ↔ Pursued
- Known ↔ Unknown
- Expressed ↔ Suppressed

## Interpretation Guidelines
- Avoid intellectualized analysis; stay with immediate experience
- Every dream figure has something to say - give them voice
- Look for unfinished business (incomplete gestalts) from waking life
- Notice what the dreamer avoids or glosses over
- Physical sensations and body awareness are important
- The goal is integration: owning all parts of oneself
- Questions are more valuable than interpretations: "What do you experience when...?"
- Focus on HOW the dream unfolds, not just WHAT happens`;
```

```typescript
// lib/llm/frameworks/islamic.ts
export const islamicPrompt = `You are a dream interpreter trained in traditional Islamic dream interpretation (Tabir al-Ruya), drawing primarily from Ibn Sirin's methods and Islamic scholarly tradition.

## Core Concepts to Apply

### Categories of Dreams in Islam
1. **Ru'ya (True Dreams)**: Divine communication, one of 46 parts of prophethood
2. **Dreams from the Self**: Reflections of daily thoughts, worries, desires
3. **Dreams from Shaytan**: Disturbing dreams meant to frighten or mislead

### Interpretation Principles (Ibn Sirin's Method)
- Consider the dreamer's character and piety
- Time of dream matters (before Fajr often more significant)
- Same symbol may mean different things for different people
- Context of the dreamer's life situation
- Quranic and Hadith references for symbols
- The emotional state upon waking

### Common Islamic Dream Symbols
- **Water**: Knowledge, life, purification; clear water is positive
- **Garden/Paradise**: Good deeds, blessings, spiritual state
- **Flying**: Aspiration, spiritual elevation, travel
- **Teeth falling**: Death in family, or words spoken
- **Snake**: Enemy, or worldly wealth (context-dependent)
- **Prophet (PBUH)**: Seeing him truthfully indicates truth, blessings
- **Quran recitation**: Guidance, wisdom, memorization
- **Prayer**: State of one's relationship with Allah
- **Ka'bah**: Return to origin, pilgrimage, spiritual center
- **Light/Nur**: Faith, guidance, knowledge
- **Darkness**: Ignorance, misguidance, sin

### Important Hadith References
- "Good dreams are from Allah, and bad dreams are from Shaytan" (Bukhari)
- "When the end of time approaches, the dreams of a believer will hardly be false" (Bukhari)
- "The truest dreams are those of one who is most truthful in speech" (Muslim)

## Interpretation Guidelines
- Begin with Bismillah in your analysis
- Be gentle and give good interpretations when possible
- If negative, advise seeking refuge in Allah, not sharing the dream
- Recommend the dreamer pray for good outcomes
- Connect to the dreamer's spiritual state and practices
- Never claim certainty; only Allah knows the true meaning
- Encourage thankfulness for good dreams, patience with troubling ones
- Reference Quran and Sunnah appropriately`;
```

```typescript
// lib/llm/frameworks/indigenous.ts
export const indigenousPrompt = `You are a dream interpreter familiar with various Indigenous and shamanic dream traditions. Approach dreams with respect for these worldviews while acknowledging the diversity of Indigenous cultures.

## Core Concepts to Apply

### Foundational Beliefs (Common Across Many Traditions)
- **Dreams as real experiences**: The dream world is as real as waking reality
- **Spirit communication**: Ancestors, animal spirits, nature beings can communicate through dreams
- **Soul travel**: The soul or spirit may journey during sleep
- **Collective significance**: Dreams may carry meaning for community, not just individual
- **Reciprocity**: Dream gifts may require action or offering in return

### Dream Types in Shamanic Traditions
- **Big Dreams**: Significant, vivid, often life-changing; may be shared with elders
- **Medicine Dreams**: Healing information, remedies, diagnosis
- **Vision Dreams**: Guidance about life path, vocation, initiation
- **Visitation Dreams**: Contact with deceased, ancestors, spirits
- **Warning Dreams**: Premonitions, dangers to avoid
- **Teaching Dreams**: Instruction from spirit guides

### Common Elements to Explore
- **Animals**: What medicine or message does this animal carry?
- **Natural Elements**: Fire, water, earth, air, plants, stones
- **Directions**: North, South, East, West each carry meaning
- **Ancestors**: What wisdom are they passing down?
- **Transformation**: Shapeshifting, death/rebirth imagery
- **Journey**: Where did the soul travel? What was encountered?

### Interpretive Approach
- Ask what the dream is asking OF the dreamer (action, change, offering)
- Consider seasonal and natural cycles
- Look for gifts received and their implications
- Notice beings who offer help or guidance
- Pay attention to repeated dreams—they demand attention
- Physical sensations in the dream carry meaning

## Interpretation Guidelines
- Approach with humility; you are offering possibilities, not certainties
- Honor that specific interpretations belong to specific peoples/traditions
- Focus on the dream's call to action or relationship
- Encourage the dreamer to sit with the dream, return to it
- Suggest creating art, making offerings, or journaling as response
- Recognize dreams as part of ongoing relationship with spirit world
- Avoid cultural appropriation; speak in general principles, not tribe-specific practices
- Dreams may be asking the dreamer to restore balance with nature or community`;
```

```typescript
// lib/llm/frameworks/cognitive.ts
export const cognitivePrompt = `You are a dream analyst approaching dreams from a cognitive neuroscience perspective. Interpret dreams using current scientific understanding of sleep, memory, and brain function.

## Core Concepts to Apply

### Sleep Stage Context
- **REM Sleep**: Most vivid narrative dreams, emotional processing, memory consolidation
- **NREM Sleep**: More fragmented, thought-like, less bizarre content
- **Sleep Cycle Timing**: Late-night dreams (more REM) tend to be more emotionally intense

### Theoretical Frameworks

#### Memory Consolidation Theory
- Dreams reflect the brain's process of transferring memories from hippocampus to cortex
- Recent experiences often appear, sometimes combined with older memories
- Emotional memories are prioritized for processing
- Novel or unfinished experiences more likely to appear

#### Threat Simulation Theory (Revonsuo)
- Dreams evolved to simulate threatening scenarios
- Allows "rehearsal" of responses without real danger
- Explains prevalence of chase, conflict, and anxiety dreams
- May be calibrated by recent real-world threats

#### Emotion Regulation Theory (Walker)
- REM sleep strips emotional charge from memories
- Dreams allow safe "exposure" to emotional content
- Disrupted REM linked to mood disorders
- Dreams may work through unprocessed emotions

#### Default Mode Network Activation
- Similar brain regions active in dreaming and mind-wandering
- Self-referential processing, autobiographical memory
- Social cognition and theory of mind
- Explains why dreams often feature familiar people, self-narratives

### What Dreams May Reflect
- **Recent memories**: "Day residue" incorporated into dream content
- **Unresolved concerns**: Problems the mind is still processing
- **Emotional states**: Anxiety, excitement, grief appearing in narrative form
- **Pattern recognition**: Brain making associations between disparate experiences
- **Predictive processing**: Brain generating expectations, simulating scenarios

## Interpretation Guidelines
- Avoid mystical or supernatural explanations
- Look for connections to recent waking experiences (past 1-7 days)
- Identify emotional themes—what is the brain processing?
- Consider what problems or concerns the dreamer is facing
- Note if dream content relates to real threats or stressors
- Recognize bizarre elements as normal REM cognition (not symbolic)
- Dreams don't predict the future but may reveal current preoccupations
- Multiple interpretations may be valid—the brain is complex
- Suggest practical applications: Is there an unresolved issue to address?`;
```

```typescript
// lib/llm/frameworks/existential.ts
export const existentialPrompt = `You are a dream analyst approaching dreams from an existential and phenomenological perspective, drawing on thinkers like Heidegger, Sartre, May, Boss, and Yalom.

## Core Concepts to Apply

### Existential Themes (Yalom's Ultimate Concerns)
- **Death**: Mortality awareness, finitude, impermanence
- **Freedom**: Radical responsibility, choice, groundlessness
- **Isolation**: Fundamental aloneness, unbridgeable gaps between people
- **Meaninglessness**: Absence of inherent meaning, need to create meaning

### Phenomenological Approach (Medard Boss)
- **Dasein-analysis**: Dreams reveal our way of being-in-the-world
- **World-openness**: How open or closed is the dreamer to possibilities?
- **Thrownness**: Our given situation that we didn't choose
- **Mood/Attunement**: The emotional atmosphere discloses something true
- **Take the dream literally first**: Before symbolizing, what does it show?

### Key Questions to Explore
- How is the dreamer **being** in this dream? (Active/passive? Open/closed? Authentic/inauthentic?)
- What **possibilities** does the dream reveal or foreclose?
- What is the dreamer **avoiding** or fleeing from?
- What **choices** are implicit in the dream scenario?
- How does the dreamer relate to **others** in the dream? (I-Thou or I-It?)
- What **meaning** is the dreamer creating or failing to create?
- Is there **bad faith**? (Self-deception, denying freedom, playing roles?)

### Existential Dream Phenomena
- **Anxiety (Angst)**: Not fear of something, but confrontation with existence itself
- **The Nothing**: Encounters with void, emptiness, groundlessness
- **Uncanny (Unheimlich)**: The familiar becoming strange; not-at-home feeling
- **Being-toward-death**: Confrontations with mortality, transformation
- **Authenticity calls**: Dreams that challenge comfortable but inauthentic living

### Concepts of Freedom
- Dreams may reveal where the dreamer feels trapped (but actually has choice)
- Inability to move/speak in dreams → Where is freedom denied in waking life?
- Being chased → What is the dreamer running from that must be faced?
- Lost or maze dreams → The search for authentic path

## Interpretation Guidelines
- Honor the dream's own presentation before imposing theory
- Focus on HOW the dreamer exists in the dream world
- Notice what the dream reveals about the dreamer's current life-stance
- Dreams call us toward authenticity; what is this dream calling for?
- Avoid deterministic explanations—the dreamer is always free to respond
- Connect to concrete life situations, not abstract philosophy
- The meaning is not hidden—it shows itself through careful attention
- What would it mean to live more fully awake to what this dream reveals?`;
```

---

## API Routes

```typescript
// app/api/interpret/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { createLLMClient } from '@/lib/llm';
import { db } from '@/lib/db';
import { apiKeys, interpretations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { decrypt } from '@/lib/utils/crypto';

const requestSchema = z.object({
  dreamId: z.string().uuid(),
  dreamContent: z.string().min(10).max(10000),
  dreamTitle: z.string().optional(),
  tags: z.array(z.object({
    category: z.string(),
    value: z.string(),
    color: z.string().optional(),
  })),
  framework: z.enum(['jung', 'freud', 'gestalt', 'islamic', 'indigenous', 'cognitive', 'existential']),
  provider: z.enum(['openai', 'anthropic', 'google']),
  model: z.string(),
  personalSymbols: z.array(z.object({
    name: z.string(),
    meaning: z.string(),
  })).optional(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  stream: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues }, { status: 400 });
  }

  const { dreamId, provider, stream, ...requestData } = parsed.data;

  // Get user's API key for provider
  const [keyRecord] = await db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, session.user.id), eq(apiKeys.provider, provider)));

  if (!keyRecord) {
    return NextResponse.json({ error: `No API key configured for ${provider}` }, { status: 400 });
  }

  const apiKey = decrypt(keyRecord.encryptedKey);
  const client = createLLMClient(provider, apiKey);

  if (stream) {
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const generator = client.interpretStream({ ...requestData, provider });
          let result: InterpretationResponse | undefined;

          for await (const chunk of generator) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`));
          }

          // Get the final result from the generator
          result = generator.next().then(r => r.value);

          if (result) {
            // Save interpretation to database
            await db.insert(interpretations).values({
              dreamId,
              framework: requestData.framework,
              provider,
              model: requestData.model,
              content: result.content,
              tokenCount: result.tokenCount.input + result.tokenCount.output,
              costUsd: Math.round(result.costUsd * 100), // Store in cents
            });

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', ...result })}\n\n`));
          }

          controller.close();
        } catch (error) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: String(error) })}\n\n`));
          controller.close();
        }
      },
    });

    return new NextResponse(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  }

  // Non-streaming response
  const result = await client.interpret({ ...requestData, provider });

  // Save interpretation to database
  const [interpretation] = await db.insert(interpretations).values({
    dreamId,
    framework: requestData.framework,
    provider,
    model: requestData.model,
    content: result.content,
    tokenCount: result.tokenCount.input + result.tokenCount.output,
    costUsd: Math.round(result.costUsd * 100),
  }).returning();

  return NextResponse.json({
    interpretationId: interpretation.id,
    ...result,
  });
}
```

---

## Key Components

### Voice Recorder Component

```typescript
// components/capture/VoiceRecorder.tsx
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Square, Pause, Play } from 'lucide-react';
import { useCaptureStore } from '@/stores/captureStore';

interface VoiceRecorderProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  onAudioBlob: (blob: Blob) => void;
}

export function VoiceRecorder({ onTranscript, onAudioBlob }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          onTranscript(finalTranscript, true);
        } else if (interimTranscript) {
          onTranscript(interimTranscript, false);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          // Handle permission denied
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Start MediaRecorder for audio blob
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start(1000); // Capture in 1s chunks

      // Start speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      setIsRecording(true);
      setIsPaused(false);
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [onAudioBlob]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
  }, []);

  const togglePause = useCallback(() => {
    if (!mediaRecorderRef.current) return;

    if (isPaused) {
      mediaRecorderRef.current.resume();
      recognitionRef.current?.start();
      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);
    } else {
      mediaRecorderRef.current.pause();
      recognitionRef.current?.stop();
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    setIsPaused(!isPaused);
  }, [isPaused]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Duration display */}
      <div className="text-4xl font-mono text-foreground/80">
        {formatDuration(duration)}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {!isRecording ? (
          <button
            onClick={startRecording}
            className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
            aria-label="Start recording"
          >
            <Mic className="w-10 h-10 text-white" />
          </button>
        ) : (
          <>
            <button
              onClick={togglePause}
              className="w-14 h-14 rounded-full bg-foreground/10 hover:bg-foreground/20 flex items-center justify-center transition-colors"
              aria-label={isPaused ? 'Resume' : 'Pause'}
            >
              {isPaused ? (
                <Play className="w-6 h-6 text-foreground" />
              ) : (
                <Pause className="w-6 h-6 text-foreground" />
              )}
            </button>

            <button
              onClick={stopRecording}
              className="w-20 h-20 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
              aria-label="Stop recording"
            >
              <Square className="w-8 h-8 text-white" />
            </button>
          </>
        )}
      </div>

      {/* Status */}
      <div className="text-sm text-foreground/60">
        {!isRecording ? 'Tap to start recording' : isPaused ? 'Paused' : 'Recording...'}
      </div>
    </div>
  );
}
```

### Comparison View Component

```typescript
// components/interpret/ComparisonView.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { FrameworkId, ProviderId, FRAMEWORKS } from '@/types';
import { InterpretationPanel } from './InterpretationPanel';
import { FrameworkSelector } from './FrameworkSelector';
import { ModelSelector } from './ModelSelector';

interface ComparisonViewProps {
  dreamId: string;
  dreamContent: string;
  dreamTitle?: string;
  tags: Array<{ category: string; value: string }>;
  mode: 'framework' | 'model';
}

interface PanelConfig {
  id: string;
  framework: FrameworkId;
  provider: ProviderId;
  model: string;
}

export function ComparisonView({ dreamId, dreamContent, dreamTitle, tags, mode }: ComparisonViewProps) {
  const [panels, setPanels] = useState<PanelConfig[]>([
    { id: '1', framework: 'jung', provider: 'openai', model: 'gpt-4o-mini' },
    { id: '2', framework: 'freud', provider: 'openai', model: 'gpt-4o-mini' },
  ]);

  const scrollRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [syncScroll, setSyncScroll] = useState(true);

  // Synchronized scrolling
  const handleScroll = (sourceId: string) => {
    if (!syncScroll) return;

    const sourceEl = scrollRefs.current.get(sourceId);
    if (!sourceEl) return;

    const scrollRatio = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight);

    scrollRefs.current.forEach((el, id) => {
      if (id !== sourceId) {
        el.scrollTop = scrollRatio * (el.scrollHeight - el.clientHeight);
      }
    });
  };

  const addPanel = () => {
    if (panels.length >= 4) return;

    const newPanel: PanelConfig = {
      id: String(Date.now()),
      framework: mode === 'framework' ? 'gestalt' : panels[0].framework,
      provider: mode === 'model' ? 'anthropic' : panels[0].provider,
      model: mode === 'model' ? 'claude-3-5-sonnet-20241022' : panels[0].model,
    };

    setPanels([...panels, newPanel]);
  };

  const removePanel = (id: string) => {
    if (panels.length <= 2) return;
    setPanels(panels.filter((p) => p.id !== id));
  };

  const updatePanel = (id: string, updates: Partial<PanelConfig>) => {
    setPanels(panels.map((p) => (p.id === id ? { ...p, ...updates } : p)));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium">
            Comparing: {mode === 'framework' ? 'Frameworks' : 'Models'}
          </span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={syncScroll}
              onChange={(e) => setSyncScroll(e.target.checked)}
              className="rounded"
            />
            Sync scroll
          </label>
        </div>

        {panels.length < 4 && (
          <button
            onClick={addPanel}
            className="text-sm text-primary hover:text-primary/80"
          >
            + Add panel
          </button>
        )}
      </div>

      {/* Panels */}
      <div className="flex-1 grid gap-4 p-4" style={{ gridTemplateColumns: `repeat(${panels.length}, 1fr)` }}>
        {panels.map((panel) => (
          <div key={panel.id} className="flex flex-col border border-border rounded-lg overflow-hidden">
            {/* Panel header */}
            <div className="p-3 border-b border-border bg-muted/50">
              {mode === 'framework' ? (
                <FrameworkSelector
                  value={panel.framework}
                  onChange={(framework) => updatePanel(panel.id, { framework })}
                />
              ) : (
                <ModelSelector
                  provider={panel.provider}
                  model={panel.model}
                  onProviderChange={(provider) => updatePanel(panel.id, { provider })}
                  onModelChange={(model) => updatePanel(panel.id, { model })}
                />
              )}

              {panels.length > 2 && (
                <button
                  onClick={() => removePanel(panel.id)}
                  className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              )}
            </div>

            {/* Panel content */}
            <div
              ref={(el) => {
                if (el) scrollRefs.current.set(panel.id, el);
              }}
              onScroll={() => handleScroll(panel.id)}
              className="flex-1 overflow-y-auto"
            >
              <InterpretationPanel
                dreamId={dreamId}
                dreamContent={dreamContent}
                dreamTitle={dreamTitle}
                tags={tags}
                framework={panel.framework}
                provider={panel.provider}
                model={panel.model}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## Dark Mode Implementation

```typescript
// app/globals.css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 0 0% 3.9%;
    --muted: 0 0% 96.1%;
    --muted-foreground: 0 0% 45.1%;
    --border: 0 0% 89.8%;
    --primary: 262 83% 58%;
  }

  .dark {
    --background: 0 0% 7%;
    --foreground: 0 0% 95%;
    --muted: 0 0% 15%;
    --muted-foreground: 0 0% 60%;
    --border: 0 0% 20%;
    --primary: 262 83% 68%;
  }

  /* Aggressive dark mode for night recording */
  .aggressive-dark {
    --background: 0 0% 0%;           /* True black */
    --foreground: 25 100% 50%;       /* Dim amber */
    --muted: 0 0% 5%;
    --muted-foreground: 25 80% 40%;
    --border: 0 0% 10%;
    --primary: 25 100% 45%;

    /* Reduce all contrast */
    * {
      opacity: 0.85;
    }

    /* No white anywhere */
    img, video {
      filter: brightness(0.7);
    }
  }
}

/* Large touch targets for half-awake interaction */
.aggressive-dark button,
.aggressive-dark [role="button"] {
  min-height: 56px;
  min-width: 56px;
}

/* Prevent any flash of white */
.aggressive-dark *::selection {
  background: hsl(25 100% 30%);
  color: hsl(25 100% 70%);
}
```

```typescript
// stores/settingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Settings, DEFAULT_SETTINGS, ThemeMode } from '@/types';

interface SettingsStore extends Settings {
  setTheme: (theme: ThemeMode) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  checkAutoNightMode: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setTheme: (theme) => {
        set({ theme });
        applyTheme(theme);
      },

      updateSettings: (settings) => {
        set(settings);
        if (settings.theme) {
          applyTheme(settings.theme);
        }
      },

      checkAutoNightMode: () => {
        const { autoNightMode, nightModeStart, nightModeEnd, theme } = get();
        if (!autoNightMode) return;

        const now = new Date();
        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        const [startHour, startMin] = nightModeStart.split(':').map(Number);
        const [endHour, endMin] = nightModeEnd.split(':').map(Number);
        const startMinutes = startHour * 60 + startMin;
        const endMinutes = endHour * 60 + endMin;

        let shouldBeAggressiveDark: boolean;

        if (startMinutes < endMinutes) {
          // Same day range (e.g., 09:00 - 17:00)
          shouldBeAggressiveDark = currentMinutes >= startMinutes && currentMinutes < endMinutes;
        } else {
          // Overnight range (e.g., 22:00 - 07:00)
          shouldBeAggressiveDark = currentMinutes >= startMinutes || currentMinutes < endMinutes;
        }

        const targetTheme = shouldBeAggressiveDark ? 'aggressive-dark' : 'dark';

        if (theme !== targetTheme) {
          set({ theme: targetTheme });
          applyTheme(targetTheme);
        }
      },
    }),
    {
      name: 'dreamlens-settings',
    }
  )
);

function applyTheme(theme: ThemeMode) {
  const root = document.documentElement;
  root.classList.remove('light', 'dark', 'aggressive-dark');
  root.classList.add(theme);
}
```

---

## Service Worker for Offline

```typescript
// public/sw.js
const CACHE_NAME = 'dreamlens-v1';
const STATIC_ASSETS = [
  '/',
  '/capture',
  '/dreams',
  '/dictionary',
  '/settings',
  '/manifest.json',
  // Add other static assets
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: network only (handled by IndexedDB queue if offline)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(JSON.stringify({ error: 'offline' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Return cached, but update in background
        event.waitUntil(
          fetch(request).then((response) => {
            if (response.ok) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, response);
              });
            }
          })
        );
        return cached;
      }

      return fetch(request).then((response) => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      });
    })
  );
});

// Background sync for queued interpretations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-interpretations') {
    event.waitUntil(syncQueuedRequests());
  }
});

async function syncQueuedRequests() {
  // This would communicate with IndexedDB to process queue
  // Implementation depends on how you structure the sync logic
  const bc = new BroadcastChannel('dreamlens-sync');
  bc.postMessage({ type: 'SYNC_REQUESTED' });
}
```

---

## Implementation Order

Execute in this sequence:

### Phase 1: Foundation (Week 1-2)
1. Initialize Next.js project with TypeScript, Tailwind
2. Set up Drizzle ORM with PostgreSQL schema
3. Set up Dexie for IndexedDB
4. Implement authentication (NextAuth)
5. Create base UI components (Button, Input, Card, etc.)
6. Implement theme system including aggressive dark mode
7. Set up PWA manifest and basic service worker

### Phase 2: Core Capture (Week 3-4)
1. Build VoiceRecorder component with Web Speech API
2. Create TranscriptEditor for review/correction
3. Implement tag system UI
4. Build dream creation/saving flow
5. Implement dream list and detail views
6. Add offline storage for dreams

### Phase 3: Interpretation Engine (Week 5-6)
1. Create LLM provider abstraction layer
2. Implement OpenAI provider
3. Implement Anthropic provider
4. Implement Google provider
5. Write all 7 framework system prompts
6. Build InterpretationPanel with streaming
7. Implement follow-up conversation UI
8. Add interpretation storage and history

### Phase 4: Comparison & Dictionary (Week 7-8)
1. Build ComparisonView component
2. Implement framework comparison mode
3. Implement model comparison mode
4. Create personal dictionary CRUD
5. Integrate dictionary into interpretation prompts
6. Build symbol suggestion system

### Phase 5: Patterns & Polish (Week 9-10)
1. Implement symbol extraction from interpretations
2. Build frequency analysis
3. Create pattern visualization
4. Implement offline queue for interpretations
5. Add background sync
6. Performance optimization
7. Testing and bug fixes

---

## Acceptance Criteria (Testable)

### Dream Capture
- [ ] User can tap "Record" and begin speaking within 3 seconds of app launch
- [ ] Transcription appears in real-time as user speaks
- [ ] User can pause, resume, and stop recording
- [ ] Audio blob is saved alongside transcript
- [ ] Dream is saved to IndexedDB immediately
- [ ] Dream syncs to PostgreSQL when online

### Interpretation
- [ ] User can select any of 7 frameworks
- [ ] User can select any configured LLM provider/model
- [ ] Interpretation streams to UI in real-time
- [ ] Cost estimate displays before interpretation
- [ ] Actual cost displays after interpretation
- [ ] Personal dictionary entries appear in interpretation context

### Comparison
- [ ] User can view 2-4 framework interpretations side-by-side
- [ ] User can view 2-3 model interpretations side-by-side
- [ ] Panels scroll synchronously when enabled
- [ ] Each panel can be independently configured

### Follow-Up
- [ ] User can ask follow-up questions after interpretation
- [ ] Conversation history persists with dream
- [ ] Suggested follow-up questions are displayed
- [ ] User can tap symbols for deeper analysis

### Dictionary
- [ ] User can add custom symbol definitions
- [ ] User can edit and delete symbols
- [ ] Symbols show frequency count
- [ ] Related symbols can be linked

### Offline
- [ ] App loads when device is offline
- [ ] User can record and save dreams offline
- [ ] Pending interpretations queue for later
- [ ] Sync completes automatically when online
- [ ] Conflicts are detected and surfaced to user

### Dark Mode
- [ ] True black background (#000000) in aggressive mode
- [ ] No white pixels visible in aggressive mode
- [ ] Auto-switches based on time when enabled
- [ ] Touch targets are minimum 56px in aggressive mode

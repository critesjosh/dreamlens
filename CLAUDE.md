# CLAUDE.md - DreamLens

This document provides guidance for Claude Code working on the DreamLens codebase.

## Project Overview

DreamLens is a Progressive Web Application (PWA) for dream journaling with AI-powered interpretation through 7 psychological frameworks.

**Tech Stack:**
- Next.js 16 (App Router) with TypeScript and React 19
- Tailwind CSS for styling
- Dexie (IndexedDB) for local storage
- Zustand for state management
- OpenAI SDK for LLM integration
- @radix-ui/react-slot for component composition

## Directory Structure

```
dreamlens/
├── app/                    # Next.js App Router pages
│   ├── (app)/              # Protected app routes
│   │   ├── capture/        # Dream capture page
│   │   ├── dreams/         # Dream list and detail pages
│   │   │   └── [id]/       # Individual dream with interpret subpage
│   │   └── settings/       # User settings
│   ├── globals.css         # Theme CSS variables
│   ├── layout.tsx          # Root layout with providers
│   └── page.tsx            # Dashboard
├── components/
│   ├── ui/                 # Reusable UI primitives (Button, Card, etc.)
│   ├── capture/            # Dream capture components
│   └── interpret/          # AI interpretation components
├── lib/
│   ├── db/local.ts         # Dexie IndexedDB schema and operations
│   ├── hooks/              # React hooks (useDreams, useInterpret)
│   ├── llm/                # LLM integration
│   │   ├── frameworks/     # 7 psychological framework prompts
│   │   ├── providers/      # LLM provider implementations
│   │   └── index.ts        # Provider factory
│   └── utils/              # Utility functions (cn, tokens, cost)
├── stores/                 # Zustand state stores
└── types/index.ts          # TypeScript type definitions
```

## Key Architectural Decisions

### State Management
- **Zustand** for global state (settings, capture flow)
- **Dexie React Hooks** (`useLiveQuery`) for reactive database queries
- No Redux or Context API - keep it simple

### Database
- **IndexedDB via Dexie** for all local storage
- Tables: `dreams`, `interpretations`, `conversations`, `symbols`
- PostgreSQL/remote sync is deferred to future phases

### LLM Integration
- Provider abstraction in `lib/llm/index.ts`
- Currently only OpenAI is implemented
- Framework prompts return structured responses with `[SYMBOL]` tags
- Follow-up conversations use streaming and persist to IndexedDB

### Conversation System
- Interpretations can have follow-up conversations stored in the `conversations` table
- `useInterpret` hook manages conversation state with `followUp()`, `loadConversation()`, and `clearConversation()`
- Chat history is displayed in a chatbot-style interface with user messages right-aligned
- Conversations are automatically loaded when viewing existing interpretations

### Theme System
Three theme modes via CSS variables:
- `light` - Standard light mode
- `dark` - Dark mode
- `aggressive-dark` - True black (#000) with amber text for half-awake recording

## Code Patterns

### React Components
- Use `'use client'` directive for client components
- Prefer functional components with hooks
- UI components in `components/ui/` follow shadcn/ui patterns
- In Next.js 16, dynamic route `params` are Promises - use `React.use(params)` to unwrap:
  ```typescript
  import { use } from 'react';

  export default function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    // ...
  }
  ```

### Database Operations
```typescript
// Creating a dream
import { createDream } from '@/lib/db/local';
const dream = await createDream({ content, recordedAt, tags });

// Reactive query in components
import { useLiveQuery } from 'dexie-react-hooks';
const dreams = useLiveQuery(() => getAllDreams(), []);
```

### LLM Interpretation
```typescript
// Using the useInterpret hook (recommended)
const {
  interpret,
  followUp,
  loadConversation,
  conversationHistory,
  isInterpreting,
  streamingContent,
} = useInterpret({
  dreamLocalId: id,
  dreamContent: dream.content,
  dreamTitle: dream.title,
  tags: dream.tags,
});

// Initial interpretation
await interpret('jung', 'gpt-4o');

// Follow-up questions (uses conversation history)
await followUp('What does the water symbolize?', 'jung', 'gpt-4o', interpretation.content, interpretation.localId);

// Load existing conversation when viewing saved interpretation
await loadConversation(interpretation.localId, interpretation.content);
```

## Development Guidelines

### Do
- Keep components focused and single-purpose
- Use TypeScript strictly - all types are in `types/index.ts`
- Follow existing patterns in the codebase
- Run `npm run build` to verify changes compile

### Don't
- Don't add new dependencies without clear justification
- Don't implement deferred features (auth, PostgreSQL, additional LLM providers)
- Don't add voice/speech functionality (removed for simplicity)
- Don't modify the 7 framework prompts without careful consideration

## Deferred Features (Do Not Implement Yet)

1. **Authentication** - NextAuth with PostgreSQL
2. **Remote Storage** - PostgreSQL with Drizzle ORM
3. **Sync** - Bidirectional IndexedDB ↔ PostgreSQL sync
4. **Additional LLM Providers** - Anthropic, Google
5. **Comparison Views** - Side-by-side framework comparisons
6. **Pattern Analysis** - Recurring symbol tracking

## Testing

Currently no automated tests. When adding:
- Unit tests for utility functions
- Integration tests for database operations
- E2E tests for critical user flows

## Common Tasks

### Adding a new UI component
1. Create in `components/ui/`
2. Export from `components/ui/index.ts`
3. Follow existing component patterns (forwardRef, cn utility, etc.)

### Adding a new page
1. Create in `app/(app)/` for authenticated routes
2. Add navigation link in `app/(app)/layout.tsx`
3. Use existing hooks for data fetching

### Modifying a framework prompt
1. Edit the relevant file in `lib/llm/frameworks/`
2. Ensure `[SYMBOL]` and `[FOLLOW_UP]` tag format is preserved
3. Test with actual dream content

## Environment Variables

```bash
# No env vars required for local-only development
# Future: OPENAI_API_KEY will be stored in IndexedDB settings
```

## Build Commands

```bash
npm run dev      # Start development server
npm run build    # Production build (validates TypeScript)
npm run lint     # ESLint
```

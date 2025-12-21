import Dexie, { type Table } from 'dexie';
import type { Tag, FrameworkId, ProviderId } from '@/types';

// === Database Types ===

export interface LocalDream {
  localId: string;          // UUID generated client-side
  title?: string;
  content: string;
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
}

export interface LocalInterpretation {
  localId: string;
  dreamLocalId: string;
  framework: FrameworkId;
  provider: ProviderId;
  model: string;
  content: string;
  tokenCount?: number;
  costUsd?: number;
  createdAt: Date;
}

export interface LocalConversation {
  localId: string;
  interpretationLocalId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LocalSymbol {
  localId: string;
  name: string;
  meaning: string;
  context?: string;
  valence?: 'positive' | 'negative' | 'neutral' | 'ambivalent';
  relatedSymbolIds: string[];
  frequency: number;
  createdAt: Date;
  updatedAt: Date;
}

// === Database Class ===

class DreamLensDB extends Dexie {
  dreams!: Table<LocalDream, string>;
  interpretations!: Table<LocalInterpretation, string>;
  conversations!: Table<LocalConversation, string>;
  symbols!: Table<LocalSymbol, string>;

  constructor() {
    super('dreamlens');

    this.version(1).stores({
      // Primary key is localId, indexed fields follow
      dreams: 'localId, recordedAt, createdAt, updatedAt, *tags.value',
      interpretations: 'localId, dreamLocalId, framework, createdAt',
      conversations: 'localId, interpretationLocalId, updatedAt',
      symbols: 'localId, name, frequency, updatedAt',
    });
  }
}

// === Singleton Instance ===

export const localDb = new DreamLensDB();

// === Helper Functions ===

export function generateLocalId(): string {
  return crypto.randomUUID();
}

// === Dream Operations ===

export async function createDream(data: Omit<LocalDream, 'localId' | 'createdAt' | 'updatedAt'>): Promise<LocalDream> {
  const now = new Date();
  const dream: LocalDream = {
    ...data,
    localId: generateLocalId(),
    createdAt: now,
    updatedAt: now,
  };

  await localDb.dreams.add(dream);
  return dream;
}

export async function getDream(localId: string): Promise<LocalDream | undefined> {
  return localDb.dreams.get(localId);
}

export async function getAllDreams(): Promise<LocalDream[]> {
  return localDb.dreams.orderBy('recordedAt').reverse().toArray();
}

export async function updateDream(localId: string, updates: Partial<LocalDream>): Promise<void> {
  await localDb.dreams.update(localId, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function deleteDream(localId: string): Promise<void> {
  // Also delete associated interpretations and conversations
  const interpretations = await localDb.interpretations
    .where('dreamLocalId')
    .equals(localId)
    .toArray();

  for (const interpretation of interpretations) {
    await localDb.conversations
      .where('interpretationLocalId')
      .equals(interpretation.localId)
      .delete();
  }

  await localDb.interpretations.where('dreamLocalId').equals(localId).delete();
  await localDb.dreams.delete(localId);
}

// === Interpretation Operations ===

export async function createInterpretation(
  data: Omit<LocalInterpretation, 'localId' | 'createdAt'>
): Promise<LocalInterpretation> {
  const interpretation: LocalInterpretation = {
    ...data,
    localId: generateLocalId(),
    createdAt: new Date(),
  };

  await localDb.interpretations.add(interpretation);
  return interpretation;
}

export async function getInterpretationsForDream(dreamLocalId: string): Promise<LocalInterpretation[]> {
  return localDb.interpretations
    .where('dreamLocalId')
    .equals(dreamLocalId)
    .reverse()
    .sortBy('createdAt');
}

export async function getInterpretation(localId: string): Promise<LocalInterpretation | undefined> {
  return localDb.interpretations.get(localId);
}

// === Conversation Operations ===

export async function createConversation(
  interpretationLocalId: string
): Promise<LocalConversation> {
  const now = new Date();
  const conversation: LocalConversation = {
    localId: generateLocalId(),
    interpretationLocalId,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };

  await localDb.conversations.add(conversation);
  return conversation;
}

export async function getConversationForInterpretation(
  interpretationLocalId: string
): Promise<LocalConversation | undefined> {
  return localDb.conversations
    .where('interpretationLocalId')
    .equals(interpretationLocalId)
    .first();
}

export async function addMessageToConversation(
  localId: string,
  message: { role: 'user' | 'assistant'; content: string }
): Promise<void> {
  const conversation = await localDb.conversations.get(localId);
  if (!conversation) throw new Error('Conversation not found');

  await localDb.conversations.update(localId, {
    messages: [
      ...conversation.messages,
      { ...message, timestamp: new Date() },
    ],
    updatedAt: new Date(),
  });
}

// === Symbol Operations ===

export async function createSymbol(
  data: Omit<LocalSymbol, 'localId' | 'createdAt' | 'updatedAt' | 'frequency'>
): Promise<LocalSymbol> {
  const now = new Date();
  const symbol: LocalSymbol = {
    ...data,
    localId: generateLocalId(),
    frequency: 1,
    createdAt: now,
    updatedAt: now,
  };

  await localDb.symbols.add(symbol);
  return symbol;
}

export async function getAllSymbols(): Promise<LocalSymbol[]> {
  return localDb.symbols.orderBy('frequency').reverse().toArray();
}

export async function getSymbolByName(name: string): Promise<LocalSymbol | undefined> {
  return localDb.symbols.where('name').equalsIgnoreCase(name).first();
}

export async function updateSymbol(localId: string, updates: Partial<LocalSymbol>): Promise<void> {
  await localDb.symbols.update(localId, {
    ...updates,
    updatedAt: new Date(),
  });
}

export async function incrementSymbolFrequency(localId: string): Promise<void> {
  const symbol = await localDb.symbols.get(localId);
  if (symbol) {
    await localDb.symbols.update(localId, {
      frequency: symbol.frequency + 1,
      updatedAt: new Date(),
    });
  }
}

export async function deleteSymbol(localId: string): Promise<void> {
  await localDb.symbols.delete(localId);
}

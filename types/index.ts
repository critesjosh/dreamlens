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
  icon: string; // Lucide icon name
  color: string; // Tailwind color class
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
  inputCostPer1kTokens: number; // USD
  outputCostPer1kTokens: number; // USD
  maxTokens: number;
  supportsStreaming: boolean;
}

export const MODELS: Model[] = [
  // OpenAI
  {
    id: 'gpt-5',
    name: 'GPT-5',
    provider: 'openai',
    inputCostPer1kTokens: 0.01,
    outputCostPer1kTokens: 0.03,
    maxTokens: 256000,
    supportsStreaming: true,
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'openai',
    inputCostPer1kTokens: 0.005,
    outputCostPer1kTokens: 0.015,
    maxTokens: 128000,
    supportsStreaming: true,
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'openai',
    inputCostPer1kTokens: 0.00015,
    outputCostPer1kTokens: 0.0006,
    maxTokens: 128000,
    supportsStreaming: true,
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openai',
    inputCostPer1kTokens: 0.01,
    outputCostPer1kTokens: 0.03,
    maxTokens: 128000,
    supportsStreaming: true,
  },
  // Anthropic (for future use)
  {
    id: 'claude-3-5-sonnet-20241022',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    inputCostPer1kTokens: 0.003,
    outputCostPer1kTokens: 0.015,
    maxTokens: 200000,
    supportsStreaming: true,
  },
  {
    id: 'claude-3-opus-20240229',
    name: 'Claude 3 Opus',
    provider: 'anthropic',
    inputCostPer1kTokens: 0.015,
    outputCostPer1kTokens: 0.075,
    maxTokens: 200000,
    supportsStreaming: true,
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    inputCostPer1kTokens: 0.00025,
    outputCostPer1kTokens: 0.00125,
    maxTokens: 200000,
    supportsStreaming: true,
  },
  // Google (for future use)
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'google',
    inputCostPer1kTokens: 0.00125,
    outputCostPer1kTokens: 0.005,
    maxTokens: 2000000,
    supportsStreaming: true,
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'google',
    inputCostPer1kTokens: 0.000075,
    outputCostPer1kTokens: 0.0003,
    maxTokens: 1000000,
    supportsStreaming: true,
  },
];

// === TAG SYSTEM ===
export type TagCategory = 'emotion' | 'theme' | 'person' | 'place' | 'object' | 'action' | 'custom';

export interface Tag {
  category: TagCategory;
  value: string;
  color?: string; // Hex, only for custom
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
  nightModeStart: string; // HH:mm
  nightModeEnd: string; // HH:mm
  defaultFramework: FrameworkId;
  defaultProvider: ProviderId;
  defaultModel: string;
  openaiApiKey?: string;
  // Subscription-related settings
  subscriptionEmail?: string;
  subscriptionStatus?: SubscriptionStatus;
  subscriptionSessionToken?: string;
  subscriptionCurrentPeriodEnd?: string; // ISO date string
}

export const DEFAULT_SETTINGS: Settings = {
  theme: 'dark',
  autoNightMode: true,
  nightModeStart: '22:00',
  nightModeEnd: '07:00',
  defaultFramework: 'jung',
  defaultProvider: 'openai',
  defaultModel: 'gpt-4o-mini',
};

// === LOCAL DATABASE TYPES ===
export interface LocalDream {
  localId: string; // UUID generated client-side
  title?: string;
  content: string;
  audioBlob?: Blob;
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
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
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

// === SUBSCRIPTION TYPES ===
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'none';

export interface Subscription {
  id: string; // Stripe subscription ID
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

export interface SubscriberInfo {
  email: string;
  customerId: string; // Stripe customer ID
  subscription?: Subscription;
  dedicatedApiKeyId?: string; // OpenAI project API key ID (not the key itself)
  createdAt: Date;
  updatedAt: Date;
}

// Local storage for subscription state
export interface LocalSubscription {
  localId: string;
  email: string;
  customerId: string;
  subscriptionId?: string;
  status: SubscriptionStatus;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  sessionToken?: string; // For authenticating with backend
  createdAt: Date;
  updatedAt: Date;
}

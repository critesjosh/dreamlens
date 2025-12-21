import { SignJWT, jwtVerify } from 'jose';

// Session token utilities
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || 'default-secret-change-in-production'
);

export interface SessionPayload {
  email: string;
  customerId: string;
  subscriptionId?: string;
  exp?: number;
}

export async function createSessionToken(payload: Omit<SessionPayload, 'exp'>): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .setIssuedAt()
    .sign(SESSION_SECRET);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SESSION_SECRET);
    // Validate that the payload contains required fields
    if (typeof payload.email === 'string' && typeof payload.customerId === 'string') {
      return {
        email: payload.email,
        customerId: payload.customerId,
        subscriptionId: typeof payload.subscriptionId === 'string' ? payload.subscriptionId : undefined,
        exp: typeof payload.exp === 'number' ? payload.exp : undefined,
      };
    }
    return null;
  } catch {
    return null;
  }
}

// OpenAI Admin API utilities
const OPENAI_ADMIN_API_KEY = process.env.OPENAI_ADMIN_API_KEY;
const OPENAI_ORG_ID = process.env.OPENAI_ORG_ID;
const OPENAI_PROJECT_ID = process.env.OPENAI_PROJECT_ID;

interface OpenAIApiKeyResponse {
  id: string;
  object: string;
  name: string;
  created_at: number;
  api_key: string; // Only returned on creation
  owner: {
    type: string;
    project?: {
      id: string;
      name: string;
    };
  };
}

export async function createOpenAIApiKey(
  email: string,
  customerId: string
): Promise<{ keyId: string; apiKey: string } | null> {
  if (!OPENAI_ADMIN_API_KEY || !OPENAI_ORG_ID) {
    console.error('OpenAI Admin API credentials not configured');
    return null;
  }

  try {
    // Create a new API key using OpenAI Admin API
    const keyName = `dreamlens-${customerId.slice(-8)}-${Date.now()}`;

    const endpoint = OPENAI_PROJECT_ID
      ? `https://api.openai.com/v1/organization/projects/${OPENAI_PROJECT_ID}/api_keys`
      : 'https://api.openai.com/v1/organization/api_keys';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_ADMIN_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Organization': OPENAI_ORG_ID,
      },
      body: JSON.stringify({
        name: keyName,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to create OpenAI API key:', error);
      return null;
    }

    const data: OpenAIApiKeyResponse = await response.json();

    return {
      keyId: data.id,
      apiKey: data.api_key,
    };
  } catch (error) {
    console.error('Error creating OpenAI API key:', error);
    return null;
  }
}

export async function revokeOpenAIApiKey(keyId: string): Promise<boolean> {
  if (!OPENAI_ADMIN_API_KEY || !OPENAI_ORG_ID) {
    console.error('OpenAI Admin API credentials not configured');
    return false;
  }

  try {
    const endpoint = OPENAI_PROJECT_ID
      ? `https://api.openai.com/v1/organization/projects/${OPENAI_PROJECT_ID}/api_keys/${keyId}`
      : `https://api.openai.com/v1/organization/api_keys/${keyId}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${OPENAI_ADMIN_API_KEY}`,
        'OpenAI-Organization': OPENAI_ORG_ID,
      },
    });

    return response.ok;
  } catch (error) {
    console.error('Error revoking OpenAI API key:', error);
    return false;
  }
}

// Subscriber data storage (in-memory for now, would use database in production)
// In production, you'd use a proper database like PostgreSQL
interface SubscriberData {
  email: string;
  customerId: string;
  subscriptionId?: string;
  openaiKeyId?: string;
  openaiApiKey?: string; // Encrypted in production
  status: 'active' | 'canceled' | 'past_due' | 'none';
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store (for development - use a database in production)
const subscribers = new Map<string, SubscriberData>();

export function getSubscriberByEmail(email: string): SubscriberData | undefined {
  return subscribers.get(email);
}

export function getSubscriberByCustomerId(customerId: string): SubscriberData | undefined {
  for (const subscriber of subscribers.values()) {
    if (subscriber.customerId === customerId) {
      return subscriber;
    }
  }
  return undefined;
}

export function saveSubscriber(data: SubscriberData): void {
  subscribers.set(data.email, data);
}

export function updateSubscriber(
  email: string,
  updates: Partial<SubscriberData>
): SubscriberData | undefined {
  const existing = subscribers.get(email);
  if (existing) {
    const updated = { ...existing, ...updates, updatedAt: new Date() };
    subscribers.set(email, updated);
    return updated;
  }
  return undefined;
}

export function deleteSubscriber(email: string): boolean {
  return subscribers.delete(email);
}

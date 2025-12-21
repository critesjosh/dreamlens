'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Check, X, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { useSettingsStore } from '@/stores/settingsStore';

interface SubscriptionCardProps {
  onSubscriptionChange?: () => void;
}

export function SubscriptionCard({ onSubscriptionChange }: SubscriptionCardProps) {
  const {
    subscriptionEmail,
    subscriptionStatus,
    subscriptionSessionToken,
    subscriptionCurrentPeriodEnd,
    setSubscription,
    clearSubscription,
    isSubscribed,
  } = useSettingsStore();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  // Check for successful checkout on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subscriptionResult = params.get('subscription');
    const sessionId = params.get('session_id');

    if (subscriptionResult === 'success' && sessionId) {
      verifyCheckout(sessionId);
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (subscriptionResult === 'canceled') {
      setError('Checkout was canceled');
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const verifyCheckout = async (sessionId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscription/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify subscription');
      }

      setSubscription({
        email: data.email,
        status: data.status,
        sessionToken: data.sessionToken,
        currentPeriodEnd: data.currentPeriodEnd,
      });

      onSubscriptionChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!subscriptionSessionToken) return;

    setIsCanceling(true);
    setError(null);

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${subscriptionSessionToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription');
      }

      // Update local state - subscription remains active until period end
      setError(null);
      onSubscriptionChange?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setIsCanceling(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const subscribed = isSubscribed();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          DreamLens Pro Subscription
        </CardTitle>
        <CardDescription>
          {subscribed
            ? 'You have an active subscription'
            : 'Subscribe for $2/month to use AI interpretation without your own API key'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscribed ? (
          <>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Check className="h-4 w-4 text-green-500" />
                <span>Active subscription</span>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>Email: {subscriptionEmail}</p>
                <p>Model: GPT-4o Mini (included)</p>
                {subscriptionCurrentPeriodEnd && (
                  <p>Renews: {formatDate(subscriptionCurrentPeriodEnd)}</p>
                )}
              </div>
            </div>

            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isCanceling}
                className="text-destructive hover:text-destructive"
              >
                {isCanceling ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Canceling...
                  </>
                ) : (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    Cancel Subscription
                  </>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Your subscription will remain active until the end of the current billing period.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="space-y-3">
              <div className="text-sm space-y-1">
                <p className="font-medium">What you get:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>No need for your own OpenAI API key</li>
                  <li>Unlimited dream interpretations</li>
                  <li>Uses GPT-4o Mini model</li>
                  <li>Your own dedicated API key for privacy</li>
                </ul>
              </div>

              <div className="flex flex-col gap-2">
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSubscribe}
                  disabled={isLoading || !email}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Subscribe for $2/month
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                Secure payment via Stripe. Cancel anytime.
              </p>
            </div>
          </>
        )}

        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

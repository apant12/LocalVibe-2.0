// Stripe payment processing service
export class StripeService {
  private secretKey: string;
  private baseUrl = 'https://api.stripe.com/v1';

  constructor() {
    this.secretKey = process.env.STRIPE_SECRET_KEY || '';
  }

  isConfigured(): boolean {
    return !!this.secretKey;
  }

  async createPaymentIntent(params: {
    amount: number; // amount in cents
    currency?: string;
    description?: string;
    metadata?: Record<string, string>;
  }) {
    if (!this.isConfigured()) {
      throw new Error('Stripe secret key not configured');
    }

    const body = new URLSearchParams();
    body.set('amount', params.amount.toString());
    body.set('currency', params.currency || 'usd');
    if (params.description) body.set('description', params.description);
    if (params.metadata) {
      Object.entries(params.metadata).forEach(([key, value]) => {
        body.set(`metadata[${key}]`, value);
      });
    }

    const response = await fetch(`${this.baseUrl}/payment_intents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  async confirmPaymentIntent(paymentIntentId: string, paymentMethodId: string) {
    if (!this.isConfigured()) {
      throw new Error('Stripe secret key not configured');
    }

    const body = new URLSearchParams();
    body.set('payment_method', paymentMethodId);

    const response = await fetch(`${this.baseUrl}/payment_intents/${paymentIntentId}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }

  async createCustomer(params: {
    email?: string;
    name?: string;
    metadata?: Record<string, string>;
  }) {
    if (!this.isConfigured()) {
      throw new Error('Stripe secret key not configured');
    }

    const body = new URLSearchParams();
    if (params.email) body.set('email', params.email);
    if (params.name) body.set('name', params.name);
    if (params.metadata) {
      Object.entries(params.metadata).forEach(([key, value]) => {
        body.set(`metadata[${key}]`, value);
      });
    }

    const response = await fetch(`${this.baseUrl}/customers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: body
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stripe API error: ${error.error?.message || response.statusText}`);
    }

    return response.json();
  }
}
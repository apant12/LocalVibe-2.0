import { useStripe, Elements, PaymentElement, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { AlertTriangle } from "lucide-react";

// Make sure to call `loadStripe` outside of a component's render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = import.meta.env.VITE_STRIPE_PUBLIC_KEY 
  ? loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY)
  : null;

interface CheckoutFormProps {
  experienceTitle: string;
  totalAmount: number;
  onSuccess: () => void;
}

const CheckoutForm = ({ experienceTitle, totalAmount, onSuccess }: CheckoutFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    setIsProcessing(false);

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful",
        description: "Your experience has been booked!",
      });
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card className="bg-surface border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Experience Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-gray-300">{experienceTitle}</p>
            <p className="text-2xl font-bold text-primary">${totalAmount.toFixed(2)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Payment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentElement />
        </CardContent>
      </Card>

      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4"
      >
        {isProcessing ? (
          <>
            <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2" />
            Processing...
          </>
        ) : (
          `Pay $${totalAmount.toFixed(2)}`
        )}
      </Button>
    </form>
  );
};

export default function Checkout() {
  const [, navigate] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [experienceData, setExperienceData] = useState<{
    title: string;
    amount: number;
  } | null>(null);

  useEffect(() => {
    // Get booking details from URL params or session storage
    const urlParams = new URLSearchParams(window.location.search);
    const experienceId = urlParams.get('experienceId');
    const numberOfPeople = parseInt(urlParams.get('numberOfPeople') || '1');
    const amount = parseFloat(urlParams.get('amount') || '0');
    const title = urlParams.get('title') || 'Experience';

    setExperienceData({ title, amount });

    // Create PaymentIntent
    apiRequest("POST", "/api/create-payment-intent", { 
      experienceId,
      numberOfPeople,
      amount: amount * 100 // Convert to cents
    })
      .then((res) => res.json())
      .then((data) => {
        setClientSecret(data.clientSecret);
      })
      .catch((error) => {
        console.error('Error creating payment intent:', error);
      });
  }, []);

  const handlePaymentSuccess = () => {
    navigate('/bookings');
  };

  if (!clientSecret || !experienceData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-300">Setting up your payment...</p>
        </div>
      </div>
    );
  }

  // Check if Stripe is configured
  if (!stripePromise) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold mb-2">Payment System Unavailable</h2>
          <p className="text-gray-300 mb-4">Stripe payment processing is not configured.</p>
          <Button onClick={() => navigate('/bookings')} className="bg-primary hover:bg-primary/90">
            Back to Bookings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="sticky top-0 bg-black/90 backdrop-blur-lg border-b border-gray-800 px-4 py-4">
        <div className="flex items-center">
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => window.history.back()}
            className="mr-4 text-white hover:bg-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Checkout</h1>
        </div>
      </div>

      <div className="px-4 py-6 max-w-md mx-auto">
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm 
            experienceTitle={experienceData.title}
            totalAmount={experienceData.amount}
            onSuccess={handlePaymentSuccess}
          />
        </Elements>
      </div>
    </div>
  );
}
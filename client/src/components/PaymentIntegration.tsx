import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Lock, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

interface PaymentIntegrationProps {
  experienceId: string;
  price: number;
  title: string;
  onSuccess: () => void;
}

export default function PaymentIntegration({ experienceId, price, title, onSuccess }: PaymentIntegrationProps) {
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'success'>('form');
  const [paymentMethod, setPaymentMethod] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    name: '',
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const paymentMutation = useMutation({
    mutationFn: async () => {
      setPaymentStep('processing');
      
      // Create payment intent
      const response = await apiRequest("POST", "/api/create-payment-intent", {
        amount: price,
        experienceId,
        currency: 'usd',
      });
      const { clientSecret } = await response.json();
      
      // Simulate Stripe payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create booking after successful payment
      const bookingResponse = await apiRequest("POST", "/api/bookings", {
        experienceId,
        participants: 1,
        selectedDate: new Date().toISOString(),
        totalAmount: price,
        paymentIntentId: clientSecret,
        status: 'confirmed',
      });
      
      return bookingResponse.json();
    },
    onSuccess: () => {
      setPaymentStep('success');
      toast({
        title: "Payment Successful!",
        description: `Your booking for "${title}" has been confirmed.`,
        className: "bg-green-600 text-white",
      });
      setTimeout(() => {
        onSuccess();
      }, 2000);
    },
    onError: (error: any) => {
      setPaymentStep('form');
      toast({
        title: "Payment Failed",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    }
  });

  const handleInputChange = (field: string, value: string) => {
    setPaymentMethod(prev => ({ ...prev, [field]: value }));
  };

  const formatCardNumber = (value: string) => {
    return value.replace(/\s/g, '').replace(/(\d{4})/g, '$1 ').trim();
  };

  const formatExpiryDate = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2');
  };

  const isFormValid = () => {
    return paymentMethod.cardNumber.length >= 13 &&
           paymentMethod.expiryDate.length === 5 &&
           paymentMethod.cvv.length >= 3 &&
           paymentMethod.name.length > 0;
  };

  if (paymentStep === 'success') {
    return (
      <Card className="bg-surface border-green-600">
        <CardContent className="p-6 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Payment Successful!</h3>
          <p className="text-gray-300 mb-4">Your booking has been confirmed</p>
          <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <p className="text-green-400 text-sm">
              Booking confirmation sent to {user?.email}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-surface border-gray-800">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <CreditCard className="w-5 h-5 text-primary" />
          <span>Secure Payment</span>
        </CardTitle>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Lock className="w-3 h-3" />
          <span>Your payment information is secure and encrypted</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Booking Summary */}
        <div className="bg-black/20 rounded-lg p-3 mb-6">
          <h4 className="text-white font-semibold mb-2">Booking Summary</h4>
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-300">{title}</span>
            <span className="text-white font-semibold">${price}</span>
          </div>
          <div className="flex justify-between items-center text-sm mt-2 pt-2 border-t border-gray-700">
            <span className="text-white font-semibold">Total</span>
            <span className="text-primary font-bold text-lg">${price}</span>
          </div>
        </div>

        {/* Payment Form */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="cardNumber" className="text-white">Card Number</Label>
            <Input
              id="cardNumber"
              placeholder="1234 5678 9012 3456"
              value={formatCardNumber(paymentMethod.cardNumber)}
              onChange={(e) => handleInputChange('cardNumber', e.target.value.replace(/\s/g, ''))}
              maxLength={19}
              className="bg-black/40 border-gray-600 text-white"
              disabled={paymentStep === 'processing'}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="expiryDate" className="text-white">Expiry Date</Label>
              <Input
                id="expiryDate"
                placeholder="MM/YY"
                value={formatExpiryDate(paymentMethod.expiryDate)}
                onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                maxLength={5}
                className="bg-black/40 border-gray-600 text-white"
                disabled={paymentStep === 'processing'}
              />
            </div>
            <div>
              <Label htmlFor="cvv" className="text-white">CVV</Label>
              <Input
                id="cvv"
                placeholder="123"
                value={paymentMethod.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                maxLength={4}
                className="bg-black/40 border-gray-600 text-white"
                disabled={paymentStep === 'processing'}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="name" className="text-white">Cardholder Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={paymentMethod.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="bg-black/40 border-gray-600 text-white"
              disabled={paymentStep === 'processing'}
            />
          </div>
        </div>

        {/* Payment Button */}
        <Button
          onClick={() => paymentMutation.mutate()}
          disabled={!isFormValid() || paymentStep === 'processing'}
          className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3"
        >
          {paymentStep === 'processing' ? (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              <span>Processing Payment...</span>
            </div>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Pay ${price} Now
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 text-center">
          By completing this purchase you agree to our Terms of Service and Privacy Policy
        </p>
      </CardContent>
    </Card>
  );
}
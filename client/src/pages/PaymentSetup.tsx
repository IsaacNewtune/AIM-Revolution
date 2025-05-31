import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";

export default function PaymentSetup() {
  const [, setLocation] = useLocation();
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US'
    }
  });

  const selectedPlan = localStorage.getItem('selectedPlan') || 'premium';
  const planPrices = {
    premium: '$9.99',
    pro: '$19.99'
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes('billingAddress.')) {
      const addressField = field.split('.')[1];
      setPaymentData(prev => ({
        ...prev,
        billingAddress: {
          ...prev.billingAddress,
          [addressField]: value
        }
      }));
    } else {
      setPaymentData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmitPayment = () => {
    // In a real implementation, this would process the payment through Stripe
    // For now, we'll simulate success and proceed to dashboard
    const accountType = localStorage.getItem('selectedAccountType');
    
    // Redirect to appropriate dashboard based on account type
    if (accountType === 'artist') {
      setLocation('/artist');
    } else if (accountType === 'manager') {
      setLocation('/manager');
    } else {
      setLocation('/');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Complete Your Subscription</h1>
          <p className="text-text-secondary">
            Secure payment processing for your {selectedPlan} plan
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="md:col-span-2">
            <Card className="bg-card-bg">
              <CardHeader>
                <CardTitle>Payment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Card Information */}
                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    value={paymentData.cardNumber}
                    onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                    placeholder="1234 5678 9012 3456"
                    className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input
                      id="expiryDate"
                      value={paymentData.expiryDate}
                      onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                      placeholder="MM/YY"
                      className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cvv">CVV</Label>
                    <Input
                      id="cvv"
                      value={paymentData.cvv}
                      onChange={(e) => handleInputChange('cvv', e.target.value)}
                      placeholder="123"
                      className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="cardholderName">Cardholder Name</Label>
                  <Input
                    id="cardholderName"
                    value={paymentData.cardholderName}
                    onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                    placeholder="John Doe"
                    className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                  />
                </div>

                {/* Billing Address */}
                <div className="border-t border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold mb-4">Billing Address</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        value={paymentData.billingAddress.street}
                        onChange={(e) => handleInputChange('billingAddress.street', e.target.value)}
                        placeholder="123 Main Street"
                        className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={paymentData.billingAddress.city}
                          onChange={(e) => handleInputChange('billingAddress.city', e.target.value)}
                          placeholder="New York"
                          className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={paymentData.billingAddress.state}
                          onChange={(e) => handleInputChange('billingAddress.state', e.target.value)}
                          placeholder="NY"
                          className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="zipCode">ZIP Code</Label>
                        <Input
                          id="zipCode"
                          value={paymentData.billingAddress.zipCode}
                          onChange={(e) => handleInputChange('billingAddress.zipCode', e.target.value)}
                          placeholder="10001"
                          className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Select value={paymentData.billingAddress.country} onValueChange={(value) => handleInputChange('billingAddress.country', value)}>
                          <SelectTrigger className="bg-dark-bg border-gray-600 focus:border-ai-purple">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="US">United States</SelectItem>
                            <SelectItem value="CA">Canada</SelectItem>
                            <SelectItem value="GB">United Kingdom</SelectItem>
                            <SelectItem value="AU">Australia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="bg-card-bg">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="capitalize">{selectedPlan} Plan</span>
                    <span className="font-semibold">{planPrices[selectedPlan as keyof typeof planPrices]}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm text-text-secondary">
                    <span>Billing Period</span>
                    <span>Monthly</span>
                  </div>
                  
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex justify-between font-semibold text-lg">
                      <span>Total</span>
                      <span>{planPrices[selectedPlan as keyof typeof planPrices]}/month</span>
                    </div>
                  </div>

                  <div className="text-xs text-text-secondary">
                    <p>• Cancel anytime</p>
                    <p>• Secure payment processing</p>
                    <p>• No setup fees</p>
                  </div>
                </div>

                <Button
                  onClick={handleSubmitPayment}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-ai-purple to-ai-blue text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                >
                  Complete Payment
                </Button>

                <div className="flex justify-center mt-4">
                  <div className="flex space-x-2 text-text-secondary">
                    <i className="fab fa-cc-visa text-lg"></i>
                    <i className="fab fa-cc-mastercard text-lg"></i>
                    <i className="fab fa-cc-amex text-lg"></i>
                    <i className="fab fa-cc-discover text-lg"></i>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
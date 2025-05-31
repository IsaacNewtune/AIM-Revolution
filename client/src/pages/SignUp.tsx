import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";

export default function SignUp() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    firstName: '',
    lastName: '',
    termsAccepted: false,
  });
  const [signUpMethod, setSignUpMethod] = useState<'email' | 'phone'>('email');

  const accountType = localStorage.getItem('selectedAccountType') || 'listener';

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignUp = () => {
    if (!formData.termsAccepted) {
      alert('Please accept the terms of use');
      return;
    }
    
    if (signUpMethod === 'email' && formData.password !== formData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    // Store form data for the next step
    localStorage.setItem('signUpData', JSON.stringify(formData));
    
    // For listeners, go to subscription selection
    if (accountType === 'listener') {
      setLocation('/subscription-plans');
    } else {
      // For artists and managers, complete setup first
      window.location.href = "/api/login";
    }
  };

  const handleSocialSignUp = (provider: string) => {
    localStorage.setItem('socialProvider', provider);
    if (accountType === 'listener') {
      // After social auth, redirect to subscription plans
      localStorage.setItem('redirectAfterAuth', '/subscription-plans');
    }
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white flex items-center justify-center p-6">
      <Card className="bg-card-bg max-w-md w-full">
        <CardContent className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Join AiBeats</h1>
            <p className="text-text-secondary">
              Create your {accountType} account
            </p>
          </div>

          {/* Social Sign Up Options */}
          <div className="space-y-3 mb-6">
            <Button
              variant="outline"
              className="w-full py-3 bg-dark-bg border-gray-600 hover:bg-gray-800 transition-colors"
              onClick={() => handleSocialSignUp('google')}
            >
              <i className="fab fa-google mr-3 text-red-500"></i>
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full py-3 bg-dark-bg border-gray-600 hover:bg-gray-800 transition-colors"
              onClick={() => handleSocialSignUp('facebook')}
            >
              <i className="fab fa-facebook mr-3 text-blue-500"></i>
              Continue with Facebook
            </Button>
            <Button
              variant="outline"
              className="w-full py-3 bg-dark-bg border-gray-600 hover:bg-gray-800 transition-colors"
              onClick={() => handleSocialSignUp('apple')}
            >
              <i className="fab fa-apple mr-3"></i>
              Continue with Apple
            </Button>
          </div>

          <div className="flex items-center mb-6">
            <Separator className="flex-1" />
            <span className="px-4 text-text-secondary text-sm">or</span>
            <Separator className="flex-1" />
          </div>

          {/* Sign Up Method Toggle */}
          <div className="flex mb-6 bg-dark-bg rounded-lg p-1">
            <Button
              variant={signUpMethod === 'email' ? 'default' : 'ghost'}
              className={`flex-1 ${signUpMethod === 'email' ? 'bg-ai-purple' : ''}`}
              onClick={() => setSignUpMethod('email')}
            >
              Email
            </Button>
            <Button
              variant={signUpMethod === 'phone' ? 'default' : 'ghost'}
              className={`flex-1 ${signUpMethod === 'phone' ? 'bg-ai-purple' : ''}`}
              onClick={() => setSignUpMethod('phone')}
            >
              Phone
            </Button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                  placeholder="John"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                  placeholder="Doe"
                />
              </div>
            </div>

            {signUpMethod === 'email' ? (
              <>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                    placeholder="Create a strong password"
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                    placeholder="Confirm your password"
                  />
                </div>
              </>
            ) : (
              <div>
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  className="bg-dark-bg border-gray-600 focus:border-ai-purple"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            )}
          </div>

          {/* Terms Checkbox */}
          <div className="flex items-start space-x-3 mb-6">
            <Checkbox
              id="terms"
              checked={formData.termsAccepted}
              onCheckedChange={(checked) => handleInputChange('termsAccepted', checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="terms" className="text-sm text-text-secondary cursor-pointer">
              I agree to the{' '}
              <a href="#" className="text-ai-purple hover:underline">Terms of Use</a>{' '}
              and{' '}
              <a href="#" className="text-ai-purple hover:underline">Privacy Policy</a>
            </Label>
          </div>

          {/* Sign Up Button */}
          <Button
            onClick={handleSignUp}
            disabled={!formData.termsAccepted}
            className="w-full py-3 bg-gradient-to-r from-ai-purple to-ai-blue text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50"
          >
            Create Account
          </Button>

          {/* Sign In Link */}
          <div className="text-center mt-6">
            <p className="text-text-secondary text-sm">
              Already have an account?{' '}
              <a 
                href="/api/login" 
                className="text-ai-purple hover:underline font-medium"
              >
                Sign In
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
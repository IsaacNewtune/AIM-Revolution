import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useLocation } from "wouter";
import { Briefcase, User, Mail, Phone, Lock, Apple, Facebook, Building } from "lucide-react";

export default function ManagerSignUp() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    firstName: '',
    lastName: '',
    companyName: '',
    jobTitle: '',
    termsAccepted: false,
  });
  const [signUpMethod, setSignUpMethod] = useState<'email' | 'phone'>('email');

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

    if (!formData.companyName.trim()) {
      alert('Please enter your company name');
      return;
    }

    // Store form data for the next step
    localStorage.setItem('signUpData', JSON.stringify(formData));
    localStorage.setItem('selectedAccountType', 'manager');
    
    // Managers complete setup through auth flow
    window.location.href = "/api/login";
  };

  const handleSocialSignUp = (provider: string) => {
    localStorage.setItem('selectedAccountType', 'manager');
    localStorage.setItem('companyName', formData.companyName);
    localStorage.setItem('jobTitle', formData.jobTitle);
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2">
            <Briefcase className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold">Join as a Manager</h1>
          </div>
          <p className="text-gray-600">Manage artists and grow their careers on our platform</p>
        </div>

        <Card>
          <CardContent className="p-6 space-y-6">
            {/* Company Information */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="companyName" className="flex items-center space-x-2">
                  <Building className="w-4 h-4" />
                  <span>Company/Agency Name *</span>
                </Label>
                <Input
                  id="companyName"
                  placeholder="Your company or agency name"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobTitle" className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>Job Title</span>
                </Label>
                <Input
                  id="jobTitle"
                  placeholder="e.g., Music Manager, A&R Representative"
                  value={formData.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Sign-up Method Toggle */}
            <div className="flex border rounded-lg p-1 bg-gray-100">
              <Button
                variant={signUpMethod === 'email' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => setSignUpMethod('email')}
              >
                <Mail className="w-4 h-4 mr-2" />
                Email
              </Button>
              <Button
                variant={signUpMethod === 'phone' ? 'default' : 'ghost'}
                size="sm"
                className="flex-1"
                onClick={() => setSignUpMethod('phone')}
              >
                <Phone className="w-4 h-4 mr-2" />
                Phone
              </Button>
            </div>

            {/* Personal Information */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                />
              </div>
            </div>

            {/* Email or Phone */}
            {signUpMethod === 'email' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center space-x-2">
                    <Mail className="w-4 h-4" />
                    <span>Email Address</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@company.com"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center space-x-2">
                    <Lock className="w-4 h-4" />
                    <span>Password</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Create password"
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center space-x-2">
                  <Phone className="w-4 h-4" />
                  <span>Phone Number</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                />
                <p className="text-xs text-gray-500">We'll send you a verification code</p>
              </div>
            )}

            {/* Terms and Conditions */}
            <div className="flex items-start space-x-2">
              <Checkbox
                id="terms"
                checked={formData.termsAccepted}
                onCheckedChange={(checked) => handleInputChange('termsAccepted', checked)}
              />
              <Label htmlFor="terms" className="text-sm leading-relaxed">
                I agree to the{' '}
                <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>{' '}
                and{' '}
                <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
              </Label>
            </div>

            {/* Sign Up Button */}
            <Button 
              onClick={handleSignUp}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              size="lg"
            >
              Create Manager Account
            </Button>

            {/* Social Sign Up */}
            <div className="space-y-4">
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-sm text-gray-500">
                  Or continue with
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSocialSignUp('google')}
                  className="flex items-center justify-center"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSocialSignUp('facebook')}
                  className="flex items-center justify-center"
                >
                  <Facebook className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleSocialSignUp('apple')}
                  className="flex items-center justify-center"
                >
                  <Apple className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Back to Account Selection */}
            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => setLocation('/')}
                className="text-gray-600"
              >
                ← Back to Account Selection
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Already have account */}
        <div className="text-center">
          <span className="text-gray-600">Already have an account? </span>
          <Button variant="link" onClick={() => window.location.href = "/api/login"}>
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

// Password strength checker
const getPasswordStrength = (password: string) => {
  let score = 0;
  let feedback = [];

  if (password.length >= 8) score++;
  else feedback.push("At least 8 characters");

  if (/[a-z]/.test(password)) score++;
  else feedback.push("Lowercase letter");

  if (/[A-Z]/.test(password)) score++;
  else feedback.push("Uppercase letter");

  if (/[0-9]/.test(password)) score++;
  else feedback.push("Number");

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else feedback.push("Special character");

  if (score <= 2) return { score, level: "Weak", color: "text-red-500", bgColor: "bg-red-500" };
  if (score <= 3) return { score, level: "Fair", color: "text-yellow-500", bgColor: "bg-yellow-500" };
  if (score <= 4) return { score, level: "Good", color: "text-blue-500", bgColor: "bg-blue-500" };
  return { score, level: "Strong", color: "text-green-500", bgColor: "bg-green-500" };
};

// Email validation
const isValidEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export default function Signup() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    isAdmin: false
  });

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [touched, setTouched] = useState<{[key: string]: boolean}>({});
  const [passwordStrength, setPasswordStrength] = useState(getPasswordStrength(''));

  // Update password strength when password changes
  useEffect(() => {
    setPasswordStrength(getPasswordStrength(formData.password));
  }, [formData.password]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleBlur = (name: string) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, formData[name as keyof typeof formData]);
  };

  const validateField = (name: string, value: string | boolean) => {
    let error = '';

    switch (name) {
      case 'firstName':
        if (!value || value.toString().trim().length < 2) {
          error = 'First name must be at least 2 characters';
        }
        break;
      case 'lastName':
        if (!value || value.toString().trim().length < 2) {
          error = 'Last name must be at least 2 characters';
        }
        break;
      case 'email':
        if (!value) {
          error = 'Email is required';
        } else if (!isValidEmail(value.toString())) {
          error = 'Please enter a valid email address';
        }
        break;
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.toString().length < 6) {
          error = 'Password must be at least 6 characters';
        }
        break;
    }

    setErrors(prev => ({ ...prev, [name]: error }));
    return !error;
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      if (!validateField(key, formData[key as keyof typeof formData])) {
        isValid = false;
      }
    });

    return isValid;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form.",
        variant: "destructive",
      });
      return;
    }

    setIsSigningUp(true);
    
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        // Invalidate and refetch the auth query to update the UI
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Signup successful!",
          description: "Welcome to LocalVibe!",
        });
        
        // Redirect to home page after successful signup
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        toast({
          title: "Signup failed",
          description: data.message || "There was an error creating your account.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: "Signup failed",
        description: "There was an error creating your account.",
        variant: "destructive",
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleAdminLogin = async () => {
    setIsSigningUp(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: 'admin@vibe.com',
          password: 'admin123'
        }),
      });

      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Admin login successful!",
          description: "Welcome back, Admin!",
        });
        
        // Redirect to home page
        setTimeout(() => {
          window.location.href = '/';
        }, 1500);
      } else {
        toast({
          title: "Admin login failed",
          description: "Invalid admin credentials.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Admin login error:', error);
      toast({
        title: "Admin login failed",
        description: "There was an error logging in.",
        variant: "destructive",
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-surface border-gray-800">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <i className="fas fa-user-plus text-2xl text-white"></i>
            </div>
            <CardTitle className="text-2xl font-bold">
              Join <span className="text-primary">LocalVibe</span>
            </CardTitle>
            <p className="text-gray-400 mt-2">
              Create your account to start discovering amazing experiences
            </p>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="text-white">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('firstName')}
                    className={`bg-gray-800 border-gray-700 text-white transition-colors ${
                      touched.firstName && errors.firstName ? 'border-red-500' : 
                      touched.firstName && !errors.firstName ? 'border-green-500' : ''
                    }`}
                    required
                  />
                  {touched.firstName && errors.firstName && (
                    <p className="text-red-400 text-xs mt-1">{errors.firstName}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-white">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('lastName')}
                    className={`bg-gray-800 border-gray-700 text-white transition-colors ${
                      touched.lastName && errors.lastName ? 'border-red-500' : 
                      touched.lastName && !errors.lastName ? 'border-green-500' : ''
                    }`}
                    required
                  />
                  {touched.lastName && errors.lastName && (
                    <p className="text-red-400 text-xs mt-1">{errors.lastName}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('email')}
                  className={`bg-gray-800 border-gray-700 text-white transition-colors ${
                    touched.email && errors.email ? 'border-red-500' : 
                    touched.email && !errors.email ? 'border-green-500' : ''
                  }`}
                  required
                />
                {touched.email && errors.email && (
                  <p className="text-red-400 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  onBlur={() => handleBlur('password')}
                  className={`bg-gray-800 border-gray-700 text-white transition-colors ${
                    touched.password && errors.password ? 'border-red-500' : 
                    touched.password && !errors.password ? 'border-green-500' : ''
                  }`}
                  required
                />
                
                {/* Password strength indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400">Password strength:</span>
                      <span className={passwordStrength.color}>{passwordStrength.level}</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.bgColor}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {['8+ chars', 'Lowercase', 'Uppercase', 'Number', 'Special'].map((req, index) => (
                        <span 
                          key={req}
                          className={`text-xs px-2 py-1 rounded ${
                            index < passwordStrength.score 
                              ? 'bg-green-600 text-white' 
                              : 'bg-gray-600 text-gray-300'
                          }`}
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {touched.password && errors.password && (
                  <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  id="isAdmin"
                  name="isAdmin"
                  type="checkbox"
                  checked={formData.isAdmin}
                  onChange={handleInputChange}
                  className="rounded border-gray-600 bg-gray-800"
                />
                <Label htmlFor="isAdmin" className="text-white text-sm">
                  Create as admin user
                </Label>
              </div>

              <Button 
                type="submit"
                disabled={isSigningUp}
                className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isSigningUp ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus mr-2"></i>
                    Create Account
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-gray-400">or</span>
              </div>
            </div>

            {/* Admin Quick Login */}
            <Button
              onClick={handleAdminLogin}
              disabled={isSigningUp}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSigningUp ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Logging in...
                </>
              ) : (
                <>
                  <i className="fas fa-crown mr-2"></i>
                  Admin Login (admin@vibe.com/admin123)
                </>
              )}
            </Button>

            <div className="text-center mt-6">
              <p className="text-gray-400 text-sm">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:text-primary/80 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <Link href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

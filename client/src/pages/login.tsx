import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLocalLogin = async () => {
    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/login', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Login successful!",
          description: "Welcome to LocalVibe!",
        });
        // Redirect to home page after successful login
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        console.error('Login failed');
        toast({
          title: "Login failed",
          description: "There was an error logging you in.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "There was an error logging you in.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Login successful!",
          description: "Welcome to LocalVibe!",
        });
        // Redirect to home page after successful login
        setTimeout(() => {
          window.location.href = "/";
        }, 1000);
      } else {
        const data = await response.json();
        toast({
          title: "Login failed",
          description: data.message || "Invalid email or password.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login failed",
        description: "There was an error logging you in.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/auth/google');
      if (response.ok) {
        const data = await response.json();
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          toast({
            title: "Google login not configured",
            description: "Please use email/password login for now.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Google login not available",
          description: "Please use email/password login for now.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        title: "Google login not available",
        description: "Please use email/password login for now.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleAppleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const response = await fetch('/api/auth/apple');
      if (response.ok) {
        const data = await response.json();
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          toast({
            title: "Apple login not configured",
            description: "Please use email/password login for now.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Apple login not available",
          description: "Please use email/password login for now.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Apple login error:', error);
      toast({
        title: "Apple login not available",
        description: "Please use email/password login for now.",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-surface border-gray-800">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <i className="fas fa-map-marker-alt text-2xl text-white"></i>
            </div>
            <CardTitle className="text-2xl font-bold">
              Welcome to <span className="text-primary">LocalVibe</span>
            </CardTitle>
            <p className="text-gray-400 mt-2">
              Sign in to discover amazing local experiences
            </p>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Email/Password Login Form */}
            <form onSubmit={handleFormLogin} className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="password" className="text-white">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="bg-gray-800 border-gray-700 text-white"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isLoggingIn}
                className="w-full bg-primary hover:bg-primary/90 text-black font-semibold py-3 px-4 rounded-xl"
              >
                {isLoggingIn ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-black border-t-transparent rounded-full mr-2"></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-in-alt mr-2"></i>
                    Sign In
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

            {/* OAuth Buttons */}
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className="w-full bg-white text-black hover:bg-gray-100 font-semibold py-3 px-4 rounded-xl"
            >
              <i className="fab fa-google mr-3 text-red-500"></i>
              Continue with Google
            </Button>

            <Button
              onClick={handleAppleLogin}
              disabled={isLoggingIn}
              className="w-full bg-black text-white hover:bg-gray-900 font-semibold py-3 px-4 rounded-xl border border-gray-700"
            >
              <i className="fab fa-apple mr-3"></i>
              Continue with Apple
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-700"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-surface text-gray-400">or</span>
              </div>
            </div>

            {/* Quick Development Login */}
            <Button
              onClick={handleLocalLogin}
              disabled={isLoggingIn}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 px-4 rounded-xl"
            >
              {isLoggingIn ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                  Logging in...
                </>
              ) : (
                <>
                  <i className="fas fa-rocket mr-2"></i>
                  Quick Start (Development)
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center mt-4">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-gray-400 text-sm mb-2">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:text-primary/80">
              Sign up
            </Link>
          </p>
          <Link href="/" className="text-gray-400 hover:text-white text-sm">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

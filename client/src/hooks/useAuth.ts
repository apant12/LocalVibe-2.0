import { useState, useCallback, useEffect } from "react";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name: string;
  isAdmin: boolean;
  profileImageUrl?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);

  const isAuthenticated = !!user;
  console.log('useAuth state:', { user, isAuthenticated, isLoading, hasCheckedAuth });

  const login = useCallback(async (email: string, password: string) => {
    console.log('Login attempt with:', email);
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      
      const data = await response.json();
      console.log('Login response:', data);
      
      if (data.success) {
        console.log('Login successful, setting user:', data.user);
        setUser(data.user);
        return { success: true };
      } else {
        console.log('Login failed:', data.message);
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, firstName, lastName }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, message: 'Signup failed' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user state immediately
      setUser(null);
      setHasCheckedAuth(false);
      // Show sign out message before reload
      localStorage.setItem('showSignOutMessage', 'true');
      // Force a page reload to ensure clean state
      window.location.reload();
    }
  }, []);

  // Check if user is already logged in on mount
  const checkAuth = useCallback(async () => {
    if (hasCheckedAuth) return; // Prevent multiple checks
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/user', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
      setHasCheckedAuth(true);
    }
  }, [hasCheckedAuth]);

  // Initialize auth check only once
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    signup,
    signOut,
    checkAuth,
  };
}

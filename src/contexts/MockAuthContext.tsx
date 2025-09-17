import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MockUser {
  id: string;
  email: string;
  user_metadata: {
    first_name: string;
    last_name: string;
  };
}

interface MockAuthContextType {
  user: MockUser | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const MockAuthContext = createContext<MockAuthContextType | undefined>(undefined);

export const useMockAuth = () => {
  const context = useContext(MockAuthContext);
  if (context === undefined) {
    throw new Error('useMockAuth must be used within a MockAuthProvider');
  }
  return context;
};

const MOCK_USER: MockUser = {
  id: '12345678-1234-1234-1234-123456789012',
  email: 'developer@test.com',
  user_metadata: {
    first_name: 'Test',
    last_name: 'Developer'
  }
};

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<MockUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Auto-sign in on mount for development
    const autoSignIn = async () => {
      setIsLoading(true);
      
      // Check if we already have a real session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Use real user if authenticated
        setUser({
          id: session.user.id,
          email: session.user.email || 'user@example.com',
          user_metadata: {
            first_name: session.user.user_metadata?.first_name || 'User',
            last_name: session.user.user_metadata?.last_name || 'Name'
          }
        });
      } else {
        // Use mock user for development
        setUser(MOCK_USER);
        
        // Create a mock session in Supabase for the mock user
        try {
          await supabase.auth.signInWithPassword({
            email: 'developer@test.com',
            password: 'password123'
          });
        } catch (error) {
          // If mock user doesn't exist, create it
          try {
            await supabase.auth.signUp({
              email: 'developer@test.com',
              password: 'password123',
              options: {
                data: {
                  first_name: 'Test',
                  last_name: 'Developer'
                }
              }
            });
          } catch (signUpError) {
            console.warn('Mock auth setup:', signUpError);
          }
        }
      }
      
      setIsLoading(false);
    };

    autoSignIn();
  }, []);

  const signIn = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'developer@test.com',
        password: 'password123'
      });
      
      if (!error) {
        setUser(MOCK_USER);
      }
    } catch (error) {
      console.error('Mock sign in error:', error);
    }
    setIsLoading(false);
  };

  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setIsLoading(false);
  };

  const value = {
    user,
    isLoading,
    signIn,
    signOut,
  };

  return (
    <MockAuthContext.Provider value={value}>
      {children}
    </MockAuthContext.Provider>
  );
};
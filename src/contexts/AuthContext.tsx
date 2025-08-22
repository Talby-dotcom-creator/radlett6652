import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { MemberProfile } from '../types';
import { optimizedApi as api } from '../lib/optimizedApi';

interface AuthContextType {
  user: User | null;
  profile: MemberProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  isAdmin: boolean;
  error: string | null;
  refreshProfile: () => Promise<void>;
  needsPasswordReset: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  isAdmin: false,
  error: null,
  refreshProfile: async () => {},
  needsPasswordReset: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<MemberProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProfile = async (currentUser: User) => {
    try {
      setError(null);
      
      const userProfile = await api.getMemberProfile(currentUser.id);
      setProfile(userProfile);
    } catch (error) {
      console.error('Error in loadProfile:', error);
      setError('Failed to load user profile');
      setProfile(null);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user);
    }
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError('Authentication error');
        } else if (session?.user && mounted) {
          setUser(session.user);
          await loadProfile(session.user);
        }
      } catch (err) {
        console.error('Unexpected error getting session:', err);
        setError('Failed to authenticate');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Start the initial session check
    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      try {
        setError(null);
        
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user);
          await loadProfile(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Don't reload profile on token refresh, just update user
          setUser(session.user);
        }
      } catch (err) {
        console.error('Error handling auth state change:', err);
        setError('Authentication error');
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
      setError('Failed to sign out');
      throw error;
    }
  };

  const isAdmin = profile?.role === 'admin';

  const needsPasswordReset = profile?.needs_password_reset === true;

  const contextValue = { 
    user, 
    profile, 
    loading, 
    signOut, 
    isAdmin, 
    error,
    refreshProfile,
    needsPasswordReset
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
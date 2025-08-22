import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import { useToast } from '../hooks/useToast';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

interface AuthFormProps {
  onSuccess?: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const { error, success } = useToast();
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFormError(null); // Clear any previous form errors
    
    console.log('🚀 AuthForm: Starting form submission');
    console.log('📧 AuthForm: Mode:', mode);
    console.log('📧 AuthForm: Email:', email);
    console.log('📧 AuthForm: Full name:', fullName);

    try {
      console.log(`Attempting to ${mode} with email:`, email);
      
      if (mode === 'signin') {
        console.log('🔑 AuthForm: Attempting sign in...');
        const { data, error: authError } = await supabase.auth.signInWithPassword({ 
          email: email.trim(), 
          password 
        });
        
        if (authError) {
          console.error('Sign in error:', authError);
          setFormError(authError.message); // Set form-specific error
          error(authError.message); // Show toast error
          throw authError;
        }
        
        if (data.user) {
          console.log('Sign in successful:', data.user.email);
          success('✅ Welcome back! Successfully signed in.');
          
          // Give the auth context time to update
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 500);
        } else {
          throw new Error('No user returned from sign in');
        }
      } else {
        console.log('📝 AuthForm: Starting signup process...');
        
        // Validate inputs for signup
        if (!fullName.trim()) {
          console.error('❌ AuthForm: Full name validation failed');
          throw new Error('Full name is required');
        }
        if (!email.trim()) {
          console.error('❌ AuthForm: Email validation failed');
          throw new Error('Email is required');
        }
        if (password.length < 6) {
          console.error('❌ AuthForm: Password validation failed');
          throw new Error('Password must be at least 6 characters');
        }
        
        console.log('✅ AuthForm: Input validation passed');
        console.log('Creating new account for:', email);
        
        const { data, error: authError } = await supabase.auth.signUp({ 
          email: email.trim(), 
          password 
        });
        
        console.log('📤 AuthForm: Supabase signup response received');
        console.log('📤 AuthForm: Data:', data);
        console.log('📤 AuthForm: Error:', authError);
        
        if (authError) {
          console.error('Signup error:', authError);
          setFormError(authError.message); // Set form-specific error
          error(authError.message); // Show toast error
          throw authError;
        }
        
        console.log('Sign up response:', data);
        
        if (data.user) {
          console.log('✅ AuthForm: User created successfully:', data.user.email);
          console.log('User created successfully:', data.user.email);
          
          // Try to create member profile, but don't fail if database isn't connected
          try {
            console.log('👤 AuthForm: Attempting to create member profile...');
            console.log('Attempting to create member profile...');
            await api.createMemberProfile(data.user.id, fullName);
            console.log('✅ AuthForm: Member profile created successfully');
            console.log('Member profile created successfully with pending status');
            
            // Show prominent success message and redirect to pending page
            console.log('🎉 AuthForm: Showing success toast and preparing redirect...');
            success('🎉 Account created successfully! Your membership is pending admin approval. Please wait for verification.');
            console.log('⏰ AuthForm: Setting 4-second redirect timer...');
            setTimeout(() => {
              console.log('🔄 AuthForm: Executing redirect to /members');
              navigate('/members');
            }, 3000);
          } catch (profileError) {
            console.warn('⚠️ AuthForm: Profile creation failed (likely demo mode):', profileError);
            console.warn('Could not create profile (database not connected):', profileError);
            // Don't throw error - user can still access demo mode
            console.log('🎉 AuthForm: Showing fallback success toast...');
            success('🎉 Account created successfully! Your membership is pending approval.');
            
            // Switch to sign-in mode and pre-fill the email
            console.log('🔄 AuthForm: Switching to sign-in mode');
            setMode('signin');
            setPassword('');
            setFullName('');
          }
        } else {
          console.warn('⚠️ AuthForm: No user returned from signup');
          console.warn('No user returned from signup');
          success('Account creation initiated. Please check your email if confirmation is required.');
        }
      }
      
    } catch (err) {
      console.error('💥 AuthForm: Caught error in handleSubmit:', err);
      console.error('Auth error:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      console.error('💥 AuthForm: Setting form error:', errorMessage);
      setFormError(errorMessage); // Set form-specific error
      console.error('💥 AuthForm: Calling error toast:', errorMessage);
      error(errorMessage); // Show toast error
    } finally {
      console.log('🏁 AuthForm: Setting loading to false');
      setLoading(false);
    }
  };

  return (
    <div>
      {formError && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md mb-4">
          <p className="text-sm font-medium">Error: {formError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {mode === 'signup' && (
          <div>
            <label htmlFor="fullName\" className="block text-sm font-medium text-primary-600">
              Full Name *
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required={mode === 'signup'}
              placeholder="Enter your full name"
              className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-primary-600">
            Email address *
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-primary-600">
            Password * {mode === 'signup' && <span className="text-sm text-neutral-500">(min 6 characters)</span>}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={mode === 'signup' ? 'Create a password (min 6 characters)' : 'Enter your password'}
            className="mt-1 block w-full rounded-md border border-neutral-300 px-3 py-2 focus:border-secondary-500 focus:ring-secondary-500"
          />
        </div>

        <div>
          <Button
            type="submit"
            disabled={loading}
            fullWidth
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </Button>
        </div>

        <div className="text-center text-sm">
          <button
            type="button"
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              // Clear form when switching modes except email
              setPassword('');
              setFullName('');
            }}
            className="text-secondary-500 hover:text-secondary-600"
          >
            {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AuthForm;
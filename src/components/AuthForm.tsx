import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { api } from '../lib/api';
import Button from './Button';
import LoadingSpinner from './LoadingSpinner';
import { Eye, EyeOff, Mail, Lock, UserPlus, LogIn } from 'lucide-react';

const AuthForm: React.FC = () => {
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Sign in
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        if (data.user) {
          await refreshProfile();
          navigate('/members');
        }
      } else {
        // Validate password for registration
        const passwordError = validatePassword(formData.password);
        if (passwordError) {
          setError(passwordError);
          return;
        }

        // Sign up
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        if (data.user) {
          // Create member profile
          await api.createMemberProfile(data.user.id, formData.fullName);
          await refreshProfile();
          navigate('/members/pending');
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toggle between Login and Register */}
      <div className="flex bg-neutral-100 rounded-lg p-1">
        <button
          type="button"
          onClick={() => {
            setIsLogin(true);
            setError(null);
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            isLogin
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-neutral-600 hover:text-primary-600'
          }`}
        >
          <LogIn size={16} className="inline mr-2" />
          Sign In
        </button>
        <button
          type="button"
          onClick={() => {
            setIsLogin(false);
            setError(null);
          }}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            !isLogin
              ? 'bg-white text-primary-600 shadow-sm'
              : 'text-neutral-600 hover:text-primary-600'
          }`}
        >
          <UserPlus size={16} className="inline mr-2" />
          Register
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {!isLogin && (
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-primary-600 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              required={!isLogin}
              disabled={loading}
              className="w-full px-4 py-3 border border-neutral-300 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 disabled:bg-neutral-100 disabled:cursor-not-allowed"
              placeholder="Enter your full name"
            />
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-primary-600 mb-2">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-3 pl-12 border border-neutral-300 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 disabled:bg-neutral-100 disabled:cursor-not-allowed"
              placeholder="Enter your email"
            />
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-primary-600 mb-2">
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-3 pl-12 pr-12 border border-neutral-300 rounded-md focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 disabled:bg-neutral-100 disabled:cursor-not-allowed"
              placeholder="Enter your password"
            />
            <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400" size={18} />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              disabled={loading}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {!isLogin && (
            <div className="mt-2 text-xs text-neutral-600">
              <p>Password must contain:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>At least 8 characters</li>
                <li>One uppercase letter</li>
                <li>One lowercase letter</li>
                <li>One number</li>
                <li>One special character</li>
              </ul>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={loading}
          fullWidth
          className="flex items-center justify-center"
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              {isLogin ? 'Signing In...' : 'Creating Account...'}
            </>
          ) : (
            <>
              {isLogin ? <LogIn size={18} className="mr-2" /> : <UserPlus size={18} className="mr-2" />}
              {isLogin ? 'Sign In' : 'Create Account'}
            </>
          )}
        </Button>
      </form>

      {!isLogin && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            <strong>Note:</strong> New member registrations require approval from an administrator. 
            You'll receive access to the members area once your account is verified.
          </p>
        </div>
      )}
    </div>
  );
};

export default AuthForm;
import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from '../components/AuthForm';
import { LogIn } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/members" replace />;
  }

  return (
    <div className="min-h-screen pt-36 pb-20 bg-neutral-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-full mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-heading font-bold text-primary-600 mb-2">
              Member Access
            </h1>
            <p className="text-neutral-600">
              Sign in to access the Members Area or create a new account
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-6 shadow-medium">
            <AuthForm />
          </div>
          
          {/* Features Overview */}
          <div className="mt-8 bg-white rounded-lg p-6 shadow-soft">
            <h3 className="font-heading font-semibold text-primary-600 mb-4">Member Area Features</h3>
            <div className="space-y-3 text-sm text-neutral-600">
              <div className="flex items-start">
                <span className="inline-block w-6 h-6 bg-secondary-500 text-primary-800 rounded-full text-xs font-bold flex items-center justify-center mr-3 mt-0.5">1</span>
                <div>
                  <p><strong>Lodge Documents:</strong> Access important communications, bylaws, and forms</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-6 h-6 bg-secondary-500 text-primary-800 rounded-full text-xs font-bold flex items-center justify-center mr-3 mt-0.5">2</span>
                <div>
                  <p><strong>Meeting Minutes:</strong> Review records of past Lodge meetings</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-6 h-6 bg-secondary-500 text-primary-800 rounded-full text-xs font-bold flex items-center justify-center mr-3 mt-0.5">3</span>
                <div>
                  <p><strong>Member Directory:</strong> Connect with fellow Lodge members</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="inline-block w-6 h-6 bg-secondary-500 text-primary-800 rounded-full text-xs font-bold flex items-center justify-center mr-3 mt-0.5">4</span>
                <div>
                  <p><strong>Admin Tools:</strong> Manage content and member profiles (admin only)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
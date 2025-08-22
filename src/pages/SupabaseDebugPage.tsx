import React, { useState, useEffect } from 'react';
import { Database, AlertTriangle, CheckCircle, XCircle, Copy, Check, RefreshCw } from 'lucide-react';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { supabase } from '../lib/supabase';

const SupabaseDebugPage: React.FC = () => {
  const [envVars, setEnvVars] = useState<{
    supabaseUrl: string | undefined;
    supabaseAnonKey: string | undefined;
    nodeEnv: string | undefined;
  }>({
    supabaseUrl: undefined,
    supabaseAnonKey: undefined,
    nodeEnv: undefined
  });
  
  const [connectionTest, setConnectionTest] = useState<any>(null);
  const [testing, setTesting] = useState(false);
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  useEffect(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    const nodeEnv = import.meta.env.MODE;

    setEnvVars({
      supabaseUrl,
      supabaseAnonKey,
      nodeEnv
    });
  }, []);

  const handleCopy = async (text: string, item: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItem(item);
      setTimeout(() => setCopiedItem(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    setConnectionTest(null);
    
    try {
      console.log('🔍 Testing Supabase connection...');
      
      // Test 1: Basic connection
      const { data: healthCheck, error: healthError } = await supabase
        .from('member_profiles')
        .select('count', { count: 'exact', head: true });
      
      if (healthError) {
        throw new Error(`Connection failed: ${healthError.message}`);
      }
      
      // Test 2: Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      // Test 3: Try to get some basic table info
      const { data: tables, error: tablesError } = await supabase
        .from('member_profiles')
        .select('id, full_name, role')
        .limit(1);
      
      setConnectionTest({
        success: true,
        healthCheck,
        user: user ? { id: user.id, email: user.email } : null,
        userError: userError?.message,
        tables,
        tablesError: tablesError?.message,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      setConnectionTest({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  const getConnectionStatus = () => {
    if (!envVars.supabaseUrl || !envVars.supabaseAnonKey) {
      return { status: 'error', message: 'Missing environment variables' };
    }
    
    if (connectionTest?.success) {
      return { status: 'success', message: 'Connected successfully' };
    }
    
    if (connectionTest?.success === false) {
      return { status: 'error', message: 'Connection failed' };
    }
    
    return { status: 'unknown', message: 'Not tested yet' };
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="min-h-screen pt-28 pb-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="text-3xl font-heading font-bold text-primary-600 mb-8">
          Supabase Database Connection Debug
        </h1>

        {/* Connection Status Overview */}
        <div className="mb-8 bg-neutral-50 rounded-lg p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-primary-600 flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Connection Status
            </h2>
            <Button
              onClick={testConnection}
              disabled={testing}
              className="flex items-center"
            >
              {testing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Testing...
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="mr-2" />
                  Test Connection
                </>
              )}
            </Button>
          </div>
          
          <div className="flex items-center mb-4">
            {connectionStatus.status === 'success' ? (
              <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
            ) : connectionStatus.status === 'error' ? (
              <XCircle className="w-6 h-6 text-red-500 mr-3" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-3" />
            )}
            <span className={`font-medium ${
              connectionStatus.status === 'success' ? 'text-green-800' :
              connectionStatus.status === 'error' ? 'text-red-800' : 'text-yellow-800'
            }`}>
              {connectionStatus.message}
            </span>
          </div>
        </div>

        {/* Environment Variables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-neutral-50 rounded-lg p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-primary-600 mb-4">Current Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  VITE_SUPABASE_URL:
                </label>
                <div className="flex items-center">
                  <div className={`flex-1 p-3 rounded border text-sm font-mono break-all ${
                    envVars.supabaseUrl ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {envVars.supabaseUrl || 'NOT SET'}
                  </div>
                  {envVars.supabaseUrl && (
                    <button
                      onClick={() => handleCopy(envVars.supabaseUrl!, 'url')}
                      className="ml-2 p-2 text-neutral-500 hover:text-neutral-700 transition-colors"
                      title="Copy URL"
                    >
                      {copiedItem === 'url' ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  VITE_SUPABASE_ANON_KEY:
                </label>
                <div className="flex items-center">
                  <div className={`flex-1 p-3 rounded border text-sm font-mono ${
                    envVars.supabaseAnonKey ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {envVars.supabaseAnonKey ? `${envVars.supabaseAnonKey.substring(0, 20)}...` : 'NOT SET'}
                  </div>
                  {envVars.supabaseAnonKey && (
                    <button
                      onClick={() => handleCopy(envVars.supabaseAnonKey!, 'key')}
                      className="ml-2 p-2 text-neutral-500 hover:text-neutral-700 transition-colors"
                      title="Copy key"
                    >
                      {copiedItem === 'key' ? (
                        <Check size={16} className="text-green-600" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Environment Mode:
                </label>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                  {envVars.nodeEnv || 'unknown'}
                </div>
              </div>
            </div>
          </div>

          {/* Connection Test Results */}
          <div className="bg-neutral-50 rounded-lg p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-primary-600 mb-4">Connection Test Results</h2>
            
            {connectionTest ? (
              <div className="space-y-4">
                <div className="bg-neutral-800 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-64">
                  <pre>{JSON.stringify(connectionTest, null, 2)}</pre>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-neutral-500">
                <Database className="w-12 h-12 mx-auto mb-3 text-neutral-300" />
                <p>Click "Test Connection" to check your database connection</p>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-medium text-blue-800 mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            How to Fix Database Connection Issues
          </h3>
          <div className="text-sm text-blue-700 space-y-3">
            <div>
              <p className="font-medium mb-2">1. If environment variables are missing or incorrect:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Click the "Connect to Supabase" button in the top right of the interface</li>
                <li>Follow the setup wizard to configure your Supabase project</li>
                <li>Make sure you're connecting to the correct Supabase project</li>
              </ul>
            </div>
            
            <div>
              <p className="font-medium mb-2">2. If you have the wrong database connected:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Go to your Supabase dashboard at <a href="https://supabase.com/dashboard" target="_blank" className="underline">supabase.com/dashboard</a></li>
                <li>Make sure you're in the correct project (check the project name in the top left)</li>
                <li>Copy the correct Project URL and anon key from Settings → API</li>
                <li>Use the "Connect to Supabase" button to update your configuration</li>
              </ul>
            </div>
            
            <div>
              <p className="font-medium mb-2">3. If connection test fails:</p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Check that your Supabase project is active and not paused</li>
                <li>Verify that the database tables exist (member_profiles, etc.)</li>
                <li>Ensure RLS policies are properly configured</li>
                <li>Try the connection test page at <code>/connection-test</code></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Database Schema Info */}
        {connectionTest?.success && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-medium text-green-800 mb-3">✅ Connection Successful</h3>
            <div className="text-sm text-green-700 space-y-2">
              <p><strong>Database Health:</strong> {connectionTest.healthCheck ? 'Good' : 'Unknown'}</p>
              <p><strong>Current User:</strong> {connectionTest.user ? connectionTest.user.email : 'Not logged in'}</p>
              <p><strong>Tables Accessible:</strong> {connectionTest.tables ? 'Yes' : 'No'}</p>
              {connectionTest.tablesError && (
                <p><strong>Table Error:</strong> {connectionTest.tablesError}</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupabaseDebugPage;
import React, { useState } from 'react';
import { testSupabaseConnection, testWithTimeout } from '../lib/connectionTest';
import Button from '../components/Button';
import LoadingSpinner from '../components/LoadingSpinner';
import { Database, Wifi, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

const ConnectionTestPage: React.FC = () => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [timeoutTest, setTimeoutTest] = useState<any>(null);

  const runConnectionTest = async () => {
    setTesting(true);
    setResult(null);
    
    try {
      const testResult = await testSupabaseConnection();
      setResult(testResult);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
        step: 'test_execution'
      });
    } finally {
      setTesting(false);
    }
  };

  const runTimeoutTest = async (timeout: number) => {
    setTimeoutTest({ testing: true, timeout });
    
    try {
      const testResult = await testWithTimeout(timeout);
      setTimeoutTest({ ...testResult, timeout, testing: false });
    } catch (error) {
      setTimeoutTest({
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
        timeout,
        testing: false
      });
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <h1 className="text-3xl font-heading font-bold text-primary-600 mb-8">
          Supabase Connection Test
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Main Connection Test */}
          <div className="bg-neutral-50 rounded-lg p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-primary-600 mb-4 flex items-center">
              <Database className="w-5 h-5 mr-2" />
              Comprehensive Connection Test
            </h2>
            <p className="text-neutral-600 mb-4">
              This will test your Supabase connection, authentication, and database queries.
            </p>
            <Button
              onClick={runConnectionTest}
              disabled={testing}
              className="w-full flex items-center justify-center mb-4"
            >
              {testing ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Running Tests...
                </>
              ) : (
                <>
                  <Wifi size={16} className="mr-2" />
                  Run Connection Test
                </>
              )}
            </Button>
            
            {result && (
              <div className="border-t border-neutral-200 pt-4">
                <div className="flex items-center mb-2">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <h3 className="font-medium">
                    {result.success ? 'All Tests Passed!' : `Test Failed at: ${result.step}`}
                  </h3>
                </div>
                
                <div className="bg-neutral-800 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-64">
                  <pre>{JSON.stringify(result, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
          
          {/* Timeout Tests */}
          <div className="bg-neutral-50 rounded-lg p-6 shadow-soft">
            <h2 className="text-xl font-semibold text-primary-600 mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Timeout Tests
            </h2>
            <p className="text-neutral-600 mb-4">
              Test connection with different timeout values to identify network issues.
            </p>
            
            <div className="space-y-3">
              {[5000, 10000, 30000].map((timeout) => (
                <Button
                  key={timeout}
                  variant="outline"
                  onClick={() => runTimeoutTest(timeout)}
                  disabled={timeoutTest?.testing}
                  className="w-full flex items-center justify-center"
                >
                  {timeoutTest?.testing && timeoutTest?.timeout === timeout ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Testing {timeout/1000}s...
                    </>
                  ) : (
                    `Test ${timeout/1000}s Timeout`
                  )}
                </Button>
              ))}
            </div>
            
            {timeoutTest && !timeoutTest.testing && (
              <div className="mt-4 border-t border-neutral-200 pt-4">
                <div className="flex items-center mb-2">
                  {timeoutTest.success ? (
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500 mr-2" />
                  )}
                  <h3 className="font-medium">
                    {timeoutTest.timeout/1000}s Timeout Test: {timeoutTest.success ? 'Passed' : 'Failed'}
                  </h3>
                </div>
                
                <div className="bg-neutral-800 text-green-400 p-4 rounded-lg font-mono text-sm overflow-auto max-h-32">
                  <pre>{JSON.stringify(timeoutTest, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Environment Variables Display */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-4">Current Environment Configuration</h2>
          <div className="space-y-2 text-blue-700">
            <p><strong>VITE_SUPABASE_URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'NOT SET'}</p>
            <p><strong>VITE_SUPABASE_ANON_KEY:</strong> {import.meta.env.VITE_SUPABASE_ANON_KEY ? `${import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...` : 'NOT SET'}</p>
            <p><strong>Environment Mode:</strong> {import.meta.env.MODE}</p>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-medium text-yellow-800 mb-3">Troubleshooting Steps</h3>
          <ol className="list-decimal list-inside space-y-2 text-yellow-700">
            <li>Run the comprehensive connection test to identify the specific failure point</li>
            <li>Check the timeout tests to see if it's a network latency issue</li>
            <li>Verify your environment variables are correctly set above</li>
            <li>If tests fail, check your Supabase project status in the dashboard</li>
            <li>Ensure your database has the required tables and RLS policies</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ConnectionTestPage;
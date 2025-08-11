import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Button from './Button';

interface DebugResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

const DebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [results, setResults] = useState<DebugResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runDebugTests = async () => {
    setLoading(true);
    const debugResults: DebugResult[] = [];

    // Test 1: Environment Variables
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
      debugResults.push({
        step: 'Environment Variables',
        status: 'error',
        message: 'VITE_SUPABASE_URL is missing',
        details: { available_vars: Object.keys(import.meta.env) }
      });
    } else {
      debugResults.push({
        step: 'Environment Variables',
        status: 'success',
        message: 'VITE_SUPABASE_URL is set',
        details: { url_preview: `${supabaseUrl.substring(0, 30)}...` }
      });
    }

    if (!supabaseAnonKey) {
      debugResults.push({
        step: 'Environment Variables',
        status: 'error',
        message: 'VITE_SUPABASE_ANON_KEY is missing'
      });
    } else {
      debugResults.push({
        step: 'Environment Variables',
        status: 'success',
        message: 'VITE_SUPABASE_ANON_KEY is set',
        details: { key_preview: `${supabaseAnonKey.substring(0, 10)}...` }
      });
    }

    // Test 2: Basic Connection
    try {
      const { data, error } = await supabase
        .from('member_profiles')
        .select('count', { count: 'exact', head: true })
        .abortSignal(AbortSignal.timeout(30000)); // 30 second timeout for debug

      if (error) {
        debugResults.push({
          step: 'Basic Connection',
          status: 'error',
          message: 'Failed to connect to Supabase',
          details: { error: error.message, code: error.code }
        });
      } else {
        debugResults.push({
          step: 'Basic Connection',
          status: 'success',
          message: 'Successfully connected to Supabase',
          details: { member_profiles_count: data }
        });
      }
    } catch (err) {
      debugResults.push({
        step: 'Basic Connection',
        status: 'error',
        message: 'Network error',
        details: { error: err instanceof Error ? err.message : String(err) }
      });
    }

    // Test 3: Table Access
    const tables = [
      { name: 'events', display: 'Events' },
      { name: 'blog_posts', display: 'News Articles' },
      { name: 'officers', display: 'Officers' },
      { name: 'testimonials', display: 'Testimonials' },
      { name: 'faq_items', display: 'FAQ Items' }
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table.name)
          .select('*')
          .limit(1)
          .abortSignal(AbortSignal.timeout(15000)); // 15 second timeout for debug

        if (error) {
          debugResults.push({
            step: `Table Access - ${table.display}`,
            status: 'error',
            message: `Cannot access ${table.name} table`,
            details: { error: error.message, code: error.code }
          });
        } else {
          debugResults.push({
            step: `Table Access - ${table.display}`,
            status: 'success',
            message: `Successfully accessed ${table.name} table`,
            details: { records_found: data?.length || 0, sample_data: data?.[0] }
          });
        }
      } catch (err) {
        debugResults.push({
          step: `Table Access - ${table.display}`,
          status: 'error',
          message: `Network error accessing ${table.name}`,
          details: { error: err instanceof Error ? err.message : String(err) }
        });
      }
    }

    // Test 4: Authentication Status
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error) {
        debugResults.push({
          step: 'Authentication',
          status: 'warning',
          message: 'No authenticated user',
          details: { error: error.message }
        });
      } else if (user) {
        debugResults.push({
          step: 'Authentication',
          status: 'success',
          message: 'User is authenticated',
          details: { user_id: user.id, email: user.email }
        });
      } else {
        debugResults.push({
          step: 'Authentication',
          status: 'warning',
          message: 'No user session found'
        });
      }
    } catch (err) {
      debugResults.push({
        step: 'Authentication',
        status: 'error',
        message: 'Error checking authentication',
        details: { error: err instanceof Error ? err.message : String(err) }
      });
    }

    setResults(debugResults);
    setLoading(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-neutral-200 bg-neutral-50';
    }
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          className="flex items-center bg-white shadow-lg"
        >
          <AlertTriangle size={16} className="mr-2" />
          Debug Supabase
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 bg-white border border-neutral-200 rounded-lg shadow-xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 bg-neutral-50">
        <h3 className="font-semibold text-primary-600">Supabase Debug Panel</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={runDebugTests}
            disabled={loading}
            className="flex items-center"
          >
            <RefreshCw size={14} className={`mr-1 ${loading ? 'animate-spin' : ''}`} />
            Test
          </Button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 text-neutral-500 hover:text-neutral-700"
          >
            <EyeOff size={16} />
          </button>
        </div>
      </div>

      <div className="p-4 max-h-80 overflow-y-auto">
        {loading && (
          <div className="text-center py-4">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary-600" />
            <p className="text-sm text-neutral-600">Running diagnostic tests...</p>
          </div>
        )}

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <div
                key={index}
                className={`border rounded-lg p-3 ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start">
                  {getStatusIcon(result.status)}
                  <div className="ml-3 flex-1">
                    <h4 className="text-sm font-medium text-neutral-800">
                      {result.step}
                    </h4>
                    <p className="text-sm text-neutral-600 mt-1">
                      {result.message}
                    </p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-neutral-500 cursor-pointer">
                          View details
                        </summary>
                        <pre className="text-xs bg-neutral-100 p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !loading && (
          <div className="text-center py-4 text-neutral-500">
            <p className="text-sm">Click "Test" to run diagnostic checks</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DebugPanel;
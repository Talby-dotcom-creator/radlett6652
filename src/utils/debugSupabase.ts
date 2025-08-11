import { supabase } from '../lib/supabase';

/**
 * Comprehensive Supabase debugging utility
 * This will help us identify exactly what's wrong with the connection
 */

export interface DebugResult {
  step: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: any;
}

export const debugSupabase = async (): Promise<DebugResult[]> => {
  const results: DebugResult[] = [];

  // Step 1: Check environment variables
  console.log('🔧 Debug Step 1: Checking environment variables...');
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    results.push({
      step: 'Environment Variables',
      status: 'error',
      message: 'VITE_SUPABASE_URL is not set',
      details: { available_vars: Object.keys(import.meta.env) }
    });
  } else if (!supabaseUrl.includes('supabase.co')) {
    results.push({
      step: 'Environment Variables',
      status: 'warning',
      message: 'VITE_SUPABASE_URL does not look like a valid Supabase URL',
      details: { url: supabaseUrl }
    });
  } else {
    results.push({
      step: 'Environment Variables',
      status: 'success',
      message: 'VITE_SUPABASE_URL is set and looks valid',
      details: { url_preview: `${supabaseUrl.substring(0, 30)}...` }
    });
  }

  if (!supabaseAnonKey) {
    results.push({
      step: 'Environment Variables',
      status: 'error',
      message: 'VITE_SUPABASE_ANON_KEY is not set'
    });
  } else if (supabaseAnonKey.length < 100) {
    results.push({
      step: 'Environment Variables',
      status: 'warning',
      message: 'VITE_SUPABASE_ANON_KEY seems too short',
      details: { key_length: supabaseAnonKey.length }
    });
  } else {
    results.push({
      step: 'Environment Variables',
      status: 'success',
      message: 'VITE_SUPABASE_ANON_KEY is set and looks valid',
      details: { key_preview: `${supabaseAnonKey.substring(0, 10)}...` }
    });
  }

  // Step 2: Test basic connection
  console.log('🔧 Debug Step 2: Testing basic connection...');
  try {
    const { count, error } = await Promise.race([
      supabase
      .from('member_profiles')
      .select('count', { count: 'exact', head: true }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout after 30 seconds')), 30000)
      )
    ]);

    if (error) {
      results.push({
        step: 'Basic Connection',
        status: 'error',
        message: 'Failed to connect to Supabase',
        details: {
          error_message: error.message,
          error_code: error.code,
          error_details: error.details,
          error_hint: error.hint
        }
      });
    } else {
      results.push({
        step: 'Basic Connection',
        status: 'success',
        message: 'Successfully connected to Supabase',
        details: { member_profiles_count: count }
      });
    }
  } catch (err) {
    console.error('🚨 Basic connection error details:', err);
    results.push({
      step: 'Basic Connection',
      status: 'error',
      message: `Network error connecting to Supabase: ${err instanceof Error ? err.message : String(err)}`,
      details: { error: err instanceof Error ? err.message : String(err) }
    });
  }

  // Step 3: Test authentication
  console.log('🔧 Debug Step 3: Testing authentication...');
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
      results.push({
        step: 'Authentication',
        status: 'warning',
        message: 'No authenticated user (this might be expected)',
        details: { error: error.message }
      });
    } else if (user) {
      results.push({
        step: 'Authentication',
        status: 'success',
        message: 'User is authenticated',
        details: { user_id: user.id, email: user.email }
      });
    } else {
      results.push({
        step: 'Authentication',
        status: 'warning',
        message: 'No user session found (user not logged in)'
      });
    }
  } catch (err) {
    results.push({
      step: 'Authentication',
      status: 'error',
      message: 'Error checking authentication',
      details: { error: err instanceof Error ? err.message : String(err) }
    });
  }

  // Step 4: Test each table access
  console.log('🔧 Debug Step 4: Testing table access...');
  const tables = [
    { name: 'events', display: 'Events' },
    { name: 'blog_posts', display: 'News Articles' },
    { name: 'officers', display: 'Officers' },
    { name: 'testimonials', display: 'Testimonials' },
    { name: 'faq_items', display: 'FAQ Items' },
    { name: 'site_settings', display: 'Site Settings' },
    { name: 'page_content', display: 'Page Content' }
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select('*')
        .limit(1);

      if (error) {
        results.push({
          step: `Table Access - ${table.display}`,
          status: 'error',
          message: `Cannot access ${table.name} table`,
          details: {
            error_message: error.message,
            error_code: error.code,
            error_details: error.details,
            error_hint: error.hint
          }
        });
      } else {
        results.push({
          step: `Table Access - ${table.display}`,
          status: 'success',
          message: `Successfully accessed ${table.name} table`,
          details: { sample_data_length: data?.length || 0 }
        });
      }
    } catch (err) {
      results.push({
        step: `Table Access - ${table.display}`,
        status: 'error',
        message: `Network error accessing ${table.name} table`,
        details: { error: err instanceof Error ? err.message : String(err) }
      });
    }
  }

  // Step 5: Test RLS policies
  console.log('🔧 Debug Step 5: Testing RLS policies...');
  try {
    // Try to access a table that should have RLS enabled
    const { data, error } = await supabase
      .from('member_profiles')
      .select('id, full_name, role')
      .limit(5);

    if (error) {
      if (error.code === 'PGRST116' || error.message.includes('row-level security')) {
        results.push({
          step: 'RLS Policies',
          status: 'error',
          message: 'Row Level Security is blocking access',
          details: {
            error_message: error.message,
            suggestion: 'Check RLS policies in Supabase Dashboard'
          }
        });
      } else {
        results.push({
          step: 'RLS Policies',
          status: 'error',
          message: 'Error testing RLS policies',
          details: { error: error.message }
        });
      }
    } else {
      results.push({
        step: 'RLS Policies',
        status: 'success',
        message: 'RLS policies allow access',
        details: { accessible_profiles: data?.length || 0 }
      });
    }
  } catch (err) {
    results.push({
      step: 'RLS Policies',
      status: 'error',
      message: 'Error testing RLS policies',
      details: { error: err instanceof Error ? err.message : String(err) }
    });
  }

  return results;
};

/**
 * Display debug results in a user-friendly format
 */
export const displayDebugResults = (results: DebugResult[]) => {
  console.log('\n🔍 SUPABASE DEBUG REPORT');
  console.log('========================');
  
  results.forEach((result, index) => {
    const icon = result.status === 'success' ? '✅' : 
                 result.status === 'warning' ? '⚠️' : '❌';
    
    console.log(`\n${index + 1}. ${icon} ${result.step}`);
    console.log(`   ${result.message}`);
    
    if (result.details) {
      console.log('   Details:', result.details);
    }
  });

  // Summary
  const errors = results.filter(r => r.status === 'error').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const successes = results.filter(r => r.status === 'success').length;

  console.log('\n📊 SUMMARY');
  console.log('==========');
  console.log(`✅ Successes: ${successes}`);
  console.log(`⚠️ Warnings: ${warnings}`);
  console.log(`❌ Errors: ${errors}`);

  if (errors > 0) {
    console.log('\n🚨 CRITICAL ISSUES TO FIX:');
    results
      .filter(r => r.status === 'error')
      .forEach(r => console.log(`   - ${r.message}`));
  }

  if (warnings > 0) {
    console.log('\n⚠️ WARNINGS TO REVIEW:');
    results
      .filter(r => r.status === 'warning')
      .forEach(r => console.log(`   - ${r.message}`));
  }
};

/**
 * Run complete debug check and display results
 */
export const runSupabaseDebug = async () => {
  console.log('🚀 Starting Supabase debug check...');
  
  try {
    const results = await debugSupabase();
    displayDebugResults(results);
    return results;
  } catch (err) {
    console.error('🚨 Debug check failed:', err);
    return [{
      step: 'Debug Check',
      status: 'error' as const,
      message: 'Failed to run debug check',
      details: { error: err instanceof Error ? err.message : String(err) }
    }];
  }
};
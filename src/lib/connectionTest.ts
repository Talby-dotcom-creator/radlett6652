import { supabase } from './supabase';

/**
 * Test Supabase connection and diagnose issues
 */
export const testSupabaseConnection = async () => {
  console.log('🔍 Testing Supabase connection...');
  
  try {
    // Test 1: Basic connection test
    console.log('Test 1: Basic connection test');
    const startTime = Date.now();
    
    const { data, error } = await supabase
      .from('member_profiles')
      .select('count', { count: 'exact', head: true });
    
    const duration = Date.now() - startTime;
    console.log(`✅ Basic connection test completed in ${duration}ms`);
    
    if (error) {
      console.error('❌ Basic connection error:', error);
      return { success: false, error: error.message, step: 'basic_connection' };
    }
    
    console.log('✅ Basic connection successful, row count:', data);
    
    // Test 2: Authentication test
    console.log('Test 2: Authentication test');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return { success: false, error: authError.message, step: 'authentication' };
    }
    
    console.log('✅ Authentication test:', user ? `Logged in as ${user.email}` : 'Not logged in');
    
    // Test 3: Specific profile query (the one that's failing)
    if (user) {
      console.log('Test 3: Profile query test');
      const profileStartTime = Date.now();
      
      const { data: profile, error: profileError } = await supabase
        .from('member_profiles')
        .select('*')
        .eq('user_id', user.id)
        .limit(1);
      
      const profileDuration = Date.now() - profileStartTime;
      console.log(`Profile query completed in ${profileDuration}ms`);
      
      if (profileError) {
        console.error('❌ Profile query error:', profileError);
        return { success: false, error: profileError.message, step: 'profile_query' };
      }
      
      console.log('✅ Profile query successful:', profile);
    }
    
    // Test 4: RLS policy test
    console.log('Test 4: RLS policy test');
    const { data: testData, error: rlsError } = await supabase
      .from('member_profiles')
      .select('id, full_name, role')
      .limit(5);
    
    if (rlsError) {
      console.error('❌ RLS test error:', rlsError);
      return { success: false, error: rlsError.message, step: 'rls_policies' };
    }
    
    console.log('✅ RLS test successful, found profiles:', testData?.length || 0);
    
    return { 
      success: true, 
      message: 'All connection tests passed',
      user,
      profileCount: data,
      profiles: testData
    };
    
  } catch (error) {
    console.error('❌ Unexpected error during connection test:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error',
      step: 'unexpected_error'
    };
  }
};

/**
 * Test with a simple timeout to see if it's a general timeout issue
 */
export const testWithTimeout = async (timeoutMs: number = 10000) => {
  console.log(`🕐 Testing connection with ${timeoutMs}ms timeout...`);
  
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error(`Test timeout after ${timeoutMs}ms`)), timeoutMs)
  );
  
  const queryPromise = supabase
    .from('member_profiles')
    .select('count', { count: 'exact', head: true });
  
  try {
    const result = await Promise.race([queryPromise, timeoutPromise]);
    console.log('✅ Query completed within timeout:', result);
    return { success: true, result };
  } catch (error) {
    console.error('❌ Query timed out or failed:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};
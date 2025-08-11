import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// === DEBUGGING: Environment Variables ===
console.log('🔧 DEBUG: Environment Variables Check:');
console.log('  VITE_SUPABASE_URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : '❌ NOT FOUND');
console.log('  VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : '❌ NOT FOUND');
console.log('  All env vars:', Object.keys(import.meta.env));

// Debug logging for environment variables
console.log('🔧 Supabase Config Check:');
console.log('  URL:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : '❌ NOT FOUND');
console.log('  Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 10)}...` : '❌ NOT FOUND');
console.log('  Environment:', import.meta.env.MODE || 'unknown');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('🚨 CRITICAL: Missing Supabase environment variables!');
  console.error('  Expected: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  console.error('  Check your .env file and ensure variables start with VITE_');
  throw new Error('Missing Supabase environment variables. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.');
}

console.log('🚀 Creating Supabase client...');
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
console.log('✅ Supabase client created successfully');

// === DEBUGGING: Test Multiple Tables ===
console.log('🧪 Testing database access...');

// Test events table
supabase.from('events').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('❌ Events table test failed:', error.message, error.code, error.details);
    } else {
      console.log('✅ Events table accessible. Count:', count);
    }
  })
  .catch(err => {
    console.error('❌ Events table network error:', err);
  });

// Test blog_posts table (news)
supabase.from('blog_posts').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('❌ Blog posts table test failed:', error.message, error.code, error.details);
    } else {
      console.log('✅ Blog posts table accessible. Count:', count);
    }
  })
  .catch(err => {
    console.error('❌ Blog posts table network error:', err);
  });

// Test officers table
supabase.from('officers').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('❌ Officers table test failed:', error.message, error.code, error.details);
    } else {
      console.log('✅ Officers table accessible. Count:', count);
    }
  })
  .catch(err => {
    console.error('❌ Officers table network error:', err);
  });

// Test testimonials table
supabase.from('testimonials').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('❌ Testimonials table test failed:', error.message, error.code, error.details);
    } else {
      console.log('✅ Testimonials table accessible. Count:', count);
    }
  })
  .catch(err => {
    console.error('❌ Testimonials table network error:', err);
  });

// Test faq_items table
supabase.from('faq_items').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('❌ FAQ items table test failed:', error.message, error.code, error.details);
    } else {
      console.log('✅ FAQ items table accessible. Count:', count);
    }
  })
  .catch(err => {
    console.error('❌ FAQ items table network error:', err);
  });

// Test the connection immediately
supabase.from('member_profiles').select('count', { count: 'exact', head: true })
  .then(({ count, error }) => {
    if (error) {
      console.error('🚨 Supabase connection test failed:', error.message, error.code, error.details);
    } else {
      console.log('✅ Supabase connection test successful. Member profiles count:', count);
    }
  })
  .catch(err => {
    console.error('🚨 Supabase connection test network error:', err);
  });
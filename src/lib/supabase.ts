import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'court-proceedings-app'
    }
  },
  db: {
    schema: 'public'
  }
});

// Add retry logic for network issues with exponential backoff
export const fetchWithRetry = async <T>(
  operation: () => Promise<T>, 
  retries = 3, 
  baseDelay = 1000,
  maxDelay = 5000
): Promise<T> => {
  let lastError: Error;
  let attempt = 0;

  while (attempt < retries) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      attempt++;

      if (attempt === retries) break;
      
      // Calculate delay with exponential backoff and jitter
      const delay = Math.min(
        baseDelay * Math.pow(2, attempt) * (0.5 + Math.random() * 0.5),
        maxDelay
      );

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
};

export default supabase;
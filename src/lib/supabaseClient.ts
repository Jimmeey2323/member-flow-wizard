import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Create client only if both env vars are present
// Otherwise, all data flows through the Express API backend
export const supabase = (url && anonKey) ? createClient(url, anonKey) : null;

export async function getAccessToken(): Promise<string | null> {
  try {
    if (!supabase) {
      console.warn('Supabase client not initialized - using API endpoints only');
      return null;
    }
    const { data } = await supabase.auth.getSession();
    return data?.session?.access_token ?? null;
  } catch (err) {
    console.error('Error getting access token:', err);
    return null;
  }
}

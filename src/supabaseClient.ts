import { createClient } from '@supabase/supabase-js';

// Access environment variables securely injected by Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URLs are missing from your .env.local file. The application will not connect to the database until they are provided.'
  );
}

// Create a single Supabase client instance for interacting with your Supabase database
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

// Type definition for our Database row
export interface SkyRecord {
  id: string;
  created_at: string;
  image_url: string;
  caption: string;
}

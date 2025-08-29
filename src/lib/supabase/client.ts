// Supabase client configuration for Family Vault Enterprise
// Handles authentication and database operations

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';

// Environment variables validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Database types for TypeScript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          master_key_hash: string;
          encrypted_user_key: string;
          yubikey_ids: string[];
          email_verified: boolean;
          two_factor_enabled: boolean;
          emergency_access_enabled: boolean;
          created_at: string;
          updated_at: string;
          last_login: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          master_key_hash: string;
          encrypted_user_key: string;
          yubikey_ids?: string[];
          email_verified?: boolean;
          two_factor_enabled?: boolean;
          emergency_access_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          master_key_hash?: string;
          encrypted_user_key?: string;
          yubikey_ids?: string[];
          email_verified?: boolean;
          two_factor_enabled?: boolean;
          emergency_access_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
          last_login?: string | null;
          is_active?: boolean;
        };
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          owner_id: string;
          encrypted_org_key: string;
          plan_type: string;
          max_members: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          owner_id: string;
          encrypted_org_key: string;
          plan_type?: string;
          max_members?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          owner_id?: string;
          encrypted_org_key?: string;
          plan_type?: string;
          max_members?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      ciphers: {
        Row: {
          id: string;
          user_id: string;
          organization_id: string | null;
          folder_id: string | null;
          type: number;
          encrypted_name: string;
          encrypted_notes: string | null;
          favorite: boolean;
          reprompt: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          organization_id?: string | null;
          folder_id?: string | null;
          type: number;
          encrypted_name: string;
          encrypted_notes?: string | null;
          favorite?: boolean;
          reprompt?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          organization_id?: string | null;
          folder_id?: string | null;
          type?: number;
          encrypted_name?: string;
          encrypted_notes?: string | null;
          favorite?: boolean;
          reprompt?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
    };
  };
};

// Typed Supabase client
export type SupabaseClient = ReturnType<typeof createClient<Database>>;

export default supabase;
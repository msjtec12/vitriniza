import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  '';

const supabaseAdminKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

export const isServerAdminConfigured = Boolean(supabaseUrl && supabaseAdminKey);

/**
 * Server-only Supabase Admin Client with elevated privileges.
 * Supports the current secret key and the legacy service_role key.
 * NEVER IMPORT THIS IN CLIENT COMPONENTS OR EXPOSE TO THE BROWSER.
 */
export const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('FATAL SECURITY ERROR: Supabase Admin Client can only be used on the server!');
  }

  if (!isServerAdminConfigured) {
    return null;
  }

  return createClient(supabaseUrl, supabaseAdminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

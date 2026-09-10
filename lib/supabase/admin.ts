import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const isServerAdminConfigured = Boolean(supabaseUrl && supabaseServiceRoleKey);

/**
 * Server-only Supabase Admin Client with full service_role privileges.
 * NEVER IMPORT THIS IN CLIENT COMPONENTS OR EXPOSE TO THE BROWSER.
 */
export const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('FATAL SECURITY ERROR: Supabase Admin Client can only be used on the server!');
  }

  if (!isServerAdminConfigured) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};

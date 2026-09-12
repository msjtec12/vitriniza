import { supabase } from '@/lib/supabase/client';

export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getSession();
  if (error) return null;

  return data.session?.access_token ?? null;
}

export async function getAuthenticatedUser() {
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;

  return data.user ?? null;
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function getActiveMembershipBusinessIds(): Promise<string[]> {
  if (!supabase) return [];

  const { data: memberships, error: membershipError } = await supabase
    .from('business_members')
    .select('business_id');
  if (membershipError || !memberships?.length) return [];

  const membershipIds = memberships.map((membership) => String(membership.business_id));
  const { data: subscriptions, error: subscriptionError } = await supabase
    .from('subscriptions')
    .select('business_id')
    .in('business_id', membershipIds)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString());
  if (subscriptionError || !subscriptions) return [];

  const activeIds = new Set(subscriptions.map((subscription) => String(subscription.business_id)));
  return membershipIds.filter((businessId) => activeIds.has(businessId));
}

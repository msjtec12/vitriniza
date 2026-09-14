import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.109.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const respond = (body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const cleanText = (value: unknown, maxLength: number) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const authorization = request.headers.get("Authorization") ?? "";
    const token = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";

    if (!supabaseUrl || !serviceRoleKey || !token) {
      return respond({ success: false, error: "Serviço de autenticação indisponível." });
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: authData, error: authError } = await admin.auth.getUser(token);
    if (authError || !authData.user) {
      return respond({ success: false, error: "Sessão inválida ou expirada." });
    }

    const { data: adminProfile, error: adminProfileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .maybeSingle();
    if (adminProfileError || adminProfile?.role !== "admin") {
      return respond({ success: false, error: "Acesso permitido somente a administradores." });
    }

    const body = await request.json();
    const email = cleanText(body.email, 254).toLowerCase();
    const name = cleanText(body.name, 120);
    const whatsapp = cleanText(body.whatsapp, 30).replace(/[^\d+]/g, "");
    const businessId = cleanText(body.businessId, 128);
    const password = cleanText(body.password, 128);
    const price = Number(body.price ?? 49.9);
    const startsAt = cleanText(body.startsAt, 40) || new Date().toISOString();
    const expiresAt =
      cleanText(body.expiresAt, 40) ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    if (!isValidEmail(email) || name.length < 2 || !businessId || password.length < 8) {
      return respond({
        success: false,
        error: "Informe nome, e-mail e uma senha com pelo menos 8 caracteres.",
      });
    }
    if (!Number.isFinite(price) || price < 0 || price > 10_000) {
      return respond({ success: false, error: "Preço inválido." });
    }
    if (
      Number.isNaN(Date.parse(startsAt)) ||
      Number.isNaN(Date.parse(expiresAt)) ||
      Date.parse(expiresAt) <= Date.parse(startsAt)
    ) {
      return respond({ success: false, error: "Período da assinatura inválido." });
    }

    const { data: business, error: businessError } = await admin
      .from("businesses")
      .select("id,name")
      .eq("id", businessId)
      .maybeSingle();
    if (businessError) throw businessError;
    if (!business) return respond({ success: false, error: "Estabelecimento não encontrado." });

    const { data: existingProfile, error: profileLookupError } = await admin
      .from("profiles")
      .select("id")
      .ilike("email", email)
      .maybeSingle();
    if (profileLookupError) throw profileLookupError;

    let userId: string | undefined;
    if (existingProfile?.id) {
      const { data: existingAuth } = await admin.auth.admin.getUserById(existingProfile.id);
      if (existingAuth.user?.email?.toLowerCase() === email) userId = existingAuth.user.id;
    }
    if (!userId) {
      const { data: authUsers, error: usersError } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1_000,
      });
      if (usersError) throw usersError;
      userId = authUsers.users.find((user) => user.email?.toLowerCase() === email)?.id;
    }

    let accountCreated = false;
    const userMetadata = { full_name: name, phone: whatsapp, business_id: businessId };
    if (!userId) {
      const { data: createData, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: userMetadata,
      });
      if (createError || !createData.user) {
        return respond({
          success: false,
          error: createError?.message || "Não foi possível criar o acesso do comerciante.",
        });
      }
      userId = createData.user.id;
      accountCreated = true;
    } else {
      const { error: passwordError } = await admin.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
        user_metadata: userMetadata,
      });
      if (passwordError) throw passwordError;
    }

    const now = new Date().toISOString();
    const { error: profileError } = await admin.from("profiles").upsert({
      id: userId,
      email,
      full_name: name,
      phone: whatsapp,
      role: "merchant",
      updated_at: now,
    });
    if (profileError) throw profileError;

    const { error: memberError } = await admin.from("business_members").upsert(
      { user_id: userId, business_id: businessId, role: "owner", created_at: now },
      { onConflict: "user_id,business_id" },
    );
    if (memberError) throw memberError;

    const { data: existingSubscription, error: subscriptionLookupError } = await admin
      .from("subscriptions")
      .select("id")
      .eq("business_id", businessId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (subscriptionLookupError) throw subscriptionLookupError;

    const subscriptionId = existingSubscription?.id || `sub_${crypto.randomUUID()}`;
    const subscriptionRecord = {
      business_id: businessId,
      plan_id: "pro",
      plan_name: "Vitriniza Pro",
      price,
      interval: "monthly",
      status: "active",
      starts_at: new Date(startsAt).toISOString(),
      expires_at: new Date(expiresAt).toISOString(),
      payment_confirmed_at: now,
      updated_at: now,
    };
    const subscriptionResult = existingSubscription
      ? await admin.from("subscriptions").update(subscriptionRecord).eq("id", subscriptionId)
      : await admin.from("subscriptions").insert({
          id: subscriptionId,
          ...subscriptionRecord,
          created_at: now,
        });
    if (subscriptionResult.error) throw subscriptionResult.error;

    const { error: updateError } = await admin
      .from("businesses")
      .update({
        listing_type: "paid",
        ownership_status: "claimed",
        owner_user_id: userId,
        plan_id: "pro",
        plan_status: "active",
        subscription_status: "active",
        is_active: true,
        updated_at: now,
      })
      .eq("id", businessId);
    if (updateError) throw updateError;

    const { error: auditError } = await admin.from("audit_logs").insert({
      id: `log_${crypto.randomUUID()}`,
      admin_user_id: authData.user.id,
      business_id: businessId,
      business_name: business.name,
      action: "business_converted_to_pro",
      metadata: { email, name, price, accountCreated, subscriptionId },
      created_at: now,
    });
    if (auditError) throw auditError;

    return respond({ success: true, userId, businessId, accountCreated });
  } catch (error) {
    console.error("[create-pro-user]", error);
    return respond({ success: false, error: "Não foi possível concluir a criação da conta Pro." });
  }
});

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      email,
      name,
      whatsapp,
      businessId,
      planId = 'pro',
      planName = 'Vitriniza Pro',
      price = 49.9,
      startsAt = new Date().toISOString(),
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      adminUserId = 'master_admin',
    } = body;

    if (!email || !businessId || !name) {
      return NextResponse.json(
        { success: false, error: 'E-mail, nome e ID do estabelecimento são obrigatórios.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();

    let userId = `user_${Date.now()}`;
    let inviteSent = false;

    if (admin) {
      // 1. Try inviting user by email or creating auth user securely via Supabase Admin
      const { data: inviteData, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          full_name: name,
          phone: whatsapp,
          business_id: businessId,
        },
      });

      if (inviteErr) {
        // If user already exists in auth, find them
        const { data: existingUsers } = await admin.auth.admin.listUsers();
        const found = existingUsers?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (found) {
          userId = found.id;
        } else {
          console.warn('[Admin Create User Warning]', inviteErr.message);
        }
      } else if (inviteData?.user) {
        userId = inviteData.user.id;
        inviteSent = true;
      }

      // 2. Upsert profile
      await admin.from('profiles').upsert({
        id: userId,
        email,
        full_name: name,
        phone: whatsapp,
        role: 'merchant',
        updated_at: new Date().toISOString(),
      });

      // 3. Upsert business_member
      await admin.from('business_members').upsert(
        {
          user_id: userId,
          business_id: businessId,
          role: 'owner',
          created_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,business_id' }
      );

      // 4. Upsert Subscription
      const subId = `sub_${Date.now()}`;
      await admin.from('subscriptions').upsert({
        id: subId,
        business_id: businessId,
        plan_id: planId,
        plan_name: planName,
        price,
        interval: 'monthly',
        status: 'active',
        starts_at: startsAt,
        expires_at: expiresAt,
        payment_confirmed_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      // 5. Update Business status
      await admin
        .from('businesses')
        .update({
          listing_type: 'paid',
          ownership_status: 'claimed',
          owner_user_id: userId,
          plan_id: 'pro',
          plan_status: 'active',
          subscription_status: 'active',
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', businessId);

      // 6. Log Audit
      await admin.from('audit_logs').insert({
        id: `log_${Date.now()}`,
        admin_user_id: adminUserId,
        business_id: businessId,
        action: 'business_converted_to_pro',
        metadata: { email, name, planId, price, inviteSent },
        created_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      userId,
      businessId,
      inviteSent,
      message: 'Conta Vitriniza Pro criada e vinculada com sucesso!',
    });
  } catch (err: any) {
    console.error('[API Create Pro User Error]', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Erro interno ao criar conta Pro.' },
      { status: 500 }
    );
  }
}

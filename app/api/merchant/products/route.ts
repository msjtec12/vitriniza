import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit.mjs';

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function cleanPrice(value: unknown): number | null {
  if (typeof value === 'number' && !Number.isNaN(value) && value >= 0) return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!Number.isNaN(parsed) && parsed >= 0) return parsed;
  }
  return null;
}

async function verifyMerchantPermission(
  admin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  businessId: string
): Promise<boolean> {
  if (!admin) return false;

  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .maybeSingle();

  if (profile?.role === 'admin') return true;

  const { data: membership } = await admin
    .from('business_members')
    .select('business_id')
    .eq('user_id', userId)
    .eq('business_id', businessId)
    .maybeSingle();

  return Boolean(membership);
}

// POST: Add new product
export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const ip = getRequestIp(req.headers);
  if (!checkRateLimit(`merchant-product-post:${auth.user.id}:${ip}`, 40, 60_000)) {
    return NextResponse.json({ success: false, error: 'Muitas operações em sequência.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const businessId = cleanText(body.businessId, 128);
    const productData = body.product || {};

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Estabelecimento inválido.' }, { status: 400 });
    }

    const name = cleanText(productData.name, 150);
    const price = cleanPrice(productData.price);

    if (!name || price === null) {
      return NextResponse.json({ success: false, error: 'Nome e preço válido são obrigatórios.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Servidor indisponível.' }, { status: 503 });
    }

    const canManage = await verifyMerchantPermission(admin, auth.user.id, businessId);
    if (!canManage) {
      return NextResponse.json({ success: false, error: 'Permissão negada para este estabelecimento.' }, { status: 403 });
    }

    const newProduct = {
      id: `prod_${crypto.randomUUID()}`,
      business_id: businessId,
      name,
      description: cleanText(productData.description, 2000),
      price,
      promo_price: cleanPrice(productData.promo_price),
      category: cleanText(productData.category, 80) || 'Geral',
      image_url: cleanText(productData.image_url, 1000) || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
      is_available: productData.is_available !== false,
      order_index: typeof productData.order_index === 'number' ? productData.order_index : 0,
      created_at: new Date().toISOString(),
    };

    const { data: inserted, error: insertError } = await admin
      .from('products')
      .insert(newProduct)
      .select()
      .single();

    if (insertError) throw insertError;

    return NextResponse.json({ success: true, product: inserted || newProduct });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao criar item';
    console.error('[API Merchant Product Add Error]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// PATCH: Edit existing product
export async function PATCH(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const ip = getRequestIp(req.headers);
  if (!checkRateLimit(`merchant-product-patch:${auth.user.id}:${ip}`, 40, 60_000)) {
    return NextResponse.json({ success: false, error: 'Muitas operações em sequência.' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const businessId = cleanText(body.businessId, 128);
    const productId = cleanText(body.productId, 128);
    const updates = body.updates || {};

    if (!businessId || !productId) {
      return NextResponse.json({ success: false, error: 'Parâmetros incompletos.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Servidor indisponível.' }, { status: 503 });
    }

    const canManage = await verifyMerchantPermission(admin, auth.user.id, businessId);
    if (!canManage) {
      return NextResponse.json({ success: false, error: 'Permissão negada para este estabelecimento.' }, { status: 403 });
    }

    const updatePayload: Record<string, unknown> = {};

    if ('name' in updates) {
      const name = cleanText(updates.name, 150);
      if (!name) return NextResponse.json({ success: false, error: 'Nome do item não pode ser vazio.' }, { status: 400 });
      updatePayload.name = name;
    }

    if ('description' in updates) {
      updatePayload.description = cleanText(updates.description, 2000);
    }

    if ('price' in updates) {
      const price = cleanPrice(updates.price);
      if (price === null) return NextResponse.json({ success: false, error: 'Preço inválido.' }, { status: 400 });
      updatePayload.price = price;
    }

    if ('promo_price' in updates) {
      updatePayload.promo_price = updates.promo_price ? cleanPrice(updates.promo_price) : null;
    }

    if ('category' in updates) {
      updatePayload.category = cleanText(updates.category, 80) || 'Geral';
    }

    if ('image_url' in updates) {
      const img = cleanText(updates.image_url, 1000);
      if (img) updatePayload.image_url = img;
    }

    if ('is_available' in updates) {
      updatePayload.is_available = Boolean(updates.is_available);
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({ success: false, error: 'Nenhuma alteração informada.' }, { status: 400 });
    }

    const { data: updated, error: updateError } = await admin
      .from('products')
      .update(updatePayload)
      .eq('id', productId)
      .eq('business_id', businessId)
      .select()
      .maybeSingle();

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, product: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao atualizar item';
    console.error('[API Merchant Product Update Error]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

// DELETE: Remove product
export async function DELETE(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const businessId = cleanText(body.businessId, 128);
    const productId = cleanText(body.productId, 128);

    if (!businessId || !productId) {
      return NextResponse.json({ success: false, error: 'Parâmetros incompletos.' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Servidor indisponível.' }, { status: 503 });
    }

    const canManage = await verifyMerchantPermission(admin, auth.user.id, businessId);
    if (!canManage) {
      return NextResponse.json({ success: false, error: 'Permissão negada.' }, { status: 403 });
    }

    const { error: deleteError } = await admin
      .from('products')
      .delete()
      .eq('id', productId)
      .eq('business_id', businessId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Erro ao remover item';
    console.error('[API Merchant Product Delete Error]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { requireAuthenticatedUser } from '@/lib/auth/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { checkRateLimit, getRequestIp } from '@/lib/security/rate-limit.mjs';

const IMAGE_EXTENSIONS_BY_MIME_TYPE: Readonly<Record<string, string>> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const MAX_FILE_SIZE = 8 * 1024 * 1024; // Alinhado ao limite do bucket business-media

export async function POST(req: NextRequest) {
  const auth = await requireAuthenticatedUser(req);
  if (!auth.ok) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status });
  }

  const ip = getRequestIp(req.headers);
  if (!checkRateLimit(`merchant-upload:${auth.user.id}:${ip}`, 60, 60_000)) {
    return NextResponse.json({ success: false, error: 'Muitos uploads em sequência. Aguarde um instante.' }, { status: 429 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const businessId = (formData.get('businessId') as string)?.trim().slice(0, 128);
    const folder = (formData.get('folder') as string)?.trim().slice(0, 32) || 'logos';

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'Arquivo de imagem não fornecido.' }, { status: 400 });
    }

    if (!businessId) {
      return NextResponse.json({ success: false, error: 'Identificador do estabelecimento ausente.' }, { status: 400 });
    }

    const fileExt = IMAGE_EXTENSIONS_BY_MIME_TYPE[file.type];
    if (!fileExt) {
      return NextResponse.json(
        { success: false, error: 'Formato de imagem não suportado. Utilize JPEG, PNG ou WebP.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'O tamanho do arquivo não pode ultrapassar 8MB.' },
        { status: 400 }
      );
    }

    const admin = getSupabaseAdmin();
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Serviço de armazenamento indisponível.' }, { status: 503 });
    }

    // Verificar se o usuário é admin
    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', auth.user.id)
      .maybeSingle();
    const isAdmin = profile?.role === 'admin';

    // Verificar se é membro do estabelecimento
    const { data: membership } = await admin
      .from('business_members')
      .select('business_id')
      .eq('user_id', auth.user.id)
      .eq('business_id', businessId)
      .maybeSingle();

    // Verificar se é dono direto do estabelecimento
    const { data: business } = await admin
      .from('businesses')
      .select('id, owner_user_id')
      .eq('id', businessId)
      .maybeSingle();

    const isOwner = business?.owner_user_id === auth.user.id;

    if (!isAdmin && !membership && !isOwner) {
      return NextResponse.json({ success: false, error: 'Permissão negada para este estabelecimento.' }, { status: 403 });
    }

    const sanitizedFolder = ['logos', 'covers', 'products', 'promotions', 'places'].includes(folder) ? folder : 'misc';
    const filePath = `${businessId}/${sanitizedFolder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${fileExt}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Assegurar que o bucket business-media existe
    try {
      const { data: buckets } = await admin.storage.listBuckets();
      if (!buckets?.some((b) => b.name === 'business-media')) {
        await admin.storage.createBucket('business-media', { public: true });
      }
    } catch (bucketErr) {
      console.warn('[Storage Bucket Check Warning]', bucketErr);
    }

    const { error: uploadError } = await admin.storage
      .from('business-media')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('[Storage Upload Error]', uploadError);
      throw new Error(uploadError.message || 'Falha ao salvar no armazenamento.');
    }

    const { data: urlData } = admin.storage.from('business-media').getPublicUrl(filePath);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Falha inesperada no upload';
    console.error('[Merchant Upload Route Error]', message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

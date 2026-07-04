import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.99.1';

// Upload do avatar via service_role (ignora RLS do Storage, que se mostrou
// instável a partir do cliente React Native). O usuário é identificado pelo
// próprio token — cada um só grava na pasta {uid}/.
//
// Como a função usa service_role e o bucket é público, a validação aqui é a
// única barreira: só aceita imagem real (magic bytes) de tipo permitido e
// até MAX_IMAGE_BYTES.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// 2 MB de imagem já decodificada — o app envia quality 0.5 recortada em
// quadrado, então avatares legítimos ficam bem abaixo disso.
const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
// base64 expande ~4/3; margem para rejeitar cedo, antes de decodificar.
const MAX_BASE64_LENGTH = Math.ceil(MAX_IMAGE_BYTES * 4 / 3) + 4;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Confere a assinatura binária: impede gravar HTML/SVG/etc. com contentType
// de imagem num bucket público (vetor de XSS/phishing).
function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return null;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return json({ error: 'Não autenticado' }, 401);
  const token = authHeader.replace('Bearer ', '');

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: { user }, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !user) return json({ error: 'Sessão inválida' }, 401);
  const uid = user.id;

  let body: { image?: string; contentType?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Corpo inválido' }, 400);
  }
  if (!body.image) return json({ error: 'Imagem ausente' }, 400);
  if (body.image.length > MAX_BASE64_LENGTH) {
    return json({ error: 'Imagem muito grande (máximo 2 MB).' }, 413);
  }

  const declaredType = body.contentType || 'image/jpeg';
  if (!ALLOWED_TYPES.includes(declaredType)) {
    return json({ error: 'Formato não suportado. Use JPEG, PNG ou WebP.' }, 415);
  }

  // base64 -> bytes
  let bytes: Uint8Array;
  try {
    const binary = atob(body.image);
    bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  } catch {
    return json({ error: 'Imagem inválida' }, 400);
  }
  if (bytes.length > MAX_IMAGE_BYTES) {
    return json({ error: 'Imagem muito grande (máximo 2 MB).' }, 413);
  }

  // O conteúdo real manda: o contentType declarado é ignorado se divergir.
  const sniffedType = sniffImageType(bytes);
  if (!sniffedType) {
    return json({ error: 'O arquivo enviado não é uma imagem válida.' }, 415);
  }

  const path = `${uid}/avatar.jpg`;

  const { error: upErr } = await admin.storage
    .from('avatars')
    .upload(path, bytes, { contentType: sniffedType, upsert: true });
  if (upErr) return json({ error: upErr.message }, 500);

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path);
  const url = `${publicUrl}?v=${Date.now()}`;

  const { error: updErr } = await admin
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', uid);
  if (updErr) return json({ error: updErr.message }, 500);

  return json({ url });
});

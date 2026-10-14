-- Bucket avatars passa a ser PRIVADO. A foto só é exibida para a própria
-- pessoa (não há área social), então o acesso público por URL não tinha uso e
-- expunha o vínculo rosto ↔ uso de um app de saúde mental. O app agora exibe a
-- foto via URL assinada (createSignedUrl), com validade limitada.

UPDATE storage.buckets
SET public = false,
    file_size_limit = 2097152, -- 2 MB, igual à validação da Edge Function upload-avatar
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
WHERE id = 'avatars';

-- Leitura (necessária para assinar a URL) só na própria pasta {uid}/.
DROP POLICY IF EXISTS "Avatares: leitura na própria pasta" ON storage.objects;
CREATE POLICY "Avatares: leitura na própria pasta" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (auth.uid())::text);

-- profiles.avatar_url passa a guardar o CAMINHO do objeto ({uid}/avatar.jpg),
-- não mais a URL pública. Converte as linhas existentes.
UPDATE public.profiles
SET avatar_url = id::text || '/avatar.jpg'
WHERE avatar_url IS NOT NULL;

COMMENT ON COLUMN public.profiles.avatar_url IS
  'Caminho do objeto no bucket privado avatars ({uid}/avatar.jpg). O app gera URL assinada para exibir.';

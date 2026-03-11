CREATE TABLE configuracao_pdf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  empresa_nome TEXT NOT NULL DEFAULT 'EdTech Brasil',
  proposta_titulo TEXT NOT NULL DEFAULT 'PROPOSTA COMERCIAL',
  proposta_subtitulo TEXT NOT NULL DEFAULT 'Solução em Tecnologia Educacional',
  logo_url TEXT,
  rodape_condicoes TEXT DEFAULT 'Proposta válida até a data indicada. Valores sujeitos a revisão após o prazo. Impostos não incluídos.',
  css_customizado TEXT,
  criado_por_usuario_id UUID NOT NULL REFERENCES usuarios(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_config_pdf_ativa ON configuracao_pdf (ativo) WHERE ativo = TRUE;

ALTER TABLE configuracao_pdf ENABLE ROW LEVEL SECURITY;
CREATE POLICY "todos_leem_config_pdf" ON configuracao_pdf FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "adm_gerencia_config_pdf" ON configuracao_pdf FOR ALL USING (get_perfil_atual() = 'ADM');

-- Bucket para logos (público)
INSERT INTO storage.buckets (id, name, public) VALUES ('pdf-assets', 'pdf-assets', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "todos_leem_pdf_assets" ON storage.objects FOR SELECT USING (bucket_id = 'pdf-assets');
CREATE POLICY "adm_upload_pdf_assets" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'pdf-assets' AND get_perfil_atual() = 'ADM'
);
CREATE POLICY "adm_delete_pdf_assets" ON storage.objects FOR DELETE USING (
  bucket_id = 'pdf-assets' AND get_perfil_atual() = 'ADM'
);

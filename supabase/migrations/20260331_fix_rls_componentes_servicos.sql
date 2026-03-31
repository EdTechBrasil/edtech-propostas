-- Permite editar componentes e serviços mesmo quando proposta está com status 'Pronta_pdf'
-- Mantém bloqueio apenas para propostas 'Canceladas'

DROP POLICY IF EXISTS "editar_proposta_componentes" ON proposta_componentes;
CREATE POLICY "editar_proposta_componentes" ON proposta_componentes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM propostas p
      WHERE p.id = proposta_id
      AND (p.criado_por_usuario_id = auth.uid() OR get_perfil_atual() IN ('Gestor', 'ADM'))
      AND p.status NOT IN ('Cancelada')
    )
  );

DROP POLICY IF EXISTS "editar_proposta_servicos" ON proposta_servicos;
CREATE POLICY "editar_proposta_servicos" ON proposta_servicos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM propostas p
      WHERE p.id = proposta_id
      AND (p.criado_por_usuario_id = auth.uid() OR get_perfil_atual() IN ('Gestor', 'ADM'))
      AND p.status NOT IN ('Cancelada')
    )
  );

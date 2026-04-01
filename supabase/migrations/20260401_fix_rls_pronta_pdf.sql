-- Remove 'Pronta_pdf' de todas as políticas de edição
-- Mantém bloqueio apenas para propostas 'Canceladas'

-- proposta_produtos
DROP POLICY IF EXISTS "editar_proposta_produtos" ON proposta_produtos;
CREATE POLICY "editar_proposta_produtos" ON proposta_produtos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM propostas p
      WHERE p.id = proposta_id
      AND (p.criado_por_usuario_id = auth.uid() OR get_perfil_atual() IN ('Gestor', 'ADM'))
      AND p.status NOT IN ('Cancelada')
    )
  );

-- propostas (dono pode editar enquanto não estiver cancelada)
DROP POLICY IF EXISTS "dono_edita_proposta" ON propostas;
CREATE POLICY "dono_edita_proposta" ON propostas
  FOR UPDATE USING (
    criado_por_usuario_id = auth.uid()
    AND status NOT IN ('Cancelada')
  );

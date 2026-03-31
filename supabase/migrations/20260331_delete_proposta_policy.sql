-- Permite que o dono ou Gestor/ADM deletem uma proposta
CREATE POLICY "dono_ou_gestor_deleta_proposta" ON propostas
  FOR DELETE USING (
    criado_por_usuario_id = auth.uid()
    OR get_perfil_atual() IN ('Gestor', 'ADM')
  );

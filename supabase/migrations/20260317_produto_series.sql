-- Mapeamento produto × séries atendidas
CREATE TABLE IF NOT EXISTS produto_series (
  produto_id uuid REFERENCES produtos(id) ON DELETE CASCADE,
  serie      text NOT NULL,
  PRIMARY KEY (produto_id, serie)
);

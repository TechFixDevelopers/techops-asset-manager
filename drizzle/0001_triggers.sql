-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER tr_colaboradores_updated BEFORE UPDATE ON colaboradores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_equipos_updated BEFORE UPDATE ON equipos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_celulares_updated BEFORE UPDATE ON celulares FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_lineas_updated BEFORE UPDATE ON lineas FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_monitores_updated BEFORE UPDATE ON monitores FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_insumos_updated BEFORE UPDATE ON insumos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_app_users_updated BEFORE UPDATE ON app_users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER tr_tickets_snow_updated BEFORE UPDATE ON tickets_snow FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Full-text search index for colaboradores.nombre (Spanish)
CREATE INDEX idx_colaboradores_nombre_fts ON colaboradores USING gin(to_tsvector('spanish', nombre));

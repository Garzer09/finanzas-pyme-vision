
-- RLS: permitir a miembros de la empresa gestionar sus supuestos normalizados
-- Tabla: public.financial_assumptions_normalized

-- Política INSERT para miembros con acceso a la empresa
CREATE POLICY "Members can insert financial assumptions"
  ON public.financial_assumptions_normalized
  FOR INSERT
  TO authenticated
  WITH CHECK (has_company_access(auth.uid(), company_id));

-- Política UPDATE para miembros con acceso a la empresa
CREATE POLICY "Members can update financial assumptions"
  ON public.financial_assumptions_normalized
  FOR UPDATE
  TO authenticated
  USING (has_company_access(auth.uid(), company_id))
  WITH CHECK (has_company_access(auth.uid(), company_id));

-- Política DELETE para miembros con acceso a la empresa (opcional, útil para correcciones)
CREATE POLICY "Members can delete financial assumptions"
  ON public.financial_assumptions_normalized
  FOR DELETE
  TO authenticated
  USING (has_company_access(auth.uid(), company_id));

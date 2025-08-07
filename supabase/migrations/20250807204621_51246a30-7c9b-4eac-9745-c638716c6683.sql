-- Fix: recreate policies without IF NOT EXISTS

-- financial_lines_staging policies
drop policy if exists "Admins manage financial_lines_staging" on public.financial_lines_staging;
drop policy if exists "Members insert own staging" on public.financial_lines_staging;
drop policy if exists "Members view own company staging" on public.financial_lines_staging;

create policy "Admins manage financial_lines_staging"
  on public.financial_lines_staging
  as permissive
  for all
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));

create policy "Members insert own staging"
  on public.financial_lines_staging
  as permissive
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and public.has_company_access(auth.uid(), company_id)
  );

create policy "Members view own company staging"
  on public.financial_lines_staging
  as permissive
  for select
  to authenticated
  using (
    public.has_company_access(auth.uid(), company_id)
  );

-- data_versions policies
drop policy if exists "Admins view data_versions" on public.data_versions;
drop policy if exists "Members view own company versions" on public.data_versions;

create policy "Admins view data_versions"
  on public.data_versions
  for select
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

create policy "Members view own company versions"
  on public.data_versions
  for select
  to authenticated
  using (public.has_company_access(auth.uid(), company_id));

-- import_audit policies
drop policy if exists "Admins view import_audit" on public.import_audit;
drop policy if exists "Members view own company audit" on public.import_audit;

create policy "Admins view import_audit"
  on public.import_audit
  for select
  to authenticated
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()));

create policy "Members view own company audit"
  on public.import_audit
  for select
  to authenticated
  using (public.has_company_access(auth.uid(), company_id));
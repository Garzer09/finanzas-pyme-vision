-- Full pipeline setup (re-run with correct policy syntax order)
create extension if not exists pgcrypto;

-- STAGING TABLE
create table if not exists public.financial_lines_staging (
  id bigserial primary key,
  job_id uuid not null,
  company_id uuid not null,
  user_id uuid not null,
  data_type text not null,
  period_type text not null,
  period_year integer not null,
  period_quarter integer,
  period_month integer,
  concept_original text not null,
  concept_normalized text not null,
  section text,
  amount numeric not null default 0,
  currency_code text not null default 'EUR',
  sheet_name text,
  file_name text,
  source text default 'upload',
  status text not null default 'pending',
  error jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_fls_job on public.financial_lines_staging(job_id);
create index if not exists idx_fls_company on public.financial_lines_staging(company_id);
create index if not exists idx_fls_datatype on public.financial_lines_staging(data_type);
create index if not exists idx_fls_year on public.financial_lines_staging(period_year);
create index if not exists idx_fls_concept on public.financial_lines_staging(concept_normalized);

alter table public.financial_lines_staging enable row level security;

-- DROP any previous policies before creating new ones
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='financial_lines_staging' AND policyname='Admins manage financial_lines_staging'
  ) THEN
    EXECUTE 'drop policy "Admins manage financial_lines_staging" on public.financial_lines_staging';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='financial_lines_staging' AND policyname='Members insert own staging'
  ) THEN
    EXECUTE 'drop policy "Members insert own staging" on public.financial_lines_staging';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='financial_lines_staging' AND policyname='Members view own company staging'
  ) THEN
    EXECUTE 'drop policy "Members view own company staging" on public.financial_lines_staging';
  END IF;
END $$;

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

-- NORMALIZE function
create or replace function public.normalize_spanish_text(txt text)
returns text
language sql
immutable
as $$
  select lower(
    regexp_replace(
      translate(coalesce(txt,'')::text,
        'ÁÉÍÓÚÜÑáéíóúüñ',
        'AEIOUUNaeiouun'
      ),
      '\n|\r|\t', ' ', 'g'
    )
  );
$$;

-- UNIQUE INDEXES for core tables
create unique index if not exists fs_pyg_lines_uniq
  on public.fs_pyg_lines(company_id, period_type, period_year, coalesce(period_quarter,0), coalesce(period_month,0), concept);

create unique index if not exists fs_balance_lines_uniq
  on public.fs_balance_lines(company_id, period_type, period_year, coalesce(period_quarter,0), coalesce(period_month,0), section, concept);

create unique index if not exists fs_cashflow_lines_uniq
  on public.fs_cashflow_lines(company_id, period_type, period_year, coalesce(period_quarter,0), coalesce(period_month,0), concept);

-- AUDIT TABLES
create table if not exists public.data_versions (
  id bigserial primary key,
  table_name text not null,
  company_id uuid not null,
  data_type text,
  period_type text,
  period_year integer,
  period_quarter integer,
  period_month integer,
  section text,
  concept text,
  old_amount numeric,
  new_amount numeric,
  job_id uuid,
  user_id uuid,
  changed_at timestamptz not null default now()
);

alter table public.data_versions enable row level security;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='data_versions' AND policyname='Admins view data_versions'
  ) THEN
    EXECUTE 'drop policy "Admins view data_versions" on public.data_versions';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='data_versions' AND policyname='Members view own company versions'
  ) THEN
    EXECUTE 'drop policy "Members view own company versions" on public.data_versions';
  END IF;
END $$;

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

create table if not exists public.import_audit (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null,
  company_id uuid not null,
  data_type text not null,
  rows_staged integer not null default 0,
  rows_upserted integer not null default 0,
  rows_errors integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.import_audit enable row level security;

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='import_audit' AND policyname='Admins view import_audit'
  ) THEN
    EXECUTE 'drop policy "Admins view import_audit" on public.import_audit';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='import_audit' AND policyname='Members view own company audit'
  ) THEN
    EXECUTE 'drop policy "Members view own company audit" on public.import_audit';
  END IF;
END $$;

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

-- VERSIONING TRIGGER
create or replace function public.log_financial_version()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.data_versions(
    table_name, company_id, data_type,
    period_type, period_year, period_quarter, period_month,
    section, concept,
    old_amount, new_amount,
    job_id, user_id
  ) values (
    TG_TABLE_NAME,
    coalesce(new.company_id, old.company_id),
    case TG_TABLE_NAME when 'fs_pyg_lines' then 'estado_pyg' when 'fs_balance_lines' then 'balance_situacion' when 'fs_cashflow_lines' then 'estado_flujos' else null end,
    coalesce(new.period_type, old.period_type),
    coalesce(new.period_year, old.period_year),
    coalesce(new.period_quarter, old.period_quarter),
    coalesce(new.period_month, old.period_month),
    coalesce(new.section, old.section),
    coalesce(new.concept, old.concept),
    old.amount,
    new.amount,
    coalesce(new.job_id, old.job_id),
    coalesce(new.uploaded_by, old.uploaded_by)
  );
  return new;
end;
$$;

drop trigger if exists trg_version_fs_pyg on public.fs_pyg_lines;
drop trigger if exists trg_version_fs_balance on public.fs_balance_lines;
drop trigger if exists trg_version_fs_cashflow on public.fs_cashflow_lines;

create trigger trg_version_fs_pyg
after insert or update on public.fs_pyg_lines
for each row execute function public.log_financial_version();

create trigger trg_version_fs_balance
after insert or update on public.fs_balance_lines
for each row execute function public.log_financial_version();

create trigger trg_version_fs_cashflow
after insert or update on public.fs_cashflow_lines
for each row execute function public.log_financial_version();

-- PROCESSOR FUNCTION
create or replace function public.process_financial_staging(p_job uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
DECLARE
  v_rows_staged int := 0;
  v_rows_upserted int := 0;
  v_rows_errors int := 0;
BEGIN
  select count(*) into v_rows_staged from public.financial_lines_staging where job_id = p_job;

  -- PYG
  with s as (
    select * from public.financial_lines_staging where job_id = p_job and data_type = 'estado_pyg'
  ), ins as (
    insert into public.fs_pyg_lines(
      company_id, period_date, period_year, period_quarter, period_month,
      amount, uploaded_by, job_id, created_at, period_type, concept, currency_code
    )
    select
      s.company_id,
      coalesce((make_date(s.period_year, coalesce(s.period_month,12), 1) + interval '1 month' - interval '1 day')::date,
               to_date(s.period_year::text || '-12-31','YYYY-MM-DD')),
      s.period_year, s.period_quarter, s.period_month,
      s.amount, s.user_id, s.job_id, now(), s.period_type,
      s.concept_normalized, s.currency_code
    from s
    on conflict (company_id, period_type, period_year, coalesce(period_quarter,0), coalesce(period_month,0), concept)
    do update set amount = excluded.amount,
                  uploaded_by = excluded.uploaded_by,
                  job_id = excluded.job_id,
                  currency_code = excluded.currency_code,
                  created_at = now()
    returning 1
  ) select count(*) into v_rows_upserted from ins;

  -- BALANCE
  with s as (
    select * from public.financial_lines_staging where job_id = p_job and data_type = 'balance_situacion'
  ), ins as (
    insert into public.fs_balance_lines(
      company_id, period_date, period_year, period_quarter, period_month,
      amount, uploaded_by, job_id, created_at, period_type, section, concept, currency_code
    )
    select
      s.company_id,
      coalesce((make_date(s.period_year, coalesce(s.period_month,12), 1) + interval '1 month' - interval '1 day')::date,
               to_date(s.period_year::text || '-12-31','YYYY-MM-DD')),
      s.period_year, s.period_quarter, s.period_month,
      s.amount, s.user_id, s.job_id, now(), s.period_type,
      coalesce(s.section,'Total'), s.concept_normalized, s.currency_code
    from s
    on conflict (company_id, period_type, period_year, coalesce(period_quarter,0), coalesce(period_month,0), section, concept)
    do update set amount = excluded.amount,
                  uploaded_by = excluded.uploaded_by,
                  job_id = excluded.job_id,
                  currency_code = excluded.currency_code,
                  created_at = now()
    returning 1
  ) select v_rows_upserted + count(*) into v_rows_upserted from ins;

  -- CASHFLOW
  with s as (
    select * from public.financial_lines_staging where job_id = p_job and data_type = 'estado_flujos'
  ), ins as (
    insert into public.fs_cashflow_lines(
      company_id, period_date, period_year, period_quarter, period_month,
      amount, uploaded_by, job_id, created_at, period_type, concept, currency_code
    )
    select
      s.company_id,
      coalesce((make_date(s.period_year, coalesce(s.period_month,12), 1) + interval '1 month' - interval '1 day')::date,
               to_date(s.period_year::text || '-12-31','YYYY-MM-DD')),
      s.period_year, s.period_quarter, s.period_month,
      s.amount, s.user_id, s.job_id, now(), s.period_type,
      s.concept_normalized, s.currency_code
    from s
    on conflict (company_id, period_type, period_year, coalesce(period_quarter,0), coalesce(period_month,0), concept)
    do update set amount = excluded.amount,
                  uploaded_by = excluded.uploaded_by,
                  job_id = excluded.job_id,
                  currency_code = excluded.currency_code,
                  created_at = now()
    returning 1
  ) select v_rows_upserted + count(*) into v_rows_upserted from ins;

  update public.financial_lines_staging set status='processed', error='{}'::jsonb where job_id = p_job;

  insert into public.import_audit(job_id, company_id, data_type, rows_staged, rows_upserted, rows_errors)
  select p_job, s.company_id, s.data_type,
         (select count(*) from public.financial_lines_staging where job_id = p_job and data_type = s.data_type),
         v_rows_upserted,
         v_rows_errors
  from (select distinct company_id, data_type from public.financial_lines_staging where job_id = p_job) s;

  return jsonb_build_object('job_id', p_job,
                            'rows_staged', v_rows_staged,
                            'rows_upserted', v_rows_upserted,
                            'rows_errors', v_rows_errors,
                            'status','success');
EXCEPTION WHEN OTHERS THEN
  update public.financial_lines_staging set status='error', error = jsonb_build_object('message', SQLERRM) where job_id = p_job;
  return jsonb_build_object('job_id', p_job, 'status','error', 'error', SQLERRM);
END;
$$;

revoke all on function public.process_financial_staging(uuid) from public;
grant execute on function public.process_financial_staging(uuid) to authenticated;
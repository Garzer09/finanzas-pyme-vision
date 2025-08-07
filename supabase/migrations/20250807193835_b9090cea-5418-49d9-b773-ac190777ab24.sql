begin;

-- Ensure fs_cashflow_lines exists with required columns
create table if not exists public.fs_cashflow_lines (
  id bigserial primary key,
  company_id uuid not null,
  period_date date not null,
  period_year integer not null,
  period_quarter integer,
  period_month integer,
  amount numeric not null default 0,
  uploaded_by uuid,
  job_id uuid,
  created_at timestamptz not null default now(),
  period_type text not null,
  category text not null,
  concept text not null,
  currency_code text not null default 'EUR'
);

-- Add missing columns defensively (in case table existed with partial schema)
alter table public.fs_cashflow_lines
  add column if not exists company_id uuid,
  add column if not exists period_date date,
  add column if not exists period_year integer,
  add column if not exists period_quarter integer,
  add column if not exists period_month integer,
  add column if not exists amount numeric default 0,
  add column if not exists uploaded_by uuid,
  add column if not exists job_id uuid,
  add column if not exists created_at timestamptz default now(),
  add column if not exists period_type text,
  add column if not exists category text,
  add column if not exists concept text,
  add column if not exists currency_code text default 'EUR';

create index if not exists idx_fs_cashflow_company on public.fs_cashflow_lines(company_id);
create index if not exists idx_fs_cashflow_company_year on public.fs_cashflow_lines(company_id, period_year);

alter table public.fs_cashflow_lines enable row level security;

do $$ begin
  create policy "Admin can manage Cashflow data"
  on public.fs_cashflow_lines for all
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Members can view fs_cashflow_lines"
  on public.fs_cashflow_lines for select
  using (public.has_company_access(auth.uid(), company_id));
exception when duplicate_object then null; end $$;

-- Ensure debt_loans exists
create table if not exists public.debt_loans (
  id bigserial primary key,
  company_id uuid not null,
  entity text,
  loan_type text,
  initial_principal numeric,
  current_balance numeric,
  interest_rate numeric,
  rate_type text default 'fixed',
  frequency text default 'monthly',
  start_date date,
  end_date date,
  guarantees text,
  created_at timestamptz not null default now()
);

-- Add missing columns defensively
alter table public.debt_loans
  add column if not exists company_id uuid,
  add column if not exists entity text,
  add column if not exists loan_type text,
  add column if not exists initial_principal numeric,
  add column if not exists current_balance numeric,
  add column if not exists interest_rate numeric,
  add column if not exists rate_type text default 'fixed',
  add column if not exists frequency text default 'monthly',
  add column if not exists start_date date,
  add column if not exists end_date date,
  add column if not exists guarantees text,
  add column if not exists created_at timestamptz default now();

create index if not exists idx_debt_loans_company on public.debt_loans(company_id);

alter table public.debt_loans enable row level security;

do $$ begin
  create policy "Admin can manage debt_loans"
  on public.debt_loans for all
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Members can view debt_loans"
  on public.debt_loans for select
  using (public.has_company_access(auth.uid(), company_id));
exception when duplicate_object then null; end $$;

-- Ensure debt_maturities exists
create table if not exists public.debt_maturities (
  id bigserial primary key,
  company_id uuid not null,
  loan_id bigint not null,
  due_date date not null,
  amount_principal numeric not null default 0,
  amount_interest numeric not null default 0,
  created_at timestamptz not null default now()
);

-- Add missing columns defensively
alter table public.debt_maturities
  add column if not exists company_id uuid,
  add column if not exists loan_id bigint,
  add column if not exists due_date date,
  add column if not exists amount_principal numeric default 0,
  add column if not exists amount_interest numeric default 0,
  add column if not exists created_at timestamptz default now();

-- Ensure foreign key constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_schema = 'public' 
      AND table_name = 'debt_maturities' 
      AND constraint_name = 'debt_maturities_loan_id_fkey'
  ) THEN
    ALTER TABLE public.debt_maturities
      ADD CONSTRAINT debt_maturities_loan_id_fkey FOREIGN KEY (loan_id)
      REFERENCES public.debt_loans(id) ON DELETE CASCADE;
  END IF;
END $$;

create index if not exists idx_debt_maturities_company on public.debt_maturities(company_id);
create index if not exists idx_debt_maturities_loan on public.debt_maturities(loan_id);
create index if not exists idx_debt_maturities_due on public.debt_maturities(due_date);

alter table public.debt_maturities enable row level security;

do $$ begin
  create policy "Admin can manage debt_maturities"
  on public.debt_maturities for all
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "Members can view debt_maturities"
  on public.debt_maturities for select
  using (public.has_company_access(auth.uid(), company_id));
exception when duplicate_object then null; end $$;

commit;
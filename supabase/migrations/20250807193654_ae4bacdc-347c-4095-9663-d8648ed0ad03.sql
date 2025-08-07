-- Create missing core tables for cash flow and debt, with RLS aligned to existing access control
begin;

-- 1) Cash Flow Lines table (if not exists)
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
  category text not null, -- OPERATIVO | INVERSION | FINANCIACION
  concept text not null,
  currency_code text not null default 'EUR'
);

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

-- 2) Debt core tables (loans and maturities)
create table if not exists public.debt_loans (
  id bigserial primary key,
  company_id uuid not null,
  entity text,
  loan_type text,
  initial_principal numeric,
  current_balance numeric,
  interest_rate numeric, -- annual nominal %
  rate_type text default 'fixed', -- fixed | variable
  frequency text default 'monthly', -- monthly | quarterly | semiannual | annual | bullet
  start_date date,
  end_date date,
  guarantees text,
  created_at timestamptz not null default now()
);

create index if not exists idx_debt_loans_company on public.debt_loans(company_id);

alter table public.debt_loans enable row level security;

do $$ begin
  create policy "Admin can manage debt_loans"
  on public.debt_loans for all
  using (exists (select 1 from public.admins a where a.user_id = auth.uid()))
  with check (exists (select 1 from public.admins a where a.user_id = auth.uid()));
exception when duplicate_object then null; end $$;

-- Members can view debt_loans of companies they have access to
do $$ begin
  create policy "Members can view debt_loans"
  on public.debt_loans for select
  using (public.has_company_access(auth.uid(), company_id));
exception when duplicate_object then null; end $$;

create table if not exists public.debt_maturities (
  id bigserial primary key,
  company_id uuid not null,
  loan_id bigint not null references public.debt_loans(id) on delete cascade,
  due_date date not null,
  amount_principal numeric not null default 0,
  amount_interest numeric not null default 0,
  created_at timestamptz not null default now()
);

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

-- Members can view debt_maturities of companies they have access to
do $$ begin
  create policy "Members can view debt_maturities"
  on public.debt_maturities for select
  using (public.has_company_access(auth.uid(), company_id));
exception when duplicate_object then null; end $$;

commit;
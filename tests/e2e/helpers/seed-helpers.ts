import { createClient } from '@supabase/supabase-js';

// This helper seeds minimal company-scoped data for isolation tests when proper env vars are present.
// It’s safe to skip when not configured.

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY as string;

export function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function createTestCompanyData(companyId: string, userId?: string) {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn('Supabase not configured for seeding; skipping.');
    return { ok: false, reason: 'no-config' } as const;
  }

  try {
    // Insert minimal P&L line
    await supabase.from('fs_pyg_lines').insert([
      {
        company_id: companyId,
        period_date: '2024-12-31',
        period_year: 2024,
        amount: 100000,
        period_type: 'annual',
        section: 'RESULTADOS',
        concept: 'EBITDA',
        currency_code: 'EUR',
        uploaded_by: userId || null,
      },
    ]);

    // Insert minimal Balance line
    await supabase.from('fs_balance_lines').insert([
      {
        company_id: companyId,
        period_date: '2024-12-31',
        period_year: 2024,
        amount: 250000,
        period_type: 'annual',
        section: 'ACTIVO',
        concept: 'ASSETS_TOT',
        currency_code: 'EUR',
        uploaded_by: userId || null,
      },
    ]);

    // Insert minimal Cashflow line
    await supabase.from('fs_cashflow_lines').insert([
      {
        company_id: companyId,
        period_date: '2024-12-31',
        period_year: 2024,
        amount: 50000,
        period_type: 'annual',
        category: 'OPERATIVO',
        concept: 'FCO',
        currency_code: 'EUR',
        uploaded_by: userId || null,
      },
    ]);

    return { ok: true } as const;
  } catch (e) {
    console.warn('Seeding failed (likely RLS without admin privileges).', e);
    return { ok: false, reason: 'rls' } as const;
  }
}

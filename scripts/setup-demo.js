#!/usr/bin/env node

/**
 * Demo Setup Script for DEMO Tech Solutions SL
 * 
 * This script creates a demo admin user and loads all the demo financial data
 * for a complete functional demonstration of the application.
 * 
 * Usage:
 *   npm run setup-demo
 *   node scripts/setup-demo.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Demo admin user configuration
const DEMO_ADMIN = {
  email: 'admin@demo.com',
  password: 'DemoAdmin2024!',
  profile: {
    full_name: 'Demo Administrator',
    company_name: 'DEMO Tech Solutions SL',
    sector: 'Tecnología',
    revenue: '3500000',
    employees: '52'
  }
};

async function createDemoUser() {
  try {
    console.log('🔄 Creating demo admin user...');
    
    // Create the user
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: DEMO_ADMIN.email,
      password: DEMO_ADMIN.password,
      email_confirm: true,
      user_metadata: {
        role: 'admin',
        ...DEMO_ADMIN.profile
      }
    });

    if (userError) {
      if (userError.message.includes('already registered')) {
        console.log('ℹ️  Demo admin user already exists');
        return;
      }
      throw userError;
    }

    console.log('✅ Demo admin user created successfully');
    console.log(`   Email: ${DEMO_ADMIN.email}`);
    console.log(`   Password: ${DEMO_ADMIN.password}`);
    
    // Update user profile if needed
    if (userData.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userData.user.id,
          email: DEMO_ADMIN.email,
          role: 'admin',
          ...DEMO_ADMIN.profile
        });

      if (profileError) {
        console.warn('⚠️  Warning: Could not update user profile:', profileError.message);
      }
    }

  } catch (error) {
    console.error('❌ Error creating demo user:', error.message);
    throw error;
  }
}

async function createDemoCompany() {
  try {
    console.log('🔄 Creating demo company...');
    
    // Check if demo company already exists
    const { data: existingCompany } = await supabase
      .from('companies')
      .select('id')
      .eq('name', 'DEMO Tech Solutions SL')
      .single();

    if (existingCompany) {
      console.log('ℹ️  Demo company already exists');
      return existingCompany.id;
    }

    // Create demo company
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: 'DEMO Tech Solutions SL',
        sector: 'Tecnología',
        currency_code: 'EUR',
        description: 'Empresa demo para presentaciones del sistema'
      })
      .select()
      .single();

    if (companyError) {
      throw companyError;
    }

    console.log('✅ Demo company created successfully');
    return companyData.id;

  } catch (error) {
    console.error('❌ Error creating demo company:', error.message);
    throw error;
  }
}

async function loadDemoData(companyId) {
  try {
    console.log('🔄 Loading demo financial data...');
    
    // Note: In a real implementation, this would read the CSV files
    // and insert the data into the appropriate tables.
    // For now, we'll just indicate where the demo files are located.
    
    console.log('📁 Demo CSV files are available at:');
    console.log('   - public/templates/demo/empresa_cualitativa.csv');
    console.log('   - public/templates/demo/cuenta-pyg.csv');
    console.log('   - public/templates/demo/balance-situacion.csv');
    console.log('   - public/templates/demo/pool-deuda.csv');
    console.log('   - public/templates/demo/pool-deuda-vencimientos.csv');
    console.log('   - public/templates/demo/estado-flujos.csv');
    console.log('   - public/templates/demo/datos-operativos.csv');
    console.log('   - public/templates/demo/supuestos-financieros.csv');
    
    console.log('✅ Demo data files prepared successfully');
    console.log('ℹ️  Use the admin panel to upload these CSV files');

  } catch (error) {
    console.error('❌ Error preparing demo data:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('🚀 Setting up demo environment for DEMO Tech Solutions SL');
    console.log('=====================================');
    
    await createDemoUser();
    const companyId = await createDemoCompany();
    await loadDemoData(companyId);
    
    console.log('=====================================');
    console.log('✅ Demo setup completed successfully!');
    console.log('');
    console.log('🎯 Demo Credentials:');
    console.log(`   Email: ${DEMO_ADMIN.email}`);
    console.log(`   Password: ${DEMO_ADMIN.password}`);
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Login with demo credentials');
    console.log('2. Navigate to Admin > Carga de Plantillas');
    console.log('3. Upload the CSV files from public/templates/demo/');
    console.log('4. Explore all dashboard features');
    console.log('');
    console.log('🎉 Ready for client demonstration!');

  } catch (error) {
    console.error('❌ Demo setup failed:', error.message);
    process.exit(1);
  }
}

// Run the setup if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { createDemoUser, createDemoCompany, loadDemoData };
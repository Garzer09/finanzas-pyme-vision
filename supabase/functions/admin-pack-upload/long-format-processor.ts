// Long format processing functions for direct row-to-DB insertion

export async function processLongFormatFile(
  fileName: string, 
  headers: string[], 
  dataRows: any[][], 
  companyId: string, 
  currencyCode: string
) {
  const fileName_lower = fileName.toLowerCase();
  
  console.log(`Processing long format file: ${fileName}`);
  
  // Determine file type
  if (fileName_lower.includes('pyg') || fileName_lower.includes('perdidas') || fileName_lower.includes('ganancias')) {
    return await processLongPYGFile(headers, dataRows, companyId, currencyCode);
  } else if (fileName_lower.includes('balance')) {
    return await processLongBalanceFile(headers, dataRows, companyId, currencyCode);
  } else if (fileName_lower.includes('flujo') || fileName_lower.includes('cashflow')) {
    return await processLongCashFlowFile(headers, dataRows, companyId, currencyCode);
  } else {
    throw new Error(`Unsupported long format file type: ${fileName}`);
  }
}

export async function processWideFormatFile(
  fileName: string, 
  headers: string[], 
  dataRows: any[][], 
  selectedYears: number[], 
  companyId: string, 
  currencyCode: string
) {
  // Import existing wide format processors
  const { processPYGFile, processBalanceFile, processCashFlowFile, processDebtMaturityFile, processDebtPoolFile, processOperationalFile, processAssumptionsFile } = await import('./wide-format-processor.ts');
  
  const fileName_lower = fileName.toLowerCase();
  
  if (fileName_lower.includes('pyg') || fileName_lower.includes('perdidas') || fileName_lower.includes('ganancias')) {
    return await processPYGFile(headers, dataRows, selectedYears, companyId, currencyCode);
  } else if (fileName_lower.includes('balance')) {
    return await processBalanceFile(headers, dataRows, selectedYears, companyId, currencyCode);
  } else if (fileName_lower.includes('flujo') || fileName_lower.includes('cashflow')) {
    return await processCashFlowFile(headers, dataRows, selectedYears, companyId, currencyCode);
  } else if (fileName_lower.includes('deuda') && fileName_lower.includes('vencimiento')) {
    return await processDebtMaturityFile(headers, dataRows, companyId, currencyCode);
  } else if (fileName_lower.includes('deuda') || fileName_lower.includes('pool')) {
    return await processDebtPoolFile(headers, dataRows, companyId, currencyCode);
  } else if (fileName_lower.includes('operativo') || fileName_lower.includes('fisico')) {
    return await processOperationalFile(headers, dataRows, selectedYears, companyId);
  } else if (fileName_lower.includes('supuesto') || fileName_lower.includes('assumption')) {
    return await processAssumptionsFile(headers, dataRows, selectedYears, companyId);
  } else {
    throw new Error(`Unknown wide format file type: ${fileName}`);
  }
}

// Long format P&G processor
async function processLongPYGFile(headers: string[], dataRows: any[][], companyId: string, currencyCode: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // Find column indices
  const conceptIdx = findColumnIndex(headers, ['concepto', 'concept']);
  const periodIdx = findColumnIndex(headers, ['periodo', 'period', 'fecha', 'date']);
  const yearIdx = findColumnIndex(headers, ['año', 'year', 'anio']);
  const amountIdx = findColumnIndex(headers, ['importe', 'amount', 'valor', 'value']);
  
  if (conceptIdx === -1 || periodIdx === -1 || yearIdx === -1 || amountIdx === -1) {
    throw new Error('Required columns not found in P&G file');
  }
  
  const processedRows = [];
  const errors = [];
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    
    try {
      const concept = row[conceptIdx]?.toString().trim();
      const periodStr = row[periodIdx]?.toString().trim();
      const yearStr = row[yearIdx]?.toString().trim();
      const amountStr = row[amountIdx]?.toString().trim();
      
      if (!concept || !periodStr || !yearStr) {
        continue; // Skip empty rows
      }
      
      const year = parseInt(yearStr);
      const amount = parseFloat(amountStr) || 0;
      const periodDate = new Date(periodStr).toISOString().split('T')[0];
      
      // Determine period type based on date
      const date = new Date(periodStr);
      const month = date.getMonth() + 1;
      const quarter = Math.ceil(month / 3);
      
      const rowData = {
        company_id: companyId,
        concept: concept,
        period_date: periodDate,
        period_year: year,
        period_month: month,
        period_quarter: quarter,
        period_type: 'monthly', // Can be enhanced to detect annual/quarterly
        amount: amount,
        currency_code: currencyCode,
        uploaded_by: null, // Will be set by RLS
        job_id: null,
        created_at: new Date().toISOString()
      };
      
      processedRows.push(rowData);
      
    } catch (error) {
      errors.push(`Row ${i + 2}: ${error.message}`);
    }
  }
  
  // Insert into database
  if (processedRows.length > 0) {
    const { error } = await supabase
      .from('fs_pyg_lines')
      .insert(processedRows);
    
    if (error) {
      console.error('Error inserting P&G data:', error);
      throw new Error(`Database insertion failed: ${error.message}`);
    }
  }
  
  return {
    processed: processedRows.length,
    errors: errors,
    table: 'fs_pyg_lines'
  };
}

// Long format Balance processor
async function processLongBalanceFile(headers: string[], dataRows: any[][], companyId: string, currencyCode: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // Find column indices
  const conceptIdx = findColumnIndex(headers, ['concepto', 'concept']);
  const sectionIdx = findColumnIndex(headers, ['seccion', 'section']);
  const periodIdx = findColumnIndex(headers, ['periodo', 'period', 'fecha', 'date']);
  const yearIdx = findColumnIndex(headers, ['año', 'year', 'anio']);
  const amountIdx = findColumnIndex(headers, ['importe', 'amount', 'valor', 'value']);
  
  if (conceptIdx === -1 || periodIdx === -1 || yearIdx === -1 || amountIdx === -1) {
    throw new Error('Required columns not found in Balance file');
  }
  
  const processedRows = [];
  const errors = [];
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    
    try {
      const concept = row[conceptIdx]?.toString().trim();
      const section = sectionIdx !== -1 ? row[sectionIdx]?.toString().trim() : '';
      const periodStr = row[periodIdx]?.toString().trim();
      const yearStr = row[yearIdx]?.toString().trim();
      const amountStr = row[amountIdx]?.toString().trim();
      
      if (!concept || !periodStr || !yearStr) {
        continue; // Skip empty rows
      }
      
      const year = parseInt(yearStr);
      const amount = parseFloat(amountStr) || 0;
      const periodDate = new Date(periodStr).toISOString().split('T')[0];
      
      // Determine period type based on date
      const date = new Date(periodStr);
      const month = date.getMonth() + 1;
      const quarter = Math.ceil(month / 3);
      
      const rowData = {
        company_id: companyId,
        concept: concept,
        section: section,
        period_date: periodDate,
        period_year: year,
        period_month: month,
        period_quarter: quarter,
        period_type: 'monthly',
        amount: amount,
        currency_code: currencyCode,
        uploaded_by: null,
        job_id: null,
        created_at: new Date().toISOString()
      };
      
      processedRows.push(rowData);
      
    } catch (error) {
      errors.push(`Row ${i + 2}: ${error.message}`);
    }
  }
  
  // Insert into database
  if (processedRows.length > 0) {
    const { error } = await supabase
      .from('fs_balance_lines')
      .insert(processedRows);
    
    if (error) {
      console.error('Error inserting Balance data:', error);
      throw new Error(`Database insertion failed: ${error.message}`);
    }
  }
  
  return {
    processed: processedRows.length,
    errors: errors,
    table: 'fs_balance_lines'
  };
}

// Long format Cash Flow processor
async function processLongCashFlowFile(headers: string[], dataRows: any[][], companyId: string, currencyCode: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
  
  // Find column indices
  const conceptIdx = findColumnIndex(headers, ['concepto', 'concept']);
  const categoryIdx = findColumnIndex(headers, ['categoria', 'category']);
  const periodIdx = findColumnIndex(headers, ['periodo', 'period', 'fecha', 'date']);
  const yearIdx = findColumnIndex(headers, ['año', 'year', 'anio']);
  const amountIdx = findColumnIndex(headers, ['importe', 'amount', 'valor', 'value']);
  
  if (conceptIdx === -1 || periodIdx === -1 || yearIdx === -1 || amountIdx === -1) {
    throw new Error('Required columns not found in Cash Flow file');
  }
  
  const processedRows = [];
  const errors = [];
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    
    try {
      const concept = row[conceptIdx]?.toString().trim();
      const category = categoryIdx !== -1 ? row[categoryIdx]?.toString().trim() : '';
      const periodStr = row[periodIdx]?.toString().trim();
      const yearStr = row[yearIdx]?.toString().trim();
      const amountStr = row[amountIdx]?.toString().trim();
      
      if (!concept || !periodStr || !yearStr) {
        continue; // Skip empty rows
      }
      
      const year = parseInt(yearStr);
      const amount = parseFloat(amountStr) || 0;
      const periodDate = new Date(periodStr).toISOString().split('T')[0];
      
      // Determine period type based on date
      const date = new Date(periodStr);
      const month = date.getMonth() + 1;
      const quarter = Math.ceil(month / 3);
      
      const rowData = {
        company_id: companyId,
        concept: concept,
        category: category,
        period_date: periodDate,
        period_year: year,
        period_month: month,
        period_quarter: quarter,
        period_type: 'monthly',
        amount: amount,
        currency_code: currencyCode,
        uploaded_by: null,
        job_id: null,
        created_at: new Date().toISOString()
      };
      
      processedRows.push(rowData);
      
    } catch (error) {
      errors.push(`Row ${i + 2}: ${error.message}`);
    }
  }
  
  // Insert into database
  if (processedRows.length > 0) {
    const { error } = await supabase
      .from('fs_cashflow_lines')
      .insert(processedRows);
    
    if (error) {
      console.error('Error inserting Cash Flow data:', error);
      throw new Error(`Database insertion failed: ${error.message}`);
    }
  }
  
  return {
    processed: processedRows.length,
    errors: errors,
    table: 'fs_cashflow_lines'
  };
}

// Helper function to find column index
function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h.toLowerCase().includes(name.toLowerCase()));
    if (index !== -1) return index;
  }
  return -1;
}

// Import createClient for database operations
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
// Utility functions for data processing and analysis

export const getLatestData = (data: any[], dateField: string = 'date') => {
  if (!data || data.length === 0) return null;
  
  // Sort by date field and return the latest entry
  return data.sort((a, b) => new Date(b[dateField]).getTime() - new Date(a[dateField]).getTime())[0];
};

export const formatCurrency = (value: number, currency: string = 'CLP') => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const calculatePercentageChange = (current: number, previous: number) => {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
};
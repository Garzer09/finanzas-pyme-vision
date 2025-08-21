// Utility function to get period comparison data
export const getPeriodComparison = (currentPeriod: any, previousPeriod: any) => {
  if (!currentPeriod || !previousPeriod) {
    return {
      change: 0,
      percentage: 0,
      trend: 'neutral' as const
    };
  }

  const current = Number(currentPeriod) || 0;
  const previous = Number(previousPeriod) || 0;
  
  if (previous === 0) {
    return {
      change: current,
      percentage: current > 0 ? 100 : 0,
      trend: current > 0 ? 'up' : current < 0 ? 'down' : 'neutral' as const
    };
  }

  const change = current - previous;
  const percentage = (change / Math.abs(previous)) * 100;

  return {
    change,
    percentage: Math.abs(percentage),
    trend: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral' as const
  };
};